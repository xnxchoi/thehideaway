import { describe, expect, it } from "vitest";
import {
  normalizeLocalReturnTo,
  signInRedirectPath,
  signInRedirectTarget
} from "./auth";

describe("auth route helpers", () => {
  it("builds sign-in links with redirectTo for the auth UI success handler", () => {
    expect(signInRedirectPath("/day-n-night/my")).toBe(
      "/sign-in?redirectTo=%2Fday-n-night%2Fmy"
    );
  });

  it("accepts legacy redirect query values on the sign-in page", () => {
    expect(signInRedirectTarget({ redirect: "/tickets/day-n-night" })).toBe(
      "/tickets/day-n-night"
    );
  });

  it("prefers redirectTo when both query names are present", () => {
    expect(
      signInRedirectTarget({
        redirectTo: "/day-n-night/my",
        redirect: "/tickets/my"
      })
    ).toBe("/day-n-night/my");
  });

  it("rejects external or protocol-relative return targets", () => {
    expect(normalizeLocalReturnTo("https://evil.test")).toBe("/event-entry");
    expect(normalizeLocalReturnTo("//evil.test")).toBe("/event-entry");
  });
});
