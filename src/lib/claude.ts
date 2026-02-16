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
 * Using -latest aliases for automatic updates to newest versions
 */
export const CLAUDE_MODELS = {
  /** Fast, cheap tasks - ticker validation, quick inference (Haiku) */
  FAST: 'claude-haiku-4-5-20251001',

  /** Balanced tasks - entry analysis, vision, insights, chart analysis */
  BALANCED: 'claude-sonnet-4-5-20250929',

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
      timeout: 30_000, // 30s default timeout for all API calls
      maxRetries: 2, // Retry on 429/529 with exponential backoff
    });
  }
  return anthropicClient;
}

/**
 * Instrumented wrapper around claude.messages.create() that automatically
 * logs usage metrics (tokens, cost, duration) for every AI call.
 *
 * Usage: `const response = await createMessage('entryAnalysis', { model, ... })`
 */
export async function createMessage(
  caller: string,
  params: Anthropic.MessageCreateParamsNonStreaming,
  options?: Parameters<Anthropic.Messages['create']>[1]
): Promise<Anthropic.Message> {
  const claude = getClaude();
  const start = Date.now();
  const response = await claude.messages.create(params, options);
  logAIUsage(caller, params.model, response, Date.now() - start);
  return response;
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
 * Sanitize user content before embedding in AI prompts.
 * Strips XML-like tags that could be confused with prompt structure delimiters.
 */
export function sanitizeForPrompt(text: string): string {
  return text
    .replace(/<\/?(?:journal_entry|user_content|system|assistant|human|entry_content|trade_data|draft_content)[^>]*>/gi, '')
    .replace(/"""/g, '\\"\\"\\\"');
}

/**
 * Rough token estimation (1 token ≈ 4 characters).
 * Useful for usage monitoring and logging.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
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

// ── AI Usage Monitoring ─────────────────────────────────────────────

/** Cost per 1M tokens by model (input / output) */
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5-20251001': { input: 0.25, output: 1.25 },
  'claude-sonnet-4-5-20250929': { input: 3, output: 15 },
  'claude-opus-4-5-20251101': { input: 15, output: 75 },
};

interface AIUsageEntry {
  timestamp: string;
  caller: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  durationMs: number;
}

// Rolling in-memory log of recent API calls (last 100)
const usageLog: AIUsageEntry[] = [];
const MAX_USAGE_LOG = 100;

/**
 * Log AI API usage after a Claude call.
 * Call this after every claude.messages.create() to track costs.
 */
export function logAIUsage(
  caller: string,
  model: string,
  response: Anthropic.Message,
  durationMs: number
): void {
  const { input_tokens, output_tokens } = response.usage;
  const costs = MODEL_COSTS[model] || { input: 3, output: 15 }; // default to Sonnet pricing
  const estimatedCost =
    (input_tokens / 1_000_000) * costs.input +
    (output_tokens / 1_000_000) * costs.output;

  const entry: AIUsageEntry = {
    timestamp: new Date().toISOString(),
    caller,
    model,
    inputTokens: input_tokens,
    outputTokens: output_tokens,
    estimatedCost,
    durationMs,
  };

  usageLog.push(entry);
  if (usageLog.length > MAX_USAGE_LOG) {
    usageLog.shift();
  }

  // Always log to console so it shows in Vercel logs
  console.log(
    `[AI Usage] ${caller} | ${model.split('-').slice(1, 3).join('-')} | ${input_tokens}→${output_tokens} tokens | $${estimatedCost.toFixed(4)} | ${durationMs}ms`
  );
}

/**
 * Get recent AI usage entries for the monitoring dashboard.
 */
export function getAIUsageLog(): AIUsageEntry[] {
  return [...usageLog];
}

/**
 * Get aggregate AI usage stats.
 */
export function getAIUsageStats(): {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalEstimatedCost: number;
  byModel: Record<string, { calls: number; cost: number }>;
  byCaller: Record<string, { calls: number; cost: number }>;
} {
  const byModel: Record<string, { calls: number; cost: number }> = {};
  const byCaller: Record<string, { calls: number; cost: number }> = {};
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalEstimatedCost = 0;

  for (const entry of usageLog) {
    totalInputTokens += entry.inputTokens;
    totalOutputTokens += entry.outputTokens;
    totalEstimatedCost += entry.estimatedCost;

    const modelKey = entry.model.split('-').slice(1, 3).join('-');
    if (!byModel[modelKey]) byModel[modelKey] = { calls: 0, cost: 0 };
    byModel[modelKey].calls++;
    byModel[modelKey].cost += entry.estimatedCost;

    if (!byCaller[entry.caller]) byCaller[entry.caller] = { calls: 0, cost: 0 };
    byCaller[entry.caller].calls++;
    byCaller[entry.caller].cost += entry.estimatedCost;
  }

  return {
    totalCalls: usageLog.length,
    totalInputTokens,
    totalOutputTokens,
    totalEstimatedCost,
    byModel,
    byCaller,
  };
}
