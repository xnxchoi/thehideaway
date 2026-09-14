import { describe, expect, it } from "vitest";
import {
  authorizeCartOwnershipRequest,
  protectCartOwnership,
  restrictCartAccess
} from "./cart-ownership";

const request = (id?: string) => ({
  user: id ? { id, collection: "users", role: "user" } : null,
  context: {},
  query: {}
});
const protect = (req: object, data: object, originalDoc?: object) =>
  protectCartOwnership({
    req,
    data,
    originalDoc,
    operation: originalDoc ? "update" : "create"
  } as never);

describe("cart ownership boundaries", () => {
  it("rejects guest ownership assignment and authenticated ownership spoofing", async () => {
    await expect(protect(request(), { customer: "victim" })).rejects.toThrow(
      "cart-owner-forbidden"
    );
    await expect(
      protect(request("alice"), { customer: "bob" })
    ).rejects.toThrow("cart-owner-forbidden");
    expect(await protect(request("alice"), { currency: "KRW" })).toEqual({
      customer: "alice",
      currency: "KRW"
    });
  });
  it("rejects generic owner changes, secret writes and purchasedAt fabrication", async () => {
    for (const data of [
      { customer: "alice" },
      { secret: null },
      { purchasedAt: new Date().toISOString() }
    ]) {
      await expect(
        protect(request("alice"), data, {
          customer: null,
          secret: "proof",
          purchasedAt: null
        })
      ).rejects.toThrow();
    }
    await expect(
      protect(request(), { purchasedAt: new Date().toISOString() })
    ).rejects.toThrow("cart-lifecycle-forbidden");
  });
  it("accepts ordinary item edits but freezes purchased carts", async () => {
    expect(
      await protect(request("alice"), { items: [] }, { customer: "alice" })
    ).toEqual({ items: [] });
    await expect(
      protect(
        request("alice"),
        { items: [] },
        { customer: "alice", purchasedAt: "2026-09-14" }
      )
    ).rejects.toThrow("cart-purchased");
  });
  it("requires an unforgeable exact-request authorization for internal ownership changes", async () => {
    const req = request("alice");
    const data = { customer: "alice", secret: null };
    await expect(
      protect({ ...req, context: { authorizedCartOwnership: true } }, data, {
        customer: null,
        secret: "proof"
      })
    ).rejects.toThrow();
    authorizeCartOwnershipRequest(req);
    expect(
      await protect(req, data, { customer: null, secret: "proof" })
    ).toEqual(data);
    await expect(
      protect({ ...req }, data, { customer: null, secret: "proof" })
    ).rejects.toThrow();
  });
  it("restricts secret-based access to unowned carts even when vendor grants access", async () => {
    const req = { ...request(), query: { secret: "proof" } };
    const access = restrictCartAccess(() => true);
    expect(await access({ req } as never)).toEqual({
      and: [{ customer: { exists: false } }, { secret: { equals: "proof" } }]
    });
    expect(await access({ req: request() } as never)).toBe(false);
    expect(await access({ req: request("alice") } as never)).toEqual({
      customer: { equals: "alice" }
    });
  });
  it("does not weaken an existing access denial or filter", async () => {
    expect(
      await restrictCartAccess(() => false)({ req: request("alice") } as never)
    ).toBe(false);
    const filter = { currency: { equals: "KRW" } };
    expect(
      await restrictCartAccess(() => filter)({ req: request("alice") } as never)
    ).toEqual({ and: [filter, { customer: { equals: "alice" } }] });
  });

  it("denies generic mutations of purchased carts including deletion", async () => {
    const access = restrictCartAccess(() => true, { writable: true });
    expect(await access({ req: request("alice") } as never)).toEqual({
      and: [
        { customer: { equals: "alice" } },
        { purchasedAt: { exists: false } }
      ]
    });
    expect(
      await access({
        req: {
          ...request("admin"),
          user: { id: "admin", role: "admin", collection: "users" }
        }
      } as never)
    ).toEqual({ purchasedAt: { exists: false } });
  });
});
