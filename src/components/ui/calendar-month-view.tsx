"use client";

import * as React from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarMonthViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  entryCounts?: Record<string, number>; // ISO date string -> count
  className?: string;
  onMonthChange?: (date: Date) => void;
}

export function CalendarMonthView({
  selectedDate,
  onSelectDate,
  entryCounts = {},
  className,
  onMonthChange,
}: CalendarMonthViewProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => selectedDate);

  // Generate all days to display (including padding days from adjacent months)
  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const goToPrevMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onSelectDate(today);
    onMonthChange?.(today);
  };

  // Update current month when selectedDate changes externally
  React.useEffect(() => {
    if (!isSameMonth(selectedDate, currentMonth)) {
      setCurrentMonth(selectedDate);
    }
  }, [selectedDate, currentMonth]);

  const weekDayHeaders = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className={cn("bg-slate-900", className)}>
      {/* Month navigation header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={goToPrevMonth}
          className={cn(
            "h-10 w-10 rounded-full",
            "flex items-center justify-center",
            "text-slate-400 hover:text-slate-200",
            "hover:bg-slate-800",
            "transition-colors duration-200",
            "active:scale-95"
          )}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          onClick={goToToday}
          className={cn(
            "text-lg font-bold tracking-wide",
            "text-slate-100",
            "hover:text-amber-400",
            "transition-colors duration-200",
            "uppercase"
          )}
        >
          {format(currentMonth, "MMMM yyyy")}
        </button>

        <button
          onClick={goToNextMonth}
          className={cn(
            "h-10 w-10 rounded-full",
            "flex items-center justify-center",
            "text-slate-400 hover:text-slate-200",
            "hover:bg-slate-800",
            "transition-colors duration-200",
            "active:scale-95"
          )}
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 px-2 pb-2">
        {weekDayHeaders.map((day, index) => (
          <div
            key={index}
            className="flex items-center justify-center h-8 text-sm font-medium text-slate-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 px-2 pb-4 gap-y-1">
        {calendarDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const dateKey = format(day, "yyyy-MM-dd");
          const entryCount = entryCounts[dateKey] || 0;
          const hasEntries = entryCount > 0;

          return (
            <button
              key={dateKey}
              onClick={() => {
                // If clicking on a date outside current month, navigate to that month
                if (!isCurrentMonth) {
                  setCurrentMonth(day);
                  onMonthChange?.(day);
                }
                onSelectDate(day);
              }}
              className={cn(
                "flex flex-col items-center justify-center",
                "h-11 rounded-full",
                "transition-all duration-200",
                "relative",

                // Outside current month - dimmed but clickable
                !isCurrentMonth && "opacity-40 hover:opacity-60",

                // Selected state - circle highlight
                isSelected && isCurrentMonth && cn(
                  "bg-amber-500 text-slate-900",
                  "font-bold"
                ),

                // Today (not selected)
                isTodayDate && !isSelected && isCurrentMonth && "ring-2 ring-amber-500 ring-inset",

                // Has entries - bold text
                hasEntries && !isSelected && isCurrentMonth && "font-bold text-slate-100",

                // Default text color
                !isSelected && !hasEntries && isCurrentMonth && "text-slate-400",

                // Hover states
                !isSelected && isCurrentMonth && "hover:bg-slate-800",

                // Active state
                "active:scale-95"
              )}
            >
              <span className={cn(
                "text-sm",
                isSelected && isCurrentMonth && "text-slate-900"
              )}>
                {format(day, "d")}
              </span>

              {/* Entry indicator dot */}
              {hasEntries && isCurrentMonth && (
                <div
                  className={cn(
                    "absolute -bottom-0.5 left-1/2 -translate-x-1/2",
                    "w-1 h-1 rounded-full",
                    isSelected ? "bg-slate-900" : "bg-amber-500"
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

// Compact header showing selected date entries info
interface CalendarSelectedDateHeaderProps {
  selectedDate: Date;
  entryCount: number;
  className?: string;
}

export function CalendarSelectedDateHeader({
  selectedDate,
  entryCount,
  className,
}: CalendarSelectedDateHeaderProps) {
  return (
    <div className={cn(
      "px-4 py-3 bg-slate-800/50 border-t border-slate-700",
      className
    )}>
      <h3 className="text-lg font-semibold text-slate-100">
        Entries for {format(selectedDate, "MMM d")}
        {entryCount > 0 && (
          <span className="ml-2 text-amber-500">({entryCount})</span>
        )}
      </h3>
    </div>
  );
}
