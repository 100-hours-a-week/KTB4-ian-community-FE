import { useRef } from "react";
import { UserAvatar } from "../../user/ui/UserAvatar.jsx";
import { moreDotsIcon } from "../../../shared/assets/index.js";
import { OptionMenu } from "../../../shared/ui/OptionMenu.jsx";

export function CommentItem({
  comment,
  owned = false,
  optionsOpen = false,
  onOpenOptions,
  onCloseOptions,
  onEdit,
  onDelete,
}) {
  const triggerRef = useRef(null);
  const nickname = comment.nickname ?? "알 수 없음";
  const profileImage = comment.profileImage ?? comment.profile_image;
  const content = comment.comment ?? comment.content ?? "";

  return (
    <article className="comment-item">
      <header className="comment-item__header">
        <span className="identity">
          <UserAvatar profileImage={profileImage} nickname={nickname} />
          <strong>{nickname}</strong>
        </span>
        {owned && (
          <button
            className="comment-item__options"
            type="button"
            aria-label="댓글 옵션"
            aria-haspopup="menu"
            aria-expanded={optionsOpen}
            onClick={onOpenOptions}
            ref={triggerRef}
          >
            <span aria-hidden="true">
              <img src={moreDotsIcon} alt="" />
            </span>
          </button>
        )}
        {optionsOpen && (
          <OptionMenu
            onEdit={onEdit}
            onDelete={onDelete}
            onClose={onCloseOptions}
            triggerRef={triggerRef}
          />
        )}
      </header>
      <p>{content}</p>
    </article>
  );
}
