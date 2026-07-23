import { describe, expect, it } from "vitest";
import {
  isSignupValid,
  signupPayload,
  validateSignup,
} from "../../src/features/auth/signup/model/validateSignup.js";

const valid = {
  email: "pulse@example.com",
  password: "Pulse123!",
  passwordConfirm: "Pulse123!",
  nickname: "펄스",
};

describe("signup validation", () => {
  it.each([
    ["이메일 빈 값", { email: "  " }, "email"],
    ["이메일 형식 오류", { email: "pulse" }, "email"],
    ["비밀번호 빈 값", { password: "" }, "password"],
    ["비밀번호 정책 불일치", { password: "password" }, "password"],
    [
      "비밀번호 확인 불일치",
      { passwordConfirm: "Different123!" },
      "passwordConfirm",
    ],
    ["닉네임 빈 값", { nickname: "  " }, "nickname"],
    ["닉네임 길이 오류", { nickname: "12345678901" }, "nickname"],
  ])("%s을 검증한다", (_, patch, field) => {
    expect(validateSignup({ ...valid, ...patch })[field]).toBeTruthy();
  });

  it("모든 값이 정상이면 Submit 가능하다", () => {
    expect(isSignupValid(valid)).toBe(true);
  });

  it("전송 시 이메일과 닉네임만 trim하고 비밀번호는 변경하지 않는다", () => {
    const values = {
      ...valid,
      email: "  pulse@example.com ",
      nickname: " 펄스 ",
      password: " Pulse123!",
      passwordConfirm: " Pulse123!",
    };

    expect(signupPayload(values)).toEqual({
      email: "pulse@example.com",
      password: " Pulse123!",
      password_confirm: " Pulse123!",
      nickname: "펄스",
    });
  });
});
