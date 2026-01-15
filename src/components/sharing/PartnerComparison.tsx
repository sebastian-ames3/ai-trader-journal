"use client";

import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Flame,
  Calendar,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface UserStats {
  name: string;
  avatarUrl?: string;
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
  avgMoodScore: number;
  weeklyEntryCount: number;
  topMood: string;
}

interface PartnerComparisonProps {
  user: UserStats;
  partner: UserStats;
  className?: string;
}

function getMoodLabel(mood: string): string {
  const moodLabels: Record<string, string> = {
    confident: "Confident",
    excited: "Excited",
    optimistic: "Optimistic",
    neutral: "Neutral",
    uncertain: "Uncertain",
    anxious: "Anxious",
    fearful: "Fearful",
    frustrated: "Frustrated",
    regretful: "Regretful",
    hopeful: "Hopeful",
    calm: "Calm",
    focused: "Focused",
    overwhelmed: "Overwhelmed",
    disciplined: "Disciplined",
  };
  return moodLabels[mood] || mood;
}

function getMoodEmoji(mood: string): string {
  const moodEmojis: Record<string, string> = {
    confident: "😎",
    excited: "🤩",
    optimistic: "😊",
    neutral: "😐",
    uncertain: "🤔",
    anxious: "😰",
    fearful: "😨",
    frustrated: "😤",
    regretful: "😔",
    hopeful: "🙏",
    calm: "😌",
    focused: "🎯",
    overwhelmed: "😵",
    disciplined: "💪",
  };
  return moodEmojis[mood] || "😐";
}

function getEncouragementMessage(
  userStats: UserStats,
  partnerStats: UserStats
): string {
  const streakDiff = userStats.currentStreak - partnerStats.currentStreak;
  const entriesDiff = userStats.totalEntries - partnerStats.totalEntries;

  // User is winning overall
  if (streakDiff > 0 && entriesDiff > 0) {
    return "You're crushing it! Keep pushing to maintain your lead.";
  }

  // User has better streak but fewer total entries
  if (streakDiff > 0 && entriesDiff <= 0) {
    return "Great streak momentum! Keep building consistency.";
  }

  // User has more entries but lower streak
  if (streakDiff <= 0 && entriesDiff > 0) {
    return "Strong total effort! Focus on building daily consistency.";
  }

  // Partner is ahead on both metrics
  if (streakDiff < 0 && entriesDiff < 0) {
    return "Time to step up! Small daily wins add up fast.";
  }

  // Tied
  return "You're neck and neck! Every entry counts now.";
}

function ComparisonBar({
  label,
  icon: Icon,
  userValue,
  partnerValue,
  userLabel,
  partnerLabel,
  suffix = "",
  higherIsBetter = true,
}: {
  label: string;
  icon: React.ElementType;
  userValue: number;
  partnerValue: number;
  userLabel: string;
  partnerLabel: string;
  suffix?: string;
  higherIsBetter?: boolean;
}) {
  const total = userValue + partnerValue || 1;
  const userPercent = (userValue / total) * 100;
  const partnerPercent = (partnerValue / total) * 100;

  const userWins = higherIsBetter
    ? userValue > partnerValue
    : userValue < partnerValue;
  const partnerWins = higherIsBetter
    ? partnerValue > userValue
    : partnerValue < userValue;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </span>
        </div>
        {userValue === partnerValue ? (
          <Minus className="h-4 w-4 text-slate-400" />
        ) : userWins ? (
          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
        )}
      </div>

      <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <div
          className={cn(
            "transition-all duration-500 rounded-l-full",
            userWins
              ? "bg-gradient-to-r from-green-400 to-green-500"
              : partnerWins
              ? "bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-500"
              : "bg-gradient-to-r from-amber-400 to-amber-500"
          )}
          style={{ width: `${userPercent}%` }}
        />
        <div
          className={cn(
            "transition-all duration-500 rounded-r-full",
            partnerWins
              ? "bg-gradient-to-r from-blue-400 to-blue-500"
              : userWins
              ? "bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-500"
              : "bg-gradient-to-r from-amber-400 to-amber-500"
          )}
          style={{ width: `${partnerPercent}%` }}
        />
      </div>

      <div className="flex justify-between text-xs">
        <span
          className={cn(
            "font-medium",
            userWins
              ? "text-green-600 dark:text-green-400"
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          {userLabel}: {userValue}
          {suffix}
        </span>
        <span
          className={cn(
            "font-medium",
            partnerWins
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          {partnerLabel}: {partnerValue}
          {suffix}
        </span>
      </div>
    </div>
  );
}

export function PartnerComparison({
  user,
  partner,
  className,
}: PartnerComparisonProps) {
  const userInitials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const partnerInitials = partner.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with avatars */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-blue-50 dark:from-amber-950/30 dark:to-blue-950/30 border border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-400"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold ring-2 ring-amber-400">
              {userInitials}
            </div>
          )}
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              You
            </p>
            <Badge
              variant="outline"
              className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
            >
              {getMoodEmoji(user.topMood)} {getMoodLabel(user.topMood)}
            </Badge>
          </div>
        </div>

        <div className="text-center">
          <span className="text-lg font-bold text-slate-400">VS</span>
        </div>

        <div className="flex items-center gap-3 flex-row-reverse">
          {partner.avatarUrl ? (
            <img
              src={partner.avatarUrl}
              alt={partner.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-400"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold ring-2 ring-blue-400">
              {partnerInitials}
            </div>
          )}
          <div className="text-right">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {partner.name.split(" ")[0]}
            </p>
            <Badge
              variant="outline"
              className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
            >
              {getMoodEmoji(partner.topMood)} {getMoodLabel(partner.topMood)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Comparison Bars */}
      <div className="space-y-6 p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
        <ComparisonBar
          label="Current Streak"
          icon={Flame}
          userValue={user.currentStreak}
          partnerValue={partner.currentStreak}
          userLabel="You"
          partnerLabel={partner.name.split(" ")[0]}
          suffix=" days"
        />

        <ComparisonBar
          label="Total Entries"
          icon={Calendar}
          userValue={user.totalEntries}
          partnerValue={partner.totalEntries}
          userLabel="You"
          partnerLabel={partner.name.split(" ")[0]}
        />

        <ComparisonBar
          label="This Week"
          icon={Target}
          userValue={user.weeklyEntryCount}
          partnerValue={partner.weeklyEntryCount}
          userLabel="You"
          partnerLabel={partner.name.split(" ")[0]}
          suffix=" entries"
        />

        <ComparisonBar
          label="Longest Streak"
          icon={Award}
          userValue={user.longestStreak}
          partnerValue={partner.longestStreak}
          userLabel="You"
          partnerLabel={partner.name.split(" ")[0]}
          suffix=" days"
        />
      </div>

      {/* Encouragement Message */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/30 border border-slate-200/50 dark:border-slate-700/50 text-center">
        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
          {getEncouragementMessage(user, partner)}
        </p>
      </div>
    </div>
  );
}
