import { useEffect, useRef, useState } from "react";
import { postApi } from "../../../entities/post/api/postApi.js";
import { UserAvatar } from "../../../entities/user/ui/UserAvatar.jsx";
import {
  cameraIcon,
  directionTopIcon,
  feedPreviewCloseLeftIcon,
  feedPreviewCloseRightIcon,
} from "../../../shared/assets/index.js";
import { apiAssetUrl } from "../../../shared/config/env.js";
import { Modal } from "../../../shared/ui/Modal.jsx";

export function EditPostModal({ open, onClose, post, onUpdated }) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const textareaRef = useRef(null);
  const pendingRef = useRef(false);
  const initialContent = post?.content ?? "";
  const existingImage = imageRemoved ? null : post?.imageUrl;
  const contentChanged = content.trim() !== initialContent.trim();
  const imageChanged = Boolean(file) || imageRemoved;
  const valid =
    content.trim().length > 0 && (contentChanged || imageChanged) && !pending;

  useEffect(() => {
    if (!open) return;
    setContent(initialContent);
    setFile(null);
    setPreview(null);
    setImageRemoved(false);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, [open, initialContent, post?.postId]);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  useEffect(() => {
    if (!open || !textareaRef.current) return;
    const textarea = textareaRef.current;
    textarea.style.height = "auto";
    const contentHeight = textarea.scrollHeight - 3;
    textarea.style.height = `${Math.min(Math.max(contentHeight, 36), 324)}px`;
  }, [open, content]);

  function choose(event) {
    const next = event.target.files[0] || null;
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
    setImageRemoved(false);
  }

  function removeImage() {
    setPreview(null);
    setFile(null);
    setImageRemoved(true);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function submit() {
    if (!valid || pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError("");
    try {
      await postApi.update(post.postId, {
        content: content.trim(),
        imageUrl: file ? null : existingImage,
      });
      await onUpdated();
      onClose();
    } catch (cause) {
      setError(cause.message);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  const displayedImage = preview || existingImage;

  return (
    <Modal
      open={open}
      title="피드 편집"
      onClose={pending ? undefined : onClose}
      className="feed-edit-modal"
    >
      <header className="modal-header">
        <strong>피드 편집</strong>
        <button type="button" onClick={onClose} disabled={pending}>
          취소
        </button>
      </header>
      <section className="feed-editor">
        <div className="feed-editor__media">
          <div className="identity">
            <UserAvatar
              profileImage={post?.author.profileImage}
              nickname={post?.author.nickname}
            />
            <strong>{post?.author.nickname}</strong>
          </div>
          {displayedImage && (
            <div
              className="feed-editor__preview"
              data-preview-kind={preview ? "blob" : "existing"}
            >
              <img
                src={preview || apiAssetUrl(existingImage, null)}
                alt={preview ? "변경할 이미지 미리보기" : "기존 피드 이미지"}
                draggable={false}
                onDragStart={(event) => event.preventDefault()}
              />
              <button
                type="button"
                aria-label="피드 이미지 제거"
                onClick={removeImage}
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
          disabled={pending}
        />
        {error && <p className="error">{error}</p>}
      </section>
      <footer className="editor-footer">
        <label className="camera">
          <img src={cameraIcon} alt="변경할 이미지 선택" />
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
          aria-label="피드 수정"
          disabled={!valid}
          onClick={submit}
        >
          <img src={directionTopIcon} alt="" />
        </button>
      </footer>
    </Modal>
  );
}
