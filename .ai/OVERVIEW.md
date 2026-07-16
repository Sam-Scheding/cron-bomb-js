# cron-bomb — overview

Small TypeScript-first library that expands recurring event objects (described by cron expressions) into concrete occurrences over a date range. Published as the npm package `cron-bomb`.

## Problem it solves

Recurring events (opening hours, bookings, holidays) are awkward to store either as every concrete instance in a DB, or as a custom recurrence model with second/minute/hour fields. cron-bomb keeps a normal event object plus a single crontab field, and materializes occurrences on demand for a `(start, end]` window — including exclusions (cancellations) and pairwise schedule overlap checks.

## Public API

All exports live in `src/index.ts` → built to `dist/`.

### `explode(data, options?)`

Core function. Turns one object (or an array of objects) that carry a cron expression into an array of copies where the cron field is replaced by an ISO timestamp for each occurrence.

| Input | Behavior |
| --- | --- |
| `data` | Object or array. Must include the crontab field (default key `cron`). Other properties are copied onto every output row. |
| `options.start` / `options.end` | `Date` window as `(start, end]`: occurrence exactly on `start` is skipped; exactly on `end` is included. Default both `new Date()`. Throws `RangeError` if start > end. |
| `options.field` | Name of the crontab property (default `'cron'`). Missing field → `ReferenceError`. Invalid cron → error from `cron-parser`. |
| `options.exclude` | `Date` or ISO string list; exact-millisecond matches are skipped (cancellations). |
| `options.tz` | IANA timezone passed to `cron-parser` (default `"UTC"`). |
| `options.compareFn` | Optional `Array.prototype.sort` comparator applied after expansion. Omit to keep input-order concatenation (all of A, then all of B). |

Return type preserves extra fields via generics (`ExplodedEvent<T, F>`): the named cron field becomes `string` (ISO).

### `intersection({ cron1, cron2, start?, end?, tz? })`

Explodes both cron strings over the same range, then returns ISO strings present in both (naïve O(n²) nested loop). Useful for clash detection (e.g. booking vs public holiday). Does not return full event objects — only timestamps. Identical schedules yield all of their shared occurrences; disjoint day-of-week crons yield `[]`.

## Implementation notes

- Depends on [`cron-parser`](https://www.npmjs.com/package/cron-parser) v5 (`CronExpressionParser.parse` + `hasNext()` / `next().toDate()`). `tz` is passed through directly.
- Exclusion matching is exact `getTime()` equality after normalizing via `toExcludedTimes`.
- Multipass arrays are concatenated per event (event A’s dates, then event B’s) unless `compareFn` is provided.
- Range window is `(start, end]`: occurrence exactly on `start` is skipped; exactly on `end` is included.

## Mental model for agents

Treat this as a thin adapter over cron-parser: **store cron on the event, explode into ISO instances when you need a finite list**. Prefer explicit `tz` (default `"UTC"`) over relying on process local time.
