import { postApi } from "../../../entities/post/api/postApi.js";

export function optimisticBookmark(post) {
  return {
    ...post,
    bookmark: !post.bookmark,
  };
}

export async function togglePostBookmark(post) {
  const optimistic = optimisticBookmark(post);
  const result = await postApi.bookmark(post.postId);
  return {
    ...optimistic,
    bookmark: result?.bookmark ?? optimistic.bookmark,
  };
}
