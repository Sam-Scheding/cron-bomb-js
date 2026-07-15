# Temporal and cron-bomb

Notes on whether / how the [Temporal](https://tc39.es/proposal-temporal/) proposal would help this library. Not a commitment to adopt it — readiness and API impact matter as much as the features.

## Is Temporal native or a package?

**Designed to be native** — a built-in language API (like `Date` / `Promise`), specified by TC39. It is not an “npm-first” library by design.

**Today in practice**, engine support is still incomplete across Node and browsers. Until Temporal is baseline in the environments we support, the usual bridge is:

- [`@js-temporal/polyfill`](https://www.npmjs.com/package/@js-temporal/polyfill) (or similar)

### Would consumers need to install Temporal?

| Approach | Do consumers install anything extra? |
| --- | --- |
| Wait until Temporal is built into supported Node/browsers | **No** — same as using `Date` |
| Expose Temporal types/values **now**, polyfill as a **dependency** of cron-bomb | **Not explicitly** — they get the polyfill transitively via cron-bomb (larger install, we own the version) |
| Expose Temporal **now**, polyfill as a **peerDependency** | **Yes** — they must install `@js-temporal/polyfill` (or rely on a native global) |
| Keep the main API as `Date` / ISO; Temporal only behind an opt-in entry | **Only if they import the Temporal entry** (see below) |

So: **eventually native = no extra install.** **Adopt early on the default export = consumers effectively depend on a polyfill** (directly or transitively), unless Temporal stays hidden behind a separate entrypoint.

## What hurts with `Date` today

cron-bomb’s public surface is built on `Date` + ISO strings + an IANA `tz` string (default `"UTC"`, aligned with `cron-parser`).

| Pain | How it shows up here |
| --- | --- |
| Instant vs calendar time are conflated | Cron fields mean “wall clock in a timezone” (hour 9, weekday Monday). `Date` is always a UTC instant; `tz` selects which zone those fields are evaluated in. |
| Exclusion matching is brittle | `exclude` is normalized to epoch ms. Same wall time in another offset, or a truncated ISO string, fails exact match even when a human would say “that occurrence.” |
| Output is instant-shaped only | Results replace the crontab field with `toISOString()`. Callers who want “9am Sydney on that day” re-derive timezone themselves. |
| Range bounds are hard to explain | `(start, end]` is defined on instants. For schedule UX, people often mean calendar-day or zoned local ranges. |

None of this blocks shipping, but it is the class of problem Temporal was designed for.

## What Temporal would buy us

### 1. Explicit calendar / timezone types

Instead of only `Date` + string `tz`, options could take:

- `Temporal.Instant` — absolute points (good for exclude by exact instant)
- `Temporal.ZonedDateTime` — wall time in a named zone (`Australia/Sydney`)
- `Temporal.PlainDateTime` / `PlainDate` — calendar values without an instant (less common for cron fire times)

That makes “run at 09:00 in London” a first-class input, not “set `TZ` on the server.”

### 2. Richer than string `tz` alone

We already prefer `tz?: string` over a boolean `utc` flag. Temporal would go further than an IANA name + `Date`:

```ts
{ timeZone: "UTC" }
// or zoned inputs:
{ start: Temporal.ZonedDateTime, end: Temporal.ZonedDateTime }
```

### 3. Better exclude semantics (optional modes)

Today: one mode — exact epoch ms.

With Temporal you could offer (still exact by default):

- exclude by **instant** (`Temporal.Instant`)
- exclude by **zoned wall time** (same local date/time in the schedule’s zone)
- exclude by **plain calendar day** (cancel “that day” regardless of which firing)

Those are API expansions, not free wins — but Temporal makes them expressible without more `Date`/`string` soup.

### 4. More honest outputs

Instead of only ISO instant strings, explode could return (or optionally return) `ZonedDateTime` / a structured `{ instant, timeZone, plainDateTime }` while still serializing for JSON when needed. Callers doing UI in a zone stop round-tripping through UTC incorrectly.

### 5. DST and civil-time edge cases

Named-zone arithmetic is Temporal’s strength: “next 2am” across a DST spring-forward is less of a hand-rolled mess. cron-parser already does a lot of this internally; Temporal helps at **our** API boundary when we accept/return zoned values, not necessarily inside cron expansion itself.

### 6. Interop with modern stacks

If consumers (and DB layers) start speaking Temporal, a Temporal-native cron-bomb fits better than forcing everything through `Date`. That’s a medium-term ecosystem bet, not an immediate need.

## What Temporal would *not* buy us (much)

| Area | Why |
| --- | --- |
| Cron expression parsing | Still need `cron-parser` (or similar). Temporal does not understand `0 9 * * 1-5`. |
| Algorithmic intersection / explode cost | O(n×m) vs smarter matching is independent of date types. |
| Most current tests | Lock UTC + ISO strings already; Temporal mainly changes the **public types**, not the cron matrix. |
| Dropping a dependency tomorrow | cron-parser v5 already moved off moment; Temporal doesn’t replace it. |

## Adoption blockers (as of writing)

- Temporal is a **TC39 proposal**; browser/Node shipping is incomplete / behind flags or polyfills depending on engine.
- Putting Temporal on the **default** export early forces a polyfill story on everyone (dependency or peer).
- Our outputs and options today are `Date` / ISO — a Temporal-first default API is a breaking redesign.
- cron-parser still speaks `Date` / strings / `tz`; we’d convert at the edges anyway.

## Preferable shape: keep core Date-based, add `cron-bomb/temporal`

Rather than replace the default API, expose Temporal behind an **opt-in entry** so Date consumers stay unaffected:

```ts
// default — no Temporal, no polyfill
import { explode, intersection } from "cron-bomb";

// opt-in — Temporal types in / Temporal types out
import { explode, intersection } from "cron-bomb/temporal";
```

### How that could be packaged

| Option | Pros | Cons |
| --- | --- | --- |
| **Subpath export** `"cron-bomb/temporal"` in the same package | One version, shared explode core, simple docs | Polyfill must be `optional` / `peer` / conditional so default installs stay lean |
| **Separate package** `cron-bomb-temporal` | Zero Temporal weight on `cron-bomb`; clearer peer on Temporal | Two packages to version/release; risk of drifting |

Subpath is probably enough for this repo; a separate package only if the polyfill / peer story gets messy.

### Consumer expectations for `cron-bomb/temporal`

- They **opt in** by importing that path.
- Until Temporal is native in their runtime, they (or we) provide a polyfill — ideally as a **peerDependency** documented as: “requires global `Temporal` or `@js-temporal/polyfill`.”
- Default `import "cron-bomb"` remains `Date` / ISO / `tz` and does **not** pull Temporal.

### Strawman API on that entry

```ts
// cron-bomb/temporal
explode(data, {
  start: Temporal.ZonedDateTime; // or Instant
  end: Temporal.ZonedDateTime;
  timeZone: string; // default "UTC"
  exclude?: Array<Temporal.Instant | Temporal.ZonedDateTime>;
});
```

Internally: convert to what cron-parser needs → reuse core explode logic → map results back to Temporal (and optionally ISO for JSON).

Shared algorithm, different boundary types — same test matrix for cron behavior, extra cases for TZ conversion.

## Recommendation

| Horizon | Action |
| --- | --- |
| Now | Stay on `Date` + ISO + IANA `tz` (default `"UTC"`). No Temporal on the default export. |
| Later (early Temporal era) | Prefer an opt-in **`cron-bomb/temporal`** (or companion package), not a breaking rewrite of the main entry. Peer/document the polyfill. |
| Later (Temporal baseline) | Same Temporal entry can drop the polyfill peer; optionally reconsider whether default should stay Date-based forever. |
| Highest-value use | Zoned/instant-explicit `start`/`end`/`exclude` beyond string `tz` — not rewriting cron math. |

**Bottom line:** Temporal’s value for cron-bomb is mainly **API clarity** (timezone intent, exclude modes, zoned outputs), not faster explode or ditching cron-parser. Keep the core package Date-native; if/when we offer Temporal, put it behind **`cron-bomb/temporal`** so only interested consumers take on native Temporal or a polyfill.
