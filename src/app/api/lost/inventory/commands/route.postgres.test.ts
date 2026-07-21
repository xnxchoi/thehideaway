import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { getPayload, type Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import config from "@payload-config";

import { hashCommerceCommandInput } from "@/lib/lost-commerce/commerce-commands";
import type {
  Product,
  ProductVariant,
  StockLocation,
  User
} from "@/payload-types";

const routeHarness = vi.hoisted(() => ({
  session: null as unknown
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ cookie: "session=postgres-route-test" })
}));
vi.mock("@payload-config", async () => {
  const [{ postgresAdapter }, { buildConfig }] = await Promise.all([
    import("@payloadcms/db-postgres"),
    import("payload")
  ]);
  const [
    { CommerceCommands },
    { InventoryCycleCountLines },
    { InventoryCycleCounts },
    { InventoryLevels },
    { InventoryLots },
    { InventoryMovements },
    { InventoryReceiptLines },
    { InventoryReceipts },
    { ProductVariants },
    { StockLocations }
  ] = await Promise.all([
    import("@/payload/collections/(consumption)/CommerceCommands"),
    import("@/payload/collections/(consumption)/InventoryCycleCountLines"),
    import("@/payload/collections/(consumption)/InventoryCycleCounts"),
    import("@/payload/collections/(consumption)/InventoryLevels"),
    import("@/payload/collections/(consumption)/InventoryLots"),
    import("@/payload/collections/(consumption)/InventoryMovements"),
    import("@/payload/collections/(consumption)/InventoryReceiptLines"),
    import("@/payload/collections/(consumption)/InventoryReceipts"),
    import("@/payload/collections/(consumption)/ProductVariants"),
    import("@/payload/collections/(consumption)/StockLocations")
  ]);
  return {
    default: buildConfig({
      secret: "commerce-route-postgres-secret",
      db: postgresAdapter({
        push: false,
        idType: "uuid",
        pool: { connectionString: process.env.COMMERCE_TEST_DATABASE_URI }
      }),
      collections: [
        {
          slug: "products",
          fields: [
            { name: "name", type: "text", required: true },
            { name: "slug", type: "text", required: true },
            { name: "currency", type: "select", options: ["KRW"] },
            {
              name: "unit_amount",
              type: "number",
              required: true,
              defaultValue: 1
            }
          ]
        },
        {
          slug: "users",
          auth: { disableLocalStrategy: true },
          fields: [
            { name: "name", type: "text" },
            { name: "role", type: "select", options: ["admin"] }
          ]
        },
        ProductVariants,
        StockLocations,
        CommerceCommands,
        InventoryReceipts,
        InventoryReceiptLines,
        InventoryLots,
        InventoryCycleCounts,
        InventoryCycleCountLines,
        InventoryLevels,
        InventoryMovements
      ]
    })
  };
});
vi.mock("@/lib/auth/getServerSession", () => ({
  getServerSession: async () => routeHarness.session
}));

import { POST } from "./route";

const testDatabaseUri = process.env.COMMERCE_TEST_DATABASE_URI;
const describeWithPostgres = testDatabaseUri ? describe : describe.skip;
const originalDatabaseUri = process.env.DATABASE_URI;

type Doc = Record<string, unknown> & { id: string };
type FixtureDataMap = {
  products: {
    name: string;
    slug: string;
    currency: "KRW";
    unit_amount: number;
  };
  users: { name: string; role: "admin" };
  "product-variants": {
    product: string;
    active: true;
    sku: string;
    options: unknown[];
  };
  "stock-locations": { code: string; name: string; active: true };
};
type FixtureResultMap = {
  products: Product;
  users: User;
  "product-variants": ProductVariant;
  "stock-locations": StockLocation;
};
type FixtureCreate = <Collection extends keyof FixtureDataMap>(input: {
  collection: Collection;
  data: FixtureDataMap[Collection];
  overrideAccess: true;
}) => Promise<FixtureResultMap[Collection]>;
type ReceiptFixture = {
  locationId: string;
  skuIds: readonly [string, string];
};

function relationshipId(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" ? id : undefined;
  }
  return undefined;
}

