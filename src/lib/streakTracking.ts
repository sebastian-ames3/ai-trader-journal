import { differenceInCalendarDays, startOfDay } from 'date-fns';
import prisma from './prisma';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
  lastEntryDate: Date | null;
  isNewMilestone: boolean;
  milestoneType?: 'entry' | 'streak' | 'personal-best';
  milestoneValue?: number;
}

// Milestone thresholds
const ENTRY_MILESTONES = [1, 5, 10, 25, 50, 100, 250, 500];
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365];

/**
 * Updates streak tracking after a new entry is created
 * Implements grace day logic: allows 1 missed day before resetting streak
 */
export async function updateStreakAfterEntry(): Promise<StreakData> {
  const settings = await prisma.settings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      currentStreak: 0,
      longestStreak: 0,
      totalEntries: 0,
    },
    update: {},
  });

  const now = startOfDay(new Date());
  const lastEntry = settings.lastEntryDate ? startOfDay(settings.lastEntryDate) : null;
  const lastGrace = settings.lastGraceDate ? startOfDay(settings.lastGraceDate) : null;

  let newStreak = settings.currentStreak;
  let usedGraceToday = false;

  // Calculate days since last entry
  if (lastEntry) {
    const daysSinceLastEntry = differenceInCalendarDays(now, lastEntry);

    if (daysSinceLastEntry === 0) {
      // Same day entry - no streak change
      newStreak = settings.currentStreak;
    } else if (daysSinceLastEntry === 1) {
      // Consecutive day - increment streak
      newStreak = settings.currentStreak + 1;
    } else if (daysSinceLastEntry === 2) {
      // Missed 1 day - check if we can use grace day
      const daysSinceGrace = lastGrace ? differenceInCalendarDays(now, lastGrace) : Infinity;

      if (daysSinceGrace > 7) {
        // Grace day available (not used in past week)
        newStreak = settings.currentStreak + 1;
        usedGraceToday = true;
      } else {
        // Grace day already used recently - reset streak
        newStreak = 1;
      }
    } else {
      // Missed 2+ days - reset streak
      newStreak = 1;
    }
  } else {
    // First entry ever
    newStreak = 1;
  }

  const newTotalEntries = settings.totalEntries + 1;
  const newLongestStreak = Math.max(newStreak, settings.longestStreak);

  // Check for milestones
  let isNewMilestone = false;
  let milestoneType: 'entry' | 'streak' | 'personal-best' | undefined;
  let milestoneValue: number | undefined;

  // Check entry milestones
  if (ENTRY_MILESTONES.includes(newTotalEntries)) {
    isNewMilestone = true;
    milestoneType = 'entry';
    milestoneValue = newTotalEntries;
  }

  // Check streak milestones
  if (STREAK_MILESTONES.includes(newStreak) && newStreak > settings.currentStreak) {
    isNewMilestone = true;
    milestoneType = 'streak';
    milestoneValue = newStreak;
  }

  // Check personal best
  if (newStreak > settings.longestStreak) {
    isNewMilestone = true;
    milestoneType = 'personal-best';
    milestoneValue = newStreak;
  }

  // Update database
  await prisma.settings.update({
    where: { id: 'default' },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      totalEntries: newTotalEntries,
      lastEntryDate: now,
      lastGraceDate: usedGraceToday ? now : settings.lastGraceDate,
    },
  });

  return {
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    totalEntries: newTotalEntries,
    lastEntryDate: now,
    isNewMilestone,
    milestoneType,
    milestoneValue,
  };
}

/**
 * Gets current streak data without updating
 */
export async function getStreakData(): Promise<StreakData> {
  const settings = await prisma.settings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      currentStreak: 0,
      longestStreak: 0,
      totalEntries: 0,
    },
    update: {},
  });

  return {
    currentStreak: settings.currentStreak,
    longestStreak: settings.longestStreak,
    totalEntries: settings.totalEntries,
    lastEntryDate: settings.lastEntryDate,
    isNewMilestone: false,
  };
}

/**
 * Generates celebration message for milestones
 */
export function getCelebrationMessage(
  milestoneType: 'entry' | 'streak' | 'personal-best',
  value: number
): string {
  switch (milestoneType) {
    case 'entry':
      if (value === 1) return '🎉 First entry! Welcome to your trading journal';
      if (value === 5) return '🎉 5 entries logged! You\'re building momentum';
      if (value === 10) return '🎉 10 entries! Strong journaling habit forming';
      if (value === 25) return '🌟 25 entries! Consistency is paying off';
      if (value === 50) return '🌟 50 entries! You\'re a journaling pro';
      if (value === 100) return '🏆 100 entries! Exceptional dedication';
      if (value === 250) return '🏆 250 entries! Pattern recognition mastery unlocked';
      if (value === 500) return '🏆 500 entries! Trading psychology expert level';
      return `🎉 ${value} entries logged!`;

    case 'streak':
      if (value === 3) return '🔥 3 day streak! Building the habit';
      if (value === 7) return '⭐ 7 day streak! One week of consistency';
      if (value === 14) return '⭐ 14 day streak! Two solid weeks';
      if (value === 30) return '🏆 30 day streak! One month of dedication';
      if (value === 60) return '🏆 60 day streak! Pattern recognition improving';
      if (value === 90) return '🏆 90 day streak! Quarterly excellence';
      if (value === 180) return '🏆 180 day streak! Half-year champion';
      if (value === 365) return '🏆 365 day streak! LEGENDARY! One full year';
      return `🔥 ${value} day streak!`;

    case 'personal-best':
      return `🏆 New record: ${value} day streak! Your longest yet`;

    default:
      return '🎉 Milestone achieved!';
  }
}
