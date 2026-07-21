export const ORDER_STATES = [
  "draft",
  "quote_requested",
  "quote_ready",
  "pending_payment",
  "paid",
  "committed",
  "confirmed",
  "converted",
  "failed",
  "canceled",
  "refunded"
] as const;

export const PAYMENT_STATES = [
  "initiated",
  "pending",
  "manual_pending",
  "paid",
  "failed",
  "partially_refunded",
  "refunded"
] as const;

export type CommerceOrderState = (typeof ORDER_STATES)[number];
export type CommercePaymentState = (typeof PAYMENT_STATES)[number];

export type CommerceTransitionActor =
  | Readonly<{ kind: "system"; id: string }>
  | Readonly<{ kind: "customer"; id: string }>
  | Readonly<{
      kind: "staff";
      id: string;
      role: "admin" | "cofounder" | "editor" | string;
    }>;

type TransitionResult<State extends string> = Readonly<{
  changed: boolean;
  from: State;
  to: State;
}>;

const orderTransitions: Readonly<
  Record<CommerceOrderState, ReadonlySet<CommerceOrderState>>
> = {
  draft: new Set(["quote_requested", "pending_payment", "canceled"]),
  quote_requested: new Set(["quote_ready", "canceled"]),
  quote_ready: new Set(["pending_payment", "failed", "canceled"]),
  pending_payment: new Set(["paid", "confirmed", "failed", "canceled"]),
  paid: new Set(["committed", "confirmed", "refunded", "canceled"]),
  committed: new Set(["confirmed", "failed", "refunded", "canceled"]),
  confirmed: new Set(["converted", "refunded", "canceled"]),
  converted: new Set(),
  failed: new Set(),
  canceled: new Set(),
  refunded: new Set()
};

const paymentTransitions: Readonly<
  Record<CommercePaymentState, ReadonlySet<CommercePaymentState>>
> = {
  initiated: new Set(["pending", "manual_pending", "paid", "failed"]),
  pending: new Set(["paid", "failed"]),
  manual_pending: new Set(["paid", "failed"]),
  paid: new Set(["partially_refunded", "refunded"]),
  failed: new Set(),
  partially_refunded: new Set(["refunded"]),
  refunded: new Set()
};

const orderStateSet = new Set<string>(ORDER_STATES);
const paymentStateSet = new Set<string>(PAYMENT_STATES);

export class CommerceTransitionError extends Error {
  readonly code:
    "commerce-transition-forbidden" | "invalid-commerce-transition";

  constructor(
    code: "commerce-transition-forbidden" | "invalid-commerce-transition"
  ) {
    super(code);
    this.name = "CommerceTransitionError";
    this.code = code;
  }
}

export function isCommerceOrderState(
  state: unknown
): state is CommerceOrderState {
  return typeof state === "string" && orderStateSet.has(state);
}

export function isCommercePaymentState(
  state: unknown
): state is CommercePaymentState {
  return typeof state === "string" && paymentStateSet.has(state);
}

function isStaffLifecycleActor(actor: CommerceTransitionActor): boolean {
  return (
    actor.kind === "staff" &&
    (actor.role === "admin" || actor.role === "cofounder")
  );
}

function canChangeOrder(
  actor: CommerceTransitionActor,
  from: CommerceOrderState,
  to: CommerceOrderState
): boolean {
  if (actor.kind === "system" || isStaffLifecycleActor(actor)) return true;
  return (
    actor.kind === "customer" && from === "pending_payment" && to === "canceled"
  );
}

function canChangePayment(actor: CommerceTransitionActor): boolean {
  return actor.kind === "system" || isStaffLifecycleActor(actor);
}

export function isTerminalCommerceState(
  domain: "order",
  state: CommerceOrderState
): boolean;
export function isTerminalCommerceState(
  domain: "payment",
  state: CommercePaymentState
): boolean;
export function isTerminalCommerceState(
  domain: "order" | "payment",
  state: CommerceOrderState | CommercePaymentState
): boolean {
  const transitions =
    domain === "order"
      ? orderTransitions[state as CommerceOrderState]
      : paymentTransitions[state as CommercePaymentState];
  return transitions?.size === 0;
}

export function assertOrderTransition(input: {
  from: CommerceOrderState;
  to: CommerceOrderState;
  actor: CommerceTransitionActor;
}): TransitionResult<CommerceOrderState> {
  if (input.from === input.to) {
    return Object.freeze({ changed: false, from: input.from, to: input.to });
  }
  if (!canChangeOrder(input.actor, input.from, input.to)) {
    throw new CommerceTransitionError("commerce-transition-forbidden");
  }
  if (!orderTransitions[input.from]?.has(input.to)) {
    throw new CommerceTransitionError("invalid-commerce-transition");
  }
  return Object.freeze({ changed: true, from: input.from, to: input.to });
}

export function assertPaymentTransition(input: {
  from: CommercePaymentState;
  to: CommercePaymentState;
  actor: CommerceTransitionActor;
}): TransitionResult<CommercePaymentState> {
  if (input.from === input.to) {
    return Object.freeze({ changed: false, from: input.from, to: input.to });
  }
  if (!canChangePayment(input.actor)) {
    throw new CommerceTransitionError("commerce-transition-forbidden");
  }
  if (!paymentTransitions[input.from]?.has(input.to)) {
    throw new CommerceTransitionError("invalid-commerce-transition");
  }
  return Object.freeze({ changed: true, from: input.from, to: input.to });
}
