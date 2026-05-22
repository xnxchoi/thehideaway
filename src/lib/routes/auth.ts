const DEFAULT_SIGN_IN_RETURN_TO = "/event-entry";

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
  return `/sign-in?redirectTo=${encodeURIComponent(
    normalizeLocalReturnTo(returnTo)
  )}`;
}

export function signInRedirectTarget(searchParams: {
  redirectTo?: SearchParamValue;
  redirect?: SearchParamValue;
}): string {
  return normalizeLocalReturnTo(
    searchParams.redirectTo ?? searchParams.redirect,
    DEFAULT_SIGN_IN_RETURN_TO
  );
}
