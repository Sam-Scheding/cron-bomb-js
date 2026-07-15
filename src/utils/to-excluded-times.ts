import { ExcludedTimes } from "../types";

/**
 * Normalize public `exclude` values into epoch milliseconds.
 *
 * The explode option accepts both `Date` and ISO strings because callers come
 * both ways (in-memory `Date`s vs DB-serialized timestamps). Conversion happens
 * here so matching logic stays representation-agnostic.
 */
export function toExcludedTimes(
  exclude: ReadonlyArray<Date | string>,
): ExcludedTimes {
  return new Set(exclude.map((entry) => new Date(entry).getTime()));
}
