import { describe, expect, it } from "vitest";

import { createLostMergeCartEndpoint } from "./merge-cart-endpoint";

describe("createLostMergeCartEndpoint", () => {
  it("wraps the plugin merge route so guest login can use the mode matcher", () => {
    const endpoint = createLostMergeCartEndpoint({
      cartsSlug: "carts"
    });
    expect(endpoint).toMatchObject({
      method: "post",
      path: "/:id/merge"
    });
    expect(typeof endpoint.handler).toBe("function");
  });
});
