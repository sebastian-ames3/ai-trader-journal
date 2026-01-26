/**
 * Taxonomy Constants
 *
 * Central source of truth for all taxonomy-related constants:
 * - Entry types
 * - Cognitive biases
 * - Tags (psychology-focused)
 * - Sentiments
 * - Trade outcomes
 * - Trade source types
 * - Moods
 *
 * All components and API routes should import from here
 * rather than defining their own constants.
 */

// ===========================================
// ENTRY TYPES
// ===========================================

export const ENTRY_TYPES = {
  IDEA: 'IDEA',
  DECISION: 'DECISION',
  REFLECTION: 'REFLECTION',
  OBSERVATION: 'OBSERVATION',
} as const;

export type EntryType = (typeof ENTRY_TYPES)[keyof typeof ENTRY_TYPES];

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  IDEA: 'Idea',
  DECISION: 'Decision',
  REFLECTION: 'Reflection',
  OBSERVATION: 'Observation',
};

export const ENTRY_TYPE_DESCRIPTIONS: Record<EntryType, string> = {
  IDEA: 'Pre-decision thinking and trade ideas',
  DECISION: 'Documenting an action taken',
  REFLECTION: 'Post-hoc analysis and lessons learned',
  OBSERVATION: 'General notes and market observations',
};

export const ENTRY_TYPE_COLORS: Record<EntryType, { bg: string; text: string; border: string }> = {
  IDEA: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  DECISION: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  REFLECTION: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-800 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  OBSERVATION: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
  },
};

// Array for iteration (e.g., filter dropdowns)
export const ENTRY_TYPE_OPTIONS: Array<{ value: EntryType; label: string }> = [
  { value: 'IDEA', label: 'Idea' },
  { value: 'DECISION', label: 'Decision' },
  { value: 'REFLECTION', label: 'Reflection' },
  { value: 'OBSERVATION', label: 'Observation' },
];

// ===========================================
// COGNITIVE BIASES
// ===========================================

export const BIASES = {
  CONFIRMATION_BIAS: 'confirmation_bias',
  RECENCY_BIAS: 'recency_bias',
  LOSS_AVERSION: 'loss_aversion',
  OVERCONFIDENCE: 'overconfidence',
  FOMO: 'fomo',
  REVENGE_TRADING: 'revenge_trading',
  ANCHORING: 'anchoring',
  HERD_MENTALITY: 'herd_mentality',
  OUTCOME_BIAS: 'outcome_bias',
  SUNK_COST: 'sunk_cost',
} as const;

export type CognitiveBias = (typeof BIASES)[keyof typeof BIASES];

export const BIAS_LABELS: Record<CognitiveBias, string> = {
  confirmation_bias: 'Confirmation Bias',
  recency_bias: 'Recency Bias',
  loss_aversion: 'Loss Aversion',
  overconfidence: 'Overconfidence',
  fomo: 'FOMO',
  revenge_trading: 'Revenge Trading',
  anchoring: 'Anchoring',
  herd_mentality: 'Herd Mentality',
  outcome_bias: 'Outcome Bias',
  sunk_cost: 'Sunk Cost Fallacy',
};

export const BIAS_DESCRIPTIONS: Record<CognitiveBias, string> = {
  confirmation_bias: 'Seeking information that confirms existing beliefs',
  recency_bias: 'Overweighting recent events or information',
  loss_aversion: 'Fear of losses disproportionately influencing decisions',
  overconfidence: 'Excessive certainty without supporting evidence',
  fomo: 'Fear of missing out driving rushed decisions',
  revenge_trading: 'Emotional response to losses, trying to recover quickly',
  anchoring: 'Fixating on a specific price or reference point',
  herd_mentality: 'Following others without independent analysis',
  outcome_bias: 'Judging decisions by results rather than process',
  sunk_cost: 'Continuing due to prior investment rather than future prospects',
};

// All bias values as array for iteration
export const ALL_BIASES = Object.values(BIASES);

// Bias options for filters and forms
export const BIAS_OPTIONS: Array<{ value: CognitiveBias; label: string }> = ALL_BIASES.map(
  (bias) => ({
    value: bias,
    label: BIAS_LABELS[bias],
  })
);

// ===========================================
// TAG TAXONOMY (Psychology-Focused)
// ===========================================

export const TAG_CATEGORIES = {
  MINDSET: 'MINDSET',
  PROCESS: 'PROCESS',
  STANCE: 'STANCE',
  AWARENESS: 'AWARENESS',
  CONTEXT: 'CONTEXT',
} as const;

export type TagCategory = (typeof TAG_CATEGORIES)[keyof typeof TAG_CATEGORIES];

export const TAG_CATEGORY_LABELS: Record<TagCategory, string> = {
  MINDSET: 'Mindset',
  PROCESS: 'Process',
  STANCE: 'Stance',
  AWARENESS: 'Awareness',
  CONTEXT: 'Context',
};

export const TAG_CATEGORY_DESCRIPTIONS: Record<TagCategory, string> = {
  MINDSET: 'Psychological state during trading',
  PROCESS: 'Decision-making quality and approach',
  STANCE: 'Market view and position bias',
  AWARENESS: 'Metacognition and self-reflection',
  CONTEXT: 'Situational factors and environment',
};

