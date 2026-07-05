import {
  apiRequest,
  formatCount,
  initLogout,
  initProfileMenu,
} from "../../scripts/common.js";

initProfileMenu();
initLogout();

const postList = document.querySelector("[data-post-list]");
const userId = sessionStorage.getItem("userId");

function createPostCard(post) {
  const postId = post.postId ?? post.post_id;
  const likeCount = post.likeCount ?? post.like_count;
  const commentCount = post.commentCount ?? post.comment_count;
  const viewCount = post.viewCount ?? post.view_count;
  const authorName = post.authorName ?? post.author_name ?? post.nickname;
  const createdAt = post.createdAt ?? post.created_at;
  const profileImage = post.profileImage ?? post.profile_image;
  const article = document.createElement("article");
  article.className = "post-card card";

  article.innerHTML = `
    <a
      class="post-card__link"
      href="../post-detail/post-detail.html?postId=${postId}${userId ? `&userId=${userId}` : ""}"
    >
      <div class="post-card__body">
        <h3 class="post-card__title">${post.title}</h3>
        <div class="post-card__meta">
          <div class="post-card__counts">
            <span>좋아요 ${formatCount(likeCount)}</span>
            <span>댓글 ${formatCount(commentCount)}</span>
            <span>조회수 ${formatCount(viewCount)}</span>
          </div>
          <time>${createdAt ?? ""}</time>
        </div>
      </div>
      <div class="post-card__author">
        <img src="${profileImage ?? "../../assets/images/profile-default.svg"}" alt="">
        <span>${authorName ?? "알 수 없음"}</span>
      </div>
    </a>
  `;

  return article;
}

function renderPosts(posts) {
  if (!posts.length) {
    postList.innerHTML = `<p class="helper-text">작성된 게시글이 없습니다.</p>`;
    return;
  }

  postList.replaceChildren(...posts.map(createPostCard));
}

async function loadPosts() {
  try {
    const response = await apiRequest("/api/posts");
    const posts = Array.isArray(response)
      ? response
      : response?.data?.content ?? response?.content;

    renderPosts(posts ?? []);
  } catch (error) {
    console.error(error);
  
    postList.innerHTML = `
      <p class="helper-text">
        ${error.message}
      </p>
    `;
  }
}

loadPosts();
