import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { fireEvent } from "@testing-library/dom";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "../../src/shared/ui/Modal.jsx";

describe("React Modal", () => {
  it("초기에는 닫혀 있고 열린 뒤 첫 유효 요소와 ARIA를 연결한다", async () => {
    document.body.innerHTML =
      '<button id="open">열기</button><div id="root"></div>';
    const trigger = document.querySelector("#open");
    trigger.focus();
    const close = vi.fn();
    const root = createRoot(document.querySelector("#root"));
    await act(() =>
      root.render(createElement(Modal, { open: false, title: "확인" })),
    );
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    await act(() =>
      root.render(
        createElement(
          Modal,
          { open: true, title: "확인", onClose: close },
          createElement("button", { disabled: true }, "비활성"),
          createElement("button", null, "취소"),
        ),
      ),
    );
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(
      document.getElementById(dialog.getAttribute("aria-labelledby"))
        .textContent,
    ).toBe("확인");
    expect(document.activeElement.textContent).toBe("취소");
    expect(document.body.classList.contains("is-modal-open")).toBe(true);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).toHaveBeenCalledWith("escape");
    await act(() => root.render(createElement(Modal, { open: false })));
    await act(
      () => new Promise((resolve) => requestAnimationFrame(() => resolve())),
    );
    expect(document.activeElement).toBe(trigger);
    expect(document.body.classList.contains("is-modal-open")).toBe(false);
    await act(() => root.unmount());
  });

  it("Focus를 순환시키고 Backdrop 취소와 Event Listener 정리를 보장한다", async () => {
    document.body.innerHTML =
      '<button id="open">열기</button><div id="root"></div>';
    const close = vi.fn();
    const root = createRoot(document.querySelector("#root"));
    document.querySelector("#open").focus();
    await act(() =>
      root.render(
        createElement(
          Modal,
          { open: true, title: "편집", onClose: close },
          createElement("input", { "aria-label": "내용" }),
          createElement("button", null, "저장"),
        ),
      ),
    );
    const input = document.querySelector("input");
    const save = document.querySelector("[role=dialog] button");
    expect(document.activeElement).toBe(input);
    save.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(input);
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(save);
    fireEvent.mouseDown(document.querySelector(".modal"));
    expect(close).toHaveBeenCalledWith("backdrop");
    await act(() => root.unmount());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).toHaveBeenCalledTimes(1);
    expect(document.body.classList.contains("is-modal-open")).toBe(false);
  });

  it("Backdrop과 Escape 닫기 정책을 각각 비활성화할 수 있다", async () => {
    document.body.innerHTML = '<div id="root"></div>';
    const close = vi.fn();
    const root = createRoot(document.querySelector("#root"));
    await act(() =>
      root.render(
        createElement(
          Modal,
          {
            open: true,
            title: "진행 중",
            onClose: close,
            closeOnBackdrop: false,
            closeOnEscape: false,
          },
          createElement("button", null, "확인"),
        ),
      ),
    );
    fireEvent.mouseDown(document.querySelector(".modal"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).not.toHaveBeenCalled();
    await act(() => root.unmount());
  });

  it("여러 Modal은 최상단만 Escape를 처리하고 Scroll Lock을 공유한다", async () => {
    document.body.innerHTML = '<div id="first"></div><div id="second"></div>';
    const firstClose = vi.fn();
    const secondClose = vi.fn();
    const firstRoot = createRoot(document.querySelector("#first"));
    const secondRoot = createRoot(document.querySelector("#second"));
    await act(() =>
      firstRoot.render(
        createElement(
          Modal,
          { open: true, title: "첫 번째", onClose: firstClose },
          createElement("button", null, "첫 번째 버튼"),
        ),
      ),
    );
    await act(() =>
      secondRoot.render(
        createElement(
          Modal,
          { open: true, title: "두 번째", onClose: secondClose },
          createElement("button", null, "두 번째 버튼"),
        ),
      ),
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(firstClose).not.toHaveBeenCalled();
    expect(secondClose).toHaveBeenCalledWith("escape");
    await act(() => secondRoot.unmount());
    expect(document.body.classList.contains("is-modal-open")).toBe(true);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(firstClose).toHaveBeenCalledWith("escape");
    await act(() => firstRoot.unmount());
    expect(document.body.classList.contains("is-modal-open")).toBe(false);
  });
});
