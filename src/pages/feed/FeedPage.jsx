import { useCallback, useEffect, useRef, useState } from "react";
import { normalizePost } from "../../entities/post/model/normalizePost.js";
import { postApi } from "../../entities/post/api/postApi.js";
import { PostCard } from "../../entities/post/ui/PostCard.jsx";
import { UserAvatar } from "../../entities/user/ui/UserAvatar.jsx";
import { EditPostModal } from "../../features/post/edit/EditPostModal.jsx";
import { DeletePostModal } from "../../features/post/delete/DeletePostModal.jsx";
import {
  optimisticLike,
  togglePostLike,
} from "../../features/post/like/togglePostLike.js";
import { useSkeletonReveal } from "../../shared/hooks/useSkeletonReveal.js";
import { FeedPageSkeleton } from "./FeedPageSkeleton.jsx";
import { Button } from "../../shared/ui/Button.jsx";

const PAGE_SIZE = 10;

function appendUnique(current, next) {
  const posts = new Map(current.map((post) => [post.postId, post]));
  next.forEach((post) => posts.set(post.postId, post));
  return [...posts.values()];
}

export function FeedPage({ user, onNavigate, onCreatePost, refreshKey = 0 }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [bookmarking, setBookmarking] = useState(new Set());
  const [editingPost, setEditingPost] = useState(null);
  const [deletingPost, setDeletingPost] = useState(null);
  const loadMoreRef = useRef(null);
  const reveal = useSkeletonReveal();

  const load = useCallback(
    async (targetPage = 0, replace = true) => {
      if (replace) {
        reveal.startLoading();
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      try {
        const result = await postApi.list({
          page: targetPage,
          size: PAGE_SIZE,
        });
        const next = (result?.content || []).map(normalizePost);
        setPosts((current) => (replace ? next : appendUnique(current, next)));
        setPage(targetPage);
        setHasNext(Boolean(result?.hasNext ?? result?.has_next));
        setError("");
      } catch (cause) {
        setError(cause.message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        if (replace) reveal.revealContent();
      }
    },
    [reveal.startLoading, reveal.revealContent],
  );

  useEffect(() => {
    load(0, true);
  }, [load, refreshKey]);

  useEffect(() => {
    if (
      !hasNext ||
      loadingMore ||
      !loadMoreRef.current ||
      typeof IntersectionObserver === "undefined"
    )
      return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) load(page + 1, false);
    });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNext, load, loadingMore, page]);

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

  async function bookmark(index) {
    const before = posts[index];
    if (bookmarking.has(before.postId)) return;
    setBookmarking((current) => new Set(current).add(before.postId));
    setPosts((all) =>
      all.map((post, current) =>
        current === index ? { ...post, bookmarked: !post.bookmarked } : post,
      ),
    );
    try {
      if (before.bookmarked) await postApi.deleteBookmark(before.postId);
      else await postApi.addBookmark(before.postId);
    } catch (cause) {
      setPosts((all) =>
        all.map((post, current) => (current === index ? before : post)),
      );
      setError(cause.message);
    } finally {
      setBookmarking((current) => {
        const next = new Set(current);
        next.delete(before.postId);
        return next;
      });
    }
  }

  return (
    <main
      className="page feed-page skeleton-shell"
      aria-busy={loading}
      aria-labelledby="feed-page-title"
    >
      {reveal.isSkeletonVisible && (
        <div
          className={`skeleton-layer ${reveal.isSkeletonExiting ? "is-exiting" : ""}`}
        >
          <FeedPageSkeleton />
        </div>
      )}
      <div
        data-testid="feed-content"
        className={`content-layer ${reveal.isContentVisible ? "is-visible" : ""}`}
      >
        <header className="feed-page__intro">
          <h1 id="feed-page-title">피드</h1>
          <button
            className="create-trigger"
            type="button"
            onClick={onCreatePost}
          >
            <span>
              <UserAvatar
                profileImage={user.profileImage}
                nickname={user.nickname}
              />
              <span className="create-trigger__placeholder">
                새로운 게시물을 작성해보세요
              </span>
            </span>
            <b>피드 게시하기</b>
          </button>
        </header>
        {loading ? (
          <div className="feed-state loading" aria-busy="true">
            피드를 불러오는 중입니다.
          </div>
        ) : error && !posts.length ? (
          <div className="feed-state error">
            <p>{error}</p>
            <Button
              variant="outline"
              className="feed-state__action"
              onClick={() => load(0, true)}
            >
              다시 시도
            </Button>
          </div>
        ) : posts.length ? (
          <>
            {posts.map((post, index) => (
              <PostCard
                key={post.postId}
                post={post}
                onOpen={() => onNavigate(`/posts/${post.postId}`)}
                onLike={() => like(index)}
                onBookmark={() => bookmark(index)}
                bookmarkPending={bookmarking.has(post.postId)}
                onEdit={
                  post.author.nickname === user.nickname
                    ? () => setEditingPost(post)
                    : undefined
                }
                onDelete={
                  post.author.nickname === user.nickname
                    ? () => setDeletingPost(post)
                    : undefined
                }
              />
            ))}
            {error && <p className="feed-state error">{error}</p>}
            {hasNext && (
              <button
                ref={loadMoreRef}
                className="feed-state loading"
                type="button"
                disabled={loadingMore}
                onClick={() => load(page + 1, false)}
              >
                {loadingMore ? "피드를 불러오는 중입니다." : "피드 더 보기"}
              </button>
            )}
          </>
        ) : (
          <p className="feed-state empty">아직 생성된 피드가 없어요.</p>
        )}
        <EditPostModal
          open={Boolean(editingPost)}
          onClose={() => setEditingPost(null)}
          post={editingPost}
          onUpdated={() => load(0, true)}
        />
        <DeletePostModal
          open={Boolean(deletingPost)}
          onClose={() => setDeletingPost(null)}
          post={deletingPost}
          onDeleted={(postId) =>
            setPosts((current) =>
              current.filter((post) => post.postId !== postId),
            )
          }
        />
      </div>
    </main>
  );
}
