import { ExcludedTimes } from "../types";

/** Whether `current` matches any excluded instant by exact millisecond. */
export function shouldSkip(
  current: Date,
  excludedTimes: ExcludedTimes,
): boolean {
  return excludedTimes.has(current.getTime());
}
