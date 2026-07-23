import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppLoadingScreen } from "../../src/shared/ui/AppLoadingScreen.jsx";
import { NotFoundPage } from "../../src/pages/not-found/NotFoundPage.jsx";

describe("공통 상태 화면", () => {
  it("인증 초기화 화면은 PULSE 로고와 busy 상태를 제공한다", () => {
    const html = renderToStaticMarkup(createElement(AppLoadingScreen));
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('alt="PULSE"');
    expect(html).toContain("PULSE를 준비하고 있습니다.");
  });

  it("Not Found는 안내와 피드 복귀 Action을 제공한다", () => {
    const onFeed = vi.fn();
    const html = renderToStaticMarkup(createElement(NotFoundPage, { onFeed }));
    expect(html).toContain("페이지를 찾을 수 없습니다.");
    expect(html).toContain("피드로 돌아가기");
    expect(html).toContain(
      'class="button button--outline status-page__action"',
    );
  });
});
