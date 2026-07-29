import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PostDetailPage } from "../../src/pages/post-detail/PostDetailPage.jsx";

describe("Post Detail 초기 로딩", () => {
  it("post가 null인 첫 렌더에서 작성자 속성을 읽지 않고 로딩 UI를 표시한다", () => {
    const html = renderToStaticMarkup(
      createElement(PostDetailPage, {
        postId: 1,
        user: { userId: 7, nickname: "현재 사용자" },
        onNavigate() {},
      }),
    );

    expect(html).toContain("피드를 불러오는 중입니다.");
    expect(html).toContain('aria-busy="true"');
  });
});
