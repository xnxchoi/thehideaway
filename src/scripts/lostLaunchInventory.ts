export type LostLaunchReceiptStatus = "draft" | "open" | "closed";

export type LostLaunchInventoryAction =
  "initialize" | "close_receipt" | "complete";

export function lostLaunchInventoryAction(
  quantity: number,
  receiptStatus: LostLaunchReceiptStatus | null
): LostLaunchInventoryAction {
  if (quantity === 0 && receiptStatus !== "closed") return "initialize";
  if (quantity === 5 && receiptStatus === "open") return "close_receipt";
  if (
    quantity === 5 &&
    (receiptStatus === "closed" || receiptStatus === null)
  ) {
    return "complete";
  }

  throw new Error(
    `lost-launch-hoodie-inventory-state:${quantity}:${receiptStatus ?? "none"}`
  );
}
