import type { NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/getServerSession";
import { getPayload } from "@/lib/payload";
import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { enforceRateLimit } from "@/lib/api/rateLimit";
import { getCustomerOrder, listCustomerOrders } from "./order-history";

const bodySchema = z
  .object({
    orderRef: z.string().min(1).max(100),
    purchaseAccessToken: z.string().min(1).max(512).optional()
  })
  .strict();

function response(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      Vary: "Cookie",
      "Referrer-Policy": "no-referrer"
    }
  });
}
const failure = (code: string, status: number) =>
  response({ error: code }, status);

async function readOrders(request: NextRequest, mode: "list" | "detail") {
  try {
    if (mode === "detail" && !isSameOrigin(request))
      return failure("order-access-denied", 403);
    const session = await getServerSession(request.headers);
    const customerID = session?.user.id;
    if (mode === "list" && !customerID)
      return failure("order-auth-required", 401);
    const limit = await enforceRateLimit(
      request,
      mode === "detail" ? "auth" : "default",
      customerID
    );
    if (!limit.ok) {
      const result = failure("order-rate-limited", 429);
      result.headers.set("Retry-After", String(limit.resetSeconds));
      return result;
    }
    if (mode === "list") {
      const pages = request.nextUrl.searchParams.getAll("page");
      if (pages.length > 1) return failure("invalid-order-page", 400);
      return response(
        await listCustomerOrders(await getPayload(), customerID, pages[0])
      );
    }
    const body = bodySchema.safeParse(await request.json().catch(() => null));
    if (!body.success) return failure("invalid-order-request", 400);
    if (!customerID && !body.data.purchaseAccessToken)
      return failure("order-not-found", 404);
    const order = await getCustomerOrder(await getPayload(), {
      ...body.data,
      customerID
    });
    return order ? response({ order }) : failure("order-not-found", 404);
  } catch (error) {
    if (error instanceof Error && error.message === "invalid-order-page")
      return failure("invalid-order-page", 400);
    // Avoid logging request bodies, capabilities, snapshots or provider exceptions.
    console.error("commerce-order-read-failed");
    return failure("order-read-failed", 500);
  }
}

export const listOrdersEndpoint = (request: NextRequest) =>
  readOrders(request, "list");
export const orderDetailEndpoint = (request: NextRequest) =>
  readOrders(request, "detail");
