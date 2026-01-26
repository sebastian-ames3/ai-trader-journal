-- PRD-A: Schema & Taxonomy Updates
-- This migration:
-- 1. Renames entry types: TRADE_IDEA → IDEA, TRADE → DECISION
-- 2. Adds TradeOutcome and TradeSourceType enums
-- 3. Adds new fields to ThesisTrade (ticker, outcome, sourceType, sourceEntryId)
-- 4. Adds structured AI fields to Entry
-- 5. Backfills ticker from thesis for existing trades

-- ============================================
-- STEP 1: Rename EntryType enum values
-- ============================================

-- Add new enum values first
ALTER TYPE "EntryType" ADD VALUE IF NOT EXISTS 'IDEA';
ALTER TYPE "EntryType" ADD VALUE IF NOT EXISTS 'DECISION';

-- Update existing entries to use new values
-- Note: This must be done BEFORE removing old values
UPDATE "Entry" SET "type" = 'IDEA'::"EntryType" WHERE "type" = 'TRADE_IDEA'::"EntryType";
UPDATE "Entry" SET "type" = 'DECISION'::"EntryType" WHERE "type" = 'TRADE'::"EntryType";

-- Note: PostgreSQL doesn't support removing enum values directly
-- The old values (TRADE_IDEA, TRADE) will remain in the enum but won't be used
-- This is safe and won't cause any issues

-- ============================================
-- STEP 2: Create new enums
-- ============================================

-- TradeOutcome enum for P/L tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TradeOutcome') THEN
        CREATE TYPE "TradeOutcome" AS ENUM ('WIN', 'LOSS', 'BREAKEVEN');
    END IF;
END $$;

-- TradeSourceType enum for tracking how trade was created
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TradeSourceType') THEN
        CREATE TYPE "TradeSourceType" AS ENUM ('MANUAL', 'SCREENSHOT', 'JOURNAL_DETECTED', 'VOICE_CAPTURED', 'CSV_IMPORT');
    END IF;
END $$;

-- ============================================
-- STEP 3: Add new fields to ThesisTrade
-- ============================================

-- Independent ticker for thesis-less trades
ALTER TABLE "ThesisTrade" ADD COLUMN IF NOT EXISTS "ticker" TEXT;

-- Trade outcome
ALTER TABLE "ThesisTrade" ADD COLUMN IF NOT EXISTS "outcome" "TradeOutcome";

-- Source type with default MANUAL
ALTER TABLE "ThesisTrade" ADD COLUMN IF NOT EXISTS "sourceType" "TradeSourceType" NOT NULL DEFAULT 'MANUAL'::"TradeSourceType";

-- Journal entry that created this trade
ALTER TABLE "ThesisTrade" ADD COLUMN IF NOT EXISTS "sourceEntryId" TEXT;

-- ============================================
-- STEP 4: Add structured AI fields to Entry
-- ============================================

-- Structured tags with confidence scores
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "aiTagsStructured" JSONB;

-- Structured biases with evidence and severity
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "detectedBiasesStructured" JSONB;

-- Trade detection fields
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "tradeDetected" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "tradeDetectionConfidence" DOUBLE PRECISION;
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "tradeDetectionData" JSONB;

-- ============================================
-- STEP 5: Backfill ticker from thesis for existing trades
-- ============================================

UPDATE "ThesisTrade" t
SET "ticker" = (
    SELECT th."ticker" FROM "TradingThesis" th
    WHERE th."id" = t."thesisId"
)
WHERE t."thesisId" IS NOT NULL AND t."ticker" IS NULL;

-- ============================================
-- STEP 6: Create indexes for new fields
-- ============================================

-- ThesisTrade indexes
CREATE INDEX IF NOT EXISTS "ThesisTrade_ticker_idx" ON "ThesisTrade"("ticker");
CREATE INDEX IF NOT EXISTS "ThesisTrade_outcome_idx" ON "ThesisTrade"("outcome");

-- Entry index for trade detection
CREATE INDEX IF NOT EXISTS "Entry_tradeDetected_idx" ON "Entry"("tradeDetected");
