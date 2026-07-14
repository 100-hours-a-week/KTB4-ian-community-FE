import { formatCount } from "../common.js";
import { formatRelativeTime } from "../utils/date.js";
import { ICONS, setToggleIcon } from "../utils/icons.js";

const fallbackAvatar = new URL("../../assets/images/profile-default.svg", import.meta.url).href;
const value = (post, camel, snake) => post[camel] ?? post[snake];

export function normalizePost(post) {
  return { ...post, postId: value(post, "postId", "post_id"), likeCount: Number(value(post, "likeCount", "like_count") || 0), commentCount: Number(value(post, "commentCount", "comment_count") || 0), viewCount: Number(value(post, "viewCount", "view_count") || 0), authorName: value(post, "authorName", "author_name") ?? post.nickname ?? "알 수 없음", createdAt: value(post, "createdAt", "created_at"), profileImage: value(post, "profileImage", "profile_image") || fallbackAvatar, imageUrl: value(post, "imageUrl", "image_url"), liked: Boolean(post.liked) };
}

export function createFeedCard(rawPost, { bookmarked = false, onLike, onBookmark } = {}) {
  const post = normalizePost(rawPost); const article = document.createElement("article"); article.className = "feed-card"; article.dataset.postId = post.postId;
  article.innerHTML = `<header class="feed-card__author"><img src="${post.profileImage}" alt=""><div><strong class="typography-label1-normal-semibold">${post.authorName}</strong><p class="typography-caption-regular">조회 ${formatCount(post.viewCount)} · <time datetime="${post.createdAt || ""}">${formatRelativeTime(post.createdAt)}</time></p></div></header>${post.imageUrl ? `<button class="feed-card__media-link" data-open-detail type="button" aria-label="게시글 상세 보기"><img class="feed-card__media" src="${post.imageUrl}" loading="lazy" alt="게시글 첨부 이미지"></button>` : ""}<button class="feed-card__content typography-body3-reading-regular" data-open-detail type="button">${post.content || post.title || ""}</button><footer class="feed-card__actions"><button class="icon-action" data-like type="button" aria-label="좋아요" aria-pressed="${post.liked}"><img src="${post.liked ? ICONS.like.active : ICONS.like.inactive}" alt=""><span>${formatCount(post.likeCount)}</span></button><span class="icon-action"><img src="${ICONS.comment}" alt=""><span>${formatCount(post.commentCount)}</span></span><button class="icon-action icon-action--bookmark" data-bookmark type="button" aria-label="북마크" aria-pressed="${bookmarked}"><img src="${bookmarked ? ICONS.bookmark.active : ICONS.bookmark.inactive}" alt=""></button></footer>`;
  article.querySelectorAll("[data-open-detail]").forEach((node) => node.addEventListener("click", () => location.assign(`../post-detail/post-detail.html?postId=${post.postId}`)));
  article.querySelector("[data-like]").addEventListener("click", async (event) => { const button = event.currentTarget; const next = !post.liked; setToggleIcon(button, next, ICONS.like); post.liked = next; post.likeCount += next ? 1 : -1; button.querySelector("span").textContent = formatCount(post.likeCount); try { await onLike?.(post); } catch { post.liked = !next; post.likeCount += next ? -1 : 1; setToggleIcon(button, post.liked, ICONS.like); button.querySelector("span").textContent = formatCount(post.likeCount); } });
  article.querySelector("[data-bookmark]").addEventListener("click", () => { const active = onBookmark?.(post) ?? !bookmarked; setToggleIcon(article.querySelector("[data-bookmark]"), active, ICONS.bookmark); });
  return article;
}
