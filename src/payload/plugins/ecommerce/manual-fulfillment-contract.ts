import { isDeepStrictEqual } from "node:util";
import { z } from "zod";

const commandKey = z.string().regex(/^[A-Za-z0-9_-]{16,128}$/);
const identifier = z.string().uuid();
const date = z.string().datetime({ offset: true });
const integer = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const manualCarriers = ["cj_logistics", "lotte", "hanjin", "korea_post", "logen"] as const;
const carrier = z.enum(manualCarriers);
const trackingNumber = z.string().trim().regex(/^[A-Za-z0-9-]{4,50}$/);
const coverage = z.object({ snapshotIndex: integer, quantity: integer.min(1) }).strict();
const common = {
  commandKey,
  expectedRevision: integer,
  reason: z.string().trim().min(1).max(300)
};
const commands = z.discriminatedUnion("action", [
  z.object({ ...common, action: z.literal("prepare") }).strict(),
  z.object({ ...common, action: z.literal("dispatch"), carrier, trackingNumber, shippedAt: date, lines: z.array(coverage).min(1).max(200) }).strict(),
  z.object({ ...common, action: z.literal("confirm_delivery"), deliveredAt: date }).strict(),
  z.object({ ...common, action: z.literal("correct_tracking"), carrier, trackingNumber }).strict()
]);
export type ManualFulfillmentCommand = z.infer<typeof commands> & { orderId: string };
const shipmentSchema = z.object({
  carrier, trackingNumber, trackingUrl: z.string().url(),
  shippedAt: date, dispatchedRecordedAt: date,
  deliveredAt: date.nullable(), deliveryRecordedAt: date.nullable(),
  lines: z.array(coverage).min(1).max(200)
}).strict();
export type ManualShipment = z.infer<typeof shipmentSchema>;
const state = z.object({ status: z.string(), shipment: shipmentSchema.nullable() }).strict();
const historyEvent = z.object({
  revision: integer.min(1), commandId: z.string().min(1),
  action: z.enum(["prepare", "dispatch", "confirm_delivery", "correct_tracking"]),
  actorId: identifier, reason: common.reason, recordedAt: date,
  before: state, after: state
}).strict();
export type ManualFulfillmentHistoryEvent = z.infer<typeof historyEvent>;
export type ManualFulfillmentPatch = {
  fulfillment_status: string;
  manual_shipment: ManualShipment | null;
  fulfillment_history: ManualFulfillmentHistoryEvent[];
};
export class ManualFulfillmentError extends Error {
  constructor(readonly code: string, readonly status = 409, readonly retryAfterMs?: number) { super(code); }
}

export function parseManualFulfillmentCommand(orderId: unknown, input: unknown): ManualFulfillmentCommand {
  const id = identifier.safeParse(orderId);
  const command = commands.safeParse(input);
  if (!id.success || !command.success) throw new ManualFulfillmentError("invalid-fulfillment-command", 400);
  return { ...command.data, orderId: id.data };
}

export function manualFulfillmentState(order: Record<string, unknown>) {
  const history = z.array(historyEvent).safeParse(order.fulfillment_history ?? []);
  // Payload groups with all-null fields represent an absent optional shipment.
  const raw = order.manual_shipment as Record<string, unknown> | null | undefined;
  const absent = !raw || Object.values(raw).every((value) => value == null);
  const shipment = shipmentSchema.nullable().safeParse(absent ? null : raw);
  if (!history.success || !shipment.success || typeof order.fulfillment_status !== "string")
    throw new ManualFulfillmentError("fulfillment-record-invalid");
  for (const [index, event] of history.data.entries()) {
    if (event.revision !== index + 1 || (index > 0 && !isDeepStrictEqual(event.before, history.data[index - 1].after)))
      throw new ManualFulfillmentError("fulfillment-record-invalid");
  }
  const current = { status: order.fulfillment_status, shipment: shipment.data };
  if (history.data.length && !isDeepStrictEqual(history.data.at(-1)?.after, current))
    throw new ManualFulfillmentError("fulfillment-record-invalid");
  return { current, history: history.data };
}

