export const LOST_GATE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const LOST_GATE_COOKIE_NAME = "lostinseoul.gate";
export const LOST_GATE_COOKIE_VALUE =
  "3f9c89c8a38beabc1fc84adc476cfe230f276da8223682ecfbd1e6b500bfd722";

const DEFAULT_LOST_GATE_PASSWORD_SHA256 =
  "ce4afe673f69809e188b352a087068b2a28b0f047bd44e9ed6744df54817f4b9";

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function isLostGatePassword(value: string): Promise<boolean> {
  const configured = process.env.LOSTINSEOUL_GATE_PASSWORD_SHA256?.trim();
  const expected =
    configured && configured.length > 0
      ? configured
      : DEFAULT_LOST_GATE_PASSWORD_SHA256;

  return (await sha256Hex(value)) === expected;
}

export function hasLostGateCookie(request: {
  cookies: { get: (name: string) => { value?: string } | undefined };
}): boolean {
  return (
    request.cookies.get(LOST_GATE_COOKIE_NAME)?.value === LOST_GATE_COOKIE_VALUE
  );
}
