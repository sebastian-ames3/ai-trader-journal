import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? (() => {
  console.log('Creating new Prisma Client...')
  console.log('Current directory:', process.cwd())
  console.log('DATABASE_URL:', process.env.DATABASE_URL)
  
  try {
    const client = new PrismaClient({
      log: ['error', 'warn'],
    })
    return client
  } catch (error) {
    console.error('Failed to create Prisma Client:', error)
    throw error
  }
})() // <-- Add these parentheses to actually call the function

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma