const authorizedInventoryReservationOperatorEventRequests =
  new WeakSet<object>();

export function authorizeInventoryReservationOperatorEventRequest(
  req: object
): void {
  if (typeof req !== "object" || req === null) {
    throw new Error("inventory-reservation-operator-event-request-required");
  }
  authorizedInventoryReservationOperatorEventRequests.add(req);
}

export function isInventoryReservationOperatorEventRequestAuthorized(
  req: unknown
): boolean {
  return (
    typeof req === "object" &&
    req !== null &&
    authorizedInventoryReservationOperatorEventRequests.has(req)
  );
}
