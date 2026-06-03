import { describe, expect, it } from "vitest";

import { Events } from "./Events";
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
      read?: (args: AccessArgs) => boolean;
    };
  };
}

describe("commerce collection access contracts", () => {
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
