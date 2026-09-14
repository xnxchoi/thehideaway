import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import {
  APIError,
  addDataAndFileToRequest,
  type CollectionBeforeOperationHook,
  type Endpoint,
  type PayloadRequest
} from "payload";
import type { NextRequest } from "next/server";
import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { enforceRateLimit } from "@/lib/api/rateLimit";
import { validCartQuantityInput } from "./cart-quantities";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function lockCartRows(req: PayloadRequest, ids: string[]) {
  if (ids.some((id) => !UUID.test(id)))
    throw new APIError("cart-id-invalid", 400);
  const transactionID = await req.transactionID;
  const sessions = req.payload.db.sessions as
    PostgresAdapter["sessions"] | undefined;
  const session =
    transactionID == null ? undefined : sessions?.[String(transactionID)];
  if (!session) throw new Error("cart-transaction-required");
  // Payload has no Local API row-lock option. Stable order avoids opposing merge deadlocks.
  await session.db.execute(
    sql`SELECT id FROM carts WHERE id IN (${sql.join(
      ids.map((id) => sql`${id}::uuid`),
      sql`, `
    )}) ORDER BY id FOR UPDATE`
  );
}

/** Runs before original-document reads in Payload3.88 updateByID/deleteByID. */
export const protectCartMutationReads: CollectionBeforeOperationHook = async ({
  args,
  operation,
  req
}) => {
  if (
    operation !== "update" &&
    operation !== "delete" &&
    operation !== "updateByID" &&
    operation !== "deleteByID"
  )
    return args;
  if (!("id" in args) || typeof args.id !== "string")
    throw new APIError("cart-single-update-required", 400);
  await lockCartRows(req, [args.id]);
  return args;
};

/** Vendor item operations read then replace the entire array; lock before that read. */
export function wrapCartMutationEndpoint(endpoint: Endpoint): Endpoint {
  if (endpoint.method !== "post" || endpoint.path === "/:id/merge")
    return endpoint;
  return {
    ...endpoint,
    handler: async (req) => {
      const response = (code: string, status: number) =>
        Response.json(
          { success: false, code },
          {
            status,
            headers: { "Cache-Control": "private, no-store" }
          }
        );
      if (!isSameOrigin(req as unknown as NextRequest))
        return response("cart-access-denied", 403);
      const limit = await enforceRateLimit(
        req as unknown as NextRequest,
        "mutation",
        req.user?.id
      );
      if (!limit.ok) {
        const limited = response("cart-rate-limited", 429);
        limited.headers.set("Retry-After", String(limit.resetSeconds));
        return limited;
      }
      const id = req.routeParams?.id;
      if (typeof id !== "string" || !UUID.test(id))
        return response("cart-id-invalid", 400);
      await addDataAndFileToRequest(req);
      if (!validCartQuantityInput(endpoint.path, req.data?.quantity))
        return response("cart-quantity-invalid", 400);
      if (req.transactionID) return response("cart-operation-unavailable", 500);
      const transactionID = await req.payload.db.beginTransaction();
      if (!transactionID) return response("cart-operation-unavailable", 500);
      const locked = {
        ...req,
        context: { ...req.context },
        transactionID
      } as PayloadRequest;
      try {
        await lockCartRows(locked, [id]);
        const result = await endpoint.handler(locked);
        if (!result || !result.ok) {
          await req.payload.db.rollbackTransaction(transactionID);
          return result ?? response("cart-operation-unavailable", 500);
        }
        await req.payload.db.commitTransaction(transactionID);
        result.headers.set("Cache-Control", "private, no-store");
        return result;
      } catch (error) {
        await req.payload.db.rollbackTransaction(transactionID).catch(() => {
          req.payload.logger.error("Cart mutation rollback failed");
        });
        if (error instanceof APIError)
          return response("cart-operation-denied", error.status);
        req.payload.logger.error("Cart mutation failed");
        return response("cart-operation-unavailable", 500);
      }
    }
  };
}
