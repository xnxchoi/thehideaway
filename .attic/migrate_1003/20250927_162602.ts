import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "profile_rels" ADD COLUMN "tags_id" uuid;
  ALTER TABLE "_profile_v_rels" ADD COLUMN "tags_id" uuid;
  ALTER TABLE "profile_rels" ADD CONSTRAINT "profile_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_profile_v_rels" ADD CONSTRAINT "_profile_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "profile_rels_tags_id_idx" ON "profile_rels" USING btree ("tags_id");
  CREATE INDEX "_profile_v_rels_tags_id_idx" ON "_profile_v_rels" USING btree ("tags_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "profile_rels" DROP CONSTRAINT "profile_rels_tags_fk";
  
  ALTER TABLE "_profile_v_rels" DROP CONSTRAINT "_profile_v_rels_tags_fk";
  
  DROP INDEX "profile_rels_tags_id_idx";
  DROP INDEX "_profile_v_rels_tags_id_idx";
  ALTER TABLE "profile_rels" DROP COLUMN "tags_id";
  ALTER TABLE "_profile_v_rels" DROP COLUMN "tags_id";`)
}
