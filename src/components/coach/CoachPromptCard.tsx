'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain,
  TrendingDown,
  Clock,
  AlertTriangle,
  Target,
  Lightbulb,
  X,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Prompt trigger types
type PromptTrigger =
  | 'MARKET_STRESS'
  | 'SILENCE_DETECTED'
  | 'STREAK_MILESTONE'
  | 'BIAS_DETECTED'
  | 'PRE_TRADE_CHECK'
  | 'WEEKLY_REVIEW'
  | 'PATTERN_INSIGHT';

interface CoachPromptCardProps {
  id: string;
  trigger: PromptTrigger;
  title: string;
  message: string;
  actionText?: string;
  onChat?: () => void;
  onDismiss?: (id: string) => void;
  className?: string;
}

// Trigger configuration
const TRIGGER_CONFIG: Record<
  PromptTrigger,
  {
    icon: React.ElementType;
    iconColor: string;
    bgGradient: string;
    borderColor: string;
  }
> = {
  MARKET_STRESS: {
    icon: TrendingDown,
    iconColor: 'text-red-600 dark:text-red-400',
    bgGradient: 'from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20',
    borderColor: 'border-red-200/50 dark:border-red-800/30',
  },
  SILENCE_DETECTED: {
    icon: Clock,
    iconColor: 'text-amber-600 dark:text-amber-400',
    bgGradient: 'from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20',
    borderColor: 'border-amber-200/50 dark:border-amber-800/30',
  },
  STREAK_MILESTONE: {
    icon: Target,
    iconColor: 'text-green-600 dark:text-green-400',
    bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
    borderColor: 'border-green-200/50 dark:border-green-800/30',
  },
  BIAS_DETECTED: {
    icon: AlertTriangle,
    iconColor: 'text-orange-600 dark:text-orange-400',
    bgGradient: 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
    borderColor: 'border-orange-200/50 dark:border-orange-800/30',
  },
  PRE_TRADE_CHECK: {
    icon: Brain,
    iconColor: 'text-purple-600 dark:text-purple-400',
    bgGradient: 'from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20',
    borderColor: 'border-purple-200/50 dark:border-purple-800/30',
  },
  WEEKLY_REVIEW: {
    icon: Lightbulb,
    iconColor: 'text-blue-600 dark:text-blue-400',
    bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
    borderColor: 'border-blue-200/50 dark:border-blue-800/30',
  },
  PATTERN_INSIGHT: {
    icon: Lightbulb,
    iconColor: 'text-teal-600 dark:text-teal-400',
    bgGradient: 'from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20',
    borderColor: 'border-teal-200/50 dark:border-teal-800/30',
  },
};

export default function CoachPromptCard({
  id,
  trigger,
  title,
  message,
  actionText = 'Chat Now',
  onChat,
  onDismiss,
  className,
}: CoachPromptCardProps) {
  const router = useRouter();
  const [isDismissing, setIsDismissing] = useState(false);

  const config = TRIGGER_CONFIG[trigger];
  const TriggerIcon = config.icon;

  const handleChat = () => {
    if (onChat) {
      onChat();
    } else {
      // Default: navigate to coach page with context
      router.push(`/coach?prompt=${encodeURIComponent(message)}`);
    }
  };

  const handleDismiss = () => {
    setIsDismissing(true);
    // Allow animation to complete before calling onDismiss
    setTimeout(() => {
      onDismiss?.(id);
    }, 200);
  };

  return (
    <div
      className={cn(
        // Base styles
        'relative overflow-hidden',
        'rounded-2xl p-4',

        // Gradient background
        'bg-gradient-to-br',
        config.bgGradient,

        // Border
        'border',
        config.borderColor,

        // Shadow
        'shadow-sm',

        // Animation
        'transition-all duration-200',
        isDismissing && 'opacity-0 scale-95',

        className
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className={cn(
          'absolute top-3 right-3 z-10',
          'p-2 rounded-full',
          'bg-white/50 dark:bg-slate-800/50',
          'hover:bg-white dark:hover:bg-slate-800',
          'transition-colors',
          'min-h-[44px] min-w-[44px]',
          'flex items-center justify-center'
        )}
        aria-label="Dismiss prompt"
      >
        <X className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      </button>

      <div className="flex gap-4">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0',
            'w-12 h-12 rounded-xl',
            'bg-white/70 dark:bg-slate-800/70',
            'flex items-center justify-center',
            'shadow-sm'
          )}
        >
          <TriggerIcon className={cn('h-6 w-6', config.iconColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-8">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
            {title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
            {message}
          </p>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleChat}
              size="sm"
              className={cn(
                'min-h-[40px] px-4',
                'bg-amber-500 hover:bg-amber-600',
                'text-white'
              )}
            >
              <MessageCircle className="h-4 w-4 mr-1.5" />
              {actionText}
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="min-h-[40px] px-4 text-slate-600 dark:text-slate-400"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for lists
export function CoachPromptBanner({
  id,
  trigger,
  message,
  onChat,
  onDismiss,
  className,
}: Omit<CoachPromptCardProps, 'title' | 'actionText'>) {
  const router = useRouter();
  const config = TRIGGER_CONFIG[trigger];
  const TriggerIcon = config.icon;

  const handleChat = () => {
    if (onChat) {
      onChat();
    } else {
      router.push(`/coach?prompt=${encodeURIComponent(message)}`);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl',
        'bg-gradient-to-r',
        config.bgGradient,
        'border',
        config.borderColor,
        className
      )}
      role="alert"
    >
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-lg',
          'bg-white/70 dark:bg-slate-800/70',
          'flex items-center justify-center'
        )}
      >
        <TriggerIcon className={cn('h-4 w-4', config.iconColor)} />
      </div>

      <p className="flex-1 text-sm text-slate-700 dark:text-slate-200 line-clamp-1">
        {message}
      </p>

      <Button
        onClick={handleChat}
        size="sm"
        variant="ghost"
        className="flex-shrink-0 min-h-[40px] text-amber-600 dark:text-amber-400"
      >
        <MessageCircle className="h-4 w-4 mr-1" />
        Chat
      </Button>

      <button
        onClick={() => onDismiss?.(id)}
        className={cn(
          'flex-shrink-0 p-2 rounded-lg',
          'hover:bg-white/50 dark:hover:bg-slate-800/50',
          'transition-colors',
          'min-h-[40px] min-w-[40px]',
          'flex items-center justify-center'
        )}
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-slate-400" />
      </button>
    </div>
  );
}

export type { PromptTrigger, CoachPromptCardProps };
