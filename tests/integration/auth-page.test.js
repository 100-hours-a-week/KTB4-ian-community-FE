import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LoginPage } from "../../src/pages/login/LoginPage.jsx";
import { SignupPage } from "../../src/pages/signup/SignupPage.jsx";
import { SessionConfirmModal } from "../../src/features/auth/session/SessionConfirmModal.jsx";

describe("React 인증 화면 통합", () => {
  it("50/50 shell과 접근 가능한 로그인 Form을 조합한다", () => {
    const html = renderToStaticMarkup(
      createElement(LoginPage, { onAuthenticated() {} }),
    );
    expect(html).toContain('class="auth-page login-page"');
    expect(html).toContain('class="auth-artwork"');
    expect(html).toContain('aria-label="이메일"');
    expect(html).toContain('aria-label="비밀번호"');
    expect(html).toContain('placeholder="이메일 입력해주세요"');
    expect(html).toContain('placeholder="비밀번호 입력해주세요"');
    expect(html).toContain('class="auth-divider"');
    expect(html).toContain("signup-panel__logo");
  });

  it("로그아웃 확인은 Primary, 취소는 Outline Button을 사용한다", () => {
    const html = renderToStaticMarkup(
      createElement(SessionConfirmModal, {
        action: "logout",
        userId: 7,
        onCancel() {},
        onComplete() {},
      }),
    );
    expect(html).toContain("button--outline");
    expect(html).toContain("button--primary");
  });

  it("회원가입 Page는 Illustration과 4개 Field를 조합한다", () => {
    const html = renderToStaticMarkup(
      createElement(SignupPage, {
        onAuthenticated() {},
        onLogin() {},
      }),
    );
    expect(html).toContain('class="auth-page signup-page"');
    expect(html).toContain('class="auth-artwork"');
    expect(html).toContain('aria-label="이메일"');
    expect(html).toContain('aria-label="비밀번호"');
    expect(html).toContain('aria-label="비밀번호 확인"');
    expect(html).toContain('aria-label="닉네임"');
    expect(html).toContain("로그인 하러가기");
  });
});
