"use client";

import * as React from "react";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  isSameDay,
  addWeeks,
  subWeeks,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarWeekStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  entryCounts?: Record<string, number>; // ISO date string -> count
  className?: string;
}

export function CalendarWeekStrip({
  selectedDate,
  onSelectDate,
  entryCounts = {},
  className,
}: CalendarWeekStripProps) {
  const [weekStart, setWeekStart] = React.useState(() =>
    startOfWeek(selectedDate, { weekStartsOn: 1 }) // Start on Monday
  );

  const weekDays = React.useMemo(() => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [weekStart]);

  const goToPrevWeek = () => {
    setWeekStart((prev) => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setWeekStart((prev) => addWeeks(prev, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
    onSelectDate(today);
  };

  return (
    <div className={cn("bg-white dark:bg-slate-900", className)}>
      {/* Week navigation header */}
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={goToPrevWeek}
          className={cn(
            "h-8 w-8 rounded-full",
            "flex items-center justify-center",
            "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
            "hover:bg-slate-100 dark:hover:bg-slate-800",
            "transition-colors duration-200"
          )}
          aria-label="Previous week"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          onClick={goToToday}
          className={cn(
            "text-sm font-medium",
            "text-slate-600 dark:text-slate-400",
            "hover:text-amber-500 dark:hover:text-amber-400",
            "transition-colors duration-200"
          )}
        >
          {format(weekStart, "MMMM yyyy")}
        </button>

        <button
          onClick={goToNextWeek}
          className={cn(
            "h-8 w-8 rounded-full",
            "flex items-center justify-center",
            "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
            "hover:bg-slate-100 dark:hover:bg-slate-800",
            "transition-colors duration-200"
          )}
          aria-label="Next week"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Days strip */}
      <div className="flex items-center justify-between px-2 py-3">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const dateKey = format(day, "yyyy-MM-dd");
          const hasEntries = (entryCounts[dateKey] || 0) > 0;

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(day)}
              className={cn(
                "flex flex-col items-center justify-center",
                "w-10 h-14 rounded-xl",
                "transition-all duration-200",
                "relative",

                // Today with amber highlight
                isTodayDate &&
                  !isSelected &&
                  "bg-amber-100 dark:bg-amber-900/30",

                // Selected state
                isSelected &&
                  cn(
                    "bg-amber-500 text-white",
                    "shadow-lg shadow-amber-500/30"
                  ),

                // Not selected, not today
                !isSelected &&
                  !isTodayDate &&
                  "hover:bg-slate-100 dark:hover:bg-slate-800",

                // Active state
                "active:scale-95"
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium",
                  isSelected
                    ? "text-white/80"
                    : isTodayDate
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-slate-400 dark:text-slate-500"
                )}
              >
                {format(day, "EEE").slice(0, 3)}
              </span>
              <span
                className={cn(
                  "text-lg font-semibold mt-0.5",
                  isSelected
                    ? "text-white"
                    : isTodayDate
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-slate-700 dark:text-slate-300"
                )}
              >
                {format(day, "d")}
              </span>

              {/* Entry indicator dot */}
              {hasEntries && !isSelected && (
                <div
                  className={cn(
                    "absolute bottom-1 left-1/2 -translate-x-1/2",
                    "w-1 h-1 rounded-full",
                    isTodayDate
                      ? "bg-amber-500"
                      : "bg-slate-400 dark:bg-slate-500"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function CalendarWeekStripCompact({
  selectedDate,
  onSelectDate,
  className,
}: Omit<CalendarWeekStripProps, "entryCounts">) {
  const weekDays = React.useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [selectedDate]);

  return (
    <div className={cn("flex items-center justify-between gap-1", className)}>
      {weekDays.map((day) => {
        const isSelected = isSameDay(day, selectedDate);
        const isTodayDate = isToday(day);
        const dateKey = format(day, "yyyy-MM-dd");

        return (
          <button
            key={dateKey}
            onClick={() => onSelectDate(day)}
            className={cn(
              "flex flex-col items-center justify-center",
              "w-8 h-10 rounded-lg",
              "transition-all duration-200",
              isSelected && "bg-amber-500 text-white",
              isTodayDate && !isSelected && "bg-amber-100 dark:bg-amber-900/30",
              !isSelected &&
                !isTodayDate &&
                "hover:bg-slate-100 dark:hover:bg-slate-800",
              "active:scale-95"
            )}
          >
            <span
              className={cn(
                "text-[10px] font-medium",
                isSelected
                  ? "text-white/80"
                  : "text-slate-400 dark:text-slate-500"
              )}
            >
              {format(day, "EEEEE")}
            </span>
            <span
              className={cn(
                "text-sm font-semibold",
                isSelected ? "text-white" : "text-slate-700 dark:text-slate-300"
              )}
            >
              {format(day, "d")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
