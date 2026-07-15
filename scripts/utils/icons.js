const icon = (name) =>
  new URL(`../../assets/icons/${name}`, import.meta.url).href;

export const ICONS = Object.freeze({
  home: { inactive: icon("home-stroke.svg"), active: icon("home-fill.svg") },
  // The repository's receipt/mypage filenames are reversed relative to their visual paths.
  bookmark: {
    inactive: icon("receipt-fill.svg"),
    active: icon("receipt-stroke.svg"),
  },
  profile: {
    inactive: icon("mypage-fill.svg"),
    active: icon("mypage-stroke.svg"),
  },
  lock: { inactive: icon("Lock.svg"), active: icon("Lock.svg") },
  like: { inactive: icon("heart-stroke.svg"), active: icon("heart-fill.svg") },
  comment: icon("Comment.svg"),
  camera: icon("Camera.svg"),
  directionTop: icon("direction_top.svg"),
  directionLeft: icon("direction_left.svg"),
  more: icon("more.svg"),
  trash: icon("trash.svg"),
  plus: icon("plus.svg"),
});

export function setToggleIcon(button, active, icons) {
  const image = button.querySelector("img");
  button.setAttribute("aria-pressed", String(active));
  button.dataset.active = String(active);
  if (image) image.src = active ? icons.active : icons.inactive;
  button.classList.remove("is-popping");
  requestAnimationFrame(() => button.classList.add("is-popping"));
}
