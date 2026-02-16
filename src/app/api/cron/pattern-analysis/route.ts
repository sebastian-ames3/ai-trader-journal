/**
 * Pattern Analysis Cron Job API Route
 *
 * GET /api/cron/pattern-analysis
 *
 * Called by Vercel Cron daily at 2 AM ET.
 * Runs full pattern analysis on recent entries.
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
    });

    let patternBreakingMessage: string | null = null;

    for (const { userId } of users) {
      // Run pattern analysis per user
      const userPatterns = await analyzePatterns(userId);
      // Check for pattern-breaking behavior per user
      const userBreakingMsg = await checkPatternBreaking(userId);
      if (userBreakingMsg) patternBreakingMessage = userBreakingMsg;

      // Check for new significant patterns to notify about
      const significantPatterns = userPatterns.filter(
        (p) => p.confidence > 0.8 && p.occurrences >= 5
      );

      if (significantPatterns.length > 0) {
        const topPattern = significantPatterns[0];
        const shouldSend = await shouldSendNotification('HISTORICAL_CONTEXT');

        if (shouldSend) {
          await sendAndLogNotification({
            type: 'HISTORICAL_CONTEXT',
            trigger: `pattern_detected_${topPattern.patternName}`,
            title: 'Pattern Detected',
            body: topPattern.description,
            url: '/insights/patterns',
            data: {
              patternType: topPattern.patternType,
              patternName: topPattern.patternName,
              occurrences: topPattern.occurrences,
            },
          });
        }
      }
    }

    // Kept outside the loop for backwards compat with the original return shape
    const patterns = users.length > 0 ? await analyzePatterns(users[0].userId) : [];

    // Send notification for pattern-breaking (positive reinforcement)
    if (patternBreakingMessage) {
      const shouldSend = await shouldSendNotification('HISTORICAL_CONTEXT');

      if (shouldSend) {
        await sendAndLogNotification({
          type: 'HISTORICAL_CONTEXT',
          trigger: 'pattern_breaking',
          title: 'Pattern Broken!',
          body: patternBreakingMessage,
          url: '/insights',
        });
      }
    }

    return NextResponse.json({
      success: true,
      patternsDetected: patterns.length,
      patterns: patterns.map((p) => ({
        name: p.patternName,
        type: p.patternType,
        occurrences: p.occurrences,
        confidence: p.confidence,
      })),
      patternBreaking: !!patternBreakingMessage,
    });
  } catch (error) {
    console.error('Pattern analysis cron error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
