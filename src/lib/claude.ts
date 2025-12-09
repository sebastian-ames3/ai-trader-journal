/**
 * Claude AI Client Utility
 *
 * Provides a lazy-initialized Anthropic client and model constants
 * for tiered AI usage across the application.
 *
 * Model Tiers:
 * - FAST (Haiku): Quick inference, ticker validation, similarity checks
 * - BALANCED (Sonnet): Entry analysis, vision, insights
 * - DEEP (Opus): Complex pattern analysis, monthly reports
 */

import Anthropic from '@anthropic-ai/sdk';

/**
 * Claude model constants with tiering strategy
 */
export const CLAUDE_MODELS = {
  /** Fast, cheap tasks - ticker validation, quick inference */
  FAST: 'claude-3-5-haiku-latest',

  /** Balanced tasks - entry analysis, vision, insights */
  BALANCED: 'claude-sonnet-4-20250514',

  /** Deep analysis - complex patterns, monthly reports */
  DEEP: 'claude-opus-4-5-20251101',
} as const;

export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS];

/**
 * Model selection helper based on task complexity
 */
export function selectModel(task: 'fast' | 'balanced' | 'deep'): ClaudeModel {
  switch (task) {
    case 'fast':
      return CLAUDE_MODELS.FAST;
    case 'balanced':
      return CLAUDE_MODELS.BALANCED;
    case 'deep':
      return CLAUDE_MODELS.DEEP;
    default:
      return CLAUDE_MODELS.BALANCED;
  }
}

// Lazy-initialized Anthropic client
let anthropicClient: Anthropic | null = null;

/**
 * Get the Anthropic client (lazy initialization)
 */
export function getClaude(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropicClient = new Anthropic({
      apiKey,
    });
  }
  return anthropicClient;
}

/**
 * Check if the Claude API is configured
 */
export function isClaudeConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Helper to extract text content from Claude message response
 */
export function extractTextContent(
  response: Anthropic.Message
): string {
  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  );
  return textBlock?.text || '';
}

/**
 * Helper to parse JSON from Claude response
 * Claude doesn't have a native JSON mode, so we parse from the response text
 */
export function parseJsonResponse<T>(response: Anthropic.Message): T | null {
  const text = extractTextContent(response);

  // Try to extract JSON from the response
  // Claude may wrap JSON in markdown code blocks
  let jsonStr = text;

  // Remove markdown code block if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // Try to find JSON object or array
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);

  if (objectMatch) {
    jsonStr = objectMatch[0];
  } else if (arrayMatch) {
    jsonStr = arrayMatch[0];
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    console.error('Failed to parse JSON from Claude response:', error);
    console.error('Response text:', text);
    return null;
  }
}

/**
 * Default max tokens for different task types
 */
export const DEFAULT_MAX_TOKENS = {
  fast: 500,
  balanced: 1000,
  deep: 4000,
} as const;

/**
 * Standard error handler for Anthropic API errors
 */
export function handleClaudeError(error: unknown): {
  status: number;
  message: string;
} {
  if (error instanceof Anthropic.APIError) {
    switch (error.status) {
      case 401:
        return { status: 401, message: 'Invalid Anthropic API key' };
      case 429:
        return { status: 429, message: 'Rate limit exceeded. Please try again later.' };
      case 529:
        return { status: 503, message: 'Claude is temporarily overloaded. Please try again.' };
      default:
        return { status: error.status || 500, message: error.message };
    }
  }

  if (error instanceof Error) {
    return { status: 500, message: error.message };
  }

  return { status: 500, message: 'An unknown error occurred' };
}
