import { forwardRef } from "react";
import { moreDotsIcon } from "../assets/index.js";

export const MoreButton = forwardRef(function MoreButton(
  {
    label,
    expanded = false,
    controls,
    onClick,
    className = "",
  },
  ref,
) {
  return (
    <button
      className={`more-button ${className}`.trim()}
      type="button"
      aria-label={label}
      aria-haspopup="menu"
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
      ref={ref}
    >
      <span aria-hidden="true">
        <img src={moreDotsIcon} alt="" />
      </span>
    </button>
  );
});
