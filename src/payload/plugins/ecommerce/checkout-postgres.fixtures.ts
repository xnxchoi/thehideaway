import { createHmac, randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import path from "node:path";
import type { CollectionConfig, Payload } from "payload";
import { customerCartField } from "./customer-cart-field";

type Row = Record<string, unknown> & { id: string };
type JSONResult = { status: number; body: Record<string, any> };
type Cart = { id: string; secret: string; productID: string };
type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  userID?: string;
  headers?: Record<string, string>;
  rawBody?: string;
};
type ProviderBarrier = {
  arrivals: number;
  expected: number;
  reached: () => void;
  gate: Promise<void>;
};

export function assertCheckoutTestDatabase(uri: string): void {
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error("Invalid disposable fixture database URL");
  }
  if (
    !decodeURIComponent(parsed.pathname.slice(1)).startsWith(
      "ecommerce_checkout_test_"
    )
  ) {
    throw new Error(
      "Checkout tests require a disposable ecommerce_checkout_test_ database"
    );
  }
  if (parsed.hostname !== "127.0.0.1" || parsed.port !== "55439") {
    throw new Error(
      "Checkout tests require the isolated loopback PostgreSQL fixture"
    );
  }
}

async function listen(server: Server): Promise<string> {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("fixture-listen-failed");
  return `http://127.0.0.1:${address.port}`;
}

