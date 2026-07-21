import { describe, expect, it } from "vitest";

import { Events } from "./Events";
import { ProductCarts } from "./ProductCarts";
import { ProductOrders } from "./ProductOrders";
import { ProductPayments } from "./ProductPayments";
import { TicketOrders } from "./TicketOrders";
import { Tickets } from "./Tickets";

type AccessArgs = {
  req: {
    user?: {
      id: string;
      role: string;
    } | null;
  };
};

function accessArgs(role: string | null, id = "user-id"): AccessArgs {
  return {
    req: {
      user: role ? { id, role } : null
    }
  };
}

function namedField(collection: { fields: unknown[] }, name: string) {
  const field = collection.fields.find((candidate) => {
    return (
      typeof candidate === "object" &&
      candidate !== null &&
      "name" in candidate &&
      (candidate as { name?: unknown }).name === name
    );
  });
  if (!field) throw new Error(`Missing field ${name}`);
  return field as {
    access?: {
      create?: (args: AccessArgs) => boolean;
      read?: (args: AccessArgs) => boolean;
      update?: (args: AccessArgs) => boolean;
    };
  };
}

describe("commerce collection access contracts", () => {
  it("keeps order and payment creation behind controlled commerce services", async () => {
    for (const collection of [ProductOrders, ProductPayments]) {
      expect(
        await collection.access?.read?.(accessArgs("admin") as never)
      ).toBe(true);
      expect(
        await collection.access?.read?.(
          accessArgs("user", "buyer-1") as never
        )
      ).toEqual({ user: { equals: "buyer-1" } });

      expect(
        await collection.access?.create?.(accessArgs("admin") as never)
      ).toBe(false);
      expect(
        await collection.access?.create?.(accessArgs("user") as never)
      ).toBe(false);
      expect(
        await collection.access?.create?.(accessArgs(null) as never)
      ).toBe(false);

      expect(
        await collection.access?.update?.(accessArgs("admin") as never)
      ).toBe(true);
      expect(
        await collection.access?.delete?.(accessArgs("admin") as never)
      ).toBe(true);
    }

    const paymentEventsAccess = namedField(
      ProductPayments,
      "events"
    ).access;
    expect(paymentEventsAccess?.create?.(accessArgs("admin"))).toBe(false);
    expect(paymentEventsAccess?.update?.(accessArgs("admin"))).toBe(false);
  });

  it("keeps cart writes exclusively behind the validated cart API", async () => {
    expect(
      await ProductCarts.access?.read?.(accessArgs("admin") as never)
    ).toBe(true);
    expect(
      await ProductCarts.access?.read?.(accessArgs("user", "buyer-1") as never)
    ).toEqual({ user: { equals: "buyer-1" } });
    expect(await ProductCarts.access?.read?.(accessArgs(null) as never)).toBe(
      false
    );

    for (const role of [
      "admin",
      "cofounder",
      "editor",
      "author",
      "patron",
      "resident",
      "user",
      "guest",
      null
    ]) {
      expect(
        await ProductCarts.access?.create?.(accessArgs(role) as never)
      ).toBe(false);
      expect(
        await ProductCarts.access?.update?.(accessArgs(role) as never)
      ).toBe(false);
    }
  });

  it("keeps ticket writes behind admin/custom API paths", async () => {
    expect(await Tickets.access?.create?.(accessArgs("admin") as never)).toBe(
      true
    );
    expect(await Tickets.access?.update?.(accessArgs("admin") as never)).toBe(
      true
    );

    expect(await Tickets.access?.create?.(accessArgs("user") as never)).toBe(
      false
    );
    expect(await Tickets.access?.update?.(accessArgs("user") as never)).toBe(
      false
    );
  });

  it("keeps ticket order writes behind admin/custom API paths", async () => {
    expect(
      await TicketOrders.access?.create?.(accessArgs("admin") as never)
    ).toBe(true);
    expect(
      await TicketOrders.access?.update?.(accessArgs("admin") as never)
    ).toBe(true);

    expect(
      await TicketOrders.access?.create?.(accessArgs("user") as never)
    ).toBe(false);
    expect(
      await TicketOrders.access?.update?.(accessArgs("user") as never)
    ).toBe(false);
  });

  it("does not expose event exclusive payloads through public collection reads", () => {
    for (const fieldName of ["exclusive_content", "exclusive_links"]) {
      const read = namedField(Events, fieldName).access?.read;

      expect(read?.(accessArgs(null))).toBe(false);
      expect(read?.(accessArgs("user"))).toBe(false);
      expect(read?.(accessArgs("editor"))).toBe(true);
      expect(read?.(accessArgs("admin"))).toBe(true);
    }
  });

  it("does not expose ticket operational secrets through generic collection reads", () => {
    for (const fieldName of [
      "claim_token",
      "check_in_code",
      "passkey_credential_id",
      "delivery_address"
    ]) {
      const read = namedField(Tickets, fieldName).access?.read;

      expect(read?.(accessArgs(null))).toBe(false);
      expect(read?.(accessArgs("user"))).toBe(false);
      expect(read?.(accessArgs("editor"))).toBe(true);
      expect(read?.(accessArgs("admin"))).toBe(true);
    }
  });
});
