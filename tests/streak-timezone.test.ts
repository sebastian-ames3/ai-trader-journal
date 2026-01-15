/**
 * Tests for Streak Tracking Timezone Handling (PRD 4 Phase D)
 *
 * Tests timezone-aware day boundary calculations and DST handling.
 */

import { describe, test, expect } from 'bun:test';
import {
  DEFAULT_TIMEZONE,
  getStartOfDayInTimezone,
  getDaysDifferenceInTimezone,
} from '../src/lib/streakTracking';

describe('Timezone Constants', () => {
  test('DEFAULT_TIMEZONE is America/New_York', () => {
    expect(DEFAULT_TIMEZONE).toBe('America/New_York');
  });
});

describe('getStartOfDayInTimezone', () => {
  test('Returns midnight in specified timezone', () => {
    // Create a date at noon UTC on Jan 15, 2024
    const utcNoon = new Date('2024-01-15T12:00:00Z');

    // Get start of day in New York (UTC-5 in January)
    const nyMidnight = getStartOfDayInTimezone(utcNoon, 'America/New_York');

    // New York midnight on Jan 15 is 05:00 UTC
    expect(nyMidnight.getUTCHours()).toBe(5);
    expect(nyMidnight.getUTCMinutes()).toBe(0);
    expect(nyMidnight.getUTCSeconds()).toBe(0);
  });

  test('Handles different timezones correctly', () => {
    const utcNoon = new Date('2024-01-15T12:00:00Z');

    // London (UTC+0 in winter)
    const londonMidnight = getStartOfDayInTimezone(utcNoon, 'Europe/London');
    expect(londonMidnight.getUTCHours()).toBe(0);

    // Tokyo (UTC+9)
    const tokyoMidnight = getStartOfDayInTimezone(utcNoon, 'Asia/Tokyo');
    // Tokyo midnight is 15:00 UTC the previous day
    expect(tokyoMidnight.getUTCDate()).toBe(14);
    expect(tokyoMidnight.getUTCHours()).toBe(15);
  });

  test('Falls back to UTC for invalid timezone', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    const result = getStartOfDayInTimezone(date, 'Invalid/Timezone');

    // Should fall back to UTC midnight
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
  });
});

describe('getDaysDifferenceInTimezone', () => {
  test('Same day returns 0', () => {
    const morning = new Date('2024-01-15T09:00:00Z');
    const evening = new Date('2024-01-15T21:00:00Z');

    const diff = getDaysDifferenceInTimezone(evening, morning, 'America/New_York');
    expect(diff).toBe(0);
  });

  test('Consecutive days returns 1', () => {
    // Monday evening in NY
    const day1 = new Date('2024-01-15T22:00:00Z'); // 5pm NY time
    // Tuesday evening in NY
    const day2 = new Date('2024-01-16T22:00:00Z'); // 5pm NY time

    const diff = getDaysDifferenceInTimezone(day2, day1, 'America/New_York');
    expect(diff).toBe(1);
  });

  test('Handles timezone boundary correctly', () => {
    // 11pm NY time on Jan 15 = 4am UTC Jan 16
    const late15th = new Date('2024-01-16T04:00:00Z');
    // 1am NY time on Jan 16 = 6am UTC Jan 16
    const early16th = new Date('2024-01-16T06:00:00Z');

    // In UTC, these are on the same day
    // But in NY timezone, they span midnight
    const diffNY = getDaysDifferenceInTimezone(early16th, late15th, 'America/New_York');
    expect(diffNY).toBe(1);

    // In UTC, both should be same day
    const diffUTC = getDaysDifferenceInTimezone(early16th, late15th, 'UTC');
    expect(diffUTC).toBe(0);
  });
});

describe('DST Transition Handling', () => {
  test('Handles spring forward (March DST transition)', () => {
    // In 2024, DST starts March 10 at 2am in US
    // Before DST: NY is UTC-5
    // After DST: NY is UTC-4

    // March 9 evening (before DST)
    const beforeDST = new Date('2024-03-10T02:00:00Z'); // 9pm NY March 9
    // March 10 evening (after DST)
    const afterDST = new Date('2024-03-10T23:00:00Z'); // 7pm NY March 10

    const diff = getDaysDifferenceInTimezone(afterDST, beforeDST, 'America/New_York');
    expect(diff).toBe(1);
  });

  test('Handles fall back (November DST transition)', () => {
    // In 2024, DST ends November 3 at 2am in US
    // Before DST end: NY is UTC-4
    // After DST end: NY is UTC-5

    // November 2 evening (before DST ends)
    const beforeDST = new Date('2024-11-02T23:00:00Z'); // 7pm NY Nov 2
    // November 3 evening (after DST ends)
    const afterDST = new Date('2024-11-04T00:00:00Z'); // 7pm NY Nov 3

    const diff = getDaysDifferenceInTimezone(afterDST, beforeDST, 'America/New_York');
    expect(diff).toBe(1);
  });

  test('DST day is still counted correctly', () => {
    // On the actual DST transition day
    const dstDay = new Date('2024-03-10T15:00:00Z'); // 11am NY (after spring forward)
    const nextDay = new Date('2024-03-11T15:00:00Z'); // 11am NY

    const diff = getDaysDifferenceInTimezone(nextDay, dstDay, 'America/New_York');
    expect(diff).toBe(1);
  });
});

describe('Edge Cases', () => {
  test('Handles dates across year boundary', () => {
    const dec31 = new Date('2023-12-31T22:00:00Z'); // 5pm NY Dec 31
    const jan1 = new Date('2024-01-01T22:00:00Z'); // 5pm NY Jan 1

    const diff = getDaysDifferenceInTimezone(jan1, dec31, 'America/New_York');
    expect(diff).toBe(1);
  });

  test('Handles leap year February 29', () => {
    const feb28 = new Date('2024-02-28T22:00:00Z'); // 5pm NY Feb 28
    const feb29 = new Date('2024-02-29T22:00:00Z'); // 5pm NY Feb 29
    const mar1 = new Date('2024-03-01T22:00:00Z'); // 5pm NY Mar 1

    expect(getDaysDifferenceInTimezone(feb29, feb28, 'America/New_York')).toBe(1);
    expect(getDaysDifferenceInTimezone(mar1, feb29, 'America/New_York')).toBe(1);
    expect(getDaysDifferenceInTimezone(mar1, feb28, 'America/New_York')).toBe(2);
  });

  test('Handles extreme timezone differences', () => {
    // Auckland is UTC+13 in summer
    // A date that is Jan 16 in Auckland but still Jan 15 in UTC
    const date = new Date('2024-01-15T12:00:00Z');

    const aucklandStart = getStartOfDayInTimezone(date, 'Pacific/Auckland');
    // Auckland midnight Jan 16 is Jan 15 11:00 UTC
    expect(aucklandStart.getUTCDate()).toBe(15);
    expect(aucklandStart.getUTCHours()).toBe(11);
  });

  test('Handles Hawaii timezone correctly', () => {
    // Hawaii doesn't observe DST, always UTC-10
    const date = new Date('2024-07-15T12:00:00Z');

    const hawaiiMidnight = getStartOfDayInTimezone(date, 'Pacific/Honolulu');
    expect(hawaiiMidnight.getUTCHours()).toBe(10);
  });
});
