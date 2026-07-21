import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-postgres";
import { sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_commerce_commands_status" AS ENUM('in_progress', 'succeeded');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_commerce_provider_events_processing_status" AS ENUM('received', 'processing', 'retryable', 'processed', 'rejected');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "commerce_commands" (
      "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
      "command_key" varchar NOT NULL,
      "business_key" varchar NOT NULL,
      "request_hash" varchar NOT NULL,
      "status" "enum_commerce_commands_status" DEFAULT 'in_progress' NOT NULL,
      "attempt_count" numeric DEFAULT 1 NOT NULL,
      "lease_token_hash" varchar,
      "lease_expires_at" timestamp(3) with time zone,
      "safe_response" jsonb,
      "resource_type" varchar,
      -- WHY-OVERRIDE-PAYLOAD: the collection field and generated schema use text;
      -- the migration generator incorrectly inferred uuid from the field suffix.
      "resource_id" varchar,
      "completed_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'commerce_provider_events'
          AND column_name = 'payment_ref'
      ) THEN
        ALTER TABLE "commerce_provider_events"
          ALTER COLUMN "payment_ref" DROP NOT NULL;
      END IF;
    END $$;

    ALTER TABLE IF EXISTS "commerce_provider_events"
      ADD COLUMN IF NOT EXISTS "payload_hash" varchar,
      ADD COLUMN IF NOT EXISTS "processing_status" "enum_commerce_provider_events_processing_status" DEFAULT 'received' NOT NULL,
      ADD COLUMN IF NOT EXISTS "attempt_count" numeric DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS "lease_token_hash" varchar,
      ADD COLUMN IF NOT EXISTS "lease_expires_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "last_attempt_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "processed_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "outcome_code" varchar,
      ADD COLUMN IF NOT EXISTS "last_error_code" varchar;

    ALTER TABLE IF EXISTS "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "commerce_commands_id" uuid;

    DO $$ BEGIN
      IF to_regclass('public.payload_locked_documents_rels') IS NOT NULL THEN
        ALTER TABLE "payload_locked_documents_rels"
          ADD CONSTRAINT "payload_locked_documents_rels_commerce_commands_fk"
          FOREIGN KEY ("commerce_commands_id") REFERENCES "public"."commerce_commands"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "commerce_commands_command_key_idx"
      ON "commerce_commands" USING btree ("command_key");
    CREATE UNIQUE INDEX IF NOT EXISTS "commerce_commands_business_key_idx"
      ON "commerce_commands" USING btree ("business_key");
    CREATE INDEX IF NOT EXISTS "commerce_commands_status_idx"
      ON "commerce_commands" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "commerce_commands_lease_expires_at_idx"
      ON "commerce_commands" USING btree ("lease_expires_at");
    CREATE INDEX IF NOT EXISTS "commerce_commands_resource_type_idx"
      ON "commerce_commands" USING btree ("resource_type");
    CREATE INDEX IF NOT EXISTS "commerce_commands_resource_id_idx"
      ON "commerce_commands" USING btree ("resource_id");
    CREATE INDEX IF NOT EXISTS "commerce_commands_completed_at_idx"
      ON "commerce_commands" USING btree ("completed_at");
    CREATE INDEX IF NOT EXISTS "commerce_commands_updated_at_idx"
      ON "commerce_commands" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "commerce_commands_created_at_idx"
      ON "commerce_commands" USING btree ("created_at");
    DO $$ BEGIN
      IF to_regclass('public.commerce_provider_events') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS "commerce_provider_events_payload_hash_idx"
          ON "commerce_provider_events" USING btree ("payload_hash");
        CREATE INDEX IF NOT EXISTS "commerce_provider_events_processing_status_idx"
          ON "commerce_provider_events" USING btree ("processing_status");
        CREATE INDEX IF NOT EXISTS "commerce_provider_events_lease_expires_at_idx"
          ON "commerce_provider_events" USING btree ("lease_expires_at");
        CREATE INDEX IF NOT EXISTS "commerce_provider_events_last_attempt_at_idx"
          ON "commerce_provider_events" USING btree ("last_attempt_at");
        CREATE INDEX IF NOT EXISTS "commerce_provider_events_processed_at_idx"
          ON "commerce_provider_events" USING btree ("processed_at");
        CREATE INDEX IF NOT EXISTS "commerce_provider_events_outcome_code_idx"
          ON "commerce_provider_events" USING btree ("outcome_code");
        CREATE INDEX IF NOT EXISTS "commerce_provider_events_last_error_code_idx"
          ON "commerce_provider_events" USING btree ("last_error_code");
      END IF;
      IF to_regclass('public.payload_locked_documents_rels') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_commerce_commands_id_idx"
          ON "payload_locked_documents_rels" USING btree ("commerce_commands_id");
      END IF;
    END $$;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_commerce_commands_fk";

    DROP INDEX IF EXISTS "payload_locked_documents_rels_commerce_commands_id_idx";
    DROP INDEX IF EXISTS "commerce_provider_events_payload_hash_idx";
    DROP INDEX IF EXISTS "commerce_provider_events_processing_status_idx";
    DROP INDEX IF EXISTS "commerce_provider_events_lease_expires_at_idx";
    DROP INDEX IF EXISTS "commerce_provider_events_last_attempt_at_idx";
    DROP INDEX IF EXISTS "commerce_provider_events_processed_at_idx";
    DROP INDEX IF EXISTS "commerce_provider_events_outcome_code_idx";
    DROP INDEX IF EXISTS "commerce_provider_events_last_error_code_idx";

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'commerce_provider_events'
          AND column_name = 'payment_ref'
      ) THEN
        UPDATE "commerce_provider_events"
          SET "payment_ref" = 'missing:' || "event_key"
          WHERE "payment_ref" IS NULL;
        ALTER TABLE "commerce_provider_events"
          ALTER COLUMN "payment_ref" SET NOT NULL;
      END IF;
    END $$;

    ALTER TABLE IF EXISTS "commerce_provider_events"
      DROP COLUMN IF EXISTS "payload_hash",
      DROP COLUMN IF EXISTS "processing_status",
      DROP COLUMN IF EXISTS "attempt_count",
      DROP COLUMN IF EXISTS "lease_token_hash",
      DROP COLUMN IF EXISTS "lease_expires_at",
      DROP COLUMN IF EXISTS "last_attempt_at",
      DROP COLUMN IF EXISTS "processed_at",
      DROP COLUMN IF EXISTS "outcome_code",
      DROP COLUMN IF EXISTS "last_error_code";

    ALTER TABLE IF EXISTS "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "commerce_commands_id";

    DROP TABLE IF EXISTS "commerce_commands" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_commerce_commands_status";
    DROP TYPE IF EXISTS "public"."enum_commerce_provider_events_processing_status";
  `);
}
