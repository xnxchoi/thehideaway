import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ALTER COLUMN "alt" SET DEFAULT 'an image';
  ALTER TABLE "_media_v" ALTER COLUMN "version_alt" SET DEFAULT 'an image';
  ALTER TABLE "assets" ADD COLUMN "blur_data_url" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ALTER COLUMN "alt" DROP DEFAULT;
  ALTER TABLE "_media_v" ALTER COLUMN "version_alt" DROP DEFAULT;
  ALTER TABLE "assets" DROP COLUMN "blur_data_url";`)
}
