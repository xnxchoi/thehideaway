import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "bookmarks_rels" ADD COLUMN "albums_id" uuid;
  ALTER TABLE "bookmarks_rels" ADD COLUMN "playlists_id" uuid;
  ALTER TABLE "bookmarks_rels" ADD COLUMN "tracks_id" uuid;
  ALTER TABLE "bookmarks_rels" ADD COLUMN "user_media_id" uuid;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_albums_fk" FOREIGN KEY ("albums_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_playlists_fk" FOREIGN KEY ("playlists_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_tracks_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_user_media_fk" FOREIGN KEY ("user_media_id") REFERENCES "public"."user_media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "bookmarks_rels_albums_id_idx" ON "bookmarks_rels" USING btree ("albums_id");
  CREATE INDEX "bookmarks_rels_playlists_id_idx" ON "bookmarks_rels" USING btree ("playlists_id");
  CREATE INDEX "bookmarks_rels_tracks_id_idx" ON "bookmarks_rels" USING btree ("tracks_id");
  CREATE INDEX "bookmarks_rels_user_media_id_idx" ON "bookmarks_rels" USING btree ("user_media_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "bookmarks_rels" DROP CONSTRAINT "bookmarks_rels_albums_fk";
  
  ALTER TABLE "bookmarks_rels" DROP CONSTRAINT "bookmarks_rels_playlists_fk";
  
  ALTER TABLE "bookmarks_rels" DROP CONSTRAINT "bookmarks_rels_tracks_fk";
  
  ALTER TABLE "bookmarks_rels" DROP CONSTRAINT "bookmarks_rels_user_media_fk";
  
  DROP INDEX "bookmarks_rels_albums_id_idx";
  DROP INDEX "bookmarks_rels_playlists_id_idx";
  DROP INDEX "bookmarks_rels_tracks_id_idx";
  DROP INDEX "bookmarks_rels_user_media_id_idx";
  ALTER TABLE "bookmarks_rels" DROP COLUMN "albums_id";
  ALTER TABLE "bookmarks_rels" DROP COLUMN "playlists_id";
  ALTER TABLE "bookmarks_rels" DROP COLUMN "tracks_id";
  ALTER TABLE "bookmarks_rels" DROP COLUMN "user_media_id";`);
}
