"use client";

import * as React from "react";
import Link from "next/link";
import { Loader, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MoodSelector, MoodValue } from "@/components/ui/mood-selector";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type ConvictionLevel = "LOW" | "MEDIUM" | "HIGH";

interface Entry {
  id: string;
  content: string;
  mood: string | null;
  conviction: string | null;
  type: string;
  ticker: string | null;
}

interface InlineEditModalProps {
  entry: Entry | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (entryId: string, updates: { content: string; mood: string | null; conviction: string | null }) => Promise<void>;
}

const CONVICTION_LEVELS: ConvictionLevel[] = ["LOW", "MEDIUM", "HIGH"];

export function InlineEditModal({
  entry,
  isOpen,
  onClose,
  onSave,
}: InlineEditModalProps) {
  const [content, setContent] = React.useState("");
  const [mood, setMood] = React.useState<MoodValue | null>(null);
  const [conviction, setConviction] = React.useState<ConvictionLevel | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset form when entry changes
  React.useEffect(() => {
    if (entry) {
      setContent(entry.content);
      setMood((entry.mood as MoodValue) || null);
      setConviction((entry.conviction as ConvictionLevel) || null);
      setError(null);
    }
  }, [entry]);

  const handleSave = async () => {
    if (!entry) return;
    if (!content.trim()) {
      setError("Content cannot be empty");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(entry.id, {
        content: content.trim(),
        mood,
        conviction,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = entry && (
    content !== entry.content ||
    mood !== entry.mood ||
    conviction !== entry.conviction
  );

  if (!entry) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[85vh] max-h-[700px] rounded-t-3xl overflow-hidden flex flex-col"
      >
        <SheetHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
          <SheetTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Quick Edit
          </SheetTitle>
          <SheetDescription className="sr-only">
            Quickly edit your journal entry content, mood, and conviction level
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Content Textarea */}
          <div>
            <Label
              htmlFor="edit-content"
              className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-200"
            >
              Content
            </Label>
            <Textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px] text-base resize-none rounded-xl border-slate-200 dark:border-slate-700"
              placeholder="What's on your mind?"
              autoCapitalize="sentences"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {content.length} characters
            </p>
          </div>

          {/* Mood Selector */}
          <div>
            <Label className="text-sm font-medium mb-3 block text-slate-700 dark:text-slate-200">
              Mood
            </Label>
            <MoodSelector
              value={mood}
              onChange={setMood}
              variant="compact"
              className="justify-start overflow-x-auto pb-2"
            />
          </div>

          {/* Conviction Level */}
          <div>
            <Label className="text-sm font-medium mb-3 block text-slate-700 dark:text-slate-200">
              Conviction Level
            </Label>
            <div className="flex gap-2">
              {CONVICTION_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setConviction(level)}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl border-2 transition-all font-medium min-h-[44px]",
                    conviction === level
                      ? "border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/20"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
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
                <Loader className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>

          <Link
            href={`/journal/${entry.id}/edit`}
            className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 py-2 transition-colors"
            onClick={onClose}
          >
            <ExternalLink className="h-4 w-4" />
            Full Edit Page
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
