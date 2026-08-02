import {
  resolveBaseURL as resolveBetterAuthBaseURL,
  type BaseURLConfig
} from "better-auth";

export function resolveBaseURL(
  baseURL?: BaseURLConfig,
  headers?: Headers
): string {
  return resolveBetterAuthBaseURL(baseURL, "", headers, false) ?? "";
}
