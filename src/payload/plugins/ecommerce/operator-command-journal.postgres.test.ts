import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { Client } = createRequire(require.resolve("@payloadcms/db-postgres"))(
  "pg"
);
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import type { Payload, PayloadRequest } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CommerceCommands } from "@/payload/collections/(consumption)/CommerceCommands";
import { migrations } from "@/lib/migrations-baseline";
import {
  up,
  down
} from "@/lib/migrations-baseline/20260914_073802_commerce_command_journal";
import { assertCheckoutTestDatabase } from "./checkout-postgres.fixtures";
import {
  claimOperatorCommand,
  completeOperatorCommand
} from "./operator-command-journal";

const sourceURI = process.env.ECOMMERCE_TEST_DATABASE_URI;
const database = `ecommerce_checkout_test_journal_${randomUUID().replaceAll("-", "").slice(0, 20)}`;

describe
  .skipIf(!sourceURI)
  .sequential("durable operator journal on PostgreSQL", () => {
    let payload: Payload;
    let admin: InstanceType<typeof Client>;
    let client: InstanceType<typeof Client>;
    const actorId = randomUUID();
    const targetId = randomUUID();
    const dialect = new PgDialect();
    const args = {
      db: {
        execute: async (statement: SQL) => {
          const q = dialect.sqlToQuery(statement);
          return client.query(q.sql, q.params);
        }
      }
    };
    const request = (transactionID?: string | number) =>
      ({
        payload,
        transactionID,
        context: {},
        user: { id: actorId, role: "admin", collection: "users" }
      }) as unknown as PayloadRequest;
    const input = (commandKey = `journal-command-${randomUUID()}`) => ({
      payload,
      req: request(),
      commandKey,
      operation: "mark_processing",
      resource: { type: "orders", id: targetId },
      reasonCode: "operator_update",
      auditSource: "operator",
      validatedInput: { status: "processing" }
    });
    beforeAll(async () => {
      assertCheckoutTestDatabase(sourceURI!);
      const uri = new URL(sourceURI!);
      uri.pathname = "/postgres";
      admin = new Client({ connectionString: uri.toString() });
      await admin.connect();
      await admin.query(`CREATE DATABASE "${database}"`);
      uri.pathname = `/${database}`;
      client = new Client({ connectionString: uri.toString() });
      await client.connect();
      for (const migration of migrations) await migration.up(args as never);
      const [{ buildConfig, getPayload }, { postgresAdapter }] =
        await Promise.all([
          import("payload"),
          import("@payloadcms/db-postgres")
        ]);
      payload = await getPayload({
        key: database,
        config: await buildConfig({
          secret: "journal-isolated-fixture-secret-32-bytes",
          db: postgresAdapter({
            push: false,
            idType: "uuid",
            pool: { connectionString: uri.toString(), max: 15 }
          }),
          collections: [
            CommerceCommands,
            {
              slug: "orders",
              fields: [
                { name: "order_ref", type: "text" },
                {
                  name: "status",
                  type: "select",
                  options: ["pending", "cancelled", "completed"]
                }
              ]
            }
          ],
          typescript: { autoGenerate: false },
          graphQL: { disable: true },
          telemetry: false
        })
      });
    }, 120_000);
    afterAll(async () => {
      // Pinned Payload 3.88 connect.js retains its first pool client as a
      // reconnect monitor; destroy.js does not release it or close the pool.
      // Release that fixture-owned monitor only after all command sessions end.
      if (payload) {
        for (const id of Object.keys(payload.db.sessions))
          await payload.db.rollbackTransaction(id);
        const pool = payload.db.pool as unknown as {
          _clients: Array<{ release: () => void }>;
          end: () => Promise<void>;
        };
        pool._clients[0]?.release();
        await pool.end();
        await payload.destroy();
      }
      await client?.end();
      if (admin) {
        await admin.query(`DROP DATABASE IF EXISTS "${database}"`);
        await admin.end();
      }
    }, 30_000);
    it("replays migration up and down safely against the generated baseline", async () => {
      await up(args as never);
      await up(args as never);
      await down(args as never);
      await down(args as never);
      await up(args as never);
      await up(args as never);
      expect(
        (
          await client.query(
            "SELECT count(*) FROM pg_indexes WHERE tablename='commerce_commands'"
          )
        ).rows[0].count
      ).toBe("16");
    });
    it("grants only one concurrent lease and binds replay to actor, resource and input", async () => {
      const command = input();
      const claims = await Promise.all(
        Array.from({ length: 8 }, () => claimOperatorCommand(command))
      );
      expect(claims.filter((x) => x.kind === "claimed")).toHaveLength(1);
      expect(claims.filter((x) => x.kind === "in_progress")).toHaveLength(7);
      const claim = claims.find((x) => x.kind === "claimed")!;
      if (claim.kind !== "claimed") throw new Error("claim-required");
      const tx = await payload.db.beginTransaction();
      if (!tx) throw new Error("transaction-required");
      await completeOperatorCommand({
        ...command,
        req: request(tx),
        requestHash: claim.requestHash,
        leaseToken: claim.leaseToken,
        response: { orderId: targetId, fulfillmentStatus: "processing" }
      });
      await payload.db.commitTransaction(tx);
      expect(await claimOperatorCommand(command)).toMatchObject({
        kind: "replay",
        response: { orderId: targetId, fulfillmentStatus: "processing" }
      });
      for (const modified of [
        {
          ...command,
          req: {
            ...request(),
            user: { ...request().user, id: randomUUID() }
          } as never
        },
        { ...command, resource: { type: "orders", id: randomUUID() } },
        { ...command, operation: "mark_delivered" },
        { ...command, validatedInput: { status: "delivered" } },
        { ...command, reasonCode: "changed_reason" }
      ])
        expect(await claimOperatorCommand(modified)).toEqual({
          kind: "conflict"
        });
    });
    it("rolls journal completion and a domain write back together after a fault", async () => {
      const command = input();
      const claim = await claimOperatorCommand(command);
      if (claim.kind !== "claimed") throw new Error("claim-required");
      const order = await payload.create({
        collection: "orders",
        data: { order_ref: randomUUID(), status: "pending" },
        overrideAccess: true
      });
      const tx = await payload.db.beginTransaction();
      if (!tx) throw new Error("transaction-required");
      const req = request(tx);
      try {
        await payload.update({
          collection: "orders",
          id: order.id,
          req,
          overrideAccess: true,
          data: { status: "cancelled" }
        });
        await completeOperatorCommand({
          ...command,
          req,
          requestHash: claim.requestHash,
          leaseToken: claim.leaseToken,
          response: { orderId: targetId, status: "cancelled" }
        });
        throw new Error("fixture-after-completion-fault");
      } catch {
        await payload.db.rollbackTransaction(tx);
      }
      expect(
        (
          await payload.findByID({
            collection: "orders",
            id: order.id,
            overrideAccess: true
          })
        ).status
      ).toBe("pending");
      expect(await claimOperatorCommand(command)).toMatchObject({
        kind: "in_progress"
      });
    });
    it("fences an expired lease after reclaim and freezes bindings and completed rows", async () => {
      const command = input();
      const now = new Date();
      const first = await claimOperatorCommand({
        ...command,
        now: new Date(now.getTime() - 2000),
        leaseMs: 1000
      });
      const second = await claimOperatorCommand({ ...command, now });
      if (first.kind !== "claimed" || second.kind !== "claimed")
        throw new Error("claim-required");
      const tx = await payload.db.beginTransaction();
      if (!tx) throw new Error("transaction-required");
      await expect(
        completeOperatorCommand({
          ...command,
          req: request(tx),
          requestHash: first.requestHash,
          leaseToken: first.leaseToken,
          response: { orderId: targetId },
          now
        })
      ).rejects.toThrow("commerce-command-lease-lost");
      await payload.db.rollbackTransaction(tx);
      const [row] = (
        await payload.find({
          collection: "commerce-commands",
          where: { command_key: { equals: command.commandKey } },
          overrideAccess: true
        })
      ).docs;
      await expect(
        payload.update({
          collection: "commerce-commands",
          id: row.id,
          overrideAccess: true,
          data: { actor_id: randomUUID() }
        })
      ).rejects.toThrow("commerce-command-binding-immutable");
      const completeTx = await payload.db.beginTransaction();
      if (!completeTx) throw new Error("transaction-required");
      await completeOperatorCommand({
        ...command,
        req: request(completeTx),
        requestHash: second.requestHash,
        leaseToken: second.leaseToken,
        response: { orderId: targetId }
      });
      await payload.db.commitTransaction(completeTx);
      await expect(
        payload.update({
          collection: "commerce-commands",
          id: row.id,
          overrideAccess: true,
          data: { safe_response: { orderId: randomUUID() } }
        })
      ).rejects.toThrow("commerce-command-terminal-immutable");
    });
  });
