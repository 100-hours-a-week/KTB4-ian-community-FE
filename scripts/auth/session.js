const RETURN_KEY = "community.safeReturnUrl";
const REGISTRATION_PROFILE_KEY = "community.registrationProfile";

export function isSafeReturnUrl(value) {
  if (
    !value ||
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  )
    return false;
  try {
    return new URL(value, location.origin).origin === location.origin;
  } catch {
    return false;
  }
}

export function rememberReturnUrl(
  value = `${location.pathname}${location.search}`,
) {
  if (isSafeReturnUrl(value)) sessionStorage.setItem(RETURN_KEY, value);
}

export function consumeReturnUrl(fallback = "../posts/posts.html") {
  const value = sessionStorage.getItem(RETURN_KEY);
  sessionStorage.removeItem(RETURN_KEY);
  return isSafeReturnUrl(value) ? value : fallback;
}

export function clearSession() {
  [
    "community.user",
    "community.accessIssuedAt",
    "userId",
    "nickname",
    "profileImage",
  ].forEach((key) => sessionStorage.removeItem(key));
}

export function rememberRegistrationProfile(profile) {
  sessionStorage.setItem(REGISTRATION_PROFILE_KEY, JSON.stringify(profile));
}

export function getRegistrationProfile(email) {
  try {
    const profile = JSON.parse(
      sessionStorage.getItem(REGISTRATION_PROFILE_KEY) || "null",
    );
    return profile?.email === email ? profile : null;
  } catch {
    return null;
  }
}
