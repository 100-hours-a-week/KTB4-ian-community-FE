import { formatCount } from "../common.js";
import { formatRelativeTime } from "../utils/date.js";
import { ICONS, setToggleIcon } from "../utils/icons.js";

const fallbackAvatar = new URL(
  "../../assets/images/profile-default.svg",
  import.meta.url,
).href;
const value = (post, camel, snake) => post[camel] ?? post[snake];

export function normalizePost(post) {
  return {
    ...post,
    postId: value(post, "postId", "post_id"),
    likeCount: Number(value(post, "likeCount", "like_count") || 0),
    commentCount: Number(value(post, "commentCount", "comment_count") || 0),
    viewCount: Number(value(post, "viewCount", "view_count") || 0),
    authorName:
      value(post, "authorName", "author_name") ?? post.nickname ?? "알 수 없음",
    createdAt: value(post, "createdAt", "created_at"),
    profileImage:
      value(post, "profileImage", "profile_image") || fallbackAvatar,
    imageUrl: value(post, "imageUrl", "image_url"),
    liked: Boolean(post.liked),
  };
}

export function sortPostsByLatest(posts) {
  return [...posts].sort((left, right) => {
    const rightTime = Date.parse(value(right, "createdAt", "created_at")) || 0;
    const leftTime = Date.parse(value(left, "createdAt", "created_at")) || 0;
    return rightTime - leftTime;
  });
}

export function createFeedCard(
  rawPost,
  { bookmarked = false, onLike, onBookmark, onOpenDetail } = {},
) {
  const post = normalizePost(rawPost);
  const article = document.createElement("article");
  article.className = "feed-card";
  article.dataset.postId = post.postId;
  article.tabIndex = 0;
  article.setAttribute("role", "link");
  article.setAttribute("aria-label", `${post.authorName}님의 피드 상세보기`);
  article.innerHTML = `<header class="feed-card__author"><div class="feed-card__author-main"><img src="${post.profileImage}" alt=""><strong class="typography-label1-normal-semibold">${post.authorName}</strong></div><p class="feed-card__meta typography-label2-normal-regular">조회 ${formatCount(post.viewCount)} · <time datetime="${post.createdAt || ""}">${formatRelativeTime(post.createdAt)}</time></p></header>${post.imageUrl ? `<img class="feed-card__media" src="${post.imageUrl}" loading="lazy" alt="게시글 첨부 이미지">` : ""}<p class="feed-card__content typography-label2-reading-regular">${post.content || post.title || ""}</p><footer class="feed-card__actions"><button class="icon-action" data-like type="button" aria-label="좋아요" aria-pressed="${post.liked}"><img src="${post.liked ? ICONS.like.active : ICONS.like.inactive}" alt=""><span>${formatCount(post.likeCount)}</span></button><span class="icon-action"><img src="${ICONS.comment}" alt=""><span>${formatCount(post.commentCount)}</span></span><button class="icon-action icon-action--bookmark" data-bookmark type="button" aria-label="북마크" aria-pressed="${bookmarked}"><img src="${bookmarked ? ICONS.bookmark.active : ICONS.bookmark.inactive}" alt=""></button></footer>`;
  const openDetail = () => {
    if (onOpenDetail) onOpenDetail(post);
    else
      location.assign(`../post-detail/post-detail.html?postId=${post.postId}`);
  };
  article.addEventListener("click", (event) => {
    if (!event.target.closest("button, a, input, textarea, select"))
      openDetail();
  });
  article.addEventListener("keydown", (event) => {
    if (
      (event.key === "Enter" || event.key === " ") &&
      event.target === article
    ) {
      event.preventDefault();
      openDetail();
    }
  });
  article
    .querySelector("[data-like]")
    .addEventListener("click", async (event) => {
      const button = event.currentTarget;
      const next = !post.liked;
      setToggleIcon(button, next, ICONS.like);
      post.liked = next;
      post.likeCount += next ? 1 : -1;
      button.querySelector("span").textContent = formatCount(post.likeCount);
      try {
        const result = await onLike?.(post);
        const serverLiked = result?.liked;
        const serverCount = result?.likeCount ?? result?.like_count;

        if (typeof serverLiked === "boolean") post.liked = serverLiked;
        if (serverCount != null) post.likeCount = Number(serverCount);
        setToggleIcon(button, post.liked, ICONS.like);
        button.querySelector("span").textContent = formatCount(post.likeCount);
      } catch {
        post.liked = !next;
        post.likeCount += next ? -1 : 1;
        setToggleIcon(button, post.liked, ICONS.like);
        button.querySelector("span").textContent = formatCount(post.likeCount);
      }
    });
  article.querySelector("[data-bookmark]").addEventListener("click", () => {
    const active = onBookmark?.(post) ?? !bookmarked;
    setToggleIcon(
      article.querySelector("[data-bookmark]"),
      active,
      ICONS.bookmark,
    );
  });
  return article;
}
