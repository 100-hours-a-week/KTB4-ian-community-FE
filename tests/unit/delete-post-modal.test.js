import { fireEvent } from "@testing-library/dom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { postApi } from "../../src/entities/post/api/postApi.js";
import { DeletePostModal } from "../../src/features/post/delete/DeletePostModal.jsx";

describe("피드 삭제 확인 Modal", () => {
  let root;
  const post = { postId: 31 };

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    root = createRoot(document.querySelector("#root"));
  });

  afterEach(async () => {
    await act(() => root.unmount());
    vi.restoreAllMocks();
  });

  async function renderModal(props = {}) {
    const onClose = props.onClose ?? vi.fn();
    const onDeleted = props.onDeleted ?? vi.fn();
    await act(() =>
      root.render(
        createElement(DeletePostModal, {
          open: true,
          post,
          onClose,
          onDeleted,
          ...props,
        }),
      ),
    );
    return { onClose, onDeleted };
  }

  it("제목·설명·취소·확인 순서를 표시하고 확인 전 호출하지 않는다", async () => {
    vi.spyOn(postApi, "remove").mockResolvedValue(null);
    const { onClose } = await renderModal();
    expect(document.body.textContent).toContain("피드 삭제 하실건가요?");
    expect(document.body.textContent).toContain(
      "삭제된 피드는 복구할 수 없습니다.",
    );
    const buttons = [...document.querySelectorAll(".delete-confirm button")];
    expect(buttons.map((button) => button.textContent)).toEqual([
      "취소",
      "확인",
    ]);
    expect(postApi.remove).not.toHaveBeenCalled();
    await act(() => fireEvent.click(buttons[0]));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Pending 중 대상 ID로 한 번만 호출하고 성공 후 대상만 알린다", async () => {
    let finish;
    vi.spyOn(postApi, "remove").mockReturnValue(
      new Promise((resolve) => (finish = resolve)),
    );
    const { onClose, onDeleted } = await renderModal();
    const confirm = document.querySelector(".button--primary");
    await act(() => {
      fireEvent.click(confirm);
      fireEvent.click(confirm);
      fireEvent.click(confirm);
    });
    expect(postApi.remove).toHaveBeenCalledTimes(1);
    expect(postApi.remove).toHaveBeenCalledWith(31);
    await act(async () => finish());
    expect(onDeleted).toHaveBeenCalledWith(31);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("실패하면 Modal을 유지하고 오류를 표시한다", async () => {
    vi.spyOn(postApi, "remove").mockRejectedValueOnce(new Error("삭제 실패"));
    const { onClose, onDeleted } = await renderModal();
    await act(async () =>
      fireEvent.click(document.querySelector(".button--primary")),
    );
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.body.textContent).toContain("삭제 실패");
    expect(onDeleted).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
