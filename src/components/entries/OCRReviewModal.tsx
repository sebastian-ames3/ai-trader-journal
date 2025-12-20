'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  AlertTriangle,
  Edit2,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
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
import TradeLinkSuggestions, { LinkSuggestion } from './TradeLinkSuggestions';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface OCRResult {
  content: string;
  date: string | null;
  tickers: string[];
  mood: string | null;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

interface OCRReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ocrResult: OCRResult;
  imageUrl: string;
  linkSuggestions: LinkSuggestion[];
  warnings?: string[];
  onSave: (data: {
    content: string;
    date: string | null;
    ticker: string | null;
    mood: string | null;
    thesisTradeId: string | null;
    ocrConfidence: number;
  }) => Promise<void>;
  onRetry?: () => void;
}

const MOOD_OPTIONS = [
  { value: 'CONFIDENT', label: 'Confident' },
  { value: 'NERVOUS', label: 'Nervous' },
  { value: 'EXCITED', label: 'Excited' },
  { value: 'UNCERTAIN', label: 'Uncertain' },
  { value: 'NEUTRAL', label: 'Neutral' },
];

export default function OCRReviewModal({
  isOpen,
  onClose,
  ocrResult,
  imageUrl: _imageUrl, // Reserved for future image preview feature
  linkSuggestions,
  warnings = [],
  onSave,
  onRetry,
}: OCRReviewModalProps) {
  void _imageUrl; // Suppress unused variable warning
  // Editable state
  const [content, setContent] = useState(ocrResult.content);
  const [selectedDate, setSelectedDate] = useState<string | null>(ocrResult.date);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(
    ocrResult.tickers[0] || null
  );
  const [selectedMood, setSelectedMood] = useState<string | null>(ocrResult.mood);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null); // Debug status
  const [showLinkSuggestions, setShowLinkSuggestions] = useState(
    linkSuggestions.length > 0
  );

  // Reset state when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setContent(ocrResult.content);
      setSelectedDate(ocrResult.date);
      setSelectedTicker(ocrResult.tickers[0] || null);
      setSelectedMood(ocrResult.mood);
      setSelectedTradeId(null);
      setIsEditing(false);
      setSaveError(null);
      setSaveStatus(null);
      setShowLinkSuggestions(linkSuggestions.length > 0);
    }
  }, [isOpen, ocrResult, linkSuggestions.length]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveStatus('Step 1: Starting save...');

    // Debug: Check if onSave is actually a function
    if (typeof onSave !== 'function') {
      setSaveError('Internal error: Save function not available. Please close and try again.');
      setSaveStatus('Error: onSave is not a function');
      setIsSaving(false);
      return;
    }

    setSaveStatus('Step 2: onSave is a function, preparing data...');

    try {
      const saveData = {
        content,
        date: selectedDate,
        ticker: selectedTicker,
        mood: selectedMood,
        thesisTradeId: selectedTradeId,
        ocrConfidence: ocrResult.confidence,
      };

      setSaveStatus('Step 3: Calling onSave...');

      // Call onSave and wait for it
      await onSave(saveData);

      setSaveStatus('Step 4: onSave completed successfully!');

      // If we get here without error, onSave completed
      onClose();
    } catch (error: unknown) {
      console.error('Failed to save entry:', error);
      // Ensure we always show an error message
      let errorMessage = 'Failed to save entry. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as { message: unknown }).message);
      }
      setSaveStatus(`Error caught: ${errorMessage}`);
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLink = (tradeId: string) => {
    setSelectedTradeId(tradeId);
    setShowLinkSuggestions(false);
  };

  const handleDismissLink = () => {
    setSelectedTradeId(null);
    setShowLinkSuggestions(false);
  };

  if (!isOpen) return null;

  const isLowConfidence = ocrResult.confidence < 0.7;
  const isVeryLowConfidence = ocrResult.confidence < 0.5;

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
        aria-labelledby="ocr-review-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 id="ocr-review-title" className="text-lg font-semibold">
              Review Scanned Entry
            </h2>
          </div>
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
          {/* Confidence indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  isVeryLowConfidence
                    ? 'destructive'
                    : isLowConfidence
                      ? 'secondary'
                      : 'default'
                }
                className="gap-1"
              >
                <Sparkles className="h-3 w-3" />
                {Math.round(ocrResult.confidence * 100)}% confidence
              </Badge>
              {ocrResult.tickers.length > 0 && (
                <div className="flex gap-1">
                  {ocrResult.tickers.map((ticker) => (
                    <Badge key={ticker} variant="outline" className="text-xs">
                      {ticker}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {onRetry && isLowConfidence && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetry}
                className="gap-1 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
                Retake
              </Button>
            )}
          </div>

          {/* Warnings */}
          {(warnings.length > 0 || isLowConfidence) && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="flex-1 space-y-1">
                  {isVeryLowConfidence && (
                    <p className="text-sm text-yellow-700 font-medium">
                      Handwriting unclear. Please review carefully.
                    </p>
                  )}
                  {warnings.map((warning, idx) => (
                    <p key={idx} className="text-xs text-yellow-600">
                      {warning}
                    </p>
                  ))}
                  {isLowConfidence && (
                    <p className="text-xs text-yellow-600">
                      Tips: Ensure good lighting and hold camera steady
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </Label>
            </div>
            <div className="flex items-center gap-2">
              {selectedDate ? (
                <Badge variant="secondary" className="gap-1">
                  {format(new Date(selectedDate), 'MMM d, yyyy')}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-yellow-600">
                  <AlertTriangle className="h-3 w-3" />
                  No date detected
                </Badge>
              )}
              <input
                type="date"
                value={selectedDate ? selectedDate.split('T')[0] : ''}
                onChange={(e) =>
                  setSelectedDate(
                    e.target.value ? new Date(e.target.value).toISOString() : null
                  )
                }
                className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(new Date().toISOString())}
                className="text-xs h-8"
              >
                Today
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Content</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="gap-1 text-xs h-7"
              >
                {isEditing ? (
                  <>
                    <Check className="h-3 w-3" />
                    Done
                  </>
                ) : (
                  <>
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </>
                )}
              </Button>
            </div>
            {isEditing ? (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px] text-sm"
                autoFocus
              />
            ) : (
              <div className="p-3 rounded-lg bg-muted/50 min-h-[100px] max-h-[200px] overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{content}</p>
              </div>
            )}
          </div>

          {/* Mood */}
          <div className="space-y-2">
            <Label className="text-sm">Mood</Label>
            <Select
              value={selectedMood || 'NEUTRAL'}
              onValueChange={setSelectedMood}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select mood" />
              </SelectTrigger>
              <SelectContent>
                {MOOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Link suggestions */}
          {showLinkSuggestions && linkSuggestions.length > 0 && (
            <TradeLinkSuggestions
              suggestions={linkSuggestions}
              onLink={handleLink}
              onDismiss={handleDismissLink}
              mode="modal"
            />
          )}

          {/* Selected link indicator */}
          {selectedTradeId && !showLinkSuggestions && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  Linked to{' '}
                  {linkSuggestions.find((s) => s.tradeId === selectedTradeId)
                    ?.description || 'trade'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLinkSuggestions(true)}
                className="text-xs h-7"
              >
                Change
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t space-y-3">
          {/* Debug status - shows save progress */}
          {saveStatus && (
            <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-600 font-mono">{saveStatus}</p>
            </div>
          )}
          {saveError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{saveError}</p>
              </div>
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={!content.trim() || isSaving}
            className="w-full h-12 text-base gap-2"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Save Entry
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
