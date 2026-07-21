import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "product_variants"
     ADD COLUMN IF NOT EXISTS "identity_locked" boolean DEFAULT false NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "product_variants"
     DROP COLUMN IF EXISTS "identity_locked";`)
}
