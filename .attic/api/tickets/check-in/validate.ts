export type CheckInTicket = {
  status?: string | null;
  checked_in?: boolean | null;
};

export type CheckInValidationResult =
  | { ok: true; alreadyCheckedIn: false }
  | { ok: true; alreadyCheckedIn: true }
  | { ok: false; error: string; httpStatus: number };

/**
 * Pure validation for the check-in request. Returns the outcome without
 * touching the database so it can be tested without Payload.
 *
 * Idempotency guard runs FIRST: a ticket that is already checked in should
 * always return `alreadyCheckedIn: true` regardless of its current status,
 * so a re-scan of a "used" ticket doesn't incorrectly return an error.
 */
export function validateCheckIn(
  ticket: CheckInTicket,
  userRole: string | null | undefined
): CheckInValidationResult {
  if (userRole !== "admin" && userRole !== "editor") {
    return { ok: false, error: "forbidden", httpStatus: 403 };
  }

  if (ticket.checked_in) {
    return { ok: true, alreadyCheckedIn: true };
  }

  if (ticket.status !== "active") {
    return {
      ok: false,
      error: "ticket-not-active",
      httpStatus: 409
    };
  }

  return { ok: true, alreadyCheckedIn: false };
}
