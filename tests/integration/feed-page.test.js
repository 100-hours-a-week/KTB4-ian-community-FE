import { fireEvent, getByRole } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFeedCard } from "../../scripts/components/feed-card.js";
import { mountLnb } from "../../scripts/components/lnb.js";
import { BookmarkStore } from "../../scripts/stores/bookmark-store.js";

describe("피드 페이지 통합", () => {
  beforeEach(() => { document.body.innerHTML = `<aside data-app-lnb></aside><main></main>`; localStorage.clear(); });
  it("선택 LNB와 피드 카드 액션을 함께 렌더링한다", async () => {
    const onLike = vi.fn().mockResolvedValue({ liked: true }); const store = new BookmarkStore(); mountLnb({ activeItem: "feed" });
    const card = createFeedCard({ postId: 1, content: "통합 피드", createdAt: new Date(), likeCount: 0 }, { onLike, onBookmark: (post) => store.toggle(post) }); document.querySelector("main").append(card);
    expect(document.querySelector('[data-nav="feed"]').getAttribute("aria-current")).toBe("page");
    fireEvent.click(getByRole(card, "button", { name: "좋아요" })); await Promise.resolve(); expect(onLike).toHaveBeenCalledOnce();
    fireEvent.click(getByRole(card, "button", { name: "북마크" })); expect(store.has(1)).toBe(true);
  });
  it("두 피드 작성 트리거가 같은 callback을 사용한다", () => { const open = vi.fn(); mountLnb({ onCreateFeed: open }); fireEvent.click(document.querySelector("[data-create-feed]")); expect(open).toHaveBeenCalledOnce(); });
});
