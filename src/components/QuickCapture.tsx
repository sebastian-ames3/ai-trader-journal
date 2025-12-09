'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Send, Loader2, Mic, Camera, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import VoiceRecorder from './VoiceRecorder';
import AudioPlayer from './AudioPlayer';
import ImageCapture, { ImageAnalysis } from './ImageCapture';
import { cn } from '@/lib/utils';

interface QuickCaptureProps {
  isOpen: boolean;
  onClose: () => void;
}

interface InferredMetadata {
  entryType: 'TRADE_IDEA' | 'TRADE' | 'REFLECTION' | 'OBSERVATION';
  mood: 'CONFIDENT' | 'NERVOUS' | 'EXCITED' | 'UNCERTAIN' | 'NEUTRAL';
  conviction: 'LOW' | 'MEDIUM' | 'HIGH';
  ticker: string | null;
  sentiment: 'positive' | 'negative' | 'neutral';
}

type SubmitState = 'idle' | 'inferring' | 'submitting' | 'success' | 'error';

const ENTRY_TYPE_LABELS: Record<string, string> = {
  TRADE_IDEA: 'Trade Idea',
  TRADE: 'Trade',
  REFLECTION: 'Reflection',
  OBSERVATION: 'Observation',
};

const MOOD_LABELS: Record<string, string> = {
  CONFIDENT: 'Confident',
  NERVOUS: 'Nervous',
  EXCITED: 'Excited',
  UNCERTAIN: 'Uncertain',
  NEUTRAL: 'Neutral',
};

const CONVICTION_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

