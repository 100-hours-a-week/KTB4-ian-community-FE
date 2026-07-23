import { apiRequest } from "./http-client.js";

const json = (value) => JSON.stringify(value);
export const postsApi = {
  list: (params = {}) =>
    apiRequest(`/api/posts?${new URLSearchParams(params)}`),
  detail: (postId) => apiRequest(`/api/posts/${postId}`),
  create: (userId, payload) => {
    const body = new FormData();
    body.append("content", payload.content);
    if (payload.image) body.append("image", payload.image);
    return apiRequest(`/api/posts/${userId}`, { method: "POST", body });
  },
  update: (postId, payload) =>
    apiRequest(`/api/posts/${postId}`, {
      method: "PATCH",
      body: json(payload),
    }),
  remove: (postId) => apiRequest(`/api/posts/${postId}`, { method: "DELETE" }),
  toggleLike: (postId) =>
    apiRequest(`/api/posts/${postId}/likes`, { method: "POST" }),
  createComment: (postId, userId, comment) =>
    apiRequest(`/api/posts/${postId}/comments/users/${userId}`, {
      method: "POST",
      body: json({ comment }),
    }),
  updateComment: (postId, commentId, userId, comment) =>
    apiRequest(`/api/posts/${postId}/comments/${commentId}/users/${userId}`, {
      method: "PATCH",
      body: json({ comment }),
    }),
  removeComment: (postId, commentId, userId) =>
    apiRequest(`/api/posts/${postId}/comments/${commentId}/users/${userId}`, {
      method: "DELETE",
    }),
};
