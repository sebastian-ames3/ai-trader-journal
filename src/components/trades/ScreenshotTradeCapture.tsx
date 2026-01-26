'use client';

import { useState, useRef, useCallback, ChangeEvent } from 'react';
import {
  Camera,
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  Minus,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ExtractedTradeData } from '@/lib/tradeExtraction';
import type { TradeOutcome } from '@/lib/constants/taxonomy';

interface ScreenshotTradeCaptureProps {
  onTradeCreated?: (trade: { id: string; ticker: string }) => void;
  onCancel?: () => void;
  className?: string;
}

type CaptureState =
  | 'idle'
  | 'uploading'
  | 'extracting'
  | 'preview'
  | 'saving'
  | 'success'
  | 'error';

/**
 * Screenshot-first trade capture component.
 * Uses AI extraction to parse trading screenshots and create trades.
 */
export function ScreenshotTradeCapture({
  onTradeCreated,
  onCancel,
  className,
}: ScreenshotTradeCaptureProps) {
  // State
  const [state, setState] = useState<CaptureState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedTradeData | null>(null);

  // Editable fields (user can override extracted values)
  const [ticker, setTicker] = useState('');
  const [outcome, setOutcome] = useState<TradeOutcome | null>(null);
  const [pnl, setPnl] = useState<string>('');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Process selected file
  const processFile = useCallback(async (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid image type. Please use JPEG, PNG, WebP, or GIF.');
      setState('error');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image too large. Maximum size is 5MB.');
      setState('error');
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setError(null);

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
      setUploadedUrl(url);

      // Extract trade data
      setState('extracting');

      const extractResponse = await fetch('/api/trades/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url }),
      });

      if (!extractResponse.ok) {
        const data = await extractResponse.json();
        throw new Error(data.error || 'Failed to extract trade data');
      }

      const extractResult = await extractResponse.json();

      if (!extractResult.success || !extractResult.data) {
        throw new Error(extractResult.error || 'No trade data extracted');
      }

      const data = extractResult.data as ExtractedTradeData;
      setExtractedData(data);

      // Pre-fill editable fields from extraction
      if (data.ticker) setTicker(data.ticker);
      if (data.outcome) setOutcome(data.outcome);
      if (data.netPnL !== undefined) setPnl(data.netPnL.toString());

      setState('preview');
    } catch (err) {
      console.error('Image processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process image');
      setState('error');
    }
  }, []);

  // Handle file input change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
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

  // Reset to idle state
  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setUploadedUrl(null);
    setExtractedData(null);
    setTicker('');
    setOutcome(null);
    setPnl('');
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

  // Save trade
  const handleSaveTrade = async () => {
    if (!ticker.trim()) {
      setError('Ticker is required');
      return;
    }
    if (!outcome) {
      setError('Please select an outcome');
      return;
    }

    setError(null);
    setState('saving');

    try {
      const pnlValue = pnl ? parseFloat(pnl) : undefined;

      const response = await fetch('/api/trades/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: ticker.toUpperCase().trim(),
          outcome,
          approximatePnL: pnlValue,
          sourceType: 'SCREENSHOT',
          screenshotUrl: uploadedUrl,
          extractedData: extractedData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create trade');
      }

      const data = await response.json();
      setState('success');

      // Call success callback
      setTimeout(() => {
        onTradeCreated?.({ id: data.trade.id, ticker: data.trade.ticker });
      }, 500);
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save trade');
      setState('error');
    }
  };

  // Render idle state - capture interface
  if (state === 'idle' || state === 'error') {
    return (
      <div
        className={cn('flex flex-col items-center gap-4', className)}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        data-testid="screenshot-trade-capture"
      >
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload screenshot"
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

        {/* Instructions */}
        <div className="text-center space-y-2">
          <h3 className="font-medium">Screenshot Trade Capture</h3>
          <p className="text-sm text-muted-foreground">
            Take a photo or upload a screenshot of your trade position or P/L
          </p>
        </div>

        {/* Error preview */}
        {state === 'error' && previewUrl && (
          <div className="relative w-full max-w-[200px] aspect-video rounded-lg overflow-hidden">
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
              onClick={handleReset}
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={openCamera}
            className="gap-2 h-12 px-6"
          >
            <Camera className="h-5 w-5" />
            Camera
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={openFilePicker}
            className="gap-2 h-12 px-6"
          >
            <Upload className="h-5 w-5" />
            Upload
          </Button>
        </div>

        {/* Drop zone hint */}
        <p className="text-xs text-muted-foreground text-center">
          <ImageIcon className="inline h-3 w-3 mr-1" />
          Or drag & drop / paste from clipboard
        </p>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Cancel button */}
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} className="mt-2">
            Cancel
          </Button>
        )}
      </div>
    );
  }

  // Render uploading/extracting state
  if (state === 'uploading' || state === 'extracting') {
    return (
      <div className={cn('flex flex-col items-center gap-4', className)}>
        {previewUrl && (
          <div className="relative w-full max-w-[250px] aspect-video rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center flex-col gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
              <p className="text-white text-sm">
                {state === 'uploading' ? 'Uploading...' : 'Extracting trade data...'}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render preview/edit state
  if (state === 'preview' || state === 'saving') {
    return (
      <div
        className={cn('space-y-4', className)}
        data-testid="screenshot-trade-preview"
      >
        {/* Screenshot preview */}
        {previewUrl && (
          <div className="relative w-full max-w-[300px] mx-auto aspect-video rounded-lg overflow-hidden border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Trade screenshot"
              className="w-full h-full object-cover"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleReset}
              disabled={state === 'saving'}
            >
              <X className="h-3 w-3 mr-1" />
              Retake
            </Button>
          </div>
        )}

        {/* Extraction confidence */}
        {extractedData && (
          <div className="flex items-center justify-center gap-2">
            <Badge
              variant={extractedData.confidence > 0.7 ? 'default' : 'secondary'}
            >
              {Math.round(extractedData.confidence * 100)}% confidence
            </Badge>
            {extractedData.platform && (
              <Badge variant="outline">{extractedData.platform}</Badge>
            )}
          </div>
        )}

        {/* Editable trade fields */}
        <div className="space-y-4">
          {/* Ticker */}
          <div className="space-y-2">
            <Label htmlFor="ss-ticker">Ticker</Label>
            <Input
              id="ss-ticker"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="e.g., AAPL"
              maxLength={5}
              disabled={state === 'saving'}
              className="text-lg font-mono"
            />
          </div>

          {/* Outcome selection */}
          <div className="space-y-2">
            <Label>Outcome</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={outcome === 'WIN' ? 'default' : 'outline'}
                onClick={() => setOutcome('WIN')}
                disabled={state === 'saving'}
                className={cn(
                  'h-12',
                  outcome === 'WIN' && 'bg-green-600 hover:bg-green-700'
                )}
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Win
              </Button>

              <Button
                type="button"
                variant={outcome === 'LOSS' ? 'default' : 'outline'}
                onClick={() => setOutcome('LOSS')}
                disabled={state === 'saving'}
                className={cn(
                  'h-12',
                  outcome === 'LOSS' && 'bg-red-600 hover:bg-red-700'
                )}
              >
                <TrendingDown className="h-4 w-4 mr-1" />
                Loss
              </Button>

              <Button
                type="button"
                variant={outcome === 'BREAKEVEN' ? 'default' : 'outline'}
                onClick={() => setOutcome('BREAKEVEN')}
                disabled={state === 'saving'}
                className={cn(
                  'h-12',
                  outcome === 'BREAKEVEN' && 'bg-gray-600 hover:bg-gray-700'
                )}
              >
                <Minus className="h-4 w-4 mr-1" />
                Even
              </Button>
            </div>
          </div>

          {/* P/L (optional) */}
          <div className="space-y-2">
            <Label htmlFor="ss-pnl">P/L Amount (optional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="ss-pnl"
                type="number"
                value={pnl}
                onChange={(e) => setPnl(e.target.value)}
                placeholder="0.00"
                disabled={state === 'saving'}
                className="pl-7"
              />
            </div>
          </div>

          {/* Extracted details (read-only info) */}
          {extractedData && (
            <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
              {extractedData.strategyDescription && (
                <p>Strategy: {extractedData.strategyDescription}</p>
              )}
              {extractedData.expiration && (
                <p>Expiration: {extractedData.expiration}</p>
              )}
              {extractedData.premium && (
                <p>
                  Premium: ${extractedData.premium}{' '}
                  {extractedData.premiumType?.toLowerCase()}
                </p>
              )}
              {extractedData.underlyingPrice && (
                <p>Underlying: ${extractedData.underlyingPrice}</p>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel || handleReset}
            disabled={state === 'saving'}
            className="flex-1"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSaveTrade}
            disabled={state === 'saving' || !ticker.trim() || !outcome}
            className="flex-1"
          >
            {state === 'saving' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Trade
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  if (state === 'success') {
    return (
      <div className={cn('flex flex-col items-center gap-4 py-8', className)}>
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold">Trade Saved!</h3>
          <p className="text-sm text-muted-foreground">
            {ticker} trade has been recorded
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export default ScreenshotTradeCapture;
