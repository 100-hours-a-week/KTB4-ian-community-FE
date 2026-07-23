import { backLeftIcon } from "../assets/index.js";

export function PageHeader({ title, onBack, titleId = "post-detail-title" }) {
  return (
    <header className="page-header">
      <button type="button" aria-label="뒤로가기" onClick={onBack}>
        <img src={backLeftIcon} alt="" aria-hidden="true" />
      </button>
      <h1 id={titleId}>{title}</h1>
    </header>
  );
}
