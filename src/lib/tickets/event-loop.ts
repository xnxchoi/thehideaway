const DAY_N_NIGHT_SLUG = "day-n-night";

function trimBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

export function ticketManagementPath(
  eventSlug: string | null | undefined
): string {
  return eventSlug === DAY_N_NIGHT_SLUG ? "/day-n-night/my" : "/tickets/my";
}

export function buildTicketManagementUrl(
  baseUrl: string,
  eventSlug: string | null | undefined
): string {
  return `${trimBaseUrl(baseUrl)}${ticketManagementPath(eventSlug)}`;
}

export function giftClaimPath(
  eventSlug: string | null | undefined,
  claimToken: string
): string {
  const token = encodeURIComponent(claimToken);
  return eventSlug === DAY_N_NIGHT_SLUG
    ? `/day-n-night/claim/${token}`
    : `/tickets/claim/${token}`;
}

export function buildGiftClaimUrl(
  baseUrl: string,
  eventSlug: string | null | undefined,
  claimToken: string
): string {
  return `${trimBaseUrl(baseUrl)}${giftClaimPath(eventSlug, claimToken)}`;
}
