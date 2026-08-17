import { describe, expect, it } from "vitest";
import { validateClaim } from "./validate";

const USER_A = "user-a-id";
const USER_B = "user-b-id";

describe("validateClaim", () => {
  describe("canceled ticket", () => {
    it("rejects a canceled ticket immediately", () => {
      const r = validateClaim(
        { status: "canceled", user: null, claim_email: null },
        USER_A,
        "a@example.com",
        0,
        3
      );
      expect(r).toMatchObject({
        ok: false,
        error: "ticket-canceled",
        httpStatus: 409
      });
    });
  });

  describe("already owned by the same user", () => {
    it("returns alreadyClaimed=true when the caller already owns the ticket", () => {
      const r = validateClaim(
        { status: "pending", user: USER_A, claim_email: null },
        USER_A,
        "a@example.com",
        0,
        3
      );
      expect(r).toMatchObject({ ok: true, alreadyClaimed: true });
    });
  });

  describe("owned by a different user", () => {
    it("rejects when the ticket is already claimed by someone else", () => {
      const r = validateClaim(
        { status: "active", user: USER_B, claim_email: null },
        USER_A,
        "a@example.com",
        0,
        3
      );
      expect(r).toMatchObject({
        ok: false,
        error: "already-claimed",
        httpStatus: 409
      });
    });
  });

  describe("email restriction", () => {
    it("allows claim when email matches exactly", () => {
      const r = validateClaim(
        { status: "pending", user: null, claim_email: "gift@example.com" },
        USER_A,
        "gift@example.com",
        0,
        3
      );
      expect(r).toMatchObject({ ok: true, alreadyClaimed: false });
    });

    it("allows claim when email matches case-insensitively", () => {
      const r = validateClaim(
        { status: "pending", user: null, claim_email: "Gift@Example.COM" },
        USER_A,
        "gift@example.com",
        0,
        3
      );
      expect(r).toMatchObject({ ok: true, alreadyClaimed: false });
    });

    it("allows claim when email matches after trimming whitespace", () => {
      const r = validateClaim(
        { status: "pending", user: null, claim_email: "  gift@example.com  " },
        USER_A,
        "gift@example.com",
        0,
        3
      );
      expect(r).toMatchObject({ ok: true, alreadyClaimed: false });
    });

    it("rejects when email does not match", () => {
      const r = validateClaim(
        { status: "pending", user: null, claim_email: "other@example.com" },
        USER_A,
        "gift@example.com",
        0,
        3
      );
      expect(r).toMatchObject({
        ok: false,
        error: "email-mismatch",
        httpStatus: 403
      });
    });

    it("rejects when user email is null and a claim_email restriction exists", () => {
      const r = validateClaim(
        { status: "pending", user: null, claim_email: "gift@example.com" },
        USER_A,
        null,
        0,
        3
      );
      expect(r).toMatchObject({
        ok: false,
        error: "email-mismatch",
        httpStatus: 403
      });
    });

    it("skips email check when claim_email is null (open gift)", () => {
      const r = validateClaim(
        { status: "pending", user: null, claim_email: null },
        USER_A,
        "anyone@example.com",
        0,
        3
      );
      expect(r).toMatchObject({ ok: true, alreadyClaimed: false });
    });
  });

  describe("per-user cap", () => {
    it("rejects when user has already reached the cap", () => {
      const r = validateClaim(
        { status: "pending", user: null, claim_email: null },
        USER_A,
        "a@example.com",
        3,
        3
      );
      expect(r).toMatchObject({
        ok: false,
        error: "user-cap-reached",
        httpStatus: 409
      });
    });

    it("rejects when user is over the cap", () => {
      const r = validateClaim(
        { status: "pending", user: null, claim_email: null },
        USER_A,
        "a@example.com",
        4,
        3
      );
      expect(r).toMatchObject({
        ok: false,
        error: "user-cap-reached",
        httpStatus: 409
      });
    });

    it("allows when user is one under the cap", () => {
      const r = validateClaim(
        { status: "pending", user: null, claim_email: null },
        USER_A,
        "a@example.com",
        2,
        3
      );
      expect(r).toMatchObject({ ok: true, alreadyClaimed: false });
    });

    it("allows when no tickets are held (existingCount = 0)", () => {
      const r = validateClaim(
        { status: "pending", user: null, claim_email: null },
        USER_A,
        "a@example.com",
        0,
        1
      );
      expect(r).toMatchObject({ ok: true, alreadyClaimed: false });
    });
  });

  describe("check ordering — canceled takes priority over ownership checks", () => {
    it("rejects canceled ticket even if the caller owns it", () => {
      const r = validateClaim(
        { status: "canceled", user: USER_A, claim_email: null },
        USER_A,
        "a@example.com",
        0,
        3
      );
      expect(r).toMatchObject({
        ok: false,
        error: "ticket-canceled",
        httpStatus: 409
      });
    });
  });

  describe("happy path", () => {
    it("succeeds for a valid unclaimed open-gift ticket", () => {
      const r = validateClaim(
        { status: "pending", user: null, claim_email: null },
        USER_A,
        "a@example.com",
        0,
        3
      );
      expect(r).toMatchObject({ ok: true, alreadyClaimed: false });
    });

    it("succeeds for a valid unclaimed email-restricted ticket with matching email", () => {
      const r = validateClaim(
        { status: "active", user: null, claim_email: "a@example.com" },
        USER_A,
        "A@EXAMPLE.COM",
        1,
        3
      );
      expect(r).toMatchObject({ ok: true, alreadyClaimed: false });
    });
  });
});
