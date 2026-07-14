import { mountLnb } from "../../scripts/components/lnb.js";
import { createFeedCard } from "../../scripts/components/feed-card.js";
import { BookmarkStore } from "../../scripts/stores/bookmark-store.js";
import { postsApi } from "../../scripts/api/posts-api.js";
import { mountSettingsModals } from "../../scripts/components/settings-modals.js";

mountLnb({ activeItem: "bookmarks" });
mountSettingsModals();
const store = new BookmarkStore(); const root = document.querySelector("[data-bookmark-list]");
function empty() { root.innerHTML = `<div class="empty-state"><div><img class="empty-state__logo" src="../../assets/images/logo.png" alt="PULSE"><p class="typography-body3-normal-regular">아직 저장한 피드가 없어요</p></div></div>`; }
async function render() {
  const saved = store.all(); if (!saved.length) return empty();
  let serverPosts = []; try { const result = await postsApi.list(); serverPosts = Array.isArray(result) ? result : result?.content || []; } catch { /* snapshots are the offline fallback */ }
  const items = saved.map((snapshot) => serverPosts.find((post) => String(post.postId ?? post.post_id) === String(snapshot.postId)) || snapshot);
  root.replaceChildren(...items.map((post) => createFeedCard(post, { bookmarked: true, onLike: (item) => postsApi.toggleLike(item.postId), onBookmark: (item) => { store.toggle(item); render(); return false; } })));
}
render();
