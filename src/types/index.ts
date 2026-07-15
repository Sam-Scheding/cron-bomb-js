export interface ExplodeOptions<F extends string = "cron"> {
  start?: Date;
  end?: Date;
  field?: F;
  /** ISO date strings or Date objects to omit from the result. */
  exclude?: Array<Date | string>;
  utc?: boolean;
  /** Reserved: when true, sort output by date. Not yet implemented. */
  sorted?: boolean;
}

export type ExplodedEvent<T, F extends string = "cron"> = Omit<T, F> &
  Record<F, string>;

export interface IntersectionOptions {
  cron1: string;
  cron2: string;
  start?: Date;
  end?: Date;
  utc?: boolean;
}
