import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StrategyType, ThesisDirection } from '@prisma/client';

// ============================================
// Types
// ============================================

export type ThesisTradeStatus = 'OPEN' | 'CLOSED' | 'EXPIRED' | 'ASSIGNED';

export type TradeAction =
  | 'INITIAL'
  | 'ADD'
  | 'REDUCE'
  | 'ROLL'
  | 'CONVERT'
  | 'CLOSE'
  | 'ASSIGNED'
  | 'EXERCISED';

export interface ParsedTrade {
  id: string;
  ticker: string;
  strategyType: StrategyType | null;
  strategyDisplay: string;
  openedAt: string;
  closedAt?: string;
  debitCredit: number;
  realizedPL?: number;
  status: ThesisTradeStatus;
  legs?: string;
  description?: string;
  rawData?: Record<string, unknown>;
  // Validation
  isValid: boolean;
  isDuplicate?: boolean;
  warnings: string[];
}

export interface TradeEdits {
  ticker?: string;
  strategyType?: StrategyType;
  openedAt?: string;
  closedAt?: string;
  debitCredit?: number;
  realizedPL?: number;
  status?: ThesisTradeStatus;
  description?: string;
}

export interface TradeDecision {
  action: 'approve' | 'skip';
  edits?: TradeEdits;
  notes?: string;
  linkedGroupId?: string;
  tradeAction?: TradeAction;
}

export interface LinkGroup {
  id: string;
  name: string;
  ticker: string;
  direction: ThesisDirection;
  tradeIds: string[];
  existingTradeIds?: string[];
  existingThesisId?: string;
  isNew: boolean;
}

export interface LinkSuggestion {
  id: string;
  confidence: number;
  tradeIds: string[];
  pattern: string;
  reason: string;
  suggestedName: string;
  suggestedDirection: ThesisDirection;
  suggestedActions?: { tradeId: string; action: TradeAction }[];
}

export interface ExistingTrade {
  id: string;
  ticker: string;
  strategyType: StrategyType | null;
  openedAt: string;
  closedAt?: string;
  realizedPL?: number;
  status: ThesisTradeStatus;
  thesisId?: string;
  thesisName?: string;
}

export type WizardStep = 'upload' | 'review' | 'link' | 'confirm' | 'complete';

export interface ImportSummary {
  totalRows: number;
  validTrades: number;
  invalidTrades: number;
  duplicates: number;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  thesesCreated: number;
  tradeIds: string[];
  thesisIds: string[];
  errors?: { tradeId: string; error: string }[];
}

// Use Record instead of Map for JSON serialization compatibility
type DecisionsRecord = Record<string, TradeDecision>;

// ============================================
// Store State
// ============================================

interface SmartImportState {
  // Step management
  currentStep: WizardStep;

  // Upload phase
  file: File | null;
  fileName: string | null;
  batchId: string | null;
  isUploading: boolean;
  uploadError: string | null;

  // Parsed data
  trades: ParsedTrade[];
  summary: ImportSummary | null;

  // Review phase
  currentReviewIndex: number;
  decisions: DecisionsRecord;
  reviewHistory: string[]; // For undo

  // Linking phase
  linkGroups: LinkGroup[];
  suggestions: LinkSuggestion[];
  suggestionsLoading: boolean;

  // Confirm phase
  isConfirming: boolean;
  confirmError: string | null;

  // Complete phase
  importResult: ImportResult | null;

  // Computed
  approvedCount: number;
  skippedCount: number;
  pendingCount: number;
}

interface SmartImportActions {
  // Navigation
  setStep: (step: WizardStep) => void;
  goBack: () => void;

  // Upload
  setFile: (file: File | null) => void;
  startUpload: () => void;
  uploadSuccess: (batchId: string, trades: ParsedTrade[], summary: ImportSummary) => void;
  setUploadError: (error: string) => void;

