import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "../../scripts/utils/date.js";

describe("formatRelativeTime", () => {
  const now = new Date("2026-07-14T12:00:00Z");
  it.each([
    [30, "방금 전"],
    [60, "1분 전"],
    [3600, "60분 전"],
    [86400, "24시간 전"],
  ])("%s초 경계를 표시한다", (seconds, expected) => {
    expect(formatRelativeTime(new Date(now - seconds * 1000), now)).toBe(
      expected,
    );
  });
  it.each([
    [3600, "60분 전"],
    [3660, "1시간 전"],
    [86400, "24시간 전"],
    [86460, "1일 전"],
    [30 * 86400, "30일 전"],
    [30 * 86400 + 1000, "1달 전"],
  ])("정확한 경계 %s초를 표시한다", (seconds, expected) =>
    expect(formatRelativeTime(new Date(now - seconds * 1000), now)).toBe(
      expected,
    ),
  );
  it.each([
    [0, "방금 전"],
    [59, "방금 전"],
    [59 * 60, "59분 전"],
    [23 * 3600, "23시간 전"],
    [29 * 86400, "29일 전"],
    [90 * 86400, "3달 전"],
  ])("필수 목록 %s초를 표시한다", (seconds, expected) =>
    expect(formatRelativeTime(new Date(now - seconds * 1000), now)).toBe(
      expected,
    ),
  );
  it("잘못된 날짜를 보정한다", () =>
    expect(formatRelativeTime("invalid", now)).toBe("알 수 없음"));
  it("미래 시각을 방금 전으로 보정한다", () =>
    expect(formatRelativeTime(new Date(now.getTime() + 60_000), now)).toBe(
      "방금 전",
    ));
});
