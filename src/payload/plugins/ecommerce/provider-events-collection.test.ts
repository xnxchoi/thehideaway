import { describe, expect, it } from "vitest";
import { CheckoutProviderEvents } from "./provider-events-collection";

describe("checkout provider event journal", () => {
  it("registers a durable journal without dormant payment FKs or replay endpoints", async () => {
    expect(CheckoutProviderEvents.slug).toBe("commerce-provider-events");
    expect(CheckoutProviderEvents.endpoints).toEqual([]);
    expect(
      CheckoutProviderEvents.fields.some(
        (field) => "name" in field && field.name === "product_payment"
      )
    ).toBe(false);
    expect(
      CheckoutProviderEvents.fields.find(
        (field) => "name" in field && field.name === "dedupe_key"
      )
    ).toMatchObject({ unique: true });
    expect(await CheckoutProviderEvents.access?.create?.({} as never)).toBe(
      false
    );
    expect(await CheckoutProviderEvents.access?.update?.({} as never)).toBe(
      false
    );
  });
});
