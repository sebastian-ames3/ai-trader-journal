"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EntryCard } from "@/components/ui/entry-card";

type EntryType = "TRADE_IDEA" | "TRADE" | "REFLECTION" | "OBSERVATION";

interface SwipeableEntryCardProps {
  id: string;
  content: string;
  type: EntryType;
  ticker?: string | null;
  mood?: string | null;
  conviction?: string | null;
  createdAt: Date | string;
  thesisName?: string | null;
  onEdit: () => void;
  onDelete?: () => void;
  className?: string;
}

const SWIPE_THRESHOLD = 60;
const MAX_SWIPE = 80;

export function SwipeableEntryCard({
  id,
  content,
  type,
  ticker,
  mood,
  conviction,
  createdAt,
  thesisName,
  onEdit,
  onDelete,
  className,
}: SwipeableEntryCardProps) {
  const x = useMotionValue(0);

  // Transform for background color indicators
  const leftBgOpacity = useTransform(x, [0, MAX_SWIPE], [0, 1]);
  const rightBgOpacity = useTransform(x, [-MAX_SWIPE, 0], [1, 0]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;

    if (offset > SWIPE_THRESHOLD) {
      // Swiped right - Edit
      onEdit();
      // Reset after a short delay
      setTimeout(() => {
        x.set(0);
      }, 300);
    } else if (offset < -SWIPE_THRESHOLD && onDelete) {
      // Swiped left - Delete
      onDelete();
      // Reset after a short delay
      setTimeout(() => {
        x.set(0);
      }, 300);
    } else {
      // Reset position
      x.set(0);
    }
  };

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      {/* Background actions */}
      <div className="absolute inset-0 flex">
        {/* Edit action (swipe right) */}
        <motion.div
          className="flex-1 flex items-center justify-start pl-6 bg-amber-500"
          style={{ opacity: leftBgOpacity }}
        >
          <div className="flex items-center gap-2 text-white font-medium">
            <Pencil className="h-5 w-5" />
            <span className="text-sm">Edit</span>
          </div>
        </motion.div>

        {/* Delete action (swipe left) */}
        {onDelete && (
          <motion.div
            className="flex-1 flex items-center justify-end pr-6 bg-red-500"
            style={{ opacity: rightBgOpacity }}
          >
            <div className="flex items-center gap-2 text-white font-medium">
              <span className="text-sm">Delete</span>
              <Trash2 className="h-5 w-5" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Swipeable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: onDelete ? -MAX_SWIPE : 0, right: MAX_SWIPE }}
        dragElastic={0.1}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className="relative touch-pan-y"
        whileTap={{ cursor: "grabbing" }}
      >
        <EntryCard
          id={id}
          content={content}
          type={type}
          ticker={ticker}
          mood={mood}
          conviction={conviction}
          createdAt={createdAt}
          thesisName={thesisName}
          onEdit={onEdit}
        />
      </motion.div>

      {/* Swipe hint indicator (shown briefly on first render or on long entries) */}
      <div
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none",
          "text-slate-400 dark:text-slate-500 text-xs",
          "opacity-0 transition-opacity duration-300",
          "md:hidden" // Only show on mobile
        )}
      >
        {/* Hint hidden by default */}
      </div>
    </div>
  );
}
