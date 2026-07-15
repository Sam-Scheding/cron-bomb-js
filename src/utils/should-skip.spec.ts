import { shouldSkip } from "./should-skip";
import { toExcludedTimes } from "./to-excluded-times";

describe("shouldSkip()", () => {
  it("returns false when nothing is excluded", () => {
    expect(shouldSkip(new Date("2020-01-03T00:10:00.000Z"), new Set())).toBe(
      false,
    );
  });

  it("returns true when current matches an excluded instant", () => {
    const current = new Date("2020-01-03T00:10:00.000Z");
    const excluded = toExcludedTimes([current]);
    expect(shouldSkip(current, excluded)).toBe(true);
  });

  it("returns true when current matches an ISO-derived excluded instant", () => {
    const iso = "2020-01-03T00:10:00.000Z";
    const excluded = toExcludedTimes([iso]);
    expect(shouldSkip(new Date(iso), excluded)).toBe(true);
  });

  it("returns false when current is not in the excluded set", () => {
    const excluded = toExcludedTimes(["2020-01-02T00:10:00.000Z"]);
    expect(shouldSkip(new Date("2020-01-03T00:10:00.000Z"), excluded)).toBe(
      false,
    );
  });

  it("returns false when current differs by a millisecond", () => {
    const excluded = toExcludedTimes(["2020-01-03T00:10:00.000Z"]);
    expect(shouldSkip(new Date("2020-01-03T00:10:00.001Z"), excluded)).toBe(
      false,
    );
  });
});
