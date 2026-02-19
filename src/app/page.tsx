'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SimpleGreeting } from '@/components/ui/greeting-header';
import { CaptureButtons } from '@/components/ui/capture-buttons';
import { HomePatternsCard } from '@/components/dashboard/HomePatternsCard';
import { HomeWeeklyPulse } from '@/components/dashboard/HomeWeeklyPulse';
import { EntryCard } from '@/components/ui/entry-card';

interface RecentEntry {
  id: string;
  type: 'IDEA' | 'DECISION' | 'REFLECTION' | 'OBSERVATION';
  content: string;
  createdAt: string;
  mood?: string | null;
  ticker?: string | null;
  conviction?: string | null;
}

interface PatternInsight {
  id: string;
  patternType: string;
  patternName: string;
  description: string;
  occurrences: number;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  confidence: number;
  evidence: string[];
  outcomeData?: { winRate?: number; avgReturn?: number; sampleSize?: number };
}

interface WeeklyPulseData {
  weekStart: string;
  weekEnd: string;
  stats: { totalEntries: number; tradeIdeas: number; reflections: number };
  emotional: {
    dominantSentiment: 'positive' | 'negative' | 'neutral' | null;
    sentimentBreakdown: { positive: number; negative: number; neutral: number };
    topEmotions: Array<{ emotion: string; count: number }>;
  };
  patterns: { detectedBiases: Array<{ bias: string; count: number }> };
  insights: string[];
  comparison?: { entriesChange: number; sentimentChange: 'improving' | 'declining' | 'stable' };
}

// Skeleton for loading state
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="lg:grid lg:grid-cols-[2fr_3fr] lg:gap-10 lg:pt-4">
          {/* Left skeleton */}
          <div>
            <div className="px-0 py-8">
              <div className="h-12 w-64 skeleton rounded" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-[100px] skeleton rounded-xl" />
              ))}
            </div>
          </div>
          {/* Right skeleton */}
          <div className="mt-6 lg:mt-0 lg:pt-8 space-y-6">
            <div>
              <div className="h-5 w-36 skeleton rounded mb-3" />
              <div className="space-y-3">
                <div className="h-28 skeleton rounded-xl" />
                <div className="h-28 skeleton rounded-xl" />
              </div>
            </div>
            <div>
              <div className="h-5 w-24 skeleton rounded mb-3" />
              <div className="h-32 skeleton rounded-xl" />
            </div>
            <div>
              <div className="h-5 w-32 skeleton rounded mb-3" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 skeleton rounded mb-1" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  const [patterns, setPatterns] = useState<PatternInsight[]>([]);
  const [weeklyPulse, setWeeklyPulse] = useState<WeeklyPulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    setInsightsLoading(true);

    // Fetch entries first (fast) — controls whether we show main layout
    try {
      const entriesRes = await fetch('/api/entries?limit=6');
      const entriesData = await entriesRes.json();
      setRecentEntries(entriesData.entries || []);
      setHasData(entriesData.pagination?.total > 0);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }

    // Fetch patterns + weekly insights in parallel (slightly slower, show independently)
    try {
      const [patternsRes, pulseRes] = await Promise.all([
        fetch('/api/patterns'),
        fetch('/api/insights/weekly?week=0'),
      ]);

      if (patternsRes.ok) {
        const patternsData = await patternsRes.json();
        setPatterns(patternsData.patterns || []);
      }

      if (pulseRes.ok) {
        const pulseData = await pulseRes.json();
        setWeeklyPulse(pulseData);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setInsightsLoading(false);
    }
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Empty state for first-time users
  if (!hasData) {
    return (
      <div className="min-h-screen bg-background">
        <SimpleGreeting />

        <div className="max-w-2xl mx-auto px-4">
          <CaptureButtons className="mb-8" />

          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">
              Welcome to AI Trader Journal
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
              Track your trading psychology, detect biases, and improve decision-making.
            </p>
          </div>

          <Card className="mb-6">
            <CardContent className="p-5">
              <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">
                Get Started in 3 Steps
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">Create Your First Entry</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Journal a trade idea, reflection, or observation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">AI Analyzes Your Mindset</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Automatic sentiment analysis and bias detection</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">Get Weekly Insights</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Personalized feedback on emotional patterns</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/journal/new">
              <Button size="lg" className="h-12 px-6 bg-amber-500 hover:bg-amber-600">
                <Plus className="mr-2 h-5 w-5" />
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
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="lg:grid lg:grid-cols-[2fr_3fr] lg:gap-10 lg:pt-4">

          {/* Left column: Greeting + Capture Buttons */}
          <div>
            <SimpleGreeting className="px-0" />
            <CaptureButtons />
          </div>

          {/* Right column: Patterns → Weekly Pulse → Recent Entries */}
          <div className="mt-6 lg:mt-0 lg:pt-8 space-y-8">

            {/* 1. Active Patterns — most prominent */}
            <HomePatternsCard patterns={patterns} loading={insightsLoading} />

            {/* 2. This Week's Pulse */}
            <HomeWeeklyPulse data={weeklyPulse} loading={insightsLoading} />

            {/* 3. Recent Entries */}
            {recentEntries.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3">
                  Recent Entries
                </h2>
                <div className="space-y-3">
                  {recentEntries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      id={entry.id}
                      type={entry.type}
                      content={entry.content}
                      createdAt={entry.createdAt}
                      mood={entry.mood}
                      ticker={entry.ticker}
                      conviction={entry.conviction}
                    />
                  ))}
                </div>
                <Link
                  href="/journal"
                  className="block mt-4 text-sm text-amber-600 dark:text-amber-400 hover:underline"
                >
                  View all entries →
                </Link>
              </section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
