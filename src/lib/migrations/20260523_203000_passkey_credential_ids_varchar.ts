import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * WebAuthn credential IDs are opaque base64url-like strings, not UUIDs.
 *
 * The Payload schema already emits these columns as varchar, but
 * `afterSchemaInit` previously converted all `*_id` columns to uuid unless
 * explicitly preserved. That made passkey registration fail after browser
 * verification when Better Auth attempted to insert values such as
 * `u_a0YPhes0Q1_bMJsdYYK9LwvPk`.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'passkeys'
          AND column_name = 'credential_id'
          AND udt_name = 'uuid'
      ) THEN
        ALTER TABLE "passkeys"
          ALTER COLUMN "credential_id" TYPE varchar
          USING "credential_id"::text;
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'tickets'
          AND column_name = 'passkey_credential_id'
          AND udt_name = 'uuid'
      ) THEN
        ALTER TABLE "tickets"
          ALTER COLUMN "passkey_credential_id" TYPE varchar
          USING "passkey_credential_id"::text;
      END IF;
    END $$;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'tickets'
          AND column_name = 'passkey_credential_id'
          AND udt_name <> 'uuid'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM "tickets"
        WHERE "passkey_credential_id" IS NOT NULL
          AND "passkey_credential_id" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      ) THEN
        ALTER TABLE "tickets"
          ALTER COLUMN "passkey_credential_id" TYPE uuid
          USING "passkey_credential_id"::uuid;
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'passkeys'
          AND column_name = 'credential_id'
          AND udt_name <> 'uuid'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM "passkeys"
        WHERE "credential_id" IS NOT NULL
          AND "credential_id" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      ) THEN
        ALTER TABLE "passkeys"
          ALTER COLUMN "credential_id" TYPE uuid
          USING "credential_id"::uuid;
      END IF;
    END $$;
  `);
}
