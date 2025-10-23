import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" ALTER COLUMN "comments_enabled" SET DEFAULT true;
  ALTER TABLE "_posts_v" ALTER COLUMN "version_comments_enabled" SET DEFAULT true;
  ALTER TABLE "delta" ALTER COLUMN "comments_enabled" SET DEFAULT true;
  ALTER TABLE "_delta_v" ALTER COLUMN "version_comments_enabled" SET DEFAULT true;
  ALTER TABLE "delta" ADD COLUMN "subtitle" varchar;
  ALTER TABLE "_delta_v" ADD COLUMN "version_subtitle" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" ALTER COLUMN "comments_enabled" DROP DEFAULT;
  ALTER TABLE "_posts_v" ALTER COLUMN "version_comments_enabled" DROP DEFAULT;
  ALTER TABLE "delta" ALTER COLUMN "comments_enabled" DROP DEFAULT;
  ALTER TABLE "_delta_v" ALTER COLUMN "version_comments_enabled" DROP DEFAULT;
  ALTER TABLE "delta" DROP COLUMN "subtitle";
  ALTER TABLE "_delta_v" DROP COLUMN "version_subtitle";`)
}
