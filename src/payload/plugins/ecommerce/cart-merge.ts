import { createHash } from "node:crypto";
import type { Endpoint, PayloadRequest } from "payload";
import {
  claimCommerceCommand,
  completeCommerceCommand,
  type CommerceCommandBinding
} from "@/lib/lost-commerce/commerce-commands";
import { relationID } from "./checkout-attempt";
import { authorizeCartOwnershipRequest } from "./cart-ownership";
import { lockCartRows } from "./cart-transaction";

export class CartMergeError extends Error {
  constructor(
    public status: number,
    public code: string
  ) {
    super(code);
  }
}

const denied = () => new CartMergeError(404, "cart-merge-unavailable");
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");

async function readCart(req: PayloadRequest, id: string) {
  const result = await req.payload.find({
    collection: "carts",
    where: { id: { equals: id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
    showHiddenFields: true
  });
  return result.docs[0];
}

function publicCart(cart: Awaited<ReturnType<typeof readCart>>) {
  if (!cart) throw denied();
  const { secret: _secret, ...result } = cart;
  return result;
}

/** Preserve the official merge algorithm, but commit deletion and its receipt together. */
export async function mergeCustomerCart(
  req: PayloadRequest,
  input: { sourceCartID: string; targetCartID: string; sourceSecret: string },
  officialHandler: Endpoint["handler"]
) {
  if (!req.user || req.user.collection !== "users")
    throw new CartMergeError(401, "cart-auth-required");
  const { sourceCartID, targetCartID, sourceSecret } = input;
  const self = sourceCartID === targetCartID;
  const commandKey = digest(
    `cart-merge:${sourceCartID}:${req.user.id}:${targetCartID}`
  );
  const binding: CommerceCommandBinding = {
    actorId: req.user.id,
    operation: "cart.merge",
    resource: { type: "carts", id: sourceCartID },
    reasonCode: "customer-login",
    auditSource: "storefront"
  };
  const target = await readCart(req, targetCartID);
  if (
    !target ||
    (!self && relationID(target.customer) !== req.user.id) ||
    target.purchasedAt
  )
    throw denied();
  const commands = await req.payload.find({
    collection: "commerce-commands",
    overrideAccess: true,
    req,
    depth: 0,
    limit: 1,
    where: { command_key: { equals: commandKey } }
  });
  // Never reserve a permanent source identity until the caller proves guest ownership.
  if (!commands.docs.length) {
    const source = self ? target : await readCart(req, sourceCartID);
    if (
      !source ||
      source.customer ||
      source.purchasedAt ||
      source.secret !== sourceSecret
    )
      throw denied();
    if (source.currency !== target.currency)
      throw new CartMergeError(409, "cart-currency-conflict");
  }
  const claim = await claimCommerceCommand({
    payload: req.payload,
    commandKey,
    businessKey: `cart-merge:${commandKey}`,
    binding,
    validatedInput: { targetCartID, proofDigest: digest(sourceSecret) }
  });
  if (claim.kind === "conflict") throw denied();
  if (claim.kind === "in_progress")
    throw new CartMergeError(409, "cart-merge-in-progress");
  if (claim.kind === "replay") {
    const current = await readCart(req, targetCartID);
    if (relationID(current?.customer) !== req.user.id) throw denied();
    return { success: true, cart: publicCart(current) };
  }
  if (req.transactionID) throw new Error("cart-merge-nested-transaction");
  const transactionID = await req.payload.db.beginTransaction();
  if (!transactionID) throw new Error("cart-merge-transaction-required");
  const locked = {
    ...req,
    context: { ...req.context },
    transactionID
  } as PayloadRequest;
  try {
    await lockCartRows(locked, [sourceCartID, targetCartID]);
    const source = await readCart(locked, sourceCartID);
    const current = self ? source : await readCart(locked, targetCartID);
    if (
      !source ||
      source.customer ||
      source.purchasedAt ||
      source.secret !== sourceSecret ||
      !current ||
      current.purchasedAt ||
      (!self && relationID(current.customer) !== req.user.id)
    )
      throw denied();
    if (source.currency !== current.currency)
      throw new CartMergeError(409, "cart-currency-conflict");
    if (self) {
      authorizeCartOwnershipRequest(locked);
      await req.payload.update({
        collection: "carts",
        id: sourceCartID,
        overrideAccess: true,
        req: locked,
        data: {
          customer: req.user.id,
          secret: null,
          items: source.items,
          currency: source.currency
        }
      });
    } else {
      const result = await officialHandler(locked);
      if (!result || !result.ok || !(await result.json()).success)
        throw denied();
      // 3.88.0 swallows source-delete errors; never commit a half-merge.
      if (await readCart(locked, sourceCartID))
        throw new Error("cart-merge-source-delete-failed");
    }
    await completeCommerceCommand({
      payload: req.payload,
      req: locked,
      commandKey,
      binding,
      resource: binding.resource,
      requestHash: claim.requestHash,
      leaseToken: claim.leaseToken,
      response: { cartId: targetCartID }
    });
    const result = publicCart(await readCart(locked, targetCartID));
    await req.payload.db.commitTransaction(transactionID);
    return { success: true, cart: result };
  } catch (error) {
    await req.payload.db.rollbackTransaction(transactionID).catch(() => {
      req.payload.logger.error("Cart merge rollback failed");
    });
    throw error;
  }
}
