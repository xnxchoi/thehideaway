import { APIError, type CollectionBeforeChangeHook } from "payload";

export const protectCartQuantities: CollectionBeforeChangeHook = ({ data }) => {
  let count = 0;
  if (data.items != null) {
    if (!Array.isArray(data.items))
      throw new APIError("cart-items-invalid", 400);
    for (const item of data.items) {
      if (!item || !Number.isSafeInteger(item.quantity) || item.quantity < 1)
        throw new APIError("cart-quantity-invalid", 400);
      count += item.quantity;
      if (!Number.isSafeInteger(count))
        throw new APIError("cart-quantity-invalid", 400);
    }
  }
  if (
    data.subtotal != null &&
    (!Number.isSafeInteger(data.subtotal) || data.subtotal < 0)
  )
    throw new APIError("cart-subtotal-invalid", 400);
  return data;
};

export function validCartQuantityInput(path: string, value: unknown): boolean {
  if (path === "/:id/add-item")
    return (
      value === undefined || (Number.isSafeInteger(value) && Number(value) > 0)
    );
  if (path !== "/:id/update-item") return true;
  if (typeof value === "number")
    return Number.isSafeInteger(value) && value >= 0;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return (
    Object.keys(value).length === 1 &&
    "$inc" in value &&
    Number.isSafeInteger(value.$inc)
  );
}
