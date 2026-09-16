import { describe, expect, it } from "vitest";
import { customerCartField } from "./customer-cart-field";

describe("private customer cart discovery field", () => {
  it.each([
    ["owner", { id: "alice", collection: "users" }, { id: "alice" }, true],
    [
      "other customer",
      { id: "bob", collection: "users" },
      { id: "alice" },
      false
    ],
    ["guest", null, { id: "alice" }, false],
    [
      "different auth collection",
      { id: "alice", collection: "admins" },
      { id: "alice" },
      false
    ],
    [
      "missing document",
      { id: "alice", collection: "users" },
      undefined,
      false
    ],
    [
      "staff reading another user",
      { id: "staff", collection: "users", role: "admin" },
      { id: "alice" },
      false
    ]
  ])("limits %s access", (_name, user, doc, permitted) => {
    expect(
      customerCartField.access!.read!({ req: { user }, doc } as never)
    ).toBe(permitted);
  });
});
