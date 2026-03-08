import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_locales" ALTER COLUMN "title" SET DEFAULT '';
  ALTER TABLE "search_locales" ALTER COLUMN "title" SET NOT NULL;`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_locales" ALTER COLUMN "title" DROP DEFAULT;
  ALTER TABLE "search_locales" ALTER COLUMN "title" DROP NOT NULL;`);
}
