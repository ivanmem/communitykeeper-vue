export function isDisabledCookies() {
  try {
    return localStorage && false;
  } catch {
    return true;
  }
}
