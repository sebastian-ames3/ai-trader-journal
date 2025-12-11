'use client';

import * as React from 'react';
import { Smile, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MoodData {
  date: string;
  mood: string;
  value: number; // -1 to 1 scale
}

interface MoodTrendWidgetProps {
  moodData?: MoodData[];
  currentMood?: string;
  moodTrend?: 'improving' | 'declining' | 'stable';
  topMoods?: { mood: string; count: number }[];
  className?: string;
}

const MOOD_EMOJIS: Record<string, string> = {
  CONFIDENT: '&#128170;',     // Flexed bicep
  EXCITED: '&#128640;',       // Rocket
  HOPEFUL: '&#127775;',       // Glowing star
  FOCUSED: '&#127919;',       // Direct hit
  CALM: '&#128524;',          // Relieved face
  NEUTRAL: '&#128528;',       // Neutral face
  UNCERTAIN: '&#129300;',     // Thinking face
  CAUTIOUS: '&#128065;',      // Eye
  ANXIOUS: '&#128553;',       // Anguished face
  NERVOUS: '&#128556;',       // Grimacing face
  FRUSTRATED: '&#128545;',    // Pouting face
  FEARFUL: '&#128560;',       // Fearful face
  REGRETFUL: '&#128542;',     // Disappointed face
  FOMO: '&#129402;',          // Hot face
};

const TREND_CONFIG = {
  improving: {
    icon: TrendingUp,
    label: 'Improving',
    color: 'text-green-600 dark:text-green-400',
  },
  declining: {
    icon: TrendingDown,
    label: 'Declining',
    color: 'text-red-600 dark:text-red-400',
  },
  stable: {
    icon: Minus,
    label: 'Stable',
    color: 'text-slate-600 dark:text-slate-400',
  },
};

export function MoodTrendWidget({
  moodData = [],
  currentMood,
  moodTrend = 'stable',
  topMoods = [],
  className,
}: MoodTrendWidgetProps) {
  const trendConfig = TREND_CONFIG[moodTrend];
  const TrendIcon = trendConfig.icon;

  // Calculate mood distribution
  const moodCounts = topMoods.slice(0, 4);
  const totalCount = moodCounts.reduce((sum, m) => sum + m.count, 0);

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Smile className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Mood Trends
          </h3>
        </div>
        {moodData.length > 0 && (
          <div className={cn('flex items-center gap-1 text-sm', trendConfig.color)}>
            <TrendIcon className="h-4 w-4" />
            <span className="text-xs">{trendConfig.label}</span>
          </div>
        )}
      </div>

      {/* Current Mood */}
      {currentMood && (
        <div className="text-center mb-4">
          <span
            className="text-4xl"
            dangerouslySetInnerHTML={{
              __html: MOOD_EMOJIS[currentMood] || MOOD_EMOJIS.NEUTRAL,
            }}
          />
          <p className="text-xs text-slate-500 mt-1">
            Latest: {currentMood.charAt(0) + currentMood.slice(1).toLowerCase()}
          </p>
        </div>
      )}

      {/* Mood Distribution */}
      {moodCounts.length > 0 ? (
        <div className="flex-1">
          <p className="text-xs text-slate-500 mb-2">This week&apos;s moods</p>
          <div className="space-y-2">
            {moodCounts.map((moodItem) => {
              const percentage = totalCount > 0 ? (moodItem.count / totalCount) * 100 : 0;
              return (
                <div key={moodItem.mood} className="flex items-center gap-2">
                  <span
                    className="text-lg w-6 flex-shrink-0"
                    dangerouslySetInnerHTML={{
                      __html: MOOD_EMOJIS[moodItem.mood] || MOOD_EMOJIS.NEUTRAL,
                    }}
                  />
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 dark:bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-8 text-right">
                    {moodItem.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track your moods in journal entries to see trends
          </p>
        </div>
      )}

      {/* Simple Trend Line (if data available) */}
      {moodData.length > 2 && (
        <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between h-8">
            {moodData.slice(-7).map((data) => (
              <div
                key={data.date}
                className={cn(
                  'w-2 rounded-full transition-all duration-300',
                  data.value > 0.3
                    ? 'bg-green-400 dark:bg-green-500'
                    : data.value < -0.3
                    ? 'bg-red-400 dark:bg-red-500'
                    : 'bg-amber-400 dark:bg-amber-500'
                )}
                style={{
                  height: `${Math.max(20, Math.abs(data.value) * 100)}%`,
                }}
                title={`${data.date}: ${data.mood}`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 text-center mt-1">Last 7 entries</p>
        </div>
      )}
    </div>
  );
}

// Skeleton for loading
export function MoodTrendWidgetSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-24 skeleton rounded" />
        <div className="h-4 w-16 skeleton rounded" />
      </div>
      <div className="text-center mb-4">
        <div className="h-10 w-10 skeleton rounded-full mx-auto mb-1" />
        <div className="h-3 w-20 skeleton rounded mx-auto" />
      </div>
      <div className="flex-1 space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-6 w-6 skeleton rounded-full" />
            <div className="flex-1 h-2 skeleton rounded-full" />
            <div className="h-3 w-6 skeleton rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
