import { describe, expect, it } from "vitest";
import {
  bookmarkIcon,
  heartFillIcon,
  heartStrokeIcon,
} from "../../src/shared/assets/index.js";

describe("React 아이콘 자산", () => {
  const isSvgAsset = (value) =>
    value.startsWith("data:image/svg+xml") || value.endsWith(".svg");

  it("좋아요 상태별 SVG를 사용한다", () => {
    expect(isSvgAsset(heartStrokeIcon)).toBe(true);
    expect(isSvgAsset(heartFillIcon)).toBe(true);
    expect(heartStrokeIcon).not.toBe(heartFillIcon);
  });

  it("북마크는 저장 없는 stroke SVG만 사용한다", () => {
    expect(isSvgAsset(bookmarkIcon)).toBe(true);
  });
});
