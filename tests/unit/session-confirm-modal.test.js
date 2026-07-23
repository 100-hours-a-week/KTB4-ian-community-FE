import { fireEvent } from "@testing-library/dom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userApi } from "../../src/entities/user/api/userApi.js";
import { SessionConfirmModal } from "../../src/features/auth/session/SessionConfirmModal.jsx";

describe("로그아웃·회원탈퇴 Confirm Modal", () => {
  let root;
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    root = createRoot(document.querySelector("#root"));
  });
  afterEach(async () => {
    await act(() => root.unmount());
    vi.restoreAllMocks();
  });

  async function renderModal(action, props = {}) {
    const onCancel = props.onCancel ?? vi.fn();
    const onComplete = props.onComplete ?? vi.fn();
    await act(() =>
      root.render(
        createElement(SessionConfirmModal, {
          action,
          userId: 7,
          onCancel,
          onComplete,
          ...props,
        }),
      ),
    );
    return { onCancel, onComplete };
  }

  it("취소 Outline과 확인 Primary 순서를 사용한다", async () => {
    const { onCancel } = await renderModal("logout");
    const buttons = Array.from(document.querySelectorAll(".confirm button"));
    expect(buttons.map((button) => button.textContent)).toEqual([
      "취소",
      "확인",
    ]);
    expect(buttons[0].className).toContain("button--outline");
    expect(buttons[1].className).toContain("button--primary");
    await act(() => fireEvent.click(buttons[0]));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("로그아웃 Pending 중 중복 호출을 막고 성공 후 완료한다", async () => {
    let finish;
    vi.spyOn(userApi, "logout").mockReturnValue(
      new Promise((resolve) => (finish = resolve)),
    );
    const { onComplete } = await renderModal("logout");
    const confirm = document.querySelector(".button--primary");
    await act(() => {
      fireEvent.click(confirm);
      fireEvent.click(confirm);
      fireEvent.click(confirm);
    });
    expect(userApi.logout).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("회원탈퇴는 실제 Endpoint Adapter를 한 번 호출한다", async () => {
    vi.spyOn(userApi, "remove").mockResolvedValue(null);
    const { onComplete } = await renderModal("delete");
    await act(async () =>
      fireEvent.click(document.querySelector(".button--primary")),
    );
    expect(userApi.remove).toHaveBeenCalledTimes(1);
    expect(userApi.remove).toHaveBeenCalledWith(7);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("실패하면 Modal과 인증 상태를 유지한다", async () => {
    vi.spyOn(userApi, "remove").mockRejectedValueOnce(new Error("탈퇴 실패"));
    const { onComplete } = await renderModal("delete");
    await act(async () =>
      fireEvent.click(document.querySelector(".button--primary")),
    );
    expect(document.body.textContent).toContain("탈퇴 실패");
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
