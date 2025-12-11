import { NextRequest, NextResponse } from 'next/server';
import { ShareType } from '@prisma/client';
import {
  validateShareAccess,
  getSharedEntries,
  RedactedEntry
} from '@/lib/sharing';
import { generateWeeklyInsights } from '@/lib/weeklyInsights';

/**
 * Shared content response type
 */
interface SharedContent {
  type: ShareType;
  entries?: RedactedEntry[];
  weeklyInsights?: unknown;
  viewCount: number;
  expiresAt?: Date | null;
}

/**
 * GET /api/share/links/[id]
 * Get public share content by slug (id parameter represents the slug)
 *
 * Query params:
 * - code: Access code (optional, required if link is password-protected)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code') || undefined;
    const slug = params.id; // The id param represents the slug for public access

    // Validate access
    const accessResult = await validateShareAccess(slug, code);

    if (!accessResult.valid || !accessResult.link) {
      const status = accessResult.error === 'Access code required' ? 401 : 404;
      return NextResponse.json(
        { error: accessResult.error || 'Access denied' },
        { status }
      );
    }

    const link = accessResult.link;
    const response: SharedContent = {
      type: link.type,
      viewCount: link.viewCount,
      expiresAt: link.expiresAt
    };

    // Get content based on share type
    switch (link.type) {
      case ShareType.SINGLE_ENTRY:
      case ShareType.ENTRY_COLLECTION:
        response.entries = await getSharedEntries(link);
        break;

      case ShareType.WEEKLY_INSIGHTS:
        const weekOffset = link.weekOffset ?? 0;
        response.weeklyInsights = await generateWeeklyInsights(weekOffset);
        break;

      case ShareType.STATS_SUMMARY:
        // Stats summary is a subset of weekly insights
        const stats = await generateWeeklyInsights(0);
        response.weeklyInsights = {
          stats: stats.stats,
          emotional: {
            dominantSentiment: stats.emotional.dominantSentiment,
            moodFrequency: stats.emotional.moodFrequency
          },
          patterns: {
            convictionDistribution: stats.patterns.convictionDistribution
          }
        };
        break;

      case ShareType.MENTOR_ACCESS:
      case ShareType.ACCOUNTABILITY:
        // These types get entries plus insights
        response.entries = await getSharedEntries(link);
        response.weeklyInsights = await generateWeeklyInsights(0);
        break;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching shared content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared content' },
      { status: 500 }
    );
  }
}
