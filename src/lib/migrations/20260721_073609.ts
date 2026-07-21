import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-postgres";
import { sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_commerce_provider_events_provider" AS ENUM('portone');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "commerce_provider_events" (
      "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
      "dedupe_key" varchar NOT NULL,
      "provider" "enum_commerce_provider_events_provider" NOT NULL,
      "event_key" varchar NOT NULL,
      "event_type" varchar,
      "payment_ref" varchar NOT NULL,
      "provider_status" varchar,
      "transaction_ref" varchar,
      "product_payment_id" uuid,
      "occurred_at" timestamp(3) with time zone,
      "received_at" timestamp(3) with time zone NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "commerce_provider_events_id" uuid;

    DO $$ BEGIN
      ALTER TABLE "commerce_provider_events"
        ADD CONSTRAINT "commerce_provider_events_product_payment_id_product_payments_id_fk"
        FOREIGN KEY ("product_payment_id") REFERENCES "public"."product_payments"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_commerce_provider_events_fk"
        FOREIGN KEY ("commerce_provider_events_id") REFERENCES "public"."commerce_provider_events"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "commerce_provider_events_dedupe_key_idx"
      ON "commerce_provider_events" USING btree ("dedupe_key");
    CREATE INDEX IF NOT EXISTS "commerce_provider_events_provider_idx"
      ON "commerce_provider_events" USING btree ("provider");
    CREATE INDEX IF NOT EXISTS "commerce_provider_events_event_key_idx"
      ON "commerce_provider_events" USING btree ("event_key");
    CREATE INDEX IF NOT EXISTS "commerce_provider_events_event_type_idx"
      ON "commerce_provider_events" USING btree ("event_type");
    CREATE INDEX IF NOT EXISTS "commerce_provider_events_payment_ref_idx"
      ON "commerce_provider_events" USING btree ("payment_ref");
    CREATE INDEX IF NOT EXISTS "commerce_provider_events_provider_status_idx"
      ON "commerce_provider_events" USING btree ("provider_status");
    CREATE INDEX IF NOT EXISTS "commerce_provider_events_transaction_ref_idx"
      ON "commerce_provider_events" USING btree ("transaction_ref");
    CREATE INDEX IF NOT EXISTS "commerce_provider_events_product_payment_idx"
      ON "commerce_provider_events" USING btree ("product_payment_id");
    CREATE INDEX IF NOT EXISTS "commerce_provider_events_occurred_at_idx"
      ON "commerce_provider_events" USING btree ("occurred_at");
    CREATE INDEX IF NOT EXISTS "commerce_provider_events_received_at_idx"
      ON "commerce_provider_events" USING btree ("received_at");
    CREATE INDEX IF NOT EXISTS "commerce_provider_events_updated_at_idx"
      ON "commerce_provider_events" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "commerce_provider_events_created_at_idx"
      ON "commerce_provider_events" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_commerce_provider_events_i_idx"
      ON "payload_locked_documents_rels" USING btree ("commerce_provider_events_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_commerce_provider_events_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_commerce_provider_events_i_idx";
    ALTER TABLE IF EXISTS "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "commerce_provider_events_id";

    DROP TABLE IF EXISTS "commerce_provider_events" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_commerce_provider_events_provider";
  `);
}
