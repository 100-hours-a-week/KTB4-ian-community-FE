import { postApi } from "../../../entities/post/api/postApi.js";

export function optimisticBookmark(post) {
  return {
    ...post,
    bookmarked: !post.bookmarked,
  };
}

export async function togglePostBookmark(post) {
  const optimistic = optimisticBookmark(post);
  const result = await postApi.bookmark(post.postId);
  return {
    ...optimistic,
    bookmarked: result?.bookmarked ?? optimistic.bookmarked,
  };
}
