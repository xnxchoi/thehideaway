import type { CollectionSlug, Endpoint } from "payload";
import type { NextRequest } from "next/server";
import { addDataAndFileToRequest } from "payload";
import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { enforceRateLimit } from "@/lib/api/rateLimit";
import { CartMergeError, mergeCustomerCart } from "./cart-merge";

import { cartLinesMatch } from "./cart-item-matcher";
import { mergeCartEndpoint as createPluginMergeCartEndpoint } from "../../../../node_modules/@payloadcms/plugin-ecommerce/dist/collections/carts/endpoints/mergeCart.js";

// WHY-OVERRIDE-PAYLOAD: plugin 3.88.0 createCartsCollection constructs
// mergeCartEndpoint without cartItemMatcher, and package exports do not
// expose that factory. Merge compares two CartItemData rows, so the
// matcher must accept populated product/variant objects on both sides.

export function createLostMergeCartEndpoint(args: {
  cartsSlug: string;
}): Endpoint {
  const official = createPluginMergeCartEndpoint({
    cartItemMatcher: ({ existingItem, newItem }) =>
      cartLinesMatch(existingItem, newItem),
    cartsSlug: args.cartsSlug as CollectionSlug
  });
  if (args.cartsSlug !== "carts")
    throw new Error("unsupported-cart-collection");
  return {
    ...official,
    handler: async (req) => {
      const respond = (body: object, status = 200) =>
        Response.json(body, {
          status,
          headers: { "Cache-Control": "private, no-store" }
        });
      try {
        if (!req.user) throw new CartMergeError(401, "cart-auth-required");
        if (!isSameOrigin(req as unknown as NextRequest))
          throw new CartMergeError(403, "cart-access-denied");
        const limit = await enforceRateLimit(
          req as unknown as NextRequest,
          "mutation",
          req.user.id
        );
        if (!limit.ok) {
          const response = respond(
            { success: false, code: "cart-rate-limited" },
            429
          );
          response.headers.set("Retry-After", String(limit.resetSeconds));
          return response;
        }
        await addDataAndFileToRequest(req);
        const sourceCartID = req.data?.sourceCartID;
        const sourceSecret = req.data?.sourceSecret;
        const targetCartID = req.routeParams?.id;
        const uuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (
          typeof sourceCartID !== "string" ||
          !uuid.test(sourceCartID) ||
          typeof targetCartID !== "string" ||
          !uuid.test(targetCartID) ||
          typeof sourceSecret !== "string" ||
          !/^[a-f0-9]{40}$/.test(sourceSecret)
        ) {
          throw new CartMergeError(400, "cart-merge-invalid");
        }
        return respond(
          await mergeCustomerCart(
            req,
            { sourceCartID, sourceSecret, targetCartID },
            official.handler
          )
        );
      } catch (error) {
        if (error instanceof CartMergeError)
          return respond({ success: false, code: error.code }, error.status);
        req.payload.logger.error("Cart merge failed");
        return respond({ success: false, code: "cart-merge-failed" }, 500);
      }
    }
  };
}
