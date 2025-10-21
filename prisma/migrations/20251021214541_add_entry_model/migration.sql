-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('TRADE_IDEA', 'TRADE', 'REFLECTION', 'OBSERVATION');

-- CreateEnum
CREATE TYPE "EntryMood" AS ENUM ('CONFIDENT', 'NERVOUS', 'EXCITED', 'UNCERTAIN', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "ConvictionLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "type" "EntryType" NOT NULL,
    "content" TEXT NOT NULL,
    "mood" "EntryMood",
    "conviction" "ConvictionLevel",
    "ticker" TEXT,
    "tradeId" TEXT,
    "snapshotId" TEXT,
    "audioUrl" TEXT,
    "imageUrls" TEXT[],
    "sentiment" TEXT,
    "emotionalKeywords" TEXT[],
    "detectedBiases" TEXT[],
    "aiTags" TEXT[],
    "convictionInferred" "ConvictionLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Entry_snapshotId_key" ON "Entry"("snapshotId");

-- CreateIndex
CREATE INDEX "Entry_type_idx" ON "Entry"("type");

-- CreateIndex
CREATE INDEX "Entry_ticker_idx" ON "Entry"("ticker");

-- CreateIndex
CREATE INDEX "Entry_createdAt_idx" ON "Entry"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Entry_mood_idx" ON "Entry"("mood");

-- CreateIndex
CREATE INDEX "Entry_conviction_idx" ON "Entry"("conviction");

-- CreateIndex
CREATE INDEX "Entry_tradeId_idx" ON "Entry"("tradeId");

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "Snapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable for Entry-Tag many-to-many relationship
CREATE TABLE "_EntryTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_EntryTags_AB_unique" ON "_EntryTags"("A", "B");

-- CreateIndex
CREATE INDEX "_EntryTags_B_index" ON "_EntryTags"("B");

-- AddForeignKey
ALTER TABLE "_EntryTags" ADD CONSTRAINT "_EntryTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EntryTags" ADD CONSTRAINT "_EntryTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes to existing Trade table for better query performance
CREATE INDEX "Trade_ticker_idx" ON "Trade"("ticker");
CREATE INDEX "Trade_entryDate_idx" ON "Trade"("entryDate" DESC);
CREATE INDEX "Trade_status_idx" ON "Trade"("status");

-- Add index to existing Note table
CREATE INDEX "Note_tradeId_idx" ON "Note"("tradeId");
