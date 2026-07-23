import { useRef, useState } from "react";
import { apiAssetUrl } from "../../../shared/config/env.js";
import { UserAvatar } from "../../user/ui/UserAvatar.jsx";
import { formatRelativeTime } from "../../../shared/lib/date.js";
import { formatCount } from "../../../shared/lib/formatCount.js";
import {
  commentIcon,
  heartFillIcon,
  heartStrokeIcon,
  lnbReceiptStrokeVector,
  moreDotsIcon,
} from "../../../shared/assets/index.js";
import { OptionMenu } from "../../../shared/ui/OptionMenu.jsx";

export function PostCard({ post, onOpen, onLike, onEdit, onDelete }) {
  const [imageOrientation, setImageOrientation] = useState("landscape");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsTriggerRef = useRef(null);

  return (
    <article className="post-card">
      <div
        className="post-card__body"
        role={onOpen ? "button" : undefined}
        aria-label={onOpen ? "피드 상세 보기" : undefined}
        tabIndex={onOpen ? 0 : undefined}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (!onOpen || (event.key !== "Enter" && event.key !== " ")) return;
          event.preventDefault();
          onOpen();
        }}
      >
        <header className="post-card__header">
          <span className="identity">
            <UserAvatar
              profileImage={post.author.profileImage}
              nickname={post.author.nickname}
            />
            <strong>{post.author.nickname}</strong>
          </span>
          <span className="post-card__tools">
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
            {(onEdit || onDelete) && (
              <button
                className="post-card__options"
                type="button"
                aria-label="피드 옵션"
                aria-haspopup="menu"
                aria-expanded={optionsOpen}
                onClick={(event) => {
                  event.stopPropagation();
                  setOptionsOpen(true);
                }}
                ref={optionsTriggerRef}
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
                onClose={() => setOptionsOpen(false)}
                triggerRef={optionsTriggerRef}
              />
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
      </footer>
    </article>
  );
}
