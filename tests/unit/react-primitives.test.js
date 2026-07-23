import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "../../src/shared/ui/Button.jsx";
import { SkeletonAvatar } from "../../src/shared/ui/skeleton/Skeleton.jsx";

describe("React primitive", () => {
  it("loading button은 중복 요청을 막는다", () => {
    const html = renderToStaticMarkup(
      createElement(Button, { loading: true }, "확인"),
    );
    expect(html).toContain("disabled");
    expect(html).toContain('aria-busy="true"');
  });

  it("Skeleton은 접근성 트리에서 제외된다", () => {
    expect(renderToStaticMarkup(createElement(SkeletonAvatar))).toContain(
      'aria-hidden="true"',
    );
  });
});
