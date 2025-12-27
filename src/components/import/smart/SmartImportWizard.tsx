'use client';

import { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileSpreadsheet,
  Check,
  X,
  ChevronLeft,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Link2,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useRef } from 'react';
import {
  useSmartImportStore,
  selectCurrentTrade,
  selectProgress,
  selectIsReviewComplete,
  type ParsedTrade,
  type ImportSummary,
} from '@/stores/smartImportStore';
import TradeReviewCard from './TradeReviewCard';
import TradeLinkingPanel from './TradeLinkingPanel';

// ============================================
// Types
// ============================================

interface SmartImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (result: { imported: number; thesesCreated: number }) => void;
}

// ============================================
// Step Components
// ============================================

function FileUploadStep() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    file,
    fileName,
    isUploading,
    uploadError,
    setFile,
    startUpload,
    uploadSuccess,
    setUploadError,
  } = useSmartImportStore();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.csv')) {
        setUploadError('Please drop a CSV file');
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    startUpload();

    try {
      const csvContent = await file.text();

      const response = await fetch('/api/import/csv/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent }),
      });

      const result = await response.json();

      if (!result.success) {
        setUploadError(result.error || result.errors?.join(', ') || 'Failed to parse CSV');
        return;
      }

      // Transform trades to match our store format
      const trades: ParsedTrade[] = result.data.trades.map((t: Record<string, unknown>) => ({
        id: t.id as string,
        ticker: t.symbol as string,
        strategyType: t.strategyType,
        strategyDisplay: t.strategyName as string,
        openedAt: t.date as string,
        closedAt: t.status === 'closed' ? t.date : undefined,
        debitCredit: 0,
        realizedPL: t.realizedPL as number | null,
        status: ((t.status as string) === 'closed' ? 'CLOSED' : 'OPEN') as 'OPEN' | 'CLOSED',
        legs: t.legs as string | undefined,
        isValid: t.isValid as boolean,
        isDuplicate: t.isDuplicate as boolean,
        warnings: (t.warnings as string[]) || [],
        rawData: t,
      }));

      const summary: ImportSummary = result.data.summary;

      uploadSuccess(result.batchId, trades, summary);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Upload your OptionStrat CSV export file to import trades.
      </p>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer',
          'hover:border-primary/50 hover:bg-primary/5 transition-colors',
          file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        {file || fileName ? (
          <div className="flex flex-col items-center gap-2">
            <FileSpreadsheet className="h-10 w-10 text-primary" />
            <p className="font-medium">{file?.name || fileName}</p>
            {file && (
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Drop CSV file here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <p className="text-sm text-destructive">{uploadError}</p>
          </div>
        </div>
      )}

      {/* CSV format info */}
      <div className="p-3 rounded-lg bg-muted/50">
        <p className="text-xs text-muted-foreground mb-2">Expected CSV format:</p>
        <code className="text-xs block p-2 bg-background rounded border overflow-x-auto">
          Date,Symbol,Strategy,Legs,P/L,Status
        </code>
      </div>

      <Button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full gap-2"
      >
        {isUploading ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Parsing...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Upload & Parse
          </>
        )}
      </Button>
    </div>
  );
}

