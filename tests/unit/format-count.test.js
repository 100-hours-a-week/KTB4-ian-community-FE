import { describe, expect, it } from "vitest";
import { formatCount } from "../../src/shared/lib/formatCount.js";

describe("피드 숫자 표기", () => {
  it("천 단위 미만과 천 단위를 쉼표로 표시한다", () => {
    expect(formatCount(342)).toBe("342");
    expect(formatCount(1240)).toBe("1,240");
  });

  it("만 단위는 Figma의 한 자리 소수 표기를 사용한다", () => {
    expect(formatCount(10_000)).toBe("1만");
    expect(formatCount(12_345)).toBe("1.2만");
    expect(formatCount(99_999)).toBe("9.9만");
  });

  it("잘못된 값과 음수는 0으로 안전하게 표시한다", () => {
    expect(formatCount(undefined)).toBe("0");
    expect(formatCount(-1)).toBe("0");
  });
});
