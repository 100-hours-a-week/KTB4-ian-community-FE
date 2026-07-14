import { clearSession, rememberReturnUrl } from "../auth/session.js";

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const REFRESH_EXCLUDED = new Set(["/api/users/login", "/api/users/signup", "/api/users/refresh", "/api/users/logout", "/api/csrf"]);
let refreshPromise = null;
let sessionExpiryHandled = false;

export class ApiError extends Error {
  constructor(message, { status, code, body } = {}) {
    super(message); this.name = "ApiError"; this.status = status; this.code = code; this.body = body;
  }
}

const baseUrl = () => globalThis.__API_BASE_URL__ ?? `http://${location.hostname || "localhost"}:8080`;

function cookie(name) {
  return document.cookie.split("; ").find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || null;
}

async function parse(response) {
  if (response.status === 204) return null;
  const type = response.headers.get("content-type") || "";
  return type.includes("application/json") ? response.json() : response.text();
}

export async function issueCsrfToken() {
  const response = await fetch(`${baseUrl()}/api/csrf`, { credentials: "include" });
  if (!response.ok) throw new ApiError("CSRF 토큰을 발급받지 못했습니다.", { status: response.status });
}

async function csrf() {
  let token = cookie("XSRF-TOKEN");
  if (!token) { await issueCsrfToken(); token = cookie("XSRF-TOKEN"); }
  if (!token) throw new ApiError("XSRF-TOKEN 쿠키를 확인할 수 없습니다.");
  return decodeURIComponent(token);
}

async function send(path, options) {
  const { __retried, __skipRefresh, ...networkOptions } = options;
  const method = (networkOptions.method || "GET").toUpperCase();
  const headers = new Headers(networkOptions.headers || {});
  if (networkOptions.body && !(networkOptions.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (UNSAFE.has(method)) headers.set("X-XSRF-TOKEN", await csrf());
  return fetch(`${baseUrl()}${path}`, { ...networkOptions, method, headers, credentials: "include" });
}

function isExpired(response, body) {
  return response.status === 401 && body?.message === "expired_access_token";
}

async function refresh() {
  if (!refreshPromise) {
    refreshPromise = send("/api/users/refresh", { method: "POST", __skipRefresh: true })
      .then((response) => { if (response.status !== 204) throw new ApiError("세션을 갱신하지 못했습니다.", { status: response.status }); })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

function expireSession() {
  if (sessionExpiryHandled) return;
  sessionExpiryHandled = true; clearSession(); rememberReturnUrl();
  globalThis.dispatchEvent?.(new CustomEvent("community:session-expired"));
}

export async function apiRequest(path, options = {}) {
  let response;
  try { response = await send(path, options); }
  catch (error) { if (error instanceof TypeError) throw new ApiError(`백엔드 서버에 연결할 수 없습니다. ${baseUrl()} 실행 여부와 CORS 설정을 확인해주세요.`); throw error; }
  let body = await parse(response);

  const pathname = path.split("?")[0];
  if (isExpired(response, body) && !options.__retried && !options.__skipRefresh && !REFRESH_EXCLUDED.has(pathname) && !options.signal?.aborted) {
    try { await refresh(); }
    catch (error) { expireSession(); throw error; }
    response = await send(path, { ...options, __retried: true });
    body = await parse(response);
    if (isExpired(response, body)) expireSession();
  }
  if (!response.ok) throw new ApiError(body?.message || body || "요청 처리에 실패했습니다.", { status: response.status, code: body?.code ?? body?.errorCode, body });
  sessionExpiryHandled = false;
  return body?.data ?? body;
}

export function __resetHttpClientForTests() { refreshPromise = null; sessionExpiryHandled = false; }
