# Database Migrations

This directory contains database migration files for the AI Trader Journal application.

## Migration History

### 20251021214541_add_entry_model

**Date:** October 21, 2025

**Description:** Initial migration adding the Entry model for journal entries.

**Changes:**
- Created 3 enums: `EntryType`, `EntryMood`, `ConvictionLevel`
- Created `Entry` table with core Phase 1 fields and placeholder Phase 2 fields
- Created `_EntryTags` join table for Entry-Tag many-to-many relationship
- Added foreign key constraints to Trade and Snapshot with `SET NULL` on delete
- Added indexes for common query patterns:
  - `Entry_type_idx` on type
  - `Entry_ticker_idx` on ticker
  - `Entry_createdAt_idx` on createdAt DESC
  - `Entry_mood_idx` on mood
  - `Entry_conviction_idx` on conviction
  - `Entry_tradeId_idx` on tradeId
- Added indexes to existing tables for better query performance:
  - `Trade_ticker_idx`, `Trade_entryDate_idx`, `Trade_status_idx`
  - `Note_tradeId_idx`

**Models Affected:**
- New: Entry (journal entries)
- Modified: Trade (added entries relationship)
- Modified: Tag (added entries relationship)
- Modified: Snapshot (added entry relationship)

**Breaking Changes:** None (purely additive)

**Rollback Notes:** To rollback, drop the Entry table, _EntryTags table, and the three enums. Remove indexes added to Trade and Note tables.

## Applying Migrations

### Development
```bash
npx prisma migrate dev
```

### Production
```bash
npx prisma migrate deploy
```

### Reset Database (WARNING: Destroys all data)
```bash
npx prisma migrate reset
```

## Creating New Migrations

```bash
npx prisma migrate dev --name [descriptive_migration_name]
```

## Best Practices

1. **Never modify existing migrations** after they've been committed to version control
2. **Always test migrations** in development before deploying to production
3. **Use descriptive names** for migrations (e.g., `add_user_preferences`, `update_trade_indexes`)
4. **Keep migrations focused** - one logical change per migration
5. **Review generated SQL** before applying migrations
6. **Document breaking changes** clearly in migration comments
