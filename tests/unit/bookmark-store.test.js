import { describe, expect, it } from "vitest";
import { BookmarkStore } from "../../scripts/stores/bookmark-store.js";

describe("BookmarkStore", () => {
  it("피드를 토글하고 브라우저 저장소에서 복원한다", () => {
    const store = new BookmarkStore();
    expect(store.toggle({ postId: 7, content: "hello" })).toBe(true);
    expect(new BookmarkStore().has(7)).toBe(true);
    expect(store.toggle({ postId: 7 })).toBe(false);
  });
});
