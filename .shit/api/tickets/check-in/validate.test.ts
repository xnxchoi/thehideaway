import { describe, expect, it } from "vitest";
import { validateCheckIn } from "./validate";

describe("validateCheckIn", () => {
  describe("role guard", () => {
    it("rejects non-staff role", () => {
      const r = validateCheckIn(
        { status: "active", checked_in: false },
        "user"
      );
      expect(r).toMatchObject({
        ok: false,
        error: "forbidden",
        httpStatus: 403
      });
    });

    it("rejects patron role", () => {
      const r = validateCheckIn(
        { status: "active", checked_in: false },
        "patron"
      );
      expect(r).toMatchObject({
        ok: false,
        error: "forbidden",
        httpStatus: 403
      });
    });

    it("accepts admin role", () => {
      const r = validateCheckIn(
        { status: "active", checked_in: false },
        "admin"
      );
      expect(r.ok).toBe(true);
    });

    it("accepts editor role", () => {
      const r = validateCheckIn(
        { status: "active", checked_in: false },
        "editor"
      );
      expect(r.ok).toBe(true);
    });
  });

  describe("idempotency — checked_in takes priority over status", () => {
    it("returns alreadyCheckedIn=true when checked_in is true and status is active", () => {
      const r = validateCheckIn(
        { status: "active", checked_in: true },
        "admin"
      );
      expect(r).toMatchObject({ ok: true, alreadyCheckedIn: true });
    });

    it("returns alreadyCheckedIn=true when checked_in is true and status is used", () => {
      // Critical regression: a re-scan of a used+checked-in ticket must return
      // idempotent success, not a 409 — the old route evaluated status before
      // checked_in and would incorrectly block this case.
      const r = validateCheckIn({ status: "used", checked_in: true }, "admin");
      expect(r).toMatchObject({ ok: true, alreadyCheckedIn: true });
    });

    it("returns alreadyCheckedIn=true for any status when checked_in is true", () => {
      for (const status of ["pending", "canceled", "active", "used"]) {
        const r = validateCheckIn({ status, checked_in: true }, "editor");
        expect(r).toMatchObject({ ok: true, alreadyCheckedIn: true });
      }
    });
  });

  describe("status guard (only reached when checked_in is false)", () => {
    it("rejects pending ticket", () => {
      const r = validateCheckIn(
        { status: "pending", checked_in: false },
        "admin"
      );
      expect(r).toMatchObject({
        ok: false,
        error: "ticket-not-active",
        httpStatus: 409
      });
    });

    it("rejects canceled ticket", () => {
      const r = validateCheckIn(
        { status: "canceled", checked_in: false },
        "admin"
      );
      expect(r).toMatchObject({
        ok: false,
        error: "ticket-not-active",
        httpStatus: 409
      });
    });

    it("rejects used ticket that is NOT yet checked in", () => {
      const r = validateCheckIn({ status: "used", checked_in: false }, "admin");
      expect(r).toMatchObject({
        ok: false,
        error: "ticket-not-active",
        httpStatus: 409
      });
    });
  });

  describe("happy path", () => {
    it("returns ok with alreadyCheckedIn=false for active, unchecked ticket", () => {
      const r = validateCheckIn(
        { status: "active", checked_in: false },
        "admin"
      );
      expect(r).toMatchObject({ ok: true, alreadyCheckedIn: false });
    });

    it("treats null checked_in as not checked in", () => {
      const r = validateCheckIn(
        { status: "active", checked_in: null },
        "admin"
      );
      expect(r).toMatchObject({ ok: true, alreadyCheckedIn: false });
    });
  });
});
