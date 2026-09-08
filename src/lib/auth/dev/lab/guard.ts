/**
 * @dev-only — Double gate for the auth lab.
 * Production builds must never run these helpers.
 */
export function assertDevAuthLab() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Dev auth lab is disabled in production.");
  }
  if (!process.env.DEV_BUTLER_PASSWORD) {
    throw new Error("DEV_BUTLER_PASSWORD is not set.");
  }
}

export function isDevAuthLabEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    Boolean(process.env.DEV_BUTLER_PASSWORD)
  );
}
