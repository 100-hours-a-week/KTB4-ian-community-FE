import {
  apiRequest,
  initLogout,
  initProfileMenu,
  setError,
  showToast,
} from "../../scripts/common.js";

initProfileMenu();
initLogout();

const userId = sessionStorage.getItem("userId") ?? "1";
const form = document.querySelector("[data-profile-form]");
const nicknameInput = form.elements.nickname;
const nicknameError = document.querySelector("[data-nickname-error]");
const profileInput = document.querySelector("[data-profile-input]");
const profilePreview = document.querySelector("[data-profile-preview]");
const emailElement = document.querySelector("[data-email]");

async function loadProfile() {
  try {
    const user = await apiRequest(`/api/users/${userId}`);

    emailElement.textContent = user.email ?? "";
    nicknameInput.value = user.nickname ?? "";

    if (user.profileImageUrl) {
      profilePreview.src = user.profileImageUrl;
    }
  } catch (error) {
    console.warn(error.message);
  }
}

profileInput.addEventListener("change", () => {
  const [file] = profileInput.files;

  if (file) {
    profilePreview.src = URL.createObjectURL(file);
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nickname = nicknameInput.value.trim();

  if (!nickname || nickname.length > 10 || /\s/.test(nickname)) {
    setError(
      nicknameInput,
      nicknameError,
      "*닉네임은 공백 없이 10자 이하로 입력해주세요.",
    );
    return;
  }

  setError(nicknameInput, nicknameError, "");

  try {
    await apiRequest(`/api/users/${userId}/nickname`, {
      method: "PATCH",
      body: JSON.stringify({ nickname }),
    });

    if (profileInput.files[0]) {
      const formData = new FormData();
      formData.append("profileImage", profileInput.files[0]);

      await apiRequest(`/api/users/${userId}/profile-image`, {
        method: "PATCH",
        body: formData,
      });
    }

    showToast("수정 완료");
  } catch (error) {
    setError(nicknameInput, nicknameError, `*${error.message}`);
  }
});

const deleteModal = document.querySelector("[data-delete-modal]");

document.querySelector("[data-delete-account]").addEventListener("click", () => {
  deleteModal.classList.add("is-open");
});

document.querySelector("[data-cancel-delete]").addEventListener("click", () => {
  deleteModal.classList.remove("is-open");
});

document.querySelector("[data-confirm-delete]").addEventListener("click", async () => {
  try {
    await apiRequest(`/api/users/${userId}/delete`, { method: "DELETE" });
    sessionStorage.clear();
    window.location.href = "../login/login.html";
  } catch (error) {
    deleteModal.classList.remove("is-open");
    showToast(error.message);
  }
});

loadProfile();
