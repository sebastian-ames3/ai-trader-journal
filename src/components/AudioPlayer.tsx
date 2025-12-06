'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  src: string;
  duration?: number;
  className?: string;
}

export default function AudioPlayer({
  src,
  duration: initialDuration,
  className,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.onerror = () => {
      setIsLoading(false);
      console.error('Error loading audio');
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [src]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Toggle mute
  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Seek to position
  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg bg-muted/50 p-3',
        className
      )}
    >
      {/* Play/Pause Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={togglePlay}
        disabled={isLoading}
        className="h-10 w-10 shrink-0"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </Button>

      {/* Progress Slider */}
      <div className="flex flex-1 items-center gap-2">
        <span className="text-xs text-muted-foreground font-mono w-10">
          {formatTime(currentTime)}
        </span>

        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          disabled={isLoading}
          className="flex-1"
          aria-label="Audio progress"
        />

        <span className="text-xs text-muted-foreground font-mono w-10">
          {formatTime(duration)}
        </span>
      </div>

      {/* Mute Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggleMute}
        disabled={isLoading}
        className="h-8 w-8 shrink-0"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
