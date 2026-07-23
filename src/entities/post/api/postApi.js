import { httpClient } from "../../../shared/api/httpClient.js";

export const postApi = {
  list: (options) => httpClient("/api/posts", options),
  detail: (postId, options) => httpClient(`/api/posts/${postId}`, options),
  create: (userId, { content, image }) => {
    const body = new FormData();
    body.append("content", content);
    if (image) body.append("image", image);
    return httpClient(`/api/posts/${userId}`, { method: "POST", body });
  },
  update: (postId, { content, imageUrl }) =>
    httpClient(`/api/posts/${postId}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: content.slice(0, 26),
        content,
        imageUrl,
      }),
    }),
  remove: (postId) => httpClient(`/api/posts/${postId}`, { method: "DELETE" }),
  like: (postId) =>
    httpClient(`/api/posts/${postId}/likes`, { method: "POST" }),
  comment: (postId, userId, comment) =>
    httpClient(`/api/posts/${postId}/comments/users/${userId}`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }),
  updateComment: (postId, commentId, userId, comment) =>
    httpClient(`/api/posts/${postId}/comments/${commentId}/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ comment }),
    }),
  removeComment: (postId, commentId, userId) =>
    httpClient(`/api/posts/${postId}/comments/${commentId}/users/${userId}`, {
      method: "DELETE",
    }),
};