  // Review
  approveTrade: (tradeId: string, edits?: TradeEdits, notes?: string) => void;
  skipTrade: (tradeId: string) => void;
  undoLast: () => void;
  goToTrade: (index: number) => void;

  // Linking
  setSuggestions: (suggestions: LinkSuggestion[]) => void;
  setSuggestionsLoading: (loading: boolean) => void;
  acceptSuggestion: (suggestionId: string) => void;
  dismissSuggestion: (suggestionId: string) => void;
  createLinkGroup: (group: Omit<LinkGroup, 'id' | 'isNew'>) => void;
  updateLinkGroup: (groupId: string, updates: Partial<LinkGroup>) => void;
  deleteLinkGroup: (groupId: string) => void;
  addTradeToGroup: (groupId: string, tradeId: string, action?: TradeAction) => void;
  removeTradeFromGroup: (groupId: string, tradeId: string) => void;

  // Confirm
  startConfirm: () => void;
  confirmSuccess: (result: ImportResult) => void;
  setConfirmError: (error: string) => void;

  // Reset
  reset: () => void;

  // Helpers
  getApprovedTrades: () => ParsedTrade[];
  getUnlinkedTrades: () => ParsedTrade[];
  getTradeDecision: (tradeId: string) => TradeDecision | undefined;
  getTradeWithEdits: (tradeId: string) => ParsedTrade | null;
}

type SmartImportStore = SmartImportState & SmartImportActions;

// ============================================
// Initial State
// ============================================

const initialState: SmartImportState = {
  currentStep: 'upload',
  file: null,
  fileName: null,
  batchId: null,
  isUploading: false,
  uploadError: null,
  trades: [],
  summary: null,
  currentReviewIndex: 0,
  decisions: {},
  reviewHistory: [],
  linkGroups: [],
  suggestions: [],
  suggestionsLoading: false,
  isConfirming: false,
  confirmError: null,
  importResult: null,
  approvedCount: 0,
  skippedCount: 0,
  pendingCount: 0,
};

// ============================================
// Store
// ============================================

