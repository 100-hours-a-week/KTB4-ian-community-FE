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
const form = document.querySelector("[data-password-form]");
const passwordInput = form.elements.password;
const currentPasswordInput = form.elements.currentPassword;
const passwordConfirmInput = form.elements.passwordConfirm;
const passwordError = document.querySelector("[data-password-error]");
const passwordConfirmError = document.querySelector(
  "[data-password-confirm-error]",
);

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=])[A-Za-z\d!@#$%^&*()_+\-=]{8,20}$/;
const submitButton = form.querySelector("button[type=submit]");
form.addEventListener("input", () => {
  submitButton.disabled =
    !currentPasswordInput.value ||
    !passwordInput.value ||
    !passwordConfirmInput.value;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  let isValid = true;

  if (!passwordPattern.test(passwordInput.value)) {
    setError(
      passwordInput,
      passwordError,
      "*비밀번호는 8~20자이며 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.",
    );
    isValid = false;
  } else {
    setError(passwordInput, passwordError, "");
  }

  if (
    !passwordConfirmInput.value ||
    passwordConfirmInput.value !== passwordInput.value
  ) {
    setError(
      passwordConfirmInput,
      passwordConfirmError,
      "*비밀번호가 일치하지 않습니다.",
    );
    isValid = false;
  } else {
    setError(passwordConfirmInput, passwordConfirmError, "");
  }

  if (!isValid) {
    return;
  }
  if (currentPasswordInput.value === passwordInput.value) {
    setError(
      passwordInput,
      passwordError,
      "*새 비밀번호는 현재 비밀번호와 달라야 합니다.",
    );
    return;
  }

  try {
    await apiRequest(`/api/users/${userId}/password`, {
      method: "PATCH",
      body: JSON.stringify({
        password: currentPasswordInput.value,
        newPassword: passwordInput.value,
        password_confirm: passwordConfirmInput.value,
      }),
    });

    form.reset();
    showToast("수정 완료");
  } catch (error) {
    setError(passwordInput, passwordError, `*${error.message}`);
  }
});
