'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, TrendingUp, Brain, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GreetingHeader } from '@/components/ui/greeting-header';
import { StreakCard } from '@/components/ui/streak-card';
import { TimeAwareActionCards } from '@/components/ui/action-cards';
import { QuoteCard } from '@/components/ui/quote-card';
import { EntryCard, EntryCardList, EntryCardSkeleton } from '@/components/ui/entry-card';
import OnboardingTip from '@/components/OnboardingTip';
import { useOnboardingTips } from '@/hooks/useOnboardingTips';
import { cn } from '@/lib/utils';

interface WeeklySnapshot {
  weekStart: string;
  weekEnd: string;
  stats: {
    totalEntries: number;
    tradeIdeas: number;
  };
  emotional: {
    dominantSentiment: 'positive' | 'negative' | 'neutral' | null;
  };
  insights: string[];
}

interface RecentEntry {
  id: string;
  type: 'TRADE_IDEA' | 'TRADE' | 'REFLECTION' | 'OBSERVATION';
  content: string;
  mood: string | null;
  conviction: string | null;
  ticker: string | null;
  sentiment: string | null;
  createdAt: string;
}

// Skeleton components
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Greeting Skeleton */}
      <div className="px-4 py-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
        <div className="h-8 w-48 skeleton rounded mb-2" />
        <div className="h-5 w-32 skeleton rounded" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Streak Skeleton */}
        <div className="h-36 skeleton rounded-2xl" />

        {/* Action Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="h-24 skeleton rounded-2xl" />
          <div className="h-24 skeleton rounded-2xl" />
        </div>

        {/* Recent Entries Skeleton */}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <EntryCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [weeklySnapshot, setWeeklySnapshot] = useState<WeeklySnapshot | null>(null);
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  const [streakData, setStreakData] = useState<{ currentStreak: number; longestStreak: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [totalEntries, setTotalEntries] = useState(0);

  // Onboarding tips based on entry count
  const currentTip = useOnboardingTips(totalEntries);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // Fetch weekly snapshot
      const insightsResponse = await fetch('/api/insights/weekly?week=0');
      const insightsData = await insightsResponse.json();

      // Fetch recent entries (limit to 3)
      const entriesResponse = await fetch('/api/entries?limit=3');
      const entriesData = await entriesResponse.json();

      // Fetch streak data
      const streakResponse = await fetch('/api/streak');
      const streakDataResult = await streakResponse.json();

      setWeeklySnapshot(insightsData);
      setRecentEntries(entriesData.entries || []);
      setStreakData(streakDataResult);
      setHasData(entriesData.pagination?.total > 0);
      setTotalEntries(entriesData.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Empty state for first-time users
  if (!hasData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <GreetingHeader />

        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="text-8xl mb-6">📊</div>
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">
              Welcome to AI Trader Journal
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              Track your trading psychology, detect biases, and improve decision-making with AI-powered insights.
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
                Get Started in 3 Steps
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium mb-1 text-slate-900 dark:text-slate-100">
                      Create Your First Entry
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Journal a trade idea, reflection, or market observation
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium mb-1 text-slate-900 dark:text-slate-100">
                      AI Analyzes Your Mindset
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Automatic sentiment analysis and bias detection
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium mb-1 text-slate-900 dark:text-slate-100">
                      Get Weekly Insights
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Personalized feedback on emotional patterns and cognitive biases
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/journal/new">
              <Button size="lg" className="h-14 px-8 text-lg bg-amber-500 hover:bg-amber-600">
                <Plus className="mr-2 h-6 w-6" />
                Create First Entry
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard with data
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Greeting Header */}
      <GreetingHeader />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Streak Card - only show if there's a streak */}
        {streakData && (
          <StreakCard
            currentStreak={streakData.currentStreak}
            longestStreak={streakData.longestStreak}
          />
        )}

        {/* Quick Actions */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide">
            Quick Actions
          </h2>
          <TimeAwareActionCards />
        </section>

        {/* Weekly Snapshot Card */}
        {weeklySnapshot && (
          <Card className="border-2 border-amber-200/50 dark:border-amber-800/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                    This Week
                  </CardTitle>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {formatDate(weeklySnapshot.weekStart)} - {formatDate(weeklySnapshot.weekEnd)}
                  </p>
                </div>
                <Link href="/insights">
                  <Button variant="ghost" size="sm" className="min-h-[44px]">
                    Full Report
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {/* Total Entries */}
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {weeklySnapshot.stats.totalEntries}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Entries</p>
                </div>

                {/* Trade Ideas */}
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {weeklySnapshot.stats.tradeIdeas}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Trade Ideas</p>
                </div>

                {/* Dominant Sentiment */}
                <div className="text-center">
                  {weeklySnapshot.emotional.dominantSentiment ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-sm px-3 py-1",
                        weeklySnapshot.emotional.dominantSentiment === 'positive'
                          ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                          : weeklySnapshot.emotional.dominantSentiment === 'negative'
                          ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                          : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      )}
                    >
                      {weeklySnapshot.emotional.dominantSentiment.charAt(0).toUpperCase() +
                       weeklySnapshot.emotional.dominantSentiment.slice(1)}
                    </Badge>
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Mindset</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Insights */}
        {weeklySnapshot && weeklySnapshot.insights.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Brain className="h-5 w-5 text-purple-500" />
                Quick Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {weeklySnapshot.insights.slice(0, 3).map((insight, index) => (
                  <li
                    key={index}
                    className="flex items-start text-sm text-slate-600 dark:text-slate-300"
                  >
                    <span className="text-amber-500 mr-2 font-bold">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
              {weeklySnapshot.insights.length > 3 && (
                <Link href="/insights">
                  <Button variant="link" className="mt-2 px-0 text-amber-600 dark:text-amber-400">
                    See all insights
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Entries Preview */}
        {recentEntries.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Recent Entries
              </h2>
              <Link href="/journal">
                <Button variant="ghost" size="sm" className="text-amber-600 dark:text-amber-400">
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <EntryCardList>
              {recentEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  id={entry.id}
                  content={entry.content}
                  type={entry.type}
                  ticker={entry.ticker}
                  mood={entry.mood}
                  conviction={entry.conviction}
                  createdAt={entry.createdAt}
                />
              ))}
            </EntryCardList>
          </section>
        )}

        {/* Quote Card */}
        <QuoteCard />
      </div>

      {/* Onboarding Tips */}
      {currentTip && (
        <OnboardingTip
          tipId={currentTip.id}
          message={currentTip.message}
          showDelay={currentTip.showAfter}
        />
      )}
    </div>
  );
}
