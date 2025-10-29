import {MigrateDownArgs, MigrateUpArgs, sql} from "@payloadcms/db-postgres";

export async function up({db, payload, req}: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
    ALTER TABLE "user_media" ALTER COLUMN "source_source_id" SET DATA TYPE varchar;
   ALTER TABLE "user_media" RENAME COLUMN "source_source_id" TO "source_identifier";
  ALTER TABLE "user_media" ALTER COLUMN "source_provider" SET DATA TYPE text;
  ALTER TABLE "user_media" ALTER COLUMN "source_provider" SET DEFAULT 'local'::text;
  DROP TYPE "public"."enum_user_media_source_provider";
  CREATE TYPE "public"."enum_user_media_source_provider" AS ENUM('unsplash', 'local');
  ALTER TABLE "user_media" ALTER COLUMN "source_provider" SET DEFAULT 'local'::"public"."enum_user_media_source_provider";
  ALTER TABLE "user_media" ALTER COLUMN "source_provider" SET DATA TYPE "public"."enum_user_media_source_provider" USING "source_provider"::"public"."enum_user_media_source_provider";
  ALTER TABLE "user_media" ADD COLUMN "source_link" varchar;`);
}

export async function down({
	db, payload, req
}: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
   ALTER TABLE "user_media" ALTER COLUMN "source_provider" SET DATA TYPE text;
  ALTER TABLE "user_media" ALTER COLUMN "source_provider" SET DEFAULT 'hideaway'::text;
  DROP TYPE "public"."enum_user_media_source_provider";
  CREATE TYPE "public"."enum_user_media_source_provider" AS ENUM('unsplash', 'hideaway');
  ALTER TABLE "user_media" ALTER COLUMN "source_provider" SET DEFAULT 'hideaway'::"public"."enum_user_media_source_provider";
  ALTER TABLE "user_media" ALTER COLUMN "source_provider" SET DATA TYPE "public"."enum_user_media_source_provider" USING "source_provider"::"public"."enum_user_media_source_provider";
  ALTER TABLE "user_media" ADD COLUMN "source_source_id" uuid NOT NULL;
  ALTER TABLE "user_media" DROP COLUMN "source_identifier";
  ALTER TABLE "user_media" DROP COLUMN "source_link";`);
}
