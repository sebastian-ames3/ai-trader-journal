'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Loader2, Edit2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import AudioPlayer from '@/components/AudioPlayer';
import { cn } from '@/lib/utils';
import type { TradeDetectionResult } from '@/lib/tradeDetection';
import type { TradeOutcome } from '@/lib/constants/taxonomy';

interface EntryAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  aiTags: string[];
  mood: string;
}

interface VoiceCapturePreviewProps {
  transcription: string;
  entryAnalysis?: EntryAnalysis;
  tradeDetection: TradeDetectionResult;
  audioUrl?: string;
  audioDuration?: number;
  onSaveBoth: (options: {
    transcription: string;
    tradeOutcome?: TradeOutcome;
  }) => Promise<void>;
  onSaveEntryOnly: (transcription: string) => Promise<void>;
  onEdit: () => void;
  onCancel: () => void;
}

/**
 * Preview component for combined voice entry + trade capture.
 * Shows transcription, detected entry analysis, and trade detection together.
 */
export function VoiceCapturePreview({
  transcription,
  entryAnalysis,
  tradeDetection,
  audioUrl,
  audioDuration,
  onSaveBoth,
  onSaveEntryOnly,
  onCancel,
}: VoiceCapturePreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranscription, setEditedTranscription] = useState(transcription);
  const [selectedOutcome, setSelectedOutcome] = useState<TradeOutcome | null>(
    tradeDetection.signals.outcome
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signals } = tradeDetection;

  const handleSaveBoth = async () => {
    if (!selectedOutcome) {
      setError('Please select a trade outcome');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSaveBoth({
        transcription: editedTranscription,
        tradeOutcome: selectedOutcome,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setIsSaving(false);
    }
  };

  const handleSaveEntryOnly = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await onSaveEntryOnly(editedTranscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setIsSaving(false);
    }
  };

  return (
    <div
      className="space-y-4"
      role="region"
      aria-label="Voice capture preview"
      data-testid="voice-capture-preview"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Entry + Trade Captured</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          disabled={isSaving}
          aria-label="Cancel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Audio player */}
      {audioUrl && (
        <div className="p-3 rounded-lg bg-muted/50">
          <AudioPlayer src={audioUrl} duration={audioDuration} />
        </div>
      )}

      {/* Journal Entry Section */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center gap-2">
            <span className="text-lg">📝</span>
            Journal Entry
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="h-8"
          >
            <Edit2 className="h-3 w-3 mr-1" />
            {isEditing ? 'Done' : 'Edit'}
          </Button>
        </div>

        {isEditing ? (
          <Textarea
            value={editedTranscription}
            onChange={(e) => setEditedTranscription(e.target.value)}
            className="min-h-[100px]"
            autoFocus
          />
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            &ldquo;{editedTranscription}&rdquo;
          </p>
        )}

        {/* Entry analysis tags */}
        {entryAnalysis && (
          <div className="flex flex-wrap gap-2">
            {entryAnalysis.mood && (
              <Badge variant="outline" className="text-xs">
                {entryAnalysis.mood}
              </Badge>
            )}
            {entryAnalysis.aiTags?.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Trade Detection Section */}
      {tradeDetection.detected && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <span className="text-lg">📊</span>
            Trade Detected
          </h4>

          <div className="flex items-center gap-2 text-sm">
            {signals.ticker && (
              <Badge variant="outline" className="font-mono">
                {signals.ticker}
              </Badge>
            )}
            {signals.action && (
              <span className="text-muted-foreground">
                {signals.action.charAt(0) + signals.action.slice(1).toLowerCase()}
              </span>
            )}
            {signals.approximatePnL !== null && (
              <span
                className={cn(
                  'font-medium',
                  signals.approximatePnL >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                )}
              >
                {signals.approximatePnL >= 0 ? '+' : ''}${Math.abs(signals.approximatePnL)}
              </span>
            )}
          </div>

          {/* Outcome selection */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Confirm outcome:</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={selectedOutcome === 'WIN' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-10',
                  selectedOutcome === 'WIN' && 'bg-green-600 hover:bg-green-700'
                )}
                onClick={() => setSelectedOutcome('WIN')}
                disabled={isSaving}
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Win
              </Button>

              <Button
                type="button"
                variant={selectedOutcome === 'LOSS' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-10',
                  selectedOutcome === 'LOSS' && 'bg-red-600 hover:bg-red-700'
                )}
                onClick={() => setSelectedOutcome('LOSS')}
                disabled={isSaving}
              >
                <TrendingDown className="h-4 w-4 mr-1" />
                Loss
              </Button>

              <Button
                type="button"
                variant={selectedOutcome === 'BREAKEVEN' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-10',
                  selectedOutcome === 'BREAKEVEN' && 'bg-gray-600 hover:bg-gray-700'
                )}
                onClick={() => setSelectedOutcome('BREAKEVEN')}
                disabled={isSaving}
              >
                <Minus className="h-4 w-4 mr-1" />
                Even
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        {tradeDetection.detected && (
          <Button
            onClick={handleSaveBoth}
            disabled={isSaving || !selectedOutcome}
            className="h-12"
            data-testid="save-both-button"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Both'
            )}
          </Button>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 h-10"
          >
            Cancel
          </Button>

          <Button
            variant={tradeDetection.detected ? 'outline' : 'default'}
            onClick={handleSaveEntryOnly}
            disabled={isSaving}
            className="flex-1 h-10"
          >
            {tradeDetection.detected ? 'Skip Trade' : 'Save Entry'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default VoiceCapturePreview;