function TradeReviewStep() {
  const {
    trades,
    currentReviewIndex,
    reviewHistory,
    approveTrade,
    skipTrade,
    undoLast,
    setStep,
    setSuggestionsLoading,
    setSuggestions,
  } = useSmartImportStore();

  const currentTrade = useSmartImportStore(selectCurrentTrade);
  const progress = useSmartImportStore(selectProgress);
  const isComplete = useSmartImportStore(selectIsReviewComplete);

  const validTrades = trades.filter((t) => t.isValid && !t.isDuplicate);

  // Fetch suggestions when review is complete
  const handleContinue = useCallback(async () => {
    setSuggestionsLoading(true);
    setStep('link');

    try {
      const approvedTrades = useSmartImportStore.getState().getApprovedTrades();

      const response = await fetch('/api/import/smart/suggest-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trades: approvedTrades.map((t) => ({
            id: t.id,
            ticker: t.ticker,
            strategyType: t.strategyType,
            openedAt: t.openedAt,
            closedAt: t.closedAt,
            debitCredit: t.debitCredit,
            realizedPL: t.realizedPL,
            status: t.status,
            legs: t.legs,
          })),
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.suggestions) {
        setSuggestions(result.data.suggestions);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [setStep, setSuggestionsLoading, setSuggestions]);

  if (!currentTrade && !isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No valid trades to review</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Review Progress
          </span>
          <span className="font-medium">
            {progress.completed} / {progress.total}
          </span>
        </div>
        <Progress value={progress.percentage} className="h-2" />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-4">
        <Badge variant="default" className="gap-1">
          <Check className="h-3 w-3" />
          {useSmartImportStore.getState().approvedCount} approved
        </Badge>
        <Badge variant="secondary" className="gap-1">
          <X className="h-3 w-3" />
          {useSmartImportStore.getState().skippedCount} skipped
        </Badge>
      </div>

      {/* Card or Complete message */}
      {isComplete ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-8 text-center"
        >
          <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Review Complete!</h3>
          <p className="text-muted-foreground mb-6">
            You&apos;ve reviewed all {validTrades.length} trades.
            <br />
            {useSmartImportStore.getState().approvedCount} approved,{' '}
            {useSmartImportStore.getState().skippedCount} skipped.
          </p>
          <Button onClick={handleContinue} className="gap-2">
            Continue to Linking
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          {currentTrade && (
            <TradeReviewCard
              key={currentTrade.id}
              trade={currentTrade}
              position={currentReviewIndex + 1}
              total={validTrades.length}
              onApprove={approveTrade}
              onSkip={skipTrade}
              onUndo={undoLast}
              canUndo={reviewHistory.length > 0}
            />
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

function TradeLinkingStep() {
  const {
    linkGroups,
    suggestions,
    suggestionsLoading,
    acceptSuggestion,
    dismissSuggestion,
    createLinkGroup,
    updateLinkGroup,
    deleteLinkGroup,
    addTradeToGroup,
    removeTradeFromGroup,
    setStep,
    getApprovedTrades,
  } = useSmartImportStore();

  const approvedTrades = getApprovedTrades();

  return (
    <TradeLinkingPanel
      approvedTrades={approvedTrades}
      linkGroups={linkGroups}
      suggestions={suggestions}
      suggestionsLoading={suggestionsLoading}
      onAcceptSuggestion={acceptSuggestion}
      onDismissSuggestion={dismissSuggestion}
      onCreateGroup={createLinkGroup}
      onUpdateGroup={updateLinkGroup}
      onDeleteGroup={deleteLinkGroup}
      onAddTradeToGroup={addTradeToGroup}
      onRemoveTradeFromGroup={removeTradeFromGroup}
      onSkip={() => setStep('confirm')}
      onContinue={() => setStep('confirm')}
    />
  );
}

function ConfirmStep({ onConfirm }: { onConfirm: () => void }) {
  const {
    batchId,
    linkGroups,
    decisions,
    isConfirming,
    confirmError,
    getApprovedTrades,
    startConfirm,
    confirmSuccess,
    setConfirmError,
    goBack,
  } = useSmartImportStore();

  const approvedTrades = getApprovedTrades();
  const linkedCount = linkGroups.reduce((sum, g) => sum + g.tradeIds.length, 0);
  const unlinkedCount = approvedTrades.length - linkedCount;

  const handleConfirm = async () => {
    if (!batchId) return;

    startConfirm();

    try {
      // Build request payload
      const tradeDecisions = Array.from(decisions.entries())
        .filter(([, d]) => d.action === 'approve')
        .map(([tradeId, decision]) => ({
          tradeId,
          action: decision.action,
          edits: decision.edits,
          notes: decision.notes,
          linkedGroupId: decision.linkedGroupId,
          tradeAction: decision.tradeAction,
        }));

      const response = await fetch('/api/import/smart/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          decisions: tradeDecisions,
          linkGroups: linkGroups.map((g) => ({
            name: g.name,
            ticker: g.ticker,
            direction: g.direction,
            tradeIds: g.tradeIds,
            existingThesisId: g.existingThesisId,
          })),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setConfirmError(result.error || 'Import failed');
        return;
      }

      confirmSuccess(result.data);
      onConfirm();
    } catch (error) {
      setConfirmError(error instanceof Error ? error.message : 'Import failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border">
        <div className="text-center mb-4">
          <p className="text-4xl font-bold text-primary">{approvedTrades.length}</p>
          <p className="text-sm text-muted-foreground">trades to import</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xl font-semibold">{linkGroups.length}</p>
            <p className="text-xs text-muted-foreground">link groups</p>
          </div>
          <div>
            <p className="text-xl font-semibold">{unlinkedCount}</p>
            <p className="text-xs text-muted-foreground">standalone trades</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Import Summary</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li className="flex items-center gap-2">
            <Check className="h-3 w-3 text-green-600" />
            {approvedTrades.length} trades will be imported
          </li>
          {linkGroups.length > 0 && (
            <li className="flex items-center gap-2">
              <Link2 className="h-3 w-3 text-primary" />
              {linkGroups.length} theses will be created
            </li>
          )}
          {unlinkedCount > 0 && (
            <li className="flex items-center gap-2">
              <Eye className="h-3 w-3" />
              {unlinkedCount} trades will be imported without thesis
            </li>
          )}
        </ul>
      </div>

      {confirmError && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <p className="text-sm text-destructive">{confirmError}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={goBack} disabled={isConfirming}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isConfirming || approvedTrades.length === 0}
          className="flex-1 gap-2"
        >
          {isConfirming ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Import {approvedTrades.length} Trades
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function CompleteStep({ onClose }: { onClose: () => void }) {
  const { importResult, reset } = useSmartImportStore();

  if (!importResult) return null;

  const handleImportMore = () => {
    reset();
  };

  return (
    <div className="space-y-6 text-center py-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex justify-center"
      >
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
      </motion.div>

      <div>
        <h3 className="text-xl font-semibold mb-1">Import Complete!</h3>
        <p className="text-muted-foreground">
          Successfully imported {importResult.imported} trades
        </p>
      </div>

      <div className="flex justify-center gap-6">
        <div className="text-center">
          <p className="text-3xl font-bold text-green-600">{importResult.imported}</p>
          <p className="text-xs text-muted-foreground">Imported</p>
        </div>
        {importResult.thesesCreated > 0 && (
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{importResult.thesesCreated}</p>
            <p className="text-xs text-muted-foreground">Theses</p>
          </div>
        )}
        {importResult.skipped > 0 && (
          <div className="text-center">
            <p className="text-3xl font-bold text-muted-foreground">{importResult.skipped}</p>
            <p className="text-xs text-muted-foreground">Skipped</p>
          </div>
        )}
      </div>

      {importResult.errors && importResult.errors.length > 0 && (
        <div className="text-left p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm font-medium text-destructive mb-1">
            {importResult.errors.length} errors:
          </p>
          <ul className="text-xs text-destructive space-y-0.5">
            {importResult.errors.slice(0, 5).map((err, idx) => (
              <li key={idx}>{err.error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={handleImportMore}>
          Import More
        </Button>
        <Button onClick={onClose} className="flex-1 gap-2">
          <Check className="h-4 w-4" />
          Done
        </Button>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function SmartImportWizard({
  isOpen,
  onClose,
  onComplete,
}: SmartImportWizardProps) {
  const { currentStep, reset, importResult } = useSmartImportStore();

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      // Don't reset immediately to allow for animations
    }
  }, [isOpen]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleComplete = () => {
    if (importResult) {
      onComplete?.({
        imported: importResult.imported,
        thesesCreated: importResult.thesesCreated,
      });
    }
  };

  if (!isOpen) return null;

  const stepLabels = ['Upload', 'Review', 'Link', 'Confirm'];
  const stepOrder = ['upload', 'review', 'link', 'confirm'] as const;
  const currentStepIndex = stepOrder.indexOf(currentStep as typeof stepOrder[number]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={cn(
          'relative w-full max-w-lg bg-background rounded-t-2xl sm:rounded-2xl shadow-xl',
          'max-h-[90vh] overflow-hidden flex flex-col'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Smart Import</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Step indicator */}
        {currentStep !== 'complete' && (
          <div className="flex items-center justify-center gap-2 py-3 border-b bg-muted/30">
            {stepLabels.map((label, idx) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                    idx === currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : idx < currentStepIndex
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {idx < currentStepIndex ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    idx + 1
                  )}
                </div>
                {idx < stepLabels.length - 1 && (
                  <div
                    className={cn(
                      'w-8 h-0.5',
                      idx < currentStepIndex ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {currentStep === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <FileUploadStep />
              </motion.div>
            )}

            {currentStep === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <TradeReviewStep />
              </motion.div>
            )}

            {currentStep === 'link' && (
              <motion.div
                key="link"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <TradeLinkingStep />
              </motion.div>
            )}

            {currentStep === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ConfirmStep onConfirm={handleComplete} />
              </motion.div>
            )}

            {currentStep === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <CompleteStep onClose={handleClose} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