async function stop(server: Server): Promise<void> {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

export async function createCheckoutFixture(databaseURI: string) {
  assertCheckoutTestDatabase(databaseURI);
  const providerCalls: string[] = [];
  const payments = new Map<string, Record<string, unknown>>();
  const providerFailures = new Set<string>();
  const clientIPs = new Map<string, string>();
  const providerBarriers = new Map<string, ProviderBarrier>();
  const failedOrderWrites = new Set<string>();
  const failedCartDeletes = new Set<string>();
  const syntheticUsers = new Map<string, Row>();
  const webhookBytes = Buffer.from("isolated-checkout-webhook-fixture-key");
  const provider = createServer(async (req, res) => {
    const paymentId = decodeURIComponent(
      (req.url ?? "").split("/").at(-1) ?? ""
    );
    providerCalls.push(paymentId);
    if (providerFailures.has(paymentId)) {
      req.socket.destroy();
      return;
    }
    const barrier = providerBarriers.get(paymentId);
    if (barrier) {
      barrier.arrivals += 1;
      if (barrier.arrivals >= barrier.expected) barrier.reached();
      await barrier.gate;
    }
    const payment = payments.get(paymentId);
    res.writeHead(payment ? 200 : 404, { "content-type": "application/json" });
    res.end(JSON.stringify(payment ?? { type: "PAYMENT_NOT_FOUND" }));
  });
  const providerOrigin = await listen(provider);
  const fixtureEnv = {
    PORTONE_API_BASE: providerOrigin,
    PORTONE_API_SECRET: "fixture-api-secret-only",
    PORTONE_WEBHOOK_SECRET: `whsec_${webhookBytes.toString("base64")}`,
    PORTONE_STORE_ID: "store-fixture",
    PORTONE_CHANNEL_KEY: "channel-fixture",
    PORTONE_ENVIRONMENT: "sandbox",
    PORTONE_CARD_CHECKOUT_LIVE: "true",
    NEXT_PUBLIC_SERVER_URL: "http://localhost:3000"
  };
  const previousEnv = Object.fromEntries(
    Object.keys(fixtureEnv).map((key) => [key, process.env[key]])
  );
  Object.assign(process.env, fixtureEnv);
  let payload: Payload | undefined;
  try {
    const [
      { buildConfig, getPayload, handleEndpoints },
      { postgresAdapter },
      { hideawayEcommercePlugin }
    ] = await Promise.all([
      import("payload"),
      import("@payloadcms/db-postgres"),
      import("./plugin")
    ]);
    const { CheckoutProviderEvents } =
      await import("./provider-events-collection");
    const { CommerceCommands } =
      await import("../../collections/(consumption)/CommerceCommands");
    const ancillary: CollectionConfig[] = [
      CheckoutProviderEvents,
      CommerceCommands,
      {
        slug: "users",
        // Deliberately synthetic identity injection: tests endpoint ownership,
        // not Better Auth cookies, OAuth or account/cart merge behavior.
        auth: {
          disableLocalStrategy: true,
          strategies: [
            {
              name: "checkout-fixture-identity",
              authenticate: async ({ headers }) => {
                const user = syntheticUsers.get(
                  headers.get("x-fixture-user") ?? ""
                );
                return {
                  user: user ? { ...user, collection: "users" as const } : null
                } as never;
              }
            }
          ]
        },
        fields: [
          customerCartField,
          { name: "email", type: "email" },
          { name: "role", type: "text" }
        ]
      },
      ...["media", "product-drops", "product-category"].map(
        (slug): CollectionConfig => ({
          slug,
          fields: []
        })
      )
    ];
    const key = `checkout-http-${randomUUID()}`;
    const config = await buildConfig({
      secret: "isolated-checkout-http-fixture-secret-32-bytes",
      serverURL: fixtureEnv.NEXT_PUBLIC_SERVER_URL,
      cors: [fixtureEnv.NEXT_PUBLIC_SERVER_URL],
      csrf: [fixtureEnv.NEXT_PUBLIC_SERVER_URL],
      db: postgresAdapter({
        push: false,
        idType: "uuid",
        migrationDir: path.resolve("src/lib/migrations-baseline"),
        pool: { connectionString: databaseURI, max: 20 }
      }),
      collections: ancillary,
      plugins: [
        hideawayEcommercePlugin,
        (incoming) => ({
          ...incoming,
          collections: incoming.collections?.map((collection) =>
            collection.slug !== "carts"
              ? collection
              : {
                  ...collection,
                  hooks: {
                    ...collection.hooks,
                    beforeDelete: [
                      ...(collection.hooks?.beforeDelete ?? []),
                      ({ id }) => {
                        if (failedCartDeletes.delete(String(id)))
                          throw new Error("fixture-cart-delete-failed");
                      }
                    ]
                  }
                }
          )
        }),
        (incoming) => ({
          ...incoming,
          collections: incoming.collections?.map((collection) =>
            collection.slug !== "orders"
              ? collection
              : {
                  ...collection,
                  hooks: {
                    ...collection.hooks,
                    afterChange: [
                      ...(collection.hooks?.afterChange ?? []),
                      ({ doc, operation }) => {
                        // Throw after the actual paid row write so the production
                        // transaction boundary, not a mock, must roll all writes back.
                        if (
                          operation === "update" &&
                          doc.payment_status === "paid" &&
                          failedOrderWrites.delete(String(doc.id))
                        ) {
                          throw new Error(
                            "fixture-fault-after-paid-order-write"
                          );
                        }
                        return doc;
                      }
                    ]
                  }
                }
          )
        })
      ],
      typescript: { autoGenerate: false },
      graphQL: { disable: true },
      telemetry: false
    });
    payload = await getPayload({ config, key });
    // Vitest transforms TypeScript type imports; Payload's native dynamic import
    // otherwise uses Node's type stripper against historical mixed imports.
    const migrationModules = (
      import.meta as ImportMeta & {
        glob: (pattern: string) => Record<string, () => Promise<unknown>>;
      }
    ).glob("../../../lib/migrations-baseline/[0-9]*.ts");
    const migrations = await Promise.all(
      Object.entries(migrationModules)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(async ([file, load]) => ({
          ...((await load()) as {
            up: (args: unknown) => Promise<void>;
            down: (args: unknown) => Promise<void>;
          }),
          name: path.basename(file, ".ts")
        }))
    );
    await payload.db.migrate({ migrations });
    const instance = payload;
    const request = async (
      route: string,
      body: Record<string, unknown>,
      options: RequestOptions = {}
    ): Promise<JSONResult> => {
      // Separate synthetic buyers so unrelated scenarios do not share a rate
      // budget; requests for the same cart still exercise the real limiter.
      const client = String(body.cartID ?? body.paymentId ?? randomUUID());
      if (!clientIPs.has(client))
        clientIPs.set(client, `198.51.100.${clientIPs.size + 1}`);
      const response = await handleEndpoints({
        config,
        payloadInstanceCacheKey: key,
        request: new Request(`${fixtureEnv.NEXT_PUBLIC_SERVER_URL}${route}`, {
          method: options.method ?? "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": clientIPs.get(client)!,
            origin: fixtureEnv.NEXT_PUBLIC_SERVER_URL,
            ...(options.userID ? { "x-fixture-user": options.userID } : {}),
            ...options.headers
          },
          body:
            options.method === "GET" || options.method === "DELETE"
              ? undefined
              : (options.rawBody ?? JSON.stringify(body))
        })
      });
      return { status: response.status, body: await response.json() };
    };
    const create = async (
      collection: string,
      data: Record<string, unknown>
    ): Promise<Row> =>
      instance.create({
        collection,
        data,
        overrideAccess: true
      } as never) as unknown as Promise<Row>;

    return {
      payload: instance,
      providerCalls,
      request,
      providerBarrier(paymentId: string, expected: number) {
        let release!: () => void;
        let reached!: () => void;
        let rejectReached!: (error: Error) => void;
        const gate = new Promise<void>((resolve) => {
          release = resolve;
        });
        const allReached = new Promise<void>((resolve, reject) => {
          reached = resolve;
          rejectReached = reject;
        });
        const timer = setTimeout(
          () => rejectReached(new Error("provider-barrier-timeout")),
          5_000
        );
        providerBarriers.set(paymentId, {
          expected,
          arrivals: 0,
          gate,
          reached: () => {
            clearTimeout(timer);
            reached();
          }
        });
        return {
          reached: allReached,
          release() {
            clearTimeout(timer);
            providerBarriers.delete(paymentId);
            release();
          }
        };
      },
      failAfterPaidOrderWrite(orderID: string) {
        failedOrderWrites.add(orderID);
      },
      failCartDelete(cartID: string) {
        failedCartDeletes.add(cartID);
      },
      async user() {
        const user = await create("users", {
          email: `${randomUUID()}@checkout.test`,
          role: "user"
        });
        syntheticUsers.set(user.id, user);
        return user;
      },
      async webhook(
        paymentId: string,
        eventID = `evt-${randomUUID()}`,
        options: { invalidSignature?: boolean; type?: string } = {}
      ) {
        const event = {
          type: options.type ?? "Transaction.Paid",
          data: { paymentId }
        };
        const rawBody = JSON.stringify(event);
        const timestamp = String(Math.floor(Date.now() / 1000));
        const signature = createHmac("sha256", webhookBytes)
          .update(`${eventID}.${timestamp}.${rawBody}`)
          .digest("base64");
        return request("/api/payments/portone/webhooks", event, {
          rawBody,
          headers: {
            "webhook-id": eventID,
            "webhook-timestamp": timestamp,
            "webhook-signature": `v1,${options.invalidSignature ? "aW52YWxpZA==" : signature}`
          }
        });
      },
      async providerEvent(eventID: string): Promise<Row | undefined> {
        const events = await instance.find({
          collection: "commerce-provider-events",
          overrideAccess: true,
          depth: 0,
          limit: 1,
          where: { event_key: { equals: eventID } }
        });
        return events.docs[0] as unknown as Row | undefined;
      },
      payment(paymentId: string, data: Record<string, unknown>) {
        payments.set(paymentId, data);
      },
      disconnectProvider(paymentId: string) {
        providerFailures.add(paymentId);
      },
      paid(paymentId: string, amount: number) {
        providerFailures.delete(paymentId);
        payments.set(paymentId, {
          id: paymentId,
          paymentId,
          storeId: fixtureEnv.PORTONE_STORE_ID,
          status: "PAID",
          amount: { total: amount, paid: amount },
          currency: "KRW",
          channel: { key: fixtureEnv.PORTONE_CHANNEL_KEY, type: "TEST" },
          transactionId: `provider-${paymentId}`
        });
      },
      terminal(paymentId: string, status: "FAILED" | "CANCELLED") {
        payments.set(paymentId, {
          id: paymentId,
          storeId: fixtureEnv.PORTONE_STORE_ID,
          status,
          amount: { total: 12000, paid: 0 },
          currency: "KRW",
          channel: { key: fixtureEnv.PORTONE_CHANNEL_KEY, type: "TEST" },
          transactionId: `provider-${paymentId}`
        });
      },
      async cart(): Promise<Cart> {
        const suffix = randomUUID();
        const variantType = await create("variantTypes", {
          name: `type-${suffix}`,
          label: "Option"
        });
        const option = await create("variantOptions", {
          variantType: variantType.id,
          value: "standard",
          label: "Standard"
        });
        const product = await create("products", {
          name: `Fixture ${suffix}`,
          slug: `fixture-${suffix}`,
          storefront: "lostinseoul",
          active: true,
          _status: "published",
          enableVariants: true,
          variantTypes: [variantType.id],
          min_order_quantity: 1,
          max_order_quantity: 99,
          standard_enabled: true,
          priceInKRWEnabled: true,
          priceInKRW: 12000
        });
        const variant = await create("variants", {
          product: product.id,
          options: [option.id],
          title: "Standard",
          label: "Standard",
          sku: `FIXTURE-${suffix}`,
          active: true,
          _status: "published",
          priceInKRWEnabled: true,
          priceInKRW: 12000
        });
        const result = await request("/api/carts", {
          currency: "KRW",
          items: [
            {
              product: product.id,
              variant: variant.id,
              quantity: 1,
              mode: "standard_purchase"
            }
          ]
        });
        if (result.status !== 201 || !result.body.doc?.secret) {
          throw new Error(
            `fixture-cart-create:${result.status}:${JSON.stringify(result.body)}`
          );
        }
        return {
          id: result.body.doc.id,
          secret: result.body.doc.secret,
          productID: product.id
        };
      },
      initiate(
        cart: Cart,
        options: { userID?: string; retryPayment?: boolean } = {}
      ) {
        return request(
          "/api/payments/portone/initiate",
          {
            cartID: cart.id,
            secret: cart.secret,
            currency: "KRW",
            expectedAmount: 12000,
            expectedCurrency: "KRW",
            customerEmail: "guest@checkout.test",
            ...(options.retryPayment ? { retryPayment: true } : {})
          },
          { userID: options.userID }
        );
      },
      confirm(
        cart: Cart,
        initiated: Record<string, unknown>,
        options: RequestOptions = {}
      ) {
        return request(
          "/api/payments/portone/confirm-order",
          {
            cartID: cart.id,
            secret: cart.secret,
            paymentId: initiated.paymentId,
            purchaseAccessToken: initiated.purchaseAccessToken,
            customerEmail: "guest@checkout.test"
          },
          options
        );
      },
      async attempts(cartID: string): Promise<Row[]> {
        const found = await instance.find({
          collection: "transactions",
          overrideAccess: true,
          depth: 0,
          limit: 100,
          where: { cart: { equals: cartID } }
        });
        return found.docs as unknown as Row[];
      },
      async orderFor(attempt: Row): Promise<Row> {
        const id =
          typeof attempt.order === "string"
            ? attempt.order
            : (attempt.order as Row)?.id;
        if (!id) throw new Error("fixture-attempt-missing-purchase");
        return instance.findByID({
          collection: "orders",
          id,
          depth: 0,
          overrideAccess: true
        }) as unknown as Promise<Row>;
      },
      async updateProduct(id: string, data: Record<string, unknown>) {
        const transactionID = await instance.db.beginTransaction();
        if (!transactionID) throw new Error("fixture-transaction-required");
        try {
          await instance.update({
            collection: "products",
            id,
            data,
            overrideAccess: true,
            req: { transactionID }
          });
          await instance.db.commitTransaction(transactionID);
        } catch (error) {
          await instance.db.rollbackTransaction(transactionID);
          throw error;
        }
      },
      async close() {
        try {
          const cleanup = await Promise.allSettled([
            instance.destroy(),
            stop(provider)
          ]);
          if (cleanup.some((result) => result.status === "rejected"))
            throw new Error("checkout-fixture-cleanup-failed");
        } finally {
          for (const [key, value] of Object.entries(previousEnv)) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
          }
        }
      }
    };
  } catch (error) {
    await Promise.allSettled([payload?.destroy(), stop(provider)]);
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    throw new Error("checkout-fixture-initialization-failed");
  }
}

export type CheckoutFixture = Awaited<ReturnType<typeof createCheckoutFixture>>;
