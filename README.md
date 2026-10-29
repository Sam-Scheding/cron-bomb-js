# cron-bomb

[![npm version](https://img.shields.io/npm/v/cron-bomb.svg)](https://www.npmjs.com/package/cron-bomb)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

TypeScript-first helper for turning recurring event objects (described by [cron](https://crontab.guru/) expressions) into concrete occurrences over a date range.

Store a single crontab on your event (opening hours, bookings, reminders) and expand it only when you need a finite list — including cancellations (`exclude`) and schedule overlap checks (`intersection`).

## Install

```bash
npm install cron-bomb
```

```bash
pnpm add cron-bomb
```

```bash
yarn add cron-bomb
```

Requires Node.js 18+ (required by `cron-parser` v5).

## Quick start

```ts
import { explode } from "cron-bomb";

const start = new Date("2020-01-01T00:00:00.000Z");
const end = new Date("2020-01-08T00:00:00.000Z");

const occurrences = explode(
  {
    title: "Weekday standup",
    cron: "0 9 * * 1-5",
  },
  { start, end },
);

// [
//   { title: "Weekday standup", cron: "2020-01-01T09:00:00.000Z" },
//   { title: "Weekday standup", cron: "2020-01-02T09:00:00.000Z" },
//   ...
// ]
```

Cron evaluation defaults to `"UTC"`. Pass an IANA `tz` (e.g. `"Australia/Sydney"`) when you need another zone.

## API

```ts
import {
  explode,
  intersection,
  isBetween,
  next,
  previous,
  type BetweenWindow,
  type ExplodeCompareFn,
  type ExplodeOptions,
  type ExplodedEvent,
  type IntersectionOptions,
  type NavigateOptions,
} from "cron-bomb";
```

### `explode(data, options?)`

Expand one event object (or an array of them) into occurrence rows for `(start, end]`.

Each input must include a crontab string (default field name `"cron"`). Every other property is copied onto each result. The crontab field is replaced with an ISO 8601 timestamp (`Date#toISOString()`) per occurrence.

```ts
explode(data, {
  start?: Date; // default: new Date()
  end?: Date; // default: new Date()
  field?: string; // crontab property name; default: "cron"
  exclude?: Array<Date | string>; // exact-ms cancellations
  tz?: string; // IANA timezone; default: "UTC"
  compareFn?: (a, b) => number; // optional; Array.prototype.sort contract
});
```

**Behavior notes**

| Topic | Behavior |
| --- | --- |
| Array input | Events are expanded in input order and concatenated (all of A, then all of B). Not interleaved by date unless you pass `compareFn`. |
| `compareFn` | Applied to the full result after expansion. Same contract as `Array.prototype.sort`. Omit to keep concat order. |
| `exclude` | `Date` and/or ISO strings; compared by exact epoch millisecond. |
| Custom `field` | Reads that property for the crontab and writes ISO timestamps back to the same key. |
| Timezone | `tz` is passed to `cron-parser` (default `"UTC"`). Use an IANA name for other zones. |
| Range bounds | An occurrence exactly equal to `start` is skipped (iteration starts after `currentDate`). An occurrence exactly equal to `end` is included. |
| Errors | `RangeError` if `start > end`; `ReferenceError` if the crontab field is missing; invalid cron throws from [`cron-parser`](https://www.npmjs.com/package/cron-parser). |

**Custom field**

```ts
explode(
  { title: "Shift", schedule: "10 0 * * 1-5" },
  { start, end, field: "schedule" },
);
// => [{ title: "Shift", schedule: "2020-01-01T00:10:00.000Z" }, ...]
```

**Cancellations**

```ts
explode(event, {
  start,
  end,
  exclude: [
    "2020-01-02T00:10:00.000Z",
    new Date("2020-01-03T00:10:00.000Z"),
  ],
});
```

**Sorting multipass output**

```ts
explode([eventA, eventB], {
  start,
  end,
  // ISO timestamps sort lexicographically; tie-break on title if you want
  compareFn: (a, b) =>
    a.cron.localeCompare(b.cron) ||
    String(a.title).localeCompare(String(b.title)),
});
```

### `intersection(options)`

Return ISO timestamps that appear in **both** crontab schedules within a range. Useful for clash detection (e.g. recurring booking vs public holiday).

```ts
intersection({
  cron1: string;
  cron2: string;
  start?: Date;
  end?: Date;
  tz?: string; // default: "UTC"
}): string[];
```

```ts
const overlaps = intersection({
  cron1: "0 9 * * 1-5",
  cron2: "0 9 * * 1", // Mondays
  start: new Date("2020-01-01T00:00:00.000Z"),
  end: new Date("2020-01-31T00:00:00.000Z"),
});
// => ["2020-01-06T09:00:00.000Z", "2020-01-13T09:00:00.000Z", ...]
```

Results follow `cron1`’s expansion order. Returns only timestamp strings, not full event objects.

### `previous(cron, options?)` / `next(cron, options?)`

Find the closest occurrence of a crontab before or after an instant. Both return an ISO 8601 string and are **strict**: an occurrence exactly equal to `at` is skipped.

```ts
previous(cron: string, { at?: Date, tz?: string }): string; // at defaults to now, tz to "UTC"
next(cron: string, { at?: Date, tz?: string }): string;
```

```ts
const at = new Date("2020-01-03T12:00:00.000Z");
previous("0 9 * * 1-5", { at }); // => "2020-01-03T09:00:00.000Z"
next("0 9 * * 1-5", { at }); // => "2020-01-06T09:00:00.000Z"
```

### `isBetween({ from, to }, options?)`

Check whether an instant falls inside a recurring window that one crontab opens and another closes (e.g. opening hours).

```ts
isBetween({ from: string, to: string }, { at?: Date, tz?: string }): boolean;
```

```ts
const hours = { from: "0 9 * * 1-5", to: "0 17 * * 1-5" };
isBetween(hours, { at: new Date("2020-01-01T12:00:00.000Z") }); // => true
isBetween(hours, { at: new Date("2020-01-01T18:00:00.000Z") }); // => false
```

The window is active when the latest `from` at or before `at` is later than the latest `to` at or before `at`. Bounds are `[from, to)` (open at the `from` instant, closed at the `to` instant), windows may cross midnight, and if both crontabs fire on the same instant `to` wins.

## Cron syntax

Standard five-field cron expressions as understood by [cron-parser](https://www.npmjs.com/package/cron-parser). Helpful editor: [crontab.guru](https://crontab.guru/).

## Development

```bash
git clone https://github.com/Sam-Scheding/cron-bomb-js.git
cd cron-bomb-js
npm install
npm test
npm run build
```

| Script | Description |
| --- | --- |
| `npm test` | Run Jest + coverage |
| `npm run build` | Emit `dist/` (JS + typings) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## License

[ISC](https://opensource.org/licenses/ISC) © Sam Scheding

## Links

- [npm package](https://www.npmjs.com/package/cron-bomb)
- [GitHub repository](https://github.com/Sam-Scheding/cron-bomb-js)
- [Issue tracker](https://github.com/Sam-Scheding/cron-bomb-js/issues)