export const TAG_TAXONOMY: Record<TagCategory, readonly string[]> = {
  MINDSET: [
    'disciplined',
    'patient',
    'impulsive',
    'emotional',
    'rushed',
    'focused',
    'distracted',
    'confident',
    'hesitant',
    'anxious',
    'calm',
    'frustrated',
    'overthinking',
    'clear-headed',
  ] as const,
  PROCESS: [
    'well-researched',
    'systematic',
    'reactive',
    'planned',
    'spontaneous',
    'reasoned',
    'gut-feel',
    'rule-following',
    'rule-breaking',
    'checklist-used',
  ] as const,
  STANCE: [
    'bullish',
    'bearish',
    'neutral',
    'uncertain',
    'contrarian',
    'consensus',
    'waiting',
    'conflicted',
  ] as const,
  AWARENESS: [
    'mistake-acknowledged',
    'learning-captured',
    'pattern-recognized',
    'blind-spot-identified',
    'growth-oriented',
    'defensive',
    'self-critical',
    'accountable',
  ] as const,
  CONTEXT: [
    'high-stakes',
    'routine',
    'experimental',
    'recovery-mode',
    'winning-streak',
    'losing-streak',
    'pre-market',
    'post-close',
  ] as const,
};

// Flat list of all valid tags for validation
export const ALL_TAGS: readonly string[] = Object.values(TAG_TAXONOMY).flat();

// Map tag to its category for lookups
export const TAG_TO_CATEGORY: Record<string, TagCategory> = Object.entries(TAG_TAXONOMY).reduce(
  (acc, [category, tags]) => {
    for (const tag of tags) {
      acc[tag] = category as TagCategory;
    }
    return acc;
  },
  {} as Record<string, TagCategory>
);

// Helper to check if a tag is valid
export function isValidTag(tag: string): boolean {
  return ALL_TAGS.includes(tag);
}

// Helper to get category for a tag
export function getTagCategory(tag: string): TagCategory | null {
  return TAG_TO_CATEGORY[tag] || null;
}

// ===========================================
// SENTIMENTS
// ===========================================

export const SENTIMENTS = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral',
} as const;

export type Sentiment = (typeof SENTIMENTS)[keyof typeof SENTIMENTS];

export const SENTIMENT_LABELS: Record<Sentiment, string> = {
  positive: 'Positive',
  negative: 'Negative',
  neutral: 'Neutral',
};

export const SENTIMENT_COLORS: Record<Sentiment, { bg: string; text: string }> = {
  positive: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
  },
  negative: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
  },
  neutral: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
  },
};

// ===========================================
// TRADE OUTCOMES
// ===========================================

export const TRADE_OUTCOMES = {
  WIN: 'WIN',
  LOSS: 'LOSS',
  BREAKEVEN: 'BREAKEVEN',
} as const;

export type TradeOutcome = (typeof TRADE_OUTCOMES)[keyof typeof TRADE_OUTCOMES];

export const TRADE_OUTCOME_LABELS: Record<TradeOutcome, string> = {
  WIN: 'Win',
  LOSS: 'Loss',
  BREAKEVEN: 'Breakeven',
};

export const TRADE_OUTCOME_COLORS: Record<TradeOutcome, { bg: string; text: string }> = {
  WIN: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
  },
  LOSS: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
  },
  BREAKEVEN: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
  },
};

// ===========================================
// TRADE SOURCE TYPES
// ===========================================

export const TRADE_SOURCE_TYPES = {
  MANUAL: 'MANUAL',
  SCREENSHOT: 'SCREENSHOT',
  JOURNAL_DETECTED: 'JOURNAL_DETECTED',
  VOICE_CAPTURED: 'VOICE_CAPTURED',
  CSV_IMPORT: 'CSV_IMPORT',
} as const;

export type TradeSourceType = (typeof TRADE_SOURCE_TYPES)[keyof typeof TRADE_SOURCE_TYPES];

export const TRADE_SOURCE_LABELS: Record<TradeSourceType, string> = {
  MANUAL: 'Manual Entry',
  SCREENSHOT: 'Screenshot',
  JOURNAL_DETECTED: 'Journal Detected',
  VOICE_CAPTURED: 'Voice Captured',
  CSV_IMPORT: 'CSV Import',
};

// ===========================================
// MOODS
// ===========================================

export const MOODS = {
  CONFIDENT: 'CONFIDENT',
  NERVOUS: 'NERVOUS',
  EXCITED: 'EXCITED',
  UNCERTAIN: 'UNCERTAIN',
  NEUTRAL: 'NEUTRAL',
} as const;

export type EntryMood = (typeof MOODS)[keyof typeof MOODS];

export const MOOD_LABELS: Record<EntryMood, string> = {
  CONFIDENT: 'Confident',
  NERVOUS: 'Nervous',
  EXCITED: 'Excited',
  UNCERTAIN: 'Uncertain',
  NEUTRAL: 'Neutral',
};

export const MOOD_EMOJIS: Record<EntryMood, string> = {
  CONFIDENT: '💪',
  NERVOUS: '😰',
  EXCITED: '🚀',
  UNCERTAIN: '🤔',
  NEUTRAL: '😐',
};

// ===========================================
// CONVICTION LEVELS
// ===========================================

export const CONVICTION_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export type ConvictionLevel = (typeof CONVICTION_LEVELS)[keyof typeof CONVICTION_LEVELS];

export const CONVICTION_LABELS: Record<ConvictionLevel, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

// ===========================================
// AI PROMPT HELPERS
// ===========================================

/**
 * Generates the tag taxonomy section for AI prompts
 */
export function getTagTaxonomyPrompt(): string {
  const sections = Object.entries(TAG_TAXONOMY).map(([category, tags]) => {
    const categoryInfo = TAG_CATEGORY_DESCRIPTIONS[category as TagCategory];
    return `${category} (${categoryInfo.toLowerCase()}):\n${tags.join(', ')}`;
  });

  return sections.join('\n\n');
}

/**
 * Generates the bias detection section for AI prompts
 */
export function getBiasDetectionPrompt(): string {
  return ALL_BIASES.map((bias, index) => {
    return `${index + 1}. ${bias}: ${BIAS_DESCRIPTIONS[bias]}`;
  }).join('\n');
}
