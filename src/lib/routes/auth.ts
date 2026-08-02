const DEFAULT_SIGN_IN_RETURN_TO = "/me";
const LOCAL_ORIGIN = "https://local.invalid";
const UNSAFE_LOCAL_PATH_CHARACTERS = /[\u0000-\u001F\u007F\\]/u;

type SearchParamValue = string | string[] | undefined;

function firstParam(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isSafeLocalPath(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (UNSAFE_LOCAL_PATH_CHARACTERS.test(value)) return false;

  let decodedValue: string;
  try {
    decodedValue = decodeURIComponent(value);
  } catch {
    return false;
  }

  if (!decodedValue.startsWith("/") || decodedValue.startsWith("//")) {
    return false;
  }
  if (UNSAFE_LOCAL_PATH_CHARACTERS.test(decodedValue)) return false;

  return new URL(value, LOCAL_ORIGIN).origin === LOCAL_ORIGIN;
}

export function normalizeLocalReturnTo(
  value: SearchParamValue,
  fallback: string = DEFAULT_SIGN_IN_RETURN_TO
): string {
  const candidate = firstParam(value)?.trim();
  if (!candidate) return fallback;
  if (!isSafeLocalPath(candidate)) return fallback;
  return candidate;
}

export function signInRedirectPath(returnTo: string): string {
  const localReturnTo = normalizeLocalReturnTo(returnTo);
  const signInPath =
    localReturnTo === "/lostinseoul" || localReturnTo.startsWith("/lostinseoul/")
      ? "/lostinseoul/auth/sign-in"
      : "/sign-in";

  return `${signInPath}?redirectTo=${encodeURIComponent(localReturnTo)}`;
}

export function signInRedirectTarget(searchParams: {
  redirectTo?: SearchParamValue;
  redirect?: SearchParamValue;
  callbackUrl?: SearchParamValue;
  next?: SearchParamValue;
}): string {
  return normalizeLocalReturnTo(
    searchParams.redirectTo ??
      searchParams.redirect ??
      searchParams.callbackUrl ??
      searchParams.next,
    DEFAULT_SIGN_IN_RETURN_TO
  );
}
