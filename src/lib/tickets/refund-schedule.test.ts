import { describe, expect, it } from "vitest";
import { quoteRefund } from "./refund-schedule";

// Pin a reference "now" so tests don't drift with wall-clock time
const NOW = new Date("2026-06-15T12:00:00.000Z");

function daysFromNow(days: number): string {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

describe("quoteRefund", () => {
  describe("refund band: 100% (≥10 days out)", () => {
    it("returns 100% exactly at the 10-day boundary", () => {
      const r = quoteRefund(10_000, daysFromNow(10), NOW);
      expect(r).toMatchObject({
        refundPercent: 100,
        refundAmount: 10_000,
        daysUntilEvent: 10
      });
    });

    it("returns 100% well above 10 days", () => {
      const r = quoteRefund(50_000, daysFromNow(30), NOW);
      expect(r).toMatchObject({ refundPercent: 100, refundAmount: 50_000 });
    });
  });

  describe("refund band: 90% (7–9 days)", () => {
    it("returns 90% exactly at the 7-day boundary", () => {
      const r = quoteRefund(10_000, daysFromNow(7), NOW);
      expect(r).toMatchObject({
        refundPercent: 90,
        refundAmount: 9_000,
        daysUntilEvent: 7
      });
    });

    it("returns 90% at 9 days (one below the 10-day band)", () => {
      const r = quoteRefund(10_000, daysFromNow(9), NOW);
      expect(r).toMatchObject({
        refundPercent: 90,
        refundAmount: 9_000,
        daysUntilEvent: 9
      });
    });
  });

  describe("refund band: 70% (3–6 days)", () => {
    it("returns 70% exactly at the 3-day boundary", () => {
      const r = quoteRefund(10_000, daysFromNow(3), NOW);
      expect(r).toMatchObject({
        refundPercent: 70,
        refundAmount: 7_000,
        daysUntilEvent: 3
      });
    });

    it("returns 70% at 6 days (one below the 7-day band)", () => {
      const r = quoteRefund(10_000, daysFromNow(6), NOW);
      expect(r).toMatchObject({
        refundPercent: 70,
        refundAmount: 7_000,
        daysUntilEvent: 6
      });
    });
  });

  describe("refund band: 50% (1–2 days)", () => {
    it("returns 50% exactly at the 1-day boundary", () => {
      const r = quoteRefund(10_000, daysFromNow(1), NOW);
      expect(r).toMatchObject({
        refundPercent: 50,
        refundAmount: 5_000,
        daysUntilEvent: 1
      });
    });

    it("returns 50% at 2 days (one below the 3-day band)", () => {
      const r = quoteRefund(10_000, daysFromNow(2), NOW);
      expect(r).toMatchObject({
        refundPercent: 50,
        refundAmount: 5_000,
        daysUntilEvent: 2
      });
    });
  });

  describe("refund band: 0% (day-of or past)", () => {
    it("returns 0% on the day of the event (0 days)", () => {
      const r = quoteRefund(10_000, daysFromNow(0), NOW);
      expect(r).toMatchObject({
        refundPercent: 0,
        refundAmount: 0,
        daysUntilEvent: 0
      });
    });

    it("returns 0% when the event is in the past (-1 day)", () => {
      const r = quoteRefund(10_000, daysFromNow(-1), NOW);
      expect(r).toMatchObject({
        refundPercent: 0,
        refundAmount: 0,
        daysUntilEvent: -1
      });
    });

    it("returns 0% for an event far in the past (-365 days)", () => {
      const r = quoteRefund(10_000, daysFromNow(-365), NOW);
      expect(r).toMatchObject({ refundPercent: 0, refundAmount: 0 });
    });
  });

  describe("null / undefined event date → treat as no expiry (100%)", () => {
    it("returns 100% when eventDateIso is null", () => {
      const r = quoteRefund(10_000, null, NOW);
      expect(r).toMatchObject({ refundPercent: 100, refundAmount: 10_000 });
      expect(r.daysUntilEvent).toBe(Number.POSITIVE_INFINITY);
    });

    it("returns 100% when eventDateIso is undefined", () => {
      const r = quoteRefund(10_000, undefined, NOW);
      expect(r).toMatchObject({ refundPercent: 100, refundAmount: 10_000 });
      expect(r.daysUntilEvent).toBe(Number.POSITIVE_INFINITY);
    });
  });

  describe("rounding behavior", () => {
    it("rounds the refund amount to the nearest integer (round half-up)", () => {
      // 70% of 10_001 = 7000.7 → rounds to 7001
      const r = quoteRefund(10_001, daysFromNow(3), NOW);
      expect(r.refundAmount).toBe(7001);
    });

    it("rounds down when fractional part < 0.5", () => {
      // 90% of 10_001 = 9000.9 → rounds to 9001
      const r = quoteRefund(10_001, daysFromNow(7), NOW);
      expect(r.refundAmount).toBe(9001);
    });

    it("handles zero ticket price", () => {
      const r = quoteRefund(0, daysFromNow(15), NOW);
      expect(r).toMatchObject({ refundPercent: 100, refundAmount: 0 });
    });
  });

  describe("daysUntilEvent is floor, not round", () => {
    it("reports 0 days when the event is 23h 59m away (< 1 full day)", () => {
      // 23h59m = 86340s < 86400s (1 day) → floor = 0
      const almostTomorrow = new Date(
        NOW.getTime() + 23 * 60 * 60 * 1000 + 59 * 60 * 1000
      );
      const r = quoteRefund(10_000, almostTomorrow.toISOString(), NOW);
      expect(r.daysUntilEvent).toBe(0);
      expect(r.refundPercent).toBe(0);
    });

    it("reports 1 day when the event is exactly 24h away", () => {
      const exactly24h = new Date(NOW.getTime() + 24 * 60 * 60 * 1000);
      const r = quoteRefund(10_000, exactly24h.toISOString(), NOW);
      expect(r.daysUntilEvent).toBe(1);
      expect(r.refundPercent).toBe(50);
    });
  });
});
