'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader, TrendingUp, TrendingDown, Minus, Brain, Target, AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WeeklyInsights {
  weekStart: string;
  weekEnd: string;
  stats: {
    totalEntries: number;
    totalTrades: number;
    tradeIdeas: number;
    reflections: number;
    observations: number;
  };
  emotional: {
    dominantSentiment: 'positive' | 'negative' | 'neutral' | null;
    sentimentBreakdown: {
      positive: number;
      negative: number;
      neutral: number;
    };
    topEmotions: Array<{ emotion: string; count: number }>;
    moodFrequency: Array<{ mood: string; count: number }>;
  };
  patterns: {
    detectedBiases: Array<{ bias: string; count: number }>;
    convictionDistribution: {
      high: number;
      medium: number;
      low: number;
    };
  };
  insights: string[];
  comparison?: {
    entriesChange: number;
    sentimentChange: 'improving' | 'declining' | 'stable';
    newBiases: string[];
  };
}

const sentimentColors = {
  positive: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  negative: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
  neutral: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
};

const sentimentIcons = {
  improving: <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />,
  declining: <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />,
  stable: <Minus className="h-5 w-5 text-gray-600 dark:text-gray-400" />,
};

export default function WeeklyInsightsPage() {
  const [insights, setInsights] = useState<WeeklyInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(0);

  useEffect(() => {
    fetchInsights(selectedWeek);
  }, [selectedWeek]);

  async function fetchInsights(weekOffset: number) {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/insights/weekly?week=${weekOffset}`);

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      setInsights(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-gray-400 dark:text-gray-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold mb-2 dark:text-gray-100">Error</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  // Empty state for insufficient data (< 3 entries this week)
  const showEmptyState = selectedWeek === 0 && insights.stats.totalEntries < 3;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-2 dark:text-gray-100">Weekly Insights</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {formatDate(insights.weekStart)} - {formatDate(insights.weekEnd)}
          </p>

          {/* Week selector */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setSelectedWeek(0)}
              className={`px-4 py-2 rounded-lg border dark:border-gray-600 min-h-[44px] ${
                selectedWeek === 0
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-gray-100'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setSelectedWeek(-1)}
              className={`px-4 py-2 rounded-lg border dark:border-gray-600 min-h-[44px] ${
                selectedWeek === -1
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-gray-100'
              }`}
            >
              Last Week
            </button>
            <button
              onClick={() => setSelectedWeek(-2)}
              className={`px-4 py-2 rounded-lg border dark:border-gray-600 min-h-[44px] ${
                selectedWeek === -2
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-gray-100'
              }`}
            >
              2 Weeks Ago
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {showEmptyState ? (
          // Empty State - Not enough entries this week
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="text-8xl mb-6">📊</div>
            <h2 className="text-2xl font-bold mb-3 dark:text-gray-100">Weekly Insights</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
              Log at least <span className="font-semibold text-primary dark:text-primary">3 entries</span> this week
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              to unlock personalized insights about your trading psychology
            </p>

            {insights.stats.totalEntries > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                You have {insights.stats.totalEntries} {insights.stats.totalEntries === 1 ? 'entry' : 'entries'} so far.
                Just {3 - insights.stats.totalEntries} more to go! 🎯
              </p>
            )}

            <Link href="/journal/new">
              <Button size="lg" className="min-h-[48px] px-8">
                <Plus className="mr-2 h-5 w-5" />
                Create Entry
              </Button>
            </Link>

            {insights.stats.totalEntries > 0 && (
              <div className="mt-8">
                <Link href="/journal">
                  <Button variant="outline" size="lg" className="min-h-[48px]">
                    Go to Journal
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold dark:text-gray-100">{insights.stats.totalEntries}</div>
              {insights.comparison && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {insights.comparison.entriesChange > 0 ? '+' : ''}
                  {insights.comparison.entriesChange}% from last week
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Trade Ideas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold dark:text-gray-100">{insights.stats.tradeIdeas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Reflections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold dark:text-gray-100">{insights.stats.reflections}</div>
            </CardContent>
          </Card>
        </div>

        {/* Emotional Analysis */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
              <CardTitle>Emotional Trends</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dominant Sentiment */}
            {insights.emotional.dominantSentiment && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Dominant Sentiment</p>
                <Badge
                  variant="outline"
                  className={`text-base px-3 py-1 ${sentimentColors[insights.emotional.dominantSentiment]}`}
                >
                  {insights.emotional.dominantSentiment.charAt(0).toUpperCase() + insights.emotional.dominantSentiment.slice(1)}
                </Badge>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {insights.emotional.sentimentBreakdown.positive} positive,{' '}
                  {insights.emotional.sentimentBreakdown.negative} negative,{' '}
                  {insights.emotional.sentimentBreakdown.neutral} neutral entries
                </div>
              </div>
            )}

            {/* Top Emotions */}
            {insights.emotional.topEmotions.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Top Emotions</p>
                <div className="flex flex-wrap gap-2">
                  {insights.emotional.topEmotions.map((emotion) => (
                    <Badge key={emotion.emotion} variant="secondary" className="text-sm">
                      {emotion.emotion} ({emotion.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Sentiment Change */}
            {insights.comparison && (
              <div className="flex items-center gap-2 pt-2 border-t dark:border-gray-700">
                {sentimentIcons[insights.comparison.sentimentChange]}
                <span className="text-sm dark:text-gray-300">
                  Sentiment is {insights.comparison.sentimentChange} compared to last week
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cognitive Patterns */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
              <CardTitle>Cognitive Patterns</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Conviction Distribution */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Conviction Levels</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm dark:text-gray-300">High</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
                    {insights.patterns.convictionDistribution.high}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm dark:text-gray-300">Medium</span>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800">
                    {insights.patterns.convictionDistribution.medium}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm dark:text-gray-300">Low</span>
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                    {insights.patterns.convictionDistribution.low}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Detected Biases */}
            {insights.patterns.detectedBiases.length > 0 && (
              <div className="pt-4 border-t dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Detected Biases</p>
                <div className="space-y-2">
                  {insights.patterns.detectedBiases.map((bias) => (
                    <div key={bias.bias} className="flex items-center justify-between">
                      <span className="text-sm capitalize dark:text-gray-300">{bias.bias.replace(/_/g, ' ')}</span>
                      <Badge variant="secondary">{bias.count}x</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personalized Insights */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              <CardTitle>Personalized Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insights.insights.map((insight, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  <span className="text-gray-700 dark:text-gray-300">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </div>
  );
}
