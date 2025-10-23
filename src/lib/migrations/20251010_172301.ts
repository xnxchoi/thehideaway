import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sessions" RENAME COLUMN "active_organization_id" TO "active_organization_id_id";
  ALTER TABLE "sessions" DROP CONSTRAINT "sessions_active_organization_id_organizations_id_fk";
  
  DROP INDEX "sessions_active_organization_idx";
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_active_organization_id_id_organizations_id_fk" FOREIGN KEY ("active_organization_id_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "sessions_active_organization_id_idx" ON "sessions" USING btree ("active_organization_id_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sessions" RENAME COLUMN "active_organization_id_id" TO "active_organization_id";
  ALTER TABLE "sessions" DROP CONSTRAINT "sessions_active_organization_id_id_organizations_id_fk";
  
  DROP INDEX "sessions_active_organization_id_idx";
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_active_organization_id_organizations_id_fk" FOREIGN KEY ("active_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "sessions_active_organization_idx" ON "sessions" USING btree ("active_organization_id");`)
}
