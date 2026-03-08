import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_author" ALTER COLUMN "id" SET DATA TYPE uuid;
  ALTER TABLE "search_author" ALTER COLUMN "id" SET DEFAULT uuidv7();
  ALTER TABLE "search_allow_list" ALTER COLUMN "id" SET DATA TYPE uuid;
  ALTER TABLE "search_allow_list" ALTER COLUMN "id" SET DEFAULT uuidv7();`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_author" ALTER COLUMN "id" SET DATA TYPE varchar(24);
  ALTER TABLE "search_author" ALTER COLUMN "id" DROP DEFAULT;
  ALTER TABLE "search_allow_list" ALTER COLUMN "id" SET DATA TYPE varchar(24);
  ALTER TABLE "search_allow_list" ALTER COLUMN "id" DROP DEFAULT;`);
}
