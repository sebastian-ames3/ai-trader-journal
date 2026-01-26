"use client";

import * as React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { getMoodEmoji } from "@/components/ui/mood-selector";

type EntryType = "IDEA" | "DECISION" | "REFLECTION" | "OBSERVATION";

interface EntryCardProps {
  id: string;
  content: string;
  type: EntryType;
  ticker?: string | null;
  mood?: string | null;
  conviction?: string | null;
  createdAt: Date | string;
  thesisName?: string | null;
  className?: string;
  onEdit?: () => void;
}

const TYPE_CONFIG: Record<
  EntryType,
  { label: string; color: string; bgColor: string }
> = {
  IDEA: {
    label: "Idea",
    color: "bg-blue-500",
    bgColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  DECISION: {
    label: "Decision",
    color: "bg-green-500",
    bgColor:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  REFLECTION: {
    label: "Reflection",
    color: "bg-purple-500",
    bgColor:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
  OBSERVATION: {
    label: "Observation",
    color: "bg-orange-500",
    bgColor:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  },
};

function formatTimeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export const EntryCard = React.memo(function EntryCard({
  id,
  content,
  type,
  ticker,
  mood,
  conviction,
  createdAt,
  thesisName,
  className,
  onEdit,
}: EntryCardProps) {
  const typeConfig = TYPE_CONFIG[type];

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.();
  };

  const cardContent = (
    <div
      className={cn(
        // Base
        "group relative",
        "bg-white dark:bg-slate-800/50",
        "rounded-2xl p-4",
        "border border-slate-200/50 dark:border-slate-700/50",

        // Interaction
        "transition-all duration-200",
        "hover:shadow-md hover:border-slate-300/50 dark:hover:border-slate-600/50",
        "active:scale-[0.98]",
        className
      )}
    >
      {/* Type indicator line */}
      <div
        className={cn(
          "absolute left-0 top-4 bottom-4 w-1 rounded-full",
          typeConfig.color
        )}
      />

      {/* Edit button (desktop hover) */}
      {onEdit && (
        <button
          onClick={handleEditClick}
          className={cn(
            "absolute right-3 top-3 z-10",
            "p-2 rounded-xl",
            "bg-slate-100 dark:bg-slate-700",
            "opacity-0 group-hover:opacity-100",
            "transition-all duration-200",
            "hover:bg-amber-100 hover:text-amber-600",
            "dark:hover:bg-amber-900/30 dark:hover:text-amber-400",
            "focus:outline-none focus:ring-2 focus:ring-amber-500/50",
            "min-h-[44px] min-w-[44px] flex items-center justify-center"
          )}
          aria-label="Quick edit entry"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}

      <div className="pl-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={cn("text-xs font-medium", typeConfig.bgColor)}
            >
              {typeConfig.label}
            </Badge>
            {ticker && (
              <Badge
                variant="outline"
                className="font-mono text-xs bg-slate-50 dark:bg-slate-800"
              >
                ${ticker}
              </Badge>
            )}
            {conviction && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  conviction === "HIGH" &&
                    "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
                  conviction === "MEDIUM" &&
                    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
                  conviction === "LOW" &&
                    "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                )}
              >
                {conviction.charAt(0) + conviction.slice(1).toLowerCase()}
              </Badge>
            )}
          </div>
          {mood && <span className="text-xl">{getMoodEmoji(mood)}</span>}
        </div>

        {/* Content preview */}
        <p className="text-slate-700 dark:text-slate-300 line-clamp-2 mb-2 text-sm leading-relaxed">
          {content}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {formatTimeAgo(createdAt)}
          </span>
          {thesisName && (
            <Badge
              variant="outline"
              className="text-xs bg-slate-50 dark:bg-slate-800"
            >
              {thesisName}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Link href={`/journal/${id}`}>
      {cardContent}
    </Link>
  );
});

// Skeleton loader for EntryCard
export function EntryCardSkeleton() {
  return (
    <div
      className={cn(
        "relative",
        "bg-white dark:bg-slate-800/50",
        "rounded-2xl p-4",
        "border border-slate-200/50 dark:border-slate-700/50"
      )}
    >
      {/* Type indicator line skeleton */}
      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full skeleton" />

      <div className="pl-4 space-y-3">
        {/* Header skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-20 skeleton" />
          <div className="h-5 w-12 skeleton" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-full skeleton" />
          <div className="h-4 w-3/4 skeleton" />
        </div>

        {/* Footer skeleton */}
        <div className="h-4 w-24 skeleton" />
      </div>
    </div>
  );
}

// List wrapper with proper spacing
export function EntryCardList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {children}
    </div>
  );
}
