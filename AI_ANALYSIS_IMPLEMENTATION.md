# AI Text Analysis Implementation

## Overview

This document describes the implementation of AI-powered text analysis for journal entries using OpenAI GPT-4. The system analyzes trader psychology by extracting sentiment, emotional keywords, cognitive biases, and inferred conviction levels from journal text.

## Architecture

### Core Components

1. **AI Analysis Service** (`src/lib/aiAnalysis.ts`)
   - OpenAI GPT-4o-mini integration
   - Lazy client initialization for environment variable handling
   - Structured JSON response parsing
   - Batch processing with rate limiting

2. **API Endpoints**
   - `POST /api/entries/[id]/analyze` - Analyze single entry
   - `POST /api/entries/analyze-batch` - Batch analyze multiple entries

3. **Database Schema**
   - Analysis fields already exist in Entry model (lines 127-132 in schema.prisma)
   - `sentiment`: String (positive/negative/neutral)
   - `emotionalKeywords`: String[] array
   - `detectedBiases`: String[] array
   - `convictionInferred`: ConvictionLevel enum

## Features Implemented

### 1. Sentiment Analysis
Classifies overall emotional tone of journal entries:
- **Positive**: Confident, optimistic, calm, disciplined
- **Negative**: Anxious, fearful, frustrated, defeated
- **Neutral**: Analytical, objective, matter-of-fact

### 2. Emotional Keyword Detection
Extracts 3-7 emotion-related words from text:
- Examples: "nervous", "confident", "FOMO", "revenge", "uncertain", "excited", "fearful", "greedy", "patient", "impulsive", "disciplined", "anxious", "calm", "frustrated"

### 3. Cognitive Bias Detection
Identifies up to 5 cognitive biases:
- `confirmation_bias` - Seeking data that confirms existing belief
- `recency_bias` - Overweighting recent events
- `loss_aversion` - Fear of losses dominating decision-making
- `overconfidence` - Excessive certainty without evidence
- `fomo` - Fear of missing out driving decision
- `revenge_trading` - Trying to recover losses emotionally
- `anchoring` - Fixated on specific price/outcome
- `herd_mentality` - Following crowd without analysis
- `outcome_bias` - Judging decision by result rather than process

### 4. Conviction Level Inference
AI infers conviction based on language patterns:
- **HIGH**: Strong, decisive language ("definitely", "certain", "clear")
- **MEDIUM**: Moderate confidence ("likely", "probably", "seems")
- **LOW**: Uncertain language ("maybe", "not sure", "questioning")
- **null**: If conviction level is unclear

## Usage

### Analyze Single Entry

```typescript
// Via API
const response = await fetch(`/api/entries/${entryId}/analyze`, {
  method: 'POST'
});

const analyzed = await response.json();
// Returns entry with sentiment, emotionalKeywords, detectedBiases, convictionInferred
```

```typescript
// Direct function call
import { analyzeEntryText } from '@/lib/aiAnalysis';

const analysis = await analyzeEntryText(
  "I'm feeling really confident about this trade...",
  "CONFIDENT", // optional user mood
  "HIGH"       // optional user conviction
);

console.log(analysis.sentiment); // 'positive'
console.log(analysis.emotionalKeywords); // ['confident', 'certain', ...]
console.log(analysis.detectedBiases); // []
console.log(analysis.convictionInferred); // 'HIGH'
console.log(analysis.confidence); // 0.85
```

### Batch Analysis

```typescript
// Analyze specific entries
const response = await fetch('/api/entries/analyze-batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    entryIds: ['entry1', 'entry2', 'entry3']
  })
});

// Or analyze all unanalyzed entries
const response = await fetch('/api/entries/analyze-batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    limit: 50 // optional, default 50, max 100
  })
});

const result = await response.json();
console.log(result.analyzed); // Number of entries analyzed
console.log(result.results); // Array of {id, sentiment, confidence}
```

