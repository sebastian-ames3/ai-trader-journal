'use client';

import * as React from 'react';
import { Target, Flame, Trophy, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Goal types
type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED' | 'EXPIRED';
type GoalType =
  | 'JOURNALING_STREAK'
  | 'ENTRIES_PER_WEEK'
  | 'PRE_TRADE_CHECKS'
  | 'BIAS_REDUCTION'
  | 'WIN_RATE'
  | 'CUSTOM';

interface Goal {
  id: string;
  type: GoalType;
  name: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: GoalStatus;
  streakDays?: number;
  startDate: string;
  endDate?: string;
  completedAt?: string;
}

interface GoalProgressProps {
  goals: Goal[];
  showAll?: boolean;
  className?: string;
}

interface GoalCardProps {
  goal: Goal;
  compact?: boolean;
}

// Status configuration
const STATUS_CONFIG: Record<GoalStatus, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  ACTIVE: {
    label: 'Active',
    icon: Target,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  ABANDONED: {
    label: 'Abandoned',
    icon: AlertCircle,
    color: 'text-slate-500 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
  },
  EXPIRED: {
    label: 'Expired',
    icon: Clock,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
};

// Goal type icons
const GOAL_TYPE_ICONS: Record<GoalType, React.ElementType> = {
  JOURNALING_STREAK: Flame,
  ENTRIES_PER_WEEK: Target,
  PRE_TRADE_CHECKS: CheckCircle,
  BIAS_REDUCTION: Target,
  WIN_RATE: Trophy,
  CUSTOM: Target,
};

// Calculate progress percentage
function calculateProgress(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min((current / target) * 100, 100);
}

// Get progress bar color based on percentage
function getProgressColor(percentage: number, status: GoalStatus): string {
  if (status === 'COMPLETED') return 'bg-green-500';
  if (status === 'ABANDONED' || status === 'EXPIRED') return 'bg-slate-400';
  if (percentage >= 100) return 'bg-green-500';
  if (percentage >= 75) return 'bg-amber-500';
  if (percentage >= 50) return 'bg-amber-400';
  return 'bg-amber-300';
}

// Format date for display
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// Single goal card
export function GoalCard({ goal, compact = false }: GoalCardProps) {
  const progress = calculateProgress(goal.currentValue, goal.targetValue);
  const statusConfig = STATUS_CONFIG[goal.status];
  const StatusIcon = statusConfig.icon;
  const TypeIcon = GOAL_TYPE_ICONS[goal.type];
  const progressColor = getProgressColor(progress, goal.status);

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl',
          'bg-white dark:bg-slate-800/50',
          'border border-slate-200/50 dark:border-slate-700/50'
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-xl',
            'flex items-center justify-center',
            statusConfig.bgColor
          )}
        >
          <TypeIcon className={cn('h-5 w-5', statusConfig.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
              {goal.name}
            </p>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0">
              {goal.currentValue}/{goal.targetValue}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', progressColor)}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Streak indicator */}
        {goal.streakDays !== undefined && goal.streakDays > 0 && (
          <div className="flex items-center gap-1 text-amber-500 flex-shrink-0">
            <Flame className="h-4 w-4" />
            <span className="text-sm font-semibold">{goal.streakDays}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-4 rounded-2xl',
        'bg-white dark:bg-slate-800/50',
        'border border-slate-200/50 dark:border-slate-700/50',
        'transition-all duration-200',
        'hover:shadow-md hover:border-slate-300/50 dark:hover:border-slate-600/50'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex-shrink-0 w-12 h-12 rounded-xl',
              'flex items-center justify-center',
              statusConfig.bgColor
            )}
          >
            <TypeIcon className={cn('h-6 w-6', statusConfig.color)} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
              {goal.name}
            </h4>
            {goal.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                {goal.description}
              </p>
            )}
          </div>
        </div>

        {/* Status badge */}
        <Badge
          variant="secondary"
          className={cn('flex-shrink-0', statusConfig.bgColor, statusConfig.color)}
        >
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusConfig.label}
        </Badge>
      </div>

      {/* Progress section */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-500 dark:text-slate-400">Progress</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {goal.currentValue} / {goal.targetValue} {goal.unit}
          </span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500 ease-out', progressColor)}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
          <span>0%</span>
          <span>{progress.toFixed(0)}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Started {formatDate(goal.startDate)}
          {goal.endDate && ` - Ends ${formatDate(goal.endDate)}`}
        </span>

        {/* Streak badge */}
        {goal.streakDays !== undefined && goal.streakDays > 0 && (
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full',
              'bg-gradient-to-r from-amber-100 to-orange-100',
              'dark:from-amber-900/30 dark:to-orange-900/30',
              'border border-orange-200/50 dark:border-orange-800/30'
            )}
          >
            <Flame className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {goal.streakDays} day{goal.streakDays !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Goal progress widget - displays multiple goals
export default function GoalProgress({
  goals,
  showAll = false,
  className,
}: GoalProgressProps) {
  // Filter to show active goals first, then show others if showAll
  const activeGoals = goals.filter((g) => g.status === 'ACTIVE');
  const displayGoals = showAll ? goals : activeGoals.slice(0, 3);

  if (displayGoals.length === 0) {
    return (
      <div
        className={cn(
          'p-6 rounded-2xl text-center',
          'bg-white dark:bg-slate-800/50',
          'border border-slate-200/50 dark:border-slate-700/50',
          className
        )}
      >
        <Target className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
          No active goals
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Set a goal to track your trading psychology improvement
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {displayGoals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} compact={!showAll} />
      ))}

      {!showAll && activeGoals.length > 3 && (
        <p className="text-sm text-center text-slate-500 dark:text-slate-400">
          +{activeGoals.length - 3} more active goal{activeGoals.length - 3 !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

// Skeleton loader
export function GoalProgressSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-3 p-3 rounded-xl',
            'bg-white dark:bg-slate-800/50',
            'border border-slate-200/50 dark:border-slate-700/50'
          )}
        >
          <div className="w-10 h-10 rounded-xl skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 skeleton rounded" />
            <div className="h-1.5 w-full skeleton rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export type { Goal, GoalStatus, GoalType };