export const useSmartImportStore = create<SmartImportStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Navigation
      setStep: (step) => set({ currentStep: step }),

      goBack: () => {
        const { currentStep } = get();
        const stepOrder: WizardStep[] = ['upload', 'review', 'link', 'confirm', 'complete'];
        const currentIndex = stepOrder.indexOf(currentStep);
        if (currentIndex > 0) {
          set({ currentStep: stepOrder[currentIndex - 1] });
        }
      },

      // Upload
      setFile: (file) =>
        set({
          file,
          fileName: file?.name || null,
          uploadError: null,
        }),

      startUpload: () => set({ isUploading: true, uploadError: null }),

      uploadSuccess: (batchId, trades, summary) => {
        const validTrades = trades.filter((t) => t.isValid && !t.isDuplicate);
        set({
          batchId,
          trades,
          summary,
          isUploading: false,
          uploadError: null,
          currentStep: 'review',
          currentReviewIndex: 0,
          decisions: {},
          reviewHistory: [],
          pendingCount: validTrades.length,
          approvedCount: 0,
          skippedCount: 0,
        });
      },

      setUploadError: (error) => set({ isUploading: false, uploadError: error }),

      // Review
      approveTrade: (tradeId, edits, notes) => {
        const { decisions, reviewHistory, currentReviewIndex, trades, approvedCount, pendingCount } = get();
        const newDecisions = {
          ...decisions,
          [tradeId]: {
            action: 'approve' as const,
            edits,
            notes,
          },
        };

        const validTrades = trades.filter((t) => t.isValid && !t.isDuplicate);
        const nextIndex = Math.min(currentReviewIndex + 1, validTrades.length - 1);

        set({
          decisions: newDecisions,
          reviewHistory: [...reviewHistory, tradeId],
          currentReviewIndex: nextIndex,
          approvedCount: approvedCount + 1,
          pendingCount: pendingCount - 1,
        });
      },

      skipTrade: (tradeId) => {
        const { decisions, reviewHistory, currentReviewIndex, trades, skippedCount, pendingCount } = get();
        const newDecisions = {
          ...decisions,
          [tradeId]: { action: 'skip' as const },
        };

        const validTrades = trades.filter((t) => t.isValid && !t.isDuplicate);
        const nextIndex = Math.min(currentReviewIndex + 1, validTrades.length - 1);

        set({
          decisions: newDecisions,
          reviewHistory: [...reviewHistory, tradeId],
          currentReviewIndex: nextIndex,
          skippedCount: skippedCount + 1,
          pendingCount: pendingCount - 1,
        });
      },

      undoLast: () => {
        const { decisions, reviewHistory, currentReviewIndex, approvedCount, skippedCount, pendingCount } = get();
        if (reviewHistory.length === 0) return;

        const lastTradeId = reviewHistory[reviewHistory.length - 1];
        const lastDecision = decisions[lastTradeId];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [lastTradeId]: _removed, ...newDecisions } = decisions;

        set({
          decisions: newDecisions,
          reviewHistory: reviewHistory.slice(0, -1),
          currentReviewIndex: Math.max(0, currentReviewIndex - 1),
          approvedCount: lastDecision?.action === 'approve' ? approvedCount - 1 : approvedCount,
          skippedCount: lastDecision?.action === 'skip' ? skippedCount - 1 : skippedCount,
          pendingCount: pendingCount + 1,
        });
      },

      goToTrade: (index) => set({ currentReviewIndex: index }),

      // Linking
      setSuggestions: (suggestions) => set({ suggestions }),

      setSuggestionsLoading: (loading) => set({ suggestionsLoading: loading }),

      acceptSuggestion: (suggestionId) => {
        const { suggestions, linkGroups } = get();
        const suggestion = suggestions.find((s) => s.id === suggestionId);
        if (!suggestion) return;

        const newGroup: LinkGroup = {
          id: `group-${Date.now()}`,
          name: suggestion.suggestedName,
          ticker: suggestion.tradeIds[0] ? get().trades.find((t) => t.id === suggestion.tradeIds[0])?.ticker || '' : '',
          direction: suggestion.suggestedDirection,
          tradeIds: suggestion.tradeIds,
          isNew: true,
        };

        set({
          linkGroups: [...linkGroups, newGroup],
          suggestions: suggestions.filter((s) => s.id !== suggestionId),
        });
      },

      dismissSuggestion: (suggestionId) => {
        const { suggestions } = get();
        set({ suggestions: suggestions.filter((s) => s.id !== suggestionId) });
      },

      createLinkGroup: (group) => {
        const { linkGroups } = get();
        const newGroup: LinkGroup = {
          ...group,
          id: `group-${Date.now()}`,
          isNew: true,
        };
        set({ linkGroups: [...linkGroups, newGroup] });
      },

      updateLinkGroup: (groupId, updates) => {
        const { linkGroups } = get();
        set({
          linkGroups: linkGroups.map((g) =>
            g.id === groupId ? { ...g, ...updates } : g
          ),
        });
      },

      deleteLinkGroup: (groupId) => {
        const { linkGroups } = get();
        set({ linkGroups: linkGroups.filter((g) => g.id !== groupId) });
      },

      addTradeToGroup: (groupId, tradeId, action) => {
        const { linkGroups, decisions } = get();

        // Update link group
        const newLinkGroups = linkGroups.map((g) =>
          g.id === groupId
            ? { ...g, tradeIds: [...g.tradeIds, tradeId] }
            : g
        );

        // Update decision if action provided
        if (action) {
          const existing = decisions[tradeId];
          if (existing) {
            set({
              linkGroups: newLinkGroups,
              decisions: {
                ...decisions,
                [tradeId]: {
                  ...existing,
                  linkedGroupId: groupId,
                  tradeAction: action,
                },
              },
            });
            return;
          }
        }

        set({ linkGroups: newLinkGroups });
      },

      removeTradeFromGroup: (groupId, tradeId) => {
        const { linkGroups, decisions } = get();

        const newLinkGroups = linkGroups.map((g) =>
          g.id === groupId
            ? { ...g, tradeIds: g.tradeIds.filter((id) => id !== tradeId) }
            : g
        );

        // Clear link from decision
        const existing = decisions[tradeId];
        if (existing && existing.linkedGroupId === groupId) {
          set({
            linkGroups: newLinkGroups,
            decisions: {
              ...decisions,
              [tradeId]: {
                ...existing,
                linkedGroupId: undefined,
                tradeAction: undefined,
              },
            },
          });
          return;
        }

        set({ linkGroups: newLinkGroups });
      },

      // Confirm
      startConfirm: () => set({ isConfirming: true, confirmError: null }),

      confirmSuccess: (result) =>
        set({
          isConfirming: false,
          importResult: result,
          currentStep: 'complete',
        }),

      setConfirmError: (error) => set({ isConfirming: false, confirmError: error }),

      // Reset
      reset: () => set(initialState),

      // Helpers
      getApprovedTrades: () => {
        const { trades, decisions } = get();
        return trades.filter((t) => decisions[t.id]?.action === 'approve');
      },

      getUnlinkedTrades: () => {
        const { trades, decisions, linkGroups } = get();
        const linkedTradeIds = new Set(linkGroups.flatMap((g) => g.tradeIds));
        return trades.filter(
          (t) =>
            decisions[t.id]?.action === 'approve' &&
            !linkedTradeIds.has(t.id)
        );
      },

      getTradeDecision: (tradeId) => {
        return get().decisions[tradeId];
      },

      getTradeWithEdits: (tradeId) => {
        const { trades, decisions } = get();
        const trade = trades.find((t) => t.id === tradeId);
        if (!trade) return null;

        const decision = decisions[tradeId];
        if (!decision?.edits) return trade;

        return {
          ...trade,
          ...decision.edits,
          ticker: decision.edits.ticker || trade.ticker,
          strategyType: decision.edits.strategyType ?? trade.strategyType,
          openedAt: decision.edits.openedAt || trade.openedAt,
          closedAt: decision.edits.closedAt ?? trade.closedAt,
          debitCredit: decision.edits.debitCredit ?? trade.debitCredit,
          realizedPL: decision.edits.realizedPL ?? trade.realizedPL,
          status: decision.edits.status || trade.status,
          description: decision.edits.description ?? trade.description,
        };
      },
    }),
    {
      name: 'smart-import-storage',
      version: 2, // Increment to invalidate old corrupted data
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        // Only persist essential data, not File objects
        batchId: state.batchId,
        fileName: state.fileName,
        trades: state.trades,
        summary: state.summary,
        currentStep: state.currentStep,
        currentReviewIndex: state.currentReviewIndex,
        decisions: state.decisions,
        reviewHistory: state.reviewHistory,
        linkGroups: state.linkGroups,
        suggestions: state.suggestions,
        approvedCount: state.approvedCount,
        skippedCount: state.skippedCount,
        pendingCount: state.pendingCount,
      }),
    }
  )
);

// ============================================
// Selectors (for performance)
// ============================================

export const selectCurrentTrade = (state: SmartImportStore) => {
  const validTrades = state.trades.filter((t) => t.isValid && !t.isDuplicate);
  return validTrades[state.currentReviewIndex] || null;
};

export const selectValidTrades = (state: SmartImportStore) =>
  state.trades.filter((t) => t.isValid && !t.isDuplicate);

export const selectProgress = (state: SmartImportStore) => {
  const total = state.approvedCount + state.skippedCount + state.pendingCount;
  const completed = state.approvedCount + state.skippedCount;
  return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 };
};

export const selectIsReviewComplete = (state: SmartImportStore) =>
  state.pendingCount === 0 && state.trades.length > 0;
