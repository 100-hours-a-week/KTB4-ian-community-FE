import { ICONS } from "../utils/icons.js";

const logo = new URL("../../assets/images/logo.png", import.meta.url).href;
const fallbackAvatar = new URL(
  "../../assets/images/profile-default.svg",
  import.meta.url,
).href;
let sessionHandlerMounted = false;

export function getSessionUser() {
  try {
    return {
      ...JSON.parse(sessionStorage.getItem("community.user") || "{}"),
      userId: sessionStorage.getItem("userId") || undefined,
    };
  } catch {
    return {};
  }
}

export function setSessionUser(patch) {
  const user = { ...getSessionUser(), ...patch };
  sessionStorage.setItem("community.user", JSON.stringify(user));
  if (user.userId) sessionStorage.setItem("userId", String(user.userId));
  else if (Object.hasOwn(patch, "userId")) sessionStorage.removeItem("userId");
  globalThis.dispatchEvent(
    new CustomEvent("community:user-changed", { detail: user }),
  );
  return user;
}

export function mountLnb({
  activeItem = "feed",
  onCreateFeed,
  onOpenProfile,
  onOpenPassword,
  onLogout,
} = {}) {
  const root = document.querySelector("[data-app-lnb]");
  if (!root) return;
  if (!sessionHandlerMounted) {
    sessionHandlerMounted = true;
    globalThis.addEventListener("community:session-expired", () => {
      globalThis.alert?.("로그인이 만료되었습니다. 다시 로그인해 주세요.");
      location.replace("../login/login.html?reason=session-expired");
    });
  }
  const item = (id, label, icon, href = "#") =>
    `<a class="app-lnb__item" data-nav="${id}" href="${href}" ${activeItem === id ? 'aria-current="page"' : ""}><img class="app-lnb__icon" src="${activeItem === id ? icon.active : icon.inactive}" alt="">${label}</a>`;
  root.className = "app-lnb";
  root.setAttribute("aria-label", "주요 메뉴");
  root.innerHTML = `<img class="app-lnb__logo" src="${logo}" alt="PULSE"><div class="app-lnb__content"><div class="app-lnb__groups"><nav class="app-lnb__group typography-label1-normal-medium" aria-label="피드 메뉴">${item("feed", "피드", ICONS.home, "../posts/posts.html")}<button class="app-lnb__item" data-create-feed type="button"><img class="app-lnb__icon" src="${ICONS.plus}" alt="">새로운 피드 작성</button>${item("bookmarks", "북마크", ICONS.bookmark, "../bookmarks/bookmarks.html")}</nav><nav class="app-lnb__group typography-label1-normal-medium" aria-label="회원정보 메뉴"><p class="app-lnb__label typography-caption-medium">회원정보</p><button class="app-lnb__item" data-nav="profile" data-profile type="button" aria-pressed="false"><img class="app-lnb__icon" src="${ICONS.profile.inactive}" alt="">프로필 편집</button><button class="app-lnb__item" data-nav="password" data-password type="button" aria-pressed="false"><img class="app-lnb__icon" src="${ICONS.lock.inactive}" alt="">비밀번호 변경</button></nav></div><div class="app-lnb__user"><div class="app-lnb__identity typography-label1-normal-semibold"><img class="app-lnb__avatar" data-user-avatar alt=""><span data-user-name></span></div><button class="app-lnb__logout typography-caption-medium" type="button" data-logout>로그아웃</button></div></div>`;
  const setActiveItem = (nextActiveItem) => {
    root.querySelectorAll("[data-nav]").forEach((navigationItem) => {
      const itemId = navigationItem.dataset.nav;
      const isActive = itemId === nextActiveItem;
      const itemIcons = ICONS[itemId];
      if (itemIcons)
        navigationItem.querySelector("img").src = isActive
          ? itemIcons.active
          : itemIcons.inactive;
      if (navigationItem.tagName === "A") {
        if (isActive) navigationItem.setAttribute("aria-current", "page");
        else navigationItem.removeAttribute("aria-current");
      } else navigationItem.setAttribute("aria-pressed", String(isActive));
    });
  };
  setActiveItem(activeItem);
  document.addEventListener("community:modal-opened", (event) => {
    if (event.detail.modal.matches("[data-profile-modal]"))
      setActiveItem("profile");
    if (event.detail.modal.matches("[data-password-modal]"))
      setActiveItem("password");
  });
  document.addEventListener("community:modal-closed", (event) => {
    if (
      event.detail.modal.matches("[data-profile-modal], [data-password-modal]")
    )
      setActiveItem(activeItem);
  });
  const renderUser = () => {
    const user = getSessionUser();
    root.querySelector("[data-user-avatar]").src =
      user.profileImage || fallbackAvatar;
    root.querySelector("[data-user-name]").textContent =
      user.nickname || "알 수 없음";
  };
  renderUser();
  globalThis.addEventListener("community:user-changed", renderUser);
  root
    .querySelector("[data-create-feed]")
    .addEventListener(
      "click",
      onCreateFeed ||
        (() => location.assign("../posts/posts.html?modal=create-feed")),
    );
  root
    .querySelector("[data-profile]")
    .addEventListener(
      "click",
      onOpenProfile ||
        (() =>
          globalThis.dispatchEvent(new CustomEvent("community:open-profile"))),
    );
  root
    .querySelector("[data-password]")
    .addEventListener(
      "click",
      onOpenPassword ||
        (() =>
          globalThis.dispatchEvent(new CustomEvent("community:open-password"))),
    );
  root
    .querySelector("[data-logout]")
    .addEventListener(
      "click",
      onLogout ||
        (() =>
          globalThis.dispatchEvent(
            new CustomEvent("community:request-logout"),
          )),
    );
}
