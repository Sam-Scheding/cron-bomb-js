/**
 * Whether `current` matches any entry in `exclude` by exact millisecond time.
 *
 * `exclude` is usually ISO date strings (e.g. `'2020-01-03T00:10:00.000Z'`)
 * rather than `Date` instances, since databases typically store dates that way.
 */
export const shouldSkip = (
  current: Date,
  exclude: Array<Date | string>,
): boolean => {
  return exclude.some((date) => new Date(date).getTime() === current.getTime());
};
