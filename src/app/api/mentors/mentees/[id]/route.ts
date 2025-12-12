import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RelationshipStatus } from '@prisma/client';
import { generateWeeklyInsights } from '@/lib/weeklyInsights';
import { redactEntry, RedactionSettings } from '@/lib/sharing';

/**
 * GET /api/mentors/mentees/[id]
 * Get a mentee's shared content (as a mentor)
 *
 * Path params:
 * - id: The mentor relationship ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the mentor relationship
    const relationship = await prisma.mentorRelationship.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!relationship) {
      return NextResponse.json(
        { error: 'Mentor relationship not found' },
        { status: 404 }
      );
    }

    // Check if relationship is active
    if (relationship.status !== RelationshipStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'Mentor relationship is not active' },
        { status: 403 }
      );
    }

    const response: {
      relationship: typeof relationship;
      sharedEntries?: unknown[];
      weeklyInsights?: unknown;
      biasPatterns?: unknown;
    } = {
      relationship
    };

    // Get shared entries if permitted
    if (
      relationship.shareIndividualEntries &&
      relationship.sharedEntryIds.length > 0
    ) {
      const entries = await prisma.entry.findMany({
        where: {
          id: { in: relationship.sharedEntryIds }
        },
        orderBy: { createdAt: 'desc' },
        include: { tags: true }
      });

      // Apply redaction based on P/L sharing permission
      const redactionSettings: RedactionSettings = {
        redactPL: !relationship.sharePLData,
        redactTickers: false,
        redactDates: false,
        anonymize: false
      };

      response.sharedEntries = entries.map(entry =>
        redactEntry(entry, redactionSettings)
      );
    }

    // Get weekly insights if permitted
    if (relationship.shareWeeklyInsights) {
      const weeklyInsights = await generateWeeklyInsights(0);

      // Optionally filter out P/L data if not shared
      if (!relationship.sharePLData) {
        // The weekly insights don't include P/L by default, so no filtering needed
      }

      response.weeklyInsights = weeklyInsights;
    }

    // Get bias patterns if permitted
    if (relationship.shareBiasPatterns) {
      // Get active pattern insights
      const patterns = await prisma.patternInsight.findMany({
        where: {
          isActive: true,
          isDismissed: false
        },
        orderBy: [
          { confidence: 'desc' },
          { occurrences: 'desc' }
        ],
        take: 10
      });

      response.biasPatterns = patterns.map(p => ({
        id: p.id,
        patternType: p.patternType,
        patternName: p.patternName,
        description: p.description,
        occurrences: p.occurrences,
        trend: p.trend,
        confidence: p.confidence
      }));
    }

    // Update last interaction timestamp
    await prisma.mentorRelationship.update({
      where: { id },
      data: { lastInteraction: new Date() }
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching mentee content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentee content' },
      { status: 500 }
    );
  }
}
