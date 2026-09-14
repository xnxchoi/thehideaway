import { createHash, timingSafeEqual } from "node:crypto";

export function hasPurchaseAccess(token: unknown, digest: unknown) {
  if (
    typeof token !== "string" ||
    token.length > 512 ||
    typeof digest !== "string" ||
    !/^[a-f0-9]{64}$/.test(digest)
  )
    return false;
  return timingSafeEqual(
    createHash("sha256").update(token).digest(),
    Buffer.from(digest, "hex")
  );
}
