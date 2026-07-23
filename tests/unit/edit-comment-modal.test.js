import { fireEvent } from "@testing-library/dom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { postApi } from "../../src/entities/post/api/postApi.js";
import { EditCommentModal } from "../../src/features/comment/edit/EditCommentModal.jsx";

const comment = {
  comment_id: 41,
  post_id: 31,
  user_id: 7,
  comment: "기존 댓글",
  nickname: "작성자",
  profile_image: "/images/profile-default.svg",
};

describe("댓글 수정 Modal", () => {
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
    const onUpdated = props.onUpdated ?? vi.fn(async () => {});
    await act(() =>
      root.render(
        createElement(EditCommentModal, {
          open: true,
          comment,
          userId: 7,
          onClose,
          onUpdated,
          ...props,
        }),
      ),
    );
    return { onClose, onUpdated };
  }

  it("기존 댓글을 표시하고 변경 없음과 공백 상태를 비활성화한다", async () => {
    await renderModal();
    const textarea = document.querySelector('[aria-label="댓글 내용"]');
    const submit = document.querySelector('[aria-label="댓글 수정"]');
    expect(textarea.value).toBe("기존 댓글");
    expect(submit.disabled).toBe(true);
    await act(() => fireEvent.change(textarea, { target: { value: " " } }));
    expect(submit.disabled).toBe(true);
    await act(() =>
      fireEvent.change(textarea, { target: { value: "수정 댓글" } }),
    );
    expect(submit.disabled).toBe(false);
  });

  it("Pending 중 중복 요청을 막고 성공 후 갱신하고 닫는다", async () => {
    let finish;
    vi.spyOn(postApi, "updateComment").mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { onClose, onUpdated } = await renderModal();
    const textarea = document.querySelector('[aria-label="댓글 내용"]');
    const submit = document.querySelector('[aria-label="댓글 수정"]');
    await act(() =>
      fireEvent.change(textarea, { target: { value: "  수정 댓글  " } }),
    );
    await act(() => {
      fireEvent.click(submit);
      fireEvent.click(submit);
      fireEvent.click(submit);
    });
    expect(postApi.updateComment).toHaveBeenCalledTimes(1);
    expect(postApi.updateComment).toHaveBeenCalledWith(31, 41, 7, "수정 댓글");
    expect(submit.disabled).toBe(true);
    await act(async () => finish());
    expect(onUpdated).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("실패하면 Modal과 입력값을 유지한다", async () => {
    vi.spyOn(postApi, "updateComment").mockRejectedValueOnce(
      new Error("댓글 수정 실패"),
    );
    const { onClose, onUpdated } = await renderModal();
    const textarea = document.querySelector('[aria-label="댓글 내용"]');
    await act(() =>
      fireEvent.change(textarea, { target: { value: "재시도 댓글" } }),
    );
    await act(async () =>
      fireEvent.click(document.querySelector('[aria-label="댓글 수정"]')),
    );
    expect(document.body.textContent).toContain("댓글 수정 실패");
    expect(textarea.value).toBe("재시도 댓글");
    expect(onUpdated).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
