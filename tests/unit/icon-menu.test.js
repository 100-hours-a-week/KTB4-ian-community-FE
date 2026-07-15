import { fireEvent } from "@testing-library/dom";
import { describe, expect, it } from "vitest";
import { MenuManager } from "../../scripts/components/menu-manager.js";
import { ICONS, setToggleIcon } from "../../scripts/utils/icons.js";

describe("아이콘과 메뉴", () => {
  it("stroke에서 fill로 바꾸고 애니메이션을 재생한다", async () => {
    document.body.innerHTML = `<button><img></button>`;
    const button = document.querySelector("button");
    setToggleIcon(button, true, ICONS.like);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.querySelector("img").src).toContain("heart-fill.svg");
    await new Promise(requestAnimationFrame);
    expect(button.classList.contains("is-popping")).toBe(true);
  });
  it("메뉴에 context를 보존하고 Escape로 닫는다", () => {
    document.body.innerHTML = `<button id="anchor"></button><div id="menu"></div>`;
    const manager = new MenuManager();
    const anchor = document.querySelector("#anchor");
    const menu = document.querySelector("#menu");
    manager.open({ anchor, menu, context: { commentId: 3 } });
    expect(manager.context.commentId).toBe(3);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(menu.hidden).toBe(true);
  });
});
