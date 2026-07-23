import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { fireEvent, getByLabelText, getByRole } from "@testing-library/dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userApi } from "../../src/entities/user/api/userApi.js";
import { SignupForm } from "../../src/features/auth/signup/ui/SignupForm.jsx";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

async function renderForm(props = {}) {
  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.querySelector("#root"));
  await act(() =>
    root.render(
      createElement(SignupForm, {
        onAuthenticated: vi.fn(),
        onLogin: vi.fn(),
        ...props,
      }),
    ),
  );
  return { root, container: document.querySelector("#root") };
}

async function fillValid(container) {
  await act(() => {
    fireEvent.input(getByLabelText(container, "이메일"), {
      target: { value: " pulse@example.com " },
    });
    fireEvent.input(getByLabelText(container, "비밀번호"), {
      target: { value: "Pulse123!" },
    });
    fireEvent.input(getByLabelText(container, "비밀번호 확인"), {
      target: { value: "Pulse123!" },
    });
    fireEvent.input(getByLabelText(container, "닉네임"), {
      target: { value: " 펄스 " },
    });
  });
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("SignupForm", () => {
  it("정상 입력 전에는 비활성이고 정상 입력 후 Submit이 활성화된다", async () => {
    const { root, container } = await renderForm();
    const submit = getByRole(container, "button", { name: "회원가입" });
    expect(submit.disabled).toBe(true);

    await fillValid(container);

    expect(submit.disabled).toBe(false);
    await act(() => root.unmount());
  });

  it("Submit 중 중복 요청을 차단하고 Backend 지원 Field만 전송한다", async () => {
    const signup = deferred();
    const signupSpy = vi
      .spyOn(userApi, "signup")
      .mockReturnValue(signup.promise);
    vi.spyOn(userApi, "me").mockResolvedValue({ nickname: "펄스" });
    const { root, container } = await renderForm();
    await fillValid(container);
    const form = container.querySelector("form");

    await act(() => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });

    expect(signupSpy).toHaveBeenCalledTimes(1);
    expect(signupSpy).toHaveBeenCalledWith({
      email: "pulse@example.com",
      password: "Pulse123!",
      password_confirm: "Pulse123!",
      nickname: "펄스",
    });
    expect(getByRole(container, "button", { name: "가입 중" }).disabled).toBe(
      true,
    );
    await act(async () => signup.resolve({ user_id: 7 }));
    await act(() => root.unmount());
  });

  it("서버 Field Error를 표시하고 실패 후 입력값을 유지한다", async () => {
    vi.spyOn(userApi, "signup").mockRejectedValue(
      new Error("email_already_exists"),
    );
    const { root, container } = await renderForm();
    await fillValid(container);

    await act(async () => fireEvent.submit(container.querySelector("form")));

    expect(container.textContent).toContain("이미 사용 중인 이메일입니다.");
    expect(getByLabelText(container, "이메일").value).toBe("pulse@example.com");
    expect(getByLabelText(container, "비밀번호").value).toBe("Pulse123!");
    await act(() => root.unmount());
  });

  it("성공 후 현재 사용자를 조회해 인증 상태를 갱신한다", async () => {
    vi.spyOn(userApi, "signup").mockResolvedValue({ user_id: 7 });
    vi.spyOn(userApi, "me").mockResolvedValue({
      email: "pulse@example.com",
      nickname: "PULSE 사용자",
      profile_image: "/images/me.png",
    });
    const onAuthenticated = vi.fn();
    const { root, container } = await renderForm({ onAuthenticated });
    await fillValid(container);

    await act(async () => fireEvent.submit(container.querySelector("form")));

    expect(userApi.me).toHaveBeenCalledWith(7);
    expect(onAuthenticated).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        email: "pulse@example.com",
        nickname: "PULSE 사용자",
      }),
    );
    await act(() => root.unmount());
  });
});
