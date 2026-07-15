import { beforeEach, describe, expect, it } from "vitest";
import { LikeStore } from "../../scripts/stores/like-store.js";
import { isOwnedByUser } from "../../scripts/utils/ownership.js";

describe("LikeStore", () => {
  beforeEach(() => localStorage.clear());

  it("목록에서 저장한 좋아요 상태를 상세 응답에 병합한다", () => {
    const store = new LikeStore();
    store.set(12, true, 4);

    expect(
      store.merge({ post_id: 12, liked: false, like_count: 3 }),
    ).toMatchObject({ liked: true, likeCount: 4, like_count: 4 });
  });

  it("손상된 저장 데이터는 서버 상태를 유지한다", () => {
    localStorage.setItem("community.likes", "broken");
    expect(new LikeStore().merge({ postId: 1, liked: false })).toMatchObject({
      liked: false,
    });
  });
});

describe("소유권 판정", () => {
  it("사용자 ID를 우선하고 게시글 계약에 ID가 없으면 닉네임을 사용한다", () => {
    expect(isOwnedByUser({ user_id: 7 }, { userId: "7" })).toBe(true);
    expect(isOwnedByUser({ user_id: 8 }, { userId: "7" })).toBe(false);
    expect(
      isOwnedByUser({ nickname: "PULSE 사용자" }, { nickname: "PULSE 사용자" }),
    ).toBe(true);
  });
});
