import { describe, expect, it } from "vitest";
import { sortPostsByLatest } from "../../src/entities/post/model/sortPostsByLatest.js";

describe("피드 최신순 정렬", () => {
  it("createdAt과 postId를 기준으로 최신순 정렬한다", () => {
    const posts = [
      {
        postId: 1,
        createdAt: "2026-07-29T00:00:00Z",
      },
      {
        postId: 3,
        createdAt: "2026-07-29T01:00:00Z",
      },
      {
        postId: 2,
        createdAt: "2026-07-29T01:00:00Z",
      },
    ];

    const result = sortPostsByLatest(posts);

    expect(
      result.map((post) => post.postId),
    ).toEqual([3, 2, 1]);

    expect(
      posts.map((post) => post.postId),
    ).toEqual([1, 3, 2]);
  });
});