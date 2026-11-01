import type { VisitWindow } from '@/lib/request-types';

/** Dates and times shown to staff, all in the company's time zone. Intl only, no date library. */
export const TIME_ZONE = process.env.APP_TIME_ZONE ?? 'America/New_York';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

/** "25 min", "2 hours", "3 days". */
export function ageWords(ms: number): string {
  if (ms < MINUTE) return 'Just now';
  if (ms < HOUR) return `${Math.floor(ms / MINUTE)} min`;
  if (ms < DAY) return plural(Math.floor(ms / HOUR), 'hour');
  return plural(Math.floor(ms / DAY), 'day');
}

/** The calendar date ("2026-10-31") of an instant in the company time zone. */
const dayKey = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date);

const daysBetween = (fromKey: string, toKey: string) => (Date.parse(toKey) - Date.parse(fromKey)) / DAY;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "today", "yesterday", "Wed" (within the last week) or "Oct 12". */
function dayWord(date: Date, now: Date): string {
  const ago = daysBetween(dayKey(date), dayKey(now));
  if (ago === 0) return 'today';
  if (ago === 1) return 'yesterday';
  const options: Intl.DateTimeFormatOptions = ago > 0 && ago < 7 ? { weekday: 'short' } : { month: 'short', day: 'numeric' };
  return new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, ...options }).format(date);
}

const time = (date: Date) =>
  new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: 'numeric', minute: '2-digit' }).format(date);

/** "Today, 10:44 AM" */
export function submittedLabel(iso: string, now: Date): string {
  const date = new Date(iso);
  return `${capitalize(dayWord(date, now))}, ${time(date)}`;
}

/** "today at 9:12 AM", for sentences like "Sent today at 9:12 AM". */
export function atLabel(iso: string, now: Date): string {
  const date = new Date(iso);
  return `${dayWord(date, now)} at ${time(date)}`;
}

/** "today", "Wed": the day only, for "Waiting since Wed" and "Fixed Fri". */
export function dayLabel(iso: string, now: Date): string {
  return dayWord(new Date(iso), now);
}

const WINDOWS: Record<VisitWindow, string> = { any: '', morning: '8–12', afternoon: '12–5' };

/** "Today, 12–5", "Tomorrow, 8–12", "Fri", or "No visit set yet". `visitDate` is a plain date ("2026-11-02"). */
export function humanVisit(visitDate: string | null, window: VisitWindow, now: Date): string {
  if (!visitDate) return 'No visit set yet';
  const ahead = daysBetween(dayKey(now), visitDate);
  const day =
    ahead === 0
      ? 'Today'
      : ahead === 1
        ? 'Tomorrow'
        : new Intl.DateTimeFormat('en-US', {
            timeZone: 'UTC', // visitDate has no time, so don't shift it into another day
            ...(ahead > 0 && ahead < 7 ? { weekday: 'short' } : { month: 'short', day: 'numeric' }),
          } as Intl.DateTimeFormatOptions).format(new Date(visitDate));
  return WINDOWS[window] ? `${day}, ${WINDOWS[window]}` : day;
}

/** Today's calendar date ("2026-11-02") in the company time zone; the earliest day a visit can be booked. */
export const todayInZone = () => dayKey(new Date());