function commandRequest(body: unknown, idempotencyKey: string): NextRequest {
  return new NextRequest(
    "https://lostinseoul.com/api/lost/inventory/commands",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": idempotencyKey,
        origin: "https://lostinseoul.com"
      },
      body: JSON.stringify(body)
    }
  );
}

describeWithPostgres.sequential(
  "POST /api/lost/inventory/commands with PostgreSQL",
  () => {
    let payload: Payload;
    let adminId: string;
    let fixture: ReceiptFixture;

    beforeAll(async () => {
      process.env.DATABASE_URI = testDatabaseUri;
      payload = await getPayload({ config });

      const suffix = randomUUID();
      const [admin, location, firstProduct, secondProduct] = await Promise.all([
        createDoc("users", { name: `Route admin ${suffix}`, role: "admin" }),
        createDoc("stock-locations", {
          code: `ROUTE-${suffix}`.toUpperCase(),
          name: `Route ${suffix}`,
          active: true
        }),
        createDoc("products", {
          name: `Route first ${suffix}`,
          slug: `route-first-${suffix}`,
          currency: "KRW",
          unit_amount: 1
        }),
        createDoc("products", {
          name: `Route second ${suffix}`,
          slug: `route-second-${suffix}`,
          currency: "KRW",
          unit_amount: 1
        })
      ]);
      const [firstSku, secondSku] = await Promise.all([
        createDoc("product-variants", {
          product: firstProduct.id,
          active: true,
          sku: `ROUTE-FIRST-${suffix}`.toUpperCase(),
          options: []
        }),
        createDoc("product-variants", {
          product: secondProduct.id,
          active: true,
          sku: `ROUTE-SECOND-${suffix}`.toUpperCase(),
          options: []
        })
      ]);

      adminId = admin.id;
      fixture = {
        locationId: location.id,
        skuIds: [firstSku.id, secondSku.id]
      };
      routeHarness.session = { user: { id: adminId, role: "admin" } };
    }, 60_000);

    afterAll(async () => {
      try {
        routeHarness.session = null;
        await payload?.destroy();
      } finally {
        if (originalDatabaseUri === undefined) delete process.env.DATABASE_URI;
        else process.env.DATABASE_URI = originalDatabaseUri;
      }
    });

    async function createDoc<Collection extends keyof FixtureDataMap>(
      collection: Collection,
      data: FixtureDataMap[Collection]
    ): Promise<FixtureResultMap[Collection]> {
      // The test config intentionally narrows products/users while retaining
      // their production slugs; bridge that one local schema boundary only.
      const createFixture = payload.create as unknown as FixtureCreate;
      return createFixture({
        collection,
        data,
        overrideAccess: true
      });
    }

    function receiptBody(reference: string, secondQuantity = 4) {
      return {
        action: "receipt.create" as const,
        input: {
          locationId: fixture.locationId,
          supplierName: "Route integration supplier",
          externalReference: reference,
          lines: [
            { skuId: fixture.skuIds[0], expectedQuantity: 2 },
            {
              skuId: fixture.skuIds[1],
              expectedQuantity: secondQuantity
            }
          ]
        }
      };
    }

    async function persistedReceipt(resourceId: string) {
      const receipt = (await payload.findByID({
        collection: "inventory-receipts",
        id: resourceId,
        depth: 0,
        overrideAccess: true
      })) as unknown as Doc;
      const lines = await payload.find({
        collection: "inventory-receipt-lines",
        depth: 0,
        pagination: false,
        overrideAccess: true,
        where: { receipt: { equals: resourceId } }
      });
      return { receipt, lines: lines.docs };
    }

    async function persistedCommands(clientKey: string) {
      const commandKey = hashCommerceCommandInput({
        endpoint: "lost/inventory/commands",
        userId: adminId,
        key: clientKey
      });
      const commands = await payload.find({
        collection: "commerce-commands",
        depth: 0,
        pagination: false,
        overrideAccess: true,
        where: { command_key: { equals: commandKey } }
      });
      return commands.docs;
    }

    it("creates one durable receipt with two unique lines through POST", async () => {
      const clientKey = `route-create-${randomUUID()}`;
      const externalReference = `route-create-${randomUUID()}`;

      const response = await POST(
        commandRequest(receiptBody(externalReference), clientKey)
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toMatchObject({
        ok: true,
        data: { status: "draft" }
      });
      const resourceId = body.data.resourceId as string;
      const persisted = await persistedReceipt(resourceId);
      expect(persisted.receipt).toMatchObject({
        id: resourceId,
        status: "draft",
        external_reference: externalReference
      });
      expect(relationshipId(persisted.receipt.location)).toBe(
        fixture.locationId
      );
      expect(persisted.lines).toHaveLength(2);
      expect(
        persisted.lines.map((line) => relationshipId(line.sku)).sort()
      ).toEqual([...fixture.skuIds].sort());
      expect(
        persisted.lines
          .map((line) => line.expected_quantity)
          .sort((left, right) => Number(left) - Number(right))
      ).toEqual([2, 4]);

      const commands = await persistedCommands(clientKey);
      expect(commands).toHaveLength(1);
      expect(commands[0]).toMatchObject({
        status: "succeeded",
        resource_type: "inventory-receipt",
        resource_id: resourceId,
        safe_response: { resourceId, status: "draft" }
      });
    });

    it("replays the same POST without duplicating receipt evidence", async () => {
      const clientKey = `route-replay-${randomUUID()}`;
      const externalReference = `route-replay-${randomUUID()}`;
      const requestBody = receiptBody(externalReference);

      const created = await POST(commandRequest(requestBody, clientKey));
      const createdBody = await created.json();
      const replayed = await POST(commandRequest(requestBody, clientKey));
      const replayedBody = await replayed.json();

      expect(created.status).toBe(200);
      expect(replayed.status).toBe(200);
      expect(replayed.headers.get("Idempotent-Replay")).toBe("true");
      expect(replayedBody).toEqual(createdBody);
      const persisted = await persistedReceipt(createdBody.data.resourceId);
      expect(persisted.lines).toHaveLength(2);
      const receipts = await payload.find({
        collection: "inventory-receipts",
        depth: 0,
        pagination: false,
        overrideAccess: true,
        where: { external_reference: { equals: externalReference } }
      });
      expect(receipts.docs).toHaveLength(1);
      const commands = await persistedCommands(clientKey);
      expect(commands).toHaveLength(1);
      expect(commands[0]).toMatchObject({
        status: "succeeded",
        resource_id: createdBody.data.resourceId,
        safe_response: createdBody.data
      });
    });

    it("returns a hash conflict and preserves the original evidence", async () => {
      const clientKey = `route-conflict-${randomUUID()}`;
      const externalReference = `route-conflict-${randomUUID()}`;

      const created = await POST(
        commandRequest(receiptBody(externalReference), clientKey)
      );
      const createdBody = await created.json();
      const originalCommands = await persistedCommands(clientKey);
      expect(originalCommands).toHaveLength(1);
      const originalRequestHash = originalCommands[0]?.request_hash;
      if (
        typeof originalRequestHash !== "string" ||
        originalRequestHash.length === 0
      ) {
        throw new Error("route-command-request-hash-missing");
      }
      const conflicted = await POST(
        commandRequest(receiptBody(externalReference, 5), clientKey)
      );

      expect(created.status).toBe(200);
      expect(conflicted.status).toBe(409);
      expect(await conflicted.json()).toEqual({
        ok: false,
        error: "idempotency-key-conflict"
      });
      const persisted = await persistedReceipt(createdBody.data.resourceId);
      expect(persisted.lines).toHaveLength(2);
      expect(
        persisted.lines
          .map((line) => line.expected_quantity)
          .sort((left, right) => Number(left) - Number(right))
      ).toEqual([2, 4]);
      const receipts = await payload.find({
        collection: "inventory-receipts",
        depth: 0,
        pagination: false,
        overrideAccess: true,
        where: { external_reference: { equals: externalReference } }
      });
      expect(receipts.docs).toHaveLength(1);
      const commands = await persistedCommands(clientKey);
      expect(commands).toHaveLength(1);
      expect(commands[0]).toMatchObject({
        request_hash: originalRequestHash,
        resource_id: createdBody.data.resourceId,
        safe_response: createdBody.data
      });
    });
  }
);
