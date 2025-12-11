"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Eye,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MenteeStats {
  totalEntries: number;
  currentStreak: number;
  topBias: string | null;
  moodTrend: "improving" | "declining" | "stable";
  lastWeekEntries: number;
}

interface Mentee {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  lastActiveAt: Date | string;
  stats: MenteeStats;
  isInactive: boolean;
  sharedEntriesCount: number;
}

interface MentorDashboardProps {
  mentees: Mentee[];
  onViewShared: (menteeId: string) => void;
  onCheckIn: (menteeId: string) => void;
  className?: string;
}

function getMoodTrendIcon(trend: MenteeStats["moodTrend"]) {
  switch (trend) {
    case "improving":
      return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
    case "declining":
      return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
    default:
      return <Activity className="h-4 w-4 text-slate-500 dark:text-slate-400" />;
  }
}

function getMoodTrendLabel(trend: MenteeStats["moodTrend"]) {
  switch (trend) {
    case "improving":
      return "Improving";
    case "declining":
      return "Declining";
    default:
      return "Stable";
  }
}

function formatLastActive(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

const MenteeCard = React.memo(function MenteeCard({
  mentee,
  onViewShared,
  onCheckIn,
}: {
  mentee: Mentee;
  onViewShared: (id: string) => void;
  onCheckIn: (id: string) => void;
}) {
  const initials = mentee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "relative",
        "bg-white dark:bg-slate-800/50",
        "rounded-2xl p-4",
        "border border-slate-200/50 dark:border-slate-700/50",
        "shadow-sm",
        "transition-all duration-200",
        mentee.isInactive && "border-amber-300 dark:border-amber-700/50"
      )}
    >
      {/* Inactive Warning */}
      {mentee.isInactive && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700">
            <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
              Inactive
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        {/* Avatar */}
        {mentee.avatarUrl ? (
          <img
            src={mentee.avatarUrl}
            alt={mentee.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {mentee.name}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
            Last active {formatLastActive(mentee.lastActiveAt)}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {mentee.stats.totalEntries}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total Entries
          </p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {mentee.stats.currentStreak}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Day Streak
          </p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        {mentee.stats.topBias && (
          <div className="flex items-center gap-1">
            <span className="text-slate-500 dark:text-slate-400">Top Bias:</span>
            <Badge variant="outline" className="text-xs">
              {mentee.stats.topBias}
            </Badge>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span className="text-slate-500 dark:text-slate-400">Mood:</span>
          {getMoodTrendIcon(mentee.stats.moodTrend)}
          <span
            className={cn(
              "text-xs font-medium",
              mentee.stats.moodTrend === "improving" &&
                "text-green-600 dark:text-green-400",
              mentee.stats.moodTrend === "declining" &&
                "text-red-600 dark:text-red-400",
              mentee.stats.moodTrend === "stable" &&
                "text-slate-600 dark:text-slate-400"
            )}
          >
            {getMoodTrendLabel(mentee.stats.moodTrend)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 min-h-[44px]"
          onClick={() => onViewShared(mentee.id)}
        >
          <Eye className="h-4 w-4 mr-2" />
          View Shared
          {mentee.sharedEntriesCount > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {mentee.sharedEntriesCount}
            </Badge>
          )}
        </Button>
        <Button
          variant={mentee.isInactive ? "default" : "outline"}
          className={cn(
            "flex-1 min-h-[44px]",
            mentee.isInactive && "bg-amber-500 hover:bg-amber-600 text-white"
          )}
          onClick={() => onCheckIn(mentee.id)}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Check In
        </Button>
      </div>
    </div>
  );
});

function MenteeCardSkeleton() {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-800/50",
        "rounded-2xl p-4",
        "border border-slate-200/50 dark:border-slate-700/50"
      )}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 skeleton rounded" />
          <div className="h-4 w-24 skeleton rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="h-20 skeleton rounded-xl" />
        <div className="h-20 skeleton rounded-xl" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-11 skeleton rounded" />
        <div className="flex-1 h-11 skeleton rounded" />
      </div>
    </div>
  );
}

export function MentorDashboard({
  mentees,
  onViewShared,
  onCheckIn,
  className,
}: MentorDashboardProps) {
  const activeMentees = mentees.filter((m) => !m.isInactive);
  const inactiveMentees = mentees.filter((m) => m.isInactive);

  if (mentees.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="text-6xl mb-4">🎓</div>
        <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
          No Mentees Yet
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
          When traders connect with you as their mentor, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {mentees.length}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total Mentees
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {activeMentees.length}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Active
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
            {inactiveMentees.length}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Need Attention
          </p>
        </div>
      </div>

      {/* Inactive Mentees (Priority) */}
      {inactiveMentees.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Need Attention ({inactiveMentees.length})
          </h2>
          <div className="space-y-3">
            {inactiveMentees.map((mentee) => (
              <MenteeCard
                key={mentee.id}
                mentee={mentee}
                onViewShared={onViewShared}
                onCheckIn={onCheckIn}
              />
            ))}
          </div>
        </section>
      )}

      {/* Active Mentees */}
      {activeMentees.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Active Mentees ({activeMentees.length})
          </h2>
          <div className="space-y-3">
            {activeMentees.map((mentee) => (
              <MenteeCard
                key={mentee.id}
                mentee={mentee}
                onViewShared={onViewShared}
                onCheckIn={onCheckIn}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export { MenteeCardSkeleton };
