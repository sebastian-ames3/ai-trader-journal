/**
 * Content sanitization utilities.
 *
 * Strips HTML tags from user-submitted content as a defense-in-depth measure.
 * Content is rendered via React (which auto-escapes), but stripping on storage
 * adds an extra layer of protection against stored XSS.
 */

/**
 * Strip HTML tags from a string while preserving the text content.
 * Handles self-closing tags, attributes, and nested tags.
 */
export function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize user-submitted entry content for safe storage.
 * - Strips HTML tags
 * - Trims leading/trailing whitespace
 */
export function sanitizeContent(content: string): string {
  return stripHtmlTags(content).trim();
}
