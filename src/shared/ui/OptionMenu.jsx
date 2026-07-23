import { useEffect, useRef } from "react";
import {
  pencilBodyIcon,
  pencilDetailIcon,
  trashIcon,
} from "../assets/index.js";

export function OptionMenu({ onEdit, onDelete, onClose, triggerRef }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const menu = menuRef.current;
    menu?.querySelector('[role="menuitem"]')?.focus();

    function handlePointerDown(event) {
      if (
        menu?.contains(event.target) ||
        triggerRef?.current?.contains(event.target)
      )
        return;
      onClose?.();
    }

    function handleKeyDown(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose?.();
      triggerRef?.current?.focus();
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
  }

  return (
    <div
      className="option-menu"
      role="menu"
      ref={menuRef}
      onClick={(event) => event.stopPropagation()}
    >
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
      <button
        className="option-menu__delete"
        type="button"
        role="menuitem"
        onClick={() => run(onDelete)}
      >
        <span>삭제하기</span>
        <img src={trashIcon} alt="" aria-hidden="true" />
      </button>
    </div>
  );
}
