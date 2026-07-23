import { useEffect, useRef, useState } from "react";
import { postApi } from "../../../entities/post/api/postApi.js";
import { UserAvatar } from "../../../entities/user/ui/UserAvatar.jsx";
import { Modal } from "../../../shared/ui/Modal.jsx";
import {
  cameraIcon,
  directionTopIcon,
  feedPreviewCloseLeftIcon,
  feedPreviewCloseRightIcon,
} from "../../../shared/assets/index.js";

export function CreatePostModal({ open, onClose, user, onCreated }) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const textareaRef = useRef(null);
  const pendingRef = useRef(false);
  const valid = content.trim().length > 0 && !pending;

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function clearImage() {
    setPreview(null);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function choose(event) {
    const next = event.target.files[0] || null;
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
  }

  useEffect(() => {
    if (!open || !textareaRef.current) return;
    const textarea = textareaRef.current;
    textarea.style.height = "auto";
    const contentHeight = textarea.scrollHeight - 3;
    textarea.style.height = `${Math.min(Math.max(contentHeight, 36), 324)}px`;
  }, [open, content]);

  async function submit() {
    if (!valid || pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError("");
    try {
      await postApi.create(user.userId, {
        content: content.trim(),
        image: file,
      });
      clearImage();
      setContent("");
      await onCreated();
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
      title="피드 생성"
      onClose={pending ? undefined : onClose}
      className="feed-create-modal"
    >
      <header className="modal-header">
        <strong>피드 생성</strong>
        <button type="button" onClick={onClose} disabled={pending}>
          취소
        </button>
      </header>
      <section className="feed-editor">
        <div className="feed-editor__media">
          <div className="identity">
            <UserAvatar
              profileImage={user.profileImage}
              nickname={user.nickname}
            />
            <strong>{user.nickname}</strong>
          </div>
          {preview && (
            <div className="feed-editor__preview">
              <img
                src={preview}
                alt="선택한 이미지 미리보기"
                draggable={false}
                onDragStart={(event) => event.preventDefault()}
              />
              <button
                type="button"
                aria-label="선택한 이미지 제거"
                onClick={clearImage}
                disabled={pending}
              >
                <span className="feed-editor__remove-icon" aria-hidden="true">
                  <img src={feedPreviewCloseLeftIcon} alt="" />
                  <img src={feedPreviewCloseRightIcon} alt="" />
                </span>
              </button>
            </div>
          )}
        </div>
        <textarea
          ref={textareaRef}
          aria-label="피드 본문"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="무슨 생각을 하고 계신가요?"
          disabled={pending}
        />
        {error && <p className="error">{error}</p>}
      </section>
      <footer className="editor-footer">
        <label className="camera">
          <img src={cameraIcon} alt="이미지 선택" />
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={choose}
            disabled={pending}
          />
        </label>
        <button
          className="submit-icon"
          type="button"
          aria-label="피드 게시"
          disabled={!valid}
          onClick={submit}
        >
          <img src={directionTopIcon} alt="" />
        </button>
      </footer>
    </Modal>
  );
}
