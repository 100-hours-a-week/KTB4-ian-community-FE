import { useCallback, useEffect, useState } from "react";
import { postApi } from "../../entities/post/api/postApi.js";
import { normalizePost } from "../../entities/post/model/normalizePost.js";
import { PostCard } from "../../entities/post/ui/PostCard.jsx";
import { CommentForm } from "../../features/comment/create/CommentForm.jsx";
import { EditCommentModal } from "../../features/comment/edit/EditCommentModal.jsx";
import { DeletePostModal } from "../../features/post/delete/DeletePostModal.jsx";
import { DeleteCommentModal } from "../../features/comment/delete/DeleteCommentModal.jsx";
import { PageHeader } from "../../shared/ui/PageHeader.jsx";
import { CommentItem } from "../../entities/comment/ui/CommentItem.jsx";
import { Button } from "../../shared/ui/Button.jsx";

export function PostDetailPage({ postId, user, onNavigate }) {
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingComment, setDeletingComment] = useState(null);
  const [optionCommentId, setOptionCommentId] = useState(null);

  const load = useCallback(async () => {
    try {
      setPost(normalizePost(await postApi.detail(postId)));
      setError("");
    } catch (cause) {
      setError(cause.message);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!post)
    return (
      <main className="page post-detail-page">
        <PageHeader title="피드 상세보기" onBack={() => onNavigate("/feed")} />
        {error ? (
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
        ) : (
          <p className="feed-state loading" aria-busy="true">
            피드를 불러오는 중입니다.
          </p>
        )}
      </main>
    );
  return (
    <main className="page post-detail-page" aria-labelledby="post-detail-title">
      <PageHeader title="피드 상세보기" onBack={() => onNavigate("/feed")} />
      <PostCard
        post={post}
        onDelete={
          post.author.nickname === user.nickname
            ? () => setDeleteOpen(true)
            : undefined
        }
      />
      <CommentForm postId={postId} userId={user.userId} onCreated={load} />
      <section className="comments">
        {post.comments.map((item) => {
          const commentId = item.commentId ?? item.comment_id;
          const owned = (item.userId ?? item.user_id) === user.userId;
          return (
            <CommentItem
              key={commentId}
              comment={item}
              owned={owned}
              optionsOpen={optionCommentId === commentId}
              onOpenOptions={() => setOptionCommentId(commentId)}
              onCloseOptions={() => setOptionCommentId(null)}
              onEdit={() => setEditingComment(item)}
              onDelete={() => setDeletingComment(item)}
            />
          );
        })}
      </section>
      {error && <p className="error">{error}</p>}
      <EditCommentModal
        open={Boolean(editingComment)}
        onClose={() => setEditingComment(null)}
        comment={editingComment}
        userId={user.userId}
        onUpdated={load}
      />
      <DeletePostModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        post={post}
        onDeleted={() => onNavigate("/feed", { replace: true })}
      />
      <DeleteCommentModal
        open={Boolean(deletingComment)}
        onClose={() => setDeletingComment(null)}
        postId={post.postId}
        comment={deletingComment}
        userId={user.userId}
        onDeleted={(commentId) =>
          setPost((current) => ({
            ...current,
            comments: current.comments.filter(
              (item) => (item.commentId ?? item.comment_id) !== commentId,
            ),
            commentCount: Math.max(0, current.commentCount - 1),
          }))
        }
      />
    </main>
  );
}
