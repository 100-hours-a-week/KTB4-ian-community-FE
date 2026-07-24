import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  pencilBodyIcon,
  pencilDetailIcon,
  trashIcon,
} from "../assets/index.js";

const MENU_WIDTH = 160;
const MENU_HEIGHT = 76;
const VIEWPORT_GAP = 8;
const TRIGGER_GAP = 8;

export function getOptionMenuPlacement(triggerRect, viewport = {}) {
  const viewportWidth = viewport.width ?? window.innerWidth;
  const viewportHeight = viewport.height ?? window.innerHeight;
  const spaceBelow = viewportHeight - triggerRect.bottom;
  const direction =
    spaceBelow >= MENU_HEIGHT + TRIGGER_GAP ? "down" : "up";
  const top =
    direction === "down"
      ? triggerRect.bottom + TRIGGER_GAP
      : Math.max(VIEWPORT_GAP, triggerRect.top - MENU_HEIGHT - TRIGGER_GAP);
  const left = Math.min(
    Math.max(VIEWPORT_GAP, triggerRect.right - MENU_WIDTH),
    viewportWidth - MENU_WIDTH - VIEWPORT_GAP,
  );

  return { direction, top, left };
}

export function OptionMenu({
  id,
  onEdit,
  onDelete,
  onClose,
  triggerRef,
}) {
  const menuRef = useRef(null);
  const [placement, setPlacement] = useState(null);

  useLayoutEffect(() => {
    function updatePlacement() {
      const trigger = triggerRef?.current;
      if (!trigger) return;
      setPlacement(getOptionMenuPlacement(trigger.getBoundingClientRect()));
    }

    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [triggerRef]);

  useEffect(() => {
    const menu = menuRef.current;
    menu?.querySelector('[role="menuitem"]')?.focus();

    function closeAndRestoreFocus() {
      onClose?.();
      requestAnimationFrame(() => triggerRef?.current?.focus());
    }

    function handlePointerDown(event) {
      if (
        menu?.contains(event.target) ||
        triggerRef?.current?.contains(event.target)
      )
        return;
      closeAndRestoreFocus();
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAndRestoreFocus();
        return;
      }

      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const items = [...(menu?.querySelectorAll('[role="menuitem"]') ?? [])];
      if (!items.length) return;
      event.preventDefault();
      const currentIndex = items.indexOf(document.activeElement);
      const delta = event.key === "ArrowDown" ? 1 : -1;
      items[(currentIndex + delta + items.length) % items.length]?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, triggerRef]);

  function run(action) {
    action?.();
    onClose?.();
    requestAnimationFrame(() => triggerRef?.current?.focus());
  }

  if (!placement) return null;

  return createPortal(
    <div
      id={id}
      className={`option-menu option-menu--${placement.direction}`}
      role="menu"
      ref={menuRef}
      style={{ top: placement.top, left: placement.left }}
      onClick={(event) => event.stopPropagation()}
    >
      {onEdit && (
        <button type="button" role="menuitem" onClick={() => run(onEdit)}>
          <span>수정하기</span>
          <span className="option-menu__pencil" aria-hidden="true">
            <img
              className="option-menu__pencil-body"
              src={pencilBodyIcon}
              alt=""
            />
            <img
              className="option-menu__pencil-detail"
              src={pencilDetailIcon}
              alt=""
            />
          </span>
        </button>
      )}
      {onDelete && (
        <button
          className="option-menu__delete"
          type="button"
          role="menuitem"
          onClick={() => run(onDelete)}
        >
          <span>삭제하기</span>
          <img src={trashIcon} alt="" aria-hidden="true" />
        </button>
      )}
    </div>,
    document.body,
  );
}
