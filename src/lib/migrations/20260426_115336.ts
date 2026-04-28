import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_plans_payment_methods" AS ENUM('card', 'kakaopay', 'tosspay', 'naverpay', 'bank_transfer', 'cash');
  CREATE TYPE "public"."enum_plans_tier" AS ENUM('member', 'patron');
  CREATE TYPE "public"."enum_plans_interval_label" AS ENUM('monthly', 'yearly', 'lifetime');
  CREATE TYPE "public"."enum_plans_type" AS ENUM('one_time', 'recurring');
  CREATE TYPE "public"."enum_plans_recurring_unit" AS ENUM('day', 'week', 'month', 'year');
  CREATE TYPE "public"."enum_plans_state" AS ENUM('active', 'ended');
  CREATE TYPE "public"."enum_subscriptions_subscription_status" AS ENUM('pending', 'active', 'paused', 'canceled');
  CREATE TYPE "public"."enum_subscriptions_provider" AS ENUM('portone', 'manual', 'stripe');
  CREATE TYPE "public"."enum_subscription_cycle_cycle_unit" AS ENUM('month', 'day', 'week', 'year');
  CREATE TABLE "plans_payment_methods" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_plans_payment_methods",
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL
  );
  
  CREATE TABLE "plans_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"label" varchar NOT NULL,
  	"included" boolean DEFAULT true
  );
  
  CREATE TABLE "plans" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"name" varchar NOT NULL,
  	"tier" "enum_plans_tier" NOT NULL,
  	"tier_label" varchar DEFAULT '' NOT NULL,
  	"interval_label" "enum_plans_interval_label" DEFAULT 'monthly' NOT NULL,
  	"type" "enum_plans_type" DEFAULT 'recurring' NOT NULL,
  	"recurring_interval" numeric DEFAULT 1,
  	"recurring_unit" "enum_plans_recurring_unit" DEFAULT 'month',
  	"recurring_trial_days" numeric DEFAULT 0,
  	"description" varchar,
  	"featured" boolean DEFAULT false,
  	"compare_at_id" uuid,
  	"discount_label" varchar,
  	"sort" numeric DEFAULT 0,
  	"state" "enum_plans_state" DEFAULT 'active' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "plans_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"prices_id" uuid
  );
  
  CREATE TABLE "invoices" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"invoice_number" numeric,
  	"client_id" uuid NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "prices_currencies" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"amount" numeric NOT NULL,
  	"currency_id" uuid NOT NULL
  );
  
  CREATE TABLE "prices" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "subscriptions" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"user_id" uuid NOT NULL,
  	"plan_id" uuid NOT NULL,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"subscription_status" "enum_subscriptions_subscription_status" DEFAULT 'pending' NOT NULL,
  	"provider" "enum_subscriptions_provider" DEFAULT 'manual' NOT NULL,
  	"provider_customer_id" uuid,
  	"provider_billing_key" varchar,
  	"provider_charge_id" uuid,
  	"auto_renew" boolean DEFAULT true,
  	"is_due" boolean DEFAULT false,
  	"paid" boolean DEFAULT false,
  	"last_due_check" timestamp(3) with time zone,
  	"current_cycle_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "subscriptions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"subscription_cycle_id" uuid
  );
  
  CREATE TABLE "exchange_rate_rates" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"currency_id" uuid NOT NULL,
  	"rate" varchar NOT NULL
  );
  
  CREATE TABLE "exchange_rate" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "currency" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"name" varchar NOT NULL,
  	"slug_key" varchar,
  	"hash_id" varchar(11) DEFAULT nanoid(11) NOT NULL,
  	"slug_lock" boolean NOT NULL,
  	"slug" varchar NOT NULL,
  	"kr_nm" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "holidays_dates" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"name" varchar NOT NULL
  );
  
  CREATE TABLE "holidays" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"period" numeric NOT NULL,
  	"country" varchar DEFAULT 'kr' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
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
  
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'::text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'author', 'patron', 'member', 'user');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  ALTER TABLE "_users_v" ALTER COLUMN "version_role" SET DATA TYPE text;
  ALTER TABLE "_users_v" ALTER COLUMN "version_role" SET DEFAULT 'user'::text;
  DROP TYPE "public"."enum__users_v_version_role";
  CREATE TYPE "public"."enum__users_v_version_role" AS ENUM('admin', 'editor', 'author', 'patron', 'member', 'user');
  ALTER TABLE "_users_v" ALTER COLUMN "version_role" SET DEFAULT 'user'::"public"."enum__users_v_version_role";
  ALTER TABLE "_users_v" ALTER COLUMN "version_role" SET DATA TYPE "public"."enum__users_v_version_role" USING "version_role"::"public"."enum__users_v_version_role";
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DEFAULT 'admin'::text;
  DROP TYPE "public"."enum_admin_invitations_role";
  CREATE TYPE "public"."enum_admin_invitations_role" AS ENUM('admin', 'editor', 'author', 'patron', 'member', 'user');
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DEFAULT 'admin'::"public"."enum_admin_invitations_role";
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DATA TYPE "public"."enum_admin_invitations_role" USING "role"::"public"."enum_admin_invitations_role";
  ALTER TABLE "posts" ADD COLUMN "approved_by_editor" boolean DEFAULT false;
  ALTER TABLE "_posts_v" ADD COLUMN "version_approved_by_editor" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "plans_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "invoices_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "prices_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "subscriptions_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "exchange_rate_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "currency_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "holidays_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "subscription_cycle_id" uuid;
  ALTER TABLE "plans_payment_methods" ADD CONSTRAINT "plans_payment_methods_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "plans_features" ADD CONSTRAINT "plans_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "plans" ADD CONSTRAINT "plans_compare_at_id_prices_id_fk" FOREIGN KEY ("compare_at_id") REFERENCES "public"."prices"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "plans_rels" ADD CONSTRAINT "plans_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "plans_rels" ADD CONSTRAINT "plans_rels_prices_fk" FOREIGN KEY ("prices_id") REFERENCES "public"."prices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "prices_currencies" ADD CONSTRAINT "prices_currencies_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "prices_currencies" ADD CONSTRAINT "prices_currencies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."prices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_current_cycle_id_subscription_cycle_id_fk" FOREIGN KEY ("current_cycle_id") REFERENCES "public"."subscription_cycle"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subscriptions_rels" ADD CONSTRAINT "subscriptions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscriptions_rels" ADD CONSTRAINT "subscriptions_rels_subscription_cycle_fk" FOREIGN KEY ("subscription_cycle_id") REFERENCES "public"."subscription_cycle"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exchange_rate_rates" ADD CONSTRAINT "exchange_rate_rates_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "exchange_rate_rates" ADD CONSTRAINT "exchange_rate_rates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."exchange_rate"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "holidays_dates" ADD CONSTRAINT "holidays_dates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."holidays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscription_cycle" ADD CONSTRAINT "subscription_cycle_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "plans_payment_methods_order_idx" ON "plans_payment_methods" USING btree ("order");
  CREATE INDEX "plans_payment_methods_parent_idx" ON "plans_payment_methods" USING btree ("parent_id");
  CREATE INDEX "plans_features_order_idx" ON "plans_features" USING btree ("_order");
  CREATE INDEX "plans_features_parent_id_idx" ON "plans_features" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "plans_name_idx" ON "plans" USING btree ("name");
  CREATE INDEX "plans_compare_at_idx" ON "plans" USING btree ("compare_at_id");
  CREATE INDEX "plans_sort_idx" ON "plans" USING btree ("sort");
  CREATE INDEX "plans_updated_at_idx" ON "plans" USING btree ("updated_at");
  CREATE INDEX "plans_created_at_idx" ON "plans" USING btree ("created_at");
  CREATE INDEX "plans_rels_order_idx" ON "plans_rels" USING btree ("order");
  CREATE INDEX "plans_rels_parent_idx" ON "plans_rels" USING btree ("parent_id");
  CREATE INDEX "plans_rels_path_idx" ON "plans_rels" USING btree ("path");
  CREATE INDEX "plans_rels_prices_id_idx" ON "plans_rels" USING btree ("prices_id");
  CREATE UNIQUE INDEX "invoices_invoice_number_idx" ON "invoices" USING btree ("invoice_number");
  CREATE INDEX "invoices_client_idx" ON "invoices" USING btree ("client_id");
  CREATE INDEX "invoices_updated_at_idx" ON "invoices" USING btree ("updated_at");
  CREATE INDEX "invoices_created_at_idx" ON "invoices" USING btree ("created_at");
  CREATE INDEX "prices_currencies_order_idx" ON "prices_currencies" USING btree ("_order");
  CREATE INDEX "prices_currencies_parent_id_idx" ON "prices_currencies" USING btree ("_parent_id");
  CREATE INDEX "prices_currencies_currency_idx" ON "prices_currencies" USING btree ("currency_id");
  CREATE INDEX "prices_updated_at_idx" ON "prices" USING btree ("updated_at");
  CREATE INDEX "prices_created_at_idx" ON "prices" USING btree ("created_at");
  CREATE INDEX "subscriptions_user_idx" ON "subscriptions" USING btree ("user_id");
  CREATE INDEX "subscriptions_plan_idx" ON "subscriptions" USING btree ("plan_id");
  CREATE INDEX "subscriptions_subscription_status_idx" ON "subscriptions" USING btree ("subscription_status");
  CREATE INDEX "subscriptions_provider_idx" ON "subscriptions" USING btree ("provider");
  CREATE INDEX "subscriptions_provider_customer_id_idx" ON "subscriptions" USING btree ("provider_customer_id");
  CREATE INDEX "subscriptions_provider_billing_key_idx" ON "subscriptions" USING btree ("provider_billing_key");
  CREATE UNIQUE INDEX "subscriptions_provider_charge_id_idx" ON "subscriptions" USING btree ("provider_charge_id");
  CREATE UNIQUE INDEX "subscriptions_current_cycle_idx" ON "subscriptions" USING btree ("current_cycle_id");
  CREATE INDEX "subscriptions_updated_at_idx" ON "subscriptions" USING btree ("updated_at");
  CREATE INDEX "subscriptions_created_at_idx" ON "subscriptions" USING btree ("created_at");
  CREATE INDEX "subscriptions_rels_order_idx" ON "subscriptions_rels" USING btree ("order");
  CREATE INDEX "subscriptions_rels_parent_idx" ON "subscriptions_rels" USING btree ("parent_id");
  CREATE INDEX "subscriptions_rels_path_idx" ON "subscriptions_rels" USING btree ("path");
  CREATE INDEX "subscriptions_rels_subscription_cycle_id_idx" ON "subscriptions_rels" USING btree ("subscription_cycle_id");
  CREATE INDEX "exchange_rate_rates_order_idx" ON "exchange_rate_rates" USING btree ("_order");
  CREATE INDEX "exchange_rate_rates_parent_id_idx" ON "exchange_rate_rates" USING btree ("_parent_id");
  CREATE INDEX "exchange_rate_rates_currency_idx" ON "exchange_rate_rates" USING btree ("currency_id");
  CREATE INDEX "exchange_rate_rates_rate_idx" ON "exchange_rate_rates" USING btree ("rate");
  CREATE UNIQUE INDEX "exchange_rate_date_idx" ON "exchange_rate" USING btree ("date");
  CREATE INDEX "exchange_rate_updated_at_idx" ON "exchange_rate" USING btree ("updated_at");
  CREATE INDEX "exchange_rate_created_at_idx" ON "exchange_rate" USING btree ("created_at");
  CREATE UNIQUE INDEX "currency_name_idx" ON "currency" USING btree ("name");
  CREATE INDEX "currency_slug_key_idx" ON "currency" USING btree ("slug_key");
  CREATE INDEX "currency_hash_id_idx" ON "currency" USING btree ("hash_id");
  CREATE UNIQUE INDEX "currency_kr_nm_idx" ON "currency" USING btree ("kr_nm");
  CREATE INDEX "currency_updated_at_idx" ON "currency" USING btree ("updated_at");
  CREATE INDEX "currency_created_at_idx" ON "currency" USING btree ("created_at");
  CREATE INDEX "holidays_dates_order_idx" ON "holidays_dates" USING btree ("_order");
  CREATE INDEX "holidays_dates_parent_id_idx" ON "holidays_dates" USING btree ("_parent_id");
  CREATE INDEX "holidays_dates_date_idx" ON "holidays_dates" USING btree ("date");
  CREATE INDEX "holidays_dates_name_idx" ON "holidays_dates" USING btree ("name");
  CREATE UNIQUE INDEX "holidays_period_idx" ON "holidays" USING btree ("period");
  CREATE INDEX "holidays_country_idx" ON "holidays" USING btree ("country");
  CREATE INDEX "holidays_updated_at_idx" ON "holidays" USING btree ("updated_at");
  CREATE INDEX "holidays_created_at_idx" ON "holidays" USING btree ("created_at");
  CREATE UNIQUE INDEX "subscription_cycle_invoice_idx" ON "subscription_cycle" USING btree ("invoice_id");
  CREATE INDEX "subscription_cycle_updated_at_idx" ON "subscription_cycle" USING btree ("updated_at");
  CREATE INDEX "subscription_cycle_created_at_idx" ON "subscription_cycle" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_plans_fk" FOREIGN KEY ("plans_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_invoices_fk" FOREIGN KEY ("invoices_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_prices_fk" FOREIGN KEY ("prices_id") REFERENCES "public"."prices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscriptions_fk" FOREIGN KEY ("subscriptions_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_exchange_rate_fk" FOREIGN KEY ("exchange_rate_id") REFERENCES "public"."exchange_rate"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_currency_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_holidays_fk" FOREIGN KEY ("holidays_id") REFERENCES "public"."holidays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscription_cycle_fk" FOREIGN KEY ("subscription_cycle_id") REFERENCES "public"."subscription_cycle"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "posts_approved_by_editor_idx" ON "posts" USING btree ("approved_by_editor");
  CREATE INDEX "_posts_v_version_version_approved_by_editor_idx" ON "_posts_v" USING btree ("version_approved_by_editor");
  CREATE INDEX "payload_locked_documents_rels_plans_id_idx" ON "payload_locked_documents_rels" USING btree ("plans_id");
  CREATE INDEX "payload_locked_documents_rels_invoices_id_idx" ON "payload_locked_documents_rels" USING btree ("invoices_id");
  CREATE INDEX "payload_locked_documents_rels_prices_id_idx" ON "payload_locked_documents_rels" USING btree ("prices_id");
  CREATE INDEX "payload_locked_documents_rels_subscriptions_id_idx" ON "payload_locked_documents_rels" USING btree ("subscriptions_id");
  CREATE INDEX "payload_locked_documents_rels_exchange_rate_id_idx" ON "payload_locked_documents_rels" USING btree ("exchange_rate_id");
  CREATE INDEX "payload_locked_documents_rels_currency_id_idx" ON "payload_locked_documents_rels" USING btree ("currency_id");
  CREATE INDEX "payload_locked_documents_rels_holidays_id_idx" ON "payload_locked_documents_rels" USING btree ("holidays_id");
  CREATE INDEX "payload_locked_documents_rels_subscription_cycle_id_idx" ON "payload_locked_documents_rels" USING btree ("subscription_cycle_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "plans_payment_methods" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "plans_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "plans" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "plans_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "invoices" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "prices_currencies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "prices" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subscriptions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subscriptions_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "exchange_rate_rates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "exchange_rate" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "currency" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "holidays_dates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "holidays" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subscription_cycle" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "plans_payment_methods" CASCADE;
  DROP TABLE "plans_features" CASCADE;
  DROP TABLE "plans" CASCADE;
  DROP TABLE "plans_rels" CASCADE;
  DROP TABLE "invoices" CASCADE;
  DROP TABLE "prices_currencies" CASCADE;
  DROP TABLE "prices" CASCADE;
  DROP TABLE "subscriptions" CASCADE;
  DROP TABLE "subscriptions_rels" CASCADE;
  DROP TABLE "exchange_rate_rates" CASCADE;
  DROP TABLE "exchange_rate" CASCADE;
  DROP TABLE "currency" CASCADE;
  DROP TABLE "holidays_dates" CASCADE;
  DROP TABLE "holidays" CASCADE;
  DROP TABLE "subscription_cycle" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_plans_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_invoices_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_prices_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_subscriptions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_exchange_rate_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_currency_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_holidays_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_subscription_cycle_fk";
  
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'author'::text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'author', 'editor', 'user', 'patron');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'author'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  ALTER TABLE "_users_v" ALTER COLUMN "version_role" SET DATA TYPE text;
  ALTER TABLE "_users_v" ALTER COLUMN "version_role" SET DEFAULT 'author'::text;
  DROP TYPE "public"."enum__users_v_version_role";
  CREATE TYPE "public"."enum__users_v_version_role" AS ENUM('admin', 'author', 'editor', 'user', 'patron');
  ALTER TABLE "_users_v" ALTER COLUMN "version_role" SET DEFAULT 'author'::"public"."enum__users_v_version_role";
  ALTER TABLE "_users_v" ALTER COLUMN "version_role" SET DATA TYPE "public"."enum__users_v_version_role" USING "version_role"::"public"."enum__users_v_version_role";
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DEFAULT 'admin'::text;
  DROP TYPE "public"."enum_admin_invitations_role";
  CREATE TYPE "public"."enum_admin_invitations_role" AS ENUM('admin', 'author', 'editor', 'user', 'patron');
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DEFAULT 'admin'::"public"."enum_admin_invitations_role";
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DATA TYPE "public"."enum_admin_invitations_role" USING "role"::"public"."enum_admin_invitations_role";
  DROP INDEX "posts_approved_by_editor_idx";
  DROP INDEX "_posts_v_version_version_approved_by_editor_idx";
  DROP INDEX "payload_locked_documents_rels_plans_id_idx";
  DROP INDEX "payload_locked_documents_rels_invoices_id_idx";
  DROP INDEX "payload_locked_documents_rels_prices_id_idx";
  DROP INDEX "payload_locked_documents_rels_subscriptions_id_idx";
  DROP INDEX "payload_locked_documents_rels_exchange_rate_id_idx";
  DROP INDEX "payload_locked_documents_rels_currency_id_idx";
  DROP INDEX "payload_locked_documents_rels_holidays_id_idx";
  DROP INDEX "payload_locked_documents_rels_subscription_cycle_id_idx";
  ALTER TABLE "posts" DROP COLUMN "approved_by_editor";
  ALTER TABLE "_posts_v" DROP COLUMN "version_approved_by_editor";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "plans_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "invoices_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "prices_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "subscriptions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "exchange_rate_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "currency_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "holidays_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "subscription_cycle_id";
  DROP TYPE "public"."enum_plans_payment_methods";
  DROP TYPE "public"."enum_plans_tier";
  DROP TYPE "public"."enum_plans_interval_label";
  DROP TYPE "public"."enum_plans_type";
  DROP TYPE "public"."enum_plans_recurring_unit";
  DROP TYPE "public"."enum_plans_state";
  DROP TYPE "public"."enum_subscriptions_subscription_status";
  DROP TYPE "public"."enum_subscriptions_provider";
  DROP TYPE "public"."enum_subscription_cycle_cycle_unit";`)
}
