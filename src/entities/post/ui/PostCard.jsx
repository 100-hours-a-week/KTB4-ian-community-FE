import { useId, useRef, useState } from "react";
import { apiAssetUrl } from "../../../shared/config/env.js";
import { UserAvatar } from "../../user/ui/UserAvatar.jsx";
import { formatRelativeTime } from "../../../shared/lib/date.js";
import { formatCount } from "../../../shared/lib/formatCount.js";
import {
  commentIcon,
  heartFillIcon,
  heartStrokeIcon,
  lnbReceiptStrokeVector,
} from "../../../shared/assets/index.js";
import { OptionMenu } from "../../../shared/ui/OptionMenu.jsx";
import { MoreButton } from "../../../shared/ui/MoreButton.jsx";

export function PostCard({
  post,
  owned = false,
  onOpen,
  onLike,
  onEdit,
  onDelete,
}) {
  const [imageOrientation, setImageOrientation] = useState("landscape");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsTriggerRef = useRef(null);
  const generatedMenuId = useId();
  const menuId = `post-option-menu-${generatedMenuId.replaceAll(":", "")}`;

  return (
    <article className={`post-card ${onOpen ? "post-card--interactive" : ""}`}>
      {onOpen && (
        <button
          className="post-card__surface"
          type="button"
          aria-label="피드 상세 보기"
          onClick={onOpen}
        />
      )}
      <div className="post-card__body">
        <header className="post-card__header">
          <span className="identity">
            <UserAvatar
              profileImage={post.author.profileImage}
              nickname={post.author.nickname}
            />
            <strong>{post.author.nickname}</strong>
          </span>
          <span className="post-card__metadata">
            조회 {formatCount(post.viewCount)}
            {post.createdAt && (
              <>
                <span aria-hidden="true">ㆍ</span>
                <time dateTime={post.createdAt}>
                  {formatRelativeTime(post.createdAt)}
                </time>
              </>
            )}
          </span>
        </header>
        {post.imageUrl && (
          <img
            className={`post-card__image post-card__image--${imageOrientation}`}
            src={apiAssetUrl(post.imageUrl, null)}
            alt="피드 첨부 이미지"
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
            onLoad={(event) => {
              const { naturalWidth, naturalHeight } = event.currentTarget;
              setImageOrientation(
                naturalHeight > naturalWidth ? "portrait" : "landscape",
              );
            }}
          />
        )}
        <p className="post-card__content">{post.content}</p>
      </div>
      <footer className="post-actions">
        <button
          type="button"
          aria-label="좋아요"
          aria-pressed={post.liked}
          onClick={onLike}
        >
          <img src={post.liked ? heartFillIcon : heartStrokeIcon} alt="" />
          <span>{formatCount(post.likeCount)}</span>
        </button>
        <span className="post-action-label">
          <img src={commentIcon} alt="" />
          <span>{formatCount(post.commentCount)}</span>
        </span>
        {owned ? (
          <>
            <MoreButton
              className="post-actions__more"
              label="게시글 메뉴 열기"
              expanded={optionsOpen}
              controls={menuId}
              onClick={() => setOptionsOpen((open) => !open)}
              ref={optionsTriggerRef}
            />
            {optionsOpen && (
              <OptionMenu
                id={menuId}
                onEdit={onEdit}
                onDelete={onDelete}
                onClose={() => setOptionsOpen(false)}
                triggerRef={optionsTriggerRef}
              />
            )}
          </>
        ) : (
          <button
            className="post-actions__bookmark"
            type="button"
            aria-label="북마크"
            disabled
          >
            <span className="post-actions__receipt" aria-hidden="true">
              <img src={lnbReceiptStrokeVector} alt="" />
            </span>
          </button>
        )}
      </footer>
    </article>
  );
}
