'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className={cn(
          "flex items-center justify-center w-[44px] h-[44px]",
          "rounded-xl bg-slate-100 dark:bg-slate-800",
          "transition-colors",
          className
        )}
      >
        <div className="w-5 h-5 skeleton rounded" />
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        "flex items-center justify-center w-[44px] h-[44px]",
        "rounded-xl transition-all duration-200",
        "active:scale-95",
        isDark
          ? "bg-slate-800 hover:bg-slate-700 text-amber-400"
          : "bg-slate-100 hover:bg-slate-200 text-amber-600",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
