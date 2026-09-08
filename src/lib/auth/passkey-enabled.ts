const PASSKEY_DISABLED_HOSTS = new Set([
  "lostinseoul.com",
  "www.lostinseoul.com"
]);

export function isPasskeyEnabled() {
  if (typeof window === "undefined") return true;
  return !PASSKEY_DISABLED_HOSTS.has(window.location.hostname);
}
