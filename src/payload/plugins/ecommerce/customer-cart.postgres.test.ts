import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createLocalReq } from "payload";
import {
  createCheckoutFixture,
  type CheckoutFixture
} from "./checkout-postgres.fixtures";
import { authorizeCartOwnershipRequest } from "./cart-ownership";

const databaseURI = process.env.ECOMMERCE_TEST_DATABASE_URI;

describe
  .skipIf(!databaseURI)
  .sequential("native customer cart discovery", () => {
    let fixture: CheckoutFixture;
    beforeAll(async () => {
      fixture = await createCheckoutFixture(databaseURI!);
    }, 120_000);
    afterAll(async () => {
      await fixture?.close();
    }, 30_000);

    async function accountCart(user: { id: string }) {
      return fixture.payload.create({
        collection: "carts",
        req: { user: { ...user, collection: "users" } as never },
        data: { customer: user.id, currency: "KRW", items: [] }
      });
    }

    const me = (userID: string) =>
      fixture.request(
        "/api/users/me?depth=0&select[id]=true&select[cart]=true",
        {},
        { method: "GET", userID }
      );

    it("restores the owner cart through the real me endpoint and standard cart read", async () => {
      const owner = await fixture.user();
      const cart = await accountCart(owner);
      const response = await me(owner.id);
      expect(response.status).toBe(200);
      expect(response.body.user.cart?.docs).toEqual([cart.id]);
      const standard = await fixture.request(
        "/api/users/me",
        {},
        {
          method: "GET",
          userID: owner.id
        }
      );
      expect(standard.body.user.cart?.docs[0].id).toBe(cart.id);
      expect(
        (
          await fixture.request(
            `/api/carts/${cart.id}`,
            {},
            {
              method: "GET",
              userID: owner.id
            }
          )
        ).status
      ).toBe(200);
    });

    it("omits purchased carts even when the client asks for them", async () => {
      const owner = await fixture.user();
      const cart = await accountCart(owner);
      const req = await createLocalReq({}, fixture.payload);
      authorizeCartOwnershipRequest(req);
      await fixture.payload.update({
        collection: "carts",
        id: cart.id,
        req,
        data: { purchasedAt: new Date().toISOString() }
      });
      const result = await fixture.request(
        "/api/users/me?depth=0&joins[cart][where][purchasedAt][exists]=true",
        {},
        { method: "GET", userID: owner.id }
      );
      expect(result.body.user.cart?.docs).toEqual([]);
    });

    it("chooses a stable latest active cart and ignores unrelated carts", async () => {
      const owner = await fixture.user();
      const older = await accountCart(owner);
      const newer = await accountCart(owner);
      await accountCart(await fixture.user());
      await fixture.cart();
      const expected = [older, newer].sort(
        (a, b) =>
          b.updatedAt.localeCompare(a.updatedAt) || b.id.localeCompare(a.id)
      )[0].id;
      for (let index = 0; index < 3; index += 1) {
        expect((await me(owner.id)).body.user.cart?.docs).toEqual([expected]);
      }
    });

    it("does not expose another customer's cart through user reads or guest discovery", async () => {
      const owner = await fixture.user();
      const other = await fixture.user();
      const cart = await accountCart(owner);
      const otherRead = await fixture.request(
        `/api/users/${owner.id}?depth=1`,
        {},
        {
          method: "GET",
          userID: other.id
        }
      );
      expect(otherRead.body.cart).toBeUndefined();
      expect(JSON.stringify(otherRead.body)).not.toContain(cart.id);
      const guestRead = await fixture.request(
        `/api/users/${owner.id}?depth=1`,
        {},
        { method: "GET" }
      );
      expect(guestRead.body.cart).toBeUndefined();
      expect(JSON.stringify(guestRead.body)).not.toContain(cart.id);
      expect(
        (await fixture.request("/api/users/me", {}, { method: "GET" })).body
          .user
      ).toBeNull();
      expect((await me(other.id)).body.user.cart?.docs).toEqual([]);
    });
  });
