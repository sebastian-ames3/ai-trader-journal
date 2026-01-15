'use client';

import { useState, useRef, useCallback, ChangeEvent } from 'react';
import { Camera, Upload, X, Loader2, Image as ImageIcon, ScanText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ImageCaptureMode = 'chart' | 'journal' | 'screenshot';

export interface OCRResult {
  content: string;
  date: string | null;
  tickers: string[];
  mood: string | null;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

interface ImageCaptureProps {
  onImageCapture: (data: {
    imageUrl: string;
    analysis: ImageAnalysis | null;
  }) => void;
  onJournalScan?: (data: {
    imageUrl: string;
    ocrResult: OCRResult;
    warnings?: string[];
  }) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  maxImages?: number;
  mode?: ImageCaptureMode;
}

export interface ImageAnalysis {
  ticker?: string;
  chartType?: string;
  timeframe?: string;
  patterns?: string[];
  indicators?: string[];
  keyLevels?: {
    support?: number;
    resistance?: number;
  };
  summary: string;
}

type CaptureState = 'idle' | 'capturing' | 'uploading' | 'analyzing' | 'scanning' | 'error';

export default function ImageCapture({
  onImageCapture,
  onJournalScan,
  onError,
  disabled = false,
  className,
  mode = 'chart',
}: ImageCaptureProps) {
  const [state, setState] = useState<CaptureState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Process selected file
  const processFile = useCallback(
    async (file: File) => {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        const errorMsg = 'Invalid image type. Please use JPEG, PNG, WebP, or GIF.';
        setError(errorMsg);
        setState('error');
        onError?.(errorMsg);
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        const errorMsg = 'Image too large. Maximum size is 5MB.';
        setError(errorMsg);
        setState('error');
        onError?.(errorMsg);
        return;
      }

      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      try {
        // Upload to R2 storage
        setState('uploading');

        const formData = new FormData();
        formData.append('image', file);

        const uploadResponse = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const data = await uploadResponse.json();
          throw new Error(data.error || 'Failed to upload image');
        }

        const { url } = await uploadResponse.json();

        // Handle different modes
        if (mode === 'journal' && onJournalScan) {
          // Journal mode - use OCR API
          setState('scanning');

          const ocrResponse = await fetch('/api/journal/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: url }),
          });

          if (!ocrResponse.ok) {
            const data = await ocrResponse.json();
            // Log debug info for troubleshooting
            if (data.debug) {
              console.error('[ImageCapture] OCR failed with debug info:', data.debug);
            }
            throw new Error(data.error || 'Failed to scan journal page');
          }

          const ocrData = await ocrResponse.json();

          // Success - call the journal callback
          onJournalScan({
            imageUrl: url,
            ocrResult: ocrData.data,
            warnings: ocrData.warnings,
          });
        } else {
          // Chart/screenshot mode - use image analysis API
          setState('analyzing');

          const analyzeResponse = await fetch('/api/analyze/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: url }),
          });

          let analysis: ImageAnalysis | null = null;
          if (analyzeResponse.ok) {
            analysis = await analyzeResponse.json();
          }

          // Success - call the callback
          onImageCapture({
            imageUrl: url,
            analysis,
          });
        }

        setState('idle');
        setPreviewUrl(null);
        setError(null);
      } catch (err) {
        console.error('Image processing error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to process image';
        setError(errorMsg);
        setState('error');
        onError?.(errorMsg);
      }
    },
    [onImageCapture, onJournalScan, onError, mode]
  );

  // Handle file input change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input for re-selection of same file
    e.target.value = '';
  };

  // Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Open camera
  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  // Cancel/clear current operation
  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setState('idle');
    setError(null);
  };

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle paste from clipboard
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    },
    [processFile]
  );

  // Set up paste listener
  useState(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  });

  // Get loading message based on state and mode
  const getLoadingMessage = () => {
    if (state === 'uploading') return 'Uploading...';
    if (state === 'scanning') return 'Reading handwriting...';
    if (state === 'analyzing') return 'Analyzing image...';
    return 'Processing...';
  };

  // Render based on state
  if (state === 'uploading' || state === 'analyzing' || state === 'scanning') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        {previewUrl && (
          <div className="relative w-full max-w-[200px] aspect-video rounded-lg overflow-hidden">
            {/* Using native img for blob URL preview - Next/Image requires explicit dimensions and doesn't support blob URLs */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center flex-col gap-2">
              {mode === 'journal' ? (
                <ScanText className="h-8 w-8 animate-pulse text-white" />
              ) : (
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              )}
            </div>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {getLoadingMessage()}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn('flex flex-col items-center gap-3', className)}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload image"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Take photo"
      />

      {/* Preview with cancel button */}
      {previewUrl && state === 'error' && (
        <div className="relative w-full max-w-[200px] aspect-video rounded-lg overflow-hidden">
          {/* Using native img for blob URL preview - Next/Image requires explicit dimensions and doesn't support blob URLs */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={handleCancel}
            aria-label="Cancel image"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openCamera}
          disabled={disabled}
          className="gap-2"
        >
          <Camera className="h-4 w-4" />
          Camera
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openFilePicker}
          disabled={disabled}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>

      {/* Drop zone hint */}
      <p className="text-xs text-muted-foreground text-center">
        <ImageIcon className="inline h-3 w-3 mr-1" />
        Or drag & drop / paste from clipboard
      </p>

      {/* Error message */}
      {error && state === 'error' && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-xs"
          >
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
