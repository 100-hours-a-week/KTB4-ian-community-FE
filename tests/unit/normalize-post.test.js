import { describe, expect, it } from "vitest";
import { normalizePost } from "../../src/entities/post/model/normalizePost.js";

describe("게시물 작성자 여부 정규화", () => {
  it("서버의 owner 값을 화면 모델에 유지한다", () => {
    expect(
      normalizePost({
        user_id: 7,
        owner: true,
      }).owner,
    ).toBe(true);

    expect(
      normalizePost({
        user_id: 7,
        owner: false,
      }).owner,
    ).toBe(false);
  });

  it("이전 mine 응답도 호환한다", () => {
    expect(normalizePost({ mine: true }).owner).toBe(true);
  });
});
