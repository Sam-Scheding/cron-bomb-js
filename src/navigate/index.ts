import { CronExpressionParser } from "cron-parser";
import { BetweenWindow, NavigateOptions } from "../types";

/**
 * Find the most recent occurrence of a crontab **strictly before** `at`.
 *
 * @param cron - Crontab expression.
 * @param options - Lookup options.
 * @param options.at - Reference instant. Defaults to `new Date()`.
 * @param options.tz - IANA timezone for cron evaluation. Defaults to `"UTC"`.
 *
 * @returns ISO 8601 timestamp of the previous occurrence.
 *
 * @throws {Error} If the crontab is invalid, or has no previous occurrence
 *   (from `cron-parser`).
 *
 * @example
 * ```ts
 * previous('0 9 * * 1-5', { at: new Date('2020-01-03T12:00:00.000Z') });
 * // => '2020-01-03T09:00:00.000Z'
 * ```
 */
export function previous(
  cron: string,
  { at = new Date(), tz = "UTC" }: NavigateOptions = {},
): string {
  return CronExpressionParser.parse(cron, { currentDate: at, tz })
    .prev()
    .toDate()
    .toISOString();
}

/**
 * Find the next occurrence of a crontab **strictly after** `at`.
 *
 * @param cron - Crontab expression.
 * @param options - Lookup options.
 * @param options.at - Reference instant. Defaults to `new Date()`.
 * @param options.tz - IANA timezone for cron evaluation. Defaults to `"UTC"`.
 *
 * @returns ISO 8601 timestamp of the next occurrence.
 *
 * @throws {Error} If the crontab is invalid, or has no next occurrence
 *   (from `cron-parser`).
 *
 * @example
 * ```ts
 * next('0 9 * * 1-5', { at: new Date('2020-01-03T12:00:00.000Z') });
 * // => '2020-01-06T09:00:00.000Z'
 * ```
 */
export function next(
  cron: string,
  { at = new Date(), tz = "UTC" }: NavigateOptions = {},
): string {
  return CronExpressionParser.parse(cron, { currentDate: at, tz })
    .next()
    .toDate()
    .toISOString();
}

/**
 * Most recent occurrence at or before `at`, as epoch ms.
 *
 * Cron has one-second resolution, so `at` is rounded up to the next whole
 * second before stepping back. That makes an occurrence on the same second
 * as `at` count (cron-parser's own `prev()` is strictly-before).
 */
function lastAtOrBefore(cron: string, at: Date, tz: string): number {
  const bound = Math.floor(at.getTime() / 1000) * 1000 + 1000;
  return CronExpressionParser.parse(cron, { currentDate: new Date(bound), tz })
    .prev()
    .toDate()
    .getTime();
}

/**
 * Check whether `at` falls inside a recurring window opened by one crontab
 * and closed by another (e.g. opening hours).
 *
 * The window is active when the most recent `from` occurrence at or before
 * `at` is later than the most recent `to` occurrence at or before `at`.
 * Bounds are therefore `[from, to)`: active
 * exactly at an opening instant, inactive exactly at a closing instant.
 * If `from` and `to` fire on the same instant, `to` wins.
 *
 * @param window - Crontabs that open and close the window.
 * @param window.from - Crontab for when the window opens.
 * @param window.to - Crontab for when the window closes.
 * @param options - Lookup options.
 * @param options.at - Instant to test. Defaults to `new Date()`.
 * @param options.tz - IANA timezone for both crontabs. Defaults to `"UTC"`.
 *
 * @returns `true` if `at` is inside an open window.
 *
 * @throws {Error} If either crontab is invalid (from `cron-parser`).
 *
 * @example
 * ```ts
 * const hours = { from: '0 9 * * 1-5', to: '0 17 * * 1-5' };
 * isBetween(hours, { at: new Date('2020-01-01T12:00:00.000Z') }); // true
 * isBetween(hours, { at: new Date('2020-01-01T18:00:00.000Z') }); // false
 * ```
 */
export function isBetween(
  { from, to }: BetweenWindow,
  { at = new Date(), tz = "UTC" }: NavigateOptions = {},
): boolean {
  const lastFrom = lastAtOrBefore(from, at, tz);
  const lastTo = lastAtOrBefore(to, at, tz);

  return lastFrom > lastTo;
}
