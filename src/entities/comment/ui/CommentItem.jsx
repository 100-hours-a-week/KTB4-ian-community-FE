import { useId, useRef } from "react";
import { UserAvatar } from "../../user/ui/UserAvatar.jsx";
import { OptionMenu } from "../../../shared/ui/OptionMenu.jsx";
import { MoreButton } from "../../../shared/ui/MoreButton.jsx";

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
  const generatedMenuId = useId();
  const menuId = `comment-option-menu-${generatedMenuId.replaceAll(":", "")}`;
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
          <MoreButton
            className="comment-item__options"
            label="댓글 메뉴 열기"
            expanded={optionsOpen}
            controls={menuId}
            onClick={onOpenOptions}
            ref={triggerRef}
          />
        )}
        {optionsOpen && (
          <OptionMenu
            id={menuId}
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
