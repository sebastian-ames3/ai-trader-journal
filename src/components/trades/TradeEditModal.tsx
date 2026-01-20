"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const STRATEGY_TYPES = [
  { value: "LONG_CALL", label: "Long Call" },
  { value: "LONG_PUT", label: "Long Put" },
  { value: "SHORT_CALL", label: "Short Call (Naked)" },
  { value: "SHORT_PUT", label: "Short Put (Naked)" },
  { value: "CALL_SPREAD", label: "Call Spread" },
  { value: "PUT_SPREAD", label: "Put Spread" },
  { value: "IRON_CONDOR", label: "Iron Condor" },
  { value: "IRON_BUTTERFLY", label: "Iron Butterfly" },
  { value: "STRADDLE", label: "Straddle" },
  { value: "STRANGLE", label: "Strangle" },
  { value: "CALENDAR", label: "Calendar Spread" },
  { value: "DIAGONAL", label: "Diagonal Spread" },
  { value: "RATIO", label: "Ratio Spread" },
  { value: "BUTTERFLY", label: "Butterfly" },
  { value: "STOCK", label: "Stock Position" },
  { value: "COVERED_CALL", label: "Covered Call" },
  { value: "CASH_SECURED_PUT", label: "Cash Secured Put" },
  { value: "CUSTOM", label: "Custom/Other" },
];

const TRADE_STATUSES = [
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
  { value: "EXPIRED", label: "Expired" },
  { value: "ASSIGNED", label: "Assigned" },
];

interface Trade {
  id: string;
  action: string;
  description: string;
  strategyType: string | null;
  openedAt: string;
  closedAt: string | null;
  debitCredit: number;
  quantity: number;
  realizedPL: number | null;
  status: string;
  reasoningNote: string | null;
}

interface TradeEditModalProps {
  trade: Trade | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (tradeId: string, updates: TradeUpdateData) => Promise<void>;
}

export interface TradeUpdateData {
  description?: string;
  strategyType?: string | null;
  debitCredit?: number;
  quantity?: number;
  realizedPL?: number | null;
  reasoningNote?: string | null;
  status?: string;
}

export function TradeEditModal({
  trade,
  isOpen,
  onClose,
  onSave,
}: TradeEditModalProps) {
  const [description, setDescription] = React.useState("");
  const [strategyType, setStrategyType] = React.useState<string>("");
  const [debitCredit, setDebitCredit] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [realizedPL, setRealizedPL] = React.useState("");
  const [reasoningNote, setReasoningNote] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset form when trade changes
  React.useEffect(() => {
    if (trade) {
      setDescription(trade.description);
      setStrategyType(trade.strategyType || "");
      setDebitCredit(trade.debitCredit.toString());
      setQuantity(trade.quantity.toString());
      setRealizedPL(trade.realizedPL !== null ? trade.realizedPL.toString() : "");
      setReasoningNote(trade.reasoningNote || "");
      setStatus(trade.status);
      setError(null);
    }
  }, [trade]);

  const handleSave = async () => {
    if (!trade) return;
    if (!description.trim()) {
      setError("Description cannot be empty");
      return;
    }

    const parsedDebitCredit = parseFloat(debitCredit);
    if (isNaN(parsedDebitCredit)) {
      setError("Debit/Credit must be a valid number");
      return;
    }

    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity < 1) {
      setError("Quantity must be at least 1");
      return;
    }

    let parsedRealizedPL: number | null = null;
    if (realizedPL.trim()) {
      parsedRealizedPL = parseFloat(realizedPL);
      if (isNaN(parsedRealizedPL)) {
        setError("Realized P/L must be a valid number");
        return;
      }
    }

    setIsSaving(true);
    setError(null);

    try {
      const updates: TradeUpdateData = {
        description: description.trim(),
        strategyType: strategyType || null,
        debitCredit: parsedDebitCredit,
        quantity: parsedQuantity,
        realizedPL: parsedRealizedPL,
        reasoningNote: reasoningNote.trim() || null,
        status,
      };
      await onSave(trade.id, updates);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = trade && (
    description !== trade.description ||
    (strategyType || null) !== trade.strategyType ||
    parseFloat(debitCredit) !== trade.debitCredit ||
    parseInt(quantity, 10) !== trade.quantity ||
    (realizedPL.trim() ? parseFloat(realizedPL) : null) !== trade.realizedPL ||
    (reasoningNote.trim() || null) !== trade.reasoningNote ||
    status !== trade.status
  );

  if (!trade) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[90vh] max-h-[800px] rounded-t-3xl overflow-hidden flex flex-col"
      >
        <SheetHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
          <SheetTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Edit Trade
          </SheetTitle>
          <SheetDescription className="sr-only">
            Edit the details of your trade including description, strategy, and amounts
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {/* Description */}
          <div>
            <Label
              htmlFor="edit-description"
              className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-200"
            >
              Description *
            </Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] text-base resize-none rounded-xl border-slate-200 dark:border-slate-700"
              placeholder="Describe the trade..."
            />
          </div>

          {/* Strategy Type */}
          <div>
            <Label
              htmlFor="edit-strategy"
              className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-200"
            >
              Strategy Type
            </Label>
            <Select value={strategyType} onValueChange={setStrategyType}>
              <SelectTrigger id="edit-strategy" className="min-h-[44px] rounded-xl">
                <SelectValue placeholder="Select strategy..." />
              </SelectTrigger>
              <SelectContent>
                {STRATEGY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Debit/Credit and Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="edit-debitCredit"
                className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-200"
              >
                Debit/Credit *
              </Label>
              <Input
                id="edit-debitCredit"
                type="number"
                step="0.01"
                value={debitCredit}
                onChange={(e) => setDebitCredit(e.target.value)}
                className="min-h-[44px] rounded-xl border-slate-200 dark:border-slate-700"
                placeholder="0.00"
              />
              <p className="text-xs text-slate-500 mt-1">
                Positive = credit, Negative = debit
              </p>
            </div>
            <div>
              <Label
                htmlFor="edit-quantity"
                className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-200"
              >
                Quantity *
              </Label>
              <Input
                id="edit-quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="min-h-[44px] rounded-xl border-slate-200 dark:border-slate-700"
                placeholder="1"
              />
            </div>
          </div>

          {/* Realized P/L and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="edit-realizedPL"
                className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-200"
              >
                Realized P/L
              </Label>
              <Input
                id="edit-realizedPL"
                type="number"
                step="0.01"
                value={realizedPL}
                onChange={(e) => setRealizedPL(e.target.value)}
                className="min-h-[44px] rounded-xl border-slate-200 dark:border-slate-700"
                placeholder="0.00"
              />
            </div>
            <div>
              <Label
                htmlFor="edit-status"
                className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-200"
              >
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="edit-status" className="min-h-[44px] rounded-xl">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {TRADE_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reasoning Note */}
          <div>
            <Label
              htmlFor="edit-reasoning"
              className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-200"
            >
              Reasoning Note
            </Label>
            <Textarea
              id="edit-reasoning"
              value={reasoningNote}
              onChange={(e) => setReasoningNote(e.target.value)}
              className="min-h-[80px] text-base resize-none rounded-xl border-slate-200 dark:border-slate-700"
              placeholder="Why did you make this trade?"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            size="lg"
            className="w-full h-14 text-lg font-medium bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full h-12 text-slate-500"
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
