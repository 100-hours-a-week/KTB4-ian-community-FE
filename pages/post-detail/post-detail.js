import { postsApi } from "../../scripts/api/posts-api.js";
import { mountLnb, getSessionUser } from "../../scripts/components/lnb.js";
import { ModalManager } from "../../scripts/components/modal-manager.js";
import { MenuManager } from "../../scripts/components/menu-manager.js";
import { BookmarkStore } from "../../scripts/stores/bookmark-store.js";
import { LikeStore } from "../../scripts/stores/like-store.js";
import { formatRelativeTime } from "../../scripts/utils/date.js";
import { ICONS, setToggleIcon } from "../../scripts/utils/icons.js";
import { isOwnedByUser } from "../../scripts/utils/ownership.js";
import { mountSettingsModals } from "../../scripts/components/settings-modals.js";

mountLnb({ activeItem: "feed" });
const postId = new URLSearchParams(location.search).get("postId") || "1";
const user = getSessionUser();
const modals = new ModalManager();
mountSettingsModals(modals);
const menus = new MenuManager();
const bookmarks = new BookmarkStore();
const likes = new LikeStore();
let post;
let selectedComment;
let editImageUrl;
let editPreviewUrl;
const detail = document.querySelector("[data-post-detail]");
const commentsRoot = document.querySelector("[data-comment-list]");
const commentForm = document.querySelector("[data-comment-form]");
const commentSubmit = commentForm.querySelector("button");
const postMoreButton = document.querySelector("[data-post-more]");
document
  .querySelector("[data-back]")
  .addEventListener("click", () =>
    history.length > 1
      ? history.back()
      : location.assign("../posts/posts.html"),
  );
