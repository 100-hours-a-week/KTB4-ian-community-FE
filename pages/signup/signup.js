import {
  apiRequest,
  initBackButton,
  setError,
} from "../../scripts/common.js";

initBackButton("../login/login.html");

const form = document.querySelector("[data-signup-form]");
const profileInput = document.querySelector("[data-profile-input]");
const profilePreview = document.querySelector("[data-profile-preview]");

const emailInput = form.elements.email;
const passwordInput = form.elements.password;
const passwordConfirmInput = form.elements.passwordConfirm;
const nicknameInput = form.elements.nickname;

const emailError = document.querySelector("[data-email-error]");
const passwordError = document.querySelector("[data-password-error]");
const passwordConfirmError = document.querySelector(
  "[data-password-confirm-error]",
);
const nicknameError = document.querySelector("[data-nickname-error]");

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=])[A-Za-z\d!@#$%^&*()_+\-=]{8,20}$/;
const defaultProfileImage = "../../assets/images/profile-default.svg";

profileInput.addEventListener("change", () => {
  const [file] = profileInput.files;

  if (file) {
    profilePreview.src = URL.createObjectURL(file);
  }
});

function validate() {
  let isValid = true;

  if (!emailInput.value.trim() || !emailInput.validity.valid) {
    setError(emailInput, emailError, "*올바른 이메일 주소를 입력해주세요.");
    isValid = false;
  } else {
    setError(emailInput, emailError, "");
  }

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

  const nickname = nicknameInput.value.trim();

  if (!nickname || nickname.length > 10 || /\s/.test(nickname)) {
    setError(
      nicknameInput,
      nicknameError,
      "*닉네임은 공백 없이 10자 이하로 입력해주세요.",
    );
    isValid = false;
  } else {
    setError(nicknameInput, nicknameError, "");
  }

  return isValid;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validate()) {
    return;
  }

  const formData = new FormData();

  const request = {
    email: emailInput.value.trim(),
    password: passwordInput.value,
    password_confirm: passwordConfirmInput.value,
    nickname: nicknameInput.value.trim(),
    profile_image: defaultProfileImage,
  };

  formData.append(
    "request",
    new Blob([JSON.stringify(request)], {
      type: "application/json",
    }),
  );

  if (profileInput.files[0]) {
    formData.append("image", profileInput.files[0]);
  }

  try {
    await apiRequest("/api/users/signup", {
      method: "POST",
      body: formData,
    });

    window.location.href = "../login/login.html";
  } catch (error) {
    setError(emailInput, emailError, `*${error.message}`);
  }
});
