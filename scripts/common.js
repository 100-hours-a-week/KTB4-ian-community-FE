const API_PORT = "8080";
const API_HOST = window.location.hostname || "localhost";
const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;

export async function apiRequest(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      headers: {
        ...(!(options.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
      ...options,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `백엔드 서버에 연결할 수 없습니다. ${API_BASE_URL} 실행 여부와 CORS 설정을 확인해주세요.`,
      );
    }

    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null
        ? body.message ?? "요청 처리에 실패했습니다."
        : body || "요청 처리에 실패했습니다.";

    throw new Error(message);
  }

  return body;
}

export function initProfileMenu() {
  const button = document.querySelector("[data-profile-button]");
  const menu = document.querySelector("[data-profile-menu]");

  if (!button || !menu) {
    return;
  }

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = menu.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", () => {
    menu.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
  });
}

export function initBackButton(fallbackUrl) {
  const button = document.querySelector("[data-back-button]");

  if (!button) {
    return;
  }

  button.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = fallbackUrl;
  });
}

export function initLogout() {
  const button = document.querySelector("[data-logout-button]");

  if (!button) {
    return;
  }

  button.addEventListener("click", async () => {
    try {
      await apiRequest("/api/users/logout", { method: "POST" });
    } catch (error) {
      console.warn(error.message);
    } finally {
      sessionStorage.clear();
      window.location.href = "../login/login.html";
    }
  });
}

export function setError(input, errorElement, message) {
  input.setAttribute("aria-invalid", String(Boolean(message)));
  errorElement.textContent = message;
}

export function showToast(message) {
  const toast = document.querySelector("[data-toast]");

  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("is-visible");

  window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1800);
}

export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

export function formatCount(value) {
  const number = Number(value) || 0;

  if (number >= 100000) {
    return `${Math.floor(number / 1000) / 10}k`;
  }

  if (number >= 1000) {
    return `${Math.floor(number / 100) / 10}k`;
  }

  return String(number);
}
