import { describe, expect, it } from "vitest";

import {
  pluginStatusFromLifecycle,
  protectPluginOrderLifecycle
} from "./order-lifecycle";

describe("pluginStatusFromLifecycle", () => {
  it("maps the LOSTINSEOUL lifecycle onto the plugin coarse status", () => {
    expect(pluginStatusFromLifecycle("pending_payment")).toBe("processing");
    expect(pluginStatusFromLifecycle("paid")).toBe("processing");
    expect(pluginStatusFromLifecycle("confirmed")).toBe("completed");
    expect(pluginStatusFromLifecycle("converted")).toBe("completed");
    expect(pluginStatusFromLifecycle("canceled")).toBe("cancelled");
    expect(pluginStatusFromLifecycle("failed")).toBe("cancelled");
    expect(pluginStatusFromLifecycle("refunded")).toBe("refunded");
  });
});

describe("protectPluginOrderLifecycle", () => {
  it("rejects unauthenticated lifecycle jumps on plugin orders", async () => {
    await expect(
      protectPluginOrderLifecycle({
        collection: null,
        context: {},
        data: { lifecycle_status: "confirmed" },
        originalDoc: { lifecycle_status: "pending_payment" },
        operation: "update",
        req: {},
        index: undefined
      } as never)
    ).rejects.toThrow("commerce-lifecycle-update-forbidden");
  });

  it("rejects invalid lifecycle transitions even when authorized", async () => {
    const req = { context: { user: { role: "admin" } } };
    const { authorizeCommerceLifecycleRequest } = await import(
      "@/lib/lost-commerce/lifecycle-authorization"
    );
    authorizeCommerceLifecycleRequest(req);
    await expect(
      protectPluginOrderLifecycle({
        collection: null,
        context: {},
        data: { lifecycle_status: "converted" },
        originalDoc: { lifecycle_status: "pending_payment" },
        operation: "update",
        req,
        index: undefined
      } as never)
    ).rejects.toThrow("invalid-commerce-transition");
  });
});
