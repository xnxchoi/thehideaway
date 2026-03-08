import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "teams" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"name" varchar NOT NULL,
  	"organization_id" uuid NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "team_members" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"team_id" uuid NOT NULL,
  	"user_id" uuid NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "sessions" ADD COLUMN "active_team_id" uuid;
  ALTER TABLE "invitations" ADD COLUMN "team" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "teams_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "team_members_id" uuid;
  ALTER TABLE "teams" ADD CONSTRAINT "teams_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "teams_organization_idx" ON "teams" USING btree ("organization_id");
  CREATE INDEX "teams_created_at_idx" ON "teams" USING btree ("created_at");
  CREATE INDEX "teams_updated_at_idx" ON "teams" USING btree ("updated_at");
  CREATE INDEX "team_members_team_idx" ON "team_members" USING btree ("team_id");
  CREATE INDEX "team_members_user_idx" ON "team_members" USING btree ("user_id");
  CREATE INDEX "team_members_updated_at_idx" ON "team_members" USING btree ("updated_at");
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_active_team_id_teams_id_fk" FOREIGN KEY ("active_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_teams_fk" FOREIGN KEY ("teams_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "sessions_active_team_idx" ON "sessions" USING btree ("active_team_id");
  CREATE INDEX "invitations_team_idx" ON "invitations" USING btree ("team");
  CREATE INDEX "payload_locked_documents_rels_teams_id_idx" ON "payload_locked_documents_rels" USING btree ("teams_id");
  CREATE INDEX "payload_locked_documents_rels_team_members_id_idx" ON "payload_locked_documents_rels" USING btree ("team_members_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "teams" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "team_members" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "teams" CASCADE;
  DROP TABLE "team_members" CASCADE;
  ALTER TABLE "sessions" DROP CONSTRAINT "sessions_active_team_id_teams_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_teams_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_team_members_fk";
  
  DROP INDEX "sessions_active_team_idx";
  DROP INDEX "invitations_team_idx";
  DROP INDEX "payload_locked_documents_rels_teams_id_idx";
  DROP INDEX "payload_locked_documents_rels_team_members_id_idx";
  ALTER TABLE "sessions" DROP COLUMN "active_team_id";
  ALTER TABLE "invitations" DROP COLUMN "team";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "teams_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "team_members_id";`);
}
