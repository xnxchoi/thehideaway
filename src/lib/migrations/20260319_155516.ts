import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ALTER COLUMN "first_name" DROP DEFAULT;
  ALTER TABLE "users" ALTER COLUMN "last_name" DROP DEFAULT;
  ALTER TABLE "_users_v" ALTER COLUMN "version_first_name" DROP DEFAULT;
  ALTER TABLE "_users_v" ALTER COLUMN "version_last_name" DROP DEFAULT;`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ALTER COLUMN "first_name" SET DEFAULT 'First And';
  ALTER TABLE "users" ALTER COLUMN "last_name" SET DEFAULT 'The Last';
  ALTER TABLE "_users_v" ALTER COLUMN "version_first_name" SET DEFAULT 'First And';
  ALTER TABLE "_users_v" ALTER COLUMN "version_last_name" SET DEFAULT 'The Last';`);
}
