import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "bookmarks_rels" DROP CONSTRAINT "bookmarks_rels_users_fk";
  
  ALTER TABLE "bookmarks_rels" DROP CONSTRAINT "bookmarks_rels_albums_fk";
  
  ALTER TABLE "bookmarks_rels" DROP CONSTRAINT "bookmarks_rels_playlists_fk";
  
  ALTER TABLE "bookmarks_rels" DROP CONSTRAINT "bookmarks_rels_tracks_fk";
  
  ALTER TABLE "bookmarks_rels" DROP CONSTRAINT "bookmarks_rels_user_media_fk";
  
  DROP INDEX "bookmarks_rels_users_id_idx";
  DROP INDEX "bookmarks_rels_albums_id_idx";
  DROP INDEX "bookmarks_rels_playlists_id_idx";
  DROP INDEX "bookmarks_rels_tracks_id_idx";
  DROP INDEX "bookmarks_rels_user_media_id_idx";
  ALTER TABLE "users" ADD COLUMN "verified" boolean DEFAULT false;
  ALTER TABLE "_users_v" ADD COLUMN "version_verified" boolean DEFAULT false;
  ALTER TABLE "categories" ADD COLUMN "popularity" numeric DEFAULT 0 NOT NULL;
  CREATE INDEX "users_verified_idx" ON "users" USING btree ("verified");
  CREATE INDEX "_users_v_version_version_verified_idx" ON "_users_v" USING btree ("version_verified");
  CREATE INDEX "categories_popularity_idx" ON "categories" USING btree ("popularity");
  ALTER TABLE "bookmarks_rels" DROP COLUMN "users_id";
  ALTER TABLE "bookmarks_rels" DROP COLUMN "albums_id";
  ALTER TABLE "bookmarks_rels" DROP COLUMN "playlists_id";
  ALTER TABLE "bookmarks_rels" DROP COLUMN "tracks_id";
  ALTER TABLE "bookmarks_rels" DROP COLUMN "user_media_id";`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "users_verified_idx";
  DROP INDEX "_users_v_version_version_verified_idx";
  DROP INDEX "categories_popularity_idx";
  ALTER TABLE "bookmarks_rels" ADD COLUMN "users_id" uuid;
  ALTER TABLE "bookmarks_rels" ADD COLUMN "albums_id" uuid;
  ALTER TABLE "bookmarks_rels" ADD COLUMN "playlists_id" uuid;
  ALTER TABLE "bookmarks_rels" ADD COLUMN "tracks_id" uuid;
  ALTER TABLE "bookmarks_rels" ADD COLUMN "user_media_id" uuid;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_albums_fk" FOREIGN KEY ("albums_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_playlists_fk" FOREIGN KEY ("playlists_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_tracks_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_user_media_fk" FOREIGN KEY ("user_media_id") REFERENCES "public"."user_media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "bookmarks_rels_users_id_idx" ON "bookmarks_rels" USING btree ("users_id");
  CREATE INDEX "bookmarks_rels_albums_id_idx" ON "bookmarks_rels" USING btree ("albums_id");
  CREATE INDEX "bookmarks_rels_playlists_id_idx" ON "bookmarks_rels" USING btree ("playlists_id");
  CREATE INDEX "bookmarks_rels_tracks_id_idx" ON "bookmarks_rels" USING btree ("tracks_id");
  CREATE INDEX "bookmarks_rels_user_media_id_idx" ON "bookmarks_rels" USING btree ("user_media_id");
  ALTER TABLE "users" DROP COLUMN "verified";
  ALTER TABLE "_users_v" DROP COLUMN "version_verified";
  ALTER TABLE "categories" DROP COLUMN "popularity";`);
}
