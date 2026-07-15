const STORAGE_KEY = "community.likes";

function read() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export class LikeStore {
  get(postId) {
    return read()[String(postId)] ?? null;
  }

  merge(post) {
    const postId = post.postId ?? post.post_id;
    const state = this.get(postId);

    if (!state) return post;

    return {
      ...post,
      liked: state.liked,
      likeCount: state.likeCount,
      like_count: state.likeCount,
    };
  }

  set(postId, liked, likeCount) {
    const states = read();
    states[String(postId)] = {
      liked: Boolean(liked),
      likeCount: Math.max(0, Number(likeCount) || 0),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
    return states[String(postId)];
  }
}
