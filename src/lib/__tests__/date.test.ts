import { describe, it, expect } from "vitest";
import { hoursUntil, addDays, todayIsoDate } from "../date";

describe("date helpers", () => {
  it("hoursUntil calculates correct positive hours for future date", () => {
    const base = new Date("2026-08-15T12:00:00Z");
    const target = "2026-08-15T16:00:00Z";
    expect(hoursUntil(target, base)).toBe(4);
  });

  it("hoursUntil calculates negative hours for past date", () => {
    const base = new Date("2026-08-15T12:00:00Z");
    const target = "2026-08-15T08:00:00Z";
    expect(hoursUntil(target, base)).toBe(-4);
  });

  it("addDays correctly formats YYYY-MM-DD after adding days", () => {
    expect(addDays("2026-08-01", 30)).toBe("2026-08-31");
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
  });

  it("todayIsoDate formats YYYY-MM-DD", () => {
    const mock = new Date("2026-08-13T10:30:00Z");
    expect(todayIsoDate(mock)).toBe("2026-08-13");
  });
});
