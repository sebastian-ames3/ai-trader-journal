'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Link2,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { formatStrategyType } from '@/lib/csvImport';
import { StrategyType, ThesisDirection } from '@prisma/client';

// ============================================
// Persistence
// ============================================

const WIZARD_STORAGE_KEY = 'optionstrat-import-wizard';
const WIZARD_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface PersistedWizardState {
  currentStep: WizardStep;
  batchId: string | null;
  trades: ParsedTrade[];
  existingTheses: Record<string, ExistingThesis[]>;
  summary: UploadResponse['data']['summary'] | null;
  selections: Array<[string, TradeSelection]>;
  timestamp: number;
}

function loadPersistedState(): PersistedWizardState | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(WIZARD_STORAGE_KEY);
    if (!stored) return null;

    const parsed: PersistedWizardState = JSON.parse(stored);

    // Check TTL
    if (Date.now() - parsed.timestamp > WIZARD_TTL_MS) {
      localStorage.removeItem(WIZARD_STORAGE_KEY);
      return null;
    }

    // Don't restore if we're at upload step (no actual data to restore)
    if (parsed.currentStep === 'upload' || !parsed.batchId) {
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(WIZARD_STORAGE_KEY);
    return null;
  }
}

function savePersistedState(state: Omit<PersistedWizardState, 'timestamp'>): void {
  if (typeof window === 'undefined') return;

  try {
    const toStore: PersistedWizardState = {
      ...state,
      timestamp: Date.now(),
    };
    localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(toStore));
  } catch (error) {
    console.error('Failed to persist wizard state:', error);
  }
}

function clearPersistedState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(WIZARD_STORAGE_KEY);
}

// ============================================
// Types
// ============================================

interface ParsedTrade {
  id: string;
  date: string;
  symbol: string;
  strategyType: StrategyType | null;
  strategyName: string;
  legs: string;
  realizedPL: number | null;
  status: string;
  warnings: string[];
  isValid: boolean;
  isDuplicate?: boolean;
}

interface ExistingThesis {
  id: string;
  name: string;
}

interface UploadResponse {
  success: boolean;
  batchId: string;
  data: {
    trades: ParsedTrade[];
    existingTheses: Record<string, ExistingThesis[]>;
    summary: {
      totalRows: number;
      validTrades: number;
      invalidTrades: number;
      duplicates: number;
    };
    warnings: string[];
  };
  error?: string;
  errors?: string[];
}

interface ConfirmResponse {
  success: boolean;
  data: {
    imported: number;
    failed: number;
    thesesCreated: number;
    tradeIds: string[];
    errors?: { tradeId: string; error: string }[];
  };
}

interface TradeSelection {
  tradeId: string;
  selected: boolean;
  thesisId?: string;
  newThesis?: {
    name: string;
    ticker: string;
    direction: ThesisDirection;
  };
}

interface OptionStratImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (result: ConfirmResponse['data']) => void;
}

type WizardStep = 'upload' | 'preview' | 'assign' | 'confirm' | 'complete';

// ============================================
// Component
// ============================================

