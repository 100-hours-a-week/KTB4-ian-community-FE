import { describe, expect, it } from "vitest";

describe("required-gate Ruleset verification", () => {
  it("deliberately fails while merge blocking is verified", () => {
    expect("blocked").toBe("mergeable");
  });
});
