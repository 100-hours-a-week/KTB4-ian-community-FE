import { fireEvent } from "@testing-library/dom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userApi } from "../../src/entities/user/api/userApi.js";
import { LoginForm } from "../../src/features/auth/login/LoginForm.jsx";

describe("로그인 Form", () => {
  let root;
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    root = createRoot(document.querySelector("#root"));
  });
  afterEach(async () => {
    await act(() => root.unmount());
    vi.restoreAllMocks();
  });

  async function renderForm(props = {}) {
    const onAuthenticated = props.onAuthenticated ?? vi.fn();
    const onSignup = props.onSignup ?? vi.fn();
    await act(() =>
      root.render(
        createElement(LoginForm, { onAuthenticated, onSignup, ...props }),
      ),
    );
    return { onAuthenticated, onSignup };
  }

  it("지정 Placeholder와 회원가입 디자인 Primitive를 사용한다", async () => {
    await renderForm();
    expect(document.querySelector('[aria-label="이메일"]').placeholder).toBe(
      "이메일 입력해주세요",
    );
    expect(document.querySelector('[aria-label="비밀번호"]').placeholder).toBe(
      "비밀번호 입력해주세요",
    );
    expect(document.querySelector(".signup-panel__logo")).not.toBeNull();
    expect(document.querySelector(".auth-divider").textContent).toBe("로그인");
    expect(document.querySelector(".signup-submit").disabled).toBe(true);
  });

  it("이메일과 비밀번호가 모두 있을 때만 Submit을 활성화한다", async () => {
    await renderForm();
    const email = document.querySelector('[aria-label="이메일"]');
    const password = document.querySelector('[aria-label="비밀번호"]');
    await act(() =>
      fireEvent.change(email, { target: { value: "test@example.com" } }),
    );
    expect(document.querySelector(".signup-submit").disabled).toBe(true);
    await act(() =>
      fireEvent.change(password, { target: { value: "Password1!" } }),
    );
    expect(document.querySelector(".signup-submit").disabled).toBe(false);
  });

  it("Pending 중 중복 요청을 막고 성공 사용자를 전달한다", async () => {
    let finish;
    vi.spyOn(userApi, "login").mockReturnValue(
      new Promise((resolve) => (finish = resolve)),
    );
    vi.spyOn(userApi, "me").mockResolvedValue({ userId: 7, nickname: "pulse" });
    const { onAuthenticated } = await renderForm();
    await act(() => {
      fireEvent.change(document.querySelector('[aria-label="이메일"]'), {
        target: { value: "pulse@example.com" },
      });
      fireEvent.change(document.querySelector('[aria-label="비밀번호"]'), {
        target: { value: "Password1!" },
      });
    });
    const form = document.querySelector("form");
    await act(() => {
      fireEvent.submit(form);
      fireEvent.submit(form);
      fireEvent.submit(form);
    });
    expect(userApi.login).toHaveBeenCalledTimes(1);
    await act(async () => finish({ user_id: 7 }));
    expect(onAuthenticated).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 7, nickname: "pulse" }),
    );
  });

  it("실패하면 입력값과 오류를 유지한다", async () => {
    vi.spyOn(userApi, "login").mockRejectedValueOnce(new Error("로그인 실패"));
    await renderForm();
    await act(() => {
      fireEvent.change(document.querySelector('[aria-label="이메일"]'), {
        target: { value: "pulse@example.com" },
      });
      fireEvent.change(document.querySelector('[aria-label="비밀번호"]'), {
        target: { value: "Password1!" },
      });
    });
    await act(async () => fireEvent.submit(document.querySelector("form")));
    expect(document.querySelector('[role="alert"]').textContent).toBe(
      "로그인 실패",
    );
    expect(document.querySelector('[aria-label="이메일"]').value).toBe(
      "pulse@example.com",
    );
    expect(document.querySelector('[aria-label="비밀번호"]').value).toBe(
      "Password1!",
    );
  });
});
