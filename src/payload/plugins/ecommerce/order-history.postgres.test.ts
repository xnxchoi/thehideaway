import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createLocalReq } from "payload";
import {
  createCheckoutFixture,
  type CheckoutFixture
} from "./checkout-postgres.fixtures";
import { getCustomerOrder, listCustomerOrders } from "./order-history";
import { authorizePluginOrderWrite } from "./order-lifecycle";

const databaseURI = process.env.ECOMMERCE_TEST_DATABASE_URI;

describe
  .skipIf(!databaseURI)
  .sequential("customer history against plugin PostgreSQL orders", () => {
    let fixture: CheckoutFixture;
    beforeAll(async () => {
      fixture = await createCheckoutFixture(databaseURI!);
    }, 120_000);
    afterAll(async () => {
      await fixture?.close();
    }, 30_000);

    it("paginates only the Better Auth customer's actual plugin purchases with stable repeated reads", async () => {
      const alice = await fixture.user();
      const bob = await fixture.user();
      const cart = await fixture.cart();
      const purchase = await fixture.initiate(cart, { userID: alice.id });
      expect(purchase.status).toBe(200);
      const source = await fixture.orderFor(
        (await fixture.attempts(cart.id))[0]
      );
      // Populate history through the guarded server path; repeated browser
      // checkout calls would test the production limiter rather than pagination.
      for (let index = 0; index < 20; index++) {
        const req = await createLocalReq({}, fixture.payload);
        authorizePluginOrderWrite(req);
        await fixture.payload.create({
          collection: "orders",
          overrideAccess: true,
          req,
          data: {
            order_ref: `${String(source.order_ref)}-history-${index}`,
            customer: alice.id,
            customerEmail: source.customerEmail,
            checkout_snapshot: source.checkout_snapshot,
            checkout_fingerprint: source.checkout_fingerprint,
            order_mode: source.order_mode,
            amount: source.amount,
            currency: source.currency,
            items: (source.items as Record<string, unknown>[]).map(
              ({ id: _id, ...item }) => item
            ),
            status: "pending",
            lifecycle_status: "pending_payment",
            payment_status: "pending",
            fulfillment_status: "unfulfilled"
          } as never
        });
      }
      expect(
        (await fixture.initiate(await fixture.cart(), { userID: bob.id }))
          .status
      ).toBe(200);
      const first = await listCustomerOrders(fixture.payload, alice.id);
      const second = await listCustomerOrders(fixture.payload, alice.id, "2");
      expect(first.orders).toHaveLength(20);
      expect(first.totalDocs).toBe(21);
      expect(first.hasNextPage).toBe(true);
      expect(second.orders).toHaveLength(1);
      expect(
        new Set(
          [...first.orders, ...second.orders].map((order) => order.orderRef)
        ).size
      ).toBe(21);
      expect(await listCustomerOrders(fixture.payload, alice.id)).toEqual(
        first
      );
      expect(
        await getCustomerOrder(fixture.payload, {
          orderRef: first.orders[0].orderRef,
          customerID: bob.id
        })
      ).toBeNull();
      expect(fixture.providerCalls).toHaveLength(0);
    }, 120_000);

    it("preserves the stored purchase when catalog changes and restricts guest capability to one order", async () => {
      const cart = await fixture.cart();
      const purchase = await fixture.initiate(cart);
      expect(purchase.status).toBe(200);
      const orderRef = purchase.body.order_ref as string;
      const purchaseAccessToken = purchase.body.purchaseAccessToken as string;
      const before = await getCustomerOrder(fixture.payload, {
        orderRef,
        purchaseAccessToken
      });
      expect(before).not.toBeNull();
      await fixture.updateProduct(cart.productID, {
        name: `Changed catalog ${cart.productID}`,
        priceInKRW: 99999
      });
      expect(
        await getCustomerOrder(fixture.payload, {
          orderRef,
          purchaseAccessToken
        })
      ).toEqual(before);
      expect(
        await getCustomerOrder(fixture.payload, {
          orderRef,
          purchaseAccessToken: "wrong"
        })
      ).toBeNull();
      const other = await fixture.initiate(await fixture.cart());
      expect(
        await getCustomerOrder(fixture.payload, {
          orderRef: other.body.order_ref as string,
          purchaseAccessToken
        })
      ).toBeNull();
      expect(JSON.stringify(before)).not.toMatch(
        /guest_access_digest|checkout_fingerprint|provider_expectation/
      );
      expect(fixture.providerCalls).toHaveLength(0);
    });
  });
