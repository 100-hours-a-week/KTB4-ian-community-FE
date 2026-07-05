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

const fallbackPost = {
  postId,
  title: "첫 번째 게시글 제목입니다.",
  authorName: "더미 작성자 1",
  createdAt: "2026-07-05 12:00",
  content:
    "게시글 내용입니다.\n\n이 영역에는 서버에서 조회한 게시글 본문이 표시됩니다.",
  likeCount: 5,
  viewCount: 123,
  commentCount: 2,
  comments: [
    {
      commentId: 1,
      authorName: "댓글 작성자 1",
      content: "첫 번째 댓글입니다.",
      createdAt: "2026-07-05 12:30",
    },
    {
      commentId: 2,
      authorName: "댓글 작성자 2",
      content: "두 번째 댓글입니다.",
      createdAt: "2026-07-05 13:10",
    },
  ],
};

function renderPost(post) {
  elements.title.textContent = post.title;
  elements.authorName.textContent = post.authorName ?? "알 수 없음";
  elements.createdAt.textContent = post.createdAt ?? "";
  elements.content.textContent = post.content ?? "";
  elements.likeCount.textContent = post.likeCount ?? 0;
  elements.viewCount.textContent = post.viewCount ?? 0;
  elements.commentCount.textContent =
    post.commentCount ?? post.comments?.length ?? 0;
  elements.updateLink.href =
    `../post-update/post-update.html?postId=${postId}`;

  if (post.profileImageUrl) {
    elements.authorImage.src = post.profileImageUrl;
  }

  if (post.imageUrl) {
    elements.image.src = post.imageUrl;
  }

  renderComments(post.comments ?? []);
  document.title = `${post.title} | 아무 말 대잔치`;
}

function createCommentElement(comment) {
  const article = document.createElement("article");
  article.className = "comment";
  article.dataset.commentId = comment.commentId;

  article.innerHTML = `
    <img
      class="comment__avatar"
      src="../../assets/images/profile-default.svg"
      alt=""
    >
    <div>
      <div class="comment__header">
        <span class="comment__author">${comment.authorName ?? "알 수 없음"}</span>
        <time class="comment__date">${comment.createdAt ?? ""}</time>
      </div>
      <p class="comment__text">${comment.content}</p>
    </div>
    <div class="comment__actions">
      <button class="button button--small button--dark" type="button">
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
    const post = await apiRequest(`/api/posts/${postId}`);
    renderPost(post);
  } catch (error) {
    console.warn(error.message);
    renderPost(fallbackPost);
  }
}

document
  .querySelector("[data-like-button]")
  .addEventListener("click", async () => {
    try {
      const response = await apiRequest(`/api/posts/${postId}/likes`, {
        method: "POST",
      });

      elements.likeCount.textContent =
        response?.likeCount ?? Number(elements.likeCount.textContent) + 1;
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
    const comment = await apiRequest(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });

    elements.commentList.append(createCommentElement(comment));
    elements.commentCount.textContent =
      Number(elements.commentCount.textContent) + 1;
    commentInput.value = "";
  } catch (error) {
    showToast(error.message);
  }
});

elements.commentList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete-comment]");

  if (!button) {
    return;
  }

  const commentElement = button.closest("[data-comment-id]");
  const commentId = commentElement.dataset.commentId;

  try {
    await apiRequest(`/api/comments/${commentId}`, { method: "DELETE" });
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
    await apiRequest(`/api/posts/${postId}`, { method: "DELETE" });
    window.location.href = "../posts/posts.html";
  } catch (error) {
    deleteModal.classList.remove("is-open");
    showToast(error.message);
  }
});

loadPost();