export default function OptionStratImportWizard({
  isOpen,
  onClose,
  onComplete,
}: OptionStratImportWizardProps) {
  // Step management
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse result state
  const [batchId, setBatchId] = useState<string | null>(null);
  const [trades, setTrades] = useState<ParsedTrade[]>([]);
  const [existingTheses, setExistingTheses] = useState<Record<string, ExistingThesis[]>>({});
  const [summary, setSummary] = useState<UploadResponse['data']['summary'] | null>(null);

  // Selection state
  const [selections, setSelections] = useState<Map<string, TradeSelection>>(new Map());

  // Import result state
  const [isConfirming, setIsConfirming] = useState(false);
  const [importResult, setImportResult] = useState<ConfirmResponse['data'] | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Resume state
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [hasCheckedPersistedState, setHasCheckedPersistedState] = useState(false);

  // Check for persisted state on mount
  useEffect(() => {
    if (!isOpen || hasCheckedPersistedState) return;

    const persisted = loadPersistedState();
    if (persisted) {
      setShowResumePrompt(true);
    }
    setHasCheckedPersistedState(true);
  }, [isOpen, hasCheckedPersistedState]);

  // Persist state when it changes (only after initial load)
  useEffect(() => {
    if (!hasCheckedPersistedState) return;
    if (currentStep === 'upload' || currentStep === 'complete') return;
    if (!batchId) return;

    savePersistedState({
      currentStep,
      batchId,
      trades,
      existingTheses,
      summary,
      selections: Array.from(selections.entries()),
    });
  }, [currentStep, batchId, trades, existingTheses, summary, selections, hasCheckedPersistedState]);

  // Resume from persisted state
  const handleResume = useCallback(() => {
    const persisted = loadPersistedState();
    if (persisted) {
      setCurrentStep(persisted.currentStep);
      setBatchId(persisted.batchId);
      setTrades(persisted.trades);
      setExistingTheses(persisted.existingTheses);
      setSummary(persisted.summary);
      setSelections(new Map(persisted.selections));
    }
    setShowResumePrompt(false);
  }, []);

  // Start fresh (clear persisted state)
  const handleStartFresh = useCallback(() => {
    clearPersistedState();
    setShowResumePrompt(false);
  }, []);

  // Reset wizard state
  const resetWizard = useCallback(() => {
    setCurrentStep('upload');
    setFile(null);
    setIsUploading(false);
    setUploadError(null);
    setBatchId(null);
    setTrades([]);
    setExistingTheses({});
    setSummary(null);
    setSelections(new Map());
    setIsConfirming(false);
    setImportResult(null);
    setConfirmError(null);
    clearPersistedState();
  }, []);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadError(null);
    }
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.csv')) {
        setUploadError('Please drop a CSV file');
        return;
      }
      setFile(droppedFile);
      setUploadError(null);
    }
  };

  // Upload and parse CSV
  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const csvContent = await file.text();

      const response = await fetch('/api/import/csv/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent }),
      });

      const result: UploadResponse = await response.json();

      if (!result.success) {
        setUploadError(result.error || result.errors?.join(', ') || 'Failed to parse CSV');
        return;
      }

      setBatchId(result.batchId);
      setTrades(result.data.trades);
      setExistingTheses(result.data.existingTheses);
      setSummary(result.data.summary);

      // Initialize selections - select all valid, non-duplicate trades by default
      const initialSelections = new Map<string, TradeSelection>();
      result.data.trades.forEach((trade) => {
        if (trade.isValid && !trade.isDuplicate) {
          initialSelections.set(trade.id, {
            tradeId: trade.id,
            selected: true,
          });
        }
      });
      setSelections(initialSelections);

      setCurrentStep('preview');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle trade selection
  const toggleTradeSelection = (tradeId: string) => {
    setSelections((prev) => {
      const newSelections = new Map(prev);
      const existing = newSelections.get(tradeId);
      if (existing) {
        newSelections.set(tradeId, { ...existing, selected: !existing.selected });
      } else {
        newSelections.set(tradeId, { tradeId, selected: true });
      }
      return newSelections;
    });
  };

  // Select/deselect all valid trades
  const toggleSelectAll = () => {
    const validTrades = trades.filter((t) => t.isValid && !t.isDuplicate);
    const allSelected = validTrades.every(
      (t) => selections.get(t.id)?.selected
    );

    setSelections((prev) => {
      const newSelections = new Map(prev);
      validTrades.forEach((trade) => {
        const existing = newSelections.get(trade.id);
        newSelections.set(trade.id, {
          tradeId: trade.id,
          selected: !allSelected,
          thesisId: existing?.thesisId,
          newThesis: existing?.newThesis,
        });
      });
      return newSelections;
    });
  };

  // Assign thesis to a trade
  const assignThesis = (tradeId: string, thesisId: string | null, newThesis?: TradeSelection['newThesis']) => {
    setSelections((prev) => {
      const newSelections = new Map(prev);
      const existing = newSelections.get(tradeId);
      if (existing) {
        if (thesisId) {
          newSelections.set(tradeId, { ...existing, thesisId, newThesis: undefined });
        } else if (newThesis) {
          newSelections.set(tradeId, { ...existing, thesisId: undefined, newThesis });
        }
      }
      return newSelections;
    });
  };

  // Confirm import
  const handleConfirm = async () => {
    if (!batchId) return;

    setIsConfirming(true);
    setConfirmError(null);

    try {
      // Build trades to import
      const tradesToImport = Array.from(selections.values())
        .filter((s) => s.selected && (s.thesisId || s.newThesis))
        .map((s) => ({
          tradeId: s.tradeId,
          thesisId: s.thesisId,
          newThesis: s.newThesis,
        }));

      if (tradesToImport.length === 0) {
        setConfirmError('No trades selected for import');
        return;
      }

      const response = await fetch('/api/import/csv/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId, trades: tradesToImport }),
      });

      const result: ConfirmResponse = await response.json();

      if (!result.success) {
        setConfirmError('Import failed');
        return;
      }

      setImportResult(result.data);
      setCurrentStep('complete');
      clearPersistedState(); // Clear saved state on successful completion
      onComplete?.(result.data);
    } catch (error) {
      setConfirmError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsConfirming(false);
    }
  };

  // Calculate selected trade count
  const selectedCount = Array.from(selections.values()).filter((s) => s.selected).length;
  const assignedCount = Array.from(selections.values()).filter(
    (s) => s.selected && (s.thesisId || s.newThesis)
  ).length;

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
          'relative w-full max-w-2xl bg-background rounded-t-2xl sm:rounded-2xl shadow-xl',
          'max-h-[90vh] overflow-hidden flex flex-col',
          'animate-in slide-in-from-bottom duration-300'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-wizard-title"
      >
        {/* Resume prompt */}
        {showResumePrompt && (
          <div className="p-4 bg-amber-500/10 border-b border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Resume previous import?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You have an unfinished import from earlier. Would you like to continue where you left off?
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={handleResume}>
                    Resume Import
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleStartFresh}>
                    Start Fresh
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <h2 id="import-wizard-title" className="text-lg font-semibold">
              Import OptionStrat CSV
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {currentStep !== 'upload' && currentStep !== 'complete' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetWizard}
                className="text-muted-foreground"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Start Over
              </Button>
            )}
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
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-3 border-b bg-muted/30">
          {(['upload', 'preview', 'assign', 'confirm'] as const).map((step, idx) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                  currentStep === step
                    ? 'bg-primary text-primary-foreground'
                    : currentStep === 'complete' || idx < ['upload', 'preview', 'assign', 'confirm'].indexOf(currentStep)
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {idx + 1}
              </div>
              {idx < 3 && (
                <div
                  className={cn(
                    'w-8 h-0.5',
                    idx < ['upload', 'preview', 'assign', 'confirm'].indexOf(currentStep)
                      ? 'bg-primary'
                      : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Upload Step */}
          {currentStep === 'upload' && (
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
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="h-10 w-10 text-primary" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
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
                <p className="text-xs text-muted-foreground mb-2">
                  Expected CSV format:
                </p>
                <code className="text-xs block p-2 bg-background rounded border overflow-x-auto">
                  Date,Symbol,Strategy,Legs,P/L,Status
                </code>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {currentStep === 'preview' && (
            <div className="space-y-4">
              {/* Summary */}
              {summary && (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{summary.totalRows} total</Badge>
                  <Badge variant="default">{summary.validTrades} valid</Badge>
                  {summary.duplicates > 0 && (
                    <Badge variant="secondary">{summary.duplicates} duplicates</Badge>
                  )}
                  {summary.invalidTrades > 0 && (
                    <Badge variant="destructive">{summary.invalidTrades} invalid</Badge>
                  )}
                </div>
              )}

              {/* Select all */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {selectedCount} of {summary?.validTrades || 0} selected
                </Label>
                <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                  {selectedCount === summary?.validTrades ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              {/* Trade list */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {trades.map((trade) => {
                  const selection = selections.get(trade.id);
                  const isDisabled = !trade.isValid || trade.isDuplicate;

                  return (
                    <div
                      key={trade.id}
                      className={cn(
                        'p-3 rounded-lg border flex items-start gap-3',
                        isDisabled
                          ? 'bg-muted/30 opacity-60'
                          : selection?.selected
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                      )}
                    >
                      <Checkbox
                        checked={selection?.selected ?? false}
                        onCheckedChange={() => toggleTradeSelection(trade.id)}
                        disabled={isDisabled}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {trade.symbol}
                          </Badge>
                          {trade.strategyType && (
                            <Badge variant="secondary" className="text-xs">
                              {formatStrategyType(trade.strategyType)}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(trade.date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {trade.legs && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {trade.legs}
                          </p>
                        )}
                        {trade.realizedPL !== null && (
                          <div className="flex items-center gap-1 mt-1">
                            {trade.realizedPL >= 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-600" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            )}
                            <span
                              className={cn(
                                'text-xs font-medium',
                                trade.realizedPL >= 0 ? 'text-green-600' : 'text-red-600'
                              )}
                            >
                              {trade.realizedPL >= 0 ? '+' : ''}${trade.realizedPL.toFixed(0)}
                            </span>
                          </div>
                        )}
                        {isDisabled && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3 text-yellow-600" />
                            <span className="text-xs text-yellow-600">
                              {trade.isDuplicate ? 'Already imported' : 'Invalid data'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assign Step */}
          {currentStep === 'assign' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Assign each trade to a thesis. You can link to an existing thesis or create new ones.
              </p>

              <div className="space-y-3 max-h-[350px] overflow-y-auto">
                {Array.from(selections.values())
                  .filter((s) => s.selected)
                  .map((selection) => {
                    const trade = trades.find((t) => t.id === selection.tradeId);
                    if (!trade) return null;

                    const availableTheses = existingTheses[trade.symbol] || [];
                    const hasAssignment = selection.thesisId || selection.newThesis;

                    return (
                      <div
                        key={selection.tradeId}
                        className={cn(
                          'p-3 rounded-lg border',
                          hasAssignment ? 'border-primary bg-primary/5' : 'border-border'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{trade.symbol}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(trade.date), 'MMM d')}
                            </span>
                            {trade.strategyName && (
                              <span className="text-xs">{trade.strategyName}</span>
                            )}
                          </div>
                          {hasAssignment && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>

                        <div className="space-y-2">
                          {availableTheses.length > 0 && (
                            <Select
                              value={selection.thesisId || ''}
                              onValueChange={(value) =>
                                assignThesis(selection.tradeId, value || null)
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Link to existing thesis..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableTheses.map((thesis) => (
                                  <SelectItem key={thesis.id} value={thesis.id}>
                                    <div className="flex items-center gap-2">
                                      <Link2 className="h-3 w-3" />
                                      {thesis.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {!selection.thesisId && (
                            <div className="space-y-2 pt-2 border-t">
                              <Label className="text-xs flex items-center gap-1">
                                <Plus className="h-3 w-3" />
                                Create new thesis
                              </Label>
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  placeholder="Thesis name"
                                  value={selection.newThesis?.name || ''}
                                  onChange={(e) =>
                                    assignThesis(selection.tradeId, null, {
                                      name: e.target.value,
                                      ticker: trade.symbol,
                                      direction: selection.newThesis?.direction || 'BULLISH',
                                    })
                                  }
                                  className="h-8 text-sm"
                                />
                                <Select
                                  value={selection.newThesis?.direction || 'BULLISH'}
                                  onValueChange={(value) =>
                                    assignThesis(selection.tradeId, null, {
                                      name: selection.newThesis?.name || `${trade.symbol} Trade`,
                                      ticker: trade.symbol,
                                      direction: value as ThesisDirection,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="BULLISH">Bullish</SelectItem>
                                    <SelectItem value="BEARISH">Bearish</SelectItem>
                                    <SelectItem value="NEUTRAL">Neutral</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">
                  {assignedCount} of {selectedCount} assigned
                </span>
              </div>
            </div>
          )}

          {/* Confirm Step */}
          {currentStep === 'confirm' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold text-primary">{assignedCount}</p>
                <p className="text-sm text-muted-foreground">trades ready to import</p>
              </div>

              {confirmError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                    <p className="text-sm text-destructive">{confirmError}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Summary</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    • {assignedCount} trades will be imported from{' '}
                    <span className="font-medium">{file?.name}</span>
                  </p>
                  {Array.from(
                    new Set(
                      Array.from(selections.values())
                        .filter((s) => s.selected && s.newThesis)
                        .map((s) => s.newThesis?.name)
                    )
                  ).length > 0 && (
                    <p>
                      •{' '}
                      {
                        new Set(
                          Array.from(selections.values())
                            .filter((s) => s.selected && s.newThesis)
                            .map((s) => s.newThesis?.name)
                        ).size
                      }{' '}
                      new theses will be created
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && importResult && (
            <div className="space-y-4 text-center py-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Import Complete</h3>
                <p className="text-muted-foreground">
                  Successfully imported {importResult.imported} trades
                </p>
              </div>

              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                  <p className="text-xs text-muted-foreground">Imported</p>
                </div>
                {importResult.thesesCreated > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {importResult.thesesCreated}
                    </p>
                    <p className="text-xs text-muted-foreground">Theses Created</p>
                  </div>
                )}
                {importResult.failed > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                )}
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="text-left p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-destructive">
                        {importResult.errors.length} errors:
                      </p>
                      <ul className="text-xs text-destructive mt-1 space-y-0.5">
                        {importResult.errors.slice(0, 5).map((err, idx) => (
                          <li key={idx}>{err.error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between gap-2">
          {currentStep === 'upload' && (
            <>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="gap-2"
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
            </>
          )}

          {currentStep === 'preview' && (
            <>
              <Button variant="ghost" onClick={() => setCurrentStep('upload')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep('assign')}
                disabled={selectedCount === 0}
                className="gap-2"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {currentStep === 'assign' && (
            <>
              <Button variant="ghost" onClick={() => setCurrentStep('preview')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep('confirm')}
                disabled={assignedCount === 0}
                className="gap-2"
              >
                Review Import
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {currentStep === 'confirm' && (
            <>
              <Button variant="ghost" onClick={() => setCurrentStep('assign')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isConfirming || assignedCount === 0}
                className="gap-2"
              >
                {isConfirming ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Import {assignedCount} Trades
                  </>
                )}
              </Button>
            </>
          )}

          {currentStep === 'complete' && (
            <>
              <Button variant="ghost" onClick={resetWizard}>
                Import More
              </Button>
              <Button onClick={onClose} className="gap-2">
                <Check className="h-4 w-4" />
                Done
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
