import { describe, expect, it } from "vitest";
import {
  UNKNOWN_ERROR_MESSAGE,
  errorMessageFor,
} from "../../src/shared/api/errorMessages.js";
import { ApiError } from "../../src/shared/api/apiError.js";

describe("API 오류 표시 계약", () => {
  it("로그인 실패와 게시글 없음 Code를 한국어로 매핑한다", () => {
    expect(errorMessageFor("INVALID_LOGIN_REQUEST")).toBe(
      "이메일 또는 비밀번호를 확인해주세요.",
    );
    expect(errorMessageFor("POST_NOT_FOUND")).toBe(
      "게시글을 찾을 수 없습니다.",
    );
  });

  it("Validation은 DTO의 구체적인 Message를 보존한다", () => {
    expect(errorMessageFor("INVALID_REQUEST", "닉네임을 입력해주세요.")).toBe(
      "닉네임을 입력해주세요.",
    );
  });

  it("알 수 없는 Code는 서버 내부 Message 대신 공통 문구를 사용한다", () => {
    expect(errorMessageFor("UNKNOWN_CODE", "internal detail")).toBe(
      UNKNOWN_ERROR_MESSAGE,
    );
    expect(errorMessageFor(undefined, "internal detail")).toBe(
      UNKNOWN_ERROR_MESSAGE,
    );
  });

  it("ApiError는 status, code, message, response와 cause를 보존한다", () => {
    const response = new Response(null, { status: 400 });
    const cause = new Error("cause");
    const error = new ApiError("표시 메시지", {
      status: 400,
      code: "INVALID_REQUEST",
      response,
      cause,
    });

    expect(error).toMatchObject({
      status: 400,
      code: "INVALID_REQUEST",
      message: "표시 메시지",
      response,
      cause,
    });
  });
});
