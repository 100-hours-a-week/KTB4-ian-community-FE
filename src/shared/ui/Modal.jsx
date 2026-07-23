import { useEffect, useId, useRef } from "react";

const modalStack = [];

const FOCUSABLE = [
  "button:not(:disabled)",
  "input:not(:disabled)",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  "a[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function focusableElements(container) {
  return Array.from(container?.querySelectorAll("*") ?? []).filter(
    (element) =>
      element.matches(FOCUSABLE) &&
      !element.hidden &&
      element.getAttribute("aria-hidden") !== "true",
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  className = "",
  closeOnBackdrop = true,
  closeOnEscape = true,
}) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const tokenRef = useRef(Symbol("modal"));
  const closeRef = useRef(onClose);
  const reactId = useId();
  const titleId = `modal-title-${reactId.replaceAll(":", "")}`;
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const token = tokenRef.current;
    previousFocusRef.current = document.activeElement;
    modalStack.push(token);
    document.body.classList.add("is-modal-open");
    const items = focusableElements(dialogRef.current);
    const initialFocus =
      dialogRef.current?.querySelector("[data-autofocus]") ?? items?.[0];
    (initialFocus ?? dialogRef.current)?.focus();
    const onKeyDown = (event) => {
      if (modalStack.at(-1) !== token) return;
      if (event.key === "Escape" && closeOnEscape) {
        event.preventDefault();
        closeRef.current?.("escape");
      }
      if (event.key !== "Tab") return;
      const currentItems = focusableElements(dialogRef.current);
      if (!currentItems?.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = currentItems[0];
      const last = currentItems[currentItems.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const index = modalStack.lastIndexOf(token);
      if (index >= 0) modalStack.splice(index, 1);
      document.body.classList.toggle("is-modal-open", modalStack.length > 0);
      const previousFocus = previousFocusRef.current;
      requestAnimationFrame(() => {
        if (previousFocus?.isConnected) previousFocus.focus();
      });
    };
  }, [open, closeOnEscape]);

  if (!open) return null;
  return (
    <div
      className="modal"
      onMouseDown={(event) =>
        event.target === event.currentTarget &&
        closeOnBackdrop &&
        modalStack.at(-1) === tokenRef.current &&
        closeRef.current?.("backdrop")
      }
    >
      <section
        ref={dialogRef}
        className={`modal__dialog ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <h2 className="sr-only" id={titleId}>
          {title}
        </h2>
        {children}
      </section>
    </div>
  );
}
