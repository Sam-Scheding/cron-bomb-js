import { toExcludedTimes } from "./to-excluded-times";

describe("toExcludedTimes()", () => {
  it("returns an empty set for an empty exclude list", () => {
    expect(toExcludedTimes([])).toEqual(new Set());
  });

  it("normalizes Date entries to epoch milliseconds", () => {
    const date = new Date("2020-01-03T00:10:00.000Z");
    expect(toExcludedTimes([date])).toEqual(new Set([date.getTime()]));
  });

  it("normalizes ISO strings to epoch milliseconds", () => {
    const iso = "2020-01-03T00:10:00.000Z";
    expect(toExcludedTimes([iso])).toEqual(new Set([new Date(iso).getTime()]));
  });

  it("treats an ISO string and Date for the same instant as one entry", () => {
    const iso = "2020-01-03T00:10:00.000Z";
    const date = new Date(iso);
    expect(toExcludedTimes([iso, date])).toEqual(new Set([date.getTime()]));
  });

  it("keeps distinct instants as separate entries", () => {
    expect(
      toExcludedTimes(["2020-01-02T00:10:00.000Z", "2020-01-03T00:10:00.000Z"]),
    ).toEqual(
      new Set([
        new Date("2020-01-02T00:10:00.000Z").getTime(),
        new Date("2020-01-03T00:10:00.000Z").getTime(),
      ]),
    );
  });
});
