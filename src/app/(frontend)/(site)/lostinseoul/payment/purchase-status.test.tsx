import { expect, it, vi } from "vitest";
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key
}));
vi.mock("./purchase-status.client", () => ({
  PurchaseStatusClient: () => null
}));
vi.mock("./status-shell", () => ({ LostPaymentStatusShell: () => null }));
import { PurchaseStatus } from "./purchase-status";
it("uses the callback reference for verification without displaying it as an order reference", async () => {
  const result = await PurchaseStatus({
    orderRef: "provider-payment-id",
    showOrderReference: false
  });
  expect(result.props.orderRef).toBe("provider-payment-id");
  expect(result.props.paid.props.order).toBeUndefined();
});
