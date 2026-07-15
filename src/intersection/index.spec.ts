import { intersection } from "./index";

describe("intersection()", () => {
  describe("partial overlap", () => {
    it("gives the correct intersection of two identical crontabs", () => {
      const start = new Date("01 January 2020 00:00 UTC");
      const end = new Date("08 January 2020 00:00 UTC");
      const expected = [
        "2020-01-01T00:10:00.000Z",
        "2020-01-02T00:10:00.000Z",
        "2020-01-03T00:10:00.000Z",
        "2020-01-06T00:10:00.000Z",
        "2020-01-07T00:10:00.000Z",
      ];
      const received = intersection({
        cron1: "10 0 * * 1-5",
        cron2: "10 0 * * 1-5",
        start,
        end,
        utc: true,
      });
      expect(received).toEqual(expected);
    });

    it("returns no dates when schedules do not overlap", () => {
      const start = new Date("01 January 2020 00:00 UTC");
      const end = new Date("08 January 2020 00:00 UTC");
      const received = intersection({
        cron1: "0 0 * * 1", // Mondays
        cron2: "0 0 * * 2", // Tuesdays
        start,
        end,
        utc: true,
      });
      expect(received).toEqual([]);
    });

    it.todo(
      "returns only shared timestamps when one schedule is a subset of the other",
    );
    it.todo(
      "returns a single shared timestamp when schedules overlap once in the range",
    );
    it.todo("does not match same calendar day at different times of day");
    it.todo(
      "intersects asymmetric schedules in either argument order with the same set of times",
    );
  });

  describe("result order and shape", () => {
    it.todo("returns timestamps in the order they appear in cron1's expansion");
    it.todo("returns only ISO strings, not event objects");
    it.todo(
      "does not include duplicates when schedules share the same timestamp once",
    );
  });

  describe("range and options", () => {
    it.todo(
      "respects start/end the same way explode does (boundary inclusivity)",
    );
    it.todo("returns empty when the range contains no firings for either cron");
    it.todo("passes utc through so both sides are evaluated consistently");
  });
});