function trackingUrl(value: z.infer<typeof carrier>, number: string): string {
  const tracking = encodeURIComponent(number);
  const urls = {
    cj_logistics: `https://trace.cjlogistics.com/web/detail.jsp?slipno=${tracking}`,
    lotte: `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${tracking}`,
    hanjin: `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnum=${tracking}`,
    korea_post: `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${tracking}`,
    logen: `https://www.ilogen.com/web/personal/trace/${tracking}`
  };
  return urls[value];
}

function effectiveDate(value: string, now: Date, earliest?: string): string {
  const time = Date.parse(value);
  if (!Number.isFinite(time) || time > now.getTime() || (earliest && time < Date.parse(earliest)))
    throw new ManualFulfillmentError("fulfillment-date-invalid", 400);
  return new Date(time).toISOString();
}

function assertCoverage(lines: z.infer<typeof coverage>[], snapshot: Record<string, unknown>) {
  const expected = snapshot.items;
  if (!Array.isArray(expected) || !expected.length || lines.length !== expected.length ||
    new Set(lines.map((line) => line.snapshotIndex)).size !== expected.length ||
    lines.some((line) => !Number.isSafeInteger(expected[line.snapshotIndex]?.quantity) || line.quantity !== expected[line.snapshotIndex]?.quantity))
    throw new ManualFulfillmentError("fulfillment-line-coverage-invalid", 400);
}

/** Pure transition: never updates financial fields or the immutable purchase snapshot. */
export function planManualFulfillment({ order, command, actorId, commandId, now }: {
  order: Record<string, unknown>; command: ManualFulfillmentCommand;
  actorId: string; commandId: string; now: Date;
}): ManualFulfillmentPatch {
  const snapshot = order.checkout_snapshot as Record<string, unknown> | null;
  if (order.id !== command.orderId || order.payment_status !== "paid" || order.lifecycle_status !== "paid" ||
    order.status !== "processing" || order.reconciliation_required === true || snapshot?.fulfillmentKind !== "physical")
    throw new ManualFulfillmentError("fulfillment-order-ineligible");
  const { current, history } = manualFulfillmentState(order);
  if (history.length !== command.expectedRevision) throw new ManualFulfillmentError("fulfillment-revision-conflict");
  let next = current;
  if (command.action === "prepare") {
    if (current.status !== "unfulfilled" || current.shipment) throw new ManualFulfillmentError("fulfillment-transition-invalid");
    next = { status: "preparing", shipment: null };
  } else if (command.action === "dispatch") {
    if (current.status !== "preparing" || current.shipment) throw new ManualFulfillmentError("fulfillment-transition-invalid");
    assertCoverage(command.lines, snapshot);
    next = { status: "shipped", shipment: {
      carrier: command.carrier, trackingNumber: command.trackingNumber, trackingUrl: trackingUrl(command.carrier, command.trackingNumber),
      shippedAt: effectiveDate(command.shippedAt, now), dispatchedRecordedAt: now.toISOString(),
      deliveredAt: null, deliveryRecordedAt: null,
      lines: [...command.lines].sort((a, b) => a.snapshotIndex - b.snapshotIndex).map((line) => ({ ...line }))
    } };
  } else if (command.action === "confirm_delivery") {
    if (current.status !== "shipped" || !current.shipment || current.shipment.deliveredAt) throw new ManualFulfillmentError("fulfillment-transition-invalid");
    next = { status: "delivered", shipment: { ...current.shipment, deliveredAt: effectiveDate(command.deliveredAt, now, current.shipment.shippedAt), deliveryRecordedAt: now.toISOString() } };
  } else {
    if (!["shipped", "delivered"].includes(current.status) || !current.shipment) throw new ManualFulfillmentError("fulfillment-transition-invalid");
    if (command.carrier === current.shipment.carrier && command.trackingNumber === current.shipment.trackingNumber) throw new ManualFulfillmentError("fulfillment-tracking-unchanged");
    next = { ...current, shipment: { ...current.shipment, carrier: command.carrier, trackingNumber: command.trackingNumber, trackingUrl: trackingUrl(command.carrier, command.trackingNumber) } };
  }
  const event: ManualFulfillmentHistoryEvent = {
    revision: history.length + 1, commandId, action: command.action, actorId, reason: command.reason,
    recordedAt: now.toISOString(), before: current, after: next
  };
  return { fulfillment_status: next.status, manual_shipment: next.shipment, fulfillment_history: [...history, event] };
}
