'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onRecordingComplete: (data: {
    audioBlob: Blob;
    duration: number;
    transcription: string;
  }) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'error';

export default function VoiceRecorder({
  onRecordingComplete,
  onError,
  disabled = false,
  className,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Store callbacks in refs to avoid closure issues
  const onRecordingCompleteRef = useRef(onRecordingComplete);
  const onErrorRef = useRef(onError);

  // Update refs when props change
  useEffect(() => {
    onRecordingCompleteRef.current = onRecordingComplete;
    onErrorRef.current = onError;
  }, [onRecordingComplete, onError]);

  // Maximum recording duration: 5 minutes
  const MAX_DURATION = 300;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Process the recording (upload and transcribe)
  const processRecording = useCallback(async (audioBlob: Blob, recordingDuration: number) => {
    setState('processing');

    try {
      // Create form data for transcription
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('duration', recordingDuration.toString());

      // Call transcription API
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Transcription failed');
      }

      const { text } = await response.json();

      // Success - call the callback
      onRecordingCompleteRef.current({
        audioBlob,
        duration: recordingDuration,
        transcription: text,
      });

      setState('idle');
      setDuration(0);
    } catch (err) {
      console.error('Processing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process recording';
      setError(errorMessage);
      setState('error');
      onErrorRef.current?.(errorMessage);
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000, // Whisper optimal sample rate
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;

      // Determine best audio format for browser
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 64000, // Good quality at small file size
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Create audio blob
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        const finalDuration = Math.round((Date.now() - startTimeRef.current) / 1000);

        // Process the recording
        await processRecording(audioBlob, finalDuration);
      };

      mediaRecorder.onerror = () => {
        setError('Recording error occurred');
        setState('error');
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setState('recording');

      // Start duration timer
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          // Auto-stop at max duration
          if (newDuration >= MAX_DURATION) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);

      let errorMessage = 'Failed to access microphone';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Microphone permission denied. Please allow access.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone.';
        }
      }

      setError(errorMessage);
      setState('error');
      onErrorRef.current?.(errorMessage);
    }
  }, [processRecording, stopRecording]);

  // Handle button click
  const handleClick = () => {
    if (state === 'recording') {
      stopRecording();
    } else if (state === 'idle' || state === 'error') {
      startRecording();
    }
  };

  // Render based on state
  const renderContent = () => {
    switch (state) {
      case 'idle':
        return (
          <>
            <Mic className="h-6 w-6" />
            <span className="sr-only">Start recording</span>
          </>
        );

      case 'recording':
        return (
          <>
            <Square className="h-5 w-5 fill-current" />
            <span className="ml-2 font-mono text-sm">
              {formatDuration(duration)}
            </span>
          </>
        );

      case 'processing':
        return (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="ml-2 text-sm">Transcribing...</span>
          </>
        );

      case 'error':
        return (
          <>
            <AlertCircle className="h-5 w-5" />
            <span className="ml-2 text-sm">Retry</span>
          </>
        );
    }
  };

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <Button
        type="button"
        variant={state === 'recording' ? 'destructive' : state === 'error' ? 'outline' : 'secondary'}
        size="lg"
        onClick={handleClick}
        disabled={disabled || state === 'processing'}
        className={cn(
          'h-14 min-w-[120px] transition-all',
          state === 'recording' && 'animate-pulse'
        )}
        aria-label={
          state === 'recording'
            ? 'Stop recording'
            : state === 'processing'
            ? 'Processing'
            : 'Start recording'
        }
      >
        {renderContent()}
      </Button>

      {error && state === 'error' && (
        <p className="text-sm text-destructive text-center max-w-[250px]">
          {error}
        </p>
      )}

      {state === 'recording' && (
        <p className="text-xs text-muted-foreground">
          Tap to stop (max {MAX_DURATION / 60} min)
        </p>
      )}
    </div>
  );
}
