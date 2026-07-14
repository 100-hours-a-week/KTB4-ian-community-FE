import { apiRequest } from "./http-client.js";

const json = (value) => JSON.stringify(value);
export const usersApi = {
  me: (userId) => apiRequest(`/api/users/${userId}`),
  login: (payload) => apiRequest("/api/users/login", { method: "POST", body: json(payload), __skipRefresh: true }),
  logout: () => apiRequest("/api/users/logout", { method: "POST" }),
  nickname: (userId, nickname) => apiRequest(`/api/users/${userId}/nickname`, { method: "PATCH", body: json({ nickname }) }),
  password: (userId, payload) => apiRequest(`/api/users/${userId}/password`, { method: "PATCH", body: json(payload) }),
  profile: (userId, profileImage) => apiRequest(`/api/users/${userId}/profile`, { method: "PATCH", body: json({ profile_image: profileImage }) }),
  remove: (userId) => apiRequest(`/api/users/${userId}`, { method: "DELETE" }),
};
