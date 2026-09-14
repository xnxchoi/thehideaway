import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  viewer: "user-1" as string | null,
  data: undefined as any,
  isError: false,
  options: undefined as any
}));
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  useEffect: vi.fn()
}));
vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: unknown) => {
    state.options = options;
    return { mutate: vi.fn(), data: state.data, isError: state.isError };
  }
}));
vi.mock("@/lib/auth/session/RP_SessionProvider", () => ({
  useRPSession: (selector: (value: { id: string | null }) => unknown) =>
    selector({ id: state.viewer })
}));
import { PurchaseStatusClient } from "./purchase-status.client";
import {
  rememberPurchasePayment,
  readPurchasePayment
} from "@/payload/plugins/ecommerce/client/purchase-confirmation";
const props = {
  orderRef: "LIS-1",
  paid: "paid",
  pending: "pending",
  failed: "failed",
  refunded: "refunded",
  partiallyRefunded: "partially-refunded",
  unavailable: "unavailable"
};
const payment = {
  orderRef: "LIS-1",
  paymentId: "pay-1",
  cartID: "cart-original",
  purchaseAccessToken: "capability"
};
beforeEach(() => {
  state.viewer = "user-1";
  state.data = undefined;
  state.isError = false;
  const values = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key)
  });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          order_ref: "LIS-1",
          paymentStatus: "paid",
          attemptStatus: "succeeded"
        })
      )
    )
  );
});
describe("purchase status receipt boundary", () => {
  it("does not show a paid receipt until the capability has been confirmed", async () => {
    rememberPurchasePayment(payment);
    expect(PurchaseStatusClient(props)).toBe("pending");
    state.data = await state.options.mutationFn({
      viewer: "user-1",
      requestedOrder: "LIS-1"
    });
    expect(PurchaseStatusClient(props)).toBe("paid");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("does not send guessed order references or missing browser proof to confirmation", async () => {
    PurchaseStatusClient(props);
    await expect(
      state.options.mutationFn({ viewer: "user-1", requestedOrder: "LIS-1" })
    ).rejects.toThrow("purchase-access-unavailable");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("does not reuse a receipt after account switch, logout or route change", async () => {
    rememberPurchasePayment(payment);
    PurchaseStatusClient(props);
    state.data = await state.options.mutationFn({
      viewer: "user-1",
      requestedOrder: "LIS-1"
    });
    state.viewer = "user-2";
    expect(PurchaseStatusClient(props)).toBe("pending");
    state.viewer = null;
    expect(PurchaseStatusClient(props)).toBe("pending");
    state.viewer = "user-1";
    expect(PurchaseStatusClient({ ...props, orderRef: "LIS-2" })).toBe(
      "pending"
    );
  });
  it("does not show paid when reconciliation is required", () => {
    state.data = {
      viewer: "user-1",
      requestedOrder: "LIS-1",
      result: { paymentStatus: "paid", reconciliationRequired: true }
    };
    expect(PurchaseStatusClient(props)).toBe("pending");
  });
  it("allows an explicit retry only after an authoritative terminal attempt", async () => {
    rememberPurchasePayment(payment);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            order_ref: "LIS-1",
            paymentStatus: "pending",
            attemptStatus: "cancelled"
          })
        )
      )
    );
    PurchaseStatusClient(props);
    state.data = await state.options.mutationFn({
      viewer: "user-1",
      requestedOrder: "LIS-1"
    });
    expect(PurchaseStatusClient(props)).toBe("failed");
  });
  it("preserves refunded display on confirmation replay", () => {
    state.data = {
      viewer: "user-1",
      requestedOrder: "LIS-1",
      result: { paymentStatus: "refunded", attemptStatus: "refunded" }
    };
    expect(PurchaseStatusClient(props)).toBe("refunded");
  });
  it("does not replace newer pending B when an unmounted A mutation completes", async () => {
    rememberPurchasePayment(payment);
    let resolve!: (response: Response) => void;
    const delayed = new Promise<Response>((done) => {
      resolve = done;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => delayed)
    );
    PurchaseStatusClient(props);
    const completion = state.options.mutationFn({
      viewer: "user-1",
      requestedOrder: "LIS-1"
    });
    const newer = { ...payment, paymentId: "pay-B", orderRef: "LIS-B" };
    rememberPurchasePayment(newer);
    state.viewer = "user-2";
    resolve(
      new Response(
        JSON.stringify({
          order_ref: "LIS-1",
          paymentStatus: "pending",
          attemptStatus: "cancelled"
        })
      )
    );
    await completion;
    expect(readPurchasePayment()).toEqual(newer);
  });
  it("confirms the actual PortOne order=paymentId return shape", async () => {
    rememberPurchasePayment(payment);
    PurchaseStatusClient({ ...props, orderRef: payment.paymentId });
    await expect(
      state.options.mutationFn({
        viewer: "user-1",
        requestedOrder: payment.paymentId
      })
    ).resolves.toMatchObject({
      result: { orderRef: payment.orderRef, paymentStatus: "paid" }
    });
  });
});
