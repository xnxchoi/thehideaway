import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_media_source_provider" AS ENUM('unsplash', 'hideaway');
  CREATE TYPE "public"."enum_user_media_source_provider" AS ENUM('unsplash', 'hideaway');
  ALTER TABLE "media" ADD COLUMN "source_provider" "enum_media_source_provider" DEFAULT 'hideaway' NOT NULL;
  ALTER TABLE "media" ADD COLUMN "source_source_id" varchar;
  ALTER TABLE "user_media" ADD COLUMN "source_provider" "enum_user_media_source_provider" DEFAULT 'hideaway' NOT NULL;
  ALTER TABLE "user_media" ADD COLUMN "source_source_id" varchar;`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DROP COLUMN "source_provider";
  ALTER TABLE "media" DROP COLUMN "source_source_id";
  ALTER TABLE "user_media" DROP COLUMN "source_provider";
  ALTER TABLE "user_media" DROP COLUMN "source_source_id";
  DROP TYPE "public"."enum_media_source_provider";
  DROP TYPE "public"."enum_user_media_source_provider";`);
}
