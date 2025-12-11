'use client';

import * as React from 'react';
import { Target, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  dueDate?: string;
  completed?: boolean;
}

interface GoalsProgressWidgetProps {
  goals?: Goal[];
  onAddGoal?: () => void;
  className?: string;
}

export function GoalsProgressWidget({
  goals = [],
  onAddGoal,
  className,
}: GoalsProgressWidgetProps) {
  const activeGoals = goals.filter((g) => !g.completed).slice(0, 3);
  const completedCount = goals.filter((g) => g.completed).length;

  const getProgressColor = (current: number, target: number): string => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return 'bg-green-500 dark:bg-green-400';
    if (percentage >= 75) return 'bg-amber-500 dark:bg-amber-400';
    if (percentage >= 50) return 'bg-blue-500 dark:bg-blue-400';
    return 'bg-slate-400 dark:bg-slate-500';
  };

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Goals
          </h3>
        </div>
        {completedCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <Check className="h-3 w-3" />
            {completedCount} completed
          </span>
        )}
      </div>

      {/* Goals List */}
      {activeGoals.length > 0 ? (
        <div className="flex-1 space-y-3">
          {activeGoals.map((goal) => {
            const percentage = Math.min((goal.current / goal.target) * 100, 100);
            const isComplete = goal.current >= goal.target;

            return (
              <div key={goal.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                    {goal.title}
                  </span>
                  <span className="text-xs text-slate-500">
                    {goal.current}/{goal.target} {goal.unit}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      getProgressColor(goal.current, goal.target)
                    )}
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={goal.current}
                    aria-valuemin={0}
                    aria-valuemax={goal.target}
                  />
                </div>
                {isComplete && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Goal reached!
                  </p>
                )}
                {goal.dueDate && !isComplete && (
                  <p className="text-xs text-slate-400 mt-1">
                    Due: {new Date(goal.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <div className="text-3xl mb-2">
              <span role="img" aria-label="Target">
                &#127919;
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No active goals
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Set goals to track your progress
            </p>
          </div>
        </div>
      )}

      {/* Add Goal Button */}
      {onAddGoal && (
        <div className="mt-auto pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddGoal}
            className={cn(
              'w-full min-h-[40px]',
              'border-dashed',
              'hover:bg-blue-50 hover:border-blue-200',
              'dark:hover:bg-blue-900/20 dark:hover:border-blue-800'
            )}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Goal
          </Button>
        </div>
      )}
    </div>
  );
}

// Sample goals for demo/testing
export const SAMPLE_GOALS: Goal[] = [
  {
    id: '1',
    title: 'Journal entries this week',
    target: 5,
    current: 3,
    unit: 'entries',
  },
  {
    id: '2',
    title: 'Reduce FOMO trades',
    target: 0,
    current: 2,
    unit: 'trades',
  },
  {
    id: '3',
    title: 'Pre-trade checklist usage',
    target: 10,
    current: 7,
    unit: 'times',
  },
];

// Skeleton for loading
export function GoalsProgressWidgetSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-16 skeleton rounded" />
        <div className="h-4 w-20 skeleton rounded" />
      </div>
      <div className="flex-1 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <div className="h-4 w-32 skeleton rounded" />
              <div className="h-4 w-16 skeleton rounded" />
            </div>
            <div className="h-2 w-full skeleton rounded-full" />
          </div>
        ))}
      </div>
      <div className="mt-auto pt-2">
        <div className="h-10 w-full skeleton rounded" />
      </div>
    </div>
  );
}
