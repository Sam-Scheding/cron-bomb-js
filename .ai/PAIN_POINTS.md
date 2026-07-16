# Pain points & opportunities

Internal notes on efficiency, API ergonomics, options, and features worth considering. Not a roadmap commitment — a working list to prioritize against.

---

## 1. Algorithm efficiency

### `intersection` is O(n×m) and does extra work per comparison

```53:59:src/intersection/index.ts
  for (const date1 of dates1) {
    for (const date2 of dates2) {
      if (new Date(date1.cron).getTime() === new Date(date2.cron).getTime()) {
        result.push(date1.cron);
      }
    }
  }
```

Problems:

- Nested loop is fine for small windows (a month of daily firings ≈ 30×30), but quadratic cost shows up quickly for dense crons (every minute) or year-long ranges.
- Each comparison re-parses ISO strings into `Date`s. The strings were just produced by `explode`; the epoch ms is already known and discarded.
- Both occurrence lists from `explode` are already in chronological order within a single cron. That ordering is unused.

Better approaches (cheapest first):

| Approach | Complexity | Notes |
| --- | --- | --- |
| Build a `Set` of epoch ms (or ISO strings) from schedule B; scan A | O(n + m) | Simplest win. Preserve A’s order by scanning `dates1`. |
| Two-pointer merge on already-sorted lists | O(n + m) | No hash set; good if memory matters. Same result order as today if you advance A. |
| Compare string equality on ISO when both sides share the same `tz` / format | O(n + m) with set | Avoid `new Date` entirely if strings are normalized (they are via `toISOString()`). |

Recommended default: Set of `date2.cron` (or `getTime()` once when exploding for intersection), then filter `dates1`. Drop the nested loop.

### Intersection pays for full event objects it throws away

`intersection` wraps bare cron strings as `{ cron }` and calls `explode`, which spreads event objects and produces `{ cron: ISO }[]`. Only the ISO strings are kept. A thin internal “expand cron → timestamps” helper (or a private mode on explode) would avoid pointless object allocation when the consumer only wants clashes.

### `explode` allocates a full copy per occurrence

Every hit does `{ ...event, [field]: iso }`. Correct and convenient, but for large ranges × many events this is the dominant cost after cron-parser itself. Not urgent unless consumers explode multi-year minute-level schedules; options later could include a “timestamps only” mode or a generator (see §4).

### What’s already fine

- `exclude` is normalized once into a `Set` of epoch ms (`toExcludedTimes`) — O(1) skip checks.
- Single-pass over cron-parser’s iterator; no accidental reparsing of the crontab per occurrence.

---

## 2. Public API ergonomics

### Strengths

- Small surface: `explode` + `intersection` + a handful of types.
- Generics preserve extra event fields; custom `field` is typed.
- Defaults lean explicit-ish on timezone (`"UTC"`) rather than process local time.
- Overloads for object vs array input match common “one event or many” call sites.

### Confusing or odd interactions

**1. The crontab field changes meaning**

Input: `cron` is an expression string.  
Output: the *same key* is an ISO timestamp.

```ts
explode({ title: "Standup", cron: "0 9 * * 1-5" }, { start, end });
// => [{ title: "Standup", cron: "2020-01-01T09:00:00.000Z" }, ...]
```

That’s compact, but:

- Callers lose the original expression unless they kept a copy.
- Reading `row.cron` after explode is easy to misread as “still a cron.”
- The name `cron` for a datetime is awkward; `field` only renames the awkwardness.

A clearer pattern (optional / additive) would be: leave the cron field alone and write occurrences to a separate key (e.g. `at`, `occurrence`, or `dateField`).

**2. Default `start` / `end` = `new Date()`**

Omitting the range often yields `[]` because the window is empty (and `start === end` never includes the boundary hit — `(start, end]` with equal bounds). Docs say this, but it’s a footgun for “quick try” usage. Prefer requiring `start`/`end`, or documenting loud defaults / throwing when both are omitted.

**3. Range is `(start, end]` — unusual and tied to cron-parser**

Occurrence exactly on `start` is skipped; exactly on `end` is included. Matches cron-parser’s `currentDate` semantics, but calendar UIs usually want `[start, end)` or closed calendar days. Easy to off-by-one when picking “from midnight to midnight.”

**4. `explode` vs `intersection` shapes disagree**

| | `explode` | `intersection` |
| --- | --- | --- |
| Input | Event object(s) with cron field | Bare `cron1` / `cron2` strings |
| Output | Event copies | ISO strings only |
| `exclude` | Yes | No |
| Custom `field` | Yes | N/A |

Clash detection against real event objects means unpacking crons manually. Intersection can’t reuse exclusions already applied to a booking series.

**5. `start` / `end` vs `exclude` type asymmetry**

`exclude` accepts `Date | string`. `start` / `end` are `Date` only. Callers with ISO strings from a DB must wrap starts/ends but not excludes.

