import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "delta" ADD COLUMN "rich_title" jsonb;
  ALTER TABLE "_delta_v" ADD COLUMN "version_rich_title" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "delta" DROP COLUMN "rich_title";
  ALTER TABLE "_delta_v" DROP COLUMN "version_rich_title";`)
}
