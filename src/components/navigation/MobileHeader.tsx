"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Settings, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  onSearchOpen: () => void;
}

export function MobileHeader({ onSearchOpen }: MobileHeaderProps) {
  const pathname = usePathname();

  // Hide on public/unauthenticated pages
  if (
    pathname === "/login" ||
    pathname === "/offline" ||
    pathname?.startsWith("/share/")
  ) {
    return null;
  }

  return (
    <div className="sticky top-0 z-30 md:hidden pt-safe">
      <div
        className={cn(
          "flex items-center justify-between h-11 px-4",
          "bg-white/90 dark:bg-slate-900/90",
          "backdrop-blur-xl",
          "border-b border-slate-200/20 dark:border-white/5"
        )}
      >
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Trader Journal
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={onSearchOpen}
            className={cn(
              "p-2 rounded-lg",
              "text-slate-500 dark:text-slate-400",
              "hover:bg-slate-100 dark:hover:bg-slate-800",
              "active:scale-90 transition-all duration-150"
            )}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          <Link
            href="/insights"
            className={cn(
              "p-2 rounded-lg",
              "hover:bg-slate-100 dark:hover:bg-slate-800",
              "active:scale-90 transition-all duration-150",
              pathname.startsWith("/insights")
                ? "text-amber-500"
                : "text-slate-500 dark:text-slate-400"
            )}
            aria-label="Insights"
          >
            <BarChart3 className="h-5 w-5" />
          </Link>

          <Link
            href="/settings"
            className={cn(
              "p-2 rounded-lg",
              "hover:bg-slate-100 dark:hover:bg-slate-800",
              "active:scale-90 transition-all duration-150",
              pathname.startsWith("/settings")
                ? "text-amber-500"
                : "text-slate-500 dark:text-slate-400"
            )}
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
