"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Confetti, useStreakConfetti } from "@/components/Confetti";

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  className?: string;
}

function getNextMilestone(currentStreak: number): number {
  const milestones = [3, 7, 14, 21, 30, 60, 90, 180, 365];
  for (const milestone of milestones) {
    if (currentStreak < milestone) {
      return milestone;
    }
  }
  return Math.ceil(currentStreak / 100) * 100 + 100;
}

function getStreakMessage(currentStreak: number): string {
  if (currentStreak === 0) return "Start your streak today!";
  if (currentStreak === 1) return "Great start! Keep it going!";
  if (currentStreak < 3) return "Building momentum!";
  if (currentStreak < 7) return "You're on a roll!";
  if (currentStreak < 14) return "One week down!";
  if (currentStreak < 21) return "Two weeks strong!";
  if (currentStreak < 30) return "Almost a month!";
  if (currentStreak < 60) return "One month champion!";
  if (currentStreak < 90) return "Two months strong!";
  if (currentStreak < 180) return "Unstoppable!";
  if (currentStreak < 365) return "Legendary streak!";
  return "You're a journaling master!";
}

export function StreakCard({
  currentStreak,
  longestStreak,
  className,
}: StreakCardProps) {
  const nextMilestone = getNextMilestone(currentStreak);
  const progress = currentStreak > 0 ? (currentStreak / nextMilestone) * 100 : 0;
  const isNewRecord = currentStreak > 0 && currentStreak >= longestStreak;
  const showConfetti = useStreakConfetti(currentStreak);

  return (
    <>
      <Confetti isActive={showConfetti} />
      <div
      className={cn(
        // Gradient background
        "bg-gradient-to-br from-amber-50 via-orange-50 to-red-50",
        "dark:from-amber-950/30 dark:via-orange-950/30 dark:to-red-950/30",

        // Card styling
        "rounded-2xl p-5",
        "border border-orange-200/50 dark:border-orange-800/30",

        // Shadow with color
        "shadow-lg shadow-orange-200/30 dark:shadow-orange-900/20",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className={cn(
            "text-4xl",
            currentStreak > 0 && "animate-fire"
          )}
          role="img"
          aria-label={currentStreak > 0 ? "Fire - active streak" : "Sparkle - no streak yet"}
        >
          {currentStreak > 0 ? "🔥" : "✨"}
        </span>
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
            Journaling Streak
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {getStreakMessage(currentStreak)}
          </p>
        </div>

        {/* New record badge */}
        {isNewRecord && currentStreak > 1 && (
          <div className="ml-auto">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
              <span role="img" aria-label="Trophy">🏆</span> New Record!
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-6 mb-4">
        <div>
          <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">
            {currentStreak}
          </p>
          <p className="text-sm text-slate-500">Current</p>
        </div>
        <div>
          <p className="text-4xl font-bold text-slate-400 dark:text-slate-500">
            {longestStreak}
          </p>
          <p className="text-sm text-slate-500">Best</p>
        </div>
      </div>

      {/* Progress towards next milestone */}
      {currentStreak > 0 && (
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{currentStreak} days</span>
            <span>{nextMilestone} days</span>
          </div>
          <div className="h-2 bg-orange-100 dark:bg-orange-900/30 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                "bg-gradient-to-r from-orange-400 to-red-400"
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1 text-center">
            {nextMilestone - currentStreak} days to {nextMilestone}-day milestone
          </p>
        </div>
      )}

        {/* Zero streak encouragement */}
        {currentStreak === 0 && (
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-2">
            Create your first entry to start your streak!
          </p>
        )}
      </div>
    </>
  );
}

// Compact version for smaller spaces
export function StreakBadge({
  currentStreak,
  className,
}: {
  currentStreak: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
        "bg-gradient-to-r from-amber-100 to-orange-100",
        "dark:from-amber-900/30 dark:to-orange-900/30",
        "border border-orange-200/50 dark:border-orange-800/30",
        className
      )}
    >
      <span
        className={cn("text-lg", currentStreak > 0 && "animate-fire")}
        role="img"
        aria-label={currentStreak > 0 ? "Fire - active streak" : "Sparkle"}
      >
        {currentStreak > 0 ? "🔥" : "✨"}
      </span>
      <span className="font-semibold text-orange-600 dark:text-orange-400">
        {currentStreak}
      </span>
      <span className="text-sm text-slate-600 dark:text-slate-400">
        {currentStreak === 1 ? "day" : "days"}
      </span>
    </div>
  );
}
