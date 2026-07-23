import { useEffect, useRef, useState } from "react";
import { postApi } from "../../../entities/post/api/postApi.js";
import { Button } from "../../../shared/ui/Button.jsx";
import { Modal } from "../../../shared/ui/Modal.jsx";

export function DeletePostModal({ open, onClose, post, onDeleted }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    pendingRef.current = false;
    setPending(false);
    setError("");
  }, [open, post?.postId]);

  async function remove() {
    if (pendingRef.current || !post?.postId) return;
    pendingRef.current = true;
    setPending(true);
    setError("");
    try {
      await postApi.remove(post.postId);
      onDeleted?.(post.postId);
      onClose();
    } catch (cause) {
      setError(cause.message);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      title="피드 삭제 확인"
      onClose={pending ? undefined : onClose}
      className="delete-confirm-modal"
    >
      <div className="delete-confirm">
        <div className="delete-confirm__copy">
          <h2>피드 삭제 하실건가요?</h2>
          <p className="delete-confirm__description">
            삭제된 피드는 복구할 수 없습니다.
          </p>
        </div>
        <div className="delete-confirm__actions">
          <Button variant="dark" onClick={onClose} disabled={pending}>
            취소
          </Button>
          <Button loading={pending} onClick={remove}>
            확인
          </Button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>
    </Modal>
  );
}
