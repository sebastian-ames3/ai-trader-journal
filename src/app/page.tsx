'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SimpleGreeting } from '@/components/ui/greeting-header';
import { CaptureButtons } from '@/components/ui/capture-buttons';
import { cn } from '@/lib/utils';

interface RecentEntry {
  id: string;
  type: 'TRADE_IDEA' | 'TRADE' | 'REFLECTION' | 'OBSERVATION';
  content: string;
  createdAt: string;
}

// Format time for display
function formatEntryTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Today - show time
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

// Get excerpt from content
function getExcerpt(content: string, maxLength: number = 40): string {
  // Remove image analysis markers
  const cleaned = content.replace(/\[Image:.*?\]/g, '').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength).trim() + '...';
}

// Skeleton for loading state
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Greeting Skeleton */}
      <div className="px-4 py-8">
        <div className="h-12 w-64 skeleton rounded" />
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-6">
        {/* Capture Buttons Skeleton */}
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[100px] skeleton rounded-xl" />
          ))}
        </div>

        {/* Recent Entries Skeleton */}
        <div className="space-y-1">
          <div className="h-5 w-32 skeleton rounded mb-4" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 skeleton rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Simple entry row component
function EntryRow({ entry }: { entry: RecentEntry }) {
  const time = formatEntryTime(entry.createdAt);
  const excerpt = getExcerpt(entry.content);

  return (
    <Link href={`/journal/${entry.id}`}>
      <div className={cn(
        'py-3 border-b border-amber-500/30',
        'hover:bg-slate-100 dark:hover:bg-slate-800/50',
        'transition-colors cursor-pointer'
      )}>
        <p className="text-sm text-slate-900 dark:text-white">
          <span className="font-medium">{time}</span>
          <span className="text-slate-500 dark:text-slate-400"> - </span>
          <span>{excerpt}</span>
        </p>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // Fetch recent entries (limit to 3)
      const entriesResponse = await fetch('/api/entries?limit=3');
      const entriesData = await entriesResponse.json();

      setRecentEntries(entriesData.entries || []);
      setHasData(entriesData.pagination?.total > 0);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Empty state for first-time users
  if (!hasData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
        <SimpleGreeting />

        <div className="max-w-lg mx-auto px-4">
          {/* Capture Buttons */}
          <CaptureButtons className="mb-8" />

          {/* Onboarding */}
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
                  <div className="flex-shrink-0 w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">
                      Create Your First Entry
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Journal a trade idea, reflection, or observation
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">
                      AI Analyzes Your Mindset
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Automatic sentiment analysis and bias detection
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">
                      Get Weekly Insights
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Personalized feedback on emotional patterns
                    </p>
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Simple Greeting */}
      <SimpleGreeting />

      <div className="max-w-lg mx-auto px-4 space-y-6">
        {/* Capture Buttons */}
        <CaptureButtons />

        {/* Recent Entries */}
        {recentEntries.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3">
              Recent Entries
            </h2>
            <div>
              {recentEntries.map((entry) => (
                <EntryRow key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
