import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CommentItem } from "../../src/entities/comment/ui/CommentItem.jsx";

describe("Comment Item", () => {
  const comment = {
    comment_id: 41,
    nickname: "댓글 작성자",
    profile_image: "/images/profile-default.svg",
    comment: "댓글 본문",
  };

  it("Figma 순서로 작성자와 본문을 렌더링한다", () => {
    const html = renderToStaticMarkup(createElement(CommentItem, { comment }));
    expect(html.indexOf("댓글 작성자")).toBeLessThan(html.indexOf("댓글 본문"));
    expect(html).toContain("comment-item__header");
    expect(html).not.toContain('aria-label="댓글 옵션"');
  });

  it("본인 댓글에만 실제 More SVG Option Trigger를 제공한다", () => {
    const html = renderToStaticMarkup(
      createElement(CommentItem, { comment, owned: true }),
    );
    expect(html).toContain('aria-label="댓글 옵션"');
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toMatch(/more-dots|data:image\/svg\+xml/);
  });

  it("열린 상태에서 공통 Option Menu를 조합한다", () => {
    const html = renderToStaticMarkup(
      createElement(CommentItem, { comment, owned: true, optionsOpen: true }),
    );
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('role="menu"');
    expect(html).toContain("수정하기");
    expect(html).toContain("삭제하기");
  });
});
