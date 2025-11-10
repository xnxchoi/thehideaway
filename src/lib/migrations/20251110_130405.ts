import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload_kv" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  ALTER TABLE "sessions" RENAME COLUMN "impersonated_by_id" TO "impersonated_by";
  ALTER TABLE "sessions" RENAME COLUMN "active_organization_id_id" TO "active_organization_id";
  ALTER TABLE "sessions" DROP CONSTRAINT "sessions_impersonated_by_id_users_id_fk";
  
  ALTER TABLE "sessions" DROP CONSTRAINT "sessions_active_organization_id_id_organizations_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_media_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tags_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_user_media_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_delta_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_profile_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_albums_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tracks_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_playlists_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_follows_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_citations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payload_jobs_fk";
  
  DROP INDEX "sessions_impersonated_by_idx";
  DROP INDEX "sessions_active_organization_id_idx";
  DROP INDEX "exports_texts_order_parent_idx";
  DROP INDEX "payload_locked_documents_rels_media_id_idx";
  DROP INDEX "payload_locked_documents_rels_tags_id_idx";
  DROP INDEX "payload_locked_documents_rels_user_media_id_idx";
  DROP INDEX "payload_locked_documents_rels_delta_id_idx";
  DROP INDEX "payload_locked_documents_rels_profile_id_idx";
  DROP INDEX "payload_locked_documents_rels_albums_id_idx";
  DROP INDEX "payload_locked_documents_rels_tracks_id_idx";
  DROP INDEX "payload_locked_documents_rels_playlists_id_idx";
  DROP INDEX "payload_locked_documents_rels_follows_id_idx";
  DROP INDEX "payload_locked_documents_rels_citations_id_idx";
  DROP INDEX "payload_locked_documents_rels_payload_jobs_id_idx";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE varchar;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'author';
  ALTER TABLE "_users_v" ALTER COLUMN "version_role" SET DATA TYPE varchar;
  ALTER TABLE "_users_v" ALTER COLUMN "version_role" SET DEFAULT 'author';
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "exports_texts_order_parent" ON "exports_texts" USING btree ("order","parent_id");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "media_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tags_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "user_media_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "delta_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "profile_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "albums_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tracks_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "playlists_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "follows_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "citations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payload_jobs_id";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum__users_v_version_role";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'author', 'editor', 'user', 'patron');
  CREATE TYPE "public"."enum__users_v_version_role" AS ENUM('admin', 'author', 'editor', 'user', 'patron');
  ALTER TABLE "payload_kv" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload_kv" CASCADE;
  ALTER TABLE "sessions" RENAME COLUMN "active_organization_id" TO "impersonated_by_id";
  DROP INDEX "exports_texts_order_parent";
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'author'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  ALTER TABLE "_users_v" ALTER COLUMN "version_role" SET DEFAULT 'author'::"public"."enum__users_v_version_role";
  ALTER TABLE "_users_v" ALTER COLUMN "version_role" SET DATA TYPE "public"."enum__users_v_version_role" USING "version_role"::"public"."enum__users_v_version_role";
  ALTER TABLE "sessions" ADD COLUMN "active_organization_id_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "media_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tags_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "user_media_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "delta_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "profile_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "albums_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tracks_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "playlists_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "follows_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "citations_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payload_jobs_id" uuid;
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_impersonated_by_id_users_id_fk" FOREIGN KEY ("impersonated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_active_organization_id_id_organizations_id_fk" FOREIGN KEY ("active_organization_id_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_user_media_fk" FOREIGN KEY ("user_media_id") REFERENCES "public"."user_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_delta_fk" FOREIGN KEY ("delta_id") REFERENCES "public"."delta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_profile_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_albums_fk" FOREIGN KEY ("albums_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tracks_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_playlists_fk" FOREIGN KEY ("playlists_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_follows_fk" FOREIGN KEY ("follows_id") REFERENCES "public"."follows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_citations_fk" FOREIGN KEY ("citations_id") REFERENCES "public"."citations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_jobs_fk" FOREIGN KEY ("payload_jobs_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "sessions_impersonated_by_idx" ON "sessions" USING btree ("impersonated_by_id");
  CREATE INDEX "sessions_active_organization_id_idx" ON "sessions" USING btree ("active_organization_id_id");
  CREATE INDEX "exports_texts_order_parent_idx" ON "exports_texts" USING btree ("order","parent_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_user_media_id_idx" ON "payload_locked_documents_rels" USING btree ("user_media_id");
  CREATE INDEX "payload_locked_documents_rels_delta_id_idx" ON "payload_locked_documents_rels" USING btree ("delta_id");
  CREATE INDEX "payload_locked_documents_rels_profile_id_idx" ON "payload_locked_documents_rels" USING btree ("profile_id");
  CREATE INDEX "payload_locked_documents_rels_albums_id_idx" ON "payload_locked_documents_rels" USING btree ("albums_id");
  CREATE INDEX "payload_locked_documents_rels_tracks_id_idx" ON "payload_locked_documents_rels" USING btree ("tracks_id");
  CREATE INDEX "payload_locked_documents_rels_playlists_id_idx" ON "payload_locked_documents_rels" USING btree ("playlists_id");
  CREATE INDEX "payload_locked_documents_rels_follows_id_idx" ON "payload_locked_documents_rels" USING btree ("follows_id");
  CREATE INDEX "payload_locked_documents_rels_citations_id_idx" ON "payload_locked_documents_rels" USING btree ("citations_id");
  CREATE INDEX "payload_locked_documents_rels_payload_jobs_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_jobs_id");
  ALTER TABLE "sessions" DROP COLUMN "impersonated_by";`)
}
