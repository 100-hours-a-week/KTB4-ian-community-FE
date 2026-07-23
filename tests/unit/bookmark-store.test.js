import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { normalizePost } from "../../src/entities/post/model/normalizePost.js";
import { PostCard } from "../../src/entities/post/ui/PostCard.jsx";

describe("북마크 범위", () => {
  it("피드의 북마크는 저장 기능 없이 disabled 상태다", () => {
    localStorage.clear();
    const html = renderToStaticMarkup(
      createElement(PostCard, {
        post: normalizePost({ post_id: 7, content: "hello" }),
      }),
    );
    expect(html).toContain('aria-label="북마크"');
    expect(html).toContain("disabled");
    expect(localStorage.length).toBe(0);
  });
});
