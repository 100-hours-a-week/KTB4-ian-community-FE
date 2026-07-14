export class MenuManager {
  constructor(root = document) {
    this.root = root;
    this.handleOutside = this.handleOutside.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  open({ anchor, menu, context = {} }) {
    this.close(); this.anchor = anchor; this.menu = menu; this.context = context;
    menu.hidden = false; anchor.setAttribute("aria-expanded", "true");
    this.position();
    this.root.addEventListener("click", this.handleOutside);
    this.root.addEventListener("keydown", this.handleKeydown);
    globalThis.addEventListener?.("resize", this.closeBound ||= () => this.close());
    globalThis.addEventListener?.("scroll", this.closeBound, true);
  }

  position() {
    const rect = this.anchor.getBoundingClientRect();
    Object.assign(this.menu.style, { position: "fixed", left: `${rect.right - 160}px`, top: `${rect.bottom + 4}px` });
  }

  handleOutside(event) { if (!this.menu?.contains(event.target) && !this.anchor?.contains(event.target)) this.close(); }
  handleKeydown(event) { if (event.key === "Escape") this.close(); }
  close() {
    if (!this.menu) return;
    this.menu.hidden = true; this.anchor?.setAttribute("aria-expanded", "false");
    this.root.removeEventListener("click", this.handleOutside); this.root.removeEventListener("keydown", this.handleKeydown);
    globalThis.removeEventListener?.("resize", this.closeBound); globalThis.removeEventListener?.("scroll", this.closeBound, true);
    this.menu = null; this.anchor = null;
  }
}
