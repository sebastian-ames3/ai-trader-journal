import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RelationshipStatus } from '@prisma/client';
import { startOfWeek, endOfWeek, subDays } from 'date-fns';

/**
 * Mentee overview with stats for the mentor dashboard
 */
interface MenteeOverview {
  relationshipId: string;
  menteeEmail: string;
  menteeName: string | null;
  connectedAt: Date;
  lastActive: Date | null;
  permissions: {
    shareWeeklyInsights: boolean;
    shareBiasPatterns: boolean;
    shareIndividualEntries: boolean;
    sharePLData: boolean;
  };
  stats: {
    totalEntries: number;
    weeklyEntries: number;
    currentStreak: number;
    topBias: string | null;
    dominantMood: string | null;
    moodTrend: 'improving' | 'declining' | 'stable';
  };
  sharedEntryCount: number;
}

/**
 * GET /api/mentors/dashboard
 * Get mentor dashboard with all mentees and their stats
 */
export async function GET() {
  try {
    // Get all active mentor relationships
    const relationships = await prisma.mentorRelationship.findMany({
      where: {
        status: RelationshipStatus.ACTIVE
      },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { acceptedAt: 'desc' }
    });

    // Get global stats for mentees
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const sevenDaysAgo = subDays(now, 7);

    // Build mentee overviews
    const mentees: MenteeOverview[] = await Promise.all(
      relationships.map(async (rel) => {
        // Get all entries for stats (this would be user-scoped in a real multi-user system)
        const allEntries = await prisma.entry.findMany({
          orderBy: { createdAt: 'desc' }
        });

        // Weekly entries
        const weeklyEntries = allEntries.filter(
          e => e.createdAt >= weekStart && e.createdAt <= weekEnd
        );

        // Recent entries for mood analysis
        const recentEntries = allEntries.filter(
          e => e.createdAt >= sevenDaysAgo
        );

        // Last entry date for activity
        const lastEntry = allEntries[0];

        // Get current streak from settings
        const settings = await prisma.settings.findFirst({
          where: { id: 'default' }
        });

        // Calculate top bias
        const biasCounts = new Map<string, number>();
        recentEntries.forEach(entry => {
          if (entry.detectedBiases) {
            entry.detectedBiases.forEach((bias: string) => {
              biasCounts.set(bias, (biasCounts.get(bias) || 0) + 1);
            });
          }
        });
        let topBias: string | null = null;
        let maxBiasCount = 0;
        biasCounts.forEach((count, bias) => {
          if (count > maxBiasCount) {
            maxBiasCount = count;
            topBias = bias;
          }
        });

        // Calculate dominant mood
        const moodCounts = new Map<string, number>();
        recentEntries.forEach(entry => {
          if (entry.mood) {
            moodCounts.set(entry.mood, (moodCounts.get(entry.mood) || 0) + 1);
          }
        });
        let dominantMood: string | null = null;
        let maxMoodCount = 0;
        moodCounts.forEach((count, mood) => {
          if (count > maxMoodCount) {
            maxMoodCount = count;
            dominantMood = mood;
          }
        });

        // Calculate mood trend (comparing first vs second half of week)
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

        let moodTrend: 'improving' | 'declining' | 'stable' = 'stable';
        if (ratioDiff > 0.1) moodTrend = 'improving';
        else if (ratioDiff < -0.1) moodTrend = 'declining';

        return {
          relationshipId: rel.id,
          menteeEmail: rel.mentorEmail, // In a real system this would be the mentee's email
          menteeName: rel.mentorName,
          connectedAt: rel.acceptedAt || rel.createdAt,
          lastActive: lastEntry?.createdAt || null,
          permissions: {
            shareWeeklyInsights: rel.shareWeeklyInsights,
            shareBiasPatterns: rel.shareBiasPatterns,
            shareIndividualEntries: rel.shareIndividualEntries,
            sharePLData: rel.sharePLData
          },
          stats: {
            totalEntries: allEntries.length,
            weeklyEntries: weeklyEntries.length,
            currentStreak: settings?.currentStreak || 0,
            topBias,
            dominantMood,
            moodTrend
          },
          sharedEntryCount: rel.sharedEntryIds.length
        };
      })
    );

    return NextResponse.json({ mentees });
  } catch (error) {
    console.error('Error fetching mentor dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentor dashboard' },
      { status: 500 }
    );
  }
}
