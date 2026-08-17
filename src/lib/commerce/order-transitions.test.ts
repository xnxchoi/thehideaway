import { describe, expect, it } from "vitest";

import {
  assertOrderTransition,
  type CommerceOrderStatus
} from "./order-transitions";

const allowed: ReadonlyArray<
  readonly [CommerceOrderStatus, CommerceOrderStatus]
> = [
  ["awaiting_payment", "paid"],
  ["awaiting_payment", "canceled"],
  ["paid", "preparing"],
  ["paid", "canceled"],
  ["preparing", "shipped"],
  ["preparing", "canceled"],
  ["shipped", "completed"]
];

describe("minimal commerce order transitions", () => {
  it.each(allowed)("allows %s -> %s", (current, next) => {
    expect(assertOrderTransition(current, next)).toBe(next);
  });

  it.each([
    ["awaiting_payment", "shipped"],
    ["paid", "completed"],
    ["shipped", "paid"],
    ["completed", "canceled"],
    ["canceled", "paid"]
  ] as ReadonlyArray<readonly [CommerceOrderStatus, CommerceOrderStatus]>)(
    "rejects %s -> %s",
    (current, next) => {
      expect(() => assertOrderTransition(current, next)).toThrow(
        "invalid-order-transition"
      );
    }
  );

  it.each([
    "awaiting_payment",
    "paid",
    "preparing",
    "shipped",
    "completed",
    "canceled"
  ] as const)("treats repeated %s as idempotent", (status) => {
    expect(assertOrderTransition(status, status)).toBe(status);
  });
});
