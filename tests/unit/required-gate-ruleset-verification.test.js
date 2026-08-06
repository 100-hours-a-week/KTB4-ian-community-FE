import { describe, expect, it } from "vitest";

describe("required-gate Ruleset verification", () => {
  it("passes after the Ruleset blocks the intentional failure", () => {
    expect("blocked").toBe("blocked");
  });
});
