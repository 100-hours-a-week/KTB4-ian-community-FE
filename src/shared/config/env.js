export function defaultApiBaseUrl(location = globalThis.location) {
  const hostname = location?.hostname || "localhost";
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";

  if (isLocal) return `http://${hostname}:8080`;
  if (location?.origin && location.origin !== "null") return location.origin;

  return `http://${hostname}:8080`;
}

export function apiBaseUrl() {
  return globalThis.__API_BASE_URL__ ?? defaultApiBaseUrl();
}

export const DEFAULT_PROFILE_PATH = "/images/profile-default.svg";

export function apiAssetUrl(value, fallback = DEFAULT_PROFILE_PATH) {
  const source = value || fallback;
  if (/^(?:https?:|blob:|data:)/i.test(source)) return source;
  return `${apiBaseUrl()}${source.startsWith("/") ? source : `/${source}`}`;
}
