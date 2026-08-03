import { act, createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import { fireEvent, getByRole } from "@testing-library/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OptionMenu } from "../../src/shared/ui/OptionMenu.jsx";

describe("Option Menu", () => {
  let container;
  let root;

  beforeEach(() => {
    document.body.innerHTML =
      '<button id="trigger">옵션</button><div id="root"></div>';
    container = document.querySelector("#root");
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(() => root.unmount());
  });

  async function renderMenu(overrides = {}) {
    const triggerRef = createRef();
    triggerRef.current = document.querySelector("#trigger");
    const callbacks = {
      onBookmark: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
      onClose: vi.fn(),
      triggerRef,
      ...overrides,
    };
    await act(() => root.render(createElement(OptionMenu, callbacks)));
    return callbacks;
  }

  it("Figma 순서와 실제 SVG로 menuitem을 렌더링한다", async () => {
    await renderMenu();
    const items = [...container.querySelectorAll('[role="menuitem"]')];
    expect(items.map((item) => item.textContent)).toEqual([
      "저장하기",
      "수정하기",
      "삭제하기",
    ]);
    expect(container.querySelectorAll("img")).toHaveLength(4);
    expect(items[0]).toBe(document.activeElement);
  });

  it("Action은 한 번 실행하고 Menu를 닫는다", async () => {
    const callbacks = await renderMenu();
    await act(() =>
      fireEvent.click(getByRole(container, "menuitem", { name: "저장하기" })),
    );
    expect(callbacks.onBookmark).toHaveBeenCalledTimes(1);
    expect(callbacks.onEdit).not.toHaveBeenCalled();
    expect(callbacks.onDelete).not.toHaveBeenCalled();
    expect(callbacks.onClose).toHaveBeenCalledTimes(1);
    expect(callbacks.triggerRef.current).toBe(document.activeElement);
  });

  it("제공된 콜백에 해당하는 항목만 표시한다", async () => {
    await renderMenu({ onBookmark: undefined, onDelete: undefined });
    expect(container.textContent).toContain("수정하기");
    expect(container.textContent).not.toContain("삭제하기");

    await renderMenu({
      onBookmark: undefined,
      onEdit: undefined,
      onDelete: undefined,
    });
    expect(container.querySelectorAll('[role="menuitem"]')).toHaveLength(0);
  });

  it("Escape는 닫고 Trigger Focus를 복원한다", async () => {
    const callbacks = await renderMenu();
    await act(() => fireEvent.keyDown(document, { key: "Escape" }));
    expect(callbacks.onClose).toHaveBeenCalledTimes(1);
    expect(callbacks.triggerRef.current).toBe(document.activeElement);
  });
});
