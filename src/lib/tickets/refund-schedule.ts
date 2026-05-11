/**
 * Ticket refund schedule — must mirror the published policy at
 * `/refund` (제3조 이벤트 티켓 / Event Tickets section). The bands are
 * half-open intervals on `daysUntilEvent`:
 *
 *   [10, ∞)  → 100%
 *   [7, 10)  → 90%
 *   [3, 7)   → 70%
 *   [1, 3)   → 50%
 *   (-∞, 1)  → 0%   (day-of or past)
 *
 * Negative `daysUntilEvent` (event already passed) also returns 0%.
 */

export interface RefundQuote {
  refundPercent: number;
  refundAmount: number;
  daysUntilEvent: number;
}

export function quoteRefund(
  ticketPrice: number,
  eventDateIso: string | null | undefined,
  now: Date = new Date()
): RefundQuote {
  const daysUntilEvent = eventDateIso
    ? Math.floor(
        (new Date(eventDateIso).getTime() - now.getTime()) /
          (24 * 60 * 60 * 1000)
      )
    : Number.POSITIVE_INFINITY;

  const refundPercent = pickPercent(daysUntilEvent);
  const refundAmount = Math.round((ticketPrice * refundPercent) / 100);

  return { refundPercent, refundAmount, daysUntilEvent };
}

function pickPercent(days: number): number {
  if (days >= 10) return 100;
  if (days >= 7) return 90;
  if (days >= 3) return 70;
  if (days >= 1) return 50;
  return 0;
}
