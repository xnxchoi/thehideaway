import {
  type MigrateUpArgs,
  type MigrateDownArgs,
  sql
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_commerce_commands_status" AS ENUM('in_progress', 'succeeded');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  CREATE TABLE IF NOT EXISTS "commerce_commands" (
    "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
    "actor_id" uuid,
    "operation" varchar,
    "target_type" varchar,
    "target_id" uuid,
    "reason_code" varchar,
    "audit_source" varchar,
    "command_key" varchar NOT NULL,
    "business_key" varchar NOT NULL,
    "request_hash" varchar NOT NULL,
    "status" "enum_commerce_commands_status" DEFAULT 'in_progress' NOT NULL,
    "attempt_count" numeric DEFAULT 1 NOT NULL,
    "lease_token_hash" varchar,
    "lease_expires_at" timestamp(3) with time zone,
    "safe_response" jsonb,
    "resource_type" varchar,
    "resource_id" uuid,
    "completed_at" timestamp(3) with time zone,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "commerce_commands_id" uuid;
  CREATE INDEX IF NOT EXISTS "commerce_commands_actor_id_idx" ON "commerce_commands" USING btree ("actor_id");
  CREATE INDEX IF NOT EXISTS "commerce_commands_operation_idx" ON "commerce_commands" USING btree ("operation");
  CREATE INDEX IF NOT EXISTS "commerce_commands_target_type_idx" ON "commerce_commands" USING btree ("target_type");
  CREATE INDEX IF NOT EXISTS "commerce_commands_target_id_idx" ON "commerce_commands" USING btree ("target_id");
  CREATE INDEX IF NOT EXISTS "commerce_commands_reason_code_idx" ON "commerce_commands" USING btree ("reason_code");
  CREATE INDEX IF NOT EXISTS "commerce_commands_audit_source_idx" ON "commerce_commands" USING btree ("audit_source");
  CREATE UNIQUE INDEX IF NOT EXISTS "commerce_commands_command_key_idx" ON "commerce_commands" USING btree ("command_key");
  CREATE UNIQUE INDEX IF NOT EXISTS "commerce_commands_business_key_idx" ON "commerce_commands" USING btree ("business_key");
  CREATE INDEX IF NOT EXISTS "commerce_commands_status_idx" ON "commerce_commands" USING btree ("status");
  CREATE INDEX IF NOT EXISTS "commerce_commands_lease_expires_at_idx" ON "commerce_commands" USING btree ("lease_expires_at");
  CREATE INDEX IF NOT EXISTS "commerce_commands_resource_type_idx" ON "commerce_commands" USING btree ("resource_type");
  CREATE INDEX IF NOT EXISTS "commerce_commands_resource_id_idx" ON "commerce_commands" USING btree ("resource_id");
  CREATE INDEX IF NOT EXISTS "commerce_commands_completed_at_idx" ON "commerce_commands" USING btree ("completed_at");
  CREATE INDEX IF NOT EXISTS "commerce_commands_updated_at_idx" ON "commerce_commands" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "commerce_commands_created_at_idx" ON "commerce_commands" USING btree ("created_at");
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_commerce_commands_fk' AND conrelid = 'public.payload_locked_documents_rels'::regclass) THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_commerce_commands_fk" FOREIGN KEY ("commerce_commands_id") REFERENCES "public"."commerce_commands"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_commerce_commands_id_idx" ON "payload_locked_documents_rels" USING btree ("commerce_commands_id");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_commerce_commands_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_commerce_commands_id_idx";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "commerce_commands_id";
  DROP TABLE IF EXISTS "commerce_commands";
  DROP TYPE IF EXISTS "public"."enum_commerce_commands_status";`);
}
