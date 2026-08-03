import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  lnbReceiptFillVector,
  lnbReceiptStrokeVector,
  pencilBodyIcon,
  pencilDetailIcon,
  trashIcon,
} from "../assets/index.js";

export function OptionMenu({
  onBookmark,
  bookmarked = false,
  bookmarkPending = false,
  onEdit,
  onDelete,
  onClose,
  triggerRef,
  placement = "header",
}) {
  const menuRef = useRef(null);
  const [openAbove, setOpenAbove] = useState(false);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    const trigger = triggerRef?.current;
    if (!menu || !trigger) return undefined;

    function updatePosition() {
      const triggerRect = trigger.getBoundingClientRect();
      const menuHeight = menu.getBoundingClientRect().height;
      const viewportPadding = 8;
      const availableBelow =
        window.innerHeight - triggerRect.bottom - viewportPadding;
      setOpenAbove(availableBelow < menuHeight);
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [triggerRef]);

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

  function run(action, restoreTriggerFocus = false) {
    action?.();
    onClose?.();
    if (restoreTriggerFocus) {
      triggerRef?.current?.focus();
    }
  }

  return (
    <div
      className={`option-menu option-menu--${placement}${
        openAbove ? " option-menu--above" : ""
      }`}
      role="menu"
      ref={menuRef}
      onClick={(event) => event.stopPropagation()}
    >
      {onBookmark && (
        <button
          type="button"
          role="menuitem"
          aria-pressed={bookmarked}
          disabled={bookmarkPending}
          onClick={() => run(onBookmark, true)}
        >
          <span>{bookmarked ? "저장 취소" : "저장하기"}</span>
          <span className="option-menu__receipt" aria-hidden="true">
            <img
              src={bookmarked ? lnbReceiptFillVector : lnbReceiptStrokeVector}
              alt=""
            />
          </span>
        </button>
      )}

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
    </div>
  );
}
