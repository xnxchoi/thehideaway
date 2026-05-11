import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "payment_instructions" varchar;
  ALTER TABLE "events" DROP COLUMN IF EXISTS "toss_payment_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "toss_payment_id" uuid;
  ALTER TABLE "events" DROP COLUMN IF EXISTS "payment_instructions";`)
}
