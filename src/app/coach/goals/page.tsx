'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Plus,
  Target,
  CheckCircle,
  XCircle,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Goal, GoalCard, GoalProgressSkeleton } from '@/components/coach/GoalProgress';
import GoalForm, { GoalFormData } from '@/components/coach/GoalForm';
import { cn } from '@/lib/utils';

type FilterTab = 'ACTIVE' | 'COMPLETED' | 'ALL';

// API response type (CoachGoal from Prisma)
interface ApiGoal {
  id: string;
  userId: string;
  goal: string;
  description: string | null;
  metricType: string | null;
  metricName: string | null;
  targetValue: number | null;
  currentValue: number | null;
  progress: number;
  timeframe: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED' | 'EXPIRED';
  startDate: string;
  endDate: string | null;
  completedAt: string | null;
  checkIns: unknown[];
  reflection: string | null;
  createdAt: string;
  updatedAt: string;
}

// Transform API response to frontend Goal type
function transformApiGoal(apiGoal: ApiGoal): Goal {
  // Map metricType to frontend GoalType
  const typeMap: Record<string, Goal['type']> = {
    streak: 'JOURNALING_STREAK',
    bias_count: 'BIAS_REDUCTION',
    win_rate: 'WIN_RATE',
    compliance: 'PRE_TRADE_CHECKS',
    count: 'ENTRIES_PER_WEEK',
  };

  // Derive unit from metric type or timeframe
  const unitMap: Record<string, string> = {
    streak: 'days',
    bias_count: 'occurrences',
    win_rate: '%',
    compliance: 'checks',
    count: 'entries',
  };

  const goalType = typeMap[apiGoal.metricType || ''] || 'CUSTOM';
  const unit = unitMap[apiGoal.metricType || ''] || 'progress';

  return {
    id: apiGoal.id,
    type: goalType,
    name: apiGoal.goal,
    description: apiGoal.description || undefined,
    targetValue: apiGoal.targetValue || 100,
    currentValue: apiGoal.currentValue || Math.round((apiGoal.progress / 100) * (apiGoal.targetValue || 100)),
    unit,
    status: apiGoal.status === 'EXPIRED' ? 'ABANDONED' : apiGoal.status,
    startDate: apiGoal.startDate,
    endDate: apiGoal.endDate || undefined,
    completedAt: apiGoal.completedAt || undefined,
  };
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('ACTIVE');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch goals from API
  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/coach/goals');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch goals');
      }

      const data = await response.json();
      const transformedGoals = data.goals.map(transformApiGoal);
      setGoals(transformedGoals);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Filter goals based on selected tab
  const filteredGoals = goals.filter((goal) => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return goal.status === 'ACTIVE';
    if (filter === 'COMPLETED') return goal.status === 'COMPLETED' || goal.status === 'ABANDONED';
    return true;
  });

  // Handle goal creation via API
  const handleCreateGoal = async (data: GoalFormData) => {
    setIsCreating(true);
    setError(null);
    try {
      // Map frontend GoalType to API metricType
      const metricTypeMap: Record<string, string> = {
        JOURNALING_STREAK: 'streak',
        ENTRIES_PER_WEEK: 'count',
        PRE_TRADE_CHECKS: 'compliance',
        BIAS_REDUCTION: 'bias_count',
        WIN_RATE: 'win_rate',
        CUSTOM: 'custom',
      };

      const response = await fetch('/api/coach/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: data.name,
          description: data.description,
          metricType: metricTypeMap[data.type] || 'custom',
          metricName: data.type.toLowerCase(),
          targetValue: data.targetValue,
          timeframe: 'WEEKLY',
          endDate: data.endDate || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create goal');
      }

      const apiGoal = await response.json();
      const newGoal = transformApiGoal(apiGoal);

      // Add the new goal with the correct unit from form data
      const goalWithUnit: Goal = {
        ...newGoal,
        unit: data.unit,
      };

      setGoals((prev) => [goalWithUnit, ...prev]);
      setShowCreateForm(false);
    } catch (err) {
      console.error('Error creating goal:', err);
      setError(err instanceof Error ? err.message : 'Failed to create goal');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle marking goal as completed via API
  const handleCompleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/coach/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to complete goal');
      }

      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? { ...g, status: 'COMPLETED' as const, completedAt: new Date().toISOString() }
            : g
        )
      );
    } catch (err) {
      console.error('Error completing goal:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete goal');
    }
  };

  // Handle abandoning a goal via API
  const handleAbandonGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/coach/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ABANDONED' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to abandon goal');
      }

      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId ? { ...g, status: 'ABANDONED' as const } : g
        )
      );
    } catch (err) {
      console.error('Error abandoning goal:', err);
      setError(err instanceof Error ? err.message : 'Failed to abandon goal');
    }
  };

  // Handle deleting a goal via API
  const handleDeleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/coach/goals/${goalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete goal');
      }

      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch (err) {
      console.error('Error deleting goal:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
    }
  };

  // Stats summary
  const activeCount = goals.filter((g) => g.status === 'ACTIVE').length;
  const completedCount = goals.filter((g) => g.status === 'COMPLETED').length;
  const abandonedCount = goals.filter((g) => g.status === 'ABANDONED').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Link href="/coach">
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
                aria-label="Back to coach"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Goals
            </h1>
          </div>
          {!showCreateForm && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="min-h-[44px] bg-amber-500 hover:bg-amber-600"
            >
              <Plus className="h-5 w-5 mr-1" />
              New Goal
            </Button>
          )}
        </div>

        {/* Filter tabs */}
        {!showCreateForm && (
          <div className="flex gap-2 px-4 pb-3">
            {(['ACTIVE', 'COMPLETED', 'ALL'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[40px]',
                  filter === f
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                {f === 'ALL'
                  ? `All (${goals.length})`
                  : f === 'ACTIVE'
                  ? `Active (${activeCount})`
                  : `Completed (${completedCount + abandonedCount})`}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {showCreateForm ? (
          // Goal creation form
          <GoalForm
            onSubmit={handleCreateGoal}
            onCancel={() => setShowCreateForm(false)}
            isLoading={isCreating}
          />
        ) : loading ? (
          // Loading state
          <GoalProgressSkeleton />
        ) : filteredGoals.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <Target className="h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
              {filter === 'ACTIVE'
                ? 'No active goals'
                : filter === 'COMPLETED'
                ? 'No completed goals yet'
                : 'No goals yet'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
              {filter === 'ACTIVE'
                ? 'Set a goal to track your trading psychology improvement'
                : filter === 'COMPLETED'
                ? 'Completed and abandoned goals will appear here'
                : 'Create your first goal to start tracking your progress'}
            </p>
            {filter !== 'COMPLETED' && (
              <Button
                size="lg"
                onClick={() => setShowCreateForm(true)}
                className="min-h-[48px] bg-amber-500 hover:bg-amber-600"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create First Goal
              </Button>
            )}
          </div>
        ) : (
          // Goals list
          <div className="space-y-4">
            {filteredGoals.map((goal) => (
              <div key={goal.id} className="relative">
                <GoalCard goal={goal} />

                {/* Action menu */}
                <div className="absolute top-4 right-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 min-h-[44px] min-w-[44px]"
                        aria-label="Goal actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {goal.status === 'ACTIVE' && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleCompleteGoal(goal.id)}
                            className="min-h-[44px]"
                          >
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            Mark as Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAbandonGoal(goal.id)}
                            className="min-h-[44px]"
                          >
                            <XCircle className="h-4 w-4 mr-2 text-slate-500" />
                            Abandon Goal
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="min-h-[44px] text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats summary (when not creating) */}
      {!showCreateForm && !loading && goals.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4">
          <Card className="max-w-4xl mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardContent className="py-3">
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {activeCount}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Active</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {completedCount}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-400 dark:text-slate-500">
                    {abandonedCount}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Abandoned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
