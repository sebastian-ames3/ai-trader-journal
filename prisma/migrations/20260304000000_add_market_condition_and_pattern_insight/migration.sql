-- Add MarketCondition and PatternInsight tables
-- These were previously only created via db:push and were missing from migrations.

-- ============================================
-- STEP 1: Create enums (safe, idempotent)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MarketState') THEN
        CREATE TYPE "MarketState" AS ENUM ('UP', 'DOWN', 'FLAT', 'VOLATILE');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PatternType') THEN
        CREATE TYPE "PatternType" AS ENUM ('TIMING', 'CONVICTION', 'EMOTIONAL', 'MARKET_CONDITION', 'STRATEGY', 'BIAS_FREQUENCY');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Trend') THEN
        CREATE TYPE "Trend" AS ENUM ('INCREASING', 'STABLE', 'DECREASING');
    END IF;
END $$;

-- ============================================
-- STEP 2: Create MarketCondition table
-- ============================================

CREATE TABLE IF NOT EXISTS "MarketCondition" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "spyPrice" DOUBLE PRECISION NOT NULL,
    "spyChange" DOUBLE PRECISION NOT NULL,
    "qqqPrice" DOUBLE PRECISION,
    "qqqChange" DOUBLE PRECISION,
    "vixLevel" DOUBLE PRECISION NOT NULL,
    "vixChange" DOUBLE PRECISION,
    "marketState" "MarketState" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketCondition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MarketCondition_date_key" ON "MarketCondition"("date");
CREATE INDEX IF NOT EXISTS "MarketCondition_date_idx" ON "MarketCondition"("date" DESC);
CREATE INDEX IF NOT EXISTS "MarketCondition_marketState_idx" ON "MarketCondition"("marketState");

-- ============================================
-- STEP 3: Create PatternInsight table
-- ============================================

-- Drop and recreate to handle case where table existed without userId column
DROP TABLE IF EXISTS "PatternInsight";

CREATE TABLE "PatternInsight" (
    "id" TEXT NOT NULL,
    "patternType" "PatternType" NOT NULL,
    "patternName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "occurrences" INTEGER NOT NULL,
    "trend" "Trend" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "relatedEntryIds" TEXT[] NOT NULL DEFAULT '{}',
    "evidence" TEXT[] NOT NULL DEFAULT '{}',
    "outcomeData" JSONB,
    "firstDetected" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PatternInsight_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PatternInsight_patternType_idx" ON "PatternInsight"("patternType");
CREATE INDEX "PatternInsight_patternName_idx" ON "PatternInsight"("patternName");
CREATE INDEX "PatternInsight_isActive_idx" ON "PatternInsight"("isActive");
CREATE INDEX "PatternInsight_lastUpdated_idx" ON "PatternInsight"("lastUpdated" DESC);
CREATE INDEX "PatternInsight_userId_idx" ON "PatternInsight"("userId");

-- Add foreign key constraint for PatternInsight -> User
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'PatternInsight_userId_fkey'
        AND table_name = 'PatternInsight'
    ) THEN
        ALTER TABLE "PatternInsight" ADD CONSTRAINT "PatternInsight_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
