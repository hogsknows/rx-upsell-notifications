import type { DateRange } from "../types/message.js";

export interface ResolvedDateRange {
  periodStart: string; // "YYYY-MM-DD"
  periodEnd: string;   // "YYYY-MM-DD"
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Resolves a relative DateRange label to actual calendar start/end dates.
 * All dates are returned as "YYYY-MM-DD" strings.
 * Week boundaries are Monday–Sunday (ISO week convention).
 */
export function resolveDateRange(
  range: DateRange,
  now: Date = new Date()
): ResolvedDateRange {
  // Work with a clean date at midnight UTC to avoid timezone edge cases
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dow = today.getUTCDay(); // 0=Sun, 1=Mon … 6=Sat

  // Number of days since last Monday (0 if today is Monday)
  const daysSinceMon = (dow + 6) % 7;

  switch (range) {
    case "last_week": {
      // Monday–Sunday of the previous calendar week
      const startOfThisWeek = new Date(today);
      startOfThisWeek.setUTCDate(today.getUTCDate() - daysSinceMon);
      const start = new Date(startOfThisWeek);
      start.setUTCDate(startOfThisWeek.getUTCDate() - 7);
      const end = new Date(startOfThisWeek);
      end.setUTCDate(startOfThisWeek.getUTCDate() - 1);
      return { periodStart: toISODate(start), periodEnd: toISODate(end) };
    }

    case "current_week": {
      // Monday of the current week through today
      const start = new Date(today);
      start.setUTCDate(today.getUTCDate() - daysSinceMon);
      return { periodStart: toISODate(start), periodEnd: toISODate(today) };
    }

    case "last_fortnight": {
      // 14-day window ending on the Sunday before the current week started
      const startOfThisWeek = new Date(today);
      startOfThisWeek.setUTCDate(today.getUTCDate() - daysSinceMon);
      const end = new Date(startOfThisWeek);
      end.setUTCDate(startOfThisWeek.getUTCDate() - 1);
      const start = new Date(end);
      start.setUTCDate(end.getUTCDate() - 13);
      return { periodStart: toISODate(start), periodEnd: toISODate(end) };
    }

    case "last_month": {
      // 1st–last day of the previous calendar month
      const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
      const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));
      return { periodStart: toISODate(start), periodEnd: toISODate(end) };
    }

    case "current_month": {
      // 1st of current month through today
      const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
      return { periodStart: toISODate(start), periodEnd: toISODate(today) };
    }
  }
}
