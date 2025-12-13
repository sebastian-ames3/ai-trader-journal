/**
 * Authentication helpers for API routes and server components
 *
 * Provides:
 * - getCurrentUser() - Get user from session, create if needed
 * - requireAuth() - Return user or 401 error
 * - getAuthedDb() - Prisma client with auto userId filtering
 */

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

export type AuthUser = {
  id: string
  supabaseId: string
  email: string
  displayName: string | null
}

/**
 * Get the current authenticated user from the session
 * Creates a Prisma user record if one doesn't exist (first login)
 * Also creates default Settings for new users
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser()

  if (!supabaseUser) {
    return null
  }

  // Get or create Prisma user
  let user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
  })

  if (!user) {
    // Create new user with default settings in a transaction
    user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          supabaseId: supabaseUser.id,
          email: supabaseUser.email!,
          displayName: supabaseUser.user_metadata?.display_name || null,
        },
      })

      // Create default settings for new user
      await tx.settings.create({
        data: {
          userId: newUser.id,
          defaultRisk: 1.0,
          accountSize: 10000,
          liquidityThreshold: 100,
          ivThreshold: 80,
        },
      })

      return newUser
    })
  }

  return {
    id: user.id,
    supabaseId: user.supabaseId,
    email: user.email,
    displayName: user.displayName,
  }
}

/**
 * Require authentication for API routes
 * Returns user or error response
 */
export async function requireAuth(): Promise<
  { user: AuthUser; error?: never } | { user?: never; error: NextResponse }
> {
  const user = await getCurrentUser()
  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  return { user }
}

/**
 * Get a Prisma client with automatic userId filtering
 * Uses Prisma Client Extensions for defense-in-depth
 *
 * This ensures all queries are scoped to the current user,
 * preventing data leakage even if a developer forgets to add userId filter
 */
export function getAuthedDb(userId: string) {
  return prisma.$extends({
    query: {
      // Models that have userId field
      entry: {
        async findMany({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async findUnique({ args, query }) {
          // For unique queries, we need to verify ownership after fetch
          const result = await query(args)
          if (result && (result as { userId?: string }).userId !== userId) {
            return null
          }
          return result
        },
        async create({ args, query }) {
          // Cast to any to allow adding userId alongside potential relation fields
          ;(args.data as Record<string, unknown>).userId = userId
          return query(args)
        },
        async update({ args, query }) {
          args.where = { ...args.where, userId } as Prisma.EntryWhereUniqueInput
          return query(args)
        },
        async delete({ args, query }) {
          args.where = { ...args.where, userId } as Prisma.EntryWhereUniqueInput
          return query(args)
        },
      },
      tradingThesis: {
        async findMany({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async findUnique({ args, query }) {
          const result = await query(args)
          if (result && (result as { userId?: string }).userId !== userId) {
            return null
          }
          return result
        },
        async create({ args, query }) {
          ;(args.data as Record<string, unknown>).userId = userId
          return query(args)
        },
        async update({ args, query }) {
          args.where = { ...args.where, userId } as Prisma.TradingThesisWhereUniqueInput
          return query(args)
        },
        async delete({ args, query }) {
          args.where = { ...args.where, userId } as Prisma.TradingThesisWhereUniqueInput
          return query(args)
        },
      },
      coachSession: {
        async findMany({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async create({ args, query }) {
          ;(args.data as Record<string, unknown>).userId = userId
          return query(args)
        },
        async update({ args, query }) {
          args.where = { ...args.where, userId } as Prisma.CoachSessionWhereUniqueInput
          return query(args)
        },
      },
      coachGoal: {
        async findMany({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async create({ args, query }) {
          ;(args.data as Record<string, unknown>).userId = userId
          return query(args)
        },
        async update({ args, query }) {
          args.where = { ...args.where, userId } as Prisma.CoachGoalWhereUniqueInput
          return query(args)
        },
        async delete({ args, query }) {
          args.where = { ...args.where, userId } as Prisma.CoachGoalWhereUniqueInput
          return query(args)
        },
      },
      coachPrompt: {
        async findMany({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async create({ args, query }) {
          ;(args.data as Record<string, unknown>).userId = userId
          return query(args)
        },
        async update({ args, query }) {
          args.where = { ...args.where, userId } as Prisma.CoachPromptWhereUniqueInput
          return query(args)
        },
      },
      shareLink: {
        async findMany({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async create({ args, query }) {
          ;(args.data as Record<string, unknown>).userId = userId
          return query(args)
        },
        async update({ args, query }) {
          args.where = { ...args.where, userId } as Prisma.ShareLinkWhereUniqueInput
          return query(args)
        },
        async delete({ args, query }) {
          args.where = { ...args.where, userId } as Prisma.ShareLinkWhereUniqueInput
          return query(args)
        },
      },
      dashboardLayout: {
        async findMany({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async create({ args, query }) {
          ;(args.data as Record<string, unknown>).userId = userId
          return query(args)
        },
        async update({ args, query }) {
          args.where = { ...args.where, userId } as Prisma.DashboardLayoutWhereUniqueInput
          return query(args)
        },
        async delete({ args, query }) {
          args.where = { ...args.where, userId } as Prisma.DashboardLayoutWhereUniqueInput
          return query(args)
        },
      },
      settings: {
        async findFirst({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async findUnique({ args, query }) {
          const result = await query(args)
          if (result && (result as { userId?: string }).userId !== userId) {
            return null
          }
          return result
        },
        async update({ args, query }) {
          args.where = { ...args.where, userId } as Prisma.SettingsWhereUniqueInput
          return query(args)
        },
      },
      trade: {
        async findMany({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async create({ args, query }) {
          ;(args.data as Record<string, unknown>).userId = userId
          return query(args)
        },
        async update({ args, query }) {
          args.where = { ...args.where, userId } as Prisma.TradeWhereUniqueInput
          return query(args)
        },
        async delete({ args, query }) {
          args.where = { ...args.where, userId } as Prisma.TradeWhereUniqueInput
          return query(args)
        },
      },
      note: {
        async findMany({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async create({ args, query }) {
          ;(args.data as Record<string, unknown>).userId = userId
          return query(args)
        },
      },
      mentorRelationship: {
        async findMany({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async create({ args, query }) {
          ;(args.data as Record<string, unknown>).userId = userId
          return query(args)
        },
        async update({ args, query }) {
          args.where = { ...args.where, userId } as Prisma.MentorRelationshipWhereUniqueInput
          return query(args)
        },
        async delete({ args, query }) {
          args.where = { ...args.where, userId } as Prisma.MentorRelationshipWhereUniqueInput
          return query(args)
        },
      },
      accountabilityPair: {
        async findMany({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, userId }
          return query(args)
        },
        async create({ args, query }) {
          ;(args.data as Record<string, unknown>).userId = userId
          return query(args)
        },
        async update({ args, query }) {
          args.where = { ...args.where, userId } as Prisma.AccountabilityPairWhereUniqueInput
          return query(args)
        },
        async delete({ args, query }) {
          args.where = { ...args.where, userId } as Prisma.AccountabilityPairWhereUniqueInput
          return query(args)
        },
      },
    },
  })
}

export type AuthedPrismaClient = ReturnType<typeof getAuthedDb>
