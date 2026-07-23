import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { fireEvent, getByLabelText, getByRole } from "@testing-library/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { postApi } from "../../src/entities/post/api/postApi.js";
import { CommentForm } from "../../src/features/comment/create/CommentForm.jsx";

vi.mock("../../src/entities/post/api/postApi.js", () => ({
  postApi: { comment: vi.fn() },
}));

describe("댓글 작성 영역", () => {
  let container;
  let root;

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    container = document.querySelector("#root");
    root = createRoot(container);
    postApi.comment.mockReset();
  });

  afterEach(async () => {
    await act(() => root.unmount());
  });

  async function renderForm(onCreated = vi.fn()) {
    await act(() =>
      root.render(
        createElement(CommentForm, { postId: 31, userId: 7, onCreated }),
      ),
    );
    return onCreated;
  }

  it("trim 본문이 있을 때만 Submit을 활성화한다", async () => {
    await renderForm();
    const textarea = getByLabelText(container, "댓글 작성");
    const submit = getByRole(container, "button", { name: "댓글 등록" });
    expect(submit.disabled).toBe(true);
    await act(() => fireEvent.change(textarea, { target: { value: "   " } }));
    expect(submit.disabled).toBe(true);
    await act(() =>
      fireEvent.change(textarea, { target: { value: " 댓글 " } }),
    );
    expect(submit.disabled).toBe(false);
  });

  it("성공 시 한 번 요청하고 입력과 목록을 갱신한다", async () => {
    let resolveRequest;
    postApi.comment.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const onCreated = await renderForm();
    const textarea = getByLabelText(container, "댓글 작성");
    const submit = getByRole(container, "button", { name: "댓글 등록" });
    await act(() =>
      fireEvent.change(textarea, { target: { value: " 댓글 " } }),
    );
    await act(async () => {
      fireEvent.click(submit);
      fireEvent.click(submit);
    });
    expect(postApi.comment).toHaveBeenCalledTimes(1);
    expect(submit.disabled).toBe(true);
    await act(async () => resolveRequest());
    expect(textarea.value).toBe("");
    expect(onCreated).toHaveBeenCalledTimes(1);
  });

  it("실패 시 입력값을 유지한다", async () => {
    postApi.comment.mockRejectedValue(new Error("댓글 등록 실패"));
    await renderForm();
    const textarea = getByLabelText(container, "댓글 작성");
    await act(() =>
      fireEvent.change(textarea, { target: { value: "재시도" } }),
    );
    await act(async () =>
      fireEvent.click(getByRole(container, "button", { name: "댓글 등록" })),
    );
    expect(textarea.value).toBe("재시도");
    expect(container.textContent).toContain("댓글 등록 실패");
  });
});
