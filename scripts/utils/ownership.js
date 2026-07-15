const value = (source, keys) => keys.map((key) => source?.[key]).find(Boolean);

export function isOwnedByUser(resource, user) {
  const ownerId = value(resource, [
    "userId",
    "user_id",
    "authorId",
    "author_id",
  ]);
  const userId = value(user, ["userId", "user_id"]);

  if (ownerId != null && userId != null) {
    return String(ownerId) === String(userId);
  }

  const ownerNickname = value(resource, [
    "authorName",
    "author_name",
    "nickname",
  ]);

  return Boolean(
    ownerNickname && user?.nickname && ownerNickname === user.nickname,
  );
}
