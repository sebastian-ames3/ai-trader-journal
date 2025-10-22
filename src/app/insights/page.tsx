'use client';

import { useEffect, useState } from 'react';
import { Loader, TrendingUp, TrendingDown, Minus, Brain, Target, AlertTriangle } from 'lucide-react';
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
  positive: 'bg-green-100 text-green-800 border-green-200',
  negative: 'bg-red-100 text-red-800 border-red-200',
  neutral: 'bg-gray-100 text-gray-800 border-gray-200',
};

const sentimentIcons = {
  improving: <TrendingUp className="h-5 w-5 text-green-600" />,
  declining: <TrendingDown className="h-5 w-5 text-red-600" />,
  stable: <Minus className="h-5 w-5 text-gray-600" />,
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-2">Weekly Insights</h1>
          <p className="text-gray-600">
            {formatDate(insights.weekStart)} - {formatDate(insights.weekEnd)}
          </p>

          {/* Week selector */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setSelectedWeek(0)}
              className={`px-4 py-2 rounded-lg border ${
                selectedWeek === 0
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setSelectedWeek(-1)}
              className={`px-4 py-2 rounded-lg border ${
                selectedWeek === -1
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              Last Week
            </button>
            <button
              onClick={() => setSelectedWeek(-2)}
              className={`px-4 py-2 rounded-lg border ${
                selectedWeek === -2
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              2 Weeks Ago
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{insights.stats.totalEntries}</div>
              {insights.comparison && (
                <p className="text-sm text-gray-600 mt-1">
                  {insights.comparison.entriesChange > 0 ? '+' : ''}
                  {insights.comparison.entriesChange}% from last week
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Trade Ideas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{insights.stats.tradeIdeas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Reflections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{insights.stats.reflections}</div>
            </CardContent>
          </Card>
        </div>

        {/* Emotional Analysis */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              <CardTitle>Emotional Trends</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dominant Sentiment */}
            {insights.emotional.dominantSentiment && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Dominant Sentiment</p>
                <Badge
                  variant="outline"
                  className={`text-base px-3 py-1 ${sentimentColors[insights.emotional.dominantSentiment]}`}
                >
                  {insights.emotional.dominantSentiment.charAt(0).toUpperCase() + insights.emotional.dominantSentiment.slice(1)}
                </Badge>
                <div className="mt-2 text-sm text-gray-600">
                  {insights.emotional.sentimentBreakdown.positive} positive,{' '}
                  {insights.emotional.sentimentBreakdown.negative} negative,{' '}
                  {insights.emotional.sentimentBreakdown.neutral} neutral entries
                </div>
              </div>
            )}

            {/* Top Emotions */}
            {insights.emotional.topEmotions.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Top Emotions</p>
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
              <div className="flex items-center gap-2 pt-2 border-t">
                {sentimentIcons[insights.comparison.sentimentChange]}
                <span className="text-sm">
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
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
              <CardTitle>Cognitive Patterns</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Conviction Distribution */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Conviction Levels</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">High</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {insights.patterns.convictionDistribution.high}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Medium</span>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    {insights.patterns.convictionDistribution.medium}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Low</span>
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    {insights.patterns.convictionDistribution.low}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Detected Biases */}
            {insights.patterns.detectedBiases.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Detected Biases</p>
                <div className="space-y-2">
                  {insights.patterns.detectedBiases.map((bias) => (
                    <div key={bias.bias} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{bias.bias.replace(/_/g, ' ')}</span>
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
              <Target className="h-5 w-5 mr-2 text-blue-600" />
              <CardTitle>Personalized Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insights.insights.map((insight, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span className="text-gray-700">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
