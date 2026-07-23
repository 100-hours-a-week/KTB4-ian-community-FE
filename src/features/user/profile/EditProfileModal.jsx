import { useEffect, useRef, useState } from "react";
import { userApi } from "../../../entities/user/api/userApi.js";
import { UserAvatar } from "../../../entities/user/ui/UserAvatar.jsx";
import { backLeftIcon, cameraIcon } from "../../../shared/assets/index.js";
import { Modal } from "../../../shared/ui/Modal.jsx";

export function EditProfileModal({
  open,
  onClose,
  user,
  onUpdated,
  onDeleteAccount,
}) {
  const [nickname, setNickname] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const pendingRef = useRef(false);
  const nicknameValue = nickname.trim();
  const nicknameValid = nicknameValue.length >= 1 && nicknameValue.length <= 10;
  const nicknameChanged = nicknameValue !== user.nickname;
  const valid = nicknameValid && (nicknameChanged || Boolean(file)) && !pending;

  useEffect(() => {
    if (!open) return;
    setNickname(user.nickname);
    setFile(null);
    setPreview(null);
    setPending(false);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, [open, user.nickname, user.profileImage]);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function choose(event) {
    const next = event.target.files[0] || null;
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
  }

  async function submit() {
    if (!valid || pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError("");
    try {
      let profileImage = user.profileImage;
      if (file) {
        const result = await userApi.updateProfileImage(user.userId, file);
        profileImage =
          result?.profileImage ?? result?.profile_image ?? profileImage;
      }
      if (nicknameChanged)
        await userApi.updateNickname(user.userId, nicknameValue);
      onUpdated({ nickname: nicknameValue, profileImage });
      setPreview(null);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
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
      title="프로필 편집"
      onClose={pending ? undefined : onClose}
      className="profile-edit-modal"
    >
      <header className="profile-edit-header">
        <button type="button" aria-label="프로필 편집 닫기" onClick={onClose}>
          <img src={backLeftIcon} alt="" />
        </button>
        <strong>프로필 편집</strong>
      </header>
      <section className="profile-editor">
        <label className="profile-editor__avatar">
          <UserAvatar
            profileImage={preview || user.profileImage}
            nickname={user.nickname}
            size={160}
          />
          <span>
            <img src={cameraIcon} alt="프로필 이미지 선택" />
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={choose}
            disabled={pending}
          />
        </label>
        <div className="profile-editor__fields">
          <input aria-label="이메일" value={user.email} readOnly />
          <input
            aria-label="닉네임"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            disabled={pending}
          />
          <button
            className="button button--primary"
            type="button"
            disabled={!valid}
            onClick={submit}
          >
            {pending ? "저장 중" : "저장하기"}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
        <button
          className="profile-editor__delete"
          type="button"
          onClick={onDeleteAccount}
          disabled={pending}
        >
          회원탈퇴
        </button>
      </section>
    </Modal>
  );
}
