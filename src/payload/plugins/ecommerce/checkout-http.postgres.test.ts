import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  assertCheckoutTestDatabase,
  createCheckoutFixture,
  type CheckoutFixture
} from "./checkout-postgres.fixtures";

const databaseURI = process.env.ECOMMERCE_TEST_DATABASE_URI;

describe("checkout database isolation", () => {
  it("rejects application databases and non-fixture hosts", () => {
    expect(() =>
      assertCheckoutTestDatabase("postgres://localhost:5432/theestate")
    ).toThrow("disposable");
    expect(() =>
      assertCheckoutTestDatabase(
        "postgres://remote:55439/ecommerce_checkout_test_a"
      )
    ).toThrow("loopback");
  });
});

describe
  .skipIf(!databaseURI)
  .sequential("registered checkout HTTP with PostgreSQL", () => {
    let fixture: CheckoutFixture;

    beforeAll(async () => {
      fixture = await createCheckoutFixture(databaseURI!);
    }, 120_000);

    afterAll(async () => {
      await fixture?.close();
    }, 30_000);

    it("rejects invalid physical destinations without persisting purchases or payment attempts", async () => {
      const cart = await fixture.cart();
      const valid = {
        country: "KR",
        firstName: "Fixture recipient",
        phone: "010 1234 5678",
        addressLine1: "서울시 중구 1",
        postalCode: "04524"
      };
      const ordersBefore = await fixture.payload.count({
        collection: "orders",
        overrideAccess: true
      });
      const providerCallsBefore = fixture.providerCalls.length;
      for (const [shippingAddress, code] of [
        [undefined, "shipping-address-required"],
        [null, "shipping-address-required"],
        [{}, "invalid-shipping-address"],
        [{ ...valid, phone: false }, "invalid-shipping-address"],
        [{ ...valid, firstName: " " }, "invalid-shipping-address"],
        [{ ...valid, addressLine1: "street\n" }, "invalid-shipping-address"],
        [{ ...valid, postalCode: "x".repeat(501) }, "invalid-shipping-address"],
        [{ ...valid, country: "US" }, "unsupported-shipping-country"]
      ]) {
        const result = await fixture.request("/api/payments/portone/initiate", {
          cartID: cart.id,
          secret: cart.secret,
          expectedAmount: 12000,
          expectedCurrency: "KRW",
          customerEmail: "guest@checkout.test",
          shippingAddress
        });
        expect(result).toEqual({ status: 400, body: { code, message: code } });
        expect(await fixture.attempts(cart.id)).toHaveLength(0);
      }
      expect(
        await fixture.payload.count({
          collection: "orders",
          overrideAccess: true
        })
      ).toEqual(ordersBefore);
      expect(fixture.providerCalls).toHaveLength(providerCallsBefore);
    });

    it("persists normalized KR shipping independently of a foreign billing address", async () => {
      const cart = await fixture.cart();
      const shippingAddress = {
        country: " KR ",
        firstName: "  김   서울  ",
        phone: " 010  1234 5678 ",
        addressLine1: " 서울시   중구 1 ",
        addressLine2: " 101동   202호 ",
        postalCode: " 04524 "
      };
      const billingAddress = {
        firstName: "Buyer",
        country: "US",
        postalCode: "90210"
      };
      const result = await fixture.request("/api/payments/portone/initiate", {
        cartID: cart.id,
        secret: cart.secret,
        expectedAmount: 12000,
        expectedCurrency: "KRW",
        customerEmail: "guest@checkout.test",
        shippingAddress,
        billingAddress
      });
      expect(result.status).toBe(200);
      const [attempt] = await fixture.attempts(cart.id);
      const order = await fixture.orderFor(attempt);
      const expected = {
        fulfillmentKind: "physical",
        shippingAddress: {
          country: "KR",
          firstName: "김 서울",
          phone: "010 1234 5678",
          addressLine1: "서울시 중구 1",
          addressLine2: "101동 202호",
          postalCode: "04524"
        },
        billingAddress,
        shippingAmount: null,
        taxAmount: null
      };
      expect(attempt.checkout_snapshot).toMatchObject(expected);
      expect(order.checkout_snapshot).toMatchObject(expected);
      expect(shippingAddress.country).toBe(" KR ");
    });

    it("creates a real guest cart and one reusable unpaid purchase under concurrent initiation", async () => {
      const cart = await fixture.cart();
      const results = await Promise.all(
        Array.from({ length: 8 }, () => fixture.initiate(cart))
      );
      expect(results.map(({ status }) => status)).toEqual(Array(8).fill(200));
      const paymentIDs = new Set(results.map(({ body }) => body.paymentId));
      expect(paymentIDs.size).toBe(1);
      const attempts = await fixture.attempts(cart.id);
      expect(attempts).toHaveLength(1);
      const order = await fixture.orderFor(attempts[0]);
      expect(order.status).toBe("pending");
      expect(order.payment_status).not.toBe("paid");
      expect(order.fulfillment_status).toBe("unfulfilled");
      expect(fixture.providerCalls).toHaveLength(0);
    });

    it("rejects the pinned variant validation bypass before creating an attempt", async () => {
      const cart = await fixture.cart();
      await fixture.updateProduct(cart.productID, { active: false });
      const result = await fixture.initiate(cart);
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(await fixture.attempts(cart.id)).toHaveLength(0);
    });

    it("rejects a foreign guest cart even when the selected payment already succeeded", async () => {
      const [owner, stranger] = await Promise.all([
        fixture.cart(),
        fixture.cart()
      ]);
      const initiated = await fixture.initiate(owner);
      expect(initiated.status).toBe(200);
      fixture.paid(initiated.body.paymentId, 12000);
      const paid = await fixture.confirm(owner, initiated.body);
      expect(paid.status).toBe(200);
      const before = fixture.providerCalls.length;
      const denied = await fixture.request(
        "/api/payments/portone/confirm-order",
        {
          cartID: stranger.id,
          secret: stranger.secret,
          paymentId: initiated.body.paymentId,
          customerEmail: "guest@checkout.test"
        }
      );
      expect(denied.status).toBeGreaterThanOrEqual(400);
      expect(denied.body).not.toHaveProperty("orderID");
      expect(denied.body).not.toHaveProperty("transactionID");
      expect(fixture.providerCalls).toHaveLength(before);
    });

    it("commits one paid outcome and preserves its snapshot under repeated confirmation", async () => {
      const cart = await fixture.cart();
      const initiated = await fixture.initiate(cart);
      expect(initiated.status).toBe(200);
      const [attempt] = await fixture.attempts(cart.id);
      const pending = await fixture.orderFor(attempt);
      await fixture.updateProduct(cart.productID, {
        name: `Edited ${cart.productID}`
      });
      fixture.paid(initiated.body.paymentId, 12000);
      const results = await Promise.all(
        Array.from({ length: 8 }, () => fixture.confirm(cart, initiated.body))
      );
      expect(results.map(({ status }) => status)).toEqual(Array(8).fill(200));
      expect(new Set(results.map(({ body }) => body.orderID)).size).toBe(1);
      const settled = await fixture.orderFor(
        (await fixture.attempts(cart.id))[0]
      );
      expect(settled.id).toBe(pending.id);
      expect(settled.payment_status).toBe("paid");
      expect(settled.fulfillment_status).toBe("unfulfilled");
      expect(settled.checkout_snapshot).toEqual(pending.checkout_snapshot);
      expect(await fixture.attempts(cart.id)).toHaveLength(1);
    });

    it("uses the purchase capability after losing the original cart session", async () => {
      const cart = await fixture.cart();
      const initiated = await fixture.initiate(cart);
      expect(initiated.status).toBe(200);
      expect(initiated.body.purchaseAccessToken).toEqual(expect.any(String));
      fixture.paid(initiated.body.paymentId, 12000);
      const result = await fixture.request(
        "/api/payments/portone/confirm-order",
        {
          paymentId: initiated.body.paymentId,
          purchaseAccessToken: initiated.body.purchaseAccessToken
        }
      );
      expect(result.status).toBe(200);
      const denied = await fixture.request(
        "/api/payments/portone/confirm-order",
        {
          paymentId: initiated.body.paymentId,
          purchaseAccessToken: "invalid-capability",
          trusted: true,
          webhook: true
        }
      );
      expect(denied.status).toBeGreaterThanOrEqual(400);
      expect(denied.body).not.toHaveProperty("orderID");
    });

    it("settles a signed webhook and browser confirmation racing beyond the provider barrier once", async () => {
      const cart = await fixture.cart();
      const initiated = await fixture.initiate(cart);
      expect(initiated.status).toBe(200);
      fixture.paid(initiated.body.paymentId, 12000);
      const eventID = `race-${initiated.body.paymentId}`;
      const barrier = fixture.providerBarrier(initiated.body.paymentId, 2);
      const browser = fixture.confirm(cart, initiated.body);
      const webhook = fixture.webhook(initiated.body.paymentId, eventID);
      try {
        // If a provider call held the purchase lock, both contenders could not
        // reach this barrier. The timeout makes that regression fail visibly.
        await barrier.reached;
      } finally {
        barrier.release();
      }
      const responses = await Promise.all([browser, webhook]);
      expect(responses.map((response) => response.status)).toEqual([200, 200]);
      expect(
        new Set(responses.map((response) => response.body.orderID)).size
      ).toBe(1);
      const attempts = await fixture.attempts(cart.id);
      expect(attempts).toHaveLength(1);
      expect(attempts[0].status).toBe("succeeded");
      const order = await fixture.orderFor(attempts[0]);
      expect(order.settlement_transaction).toBe(attempts[0].id);
      expect(order.settlement_effects).toEqual({
        payment_receipt: {
          key: `purchase:${order.id}:payment-receipt`,
          status: "pending"
        }
      });
      expect(order.fulfillment_status).toBe("unfulfilled");
      expect(await fixture.providerEvent(eventID)).toMatchObject({
        processing_status: "processed",
        attempt_count: 1
      });
      const callsBeforeDuplicate = fixture.providerCalls.length;
      expect(
        (await fixture.webhook(initiated.body.paymentId, eventID)).status
      ).toBe(200);
      expect(fixture.providerCalls.length).toBe(callsBeforeDuplicate);
    });

    it("rolls back a post-write fault and retries the same received webhook to completion", async () => {
      const cart = await fixture.cart();
      const initiated = await fixture.initiate(cart);
      expect(initiated.status).toBe(200);
      const [pendingAttempt] = await fixture.attempts(cart.id);
      const pendingOrder = await fixture.orderFor(pendingAttempt);
      fixture.paid(initiated.body.paymentId, 12000);
      fixture.failAfterPaidOrderWrite(pendingOrder.id);
      const eventID = `fault-${initiated.body.paymentId}`;
      expect(
        (await fixture.webhook(initiated.body.paymentId, eventID)).status
      ).toBe(500);
      const [rolledBackAttempt] = await fixture.attempts(cart.id);
      const rolledBackOrder = await fixture.orderFor(rolledBackAttempt);
      expect(rolledBackAttempt.status).toBe("pending");
      expect(rolledBackOrder.payment_status).toBe("pending");
      expect(rolledBackOrder.settlement_transaction).toBeNull();
      expect(rolledBackOrder.settlement_effects).toBeNull();
      expect(await fixture.providerEvent(eventID)).toMatchObject({
        processing_status: "retryable",
        attempt_count: 1
      });
      expect(
        (await fixture.webhook(initiated.body.paymentId, eventID)).status
      ).toBe(200);
      expect(await fixture.providerEvent(eventID)).toMatchObject({
        processing_status: "processed",
        attempt_count: 2
      });
      const order = await fixture.orderFor(
        (await fixture.attempts(cart.id))[0]
      );
      expect(order.id).toBe(pendingOrder.id);
      expect(order.payment_status).toBe("paid");
      expect(order.settlement_effects).toEqual({
        payment_receipt: {
          key: `purchase:${order.id}:payment-receipt`,
          status: "pending"
        }
      });
      const callsBeforeReplay = fixture.providerCalls.length;
      expect(
        (await fixture.webhook(initiated.body.paymentId, eventID)).status
      ).toBe(200);
      expect(fixture.providerCalls.length).toBe(callsBeforeReplay);
    });

    it("returns a retryable response for a concurrently leased duplicate webhook", async () => {
      const cart = await fixture.cart();
      const initiated = await fixture.initiate(cart);
      expect(initiated.status).toBe(200);
      fixture.paid(initiated.body.paymentId, 12000);
      const eventID = `leased-${initiated.body.paymentId}`;
      const barrier = fixture.providerBarrier(initiated.body.paymentId, 1);
      const first = fixture.webhook(initiated.body.paymentId, eventID);
      try {
        await barrier.reached;
        expect(
          (await fixture.webhook(initiated.body.paymentId, eventID)).status
        ).toBe(503);
        expect(await fixture.providerEvent(eventID)).toMatchObject({
          processing_status: "processing",
          attempt_count: 1
        });
      } finally {
        barrier.release();
      }
      expect((await first).status).toBe(200);
      expect(
        (await fixture.webhook(initiated.body.paymentId, eventID)).status
      ).toBe(200);
      expect(await fixture.providerEvent(eventID)).toMatchObject({
        processing_status: "processed",
        attempt_count: 1
      });
    });

    it.each(["FAILED", "CANCELLED"] as const)(
      "retries a verified %s attempt on one purchase and reconciles a late excess capture",
      async (terminalStatus) => {
        const cart = await fixture.cart();
        const first = await fixture.initiate(cart);
        expect(first.status).toBe(200);
        fixture.terminal(first.body.paymentId, terminalStatus);
        const eventID = `terminal-${first.body.paymentId}`;
        const terminal = await fixture.webhook(first.body.paymentId, eventID, {
          type: `Transaction.${terminalStatus}`
        });
        expect(terminal.status).toBe(200);
        expect(terminal.body.attemptStatus).toBe(terminalStatus.toLowerCase());
        expect(
          (await fixture.confirm(cart, first.body)).body.reconciliationRequired
        ).not.toBe(true);
        const second = await fixture.initiate(cart, { retryPayment: true });
        expect(second.status).toBe(200);
        expect(second.body.paymentId).not.toBe(first.body.paymentId);
        expect(second.body.orderID).toBe(first.body.orderID);
        fixture.paid(second.body.paymentId, 12000);
        expect((await fixture.confirm(cart, second.body)).status).toBe(200);
        // An old zero-paid failure remains harmless after the newer attempt settles.
        expect(
          (await fixture.confirm(cart, first.body)).body.reconciliationRequired
        ).not.toBe(true);
        const attempts = await fixture.attempts(cart.id);
        expect(attempts).toHaveLength(2);
        const paidOrder = await fixture.orderFor(attempts[0]);
        const intent = paidOrder.settlement_effects;
        fixture.paid(first.body.paymentId, 12000);
        const excess = await fixture.webhook(
          first.body.paymentId,
          `excess-${first.body.paymentId}`
        );
        expect(excess.status).toBe(200);
        expect(excess.body.reconciliationRequired).toBe(true);
        const reconciled = await fixture.orderFor(
          (await fixture.attempts(cart.id))[0]
        );
        expect(reconciled.payment_status).toBe("paid");
        expect(reconciled.settlement_transaction).toBe(
          paidOrder.settlement_transaction
        );
        expect(reconciled.settlement_effects).toEqual(intent);
        expect(reconciled.reconciliation_required).toBe(true);
      }
    );

    it("preserves a retryable event through provider loss and rejects incomplete paid evidence", async () => {
      const cart = await fixture.cart();
      const initiated = await fixture.initiate(cart);
      expect(initiated.status).toBe(200);
      const eventID = `unavailable-${initiated.body.paymentId}`;
      fixture.disconnectProvider(initiated.body.paymentId);
      expect(
        (await fixture.webhook(initiated.body.paymentId, eventID)).status
      ).toBe(500);
      expect(await fixture.providerEvent(eventID)).toMatchObject({
        processing_status: "retryable"
      });
      expect((await fixture.attempts(cart.id))[0].status).toBe("pending");
      fixture.paid(initiated.body.paymentId, 12000);
      const recovered = await fixture.webhook(
        initiated.body.paymentId,
        eventID
      );
      expect(recovered.status).toBe(200);
      expect(recovered.body.paymentStatus).toBe("paid");
      expect(await fixture.providerEvent(eventID)).toMatchObject({
        processing_status: "processed",
        attempt_count: 2
      });
      const incompleteCart = await fixture.cart();
      const incompleteInitiation = await fixture.initiate(incompleteCart);
      expect(incompleteInitiation.status).toBe(200);
      fixture.payment(incompleteInitiation.body.paymentId, {
        id: incompleteInitiation.body.paymentId,
        storeId: "store-fixture",
        status: "PAID",
        amount: { total: 12000 },
        currency: "KRW",
        channel: { key: "channel-fixture", type: "TEST" }
      });
      const incomplete = await fixture.webhook(
        incompleteInitiation.body.paymentId,
        `incomplete-${incompleteInitiation.body.paymentId}`
      );
      expect(incomplete.status).toBe(200);
      expect(incomplete.body.reconciliationRequired).toBe(true);
      const [attempt] = await fixture.attempts(incompleteCart.id);
      expect(attempt.status).toBe("pending");
      expect(attempt.provider_outcome).toMatchObject({ reason: "malformed" });
      expect((await fixture.orderFor(attempt)).payment_status).toBe("pending");
    });

    it("rejects invalid signatures before event persistence or provider calls", async () => {
      const cart = await fixture.cart();
      const initiated = await fixture.initiate(cart);
      const eventID = `invalid-${initiated.body.paymentId}`;
      const calls = fixture.providerCalls.length;
      expect(
        (
          await fixture.webhook(initiated.body.paymentId, eventID, {
            invalidSignature: true
          })
        ).status
      ).toBe(400);
      expect(await fixture.providerEvent(eventID)).toBeUndefined();
      expect(fixture.providerCalls.length).toBe(calls);
    });

    it("enforces account purchase ownership under synthetic identity injection", async () => {
      const [cart, owner, other] = await Promise.all([
        fixture.cart(),
        fixture.user(),
        fixture.user()
      ]);
      const initiated = await fixture.initiate(cart, { userID: owner.id });
      expect(initiated.status).toBe(200);
      expect(initiated.body.purchaseAccessToken).toBeUndefined();
      const calls = fixture.providerCalls.length;
      const forbiddenReplay = await fixture.initiate(cart, {
        userID: other.id
      });
      expect(forbiddenReplay.status).toBeGreaterThanOrEqual(400);
      expect(forbiddenReplay.body).not.toHaveProperty("paymentId");
      fixture.paid(initiated.body.paymentId, 12000);
      const denied = await fixture.confirm(cart, initiated.body, {
        userID: other.id
      });
      expect(denied.status).toBe(403);
      expect(denied.body).not.toHaveProperty("orderID");
      expect(fixture.providerCalls.length).toBe(calls);
      expect(
        (await fixture.confirm(cart, initiated.body, { userID: owner.id }))
          .status
      ).toBe(200);
      const deniedPaid = await fixture.confirm(cart, initiated.body, {
        userID: other.id
      });
      expect(deniedPaid.status).toBe(403);
      expect(deniedPaid.body).not.toHaveProperty("transactionID");
    });
  });
