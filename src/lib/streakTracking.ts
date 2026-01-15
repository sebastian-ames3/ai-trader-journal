import { differenceInCalendarDays } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { prisma } from './prisma';

/**
 * Default timezone used when user hasn't set a preference
 */
export const DEFAULT_TIMEZONE = 'America/New_York';

/**
 * Gets the start of day in user's timezone.
 * This ensures streak calculations are based on the user's local midnight,
 * not UTC midnight.
 *
 * @param date - The date to get start of day for (in UTC)
 * @param timezone - IANA timezone string (e.g., "America/New_York")
 * @returns Date object representing start of day in user's timezone (as UTC)
 */
export function getStartOfDayInTimezone(date: Date, timezone: string): Date {
  try {
    // Validate timezone by checking if Intl recognizes it
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
    } catch {
      throw new Error(`Invalid timezone: ${timezone}`);
    }

    // Convert UTC date to user's timezone
    const zonedDate = toZonedTime(date, timezone);

    // Check if the result is valid
    if (isNaN(zonedDate.getTime())) {
      throw new Error('toZonedTime returned invalid date');
    }

    // Get start of day in that timezone
    const startOfDayZoned = new Date(zonedDate);
    startOfDayZoned.setHours(0, 0, 0, 0);

    // Convert back to UTC for storage/comparison
    const result = fromZonedTime(startOfDayZoned, timezone);

    // Verify result is valid
    if (isNaN(result.getTime())) {
      throw new Error('fromZonedTime returned invalid date');
    }

    return result;
  } catch (error) {
    // Fallback to UTC if timezone is invalid
    console.warn(`Invalid timezone "${timezone}", falling back to UTC`, error);
    const utcStart = new Date(date);
    utcStart.setUTCHours(0, 0, 0, 0);
    return utcStart;
  }
}

/**
 * Calculates the difference in calendar days between two dates
 * in the context of a specific timezone.
 *
 * This handles DST transitions gracefully by:
 * 1. Converting both dates to the user's timezone
 * 2. Getting start of day for each
 * 3. Comparing the calendar days
 *
 * @param laterDate - The more recent date
 * @param earlierDate - The earlier date
 * @param timezone - IANA timezone string
 * @returns Number of calendar days difference
 */
export function getDaysDifferenceInTimezone(
  laterDate: Date,
  earlierDate: Date,
  timezone: string
): number {
  const laterStart = getStartOfDayInTimezone(laterDate, timezone);
  const earlierStart = getStartOfDayInTimezone(earlierDate, timezone);

  return differenceInCalendarDays(laterStart, earlierStart);
}

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
 *
 * Uses user's timezone for day boundary calculations to ensure
 * streaks are tracked based on the user's local time, not UTC.
 */
export async function updateStreakAfterEntry(userId: string): Promise<StreakData> {
  try {
    const settings = await prisma.settings.upsert({
      where: { userId },
      create: {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalEntries: 0,
        defaultRisk: 1.0,
        accountSize: 10000,
        liquidityThreshold: 100,
        ivThreshold: 80,
        timezone: DEFAULT_TIMEZONE,
      },
      update: {},
    });

    // Use user's timezone for day boundary calculations
    const timezone = settings.timezone || DEFAULT_TIMEZONE;
    const now = getStartOfDayInTimezone(new Date(), timezone);
    const lastEntry = settings.lastEntryDate
      ? getStartOfDayInTimezone(settings.lastEntryDate, timezone)
      : null;
    const lastGrace = settings.lastGraceDate
      ? getStartOfDayInTimezone(settings.lastGraceDate, timezone)
      : null;

    let newStreak = settings.currentStreak;
    let usedGraceToday = false;

    // Calculate days since last entry using timezone-aware comparison
    if (lastEntry) {
      const daysSinceLastEntry = getDaysDifferenceInTimezone(
        new Date(),
        settings.lastEntryDate!,
        timezone
      );

      if (daysSinceLastEntry === 0) {
        // Same day entry - no streak change
        newStreak = settings.currentStreak;
      } else if (daysSinceLastEntry === 1) {
        // Consecutive day - increment streak
        newStreak = settings.currentStreak + 1;
      } else if (daysSinceLastEntry === 2) {
        // Missed 1 day - check if we can use grace day
        const daysSinceGrace = lastGrace && settings.lastGraceDate
          ? getDaysDifferenceInTimezone(new Date(), settings.lastGraceDate, timezone)
          : Infinity;

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
      where: { userId },
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
  } catch (error) {
    console.error('Error updating streak:', error);
    // Return default values on error to prevent blocking entry creation
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalEntries: 0,
      lastEntryDate: null,
      isNewMilestone: false,
    };
  }
}

/**
 * Gets current streak data without updating
 */
export async function getStreakData(userId: string): Promise<StreakData> {
  try {
    const settings = await prisma.settings.upsert({
      where: { userId },
      create: {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalEntries: 0,
        defaultRisk: 1.0,
        accountSize: 10000,
        liquidityThreshold: 100,
        ivThreshold: 80,
        timezone: DEFAULT_TIMEZONE,
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
  } catch (error) {
    console.error('Error fetching streak data:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalEntries: 0,
      lastEntryDate: null,
      isNewMilestone: false,
    };
  }
}

/**
 * Updates user's timezone preference
 */
export async function updateUserTimezone(
  userId: string,
  timezone: string
): Promise<void> {
  // Validate timezone string
  try {
    // Test if timezone is valid by trying to use it
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    throw new Error(`Invalid timezone: ${timezone}`);
  }

  await prisma.settings.upsert({
    where: { userId },
    create: {
      userId,
      timezone,
      defaultRisk: 1.0,
      accountSize: 10000,
      liquidityThreshold: 100,
      ivThreshold: 80,
    },
    update: { timezone },
  });
}

/**
 * Gets user's current timezone
 */
export async function getUserTimezone(userId: string): Promise<string> {
  const settings = await prisma.settings.findUnique({
    where: { userId },
    select: { timezone: true },
  });

  return settings?.timezone || DEFAULT_TIMEZONE;
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
