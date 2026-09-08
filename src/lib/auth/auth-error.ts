const AUTH_ERROR_CODES = [
  "USER_NOT_FOUND",
  "INVALID_PASSWORD",
  "INVALID_EMAIL",
  "INVALID_EMAIL_OR_PASSWORD",
  "INVALID_USERNAME_OR_PASSWORD",
  "SOCIAL_ACCOUNT_ALREADY_LINKED",
  "PROVIDER_NOT_FOUND",
  "INVALID_TOKEN",
  "USER_EMAIL_NOT_FOUND",
  "EMAIL_NOT_VERIFIED",
  "PASSWORD_TOO_SHORT",
  "PASSWORD_TOO_LONG",
  "USER_ALREADY_EXISTS",
  "CREDENTIAL_ACCOUNT_NOT_FOUND",
  "SESSION_EXPIRED",
  "USERNAME_IS_ALREADY_TAKEN",
  "USERNAME_TOO_SHORT",
  "USERNAME_TOO_LONG",
  "INVALID_USERNAME",
  "AUTHENTICATION_FAILED",
  "CHALLENGE_NOT_FOUND",
  "PASSKEY_NOT_FOUND",
  "INVALID_OAUTH_CONFIGURATION"
] as const;

type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

const AUTH_ERROR_CODE_SET = new Set<string>(AUTH_ERROR_CODES);

type Translate = (key: string) => string;

function readErrorRecord(error: unknown): Record<string, unknown> | null {
  if (!error || typeof error !== "object") return null;
  const nested = (error as { error?: unknown }).error;
  if (nested && typeof nested === "object") {
    return nested as Record<string, unknown>;
  }
  return error as Record<string, unknown>;
}

export function getAuthErrorMessage(error: unknown, t: Translate): string {
  if (typeof error === "string" && AUTH_ERROR_CODE_SET.has(error)) {
    return t(`errors.${error}`);
  }

  const record = readErrorRecord(error);
  const code = record?.code;
  if (typeof code === "string" && AUTH_ERROR_CODE_SET.has(code)) {
    return t(`errors.${code as AuthErrorCode}`);
  }

  const message = record?.message;
  if (typeof message === "string" && message.trim()) return message;

  if (error instanceof Error && error.message.trim()) return error.message;

  return t("requestFailed");
}
