import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_rels" ADD COLUMN "tracks_id" uuid;
  ALTER TABLE "search_rels" ADD COLUMN "playlists_id" uuid;
  ALTER TABLE "search_rels" ADD COLUMN "albums_id" uuid;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_tracks_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_playlists_fk" FOREIGN KEY ("playlists_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_albums_fk" FOREIGN KEY ("albums_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "search_rels_tracks_id_idx" ON "search_rels" USING btree ("tracks_id");
  CREATE INDEX "search_rels_playlists_id_idx" ON "search_rels" USING btree ("playlists_id");
  CREATE INDEX "search_rels_albums_id_idx" ON "search_rels" USING btree ("albums_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_tracks_fk";
  
  ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_playlists_fk";
  
  ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_albums_fk";
  
  DROP INDEX "search_rels_tracks_id_idx";
  DROP INDEX "search_rels_playlists_id_idx";
  DROP INDEX "search_rels_albums_id_idx";
  ALTER TABLE "search_rels" DROP COLUMN "tracks_id";
  ALTER TABLE "search_rels" DROP COLUMN "playlists_id";
  ALTER TABLE "search_rels" DROP COLUMN "albums_id";`);
}
