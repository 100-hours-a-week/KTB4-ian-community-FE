import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { fireEvent } from "@testing-library/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { postApi } from "../../src/entities/post/api/postApi.js";
import { CreatePostModal } from "../../src/features/post/create/CreatePostModal.jsx";

const user = {
  userId: 7,
  nickname: "작성자",
  profileImage: "/images/profile-default.svg",
};

describe("피드 생성 Modal", () => {
  let root;
  let objectIndex;

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    root = createRoot(document.querySelector("#root"));
    objectIndex = 0;
    URL.createObjectURL = vi.fn(() => `blob:preview-${++objectIndex}`);
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(async () => {
    await act(() => root.unmount());
    vi.restoreAllMocks();
  });

  async function renderModal(props = {}) {
    const onClose = props.onClose ?? vi.fn();
    const onCreated = props.onCreated ?? vi.fn(async () => {});
    await act(() =>
      root.render(
        createElement(CreatePostModal, {
          open: true,
          user,
          onClose,
          onCreated,
          ...props,
        }),
      ),
    );
    return { onClose, onCreated };
  }

  it("본문이 필수이며 이미지 Preview의 DOM 순서를 보장한다", async () => {
    await renderModal();
    const submit = document.querySelector('[aria-label="피드 게시"]');
    const textarea = document.querySelector('[aria-label="피드 본문"]');
    const file = new File(["image"], "photo.png", { type: "image/png" });

    expect(submit.disabled).toBe(true);
    expect(document.querySelector(".feed-editor__preview")).toBeNull();
    await act(() =>
      fireEvent.change(document.querySelector('input[type="file"]'), {
        target: { files: [file] },
      }),
    );
    expect(submit.disabled).toBe(true);
    expect(document.querySelector(".feed-editor__preview")).not.toBeNull();
    const previewImage = document.querySelector(
      '[alt="선택한 이미지 미리보기"]',
    );
    expect(previewImage.draggable).toBe(false);
    const dragEvent = new Event("dragstart", {
      bubbles: true,
      cancelable: true,
    });
    previewImage.dispatchEvent(dragEvent);
    expect(dragEvent.defaultPrevented).toBe(true);
    const editorChildren = Array.from(
      document.querySelector(".feed-editor").children,
    );
    expect(editorChildren[0].className).toBe("feed-editor__media");
    expect(editorChildren[1]).toBe(textarea);

    await act(() =>
      fireEvent.change(textarea, { target: { value: " \n\t " } }),
    );
    expect(submit.disabled).toBe(true);
    await act(() => fireEvent.change(textarea, { target: { value: "본문" } }));
    expect(submit.disabled).toBe(false);
  });

  it("Pending 중 중복 요청을 막고 성공 후 Form과 Object URL을 정리한다", async () => {
    let finish;
    vi.spyOn(postApi, "create").mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { onClose, onCreated } = await renderModal();
    const textarea = document.querySelector('[aria-label="피드 본문"]');
    const submit = document.querySelector('[aria-label="피드 게시"]');
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(["image"], "photo.png", { type: "image/png" });
    await act(() =>
      fireEvent.change(textarea, { target: { value: "  본문  " } }),
    );
    await act(() => fireEvent.change(fileInput, { target: { files: [file] } }));

    await act(() => {
      fireEvent.click(submit);
      fireEvent.click(submit);
      fireEvent.click(submit);
    });
    expect(postApi.create).toHaveBeenCalledTimes(1);
    expect(postApi.create).toHaveBeenCalledWith(7, {
      content: "본문",
      image: file,
    });
    expect(submit.disabled).toBe(true);
    expect(textarea.disabled).toBe(true);

    await act(async () => finish());
    expect(textarea.value).toBe("");
    expect(fileInput.value).toBe("");
    expect(document.querySelector(".feed-editor__preview")).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("API 실패 후 본문과 Preview를 유지해 재시도할 수 있다", async () => {
    vi.spyOn(postApi, "create").mockRejectedValueOnce(new Error("생성 실패"));
    await renderModal();
    const textarea = document.querySelector('[aria-label="피드 본문"]');
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(["image"], "photo.png", { type: "image/png" });
    await act(() =>
      fireEvent.change(textarea, { target: { value: "재시도" } }),
    );
    await act(() => fireEvent.change(fileInput, { target: { files: [file] } }));
    await act(async () =>
      fireEvent.click(document.querySelector('[aria-label="피드 게시"]')),
    );

    expect(document.body.textContent).toContain("생성 실패");
    expect(textarea.value).toBe("재시도");
    expect(document.querySelector(".feed-editor__preview")).not.toBeNull();
    expect(document.querySelector('[aria-label="피드 게시"]').disabled).toBe(
      false,
    );
  });
});
