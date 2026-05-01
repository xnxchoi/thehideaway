import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_events_exclusive_links_type" AS ENUM('link', 'form');
  CREATE TYPE "public"."enum_events_state" AS ENUM('draft', 'open', 'closed', 'ended');
  CREATE TYPE "public"."enum_tickets_status" AS ENUM('pending', 'active', 'used', 'canceled');
  CREATE TABLE "events_exclusive_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"type" "enum_events_exclusive_links_type" DEFAULT 'link' NOT NULL
  );
  
  CREATE TABLE "events" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone,
  	"location" varchar,
  	"gate_password" varchar NOT NULL,
  	"capacity" numeric DEFAULT 0,
  	"max_per_user" numeric DEFAULT 3 NOT NULL,
  	"ticket_price" numeric NOT NULL,
  	"toss_payment_id" uuid,
  	"state" "enum_events_state" DEFAULT 'draft' NOT NULL,
  	"image_id" uuid,
  	"exclusive_content" jsonb,
  	"goods_drop_enabled" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tickets" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"ticket_number" numeric,
  	"event_id" uuid NOT NULL,
  	"user_id" uuid,
  	"purchaser_id" uuid NOT NULL,
  	"status" "enum_tickets_status" DEFAULT 'pending' NOT NULL,
  	"paid" boolean DEFAULT false,
  	"paid_at" timestamp(3) with time zone,
  	"claim_token" varchar,
  	"claim_email" varchar,
  	"claimed_at" timestamp(3) with time zone,
  	"check_in_code" varchar,
  	"checked_in" boolean DEFAULT false,
  	"checked_in_at" timestamp(3) with time zone,
  	"checked_in_by_id" uuid,
  	"passkey_credential_id" uuid,
  	"delivery_address_recipient_name" varchar,
  	"delivery_address_address" varchar,
  	"delivery_address_phone" varchar,
  	"delivery_address_submitted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "events_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tickets_id" uuid;
  ALTER TABLE "events_exclusive_links" ADD CONSTRAINT "events_exclusive_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_purchaser_id_users_id_fk" FOREIGN KEY ("purchaser_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_checked_in_by_id_users_id_fk" FOREIGN KEY ("checked_in_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "events_exclusive_links_order_idx" ON "events_exclusive_links" USING btree ("_order");
  CREATE INDEX "events_exclusive_links_parent_id_idx" ON "events_exclusive_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "events_name_idx" ON "events" USING btree ("name");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_image_idx" ON "events" USING btree ("image_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE UNIQUE INDEX "tickets_ticket_number_idx" ON "tickets" USING btree ("ticket_number");
  CREATE INDEX "tickets_event_idx" ON "tickets" USING btree ("event_id");
  CREATE INDEX "tickets_user_idx" ON "tickets" USING btree ("user_id");
  CREATE INDEX "tickets_purchaser_idx" ON "tickets" USING btree ("purchaser_id");
  CREATE INDEX "tickets_status_idx" ON "tickets" USING btree ("status");
  CREATE UNIQUE INDEX "tickets_claim_token_idx" ON "tickets" USING btree ("claim_token");
  CREATE UNIQUE INDEX "tickets_check_in_code_idx" ON "tickets" USING btree ("check_in_code");
  CREATE INDEX "tickets_checked_in_idx" ON "tickets" USING btree ("checked_in");
  CREATE INDEX "tickets_checked_in_by_idx" ON "tickets" USING btree ("checked_in_by_id");
  CREATE INDEX "tickets_updated_at_idx" ON "tickets" USING btree ("updated_at");
  CREATE INDEX "tickets_created_at_idx" ON "tickets" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tickets_fk" FOREIGN KEY ("tickets_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_tickets_id_idx" ON "payload_locked_documents_rels" USING btree ("tickets_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events_exclusive_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tickets" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "events_exclusive_links" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "tickets" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tickets_fk";
  
  DROP INDEX "payload_locked_documents_rels_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_tickets_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tickets_id";
  DROP TYPE "public"."enum_events_exclusive_links_type";
  DROP TYPE "public"."enum_events_state";
  DROP TYPE "public"."enum_tickets_status";`)
}
