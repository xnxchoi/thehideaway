export const LOST_GATE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const LOST_GATE_COOKIE_NAME = "lostinseoul.gate";
const LOST_GATE_COOKIE_VERSION = "v1";

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function isLostGatePassword(value: string): Promise<boolean> {
  const configured = process.env.LOSTINSEOUL_GATE_PASSWORD_SHA256?.trim();
  if (!configured || !/^[a-f0-9]{64}$/i.test(configured)) return false;

  return (await sha256Hex(value)) === configured.toLowerCase();
}

function lostGateSessionSecret(): string | null {
  const value =
    process.env.LOSTINSEOUL_GATE_SESSION_SECRET?.trim() ||
    process.env.BETTER_AUTH_SECRET?.trim();

  return value || null;
}

async function importLostGateSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign", "verify"]
  );
}

function signatureHex(signature: ArrayBuffer): string {
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function signatureBytes(value: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[a-f0-9]{64}$/.test(value)) return null;

  const bytes = new Uint8Array(32);
  for (let index = 0; index < bytes.length; index++) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function lostGateCookiePayload(expiresAt: number): string {
  return `${LOST_GATE_COOKIE_VERSION}.${expiresAt}`;
}

export async function createLostGateCookieValue(
  now = Date.now()
): Promise<string | null> {
  const secret = lostGateSessionSecret();
  if (!secret) return null;

  const expiresAt = now + LOST_GATE_COOKIE_MAX_AGE_SECONDS * 1000;
  const payload = lostGateCookiePayload(expiresAt);
  const key = await importLostGateSigningKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  return `${payload}.${signatureHex(signature)}`;
}

export async function hasLostGateCookie(
  request: {
    cookies: { get: (name: string) => { value?: string } | undefined };
  },
  now = Date.now()
): Promise<boolean> {
  // Dev-only bypass: never gate the storefront in local development, so the
  // members-only pages load without the passcode. NODE_ENV is "development"
  // only under `next dev`; production builds are unaffected.
  if (process.env.NODE_ENV === "development") return true;

  const secret = lostGateSessionSecret();
  const value = request.cookies.get(LOST_GATE_COOKIE_NAME)?.value;
  if (!secret || !value) return false;

  const [version, expiresAtValue, signatureValue, ...extra] = value.split(".");
  if (
    version !== LOST_GATE_COOKIE_VERSION ||
    extra.length > 0 ||
    !/^\d+$/.test(expiresAtValue ?? "")
  ) {
    return false;
  }

  const expiresAt = Number(expiresAtValue);
  const signature = signatureBytes(signatureValue ?? "");
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now || !signature) {
    return false;
  }

  const payload = lostGateCookiePayload(expiresAt);
  const key = await importLostGateSigningKey(secret);

  return crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    new TextEncoder().encode(payload)
  );
}
