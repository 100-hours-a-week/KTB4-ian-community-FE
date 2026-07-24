function normalizeIdentifier(value) {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

export function isPostOwnedByCurrentUser(post = {}, currentUser = {}) {
  if (typeof post.mine === "boolean") return post.mine;

  const currentUserId = normalizeIdentifier(
    currentUser.userId ?? currentUser.user_id,
  );
  const authorUserId = normalizeIdentifier(
    post.author?.userId ??
      post.author?.user_id ??
      post.authorUserId ??
      post.author_user_id,
  );

  if (currentUserId === null || authorUserId === null) return false;
  return currentUserId === authorUserId;
}
