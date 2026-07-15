import { postsApi } from "../../scripts/api/posts-api.js";
import { usersApi } from "../../scripts/api/users-api.js";
import { ModalManager } from "../../scripts/components/modal-manager.js";
import {
  createFeedCard,
  sortPostsByLatest,
} from "../../scripts/components/feed-card.js";
import { getSessionUser, mountLnb } from "../../scripts/components/lnb.js";
import { BookmarkStore } from "../../scripts/stores/bookmark-store.js";
import { LikeStore } from "../../scripts/stores/like-store.js";
import { clearSession } from "../../scripts/auth/session.js";
import { mountSettingsModals } from "../../scripts/components/settings-modals.js";

const list = document.querySelector("[data-post-list]");
const store = new BookmarkStore();
const likes = new LikeStore();
const modals = new ModalManager();
mountSettingsModals(modals);
const createModal = document.querySelector("[data-create-modal]");
const form = document.querySelector("#create-form");
const submit = document.querySelector("[data-submit-create]");
function openCreate() {
  const user = getSessionUser();
  document.querySelector("[data-editor-avatar]").src =
    user.profileImage || "../../assets/images/profile-default.svg";
  document.querySelector("[data-editor-name]").textContent =
    user.nickname || "알 수 없음";
  modals.open(createModal);
  form.elements.content.focus();
}
mountLnb({ activeItem: "feed", onCreateFeed: openCreate });
document
  .querySelector("[data-open-create]")
  .addEventListener("click", openCreate);
document
  .querySelector("[data-close-create]")
  .addEventListener("click", () => modals.close("cancel"));
form.elements.content.addEventListener("input", () => {
  submit.disabled =
    !form.elements.content.value.trim() && !form.elements.image.files[0];
});
let previewUrl;
form.elements.image.addEventListener("change", () => {
  const file = form.elements.image.files[0];
  const error = document.querySelector("[data-create-error]");
  if (!file) return;
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 10 * 1024 * 1024
  ) {
    error.textContent =
      "PNG, JPEG, WebP 형식의 10MB 이하 이미지만 선택해 주세요.";
    form.elements.image.value = "";
    return;
  }
  error.textContent = "";
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  const preview = document.querySelector("[data-image-preview]");
  preview.src = previewUrl;
  preview.hidden = false;
  submit.disabled = false;
  form.elements.image.disabled = true;
  form.elements.image.previousElementSibling.setAttribute(
    "aria-disabled",
    "true",
  );
});
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submit.disabled = true;
  const user = getSessionUser();
  try {
    await postsApi.create(user.userId || 0, {
      content: form.elements.content.value.trim(),
      imageUrl: null,
    });
    modals.close("success");
    form.elements.image.disabled = false;
    form.elements.image.previousElementSibling.removeAttribute("aria-disabled");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    form.reset();
    document.querySelector("[data-image-preview]").hidden = true;
    await load();
  } catch (error) {
    document.querySelector("[data-create-error]").textContent = error.message;
    submit.disabled = false;
  }
});
function empty() {
  list.innerHTML = `<div class="empty-state"><div><img class="empty-state__logo" src="../../assets/images/logo.png" alt="PULSE"><p>아직 피드가 생성된 피드가 없어요</p></div></div>`;
}
function render(posts) {
  if (!posts.length) return empty();
  list.replaceChildren(
    ...sortPostsByLatest(posts).map((rawPost) => {
      const post = likes.merge(rawPost);
      return createFeedCard(post, {
        bookmarked: store.has(post.postId ?? post.post_id),
        onLike: async (item) => {
          const result = await postsApi.toggleLike(item.postId);
          const liked = result?.liked ?? item.liked;
          const likeCount =
            result?.likeCount ?? result?.like_count ?? item.likeCount;
          likes.set(item.postId, liked, likeCount);
          return { ...result, liked, likeCount };
        },
        onBookmark: (item) => store.toggle(item),
      });
    }),
  );
}
async function load() {
  list.innerHTML = `<div class="empty-state"><p>피드를 불러오는 중입니다.</p></div>`;
  try {
    const result = await postsApi.list();
    render(Array.isArray(result) ? result : result?.content || []);
  } catch (error) {
    list.innerHTML = `<div class="empty-state"><div><p>${error.message}</p><button class="button button--outline" data-retry>다시 시도</button></div></div>`;
    list.querySelector("[data-retry]")?.addEventListener("click", load);
  }
}
const logoutModal = document.querySelector("[data-logout-modal]");
globalThis.addEventListener("community:request-logout", () =>
  modals.open(logoutModal),
);
document
  .querySelector("[data-cancel-logout]")
  .addEventListener("click", () => modals.close());
document
  .querySelector("[data-confirm-logout]")
  .addEventListener("click", async () => {
    try {
      await usersApi.logout();
    } finally {
      clearSession();
      location.assign("../login/login.html");
    }
  });
if (new URLSearchParams(location.search).get("modal") === "create-feed")
  openCreate();
load();
