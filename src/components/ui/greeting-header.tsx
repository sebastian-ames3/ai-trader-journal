"use client";

import * as React from "react";
import { format } from "date-fns";
import { Sun, Moon, Sunset, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

interface GreetingHeaderProps {
  userName?: string;
  className?: string;
}

function getTimeOfDay(): {
  greeting: string;
  icon: React.ReactNode;
  gradientClass: string;
} {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return {
      greeting: "Good Morning",
      icon: <Coffee className="h-6 w-6 text-amber-500" />,
      gradientClass: "from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20",
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      greeting: "Good Afternoon",
      icon: <Sun className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />,
      gradientClass: "from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20",
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      greeting: "Good Evening",
      icon: <Sunset className="h-6 w-6 text-orange-600 dark:text-orange-400" />,
      gradientClass: "from-orange-50 to-rose-50 dark:from-orange-950/20 dark:to-rose-950/20",
    };
  } else {
    return {
      greeting: "Good Night",
      icon: <Moon className="h-6 w-6 text-indigo-400" />,
      gradientClass: "from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20",
    };
  }
}

export function GreetingHeader({ userName, className }: GreetingHeaderProps) {
  const [mounted, setMounted] = React.useState(false);
  const [timeData, setTimeData] = React.useState(getTimeOfDay);

  React.useEffect(() => {
    setMounted(true);
    setTimeData(getTimeOfDay());

    // Update every minute
    const interval = setInterval(() => {
      setTimeData(getTimeOfDay());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={cn("px-4 py-6", className)}>
        <div className="h-8 w-48 skeleton rounded" />
        <div className="h-5 w-32 skeleton rounded mt-2" />
      </div>
    );
  }

  const today = new Date();

  return (
    <div
      className={cn(
        "px-4 py-6 pt-safe",
        "bg-gradient-to-br",
        timeData.gradientClass,
        "border-b border-slate-200/30 dark:border-slate-700/30",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          {timeData.icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {timeData.greeting}
            {userName && (
              <span className="text-amber-500">, {userName}</span>
            )}
            {!userName && "!"}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {format(today, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
      </div>
    </div>
  );
}

// Compact version for pages other than dashboard
export function GreetingHeaderCompact({ className }: { className?: string }) {
  const [mounted, setMounted] = React.useState(false);
  const timeData = getTimeOfDay();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      {timeData.icon}
      <span className="text-slate-600 dark:text-slate-400">
        {format(new Date(), "EEEE, MMMM d")}
      </span>
    </div>
  );
}

// Simple greeting for the simplified homepage
export function SimpleGreeting({ className }: { className?: string }) {
  const [mounted, setMounted] = React.useState(false);
  const [greeting, setGreeting] = React.useState("Good Morning");

  React.useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Good Morning");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good Afternoon");
    } else if (hour >= 17 && hour < 21) {
      setGreeting("Good Evening");
    } else {
      setGreeting("Good Night");
    }

    // Update every minute
    const interval = setInterval(() => {
      const h = new Date().getHours();
      if (h >= 5 && h < 12) {
        setGreeting("Good Morning");
      } else if (h >= 12 && h < 17) {
        setGreeting("Good Afternoon");
      } else if (h >= 17 && h < 21) {
        setGreeting("Good Evening");
      } else {
        setGreeting("Good Night");
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("px-4 py-8", className)}>
        <div className="h-12 w-64 skeleton rounded" />
      </div>
    );
  }

  return (
    <div className={cn("px-4 py-8", className)}>
      <h1 className="text-3xl md:text-4xl font-serif italic text-slate-900 dark:text-white">
        {greeting},<br />
        Trader.
      </h1>
    </div>
  );
}
