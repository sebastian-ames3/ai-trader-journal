"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Sun, Moon, TrendingUp, BookOpen, ChevronRight } from "lucide-react";

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  gradient: string;
  iconBg: string;
  className?: string;
}

function ActionCard({
  title,
  description,
  icon,
  href,
  gradient,
  iconBg,
  className,
}: ActionCardProps) {
  return (
    <Link href={href}>
      <div
        className={cn(
          // Base
          "relative overflow-hidden",
          "rounded-2xl p-4",
          "bg-gradient-to-br",
          gradient,

          // Border & shadow
          "border border-white/20 dark:border-slate-700/30",
          "shadow-sm",

          // Interaction
          "transition-all duration-200",
          "hover:shadow-md hover:scale-[1.02]",
          "active:scale-[0.98]",

          className
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              "flex items-center justify-center",
              "w-10 h-10 rounded-xl",
              iconBg
            )}
          >
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {description}
            </p>
          </div>

          {/* Arrow */}
          <ChevronRight className="h-5 w-5 text-slate-400 dark:text-slate-500 mt-2" />
        </div>
      </div>
    </Link>
  );
}

// Pre-configured action cards
export function MorningReflectionCard({ className }: { className?: string }) {
  return (
    <ActionCard
      title="Morning Mindset"
      description="Set your intentions and review your game plan"
      icon={<Sun className="h-5 w-5 text-amber-600" />}
      href="/journal/new?type=REFLECTION"
      gradient="from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30"
      iconBg="bg-amber-100 dark:bg-amber-900/50"
      className={className}
    />
  );
}

export function EveningReviewCard({ className }: { className?: string }) {
  return (
    <ActionCard
      title="Evening Review"
      description="Reflect on today's decisions and lessons learned"
      icon={<Moon className="h-5 w-5 text-indigo-600" />}
      href="/journal/new?type=REFLECTION"
      gradient="from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30"
      iconBg="bg-indigo-100 dark:bg-indigo-900/50"
      className={className}
    />
  );
}

export function TradeIdeaCard({ className }: { className?: string }) {
  return (
    <ActionCard
      title="New Idea"
      description="Document your thesis and analysis"
      icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
      href="/journal/new?type=IDEA"
      gradient="from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30"
      iconBg="bg-emerald-100 dark:bg-emerald-900/50"
      className={className}
    />
  );
}

export function QuickObservationCard({ className }: { className?: string }) {
  return (
    <ActionCard
      title="Quick Observation"
      description="Note something interesting in the market"
      icon={<BookOpen className="h-5 w-5 text-blue-600" />}
      href="/journal/new?type=OBSERVATION"
      gradient="from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30"
      iconBg="bg-blue-100 dark:bg-blue-900/50"
      className={className}
    />
  );
}

// Grid container for action cards
export function ActionCardsGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3", className)}>
      {children}
    </div>
  );
}

// Time-aware action cards that show morning or evening based on time
export function TimeAwareActionCards({ className }: { className?: string }) {
  const hour = new Date().getHours();
  const isMorning = hour >= 5 && hour < 12;
  const isEvening = hour >= 17 || hour < 5;

  return (
    <ActionCardsGrid className={className}>
      {isMorning ? (
        <>
          <MorningReflectionCard />
          <TradeIdeaCard />
        </>
      ) : isEvening ? (
        <>
          <EveningReviewCard />
          <QuickObservationCard />
        </>
      ) : (
        <>
          <TradeIdeaCard />
          <QuickObservationCard />
        </>
      )}
    </ActionCardsGrid>
  );
}