**6. Error types**

Missing crontab field → `ReferenceError`. Invalid range → `RangeError`. Invalid cron → whatever cron-parser throws. `ReferenceError` is unconventional for “required property missing” (often `TypeError`); fine if intentional, but worth consistency in docs/examples.

**7. Array multipass order defaults to concatenation, not calendar merge**

All of event A’s dates, then all of B’s, unless the caller passes `compareFn`. Documented; timeline UIs should supply a comparator (typically by occurrence ISO / epoch ms).

---

## 3. Options: add, remove, or finish

### ~~Finish or remove `sorted`~~ → done as `compareFn`

Replaced the unused `sorted?: boolean` with `compareFn?: ExplodeCompareFn`. Default remains concat order; callers opt into chronological (or any) ordering.

### Consider requiring or softening range defaults

- **Stricter:** make `start` and `end` required on `ExplodeOptions` / `IntersectionOptions`.
- **Softer DX:** keep defaults but accept ISO strings for `start`/`end`, matching `exclude`.

### Options worth adding

| Option | Why |
| --- | --- |
| `dateField?: string` (or `occurrenceField`) | Write ISO to a new property; keep original cron string. Bigger ergonomic win than another rename of `field`. |
| `exclude` on `intersection` | Clash after cancellations without pre-filtering strings. |
| `limit?: number` | Cap occurrences for dense crons / accidental huge windows. |
| Inclusive start / explicit bound mode | e.g. `bounds: 'openStart' \| 'closed'` if `(start, end]` keeps biting people. |

### Options to avoid or defer

- Reintroducing a `utc` boolean beside `tz` — `tz` alone is clearer.
- Per-call cron-parser knobs beyond `tz` unless there’s a concrete consumer need (keeps the adapter thin).

---

## 4. Features that would help consumers

### Sorting — shipped as `compareFn`

Callers pass an `Array.prototype.sort` comparator. Typical chronological sort: `(a, b) => a.cron.localeCompare(b.cron)` (ISO strings from `toISOString()` compare lexicographically). Tie-break on other fields as needed. Engine sort is stable on supported Node versions.

### Richer set operations on schedules

Beyond pairwise timestamp intersection:

- **Union** — merge two (or N) crons / event lists into one occurrence stream.
- **Difference** — “booking schedule minus holidays” without inventing exclusions by hand.
- **N-way intersection** — overlap of more than two schedules.

These can share the same Set / merge primitives that fix today’s O(n²) intersection.

### Keep cron + separate occurrence timestamp

Most storage models want both “the rule” and “this instance.” An optional output key (or always writing `occurrence` / `date` while leaving `cron` intact) matches that better than overwriting.

### Event-shaped `intersection`

```ts
intersection({ a: eventA, b: eventB, start, end, field?, exclude?, tz? })
```

or `intersection(eventA, eventB, options)` — same field/exclude semantics as explode, return either shared ISO strings or paired event rows. Reduces glue code for clash detection.

### Lazy / bounded expansion

- Generator / async iterator: `for (const row of explodeIter(...))` without holding the full array.
- `nextOccurrence(data, { after, tz })` — single step without materializing a window.
- `count` / `limit` for “how many times does this fire in March?” without caring about payloads.

Valuable for calendars and job schedulers; not required for the library’s current “finite list in a window” pitch.

### Gentler exclude modes (later)

Exact-ms matching is correct and brittle (already noted in `.ai/TEMPORAL.md`): off-by-one ms, truncated ISO, or “cancel that calendar day” all fail. Optional modes (instant / wall-time / plain date) are a feature, not an efficiency fix — Temporal or careful zone math would help express them.

### Accept ISO (or Temporal later) for range bounds

Symmetry with `exclude`: `start` / `end` as `Date | string` removes busywork. A future `cron-bomb/temporal` entry can go further without breaking the Date default (see TEMPORAL.md).

---

## 5. Suggested priority (opinionated)

1. ~~**Implement or remove `sorted`**~~ → `compareFn` shipped.
2. **Make `intersection` O(n + m)** (Set or two-pointer) and stop re-parsing dates in the inner loop.
3. **Optional occurrence field** that doesn’t overwrite the crontab — biggest everyday ergonomic fix.
4. **Align `intersection` with explode** (`exclude`, event inputs, maybe shared helper).
5. **`limit` + ISO `start`/`end`** — safety and input symmetry.
6. Set ops / iterators / Temporal — valuable, but after the above.

---

## Mental model reminder

cron-bomb is a thin adapter over cron-parser: store cron on the event, materialize a finite `(start, end]` list when needed. Pain points above are mostly about **honest options**, **predictable shapes** (don’t reuse `cron` for dates forever), and **set-scale algorithms** so that thin adapter doesn’t become the bottleneck.
