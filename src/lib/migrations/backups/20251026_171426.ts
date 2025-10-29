import {MigrateDownArgs, MigrateUpArgs, sql} from "@payloadcms/db-postgres";

export async function up({db, payload, req}: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
    DROP TYPE "public"."enum_media_source_provider";
   CREATE TYPE "public"."enum_assets_source_provider" AS ENUM('unsplash', 'local');
  ALTER TABLE "media" RENAME COLUMN "source_source_id" TO "source_identifier";
  ALTER TABLE "media" ALTER COLUMN "source_provider" SET DATA TYPE text;
  ALTER TABLE "media" ALTER COLUMN "source_provider" SET DEFAULT 'local'::text;
  CREATE TYPE "public"."enum_media_source_provider" AS ENUM('unsplash', 'local');
  ALTER TABLE "media" ALTER COLUMN "source_provider" SET DEFAULT 'local'::"public"."enum_media_source_provider";
  ALTER TABLE "media" ALTER COLUMN "source_provider" SET DATA TYPE "public"."enum_media_source_provider" USING "source_provider"::"public"."enum_media_source_provider";
  ALTER TABLE "assets" ADD COLUMN "source_identifier" varchar NOT NULL;
  ALTER TABLE "assets" ADD COLUMN "source_link" varchar;
  ALTER TABLE "assets" ADD COLUMN "source_provider" "enum_assets_source_provider" DEFAULT 'local' NOT NULL;
  ALTER TABLE "media" ADD COLUMN "source_link" varchar;`);
}

export async function down({
	db, payload, req
}: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
   ALTER TABLE "media" ALTER COLUMN "source_provider" SET DATA TYPE text;
  ALTER TABLE "media" ALTER COLUMN "source_provider" SET DEFAULT 'hideaway'::text;
  DROP TYPE "public"."enum_media_source_provider";
  CREATE TYPE "public"."enum_media_source_provider" AS ENUM('unsplash', 'hideaway');
  ALTER TABLE "media" ALTER COLUMN "source_provider" SET DEFAULT 'hideaway'::"public"."enum_media_source_provider";
  ALTER TABLE "media" ALTER COLUMN "source_provider" SET DATA TYPE "public"."enum_media_source_provider" USING "source_provider"::"public"."enum_media_source_provider";
  ALTER TABLE "media" ADD COLUMN "source_source_id" uuid NOT NULL;
  ALTER TABLE "assets" DROP COLUMN "source_identifier";
  ALTER TABLE "assets" DROP COLUMN "source_link";
  ALTER TABLE "assets" DROP COLUMN "source_provider";
  ALTER TABLE "media" DROP COLUMN "source_identifier";
  ALTER TABLE "media" DROP COLUMN "source_link";
  DROP TYPE "public"."enum_assets_source_provider";`);
}
