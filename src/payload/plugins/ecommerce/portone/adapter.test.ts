import { describe, expect, it } from "vitest";

import { portoneAdapter } from "./adapter";

describe("portoneAdapter", () => {
  it("registers PortOne as a plugin payment method with snapshot group fields", () => {
    const adapter = portoneAdapter();
    expect(adapter.name).toBe("portone");
    expect(adapter.group).toMatchObject({
      name: "portone",
      type: "group"
    });
    const fieldNames = adapter.group.fields.map((field) =>
      "name" in field ? field.name : undefined
    );
    expect(fieldNames).toEqual(
      expect.arrayContaining([
        "paymentId",
        "transactionId",
        "channel",
        "method"
      ])
    );
  });

  it("exposes a webhook at /webhooks", () => {
    const adapter = portoneAdapter();
    expect(adapter.endpoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ method: "post", path: "/webhooks" })
      ])
    );
  });
});
