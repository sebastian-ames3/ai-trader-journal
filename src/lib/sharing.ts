/**
 * Sharing Service Library
 *
 * Provides utilities for share link management:
 * - URL slug generation
 * - Entry redaction based on privacy settings
 * - Share link access validation
 * - Access code hashing and verification
 */

import { prisma } from './prisma';
import { ShareLink, Entry } from '@prisma/client';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Redaction settings for shared content
 */
export interface RedactionSettings {
  redactPL: boolean;
  redactTickers: boolean;
  redactDates: boolean;
  anonymize: boolean;
}

/**
 * Redacted entry type with optional fields set to null/masked
 */
export interface RedactedEntry {
  id: string;
  type: string;
  content: string;
  mood: string | null;
  conviction: string | null;
  ticker: string | null;
  sentiment: string | null;
  emotionalKeywords: string[];
  detectedBiases: string[];
  aiTags: string[];
  createdAt: Date | null;
  updatedAt: Date | null;
}

/**
 * Generate a unique URL-friendly slug for share links
 * Uses crypto randomBytes for security
 */
export function generateShareSlug(): string {
  // Generate 12 random bytes and convert to base64url
  const bytes = randomBytes(12);
  const slug = bytes.toString('base64url');
  return slug;
}

/**
 * Redact sensitive information from an entry based on settings
 */
export function redactEntry(entry: Entry, settings: RedactionSettings): RedactedEntry {
  let content = entry.content;

  // Redact P/L amounts (dollar amounts and percentages)
  if (settings.redactPL) {
    // Redact dollar amounts like $1,234.56 or $50000
    content = content.replace(/\$[\d,]+(\.\d{2})?/g, '[REDACTED]');
    // Redact percentage gains/losses like +15.5% or -20%
    content = content.replace(/[+-]?\d+(\.\d+)?%/g, '[X%]');
  }

  // Redact ticker symbols
  if (settings.redactTickers) {
    // Redact ticker patterns like $AAPL, NVDA, TSLA (1-5 uppercase letters)
    content = content.replace(/\$?[A-Z]{1,5}\b/g, '[TICKER]');
  }

  // Build redacted entry
  const redacted: RedactedEntry = {
    id: settings.anonymize ? generateAnonymousId() : entry.id,
    type: entry.type,
    content,
    mood: entry.mood,
    conviction: entry.conviction,
    ticker: settings.redactTickers ? null : entry.ticker,
    sentiment: entry.sentiment,
    emotionalKeywords: entry.emotionalKeywords || [],
    detectedBiases: entry.detectedBiases || [],
    aiTags: entry.aiTags || [],
    createdAt: settings.redactDates ? null : entry.createdAt,
    updatedAt: settings.redactDates ? null : entry.updatedAt,
  };

  return redacted;
}

/**
 * Generate an anonymous ID for fully anonymized shares
 */
function generateAnonymousId(): string {
  return `anon_${randomBytes(8).toString('hex')}`;
}

/**
 * Hash an access code for secure storage
 * Uses SHA-256 with a random salt
 */
export function hashAccessCode(code: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(salt + code)
    .digest('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify an access code against a stored hash
 */
export function verifyAccessCode(code: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;

  const [salt, expectedHash] = parts;
  const actualHash = createHash('sha256')
    .update(salt + code)
    .digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  try {
    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    const actualBuffer = Buffer.from(actualHash, 'hex');
    return timingSafeEqual(expectedBuffer, actualBuffer);
  } catch {
    return false;
  }
}

/**
 * Validation result for share access
 */
export interface ShareAccessResult {
  valid: boolean;
  link: ShareLink | null;
  error?: string;
}

/**
 * Validate share link access
 * Checks expiration, view limits, and access code
 * Increments view count on successful access
 */
export async function validateShareAccess(
  slug: string,
  providedCode?: string
): Promise<ShareAccessResult> {
  // Find the share link by slug
  const link = await prisma.shareLink.findUnique({
    where: { slug }
  });

  // Check if link exists and is active
  if (!link) {
    return { valid: false, link: null, error: 'Share link not found' };
  }

  if (!link.isActive) {
    return { valid: false, link: null, error: 'Share link has been revoked' };
  }

  // Check expiration
  if (link.expiresAt && link.expiresAt < new Date()) {
    // Auto-deactivate expired links
    await prisma.shareLink.update({
      where: { id: link.id },
      data: { isActive: false }
    });
    return { valid: false, link: null, error: 'Share link has expired' };
  }

  // Check view limit
  if (link.maxViews && link.viewCount >= link.maxViews) {
    return { valid: false, link: null, error: 'Share link view limit reached' };
  }

  // Check access code
  if (link.accessCode) {
    if (!providedCode) {
      return { valid: false, link: null, error: 'Access code required' };
    }
    const codeValid = verifyAccessCode(providedCode, link.accessCode);
    if (!codeValid) {
      return { valid: false, link: null, error: 'Invalid access code' };
    }
  }

  // Increment view count and update last viewed timestamp
  const updatedLink = await prisma.shareLink.update({
    where: { id: link.id },
    data: {
      viewCount: { increment: 1 },
      lastViewedAt: new Date()
    }
  });

  return { valid: true, link: updatedLink };
}

/**
 * Get entries for a share link with proper redaction applied
 */
export async function getSharedEntries(
  link: ShareLink
): Promise<RedactedEntry[]> {
  if (link.entryIds.length === 0) {
    return [];
  }

  const entries = await prisma.entry.findMany({
    where: {
      id: { in: link.entryIds }
    },
    orderBy: { createdAt: 'desc' }
  });

  const redactionSettings: RedactionSettings = {
    redactPL: link.redactPL,
    redactTickers: link.redactTickers,
    redactDates: link.redactDates,
    anonymize: link.anonymize
  };

  return entries.map(entry => redactEntry(entry, redactionSettings));
}

/**
 * Generate expiration date from hours
 */
export function getExpirationDate(expiresInHours?: number): Date | null {
  if (!expiresInHours || expiresInHours <= 0) {
    return null;
  }
  const now = new Date();
  return new Date(now.getTime() + expiresInHours * 60 * 60 * 1000);
}
