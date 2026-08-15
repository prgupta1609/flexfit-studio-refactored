import { describe, it, expect } from "vitest";
import { isUnlimitedCredits, UNLIMITED_CREDITS } from "../membership";

describe("membership service helpers", () => {
  it("correctly identifies unlimited credit balances", () => {
    expect(isUnlimitedCredits(999)).toBe(true);
    expect(isUnlimitedCredits(1000)).toBe(true);
    expect(isUnlimitedCredits(UNLIMITED_CREDITS)).toBe(true);
    expect(isUnlimitedCredits(10)).toBe(false);
    expect(isUnlimitedCredits(0)).toBe(false);
  });
});
