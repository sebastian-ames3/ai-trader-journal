"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

interface Quote {
  text: string;
  author: string;
}

const TRADING_QUOTES: Quote[] = [
  {
    text: "The market is a device for transferring money from the impatient to the patient.",
    author: "Warren Buffett",
  },
  {
    text: "In trading, the impossible happens about twice a year.",
    author: "Ed Seykota",
  },
  {
    text: "The goal of a successful trader is to make the best trades. Money is secondary.",
    author: "Alexander Elder",
  },
  {
    text: "It's not whether you're right or wrong that's important, but how much money you make when you're right.",
    author: "George Soros",
  },
  {
    text: "The key to trading success is emotional discipline. If intelligence were the key, there would be a lot more people making money.",
    author: "Victor Sperandeo",
  },
  {
    text: "Risk comes from not knowing what you're doing.",
    author: "Warren Buffett",
  },
  {
    text: "The trend is your friend until it ends.",
    author: "Ed Seykota",
  },
  {
    text: "Markets can remain irrational longer than you can remain solvent.",
    author: "John Maynard Keynes",
  },
  {
    text: "Win or lose, everybody gets what they want out of the market.",
    author: "Ed Seykota",
  },
  {
    text: "The market does not beat them. They beat themselves.",
    author: "Jesse Livermore",
  },
  {
    text: "Never invest in anything you don't understand.",
    author: "Warren Buffett",
  },
  {
    text: "All the math you need in the stock market you get in the fourth grade.",
    author: "Peter Lynch",
  },
  {
    text: "Plan your trade and trade your plan.",
    author: "Trading Wisdom",
  },
  {
    text: "Cut your losses short and let your winners run.",
    author: "Trading Wisdom",
  },
  {
    text: "Be fearful when others are greedy and greedy when others are fearful.",
    author: "Warren Buffett",
  },
];

function getQuoteOfTheDay(): Quote {
  // Use date-based seeding for consistent daily quote
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = dayOfYear % TRADING_QUOTES.length;
  return TRADING_QUOTES[index];
}

interface QuoteCardProps {
  className?: string;
}

export function QuoteCard({ className }: QuoteCardProps) {
  const [quote, setQuote] = React.useState<Quote>(getQuoteOfTheDay);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Get a random quote different from current
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * TRADING_QUOTES.length);
    } while (TRADING_QUOTES[newIndex].text === quote.text);

    setTimeout(() => {
      setQuote(TRADING_QUOTES[newIndex]);
      setIsRefreshing(false);
    }, 300);
  };

  return (
    <div
      className={cn(
        // Base
        "relative overflow-hidden",
        "rounded-2xl p-5",

        // Gradient background
        "bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50",
        "dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-800/50",

        // Border
        "border border-slate-200/50 dark:border-slate-700/50",

        className
      )}
    >
      {/* Decorative quote mark */}
      <div
        className={cn(
          "absolute -top-2 -left-2",
          "text-6xl font-serif",
          "text-slate-200 dark:text-slate-700/50",
          "pointer-events-none select-none"
        )}
      >
        &ldquo;
      </div>

      {/* Content */}
      <div className="relative">
        <blockquote className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-3 pl-4">
          {quote.text}
        </blockquote>

        <div className="flex items-center justify-between pl-4">
          <cite className="text-xs text-slate-500 dark:text-slate-400 not-italic">
            &mdash; {quote.author}
          </cite>

          <button
            onClick={handleRefresh}
            className={cn(
              "p-2 rounded-lg",
              "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
              "hover:bg-slate-100 dark:hover:bg-slate-700/50",
              "transition-all duration-200",
              "active:scale-95"
            )}
            title="New quote"
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function QuoteCardCompact({ className }: { className?: string }) {
  const quote = getQuoteOfTheDay();

  return (
    <div
      className={cn(
        "p-3 rounded-xl",
        "bg-slate-50 dark:bg-slate-800/50",
        "border border-slate-200/50 dark:border-slate-700/50",
        className
      )}
    >
      <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-2">
        &ldquo;{quote.text}&rdquo;
      </p>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
        &mdash; {quote.author}
      </p>
    </div>
  );
}
