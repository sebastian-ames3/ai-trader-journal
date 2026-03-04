/**
 * Pattern Analysis Cron Job API Route
 *
 * GET /api/cron/pattern-analysis
 *
 * Called by Vercel Cron daily at 2 AM ET.
 * Runs full pattern analysis on recent entries for all users.
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzePatterns, checkPatternBreaking } from '@/lib/patternAnalysis';
import { sendAndLogNotification, shouldSendNotification } from '@/lib/notifications';
import { verifyCronRequest } from '@/lib/cronAuth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all distinct userIds that have entries
    const users = await prisma.entry.findMany({
      select: { userId: true },
      distinct: ['userId'],
      orderBy: { userId: 'asc' },
    });

    let totalPatterns = 0;
    let patternBreaks = 0;
    const userErrors: string[] = [];

    for (const { userId } of users) {
      try {
        // Run pattern analysis per user
        const userPatterns = await analyzePatterns(userId);
        totalPatterns += userPatterns.length;

        // Check for pattern-breaking behavior per user
        const breakingMsg = await checkPatternBreaking(userId);

        // Check for new significant patterns to notify about
        const significantPatterns = userPatterns.filter(
          (p) => p.confidence > 0.8 && p.occurrences >= 5
        );

        if (significantPatterns.length > 0) {
          const topPattern = significantPatterns[0];
          const shouldSend = await shouldSendNotification('HISTORICAL_CONTEXT', userId);

          if (shouldSend) {
            await sendAndLogNotification({
              type: 'HISTORICAL_CONTEXT',
              trigger: `pattern_detected_${topPattern.patternName}`,
              title: 'Pattern Detected',
              body: topPattern.description,
              url: '/insights/patterns',
              userId,
              data: {
                patternType: topPattern.patternType,
                patternName: topPattern.patternName,
                occurrences: topPattern.occurrences,
              },
            });
          }
        }

        // Send notification for pattern-breaking (positive reinforcement)
        if (breakingMsg) {
          patternBreaks++;
          const shouldSend = await shouldSendNotification('HISTORICAL_CONTEXT', userId);

          if (shouldSend) {
            await sendAndLogNotification({
              type: 'HISTORICAL_CONTEXT',
              trigger: 'pattern_breaking',
              title: 'Pattern Broken!',
              body: breakingMsg,
              url: '/insights',
              userId,
            });
          }
        }
      } catch (userError) {
        const msg = userError instanceof Error ? userError.message : String(userError);
        console.error(`Pattern analysis failed for user ${userId}:`, userError);
        userErrors.push(`${userId}: ${msg}`);
      }
    }

    if (userErrors.length > 0 && userErrors.length === users.length) {
      // All users failed — surface the first error so it shows up in GitHub Actions logs
      return NextResponse.json(
        {
          success: false,
          error: userErrors[0],
          usersAnalyzed: users.length,
          userErrors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      usersAnalyzed: users.length,
      totalPatterns,
      patternBreaks,
      ...(userErrors.length > 0 && { partialErrors: userErrors }),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Pattern analysis cron error:', error);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
