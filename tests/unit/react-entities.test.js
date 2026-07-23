import { describe, expect, it } from "vitest";
import { normalizePost } from "../../src/entities/post/model/normalizePost.js";

describe("React entity normalize", () => {
  it("snake_case 응답을 화면 모델로 정규화한다", () => {
    const source = {
      post_id: 3,
      profile_image: "/a.png",
      nickname: "ian",
      comment_count: 2,
    };
    const post = normalizePost(source);
    expect(post).toMatchObject({
      postId: 3,
      commentCount: 2,
      author: { nickname: "ian", profileImage: "/a.png" },
    });
    expect(source.author).toBeUndefined();
  });
});
