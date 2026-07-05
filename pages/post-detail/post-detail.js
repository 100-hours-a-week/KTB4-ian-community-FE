import {
  apiRequest,
  getQueryParam,
  initBackButton,
  initLogout,
  initProfileMenu,
  showToast,
} from "../../scripts/common.js";

initProfileMenu();
initLogout();
initBackButton("../posts/posts.html");

const postId = getQueryParam("postId") ?? "1";
const userId = getQueryParam("userId") ?? sessionStorage.getItem("userId") ?? "1";
let currentUser = null;
let currentPostLiked = false;

const elements = {
  title: document.querySelector("[data-post-title]"),
  authorName: document.querySelector("[data-author-name]"),
  authorImage: document.querySelector("[data-author-image]"),
  createdAt: document.querySelector("[data-created-at]"),
  image: document.querySelector("[data-post-image]"),
  content: document.querySelector("[data-post-content]"),
  likeCount: document.querySelector("[data-like-count]"),
  viewCount: document.querySelector("[data-view-count]"),
  commentCount: document.querySelector("[data-comment-count]"),
  updateLink: document.querySelector("[data-update-link]"),
  commentList: document.querySelector("[data-comment-list]"),
};

function renderPost(post) {
  const authorName = post.authorName ?? post.author_name ?? post.nickname;
  const createdAt = post.createdAt ?? post.created_at;
  const likeCount = post.likeCount ?? post.like_count;
  const viewCount = post.viewCount ?? post.view_count;
  const commentCount = post.commentCount ?? post.comment_count;
  const comments = post.comments ?? post.comment ?? [];
  const profileImage =
    post.profileImageUrl ?? post.profileImage ?? post.profile_image;
  const imageUrl = post.imageUrl ?? post.image_url;
  currentPostLiked = Boolean(post.liked);

  elements.title.textContent = post.title;
  elements.authorName.textContent = authorName ?? "알 수 없음";
  elements.createdAt.textContent = createdAt ?? "";
  elements.content.textContent = post.content ?? "";
  elements.likeCount.textContent = likeCount ?? 0;
  elements.viewCount.textContent = viewCount ?? 0;
  elements.commentCount.textContent = commentCount ?? comments.length ?? 0;
  elements.updateLink.href =
    `../post-update/post-update.html?postId=${postId}`;

  if (profileImage) {
    elements.authorImage.src = profileImage;
  }

  elements.image.closest(".post-detail__image").hidden = !imageUrl;

  if (imageUrl) {
    elements.image.src = imageUrl;
  }

  renderComments(comments);
  document.title = `${post.title} | 아무 말 대잔치`;
}

function createCommentElement(comment) {
  const commentId = comment.commentId ?? comment.comment_id;
  const authorName = comment.authorName ?? comment.author_name ?? comment.nickname;
  const createdAt = comment.createdAt ?? comment.created_at;
  const content = comment.content ?? comment.comment;
  const profileImage =
    comment.profileImageUrl ?? comment.profileImage ?? comment.profile_image;
  const article = document.createElement("article");
  article.className = "comment";
  article.dataset.commentId = commentId;

  article.innerHTML = `
    <img
      class="comment__avatar"
      src="${profileImage ?? "../../assets/images/profile-default.svg"}"
      alt=""
    >
    <div>
      <div class="comment__header">
        <span class="comment__author">${authorName ?? "알 수 없음"}</span>
        <time class="comment__date">${createdAt ?? ""}</time>
      </div>
      <p class="comment__text">${content}</p>
    </div>
    <div class="comment__actions">
      <button class="button button--small button--dark" type="button" data-edit-comment>
        수정
      </button>
      <button
        class="button button--small button--dark"
        type="button"
        data-delete-comment
      >
        삭제
      </button>
    </div>
  `;

  return article;
}

function renderComments(comments) {
  elements.commentList.replaceChildren(...comments.map(createCommentElement));
}

async function loadPost() {
  try {
    const post = await apiRequest(`/api/posts/${postId}?userId=${userId}`);
    renderPost(post);
  } catch (error) {
    console.warn(error.message);
    showToast(error.message);
  }
}

async function loadCurrentUser() {
  try {
    currentUser = await apiRequest(`/api/users/${userId}`);
    sessionStorage.setItem("nickname", currentUser.nickname ?? "");
    if (currentUser.profileImage) {
      sessionStorage.setItem("profileImage", currentUser.profileImage);
    }
  } catch (error) {
    console.warn(error.message);
  }
}

document
  .querySelector("[data-like-button]")
  .addEventListener("click", async () => {
    try {
      const response = await apiRequest(`/api/posts/${postId}/likes?userId=${userId}`, {
        method: "POST",
      });

      currentPostLiked = Boolean(response?.liked);
      elements.likeCount.textContent =
        response?.like_count ?? response?.likeCount ?? Number(elements.likeCount.textContent) + 1;
    } catch (error) {
      showToast(error.message);
    }
  });

const commentForm = document.querySelector("[data-comment-form]");
const commentInput = document.querySelector("[data-comment-input]");

commentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const content = commentInput.value.trim();

  if (!content) {
    return;
  }

  try {
    const response = await apiRequest(`/api/posts/${postId}/comments/users/${userId}`, {
      method: "POST",
      body: JSON.stringify({ comment: content }),
    });
    const comment = {
      comment_id: typeof response === "number" ? response : response?.comment_id,
      comment: content,
      nickname: currentUser?.nickname ?? sessionStorage.getItem("nickname") ?? "알 수 없음",
      profile_image: currentUser?.profileImage ?? sessionStorage.getItem("profileImage"),
      created_at: new Date().toISOString(),
    };

    elements.commentList.append(createCommentElement(comment));
    elements.commentCount.textContent =
      Number(elements.commentCount.textContent) + 1;
    commentInput.value = "";
  } catch (error) {
    showToast(error.message);
  }
});

elements.commentList.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-comment]");
  const deleteButton = event.target.closest("[data-delete-comment]");

  if (!editButton && !deleteButton) {
    return;
  }

  const commentElement = event.target.closest("[data-comment-id]");
  const commentId = commentElement.dataset.commentId;
  const commentText = commentElement.querySelector(".comment__text");

  if (editButton) {
    const nextComment = window.prompt("댓글을 수정해주세요.", commentText.textContent)?.trim();

    if (!nextComment || nextComment === commentText.textContent) {
      return;
    }

    try {
      await apiRequest(`/api/posts/${postId}/comments/${commentId}/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ comment: nextComment }),
      });
      commentText.textContent = nextComment;
    } catch (error) {
      showToast(error.message);
    }

    return;
  }

  try {
    await apiRequest(`/api/posts/${postId}/comments/${commentId}/users/${userId}`, {
      method: "DELETE",
    });
    commentElement.remove();
    elements.commentCount.textContent = Math.max(
      0,
      Number(elements.commentCount.textContent) - 1,
    );
  } catch (error) {
    showToast(error.message);
  }
});

const deleteModal = document.querySelector("[data-delete-modal]");

document.querySelector("[data-delete-post]").addEventListener("click", () => {
  deleteModal.classList.add("is-open");
});

document.querySelector("[data-cancel-delete]").addEventListener("click", () => {
  deleteModal.classList.remove("is-open");
});

document.querySelector("[data-confirm-delete]").addEventListener("click", async () => {
  try {
    await apiRequest(`/api/posts/${postId}?userId=${userId}`, { method: "DELETE" });
    window.location.href = "../posts/posts.html";
  } catch (error) {
    deleteModal.classList.remove("is-open");
    showToast(error.message);
  }
});

loadCurrentUser().finally(loadPost);
