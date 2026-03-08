import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_image_block" ALTER COLUMN "span" SET DEFAULT 760;
  ALTER TABLE "_pages_v_blocks_image_block" ALTER COLUMN "span" SET DEFAULT 760;`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_image_block" ALTER COLUMN "span" SET DEFAULT 100;
  ALTER TABLE "_pages_v_blocks_image_block" ALTER COLUMN "span" SET DEFAULT 100;`);
}
