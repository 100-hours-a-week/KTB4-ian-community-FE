import { normalizeUser } from "../../user/model/normalizeUser.js";

export function normalizePost(raw = {}) {
  return {
    postId: raw.postId ?? raw.post_id,
    content: raw.content ?? raw.title ?? "",
    imageUrl: raw.imageUrl ?? raw.image_url ?? null,
    author: normalizeUser(raw.author ?? raw),
    likeCount: raw.likeCount ?? raw.like_count ?? 0,
    commentCount:
      raw.commentCount ?? raw.comment_count ?? raw.comment?.length ?? 0,
    viewCount: raw.viewCount ?? raw.view_count ?? 0,
    liked: Boolean(raw.liked),
    mine: Boolean(raw.mine),
    comments: raw.comments ?? raw.comment ?? [],
    createdAt: raw.createdAt ?? raw.created_at ?? null,
  };
}
