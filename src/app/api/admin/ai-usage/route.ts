/**
 * AI Usage Monitoring API Route
 *
 * GET /api/admin/ai-usage
 * Returns recent AI API usage stats (tokens, costs, breakdown by model/caller).
 * Restricted to admin user.
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAIUsageLog, getAIUsageStats } from '@/lib/claude';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    // Admin role check
    const adminUserId = process.env.ADMIN_USER_ID;
    if (adminUserId && user.id !== adminUserId) {
      return NextResponse.json(
        { error: 'Forbidden: admin access required' },
        { status: 403 }
      );
    }

    const stats = getAIUsageStats();
    const recentCalls = getAIUsageLog().slice(-25); // Last 25 calls

    return NextResponse.json({
      stats,
      recentCalls,
      note: 'In-memory log — resets on cold start. Check Vercel logs for persistent [AI Usage] entries.',
    });
  } catch (error) {
    console.error('[AI Usage] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}
