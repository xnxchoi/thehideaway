import { describe, expect, it } from "vitest";

import { Subscriptions } from ".";

type AccessArgs = {
  req: {
    user?: {
      id: string;
      role: string;
    } | null;
  };
};

function accessArgs(role: string | null): AccessArgs {
  return {
    req: {
      user: role ? { id: "user-id", role } : null
    }
  };
}

function namedField(name: string) {
  const field = Subscriptions.fields.find((candidate) => {
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
      update?: (args: AccessArgs) => boolean;
    };
  };
}

describe("subscription access contracts", () => {
  it("does not let users update subscriptions through the generic collection endpoint", () => {
    const update = Subscriptions.access?.update as
      | ((args: AccessArgs) => boolean)
      | undefined;

    expect(update?.(accessArgs("user"))).toBe(false);
    expect(update?.(accessArgs("editor"))).toBe(true);
    expect(update?.(accessArgs("admin"))).toBe(true);
  });

  it("does not let users mutate subscription ownership or selected offer", () => {
    for (const fieldName of ["user", "plan", "price"]) {
      const update = namedField(fieldName).access?.update;

      expect(update?.(accessArgs("user"))).toBe(false);
      expect(update?.(accessArgs("admin"))).toBe(true);
    }
  });

  it("does not let users mutate subscription money snapshots", () => {
    for (const fieldName of [
      "amount",
      "currency",
      "validity_waived",
      "last_waiver_check"
    ]) {
      const update = namedField(fieldName).access?.update;

      expect(update?.(accessArgs("user"))).toBe(false);
      expect(update?.(accessArgs("editor"))).toBe(false);
      expect(update?.(accessArgs("admin"))).toBe(true);
    }
  });

  it("does not let users or editors mutate checkout request snapshots", () => {
    for (const fieldName of ["request_method", "request_note"]) {
      const update = namedField(fieldName).access?.update;

      expect(update?.(accessArgs("user"))).toBe(false);
      expect(update?.(accessArgs("editor"))).toBe(false);
      expect(update?.(accessArgs("admin"))).toBe(true);
    }
  });
});
