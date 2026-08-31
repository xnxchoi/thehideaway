export function serverCartAmount(cart: {
  subtotal?: unknown;
  items?: { line_amount?: unknown; quantity?: unknown }[];
}): number {
  const subtotal = cart.subtotal;
  if (
    typeof subtotal !== "number" ||
    !Number.isInteger(subtotal) ||
    subtotal <= 0
  ) {
    throw new Error("invalid-cart-amount");
  }

  const snapshots = (cart.items ?? []).map((item) => item.line_amount);
  if (
    snapshots.length > 0 &&
    snapshots.every((value) => typeof value === "number")
  ) {
    const sum = snapshots.reduce<number>(
      (total, value) => total + (value as number),
      0
    );
    if (sum !== subtotal) throw new Error("cart-amount-mismatch");
  }

  return subtotal;
}
