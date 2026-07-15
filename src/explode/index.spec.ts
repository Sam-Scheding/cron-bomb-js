import { explode } from "./index";

describe("explode()", () => {
  describe("input shapes", () => {
    it("accepts data as a single object", () => {
      const start = new Date("01 January 2020 00:00 UTC");
      const end = new Date("08 January 2020 00:00 UTC");
      const data = {
        title: "Lord Of The Fries",
        cron: "10 0 * * 1-5", // Every weekday at 11am
      };
      const expected = [
        { title: "Lord Of The Fries", cron: "2020-01-01T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-02T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-03T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-06T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-07T00:10:00.000Z" },
      ];
      const received = explode(data, { start, end, utc: true });
      expect(received).toEqual(expected);
    });

    it("accepts data as an array of objects", () => {
      const start = new Date("01 January 2020 00:00 UTC");
      const end = new Date("08 January 2020 00:00 UTC");
      const data = [
        {
          title: "Lord Of The Fries",
          cron: "10 0 * * 1-5", // Every weekday at 11am
        },
        {
          title: "Shift Eatery",
          cron: "10 0 * * 1-5", // Every weekday at 11am
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
      const received = explode(data, { start, end, utc: true });
      expect(received).toEqual(expected);
    });
  });

  describe("errors", () => {
    it("fails if the data object doesn't have a 'cron' field", () => {
      const data = {
        nocronfield: "1 1 * * 0",
      };
      expect(() => {
        explode(data, {});
      }).toThrow(ReferenceError);
    });

    it("fails if the the cron field isn't valid cron syntax", () => {
      const start = new Date("01 January 2020 00:00 UTC");
      const end = new Date("08 January 2020 00:00 UTC");
      const data = {
        title: "Lord Of The Fries",
        cron: "8", // crontabs expect the first entry to be a number from 0-7
      };

      // Technically, this should throw a RangeError, but the error is thrown by
      // the cronparser library, not cronbomb, so I don't have much control over
      // it.
      expect(() => {
        explode(data, { start, end });
      }).toThrow(Error);
    });
  });

  describe("range boundaries", () => {
    it("fails if start is later than end", () => {
      const start = new Date("08 January 2020 00:00 UTC");
      const end = new Date("01 January 2020 00:00 UTC");
      const data = {
        title: "Lord Of The Fries",
        cron: "10 0 * * 1-5", // Every weekday at 11am
      };

      expect(() => {
        explode(data, { start, end });
      }).toThrow(RangeError);
    });

    it.todo("includes an occurrence that falls exactly on start");
    it.todo("includes an occurrence that falls exactly on end");
    it.todo("excludes occurrences strictly before start");
    it.todo("excludes occurrences strictly after end");
    it.todo("returns at most one occurrence when start === end and it matches");
    it.todo("returns empty when start === end and it does not match");
  });

  describe("empty and no-hit windows", () => {
    it.todo("returns an empty array when data is an empty array");
    it.todo("returns an empty array when the cron never fires in the range");
    it.todo("returns an empty array when every occurrence is excluded");
  });

  describe("exclude input forms", () => {
    it("removes excluded dates from the returned array", () => {
      const start = new Date("01 January 2020 00:00 UTC");
      const end = new Date("08 January 2020 00:00 UTC");
      const data = {
        title: "Lord Of The Fries",
        cron: "10 0 * * 1-5", // Every weekday at 11am
      };
      const exclude = [
        "2020-01-02T00:10:00.000Z",
        "2020-01-03T00:10:00.000Z",
        "2020-01-06T00:10:00.000Z",
        "2020-01-07T00:10:00.000Z",
      ];
      const expected = [
        { title: "Lord Of The Fries", cron: "2020-01-01T00:10:00.000Z" },
      ];
      const received = explode(data, { start, end, exclude, utc: true });
      expect(received).toEqual(expected);
    });

    it("still works if exluded dates do not exist in output", () => {
      const start = new Date("01 January 2020 00:00 UTC");
      const end = new Date("08 January 2020 00:00 UTC");
      const data = {
        title: "Lord Of The Fries",
        cron: "10 0 * * 1-5", // Every weekday at 11am
      };
      const exclude = [
        "2019-01-02T00:10:00.000Z", // Wrong year
        "2019-01-03T00:10:00.000Z",
        "2019-01-06T00:10:00.000Z",
        "2019-01-07T00:10:00.000Z",
      ];
      const expected = [
        { title: "Lord Of The Fries", cron: "2020-01-01T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-02T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-03T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-06T00:10:00.000Z" },
        { title: "Lord Of The Fries", cron: "2020-01-07T00:10:00.000Z" },
      ];
      const received = explode(data, { start, end, exclude, utc: true });
      expect(received).toEqual(expected);
    });

    it.todo("skips occurrences when exclude entries are Date objects");
    it.todo("skips occurrences when exclude mixes Date objects and ISO strings");
    it.todo(
      "does not skip when an exclude Date is the same calendar instant but wrong ms",
    );
  });

  describe("heterogeneous event arrays", () => {
    it.todo(
      "expands events with different crons and concatenates in input order",
    );
    it.todo(
      "expands events with different frequencies without interleaving by date",
    );
    it.todo("throws if a later event in the array is missing the crontab field");
  });

  describe("field preservation", () => {
    it.todo("copies multiple extra fields onto every occurrence unchanged");
    it.todo("does not invent fields that were not on the input object");
  });

  describe("richer cron expressions", () => {
    it.todo("expands a monthly schedule (e.g. 0 0 1 * *)");
    it.todo("expands a step schedule (e.g. */15 * * * *) over a short window");
    it.todo(
      "expands a day-of-month expression correctly across month boundaries",
    );
  });

  describe("defaults and options", () => {
    it("checks the correct field if $field is passed in", () => {
      const start = new Date("01 January 2020 00:00 UTC");
      const end = new Date("08 January 2020 00:00 UTC");
      const field = "blah" as const;
      const data = {
        title: "Lord Of The Fries",
        [field]: "10 0 * * 1-5", // Every weekday at 11am
      };

      const expected = [
        { title: "Lord Of The Fries", [field]: "2020-01-01T00:10:00.000Z" },
        { title: "Lord Of The Fries", [field]: "2020-01-02T00:10:00.000Z" },
        { title: "Lord Of The Fries", [field]: "2020-01-03T00:10:00.000Z" },
        { title: "Lord Of The Fries", [field]: "2020-01-06T00:10:00.000Z" },
        { title: "Lord Of The Fries", [field]: "2020-01-07T00:10:00.000Z" },
      ];
      const received = explode(data, { start, end, field, utc: true });
      expect(received).toEqual(expected);
    });

    it.todo("uses field 'cron' when options.field is omitted");
    it.todo("treats a missing exclude as no exclusions");
    // Local TZ is environment-dependent; pin TZ= in the test runner if asserted.
    it.todo("evaluates in local time when utc is false (TZ-pinned)");
  });
});
