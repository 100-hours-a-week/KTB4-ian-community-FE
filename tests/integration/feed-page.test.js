import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { normalizePost } from "../../src/entities/post/model/normalizePost.js";
import { PostCard } from "../../src/entities/post/ui/PostCard.jsx";
import { BookmarksPage } from "../../src/pages/bookmarks/BookmarksPage.jsx";
import { FeedPageSkeleton } from "../../src/pages/feed/FeedPageSkeleton.jsx";
import { CommunityLnb } from "../../src/app/layouts/CommunityLnb.jsx";

describe("React 피드 화면 통합", () => {
  const post = normalizePost({
    post_id: 1,
    content: "통합 피드",
    nickname: "사용자",
    like_count: 3,
  });

  it("Entity 카드의 좋아요와 댓글 정보를 함께 렌더링한다", () => {
    const html = renderToStaticMarkup(createElement(PostCard, { post }));
    expect(html).toContain("통합 피드");
    expect(html).toContain('aria-label="좋아요"');
    expect(html).toContain("3");
  });

  it("북마크 Action은 disabled이고 저장 상태를 갖지 않는다", () => {
    const html = renderToStaticMarkup(createElement(PostCard, { post }));
    const bookmark = html.match(/<button[^>]*aria-label="북마크"[^>]*>/)?.[0];
    expect(bookmark).toContain("disabled");
    expect(bookmark).not.toContain("aria-pressed");
  });

  it("북마크 Page는 Coming Soon 문구만 제공한다", () => {
    const html = renderToStaticMarkup(createElement(BookmarksPage));
    expect(html).toContain("북마크 기능을 준비하고 있어요.");
    expect(html).toContain("곧 원하는 피드를 저장하고 다시 확인할 수 있어요.");
  });

  it("Feed Skeleton은 실제 Avatar 34px 구조와 대응한다", () => {
    const html = renderToStaticMarkup(createElement(FeedPageSkeleton));
    expect(html).toContain('data-testid="feed-skeleton"');
    expect(html).toContain("width:34px");
  });

  it("Feed Skeleton은 Figma Page Header와 작성 진입 영역을 보존한다", () => {
    const html = renderToStaticMarkup(createElement(FeedPageSkeleton));
    expect(html).toContain("feed-page__intro");
    expect(html).toContain("create-trigger");
    expect(html).toContain("width:99px");
    expect(html).toContain("height:34px");
  });

  it("보호 Page Shell의 LNB는 Route·Modal Trigger·사용자 영역을 조합한다", () => {
    const html = renderToStaticMarkup(
      createElement(CommunityLnb, {
        routeName: "feed",
        user: {
          userId: 7,
          nickname: "사용자",
          profileImage: "/images/profile-default.svg",
        },
        createOpen: false,
        profileOpen: false,
        passwordOpen: false,
      }),
    );
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain("새로운 피드 작성");
    expect(html).toContain("회원정보");
    expect(html).toContain("로그아웃");
    expect(html).toContain(".svg");
  });
});
