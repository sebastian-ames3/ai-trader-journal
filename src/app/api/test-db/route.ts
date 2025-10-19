import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs' 

export async function GET() {
  try {
    console.log('Test route: Starting database test...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    // Try a simple query - just check if we can access the database
    const tradeCount = await prisma.trade.count();
    const snapshotCount = await prisma.snapshot.count();
    
    // Try to check if the IV fields exist in the schema
    const firstSnapshot = await prisma.snapshot.findFirst();
    
    return NextResponse.json({ 
      success: true, 
      database: 'Connected successfully',
      counts: {
        trades: tradeCount,
        snapshots: snapshotCount
      },
      sampleSnapshot: firstSnapshot,
      message: 'Database connection working!'
    });
    
  } catch (error: any) {
    console.error('Database test error:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      errorCode: error.code,
      fullError: String(error),
      databaseUrl: process.env.DATABASE_URL 
    }, { status: 500 });
  }
}