import { isBetween, next, previous } from "./index";

describe("previous()", () => {
  it("returns the latest occurrence before `at`", () => {
    expect(
      previous("0 9 * * 1-5", { at: new Date("2020-01-03T12:00:00.000Z") }),
    ).toBe("2020-01-03T09:00:00.000Z");
  });

  it("is strictly before `at`", () => {
    expect(
      previous("0 9 * * *", { at: new Date("2020-01-03T09:00:00.000Z") }),
    ).toBe("2020-01-02T09:00:00.000Z");
  });

  it("skips weekends", () => {
    expect(
      previous("0 9 * * 1-5", { at: new Date("2020-01-06T08:00:00.000Z") }),
    ).toBe("2020-01-03T09:00:00.000Z");
  });

  it("evaluates in the given timezone", () => {
    // 09:00 Sydney (UTC+11 in January) is 22:00Z the previous day
    expect(
      previous("0 9 * * *", {
        at: new Date("2020-01-03T12:00:00.000Z"),
        tz: "Australia/Sydney",
      }),
    ).toBe("2020-01-02T22:00:00.000Z");
  });

  it("defaults `at` to now", () => {
    const before = Date.now();
    const result = new Date(previous("* * * * *")).getTime();
    expect(result).toBeLessThanOrEqual(before);
    expect(result).toBeGreaterThan(before - 61_000);
  });

  it("throws on an invalid crontab", () => {
    expect(() => previous("not a cron")).toThrow();
  });
});

describe("next()", () => {
  it("returns the earliest occurrence after `at`", () => {
    expect(
      next("0 9 * * 1-5", { at: new Date("2020-01-03T12:00:00.000Z") }),
    ).toBe("2020-01-06T09:00:00.000Z");
  });

  it("is strictly after `at`", () => {
    expect(
      next("0 9 * * *", { at: new Date("2020-01-03T09:00:00.000Z") }),
    ).toBe("2020-01-04T09:00:00.000Z");
  });

  it("evaluates in the given timezone", () => {
    expect(
      next("0 9 * * *", {
        at: new Date("2020-01-03T12:00:00.000Z"),
        tz: "Australia/Sydney",
      }),
    ).toBe("2020-01-03T22:00:00.000Z");
  });

  it("defaults `at` to now", () => {
    const before = Date.now();
    const result = new Date(next("* * * * *")).getTime();
    expect(result).toBeGreaterThan(before);
    expect(result).toBeLessThanOrEqual(before + 61_000);
  });

  it("throws on an invalid crontab", () => {
    expect(() => next("not a cron")).toThrow();
  });
});

describe("isBetween()", () => {
  const hours = { from: "0 9 * * 1-5", to: "0 17 * * 1-5" };
  const at = (iso: string) => ({ at: new Date(iso) });

  it("is true between from and to", () => {
    expect(isBetween(hours, at("2020-01-01T12:00:00.000Z"))).toBe(true);
  });

  it("is false before from and after to", () => {
    expect(isBetween(hours, at("2020-01-01T08:00:00.000Z"))).toBe(false);
    expect(isBetween(hours, at("2020-01-01T18:00:00.000Z"))).toBe(false);
  });

  it("is false on a weekend", () => {
    expect(isBetween(hours, at("2020-01-04T12:00:00.000Z"))).toBe(false);
  });

  it("is inclusive of from and exclusive of to", () => {
    expect(isBetween(hours, at("2020-01-01T09:00:00.000Z"))).toBe(true);
    expect(isBetween(hours, at("2020-01-01T08:59:59.999Z"))).toBe(false);
    expect(isBetween(hours, at("2020-01-01T09:00:00.500Z"))).toBe(true);
    expect(isBetween(hours, at("2020-01-01T17:00:00.000Z"))).toBe(false);
    expect(isBetween(hours, at("2020-01-01T16:59:59.999Z"))).toBe(true);
  });

  it("supports windows that cross midnight", () => {
    const night = { from: "0 22 * * *", to: "0 6 * * *" };
    expect(isBetween(night, at("2020-01-01T23:00:00.000Z"))).toBe(true);
    expect(isBetween(night, at("2020-01-02T03:00:00.000Z"))).toBe(true);
    expect(isBetween(night, at("2020-01-02T12:00:00.000Z"))).toBe(false);
  });

  it("supports windows that span multiple days", () => {
    const weekend = { from: "0 18 * * 5", to: "0 8 * * 1" };
    expect(isBetween(weekend, at("2020-01-04T12:00:00.000Z"))).toBe(true);
    expect(isBetween(weekend, at("2020-01-06T12:00:00.000Z"))).toBe(false);
  });

  it("lets `to` win when both fire on the same instant", () => {
    const same = { from: "0 9 * * *", to: "0 9 * * *" };
    expect(isBetween(same, at("2020-01-01T09:00:00.000Z"))).toBe(false);
    expect(isBetween(same, at("2020-01-01T12:00:00.000Z"))).toBe(false);
  });

  it("evaluates in the given timezone", () => {
    // 12:00Z is 23:00 in Sydney: after close at 17:00 local
    expect(
      isBetween(hours, {
        ...at("2020-01-01T12:00:00.000Z"),
        tz: "Australia/Sydney",
      }),
    ).toBe(false);
    // 03:00Z is 14:00 in Sydney: open
    expect(
      isBetween(hours, {
        ...at("2020-01-01T03:00:00.000Z"),
        tz: "Australia/Sydney",
      }),
    ).toBe(true);
  });

  it("defaults `at` to now", () => {
    expect(isBetween({ from: "* * * * *", to: "0 0 29 2 *" })).toBe(true);
  });

  it("throws on an invalid crontab", () => {
    expect(() => isBetween({ from: "nope", to: "0 17 * * *" })).toThrow();
    expect(() => isBetween({ from: "0 9 * * *", to: "nope" })).toThrow();
  });
});
