import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_compilations_visibility" AS ENUM('public', 'private');
  ALTER TABLE "compilations_rels" DROP CONSTRAINT "compilations_rels_assets_fk";
  
  ALTER TABLE "compilations_rels" DROP CONSTRAINT "compilations_rels_media_fk";
  
  DROP INDEX "compilations_rels_assets_id_idx";
  DROP INDEX "compilations_rels_media_id_idx";
  ALTER TABLE "compilations" ADD COLUMN "hash_id" varchar(11) DEFAULT nanoid(11) NOT NULL;
  ALTER TABLE "compilations" ADD COLUMN "description" varchar;
  ALTER TABLE "compilations" ADD COLUMN "author_id" uuid NOT NULL;
  ALTER TABLE "compilations" ADD COLUMN "visibility" "enum_compilations_visibility" DEFAULT 'private' NOT NULL;
  ALTER TABLE "compilations" ADD COLUMN "cover_image_id" uuid;
  ALTER TABLE "compilations_rels" ADD COLUMN "posts_id" uuid;
  ALTER TABLE "compilations_rels" ADD COLUMN "surf_id" uuid;
  ALTER TABLE "compilations_rels" ADD COLUMN "profile_id" uuid;
  ALTER TABLE "compilations_rels" ADD COLUMN "albums_id" uuid;
  ALTER TABLE "compilations_rels" ADD COLUMN "playlists_id" uuid;
  ALTER TABLE "compilations_rels" ADD COLUMN "tracks_id" uuid;
  ALTER TABLE "compilations_rels" ADD COLUMN "user_media_id" uuid;
  ALTER TABLE "compilations" ADD CONSTRAINT "compilations_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "compilations" ADD CONSTRAINT "compilations_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "compilations_rels" ADD CONSTRAINT "compilations_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "compilations_rels" ADD CONSTRAINT "compilations_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "compilations_rels" ADD CONSTRAINT "compilations_rels_profile_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "compilations_rels" ADD CONSTRAINT "compilations_rels_albums_fk" FOREIGN KEY ("albums_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "compilations_rels" ADD CONSTRAINT "compilations_rels_playlists_fk" FOREIGN KEY ("playlists_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "compilations_rels" ADD CONSTRAINT "compilations_rels_tracks_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "compilations_rels" ADD CONSTRAINT "compilations_rels_user_media_fk" FOREIGN KEY ("user_media_id") REFERENCES "public"."user_media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "compilations_hash_id_idx" ON "compilations" USING btree ("hash_id");
  CREATE INDEX "compilations_author_idx" ON "compilations" USING btree ("author_id");
  CREATE INDEX "compilations_cover_image_idx" ON "compilations" USING btree ("cover_image_id");
  CREATE INDEX "compilations_rels_posts_id_idx" ON "compilations_rels" USING btree ("posts_id");
  CREATE INDEX "compilations_rels_surf_id_idx" ON "compilations_rels" USING btree ("surf_id");
  CREATE INDEX "compilations_rels_profile_id_idx" ON "compilations_rels" USING btree ("profile_id");
  CREATE INDEX "compilations_rels_albums_id_idx" ON "compilations_rels" USING btree ("albums_id");
  CREATE INDEX "compilations_rels_playlists_id_idx" ON "compilations_rels" USING btree ("playlists_id");
  CREATE INDEX "compilations_rels_tracks_id_idx" ON "compilations_rels" USING btree ("tracks_id");
  CREATE INDEX "compilations_rels_user_media_id_idx" ON "compilations_rels" USING btree ("user_media_id");
  ALTER TABLE "compilations" DROP COLUMN "image_picker";
  ALTER TABLE "compilations_rels" DROP COLUMN "assets_id";
  ALTER TABLE "compilations_rels" DROP COLUMN "media_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "compilations" DROP CONSTRAINT "compilations_author_id_users_id_fk";
  
  ALTER TABLE "compilations" DROP CONSTRAINT "compilations_cover_image_id_media_id_fk";
  
  ALTER TABLE "compilations_rels" DROP CONSTRAINT "compilations_rels_posts_fk";
  
  ALTER TABLE "compilations_rels" DROP CONSTRAINT "compilations_rels_surf_fk";
  
  ALTER TABLE "compilations_rels" DROP CONSTRAINT "compilations_rels_profile_fk";
  
  ALTER TABLE "compilations_rels" DROP CONSTRAINT "compilations_rels_albums_fk";
  
  ALTER TABLE "compilations_rels" DROP CONSTRAINT "compilations_rels_playlists_fk";
  
  ALTER TABLE "compilations_rels" DROP CONSTRAINT "compilations_rels_tracks_fk";
  
  ALTER TABLE "compilations_rels" DROP CONSTRAINT "compilations_rels_user_media_fk";
  
  DROP INDEX "compilations_hash_id_idx";
  DROP INDEX "compilations_author_idx";
  DROP INDEX "compilations_cover_image_idx";
  DROP INDEX "compilations_rels_posts_id_idx";
  DROP INDEX "compilations_rels_surf_id_idx";
  DROP INDEX "compilations_rels_profile_id_idx";
  DROP INDEX "compilations_rels_albums_id_idx";
  DROP INDEX "compilations_rels_playlists_id_idx";
  DROP INDEX "compilations_rels_tracks_id_idx";
  DROP INDEX "compilations_rels_user_media_id_idx";
  ALTER TABLE "compilations" ADD COLUMN "image_picker" boolean DEFAULT true NOT NULL;
  ALTER TABLE "compilations_rels" ADD COLUMN "assets_id" uuid;
  ALTER TABLE "compilations_rels" ADD COLUMN "media_id" uuid;
  ALTER TABLE "compilations_rels" ADD CONSTRAINT "compilations_rels_assets_fk" FOREIGN KEY ("assets_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "compilations_rels" ADD CONSTRAINT "compilations_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "compilations_rels_assets_id_idx" ON "compilations_rels" USING btree ("assets_id");
  CREATE INDEX "compilations_rels_media_id_idx" ON "compilations_rels" USING btree ("media_id");
  ALTER TABLE "compilations" DROP COLUMN "hash_id";
  ALTER TABLE "compilations" DROP COLUMN "description";
  ALTER TABLE "compilations" DROP COLUMN "author_id";
  ALTER TABLE "compilations" DROP COLUMN "visibility";
  ALTER TABLE "compilations" DROP COLUMN "cover_image_id";
  ALTER TABLE "compilations_rels" DROP COLUMN "posts_id";
  ALTER TABLE "compilations_rels" DROP COLUMN "surf_id";
  ALTER TABLE "compilations_rels" DROP COLUMN "profile_id";
  ALTER TABLE "compilations_rels" DROP COLUMN "albums_id";
  ALTER TABLE "compilations_rels" DROP COLUMN "playlists_id";
  ALTER TABLE "compilations_rels" DROP COLUMN "tracks_id";
  ALTER TABLE "compilations_rels" DROP COLUMN "user_media_id";
  DROP TYPE "public"."enum_compilations_visibility";`)
}
