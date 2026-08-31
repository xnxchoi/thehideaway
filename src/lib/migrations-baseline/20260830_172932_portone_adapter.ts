import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// WHY-OVERRIDE-PAYLOAD: generated CREATE/DROP/ALTER statements are wrapped
// with IF NOT EXISTS / IF EXISTS / duplicate_object guards so this file can
// be re-run. PortOne paymentId/transactionId are text refs (lis_…), not UUIDs;
// the generator emitted uuid columns and is corrected to varchar to match
// payload-generated-schema.ts. See readmes/MIGRATIONS.md.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_transactions_payment_method" AS ENUM('portone');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  ALTER TABLE IF EXISTS "transactions" ADD COLUMN IF NOT EXISTS "payment_method" "enum_transactions_payment_method";
  ALTER TABLE IF EXISTS "transactions" ADD COLUMN IF NOT EXISTS "portone_payment_id" varchar;
  ALTER TABLE IF EXISTS "transactions" ADD COLUMN IF NOT EXISTS "portone_transaction_id" varchar;
  ALTER TABLE IF EXISTS "transactions" ADD COLUMN IF NOT EXISTS "portone_channel" varchar;
  ALTER TABLE IF EXISTS "transactions" ADD COLUMN IF NOT EXISTS "portone_method" varchar;
  CREATE UNIQUE INDEX IF NOT EXISTS "transactions_portone_payment_id_idx" ON "transactions" USING btree ("portone_payment_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "transactions_portone_portone_payment_id_idx";
  DROP INDEX IF EXISTS "transactions_portone_payment_id_idx";
  ALTER TABLE IF EXISTS "transactions" DROP COLUMN IF EXISTS "payment_method";
  ALTER TABLE IF EXISTS "transactions" DROP COLUMN IF EXISTS "portone_payment_id";
  ALTER TABLE IF EXISTS "transactions" DROP COLUMN IF EXISTS "portone_transaction_id";
  ALTER TABLE IF EXISTS "transactions" DROP COLUMN IF EXISTS "portone_channel";
  ALTER TABLE IF EXISTS "transactions" DROP COLUMN IF EXISTS "portone_method";
  DROP TYPE IF EXISTS "public"."enum_transactions_payment_method";`)
}
