/**
 * Form Validation Schemas
 *
 * Provides Zod schemas for form validation across the application.
 * Includes trade logging, entries, and other forms.
 */

import { z } from 'zod';

// Trade action types
const TradeActionEnum = z.enum([
  'INITIAL',
  'ADD',
  'REDUCE',
  'ROLL',
  'CONVERT',
  'CLOSE',
  'ASSIGNED',
  'EXERCISED',
]);

// Strategy types
const StrategyTypeEnum = z.enum([
  'LONG_CALL',
  'LONG_PUT',
  'SHORT_CALL',
  'SHORT_PUT',
  'CALL_SPREAD',
  'PUT_SPREAD',
  'IRON_CONDOR',
  'IRON_BUTTERFLY',
  'STRADDLE',
  'STRANGLE',
  'CALENDAR',
  'DIAGONAL',
  'RATIO',
  'BUTTERFLY',
  'STOCK',
  'COVERED_CALL',
  'CASH_SECURED_PUT',
  'CUSTOM',
]);

/**
 * Trade logging form validation schema
 */
export const tradeFormSchema = z.object({
  action: TradeActionEnum,
  strategyType: StrategyTypeEnum.optional().nullable(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters'),
  debitCredit: z
    .number({ message: 'Please enter a valid number' })
    .refine((val) => !isNaN(val), 'Please enter a valid number'),
  quantity: z
    .number({ message: 'Quantity must be a number' })
    .int({ message: 'Quantity must be a whole number' })
    .positive({ message: 'Quantity must be at least 1' })
    .default(1),
  expiration: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: 'Invalid date format' }
    )
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      { message: 'Expiration date cannot be in the past' }
    ),
  reasoningNote: z.string().max(5000, 'Reasoning must be less than 5000 characters').optional().nullable(),
});

export type TradeFormData = z.infer<typeof tradeFormSchema>;

/**
 * Validate trade form data and return errors
 */
export function validateTradeForm(data: {
  action: string;
  strategyType: string | null;
  description: string;
  debitCredit: string;
  quantity: string;
  expiration: string | null;
  reasoningNote: string | null;
}): { success: true; data: TradeFormData } | { success: false; errors: Record<string, string> } {
  // Parse numeric fields
  const parsedData = {
    action: data.action,
    strategyType: data.strategyType || null,
    description: data.description.trim(),
    debitCredit: data.debitCredit ? parseFloat(data.debitCredit) : NaN,
    quantity: data.quantity ? parseInt(data.quantity, 10) : 1,
    expiration: data.expiration || null,
    reasoningNote: data.reasoningNote?.trim() || null,
  };

  const result = tradeFormSchema.safeParse(parsedData);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Convert Zod errors to field-keyed error messages
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as string;
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }

  return { success: false, errors };
}

/**
 * Get a field-level validation error message
 */
export function getFieldError(
  errors: Record<string, string> | undefined,
  field: string
): string | undefined {
  return errors?.[field];
}

/**
 * Entry form validation schema
 */
export const entryFormSchema = z.object({
  type: z.enum(['IDEA', 'DECISION', 'REFLECTION', 'OBSERVATION']),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be less than 10000 characters'),
  sentiment: z.enum(['BULLISH', 'BEARISH', 'NEUTRAL']).optional().nullable(),
  tickers: z.array(z.string().max(10)).max(20).optional(),
  tags: z.array(z.string().max(50)).max(30).optional(),
});

export type EntryFormData = z.infer<typeof entryFormSchema>;

/**
 * Coach message validation schema
 */
export const coachMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message must be less than 2000 characters'),
  sessionId: z.string().uuid().optional(),
});

export type CoachMessageData = z.infer<typeof coachMessageSchema>;
