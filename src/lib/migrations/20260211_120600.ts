import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_delta_source" AS ENUM('x', 'twitter', 'substack', 'Instagram', 'youtube');
  CREATE TYPE "public"."enum__delta_v_version_source" AS ENUM('x', 'twitter', 'substack', 'Instagram', 'youtube');
  ALTER TABLE "delta" ALTER COLUMN "source" SET DATA TYPE "public"."enum_delta_source" USING "source"::"public"."enum_delta_source";
  ALTER TABLE "_delta_v" ALTER COLUMN "version_source" SET DATA TYPE "public"."enum__delta_v_version_source" USING "version_source"::"public"."enum__delta_v_version_source";
  ALTER TABLE "exports" ALTER COLUMN "format" SET NOT NULL;
  ALTER TABLE "delta" DROP COLUMN "subtitle";
  ALTER TABLE "_delta_v" DROP COLUMN "version_subtitle";`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "delta" ALTER COLUMN "source" SET DATA TYPE varchar;
  ALTER TABLE "_delta_v" ALTER COLUMN "version_source" SET DATA TYPE varchar;
  ALTER TABLE "exports" ALTER COLUMN "format" DROP NOT NULL;
  ALTER TABLE "delta" ADD COLUMN "subtitle" varchar;
  ALTER TABLE "_delta_v" ADD COLUMN "version_subtitle" varchar;
  DROP TYPE "public"."enum_delta_source";
  DROP TYPE "public"."enum__delta_v_version_source";`);
}
