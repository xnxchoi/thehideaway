import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_plans_validity" AS ENUM('yearly', 'lifetime');
  CREATE TYPE "public"."enum_plans_presentation" AS ENUM('standard', 'founder');
  CREATE TYPE "public"."enum_subscriptions_request_method" AS ENUM('bank_transfer', 'cash');
  DROP TABLE IF EXISTS "subscriptions_rels" CASCADE;
  DROP TABLE IF EXISTS "subscription_cycle" CASCADE;
  ALTER TABLE "plans" DROP CONSTRAINT IF EXISTS "plans_compare_at_id_prices_id_fk";
  ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_current_cycle_id_subscription_cycle_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_subscription_cycle_fk";
  
  ALTER TABLE "plans_payment_methods" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_plans_payment_methods";
  CREATE TYPE "public"."enum_plans_payment_methods" AS ENUM('bank_transfer', 'cash');
  ALTER TABLE "plans_payment_methods" ALTER COLUMN "value" SET DATA TYPE "public"."enum_plans_payment_methods" USING "value"::"public"."enum_plans_payment_methods";
  ALTER TABLE "plans" ALTER COLUMN "type" SET DATA TYPE text;
  ALTER TABLE "plans" ALTER COLUMN "type" SET DEFAULT 'one_time'::text;
  DROP TYPE "public"."enum_plans_type";
  CREATE TYPE "public"."enum_plans_type" AS ENUM('one_time');
  ALTER TABLE "plans" ALTER COLUMN "type" SET DEFAULT 'one_time'::"public"."enum_plans_type";
  ALTER TABLE "plans" ALTER COLUMN "type" SET DATA TYPE "public"."enum_plans_type" USING "type"::"public"."enum_plans_type";
  ALTER TABLE "subscriptions" ALTER COLUMN "subscription_status" SET DATA TYPE text;
  ALTER TABLE "subscriptions" ALTER COLUMN "subscription_status" SET DEFAULT 'pending'::text;
  DROP TYPE "public"."enum_subscriptions_subscription_status";
  CREATE TYPE "public"."enum_subscriptions_subscription_status" AS ENUM('pending', 'active', 'expired', 'canceled');
  ALTER TABLE "subscriptions" ALTER COLUMN "subscription_status" SET DEFAULT 'pending'::"public"."enum_subscriptions_subscription_status";
  ALTER TABLE "subscriptions" ALTER COLUMN "subscription_status" SET DATA TYPE "public"."enum_subscriptions_subscription_status" USING "subscription_status"::"public"."enum_subscriptions_subscription_status";
  DROP INDEX "plans_compare_at_idx";
  DROP INDEX "subscriptions_provider_idx";
  DROP INDEX "subscriptions_provider_customer_id_idx";
  DROP INDEX "subscriptions_provider_billing_key_idx";
  DROP INDEX "subscriptions_provider_charge_id_idx";
  DROP INDEX "subscriptions_current_cycle_idx";
  DROP INDEX "payload_locked_documents_rels_subscription_cycle_id_idx";
  ALTER TABLE "posts" ADD COLUMN "featured" boolean DEFAULT false;
  ALTER TABLE "posts" ADD COLUMN "front_eligible" boolean DEFAULT false;
  ALTER TABLE "_posts_v" ADD COLUMN "version_featured" boolean DEFAULT false;
  ALTER TABLE "_posts_v" ADD COLUMN "version_front_eligible" boolean DEFAULT false;
  ALTER TABLE "plans" ADD COLUMN "validity" "enum_plans_validity" DEFAULT 'yearly' NOT NULL;
  ALTER TABLE "plans" ADD COLUMN "seat_limit" numeric;
  ALTER TABLE "plans" ADD COLUMN "presentation" "enum_plans_presentation" DEFAULT 'standard' NOT NULL;
  ALTER TABLE "subscriptions" ADD COLUMN "expires_at" timestamp(3) with time zone;
  ALTER TABLE "subscriptions" ADD COLUMN "validity_waived" boolean DEFAULT false;
  ALTER TABLE "subscriptions" ADD COLUMN "last_waiver_check" timestamp(3) with time zone;
  ALTER TABLE "subscriptions" ADD COLUMN "request_method" "enum_subscriptions_request_method" DEFAULT 'bank_transfer' NOT NULL;
  ALTER TABLE "subscriptions" ADD COLUMN "request_note" varchar;
  CREATE INDEX "posts_featured_idx" ON "posts" USING btree ("featured");
  CREATE INDEX "posts_front_eligible_idx" ON "posts" USING btree ("front_eligible");
  CREATE INDEX "_posts_v_version_version_featured_idx" ON "_posts_v" USING btree ("version_featured");
  CREATE INDEX "_posts_v_version_version_front_eligible_idx" ON "_posts_v" USING btree ("version_front_eligible");
  CREATE INDEX "subscriptions_expires_at_idx" ON "subscriptions" USING btree ("expires_at");
  ALTER TABLE "plans" DROP COLUMN "interval_label";
  ALTER TABLE "plans" DROP COLUMN "recurring_interval";
  ALTER TABLE "plans" DROP COLUMN "recurring_unit";
  ALTER TABLE "plans" DROP COLUMN "recurring_trial_days";
  ALTER TABLE "plans" DROP COLUMN "compare_at_id";
  ALTER TABLE "subscriptions" DROP COLUMN "provider";
  ALTER TABLE "subscriptions" DROP COLUMN "provider_customer_id";
  ALTER TABLE "subscriptions" DROP COLUMN "provider_billing_key";
  ALTER TABLE "subscriptions" DROP COLUMN "provider_charge_id";
  ALTER TABLE "subscriptions" DROP COLUMN "auto_renew";
  ALTER TABLE "subscriptions" DROP COLUMN "is_due";
  ALTER TABLE "subscriptions" DROP COLUMN "last_due_check";
  ALTER TABLE "subscriptions" DROP COLUMN "current_cycle_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "subscription_cycle_id";
  DROP TYPE "public"."enum_plans_interval_label";
  DROP TYPE "public"."enum_plans_recurring_unit";
  DROP TYPE "public"."enum_subscriptions_provider";
  DROP TYPE "public"."enum_subscription_cycle_cycle_unit";`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_plans_interval_label" AS ENUM('monthly', 'yearly', 'lifetime');
  CREATE TYPE "public"."enum_plans_recurring_unit" AS ENUM('day', 'week', 'month', 'year');
  CREATE TYPE "public"."enum_subscriptions_provider" AS ENUM('portone', 'manual', 'stripe');
  CREATE TYPE "public"."enum_subscription_cycle_cycle_unit" AS ENUM('month', 'day', 'week', 'year');
  ALTER TYPE "public"."enum_plans_payment_methods" ADD VALUE 'card' BEFORE 'bank_transfer';
  ALTER TYPE "public"."enum_plans_payment_methods" ADD VALUE 'kakaopay' BEFORE 'bank_transfer';
  ALTER TYPE "public"."enum_plans_payment_methods" ADD VALUE 'tosspay' BEFORE 'bank_transfer';
  ALTER TYPE "public"."enum_plans_payment_methods" ADD VALUE 'naverpay' BEFORE 'bank_transfer';
  ALTER TYPE "public"."enum_plans_type" ADD VALUE 'recurring';
  CREATE TABLE "subscriptions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"subscription_cycle_id" uuid
  );
  
  CREATE TABLE "subscription_cycle" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"invoice_id" uuid NOT NULL,
  	"cycle_start" timestamp(3) with time zone NOT NULL,
  	"cycle_duration" numeric NOT NULL,
  	"cycle_unit" "enum_subscription_cycle_cycle_unit" DEFAULT 'month' NOT NULL,
  	"cycle_end" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "subscriptions" ALTER COLUMN "subscription_status" SET DATA TYPE text;
  ALTER TABLE "subscriptions" ALTER COLUMN "subscription_status" SET DEFAULT 'pending'::text;
  DROP TYPE "public"."enum_subscriptions_subscription_status";
  CREATE TYPE "public"."enum_subscriptions_subscription_status" AS ENUM('pending', 'active', 'paused', 'canceled');
  ALTER TABLE "subscriptions" ALTER COLUMN "subscription_status" SET DEFAULT 'pending'::"public"."enum_subscriptions_subscription_status";
  ALTER TABLE "subscriptions" ALTER COLUMN "subscription_status" SET DATA TYPE "public"."enum_subscriptions_subscription_status" USING "subscription_status"::"public"."enum_subscriptions_subscription_status";
  DROP INDEX "posts_featured_idx";
  DROP INDEX "posts_front_eligible_idx";
  DROP INDEX "_posts_v_version_version_featured_idx";
  DROP INDEX "_posts_v_version_version_front_eligible_idx";
  DROP INDEX "subscriptions_expires_at_idx";
  ALTER TABLE "plans" ALTER COLUMN "type" SET DEFAULT 'recurring';
  ALTER TABLE "plans" ADD COLUMN "interval_label" "enum_plans_interval_label" DEFAULT 'monthly' NOT NULL;
  ALTER TABLE "plans" ADD COLUMN "recurring_interval" numeric DEFAULT 1;
  ALTER TABLE "plans" ADD COLUMN "recurring_unit" "enum_plans_recurring_unit" DEFAULT 'month';
  ALTER TABLE "plans" ADD COLUMN "recurring_trial_days" numeric DEFAULT 0;
  ALTER TABLE "plans" ADD COLUMN "compare_at_id" uuid;
  ALTER TABLE "subscriptions" ADD COLUMN "provider" "enum_subscriptions_provider" DEFAULT 'manual' NOT NULL;
  ALTER TABLE "subscriptions" ADD COLUMN "provider_customer_id" uuid;
  ALTER TABLE "subscriptions" ADD COLUMN "provider_billing_key" varchar;
  ALTER TABLE "subscriptions" ADD COLUMN "provider_charge_id" uuid;
  ALTER TABLE "subscriptions" ADD COLUMN "auto_renew" boolean DEFAULT true;
  ALTER TABLE "subscriptions" ADD COLUMN "is_due" boolean DEFAULT false;
  ALTER TABLE "subscriptions" ADD COLUMN "last_due_check" timestamp(3) with time zone;
  ALTER TABLE "subscriptions" ADD COLUMN "current_cycle_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "subscription_cycle_id" uuid;
  ALTER TABLE "subscriptions_rels" ADD CONSTRAINT "subscriptions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscriptions_rels" ADD CONSTRAINT "subscriptions_rels_subscription_cycle_fk" FOREIGN KEY ("subscription_cycle_id") REFERENCES "public"."subscription_cycle"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscription_cycle" ADD CONSTRAINT "subscription_cycle_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "subscriptions_rels_order_idx" ON "subscriptions_rels" USING btree ("order");
  CREATE INDEX "subscriptions_rels_parent_idx" ON "subscriptions_rels" USING btree ("parent_id");
  CREATE INDEX "subscriptions_rels_path_idx" ON "subscriptions_rels" USING btree ("path");
  CREATE INDEX "subscriptions_rels_subscription_cycle_id_idx" ON "subscriptions_rels" USING btree ("subscription_cycle_id");
  CREATE UNIQUE INDEX "subscription_cycle_invoice_idx" ON "subscription_cycle" USING btree ("invoice_id");
  CREATE INDEX "subscription_cycle_updated_at_idx" ON "subscription_cycle" USING btree ("updated_at");
  CREATE INDEX "subscription_cycle_created_at_idx" ON "subscription_cycle" USING btree ("created_at");
  ALTER TABLE "plans" ADD CONSTRAINT "plans_compare_at_id_prices_id_fk" FOREIGN KEY ("compare_at_id") REFERENCES "public"."prices"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_current_cycle_id_subscription_cycle_id_fk" FOREIGN KEY ("current_cycle_id") REFERENCES "public"."subscription_cycle"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscription_cycle_fk" FOREIGN KEY ("subscription_cycle_id") REFERENCES "public"."subscription_cycle"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "plans_compare_at_idx" ON "plans" USING btree ("compare_at_id");
  CREATE INDEX "subscriptions_provider_idx" ON "subscriptions" USING btree ("provider");
  CREATE INDEX "subscriptions_provider_customer_id_idx" ON "subscriptions" USING btree ("provider_customer_id");
  CREATE INDEX "subscriptions_provider_billing_key_idx" ON "subscriptions" USING btree ("provider_billing_key");
  CREATE UNIQUE INDEX "subscriptions_provider_charge_id_idx" ON "subscriptions" USING btree ("provider_charge_id");
  CREATE UNIQUE INDEX "subscriptions_current_cycle_idx" ON "subscriptions" USING btree ("current_cycle_id");
  CREATE INDEX "payload_locked_documents_rels_subscription_cycle_id_idx" ON "payload_locked_documents_rels" USING btree ("subscription_cycle_id");
  ALTER TABLE "posts" DROP COLUMN "featured";
  ALTER TABLE "posts" DROP COLUMN "front_eligible";
  ALTER TABLE "_posts_v" DROP COLUMN "version_featured";
  ALTER TABLE "_posts_v" DROP COLUMN "version_front_eligible";
  ALTER TABLE "plans" DROP COLUMN "validity";
  ALTER TABLE "plans" DROP COLUMN "seat_limit";
  ALTER TABLE "plans" DROP COLUMN "presentation";
  ALTER TABLE "subscriptions" DROP COLUMN "expires_at";
  ALTER TABLE "subscriptions" DROP COLUMN "validity_waived";
  ALTER TABLE "subscriptions" DROP COLUMN "last_waiver_check";
  ALTER TABLE "subscriptions" DROP COLUMN "request_method";
  ALTER TABLE "subscriptions" DROP COLUMN "request_note";
  DROP TYPE "public"."enum_plans_validity";
  DROP TYPE "public"."enum_plans_presentation";
  DROP TYPE "public"."enum_subscriptions_request_method";`);
}
