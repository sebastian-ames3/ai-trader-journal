import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Public health check endpoint for monitoring and deployment verification.
 * Returns database connectivity status and basic app info.
 */
export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {};

  // Database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  // Claude API key configured
  checks.ai = process.env.ANTHROPIC_API_KEY ? 'ok' : 'error';

  const allOk = Object.values(checks).every((v) => v === 'ok');

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  );
}
