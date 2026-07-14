const STORAGE_KEY = "community.bookmarks.v1";

export class BookmarkStore extends EventTarget {
  constructor(storage = globalThis.localStorage) {
    super();
    this.storage = storage;
    this.handleStorage = (event) => { if (event.key === STORAGE_KEY) this.dispatchEvent(new CustomEvent("change", { detail: { external: true } })); };
    globalThis.addEventListener?.("storage", this.handleStorage);
  }

  all() {
    try { return JSON.parse(this.storage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  }

  has(postId) { return this.all().some((item) => String(item.postId) === String(postId)); }

  remove(postId) { if (!this.has(postId)) return false; this.toggle({ postId }); return true; }

  subscribe(listener) { const handler = (event) => listener(event.detail, this.all()); this.addEventListener("change", handler); return () => this.removeEventListener("change", handler); }

  destroy() { globalThis.removeEventListener?.("storage", this.handleStorage); }

  toggle(post) {
    const items = this.all();
    const index = items.findIndex((item) => String(item.postId) === String(post.postId));
    const bookmarked = index < 0;
    if (bookmarked) items.unshift(post); else items.splice(index, 1);
    this.storage.setItem(STORAGE_KEY, JSON.stringify(items));
    this.dispatchEvent(new CustomEvent("change", { detail: { postId: post.postId, bookmarked } }));
    return bookmarked;
  }
}
