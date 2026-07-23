import { describe, expect, it } from "vitest";
import { normalizePost } from "../../src/entities/post/model/normalizePost.js";
import { optimisticLike } from "../../src/features/post/like/togglePostLike.js";

describe("좋아요 Feature", () => {
  it("낙관 상태에서 선택과 수를 함께 갱신한다", () => {
    expect(optimisticLike({ liked: false, likeCount: 3 })).toMatchObject({
      liked: true,
      likeCount: 4,
    });
  });

  it("좋아요 수는 0 아래로 내려가지 않는다", () => {
    expect(optimisticLike({ liked: true, likeCount: 0 }).likeCount).toBe(0);
  });
});

describe("소유권 모델", () => {
  it("Backend mine 필드를 Normalize한다", () => {
    expect(normalizePost({ mine: true }).mine).toBe(true);
    expect(normalizePost({ mine: false }).mine).toBe(false);
  });
});
