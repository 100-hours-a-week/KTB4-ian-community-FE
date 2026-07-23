import { ApiError } from "./apiError.js";
import { apiBaseUrl } from "../config/env.js";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const NO_REFRESH_PATHS = new Set([
  "/api/csrf",
  "/api/users/login",
  "/api/users/signup",
  "/api/users/logout",
  "/api/users/refresh",
]);
let refreshPromise = null;

function readCookie(name) {
  return (
    document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${name}=`))
      ?.slice(name.length + 1) ?? null
  );
}

async function parse(response) {
  if (response.status === 204) return null;
  const type = response.headers.get("content-type") || "";
  if (!type.includes("application/json")) return response.text();
  try {
    return await response.json();
  } catch (cause) {
    throw new ApiError("서버 응답을 해석할 수 없습니다.", {
      status: response.status,
      cause,
    });
  }
}

async function csrfToken(signal) {
  let token = readCookie("XSRF-TOKEN");
  if (!token) {
    const response = await fetch(`${apiBaseUrl()}/api/csrf`, {
      credentials: "include",
      signal,
    });
    if (!response.ok)
      throw new ApiError("CSRF 토큰을 발급받지 못했습니다.", {
        status: response.status,
      });
    token = readCookie("XSRF-TOKEN");
  }
  if (!token) throw new ApiError("XSRF-TOKEN 쿠키를 확인할 수 없습니다.");
  return decodeURIComponent(token);
}

async function send(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) {
    if (!headers.has("Content-Type"))
      headers.set("Content-Type", "application/json");
  }
  if (UNSAFE_METHODS.has(method))
    headers.set("X-XSRF-TOKEN", await csrfToken(options.signal));
  return fetch(`${apiBaseUrl()}${path}`, {
    ...options,
    method,
    headers,
    credentials: "include",
  });
}

async function refresh(signal) {
  if (!refreshPromise) {
    refreshPromise = send("/api/users/refresh", { method: "POST", signal })
      .then((response) => {
        if (!response.ok)
          throw new ApiError("세션을 갱신하지 못했습니다.", {
            status: response.status,
          });
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function httpClient(path, options = {}) {
  let response;
  try {
    response = await send(path, options);
  } catch (cause) {
    if (cause?.name === "AbortError") throw cause;
    if (cause instanceof ApiError) throw cause;
    throw new ApiError("백엔드 서버에 연결할 수 없습니다.", { cause });
  }
  let body = await parse(response);
  const pathname = path.split("?")[0];
  const expired =
    response.status === 401 && body?.message === "expired_access_token";
  if (expired && !options.__retried && !NO_REFRESH_PATHS.has(pathname)) {
    await refresh(options.signal);
    response = await send(path, { ...options, __retried: true });
    body = await parse(response);
  }
  if (!response.ok)
    throw new ApiError(body?.message || body || "요청 처리에 실패했습니다.", {
      status: response.status,
      code: body?.code ?? body?.errorCode,
      fieldErrors: body?.fieldErrors,
    });
  return body?.data ?? body;
}

export function resetHttpClientForTests() {
  refreshPromise = null;
}
