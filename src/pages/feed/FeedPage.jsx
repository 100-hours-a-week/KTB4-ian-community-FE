import { useCallback, useEffect, useState } from "react";
import { normalizePost } from "../../entities/post/model/normalizePost.js";
import { isPostOwnedByCurrentUser } from "../../entities/post/model/isPostOwnedByCurrentUser.js";
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

export function FeedPage({ user, onNavigate, onCreatePost, refreshKey = 0 }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingPost, setEditingPost] = useState(null);
  const [deletingPost, setDeletingPost] = useState(null);
  const reveal = useSkeletonReveal();

  const load = useCallback(async () => {
    reveal.startLoading();
    setLoading(true);
    try {
      const result = await postApi.list();
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
      reveal.revealContent();
    }
  }, [reveal.startLoading, reveal.revealContent]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

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
          posts.map((post, index) => {
            const owned = isPostOwnedByCurrentUser(post, user);
            return (
              <PostCard
                key={post.postId}
                post={post}
                owned={owned}
                onOpen={() => onNavigate(`/posts/${post.postId}`)}
                onLike={() => like(index)}
                onEdit={owned ? () => setEditingPost(post) : undefined}
                onDelete={owned ? () => setDeletingPost(post) : undefined}
              />
            );
          })
        ) : (
          <p className="feed-state empty">아직 생성된 피드가 없어요.</p>
        )}
        <EditPostModal
          open={Boolean(editingPost)}
          onClose={() => setEditingPost(null)}
          post={editingPost}
          onUpdated={load}
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
