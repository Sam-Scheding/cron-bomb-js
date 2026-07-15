import { explode } from "../explode";
import { IntersectionOptions } from "../types";

/**
 * Find timestamps that occur in both of two crontab schedules within a date
 * range.
 *
 * Each schedule is expanded via {@link explode}, then common ISO timestamps
 * are returned. Typical uses include detecting clashes (e.g. a recurring
 * booking vs public holidays).
 *
 * Comparison is by exact millisecond equality of the exploded ISO strings.
 * The current implementation is O(n×m) over the two occurrence lists.
 * Range bounds match {@link explode}: `(start, end]` — an occurrence exactly
 * equal to `start` is skipped; an occurrence exactly equal to `end` is included.
 *
 * @param options - Schedules and range to compare.
 * @param options.cron1 - First crontab expression.
 * @param options.cron2 - Second crontab expression.
 * @param options.start - Start of the range. Defaults to `new Date()`.
 *   An occurrence exactly equal to `start` is **not** included.
 * @param options.end - End of the range (inclusive). Defaults to `new Date()`.
 * @param options.tz - IANA timezone for both schedules. Defaults to `"UTC"`.
 *
 * @returns ISO 8601 timestamp strings present in both schedules. Empty if the
 *   schedules never overlap in the given range. Does not return full event
 *   objects — only the shared timestamps.
 *
 * @example
 * ```ts
 * const overlaps = intersection({
 *   cron1: '0 9 * * 1-5',
 *   cron2: '0 9 * * 1', // Mondays only
 *   start: new Date('2020-01-01T00:00:00.000Z'),
 *   end: new Date('2020-01-31T00:00:00.000Z'),
 *   tz: 'UTC',
 * });
 * // => ['2020-01-06T09:00:00.000Z', '2020-01-13T09:00:00.000Z', ...]
 * ```
 */
export function intersection({
  cron1,
  cron2,
  start = new Date(),
  end = new Date(),
  tz = "UTC",
}: IntersectionOptions): string[] {
  const dates1 = explode({ cron: cron1 }, { start, end, tz });
  const dates2 = explode({ cron: cron2 }, { start, end, tz });
  const result: string[] = [];

  // O(n²); fine for typical windows. A set/sort merge would be better at scale.
  for (const date1 of dates1) {
    for (const date2 of dates2) {
      if (new Date(date1.cron).getTime() === new Date(date2.cron).getTime()) {
        result.push(date1.cron);
      }
    }
  }

  return result;
}
