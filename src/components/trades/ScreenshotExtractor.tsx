'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Pencil,
  RefreshCw,
  ImageIcon,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface ExtractedTradeData {
  ticker?: string;
  strategyType?: string;
  strikes?: string;
  expiration?: string;
  quantity?: number;
  debitCredit?: number;
  action?: string;
}

interface ExtractedField {
  value: string | number | undefined;
  confidence: number;
  source: 'extracted' | 'edited';
}

interface ExtractionResult {
  ticker: ExtractedField;
  strategyType: ExtractedField;
  strikes: ExtractedField;
  expiration: ExtractedField;
  quantity: ExtractedField;
  debitCredit: ExtractedField;
  action: ExtractedField;
}

interface ScreenshotExtractorProps {
  imageFile: File | null;
  imageUrl?: string;
  onExtractComplete: (data: ExtractedTradeData) => void;
  onRemove?: () => void;
  className?: string;
}

const STRATEGY_TYPES = [
  { value: 'LONG_CALL', label: 'Long Call' },
  { value: 'LONG_PUT', label: 'Long Put' },
  { value: 'SHORT_CALL', label: 'Short Call' },
  { value: 'SHORT_PUT', label: 'Short Put' },
  { value: 'CALL_SPREAD', label: 'Call Spread' },
  { value: 'PUT_SPREAD', label: 'Put Spread' },
  { value: 'IRON_CONDOR', label: 'Iron Condor' },
  { value: 'IRON_BUTTERFLY', label: 'Iron Butterfly' },
  { value: 'STRADDLE', label: 'Straddle' },
  { value: 'STRANGLE', label: 'Strangle' },
  { value: 'CALENDAR', label: 'Calendar' },
  { value: 'DIAGONAL', label: 'Diagonal' },
  { value: 'BUTTERFLY', label: 'Butterfly' },
  { value: 'STOCK', label: 'Stock' },
  { value: 'COVERED_CALL', label: 'Covered Call' },
  { value: 'CASH_SECURED_PUT', label: 'Cash Secured Put' },
];

const ACTION_TYPES = [
  { value: 'INITIAL', label: 'Initial Position' },
  { value: 'ADD', label: 'Add to Position' },
  { value: 'REDUCE', label: 'Reduce' },
  { value: 'ROLL', label: 'Roll' },
  { value: 'CLOSE', label: 'Close' },
];

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
  if (confidence >= 0.5) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getConfidenceBadge(confidence: number): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
} {
  if (confidence >= 0.8) return { label: 'High', variant: 'default' };
  if (confidence >= 0.5) return { label: 'Medium', variant: 'secondary' };
  return { label: 'Low', variant: 'destructive' };
}

