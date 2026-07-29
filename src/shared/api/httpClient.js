import { ApiError } from "./apiError.js";
import { errorMessageFor } from "./errorMessages.js";
import { apiBaseUrl } from "../config/env.js";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const NO_REFRESH_PATHS = new Set([
  "/api/csrf",
  "/api/users/login",
  "/api/users/signup",
  "/api/users/logout",
  "/api/users/refresh",
]);
const EXPIRY_STORAGE_KEY = "community.accessTokenExpiresAt";
const REFRESH_WINDOW_MS = 45_000;
let refreshPromise = null;
let refreshTimer = null;
let redirecting = false;
let accessTokenExpiresAt = null;

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
      response,
      cause,
    });
  }
}

function toApiError(response, body) {
  const code = body?.code ?? body?.errorCode;
  const serverMessage =
    typeof body === "string" ? body : (body?.message ?? undefined);
  return new ApiError(errorMessageFor(code, serverMessage), {
    status: response.status,
    code,
    fieldErrors: body?.fieldErrors,
    response,
    serverMessage,
  });
}

async function csrfToken(signal) {
  let token = readCookie("XSRF-TOKEN");
  if (!token) {
    const response = await fetch(`${apiBaseUrl()}/api/csrf`, {
      credentials: "include",
      signal,
    });
    if (!response.ok) throw toApiError(response, await parse(response));
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
  const { __retried, ...fetchOptions } = options;
  return fetch(`${apiBaseUrl()}${path}`, {
    ...fetchOptions,
    method,
    headers,
    credentials: "include",
  });
}

function expiryValue(value) {
  return value?.accessTokenExpiresAt ?? value?.access_token_expires_at ?? null;
}

export function clearAccessTokenRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = null;
  accessTokenExpiresAt = null;
  sessionStorage.removeItem(EXPIRY_STORAGE_KEY);
}

export function setAccessTokenExpiresAt(value) {
  if (!value || Number.isNaN(Date.parse(value))) return;
  accessTokenExpiresAt = value;
  sessionStorage.setItem(EXPIRY_STORAGE_KEY, value);
  if (refreshTimer) clearTimeout(refreshTimer);
  const delay = Math.max(Date.parse(value) - Date.now() - REFRESH_WINDOW_MS, 0);
  refreshTimer = setTimeout(() => {
    refresh().catch(handleSessionFailure);
  }, delay);
}

function expiringSoon() {
  return Boolean(
    accessTokenExpiresAt &&
    Date.parse(accessTokenExpiresAt) - Date.now() <= REFRESH_WINDOW_MS,
  );
}

function handleSessionFailure() {
  clearAccessTokenRefresh();
  sessionStorage.removeItem("community.user");
  sessionStorage.removeItem("userId");
  globalThis.dispatchEvent?.(new CustomEvent("auth:expired"));
  if (!redirecting && globalThis.location?.pathname !== "/login") {
    redirecting = true;
    history.replaceState({}, "", "/login");
    globalThis.dispatchEvent?.(new PopStateEvent("popstate"));
  }
}

async function refresh(signal) {
  if (!refreshPromise) {
    refreshPromise = send("/api/users/refresh", { method: "POST", signal })
      .then(async (response) => {
        const body = await parse(response);
        if (!response.ok) throw toApiError(response, body);
        const value = body?.data ?? body;
        const expiresAt = expiryValue(value);
        if (expiresAt) setAccessTokenExpiresAt(expiresAt);
        return value;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function checkAccessTokenExpiry() {
  if (!expiringSoon()) return false;
  await refresh();
  return true;
}

export async function httpClient(path, options = {}) {
  const pathname = path.split("?")[0];
  try {
    if (!NO_REFRESH_PATHS.has(pathname)) await checkAccessTokenExpiry();
    let response = await send(path, options);
    let body = await parse(response);
    const expired =
      response.status === 401 &&
      (body?.code === "EXPIRED_ACCESS_TOKEN" ||
        body?.message === "expired_access_token");
    if (expired && !options.__retried && !NO_REFRESH_PATHS.has(pathname)) {
      try {
        await refresh(options.signal);
      } catch (cause) {
        handleSessionFailure();
        throw cause;
      }
      response = await send(path, { ...options, __retried: true });
      body = await parse(response);
    }
    if (!response.ok) throw toApiError(response, body);
    const value = body?.data ?? body;
    const expiresAt = expiryValue(value);
    if (expiresAt) setAccessTokenExpiresAt(expiresAt);
    return value;
  } catch (cause) {
    if (cause?.name === "AbortError" || cause instanceof ApiError) throw cause;
    throw new ApiError("백엔드 서버에 연결할 수 없습니다.", { cause });
  }
}

function restoreExpiry() {
  const stored = sessionStorage.getItem(EXPIRY_STORAGE_KEY);
  if (stored) setAccessTokenExpiresAt(stored);
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible")
      checkAccessTokenExpiry().catch(handleSessionFailure);
  });
  restoreExpiry();
}

export function resetHttpClientForTests() {
  refreshPromise = null;
  redirecting = false;
  clearAccessTokenRefresh();
}
