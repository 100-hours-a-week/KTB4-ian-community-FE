import { fireEvent } from "@testing-library/dom";
import { describe, expect, it } from "vitest";
import { ModalManager } from "../../scripts/components/modal-manager.js";

describe("ModalManager", () => {
  it("Escape로 닫고 포커스를 복원한다", () => {
    document.body.innerHTML = `<button id="open">열기</button><div id="modal" hidden><button>확인</button></div>`;
    const trigger = document.querySelector("#open");
    trigger.focus();
    const manager = new ModalManager();
    manager.open(document.querySelector("#modal"), trigger);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.querySelector("#modal").hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });
});
