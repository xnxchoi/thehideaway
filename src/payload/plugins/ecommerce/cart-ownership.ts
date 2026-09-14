import {
  APIError,
  type Access,
  type CollectionBeforeChangeHook,
  type Where
} from "payload";

const authorizedRequests = new WeakSet<object>();

/** Grant only to the exact server-owned request used by merge or settlement. */
export function authorizeCartOwnershipRequest(req: object): void {
  authorizedRequests.add(req);
}

function ownerID(value: unknown): unknown {
  if (value && typeof value === "object" && "id" in value) return value.id;
  return value ?? null;
}

function forbidden(code: string): never {
  throw new APIError(code, 403);
}

export const protectCartOwnership: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req
}) => {
  if (authorizedRequests.has(req)) return data;
  const next = { ...data };
  if (operation === "create") {
    const customer = req.user?.collection === "users" ? req.user.id : null;
    if (next.customer != null && ownerID(next.customer) !== customer)
      forbidden("cart-owner-forbidden");
    if (next.purchasedAt != null || next.secret != null)
      forbidden("cart-lifecycle-forbidden");
    return { ...next, customer };
  }
  if (originalDoc?.purchasedAt) forbidden("cart-purchased");
  if (
    Object.hasOwn(next, "customer") &&
    ownerID(next.customer) !== ownerID(originalDoc?.customer)
  )
    forbidden("cart-owner-forbidden");
  for (const field of ["secret", "purchasedAt"] as const) {
    if (
      Object.hasOwn(next, field) &&
      (next[field] ?? null) !== (originalDoc?.[field] ?? null)
    )
      forbidden("cart-lifecycle-forbidden");
  }
  return next;
};

/** A guest capability can never authorize an account cart, even if a legacy secret remains. */
export function restrictCartAccess(
  base: Access | undefined,
  options: { writable?: boolean } = {}
): Access {
  return async (args) => {
    const existing = base ? await base(args) : false;
    if (!existing) return false;
    if (args.req.user?.role === "admin") {
      if (!options.writable) return existing;
      const unpaid: Where = { purchasedAt: { exists: false } };
      return existing === true ? unpaid : { and: [existing, unpaid] };
    }
    const { req } = args;
    const user = req.user?.collection === "users" ? req.user : null;
    const secret = req.context?.cartSecret ?? req.query?.secret;
    const guest: Where | undefined =
      typeof secret === "string" && secret.length > 0
        ? {
            and: [
              { customer: { exists: false } },
              { secret: { equals: secret } }
            ]
          }
        : undefined;
    const owner: Where | undefined = user
      ? { customer: { equals: user.id } }
      : undefined;
    const scope = owner && guest ? { or: [owner, guest] } : (owner ?? guest);
    if (!scope) return false;
    const permitted = existing === true ? scope : { and: [existing, scope] };
    return options.writable
      ? { and: [permitted, { purchasedAt: { exists: false } }] }
      : permitted;
  };
}
