"use client";

import * as React from "react";
import { Bell, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PartnerInfo {
  id: string;
  name: string;
  avatarUrl?: string;
  currentStreak: number;
  weeklyActivity: number[];
}

interface AccountabilityWidgetProps {
  user: {
    name: string;
    avatarUrl?: string;
    currentStreak: number;
    weeklyActivity: number[];
  };
  partner: PartnerInfo | null;
  onNudge: (partnerId: string) => void;
  className?: string;
}

function getMotivationalMessage(
  userStreak: number,
  partnerStreak: number
): string {
  const diff = userStreak - partnerStreak;

  if (diff > 7) {
    return "You're leading by a lot! Keep up the great work.";
  }
  if (diff > 3) {
    return "Nice lead! Stay consistent to maintain it.";
  }
  if (diff > 0) {
    return "Slight edge! Don't let your guard down.";
  }
  if (diff === 0) {
    return "Neck and neck! Push harder to take the lead.";
  }
  if (diff > -3) {
    return "Just behind! A few more days to catch up.";
  }
  if (diff > -7) {
    return "Time to step up! You can close the gap.";
  }
  return "Falling behind. Start your streak today!";
}

function getComparisonIcon(userStreak: number, partnerStreak: number) {
  if (userStreak > partnerStreak) {
    return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
  }
  if (userStreak < partnerStreak) {
    return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
  }
  return <Minus className="h-4 w-4 text-slate-500 dark:text-slate-400" />;
}

function ActivityIndicator({
  activity,
  className,
}: {
  activity: number[];
  className?: string;
}) {
  // activity is an array of 7 values (one per day) where 0 = no activity, 1+ = entries
  return (
    <div className={cn("flex gap-1", className)}>
      {activity.map((count, i) => (
        <div
          key={i}
          className={cn(
            "w-4 h-4 rounded",
            count === 0 && "bg-slate-200 dark:bg-slate-700",
            count === 1 && "bg-green-300 dark:bg-green-700",
            count >= 2 && "bg-green-500 dark:bg-green-500"
          )}
          title={`${count} entries`}
        />
      ))}
    </div>
  );
}

export function AccountabilityWidget({
  user,
  partner,
  onNudge,
  className,
}: AccountabilityWidgetProps) {
  const [isNudging, setIsNudging] = React.useState(false);
  const [nudgeSent, setNudgeSent] = React.useState(false);

  const handleNudge = async () => {
    if (!partner) return;
    setIsNudging(true);
    try {
      await onNudge(partner.id);
      setNudgeSent(true);
      setTimeout(() => setNudgeSent(false), 3000);
    } catch (error) {
      console.error("Failed to send nudge:", error);
    } finally {
      setIsNudging(false);
    }
  };

  // No partner connected
  if (!partner) {
    return (
      <div
        className={cn(
          "p-4 rounded-2xl",
          "bg-gradient-to-br from-blue-50 to-indigo-50",
          "dark:from-blue-950/30 dark:to-indigo-950/30",
          "border border-blue-200/50 dark:border-blue-800/30",
          className
        )}
      >
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Accountability Partner
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
          Connect with a partner to stay motivated and track progress together.
        </p>
        <Button variant="outline" className="w-full min-h-[44px]">
          Find a Partner
        </Button>
      </div>
    );
  }

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
    <div
      className={cn(
        "p-4 rounded-2xl",
        "bg-gradient-to-br from-blue-50 to-indigo-50",
        "dark:from-blue-950/30 dark:to-indigo-950/30",
        "border border-blue-200/50 dark:border-blue-800/30",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
          Accountability
        </h3>
        {getComparisonIcon(user.currentStreak, partner.currentStreak)}
      </div>

      {/* Side-by-side comparison */}
      <div className="flex items-start gap-4 mb-4">
        {/* User */}
        <div className="flex-1 text-center">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-10 h-10 rounded-full mx-auto mb-2 object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm mx-auto mb-2">
              {userInitials}
            </div>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">You</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {user.currentStreak}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">day streak</p>
          <ActivityIndicator
            activity={user.weeklyActivity}
            className="justify-center mt-2"
          />
        </div>

        {/* Divider */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="h-16 w-px bg-slate-200 dark:bg-slate-700" />
          <span className="text-xs text-slate-400 my-1">vs</span>
          <div className="h-16 w-px bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Partner */}
        <div className="flex-1 text-center">
          {partner.avatarUrl ? (
            <img
              src={partner.avatarUrl}
              alt={partner.name}
              className="w-10 h-10 rounded-full mx-auto mb-2 object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm mx-auto mb-2">
              {partnerInitials}
            </div>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 truncate">
            {partner.name.split(" ")[0]}
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {partner.currentStreak}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">day streak</p>
          <ActivityIndicator
            activity={partner.weeklyActivity}
            className="justify-center mt-2"
          />
        </div>
      </div>

      {/* Motivational message */}
      <p className="text-sm text-center text-slate-600 dark:text-slate-400 mb-3">
        {getMotivationalMessage(user.currentStreak, partner.currentStreak)}
      </p>

      {/* Nudge button */}
      <Button
        variant="outline"
        onClick={handleNudge}
        disabled={isNudging || nudgeSent}
        className={cn(
          "w-full min-h-[44px]",
          nudgeSent &&
            "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
        )}
      >
        {nudgeSent ? (
          "Nudge Sent!"
        ) : (
          <>
            <Bell className="h-4 w-4 mr-2" />
            {isNudging ? "Sending..." : "Nudge Partner"}
          </>
        )}
      </Button>
    </div>
  );
}
