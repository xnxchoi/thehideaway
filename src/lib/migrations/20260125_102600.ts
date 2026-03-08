import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "search_tagged" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"key" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL
  );
  
  ALTER TABLE "search_tagged" ADD CONSTRAINT "search_tagged_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "search_tagged_order_idx" ON "search_tagged" USING btree ("_order");
  CREATE INDEX "search_tagged_parent_id_idx" ON "search_tagged" USING btree ("_parent_id");
  CREATE INDEX "search_tagged_key_idx" ON "search_tagged" USING btree ("key");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "search_tagged" CASCADE;`);
}
