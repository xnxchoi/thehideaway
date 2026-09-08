/**
 * @dev-only — Catalog of public auth branches and what blocks local testing.
 * Delete `src/lib/auth/dev/lab/` plus the AuthShell import to remove from prod.
 */

export type AuthLabAction =
  | "signInButler"
  | "signInDaria"
  | "mintUnverifiedUser"
  | "skipConsent"
  | "mintSignupCredentials"
  | "mintVerificationUrl"
  | "mintResetUrl"
  | "openInvalidReset"
  | "simulateGoogle"
  | "simulateNaver"
  | "simulateKakao"
  | "simulatePasskey"
  | "startTotp"
  | "startEmailOtp"
  | "currentTotp"
  | "revealLastOtp"
  | "mintInvitation"
  | "openInvalidInvitation";

export type AuthLabCaseId =
  | "sign-in-email"
  | "sign-in-username"
  | "sign-in-invalid"
  | "sign-in-unverified"
  | "sign-up-consent"
  | "sign-up-create"
  | "email-verify"
  | "forgot-password"
  | "reset-password-valid"
  | "reset-password-invalid"
  | "oauth-google"
  | "oauth-naver"
  | "oauth-kakao"
  | "passkey"
  | "two-factor-totp"
  | "two-factor-otp"
  | "invitation"
  | "invitation-invalid";

export type AuthLabCase = {
  id: AuthLabCaseId;
  label: string;
  blocker: string | null;
  action: AuthLabAction | null;
};

export const AUTH_LAB_CLIENT_ACTIONS = new Set<AuthLabAction>([
  "skipConsent",
  "openInvalidReset",
  "openInvalidInvitation"
]);

export const AUTH_LAB_CASES: AuthLabCase[] = [
  {
    id: "sign-in-email",
    label: "Sign in (email)",
    blocker: null,
    action: "signInButler"
  },
  {
    id: "sign-in-username",
    label: "Sign in (username / reader)",
    blocker: null,
    action: "signInDaria"
  },
  {
    id: "sign-in-invalid",
    label: "Invalid credentials",
    blocker: null,
    action: null
  },
  {
    id: "sign-in-unverified",
    label: "Unverified email sign-in",
    blocker: "requireEmailVerification blocks login until the emailed JWT is used",
    action: "mintUnverifiedUser"
  },
  {
    id: "sign-up-consent",
    label: "Sign-up consent",
    blocker: null,
    action: "skipConsent"
  },
  {
    id: "sign-up-create",
    label: "Sign-up form",
    blocker: "needs an unused email; verification mail never reaches the browser",
    action: "mintSignupCredentials"
  },
  {
    id: "email-verify",
    label: "Email verification",
    blocker: "verification URL is emailed, never shown locally",
    action: "mintVerificationUrl"
  },
  {
    id: "forgot-password",
    label: "Forgot password",
    blocker: "sends email; token never reaches the browser",
    action: "mintResetUrl"
  },
  {
    id: "reset-password-valid",
    label: "Reset password (valid token)",
    blocker: "requires a live reset token",
    action: "mintResetUrl"
  },
  {
    id: "reset-password-invalid",
    label: "Reset password (invalid token)",
    blocker: null,
    action: "openInvalidReset"
  },
  {
    id: "oauth-google",
    label: "Google OAuth",
    blocker: "real Google consent screen",
    action: "simulateGoogle"
  },
  {
    id: "oauth-naver",
    label: "Naver OAuth",
    blocker: "real Naver consent screen",
    action: "simulateNaver"
  },
  {
    id: "oauth-kakao",
    label: "Kakao OAuth",
    blocker: "real Kakao consent screen",
    action: "simulateKakao"
  },
  {
    id: "passkey",
    label: "Passkey",
    blocker: "WebAuthn authenticator",
    action: "simulatePasskey"
  },
  {
    id: "two-factor-totp",
    label: "2FA TOTP",
    blocker: "needs 2FA enrolled + pending challenge + current code",
    action: "startTotp"
  },
  {
    id: "two-factor-otp",
    label: "2FA email OTP",
    blocker: "needs pending 2FA + emailed code",
    action: "startEmailOtp"
  },
  {
    id: "invitation",
    label: "Accept invitation",
    blocker: "needs a pending organization invitation",
    action: "mintInvitation"
  },
  {
    id: "invitation-invalid",
    label: "Invalid invitation",
    blocker: null,
    action: "openInvalidInvitation"
  }
];
