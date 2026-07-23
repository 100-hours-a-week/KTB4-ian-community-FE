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
      "수정하기",
      "삭제하기",
    ]);
    expect(container.querySelectorAll("img")).toHaveLength(3);
    expect(items[0]).toBe(document.activeElement);
  });

  it("Action은 한 번 실행하고 Menu를 닫는다", async () => {
    const callbacks = await renderMenu();
    await act(() =>
      fireEvent.click(getByRole(container, "menuitem", { name: "수정하기" })),
    );
    expect(callbacks.onEdit).toHaveBeenCalledTimes(1);
    expect(callbacks.onDelete).not.toHaveBeenCalled();
    expect(callbacks.onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape는 닫고 Trigger Focus를 복원한다", async () => {
    const callbacks = await renderMenu();
    await act(() => fireEvent.keyDown(document, { key: "Escape" }));
    expect(callbacks.onClose).toHaveBeenCalledTimes(1);
    expect(callbacks.triggerRef.current).toBe(document.activeElement);
  });
});
