# Entry Model Design Documentation

## Overview

The Entry model is a flexible journal entry system designed to support multiple journaling use cases for traders. It can exist independently or link to trades, enabling a complete journaling workflow from idea to execution to reflection.

## Design Decisions

### 1. Standalone vs Trade-Centric Design

**Decision:** Entry is a standalone model that optionally links to Trade

**Rationale:**
- Not all journal entries relate to trades (e.g., market observations, general thoughts)
- Allows traders to journal ideas before executing trades
- Preserves journal history even if trades are deleted
- More flexible for future features (e.g., idea tracking, pattern recognition)

### 2. Entry Types

**Types:** TRADE_IDEA, TRADE, REFLECTION, OBSERVATION

**Rationale:**
- TRADE_IDEA: Most common use case - pre-trade analysis and planning
- TRADE: Documentation of actual execution (links to Trade model)
- REFLECTION: Post-trade learning and improvement
- OBSERVATION: General market notes, patterns, or insights
- Enum ensures type safety and enables filtering/analytics

### 3. Mood and Conviction Fields

**Decision:** Optional enum fields for mood and conviction

**Rationale:**
- Enables emotional awareness and bias detection
- Conviction tracking helps identify overconfidence patterns
- Optional to reduce friction - not every entry needs this metadata
- Supports future AI analysis (Issue #20)

### 4. Cascading Delete Strategy

**Decision:** `onDelete: SetNull` for both Trade and Snapshot relationships

**Rationale:**
- Journal entries are valuable historical records
- Preserve trader's thoughts even if related trades/snapshots are deleted
- Allows cleanup of trades without losing journal data
- User can manually delete entries if desired

### 5. Text Field for Content

**Decision:** Use PostgreSQL TEXT type for content field

**Rationale:**
- No length limits (unlike VARCHAR)
- Supports full-text search in PostgreSQL
- Prepares for future rich text / markdown support
- Better for longer journal entries

### 6. Array Fields for Phase 2 Features

**Decision:** Use PostgreSQL array types for images, keywords, biases, tags

**Rationale:**
- Native PostgreSQL support (vs JSON)
- Type-safe with Prisma
- Easier to query and filter
- Better performance for array operations

### 7. Index Strategy

**Indexes Created:**
- `type` - Filter by entry type
- `ticker` - Find all entries about a symbol
- `createdAt DESC` - Most recent first (default sort)
- `mood` - Emotional pattern analysis
- `conviction` - Confidence tracking
- `tradeId` - Link to related trade

**Rationale:**
- Covers primary query patterns
- Composite indexes not needed yet (can add later if needed)
- DESC on createdAt for reverse chronological order

### 8. Phase 1 vs Phase 2 Fields

**Phase 1 (Now):**
- Core journaling: content, type, mood, conviction, ticker
- Relationships: trade, snapshot, tags
- Timestamps

**Phase 2 (Later):**
- Media: audioUrl, imageUrls
- AI analysis: sentiment, keywords, biases, aiTags, convictionInferred

**Rationale:**
- Include Phase 2 fields in initial migration to avoid future schema changes
- Mark as nullable to not impact MVP development
- Application code can ignore Phase 2 fields until features are implemented

## Relationships Diagram

```
Entry (many) -----> (one) Trade
Entry (one) ------> (one) Snapshot
Entry (many) <-----> (many) Tag
```

## Usage Examples

### Creating a Trade Idea
```typescript
const entry = await prisma.entry.create({
  data: {
    type: 'TRADE_IDEA',
    content: 'AAPL looks oversold on the daily. RSI at 30. Considering a bull put spread.',
    mood: 'CONFIDENT',
    conviction: 'HIGH',
    ticker: 'AAPL',
    tags: {
      connect: [{ name: 'bullish' }, { name: 'oversold' }]
    }
  }
});
```

### Linking Entry to Trade
```typescript
const entry = await prisma.entry.create({
  data: {
    type: 'TRADE',
    content: 'Executed AAPL bull put spread as planned.',
    tradeId: trade.id,
    snapshotId: snapshot.id,
    ticker: 'AAPL'
  }
});
```

### Post-Trade Reflection
```typescript
const reflection = await prisma.entry.create({
  data: {
    type: 'REFLECTION',
    content: 'Should have waited for RSI confirmation. Got in too early.',
    mood: 'UNCERTAIN',
    tradeId: trade.id,
    ticker: 'AAPL'
  }
});
```

### Query Patterns

```typescript
// Most recent entries
const entries = await prisma.entry.findMany({
  orderBy: { createdAt: 'desc' },
  take: 20
});

// All entries for a ticker
const aaplEntries = await prisma.entry.findMany({
  where: { ticker: 'AAPL' },
  include: { trade: true, tags: true }
});

// Trade ideas only
const ideas = await prisma.entry.findMany({
  where: { type: 'TRADE_IDEA', conviction: 'HIGH' }
});

// Complete trade timeline (idea -> trade -> reflection)
const tradeTimeline = await prisma.entry.findMany({
  where: { tradeId: someTradeId },
  orderBy: { createdAt: 'asc' }
});
```

## Validation Rules (Application Level)

1. **TRADE type entries should have tradeId**
   ```typescript
   if (type === 'TRADE' && !tradeId) {
     throw new Error('TRADE entries must link to a trade');
   }
   ```

2. **Content required**
   ```typescript
   if (!content || content.trim().length === 0) {
     throw new Error('Content is required');
   }
   ```

3. **Ticker format validation**
   ```typescript
   if (ticker && !/^[A-Z]{1,5}$/.test(ticker)) {
     throw new Error('Invalid ticker format');
   }
   ```

## Future Enhancements

### Full-Text Search (PostgreSQL)
```sql
-- Add full-text search index
CREATE INDEX entry_content_search_idx ON "Entry"
USING GIN (to_tsvector('english', content));

-- Query with full-text search
SELECT * FROM "Entry"
WHERE to_tsvector('english', content) @@ to_tsquery('english', 'oversold & RSI');
```

### Composite Indexes (if needed)
```sql
-- For date + ticker queries
CREATE INDEX entry_ticker_date_idx ON "Entry" (ticker, "createdAt" DESC);

-- For type + mood analytics
CREATE INDEX entry_type_mood_idx ON "Entry" (type, mood);
```

### Soft Deletes (if needed)
```prisma
model Entry {
  // ... existing fields
  deletedAt DateTime?

  @@index([deletedAt])
}
```

## Migration Notes

- **Migration file:** `prisma/migrations/20251021214541_add_entry_model/migration.sql`
- **Breaking changes:** None (purely additive)
- **Rollback:** Drop Entry table, _EntryTags table, and enums
- **Data migration:** Not needed (new model)

## Related Issues

- Issue #19: Voice notes and screenshots (Phase 2 fields: audioUrl, imageUrls)
- Issue #20: AI analysis features (Phase 2 fields: sentiment, emotionalKeywords, etc.)

## Performance Considerations

- Content field uses TEXT type - no length limit but consider pagination for long lists
- Indexes cover primary query patterns - add composite indexes if analytics features need them
- Array fields (Phase 2) - PostgreSQL handles arrays efficiently, but consider limits (e.g., max 100 images)
- Full-text search should be added when search feature is implemented

## Security Considerations

- Content field accepts user input - sanitize for XSS when displaying
- Image URLs (Phase 2) - validate URLs and implement upload restrictions
- Audio URLs (Phase 2) - validate file types and sizes
- Consider row-level security if multi-user features are added
