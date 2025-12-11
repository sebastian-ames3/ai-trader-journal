'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Target, HelpCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CoachChat, { Message, EntryReference } from '@/components/coach/CoachChat';
import GoalProgress, { Goal, GoalProgressSkeleton } from '@/components/coach/GoalProgress';
import { cn } from '@/lib/utils';

// Session storage key for chat history
const CHAT_STORAGE_KEY = 'coach-chat-session';

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
  const [sessionId] = useState(() => `session-${Date.now()}`);

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
          sessionId,
          messages,
          lastUpdated: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('Error saving chat session:', error);
    }
  }, [messages, sessionId]);

  // Fetch goals
  useEffect(() => {
    async function fetchGoals() {
      setGoalsLoading(true);
      try {
        // For now, use mock data until API is implemented
        // const response = await fetch('/api/coach/goals');
        // const data = await response.json();
        // setGoals(data.goals);

        // Mock data for development
        setGoals([
          {
            id: '1',
            type: 'JOURNALING_STREAK',
            name: 'Daily Journaling',
            description: 'Journal every trading day',
            targetValue: 7,
            currentValue: 4,
            unit: 'days',
            status: 'ACTIVE',
            streakDays: 4,
            startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '2',
            type: 'PRE_TRADE_CHECKS',
            name: 'Pre-Trade Checklist',
            targetValue: 10,
            currentValue: 6,
            unit: 'checks',
            status: 'ACTIVE',
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);
      } catch (error) {
        console.error('Error fetching goals:', error);
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

  // Send message handler
  const handleSendMessage = useCallback(async (messageText: string): Promise<Message | null> => {
    try {
      // For now, use mock response until API is implemented
      // const response = await fetch('/api/coach/chat', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ message: messageText, sessionId }),
      // });
      // const data = await response.json();
      // return data.message;

      // Mock response for development
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate mock response based on message content
      let responseContent = '';
      let entryReferences: EntryReference[] = [];

      if (messageText.toLowerCase().includes('bias') || messageText.toLowerCase().includes('pattern')) {
        responseContent = `Based on your recent journal entries, I've noticed a few patterns:

1. **Confirmation Bias** - You tend to seek information that confirms your existing thesis, especially with tech stocks.

2. **Overconfidence** - Your conviction levels have been high even when your analysis shows mixed signals.

3. **Recency Bias** - Your last few entries show heavy weighting on recent market moves.

Would you like me to show you specific entries where these patterns appeared?`;

        entryReferences = [
          {
            id: 'mock-1',
            type: 'TRADE_IDEA',
            content: 'Looking at NVDA for a long position. The AI narrative is strong and recent earnings were solid.',
            ticker: 'NVDA',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
      } else if (messageText.toLowerCase().includes('pre-trade') || messageText.toLowerCase().includes('checklist')) {
        responseContent = `Here's your pre-trade checklist:

- What is your thesis for this trade?
- What's your risk/reward ratio?
- What would invalidate this trade?
- Are you trading with or against the trend?
- What's your position size relative to your account?
- How does this fit with your current portfolio?
- Are you emotional about this trade?

Would you like to walk through this checklist for a specific trade you're considering?`;
      } else if (messageText.toLowerCase().includes('week') || messageText.toLowerCase().includes('review')) {
        responseContent = `Here's your weekly review summary:

**Activity:** 8 journal entries this week (up from 5 last week!)

**Sentiment:** Mostly positive, with some uncertainty around market volatility

**Top Emotions:** Confident, Cautious, Excited

**Key Insight:** You've been more consistent with journaling this week. Keep it up!

Your dominant bias this week was **anchoring** - you mentioned your entry prices frequently when evaluating positions.`;
      } else {
        responseContent = `I understand you're asking about "${messageText}". Let me analyze your recent journal entries to give you personalized insights.

Based on your trading history, I can help you:
- Identify patterns in your decision-making
- Review specific trades or theses
- Prepare pre-trade checklists
- Track your psychological progress

What specific aspect would you like to explore?`;
      }

      const coachMessage: Message = {
        id: `coach-${Date.now()}`,
        role: 'coach',
        content: responseContent,
        timestamp: new Date(),
        entryReferences: entryReferences.length > 0 ? entryReferences : undefined,
      };

      return coachMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }, []);

  // Get suggested prompts based on context
  const getSuggestedPrompts = (): string[] => {
    if (messages.length <= 1) {
      return [
        'How was my trading week?',
        'Show me my biases',
        'Pre-trade checklist',
        'Review my emotions',
      ];
    }
    // After conversation starts, show follow-up prompts
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

      {/* Chat interface */}
      <div className="flex-1 overflow-hidden relative">
        <CoachChat
          sessionId={sessionId}
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
