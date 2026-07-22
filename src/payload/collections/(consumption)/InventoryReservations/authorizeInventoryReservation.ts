const authorizedInventoryReservationRequests = new WeakSet<object>();

export function authorizeInventoryReservationRequest(req: object): void {
  if (typeof req !== "object" || req === null) {
    throw new Error("inventory-reservation-request-required");
  }
  authorizedInventoryReservationRequests.add(req);
}

export function isInventoryReservationRequestAuthorized(req: unknown): boolean {
  return (
    typeof req === "object" &&
    req !== null &&
    authorizedInventoryReservationRequests.has(req)
  );
}
