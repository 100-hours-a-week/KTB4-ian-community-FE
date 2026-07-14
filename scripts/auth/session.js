const RETURN_KEY = "community.safeReturnUrl";

export function isSafeReturnUrl(value) {
  if (!value || typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return false;
  try { return new URL(value, location.origin).origin === location.origin; } catch { return false; }
}

export function rememberReturnUrl(value = `${location.pathname}${location.search}`) {
  if (isSafeReturnUrl(value)) sessionStorage.setItem(RETURN_KEY, value);
}

export function consumeReturnUrl(fallback = "../posts/posts.html") {
  const value = sessionStorage.getItem(RETURN_KEY);
  sessionStorage.removeItem(RETURN_KEY);
  return isSafeReturnUrl(value) ? value : fallback;
}

export function clearSession() {
  ["community.user", "userId", "nickname", "profileImage"].forEach((key) => sessionStorage.removeItem(key));
}