function renderPost() {
  const author =
    post.authorName ?? post.author_name ?? post.nickname ?? "알 수 없음";
  const image = post.imageUrl ?? post.image_url;
  const liked = Boolean(post.liked);
  const saved = bookmarks.has(postId);
  detail.innerHTML = `<header class="post-detail__header"><div class="post-detail__meta-row"><div class="post-author"><img src="${post.profileImage ?? post.profile_image ?? "../../assets/images/profile-default.svg"}" alt=""><strong>${author}</strong></div><div class="post-detail__header-tools"><p class="post-author__date typography-label2-normal-regular">조회 ${post.viewCount ?? post.view_count ?? 0} · ${formatRelativeTime(post.createdAt ?? post.created_at)}</p></div></div></header>${image ? `<img class="post-detail__media" src="${image}" alt="피드 첨부 이미지">` : ""}<p class="post-detail__content">${post.content || post.title || ""}</p><footer class="post-stats"><button class="post-stat" data-like aria-label="좋아요" aria-pressed="${liked}"><img src="${liked ? ICONS.like.active : ICONS.like.inactive}" alt=""><span>${post.likeCount ?? post.like_count ?? 0}</span></button><span class="post-stat"><img src="${ICONS.comment}" alt=""><span data-comment-count>${(post.comment ?? post.comments ?? []).length}</span></span><button class="post-stat post-stat--bookmark" data-bookmark aria-label="북마크" aria-pressed="${saved}"><img src="${saved ? ICONS.bookmark.active : ICONS.bookmark.inactive}" alt=""></button></footer>`;
  postMoreButton.hidden = !isOwnedByUser(post, user);
  document.title = `${String(post.content || post.title || "피드").slice(0, 24)} | PULSE`;
  detail
    .querySelector("[data-like]")
    .addEventListener("click", async (event) => {
      const button = event.currentTarget;
      const active = button.getAttribute("aria-pressed") !== "true";
      setToggleIcon(button, active, ICONS.like);
      try {
        const result = await postsApi.toggleLike(postId);
        post.liked = result?.liked ?? active;
        post.likeCount =
          result?.like_count ??
          result?.likeCount ??
          Number(button.querySelector("span").textContent) + (active ? 1 : -1);
        likes.set(postId, post.liked, post.likeCount);
        setToggleIcon(button, post.liked, ICONS.like);
        button.querySelector("span").textContent = post.likeCount;
      } catch {
        setToggleIcon(button, !active, ICONS.like);
      }
    });
  detail
    .querySelector("[data-bookmark]")
    .addEventListener("click", (event) =>
      setToggleIcon(
        event.currentTarget,
        bookmarks.toggle({ ...post, postId }),
        ICONS.bookmark,
      ),
    );
}
function commentNode(comment) {
  const id = comment.commentId ?? comment.comment_id;
  const content = comment.content ?? comment.comment;
  const authorName = comment.authorName ?? comment.nickname ?? "알 수 없음";
  const profileImage =
    comment.profileImage ??
    comment.profile_image ??
    "../../assets/images/profile-default.svg";
  const node = document.createElement("article");
  node.className = "comment";
  node.dataset.commentId = id;
  const optionButton = isOwnedByUser(comment, user)
    ? `<button class="icon-button" data-comment-more aria-label="댓글 옵션" aria-expanded="false"><img src="${ICONS.more}" alt=""></button>`
    : "";
  node.innerHTML = `<img class="comment__avatar" src="${profileImage}" alt=""><div><div class="comment__header"><strong>${authorName}</strong></div><p class="comment__text">${content}</p></div>${optionButton}`;
  node
    .querySelector("[data-comment-more]")
    ?.addEventListener("click", (event) =>
      menus.open({
        anchor: event.currentTarget,
        menu: document.querySelector("[data-option-menu]"),
        context: {
          type: "comment",
          id,
          content,
          authorName,
          profileImage,
          node,
        },
      }),
    );
  return node;
}
function renderComments() {
  commentsRoot.replaceChildren(
    ...(post.comment ?? post.comments ?? []).map(commentNode),
  );
}
async function load() {
  try {
    post = likes.merge(await postsApi.detail(postId));
    renderPost();
    renderComments();
  } catch (error) {
    detail.innerHTML = `<div class="empty-state"><p>${error.message}</p></div>`;
  }
}
commentForm.elements.comment.addEventListener(
  "input",
  () => (commentSubmit.disabled = !commentForm.elements.comment.value.trim()),
);
commentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = commentForm.elements.comment.value.trim();
  if (!content) return;
  commentSubmit.disabled = true;
  try {
    const result = await postsApi.createComment(
      postId,
      user.userId || 0,
      content,
    );
    const comment = {
      commentId: typeof result === "number" ? result : result.comment_id,
      comment: content,
      nickname: user.nickname,
      profileImage: user.profileImage,
      createdAt: new Date().toISOString(),
    };
    (post.comment ??= []).push(comment);
    commentsRoot.append(commentNode(comment));
    commentForm.reset();
    detail.querySelector("[data-comment-count]").textContent =
      post.comment.length;
  } catch (error) {
    document.querySelector("[data-comment-error]").textContent = error.message;
    commentSubmit.disabled = false;
  }
});
const optionMenu = document.querySelector("[data-option-menu]");
const editCommentModal = document.querySelector("[data-edit-comment-modal]");
const editCommentForm = document.querySelector("#edit-comment-form");
const editPostModal = document.querySelector("[data-edit-post]");
const editPostForm = document.querySelector("#edit-post-form");
postMoreButton.addEventListener("click", (event) =>
  menus.open({
    anchor: event.currentTarget,
    menu: optionMenu,
    context: { type: "post" },
  }),
);
optionMenu.querySelector("[data-menu-edit]").addEventListener("click", () => {
  const context = menus.context;
  menus.close();
  if (context.type === "post") {
    editPostForm.elements.content.value = post.content || "";
    editPostForm.querySelector("[data-edit-post-avatar]").src =
      post.profileImage ??
      post.profile_image ??
      "../../assets/images/profile-default.svg";
    editPostForm.querySelector("[data-edit-post-author]").textContent =
      post.authorName ?? post.author_name ?? post.nickname ?? "알 수 없음";
    editImageUrl = post.imageUrl ?? post.image_url ?? null;
    const preview = editPostForm.querySelector("[data-edit-image-preview]");
    preview.src = editImageUrl || "";
    preview.hidden = !editImageUrl;
    editPostForm.elements.image.value = "";
    document.querySelector("[data-edit-post-submit]").disabled = true;
    modals.open(editPostModal);
    editPostForm.elements.content.focus();
  } else {
    selectedComment = context;
    editCommentForm.elements.comment.value = context.content;
    editCommentModal.querySelector("[data-edit-comment-avatar]").src =
      context.profileImage;
    editCommentModal.querySelector("[data-edit-comment-author]").textContent =
      context.authorName;
    modals.open(editCommentModal);
    editCommentForm.elements.comment.focus();
  }
});
function updateEditSubmitState() {
  document.querySelector("[data-edit-post-submit]").disabled =
    editPostForm.elements.content.value.trim() === (post.content || "") &&
    !editPostForm.elements.image.files[0];
}
editPostForm.elements.content.addEventListener("input", updateEditSubmitState);
editPostForm.elements.image.addEventListener("change", () => {
  const file = editPostForm.elements.image.files[0];
  if (!file) return;
  if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
  editPreviewUrl = URL.createObjectURL(file);
  const preview = editPostForm.querySelector("[data-edit-image-preview]");
  preview.src = editPreviewUrl;
  preview.hidden = false;
  updateEditSubmitState();
});
editPostForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await postsApi.update(postId, {
      title: post.title || "피드",
      content: editPostForm.elements.content.value.trim(),
      imageUrl: editImageUrl,
    });
    post.content = editPostForm.elements.content.value.trim();
    if (editPreviewUrl) {
      post.imageUrl = editPreviewUrl;
      editPreviewUrl = null;
    }
    modals.close("success");
    renderPost();
  } catch (error) {
    document.querySelector("[data-edit-post-error]").textContent =
      error.message;
  }
});
editCommentForm.elements.comment.addEventListener(
  "input",
  () =>
    (document.querySelector("[data-edit-comment-submit]").disabled =
      !editCommentForm.elements.comment.value.trim() ||
      editCommentForm.elements.comment.value.trim() ===
        selectedComment?.content),
);
editCommentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = editCommentForm.elements.comment.value.trim();
  try {
    await postsApi.updateComment(
      postId,
      selectedComment.id,
      user.userId || 0,
      content,
    );
    selectedComment.node.querySelector(".comment__text").textContent = content;
    modals.close("success");
  } catch (error) {
    document.querySelector("[data-edit-comment-error]").textContent =
      error.message;
  }
});
document
  .querySelectorAll("[data-close-modal]")
  .forEach((button) =>
    button.addEventListener("click", () => modals.close("cancel")),
  );
const confirmModal = document.querySelector("[data-confirm-modal]");
let confirmAction;
function confirmDelete(type, action) {
  document.querySelector("[data-confirm-title]").textContent =
    `${type} 삭제 하실건가요?`;
  document.querySelector("[data-confirm-description]").textContent =
    `삭제된 ${type}은 복구할 수 없습니다.`;
  confirmAction = action;
  modals.open(confirmModal);
}
optionMenu.querySelector("[data-menu-delete]").addEventListener("click", () => {
  const context = menus.context;
  menus.close();
  if (context.type === "post")
    confirmDelete("피드", async () => {
      await postsApi.remove(postId);
      location.assign("../posts/posts.html");
    });
  else
    confirmDelete("댓글", async () => {
      await postsApi.removeComment(postId, context.id, user.userId || 0);
      context.node.remove();
    });
});
document
  .querySelector("[data-confirm-cancel]")
  .addEventListener("click", () => modals.close("cancel"));
document
  .querySelector("[data-confirm-action]")
  .addEventListener("click", async () => {
    try {
      await confirmAction();
      modals.close("success");
    } catch (error) {
      document.querySelector("[data-confirm-description]").textContent =
        error.message;
    }
  });
load();
