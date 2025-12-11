import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ShareType } from '@prisma/client';
import {
  generateShareSlug,
  hashAccessCode,
  getExpirationDate
} from '@/lib/sharing';

/**
 * GET /api/share/links
 * List user's share links
 */
export async function GET() {
  try {
    const links = await prisma.shareLink.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ links });
  } catch (error) {
    console.error('Error fetching share links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch share links' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/share/links
 * Create a new share link
 *
 * Body:
 * - type: ShareType (required)
 * - entryIds?: string[] (for entry-based shares)
 * - weekOffset?: number (for weekly insights)
 * - settings: {
 *     redactPL?: boolean
 *     redactTickers?: boolean
 *     redactDates?: boolean
 *     anonymize?: boolean
 *     expiresIn?: number (hours)
 *     maxViews?: number
 *     accessCode?: string
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.type) {
      return NextResponse.json(
        { error: 'Type is required' },
        { status: 400 }
      );
    }

    // Validate type enum
    if (!Object.values(ShareType).includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid share type' },
        { status: 400 }
      );
    }

    // Validate entryIds for entry-based shares
    if (
      (body.type === ShareType.SINGLE_ENTRY ||
        body.type === ShareType.ENTRY_COLLECTION) &&
      (!body.entryIds || body.entryIds.length === 0)
    ) {
      return NextResponse.json(
        { error: 'entryIds required for entry-based shares' },
        { status: 400 }
      );
    }

    // For SINGLE_ENTRY, ensure only one entry
    if (body.type === ShareType.SINGLE_ENTRY && body.entryIds?.length > 1) {
      return NextResponse.json(
        { error: 'Single entry share can only have one entry' },
        { status: 400 }
      );
    }

    // Verify entries exist
    if (body.entryIds && body.entryIds.length > 0) {
      const entries = await prisma.entry.findMany({
        where: { id: { in: body.entryIds } },
        select: { id: true }
      });

      if (entries.length !== body.entryIds.length) {
        return NextResponse.json(
          { error: 'One or more entries not found' },
          { status: 404 }
        );
      }
    }

    const settings = body.settings || {};

    // Generate slug
    const slug = generateShareSlug();

    // Hash access code if provided
    let hashedAccessCode = null;
    if (settings.accessCode) {
      hashedAccessCode = hashAccessCode(settings.accessCode);
    }

    // Calculate expiration date
    const expiresAt = getExpirationDate(settings.expiresIn);

    // Create share link
    const link = await prisma.shareLink.create({
      data: {
        slug,
        type: body.type,
        entryIds: body.entryIds || [],
        weekOffset: body.weekOffset ?? null,
        includeFields: settings.includeFields || [],
        redactPL: settings.redactPL ?? true,
        redactTickers: settings.redactTickers ?? false,
        redactDates: settings.redactDates ?? false,
        anonymize: settings.anonymize ?? false,
        expiresAt,
        maxViews: settings.maxViews ?? null,
        accessCode: hashedAccessCode,
        recipientEmail: settings.recipientEmail ?? null
      }
    });

    // Generate the full URL (using placeholder base URL - would be configured in production)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/share/${slug}`;

    return NextResponse.json({ link, url }, { status: 201 });
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}
