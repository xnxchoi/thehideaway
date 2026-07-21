import { randomUUID } from "node:crypto";
import type { Payload } from "payload";
import { beforeAll, describe, expect, it } from "vitest";

import {
  claimCommerceCommand,
  completeCommerceCommand
} from "./commerce-commands";
import { recordCommerceProviderEventStandalone } from "./provider-events";

const testDatabaseUri = process.env.COMMERCE_TEST_DATABASE_URI;
const describeWithPostgres = testDatabaseUri ? describe : describe.skip;

describeWithPostgres.sequential("commerce durability with PostgreSQL", () => {
  let payload: Payload;

  beforeAll(async () => {
    process.env.DATABASE_URI = testDatabaseUri;
    const [{ buildConfig, getPayload }, { postgresAdapter }] =
      await Promise.all([import("payload"), import("@payloadcms/db-postgres")]);
    const config = buildConfig({
      secret: "commerce-postgres-test-secret-32-bytes",
      db: postgresAdapter({
        push: false,
        idType: "uuid",
        pool: { connectionString: testDatabaseUri }
      }),
      collections: [
        {
          slug: "commerce-commands",
          fields: [
            { name: "command_key", type: "text", required: true },
            { name: "business_key", type: "text", required: true },
            { name: "request_hash", type: "text", required: true },
            {
              name: "status",
              type: "select",
              required: true,
              options: ["in_progress", "succeeded"]
            },
            { name: "attempt_count", type: "number", required: true },
            { name: "lease_token_hash", type: "text" },
            { name: "lease_expires_at", type: "date" },
            { name: "safe_response", type: "json" },
            { name: "resource_type", type: "text" },
            { name: "resource_id", type: "text" },
            { name: "completed_at", type: "date" }
          ]
        },
        {
          slug: "commerce-provider-events",
          fields: [
            { name: "dedupe_key", type: "text", required: true },
            {
              name: "provider",
              type: "select",
              required: true,
              options: ["portone"]
            },
            { name: "event_key", type: "text", required: true },
            { name: "event_type", type: "text" },
            { name: "payment_ref", type: "text" },
            { name: "payload_hash", type: "text" },
            { name: "provider_status", type: "text" },
            { name: "transaction_ref", type: "text" },
            { name: "occurred_at", type: "date" },
            {
              name: "received_at",
              type: "date",
              required: true,
              defaultValue: () => new Date().toISOString()
            },
            {
              name: "processing_status",
              type: "select",
              required: true,
              options: [
                "received",
                "processing",
                "retryable",
                "processed",
                "rejected"
              ]
            },
            { name: "attempt_count", type: "number", required: true },
            { name: "lease_token_hash", type: "text" },
            { name: "lease_expires_at", type: "date" },
            { name: "last_attempt_at", type: "date" },
            { name: "processed_at", type: "date" },
            { name: "outcome_code", type: "text" },
            { name: "last_error_code", type: "text" }
          ]
        }
      ]
    });
    payload = await getPayload({ config });
  }, 60_000);

  it("serializes parallel claims and permanently detects request conflicts", async () => {
    const suffix = randomUUID();
    const input = {
      payload,
      commandKey: `parallel_${suffix}`,
      validatedInput: { quantity: 1 },
      businessKey: `order:${suffix}`,
      now: new Date("2026-07-21T08:00:00.000Z")
    };

    const claims = await Promise.all([
      claimCommerceCommand(input),
      claimCommerceCommand(input)
    ]);

    expect(claims.filter((claim) => claim.kind === "claimed")).toHaveLength(1);
    expect(claims.filter((claim) => claim.kind === "in_progress")).toHaveLength(
      1
    );
    await expect(
      claimCommerceCommand({
        ...input,
        validatedInput: { quantity: 2 }
      })
    ).resolves.toEqual({ kind: "conflict" });
  });

  it("enforces permanent business-key uniqueness across command keys", async () => {
    const suffix = randomUUID();
    const businessKey = `order:${suffix}`;
    const claims = await Promise.all([
      claimCommerceCommand({
        payload,
        commandKey: `business_a_${suffix}`,
        validatedInput: { quantity: 1 },
        businessKey
      }),
      claimCommerceCommand({
        payload,
        commandKey: `business_b_${suffix}`,
        validatedInput: { quantity: 1 },
        businessKey
      })
    ]);

    expect(claims.filter((claim) => claim.kind === "claimed")).toHaveLength(1);
    expect(claims.filter((claim) => claim.kind === "conflict")).toHaveLength(1);
  });

  it("fences stale leases and rolls command completion back with its transaction", async () => {
    const suffix = randomUUID();
    const commandKey = `lease_${suffix}`;
    const initial = await claimCommerceCommand({
      payload,
      commandKey,
      validatedInput: { quantity: 1 },
      businessKey: `order:${suffix}`,
      now: new Date("2026-07-21T08:00:00.000Z"),
      leaseMs: 1_000
    });
    expect(initial.kind).toBe("claimed");
    if (initial.kind !== "claimed") throw new Error("claim-failed");

    const replacement = await claimCommerceCommand({
      payload,
      commandKey,
      validatedInput: { quantity: 1 },
      businessKey: `order:${suffix}`,
      now: new Date("2026-07-21T08:00:02.000Z"),
      leaseMs: 30_000
    });
    expect(replacement.kind).toBe("claimed");
    if (replacement.kind !== "claimed") throw new Error("reclaim-failed");

    const staleTransaction = await payload.db.beginTransaction();
    if (!staleTransaction) throw new Error("transaction-failed");
    await expect(
      completeCommerceCommand({
        payload,
        req: { payload, transactionID: staleTransaction, context: {} } as never,
        commandKey,
        requestHash: initial.requestHash,
        leaseToken: initial.leaseToken,
        response: { ok: true },
        resource: { type: "product-order", id: suffix },
        now: new Date("2026-07-21T08:00:03.000Z")
      })
    ).rejects.toThrow("commerce-command-lease-lost");
    await payload.db.rollbackTransaction(staleTransaction);

    const completionTransaction = await payload.db.beginTransaction();
    if (!completionTransaction) throw new Error("transaction-failed");
    await completeCommerceCommand({
      payload,
      req: {
        payload,
        transactionID: completionTransaction,
        context: {}
      } as never,
      commandKey,
      requestHash: replacement.requestHash,
      leaseToken: replacement.leaseToken,
      response: { ok: true },
      resource: { type: "product-order", id: suffix },
      now: new Date("2026-07-21T08:00:03.000Z")
    });
    await payload.db.rollbackTransaction(completionTransaction);

    const afterRollback = await claimCommerceCommand({
      payload,
      commandKey,
      validatedInput: { quantity: 1 },
      businessKey: `order:${suffix}`,
      now: new Date("2026-07-21T08:00:04.000Z")
    });
    expect(afterRollback.kind).toBe("in_progress");
  });

  it("deduplicates concurrent provider receipts and rejects altered bytes", async () => {
    const eventKey = `evt-${randomUUID()}`;
    const rawBody = JSON.stringify({
      webhook_id: eventKey,
      paymentId: "lis_pg_test",
      status: "PAID"
    });
    const input = {
      payload,
      paymentId: "lis_pg_test",
      event: { provider_event_id: eventKey, status: "PAID" },
      rawBody
    };

    const receipts = await Promise.all([
      recordCommerceProviderEventStandalone(input),
      recordCommerceProviderEventStandalone(input)
    ]);
    expect(receipts.filter((receipt) => receipt.recorded)).toHaveLength(1);
    expect(receipts.filter((receipt) => receipt.duplicate)).toHaveLength(1);

    await expect(
      recordCommerceProviderEventStandalone({
        ...input,
        event: { provider_event_id: eventKey, status: "FAILED" },
        rawBody: JSON.stringify({
          webhook_id: eventKey,
          paymentId: "lis_pg_test",
          status: "FAILED"
        })
      })
    ).resolves.toMatchObject({ conflict: true, recorded: false });
  });
});
