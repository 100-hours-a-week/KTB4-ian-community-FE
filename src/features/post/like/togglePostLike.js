import { postApi } from "../../../entities/post/api/postApi.js";

export function optimisticLike(post) {
  return {
    ...post,
    liked: !post.liked,
    likeCount: Math.max(0, post.likeCount + (post.liked ? -1 : 1)),
  };
}

export async function togglePostLike(post) {
  const optimistic = optimisticLike(post);
  const result = await postApi.like(post.postId);
  return {
    ...optimistic,
    liked: result?.liked ?? optimistic.liked,
    likeCount: result?.likeCount ?? result?.like_count ?? optimistic.likeCount,
  };
}
