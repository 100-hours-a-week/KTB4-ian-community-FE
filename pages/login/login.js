import { apiRequest, issueCsrfToken, setError } from "../../scripts/common.js";

const form = document.querySelector("[data-login-form]");
const emailInput = form.elements.email;
const passwordInput = form.elements.password;
const emailError = document.querySelector("[data-email-error]");
const passwordError = document.querySelector("[data-password-error]");

function validateEmail() {
  const value = emailInput.value.trim();

  if (!value) {
    setError(emailInput, emailError, "*이메일을 입력해주세요.");
    return false;
  }

  if (!emailInput.validity.valid) {
    setError(emailInput, emailError, "*올바른 이메일 형식을 입력해주세요.");
    return false;
  }

  setError(emailInput, emailError, "");
  return true;
}

function validatePassword() {
  if (!passwordInput.value) {
    setError(passwordInput, passwordError, "*비밀번호를 입력해주세요.");
    return false;
  }

  setError(passwordInput, passwordError, "");
  return true;
}

emailInput.addEventListener("blur", validateEmail);
passwordInput.addEventListener("blur", validatePassword);

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateEmail() || !validatePassword()) {
    return;
  }

  try {
    const response = await apiRequest("/api/users/login", {
      method: "POST",
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value,
      }),
    });

    await issueCsrfToken();

    if (response?.userId) {
      sessionStorage.setItem("userId", String(response.userId));
    }

    window.location.href = "../posts/posts.html";
  } catch (error) {
    setError(
      passwordInput,
      passwordError,
      `*${error.message || "아이디 또는 비밀번호를 확인해주세요."}`,
    );
  }
});

async function initializeLoginPage() {
  try {
    await issueCsrfToken();
  } catch (error) {
    console.warn(
      error.message ||
        "CSRF 토큰 초기화에 실패했습니다.",
    );
  }
}

initializeLoginPage();