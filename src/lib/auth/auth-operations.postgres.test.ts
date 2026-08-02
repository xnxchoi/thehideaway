import { randomUUID } from "node:crypto";
import { sql } from "@payloadcms/db-postgres/drizzle";
import type { Payload, PayloadRequest } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const testDatabaseUri = process.env.AUTH_TEST_DATABASE_URI;
const originalDatabaseUri = process.env.DATABASE_URI;

export const assertDisposableAuthTestDatabase = (
  candidateUri: string,
  ordinaryUri?: string
) => {
  const candidate = new URL(candidateUri);
  const databaseName = decodeURIComponent(candidate.pathname.slice(1));
  if (!databaseName.startsWith("thehideaway_auth_test_")) {
    throw new Error(
      "AUTH_TEST_DATABASE_URI must use a thehideaway_auth_test_ disposable database"
    );
  }

  if (ordinaryUri) {
    const ordinary = new URL(ordinaryUri);
    const candidateIdentity = `${candidate.protocol}//${candidate.host}/${databaseName}`;
    const ordinaryIdentity = `${ordinary.protocol}//${ordinary.host}/${decodeURIComponent(ordinary.pathname.slice(1))}`;
    if (candidateIdentity === ordinaryIdentity) {
      throw new Error(
        "AUTH_TEST_DATABASE_URI must not point to the ordinary application database"
      );
    }
  }
};

if (testDatabaseUri) {
  assertDisposableAuthTestDatabase(
    testDatabaseUri,
    process.env.AUTH_TEST_SOURCE_DATABASE_URI ?? originalDatabaseUri
  );
}

const describeWithPostgres = testDatabaseUri ? describe : describe.skip;

describe("authentication test database safety", () => {
  it("accepts a distinct disposable auth-test database", () => {
    expect(() =>
      assertDisposableAuthTestDatabase(
        "postgres://localhost:5432/thehideaway_auth_test_123",
        "postgres://localhost:5432/theestate"
      )
    ).not.toThrow();
  });

  it("rejects the ordinary application database", () => {
    expect(() =>
      assertDisposableAuthTestDatabase(
        "postgres://localhost:5432/thehideaway_auth_test_123",
        "postgres://localhost:5432/thehideaway_auth_test_123"
      )
    ).toThrow("must not point to the ordinary application database");
  });

  it("rejects a database without the disposable auth-test prefix", () => {
    expect(() =>
      assertDisposableAuthTestDatabase(
        "postgres://localhost:5432/theestate",
        "postgres://localhost:5432/another_database"
      )
    ).toThrow("must use a thehideaway_auth_test_ disposable database");
  });
});

