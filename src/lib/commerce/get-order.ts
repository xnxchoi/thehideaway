import {
  projectCommerceOrder,
  type CommerceOrderProjection,
  type CommerceRepository
} from "./create-order";

export async function getCommerceOrder(input: {
  repository: CommerceRepository;
  ref: string;
  userId: string;
  isAdmin?: boolean;
}): Promise<CommerceOrderProjection> {
  const ref = input.ref.trim();
  if (ref.length < 8 || ref.length > 128 || !/^[A-Za-z0-9_-]+$/.test(ref)) {
    throw new Error("invalid-order-ref");
  }

  const order = await input.repository.findOrderByRef(ref);
  if (!order || (!input.isAdmin && order.userId !== input.userId)) {
    throw new Error("order-not-found");
  }
  return projectCommerceOrder(order);
}
