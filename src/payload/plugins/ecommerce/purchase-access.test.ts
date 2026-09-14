import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { hasPurchaseAccess } from "./purchase-access";
describe("purchase access capability", () => {
  const digest = createHash("sha256").update("secret").digest("hex");
  it("compares the token's SHA-256 digest", () => {
    expect(hasPurchaseAccess("secret", digest)).toBe(true);
    expect(hasPurchaseAccess("wrong", digest)).toBe(false);
  });
  it.each([undefined, null, 123, "x".repeat(513)])(
    "rejects invalid token %s",
    (token) => expect(hasPurchaseAccess(token, digest)).toBe(false)
  );
  it.each([undefined, null, "invalid", "x".repeat(64)])(
    "rejects malformed digest %s",
    (value) => expect(hasPurchaseAccess("secret", value)).toBe(false)
  );
});
