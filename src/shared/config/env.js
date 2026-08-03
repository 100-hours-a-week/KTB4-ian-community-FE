export function defaultApiBaseUrl(hostname) {
  const normalizedHostname = hostname || "localhost";
  if (normalizedHostname === "localhost" || normalizedHostname === "127.0.0.1")
    return `http://${normalizedHostname}:8080`;
  return "";
}

export function apiBaseUrl() {
  return (
    globalThis.__API_BASE_URL__ ??
    defaultApiBaseUrl(globalThis.location?.hostname)
  );
}

export const DEFAULT_PROFILE_PATH = "/images/profile-default.svg";

export function apiAssetUrl(value, fallback = DEFAULT_PROFILE_PATH) {
  const source = value || fallback;
  if (/^(?:https?:|blob:|data:)/i.test(source)) return source;
  return `${apiBaseUrl()}${source.startsWith("/") ? source : `/${source}`}`;
}
