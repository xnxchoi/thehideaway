import { describe, expect, it } from "vitest";

import { resolveSafeAdminRedirect } from "./set-admin-role";

describe("admin role redirect", () => {
  const origin = "https://hideawayseoul.com";

  it("keeps relative same-origin paths", () => {
    expect(resolveSafeAdminRedirect("/vault?view=users#active", origin)).toBe(
      "/vault?view=users#active"
    );
  });

  it.each([
    "//evil.example/path",
    "/\\evil.example/path",
    "https://evil.example/path",
    "vault"
  ])("rejects an unsafe redirect: %s", (redirect) => {
    expect(resolveSafeAdminRedirect(redirect, origin)).toBeNull();
  });
});
