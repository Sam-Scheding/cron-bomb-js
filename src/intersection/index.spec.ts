import { intersection } from "./index";

const weekdayWindow = {
  start: new Date("2020-01-01T00:00:00.000Z"),
  end: new Date("2020-01-08T00:00:00.000Z"),
};

describe("intersection()", () => {
  describe("identical and disjoint schedules", () => {
    it("returns every shared timestamp when both crontabs are identical", () => {
      expect(
        intersection({
          cron1: "10 0 * * 1-5",
          cron2: "10 0 * * 1-5",
          ...weekdayWindow,
          utc: true,
        }),
      ).toEqual([
        "2020-01-01T00:10:00.000Z",
        "2020-01-02T00:10:00.000Z",
        "2020-01-03T00:10:00.000Z",
        "2020-01-06T00:10:00.000Z",
        "2020-01-07T00:10:00.000Z",
      ]);
    });

    it("returns no dates when schedules do not overlap", () => {
      expect(
        intersection({
          cron1: "0 0 * * 1",
          cron2: "0 0 * * 2",
          ...weekdayWindow,
          utc: true,
        }),
      ).toEqual([]);
    });
  });

  describe("partial overlap", () => {
    it("returns only shared timestamps when one schedule is a subset of the other", () => {
      // Weekdays ∩ Mondays → Monday only
      expect(
        intersection({
          cron1: "10 0 * * 1-5",
          cron2: "10 0 * * 1",
          ...weekdayWindow,
          utc: true,
        }),
      ).toEqual(["2020-01-06T00:10:00.000Z"]);
    });

    it("returns a single shared timestamp when schedules overlap once in the range", () => {
      // Weekdays at 00:10 ∩ January 6th at 00:10
      expect(
        intersection({
          cron1: "10 0 * * 1-5",
          cron2: "10 0 6 1 *",
          ...weekdayWindow,
          utc: true,
        }),
      ).toEqual(["2020-01-06T00:10:00.000Z"]);
    });

    it("does not match same calendar day at different times of day", () => {
      expect(
        intersection({
          cron1: "10 0 * * *",
          cron2: "20 0 * * *",
          start: new Date("2020-01-01T00:00:00.000Z"),
          end: new Date("2020-01-03T00:00:00.000Z"),
          utc: true,
        }),
      ).toEqual([]);
    });

    it("intersects asymmetric schedules in either argument order with the same set of times", () => {
      const a = intersection({
        cron1: "10 0 * * 1-5",
        cron2: "10 0 * * 1,3",
        ...weekdayWindow,
        utc: true,
      });
      const b = intersection({
        cron1: "10 0 * * 1,3",
        cron2: "10 0 * * 1-5",
        ...weekdayWindow,
        utc: true,
      });
      expect([...a].sort()).toEqual([...b].sort());
      expect([...a].sort()).toEqual([
        "2020-01-01T00:10:00.000Z",
        "2020-01-06T00:10:00.000Z",
      ]);
    });
  });

  describe("result order and shape", () => {
    it("returns timestamps in the order they appear in cron1's expansion", () => {
      // cron1 weekdays yields Wed then Mon among the intersection days
      expect(
        intersection({
          cron1: "10 0 * * 1-5",
          cron2: "10 0 * * 1,3",
          ...weekdayWindow,
          utc: true,
        }),
      ).toEqual([
        "2020-01-01T00:10:00.000Z",
        "2020-01-06T00:10:00.000Z",
      ]);
    });

    it("returns only ISO strings, not event objects", () => {
      const received = intersection({
        cron1: "10 0 * * 1",
        cron2: "10 0 * * 1-5",
        ...weekdayWindow,
        utc: true,
      });
      expect(received).toEqual(["2020-01-06T00:10:00.000Z"]);
      expect(typeof received[0]).toBe("string");
    });

    it("does not include duplicates when schedules share the same timestamp once", () => {
      const received = intersection({
        cron1: "10 0 * * 1",
        cron2: "10 0 * * 1",
        ...weekdayWindow,
        utc: true,
      });
      expect(received).toEqual(["2020-01-06T00:10:00.000Z"]);
      expect(new Set(received).size).toBe(received.length);
    });
  });

  describe("range and options", () => {
    it("respects start/end the same way explode does (boundary inclusivity)", () => {
      // End exactly on a shared firing is included; start exactly on one is not.
      expect(
        intersection({
          cron1: "10 0 * * *",
          cron2: "10 0 * * *",
          start: new Date("2020-01-01T00:00:00.000Z"),
          end: new Date("2020-01-01T00:10:00.000Z"),
          utc: true,
        }),
      ).toEqual(["2020-01-01T00:10:00.000Z"]);

      expect(
        intersection({
          cron1: "10 0 * * *",
          cron2: "10 0 * * *",
          start: new Date("2020-01-01T00:10:00.000Z"),
          end: new Date("2020-01-01T01:00:00.000Z"),
          utc: true,
        }),
      ).toEqual([]);
    });

    it("returns empty when the range contains no firings for either cron", () => {
      expect(
        intersection({
          cron1: "0 0 * * 1",
          cron2: "0 0 * * 1",
          start: new Date("2020-01-01T00:00:00.000Z"),
          end: new Date("2020-01-03T00:00:00.000Z"),
          utc: true,
        }),
      ).toEqual([]);
    });

    it("passes utc through so both sides are evaluated consistently", () => {
      const previousTz = process.env.TZ;
      process.env.TZ = "Australia/Sydney";
      try {
        const utc = intersection({
          cron1: "10 0 * * 1-5",
          cron2: "10 0 * * 1-5",
          ...weekdayWindow,
          utc: true,
        });
        const local = intersection({
          cron1: "10 0 * * 1-5",
          cron2: "10 0 * * 1-5",
          ...weekdayWindow,
          utc: false,
        });
        expect(utc).toEqual([
          "2020-01-01T00:10:00.000Z",
          "2020-01-02T00:10:00.000Z",
          "2020-01-03T00:10:00.000Z",
          "2020-01-06T00:10:00.000Z",
          "2020-01-07T00:10:00.000Z",
        ]);
        expect(local).toEqual([
          "2020-01-01T13:10:00.000Z",
          "2020-01-02T13:10:00.000Z",
          "2020-01-05T13:10:00.000Z",
          "2020-01-06T13:10:00.000Z",
          "2020-01-07T13:10:00.000Z",
        ]);
        expect(utc).not.toEqual(local);
      } finally {
        if (previousTz === undefined) {
          delete process.env.TZ;
        } else {
          process.env.TZ = previousTz;
        }
      }
    });
  });
});
