import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   
  ALTER TABLE "posts" ADD COLUMN "cover_position" numeric DEFAULT 35;
  ALTER TABLE "_posts_v" ADD COLUMN "version_cover_position" numeric DEFAULT 35;`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
 ALTER TABLE "posts" DROP COLUMN "cover_position";
  ALTER TABLE "_posts_v" DROP COLUMN "version_cover_position";`);
}
