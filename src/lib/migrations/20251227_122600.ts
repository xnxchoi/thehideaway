import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ex_media" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ex_media" CASCADE;
  ALTER TABLE "pages_rels" DROP CONSTRAINT IF EXISTS "pages_rels_ex_media_fk";
  
  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT IF EXISTS  "_pages_v_rels_ex_media_fk";
  
  ALTER TABLE "posts_rels" DROP CONSTRAINT IF EXISTS "posts_rels_ex_media_fk";
  
  ALTER TABLE "_posts_v_rels" DROP CONSTRAINT IF EXISTS "_posts_v_rels_ex_media_fk";
  
  ALTER TABLE "compilations_rels" DROP CONSTRAINT IF EXISTS "compilations_rels_ex_media_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_ex_media_fk";
  
  DROP INDEX  "pages_rels_ex_media_id_idx";
  DROP INDEX "_pages_v_rels_ex_media_id_idx";
  DROP INDEX "posts_rels_ex_media_id_idx";
  DROP INDEX "_posts_v_rels_ex_media_id_idx";
  DROP INDEX "compilations_rels_ex_media_id_idx";
  DROP INDEX "payload_locked_documents_rels_ex_media_id_idx";
  ALTER TABLE "posts_rels" ADD COLUMN "media_id" uuid;
  ALTER TABLE "_posts_v_rels" ADD COLUMN "media_id" uuid;
  ALTER TABLE "compilations_rels" ADD COLUMN "media_id" uuid;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "compilations_rels" ADD CONSTRAINT "compilations_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "posts_rels_media_id_idx" ON "posts_rels" USING btree ("media_id");
  CREATE INDEX "_posts_v_rels_media_id_idx" ON "_posts_v_rels" USING btree ("media_id");
  CREATE INDEX "compilations_rels_media_id_idx" ON "compilations_rels" USING btree ("media_id");
  ALTER TABLE "assets" DROP COLUMN "attribution_name";
  ALTER TABLE "assets" DROP COLUMN "attribution_link";
  ALTER TABLE "assets" DROP COLUMN "source_identifier";
  ALTER TABLE "assets" DROP COLUMN "source_link";
  ALTER TABLE "assets" DROP COLUMN "source_provider";
  ALTER TABLE "media" DROP COLUMN "attribution_name";
  ALTER TABLE "media" DROP COLUMN "attribution_link";
  ALTER TABLE "media" DROP COLUMN "source_identifier";
  ALTER TABLE "media" DROP COLUMN "source_link";
  ALTER TABLE "media" DROP COLUMN "source_provider";
  ALTER TABLE "pages_rels" DROP COLUMN "ex_media_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN "ex_media_id";
  ALTER TABLE "posts_rels" DROP COLUMN "ex_media_id";
  ALTER TABLE "_posts_v_rels" DROP COLUMN "ex_media_id";
  ALTER TABLE "user_media" DROP COLUMN "attribution_name";
  ALTER TABLE "user_media" DROP COLUMN "attribution_link";
  ALTER TABLE "user_media" DROP COLUMN "source_identifier";
  ALTER TABLE "user_media" DROP COLUMN "source_link";
  ALTER TABLE "user_media" DROP COLUMN "source_provider";
  ALTER TABLE "compilations_rels" DROP COLUMN "ex_media_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ex_media_id";
  DROP TYPE "public"."enum_assets_source_provider";
  DROP TYPE "public"."enum_media_source_provider";
  DROP TYPE "public"."enum_user_media_source_provider";`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_assets_source_provider" AS ENUM('local', 'unsplash', 'pexels');
  CREATE TYPE "public"."enum_media_source_provider" AS ENUM('local', 'unsplash', 'pexels');
  CREATE TYPE "public"."enum_user_media_source_provider" AS ENUM('local', 'unsplash', 'pexels');
  CREATE TABLE "ex_media" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"alt" varchar DEFAULT 'an image' NOT NULL,
  	"darkmode" boolean DEFAULT false NOT NULL,
  	"author_id" uuid NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_content_url" varchar,
  	"sizes_content_width" numeric,
  	"sizes_content_height" numeric,
  	"sizes_content_mime_type" varchar,
  	"sizes_content_filesize" numeric,
  	"sizes_content_filename" varchar,
  	"sizes_content_wide_url" varchar,
  	"sizes_content_wide_width" numeric,
  	"sizes_content_wide_height" numeric,
  	"sizes_content_wide_mime_type" varchar,
  	"sizes_content_wide_filesize" numeric,
  	"sizes_content_wide_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  ALTER TABLE "posts_rels" DROP CONSTRAINT "posts_rels_media_fk";
  
  ALTER TABLE "_posts_v_rels" DROP CONSTRAINT "_posts_v_rels_media_fk";
  
  ALTER TABLE "compilations_rels" DROP CONSTRAINT "compilations_rels_media_fk";
  
  DROP INDEX "posts_rels_media_id_idx";
  DROP INDEX "_posts_v_rels_media_id_idx";
  DROP INDEX "compilations_rels_media_id_idx";
  ALTER TABLE "assets" ADD COLUMN "attribution_name" varchar;
  ALTER TABLE "assets" ADD COLUMN "attribution_link" varchar;
  ALTER TABLE "assets" ADD COLUMN "source_identifier" varchar;
  ALTER TABLE "assets" ADD COLUMN "source_link" varchar;
  ALTER TABLE "assets" ADD COLUMN "source_provider" "enum_assets_source_provider" DEFAULT 'local' NOT NULL;
  ALTER TABLE "media" ADD COLUMN "attribution_name" varchar;
  ALTER TABLE "media" ADD COLUMN "attribution_link" varchar;
  ALTER TABLE "media" ADD COLUMN "source_identifier" varchar;
  ALTER TABLE "media" ADD COLUMN "source_link" varchar;
  ALTER TABLE "media" ADD COLUMN "source_provider" "enum_media_source_provider" DEFAULT 'local' NOT NULL;
  ALTER TABLE "pages_rels" ADD COLUMN "ex_media_id" uuid;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "ex_media_id" uuid;
  ALTER TABLE "posts_rels" ADD COLUMN "ex_media_id" uuid;
  ALTER TABLE "_posts_v_rels" ADD COLUMN "ex_media_id" uuid;
  ALTER TABLE "user_media" ADD COLUMN "attribution_name" varchar;
  ALTER TABLE "user_media" ADD COLUMN "attribution_link" varchar;
  ALTER TABLE "user_media" ADD COLUMN "source_identifier" varchar;
  ALTER TABLE "user_media" ADD COLUMN "source_link" varchar;
  ALTER TABLE "user_media" ADD COLUMN "source_provider" "enum_user_media_source_provider" DEFAULT 'local' NOT NULL;
  ALTER TABLE "compilations_rels" ADD COLUMN "ex_media_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ex_media_id" uuid;
  ALTER TABLE "ex_media" ADD CONSTRAINT "ex_media_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "ex_media_darkmode_idx" ON "ex_media" USING btree ("darkmode");
  CREATE INDEX "ex_media_author_idx" ON "ex_media" USING btree ("author_id");
  CREATE INDEX "ex_media_updated_at_idx" ON "ex_media" USING btree ("updated_at");
  CREATE INDEX "ex_media_created_at_idx" ON "ex_media" USING btree ("created_at");
  CREATE INDEX "ex_media_filename_idx" ON "ex_media" USING btree ("filename");
  CREATE INDEX "ex_media_sizes_thumb_sizes_thumb_filename_idx" ON "ex_media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "ex_media_sizes_card_sizes_card_filename_idx" ON "ex_media" USING btree ("sizes_card_filename");
  CREATE INDEX "ex_media_sizes_content_sizes_content_filename_idx" ON "ex_media" USING btree ("sizes_content_filename");
  CREATE INDEX "ex_media_sizes_content_wide_sizes_content_wide_filename_idx" ON "ex_media" USING btree ("sizes_content_wide_filename");
  CREATE INDEX "ex_media_sizes_hero_sizes_hero_filename_idx" ON "ex_media" USING btree ("sizes_hero_filename");
  CREATE INDEX "ex_media_sizes_og_sizes_og_filename_idx" ON "ex_media" USING btree ("sizes_og_filename");
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_ex_media_fk" FOREIGN KEY ("ex_media_id") REFERENCES "public"."ex_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_ex_media_fk" FOREIGN KEY ("ex_media_id") REFERENCES "public"."ex_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_ex_media_fk" FOREIGN KEY ("ex_media_id") REFERENCES "public"."ex_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_ex_media_fk" FOREIGN KEY ("ex_media_id") REFERENCES "public"."ex_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "compilations_rels" ADD CONSTRAINT "compilations_rels_ex_media_fk" FOREIGN KEY ("ex_media_id") REFERENCES "public"."ex_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ex_media_fk" FOREIGN KEY ("ex_media_id") REFERENCES "public"."ex_media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_rels_ex_media_id_idx" ON "pages_rels" USING btree ("ex_media_id");
  CREATE INDEX "_pages_v_rels_ex_media_id_idx" ON "_pages_v_rels" USING btree ("ex_media_id");
  CREATE INDEX "posts_rels_ex_media_id_idx" ON "posts_rels" USING btree ("ex_media_id");
  CREATE INDEX "_posts_v_rels_ex_media_id_idx" ON "_posts_v_rels" USING btree ("ex_media_id");
  CREATE INDEX "compilations_rels_ex_media_id_idx" ON "compilations_rels" USING btree ("ex_media_id");
  CREATE INDEX "payload_locked_documents_rels_ex_media_id_idx" ON "payload_locked_documents_rels" USING btree ("ex_media_id");
  ALTER TABLE "posts_rels" DROP COLUMN "media_id";
  ALTER TABLE "_posts_v_rels" DROP COLUMN "media_id";
  ALTER TABLE "compilations_rels" DROP COLUMN "media_id";`);
}
