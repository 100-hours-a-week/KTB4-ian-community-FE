import { fireEvent } from "@testing-library/dom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { postApi } from "../../src/entities/post/api/postApi.js";
import { DeleteCommentModal } from "../../src/features/comment/delete/DeleteCommentModal.jsx";

describe("댓글 삭제 확인 Modal", () => {
  let root;
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
        createElement(DeleteCommentModal, {
          open: true,
          postId: 31,
          comment: { comment_id: 41 },
          userId: 7,
          onClose,
          onDeleted,
          ...props,
        }),
      ),
    );
    return { onClose, onDeleted };
  }

  it("제목과 설명을 표시하고 확인 전 API를 호출하지 않는다", async () => {
    vi.spyOn(postApi, "removeComment").mockResolvedValue(null);
    const { onClose } = await renderModal();
    expect(document.body.textContent).toContain("댓글 삭제 하실건가요?");
    expect(document.body.textContent).toContain(
      "삭제된 댓글은 복구할 수 없습니다.",
    );
    expect(postApi.removeComment).not.toHaveBeenCalled();
    await act(() => fireEvent.click(document.querySelector(".button--dark")));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Pending 중 대상 ID로 한 번만 호출하고 성공 후 대상만 알린다", async () => {
    let finish;
    vi.spyOn(postApi, "removeComment").mockReturnValue(
      new Promise((resolve) => (finish = resolve)),
    );
    const { onClose, onDeleted } = await renderModal();
    const confirm = document.querySelector(".button--primary");
    await act(() => {
      fireEvent.click(confirm);
      fireEvent.click(confirm);
      fireEvent.click(confirm);
    });
    expect(postApi.removeComment).toHaveBeenCalledTimes(1);
    expect(postApi.removeComment).toHaveBeenCalledWith(31, 41, 7);
    await act(async () => finish());
    expect(onDeleted).toHaveBeenCalledWith(41);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("실패하면 Modal과 기존 상태를 유지한다", async () => {
    vi.spyOn(postApi, "removeComment").mockRejectedValueOnce(
      new Error("댓글 삭제 실패"),
    );
    const { onClose, onDeleted } = await renderModal();
    await act(async () =>
      fireEvent.click(document.querySelector(".button--primary")),
    );
    expect(document.body.textContent).toContain("댓글 삭제 실패");
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
