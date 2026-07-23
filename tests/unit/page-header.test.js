import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { fireEvent, getByRole } from "@testing-library/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PageHeader } from "../../src/shared/ui/PageHeader.jsx";

describe("Page Header", () => {
  let container;
  let root;

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    container = document.querySelector("#root");
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(() => root.unmount());
  });

  it("Figma Back SVG와 제목을 렌더링한다", async () => {
    await act(() =>
      root.render(createElement(PageHeader, { title: "피드 상세보기" })),
    );
    expect(
      getByRole(container, "heading", { name: "피드 상세보기" }),
    ).toBeTruthy();
    const icon = getByRole(container, "button", {
      name: "뒤로가기",
    }).querySelector("img");
    expect(icon.getAttribute("src")).toMatch(/back-left|data:image\/svg\+xml/);
    expect(icon.getAttribute("aria-hidden")).toBe("true");
  });

  it("뒤로가기 callback을 한 번 실행한다", async () => {
    const onBack = vi.fn();
    await act(() =>
      root.render(
        createElement(PageHeader, { title: "피드 상세보기", onBack }),
      ),
    );
    await act(() =>
      fireEvent.click(getByRole(container, "button", { name: "뒤로가기" })),
    );
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
