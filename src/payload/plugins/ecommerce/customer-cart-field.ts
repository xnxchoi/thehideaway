import type { JoinField } from "payload";

/** The official provider discovers the active cart through users/me.cart.docs. */
export const customerCartField: JoinField = {
  name: "cart",
  type: "join",
  collection: "carts",
  on: "customer",
  defaultLimit: 1,
  defaultSort: ["-updatedAt", "-id"],
  where: { purchasedAt: { exists: false } },
  access: {
    read: ({ req, doc }) =>
      req.user?.collection === "users" && req.user.id === doc?.id
  },
  admin: { hidden: true }
};
