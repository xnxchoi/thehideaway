const DEFAULT_SIGN_IN_RETURN_TO = "/me";

type SearchParamValue = string | string[] | undefined;

function firstParam(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeLocalReturnTo(
  value: SearchParamValue,
  fallback: string = DEFAULT_SIGN_IN_RETURN_TO
): string {
  const candidate = firstParam(value)?.trim();
  if (!candidate) return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  return candidate;
}

export function signInRedirectPath(returnTo: string): string {
  const localReturnTo = normalizeLocalReturnTo(returnTo);
  const signInPath =
    localReturnTo === "/lostinseoul" ||
    localReturnTo.startsWith("/lostinseoul/")
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
