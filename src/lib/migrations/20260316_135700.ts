import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "header" DROP CONSTRAINT "header_radio_id_playlists_id_fk";
  
  DROP INDEX "header_radio_idx";
  ALTER TABLE "header" DROP COLUMN "radio_id";`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "header" ADD COLUMN "radio_id" uuid;
  ALTER TABLE "header" ADD CONSTRAINT "header_radio_id_playlists_id_fk" FOREIGN KEY ("radio_id") REFERENCES "public"."playlists"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "header_radio_idx" ON "header" USING btree ("radio_id");`);
}
