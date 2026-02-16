-- Enable pg_trgm extension for trigram-based text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index on Entry.content accelerates ILIKE / trigram similarity queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Entry_content_trgm_idx"
  ON "Entry" USING gin ("content" gin_trgm_ops);
