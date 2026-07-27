import { useCallback, useEffect, useState } from "react";
import { postApi } from "../../entities/post/api/postApi.js";
import { normalizePost } from "../../entities/post/model/normalizePost.js";
import { PostCard } from "../../entities/post/ui/PostCard.jsx";
import {
  optimisticLike,
  togglePostLike,
} from "../../features/post/like/togglePostLike.js";
import { togglePostBookmark } from "../../features/post/bookmark/togglePostBookmark.js";
import { Button } from "../../shared/ui/Button.jsx";
import "./bookmarks.css";

export function BookmarksPage({ onNavigate }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await postApi.bookmarks();
      setPosts(
        (Array.isArray(result) ? result : result?.content || []).map(
          normalizePost,
        ),
      );
      setError("");
    } catch (cause) {
      setError(cause.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function like(index) {
    const before = posts[index];
    setPosts((all) =>
      all.map((post, current) =>
        current === index ? optimisticLike(post) : post,
      ),
    );
    try {
      const result = await togglePostLike(before);
      setPosts((all) =>
        all.map((post, current) => (current === index ? result : post)),
      );
    } catch {
      setPosts((all) =>
        all.map((post, current) => (current === index ? before : post)),
      );
    }
  }

  async function removeBookmark(index) {
    const before = posts[index];
    setPosts((all) => all.filter((_, current) => current !== index));
    try {
      const result = await togglePostBookmark(before);
      if (result.bookmarked) {
        setPosts((all) => {
          const restored = [...all];
          restored.splice(index, 0, result);
          return restored;
        });
      }
    } catch {
      setPosts((all) => {
        const restored = [...all];
        restored.splice(index, 0, before);
        return restored;
      });
    }
  }

  return (
    <main
      className="page bookmarks-page"
      data-testid="bookmarks-page-ready"
      aria-busy={loading}
      aria-labelledby="bookmarks-page-title"
    >
      <header className="bookmarks-page__header">
        <h1 id="bookmarks-page-title">북마크</h1>
      </header>
      <section className="bookmarks-page__content">
        {loading ? (
          <p className="feed-state loading">북마크를 불러오는 중입니다.</p>
        ) : error ? (
          <div className="feed-state error">
            <p>{error}</p>
            <Button
              variant="outline"
              className="feed-state__action"
              onClick={load}
            >
              다시 시도
            </Button>
          </div>
        ) : posts.length ? (
          posts.map((post, index) => (
            <PostCard
              key={post.postId}
              post={post}
              onOpen={() => onNavigate(`/posts/${post.postId}`)}
              onLike={() => like(index)}
              onBookmark={() => removeBookmark(index)}
            />
          ))
        ) : (
          <div className="bookmarks-empty">
            <h2>저장한 피드가 없어요.</h2>
            <p>피드에서 저장하기 버튼을 눌러 북마크에 추가해보세요.</p>
          </div>
        )}
      </section>
    </main>
  );
}
