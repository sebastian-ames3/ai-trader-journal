# PRD: Claude LLM Migration

## Overview

Migrate from OpenAI GPT-4o models to Anthropic Claude models for improved reasoning, cost efficiency, and consistency. Keep OpenAI Whisper for audio transcription (Claude doesn't offer transcription).

## Current State Analysis

### Files Using OpenAI

| File | Current Model | Usage | Calls/Month Est. |
|------|---------------|-------|------------------|
| `src/lib/aiAnalysis.ts` | gpt-4o-mini | Entry sentiment/bias analysis | ~200 |
| `src/lib/contextSurfacing.ts` | gpt-4o-mini + gpt-4o | Ticker validation + insight generation | ~100 |
| `src/lib/patternAnalysis.ts` | gpt-4o + gpt-4o-mini | Pattern detection + similarity | ~30 |
| `src/app/api/infer/route.ts` | gpt-4o-mini | Metadata inference | ~200 |
| `src/app/api/transcribe/route.ts` | whisper-1 | Audio transcription | ~50 |
| `src/app/api/analyze/image/route.ts` | gpt-4o-mini | Chart/screenshot analysis | ~30 |

### Current Monthly Cost (Estimated)
- GPT-4o-mini: ~$0.30/month (routine tasks)
- GPT-4o: ~$0.20/month (complex tasks)
- Whisper: ~$0.30/month (voice memos)
- **Total: ~$0.80/month**

## Target Architecture

### Model Tiering Strategy

| Tier | Claude Model | Use Case | Cost (per 1M tokens) |
|------|--------------|----------|---------------------|
| **Fast** | claude-3-5-haiku-latest | Quick inference, ticker validation, similarity | $0.25 in / $1.25 out |
| **Balanced** | claude-sonnet-4-20250514 | Entry analysis, image/vision, insights | $3 in / $15 out |
| **Deep** | claude-opus-4-5-20251101 | Complex pattern analysis, monthly reports | $15 in / $75 out |
| **Audio** | whisper-1 (OpenAI) | Voice transcription | $0.006/min |

### Migration Mapping

| Current | Target | Reason |
|---------|--------|--------|
| gpt-4o-mini (routine) | claude-3-5-haiku-latest | 5x cheaper, equally fast |
| gpt-4o-mini (vision) | claude-sonnet-4-20250514 | Better vision capabilities |
| gpt-4o (complex) | claude-sonnet-4-20250514 | Great reasoning at lower cost |
| gpt-4o (deep analysis) | claude-opus-4-5-20251101 | Best reasoning for patterns |
| whisper-1 | whisper-1 (keep) | No Claude alternative |

### Estimated New Monthly Cost
- Claude Haiku: ~$0.05/month (routine tasks)
- Claude Sonnet: ~$0.15/month (balanced tasks)
- Claude Opus: ~$0.10/month (deep analysis, rare)
- Whisper: ~$0.30/month (unchanged)
- **Total: ~$0.60/month** (25% savings)

## Implementation Plan

### Phase 1: Infrastructure Setup

1. **Install Anthropic SDK**
   ```bash
   npm install @anthropic-ai/sdk
   ```

2. **Create Claude client utility** (`src/lib/claude.ts`)
   - Lazy-initialized Anthropic client
   - Model constants with tiering
   - Shared configuration

3. **Update environment variables**
   - Add `ANTHROPIC_API_KEY`
   - Keep `OPENAI_API_KEY` for Whisper only

### Phase 2: Service Migration

1. **aiAnalysis.ts**
   - Replace OpenAI import with Claude
   - Use `claude-3-5-haiku-latest` for entry analysis
   - Adapt prompt format for Claude's style

2. **contextSurfacing.ts**
   - Use `claude-3-5-haiku-latest` for ticker validation
   - Use `claude-sonnet-4-20250514` for insight generation

3. **patternAnalysis.ts**
   - Use `claude-opus-4-5-20251101` for deep pattern detection
   - Use `claude-3-5-haiku-latest` for similarity checks

4. **infer/route.ts**
   - Use `claude-3-5-haiku-latest` for fast inference

5. **analyze/image/route.ts**
   - Use `claude-sonnet-4-20250514` for vision analysis

### Phase 3: Testing & Validation

1. Run all existing tests
2. Verify response format compatibility
3. Check error handling for Anthropic errors
4. Validate cost tracking

## Technical Specifications

### Claude Client Utility

```typescript
// src/lib/claude.ts
import Anthropic from '@anthropic-ai/sdk';

// Model constants
export const CLAUDE_MODELS = {
  FAST: 'claude-3-5-haiku-latest',      // Quick, cheap tasks
  BALANCED: 'claude-sonnet-4-20250514', // Vision, analysis
  DEEP: 'claude-opus-4-5-20251101',     // Complex reasoning
} as const;

// Lazy-initialized client
let client: Anthropic | null = null;

export function getClaude(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return client;
}
```

### Response Format Differences

| Feature | OpenAI | Claude |
|---------|--------|--------|
| JSON mode | `response_format: { type: 'json_object' }` | Use structured prompt + parse |
| System message | Separate `system` role | `system` parameter |
| Max tokens | `max_tokens` | `max_tokens` |
| Temperature | `temperature` | `temperature` |
| Vision | `image_url` in content | `image` block in content |

### Error Handling

```typescript
import Anthropic from '@anthropic-ai/sdk';

try {
  const response = await claude.messages.create({...});
} catch (error) {
  if (error instanceof Anthropic.APIError) {
    if (error.status === 401) // Invalid API key
    if (error.status === 429) // Rate limited
    if (error.status === 529) // Overloaded
  }
}
```

## Acceptance Criteria

1. **Functional**
   - [ ] All AI features work with Claude models
   - [ ] Voice transcription works with Whisper
   - [ ] Image analysis works with Claude vision
   - [ ] Response formats unchanged for frontend

2. **Performance**
   - [ ] Response times comparable or better
   - [ ] No increase in error rates

3. **Testing**
   - [ ] All existing tests pass
   - [ ] New tests for Claude-specific error handling

4. **Documentation**
   - [ ] CLAUDE.md updated with new model info
   - [ ] Environment variable docs updated

## Rollback Plan

If issues arise:
1. Keep OpenAI SDK installed
2. Add feature flag `USE_CLAUDE=true/false`
3. Can switch back by changing env var

## Files to Modify

1. `package.json` - Add @anthropic-ai/sdk
2. `src/lib/claude.ts` - New client utility (create)
3. `src/lib/aiAnalysis.ts` - Migrate to Claude
4. `src/lib/contextSurfacing.ts` - Migrate to Claude
5. `src/lib/patternAnalysis.ts` - Migrate to Claude
6. `src/app/api/infer/route.ts` - Migrate to Claude
7. `src/app/api/analyze/image/route.ts` - Migrate to Claude vision
8. `CLAUDE.md` - Update documentation
9. `.env.example` - Add ANTHROPIC_API_KEY

## Timeline

- Phase 1: Infrastructure (~30 min)
- Phase 2: Service Migration (~2 hours)
- Phase 3: Testing & Validation (~30 min)
- Total: ~3 hours
