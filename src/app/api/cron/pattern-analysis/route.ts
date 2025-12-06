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

// Verify cron request (Vercel adds this header)
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In development, allow without auth
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // Vercel Cron doesn't send CRON_SECRET, it uses Authorization Bearer
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Also accept Vercel's cron signature
  const vercelCron = request.headers.get('x-vercel-cron');
  if (vercelCron) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Run pattern analysis
    const patterns = await analyzePatterns();

    // Check for pattern-breaking behavior
    const patternBreakingMessage = await checkPatternBreaking();

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

    // Check for new significant patterns to notify about
    const significantPatterns = patterns.filter(
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