// Also export as named export for flexibility
export function QuickCapture({ isOpen, onClose }: QuickCaptureProps) {
  const router = useRouter();

  // Form state
  const [content, setContent] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);

  // Image state
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageAnalyses, setImageAnalyses] = useState<(ImageAnalysis | null)[]>([]);

  // Inferred metadata
  const [inferred, setInferred] = useState<InferredMetadata | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Override values (user can modify inferred values)
  const [entryType, setEntryType] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [conviction, setConviction] = useState<string | null>(null);
  const [ticker, setTicker] = useState<string | null>(null);

  // UI state
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showVoice, setShowVoice] = useState(false);
  const [showImage, setShowImage] = useState(false);

  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      // Delay reset to allow animation
      const timer = setTimeout(() => {
        setContent('');
        setAudioBlob(null);
        setAudioUrl(null);
        setAudioDuration(null);
        setTranscription(null);
        setImageUrls([]);
        setImageAnalyses([]);
        setInferred(null);
        setShowDetails(false);
        setEntryType(null);
        setMood(null);
        setConviction(null);
        setTicker(null);
        setSubmitState('idle');
        setError(null);
        setShowVoice(false);
        setShowImage(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle voice recording complete
  const handleRecordingComplete = useCallback(
    (data: { audioBlob: Blob; duration: number; transcription: string }) => {
      setAudioBlob(data.audioBlob);
      setAudioUrl(URL.createObjectURL(data.audioBlob));
      setAudioDuration(data.duration);
      setTranscription(data.transcription);
      // Append transcription to content
      setContent((prev) => {
        if (prev.trim()) {
          return `${prev}\n\n${data.transcription}`;
        }
        return data.transcription;
      });
      setShowVoice(false);
    },
    []
  );

  // Handle image capture complete
  const handleImageCapture = useCallback(
    (data: { imageUrl: string; analysis: ImageAnalysis | null }) => {
      setImageUrls((prev) => [...prev, data.imageUrl]);
      setImageAnalyses((prev) => [...prev, data.analysis]);

      // If analysis extracted a ticker and we don't have one, use it
      if (data.analysis?.ticker && !ticker && !inferred?.ticker) {
        setTicker(data.analysis.ticker);
      }

      // Append analysis summary to content
      if (data.analysis?.summary) {
        setContent((prev) => {
          if (prev.trim()) {
            return `${prev}\n\n[Image: ${data.analysis!.summary}]`;
          }
          return `[Image: ${data.analysis!.summary}]`;
        });
      }

      setShowImage(false);
    },
    [ticker, inferred?.ticker]
  );

  // Remove an image
  const removeImage = useCallback((index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    setImageAnalyses((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Auto-infer metadata when content changes
  const inferMetadata = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 10) {
      setInferred(null);
      return;
    }

    try {
      setSubmitState('inferring');
      const response = await fetch('/api/infer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });

      if (!response.ok) {
        throw new Error('Failed to infer metadata');
      }

      const data: InferredMetadata = await response.json();
      setInferred(data);
      setSubmitState('idle');
    } catch (err) {
      console.error('Inference error:', err);
      setSubmitState('idle');
      // Don't show error - inference is optional
    }
  }, []);

  // Debounced inference on content change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim().length >= 10) {
        inferMetadata(content);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, inferMetadata]);

  // Get effective values (override or inferred)
  const effectiveType = entryType || inferred?.entryType || 'OBSERVATION';
  const effectiveMood = mood || inferred?.mood || 'NEUTRAL';
  const effectiveConviction = conviction || inferred?.conviction || 'MEDIUM';
  const effectiveTicker = ticker !== null ? ticker : inferred?.ticker;

  // Submit entry
  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Please enter some content');
      return;
    }

    setSubmitState('submitting');
    setError(null);

    try {
      // Upload audio if present
      let uploadedAudioUrl: string | undefined;
      if (audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        if (audioDuration) {
          formData.append('duration', audioDuration.toString());
        }

        const uploadResponse = await fetch('/api/upload/audio', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          uploadedAudioUrl = uploadData.url;
        }
      }

      // Determine capture method
      let captureMethod = 'QUICK_CAPTURE';
      if (audioBlob) {
        captureMethod = 'VOICE';
      } else if (imageUrls.length > 0) {
        captureMethod = 'SCREENSHOT';
      }

      // Create the entry
      const entryData = {
        content: content.trim(),
        type: effectiveType,
        mood: effectiveMood,
        conviction: effectiveConviction,
        ticker: effectiveTicker || undefined,
        audioUrl: uploadedAudioUrl,
        audioDuration: audioDuration || undefined,
        transcription: transcription || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        imageAnalyses: imageAnalyses.filter(Boolean).length > 0 ? imageAnalyses : undefined,
        captureMethod,
      };

      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create entry');
      }

      setSubmitState('success');

      // Close and redirect
      setTimeout(() => {
        onClose();
        router.push('/journal');
        router.refresh();
      }, 500);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save entry');
      setSubmitState('error');
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-lg bg-background rounded-t-2xl sm:rounded-2xl shadow-xl',
          'max-h-[90vh] overflow-hidden flex flex-col',
          'animate-in slide-in-from-bottom duration-300'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-capture-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="quick-capture-title" className="text-lg font-semibold">
            Quick Capture
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Main textarea */}
          <div className="space-y-2">
            <Label htmlFor="quick-content" className="sr-only">
              What&apos;s on your mind?
            </Label>
            <Textarea
              id="quick-content"
              placeholder="What's on your mind? Just start typing..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none text-base"
              autoFocus
            />
          </div>

          {/* Voice recorder */}
          {showVoice && (
            <div className="flex justify-center py-4">
              <VoiceRecorder
                onRecordingComplete={handleRecordingComplete}
                onError={(err) => setError(err)}
              />
            </div>
          )}

          {/* Audio player (if recording exists) */}
          {audioUrl && !showVoice && (
            <AudioPlayer src={audioUrl} duration={audioDuration || undefined} />
          )}

          {/* Image capture */}
          {showImage && (
            <div className="flex justify-center py-4">
              <ImageCapture
                onImageCapture={handleImageCapture}
                onError={(err) => setError(err)}
                maxImages={5}
              />
            </div>
          )}

          {/* Image previews */}
          {imageUrls.length > 0 && !showImage && (
            <div className="flex flex-wrap gap-2">
              {imageUrls.map((url, index) => (
                <div key={url} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Screenshot ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {imageAnalyses[index] && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 rounded-b-lg truncate">
                      {imageAnalyses[index]?.ticker || 'Analyzed'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={showVoice ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setShowVoice(!showVoice);
                setShowImage(false);
              }}
              className="gap-2"
            >
              <Mic className="h-4 w-4" />
              Voice
            </Button>

            <Button
              type="button"
              variant={showImage ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setShowImage(!showImage);
                setShowVoice(false);
              }}
              className="gap-2"
              disabled={imageUrls.length >= 5}
            >
              <Camera className="h-4 w-4" />
              Photo {imageUrls.length > 0 && `(${imageUrls.length})`}
            </Button>

            <div className="flex-1" />

            {/* Inference indicator */}
            {submitState === 'inferring' && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3 animate-pulse" />
                Analyzing...
              </Badge>
            )}

            {inferred && submitState !== 'inferring' && (
              <Badge variant="outline" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Auto-detected
              </Badge>
            )}
          </div>

          {/* Inferred/editable metadata */}
          {(inferred || showDetails) && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {showDetails ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {showDetails ? 'Hide' : 'Show'} details
              </button>

              {showDetails && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Entry Type */}
                  <div className="space-y-1">
                    <Label htmlFor="entry-type" className="text-xs">
                      Type
                    </Label>
                    <Select
                      value={effectiveType}
                      onValueChange={setEntryType}
                    >
                      <SelectTrigger id="entry-type" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ENTRY_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Mood */}
                  <div className="space-y-1">
                    <Label htmlFor="mood" className="text-xs">
                      Mood
                    </Label>
                    <Select value={effectiveMood} onValueChange={setMood}>
                      <SelectTrigger id="mood" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(MOOD_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conviction */}
                  <div className="space-y-1">
                    <Label htmlFor="conviction" className="text-xs">
                      Conviction
                    </Label>
                    <Select
                      value={effectiveConviction}
                      onValueChange={setConviction}
                    >
                      <SelectTrigger id="conviction" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CONVICTION_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ticker */}
                  <div className="space-y-1">
                    <Label htmlFor="ticker" className="text-xs">
                      Ticker
                    </Label>
                    <input
                      id="ticker"
                      type="text"
                      value={effectiveTicker || ''}
                      onChange={(e) => setTicker(e.target.value.toUpperCase())}
                      placeholder="e.g., AAPL"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      maxLength={5}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={
              !content.trim() ||
              submitState === 'submitting' ||
              submitState === 'success'
            }
            className="w-full h-12 text-base gap-2"
          >
            {submitState === 'submitting' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : submitState === 'success' ? (
              <>
                Saved!
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Save Entry
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Default export for backward compatibility
export default QuickCapture;
