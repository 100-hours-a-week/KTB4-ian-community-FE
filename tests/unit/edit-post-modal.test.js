import { fireEvent } from "@testing-library/dom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { postApi } from "../../src/entities/post/api/postApi.js";
import { EditPostModal } from "../../src/features/post/edit/EditPostModal.jsx";

const post = {
  postId: 31,
  content: "기존 본문",
  imageUrl: "/images/feed/existing.jpg",
  author: {
    nickname: "작성자",
    profileImage: "/images/profile-default.svg",
  },
};

describe("피드 수정 Modal", () => {
  let root;

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    root = createRoot(document.querySelector("#root"));
    URL.createObjectURL = vi.fn(() => "blob:changed-image");
    URL.revokeObjectURL = vi.fn();
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
        createElement(EditPostModal, {
          open: true,
          post,
          onClose,
          onUpdated,
          ...props,
        }),
      ),
    );
    return { onClose, onUpdated };
  }

  it("기존 값과 이미지를 초기화하고 실제 변경이 있을 때만 Submit을 활성화한다", async () => {
    await renderModal();
    const textarea = document.querySelector('[aria-label="피드 본문"]');
    const submit = document.querySelector('[aria-label="피드 수정"]');
    const preview = document.querySelector(".feed-editor__preview");

    expect(textarea.value).toBe("기존 본문");
    expect(preview.dataset.previewKind).toBe("existing");
    const previewImage = preview.querySelector("img");
    expect(previewImage.draggable).toBe(false);
    const dragEvent = new Event("dragstart", {
      bubbles: true,
      cancelable: true,
    });
    previewImage.dispatchEvent(dragEvent);
    expect(dragEvent.defaultPrevented).toBe(true);
    expect(submit.disabled).toBe(true);
    await act(() =>
      fireEvent.change(textarea, { target: { value: "  기존 본문  " } }),
    );
    expect(submit.disabled).toBe(true);
    await act(() => fireEvent.change(textarea, { target: { value: " " } }));
    expect(submit.disabled).toBe(true);
    await act(() =>
      fireEvent.change(textarea, { target: { value: "수정 본문" } }),
    );
    expect(submit.disabled).toBe(false);
  });

  it("기존 이미지와 Blob Preview를 구분하고 Object URL을 정리한다", async () => {
    await renderModal();
    const file = new File(["image"], "changed.png", { type: "image/png" });
    await act(() =>
      fireEvent.change(document.querySelector('input[type="file"]'), {
        target: { files: [file] },
      }),
    );
    expect(
      document.querySelector(".feed-editor__preview").dataset.previewKind,
    ).toBe("blob");
    expect(document.querySelector('[aria-label="피드 수정"]').disabled).toBe(
      false,
    );
    await act(() =>
      fireEvent.click(
        document.querySelector('[aria-label="피드 이미지 제거"]'),
      ),
    );
    expect(document.querySelector(".feed-editor__preview")).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:changed-image");
  });

  it("Pending 중 중복 요청을 막고 실패하면 입력을 유지한다", async () => {
    let reject;
    vi.spyOn(postApi, "update").mockReturnValue(
      new Promise((resolve, rejectRequest) => {
        reject = rejectRequest;
      }),
    );
    const { onClose, onUpdated } = await renderModal();
    const textarea = document.querySelector('[aria-label="피드 본문"]');
    const submit = document.querySelector('[aria-label="피드 수정"]');
    await act(() =>
      fireEvent.change(textarea, { target: { value: "재시도 본문" } }),
    );

    await act(() => {
      fireEvent.click(submit);
      fireEvent.click(submit);
      fireEvent.click(submit);
    });
    expect(postApi.update).toHaveBeenCalledTimes(1);
    expect(postApi.update).toHaveBeenCalledWith(31, {
      content: "재시도 본문",
      imageUrl: "/images/feed/existing.jpg",
    });
    expect(submit.disabled).toBe(true);
    await act(async () => reject(new Error("수정 실패")));
    expect(document.body.textContent).toContain("수정 실패");
    expect(textarea.value).toBe("재시도 본문");
    expect(submit.disabled).toBe(false);
    expect(onUpdated).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
