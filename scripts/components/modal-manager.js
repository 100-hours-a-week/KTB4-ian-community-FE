const FOCUSABLE = "button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

export class ModalManager {
  constructor(root = document) {
    this.root = root;
    this.stack = [];
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  get activeModal() { return this.stack.at(-1)?.modal || null; }

  open(modal, trigger = this.root.activeElement) {
    if (!modal) return;
    const previous = this.activeModal;
    if (previous) previous.hidden = true;
    this.stack.push({ modal, trigger });
    modal.hidden = false;
    modal.classList.add("is-open");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    this.root.body?.classList.add("is-modal-open");
    this.root.addEventListener("keydown", this.handleKeydown);
    modal.addEventListener("click", this.handleBackdrop);
    (modal.querySelector(FOCUSABLE) || modal).focus();
  }

  handleBackdrop = (event) => { if (event.target === event.currentTarget) this.close("backdrop"); };

  close(reason = "programmatic") {
    const entry = this.stack.pop();
    if (!entry) return;
    entry.modal.classList.remove("is-open");
    entry.modal.hidden = true;
    entry.modal.removeEventListener("click", this.handleBackdrop);
    const previous = this.activeModal;
    if (previous) { previous.hidden = false; previous.classList.add("is-open"); }
    else { this.root.body?.classList.remove("is-modal-open"); this.root.removeEventListener("keydown", this.handleKeydown); }
    entry.trigger?.focus?.();
    return reason;
  }

  closeAll() { while (this.stack.length) this.close("all"); }

  handleKeydown(event) {
    if (event.key === "Escape") return this.close("escape");
    if (event.key !== "Tab" || !this.activeModal) return;
    const focusable = [...this.activeModal.querySelectorAll(FOCUSABLE)];
    if (!focusable.length) return event.preventDefault();
    const first = focusable[0]; const last = focusable.at(-1);
    if (event.shiftKey && this.root.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && this.root.activeElement === last) { event.preventDefault(); first.focus(); }
  }
}
