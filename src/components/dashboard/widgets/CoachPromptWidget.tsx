'use client';

import * as React from 'react';
import Link from 'next/link';
import { MessageCircle, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CoachPromptWidgetProps {
  prompt?: string;
  category?: string;
  onRefresh?: () => void;
  onStartChat?: () => void;
  className?: string;
}

// Coaching prompts by category
const PROMPTS: Record<string, string[]> = {
  mindset: [
    "What's your emotional state before entering this trade?",
    "How would you feel if this trade went against you right now?",
    "Are you trading your plan or reacting to the market?",
    "What's driving your conviction on this position?",
  ],
  reflection: [
    "What did you learn from your last trade?",
    "How well did you follow your rules this week?",
    "What patterns are you noticing in your behavior?",
    "When do you tend to make your best decisions?",
  ],
  preTrading: [
    "What's your thesis for this trade in one sentence?",
    "What would make you exit this position early?",
    "Is this position size appropriate for your conviction?",
    "Have you checked your current portfolio exposure?",
  ],
  review: [
    "Looking back, what would you do differently?",
    "What was your emotional state during the trade?",
    "Did you stick to your exit plan?",
    "What did the market teach you today?",
  ],
};

export function CoachPromptWidget({
  prompt,
  category = 'mindset',
  onRefresh,
  onStartChat,
  className,
}: CoachPromptWidgetProps) {
  const [currentPrompt, setCurrentPrompt] = React.useState(prompt);
  const [currentCategory, setCurrentCategory] = React.useState(category);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Initialize prompt if not provided
  React.useEffect(() => {
    if (!currentPrompt) {
      const categoryPrompts = PROMPTS[currentCategory] || PROMPTS.mindset;
      const randomPrompt = categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];
      setCurrentPrompt(randomPrompt);
    }
  }, [currentPrompt, currentCategory]);

  const handleRefresh = async () => {
    setIsRefreshing(true);

    // Rotate to next category
    const categories = Object.keys(PROMPTS);
    const currentIndex = categories.indexOf(currentCategory);
    const nextCategory = categories[(currentIndex + 1) % categories.length];
    setCurrentCategory(nextCategory);

    // Get random prompt from new category
    const categoryPrompts = PROMPTS[nextCategory];
    const randomPrompt = categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];
    setCurrentPrompt(randomPrompt);

    if (onRefresh) {
      await onRefresh();
    }

    setIsRefreshing(false);
  };

  const getCategoryLabel = (cat: string): string => {
    const labels: Record<string, string> = {
      mindset: 'Mindset Check',
      reflection: 'Reflection',
      preTrading: 'Pre-Trade',
      review: 'Review',
    };
    return labels[cat] || 'Prompt';
  };

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            AI Coach
          </h3>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
          {getCategoryLabel(currentCategory)}
        </span>
      </div>

      {/* Prompt Card */}
      <div
        className={cn(
          'flex-1 p-4 rounded-xl',
          'bg-gradient-to-br from-purple-50 to-indigo-50',
          'dark:from-purple-950/30 dark:to-indigo-950/30',
          'border border-purple-100 dark:border-purple-800/30',
          'flex flex-col'
        )}
      >
        <div className="flex items-start gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {currentPrompt || 'Loading prompt...'}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              'flex-1 min-h-[40px]',
              'bg-white/50 dark:bg-slate-800/50',
              'hover:bg-purple-100 hover:border-purple-200',
              'dark:hover:bg-purple-900/30 dark:hover:border-purple-700'
            )}
          >
            <RefreshCw
              className={cn('h-4 w-4 mr-1', isRefreshing && 'animate-spin')}
            />
            New Prompt
          </Button>
          {onStartChat ? (
            <Button
              size="sm"
              onClick={onStartChat}
              className={cn(
                'flex-1 min-h-[40px]',
                'bg-purple-600 hover:bg-purple-700',
                'text-white'
              )}
            >
              Respond
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Link href="/journal/new" className="flex-1">
              <Button
                size="sm"
                className={cn(
                  'w-full min-h-[40px]',
                  'bg-purple-600 hover:bg-purple-700',
                  'text-white'
                )}
              >
                Respond
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// Skeleton for loading
export function CoachPromptWidgetSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-20 skeleton rounded" />
        <div className="h-5 w-24 skeleton rounded-full" />
      </div>
      <div className="flex-1 p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/10">
        <div className="flex items-start gap-2 mb-3">
          <div className="h-5 w-5 skeleton rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-full skeleton rounded" />
            <div className="h-4 w-4/5 skeleton rounded" />
          </div>
        </div>
        <div className="flex gap-2 mt-auto">
          <div className="flex-1 h-10 skeleton rounded" />
          <div className="flex-1 h-10 skeleton rounded" />
        </div>
      </div>
    </div>
  );
}
