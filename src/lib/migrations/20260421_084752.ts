import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_categories_identity_accent" AS ENUM('none', 'red', 'amber', 'citrus', 'moss', 'cobalt', 'violet', 'blush', 'ink');
  CREATE TYPE "public"."enum_categories_identity_layout" AS ENUM('left', 'right');
  ALTER TABLE "categories" ADD COLUMN "identity_accent" "enum_categories_identity_accent" DEFAULT 'none' NOT NULL;
  ALTER TABLE "categories" ADD COLUMN "identity_layout" "enum_categories_identity_layout" DEFAULT 'left' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" DROP COLUMN "identity_accent";
  ALTER TABLE "categories" DROP COLUMN "identity_layout";
  DROP TYPE "public"."enum_categories_identity_accent";
  DROP TYPE "public"."enum_categories_identity_layout";`)
}