describeWithPostgres.sequential(
  "authentication operations with PostgreSQL",
  () => {
    let payload: Payload;
    const createdUserIDs = new Set<string>();
    type TestUser = Record<string, unknown> & { id: string };

    beforeAll(async () => {
      if (!testDatabaseUri) {
        throw new Error("AUTH_TEST_DATABASE_URI is required");
      }
      process.env.DATABASE_URI = testDatabaseUri;
      const [
        { buildConfig, getPayload },
        { postgresAdapter },
        { betterAuthPlugin },
        { betterAuthPluginOptions },
        { beforeChangeUsers }
      ] = await Promise.all([
        import("payload"),
        import("@payloadcms/db-postgres"),
        import("./payload-auth/better-auth/plugin"),
        import("./options"),
        import("../../payload/collections/Users/hooks/beforeChange")
      ]);
      const config = buildConfig({
        secret: "auth-postgres-operation-test-secret-32-bytes",
        serverURL: "http://localhost:3000",
        db: postgresAdapter({
          push: false,
          idType: "uuidv7",
          pool: { connectionString: testDatabaseUri }
        }),
        collections: [
          {
            slug: "users",
            auth: { disableLocalStrategy: true },
            hooks: { beforeChange: [beforeChangeUsers] },
            fields: [
              {
                name: "role",
                type: "select",
                hasMany: false,
                required: true,
                defaultValue: "user",
                options: [
                  "admin",
                  "cofounder",
                  "editor",
                  "author",
                  "patron",
                  "resident",
                  "user"
                ]
              }
            ]
          }
        ],
        plugins: [betterAuthPlugin(betterAuthPluginOptions)]
      });
      payload = await getPayload({ config });
    }, 60_000);

    afterAll(async () => {
      try {
        for (const id of createdUserIDs) {
          await payload?.delete({
            collection: "users",
            id,
            overrideAccess: true
          });
        }
      } finally {
        try {
          await payload?.destroy();
        } finally {
          if (originalDatabaseUri === undefined) {
            delete process.env.DATABASE_URI;
          } else {
            process.env.DATABASE_URI = originalDatabaseUri;
          }
        }
      }
    }, 60_000);

    async function createUser(role: string, label: string) {
      const suffix = randomUUID();
      const user = await payload.create({
        collection: "users",
        overrideAccess: true,
        data: {
          email: `${label}-${suffix}@hideaway.test`,
          username: `${label}-${suffix}`,
          slug: `${label}-${suffix}`,
          firstName: label,
          lastName: "Test",
          name: `${label} Test`,
          role,
          verified: false,
          onboarded: false,
          banned: false,
          twoFactorEnabled: false,
          emailVerified: false
        }
      } as never);
      createdUserIDs.add(user.id);
      return user as unknown as TestUser;
    }

    async function requestFor(user: TestUser) {
      const { createLocalReq } = await import("payload");
      return createLocalReq(
        { user: { ...user, collection: "users" } as never },
        payload
      ) as Promise<PayloadRequest>;
    }

    it("enforces create, self-edit, delegated edit, bulk update, and bulk delete rules", async () => {
      const [admin, editor, ordinary, protectedAdmin] = await Promise.all([
        createUser("admin", "admin"),
        createUser("editor", "editor"),
        createUser("user", "ordinary"),
        createUser("admin", "protected")
      ]);
      const [adminReq, editorReq, ordinaryReq] = await Promise.all([
        requestFor(admin),
        requestFor(editor),
        requestFor(ordinary)
      ]);

      const adminCreated = await payload.create({
        collection: "users",
        overrideAccess: false,
        req: adminReq,
        data: {
          email: `admin-created-${randomUUID()}@hideaway.test`,
          username: `admin-created-${randomUUID()}`,
          slug: `admin-created-${randomUUID()}`,
          firstName: "Admin",
          lastName: "Created",
          name: "Admin Created",
          role: "user"
        }
      } as never);
      createdUserIDs.add(adminCreated.id);

      const selfUpdated = await payload.update({
        collection: "users",
        id: ordinary.id,
        overrideAccess: false,
        req: ordinaryReq,
        data: {
          firstName: "Self",
          lastName: "Edited",
          link: "https://example.test/self"
        }
      });
      expect(selfUpdated).toMatchObject({
        firstName: "Self",
        lastName: "Edited",
        name: "Self Edited",
        link: "https://example.test/self"
      });
      await expect(
        payload.update({
          collection: "users",
          id: ordinary.id,
          overrideAccess: false,
          req: ordinaryReq,
          data: { role: "admin" }
        })
      ).rejects.toThrow();
      await expect(
        payload.delete({
          collection: "users",
          id: ordinary.id,
          overrideAccess: false,
          req: ordinaryReq
        })
      ).rejects.toThrow();

      const promoted = await payload.update({
        collection: "users",
        id: ordinary.id,
        overrideAccess: false,
        req: editorReq,
        data: { role: "author", bio: "Managed by editor" }
      });
      expect(promoted).toMatchObject({
        role: "author",
        bio: "Managed by editor"
      });
      await expect(
        payload.update({
          collection: "users",
          id: protectedAdmin.id,
          overrideAccess: false,
          req: editorReq,
          data: { bio: "Forbidden" }
        })
      ).rejects.toThrow();
      await expect(
        payload.update({
          collection: "users",
          id: ordinary.id,
          overrideAccess: false,
          req: editorReq,
          data: { email: `changed-${randomUUID()}@hideaway.test` }
        })
      ).rejects.toThrow();

      const bulkUpdated = await payload.update({
        collection: "users",
        overrideAccess: false,
        req: adminReq,
        where: {
          id: { in: [ordinary.id, adminCreated.id] }
        },
        data: { location: "Bulk verified", role: "resident" }
      });
      expect(bulkUpdated.docs).toHaveLength(2);
      expect(
        bulkUpdated.docs.every((doc) => doc.location === "Bulk verified")
      ).toBe(true);
      expect(bulkUpdated.docs.every((doc) => doc.role === "resident")).toBe(
        true
      );

      const [bulkA, bulkB] = await Promise.all([
        createUser("user", "bulk-a"),
        createUser("user", "bulk-b")
      ]);
      const deleted = await payload.delete({
        collection: "users",
        overrideAccess: false,
        req: adminReq,
        where: { id: { in: [bulkA.id, bulkB.id] } }
      });
      expect(deleted.docs).toHaveLength(2);
      createdUserIDs.delete(bulkA.id);
      createdUserIDs.delete(bulkB.id);
    }, 60_000);

    it("hides credentials, cleans dependent auth rows, and preserves atomic security operations", async () => {
      const user = await createUser("user", "security");
      const req = await requestFor(user);
      const account = await payload.create({
        collection: "accounts",
        overrideAccess: true,
        data: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: user.id,
          providerId: "credential",
          accountId: user.id,
          password: "password-hash",
          accessToken: "access-secret",
          refreshToken: "refresh-secret",
          idToken: "id-secret"
        }
      } as never);
      const publicAccount = await payload.findByID({
        collection: "accounts",
        id: account.id,
        overrideAccess: false,
        req
      });
      expect(publicAccount).not.toHaveProperty("password");
      expect(publicAccount).not.toHaveProperty("accessToken");
      expect(publicAccount).not.toHaveProperty("refreshToken");
      expect(publicAccount).not.toHaveProperty("idToken");

      const twoFactor = await payload.create({
        collection: "twoFactors",
        overrideAccess: true,
        data: {
          user: user.id,
          secret: `secret-${randomUUID()}`,
          backupCodes: "backup-code",
          verified: true,
          failedVerificationCount: 0
        }
      } as never);
      const verification = await payload.create({
        collection: "verifications",
        overrideAccess: true,
        data: {
          identifier: `identifier-${randomUUID()}`,
          value: `value-${randomUUID()}`,
          expiresAt: new Date(Date.now() + 60_000).toISOString()
        }
      } as never);
      const linkedVerification = await payload.create({
        collection: "verifications",
        overrideAccess: true,
        data: {
          identifier: `user-cleanup-${randomUUID()}`,
          value: JSON.stringify({ userId: user.id, marker: randomUUID() }),
          expiresAt: new Date(Date.now() + 60_000).toISOString()
        }
      } as never);

      const [{ payloadAdapter }, { betterAuthPluginOptions }] =
        await Promise.all([
          import("./payload-auth/better-auth/adapter"),
          import("./options")
        ]);
      const adapter = payloadAdapter({
        payloadClient: payload,
        adapterConfig: { idType: "text" }
      })(betterAuthPluginOptions.betterAuthOptions as never);

      await payload.db.drizzle.execute(
        sql`UPDATE two_factors SET failed_verification_count = NULL WHERE id = ${twoFactor.id}`
      );
      const incrementedFromNull = await adapter.incrementOne!({
        model: "twoFactor",
        where: [{ field: "id", value: twoFactor.id, operator: "eq" }],
        increment: { failedVerificationCount: 1 }
      });
      expect(incrementedFromNull).toMatchObject({ failedVerificationCount: 1 });
      await payload.update({
        collection: "twoFactors",
        id: twoFactor.id,
        overrideAccess: true,
        data: { failedVerificationCount: 0 }
      });

      await Promise.all(
        Array.from({ length: 20 }, () =>
          adapter.incrementOne!({
            model: "twoFactor",
            where: [{ field: "id", value: twoFactor.id, operator: "eq" }],
            increment: { failedVerificationCount: 1 }
          })
        )
      );
      const incremented = await payload.findByID({
        collection: "twoFactors",
        id: twoFactor.id,
        overrideAccess: true
      });
      expect(incremented.failedVerificationCount).toBe(20);

      const consumed = await Promise.all(
        Array.from({ length: 10 }, () =>
          adapter.consumeOne!({
            model: "verification",
            where: [{ field: "id", value: verification.id, operator: "eq" }]
          })
        )
      );
      expect(consumed.filter(Boolean)).toHaveLength(1);

      await expect(
        adapter.transaction(async (transaction) => {
          await transaction.update({
            model: "user",
            where: [{ field: "id", value: user.id, operator: "eq" }],
            update: { bio: "must roll back" }
          });
          throw new Error("force transaction rollback");
        })
      ).rejects.toThrow("force transaction rollback");
      const rolledBackUser = await payload.findByID({
        collection: "users",
        id: user.id,
        overrideAccess: true
      });
      expect(rolledBackUser.bio).not.toBe("must roll back");

      await payload.delete({
        collection: "users",
        id: user.id,
        overrideAccess: true
      });
      createdUserIDs.delete(user.id);
      await expect(
        payload.findByID({
          collection: "accounts",
          id: account.id,
          overrideAccess: true
        })
      ).rejects.toThrow();
      await expect(
        payload.findByID({
          collection: "twoFactors",
          id: twoFactor.id,
          overrideAccess: true
        })
      ).rejects.toThrow();
      await expect(
        payload.findByID({
          collection: "verifications",
          id: linkedVerification.id,
          overrideAccess: true
        })
      ).rejects.toThrow();
    }, 60_000);
  }
);
