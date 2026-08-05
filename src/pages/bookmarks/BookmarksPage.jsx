import { useCallback, useEffect, useRef, useState } from "react";
import { postApi } from "../../entities/post/api/postApi.js";
import { normalizePost } from "../../entities/post/model/normalizePost.js";
import { PostCard } from "../../entities/post/ui/PostCard.jsx";
import {
  optimisticLike,
  togglePostLike,
} from "../../features/post/like/togglePostLike.js";
import { Button } from "../../shared/ui/Button.jsx";

const PAGE_SIZE = 10;

export function BookmarksPage({ onNavigate = () => {}, refreshKey = 0 }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pending, setPending] = useState(new Set());
  const [liking, setLiking] = useState(new Set());
  const [error, setError] = useState("");
  const [terminalMessage, setTerminalMessage] = useState("");
  const loadMoreRef = useRef(null);
  const loadMorePendingRef = useRef(false);

  const load = useCallback(async (targetPage = 0, replace = true) => {
    if (!replace && loadMorePendingRef.current) {
      return;
    }

    if (replace) {
      setLoading(true);
    } else {
      loadMorePendingRef.current = true;
      setLoadingMore(true);
    }

    try {
      const result = await postApi.bookmarks({
        page: targetPage,
        size: PAGE_SIZE,
      });

      const next = (result?.content || []).map(normalizePost);

      setPosts((current) => {
        if (replace) {
          return next;
        }

        const unique = new Map(current.map((post) => [post.postId, post]));

        next.forEach((post) => {
          unique.set(post.postId, post);
        });

        return [...unique.values()];
      });

      setPage(targetPage);
      setHasNext(Boolean(result?.hasNext ?? result?.has_next));
      setTerminalMessage(result?.message ?? "");
      setError("");
    } catch (cause) {
      setError(cause.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      if (!replace) {
        loadMorePendingRef.current = false;
      }
    }
  }, []);

  async function remove(post) {
    if (pending.has(post.postId)) return;
    setPending((current) => new Set(current).add(post.postId));
    setPosts((current) =>
      current.map((item) =>
        item.postId === post.postId ? { ...item, bookmarked: false } : item,
      ),
    );
    try {
      await postApi.deleteBookmark(post.postId);
      setPosts((current) =>
        current.filter((item) => item.postId !== post.postId),
      );
    } catch (cause) {
      setPosts((current) =>
        current.map((item) => (item.postId === post.postId ? post : item)),
      );
      setError(cause.message);
    } finally {
      setPending((current) => {
        const next = new Set(current);
        next.delete(post.postId);
        return next;
      });
    }
  }

  async function like(postId) {
    const before = posts.find((post) => post.postId === postId);
    if (!before || liking.has(postId)) return;

    setLiking((current) => new Set(current).add(postId));
    setPosts((current) =>
      current.map((post) =>
        post.postId === postId ? optimisticLike(post) : post,
      ),
    );

    try {
      const updated = await togglePostLike(before);
      setPosts((current) =>
        current.map((post) => (post.postId === postId ? updated : post)),
      );
      setError("");
    } catch (cause) {
      setPosts((current) =>
        current.map((post) => (post.postId === postId ? before : post)),
      );
      setError(cause.message);
    } finally {
      setLiking((current) => {
        const next = new Set(current);
        next.delete(postId);
        return next;
      });
    }
  }

  useEffect(() => {
    load(0, true);
  }, [load, refreshKey]);

  useEffect(() => {
    if (
      !hasNext ||
      loadingMore ||
      !loadMoreRef.current ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        load(page + 1, false);
      }
    });

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasNext, load, loadingMore, page]);

  return (
    <main className="page bookmarks-page" data-testid="bookmarks-page-ready">
      <header className="bookmarks-page__header">
        <h1>북마크</h1>
      </header>
      {loading ? (
        <p className="feed-state loading" aria-busy="true">
          북마크를 불러오는 중입니다.
        </p>
      ) : error && !posts.length ? (
        <div className="feed-state error">
          <p>{error}</p>
          <Button variant="outline" onClick={() => load()}>
            다시 시도
          </Button>
        </div>
      ) : posts.length ? (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.postId}
              post={post}
              onOpen={() => onNavigate(`/posts/${post.postId}`)}
              onLike={() => like(post.postId)}
              likePending={liking.has(post.postId)}
              onBookmark={() => remove(post)}
              bookmarkPending={pending.has(post.postId)}
            />
          ))}
          {hasNext && (
            <button
              ref={loadMoreRef}
              className="feed-state loading"
              type="button"
              disabled={loadingMore}
              onClick={() => load(page + 1, false)}
            >
              {loadingMore ? "북마크를 불러오는 중입니다." : "북마크 더 보기"}
            </button>
          )}
          {!hasNext && terminalMessage && (
            <p className="feed-state end" aria-live="polite">
              {terminalMessage}
            </p>
          )}
        </>
      ) : (
        <section
          className="coming-soon"
          aria-labelledby="bookmarks-empty-title"
        >
          <h2 id="bookmarks-empty-title">저장한 북마크가 없어요.</h2>
          <p>마음에 드는 피드를 북마크해보세요.</p>
        </section>
      )}
      {error && posts.length > 0 && <p className="feed-state error">{error}</p>}
    </main>
  );
}
