import { explode } from "./index";

const weekdayWindow = {
  start: new Date("2020-01-01T00:00:00.000Z"),
  end: new Date("2020-01-08T00:00:00.000Z"),
};

describe("explode()", () => {
  describe("input shapes", () => {
    it("accepts data as a single object", () => {
      const data = {
        title: "Lord Of The Fries",
        cron: "10 0 * * 1-5",
      };
      const expected = [
        { title: "Lord Of The Fries", cron: "2020-01-01T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-02T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-03T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-06T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-07T00:10:00.000Z" },
      ];
      expect(
        explode(data, { ...weekdayWindow, utc: true }),
      ).toEqual(expected);
    });

    it("accepts data as an array of objects", () => {
      const data = [
        {
          title: "Lord Of The Fries",
          cron: "10 0 * * 1-5",
        },
        {
          title: "Shift Eatery",
          cron: "10 0 * * 1-5",
        },
      ];
      const expected = [
        { title: "Lord Of The Fries", cron: "2020-01-01T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-02T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-03T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-06T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-07T00:10:00.000Z" },
        { title: "Shift Eatery", cron: "2020-01-01T00:10:00.000Z" },
        { title: "Shift Eatery", cron: "2020-01-02T00:10:00.000Z" },
        { title: "Shift Eatery", cron: "2020-01-03T00:10:00.000Z" },
        { title: "Shift Eatery", cron: "2020-01-06T00:10:00.000Z" },
        { title: "Shift Eatery", cron: "2020-01-07T00:10:00.000Z" },
      ];
      expect(
        explode(data, { ...weekdayWindow, utc: true }),
      ).toEqual(expected);
    });
  });

  describe("errors", () => {
    it("throws ReferenceError when the crontab field is missing", () => {
      expect(() => {
        explode({ nocronfield: "1 1 * * 0" }, {});
      }).toThrow(ReferenceError);
    });

    it("throws when the crontab is not valid cron syntax", () => {
      const data = {
        title: "Lord Of The Fries",
        cron: "8",
      };
      expect(() => {
        explode(data, { ...weekdayWindow });
      }).toThrow(Error);
    });

    it("throws RangeError when start is later than end", () => {
      const data = {
        title: "Lord Of The Fries",
        cron: "10 0 * * 1-5",
      };
      expect(() => {
        explode(data, {
          start: new Date("2020-01-08T00:00:00.000Z"),
          end: new Date("2020-01-01T00:00:00.000Z"),
        });
      }).toThrow(RangeError);
    });
  });

  describe("custom field name", () => {
    it("reads and rewrites the configured field instead of cron", () => {
      const field = "blah" as const;
      const data = {
        title: "Lord Of The Fries",
        [field]: "10 0 * * 1-5",
      };
      const expected = [
        { title: "Lord Of The Fries", [field]: "2020-01-01T00:10:00.000Z" },
        { title: "Lord Of The Fries", [field]: "2020-01-02T00:10:00.000Z" },
        { title: "Lord Of The Fries", [field]: "2020-01-03T00:10:00.000Z" },
        { title: "Lord Of The Fries", [field]: "2020-01-06T00:10:00.000Z" },
        { title: "Lord Of The Fries", [field]: "2020-01-07T00:10:00.000Z" },
      ];
      expect(
        explode(data, { ...weekdayWindow, field, utc: true }),
      ).toEqual(expected);
    });
  });

  describe("range boundaries", () => {
    // Observed: cron-parser iteration starts after `currentDate`, so an
    // occurrence exactly equal to `start` is skipped. `end` is inclusive.
    it("skips an occurrence that falls exactly on start", () => {
      expect(
        explode(
          { cron: "10 0 * * *" },
          {
            start: new Date("2020-01-01T00:10:00.000Z"),
            end: new Date("2020-01-01T01:00:00.000Z"),
            utc: true,
          },
        ),
      ).toEqual([]);
    });

    it("includes an occurrence that falls exactly on end", () => {
      expect(
        explode(
          { cron: "10 0 * * *" },
          {
            start: new Date("2020-01-01T00:00:00.000Z"),
            end: new Date("2020-01-01T00:10:00.000Z"),
            utc: true,
          },
        ),
      ).toEqual([{ cron: "2020-01-01T00:10:00.000Z" }]);
    });

    it("excludes occurrences strictly before start", () => {
      expect(
        explode(
          { cron: "10 0 * * *" },
          {
            start: new Date("2020-01-01T00:10:01.000Z"),
            end: new Date("2020-01-02T00:10:00.000Z"),
            utc: true,
          },
        ),
      ).toEqual([{ cron: "2020-01-02T00:10:00.000Z" }]);
    });

    it("excludes occurrences strictly after end", () => {
      expect(
        explode(
          { cron: "10 0 * * *" },
          {
            start: new Date("2020-01-01T00:00:00.000Z"),
            end: new Date("2020-01-01T00:09:59.000Z"),
            utc: true,
          },
        ),
      ).toEqual([]);
    });

    it("returns empty when start === end even if that instant matches the cron", () => {
      expect(
        explode(
          { cron: "10 0 * * *" },
          {
            start: new Date("2020-01-01T00:10:00.000Z"),
            end: new Date("2020-01-01T00:10:00.000Z"),
            utc: true,
          },
        ),
      ).toEqual([]);
    });

    it("returns empty when start === end and it does not match", () => {
      expect(
        explode(
          { cron: "10 0 * * *" },
          {
            start: new Date("2020-01-01T00:00:00.000Z"),
            end: new Date("2020-01-01T00:00:00.000Z"),
            utc: true,
          },
        ),
      ).toEqual([]);
    });
  });

  describe("empty and no-hit windows", () => {
    it("returns an empty array when data is an empty array", () => {
      expect(
        explode([], { ...weekdayWindow, utc: true }),
      ).toEqual([]);
    });

    it("returns an empty array when the cron never fires in the range", () => {
      // Wed–Fri window; Mondays-only cron
      expect(
        explode(
          { cron: "0 0 * * 1" },
          {
            start: new Date("2020-01-01T00:00:00.000Z"),
            end: new Date("2020-01-03T00:00:00.000Z"),
            utc: true,
          },
        ),
      ).toEqual([]);
    });

    it("returns an empty array when every occurrence is excluded", () => {
      const exclude = [
        "2020-01-01T00:10:00.000Z",
        "2020-01-02T00:10:00.000Z",
        "2020-01-03T00:10:00.000Z",
        "2020-01-06T00:10:00.000Z",
        "2020-01-07T00:10:00.000Z",
      ];
      expect(
        explode(
          { title: "Lord Of The Fries", cron: "10 0 * * 1-5" },
          { ...weekdayWindow, exclude, utc: true },
        ),
      ).toEqual([]);
    });
  });

  describe("exclude input forms", () => {
    it("removes excluded ISO strings from the returned array", () => {
      const data = {
        title: "Lord Of The Fries",
        cron: "10 0 * * 1-5",
      };
      const exclude = [
        "2020-01-02T00:10:00.000Z",
        "2020-01-03T00:10:00.000Z",
        "2020-01-06T00:10:00.000Z",
        "2020-01-07T00:10:00.000Z",
      ];
      expect(
        explode(data, { ...weekdayWindow, exclude, utc: true }),
      ).toEqual([
        { title: "Lord Of The Fries", cron: "2020-01-01T00:10:00.000Z" },
      ]);
    });

    it("still returns all dates when exclude entries do not match any occurrence", () => {
      const data = {
        title: "Lord Of The Fries",
        cron: "10 0 * * 1-5",
      };
      const exclude = [
        "2019-01-02T00:10:00.000Z",
        "2019-01-03T00:10:00.000Z",
        "2019-01-06T00:10:00.000Z",
        "2019-01-07T00:10:00.000Z",
      ];
      expect(
        explode(data, { ...weekdayWindow, exclude, utc: true }),
      ).toEqual([
        { title: "Lord Of The Fries", cron: "2020-01-01T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-02T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-03T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-06T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-07T00:10:00.000Z" },
      ]);
    });

    it("skips occurrences when exclude entries are Date objects", () => {
      expect(
        explode(
          { cron: "10 0 * * 1-5" },
          {
            ...weekdayWindow,
            utc: true,
            exclude: [new Date("2020-01-01T00:10:00.000Z")],
          },
        ),
      ).toEqual([
        { cron: "2020-01-02T00:10:00.000Z" },
        { cron: "2020-01-03T00:10:00.000Z" },
        { cron: "2020-01-06T00:10:00.000Z" },
        { cron: "2020-01-07T00:10:00.000Z" },
      ]);
    });

    it("skips occurrences when exclude mixes Date objects and ISO strings", () => {
      expect(
        explode(
          { cron: "10 0 * * 1-5" },
          {
            ...weekdayWindow,
            utc: true,
            exclude: [
              new Date("2020-01-01T00:10:00.000Z"),
              "2020-01-02T00:10:00.000Z",
            ],
          },
        ),
      ).toEqual([
        { cron: "2020-01-03T00:10:00.000Z" },
        { cron: "2020-01-06T00:10:00.000Z" },
        { cron: "2020-01-07T00:10:00.000Z" },
      ]);
    });

    it("does not skip when an exclude Date differs by a millisecond", () => {
      expect(
        explode(
          { cron: "10 0 * * 1-5" },
          {
            start: new Date("2020-01-01T00:00:00.000Z"),
            end: new Date("2020-01-03T00:00:00.000Z"),
            utc: true,
            exclude: [new Date("2020-01-01T00:10:00.001Z")],
          },
        ),
      ).toEqual([
        { cron: "2020-01-01T00:10:00.000Z" },
        { cron: "2020-01-02T00:10:00.000Z" },
      ]);
    });
  });

  describe("heterogeneous event arrays", () => {
    it("expands events with different crons and concatenates in input order", () => {
      expect(
        explode(
          [
            { title: "a", cron: "0 0 * * 1" },
            { title: "b", cron: "0 12 * * 3" },
          ],
          {
            start: new Date("2020-01-01T00:00:00.000Z"),
            end: new Date("2020-01-09T00:00:00.000Z"),
            utc: true,
          },
        ),
      ).toEqual([
        { title: "a", cron: "2020-01-06T00:00:00.000Z" },
        { title: "b", cron: "2020-01-01T12:00:00.000Z" },
        { title: "b", cron: "2020-01-08T12:00:00.000Z" },
      ]);
    });

    it("expands events with different frequencies without interleaving by date", () => {
      // Daily fires every day; weekly only Monday. Output is all of daily
      // first, then weekly — not merged chronologically.
      expect(
        explode(
          [
            { title: "daily", cron: "30 0 * * *" },
            { title: "weekly", cron: "30 0 * * 1" },
          ],
          {
            start: new Date("2020-01-01T00:00:00.000Z"),
            end: new Date("2020-01-08T00:00:00.000Z"),
            utc: true,
          },
        ),
      ).toEqual([
        { title: "daily", cron: "2020-01-01T00:30:00.000Z" },
        { title: "daily", cron: "2020-01-02T00:30:00.000Z" },
        { title: "daily", cron: "2020-01-03T00:30:00.000Z" },
        { title: "daily", cron: "2020-01-04T00:30:00.000Z" },
        { title: "daily", cron: "2020-01-05T00:30:00.000Z" },
        { title: "daily", cron: "2020-01-06T00:30:00.000Z" },
        { title: "daily", cron: "2020-01-07T00:30:00.000Z" },
        { title: "weekly", cron: "2020-01-06T00:30:00.000Z" },
      ]);
    });

    it("throws if a later event in the array is missing the crontab field", () => {
      expect(() => {
        explode(
          [{ cron: "10 0 * * 1-5" }, { title: "missing cron" }],
          { ...weekdayWindow, utc: true },
        );
      }).toThrow(ReferenceError);
    });
  });

  describe("field preservation", () => {
    it("copies multiple extra fields onto every occurrence unchanged", () => {
      const data = {
        title: "Lord Of The Fries",
        duration: 12,
        location: "Sydney",
        cron: "10 0 * * 1",
      };
      expect(
        explode(data, { ...weekdayWindow, utc: true }),
      ).toEqual([
        {
          title: "Lord Of The Fries",
          duration: 12,
          location: "Sydney",
          cron: "2020-01-06T00:10:00.000Z",
        },
      ]);
    });

    it("does not invent fields that were not on the input object", () => {
      const [row] = explode(
        { cron: "10 0 * * 1" },
        { ...weekdayWindow, utc: true },
      );
      expect(Object.keys(row).sort()).toEqual(["cron"]);
    });
  });

  describe("richer cron expressions", () => {
    it("expands a monthly schedule (e.g. 0 0 1 * *)", () => {
      // Start is exactly 2020-01-01T00:00:00Z, which matches but is skipped
      // (iteration starts after currentDate).
      expect(
        explode(
          { title: "x", cron: "0 0 1 * *" },
          {
            start: new Date("2020-01-01T00:00:00.000Z"),
            end: new Date("2020-04-01T00:00:00.000Z"),
            utc: true,
          },
        ),
      ).toEqual([
        { title: "x", cron: "2020-02-01T00:00:00.000Z" },
        { title: "x", cron: "2020-03-01T00:00:00.000Z" },
        { title: "x", cron: "2020-04-01T00:00:00.000Z" },
      ]);
    });

    it("expands a step schedule (e.g. */15 * * * *) over a short window", () => {
      expect(
        explode(
          { cron: "*/15 * * * *" },
          {
            start: new Date("2020-01-01T00:00:00.000Z"),
            end: new Date("2020-01-01T01:00:00.000Z"),
            utc: true,
          },
        ),
      ).toEqual([
        { cron: "2020-01-01T00:15:00.000Z" },
        { cron: "2020-01-01T00:30:00.000Z" },
        { cron: "2020-01-01T00:45:00.000Z" },
        { cron: "2020-01-01T01:00:00.000Z" },
      ]);
    });

    it("expands a day-of-month expression correctly across month boundaries", () => {
      // Feb 2020 has no 31st; Mar does.
      expect(
        explode(
          { cron: "0 0 31 * *" },
          {
            start: new Date("2020-01-01T00:00:00.000Z"),
            end: new Date("2020-04-01T00:00:00.000Z"),
            utc: true,
          },
        ),
      ).toEqual([
        { cron: "2020-01-31T00:00:00.000Z" },
        { cron: "2020-03-31T00:00:00.000Z" },
      ]);
    });
  });

  describe("defaults and options", () => {
    it("uses field 'cron' when options.field is omitted", () => {
      expect(
        explode(
          { cron: "10 0 * * 1" },
          { ...weekdayWindow, utc: true },
        ),
      ).toEqual([{ cron: "2020-01-06T00:10:00.000Z" }]);
    });

    it("treats a missing exclude as no exclusions", () => {
      expect(
        explode(
          { title: "Lord Of The Fries", cron: "10 0 * * 1-5" },
          { ...weekdayWindow, utc: true },
        ),
      ).toEqual([
        { title: "Lord Of The Fries", cron: "2020-01-01T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-02T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-03T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-06T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-07T00:10:00.000Z" },
      ]);
    });

    it("evaluates in local time when utc is false (TZ-pinned)", () => {
      const previousTz = process.env.TZ;
      process.env.TZ = "Australia/Sydney";
      try {
        expect(
          explode(
            { cron: "10 0 * * 1-5" },
            { ...weekdayWindow, utc: false },
          ),
        ).toEqual([
          { cron: "2020-01-01T13:10:00.000Z" },
          { cron: "2020-01-02T13:10:00.000Z" },
          { cron: "2020-01-05T13:10:00.000Z" },
          { cron: "2020-01-06T13:10:00.000Z" },
          { cron: "2020-01-07T13:10:00.000Z" },
        ]);
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
