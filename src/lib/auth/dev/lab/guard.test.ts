import { afterEach, describe, expect, it } from "vitest";
import { AUTH_LAB_CASES } from "./cases";
import { assertDevAuthLab } from "./guard";

describe("dev auth lab guard", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalPassword = process.env.DEV_BUTLER_PASSWORD;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    process.env.DEV_BUTLER_PASSWORD = originalPassword;
  });

  it("throws in production", () => {
    process.env.NODE_ENV = "production";
    process.env.DEV_BUTLER_PASSWORD = "hideaway-dev-2026";
    expect(() => assertDevAuthLab()).toThrow(/disabled in production/i);
  });

  it("throws when the butler password is missing", () => {
    process.env.NODE_ENV = "development";
    delete process.env.DEV_BUTLER_PASSWORD;
    expect(() => assertDevAuthLab()).toThrow(/DEV_BUTLER_PASSWORD/i);
  });
});

describe("dev auth lab cases", () => {
  it("covers every blocked public auth branch", () => {
    const ids = AUTH_LAB_CASES.map((row) => row.id);
    expect(ids).toEqual([
      "sign-in-email",
      "sign-in-username",
      "sign-in-invalid",
      "sign-in-unverified",
      "sign-up-consent",
      "sign-up-create",
      "email-verify",
      "forgot-password",
      "reset-password-valid",
      "reset-password-invalid",
      "oauth-google",
      "oauth-naver",
      "oauth-kakao",
      "passkey",
      "two-factor-totp",
      "two-factor-otp",
      "invitation",
      "invitation-invalid"
    ]);
    expect(
      AUTH_LAB_CASES.filter((row) => row.blocker).map((row) => row.action)
    ).not.toContain(null);
  });
});
