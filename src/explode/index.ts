import parser from "cron-parser";
import { ExplodedEvent, ExplodeOptions } from "../types";
import { shouldSkip } from "../utils/should-skip";
import { toExcludedTimes } from "../utils/to-excluded-times";

/**
 * Expand one or more cron-bearing event objects into concrete occurrences
 * within a date range.
 *
 * Each input object must include a crontab string (by default under the key
 * `cron`). Every other property on the object is copied onto each result row.
 * For each occurrence in `(start, end]` (see {@link ExplodeOptions.start} /
 * {@link ExplodeOptions.end}), the crontab field is replaced with an ISO 8601
 * timestamp (`Date#toISOString()`).
 *
 * When `data` is an array, events are expanded in input order and concatenated
 * (all of event A, then all of event B). Results are not sorted by date unless
 * you do so yourself; `options.sorted` is reserved but not yet implemented.
 *
 * @typeParam T - Shape of each input event object.
 * @typeParam F - Name of the field that holds the crontab (defaults to `"cron"`).
 *
 * @param data - A single event object, or an array of event objects, each
 *   containing a crontab string under {@link ExplodeOptions.field}.
 * @param options - Expansion options.
 * @param options.start - Start of the range. Defaults to `new Date()`.
 *   An occurrence exactly equal to `start` is **not** included (iteration
 *   begins after this instant, matching `cron-parser`'s `currentDate` behavior).
 * @param options.end - End of the range (inclusive). Defaults to `new Date()`.
 *   An occurrence exactly equal to `end` **is** included.
 * @param options.field - Property name for the crontab. Defaults to `"cron"`.
 * @param options.exclude - Occurrences to omit. Accepts `Date`s and/or ISO
 *   strings (both are normalized to epoch ms). Matching is exact-millisecond.
 * @param options.utc - When `true`, evaluate the cron in UTC; otherwise use the
 *   local timezone. Defaults to `false`.
 * @param options.sorted - Reserved for future date-sorted output. Currently ignored.
 *
 * @returns An array of event copies with the crontab field replaced by ISO
 *   timestamp strings for each occurrence in range (minus exclusions).
 *
 * @throws {RangeError} If `start` is later than `end`.
 * @throws {ReferenceError} If an event is missing the crontab `field`.
 * @throws {Error} If the crontab string is invalid (from `cron-parser`).
 *
 * @example
 * ```ts
 * const events = explode(
 *   { title: 'Standup', cron: '0 9 * * 1-5' },
 *   {
 *     start: new Date('2020-01-01T00:00:00.000Z'),
 *     end: new Date('2020-01-08T00:00:00.000Z'),
 *     utc: true,
 *   },
 * );
 * // => [{ title: 'Standup', cron: '2020-01-01T09:00:00.000Z' }, ...]
 * ```
 */
export function explode<
  T extends Record<string, unknown>,
  F extends string = "cron",
>(
  data: T | readonly T[],
  {
    start = new Date(),
    end = new Date(),
    field = "cron" as F,
    exclude = [],
    utc = false,
    sorted: _sorted = false,
  }: ExplodeOptions<F> = {},
): Array<ExplodedEvent<T, F>> {
  void _sorted;

  const output: Array<ExplodedEvent<T, F>> = [];
  const events = Array.isArray(data) ? data : [data];
  const excludedTimes = toExcludedTimes(exclude);

  if (start.getTime() > end.getTime()) {
    throw new RangeError(
      "Start of datetime range cannot be later than end of datetime range",
    );
  }

  for (const event of events) {
    if (!Object.prototype.hasOwnProperty.call(event, field)) {
      throw new ReferenceError(`'${field}' field not present in data object.`);
    }

    const interval = parser.parseExpression(String(event[field]), {
      currentDate: start,
      endDate: end,
      utc,
    });

    // cron-parser signals end-of-range by throwing from next()
    while (true) {
      try {
        const current = interval.next().toDate();
        if (shouldSkip(current, excludedTimes)) {
          continue;
        }
        output.push({
          ...event,
          [field]: current.toISOString(),
        } as ExplodedEvent<T, F>);
      } catch {
        break;
      }
    }
  }

  return output;
}
