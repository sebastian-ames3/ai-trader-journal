import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const basePrisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      // Ensure connection_limit=1 for serverless (Vercel) even if not in DATABASE_URL
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma

/**
 * Remove the _includeDeleted flag from a where clause and return the rest.
 */
function stripIncludeDeleted(where: Record<string, unknown>): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _includeDeleted: _, ...rest } = where
  return rest
}

/**
 * Prisma client with automatic soft-delete filtering on Entry model.
 * All Entry.findMany and Entry.findFirst queries automatically exclude
 * entries where deletedAt is not null.
 *
 * To include soft-deleted entries (e.g., for restore/admin operations),
 * explicitly pass `_includeDeleted: true` in the where clause.
 */
export const prisma = basePrisma.$extends({
  query: {
    entry: {
      async findMany({ args, query }) {
        if (!(args.where as Record<string, unknown>)?._includeDeleted) {
          args.where = { ...args.where, deletedAt: null }
        } else {
          args.where = stripIncludeDeleted((args.where || {}) as Record<string, unknown>)
        }
        return query(args)
      },
      async findFirst({ args, query }) {
        if (!(args.where as Record<string, unknown>)?._includeDeleted) {
          args.where = { ...args.where, deletedAt: null }
        } else {
          args.where = stripIncludeDeleted((args.where || {}) as Record<string, unknown>)
        }
        return query(args)
      },
      async count({ args, query }) {
        if (!(args.where as Record<string, unknown>)?._includeDeleted) {
          args.where = { ...args.where, deletedAt: null }
        } else {
          args.where = stripIncludeDeleted((args.where || {}) as Record<string, unknown>)
        }
        return query(args)
      },
      async groupBy({ args, query }) {
        if (!(args.where as Record<string, unknown>)?._includeDeleted) {
          args.where = { ...args.where, deletedAt: null }
        } else {
          args.where = stripIncludeDeleted((args.where || {}) as Record<string, unknown>)
        }
        return query(args)
      },
    },
  },
}) as unknown as PrismaClient
