"use client";

import * as React from "react";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  onClick: () => void;
  className?: string;
  variant?: "icon" | "default";
  disabled?: boolean;
}

export function ShareButton({
  onClick,
  className,
  variant = "icon",
  disabled = false,
}: ShareButtonProps) {
  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }}
        disabled={disabled}
        className={cn(
          "p-2 rounded-xl",
          "bg-slate-100 dark:bg-slate-700",
          "transition-all duration-200",
          "hover:bg-blue-100 hover:text-blue-600",
          "dark:hover:bg-blue-900/30 dark:hover:text-blue-400",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
          "min-h-[44px] min-w-[44px] flex items-center justify-center",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        aria-label="Share entry"
      >
        <Share2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <Button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      variant="outline"
      className={cn("min-h-[44px]", className)}
    >
      <Share2 className="h-4 w-4 mr-2" />
      Share
    </Button>
  );
}
