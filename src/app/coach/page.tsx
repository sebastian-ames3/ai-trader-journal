'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Target, HelpCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CoachChat, { Message } from '@/components/coach/CoachChat';
import GoalProgress, { Goal, GoalProgressSkeleton } from '@/components/coach/GoalProgress';
import { cn } from '@/lib/utils';

// Session storage key for chat history
const CHAT_STORAGE_KEY = 'coach-chat-session';
const SESSION_ID_KEY = 'coach-session-id';

// Default welcome message
const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'coach',
  content: `Hi! I'm your AI Trading Coach. I'm here to help you improve your trading psychology by analyzing your journal entries and identifying patterns.

You can ask me about:
- Your recent trading patterns and biases
- Pre-trade checks before entering a position
- Weekly performance reviews
- Emotional trends in your trading

What would you like to explore today?`,
  timestamp: new Date(),
};

// Goals loading component
function GoalsSection({
  goals,
  isLoading,
  isExpanded,
  onToggle,
}: {
  goals: Goal[];
  isLoading: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const activeGoals = goals.filter((g) => g.status === 'ACTIVE');

  return (
    <div className="border-b border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800">
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3',
          'hover:bg-slate-50 dark:hover:bg-slate-700/50',
          'transition-colors',
          'min-h-[48px]'
        )}
        aria-expanded={isExpanded}
        aria-controls="goals-section"
      >
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-amber-500" />
          <span className="font-medium text-slate-900 dark:text-slate-100">
            Active Goals
          </span>
          {activeGoals.length > 0 && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              ({activeGoals.length})
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div
          id="goals-section"
          className="px-4 pb-4 animate-slide-up"
        >
          {isLoading ? (
            <GoalProgressSkeleton />
          ) : activeGoals.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                No active goals yet
              </p>
              <Link href="/coach/goals">
                <Button variant="outline" size="sm" className="min-h-[40px]">
                  <Target className="h-4 w-4 mr-1" />
                  Set a Goal
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <GoalProgress goals={goals} />
              <Link href="/coach/goals" className="block mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-amber-600 dark:text-amber-400 min-h-[40px]"
                >
                  Manage Goals
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Inner component that uses useSearchParams
function CoachPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt');

  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [goalsExpanded, setGoalsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [apiSuggestions, setApiSuggestions] = useState<string[]>([]);
  const [coachError, setCoachError] = useState<string | null>(null);

  // Load saved chat session from storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        const restoredMessages = parsed.messages.map((m: Message) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        if (restoredMessages.length > 0) {
          setMessages(restoredMessages);
        }
      }
      // Restore session ID if available
      const savedSessionId = localStorage.getItem(SESSION_ID_KEY);
      if (savedSessionId) {
        setSessionId(savedSessionId);
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
    }
  }, []);

  // Save chat session to storage when messages change
  useEffect(() => {
    try {
      localStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify({
          messages,
          lastUpdated: new Date().toISOString(),
        })
      );
      // Save session ID separately
      if (sessionId) {
        localStorage.setItem(SESSION_ID_KEY, sessionId);
      }
    } catch (error) {
      console.error('Error saving chat session:', error);
    }
  }, [messages, sessionId]);

  // Fetch goals from API
  useEffect(() => {
    async function fetchGoals() {
      setGoalsLoading(true);
      try {
        const response = await fetch('/api/coach/goals?status=ACTIVE&limit=5');

        if (!response.ok) {
          throw new Error('Failed to fetch goals');
        }

        const data = await response.json();

        // Transform API goals to frontend format
        const transformedGoals: Goal[] = data.goals.map((apiGoal: {
          id: string;
          goal: string;
          description: string | null;
          metricType: string | null;
          targetValue: number | null;
          currentValue: number | null;
          progress: number;
          status: string;
          startDate: string;
          endDate: string | null;
          completedAt: string | null;
        }) => {
          // Map metricType to frontend GoalType
          const typeMap: Record<string, Goal['type']> = {
            streak: 'JOURNALING_STREAK',
            bias_count: 'BIAS_REDUCTION',
            win_rate: 'WIN_RATE',
            compliance: 'PRE_TRADE_CHECKS',
            count: 'ENTRIES_PER_WEEK',
          };

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
            status: apiGoal.status as Goal['status'],
            startDate: apiGoal.startDate,
            endDate: apiGoal.endDate || undefined,
            completedAt: apiGoal.completedAt || undefined,
          };
        });

        setGoals(transformedGoals);
      } catch (error) {
        console.error('Error fetching goals:', error);
        // Keep empty goals on error rather than showing mock data
        setGoals([]);
      } finally {
        setGoalsLoading(false);
      }
    }
    fetchGoals();
  }, []);

  // Handle initial prompt from URL
  useEffect(() => {
    if (initialPrompt && messages.length === 1) {
      // Clear the URL param
      router.replace('/coach', { scroll: false });
    }
  }, [initialPrompt, messages.length, router]);

  // Send message handler - calls real AI coach API
  const handleSendMessage = useCallback(async (messageText: string): Promise<Message | null> => {
    // Clear any previous error
    setCoachError(null);

    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          sessionId: sessionId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to get response from coach';

        // Handle specific error cases
        if (response.status === 503) {
          setCoachError('AI coach is currently unavailable. Please try again later.');
        } else if (response.status === 429) {
          setCoachError('Too many requests. Please wait a moment before trying again.');
        } else {
          setCoachError(errorMessage);
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Store the session ID for subsequent messages
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      // Store suggestions for follow-up prompts
      if (data.response?.suggestions && data.response.suggestions.length > 0) {
        setApiSuggestions(data.response.suggestions);
      }

      // Transform API response to Message format
      const coachMessage: Message = {
        id: `coach-${Date.now()}`,
        role: 'coach',
        content: data.response?.content || 'I apologize, but I could not generate a response. Please try again.',
        timestamp: new Date(),
        // Transform API references to component format
        // Note: API returns { entryId, excerpt, date, relevance }
        // Component expects { id, type, content, ticker?, createdAt }
        entryReferences: data.response?.references?.map((ref: { entryId: string; excerpt: string; date: string }) => ({
          id: ref.entryId,
          type: 'REFLECTION' as const, // Default type since API doesn't return it
          content: ref.excerpt,
          createdAt: ref.date,
        })),
      };

      return coachMessage;
    } catch (error) {
      console.error('Error sending message:', error);

      // Return an error message from the coach
      const errorMessage: Message = {
        id: `coach-error-${Date.now()}`,
        role: 'coach',
        content: coachError || 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };

      return errorMessage;
    }
  }, [sessionId, coachError]);

  // Get suggested prompts based on context
  const getSuggestedPrompts = (): string[] => {
    // Use API suggestions if available (after a response)
    if (apiSuggestions.length > 0) {
      return apiSuggestions;
    }

    // Default prompts for initial state
    if (messages.length <= 1) {
      return [
        'How was my trading week?',
        'Show me my biases',
        'Pre-trade checklist',
        'Review my emotions',
      ];
    }

    // Fallback follow-up prompts
    return [
      'Tell me more',
      'Show examples',
      'What should I focus on?',
    ];
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Trading Coach
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px]"
              aria-label="Coach help"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Link href="/coach/goals">
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
                aria-label="Manage goals"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Goals section (collapsible) */}
      <GoalsSection
        goals={goals}
        isLoading={goalsLoading}
        isExpanded={goalsExpanded}
        onToggle={() => setGoalsExpanded(!goalsExpanded)}
      />

      {/* Error banner */}
      {coachError && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">
            {coachError}
          </p>
        </div>
      )}

      {/* Chat interface */}
      <div className="flex-1 overflow-hidden relative">
        <CoachChat
          sessionId={sessionId || undefined}
          initialMessages={messages}
          onSendMessage={handleSendMessage}
          suggestedPrompts={getSuggestedPrompts()}
          className="h-full"
        />
      </div>
    </div>
  );
}

// Loading fallback
function CoachPageLoading() {
  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="h-7 w-36 skeleton rounded" />
          <div className="flex gap-2">
            <div className="h-10 w-10 skeleton rounded" />
            <div className="h-10 w-10 skeleton rounded" />
          </div>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="h-20 w-20 mx-auto skeleton rounded-full mb-4" />
          <div className="h-5 w-32 mx-auto skeleton rounded" />
        </div>
      </div>
    </div>
  );
}

// Main export with Suspense boundary for useSearchParams
export default function CoachPage() {
  return (
    <Suspense fallback={<CoachPageLoading />}>
      <CoachPageContent />
    </Suspense>
  );
}
