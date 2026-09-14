import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createCheckoutFixture,
  type CheckoutFixture
} from "./checkout-postgres.fixtures";
import { authorizeCartOwnershipRequest } from "./cart-ownership";
import { createLocalReq } from "payload";

const databaseURI = process.env.ECOMMERCE_TEST_DATABASE_URI;

describe.skipIf(!databaseURI).sequential("durable native cart merge", () => {
  let fixture: CheckoutFixture;
  beforeAll(async () => {
    fixture = await createCheckoutFixture(databaseURI!);
  }, 120_000);
  afterAll(async () => {
    await fixture?.close();
  }, 30_000);

  async function setup() {
    const source = await fixture.cart();
    const user = await fixture.user();
    const target = await fixture.payload.create({
      collection: "carts",
      overrideAccess: true,
      req: { user: { ...user, collection: "users" } as never },
      data: { customer: user.id, currency: "KRW", items: [] }
    });
    const merge = (secret = source.secret, userID = user.id) =>
      fixture.request(
        `/api/carts/${target.id}/merge`,
        { sourceCartID: source.id, sourceSecret: secret },
        { userID }
      );
    return { source, user, target, merge };
  }

  it("replays an acknowledged or response-lost merge without duplicating quantities", async () => {
    const { source, target, merge } = await setup();
    expect((await merge()).status).toBe(200);
    expect((await merge()).status).toBe(200);
    const cart = await fixture.payload.findByID({
      collection: "carts",
      id: target.id,
      depth: 0
    });
    expect(cart.items).toHaveLength(1);
    expect(cart.items?.[0].quantity).toBe(1);
    expect(
      await fixture.payload.count({
        collection: "carts",
        where: { id: { equals: source.id } }
      })
    ).toMatchObject({ totalDocs: 0 });
  });

  it("serializes competing merges and permits safe retry after an in-progress response", async () => {
    const { target, merge } = await setup();
    const responses = await Promise.all(
      Array.from({ length: 8 }, () => merge())
    );
    expect(responses.some((r) => r.status === 200)).toBe(true);
    expect(responses.every((r) => [200, 409].includes(r.status))).toBe(true);
    expect((await merge()).status).toBe(200);
    const cart = await fixture.payload.findByID({
      collection: "carts",
      id: target.id,
      depth: 0
    });
    expect(cart.items?.[0].quantity).toBe(1);
  });

  it("requires the original owner and secret even when replaying", async () => {
    const { merge } = await setup();
    expect((await merge()).status).toBe(200);
    expect((await merge("0".repeat(40))).status).toBe(404);
    expect((await merge(undefined, (await fixture.user()).id)).status).toBe(
      404
    );
  });

  it("keeps every concurrent item increment when a guest merge races account-cart edits", async () => {
    const { source, target, user, merge } = await setup();
    const original = await fixture.payload.findByID({
      collection: "carts",
      id: source.id,
      depth: 0
    });
    const item = original.items![0];
    const responses = await Promise.all([
      merge(),
      ...Array.from({ length: 8 }, () =>
        fixture.request(
          `/api/carts/${target.id}/add-item`,
          {
            item: { product: item.product, variant: item.variant },
            quantity: 1
          },
          { userID: user.id }
        )
      )
    ]);
    expect(
      responses.map((r) => ({
        status: r.status,
        body: r.status === 200 ? null : r.body
      }))
    ).toEqual(Array(9).fill({ status: 200, body: null }));
    const current = await fixture.payload.findByID({
      collection: "carts",
      id: target.id,
      depth: 0
    });
    expect(current.items).toHaveLength(1);
    expect(current.items?.[0].quantity).toBe(9);
  });

  it("transfers a guest cart once and invalidates its old secret", async () => {
    const source = await fixture.cart();
    const user = await fixture.user();
    const claim = () =>
      fixture.request(
        `/api/carts/${source.id}/merge`,
        {
          sourceCartID: source.id,
          sourceSecret: source.secret
        },
        { userID: user.id }
      );
    expect((await claim()).status).toBe(200);
    expect((await claim()).status).toBe(200);
    const cart = await fixture.payload.findByID({
      collection: "carts",
      id: source.id,
      depth: 0,
      showHiddenFields: true
    });
    expect(cart.customer).toBe(user.id);
    expect(cart.secret).toBeFalsy();
    expect(cart.items?.[0].quantity).toBe(1);
  });

  it("rolls back a swallowed source-delete failure and permits another valid account to recover", async () => {
    const { source, target, merge } = await setup();
    fixture.failCartDelete(source.id);
    expect((await merge()).status).toBe(500);
    const unchanged = await fixture.payload.findByID({
      collection: "carts",
      id: target.id,
      depth: 0
    });
    expect(unchanged.items ?? []).toHaveLength(0);
    const guest = await fixture.payload.findByID({
      collection: "carts",
      id: source.id,
      depth: 0
    });
    expect(guest.items?.[0].quantity).toBe(1);
    const nextUser = await fixture.user();
    const recovered = await fixture.request(
      `/api/carts/${source.id}/merge`,
      {
        sourceCartID: source.id,
        sourceSecret: source.secret
      },
      { userID: nextUser.id }
    );
    expect(recovered.status).toBe(200);
    const claimed = await fixture.payload.findByID({
      collection: "carts",
      id: source.id,
      depth: 0
    });
    expect(claimed.customer).toBe(nextUser.id);
    expect(claimed.items?.[0].quantity).toBe(1);
  });

  it("rejects cross-origin and self merge without authentication", async () => {
    const { source, target, user } = await setup();
    const body = { sourceCartID: source.id, sourceSecret: source.secret };
    expect(
      (
        await fixture.request(`/api/carts/${target.id}/merge`, body, {
          userID: user.id,
          headers: { origin: "https://untrusted.invalid" }
        })
      ).status
    ).toBe(403);
    expect(
      (await fixture.request(`/api/carts/${source.id}/merge`, body)).status
    ).toBe(401);
  });

  it("denies generic ownership spoofing, legacy owned-cart secrets and paid cart deletion", async () => {
    const { source, user, target } = await setup();
    const path = `/api/carts/${source.id}?secret=${source.secret}`;
    expect(
      (await fixture.request(path, { customer: user.id }, { method: "PATCH" }))
        .status
    ).toBe(403);
    expect(
      (
        await fixture.request(
          `/api/carts/${target.id}`,
          { purchasedAt: new Date().toISOString() },
          { method: "PATCH", userID: user.id }
        )
      ).status
    ).toBe(403);
    const trusted = await createLocalReq({}, fixture.payload);
    authorizeCartOwnershipRequest(trusted);
    await fixture.payload.update({
      collection: "carts",
      id: source.id,
      overrideAccess: true,
      req: trusted,
      data: { customer: user.id }
    });
    expect(
      (await fixture.request(path, {}, { method: "GET" })).status
    ).toBeGreaterThanOrEqual(400);
    expect(
      (await fixture.request(path, {}, { method: "DELETE" })).status
    ).toBeGreaterThanOrEqual(400);
    await fixture.payload.update({
      collection: "carts",
      id: target.id,
      overrideAccess: true,
      req: trusted,
      data: { purchasedAt: new Date().toISOString() }
    });
    expect(
      (
        await fixture.request(
          `/api/carts/${target.id}`,
          {},
          { method: "DELETE", userID: user.id }
        )
      ).status
    ).toBeGreaterThanOrEqual(400);
    expect(
      (await fixture.payload.findByID({ collection: "carts", id: target.id }))
        .id
    ).toBe(target.id);
  });

  it("rejects fractional, negative and overflowing quantities through registered cart endpoints", async () => {
    const { source, target, user } = await setup();
    const cart = await fixture.payload.findByID({
      collection: "carts",
      id: source.id,
      depth: 0
    });
    const item = cart.items![0];
    for (const quantity of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, "2"]) {
      const result = await fixture.request(
        `/api/carts/${target.id}/add-item`,
        { item: { product: item.product, variant: item.variant }, quantity },
        { userID: user.id }
      );
      expect(result.status).toBe(400);
    }
    const unchanged = await fixture.payload.findByID({
      collection: "carts",
      id: target.id,
      depth: 0
    });
    expect(unchanged.items ?? []).toHaveLength(0);
  });
});
