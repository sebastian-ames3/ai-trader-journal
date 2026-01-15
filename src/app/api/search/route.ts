import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * Search result types
 */
interface EntryResult {
  type: 'entry';
  id: string;
  title: string;
  content: string;
  entryType: string;
  ticker: string | null;
  createdAt: Date;
}

interface ThesisResult {
  type: 'thesis';
  id: string;
  title: string;
  content: string;
  ticker: string;
  status: string;
  createdAt: Date;
}

interface TradeResult {
  type: 'trade';
  id: string;
  title: string;
  content: string;
  ticker: string;
  thesisName: string | null;
  createdAt: Date;
}

type SearchResult = EntryResult | ThesisResult | TradeResult;

interface SearchResponse {
  query: string;
  results: SearchResult[];
  counts: {
    entries: number;
    theses: number;
    trades: number;
    total: number;
  };
}

/**
 * GET /api/search
 * Global search across entries, theses, and trades
 *
 * Query params:
 * - q: Search query (required, min 2 chars)
 * - type: Filter by type ('entry' | 'thesis' | 'trade' | 'all')
 * - limit: Max results per type (default 10, max 50)
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim() || '';
    const type = searchParams.get('type') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

    // Validate query
    if (query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const results: SearchResult[] = [];
    let entriesCount = 0;
    let thesesCount = 0;
    let tradesCount = 0;

    // Search entries
    if (type === 'all' || type === 'entry') {
      const entries = await prisma.entry.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
          OR: [
            { content: { contains: query, mode: 'insensitive' } },
            { ticker: { contains: query, mode: 'insensitive' } },
            { aiTags: { has: query.toLowerCase() } },
          ],
        },
        select: {
          id: true,
          content: true,
          type: true,
          ticker: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      entriesCount = entries.length;
      entries.forEach((entry) => {
        results.push({
          type: 'entry',
          id: entry.id,
          title: truncate(entry.content, 60),
          content: highlightMatch(entry.content, query),
          entryType: entry.type,
          ticker: entry.ticker,
          createdAt: entry.createdAt,
        });
      });
    }

    // Search theses
    if (type === 'all' || type === 'thesis') {
      const theses = await prisma.tradingThesis.findMany({
        where: {
          userId: user.id,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { ticker: { contains: query, mode: 'insensitive' } },
            { originalThesis: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          ticker: true,
          originalThesis: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      thesesCount = theses.length;
      theses.forEach((thesis) => {
        results.push({
          type: 'thesis',
          id: thesis.id,
          title: thesis.name,
          content: highlightMatch(thesis.originalThesis, query),
          ticker: thesis.ticker,
          status: thesis.status,
          createdAt: thesis.createdAt,
        });
      });
    }

    // Search trades (ThesisTrade)
    if (type === 'all' || type === 'trade') {
      const trades = await prisma.thesisTrade.findMany({
        where: {
          userId: user.id,
          OR: [
            { description: { contains: query, mode: 'insensitive' } },
            { thesis: { ticker: { contains: query, mode: 'insensitive' } } },
            { thesis: { name: { contains: query, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true,
          description: true,
          openedAt: true,
          thesis: {
            select: {
              name: true,
              ticker: true,
            },
          },
        },
        orderBy: { openedAt: 'desc' },
        take: limit,
      });

      tradesCount = trades.length;
      trades.forEach((trade) => {
        results.push({
          type: 'trade',
          id: trade.id,
          title: truncate(trade.description, 60),
          content: highlightMatch(trade.description, query),
          ticker: trade.thesis?.ticker || '',
          thesisName: trade.thesis?.name || null,
          createdAt: trade.openedAt,
        });
      });
    }

    // Sort all results by date (most recent first)
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const response: SearchResponse = {
      query,
      results: results.slice(0, limit * 3), // Cap total results
      counts: {
        entries: entriesCount,
        theses: thesesCount,
        trades: tradesCount,
        total: entriesCount + thesesCount + tradesCount,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

/**
 * Truncate text to a max length with ellipsis
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Extract a snippet around the first match and highlight it
 */
function highlightMatch(text: string, query: string, contextLength = 100): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    return truncate(text, contextLength * 2);
  }

  // Calculate snippet boundaries
  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + query.length + contextLength);

  let snippet = text.slice(start, end);

  // Add ellipsis if we're not at the boundaries
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet;
}
