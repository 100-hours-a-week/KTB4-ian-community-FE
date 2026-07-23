import { fireEvent } from "@testing-library/dom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userApi } from "../../src/entities/user/api/userApi.js";
import { EditPasswordModal } from "../../src/features/user/password/EditPasswordModal.jsx";
import { validatePasswordChange } from "../../src/features/user/password/validatePasswordChange.js";

describe("비밀번호 변경", () => {
  let root;
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    root = createRoot(document.querySelector("#root"));
  });
  afterEach(async () => {
    await act(() => root.unmount());
    vi.restoreAllMocks();
  });

  it("빈 값, 정책, 기존과 동일, 확인 불일치를 검증한다", () => {
    expect(validatePasswordChange(empty())).toMatchObject({
      password: expect.any(String),
      newPassword: expect.any(String),
      newPasswordConfirm: expect.any(String),
    });
    expect(
      validatePasswordChange({
        password: "Signup123!",
        newPassword: "weak",
        newPasswordConfirm: "weak",
      }).newPassword,
    ).toContain("8~20자");
    expect(
      validatePasswordChange({
        password: "Signup123!",
        newPassword: "Signup123!",
        newPasswordConfirm: "Signup123!",
      }).newPassword,
    ).toContain("다른 비밀번호");
    expect(
      validatePasswordChange({
        password: "Signup123!",
        newPassword: "Changed123!",
        newPasswordConfirm: "Different123!",
      }).newPasswordConfirm,
    ).toContain("일치하지");
  });

  function empty() {
    return { password: "", newPassword: "", newPasswordConfirm: "" };
  }

  async function renderModal(props = {}) {
    const onClose = props.onClose ?? vi.fn();
    await act(() =>
      root.render(
        createElement(EditPasswordModal, {
          open: true,
          userId: 7,
          onClose,
          ...props,
        }),
      ),
    );
    return { onClose };
  }

  async function fillValid() {
    await act(() =>
      fireEvent.change(document.querySelector('[aria-label="현재 비밀번호"]'), {
        target: { value: "Signup123!" },
      }),
    );
    await act(() =>
      fireEvent.change(document.querySelector('[aria-label="새 비밀번호"]'), {
        target: { value: "Changed123!" },
      }),
    );
    await act(() =>
      fireEvent.change(
        document.querySelector('[aria-label="새 비밀번호 확인"]'),
        {
          target: { value: "Changed123!" },
        },
      ),
    );
  }

  it("Pending 중 중복 요청을 막고 성공하면 닫는다", async () => {
    let finish;
    vi.spyOn(userApi, "updatePassword").mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { onClose } = await renderModal();
    await fillValid();
    const submit = document.querySelector(".password-editor > button");
    expect(submit.disabled).toBe(false);
    await act(() => {
      fireEvent.click(submit);
      fireEvent.click(submit);
      fireEvent.click(submit);
    });
    expect(userApi.updatePassword).toHaveBeenCalledTimes(1);
    expect(userApi.updatePassword).toHaveBeenCalledWith(7, {
      password: "Signup123!",
      newPassword: "Changed123!",
      password_confirm: "Changed123!",
    });
    await act(async () => finish());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("실패하면 Modal과 입력값을 유지한다", async () => {
    vi.spyOn(userApi, "updatePassword").mockRejectedValueOnce(
      new Error("현재 비밀번호가 올바르지 않습니다."),
    );
    const { onClose } = await renderModal();
    await fillValid();
    await act(async () =>
      fireEvent.click(document.querySelector(".password-editor > button")),
    );
    expect(document.body.textContent).toContain(
      "현재 비밀번호가 올바르지 않습니다.",
    );
    expect(document.querySelector('[aria-label="현재 비밀번호"]').value).toBe(
      "Signup123!",
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});
