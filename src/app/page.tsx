'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, TrendingUp, Brain, BookOpen, ArrowRight, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import OnboardingTip from '@/components/OnboardingTip';
import { useOnboardingTips } from '@/hooks/useOnboardingTips';

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
  ticker: string | null;
  sentiment: string | null;
  createdAt: string;
}

const typeColors = {
  TRADE_IDEA: 'bg-blue-100 text-blue-800 border-blue-200',
  TRADE: 'bg-green-100 text-green-800 border-green-200',
  REFLECTION: 'bg-purple-100 text-purple-800 border-purple-200',
  OBSERVATION: 'bg-orange-100 text-orange-800 border-orange-200',
};

const moodEmojis: Record<string, string> = {
  CONFIDENT: '😊',
  NERVOUS: '😰',
  EXCITED: '🚀',
  UNCERTAIN: '🤔',
  NEUTRAL: '😐',
};

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

  function formatTimeAgo(dateString: string) {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return formatDate(dateString);
  }

  function formatEntryType(type: string) {
    return type.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-gray-400" />
      </div>
    );
  }

  // Empty state for first-time users
  if (!hasData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="text-8xl mb-6">📊</div>
            <h1 className="text-3xl font-bold mb-4">Welcome to AI Trader Journal</h1>
            <p className="text-lg text-gray-600 mb-2">
              Track your trading psychology, detect biases, and improve decision-making with AI-powered insights.
            </p>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-sm border mb-8">
            <h2 className="text-xl font-semibold mb-4">Get Started in 3 Steps</h2>
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-medium mb-1">Create Your First Entry</h3>
                  <p className="text-sm text-gray-600">
                    Journal a trade idea, reflection, or market observation
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-medium mb-1">AI Analyzes Your Mindset</h3>
                  <p className="text-sm text-gray-600">
                    Automatic sentiment analysis and bias detection
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-medium mb-1">Get Weekly Insights</h3>
                  <p className="text-sm text-gray-600">
                    Personalized feedback on emotional patterns and cognitive biases
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Link href="/journal/new">
            <Button size="lg" className="h-14 px-8 text-lg">
              <Plus className="mr-2 h-6 w-6" />
              Create First Entry
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Dashboard with data
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-gray-600">Your trading psychology at a glance</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Weekly Snapshot Card */}
        {weeklySnapshot && (
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    This Week&apos;s Snapshot
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Total Entries */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Entries</p>
                  <p className="text-3xl font-bold">{weeklySnapshot.stats.totalEntries}</p>
                </div>

                {/* Trade Ideas */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Trade Ideas</p>
                  <p className="text-3xl font-bold">{weeklySnapshot.stats.tradeIdeas}</p>
                </div>

                {/* Dominant Sentiment */}
                <div className="col-span-2 md:col-span-1">
                  <p className="text-sm text-gray-600 mb-2">Mindset</p>
                  {weeklySnapshot.emotional.dominantSentiment ? (
                    <Badge
                      variant="outline"
                      className={`text-base px-3 py-1 ${
                        weeklySnapshot.emotional.dominantSentiment === 'positive'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : weeklySnapshot.emotional.dominantSentiment === 'negative'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}
                    >
                      {weeklySnapshot.emotional.dominantSentiment.charAt(0).toUpperCase() +
                       weeklySnapshot.emotional.dominantSentiment.slice(1)}
                    </Badge>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Streak Card */}
        {streakData && streakData.currentStreak > 0 && (
          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔥 Journaling Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Streak</p>
                  <p className="text-4xl font-bold text-orange-600">
                    {streakData.currentStreak}
                    <span className="text-xl text-gray-600 ml-2">
                      day{streakData.currentStreak !== 1 ? 's' : ''}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Best Streak</p>
                  <p className="text-4xl font-bold text-gray-700">
                    {streakData.longestStreak}
                    <span className="text-xl text-gray-600 ml-2">
                      day{streakData.longestStreak !== 1 ? 's' : ''}
                    </span>
                  </p>
                </div>
              </div>
              {streakData.currentStreak >= 3 && (
                <p className="mt-4 text-sm text-gray-700 bg-white/60 rounded-lg p-3">
                  💪 Keep it up! Consistent journaling helps build better trading psychology
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Insights */}
        {weeklySnapshot && weeklySnapshot.insights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Quick Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {weeklySnapshot.insights.slice(0, 3).map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary mr-2 font-bold">•</span>
                    <span className="text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
              {weeklySnapshot.insights.length > 3 && (
                <Link href="/insights">
                  <Button variant="link" className="mt-2 px-0">
                    See all insights
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Entries Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Recent Entries
              </CardTitle>
              <Link href="/journal">
                <Button variant="ghost" size="sm" className="min-h-[44px]">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <Link key={entry.id} href={`/journal/${entry.id}`}>
                  <div className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`${typeColors[entry.type]} text-xs`}
                        >
                          {formatEntryType(entry.type)}
                        </Badge>
                        {entry.ticker && (
                          <Badge variant="secondary" className="text-xs font-mono">
                            {entry.ticker}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.mood && moodEmojis[entry.mood] && (
                          <span className="text-lg">{moodEmojis[entry.mood]}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2 mb-1">
                      {entry.content}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTimeAgo(entry.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-primary/10 to-purple-100 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Keep the momentum going!</h3>
          <p className="text-gray-700 mb-4">
            Regular journaling helps identify patterns and improve decision-making
          </p>
          <Link href="/journal/new">
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              New Entry
            </Button>
          </Link>
        </div>
      </div>

      {/* Floating Action Button */}
      <Link href="/journal/new">
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          aria-label="Create new entry"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>

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
