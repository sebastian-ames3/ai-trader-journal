"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type MoodValue =
  | "CONFIDENT"
  | "EXCITED"
  | "NEUTRAL"
  | "UNCERTAIN"
  | "NERVOUS"
  | "CALM"
  | "ANXIOUS"
  | "FEARFUL"
  | "GREEDY"
  | "HOPEFUL"
  | "FRUSTRATED"
  | "RELIEVED"
  | "REGRETFUL"
  | "DISCIPLINED";

interface MoodOption {
  value: MoodValue;
  emoji: string;
  label: string;
  colorClass: string;
  bgClass: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    value: "CONFIDENT",
    emoji: "😊",
    label: "Confident",
    colorClass: "border-green-300 dark:border-green-700",
    bgClass: "bg-green-100 dark:bg-green-900/30",
  },
  {
    value: "EXCITED",
    emoji: "🚀",
    label: "Excited",
    colorClass: "border-amber-300 dark:border-amber-700",
    bgClass: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    value: "NEUTRAL",
    emoji: "😐",
    label: "Neutral",
    colorClass: "border-slate-300 dark:border-slate-600",
    bgClass: "bg-slate-100 dark:bg-slate-800",
  },
  {
    value: "UNCERTAIN",
    emoji: "🤔",
    label: "Uncertain",
    colorClass: "border-purple-300 dark:border-purple-700",
    bgClass: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    value: "NERVOUS",
    emoji: "😰",
    label: "Nervous",
    colorClass: "border-red-300 dark:border-red-700",
    bgClass: "bg-red-100 dark:bg-red-900/30",
  },
];

// Extended mood options for full form
const EXTENDED_MOOD_OPTIONS: MoodOption[] = [
  ...MOOD_OPTIONS,
  {
    value: "CALM",
    emoji: "😌",
    label: "Calm",
    colorClass: "border-blue-300 dark:border-blue-700",
    bgClass: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    value: "ANXIOUS",
    emoji: "😟",
    label: "Anxious",
    colorClass: "border-orange-300 dark:border-orange-700",
    bgClass: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    value: "FEARFUL",
    emoji: "😨",
    label: "Fearful",
    colorClass: "border-red-400 dark:border-red-800",
    bgClass: "bg-red-100 dark:bg-red-900/30",
  },
  {
    value: "GREEDY",
    emoji: "🤑",
    label: "Greedy",
    colorClass: "border-yellow-300 dark:border-yellow-700",
    bgClass: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  {
    value: "HOPEFUL",
    emoji: "🙏",
    label: "Hopeful",
    colorClass: "border-cyan-300 dark:border-cyan-700",
    bgClass: "bg-cyan-100 dark:bg-cyan-900/30",
  },
  {
    value: "FRUSTRATED",
    emoji: "😤",
    label: "Frustrated",
    colorClass: "border-rose-300 dark:border-rose-700",
    bgClass: "bg-rose-100 dark:bg-rose-900/30",
  },
  {
    value: "RELIEVED",
    emoji: "😮‍💨",
    label: "Relieved",
    colorClass: "border-teal-300 dark:border-teal-700",
    bgClass: "bg-teal-100 dark:bg-teal-900/30",
  },
  {
    value: "REGRETFUL",
    emoji: "😔",
    label: "Regretful",
    colorClass: "border-indigo-300 dark:border-indigo-700",
    bgClass: "bg-indigo-100 dark:bg-indigo-900/30",
  },
  {
    value: "DISCIPLINED",
    emoji: "🎯",
    label: "Disciplined",
    colorClass: "border-emerald-300 dark:border-emerald-700",
    bgClass: "bg-emerald-100 dark:bg-emerald-900/30",
  },
];

interface MoodSelectorProps {
  value?: MoodValue | null;
  onChange: (value: MoodValue) => void;
  variant?: "compact" | "expanded";
  className?: string;
}

export function MoodSelector({
  value,
  onChange,
  variant = "compact",
  className,
}: MoodSelectorProps) {
  const options = variant === "expanded" ? EXTENDED_MOOD_OPTIONS : MOOD_OPTIONS;

  return (
    <div
      className={cn(
        "flex gap-2",
        variant === "expanded"
          ? "flex-wrap justify-center"
          : "justify-center overflow-x-auto",
        className
      )}
      role="radiogroup"
      aria-label="Select mood"
    >
      {options.map((mood) => {
        const isSelected = value === mood.value;

        return (
          <button
            key={mood.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(mood.value)}
            className={cn(
              // Base - ensure minimum 44x44px touch targets (WCAG 2.1 AA)
              "flex flex-col items-center justify-center",
              variant === "compact" ? "min-w-[64px] min-h-[80px] w-16 h-20" : "min-w-[56px] min-h-[64px] w-14 h-16",
              "rounded-2xl",
              "border-2 transition-all duration-200",

              // Selected state
              isSelected
                ? cn(mood.bgClass, mood.colorClass, "scale-105 shadow-md")
                : cn(
                    "bg-white dark:bg-slate-800/50",
                    "border-slate-200 dark:border-slate-700",
                    "hover:border-slate-300 dark:hover:border-slate-600"
                  ),

              // Interaction
              "active:scale-95",
              "focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            )}
          >
            <span
              className={cn(
                "transition-transform duration-200",
                variant === "compact" ? "text-2xl mb-1" : "text-xl mb-0.5",
                isSelected && "scale-110"
              )}
            >
              {mood.emoji}
            </span>
            <span
              className={cn(
                "font-medium text-slate-600 dark:text-slate-400",
                variant === "compact" ? "text-xs" : "text-[10px]"
              )}
            >
              {mood.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Helper to get mood emoji by value
export function getMoodEmoji(mood: MoodValue | string | null): string {
  if (!mood) return "😐";
  const option = EXTENDED_MOOD_OPTIONS.find((m) => m.value === mood);
  return option?.emoji || "😐";
}

// Helper to get mood label by value
export function getMoodLabel(mood: MoodValue | string | null): string {
  if (!mood) return "Neutral";
  const option = EXTENDED_MOOD_OPTIONS.find((m) => m.value === mood);
  return option?.label || "Neutral";
}

export { MOOD_OPTIONS, EXTENDED_MOOD_OPTIONS };
