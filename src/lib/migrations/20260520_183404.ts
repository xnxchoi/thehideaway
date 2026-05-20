import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_profile_rsvp_tier" AS ENUM('host', 'past', 'guest');
  CREATE TYPE "public"."enum__profile_v_version_rsvp_tier" AS ENUM('host', 'past', 'guest');
  CREATE TYPE "public"."enum_ticket_orders_locale" AS ENUM('ko', 'en');
  CREATE TABLE "ticket_orders" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"purchaser_id" uuid NOT NULL,
  	"event_id" uuid NOT NULL,
  	"purchaser_name" varchar,
  	"paid" boolean DEFAULT false,
  	"paid_at" timestamp(3) with time zone,
  	"password" varchar,
  	"password_issued_at" timestamp(3) with time zone,
  	"password_expires_at" timestamp(3) with time zone,
  	"mailed_at" timestamp(3) with time zone,
  	"locale" "enum_ticket_orders_locale" DEFAULT 'ko',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "profile" ADD COLUMN "rsvp_tier" "enum_profile_rsvp_tier" DEFAULT 'guest';
  ALTER TABLE "_profile_v" ADD COLUMN "version_rsvp_tier" "enum__profile_v_version_rsvp_tier" DEFAULT 'guest';
  ALTER TABLE "tickets" ADD COLUMN "gift_initial_name" varchar;
  ALTER TABLE "tickets" ADD COLUMN "gift_name_locked" boolean DEFAULT false;
  ALTER TABLE "tickets" ADD COLUMN "order_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ticket_orders_id" uuid;
  ALTER TABLE "ticket_orders" ADD CONSTRAINT "ticket_orders_purchaser_id_users_id_fk" FOREIGN KEY ("purchaser_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ticket_orders" ADD CONSTRAINT "ticket_orders_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "ticket_orders_purchaser_idx" ON "ticket_orders" USING btree ("purchaser_id");
  CREATE INDEX "ticket_orders_event_idx" ON "ticket_orders" USING btree ("event_id");
  CREATE INDEX "ticket_orders_updated_at_idx" ON "ticket_orders" USING btree ("updated_at");
  CREATE INDEX "ticket_orders_created_at_idx" ON "ticket_orders" USING btree ("created_at");
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_order_id_ticket_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."ticket_orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ticket_orders_fk" FOREIGN KEY ("ticket_orders_id") REFERENCES "public"."ticket_orders"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tickets_order_idx" ON "tickets" USING btree ("order_id");
  CREATE INDEX "payload_locked_documents_rels_ticket_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("ticket_orders_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ticket_orders" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ticket_orders" CASCADE;
  ALTER TABLE "tickets" DROP CONSTRAINT "tickets_order_id_ticket_orders_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ticket_orders_fk";
  
  DROP INDEX "tickets_order_idx";
  DROP INDEX "payload_locked_documents_rels_ticket_orders_id_idx";
  ALTER TABLE "profile" DROP COLUMN "rsvp_tier";
  ALTER TABLE "_profile_v" DROP COLUMN "version_rsvp_tier";
  ALTER TABLE "tickets" DROP COLUMN "gift_initial_name";
  ALTER TABLE "tickets" DROP COLUMN "gift_name_locked";
  ALTER TABLE "tickets" DROP COLUMN "order_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ticket_orders_id";
  DROP TYPE "public"."enum_profile_rsvp_tier";
  DROP TYPE "public"."enum__profile_v_version_rsvp_tier";
  DROP TYPE "public"."enum_ticket_orders_locale";`)
}
