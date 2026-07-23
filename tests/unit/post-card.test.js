import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { fireEvent, getByRole } from "@testing-library/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normalizePost } from "../../src/entities/post/model/normalizePost.js";
import { PostCard } from "../../src/entities/post/ui/PostCard.jsx";

describe("Feed Card", () => {
  let container;
  let root;

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    container = document.querySelector("#root");
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(() => root.unmount());
  });

  async function renderCard(overrides = {}, props = {}) {
    const post = normalizePost({
      post_id: 7,
      content: "선택 가능한 피드 본문",
      image_url: "/images/post.jpg",
      nickname: "작성자",
      view_count: 12_345,
      like_count: 12_345,
      comment_count: 1_240,
      created_at: "2026-07-23T12:00:00.000Z",
      ...overrides,
    });
    await act(() => root.render(createElement(PostCard, { post, ...props })));
    return post;
  }

  it("Figma 순서와 숫자 표기로 작성자·이미지·본문·Action을 렌더링한다", async () => {
    await renderCard();
    const body = container.querySelector(".post-card__body");
    expect([...body.children].map((node) => node.tagName)).toEqual([
      "HEADER",
      "IMG",
      "P",
    ]);
    expect(
      container.querySelector(".post-card__metadata").textContent,
    ).toContain("조회 1.2만");
    expect(getByRole(container, "button", { name: "좋아요" }).textContent).toBe(
      "1.2만",
    );
    expect(container.querySelector(".post-action-label").textContent).toBe(
      "1,240",
    );
  });

  it("첨부 이미지는 drag를 막되 카드 클릭과 본문 선택을 유지한다", async () => {
    const onOpen = vi.fn();
    await renderCard({}, { onOpen });
    const image = container.querySelector(".post-card__image");
    expect(image.draggable).toBe(false);
    expect(fireEvent.dragStart(image)).toBe(false);
    expect(container.querySelector(".post-card__content").textContent).toBe(
      "선택 가능한 피드 본문",
    );
    await act(() => fireEvent.click(image));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("이미지가 없으면 Preview DOM을 렌더링하지 않는다", async () => {
    await renderCard({ image_url: null });
    expect(container.querySelector(".post-card__image")).toBeNull();
  });

  it("소유자 Action은 공통 Option Menu Trigger로 제공한다", async () => {
    await renderCard({}, { onEdit: vi.fn(), onDelete: vi.fn() });
    const trigger = getByRole(container, "button", { name: "피드 옵션" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await act(() => fireEvent.click(trigger));
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(getByRole(container, "menu")).toBeTruthy();
    expect(container.textContent).toContain("수정하기");
    expect(container.textContent).toContain("삭제하기");
  });
});
