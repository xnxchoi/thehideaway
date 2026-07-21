import { describe, expect, it } from "vitest";

import {
  CommerceTransitionError,
  ORDER_STATES,
  PAYMENT_STATES,
  assertOrderTransition,
  assertPaymentTransition,
  isCommerceOrderState,
  isCommercePaymentState,
  isTerminalCommerceState
} from "./transitions";

const allowedOrderTransitions = new Set([
  "draft:quote_requested",
  "draft:pending_payment",
  "draft:canceled",
  "quote_requested:quote_ready",
  "quote_requested:canceled",
  "quote_ready:pending_payment",
  "quote_ready:failed",
  "quote_ready:canceled",
  "pending_payment:paid",
  "pending_payment:confirmed",
  "pending_payment:failed",
  "pending_payment:canceled",
  "paid:committed",
  "paid:confirmed",
  "paid:refunded",
  "paid:canceled",
  "committed:confirmed",
  "committed:failed",
  "committed:refunded",
  "committed:canceled",
  "confirmed:converted",
  "confirmed:refunded",
  "confirmed:canceled"
]);

const allowedPaymentTransitions = new Set([
  "initiated:pending",
  "initiated:manual_pending",
  "initiated:paid",
  "initiated:failed",
  "pending:paid",
  "pending:failed",
  "manual_pending:paid",
  "manual_pending:failed",
  "paid:partially_refunded",
  "paid:refunded",
  "partially_refunded:refunded"
]);

const systemActor = { kind: "system", id: "portone" } as const;
const customerActor = { kind: "customer", id: "user-1" } as const;
const cofounderActor = {
  kind: "staff",
  id: "staff-1",
  role: "cofounder"
} as const;
const editorActor = {
  kind: "staff",
  id: "staff-2",
  role: "editor"
} as const;

describe("order transitions", () => {
  it("enforces the complete system transition matrix", () => {
    for (const from of ORDER_STATES) {
      for (const to of ORDER_STATES) {
        const transition = () =>
          assertOrderTransition({ from, to, actor: systemActor });
        if (from === to) {
          expect(transition()).toEqual({ changed: false, from, to });
        } else if (allowedOrderTransitions.has(`${from}:${to}`)) {
          expect(transition()).toEqual({ changed: true, from, to });
        } else {
          expect(transition).toThrow("invalid-commerce-transition");
        }
      }
    }
  });

  it("enforces the complete customer and editor authorization matrix", () => {
    for (const actor of [customerActor, editorActor]) {
      for (const from of ORDER_STATES) {
        for (const to of ORDER_STATES) {
          const transition = () => assertOrderTransition({ from, to, actor });
          if (from === to) {
            expect(transition()).toEqual({ changed: false, from, to });
          } else if (
            actor.kind === "customer" &&
            from === "pending_payment" &&
            to === "canceled"
          ) {
            expect(transition()).toEqual({ changed: true, from, to });
          } else {
            expect(transition).toThrow("commerce-transition-forbidden");
          }
        }
      }
    }
  });

  it.each([
    ["pending_payment", "confirmed"],
    ["pending_payment", "paid"],
    ["paid", "committed"],
    ["committed", "confirmed"],
    ["pending_payment", "failed"]
  ] as const)("allows system transition %s -> %s", (from, to) => {
    expect(assertOrderTransition({ from, to, actor: systemActor })).toEqual({
      changed: true,
      from,
      to
    });
  });

  it("treats an already-applied transition as an idempotent replay", () => {
    expect(
      assertOrderTransition({
        from: "confirmed",
        to: "confirmed",
        actor: systemActor
      })
    ).toEqual({
      changed: false,
      from: "confirmed",
      to: "confirmed"
    });
  });

  it("allows a customer to cancel a pending order", () => {
    expect(
      assertOrderTransition({
        from: "pending_payment",
        to: "canceled",
        actor: customerActor
      }).changed
    ).toBe(true);
  });

  it("rejects customer confirmation and editor lifecycle writes", () => {
    expect(() =>
      assertOrderTransition({
        from: "pending_payment",
        to: "confirmed",
        actor: customerActor
      })
    ).toThrow(CommerceTransitionError);
    expect(() =>
      assertOrderTransition({
        from: "pending_payment",
        to: "confirmed",
        actor: editorActor
      })
    ).toThrow("commerce-transition-forbidden");
  });

  it("allows a senior staff member to perform a legal transition", () => {
    expect(
      assertOrderTransition({
        from: "pending_payment",
        to: "canceled",
        actor: cofounderActor
      }).changed
    ).toBe(true);
  });

  it("rejects transitions out of a terminal state", () => {
    expect(() =>
      assertOrderTransition({
        from: "refunded",
        to: "confirmed",
        actor: systemActor
      })
    ).toThrow("invalid-commerce-transition");
    expect(isTerminalCommerceState("order", "refunded")).toBe(true);
  });
});

describe("payment transitions", () => {
  it("enforces the complete system transition matrix", () => {
    for (const from of PAYMENT_STATES) {
      for (const to of PAYMENT_STATES) {
        const transition = () =>
          assertPaymentTransition({ from, to, actor: systemActor });
        if (from === to) {
          expect(transition()).toEqual({ changed: false, from, to });
        } else if (allowedPaymentTransitions.has(`${from}:${to}`)) {
          expect(transition()).toEqual({ changed: true, from, to });
        } else {
          expect(transition).toThrow("invalid-commerce-transition");
        }
      }
    }
  });

  it("enforces the complete customer and editor authorization matrix", () => {
    for (const actor of [customerActor, editorActor]) {
      for (const from of PAYMENT_STATES) {
        for (const to of PAYMENT_STATES) {
          const transition = () => assertPaymentTransition({ from, to, actor });
          if (from === to) {
            expect(transition()).toEqual({ changed: false, from, to });
          } else {
            expect(transition).toThrow("commerce-transition-forbidden");
          }
        }
      }
    }
  });

  it.each([
    ["initiated", "pending"],
    ["initiated", "manual_pending"],
    ["pending", "paid"],
    ["manual_pending", "paid"],
    ["paid", "partially_refunded"],
    ["partially_refunded", "refunded"]
  ] as const)("allows system transition %s -> %s", (from, to) => {
    expect(
      assertPaymentTransition({ from, to, actor: systemActor }).changed
    ).toBe(true);
  });

  it("rejects direct customer payment transitions", () => {
    expect(() =>
      assertPaymentTransition({
        from: "pending",
        to: "paid",
        actor: customerActor
      })
    ).toThrow("commerce-transition-forbidden");
  });

  it("treats duplicate paid confirmation as a replay", () => {
    expect(
      assertPaymentTransition({ from: "paid", to: "paid", actor: systemActor })
    ).toEqual({ changed: false, from: "paid", to: "paid" });
  });

  it("rejects transitions out of refunded", () => {
    expect(() =>
      assertPaymentTransition({
        from: "refunded",
        to: "paid",
        actor: systemActor
      })
    ).toThrow("invalid-commerce-transition");
    expect(isTerminalCommerceState("payment", "refunded")).toBe(true);
  });
});

describe("runtime state checks", () => {
  it("rejects unknown states before a transition is attempted", () => {
    expect(isCommerceOrderState("pending_payment")).toBe(true);
    expect(isCommerceOrderState("pending-payment")).toBe(false);
    expect(isCommercePaymentState("manual_pending")).toBe(true);
    expect(isCommercePaymentState(undefined)).toBe(false);
  });
});