## Configuration

### Environment Variables

Add to `.env` file:

```bash
OPENAI_API_KEY="sk-..."
```

Get your API key from: https://platform.openai.com/api-keys

### Model Configuration

Currently using `gpt-4o-mini` for cost-effectiveness:
- **Temperature**: 0.3 (lower for consistent analysis)
- **Max Tokens**: 500
- **Response Format**: JSON object mode

To change model, edit `src/lib/aiAnalysis.ts` line 66:
```typescript
model: 'gpt-4o-mini', // Change to 'gpt-4o' or 'gpt-4-turbo'
```

## Testing

### Run Tests

```bash
npm run test:ai
```

### Test Coverage

9 integration tests covering:
1. OpenAI API key configuration
2. Positive sentiment analysis
3. Negative sentiment analysis
4. FOMO bias detection
5. Revenge trading bias detection
6. High conviction inference
7. Low conviction inference
8. Single entry API endpoint
9. Batch analysis API endpoint

All tests make real API calls to OpenAI, so they require:
- Valid `OPENAI_API_KEY` in `.env`
- Running dev server on localhost:3000
- Internet connection

## Rate Limiting & Costs

### Batch Processing
- Processes entries in batches of 5
- 1-second delay between batches
- Prevents API rate limiting

### Cost Estimation (GPT-4o-mini)
- **Input**: ~300 tokens/entry (prompt + entry text)
- **Output**: ~150 tokens/entry (JSON response)
- **Cost**: ~$0.0007 per entry (~450 tokens total)
- **Batch of 100 entries**: ~$0.07

Reference: https://openai.com/pricing

## Error Handling

### API Errors
- Returns 503 if `OPENAI_API_KEY` not configured
- Returns 500 on OpenAI API failures
- Logs detailed error messages for debugging

### Parse Errors
- Returns safe defaults on JSON parse failure:
  ```typescript
  {
    sentiment: 'neutral',
    emotionalKeywords: [],
    detectedBiases: [],
    convictionInferred: null,
    confidence: 0
  }
  ```

### Validation
- Sentiment values validated against allowed set
- Conviction values validated against enum
- Arrays limited (10 keywords max, 5 biases max)
- Confidence clamped to 0-1 range

## Future Enhancements (Phase 2)

See Issue #20 for full requirements. Planned additions:

1. **Auto-Tagging** - Generate tags based on content analysis
2. **Strategy Detection** - Identify options strategies mentioned
3. **Advanced Bias Detection** - More sophisticated bias identification
4. **Trend Analysis** - Track emotional patterns over time
5. **Real-time Analysis** - Analyze on entry creation (optional)

## Integration with Other Features

### Weekly Insights Dashboard (Issue #21)
AI analysis data will power:
- Emotional trend charts
- Pattern detection (e.g., "nervous" entries correlate with losses)
- Personalized feedback generation

### Pattern Recognition (Issue #22)
Analysis metadata enables:
- Correlation between sentiment and trade outcomes
- Bias pattern identification
- Conviction accuracy tracking

## Troubleshooting

### Tests Failing with "API key not found"
- Ensure `OPENAI_API_KEY` is in `.env` (not `.env.example`)
- Restart dev server after adding key
- Check key format starts with `sk-`

### 401 Authentication Error
- API key invalid or revoked
- Generate new key at https://platform.openai.com/api-keys

### Rate Limit Errors
- OpenAI free tier has low limits
- Upgrade to paid tier
- Reduce batch size in `batchAnalyzeEntries()`

### Empty/Null Analysis Results
- Check entry content is not empty
- Review OpenAI API response logs
- Verify JSON parsing in `parseAnalysisResponse()`

## References

- OpenAI API Documentation: https://platform.openai.com/docs
- GPT-4o-mini Model: https://platform.openai.com/docs/models/gpt-4o-mini
- Trading Psychology Biases: https://www.investopedia.com/trading-psychology-4689785
