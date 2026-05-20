export type ClaimTicket = {
  status?: string | null;
  user?: string | null;
  claim_email?: string | null;
};

export type ClaimValidationResult =
  | { ok: true; alreadyClaimed: false }
  | { ok: true; alreadyClaimed: true }
  | { ok: false; error: string; httpStatus: number };

/**
 * Pure validation for a gift-ticket claim. Returns the outcome without
 * touching the database.
 *
 * @param ticket     Flat ticket fields (user already resolved to string|null).
 * @param userId     Authenticated user's ID.
 * @param userEmail  Authenticated user's email (null if somehow missing).
 * @param existingCount Number of active/pending/used tickets the user already
 *                   holds for this event. Pass 0 if no cap should be enforced.
 * @param cap        Per-user ticket cap for the event.
 */
export function validateClaim(
  ticket: ClaimTicket,
  userId: string,
  userEmail: string | null,
  existingCount: number,
  cap: number
): ClaimValidationResult {
  if (ticket.status === "canceled") {
    return { ok: false, error: "ticket-canceled", httpStatus: 409 };
  }

  if (ticket.user === userId) {
    return { ok: true, alreadyClaimed: true };
  }

  if (ticket.user) {
    return { ok: false, error: "already-claimed", httpStatus: 409 };
  }

  if (ticket.claim_email) {
    const storedEmail = ticket.claim_email.trim().toLowerCase();
    const incomingEmail = (userEmail ?? "").trim().toLowerCase();
    if (!incomingEmail || incomingEmail !== storedEmail) {
      return { ok: false, error: "email-mismatch", httpStatus: 403 };
    }
  }

  if (existingCount >= cap) {
    return { ok: false, error: "user-cap-reached", httpStatus: 409 };
  }

  return { ok: true, alreadyClaimed: false };
}
