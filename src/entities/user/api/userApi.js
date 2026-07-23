import { httpClient } from "../../../shared/api/httpClient.js";

const json = (value) => JSON.stringify(value);

export const userApi = {
  me: (userId, options) => httpClient(`/api/users/${userId}`, options),
  login: (payload) =>
    httpClient("/api/users/login", { method: "POST", body: json(payload) }),
  signup: (payload) =>
    httpClient("/api/users/signup", { method: "POST", body: json(payload) }),
  logout: () => httpClient("/api/users/logout", { method: "POST" }),
  remove: (userId) =>
    httpClient(`/api/users/${userId}/delete`, { method: "DELETE" }),
  updateNickname: (userId, nickname) =>
    httpClient(`/api/users/${userId}/nickname`, {
      method: "PATCH",
      body: json({ nickname }),
    }),
  updateProfileImage: (userId, image) => {
    const body = new FormData();
    body.append("image", image);
    return httpClient(`/api/users/${userId}/profile-image`, {
      method: "PATCH",
      body,
    });
  },
  updatePassword: (userId, payload) =>
    httpClient(`/api/users/${userId}/password`, {
      method: "PATCH",
      body: json(payload),
    }),
};
