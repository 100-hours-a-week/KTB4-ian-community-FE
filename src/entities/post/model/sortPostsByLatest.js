function timestamp(value) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function sortPostsByLatest(posts) {
  return [...posts].sort((left, right) => {
    const createdAtDifference =
      timestamp(right.createdAt) - timestamp(left.createdAt);

    return createdAtDifference !== 0
      ? createdAtDifference
      : Number(right.postId) - Number(left.postId);
  });
}
