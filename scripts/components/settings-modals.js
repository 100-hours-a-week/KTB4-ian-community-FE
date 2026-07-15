import { usersApi } from "../api/users-api.js";
import { clearSession } from "../auth/session.js";
import { getSessionUser, setSessionUser } from "./lnb.js";
import { ModalManager } from "./modal-manager.js";
import { ICONS } from "../utils/icons.js";

const fallbackAvatar = new URL(
  "../../assets/images/profile-default.svg",
  import.meta.url,
).href;
const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=])[A-Za-z\d!@#$%^&*()_+\-=]{8,20}$/;

export function mountSettingsModals(manager = new ModalManager()) {
  const host = document.createElement("div");
  host.innerHTML = `<div class="modal modal--editor" data-profile-modal hidden aria-labelledby="profile-modal-title"><section class="modal__dialog" tabindex="-1"><header class="modal__header settings-modal__header"><button data-settings-close>취소</button><h2 class="typography-title3-bold" id="profile-modal-title">프로필 편집</h2><span></span></header><form class="modal__body form profile-modal-form" data-profile-form><div class="avatar-upload"><div class="avatar"><img data-profile-preview alt="현재 프로필 이미지"></div><label class="avatar-upload__button" for="settings-profile-image"><img src="${ICONS.camera}" alt=""></label><input class="file-input" id="settings-profile-image" name="image" type="file" accept="image/png,image/jpeg,image/webp"></div><p class="profile-email typography-body3-normal-medium" data-profile-email aria-label="사용자 이메일"></p><label class="form-field"><span class="sr-only">닉네임</span><input class="form-input" name="nickname" maxlength="10" required aria-label="닉네임"></label><p class="helper-text" data-profile-error></p><button class="button button--primary" type="submit" disabled>저장하기</button></form><div class="profile-delete"><button class="typography-body3-normal-regular" type="button" data-delete-account>회원탈퇴</button></div></section></div><div class="modal modal--editor" data-password-modal hidden aria-labelledby="password-modal-title"><section class="modal__dialog" tabindex="-1"><header class="modal__header settings-modal__header"><button data-settings-close>취소</button><h2 class="typography-title3-bold" id="password-modal-title">비밀번호 변경</h2><span></span></header><form class="modal__body form" data-password-form><label class="form-field">현재 비밀번호<input class="form-input" name="password" type="password" autocomplete="current-password"></label><label class="form-field">새로운 비밀번호<input class="form-input" name="newPassword" type="password" autocomplete="new-password"></label><label class="form-field">새로운 비밀번호 확인<input class="form-input" name="confirmation" type="password" autocomplete="new-password"></label><p class="helper-text" data-password-help aria-live="polite">현재 비밀번호와 새로운 비밀번호를 모두 입력해 주세요.</p><button class="button button--primary" type="submit" disabled>변경하기</button></form></section></div><div class="modal" data-account-confirm hidden aria-labelledby="account-confirm-title"><section class="modal__dialog" tabindex="-1"><h2 class="modal__title" id="account-confirm-title">회원탈퇴 하실건가요?</h2><p class="modal__description">탈퇴 후에는 계정을 복구할 수 없습니다.</p><div class="modal__actions"><button class="button button--outline" data-account-cancel>취소</button><button class="button button--dark" data-account-confirm>탈퇴하기</button></div></section></div>`;
  document.body.append(...host.children);
  const profileModal = document.querySelector("[data-profile-modal]");
  const profileForm = profileModal.querySelector("[data-profile-form]");
  const passwordModal = document.querySelector("[data-password-modal]");
  const passwordForm = passwordModal.querySelector("[data-password-form]");
  const accountConfirm = document.querySelector("[data-account-confirm]");
  let originalNickname;
  let profilePreviewUrl;
  function renderProfileUser(user) {
    originalNickname = user.nickname || "";
    profileForm.querySelector("[data-profile-email]").textContent =
      user.email || "이메일 정보 없음";
    profileForm.elements.nickname.value = originalNickname;
    profileForm.querySelector("[data-profile-preview]").src =
      user.profileImage || fallbackAvatar;
    profileForm.querySelector("button[type=submit]").disabled = true;
  }
  async function openProfile() {
    const user = getSessionUser();
    renderProfileUser(user);
    manager.open(profileModal);
    if (!user.userId) return;
    try {
      const currentUser = await usersApi.me(user.userId);
      renderProfileUser(setSessionUser(currentUser));
    } catch (error) {
      profileForm.querySelector("[data-profile-error]").textContent =
        error.message;
    }
  }
  function openPassword() {
    passwordForm.reset();
    passwordForm.querySelector("button").disabled = true;
    manager.open(passwordModal);
  }
  globalThis.addEventListener("community:open-profile", openProfile);
  globalThis.addEventListener("community:open-password", openPassword);
  document
    .querySelectorAll("[data-settings-close]")
    .forEach((button) =>
      button.addEventListener("click", () => manager.close("cancel")),
    );
  profileForm.elements.nickname.addEventListener(
    "input",
    () =>
      (profileForm.querySelector("button[type=submit]").disabled =
        !profileForm.elements.nickname.value.trim() ||
        profileForm.elements.nickname.value.trim() === originalNickname),
  );
  profileForm.elements.image.addEventListener("change", () => {
    const file = profileForm.elements.image.files[0];
    if (!file) return;
    if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);
    profilePreviewUrl = URL.createObjectURL(file);
    profileForm.querySelector("[data-profile-preview]").src = profilePreviewUrl;
    setSessionUser({ profileImage: profilePreviewUrl });
  });
  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const nickname = profileForm.elements.nickname.value.trim();
    try {
      await usersApi.nickname(getSessionUser().userId || 0, nickname);
      setSessionUser({ nickname });
      originalNickname = nickname;
      manager.close("success");
    } catch (error) {
      profileForm.querySelector("[data-profile-error]").textContent =
        error.message;
    }
  });
  passwordForm.addEventListener("input", () => {
    const complete = [...new FormData(passwordForm).values()].every(Boolean);
    passwordForm.querySelector("button").disabled = !complete;
    passwordForm.querySelector("[data-password-help]").textContent = complete
      ? ""
      : "현재 비밀번호와 새로운 비밀번호를 모두 입력해 주세요.";
  });
  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const current = passwordForm.elements.password.value;
    const next = passwordForm.elements.newPassword.value;
    const confirmation = passwordForm.elements.confirmation.value;
    const help = passwordForm.querySelector("[data-password-help]");
    if (!passwordPattern.test(next))
      return (help.textContent =
        "비밀번호는 8~20자이며 대·소문자, 숫자, 특수문자를 포함해야 합니다.");
    if (current === next)
      return (help.textContent =
        "새 비밀번호는 현재 비밀번호와 달라야 합니다.");
    if (next !== confirmation)
      return (help.textContent = "새로운 비밀번호가 일치하지 않습니다.");
    try {
      await usersApi.password(getSessionUser().userId || 0, {
        password: current,
        newPassword: next,
        password_confirm: confirmation,
      });
      manager.close("success");
    } catch (error) {
      help.textContent = error.message;
    }
  });
  profileModal
    .querySelector("[data-delete-account]")
    .addEventListener("click", () => manager.open(accountConfirm));
  accountConfirm
    .querySelector("[data-account-cancel]")
    .addEventListener("click", () => manager.close("cancel"));
  accountConfirm
    .querySelector("[data-account-confirm]")
    .addEventListener("click", async () => {
      await usersApi.remove(getSessionUser().userId || 0);
      manager.closeAll();
      clearSession();
      location.assign("../login/login.html");
    });
  return { openProfile, openPassword };
}
