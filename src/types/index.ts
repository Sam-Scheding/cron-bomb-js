import { type CronExpressionOptions } from "cron-parser";

/**
 * Epoch-millisecond instants that should be omitted from explode results.
 *
 * Built once at the public API boundary so matching never cares whether the
 * caller originally passed `Date`s or ISO strings.
 */
export type ExcludedTimes = ReadonlySet<number>;

export type ExplodedEvent<T, F extends string = "cron"> = Omit<T, F> &
  Record<F, string>;

/**
 * Comparator for {@link ExplodeOptions.compareFn} — same contract as
 * `Array.prototype.sort` (`< 0` | `0` | `> 0`).
 */
export type ExplodeCompareFn<
  T extends Record<string, unknown> = Record<string, unknown>,
  F extends string = "cron",
> = (a: ExplodedEvent<T, F>, b: ExplodedEvent<T, F>) => number;

export interface ExplodeOptions<
  F extends string = "cron",
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  start?: Date;
  end?: Date;
  field?: F;
  /**
   * Occurrences to omit from the result.
   * `Date` and ISO strings are both accepted and compared by epoch ms.
   */
  exclude?: Array<Date | string>;
  /**
   * IANA timezone for cron evaluation (passed to `cron-parser` as `tz`).
   * Defaults to `"UTC"`.
   */
  tz?: CronExpressionOptions['tz'];
  /**
   * If set, sort the result with this comparator after expansion.
   * Omit to keep input-order concatenation (all of event A, then all of B).
   */
  compareFn?: ExplodeCompareFn<T, F>;
}

export interface IntersectionOptions {
  cron1: string;
  cron2: string;
  start?: Date;
  end?: Date;
  /** IANA timezone for both schedules. Defaults to `"UTC"`. */
  tz?: CronExpressionOptions['tz'];
}