export default function ScreenshotExtractor({
  imageFile,
  imageUrl,
  onExtractComplete,
  onRemove,
  className,
}: ScreenshotExtractorProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Create preview URL from file
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (imageUrl) {
      setPreviewUrl(imageUrl);
    }
  }, [imageFile, imageUrl]);

  // Extract data from screenshot using Claude vision API
  const extractData = useCallback(async () => {
    if (!imageFile && !imageUrl) return;

    setIsExtracting(true);
    setExtractionError(null);

    try {
      // Convert image to base64 if it's a file
      let base64Image: string | null = null;
      if (imageFile) {
        base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
      }

      const response = await fetch('/api/trades/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: base64Image,
          attachmentUrl: imageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract data from screenshot');
      }

      const responseData = await response.json();

      // API returns { success: true, data: {...}, processingTimeMs }
      const extracted = responseData.data || responseData;
      const overallConfidence = extracted.confidence ?? 0.5;

      // Format strikes array as string for display
      const strikesString = extracted.strikes?.length > 0
        ? extracted.strikes.map((s: { strike: number; type: string; action: string }) =>
            `${s.action} ${s.strike} ${s.type}`
          ).join(' / ')
        : undefined;

      // Convert response to extraction result with confidence scores
      const result: ExtractionResult = {
        ticker: {
          value: extracted.ticker,
          confidence: overallConfidence,
          source: 'extracted',
        },
        strategyType: {
          value: extracted.strategyType,
          confidence: overallConfidence,
          source: 'extracted',
        },
        strikes: {
          value: strikesString,
          confidence: overallConfidence,
          source: 'extracted',
        },
        expiration: {
          value: extracted.expiration,
          confidence: overallConfidence,
          source: 'extracted',
        },
        quantity: {
          value: extracted.quantity,
          confidence: overallConfidence,
          source: 'extracted',
        },
        debitCredit: {
          value: extracted.premium,
          confidence: overallConfidence,
          source: 'extracted',
        },
        action: {
          value: extracted.premiumType === 'DEBIT' ? 'INITIAL' : 'INITIAL',
          confidence: overallConfidence,
          source: 'extracted',
        },
      };

      setExtractionResult(result);

      // Send extracted data to parent
      onExtractComplete({
        ticker: result.ticker.value as string,
        strategyType: result.strategyType.value as string,
        strikes: result.strikes.value as string,
        expiration: result.expiration.value as string,
        quantity: result.quantity.value as number,
        debitCredit: result.debitCredit.value as number,
        action: result.action.value as string,
      });
    } catch (error) {
      console.error('Error extracting screenshot data:', error);
      setExtractionError(
        error instanceof Error ? error.message : 'Failed to extract data from screenshot'
      );
    } finally {
      setIsExtracting(false);
    }
  }, [imageFile, imageUrl, onExtractComplete]);

  // Auto-extract on mount if we have an image
  useEffect(() => {
    if ((imageFile || imageUrl) && !extractionResult && !isExtracting) {
      extractData();
    }
  }, [imageFile, imageUrl, extractionResult, isExtracting, extractData]);

  // Update field value
  const updateField = (field: keyof ExtractionResult, value: string | number) => {
    if (!extractionResult) return;

    const updatedResult = {
      ...extractionResult,
      [field]: {
        value,
        confidence: 1.0,
        source: 'edited' as const,
      },
    };
    setExtractionResult(updatedResult);
    setEditingField(null);

    // Send updated data to parent
    onExtractComplete({
      ticker: updatedResult.ticker.value as string,
      strategyType: updatedResult.strategyType.value as string,
      strikes: updatedResult.strikes.value as string,
      expiration: updatedResult.expiration.value as string,
      quantity: updatedResult.quantity.value as number,
      debitCredit: updatedResult.debitCredit.value as number,
      action: updatedResult.action.value as string,
    });
  };

  if (!previewUrl) {
    return null;
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Screenshot Extraction
          </CardTitle>
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8"
              aria-label="Remove screenshot"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-4">
        {/* Image Preview */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
          <Image
            src={previewUrl}
            alt="Trade screenshot"
            fill
            className="object-contain"
          />
        </div>

        {/* Loading State */}
        {isExtracting && (
          <div className="flex items-center justify-center gap-2 py-4 text-slate-500 dark:text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Analyzing screenshot...</span>
          </div>
        )}

        {/* Error State */}
        {extractionError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Extraction failed</p>
              <p className="text-xs">{extractionError}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={extractData}
              className="flex-shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {/* Extracted Fields */}
        {extractionResult && !isExtracting && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Data extracted - review and edit if needed
              </span>
            </div>

            {/* Ticker Field */}
            <ExtractedFieldRow
              label="Ticker"
              field={extractionResult.ticker}
              isEditing={editingField === 'ticker'}
              onStartEdit={() => setEditingField('ticker')}
              onSave={(value) => updateField('ticker', value)}
              onCancel={() => setEditingField(null)}
            />

            {/* Strategy Type Field */}
            <div className="flex items-center gap-2">
              <Label className="w-24 text-sm text-slate-500 dark:text-slate-400">
                Strategy
              </Label>
              <div className="flex-1">
                {editingField === 'strategyType' ? (
                  <Select
                    value={extractionResult.strategyType.value as string || ''}
                    onValueChange={(value) => updateField('strategyType', value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      {STRATEGY_TYPES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {extractionResult.strategyType.value
                        ? STRATEGY_TYPES.find(s => s.value === extractionResult.strategyType.value)?.label || extractionResult.strategyType.value
                        : '-'}
                    </span>
                    <ConfidenceIndicator
                      confidence={extractionResult.strategyType.confidence}
                      source={extractionResult.strategyType.source}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingField('strategyType')}
                      aria-label="Edit strategy"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Strikes Field */}
            <ExtractedFieldRow
              label="Strikes"
              field={extractionResult.strikes}
              isEditing={editingField === 'strikes'}
              onStartEdit={() => setEditingField('strikes')}
              onSave={(value) => updateField('strikes', value)}
              onCancel={() => setEditingField(null)}
            />

            {/* Expiration Field */}
            <ExtractedFieldRow
              label="Expiration"
              field={extractionResult.expiration}
              isEditing={editingField === 'expiration'}
              onStartEdit={() => setEditingField('expiration')}
              onSave={(value) => updateField('expiration', value)}
              onCancel={() => setEditingField(null)}
              type="date"
            />

            {/* Quantity Field */}
            <ExtractedFieldRow
              label="Quantity"
              field={extractionResult.quantity}
              isEditing={editingField === 'quantity'}
              onStartEdit={() => setEditingField('quantity')}
              onSave={(value) => updateField('quantity', parseInt(value as string, 10) || 1)}
              onCancel={() => setEditingField(null)}
              type="number"
            />

            {/* Debit/Credit Field */}
            <ExtractedFieldRow
              label="Debit/Credit"
              field={extractionResult.debitCredit}
              isEditing={editingField === 'debitCredit'}
              onStartEdit={() => setEditingField('debitCredit')}
              onSave={(value) => updateField('debitCredit', parseFloat(value as string) || 0)}
              onCancel={() => setEditingField(null)}
              type="number"
              step="0.01"
              prefix="$"
            />

            {/* Action Field */}
            <div className="flex items-center gap-2">
              <Label className="w-24 text-sm text-slate-500 dark:text-slate-400">
                Action
              </Label>
              <div className="flex-1">
                {editingField === 'action' ? (
                  <Select
                    value={extractionResult.action.value as string || ''}
                    onValueChange={(value) => updateField('action', value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((a) => (
                        <SelectItem key={a.value} value={a.value}>
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {extractionResult.action.value
                        ? ACTION_TYPES.find(a => a.value === extractionResult.action.value)?.label || extractionResult.action.value
                        : '-'}
                    </span>
                    <ConfidenceIndicator
                      confidence={extractionResult.action.confidence}
                      source={extractionResult.action.source}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingField('action')}
                      aria-label="Edit action"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ExtractedFieldRowProps {
  label: string;
  field: ExtractedField;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (value: string | number) => void;
  onCancel: () => void;
  type?: 'text' | 'number' | 'date';
  step?: string;
  prefix?: string;
}

function ExtractedFieldRow({
  label,
  field,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  type = 'text',
  step,
  prefix,
}: ExtractedFieldRowProps) {
  const [localValue, setLocalValue] = useState(field.value?.toString() || '');

  useEffect(() => {
    setLocalValue(field.value?.toString() || '');
  }, [field.value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(localValue);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Label className="w-24 text-sm text-slate-500 dark:text-slate-400">
        {label}
      </Label>
      <div className="flex-1">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              type={type}
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onKeyDown={handleKeyDown}
              step={step}
              className="h-9"
              autoFocus
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSave(localValue)}
              className="h-8"
            >
              Save
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {prefix && field.value !== undefined ? prefix : ''}
              {field.value !== undefined ? field.value : '-'}
            </span>
            <ConfidenceIndicator confidence={field.confidence} source={field.source} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onStartEdit}
              aria-label={`Edit ${label}`}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ConfidenceIndicatorProps {
  confidence: number;
  source: 'extracted' | 'edited';
}

function ConfidenceIndicator({ confidence, source }: ConfidenceIndicatorProps) {
  if (source === 'edited') {
    return (
      <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
        Edited
      </Badge>
    );
  }

  const { label, variant } = getConfidenceBadge(confidence);
  return (
    <Badge variant={variant} className={cn('text-xs', getConfidenceColor(confidence))}>
      {label}
    </Badge>
  );
}
