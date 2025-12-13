import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PairStatus } from '@prisma/client';
import { startOfWeek, endOfWeek, subDays, format } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * User stats for accountability comparison
 */
interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
  weeklyEntries: number;
  weeklyActivity: boolean[]; // Array of 7 booleans for each day of the week
  biasDistribution?: Record<string, number>;
  moodTrend?: 'improving' | 'declining' | 'stable';
  dominantMood?: string;
}

/**
 * GET /api/accountability/partner
 * Get accountability partner status and comparison stats
 */
export async function GET() {
  try {
    // Find active accountability partnership
    const pair = await prisma.accountabilityPair.findFirst({
      where: {
        status: PairStatus.ACTIVE
      }
    });

    if (!pair) {
      return NextResponse.json(
        { error: 'No active accountability partner found' },
        { status: 404 }
      );
    }

    // Calculate date ranges
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const sevenDaysAgo = subDays(now, 7);

    // Get user's settings for streak data
    const settings = await prisma.settings.findFirst({
      where: { id: 'default' }
    });

    // Get user's entries
    const userEntries = await prisma.entry.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Calculate weekly entries
    const userWeeklyEntries = userEntries.filter(
      e => e.createdAt >= weekStart && e.createdAt <= weekEnd
    );

    // Calculate weekly activity (which days had entries)
    const userWeeklyActivity: boolean[] = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(weekStart);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const hasEntry = userWeeklyEntries.some(
        e => e.createdAt >= dayStart && e.createdAt <= dayEnd
      );
      userWeeklyActivity.push(hasEntry);
    }

    // Build user stats
    const yourStats: UserStats = {
      currentStreak: settings?.currentStreak || 0,
      longestStreak: settings?.longestStreak || 0,
      totalEntries: settings?.totalEntries || userEntries.length,
      weeklyEntries: userWeeklyEntries.length,
      weeklyActivity: userWeeklyActivity
    };

    // Add optional stats based on sharing settings
    if (pair.shareBiasDistribution) {
      const recentEntries = userEntries.filter(e => e.createdAt >= sevenDaysAgo);
      const biasDistribution: Record<string, number> = {};
      recentEntries.forEach(entry => {
        if (entry.detectedBiases) {
          entry.detectedBiases.forEach((bias: string) => {
            biasDistribution[bias] = (biasDistribution[bias] || 0) + 1;
          });
        }
      });
      yourStats.biasDistribution = biasDistribution;
    }

    if (pair.shareMoodTrend) {
      const recentEntries = userEntries.filter(e => e.createdAt >= sevenDaysAgo);

      // Calculate mood trend
      const halfwayPoint = new Date(sevenDaysAgo.getTime() + 3.5 * 24 * 60 * 60 * 1000);
      const firstHalf = recentEntries.filter(e => e.createdAt < halfwayPoint);
      const secondHalf = recentEntries.filter(e => e.createdAt >= halfwayPoint);

      const getPositiveRatio = (entries: typeof recentEntries) => {
        const positive = entries.filter(e => e.sentiment === 'positive').length;
        return entries.length > 0 ? positive / entries.length : 0.5;
      };

      const firstHalfRatio = getPositiveRatio(firstHalf);
      const secondHalfRatio = getPositiveRatio(secondHalf);
      const ratioDiff = secondHalfRatio - firstHalfRatio;

      if (ratioDiff > 0.1) yourStats.moodTrend = 'improving';
      else if (ratioDiff < -0.1) yourStats.moodTrend = 'declining';
      else yourStats.moodTrend = 'stable';

      // Calculate dominant mood
      const moodCounts = new Map<string, number>();
      recentEntries.forEach(entry => {
        if (entry.mood) {
          moodCounts.set(entry.mood, (moodCounts.get(entry.mood) || 0) + 1);
        }
      });
      let dominantMood: string | undefined;
      let maxMoodCount = 0;
      moodCounts.forEach((count, mood) => {
        if (count > maxMoodCount) {
          maxMoodCount = count;
          dominantMood = mood;
        }
      });
      yourStats.dominantMood = dominantMood;
    }

    // Partner stats would come from the partner's data in a real multi-user system
    // For now, we return placeholder data showing what would be shared
    const partnerStats: UserStats = {
      currentStreak: 0, // Would be fetched from partner's data
      longestStreak: 0,
      totalEntries: 0,
      weeklyEntries: 0,
      weeklyActivity: [false, false, false, false, false, false, false]
    };

    // Generate comparison message
    let comparisonMessage = '';
    if (yourStats.currentStreak > partnerStats.currentStreak) {
      comparisonMessage = `You're on a ${yourStats.currentStreak}-day streak! Keep going!`;
    } else if (yourStats.currentStreak < partnerStats.currentStreak) {
      comparisonMessage = `Your partner is ahead! Time to catch up.`;
    } else if (yourStats.currentStreak > 0) {
      comparisonMessage = `You're both on ${yourStats.currentStreak}-day streaks! Keep pushing together.`;
    } else {
      comparisonMessage = 'Start journaling to build your streak!';
    }

    // Calculate entries comparison
    const entriesDiff = yourStats.weeklyEntries - partnerStats.weeklyEntries;
    let entriesMessage = '';
    if (entriesDiff > 0) {
      const percentMore = Math.round(
        ((yourStats.weeklyEntries - partnerStats.weeklyEntries) /
          Math.max(partnerStats.weeklyEntries, 1)) *
          100
      );
      entriesMessage = `You're journaling ${percentMore}% more this week!`;
    } else if (entriesDiff < 0) {
      entriesMessage = 'Your partner is journaling more this week. Can you catch up?';
    } else {
      entriesMessage = `You both have ${yourStats.weeklyEntries} entries this week.`;
    }

    return NextResponse.json({
      partner: {
        id: pair.id,
        email: pair.partnerEmail,
        name: pair.partnerName,
        connectedAt: pair.acceptedAt,
        status: pair.status,
        sharingSettings: {
          shareStreak: pair.shareStreak,
          shareEntryCount: pair.shareEntryCount,
          shareBiasDistribution: pair.shareBiasDistribution,
          shareMoodTrend: pair.shareMoodTrend
        },
        notifications: {
          notifyOnJournal: pair.notifyOnJournal,
          notifyOnMilestone: pair.notifyOnMilestone,
          notifyOnStreakBreak: pair.notifyOnStreakBreak
        }
      },
      yourStats,
      partnerStats,
      comparison: {
        message: comparisonMessage,
        entriesMessage,
        weekLabel: `Week of ${format(weekStart, 'MMM d')}`
      }
    });
  } catch (error) {
    console.error('Error fetching accountability partner:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accountability partner' },
      { status: 500 }
    );
  }
}
