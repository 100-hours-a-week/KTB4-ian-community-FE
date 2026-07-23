export function apiBaseUrl() {
  return (
    globalThis.__API_BASE_URL__ ??
    `http://${globalThis.location?.hostname || "localhost"}:8080`
  );
}

export const DEFAULT_PROFILE_PATH = "/images/profile-default.svg";

export function apiAssetUrl(value, fallback = DEFAULT_PROFILE_PATH) {
  const source = value || fallback;
  if (/^(?:https?:|blob:|data:)/i.test(source)) return source;
  return `${apiBaseUrl()}${source.startsWith("/") ? source : `/${source}`}`;
}
