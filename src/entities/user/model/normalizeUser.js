export function normalizeUser(raw = {}) {
  return {
    userId: raw.userId ?? raw.user_id ?? null,
    email: raw.email ?? "",
    nickname: raw.nickname ?? raw.authorName ?? raw.author_name ?? "알 수 없음",
    profileImage: raw.profileImage ?? raw.profile_image ?? null,
  };
}
