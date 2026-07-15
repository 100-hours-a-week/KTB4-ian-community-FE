import { fireEvent, getByRole } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createFeedCard,
  sortPostsByLatest,
} from "../../scripts/components/feed-card.js";
import { mountLnb } from "../../scripts/components/lnb.js";
import { BookmarkStore } from "../../scripts/stores/bookmark-store.js";

describe("피드 페이지 통합", () => {
  beforeEach(() => {
    document.body.innerHTML = `<aside data-app-lnb></aside><main></main>`;
    localStorage.clear();
  });
  it("선택 LNB와 피드 카드 액션을 함께 렌더링한다", async () => {
    const onLike = vi.fn().mockResolvedValue({ liked: true });
    const store = new BookmarkStore();
    mountLnb({ activeItem: "feed" });
    const card = createFeedCard(
      { postId: 1, content: "통합 피드", createdAt: new Date(), likeCount: 0 },
      { onLike, onBookmark: (post) => store.toggle(post) },
    );
    document.querySelector("main").append(card);
    expect(
      document.querySelector('[data-nav="feed"]').getAttribute("aria-current"),
    ).toBe("page");
    fireEvent.click(getByRole(card, "button", { name: "좋아요" }));
    await Promise.resolve();
    expect(onLike).toHaveBeenCalledOnce();
    fireEvent.click(getByRole(card, "button", { name: "북마크" }));
    expect(store.has(1)).toBe(true);
  });
  it("두 피드 작성 트리거가 같은 callback을 사용한다", () => {
    const open = vi.fn();
    mountLnb({ onCreateFeed: open });
    fireEvent.click(document.querySelector("[data-create-feed]"));
    expect(open).toHaveBeenCalledOnce();
  });
  it("북마크 기본 상태는 실제 stroke 아이콘을 사용한다", () => {
    const card = createFeedCard({
      postId: 2,
      content: "기본 북마크",
      createdAt: new Date(),
    });
    expect(
      card.querySelector("[data-bookmark]").getAttribute("aria-pressed"),
    ).toBe("false");
    const iconSource = decodeURIComponent(
      card.querySelector("[data-bookmark] img").src,
    );
    expect(iconSource).toContain("stroke='#171717'");
    expect(iconSource).not.toContain("fill='#171717'");
  });
  it("최신 피드부터 정렬한다", () => {
    const posts = sortPostsByLatest([
      { postId: 1, created_at: "2026-07-13T10:00:00Z" },
      { postId: 2, created_at: "2026-07-14T10:00:00Z" },
    ]);
    expect(posts.map((post) => post.postId)).toEqual([2, 1]);
  });
  it("액션이 아닌 카드 영역 클릭으로 상세를 연다", () => {
    const openDetail = vi.fn();
    const card = createFeedCard(
      { postId: 3, content: "전체 클릭", createdAt: new Date() },
      { onOpenDetail: openDetail },
    );
    fireEvent.click(card.querySelector(".feed-card__author"));
    expect(openDetail).toHaveBeenCalledOnce();
    fireEvent.click(card.querySelector("[data-bookmark]"));
    expect(openDetail).toHaveBeenCalledOnce();
  });
  it("LNB는 선택 항목만 fill 아이콘으로 표시한다", () => {
    mountLnb({ activeItem: "bookmarks" });
    const selectedBookmark = decodeURIComponent(
      document.querySelector('[data-nav="bookmarks"] img').src,
    );
    const inactiveHome = decodeURIComponent(
      document.querySelector('[data-nav="feed"] img').src,
    );
    const inactiveProfile = decodeURIComponent(
      document.querySelector('[data-nav="profile"] img').src,
    );
    expect(selectedBookmark).toContain("fill='#171717'");
    expect(inactiveHome).not.toContain("fill='#171717'");
    expect(inactiveProfile).not.toContain("fill='#171717'");
  });
});
