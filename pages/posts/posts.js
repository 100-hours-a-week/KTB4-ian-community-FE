import {
  apiRequest,
  formatCount,
  initLogout,
  initProfileMenu,
} from "../../scripts/common.js";

initProfileMenu();
initLogout();

const postList = document.querySelector("[data-post-list]");

const fallbackPosts = [
  {
    postId: 1,
    title: "첫 번째 게시글 제목입니다.",
    likeCount: 5,
    commentCount: 3,
    viewCount: 123,
    authorName: "더미 작성자 1",
    createdAt: "2026-07-05 12:00",
  },
  {
    postId: 2,
    title: "두 번째 게시글 제목입니다.",
    likeCount: 12,
    commentCount: 8,
    viewCount: 2048,
    authorName: "더미 작성자 2",
    createdAt: "2026-07-04 18:30",
  },
  {
    postId: 3,
    title: "세 번째 게시글 제목입니다.",
    likeCount: 1,
    commentCount: 0,
    viewCount: 47,
    authorName: "더미 작성자 3",
    createdAt: "2026-07-03 09:20",
  },
];

function createPostCard(post) {
  const article = document.createElement("article");
  article.className = "post-card card";

  article.innerHTML = `
    <a
      class="post-card__link"
      href="../post-detail/post-detail.html?postId=${post.postId}"
    >
      <div class="post-card__body">
        <h3 class="post-card__title">${post.title}</h3>
        <div class="post-card__meta">
          <div class="post-card__counts">
            <span>좋아요 ${formatCount(post.likeCount)}</span>
            <span>댓글 ${formatCount(post.commentCount)}</span>
            <span>조회수 ${formatCount(post.viewCount)}</span>
          </div>
          <time>${post.createdAt ?? ""}</time>
        </div>
      </div>
      <div class="post-card__author">
        <img src="../../assets/images/profile-default.svg" alt="">
        <span>${post.authorName ?? "알 수 없음"}</span>
      </div>
    </a>
  `;

  return article;
}

function renderPosts(posts) {
  postList.replaceChildren(...posts.map(createPostCard));
}

async function loadPosts() {
  try {
    const response = await apiRequest("/api/posts");
    const posts = Array.isArray(response) ? response : response?.content;

    renderPosts(posts?.length ? posts : fallbackPosts);
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
