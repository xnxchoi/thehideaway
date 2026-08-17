import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  CREATE OR REPLACE FUNCTION nanoid_optimized(
    size int,
    alphabet text,
    mask int,
    step int
  ) RETURNS text
    LANGUAGE plpgsql
    VOLATILE PARALLEL SAFE
  AS \$\$
  DECLARE
    id_builder text := '';
    counter int := 0;
    bytes bytea;
    alphabet_index int;
    alphabet_array text[];
    alphabet_length int;
  BEGIN
    alphabet_array := regexp_split_to_array(alphabet, '');
    alphabet_length := array_length(alphabet_array, 1);
    LOOP
      bytes := gen_random_bytes(step);
      FOR counter IN 0..step - 1 LOOP
        alphabet_index := (get_byte(bytes, counter) & mask) + 1;
        IF alphabet_index <= alphabet_length THEN
          id_builder := id_builder || alphabet_array[alphabet_index];
          IF length(id_builder) = size THEN RETURN id_builder; END IF;
        END IF;
      END LOOP;
    END LOOP;
  END
  \$\$;
  CREATE OR REPLACE FUNCTION nanoid(
    size int DEFAULT 21,
    alphabet text DEFAULT '_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    additional_bytes_factor float DEFAULT 1.6
  ) RETURNS text
    LANGUAGE plpgsql
    VOLATILE PARALLEL SAFE
  AS \$\$
  DECLARE
    alphabet_length int;
    mask int;
    step int;
  BEGIN
    IF size IS NULL OR size < 1 THEN
      RAISE EXCEPTION 'nanoid size must be greater than zero';
    END IF;
    IF alphabet IS NULL OR length(alphabet) = 0 OR length(alphabet) > 255 THEN
      RAISE EXCEPTION 'nanoid alphabet length is invalid';
    END IF;
    IF additional_bytes_factor IS NULL OR additional_bytes_factor < 1 THEN
      RAISE EXCEPTION 'nanoid additional bytes factor is invalid';
    END IF;
    alphabet_length := length(alphabet);
    mask := (2 << cast(floor(log(alphabet_length - 1) / log(2)) AS int)) - 1;
    step := least(1024, cast(ceil(additional_bytes_factor * mask * size / alphabet_length) AS int));
    RETURN nanoid_optimized(size, alphabet, mask, step);
  END
  \$\$;
   DO $guard$ BEGIN CREATE TYPE "public"."_locales" AS ENUM('en', 'ko'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'cofounder', 'editor', 'author', 'patron', 'resident', 'user'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_users_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__users_v_version_role" AS ENUM('admin', 'cofounder', 'editor', 'author', 'patron', 'resident', 'user'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__users_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__users_v_published_locale" AS ENUM('en', 'ko'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_admin_invitations_role" AS ENUM('admin', 'cofounder', 'editor', 'author', 'patron', 'resident', 'user'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_assets_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_categories_identity_accent" AS ENUM('none', 'red', 'amber', 'citrus', 'moss', 'cobalt', 'violet', 'blush', 'ink'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_categories_identity_layout" AS ENUM('left', 'right'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_media_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_notifications_type" AS ENUM('comment', 'follow', 'mention', 'system', 'access', 'bookmark', 'profile', 'post', 'surf', 'notification'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_notifications_status" AS ENUM('unread', 'read', 'dismissed'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_notifications_action_link_type" AS ENUM('reference', 'custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_notifications_action_link_appearance" AS ENUM('default', 'outline'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_pages_hero_links_link_type" AS ENUM('reference', 'custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_pages_hero_links_link_appearance" AS ENUM('default', 'outline'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_pages_blocks_cta_links_link_type" AS ENUM('reference', 'custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_pages_blocks_cta_links_link_appearance" AS ENUM('default', 'outline'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_pages_blocks_content_columns_size" AS ENUM('oneThird', 'half', 'twoThirds', 'full'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_pages_blocks_content_columns_link_type" AS ENUM('reference', 'custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_pages_blocks_content_columns_link_appearance" AS ENUM('default', 'outline'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_pages_blocks_archive_populate_by" AS ENUM('collection', 'selection'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_pages_blocks_archive_relation_to" AS ENUM('posts'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_pages_blocks_fotd_relation_to" AS ENUM('posts', 'surf'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_pages_blocks_fotd_populate_by" AS ENUM('collection', 'selection'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_pages_blocks_hero_square_populate_by" AS ENUM('collection', 'selection'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_pages_blocks_hero_square_relation_to" AS ENUM('posts'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_pages_hero_type" AS ENUM('none', 'highImpact', 'mediumImpact', 'lowImpact'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_pages_page_layout_footer_type" AS ENUM('standard', 'linksOnly', 'hidden'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_pages_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__pages_v_version_hero_links_link_type" AS ENUM('reference', 'custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__pages_v_version_hero_links_link_appearance" AS ENUM('default', 'outline'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__pages_v_blocks_cta_links_link_type" AS ENUM('reference', 'custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__pages_v_blocks_cta_links_link_appearance" AS ENUM('default', 'outline'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__pages_v_blocks_content_columns_size" AS ENUM('oneThird', 'half', 'twoThirds', 'full'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__pages_v_blocks_content_columns_link_type" AS ENUM('reference', 'custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__pages_v_blocks_content_columns_link_appearance" AS ENUM('default', 'outline'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__pages_v_blocks_archive_populate_by" AS ENUM('collection', 'selection'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__pages_v_blocks_archive_relation_to" AS ENUM('posts'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__pages_v_blocks_fotd_relation_to" AS ENUM('posts', 'surf'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__pages_v_blocks_fotd_populate_by" AS ENUM('collection', 'selection'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__pages_v_blocks_hero_square_populate_by" AS ENUM('collection', 'selection'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__pages_v_blocks_hero_square_relation_to" AS ENUM('posts'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__pages_v_version_hero_type" AS ENUM('none', 'highImpact', 'mediumImpact', 'lowImpact'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__pages_v_version_page_layout_footer_type" AS ENUM('standard', 'linksOnly', 'hidden'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__pages_v_version_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('en', 'ko'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_posts_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__posts_v_version_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__posts_v_published_locale" AS ENUM('en', 'ko'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_user_media_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_deferred_emails_category" AS ENUM('notifications', 'alerts', 'validators', 'authenticators', 'misc'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_deferred_emails_status" AS ENUM('pending', 'sent', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_profile_rsvp_tier" AS ENUM('host', 'past', 'guest'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_profile_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_profile_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__profile_v_version_rsvp_tier" AS ENUM('host', 'past', 'guest'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__profile_v_version_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__profile_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__profile_v_published_locale" AS ENUM('en', 'ko'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_albums_visibility" AS ENUM('public', 'private'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_albums_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_albums_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__albums_v_version_visibility" AS ENUM('public', 'private'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__albums_v_version_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__albums_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__albums_v_published_locale" AS ENUM('en', 'ko'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_tracks_visibility" AS ENUM('public', 'private'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_tracks_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_tracks_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__tracks_v_version_visibility" AS ENUM('public', 'private'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__tracks_v_version_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__tracks_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__tracks_v_published_locale" AS ENUM('en', 'ko'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_playlists_visibility" AS ENUM('public', 'private'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_playlists_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_playlists_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__playlists_v_version_visibility" AS ENUM('public', 'private'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__playlists_v_version_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__playlists_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__playlists_v_published_locale" AS ENUM('en', 'ko'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_surf_source" AS ENUM('x', 'twitter', 'substack', 'instagram', 'youtube', 'external', 'medium'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_surf_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_surf_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__surf_v_version_source" AS ENUM('x', 'twitter', 'substack', 'instagram', 'youtube', 'external', 'medium'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__surf_v_version_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__surf_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__surf_v_published_locale" AS ENUM('en', 'ko'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_responses_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__responses_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum__responses_v_published_locale" AS ENUM('en', 'ko'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_compilations_visibility" AS ENUM('public', 'private'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_commerce_products_currency" AS ENUM('KRW'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_commerce_orders_currency" AS ENUM('KRW'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_commerce_orders_payment_method" AS ENUM('card', 'bank_transfer'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_commerce_orders_payment_status" AS ENUM('pending', 'paid', 'failed', 'canceled'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_commerce_orders_status" AS ENUM('awaiting_payment', 'paid', 'preparing', 'shipped', 'completed', 'canceled'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_exports_format" AS ENUM('csv', 'json'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_exports_sort_order" AS ENUM('asc', 'desc'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_exports_locale" AS ENUM('all', 'en', 'ko'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_exports_drafts" AS ENUM('yes', 'no'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_imports_import_mode" AS ENUM('create', 'update', 'upsert'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_imports_status" AS ENUM('pending', 'completed', 'partial', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_redirects_to_type" AS ENUM('reference', 'custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'welcomeUser', 'welcomeUsers', 'refreshSearchScores', 'createCollectionExport', 'createCollectionImport', 'schedulePublish'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_payload_jobs_workflow_slug" AS ENUM('onboardUsers', 'refreshSearch'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'welcomeUser', 'welcomeUsers', 'refreshSearchScores', 'createCollectionExport', 'createCollectionImport', 'schedulePublish'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_payload_folders_folder_type" AS ENUM('userMedia'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_header_nav_items_link_type" AS ENUM('reference', 'custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_header_nav_items_link_appearance" AS ENUM('default'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_footer_nav_items_link_type" AS ENUM('reference', 'custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_footer_column1_links_link_type" AS ENUM('reference', 'custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_footer_column2_links_link_type" AS ENUM('reference', 'custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  DO $guard$ BEGIN CREATE TYPE "public"."enum_footer_column3_links_link_type" AS ENUM('reference', 'custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;
  CREATE TABLE IF NOT EXISTS "users" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"slug" varchar,
  	"first_name" varchar,
  	"last_name" varchar,
  	"verified" boolean DEFAULT false,
  	"username" varchar,
  	"bio" varchar DEFAULT 'A member of The Hideaway.',
  	"location" varchar DEFAULT 'Seoul',
  	"link" varchar DEFAULT 'https://thehideaway.com',
  	"email" varchar,
  	"role" "enum_users_role" DEFAULT 'user',
  	"onboarded" boolean DEFAULT false,
  	"banned" boolean DEFAULT false,
  	"two_factor_enabled" boolean DEFAULT false,
  	"email_verified" boolean DEFAULT false,
  	"name" varchar DEFAULT '',
  	"portrait" varchar,
  	"onboarding_progress" jsonb,
  	"image" varchar,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"display_username" varchar,
  	"normalized_email" varchar,
  	"ban_reason" varchar,
  	"ban_expires" timestamp(3) with time zone,
  	"_status" "enum_users_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "users_locales" (
  	"meta_title" varchar,
  	"meta_image_id" uuid,
  	"meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_users_v" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"parent_id" uuid,
  	"version_slug" varchar,
  	"version_first_name" varchar,
  	"version_last_name" varchar,
  	"version_verified" boolean DEFAULT false,
  	"version_username" varchar,
  	"version_bio" varchar DEFAULT 'A member of The Hideaway.',
  	"version_location" varchar DEFAULT 'Seoul',
  	"version_link" varchar DEFAULT 'https://thehideaway.com',
  	"version_email" varchar,
  	"version_role" "enum__users_v_version_role" DEFAULT 'user',
  	"version_onboarded" boolean DEFAULT false,
  	"version_banned" boolean DEFAULT false,
  	"version_two_factor_enabled" boolean DEFAULT false,
  	"version_email_verified" boolean DEFAULT false,
  	"version_name" varchar DEFAULT '',
  	"version_portrait" varchar,
  	"version_onboarding_progress" jsonb,
  	"version_image" varchar,
  	"version_created_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_display_username" varchar,
  	"version_normalized_email" varchar,
  	"version_ban_reason" varchar,
  	"version_ban_expires" timestamp(3) with time zone,
  	"version__status" "enum__users_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__users_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_users_v_locales" (
  	"version_meta_title" varchar,
  	"version_meta_image_id" uuid,
  	"version_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "sessions" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"token" varchar NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"ip_address" varchar,
  	"user_agent" varchar,
  	"user_id" uuid NOT NULL,
  	"impersonated_by_id" uuid,
  	"active_organization_id" uuid,
  	"active_team_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "accounts" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"account_id" varchar NOT NULL,
  	"provider_id" varchar NOT NULL,
  	"user_id" uuid NOT NULL,
  	"access_token" varchar,
  	"refresh_token" varchar,
  	"id_token" varchar,
  	"access_token_expires_at" timestamp(3) with time zone,
  	"refresh_token_expires_at" timestamp(3) with time zone,
  	"scope" varchar,
  	"password" varchar,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "verifications" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"identifier" varchar NOT NULL,
  	"value" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "two_factors" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"secret" varchar NOT NULL,
  	"backup_codes" varchar NOT NULL,
  	"user_id" uuid NOT NULL,
  	"verified" boolean DEFAULT true,
  	"failed_verification_count" numeric DEFAULT 0,
  	"locked_until" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "passkeys" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"name" varchar,
  	"public_key" varchar NOT NULL,
  	"user_id" uuid NOT NULL,
  	"credential_id" varchar NOT NULL,
  	"counter" numeric NOT NULL,
  	"device_type" varchar NOT NULL,
  	"backed_up" boolean DEFAULT false NOT NULL,
  	"transports" varchar NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"aaguid" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "organizations" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"logo" varchar,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"metadata" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "teams" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"name" varchar NOT NULL,
  	"organization_id" uuid NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "team_members" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"team_id" uuid NOT NULL,
  	"user_id" uuid NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "members" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"organization_id" uuid NOT NULL,
  	"user_id" uuid NOT NULL,
  	"role" varchar DEFAULT 'member' NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "invitations" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"organization_id" uuid NOT NULL,
  	"email" varchar NOT NULL,
  	"role" varchar,
  	"team" varchar,
  	"status" varchar DEFAULT 'pending' NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"inviter_id" uuid NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "admin_invitations" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"role" "enum_admin_invitations_role" DEFAULT 'admin' NOT NULL,
  	"email" varchar NOT NULL,
  	"token" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "assets" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"alt" varchar DEFAULT 'an image' NOT NULL,
  	"caption" varchar,
  	"locked" boolean DEFAULT false,
  	"authority" numeric DEFAULT 0,
  	"audience" "enum_assets_audience" DEFAULT 'public',
  	"darkmode" boolean DEFAULT false NOT NULL,
  	"blur_data_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_content_url" varchar,
  	"sizes_content_width" numeric,
  	"sizes_content_height" numeric,
  	"sizes_content_mime_type" varchar,
  	"sizes_content_filesize" numeric,
  	"sizes_content_filename" varchar,
  	"sizes_content_wide_url" varchar,
  	"sizes_content_wide_width" numeric,
  	"sizes_content_wide_height" numeric,
  	"sizes_content_wide_mime_type" varchar,
  	"sizes_content_wide_filesize" numeric,
  	"sizes_content_wide_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "assets_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "categories" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"slug" varchar NOT NULL,
  	"popularity" numeric DEFAULT 0 NOT NULL,
  	"identity_accent" "enum_categories_identity_accent" DEFAULT 'none' NOT NULL,
  	"identity_layout" "enum_categories_identity_layout" DEFAULT 'left' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "categories_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "media" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"author_id" uuid NOT NULL,
  	"locked" boolean DEFAULT false,
  	"authority" numeric DEFAULT 0,
  	"audience" "enum_media_audience" DEFAULT 'public',
  	"alt" varchar DEFAULT 'an image' NOT NULL,
  	"darkmode" boolean DEFAULT false NOT NULL,
  	"caption" varchar,
  	"blur_data_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_content_url" varchar,
  	"sizes_content_width" numeric,
  	"sizes_content_height" numeric,
  	"sizes_content_mime_type" varchar,
  	"sizes_content_filesize" numeric,
  	"sizes_content_filename" varchar,
  	"sizes_content_wide_url" varchar,
  	"sizes_content_wide_width" numeric,
  	"sizes_content_wide_height" numeric,
  	"sizes_content_wide_mime_type" varchar,
  	"sizes_content_wide_filesize" numeric,
  	"sizes_content_wide_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "media_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "tags" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"title" varchar NOT NULL,
  	"author_id" uuid NOT NULL,
  	"slug_key" varchar,
  	"hash_id" varchar(11) DEFAULT nanoid(11) NOT NULL,
  	"slug_lock" boolean NOT NULL,
  	"slug" varchar NOT NULL,
  	"tag_count" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "notifications" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"recipient_id" uuid NOT NULL,
  	"thumbnail_id" uuid,
  	"type" "enum_notifications_type" DEFAULT 'system' NOT NULL,
  	"importance" numeric DEFAULT 0 NOT NULL,
  	"status" "enum_notifications_status" DEFAULT 'unread' NOT NULL,
  	"read" boolean DEFAULT false NOT NULL,
  	"dismissed" boolean DEFAULT false NOT NULL,
  	"read_at" timestamp(3) with time zone,
  	"sticky" boolean DEFAULT false NOT NULL,
  	"title" varchar NOT NULL,
  	"content" varchar NOT NULL,
  	"action_link_type" "enum_notifications_action_link_type" DEFAULT 'reference' NOT NULL,
  	"action_link_new_tab" boolean DEFAULT false NOT NULL,
  	"action_link_url" varchar,
  	"action_link_label" varchar NOT NULL,
  	"action_link_appearance" "enum_notifications_action_link_appearance" DEFAULT 'default',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "notifications_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" uuid,
  	"surf_id" uuid,
  	"users_id" uuid,
  	"profile_id" uuid,
  	"bookmarks_id" uuid,
  	"follows_id" uuid,
  	"responses_id" uuid,
  	"pages_id" uuid,
  	"albums_id" uuid,
  	"tracks_id" uuid,
  	"playlists_id" uuid,
  	"organizations_id" uuid,
  	"categories_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "pages_hero_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"link_type" "enum_pages_hero_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean DEFAULT false,
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_appearance" "enum_pages_hero_links_link_appearance" DEFAULT 'default'
  );
  
  CREATE TABLE IF NOT EXISTS "pages_blocks_cta_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"link_type" "enum_pages_blocks_cta_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean DEFAULT false,
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_appearance" "enum_pages_blocks_cta_links_link_appearance" DEFAULT 'default'
  );
  
  CREATE TABLE IF NOT EXISTS "pages_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"rich_text" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "pages_blocks_content_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"size" "enum_pages_blocks_content_columns_size" DEFAULT 'oneThird',
  	"rich_text" jsonb,
  	"enable_link" boolean,
  	"link_type" "enum_pages_blocks_content_columns_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean DEFAULT false,
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_appearance" "enum_pages_blocks_content_columns_link_appearance" DEFAULT 'default'
  );
  
  CREATE TABLE IF NOT EXISTS "pages_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "pages_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"span" numeric DEFAULT 600,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "pages_blocks_archive" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"intro_content" jsonb,
  	"populate_by" "enum_pages_blocks_archive_populate_by" DEFAULT 'collection',
  	"relation_to" "enum_pages_blocks_archive_relation_to" DEFAULT 'posts',
  	"limit" numeric DEFAULT 8,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "pages_blocks_fotd_relation_to" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_pages_blocks_fotd_relation_to",
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "pages_blocks_fotd" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"headline" varchar DEFAULT 'ONE-STOP ARCHIVE FOR YOUR LIFE.',
  	"subheading" jsonb,
  	"populate_by" "enum_pages_blocks_fotd_populate_by" DEFAULT 'collection',
  	"limit" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "pages_blocks_hero_square" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"intro_content" jsonb,
  	"populate_by" "enum_pages_blocks_hero_square_populate_by" DEFAULT 'collection',
  	"limit" numeric DEFAULT 10,
  	"relation_to" "enum_pages_blocks_hero_square_relation_to" DEFAULT 'posts',
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "pages" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"title" varchar,
  	"hero_type" "enum_pages_hero_type" DEFAULT 'lowImpact',
  	"hero_rich_text" jsonb,
  	"hero_media_id" uuid,
  	"page_layout_footer_type" "enum_pages_page_layout_footer_type" DEFAULT 'standard',
  	"published_at" timestamp(3) with time zone,
  	"slug_key" varchar,
  	"hash_id" varchar(11) DEFAULT nanoid(11) NOT NULL,
  	"slug_lock" boolean,
  	"slug" varchar,
  	"locked" boolean DEFAULT false,
  	"authority" numeric DEFAULT 0,
  	"audience" "enum_pages_audience" DEFAULT 'public',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "pages_locales" (
  	"meta_title" varchar,
  	"meta_image_id" uuid,
  	"meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" uuid,
  	"posts_id" uuid,
  	"surf_id" uuid,
  	"users_id" uuid,
  	"albums_id" uuid,
  	"tracks_id" uuid,
  	"playlists_id" uuid,
  	"organizations_id" uuid,
  	"categories_id" uuid,
  	"media_id" uuid,
  	"user_media_id" uuid,
  	"assets_id" uuid,
  	"tags_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v_version_hero_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"link_type" "enum__pages_v_version_hero_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean DEFAULT false,
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_appearance" "enum__pages_v_version_hero_links_link_appearance" DEFAULT 'default',
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v_blocks_cta_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"link_type" "enum__pages_v_blocks_cta_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean DEFAULT false,
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_appearance" "enum__pages_v_blocks_cta_links_link_appearance" DEFAULT 'default',
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"_uuid" varchar,
  	"rich_text" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v_blocks_content_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"_uuid" varchar,
  	"size" "enum__pages_v_blocks_content_columns_size" DEFAULT 'oneThird',
  	"rich_text" jsonb,
  	"enable_link" boolean,
  	"link_type" "enum__pages_v_blocks_content_columns_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean DEFAULT false,
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_appearance" "enum__pages_v_blocks_content_columns_link_appearance" DEFAULT 'default'
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"_uuid" varchar,
  	"span" numeric DEFAULT 600,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v_blocks_archive" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"_uuid" varchar,
  	"intro_content" jsonb,
  	"populate_by" "enum__pages_v_blocks_archive_populate_by" DEFAULT 'collection',
  	"relation_to" "enum__pages_v_blocks_archive_relation_to" DEFAULT 'posts',
  	"limit" numeric DEFAULT 8,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v_blocks_fotd_relation_to" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__pages_v_blocks_fotd_relation_to",
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v_blocks_fotd" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"_uuid" varchar,
  	"headline" varchar DEFAULT 'ONE-STOP ARCHIVE FOR YOUR LIFE.',
  	"subheading" jsonb,
  	"populate_by" "enum__pages_v_blocks_fotd_populate_by" DEFAULT 'collection',
  	"limit" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v_blocks_hero_square" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"_uuid" varchar,
  	"intro_content" jsonb,
  	"populate_by" "enum__pages_v_blocks_hero_square_populate_by" DEFAULT 'collection',
  	"limit" numeric DEFAULT 10,
  	"relation_to" "enum__pages_v_blocks_hero_square_relation_to" DEFAULT 'posts',
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_hero_type" "enum__pages_v_version_hero_type" DEFAULT 'lowImpact',
  	"version_hero_rich_text" jsonb,
  	"version_hero_media_id" uuid,
  	"version_page_layout_footer_type" "enum__pages_v_version_page_layout_footer_type" DEFAULT 'standard',
  	"version_published_at" timestamp(3) with time zone,
  	"version_slug_key" varchar,
  	"version_hash_id" varchar(11) NOT NULL,
  	"version_slug_lock" boolean,
  	"version_slug" varchar,
  	"version_locked" boolean DEFAULT false,
  	"version_authority" numeric DEFAULT 0,
  	"version_audience" "enum__pages_v_version_audience" DEFAULT 'public',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__pages_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v_locales" (
  	"version_meta_title" varchar,
  	"version_meta_image_id" uuid,
  	"version_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" uuid,
  	"posts_id" uuid,
  	"surf_id" uuid,
  	"users_id" uuid,
  	"albums_id" uuid,
  	"tracks_id" uuid,
  	"playlists_id" uuid,
  	"organizations_id" uuid,
  	"categories_id" uuid,
  	"media_id" uuid,
  	"user_media_id" uuid,
  	"assets_id" uuid,
  	"tags_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "posts" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"cover_position" numeric DEFAULT 35,
  	"title" varchar,
  	"rich_title" jsonb,
  	"content" jsonb,
  	"subtitle" varchar,
  	"category_id" uuid,
  	"slug_key" varchar,
  	"comments_enabled" boolean DEFAULT true,
  	"hash_id" varchar(11) DEFAULT nanoid(11) NOT NULL,
  	"slug_lock" boolean,
  	"slug" varchar,
  	"published_at" timestamp(3) with time zone,
  	"author_id" uuid,
  	"approved_by_editor" boolean DEFAULT false,
  	"featured" boolean DEFAULT false,
  	"front_eligible" boolean DEFAULT false,
  	"locked" boolean DEFAULT false,
  	"authority" numeric DEFAULT 0,
  	"audience" "enum_posts_audience" DEFAULT 'public',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "posts_locales" (
  	"meta_title" varchar,
  	"meta_image_id" uuid,
  	"meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"user_media_id" uuid,
  	"assets_id" uuid,
  	"media_id" uuid,
  	"tags_id" uuid,
  	"posts_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "_posts_v" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"parent_id" uuid,
  	"version_cover_position" numeric DEFAULT 35,
  	"version_title" varchar,
  	"version_rich_title" jsonb,
  	"version_content" jsonb,
  	"version_subtitle" varchar,
  	"version_category_id" uuid,
  	"version_slug_key" varchar,
  	"version_comments_enabled" boolean DEFAULT true,
  	"version_hash_id" varchar(11) NOT NULL,
  	"version_slug_lock" boolean,
  	"version_slug" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_author_id" uuid,
  	"version_approved_by_editor" boolean DEFAULT false,
  	"version_featured" boolean DEFAULT false,
  	"version_front_eligible" boolean DEFAULT false,
  	"version_locked" boolean DEFAULT false,
  	"version_authority" numeric DEFAULT 0,
  	"version_audience" "enum__posts_v_version_audience" DEFAULT 'public',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__posts_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_posts_v_locales" (
  	"version_meta_title" varchar,
  	"version_meta_image_id" uuid,
  	"version_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_posts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"user_media_id" uuid,
  	"assets_id" uuid,
  	"media_id" uuid,
  	"tags_id" uuid,
  	"posts_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "user_media" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"author_id" uuid NOT NULL,
  	"locked" boolean DEFAULT false,
  	"authority" numeric DEFAULT 0,
  	"audience" "enum_user_media_audience" DEFAULT 'public',
  	"alt" varchar DEFAULT 'an image' NOT NULL,
  	"darkmode" boolean DEFAULT false NOT NULL,
  	"caption" varchar,
  	"blur_data_url" varchar,
  	"folder_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_content_url" varchar,
  	"sizes_content_width" numeric,
  	"sizes_content_height" numeric,
  	"sizes_content_mime_type" varchar,
  	"sizes_content_filesize" numeric,
  	"sizes_content_filename" varchar,
  	"sizes_content_wide_url" varchar,
  	"sizes_content_wide_width" numeric,
  	"sizes_content_wide_height" numeric,
  	"sizes_content_wide_mime_type" varchar,
  	"sizes_content_wide_filesize" numeric,
  	"sizes_content_wide_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "user_media_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "email_quota" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"date" varchar NOT NULL,
  	"used" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "deferred_emails" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"email_data" varchar NOT NULL,
  	"category" "enum_deferred_emails_category" NOT NULL,
  	"scheduled_for" timestamp(3) with time zone NOT NULL,
  	"attempts" numeric DEFAULT 0 NOT NULL,
  	"status" "enum_deferred_emails_status" DEFAULT 'pending' NOT NULL,
  	"sent_at" timestamp(3) with time zone,
  	"last_error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "profile_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"title" varchar,
  	"visuals_id" uuid,
  	"content" jsonb
  );
  
  CREATE TABLE IF NOT EXISTS "profile_rsvp_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"media_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "profile" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"author_id" uuid,
  	"slug" varchar DEFAULT '',
  	"title" varchar DEFAULT '',
  	"hero_title" varchar DEFAULT '',
  	"hero_subtitle" varchar DEFAULT '',
  	"hero_gradient1" varchar DEFAULT '#FC8D8DFF',
  	"hero_gradient2" varchar DEFAULT '#F3FAFCFF',
  	"rsvp_tier" "enum_profile_rsvp_tier" DEFAULT 'guest',
  	"rsvp_intro" varchar,
  	"rsvp_ig_handle" varchar,
  	"locked" boolean DEFAULT false,
  	"authority" numeric DEFAULT 0,
  	"audience" "enum_profile_audience" DEFAULT 'public',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_profile_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "profile_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "_profile_v_version_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"_uuid" varchar,
  	"title" varchar,
  	"visuals_id" uuid,
  	"content" jsonb
  );
  
  CREATE TABLE IF NOT EXISTS "_profile_v_version_rsvp_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"_uuid" varchar,
  	"media_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "_profile_v" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"parent_id" uuid,
  	"version_author_id" uuid,
  	"version_slug" varchar DEFAULT '',
  	"version_title" varchar DEFAULT '',
  	"version_hero_title" varchar DEFAULT '',
  	"version_hero_subtitle" varchar DEFAULT '',
  	"version_hero_gradient1" varchar DEFAULT '#FC8D8DFF',
  	"version_hero_gradient2" varchar DEFAULT '#F3FAFCFF',
  	"version_rsvp_tier" "enum__profile_v_version_rsvp_tier" DEFAULT 'guest',
  	"version_rsvp_intro" varchar,
  	"version_rsvp_ig_handle" varchar,
  	"version_locked" boolean DEFAULT false,
  	"version_authority" numeric DEFAULT 0,
  	"version_audience" "enum__profile_v_version_audience" DEFAULT 'public',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__profile_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__profile_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_profile_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "albums" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"title" varchar,
  	"release_date" timestamp(3) with time zone,
  	"cover_id" uuid,
  	"artist" varchar,
  	"description" varchar,
  	"visibility" "enum_albums_visibility" DEFAULT 'public',
  	"published_at" timestamp(3) with time zone,
  	"author_id" uuid,
  	"slug_key" varchar,
  	"hash_id" varchar(11) DEFAULT nanoid(11) NOT NULL,
  	"slug_lock" boolean,
  	"slug" varchar,
  	"locked" boolean DEFAULT false,
  	"authority" numeric DEFAULT 0,
  	"audience" "enum_albums_audience" DEFAULT 'public',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_albums_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "albums_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "_albums_v" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_release_date" timestamp(3) with time zone,
  	"version_cover_id" uuid,
  	"version_artist" varchar,
  	"version_description" varchar,
  	"version_visibility" "enum__albums_v_version_visibility" DEFAULT 'public',
  	"version_published_at" timestamp(3) with time zone,
  	"version_author_id" uuid,
  	"version_slug_key" varchar,
  	"version_hash_id" varchar(11) NOT NULL,
  	"version_slug_lock" boolean,
  	"version_slug" varchar,
  	"version_locked" boolean DEFAULT false,
  	"version_authority" numeric DEFAULT 0,
  	"version_audience" "enum__albums_v_version_audience" DEFAULT 'public',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__albums_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__albums_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_albums_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "tracks" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"title" varchar,
  	"published_at" timestamp(3) with time zone,
  	"track_number" numeric,
  	"album_id" uuid,
  	"duration" numeric,
  	"album_slug" varchar,
  	"artist" varchar,
  	"description" varchar,
  	"visibility" "enum_tracks_visibility" DEFAULT 'public',
  	"author_id" uuid,
  	"slug_key" varchar,
  	"hash_id" varchar(11) DEFAULT nanoid(11) NOT NULL,
  	"slug_lock" boolean,
  	"slug" varchar,
  	"locked" boolean DEFAULT false,
  	"authority" numeric DEFAULT 0,
  	"audience" "enum_tracks_audience" DEFAULT 'public',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_tracks_status" DEFAULT 'draft',
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE IF NOT EXISTS "tracks_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "_tracks_v" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_track_number" numeric,
  	"version_album_id" uuid,
  	"version_duration" numeric,
  	"version_album_slug" varchar,
  	"version_artist" varchar,
  	"version_description" varchar,
  	"version_visibility" "enum__tracks_v_version_visibility" DEFAULT 'public',
  	"version_author_id" uuid,
  	"version_slug_key" varchar,
  	"version_hash_id" varchar(11) NOT NULL,
  	"version_slug_lock" boolean,
  	"version_slug" varchar,
  	"version_locked" boolean DEFAULT false,
  	"version_authority" numeric DEFAULT 0,
  	"version_audience" "enum__tracks_v_version_audience" DEFAULT 'public',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__tracks_v_version_status" DEFAULT 'draft',
  	"version_url" varchar,
  	"version_thumbnail_u_r_l" varchar,
  	"version_filename" varchar,
  	"version_mime_type" varchar,
  	"version_filesize" numeric,
  	"version_width" numeric,
  	"version_height" numeric,
  	"version_focal_x" numeric,
  	"version_focal_y" numeric,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__tracks_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_tracks_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "playlists" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"cover_id" uuid,
  	"title" varchar,
  	"description" varchar,
  	"visibility" "enum_playlists_visibility" DEFAULT 'public',
  	"published_at" timestamp(3) with time zone,
  	"slug_key" varchar,
  	"hash_id" varchar(11) DEFAULT nanoid(11) NOT NULL,
  	"slug_lock" boolean,
  	"slug" varchar,
  	"locked" boolean DEFAULT false,
  	"authority" numeric DEFAULT 0,
  	"audience" "enum_playlists_audience" DEFAULT 'public',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_playlists_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "playlists_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"tracks_id" uuid,
  	"tags_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "_playlists_v" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"parent_id" uuid,
  	"version_cover_id" uuid,
  	"version_title" varchar,
  	"version_description" varchar,
  	"version_visibility" "enum__playlists_v_version_visibility" DEFAULT 'public',
  	"version_published_at" timestamp(3) with time zone,
  	"version_slug_key" varchar,
  	"version_hash_id" varchar(11) NOT NULL,
  	"version_slug_lock" boolean,
  	"version_slug" varchar,
  	"version_locked" boolean DEFAULT false,
  	"version_authority" numeric DEFAULT 0,
  	"version_audience" "enum__playlists_v_version_audience" DEFAULT 'public',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__playlists_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__playlists_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_playlists_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"tracks_id" uuid,
  	"tags_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "follows" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"user_id" uuid NOT NULL,
  	"target_id" uuid NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "bookmarks" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"user_id" uuid NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "bookmarks_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" uuid,
  	"surf_id" uuid,
  	"profile_id" uuid,
  	"users_id" uuid,
  	"albums_id" uuid,
  	"playlists_id" uuid,
  	"tracks_id" uuid,
  	"user_media_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "user_views" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"user_id" uuid NOT NULL,
  	"version" varchar DEFAULT '0' NOT NULL,
  	"viewed" boolean DEFAULT false NOT NULL,
  	"progress" numeric DEFAULT 0 NOT NULL,
  	"last_viewed" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "user_views_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" uuid,
  	"surf_id" uuid,
  	"playlists_id" uuid,
  	"profile_id" uuid,
  	"albums_id" uuid,
  	"tracks_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "surf" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"title" varchar,
  	"rich_title" jsonb,
  	"source" "enum_surf_source" DEFAULT 'external',
  	"content" jsonb,
  	"category_id" uuid,
  	"slug_key" varchar,
  	"hash_id" varchar(11) DEFAULT nanoid(11) NOT NULL,
  	"comments_enabled" boolean DEFAULT true,
  	"slug_lock" boolean,
  	"slug" varchar,
  	"published_at" timestamp(3) with time zone,
  	"author_id" uuid,
  	"locked" boolean DEFAULT false,
  	"authority" numeric DEFAULT 0,
  	"audience" "enum_surf_audience" DEFAULT 'public',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_surf_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "surf_locales" (
  	"meta_title" varchar,
  	"meta_image_id" uuid,
  	"meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "surf_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" uuid,
  	"surf_id" uuid,
  	"posts_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "_surf_v" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_rich_title" jsonb,
  	"version_source" "enum__surf_v_version_source" DEFAULT 'external',
  	"version_content" jsonb,
  	"version_category_id" uuid,
  	"version_slug_key" varchar,
  	"version_hash_id" varchar(11) NOT NULL,
  	"version_comments_enabled" boolean DEFAULT true,
  	"version_slug_lock" boolean,
  	"version_slug" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_author_id" uuid,
  	"version_locked" boolean DEFAULT false,
  	"version_authority" numeric DEFAULT 0,
  	"version_audience" "enum__surf_v_version_audience" DEFAULT 'public',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__surf_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__surf_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_surf_v_locales" (
  	"version_meta_title" varchar,
  	"version_meta_image_id" uuid,
  	"version_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_surf_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" uuid,
  	"surf_id" uuid,
  	"posts_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "citations" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"path" varchar DEFAULT '' NOT NULL,
  	"reference" varchar NOT NULL,
  	"selection_text" varchar NOT NULL,
  	"selection_before" varchar DEFAULT '' NOT NULL,
  	"selection_after" varchar DEFAULT '' NOT NULL,
  	"private" boolean DEFAULT false NOT NULL,
  	"quote" varchar DEFAULT '' NOT NULL,
  	"author_id" uuid NOT NULL,
  	"cited_id" uuid NOT NULL,
  	"memo" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "citations_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"surf_id" uuid,
  	"posts_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "responses" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"content" jsonb,
  	"author_id" uuid,
  	"is_edited" boolean DEFAULT false,
  	"depth" numeric DEFAULT 0,
  	"hash" varchar,
  	"is_sticky" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_responses_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "responses_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" uuid,
  	"surf_id" uuid,
  	"responses_id" uuid,
  	"citations_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "_responses_v" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"parent_id" uuid,
  	"version_content" jsonb,
  	"version_author_id" uuid,
  	"version_is_edited" boolean DEFAULT false,
  	"version_depth" numeric DEFAULT 0,
  	"version_hash" varchar,
  	"version_is_sticky" boolean,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__responses_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__responses_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_responses_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" uuid,
  	"surf_id" uuid,
  	"responses_id" uuid,
  	"citations_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "compilations" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"title" varchar NOT NULL,
  	"hash_id" varchar(11) DEFAULT nanoid(11) NOT NULL,
  	"description" varchar,
  	"author_id" uuid NOT NULL,
  	"visibility" "enum_compilations_visibility" DEFAULT 'private' NOT NULL,
  	"cover_image_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "compilations_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" uuid,
  	"surf_id" uuid,
  	"profile_id" uuid,
  	"albums_id" uuid,
  	"playlists_id" uuid,
  	"tracks_id" uuid,
  	"user_media_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "commerce_products" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"active" boolean DEFAULT false NOT NULL,
  	"unit_amount" numeric NOT NULL,
  	"currency" "enum_commerce_products_currency" DEFAULT 'KRW' NOT NULL,
  	"max_quantity" numeric DEFAULT 1 NOT NULL,
  	"summary" varchar,
  	"description" jsonb,
  	"details" varchar,
  	"care" varchar,
  	"shipping_returns" varchar,
  	"hero_media_id" uuid,
  	"sort" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "commerce_products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "commerce_orders" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"ref" varchar NOT NULL,
  	"user_id" uuid NOT NULL,
  	"product_id" uuid NOT NULL,
  	"product_name_snapshot" varchar NOT NULL,
  	"product_slug_snapshot" varchar NOT NULL,
  	"quantity" numeric NOT NULL,
  	"unit_amount_snapshot" numeric NOT NULL,
  	"total_amount" numeric NOT NULL,
  	"currency" "enum_commerce_orders_currency" DEFAULT 'KRW' NOT NULL,
  	"payment_method" "enum_commerce_orders_payment_method" NOT NULL,
  	"payment_status" "enum_commerce_orders_payment_status" DEFAULT 'pending' NOT NULL,
  	"status" "enum_commerce_orders_status" DEFAULT 'awaiting_payment' NOT NULL,
  	"contact" jsonb NOT NULL,
  	"shipping" jsonb NOT NULL,
  	"idempotency_key" varchar NOT NULL,
  	"request_hash" varchar NOT NULL,
  	"provider_payment_id" uuid,
  	"provider_transaction_id" uuid,
  	"bank_transfer_reference" varchar,
  	"tracking_number" varchar,
  	"paid_at" timestamp(3) with time zone,
  	"shipped_at" timestamp(3) with time zone,
  	"completed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "admins" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"email" varchar NOT NULL,
  	"foto_id" uuid,
  	"link" varchar,
  	"bio" varchar DEFAULT 'A Patron of The Hideaway.',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"enable_a_p_i_key" boolean,
  	"api_key" varchar,
  	"api_key_index" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_admins_v" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"parent_id" uuid,
  	"version_email" varchar NOT NULL,
  	"version_foto_id" uuid,
  	"version_link" varchar,
  	"version_bio" varchar DEFAULT 'A Patron of The Hideaway.',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version_enable_a_p_i_key" boolean,
  	"version_api_key" varchar,
  	"version_api_key_index" varchar,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "exports" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"name" varchar,
  	"format" "enum_exports_format" DEFAULT 'csv' NOT NULL,
  	"limit" numeric,
  	"page" numeric DEFAULT 1,
  	"sort" varchar,
  	"sort_order" "enum_exports_sort_order",
  	"locale" "enum_exports_locale" DEFAULT 'all',
  	"drafts" "enum_exports_drafts" DEFAULT 'yes',
  	"collection_slug" varchar DEFAULT 'posts' NOT NULL,
  	"where" jsonb DEFAULT '{}'::jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE IF NOT EXISTS "exports_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "imports" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"collection_slug" varchar DEFAULT 'posts' NOT NULL,
  	"import_mode" "enum_imports_import_mode",
  	"match_field" varchar DEFAULT 'id',
  	"status" "enum_imports_status" DEFAULT 'pending',
  	"summary_imported" numeric,
  	"summary_updated" numeric,
  	"summary_total" numeric,
  	"summary_issues" numeric,
  	"summary_issue_details" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE IF NOT EXISTS "redirects" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"from" varchar NOT NULL,
  	"to_type" "enum_redirects_to_type" DEFAULT 'reference',
  	"to_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "redirects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" uuid,
  	"posts_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "search_author" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"key" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"image" varchar,
  	"slug" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "search_allow_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"key" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "search_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"key" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "search_category" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"key" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "search" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"priority" numeric,
  	"collection" varchar DEFAULT 'posts',
  	"score" numeric DEFAULT 0,
  	"slug" varchar NOT NULL,
  	"locked" boolean DEFAULT false NOT NULL,
  	"authority" numeric DEFAULT 0,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "search_locales" (
  	"title" varchar DEFAULT '' NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "search_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" uuid,
  	"surf_id" uuid,
  	"profile_id" uuid,
  	"pages_id" uuid,
  	"tracks_id" uuid,
  	"playlists_id" uuid,
  	"albums_id" uuid,
  	"media_id" uuid,
  	"assets_id" uuid,
  	"user_media_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload_kv" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar(24) PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE IF NOT EXISTS "payload_jobs" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"workflow_slug" "enum_payload_jobs_workflow_slug",
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_folders_folder_type" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_payload_folders_folder_type",
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_folders" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"name" varchar NOT NULL,
  	"folder_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" uuid,
  	"sessions_id" uuid,
  	"accounts_id" uuid,
  	"verifications_id" uuid,
  	"two_factors_id" uuid,
  	"passkeys_id" uuid,
  	"organizations_id" uuid,
  	"teams_id" uuid,
  	"team_members_id" uuid,
  	"members_id" uuid,
  	"invitations_id" uuid,
  	"admin_invitations_id" uuid,
  	"assets_id" uuid,
  	"categories_id" uuid,
  	"media_id" uuid,
  	"notifications_id" uuid,
  	"pages_id" uuid,
  	"posts_id" uuid,
  	"user_media_id" uuid,
  	"email_quota_id" uuid,
  	"deferred_emails_id" uuid,
  	"profile_id" uuid,
  	"bookmarks_id" uuid,
  	"user_views_id" uuid,
  	"responses_id" uuid,
  	"compilations_id" uuid,
  	"commerce_products_id" uuid,
  	"commerce_orders_id" uuid,
  	"admins_id" uuid,
  	"redirects_id" uuid,
  	"search_id" uuid,
  	"payload_folders_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload_preferences" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" uuid,
  	"admins_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload_migrations" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "header_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"link_type" "enum_header_nav_items_link_type" DEFAULT 'reference' NOT NULL,
  	"link_new_tab" boolean DEFAULT false NOT NULL,
  	"link_url" varchar,
  	"link_label" varchar NOT NULL,
  	"link_appearance" "enum_header_nav_items_link_appearance" DEFAULT 'default',
  	"preview_media_desktop_id" uuid,
  	"preview_media_mobile_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "header" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "header_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"playlists_id" uuid,
  	"pages_id" uuid,
  	"posts_id" uuid,
  	"surf_id" uuid,
  	"users_id" uuid,
  	"albums_id" uuid,
  	"tracks_id" uuid,
  	"organizations_id" uuid,
  	"categories_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "footer_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"link_type" "enum_footer_nav_items_link_type" DEFAULT 'reference' NOT NULL,
  	"link_new_tab" boolean DEFAULT false NOT NULL,
  	"link_url" varchar,
  	"link_label" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "footer_column1_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"link_type" "enum_footer_column1_links_link_type" DEFAULT 'reference' NOT NULL,
  	"link_new_tab" boolean DEFAULT false NOT NULL,
  	"link_url" varchar,
  	"link_label" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "footer_column2_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"link_type" "enum_footer_column2_links_link_type" DEFAULT 'reference' NOT NULL,
  	"link_new_tab" boolean DEFAULT false NOT NULL,
  	"link_url" varchar,
  	"link_label" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "footer_column3_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"link_type" "enum_footer_column3_links_link_type" DEFAULT 'reference' NOT NULL,
  	"link_new_tab" boolean DEFAULT false NOT NULL,
  	"link_url" varchar,
  	"link_label" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "footer" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"title" varchar DEFAULT 'The Smoker''s Lounge',
  	"defaults_desktop_id" uuid,
  	"defaults_mobile_id" uuid,
  	"video_loop_desktop_id" uuid,
  	"video_loop_mobile_id" uuid,
  	"mobile_overlay" numeric DEFAULT 70,
  	"desktop_overlay" numeric DEFAULT 70,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "footer_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" uuid,
  	"posts_id" uuid,
  	"surf_id" uuid,
  	"users_id" uuid,
  	"albums_id" uuid,
  	"tracks_id" uuid,
  	"playlists_id" uuid,
  	"organizations_id" uuid,
  	"categories_id" uuid
  );
  
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_locales_meta_image_id_user_media_id_fk') THEN ALTER TABLE "users_locales" ADD CONSTRAINT "users_locales_meta_image_id_user_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."user_media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_locales_parent_id_fk') THEN ALTER TABLE "users_locales" ADD CONSTRAINT "users_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_users_v_parent_id_users_id_fk') THEN ALTER TABLE "_users_v" ADD CONSTRAINT "_users_v_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_users_v_locales_version_meta_image_id_user_media_id_fk') THEN ALTER TABLE "_users_v_locales" ADD CONSTRAINT "_users_v_locales_version_meta_image_id_user_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."user_media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_users_v_locales_parent_id_fk') THEN ALTER TABLE "_users_v_locales" ADD CONSTRAINT "_users_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_users_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_user_id_users_id_fk') THEN ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_impersonated_by_id_users_id_fk') THEN ALTER TABLE "sessions" ADD CONSTRAINT "sessions_impersonated_by_id_users_id_fk" FOREIGN KEY ("impersonated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_active_organization_id_organizations_id_fk') THEN ALTER TABLE "sessions" ADD CONSTRAINT "sessions_active_organization_id_organizations_id_fk" FOREIGN KEY ("active_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_active_team_id_teams_id_fk') THEN ALTER TABLE "sessions" ADD CONSTRAINT "sessions_active_team_id_teams_id_fk" FOREIGN KEY ("active_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'accounts_user_id_users_id_fk') THEN ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'two_factors_user_id_users_id_fk') THEN ALTER TABLE "two_factors" ADD CONSTRAINT "two_factors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'passkeys_user_id_users_id_fk') THEN ALTER TABLE "passkeys" ADD CONSTRAINT "passkeys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teams_organization_id_organizations_id_fk') THEN ALTER TABLE "teams" ADD CONSTRAINT "teams_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'team_members_team_id_teams_id_fk') THEN ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'team_members_user_id_users_id_fk') THEN ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'members_organization_id_organizations_id_fk') THEN ALTER TABLE "members" ADD CONSTRAINT "members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'members_user_id_users_id_fk') THEN ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invitations_organization_id_organizations_id_fk') THEN ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invitations_inviter_id_users_id_fk') THEN ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_rels_parent_fk') THEN ALTER TABLE "assets_rels" ADD CONSTRAINT "assets_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_rels_users_fk') THEN ALTER TABLE "assets_rels" ADD CONSTRAINT "assets_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_rels_parent_fk') THEN ALTER TABLE "categories_rels" ADD CONSTRAINT "categories_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_rels_categories_fk') THEN ALTER TABLE "categories_rels" ADD CONSTRAINT "categories_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'media_author_id_users_id_fk') THEN ALTER TABLE "media" ADD CONSTRAINT "media_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'media_rels_parent_fk') THEN ALTER TABLE "media_rels" ADD CONSTRAINT "media_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'media_rels_users_fk') THEN ALTER TABLE "media_rels" ADD CONSTRAINT "media_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tags_author_id_users_id_fk') THEN ALTER TABLE "tags" ADD CONSTRAINT "tags_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_recipient_id_users_id_fk') THEN ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_thumbnail_id_assets_id_fk') THEN ALTER TABLE "notifications" ADD CONSTRAINT "notifications_thumbnail_id_assets_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_rels_parent_fk') THEN ALTER TABLE "notifications_rels" ADD CONSTRAINT "notifications_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_rels_posts_fk') THEN ALTER TABLE "notifications_rels" ADD CONSTRAINT "notifications_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_rels_surf_fk') THEN ALTER TABLE "notifications_rels" ADD CONSTRAINT "notifications_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_rels_users_fk') THEN ALTER TABLE "notifications_rels" ADD CONSTRAINT "notifications_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_rels_profile_fk') THEN ALTER TABLE "notifications_rels" ADD CONSTRAINT "notifications_rels_profile_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_rels_bookmarks_fk') THEN ALTER TABLE "notifications_rels" ADD CONSTRAINT "notifications_rels_bookmarks_fk" FOREIGN KEY ("bookmarks_id") REFERENCES "public"."bookmarks"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_rels_follows_fk') THEN ALTER TABLE "notifications_rels" ADD CONSTRAINT "notifications_rels_follows_fk" FOREIGN KEY ("follows_id") REFERENCES "public"."follows"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_rels_responses_fk') THEN ALTER TABLE "notifications_rels" ADD CONSTRAINT "notifications_rels_responses_fk" FOREIGN KEY ("responses_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_rels_pages_fk') THEN ALTER TABLE "notifications_rels" ADD CONSTRAINT "notifications_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_rels_albums_fk') THEN ALTER TABLE "notifications_rels" ADD CONSTRAINT "notifications_rels_albums_fk" FOREIGN KEY ("albums_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_rels_tracks_fk') THEN ALTER TABLE "notifications_rels" ADD CONSTRAINT "notifications_rels_tracks_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_rels_playlists_fk') THEN ALTER TABLE "notifications_rels" ADD CONSTRAINT "notifications_rels_playlists_fk" FOREIGN KEY ("playlists_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_rels_organizations_fk') THEN ALTER TABLE "notifications_rels" ADD CONSTRAINT "notifications_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_rels_categories_fk') THEN ALTER TABLE "notifications_rels" ADD CONSTRAINT "notifications_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_hero_links_parent_id_fk') THEN ALTER TABLE "pages_hero_links" ADD CONSTRAINT "pages_hero_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_blocks_cta_links_parent_id_fk') THEN ALTER TABLE "pages_blocks_cta_links" ADD CONSTRAINT "pages_blocks_cta_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cta"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_blocks_cta_parent_id_fk') THEN ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_blocks_content_columns_parent_id_fk') THEN ALTER TABLE "pages_blocks_content_columns" ADD CONSTRAINT "pages_blocks_content_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_content"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_blocks_content_parent_id_fk') THEN ALTER TABLE "pages_blocks_content" ADD CONSTRAINT "pages_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_blocks_image_parent_id_fk') THEN ALTER TABLE "pages_blocks_image" ADD CONSTRAINT "pages_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_blocks_archive_parent_id_fk') THEN ALTER TABLE "pages_blocks_archive" ADD CONSTRAINT "pages_blocks_archive_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_blocks_fotd_relation_to_parent_fk') THEN ALTER TABLE "pages_blocks_fotd_relation_to" ADD CONSTRAINT "pages_blocks_fotd_relation_to_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages_blocks_fotd"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_blocks_fotd_parent_id_fk') THEN ALTER TABLE "pages_blocks_fotd" ADD CONSTRAINT "pages_blocks_fotd_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_blocks_hero_square_parent_id_fk') THEN ALTER TABLE "pages_blocks_hero_square" ADD CONSTRAINT "pages_blocks_hero_square_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_hero_media_id_media_id_fk') THEN ALTER TABLE "pages" ADD CONSTRAINT "pages_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_locales_meta_image_id_media_id_fk') THEN ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_locales_parent_id_fk') THEN ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_rels_parent_fk') THEN ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_rels_pages_fk') THEN ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_rels_posts_fk') THEN ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_rels_surf_fk') THEN ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_rels_users_fk') THEN ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_rels_albums_fk') THEN ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_albums_fk" FOREIGN KEY ("albums_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_rels_tracks_fk') THEN ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_tracks_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_rels_playlists_fk') THEN ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_playlists_fk" FOREIGN KEY ("playlists_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_rels_organizations_fk') THEN ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_rels_categories_fk') THEN ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_rels_media_fk') THEN ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_rels_user_media_fk') THEN ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_user_media_fk" FOREIGN KEY ("user_media_id") REFERENCES "public"."user_media"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_rels_assets_fk') THEN ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_assets_fk" FOREIGN KEY ("assets_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_rels_tags_fk') THEN ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_version_hero_links_parent_id_fk') THEN ALTER TABLE "_pages_v_version_hero_links" ADD CONSTRAINT "_pages_v_version_hero_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_blocks_cta_links_parent_id_fk') THEN ALTER TABLE "_pages_v_blocks_cta_links" ADD CONSTRAINT "_pages_v_blocks_cta_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cta"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_blocks_cta_parent_id_fk') THEN ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_blocks_content_columns_parent_id_fk') THEN ALTER TABLE "_pages_v_blocks_content_columns" ADD CONSTRAINT "_pages_v_blocks_content_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_content"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_blocks_content_parent_id_fk') THEN ALTER TABLE "_pages_v_blocks_content" ADD CONSTRAINT "_pages_v_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_blocks_image_parent_id_fk') THEN ALTER TABLE "_pages_v_blocks_image" ADD CONSTRAINT "_pages_v_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_blocks_archive_parent_id_fk') THEN ALTER TABLE "_pages_v_blocks_archive" ADD CONSTRAINT "_pages_v_blocks_archive_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_blocks_fotd_relation_to_parent_fk') THEN ALTER TABLE "_pages_v_blocks_fotd_relation_to" ADD CONSTRAINT "_pages_v_blocks_fotd_relation_to_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v_blocks_fotd"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_blocks_fotd_parent_id_fk') THEN ALTER TABLE "_pages_v_blocks_fotd" ADD CONSTRAINT "_pages_v_blocks_fotd_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_blocks_hero_square_parent_id_fk') THEN ALTER TABLE "_pages_v_blocks_hero_square" ADD CONSTRAINT "_pages_v_blocks_hero_square_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_parent_id_pages_id_fk') THEN ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_version_hero_media_id_media_id_fk') THEN ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_hero_media_id_media_id_fk" FOREIGN KEY ("version_hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_locales_version_meta_image_id_media_id_fk') THEN ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_locales_parent_id_fk') THEN ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_rels_parent_fk') THEN ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_rels_pages_fk') THEN ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_rels_posts_fk') THEN ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_rels_surf_fk') THEN ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_rels_users_fk') THEN ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_rels_albums_fk') THEN ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_albums_fk" FOREIGN KEY ("albums_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_rels_tracks_fk') THEN ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_tracks_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_rels_playlists_fk') THEN ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_playlists_fk" FOREIGN KEY ("playlists_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_rels_organizations_fk') THEN ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_rels_categories_fk') THEN ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_rels_media_fk') THEN ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_rels_user_media_fk') THEN ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_user_media_fk" FOREIGN KEY ("user_media_id") REFERENCES "public"."user_media"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_rels_assets_fk') THEN ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_assets_fk" FOREIGN KEY ("assets_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_rels_tags_fk') THEN ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_category_id_categories_id_fk') THEN ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_author_id_users_id_fk') THEN ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_locales_meta_image_id_media_id_fk') THEN ALTER TABLE "posts_locales" ADD CONSTRAINT "posts_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_locales_parent_id_fk') THEN ALTER TABLE "posts_locales" ADD CONSTRAINT "posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_rels_parent_fk') THEN ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_rels_user_media_fk') THEN ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_user_media_fk" FOREIGN KEY ("user_media_id") REFERENCES "public"."user_media"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_rels_assets_fk') THEN ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_assets_fk" FOREIGN KEY ("assets_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_rels_media_fk') THEN ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_rels_tags_fk') THEN ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_rels_posts_fk') THEN ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_rels_users_fk') THEN ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_posts_v_parent_id_posts_id_fk') THEN ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_posts_v_version_category_id_categories_id_fk') THEN ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_posts_v_version_author_id_users_id_fk') THEN ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_posts_v_locales_version_meta_image_id_media_id_fk') THEN ALTER TABLE "_posts_v_locales" ADD CONSTRAINT "_posts_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_posts_v_locales_parent_id_fk') THEN ALTER TABLE "_posts_v_locales" ADD CONSTRAINT "_posts_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_posts_v_rels_parent_fk') THEN ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_posts_v_rels_user_media_fk') THEN ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_user_media_fk" FOREIGN KEY ("user_media_id") REFERENCES "public"."user_media"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_posts_v_rels_assets_fk') THEN ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_assets_fk" FOREIGN KEY ("assets_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_posts_v_rels_media_fk') THEN ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_posts_v_rels_tags_fk') THEN ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_posts_v_rels_posts_fk') THEN ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_posts_v_rels_users_fk') THEN ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_media_author_id_users_id_fk') THEN ALTER TABLE "user_media" ADD CONSTRAINT "user_media_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_media_folder_id_payload_folders_id_fk') THEN ALTER TABLE "user_media" ADD CONSTRAINT "user_media_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_media_rels_parent_fk') THEN ALTER TABLE "user_media_rels" ADD CONSTRAINT "user_media_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."user_media"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_media_rels_users_fk') THEN ALTER TABLE "user_media_rels" ADD CONSTRAINT "user_media_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profile_slides_visuals_id_user_media_id_fk') THEN ALTER TABLE "profile_slides" ADD CONSTRAINT "profile_slides_visuals_id_user_media_id_fk" FOREIGN KEY ("visuals_id") REFERENCES "public"."user_media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profile_slides_parent_id_fk') THEN ALTER TABLE "profile_slides" ADD CONSTRAINT "profile_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profile_rsvp_gallery_media_id_user_media_id_fk') THEN ALTER TABLE "profile_rsvp_gallery" ADD CONSTRAINT "profile_rsvp_gallery_media_id_user_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."user_media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profile_rsvp_gallery_parent_id_fk') THEN ALTER TABLE "profile_rsvp_gallery" ADD CONSTRAINT "profile_rsvp_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profile_author_id_users_id_fk') THEN ALTER TABLE "profile" ADD CONSTRAINT "profile_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profile_rels_parent_fk') THEN ALTER TABLE "profile_rels" ADD CONSTRAINT "profile_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profile_rels_tags_fk') THEN ALTER TABLE "profile_rels" ADD CONSTRAINT "profile_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profile_rels_users_fk') THEN ALTER TABLE "profile_rels" ADD CONSTRAINT "profile_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_profile_v_version_slides_visuals_id_user_media_id_fk') THEN ALTER TABLE "_profile_v_version_slides" ADD CONSTRAINT "_profile_v_version_slides_visuals_id_user_media_id_fk" FOREIGN KEY ("visuals_id") REFERENCES "public"."user_media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_profile_v_version_slides_parent_id_fk') THEN ALTER TABLE "_profile_v_version_slides" ADD CONSTRAINT "_profile_v_version_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_profile_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_profile_v_version_rsvp_gallery_media_id_user_media_id_fk') THEN ALTER TABLE "_profile_v_version_rsvp_gallery" ADD CONSTRAINT "_profile_v_version_rsvp_gallery_media_id_user_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."user_media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_profile_v_version_rsvp_gallery_parent_id_fk') THEN ALTER TABLE "_profile_v_version_rsvp_gallery" ADD CONSTRAINT "_profile_v_version_rsvp_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_profile_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_profile_v_parent_id_profile_id_fk') THEN ALTER TABLE "_profile_v" ADD CONSTRAINT "_profile_v_parent_id_profile_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_profile_v_version_author_id_users_id_fk') THEN ALTER TABLE "_profile_v" ADD CONSTRAINT "_profile_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_profile_v_rels_parent_fk') THEN ALTER TABLE "_profile_v_rels" ADD CONSTRAINT "_profile_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_profile_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_profile_v_rels_tags_fk') THEN ALTER TABLE "_profile_v_rels" ADD CONSTRAINT "_profile_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_profile_v_rels_users_fk') THEN ALTER TABLE "_profile_v_rels" ADD CONSTRAINT "_profile_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'albums_cover_id_media_id_fk') THEN ALTER TABLE "albums" ADD CONSTRAINT "albums_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'albums_author_id_users_id_fk') THEN ALTER TABLE "albums" ADD CONSTRAINT "albums_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'albums_rels_parent_fk') THEN ALTER TABLE "albums_rels" ADD CONSTRAINT "albums_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'albums_rels_tags_fk') THEN ALTER TABLE "albums_rels" ADD CONSTRAINT "albums_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'albums_rels_users_fk') THEN ALTER TABLE "albums_rels" ADD CONSTRAINT "albums_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_albums_v_parent_id_albums_id_fk') THEN ALTER TABLE "_albums_v" ADD CONSTRAINT "_albums_v_parent_id_albums_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."albums"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_albums_v_version_cover_id_media_id_fk') THEN ALTER TABLE "_albums_v" ADD CONSTRAINT "_albums_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_albums_v_version_author_id_users_id_fk') THEN ALTER TABLE "_albums_v" ADD CONSTRAINT "_albums_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_albums_v_rels_parent_fk') THEN ALTER TABLE "_albums_v_rels" ADD CONSTRAINT "_albums_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_albums_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_albums_v_rels_tags_fk') THEN ALTER TABLE "_albums_v_rels" ADD CONSTRAINT "_albums_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_albums_v_rels_users_fk') THEN ALTER TABLE "_albums_v_rels" ADD CONSTRAINT "_albums_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tracks_album_id_albums_id_fk') THEN ALTER TABLE "tracks" ADD CONSTRAINT "tracks_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tracks_author_id_users_id_fk') THEN ALTER TABLE "tracks" ADD CONSTRAINT "tracks_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tracks_rels_parent_fk') THEN ALTER TABLE "tracks_rels" ADD CONSTRAINT "tracks_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tracks_rels_tags_fk') THEN ALTER TABLE "tracks_rels" ADD CONSTRAINT "tracks_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tracks_rels_users_fk') THEN ALTER TABLE "tracks_rels" ADD CONSTRAINT "tracks_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_tracks_v_parent_id_tracks_id_fk') THEN ALTER TABLE "_tracks_v" ADD CONSTRAINT "_tracks_v_parent_id_tracks_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tracks"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_tracks_v_version_album_id_albums_id_fk') THEN ALTER TABLE "_tracks_v" ADD CONSTRAINT "_tracks_v_version_album_id_albums_id_fk" FOREIGN KEY ("version_album_id") REFERENCES "public"."albums"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_tracks_v_version_author_id_users_id_fk') THEN ALTER TABLE "_tracks_v" ADD CONSTRAINT "_tracks_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_tracks_v_rels_parent_fk') THEN ALTER TABLE "_tracks_v_rels" ADD CONSTRAINT "_tracks_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_tracks_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_tracks_v_rels_tags_fk') THEN ALTER TABLE "_tracks_v_rels" ADD CONSTRAINT "_tracks_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_tracks_v_rels_users_fk') THEN ALTER TABLE "_tracks_v_rels" ADD CONSTRAINT "_tracks_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'playlists_cover_id_user_media_id_fk') THEN ALTER TABLE "playlists" ADD CONSTRAINT "playlists_cover_id_user_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."user_media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'playlists_rels_parent_fk') THEN ALTER TABLE "playlists_rels" ADD CONSTRAINT "playlists_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'playlists_rels_tracks_fk') THEN ALTER TABLE "playlists_rels" ADD CONSTRAINT "playlists_rels_tracks_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'playlists_rels_tags_fk') THEN ALTER TABLE "playlists_rels" ADD CONSTRAINT "playlists_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'playlists_rels_users_fk') THEN ALTER TABLE "playlists_rels" ADD CONSTRAINT "playlists_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_playlists_v_parent_id_playlists_id_fk') THEN ALTER TABLE "_playlists_v" ADD CONSTRAINT "_playlists_v_parent_id_playlists_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."playlists"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_playlists_v_version_cover_id_user_media_id_fk') THEN ALTER TABLE "_playlists_v" ADD CONSTRAINT "_playlists_v_version_cover_id_user_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."user_media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_playlists_v_rels_parent_fk') THEN ALTER TABLE "_playlists_v_rels" ADD CONSTRAINT "_playlists_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_playlists_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_playlists_v_rels_tracks_fk') THEN ALTER TABLE "_playlists_v_rels" ADD CONSTRAINT "_playlists_v_rels_tracks_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_playlists_v_rels_tags_fk') THEN ALTER TABLE "_playlists_v_rels" ADD CONSTRAINT "_playlists_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_playlists_v_rels_users_fk') THEN ALTER TABLE "_playlists_v_rels" ADD CONSTRAINT "_playlists_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'follows_user_id_users_id_fk') THEN ALTER TABLE "follows" ADD CONSTRAINT "follows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'follows_target_id_users_id_fk') THEN ALTER TABLE "follows" ADD CONSTRAINT "follows_target_id_users_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookmarks_user_id_users_id_fk') THEN ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookmarks_rels_parent_fk') THEN ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."bookmarks"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookmarks_rels_posts_fk') THEN ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookmarks_rels_surf_fk') THEN ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookmarks_rels_profile_fk') THEN ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_profile_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookmarks_rels_users_fk') THEN ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookmarks_rels_albums_fk') THEN ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_albums_fk" FOREIGN KEY ("albums_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookmarks_rels_playlists_fk') THEN ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_playlists_fk" FOREIGN KEY ("playlists_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookmarks_rels_tracks_fk') THEN ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_tracks_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookmarks_rels_user_media_fk') THEN ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_user_media_fk" FOREIGN KEY ("user_media_id") REFERENCES "public"."user_media"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_views_user_id_users_id_fk') THEN ALTER TABLE "user_views" ADD CONSTRAINT "user_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_views_rels_parent_fk') THEN ALTER TABLE "user_views_rels" ADD CONSTRAINT "user_views_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."user_views"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_views_rels_posts_fk') THEN ALTER TABLE "user_views_rels" ADD CONSTRAINT "user_views_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_views_rels_surf_fk') THEN ALTER TABLE "user_views_rels" ADD CONSTRAINT "user_views_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_views_rels_playlists_fk') THEN ALTER TABLE "user_views_rels" ADD CONSTRAINT "user_views_rels_playlists_fk" FOREIGN KEY ("playlists_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_views_rels_profile_fk') THEN ALTER TABLE "user_views_rels" ADD CONSTRAINT "user_views_rels_profile_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_views_rels_albums_fk') THEN ALTER TABLE "user_views_rels" ADD CONSTRAINT "user_views_rels_albums_fk" FOREIGN KEY ("albums_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_views_rels_tracks_fk') THEN ALTER TABLE "user_views_rels" ADD CONSTRAINT "user_views_rels_tracks_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'surf_category_id_categories_id_fk') THEN ALTER TABLE "surf" ADD CONSTRAINT "surf_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'surf_author_id_users_id_fk') THEN ALTER TABLE "surf" ADD CONSTRAINT "surf_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'surf_locales_meta_image_id_media_id_fk') THEN ALTER TABLE "surf_locales" ADD CONSTRAINT "surf_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'surf_locales_parent_id_fk') THEN ALTER TABLE "surf_locales" ADD CONSTRAINT "surf_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'surf_rels_parent_fk') THEN ALTER TABLE "surf_rels" ADD CONSTRAINT "surf_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'surf_rels_tags_fk') THEN ALTER TABLE "surf_rels" ADD CONSTRAINT "surf_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'surf_rels_surf_fk') THEN ALTER TABLE "surf_rels" ADD CONSTRAINT "surf_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'surf_rels_posts_fk') THEN ALTER TABLE "surf_rels" ADD CONSTRAINT "surf_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'surf_rels_users_fk') THEN ALTER TABLE "surf_rels" ADD CONSTRAINT "surf_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_surf_v_parent_id_surf_id_fk') THEN ALTER TABLE "_surf_v" ADD CONSTRAINT "_surf_v_parent_id_surf_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."surf"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_surf_v_version_category_id_categories_id_fk') THEN ALTER TABLE "_surf_v" ADD CONSTRAINT "_surf_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_surf_v_version_author_id_users_id_fk') THEN ALTER TABLE "_surf_v" ADD CONSTRAINT "_surf_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_surf_v_locales_version_meta_image_id_media_id_fk') THEN ALTER TABLE "_surf_v_locales" ADD CONSTRAINT "_surf_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_surf_v_locales_parent_id_fk') THEN ALTER TABLE "_surf_v_locales" ADD CONSTRAINT "_surf_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_surf_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_surf_v_rels_parent_fk') THEN ALTER TABLE "_surf_v_rels" ADD CONSTRAINT "_surf_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_surf_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_surf_v_rels_tags_fk') THEN ALTER TABLE "_surf_v_rels" ADD CONSTRAINT "_surf_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_surf_v_rels_surf_fk') THEN ALTER TABLE "_surf_v_rels" ADD CONSTRAINT "_surf_v_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_surf_v_rels_posts_fk') THEN ALTER TABLE "_surf_v_rels" ADD CONSTRAINT "_surf_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_surf_v_rels_users_fk') THEN ALTER TABLE "_surf_v_rels" ADD CONSTRAINT "_surf_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'citations_author_id_users_id_fk') THEN ALTER TABLE "citations" ADD CONSTRAINT "citations_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'citations_cited_id_users_id_fk') THEN ALTER TABLE "citations" ADD CONSTRAINT "citations_cited_id_users_id_fk" FOREIGN KEY ("cited_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'citations_rels_parent_fk') THEN ALTER TABLE "citations_rels" ADD CONSTRAINT "citations_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."citations"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'citations_rels_surf_fk') THEN ALTER TABLE "citations_rels" ADD CONSTRAINT "citations_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'citations_rels_posts_fk') THEN ALTER TABLE "citations_rels" ADD CONSTRAINT "citations_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'responses_author_id_users_id_fk') THEN ALTER TABLE "responses" ADD CONSTRAINT "responses_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'responses_rels_parent_fk') THEN ALTER TABLE "responses_rels" ADD CONSTRAINT "responses_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'responses_rels_posts_fk') THEN ALTER TABLE "responses_rels" ADD CONSTRAINT "responses_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'responses_rels_surf_fk') THEN ALTER TABLE "responses_rels" ADD CONSTRAINT "responses_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'responses_rels_responses_fk') THEN ALTER TABLE "responses_rels" ADD CONSTRAINT "responses_rels_responses_fk" FOREIGN KEY ("responses_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'responses_rels_citations_fk') THEN ALTER TABLE "responses_rels" ADD CONSTRAINT "responses_rels_citations_fk" FOREIGN KEY ("citations_id") REFERENCES "public"."citations"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'responses_rels_users_fk') THEN ALTER TABLE "responses_rels" ADD CONSTRAINT "responses_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_responses_v_parent_id_responses_id_fk') THEN ALTER TABLE "_responses_v" ADD CONSTRAINT "_responses_v_parent_id_responses_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."responses"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_responses_v_version_author_id_users_id_fk') THEN ALTER TABLE "_responses_v" ADD CONSTRAINT "_responses_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_responses_v_rels_parent_fk') THEN ALTER TABLE "_responses_v_rels" ADD CONSTRAINT "_responses_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_responses_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_responses_v_rels_posts_fk') THEN ALTER TABLE "_responses_v_rels" ADD CONSTRAINT "_responses_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_responses_v_rels_surf_fk') THEN ALTER TABLE "_responses_v_rels" ADD CONSTRAINT "_responses_v_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_responses_v_rels_responses_fk') THEN ALTER TABLE "_responses_v_rels" ADD CONSTRAINT "_responses_v_rels_responses_fk" FOREIGN KEY ("responses_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_responses_v_rels_citations_fk') THEN ALTER TABLE "_responses_v_rels" ADD CONSTRAINT "_responses_v_rels_citations_fk" FOREIGN KEY ("citations_id") REFERENCES "public"."citations"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_responses_v_rels_users_fk') THEN ALTER TABLE "_responses_v_rels" ADD CONSTRAINT "_responses_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'compilations_author_id_users_id_fk') THEN ALTER TABLE "compilations" ADD CONSTRAINT "compilations_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'compilations_cover_image_id_media_id_fk') THEN ALTER TABLE "compilations" ADD CONSTRAINT "compilations_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'compilations_rels_parent_fk') THEN ALTER TABLE "compilations_rels" ADD CONSTRAINT "compilations_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."compilations"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'compilations_rels_posts_fk') THEN ALTER TABLE "compilations_rels" ADD CONSTRAINT "compilations_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'compilations_rels_surf_fk') THEN ALTER TABLE "compilations_rels" ADD CONSTRAINT "compilations_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'compilations_rels_profile_fk') THEN ALTER TABLE "compilations_rels" ADD CONSTRAINT "compilations_rels_profile_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'compilations_rels_albums_fk') THEN ALTER TABLE "compilations_rels" ADD CONSTRAINT "compilations_rels_albums_fk" FOREIGN KEY ("albums_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'compilations_rels_playlists_fk') THEN ALTER TABLE "compilations_rels" ADD CONSTRAINT "compilations_rels_playlists_fk" FOREIGN KEY ("playlists_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'compilations_rels_tracks_fk') THEN ALTER TABLE "compilations_rels" ADD CONSTRAINT "compilations_rels_tracks_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'compilations_rels_user_media_fk') THEN ALTER TABLE "compilations_rels" ADD CONSTRAINT "compilations_rels_user_media_fk" FOREIGN KEY ("user_media_id") REFERENCES "public"."user_media"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'commerce_products_hero_media_id_media_id_fk') THEN ALTER TABLE "commerce_products" ADD CONSTRAINT "commerce_products_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'commerce_products_rels_parent_fk') THEN ALTER TABLE "commerce_products_rels" ADD CONSTRAINT "commerce_products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."commerce_products"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'commerce_products_rels_media_fk') THEN ALTER TABLE "commerce_products_rels" ADD CONSTRAINT "commerce_products_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'commerce_orders_user_id_users_id_fk') THEN ALTER TABLE "commerce_orders" ADD CONSTRAINT "commerce_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'commerce_orders_product_id_commerce_products_id_fk') THEN ALTER TABLE "commerce_orders" ADD CONSTRAINT "commerce_orders_product_id_commerce_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."commerce_products"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admins_foto_id_media_id_fk') THEN ALTER TABLE "admins" ADD CONSTRAINT "admins_foto_id_media_id_fk" FOREIGN KEY ("foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_admins_v_parent_id_admins_id_fk') THEN ALTER TABLE "_admins_v" ADD CONSTRAINT "_admins_v_parent_id_admins_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_admins_v_version_foto_id_media_id_fk') THEN ALTER TABLE "_admins_v" ADD CONSTRAINT "_admins_v_version_foto_id_media_id_fk" FOREIGN KEY ("version_foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exports_texts_parent_fk') THEN ALTER TABLE "exports_texts" ADD CONSTRAINT "exports_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exports"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'redirects_rels_parent_fk') THEN ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'redirects_rels_pages_fk') THEN ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'redirects_rels_posts_fk') THEN ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'search_author_parent_id_fk') THEN ALTER TABLE "search_author" ADD CONSTRAINT "search_author_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'search_allow_list_parent_id_fk') THEN ALTER TABLE "search_allow_list" ADD CONSTRAINT "search_allow_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'search_tags_parent_id_fk') THEN ALTER TABLE "search_tags" ADD CONSTRAINT "search_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'search_category_parent_id_fk') THEN ALTER TABLE "search_category" ADD CONSTRAINT "search_category_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'search_locales_parent_id_fk') THEN ALTER TABLE "search_locales" ADD CONSTRAINT "search_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'search_rels_parent_fk') THEN ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'search_rels_posts_fk') THEN ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'search_rels_surf_fk') THEN ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'search_rels_profile_fk') THEN ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_profile_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'search_rels_pages_fk') THEN ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'search_rels_tracks_fk') THEN ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_tracks_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'search_rels_playlists_fk') THEN ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_playlists_fk" FOREIGN KEY ("playlists_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'search_rels_albums_fk') THEN ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_albums_fk" FOREIGN KEY ("albums_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'search_rels_media_fk') THEN ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'search_rels_assets_fk') THEN ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_assets_fk" FOREIGN KEY ("assets_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'search_rels_user_media_fk') THEN ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_user_media_fk" FOREIGN KEY ("user_media_id") REFERENCES "public"."user_media"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_jobs_log_parent_id_fk') THEN ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_folders_folder_type_parent_fk') THEN ALTER TABLE "payload_folders_folder_type" ADD CONSTRAINT "payload_folders_folder_type_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_folders_folder_id_payload_folders_id_fk') THEN ALTER TABLE "payload_folders" ADD CONSTRAINT "payload_folders_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_parent_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_users_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_sessions_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sessions_fk" FOREIGN KEY ("sessions_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_accounts_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_accounts_fk" FOREIGN KEY ("accounts_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_verifications_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_verifications_fk" FOREIGN KEY ("verifications_id") REFERENCES "public"."verifications"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_two_factors_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_two_factors_fk" FOREIGN KEY ("two_factors_id") REFERENCES "public"."two_factors"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_passkeys_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_passkeys_fk" FOREIGN KEY ("passkeys_id") REFERENCES "public"."passkeys"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_organizations_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_teams_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_teams_fk" FOREIGN KEY ("teams_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_team_members_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_members_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_invitations_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_invitations_fk" FOREIGN KEY ("invitations_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_admin_invitations_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_admin_invitations_fk" FOREIGN KEY ("admin_invitations_id") REFERENCES "public"."admin_invitations"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_assets_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_assets_fk" FOREIGN KEY ("assets_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_categories_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_media_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_notifications_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notifications_fk" FOREIGN KEY ("notifications_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_pages_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_posts_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_user_media_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_user_media_fk" FOREIGN KEY ("user_media_id") REFERENCES "public"."user_media"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_email_quota_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_email_quota_fk" FOREIGN KEY ("email_quota_id") REFERENCES "public"."email_quota"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_deferred_emails_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_deferred_emails_fk" FOREIGN KEY ("deferred_emails_id") REFERENCES "public"."deferred_emails"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_profile_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_profile_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_bookmarks_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookmarks_fk" FOREIGN KEY ("bookmarks_id") REFERENCES "public"."bookmarks"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_user_views_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_user_views_fk" FOREIGN KEY ("user_views_id") REFERENCES "public"."user_views"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_responses_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_responses_fk" FOREIGN KEY ("responses_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_compilations_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_compilations_fk" FOREIGN KEY ("compilations_id") REFERENCES "public"."compilations"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_commerce_products_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_commerce_products_fk" FOREIGN KEY ("commerce_products_id") REFERENCES "public"."commerce_products"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_commerce_orders_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_commerce_orders_fk" FOREIGN KEY ("commerce_orders_id") REFERENCES "public"."commerce_orders"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_admins_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_redirects_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_search_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_search_fk" FOREIGN KEY ("search_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_payload_folders_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_folders_fk" FOREIGN KEY ("payload_folders_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_preferences_rels_parent_fk') THEN ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_preferences_rels_users_fk') THEN ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_preferences_rels_admins_fk') THEN ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'header_nav_items_preview_media_desktop_id_media_id_fk') THEN ALTER TABLE "header_nav_items" ADD CONSTRAINT "header_nav_items_preview_media_desktop_id_media_id_fk" FOREIGN KEY ("preview_media_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'header_nav_items_preview_media_mobile_id_media_id_fk') THEN ALTER TABLE "header_nav_items" ADD CONSTRAINT "header_nav_items_preview_media_mobile_id_media_id_fk" FOREIGN KEY ("preview_media_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'header_nav_items_parent_id_fk') THEN ALTER TABLE "header_nav_items" ADD CONSTRAINT "header_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'header_rels_parent_fk') THEN ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."header"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'header_rels_playlists_fk') THEN ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_playlists_fk" FOREIGN KEY ("playlists_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'header_rels_pages_fk') THEN ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'header_rels_posts_fk') THEN ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'header_rels_surf_fk') THEN ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'header_rels_users_fk') THEN ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'header_rels_albums_fk') THEN ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_albums_fk" FOREIGN KEY ("albums_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'header_rels_tracks_fk') THEN ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_tracks_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'header_rels_organizations_fk') THEN ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'header_rels_categories_fk') THEN ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'footer_nav_items_parent_id_fk') THEN ALTER TABLE "footer_nav_items" ADD CONSTRAINT "footer_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'footer_column1_links_parent_id_fk') THEN ALTER TABLE "footer_column1_links" ADD CONSTRAINT "footer_column1_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'footer_column2_links_parent_id_fk') THEN ALTER TABLE "footer_column2_links" ADD CONSTRAINT "footer_column2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'footer_column3_links_parent_id_fk') THEN ALTER TABLE "footer_column3_links" ADD CONSTRAINT "footer_column3_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'footer_defaults_desktop_id_media_id_fk') THEN ALTER TABLE "footer" ADD CONSTRAINT "footer_defaults_desktop_id_media_id_fk" FOREIGN KEY ("defaults_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'footer_defaults_mobile_id_media_id_fk') THEN ALTER TABLE "footer" ADD CONSTRAINT "footer_defaults_mobile_id_media_id_fk" FOREIGN KEY ("defaults_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'footer_video_loop_desktop_id_media_id_fk') THEN ALTER TABLE "footer" ADD CONSTRAINT "footer_video_loop_desktop_id_media_id_fk" FOREIGN KEY ("video_loop_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'footer_video_loop_mobile_id_media_id_fk') THEN ALTER TABLE "footer" ADD CONSTRAINT "footer_video_loop_mobile_id_media_id_fk" FOREIGN KEY ("video_loop_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'footer_rels_parent_fk') THEN ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'footer_rels_pages_fk') THEN ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'footer_rels_posts_fk') THEN ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'footer_rels_surf_fk') THEN ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'footer_rels_users_fk') THEN ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'footer_rels_albums_fk') THEN ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_albums_fk" FOREIGN KEY ("albums_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'footer_rels_tracks_fk') THEN ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_tracks_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'footer_rels_playlists_fk') THEN ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_playlists_fk" FOREIGN KEY ("playlists_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'footer_rels_organizations_fk') THEN ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'footer_rels_categories_fk') THEN ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action; END IF; END $guard$;
  CREATE UNIQUE INDEX IF NOT EXISTS "users_slug_idx" ON "users" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "users_first_name_idx" ON "users" USING btree ("first_name");
  CREATE INDEX IF NOT EXISTS "users_last_name_idx" ON "users" USING btree ("last_name");
  CREATE INDEX IF NOT EXISTS "users_verified_idx" ON "users" USING btree ("verified");
  CREATE UNIQUE INDEX IF NOT EXISTS "users_username_idx" ON "users" USING btree ("username");
  CREATE INDEX IF NOT EXISTS "users_bio_idx" ON "users" USING btree ("bio");
  CREATE INDEX IF NOT EXISTS "users_location_idx" ON "users" USING btree ("location");
  CREATE INDEX IF NOT EXISTS "users_link_idx" ON "users" USING btree ("link");
  CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" USING btree ("role");
  CREATE INDEX IF NOT EXISTS "users_onboarded_idx" ON "users" USING btree ("onboarded");
  CREATE INDEX IF NOT EXISTS "users_name_idx" ON "users" USING btree ("name");
  CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "users_normalized_email_idx" ON "users" USING btree ("normalized_email");
  CREATE INDEX IF NOT EXISTS "users_updated_at_1_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "users_created_at_1_idx" ON "users" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "users__status_idx" ON "users" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "users_meta_meta_image_idx" ON "users_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "users_locales_locale_parent_id_unique" ON "users_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_users_v_parent_idx" ON "_users_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_users_v_version_version_slug_idx" ON "_users_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_users_v_version_version_first_name_idx" ON "_users_v" USING btree ("version_first_name");
  CREATE INDEX IF NOT EXISTS "_users_v_version_version_last_name_idx" ON "_users_v" USING btree ("version_last_name");
  CREATE INDEX IF NOT EXISTS "_users_v_version_version_verified_idx" ON "_users_v" USING btree ("version_verified");
  CREATE INDEX IF NOT EXISTS "_users_v_version_version_username_idx" ON "_users_v" USING btree ("version_username");
  CREATE INDEX IF NOT EXISTS "_users_v_version_version_bio_idx" ON "_users_v" USING btree ("version_bio");
  CREATE INDEX IF NOT EXISTS "_users_v_version_version_location_idx" ON "_users_v" USING btree ("version_location");
  CREATE INDEX IF NOT EXISTS "_users_v_version_version_link_idx" ON "_users_v" USING btree ("version_link");
  CREATE INDEX IF NOT EXISTS "_users_v_version_version_email_idx" ON "_users_v" USING btree ("version_email");
  CREATE INDEX IF NOT EXISTS "_users_v_version_version_role_idx" ON "_users_v" USING btree ("version_role");
  CREATE INDEX IF NOT EXISTS "_users_v_version_version_onboarded_idx" ON "_users_v" USING btree ("version_onboarded");
  CREATE INDEX IF NOT EXISTS "_users_v_version_version_name_idx" ON "_users_v" USING btree ("version_name");
  CREATE INDEX IF NOT EXISTS "_users_v_version_version_created_at_idx" ON "_users_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_users_v_version_version_updated_at_idx" ON "_users_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_users_v_version_version_normalized_email_idx" ON "_users_v" USING btree ("version_normalized_email");
  CREATE INDEX IF NOT EXISTS "_users_v_version_version_updated_at_1_idx" ON "_users_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_users_v_version_version_created_at_1_idx" ON "_users_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_users_v_version_version__status_idx" ON "_users_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_users_v_created_at_idx" ON "_users_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_users_v_updated_at_idx" ON "_users_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_users_v_snapshot_idx" ON "_users_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_users_v_published_locale_idx" ON "_users_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_users_v_latest_idx" ON "_users_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_users_v_version_meta_version_meta_image_idx" ON "_users_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_users_v_locales_locale_parent_id_unique" ON "_users_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_idx" ON "sessions" USING btree ("token");
  CREATE INDEX IF NOT EXISTS "sessions_created_at_idx" ON "sessions" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "sessions_updated_at_idx" ON "sessions" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "sessions_user_idx" ON "sessions" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "sessions_impersonated_by_idx" ON "sessions" USING btree ("impersonated_by_id");
  CREATE INDEX IF NOT EXISTS "sessions_active_organization_idx" ON "sessions" USING btree ("active_organization_id");
  CREATE INDEX IF NOT EXISTS "sessions_active_team_idx" ON "sessions" USING btree ("active_team_id");
  CREATE INDEX IF NOT EXISTS "accounts_account_id_idx" ON "accounts" USING btree ("account_id");
  CREATE INDEX IF NOT EXISTS "accounts_user_idx" ON "accounts" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "accounts_access_token_expires_at_idx" ON "accounts" USING btree ("access_token_expires_at");
  CREATE INDEX IF NOT EXISTS "accounts_refresh_token_expires_at_idx" ON "accounts" USING btree ("refresh_token_expires_at");
  CREATE INDEX IF NOT EXISTS "accounts_created_at_idx" ON "accounts" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "accounts_updated_at_idx" ON "accounts" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "verifications_identifier_idx" ON "verifications" USING btree ("identifier");
  CREATE INDEX IF NOT EXISTS "verifications_expires_at_idx" ON "verifications" USING btree ("expires_at");
  CREATE INDEX IF NOT EXISTS "verifications_created_at_idx" ON "verifications" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "verifications_updated_at_idx" ON "verifications" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "two_factors_secret_idx" ON "two_factors" USING btree ("secret");
  CREATE INDEX IF NOT EXISTS "two_factors_user_idx" ON "two_factors" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "two_factors_updated_at_idx" ON "two_factors" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "two_factors_created_at_idx" ON "two_factors" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "passkeys_public_key_idx" ON "passkeys" USING btree ("public_key");
  CREATE INDEX IF NOT EXISTS "passkeys_user_idx" ON "passkeys" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "passkeys_updated_at_idx" ON "passkeys" USING btree ("updated_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "organizations_slug_idx" ON "organizations" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "organizations_updated_at_idx" ON "organizations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "teams_organization_idx" ON "teams" USING btree ("organization_id");
  CREATE INDEX IF NOT EXISTS "teams_created_at_idx" ON "teams" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "teams_updated_at_idx" ON "teams" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "team_members_team_idx" ON "team_members" USING btree ("team_id");
  CREATE INDEX IF NOT EXISTS "team_members_user_idx" ON "team_members" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "team_members_updated_at_idx" ON "team_members" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "members_organization_idx" ON "members" USING btree ("organization_id");
  CREATE INDEX IF NOT EXISTS "members_user_idx" ON "members" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "members_updated_at_idx" ON "members" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "invitations_organization_idx" ON "invitations" USING btree ("organization_id");
  CREATE INDEX IF NOT EXISTS "invitations_email_idx" ON "invitations" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "invitations_team_idx" ON "invitations" USING btree ("team");
  CREATE INDEX IF NOT EXISTS "invitations_inviter_idx" ON "invitations" USING btree ("inviter_id");
  CREATE INDEX IF NOT EXISTS "invitations_updated_at_idx" ON "invitations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "admin_invitations_email_idx" ON "admin_invitations" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "admin_invitations_token_idx" ON "admin_invitations" USING btree ("token");
  CREATE INDEX IF NOT EXISTS "admin_invitations_expires_at_idx" ON "admin_invitations" USING btree ("expires_at");
  CREATE INDEX IF NOT EXISTS "admin_invitations_updated_at_idx" ON "admin_invitations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "admin_invitations_created_at_idx" ON "admin_invitations" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "assets_filename_compound_idx" ON "assets" USING btree ("filename","created_at");
  CREATE INDEX IF NOT EXISTS "assets_authority_idx" ON "assets" USING btree ("authority");
  CREATE INDEX IF NOT EXISTS "assets_darkmode_idx" ON "assets" USING btree ("darkmode");
  CREATE INDEX IF NOT EXISTS "assets_updated_at_idx" ON "assets" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "assets_created_at_idx" ON "assets" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "assets_filename_idx" ON "assets" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "assets_sizes_thumb_sizes_thumb_filename_idx" ON "assets" USING btree ("sizes_thumb_filename");
  CREATE INDEX IF NOT EXISTS "assets_sizes_card_sizes_card_filename_idx" ON "assets" USING btree ("sizes_card_filename");
  CREATE INDEX IF NOT EXISTS "assets_sizes_content_sizes_content_filename_idx" ON "assets" USING btree ("sizes_content_filename");
  CREATE INDEX IF NOT EXISTS "assets_sizes_content_wide_sizes_content_wide_filename_idx" ON "assets" USING btree ("sizes_content_wide_filename");
  CREATE INDEX IF NOT EXISTS "assets_sizes_hero_sizes_hero_filename_idx" ON "assets" USING btree ("sizes_hero_filename");
  CREATE INDEX IF NOT EXISTS "assets_sizes_og_sizes_og_filename_idx" ON "assets" USING btree ("sizes_og_filename");
  CREATE INDEX IF NOT EXISTS "assets_rels_order_idx" ON "assets_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "assets_rels_parent_idx" ON "assets_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "assets_rels_path_idx" ON "assets_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "assets_rels_users_id_idx" ON "assets_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "categories_title_idx" ON "categories" USING btree ("title");
  CREATE INDEX IF NOT EXISTS "categories_description_idx" ON "categories" USING btree ("description");
  CREATE INDEX IF NOT EXISTS "categories_popularity_idx" ON "categories" USING btree ("popularity");
  CREATE INDEX IF NOT EXISTS "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "categories_rels_order_idx" ON "categories_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "categories_rels_parent_idx" ON "categories_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "categories_rels_path_idx" ON "categories_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "categories_rels_categories_id_idx" ON "categories_rels" USING btree ("categories_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_compound_idx" ON "media" USING btree ("filename","created_at");
  CREATE INDEX IF NOT EXISTS "media_author_idx" ON "media" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "media_authority_idx" ON "media" USING btree ("authority");
  CREATE INDEX IF NOT EXISTS "media_darkmode_idx" ON "media" USING btree ("darkmode");
  CREATE INDEX IF NOT EXISTS "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_content_sizes_content_filename_idx" ON "media" USING btree ("sizes_content_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_content_wide_sizes_content_wide_filename_idx" ON "media" USING btree ("sizes_content_wide_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE INDEX IF NOT EXISTS "media_rels_order_idx" ON "media_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "media_rels_parent_idx" ON "media_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "media_rels_path_idx" ON "media_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "media_rels_users_id_idx" ON "media_rels" USING btree ("users_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "tags_title_idx" ON "tags" USING btree ("title");
  CREATE INDEX IF NOT EXISTS "tags_author_idx" ON "tags" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "tags_slug_key_idx" ON "tags" USING btree ("slug_key");
  CREATE INDEX IF NOT EXISTS "tags_hash_id_idx" ON "tags" USING btree ("hash_id");
  CREATE INDEX IF NOT EXISTS "tags_tag_count_idx" ON "tags" USING btree ("tag_count");
  CREATE INDEX IF NOT EXISTS "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "notifications_recipient_idx" ON "notifications" USING btree ("recipient_id");
  CREATE INDEX IF NOT EXISTS "notifications_thumbnail_idx" ON "notifications" USING btree ("thumbnail_id");
  CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications" USING btree ("type");
  CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications" USING btree ("read");
  CREATE INDEX IF NOT EXISTS "notifications_dismissed_idx" ON "notifications" USING btree ("dismissed");
  CREATE INDEX IF NOT EXISTS "notifications_read_at_idx" ON "notifications" USING btree ("read_at");
  CREATE INDEX IF NOT EXISTS "notifications_sticky_idx" ON "notifications" USING btree ("sticky");
  CREATE INDEX IF NOT EXISTS "notifications_updated_at_idx" ON "notifications" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "notifications_rels_order_idx" ON "notifications_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "notifications_rels_parent_idx" ON "notifications_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "notifications_rels_path_idx" ON "notifications_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "notifications_rels_posts_id_idx" ON "notifications_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "notifications_rels_surf_id_idx" ON "notifications_rels" USING btree ("surf_id");
  CREATE INDEX IF NOT EXISTS "notifications_rels_users_id_idx" ON "notifications_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "notifications_rels_profile_id_idx" ON "notifications_rels" USING btree ("profile_id");
  CREATE INDEX IF NOT EXISTS "notifications_rels_bookmarks_id_idx" ON "notifications_rels" USING btree ("bookmarks_id");
  CREATE INDEX IF NOT EXISTS "notifications_rels_follows_id_idx" ON "notifications_rels" USING btree ("follows_id");
  CREATE INDEX IF NOT EXISTS "notifications_rels_responses_id_idx" ON "notifications_rels" USING btree ("responses_id");
  CREATE INDEX IF NOT EXISTS "notifications_rels_pages_id_idx" ON "notifications_rels" USING btree ("pages_id");
  CREATE INDEX IF NOT EXISTS "notifications_rels_albums_id_idx" ON "notifications_rels" USING btree ("albums_id");
  CREATE INDEX IF NOT EXISTS "notifications_rels_tracks_id_idx" ON "notifications_rels" USING btree ("tracks_id");
  CREATE INDEX IF NOT EXISTS "notifications_rels_playlists_id_idx" ON "notifications_rels" USING btree ("playlists_id");
  CREATE INDEX IF NOT EXISTS "notifications_rels_organizations_id_idx" ON "notifications_rels" USING btree ("organizations_id");
  CREATE INDEX IF NOT EXISTS "notifications_rels_categories_id_idx" ON "notifications_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "pages_hero_links_order_idx" ON "pages_hero_links" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_hero_links_parent_id_idx" ON "pages_hero_links" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_cta_links_order_idx" ON "pages_blocks_cta_links" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_cta_links_parent_id_idx" ON "pages_blocks_cta_links" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_cta_order_idx" ON "pages_blocks_cta" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_cta_parent_id_idx" ON "pages_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_cta_path_idx" ON "pages_blocks_cta" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "pages_blocks_content_columns_order_idx" ON "pages_blocks_content_columns" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_content_columns_parent_id_idx" ON "pages_blocks_content_columns" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_content_order_idx" ON "pages_blocks_content" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_content_parent_id_idx" ON "pages_blocks_content" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_content_path_idx" ON "pages_blocks_content" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "pages_blocks_image_order_idx" ON "pages_blocks_image" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_image_parent_id_idx" ON "pages_blocks_image" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_image_path_idx" ON "pages_blocks_image" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "pages_blocks_archive_order_idx" ON "pages_blocks_archive" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_archive_parent_id_idx" ON "pages_blocks_archive" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_archive_path_idx" ON "pages_blocks_archive" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "pages_blocks_fotd_relation_to_order_idx" ON "pages_blocks_fotd_relation_to" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_fotd_relation_to_parent_idx" ON "pages_blocks_fotd_relation_to" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_fotd_order_idx" ON "pages_blocks_fotd" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_fotd_parent_id_idx" ON "pages_blocks_fotd" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_fotd_path_idx" ON "pages_blocks_fotd" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "pages_blocks_hero_square_order_idx" ON "pages_blocks_hero_square" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_hero_square_parent_id_idx" ON "pages_blocks_hero_square" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_hero_square_path_idx" ON "pages_blocks_hero_square" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "pages_title_idx" ON "pages" USING btree ("title");
  CREATE INDEX IF NOT EXISTS "pages_hero_hero_media_idx" ON "pages" USING btree ("hero_media_id");
  CREATE INDEX IF NOT EXISTS "pages_page_layout_page_layout_footer_type_idx" ON "pages" USING btree ("page_layout_footer_type");
  CREATE INDEX IF NOT EXISTS "pages_slug_key_idx" ON "pages" USING btree ("slug_key");
  CREATE INDEX IF NOT EXISTS "pages_hash_id_idx" ON "pages" USING btree ("hash_id");
  CREATE INDEX IF NOT EXISTS "pages_authority_idx" ON "pages" USING btree ("authority");
  CREATE INDEX IF NOT EXISTS "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "pages_meta_meta_image_idx" ON "pages_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "pages_rels_pages_id_idx" ON "pages_rels" USING btree ("pages_id");
  CREATE INDEX IF NOT EXISTS "pages_rels_posts_id_idx" ON "pages_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "pages_rels_surf_id_idx" ON "pages_rels" USING btree ("surf_id");
  CREATE INDEX IF NOT EXISTS "pages_rels_users_id_idx" ON "pages_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "pages_rels_albums_id_idx" ON "pages_rels" USING btree ("albums_id");
  CREATE INDEX IF NOT EXISTS "pages_rels_tracks_id_idx" ON "pages_rels" USING btree ("tracks_id");
  CREATE INDEX IF NOT EXISTS "pages_rels_playlists_id_idx" ON "pages_rels" USING btree ("playlists_id");
  CREATE INDEX IF NOT EXISTS "pages_rels_organizations_id_idx" ON "pages_rels" USING btree ("organizations_id");
  CREATE INDEX IF NOT EXISTS "pages_rels_categories_id_idx" ON "pages_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "pages_rels_media_id_idx" ON "pages_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "pages_rels_user_media_id_idx" ON "pages_rels" USING btree ("user_media_id");
  CREATE INDEX IF NOT EXISTS "pages_rels_assets_id_idx" ON "pages_rels" USING btree ("assets_id");
  CREATE INDEX IF NOT EXISTS "pages_rels_tags_id_idx" ON "pages_rels" USING btree ("tags_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_hero_links_order_idx" ON "_pages_v_version_hero_links" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_hero_links_parent_id_idx" ON "_pages_v_version_hero_links" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_cta_links_order_idx" ON "_pages_v_blocks_cta_links" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_cta_links_parent_id_idx" ON "_pages_v_blocks_cta_links" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_cta_order_idx" ON "_pages_v_blocks_cta" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_cta_parent_id_idx" ON "_pages_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_cta_path_idx" ON "_pages_v_blocks_cta" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_content_columns_order_idx" ON "_pages_v_blocks_content_columns" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_content_columns_parent_id_idx" ON "_pages_v_blocks_content_columns" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_content_order_idx" ON "_pages_v_blocks_content" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_content_parent_id_idx" ON "_pages_v_blocks_content" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_content_path_idx" ON "_pages_v_blocks_content" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_image_order_idx" ON "_pages_v_blocks_image" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_image_parent_id_idx" ON "_pages_v_blocks_image" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_image_path_idx" ON "_pages_v_blocks_image" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_archive_order_idx" ON "_pages_v_blocks_archive" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_archive_parent_id_idx" ON "_pages_v_blocks_archive" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_archive_path_idx" ON "_pages_v_blocks_archive" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_fotd_relation_to_order_idx" ON "_pages_v_blocks_fotd_relation_to" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_fotd_relation_to_parent_idx" ON "_pages_v_blocks_fotd_relation_to" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_fotd_order_idx" ON "_pages_v_blocks_fotd" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_fotd_parent_id_idx" ON "_pages_v_blocks_fotd" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_fotd_path_idx" ON "_pages_v_blocks_fotd" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_hero_square_order_idx" ON "_pages_v_blocks_hero_square" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_hero_square_parent_id_idx" ON "_pages_v_blocks_hero_square" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_hero_square_path_idx" ON "_pages_v_blocks_hero_square" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_version_title_idx" ON "_pages_v" USING btree ("version_title");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_hero_version_hero_media_idx" ON "_pages_v" USING btree ("version_hero_media_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_page_layout_version_page_layout_footer__idx" ON "_pages_v" USING btree ("version_page_layout_footer_type");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_version_slug_key_idx" ON "_pages_v" USING btree ("version_slug_key");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_version_hash_id_idx" ON "_pages_v" USING btree ("version_hash_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_version_authority_idx" ON "_pages_v" USING btree ("version_authority");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_pages_v_autosave_idx" ON "_pages_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_meta_version_meta_image_idx" ON "_pages_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_pages_v_locales_locale_parent_id_unique" ON "_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_order_idx" ON "_pages_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_parent_idx" ON "_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_path_idx" ON "_pages_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_pages_id_idx" ON "_pages_v_rels" USING btree ("pages_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_posts_id_idx" ON "_pages_v_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_surf_id_idx" ON "_pages_v_rels" USING btree ("surf_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_users_id_idx" ON "_pages_v_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_albums_id_idx" ON "_pages_v_rels" USING btree ("albums_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_tracks_id_idx" ON "_pages_v_rels" USING btree ("tracks_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_playlists_id_idx" ON "_pages_v_rels" USING btree ("playlists_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_organizations_id_idx" ON "_pages_v_rels" USING btree ("organizations_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_categories_id_idx" ON "_pages_v_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_media_id_idx" ON "_pages_v_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_user_media_id_idx" ON "_pages_v_rels" USING btree ("user_media_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_assets_id_idx" ON "_pages_v_rels" USING btree ("assets_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_tags_id_idx" ON "_pages_v_rels" USING btree ("tags_id");
  CREATE INDEX IF NOT EXISTS "posts_category_idx" ON "posts" USING btree ("category_id");
  CREATE INDEX IF NOT EXISTS "posts_slug_key_idx" ON "posts" USING btree ("slug_key");
  CREATE INDEX IF NOT EXISTS "posts_comments_enabled_idx" ON "posts" USING btree ("comments_enabled");
  CREATE INDEX IF NOT EXISTS "posts_hash_id_idx" ON "posts" USING btree ("hash_id");
  CREATE INDEX IF NOT EXISTS "posts_author_idx" ON "posts" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "posts_approved_by_editor_idx" ON "posts" USING btree ("approved_by_editor");
  CREATE INDEX IF NOT EXISTS "posts_featured_idx" ON "posts" USING btree ("featured");
  CREATE INDEX IF NOT EXISTS "posts_front_eligible_idx" ON "posts" USING btree ("front_eligible");
  CREATE INDEX IF NOT EXISTS "posts_authority_idx" ON "posts" USING btree ("authority");
  CREATE INDEX IF NOT EXISTS "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "posts__status_idx" ON "posts" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "author__status_updatedAt_idx" ON "posts" USING btree ("author_id","_status","updated_at");
  CREATE INDEX IF NOT EXISTS "posts_meta_meta_image_idx" ON "posts_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "posts_locales_locale_parent_id_unique" ON "posts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "posts_rels_order_idx" ON "posts_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "posts_rels_parent_idx" ON "posts_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "posts_rels_path_idx" ON "posts_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "posts_rels_user_media_id_idx" ON "posts_rels" USING btree ("user_media_id");
  CREATE INDEX IF NOT EXISTS "posts_rels_assets_id_idx" ON "posts_rels" USING btree ("assets_id");
  CREATE INDEX IF NOT EXISTS "posts_rels_media_id_idx" ON "posts_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "posts_rels_tags_id_idx" ON "posts_rels" USING btree ("tags_id");
  CREATE INDEX IF NOT EXISTS "posts_rels_posts_id_idx" ON "posts_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "posts_rels_users_id_idx" ON "posts_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_parent_idx" ON "_posts_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_category_idx" ON "_posts_v" USING btree ("version_category_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_slug_key_idx" ON "_posts_v" USING btree ("version_slug_key");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_comments_enabled_idx" ON "_posts_v" USING btree ("version_comments_enabled");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_hash_id_idx" ON "_posts_v" USING btree ("version_hash_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_author_idx" ON "_posts_v" USING btree ("version_author_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_approved_by_editor_idx" ON "_posts_v" USING btree ("version_approved_by_editor");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_featured_idx" ON "_posts_v" USING btree ("version_featured");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_front_eligible_idx" ON "_posts_v" USING btree ("version_front_eligible");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_authority_idx" ON "_posts_v" USING btree ("version_authority");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_updated_at_idx" ON "_posts_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_created_at_idx" ON "_posts_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version__status_idx" ON "_posts_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_posts_v_created_at_idx" ON "_posts_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_updated_at_idx" ON "_posts_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_snapshot_idx" ON "_posts_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_posts_v_published_locale_idx" ON "_posts_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_posts_v_latest_idx" ON "_posts_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "version_author_version__status_version_updatedAt_idx" ON "_posts_v" USING btree ("version_author_id","version__status","version_updated_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_meta_version_meta_image_idx" ON "_posts_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_posts_v_locales_locale_parent_id_unique" ON "_posts_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_order_idx" ON "_posts_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_parent_idx" ON "_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_path_idx" ON "_posts_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_user_media_id_idx" ON "_posts_v_rels" USING btree ("user_media_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_assets_id_idx" ON "_posts_v_rels" USING btree ("assets_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_media_id_idx" ON "_posts_v_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_tags_id_idx" ON "_posts_v_rels" USING btree ("tags_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_posts_id_idx" ON "_posts_v_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_users_id_idx" ON "_posts_v_rels" USING btree ("users_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "user_media_filename_compound_idx" ON "user_media" USING btree ("filename","created_at");
  CREATE INDEX IF NOT EXISTS "user_media_author_idx" ON "user_media" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "user_media_authority_idx" ON "user_media" USING btree ("authority");
  CREATE INDEX IF NOT EXISTS "user_media_darkmode_idx" ON "user_media" USING btree ("darkmode");
  CREATE INDEX IF NOT EXISTS "user_media_folder_idx" ON "user_media" USING btree ("folder_id");
  CREATE INDEX IF NOT EXISTS "user_media_updated_at_idx" ON "user_media" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "user_media_created_at_idx" ON "user_media" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "user_media_filename_idx" ON "user_media" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "user_media_sizes_thumb_sizes_thumb_filename_idx" ON "user_media" USING btree ("sizes_thumb_filename");
  CREATE INDEX IF NOT EXISTS "user_media_sizes_card_sizes_card_filename_idx" ON "user_media" USING btree ("sizes_card_filename");
  CREATE INDEX IF NOT EXISTS "user_media_sizes_content_sizes_content_filename_idx" ON "user_media" USING btree ("sizes_content_filename");
  CREATE INDEX IF NOT EXISTS "user_media_sizes_content_wide_sizes_content_wide_filenam_idx" ON "user_media" USING btree ("sizes_content_wide_filename");
  CREATE INDEX IF NOT EXISTS "user_media_sizes_hero_sizes_hero_filename_idx" ON "user_media" USING btree ("sizes_hero_filename");
  CREATE INDEX IF NOT EXISTS "user_media_sizes_og_sizes_og_filename_idx" ON "user_media" USING btree ("sizes_og_filename");
  CREATE INDEX IF NOT EXISTS "user_media_rels_order_idx" ON "user_media_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "user_media_rels_parent_idx" ON "user_media_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "user_media_rels_path_idx" ON "user_media_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "user_media_rels_users_id_idx" ON "user_media_rels" USING btree ("users_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "email_quota_date_idx" ON "email_quota" USING btree ("date");
  CREATE INDEX IF NOT EXISTS "email_quota_updated_at_idx" ON "email_quota" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "email_quota_created_at_idx" ON "email_quota" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "deferred_emails_updated_at_idx" ON "deferred_emails" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "deferred_emails_created_at_idx" ON "deferred_emails" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "profile_slides_order_idx" ON "profile_slides" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "profile_slides_parent_id_idx" ON "profile_slides" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "profile_slides_visuals_idx" ON "profile_slides" USING btree ("visuals_id");
  CREATE INDEX IF NOT EXISTS "profile_rsvp_gallery_order_idx" ON "profile_rsvp_gallery" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "profile_rsvp_gallery_parent_id_idx" ON "profile_rsvp_gallery" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "profile_rsvp_gallery_media_idx" ON "profile_rsvp_gallery" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "profile_author_idx" ON "profile" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "profile_slug_idx" ON "profile" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "profile_title_idx" ON "profile" USING btree ("title");
  CREATE INDEX IF NOT EXISTS "profile_hero_hero_title_idx" ON "profile" USING btree ("hero_title");
  CREATE INDEX IF NOT EXISTS "profile_hero_hero_subtitle_idx" ON "profile" USING btree ("hero_subtitle");
  CREATE INDEX IF NOT EXISTS "profile_authority_idx" ON "profile" USING btree ("authority");
  CREATE INDEX IF NOT EXISTS "profile_updated_at_idx" ON "profile" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "profile_created_at_idx" ON "profile" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "profile__status_idx" ON "profile" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "profile_rels_order_idx" ON "profile_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "profile_rels_parent_idx" ON "profile_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "profile_rels_path_idx" ON "profile_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "profile_rels_tags_id_idx" ON "profile_rels" USING btree ("tags_id");
  CREATE INDEX IF NOT EXISTS "profile_rels_users_id_idx" ON "profile_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "_profile_v_version_slides_order_idx" ON "_profile_v_version_slides" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_profile_v_version_slides_parent_id_idx" ON "_profile_v_version_slides" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_profile_v_version_slides_visuals_idx" ON "_profile_v_version_slides" USING btree ("visuals_id");
  CREATE INDEX IF NOT EXISTS "_profile_v_version_rsvp_gallery_order_idx" ON "_profile_v_version_rsvp_gallery" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_profile_v_version_rsvp_gallery_parent_id_idx" ON "_profile_v_version_rsvp_gallery" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_profile_v_version_rsvp_gallery_media_idx" ON "_profile_v_version_rsvp_gallery" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "_profile_v_parent_idx" ON "_profile_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_profile_v_version_version_author_idx" ON "_profile_v" USING btree ("version_author_id");
  CREATE INDEX IF NOT EXISTS "_profile_v_version_version_slug_idx" ON "_profile_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_profile_v_version_version_title_idx" ON "_profile_v" USING btree ("version_title");
  CREATE INDEX IF NOT EXISTS "_profile_v_version_hero_version_hero_title_idx" ON "_profile_v" USING btree ("version_hero_title");
  CREATE INDEX IF NOT EXISTS "_profile_v_version_hero_version_hero_subtitle_idx" ON "_profile_v" USING btree ("version_hero_subtitle");
  CREATE INDEX IF NOT EXISTS "_profile_v_version_version_authority_idx" ON "_profile_v" USING btree ("version_authority");
  CREATE INDEX IF NOT EXISTS "_profile_v_version_version_updated_at_idx" ON "_profile_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_profile_v_version_version_created_at_idx" ON "_profile_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_profile_v_version_version__status_idx" ON "_profile_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_profile_v_created_at_idx" ON "_profile_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_profile_v_updated_at_idx" ON "_profile_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_profile_v_snapshot_idx" ON "_profile_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_profile_v_published_locale_idx" ON "_profile_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_profile_v_latest_idx" ON "_profile_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_profile_v_autosave_idx" ON "_profile_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "_profile_v_rels_order_idx" ON "_profile_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_profile_v_rels_parent_idx" ON "_profile_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_profile_v_rels_path_idx" ON "_profile_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_profile_v_rels_tags_id_idx" ON "_profile_v_rels" USING btree ("tags_id");
  CREATE INDEX IF NOT EXISTS "_profile_v_rels_users_id_idx" ON "_profile_v_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "albums_cover_idx" ON "albums" USING btree ("cover_id");
  CREATE INDEX IF NOT EXISTS "albums_author_idx" ON "albums" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "albums_slug_key_idx" ON "albums" USING btree ("slug_key");
  CREATE INDEX IF NOT EXISTS "albums_hash_id_idx" ON "albums" USING btree ("hash_id");
  CREATE INDEX IF NOT EXISTS "albums_authority_idx" ON "albums" USING btree ("authority");
  CREATE INDEX IF NOT EXISTS "albums_updated_at_idx" ON "albums" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "albums_created_at_idx" ON "albums" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "albums__status_idx" ON "albums" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "albums_rels_order_idx" ON "albums_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "albums_rels_parent_idx" ON "albums_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "albums_rels_path_idx" ON "albums_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "albums_rels_tags_id_idx" ON "albums_rels" USING btree ("tags_id");
  CREATE INDEX IF NOT EXISTS "albums_rels_users_id_idx" ON "albums_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "_albums_v_parent_idx" ON "_albums_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_albums_v_version_version_cover_idx" ON "_albums_v" USING btree ("version_cover_id");
  CREATE INDEX IF NOT EXISTS "_albums_v_version_version_author_idx" ON "_albums_v" USING btree ("version_author_id");
  CREATE INDEX IF NOT EXISTS "_albums_v_version_version_slug_key_idx" ON "_albums_v" USING btree ("version_slug_key");
  CREATE INDEX IF NOT EXISTS "_albums_v_version_version_hash_id_idx" ON "_albums_v" USING btree ("version_hash_id");
  CREATE INDEX IF NOT EXISTS "_albums_v_version_version_authority_idx" ON "_albums_v" USING btree ("version_authority");
  CREATE INDEX IF NOT EXISTS "_albums_v_version_version_updated_at_idx" ON "_albums_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_albums_v_version_version_created_at_idx" ON "_albums_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_albums_v_version_version__status_idx" ON "_albums_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_albums_v_created_at_idx" ON "_albums_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_albums_v_updated_at_idx" ON "_albums_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_albums_v_snapshot_idx" ON "_albums_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_albums_v_published_locale_idx" ON "_albums_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_albums_v_latest_idx" ON "_albums_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_albums_v_autosave_idx" ON "_albums_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "_albums_v_rels_order_idx" ON "_albums_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_albums_v_rels_parent_idx" ON "_albums_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_albums_v_rels_path_idx" ON "_albums_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_albums_v_rels_tags_id_idx" ON "_albums_v_rels" USING btree ("tags_id");
  CREATE INDEX IF NOT EXISTS "_albums_v_rels_users_id_idx" ON "_albums_v_rels" USING btree ("users_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "tracks_filename_compound_idx" ON "tracks" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "tracks_album_idx" ON "tracks" USING btree ("album_id");
  CREATE INDEX IF NOT EXISTS "tracks_author_idx" ON "tracks" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "tracks_slug_key_idx" ON "tracks" USING btree ("slug_key");
  CREATE INDEX IF NOT EXISTS "tracks_hash_id_idx" ON "tracks" USING btree ("hash_id");
  CREATE INDEX IF NOT EXISTS "tracks_authority_idx" ON "tracks" USING btree ("authority");
  CREATE INDEX IF NOT EXISTS "tracks_updated_at_idx" ON "tracks" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "tracks_created_at_idx" ON "tracks" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "tracks__status_idx" ON "tracks" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "tracks_filename_idx" ON "tracks" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "artist_album_idx" ON "tracks" USING btree ("artist","album_id");
  CREATE INDEX IF NOT EXISTS "tracks_rels_order_idx" ON "tracks_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "tracks_rels_parent_idx" ON "tracks_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "tracks_rels_path_idx" ON "tracks_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "tracks_rels_tags_id_idx" ON "tracks_rels" USING btree ("tags_id");
  CREATE INDEX IF NOT EXISTS "tracks_rels_users_id_idx" ON "tracks_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "_tracks_v_parent_idx" ON "_tracks_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_tracks_v_version_version_album_idx" ON "_tracks_v" USING btree ("version_album_id");
  CREATE INDEX IF NOT EXISTS "_tracks_v_version_version_author_idx" ON "_tracks_v" USING btree ("version_author_id");
  CREATE INDEX IF NOT EXISTS "_tracks_v_version_version_slug_key_idx" ON "_tracks_v" USING btree ("version_slug_key");
  CREATE INDEX IF NOT EXISTS "_tracks_v_version_version_hash_id_idx" ON "_tracks_v" USING btree ("version_hash_id");
  CREATE INDEX IF NOT EXISTS "_tracks_v_version_version_authority_idx" ON "_tracks_v" USING btree ("version_authority");
  CREATE INDEX IF NOT EXISTS "_tracks_v_version_version_updated_at_idx" ON "_tracks_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_tracks_v_version_version_created_at_idx" ON "_tracks_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_tracks_v_version_version__status_idx" ON "_tracks_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_tracks_v_version_version_filename_idx" ON "_tracks_v" USING btree ("version_filename");
  CREATE INDEX IF NOT EXISTS "_tracks_v_created_at_idx" ON "_tracks_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_tracks_v_updated_at_idx" ON "_tracks_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_tracks_v_snapshot_idx" ON "_tracks_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_tracks_v_published_locale_idx" ON "_tracks_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_tracks_v_latest_idx" ON "_tracks_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_tracks_v_autosave_idx" ON "_tracks_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "version_artist_version_album_idx" ON "_tracks_v" USING btree ("version_artist","version_album_id");
  CREATE INDEX IF NOT EXISTS "_tracks_v_rels_order_idx" ON "_tracks_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_tracks_v_rels_parent_idx" ON "_tracks_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_tracks_v_rels_path_idx" ON "_tracks_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_tracks_v_rels_tags_id_idx" ON "_tracks_v_rels" USING btree ("tags_id");
  CREATE INDEX IF NOT EXISTS "_tracks_v_rels_users_id_idx" ON "_tracks_v_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "playlists_cover_idx" ON "playlists" USING btree ("cover_id");
  CREATE INDEX IF NOT EXISTS "playlists_slug_key_idx" ON "playlists" USING btree ("slug_key");
  CREATE INDEX IF NOT EXISTS "playlists_hash_id_idx" ON "playlists" USING btree ("hash_id");
  CREATE INDEX IF NOT EXISTS "playlists_authority_idx" ON "playlists" USING btree ("authority");
  CREATE INDEX IF NOT EXISTS "playlists_updated_at_idx" ON "playlists" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "playlists_created_at_idx" ON "playlists" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "playlists__status_idx" ON "playlists" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "playlists_rels_order_idx" ON "playlists_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "playlists_rels_parent_idx" ON "playlists_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "playlists_rels_path_idx" ON "playlists_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "playlists_rels_tracks_id_idx" ON "playlists_rels" USING btree ("tracks_id");
  CREATE INDEX IF NOT EXISTS "playlists_rels_tags_id_idx" ON "playlists_rels" USING btree ("tags_id");
  CREATE INDEX IF NOT EXISTS "playlists_rels_users_id_idx" ON "playlists_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "_playlists_v_parent_idx" ON "_playlists_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_playlists_v_version_version_cover_idx" ON "_playlists_v" USING btree ("version_cover_id");
  CREATE INDEX IF NOT EXISTS "_playlists_v_version_version_slug_key_idx" ON "_playlists_v" USING btree ("version_slug_key");
  CREATE INDEX IF NOT EXISTS "_playlists_v_version_version_hash_id_idx" ON "_playlists_v" USING btree ("version_hash_id");
  CREATE INDEX IF NOT EXISTS "_playlists_v_version_version_authority_idx" ON "_playlists_v" USING btree ("version_authority");
  CREATE INDEX IF NOT EXISTS "_playlists_v_version_version_updated_at_idx" ON "_playlists_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_playlists_v_version_version_created_at_idx" ON "_playlists_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_playlists_v_version_version__status_idx" ON "_playlists_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_playlists_v_created_at_idx" ON "_playlists_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_playlists_v_updated_at_idx" ON "_playlists_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_playlists_v_snapshot_idx" ON "_playlists_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_playlists_v_published_locale_idx" ON "_playlists_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_playlists_v_latest_idx" ON "_playlists_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_playlists_v_rels_order_idx" ON "_playlists_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_playlists_v_rels_parent_idx" ON "_playlists_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_playlists_v_rels_path_idx" ON "_playlists_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_playlists_v_rels_tracks_id_idx" ON "_playlists_v_rels" USING btree ("tracks_id");
  CREATE INDEX IF NOT EXISTS "_playlists_v_rels_tags_id_idx" ON "_playlists_v_rels" USING btree ("tags_id");
  CREATE INDEX IF NOT EXISTS "_playlists_v_rels_users_id_idx" ON "_playlists_v_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "follows_user_idx" ON "follows" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "follows_target_idx" ON "follows" USING btree ("target_id");
  CREATE INDEX IF NOT EXISTS "follows_updated_at_idx" ON "follows" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "follows_created_at_idx" ON "follows" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "bookmarks_user_idx" ON "bookmarks" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "bookmarks_updated_at_idx" ON "bookmarks" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "bookmarks_created_at_idx" ON "bookmarks" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "bookmarks_rels_order_idx" ON "bookmarks_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "bookmarks_rels_parent_idx" ON "bookmarks_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "bookmarks_rels_path_idx" ON "bookmarks_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "bookmarks_rels_posts_id_idx" ON "bookmarks_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "bookmarks_rels_surf_id_idx" ON "bookmarks_rels" USING btree ("surf_id");
  CREATE INDEX IF NOT EXISTS "bookmarks_rels_profile_id_idx" ON "bookmarks_rels" USING btree ("profile_id");
  CREATE INDEX IF NOT EXISTS "bookmarks_rels_users_id_idx" ON "bookmarks_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "bookmarks_rels_albums_id_idx" ON "bookmarks_rels" USING btree ("albums_id");
  CREATE INDEX IF NOT EXISTS "bookmarks_rels_playlists_id_idx" ON "bookmarks_rels" USING btree ("playlists_id");
  CREATE INDEX IF NOT EXISTS "bookmarks_rels_tracks_id_idx" ON "bookmarks_rels" USING btree ("tracks_id");
  CREATE INDEX IF NOT EXISTS "bookmarks_rels_user_media_id_idx" ON "bookmarks_rels" USING btree ("user_media_id");
  CREATE INDEX IF NOT EXISTS "user_views_user_idx" ON "user_views" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "user_views_viewed_idx" ON "user_views" USING btree ("viewed");
  CREATE INDEX IF NOT EXISTS "user_views_progress_idx" ON "user_views" USING btree ("progress");
  CREATE INDEX IF NOT EXISTS "user_views_updated_at_idx" ON "user_views" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "user_views_created_at_idx" ON "user_views" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "user_views_rels_order_idx" ON "user_views_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "user_views_rels_parent_idx" ON "user_views_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "user_views_rels_path_idx" ON "user_views_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "user_views_rels_posts_id_idx" ON "user_views_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "user_views_rels_surf_id_idx" ON "user_views_rels" USING btree ("surf_id");
  CREATE INDEX IF NOT EXISTS "user_views_rels_playlists_id_idx" ON "user_views_rels" USING btree ("playlists_id");
  CREATE INDEX IF NOT EXISTS "user_views_rels_profile_id_idx" ON "user_views_rels" USING btree ("profile_id");
  CREATE INDEX IF NOT EXISTS "user_views_rels_albums_id_idx" ON "user_views_rels" USING btree ("albums_id");
  CREATE INDEX IF NOT EXISTS "user_views_rels_tracks_id_idx" ON "user_views_rels" USING btree ("tracks_id");
  CREATE INDEX IF NOT EXISTS "surf_source_idx" ON "surf" USING btree ("source");
  CREATE INDEX IF NOT EXISTS "surf_category_idx" ON "surf" USING btree ("category_id");
  CREATE INDEX IF NOT EXISTS "surf_slug_key_idx" ON "surf" USING btree ("slug_key");
  CREATE INDEX IF NOT EXISTS "surf_hash_id_idx" ON "surf" USING btree ("hash_id");
  CREATE INDEX IF NOT EXISTS "surf_comments_enabled_idx" ON "surf" USING btree ("comments_enabled");
  CREATE INDEX IF NOT EXISTS "surf_author_idx" ON "surf" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "surf_authority_idx" ON "surf" USING btree ("authority");
  CREATE INDEX IF NOT EXISTS "surf_updated_at_idx" ON "surf" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "surf_created_at_idx" ON "surf" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "surf__status_idx" ON "surf" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "surf_meta_meta_image_idx" ON "surf_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "surf_locales_locale_parent_id_unique" ON "surf_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "surf_rels_order_idx" ON "surf_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "surf_rels_parent_idx" ON "surf_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "surf_rels_path_idx" ON "surf_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "surf_rels_tags_id_idx" ON "surf_rels" USING btree ("tags_id");
  CREATE INDEX IF NOT EXISTS "surf_rels_surf_id_idx" ON "surf_rels" USING btree ("surf_id");
  CREATE INDEX IF NOT EXISTS "surf_rels_posts_id_idx" ON "surf_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "surf_rels_users_id_idx" ON "surf_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "_surf_v_parent_idx" ON "_surf_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_surf_v_version_version_source_idx" ON "_surf_v" USING btree ("version_source");
  CREATE INDEX IF NOT EXISTS "_surf_v_version_version_category_idx" ON "_surf_v" USING btree ("version_category_id");
  CREATE INDEX IF NOT EXISTS "_surf_v_version_version_slug_key_idx" ON "_surf_v" USING btree ("version_slug_key");
  CREATE INDEX IF NOT EXISTS "_surf_v_version_version_hash_id_idx" ON "_surf_v" USING btree ("version_hash_id");
  CREATE INDEX IF NOT EXISTS "_surf_v_version_version_comments_enabled_idx" ON "_surf_v" USING btree ("version_comments_enabled");
  CREATE INDEX IF NOT EXISTS "_surf_v_version_version_author_idx" ON "_surf_v" USING btree ("version_author_id");
  CREATE INDEX IF NOT EXISTS "_surf_v_version_version_authority_idx" ON "_surf_v" USING btree ("version_authority");
  CREATE INDEX IF NOT EXISTS "_surf_v_version_version_updated_at_idx" ON "_surf_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_surf_v_version_version_created_at_idx" ON "_surf_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_surf_v_version_version__status_idx" ON "_surf_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_surf_v_created_at_idx" ON "_surf_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_surf_v_updated_at_idx" ON "_surf_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_surf_v_snapshot_idx" ON "_surf_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_surf_v_published_locale_idx" ON "_surf_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_surf_v_latest_idx" ON "_surf_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_surf_v_version_meta_version_meta_image_idx" ON "_surf_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_surf_v_locales_locale_parent_id_unique" ON "_surf_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_surf_v_rels_order_idx" ON "_surf_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_surf_v_rels_parent_idx" ON "_surf_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_surf_v_rels_path_idx" ON "_surf_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_surf_v_rels_tags_id_idx" ON "_surf_v_rels" USING btree ("tags_id");
  CREATE INDEX IF NOT EXISTS "_surf_v_rels_surf_id_idx" ON "_surf_v_rels" USING btree ("surf_id");
  CREATE INDEX IF NOT EXISTS "_surf_v_rels_posts_id_idx" ON "_surf_v_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "_surf_v_rels_users_id_idx" ON "_surf_v_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "citations_reference_idx" ON "citations" USING btree ("reference");
  CREATE INDEX IF NOT EXISTS "citations_private_idx" ON "citations" USING btree ("private");
  CREATE INDEX IF NOT EXISTS "citations_author_idx" ON "citations" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "citations_cited_idx" ON "citations" USING btree ("cited_id");
  CREATE INDEX IF NOT EXISTS "citations_updated_at_idx" ON "citations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "citations_created_at_idx" ON "citations" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "citations_rels_order_idx" ON "citations_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "citations_rels_parent_idx" ON "citations_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "citations_rels_path_idx" ON "citations_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "citations_rels_surf_id_idx" ON "citations_rels" USING btree ("surf_id");
  CREATE INDEX IF NOT EXISTS "citations_rels_posts_id_idx" ON "citations_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "responses_author_idx" ON "responses" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "responses_depth_idx" ON "responses" USING btree ("depth");
  CREATE INDEX IF NOT EXISTS "responses_hash_idx" ON "responses" USING btree ("hash");
  CREATE INDEX IF NOT EXISTS "responses_is_sticky_idx" ON "responses" USING btree ("is_sticky");
  CREATE INDEX IF NOT EXISTS "responses_updated_at_idx" ON "responses" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "responses_created_at_idx" ON "responses" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "responses__status_idx" ON "responses" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "responses_rels_order_idx" ON "responses_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "responses_rels_parent_idx" ON "responses_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "responses_rels_path_idx" ON "responses_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "responses_rels_posts_id_idx" ON "responses_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "responses_rels_surf_id_idx" ON "responses_rels" USING btree ("surf_id");
  CREATE INDEX IF NOT EXISTS "responses_rels_responses_id_idx" ON "responses_rels" USING btree ("responses_id");
  CREATE INDEX IF NOT EXISTS "responses_rels_citations_id_idx" ON "responses_rels" USING btree ("citations_id");
  CREATE INDEX IF NOT EXISTS "responses_rels_users_id_idx" ON "responses_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "_responses_v_parent_idx" ON "_responses_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_responses_v_version_version_author_idx" ON "_responses_v" USING btree ("version_author_id");
  CREATE INDEX IF NOT EXISTS "_responses_v_version_version_depth_idx" ON "_responses_v" USING btree ("version_depth");
  CREATE INDEX IF NOT EXISTS "_responses_v_version_version_hash_idx" ON "_responses_v" USING btree ("version_hash");
  CREATE INDEX IF NOT EXISTS "_responses_v_version_version_is_sticky_idx" ON "_responses_v" USING btree ("version_is_sticky");
  CREATE INDEX IF NOT EXISTS "_responses_v_version_version_updated_at_idx" ON "_responses_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_responses_v_version_version_created_at_idx" ON "_responses_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_responses_v_version_version__status_idx" ON "_responses_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_responses_v_created_at_idx" ON "_responses_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_responses_v_updated_at_idx" ON "_responses_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_responses_v_snapshot_idx" ON "_responses_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_responses_v_published_locale_idx" ON "_responses_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_responses_v_latest_idx" ON "_responses_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_responses_v_rels_order_idx" ON "_responses_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_responses_v_rels_parent_idx" ON "_responses_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_responses_v_rels_path_idx" ON "_responses_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_responses_v_rels_posts_id_idx" ON "_responses_v_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "_responses_v_rels_surf_id_idx" ON "_responses_v_rels" USING btree ("surf_id");
  CREATE INDEX IF NOT EXISTS "_responses_v_rels_responses_id_idx" ON "_responses_v_rels" USING btree ("responses_id");
  CREATE INDEX IF NOT EXISTS "_responses_v_rels_citations_id_idx" ON "_responses_v_rels" USING btree ("citations_id");
  CREATE INDEX IF NOT EXISTS "_responses_v_rels_users_id_idx" ON "_responses_v_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "compilations_title_idx" ON "compilations" USING btree ("title");
  CREATE UNIQUE INDEX IF NOT EXISTS "compilations_hash_id_idx" ON "compilations" USING btree ("hash_id");
  CREATE INDEX IF NOT EXISTS "compilations_author_idx" ON "compilations" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "compilations_cover_image_idx" ON "compilations" USING btree ("cover_image_id");
  CREATE INDEX IF NOT EXISTS "compilations_updated_at_idx" ON "compilations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "compilations_created_at_idx" ON "compilations" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "compilations_rels_order_idx" ON "compilations_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "compilations_rels_parent_idx" ON "compilations_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "compilations_rels_path_idx" ON "compilations_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "compilations_rels_posts_id_idx" ON "compilations_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "compilations_rels_surf_id_idx" ON "compilations_rels" USING btree ("surf_id");
  CREATE INDEX IF NOT EXISTS "compilations_rels_profile_id_idx" ON "compilations_rels" USING btree ("profile_id");
  CREATE INDEX IF NOT EXISTS "compilations_rels_albums_id_idx" ON "compilations_rels" USING btree ("albums_id");
  CREATE INDEX IF NOT EXISTS "compilations_rels_playlists_id_idx" ON "compilations_rels" USING btree ("playlists_id");
  CREATE INDEX IF NOT EXISTS "compilations_rels_tracks_id_idx" ON "compilations_rels" USING btree ("tracks_id");
  CREATE INDEX IF NOT EXISTS "compilations_rels_user_media_id_idx" ON "compilations_rels" USING btree ("user_media_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "commerce_products_slug_idx" ON "commerce_products" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "commerce_products_active_idx" ON "commerce_products" USING btree ("active");
  CREATE INDEX IF NOT EXISTS "commerce_products_hero_media_idx" ON "commerce_products" USING btree ("hero_media_id");
  CREATE INDEX IF NOT EXISTS "commerce_products_sort_idx" ON "commerce_products" USING btree ("sort");
  CREATE INDEX IF NOT EXISTS "commerce_products_updated_at_idx" ON "commerce_products" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "commerce_products_created_at_idx" ON "commerce_products" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "commerce_products_rels_order_idx" ON "commerce_products_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "commerce_products_rels_parent_idx" ON "commerce_products_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "commerce_products_rels_path_idx" ON "commerce_products_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "commerce_products_rels_media_id_idx" ON "commerce_products_rels" USING btree ("media_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "commerce_orders_ref_idx" ON "commerce_orders" USING btree ("ref");
  CREATE INDEX IF NOT EXISTS "commerce_orders_user_idx" ON "commerce_orders" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "commerce_orders_product_idx" ON "commerce_orders" USING btree ("product_id");
  CREATE INDEX IF NOT EXISTS "commerce_orders_payment_status_idx" ON "commerce_orders" USING btree ("payment_status");
  CREATE INDEX IF NOT EXISTS "commerce_orders_status_idx" ON "commerce_orders" USING btree ("status");
  CREATE UNIQUE INDEX IF NOT EXISTS "commerce_orders_idempotency_key_idx" ON "commerce_orders" USING btree ("idempotency_key");
  CREATE UNIQUE INDEX IF NOT EXISTS "commerce_orders_provider_payment_id_idx" ON "commerce_orders" USING btree ("provider_payment_id");
  CREATE INDEX IF NOT EXISTS "commerce_orders_provider_transaction_id_idx" ON "commerce_orders" USING btree ("provider_transaction_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "commerce_orders_bank_transfer_reference_idx" ON "commerce_orders" USING btree ("bank_transfer_reference");
  CREATE INDEX IF NOT EXISTS "commerce_orders_paid_at_idx" ON "commerce_orders" USING btree ("paid_at");
  CREATE INDEX IF NOT EXISTS "commerce_orders_shipped_at_idx" ON "commerce_orders" USING btree ("shipped_at");
  CREATE INDEX IF NOT EXISTS "commerce_orders_completed_at_idx" ON "commerce_orders" USING btree ("completed_at");
  CREATE INDEX IF NOT EXISTS "commerce_orders_updated_at_idx" ON "commerce_orders" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "commerce_orders_created_at_idx" ON "commerce_orders" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "admins_email_idx" ON "admins" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "admins_foto_idx" ON "admins" USING btree ("foto_id");
  CREATE INDEX IF NOT EXISTS "admins_bio_idx" ON "admins" USING btree ("bio");
  CREATE INDEX IF NOT EXISTS "admins_updated_at_idx" ON "admins" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "admins_created_at_idx" ON "admins" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_admins_v_parent_idx" ON "_admins_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_admins_v_version_version_email_idx" ON "_admins_v" USING btree ("version_email");
  CREATE INDEX IF NOT EXISTS "_admins_v_version_version_foto_idx" ON "_admins_v" USING btree ("version_foto_id");
  CREATE INDEX IF NOT EXISTS "_admins_v_version_version_bio_idx" ON "_admins_v" USING btree ("version_bio");
  CREATE INDEX IF NOT EXISTS "_admins_v_version_version_updated_at_idx" ON "_admins_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_admins_v_version_version_created_at_idx" ON "_admins_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_admins_v_created_at_idx" ON "_admins_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_admins_v_updated_at_idx" ON "_admins_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "exports_updated_at_idx" ON "exports" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "exports_created_at_idx" ON "exports" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "exports_filename_idx" ON "exports" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "exports_texts_order_parent" ON "exports_texts" USING btree ("order","parent_id");
  CREATE INDEX IF NOT EXISTS "imports_updated_at_idx" ON "imports" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "imports_created_at_idx" ON "imports" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "imports_filename_idx" ON "imports" USING btree ("filename");
  CREATE UNIQUE INDEX IF NOT EXISTS "redirects_from_idx" ON "redirects" USING btree ("from");
  CREATE INDEX IF NOT EXISTS "redirects_updated_at_idx" ON "redirects" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "redirects_created_at_idx" ON "redirects" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "redirects_rels_order_idx" ON "redirects_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "redirects_rels_parent_idx" ON "redirects_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "redirects_rels_path_idx" ON "redirects_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "redirects_rels_pages_id_idx" ON "redirects_rels" USING btree ("pages_id");
  CREATE INDEX IF NOT EXISTS "redirects_rels_posts_id_idx" ON "redirects_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "search_author_order_idx" ON "search_author" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "search_author_parent_id_idx" ON "search_author" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "search_allow_list_order_idx" ON "search_allow_list" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "search_allow_list_parent_id_idx" ON "search_allow_list" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "search_tags_order_idx" ON "search_tags" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "search_tags_parent_id_idx" ON "search_tags" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "search_tags_key_idx" ON "search_tags" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "search_category_order_idx" ON "search_category" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "search_category_parent_id_idx" ON "search_category" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "search_category_key_idx" ON "search_category" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "search_score_idx" ON "search" USING btree ("score");
  CREATE INDEX IF NOT EXISTS "search_slug_idx" ON "search" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "search_locked_idx" ON "search" USING btree ("locked");
  CREATE INDEX IF NOT EXISTS "search_authority_idx" ON "search" USING btree ("authority");
  CREATE INDEX IF NOT EXISTS "search_updated_at_idx" ON "search" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "search_created_at_idx" ON "search" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "search_locales_locale_parent_id_unique" ON "search_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "search_rels_order_idx" ON "search_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "search_rels_parent_idx" ON "search_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "search_rels_path_idx" ON "search_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "search_rels_posts_id_idx" ON "search_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "search_rels_surf_id_idx" ON "search_rels" USING btree ("surf_id");
  CREATE INDEX IF NOT EXISTS "search_rels_profile_id_idx" ON "search_rels" USING btree ("profile_id");
  CREATE INDEX IF NOT EXISTS "search_rels_pages_id_idx" ON "search_rels" USING btree ("pages_id");
  CREATE INDEX IF NOT EXISTS "search_rels_tracks_id_idx" ON "search_rels" USING btree ("tracks_id");
  CREATE INDEX IF NOT EXISTS "search_rels_playlists_id_idx" ON "search_rels" USING btree ("playlists_id");
  CREATE INDEX IF NOT EXISTS "search_rels_albums_id_idx" ON "search_rels" USING btree ("albums_id");
  CREATE INDEX IF NOT EXISTS "search_rels_media_id_idx" ON "search_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "search_rels_assets_id_idx" ON "search_rels" USING btree ("assets_id");
  CREATE INDEX IF NOT EXISTS "search_rels_user_media_id_idx" ON "search_rels" USING btree ("user_media_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX IF NOT EXISTS "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX IF NOT EXISTS "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX IF NOT EXISTS "payload_jobs_workflow_slug_idx" ON "payload_jobs" USING btree ("workflow_slug");
  CREATE INDEX IF NOT EXISTS "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX IF NOT EXISTS "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX IF NOT EXISTS "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX IF NOT EXISTS "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX IF NOT EXISTS "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_folders_folder_type_order_idx" ON "payload_folders_folder_type" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_folders_folder_type_parent_idx" ON "payload_folders_folder_type" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_folders_name_idx" ON "payload_folders" USING btree ("name");
  CREATE INDEX IF NOT EXISTS "payload_folders_folder_idx" ON "payload_folders" USING btree ("folder_id");
  CREATE INDEX IF NOT EXISTS "payload_folders_updated_at_idx" ON "payload_folders" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_folders_created_at_idx" ON "payload_folders" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("sessions_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_accounts_id_idx" ON "payload_locked_documents_rels" USING btree ("accounts_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_verifications_id_idx" ON "payload_locked_documents_rels" USING btree ("verifications_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_two_factors_id_idx" ON "payload_locked_documents_rels" USING btree ("two_factors_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_passkeys_id_idx" ON "payload_locked_documents_rels" USING btree ("passkeys_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_organizations_id_idx" ON "payload_locked_documents_rels" USING btree ("organizations_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_teams_id_idx" ON "payload_locked_documents_rels" USING btree ("teams_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_team_members_id_idx" ON "payload_locked_documents_rels" USING btree ("team_members_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_members_id_idx" ON "payload_locked_documents_rels" USING btree ("members_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_invitations_id_idx" ON "payload_locked_documents_rels" USING btree ("invitations_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_admin_invitations_id_idx" ON "payload_locked_documents_rels" USING btree ("admin_invitations_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_assets_id_idx" ON "payload_locked_documents_rels" USING btree ("assets_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_notifications_id_idx" ON "payload_locked_documents_rels" USING btree ("notifications_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_user_media_id_idx" ON "payload_locked_documents_rels" USING btree ("user_media_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_email_quota_id_idx" ON "payload_locked_documents_rels" USING btree ("email_quota_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_deferred_emails_id_idx" ON "payload_locked_documents_rels" USING btree ("deferred_emails_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_profile_id_idx" ON "payload_locked_documents_rels" USING btree ("profile_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_bookmarks_id_idx" ON "payload_locked_documents_rels" USING btree ("bookmarks_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_user_views_id_idx" ON "payload_locked_documents_rels" USING btree ("user_views_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_responses_id_idx" ON "payload_locked_documents_rels" USING btree ("responses_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_compilations_id_idx" ON "payload_locked_documents_rels" USING btree ("compilations_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_commerce_products_id_idx" ON "payload_locked_documents_rels" USING btree ("commerce_products_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_commerce_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("commerce_orders_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_admins_id_idx" ON "payload_locked_documents_rels" USING btree ("admins_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_redirects_id_idx" ON "payload_locked_documents_rels" USING btree ("redirects_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_search_id_idx" ON "payload_locked_documents_rels" USING btree ("search_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_payload_folders_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_folders_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_admins_id_idx" ON "payload_preferences_rels" USING btree ("admins_id");
  CREATE INDEX IF NOT EXISTS "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "header_nav_items_order_idx" ON "header_nav_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "header_nav_items_parent_id_idx" ON "header_nav_items" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "header_nav_items_preview_media_preview_media_desktop_idx" ON "header_nav_items" USING btree ("preview_media_desktop_id");
  CREATE INDEX IF NOT EXISTS "header_nav_items_preview_media_preview_media_mobile_idx" ON "header_nav_items" USING btree ("preview_media_mobile_id");
  CREATE INDEX IF NOT EXISTS "header_rels_order_idx" ON "header_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "header_rels_parent_idx" ON "header_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "header_rels_path_idx" ON "header_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "header_rels_playlists_id_idx" ON "header_rels" USING btree ("playlists_id");
  CREATE INDEX IF NOT EXISTS "header_rels_pages_id_idx" ON "header_rels" USING btree ("pages_id");
  CREATE INDEX IF NOT EXISTS "header_rels_posts_id_idx" ON "header_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "header_rels_surf_id_idx" ON "header_rels" USING btree ("surf_id");
  CREATE INDEX IF NOT EXISTS "header_rels_users_id_idx" ON "header_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "header_rels_albums_id_idx" ON "header_rels" USING btree ("albums_id");
  CREATE INDEX IF NOT EXISTS "header_rels_tracks_id_idx" ON "header_rels" USING btree ("tracks_id");
  CREATE INDEX IF NOT EXISTS "header_rels_organizations_id_idx" ON "header_rels" USING btree ("organizations_id");
  CREATE INDEX IF NOT EXISTS "header_rels_categories_id_idx" ON "header_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "footer_nav_items_order_idx" ON "footer_nav_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "footer_nav_items_parent_id_idx" ON "footer_nav_items" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "footer_column1_links_order_idx" ON "footer_column1_links" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "footer_column1_links_parent_id_idx" ON "footer_column1_links" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "footer_column2_links_order_idx" ON "footer_column2_links" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "footer_column2_links_parent_id_idx" ON "footer_column2_links" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "footer_column3_links_order_idx" ON "footer_column3_links" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "footer_column3_links_parent_id_idx" ON "footer_column3_links" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "footer_defaults_defaults_desktop_idx" ON "footer" USING btree ("defaults_desktop_id");
  CREATE INDEX IF NOT EXISTS "footer_defaults_defaults_mobile_idx" ON "footer" USING btree ("defaults_mobile_id");
  CREATE INDEX IF NOT EXISTS "footer_video_loop_video_loop_desktop_idx" ON "footer" USING btree ("video_loop_desktop_id");
  CREATE INDEX IF NOT EXISTS "footer_video_loop_video_loop_mobile_idx" ON "footer" USING btree ("video_loop_mobile_id");
  CREATE INDEX IF NOT EXISTS "footer_rels_order_idx" ON "footer_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "footer_rels_parent_idx" ON "footer_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "footer_rels_path_idx" ON "footer_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "footer_rels_pages_id_idx" ON "footer_rels" USING btree ("pages_id");
  CREATE INDEX IF NOT EXISTS "footer_rels_posts_id_idx" ON "footer_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "footer_rels_surf_id_idx" ON "footer_rels" USING btree ("surf_id");
  CREATE INDEX IF NOT EXISTS "footer_rels_users_id_idx" ON "footer_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "footer_rels_albums_id_idx" ON "footer_rels" USING btree ("albums_id");
  CREATE INDEX IF NOT EXISTS "footer_rels_tracks_id_idx" ON "footer_rels" USING btree ("tracks_id");
  CREATE INDEX IF NOT EXISTS "footer_rels_playlists_id_idx" ON "footer_rels" USING btree ("playlists_id");
  CREATE INDEX IF NOT EXISTS "footer_rels_organizations_id_idx" ON "footer_rels" USING btree ("organizations_id");
  CREATE INDEX IF NOT EXISTS "footer_rels_categories_id_idx" ON "footer_rels" USING btree ("categories_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "users" CASCADE;
  DROP TABLE IF EXISTS "users_locales" CASCADE;
  DROP TABLE IF EXISTS "_users_v" CASCADE;
  DROP TABLE IF EXISTS "_users_v_locales" CASCADE;
  DROP TABLE IF EXISTS "sessions" CASCADE;
  DROP TABLE IF EXISTS "accounts" CASCADE;
  DROP TABLE IF EXISTS "verifications" CASCADE;
  DROP TABLE IF EXISTS "two_factors" CASCADE;
  DROP TABLE IF EXISTS "passkeys" CASCADE;
  DROP TABLE IF EXISTS "organizations" CASCADE;
  DROP TABLE IF EXISTS "teams" CASCADE;
  DROP TABLE IF EXISTS "team_members" CASCADE;
  DROP TABLE IF EXISTS "members" CASCADE;
  DROP TABLE IF EXISTS "invitations" CASCADE;
  DROP TABLE IF EXISTS "admin_invitations" CASCADE;
  DROP TABLE IF EXISTS "assets" CASCADE;
  DROP TABLE IF EXISTS "assets_rels" CASCADE;
  DROP TABLE IF EXISTS "categories" CASCADE;
  DROP TABLE IF EXISTS "categories_rels" CASCADE;
  DROP TABLE IF EXISTS "media" CASCADE;
  DROP TABLE IF EXISTS "media_rels" CASCADE;
  DROP TABLE IF EXISTS "tags" CASCADE;
  DROP TABLE IF EXISTS "notifications" CASCADE;
  DROP TABLE IF EXISTS "notifications_rels" CASCADE;
  DROP TABLE IF EXISTS "pages_hero_links" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_cta_links" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_cta" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_content_columns" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_content" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_image" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_archive" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_fotd_relation_to" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_fotd" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_hero_square" CASCADE;
  DROP TABLE IF EXISTS "pages" CASCADE;
  DROP TABLE IF EXISTS "pages_locales" CASCADE;
  DROP TABLE IF EXISTS "pages_rels" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_version_hero_links" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_cta_links" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_cta" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_content_columns" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_content" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_image" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_archive" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_fotd_relation_to" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_fotd" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_hero_square" CASCADE;
  DROP TABLE IF EXISTS "_pages_v" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_locales" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_rels" CASCADE;
  DROP TABLE IF EXISTS "posts" CASCADE;
  DROP TABLE IF EXISTS "posts_locales" CASCADE;
  DROP TABLE IF EXISTS "posts_rels" CASCADE;
  DROP TABLE IF EXISTS "_posts_v" CASCADE;
  DROP TABLE IF EXISTS "_posts_v_locales" CASCADE;
  DROP TABLE IF EXISTS "_posts_v_rels" CASCADE;
  DROP TABLE IF EXISTS "user_media" CASCADE;
  DROP TABLE IF EXISTS "user_media_rels" CASCADE;
  DROP TABLE IF EXISTS "email_quota" CASCADE;
  DROP TABLE IF EXISTS "deferred_emails" CASCADE;
  DROP TABLE IF EXISTS "profile_slides" CASCADE;
  DROP TABLE IF EXISTS "profile_rsvp_gallery" CASCADE;
  DROP TABLE IF EXISTS "profile" CASCADE;
  DROP TABLE IF EXISTS "profile_rels" CASCADE;
  DROP TABLE IF EXISTS "_profile_v_version_slides" CASCADE;
  DROP TABLE IF EXISTS "_profile_v_version_rsvp_gallery" CASCADE;
  DROP TABLE IF EXISTS "_profile_v" CASCADE;
  DROP TABLE IF EXISTS "_profile_v_rels" CASCADE;
  DROP TABLE IF EXISTS "albums" CASCADE;
  DROP TABLE IF EXISTS "albums_rels" CASCADE;
  DROP TABLE IF EXISTS "_albums_v" CASCADE;
  DROP TABLE IF EXISTS "_albums_v_rels" CASCADE;
  DROP TABLE IF EXISTS "tracks" CASCADE;
  DROP TABLE IF EXISTS "tracks_rels" CASCADE;
  DROP TABLE IF EXISTS "_tracks_v" CASCADE;
  DROP TABLE IF EXISTS "_tracks_v_rels" CASCADE;
  DROP TABLE IF EXISTS "playlists" CASCADE;
  DROP TABLE IF EXISTS "playlists_rels" CASCADE;
  DROP TABLE IF EXISTS "_playlists_v" CASCADE;
  DROP TABLE IF EXISTS "_playlists_v_rels" CASCADE;
  DROP TABLE IF EXISTS "follows" CASCADE;
  DROP TABLE IF EXISTS "bookmarks" CASCADE;
  DROP TABLE IF EXISTS "bookmarks_rels" CASCADE;
  DROP TABLE IF EXISTS "user_views" CASCADE;
  DROP TABLE IF EXISTS "user_views_rels" CASCADE;
  DROP TABLE IF EXISTS "surf" CASCADE;
  DROP TABLE IF EXISTS "surf_locales" CASCADE;
  DROP TABLE IF EXISTS "surf_rels" CASCADE;
  DROP TABLE IF EXISTS "_surf_v" CASCADE;
  DROP TABLE IF EXISTS "_surf_v_locales" CASCADE;
  DROP TABLE IF EXISTS "_surf_v_rels" CASCADE;
  DROP TABLE IF EXISTS "citations" CASCADE;
  DROP TABLE IF EXISTS "citations_rels" CASCADE;
  DROP TABLE IF EXISTS "responses" CASCADE;
  DROP TABLE IF EXISTS "responses_rels" CASCADE;
  DROP TABLE IF EXISTS "_responses_v" CASCADE;
  DROP TABLE IF EXISTS "_responses_v_rels" CASCADE;
  DROP TABLE IF EXISTS "compilations" CASCADE;
  DROP TABLE IF EXISTS "compilations_rels" CASCADE;
  DROP TABLE IF EXISTS "commerce_products" CASCADE;
  DROP TABLE IF EXISTS "commerce_products_rels" CASCADE;
  DROP TABLE IF EXISTS "commerce_orders" CASCADE;
  DROP TABLE IF EXISTS "admins" CASCADE;
  DROP TABLE IF EXISTS "_admins_v" CASCADE;
  DROP TABLE IF EXISTS "exports" CASCADE;
  DROP TABLE IF EXISTS "exports_texts" CASCADE;
  DROP TABLE IF EXISTS "imports" CASCADE;
  DROP TABLE IF EXISTS "redirects" CASCADE;
  DROP TABLE IF EXISTS "redirects_rels" CASCADE;
  DROP TABLE IF EXISTS "search_author" CASCADE;
  DROP TABLE IF EXISTS "search_allow_list" CASCADE;
  DROP TABLE IF EXISTS "search_tags" CASCADE;
  DROP TABLE IF EXISTS "search_category" CASCADE;
  DROP TABLE IF EXISTS "search" CASCADE;
  DROP TABLE IF EXISTS "search_locales" CASCADE;
  DROP TABLE IF EXISTS "search_rels" CASCADE;
  DROP TABLE IF EXISTS "payload_kv" CASCADE;
  DROP TABLE IF EXISTS "payload_jobs_log" CASCADE;
  DROP TABLE IF EXISTS "payload_jobs" CASCADE;
  DROP TABLE IF EXISTS "payload_folders_folder_type" CASCADE;
  DROP TABLE IF EXISTS "payload_folders" CASCADE;
  DROP TABLE IF EXISTS "payload_locked_documents" CASCADE;
  DROP TABLE IF EXISTS "payload_locked_documents_rels" CASCADE;
  DROP TABLE IF EXISTS "payload_preferences" CASCADE;
  DROP TABLE IF EXISTS "payload_preferences_rels" CASCADE;
  DROP TABLE IF EXISTS "payload_migrations" CASCADE;
  DROP TABLE IF EXISTS "header_nav_items" CASCADE;
  DROP TABLE IF EXISTS "header" CASCADE;
  DROP TABLE IF EXISTS "header_rels" CASCADE;
  DROP TABLE IF EXISTS "footer_nav_items" CASCADE;
  DROP TABLE IF EXISTS "footer_column1_links" CASCADE;
  DROP TABLE IF EXISTS "footer_column2_links" CASCADE;
  DROP TABLE IF EXISTS "footer_column3_links" CASCADE;
  DROP TABLE IF EXISTS "footer" CASCADE;
  DROP TABLE IF EXISTS "footer_rels" CASCADE;
  DROP TYPE IF EXISTS "public"."_locales";
  DROP TYPE IF EXISTS "public"."enum_users_role";
  DROP TYPE IF EXISTS "public"."enum_users_status";
  DROP TYPE IF EXISTS "public"."enum__users_v_version_role";
  DROP TYPE IF EXISTS "public"."enum__users_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__users_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_admin_invitations_role";
  DROP TYPE IF EXISTS "public"."enum_assets_audience";
  DROP TYPE IF EXISTS "public"."enum_categories_identity_accent";
  DROP TYPE IF EXISTS "public"."enum_categories_identity_layout";
  DROP TYPE IF EXISTS "public"."enum_media_audience";
  DROP TYPE IF EXISTS "public"."enum_notifications_type";
  DROP TYPE IF EXISTS "public"."enum_notifications_status";
  DROP TYPE IF EXISTS "public"."enum_notifications_action_link_type";
  DROP TYPE IF EXISTS "public"."enum_notifications_action_link_appearance";
  DROP TYPE IF EXISTS "public"."enum_pages_hero_links_link_type";
  DROP TYPE IF EXISTS "public"."enum_pages_hero_links_link_appearance";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_cta_links_link_type";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_cta_links_link_appearance";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_content_columns_size";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_content_columns_link_type";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_content_columns_link_appearance";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_archive_populate_by";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_archive_relation_to";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_fotd_relation_to";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_fotd_populate_by";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_hero_square_populate_by";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_hero_square_relation_to";
  DROP TYPE IF EXISTS "public"."enum_pages_hero_type";
  DROP TYPE IF EXISTS "public"."enum_pages_page_layout_footer_type";
  DROP TYPE IF EXISTS "public"."enum_pages_audience";
  DROP TYPE IF EXISTS "public"."enum_pages_status";
  DROP TYPE IF EXISTS "public"."enum__pages_v_version_hero_links_link_type";
  DROP TYPE IF EXISTS "public"."enum__pages_v_version_hero_links_link_appearance";
  DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_cta_links_link_type";
  DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_cta_links_link_appearance";
  DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_content_columns_size";
  DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_content_columns_link_type";
  DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_content_columns_link_appearance";
  DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_archive_populate_by";
  DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_archive_relation_to";
  DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_fotd_relation_to";
  DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_fotd_populate_by";
  DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_hero_square_populate_by";
  DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_hero_square_relation_to";
  DROP TYPE IF EXISTS "public"."enum__pages_v_version_hero_type";
  DROP TYPE IF EXISTS "public"."enum__pages_v_version_page_layout_footer_type";
  DROP TYPE IF EXISTS "public"."enum__pages_v_version_audience";
  DROP TYPE IF EXISTS "public"."enum__pages_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__pages_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_posts_audience";
  DROP TYPE IF EXISTS "public"."enum_posts_status";
  DROP TYPE IF EXISTS "public"."enum__posts_v_version_audience";
  DROP TYPE IF EXISTS "public"."enum__posts_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__posts_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_user_media_audience";
  DROP TYPE IF EXISTS "public"."enum_deferred_emails_category";
  DROP TYPE IF EXISTS "public"."enum_deferred_emails_status";
  DROP TYPE IF EXISTS "public"."enum_profile_rsvp_tier";
  DROP TYPE IF EXISTS "public"."enum_profile_audience";
  DROP TYPE IF EXISTS "public"."enum_profile_status";
  DROP TYPE IF EXISTS "public"."enum__profile_v_version_rsvp_tier";
  DROP TYPE IF EXISTS "public"."enum__profile_v_version_audience";
  DROP TYPE IF EXISTS "public"."enum__profile_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__profile_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_albums_visibility";
  DROP TYPE IF EXISTS "public"."enum_albums_audience";
  DROP TYPE IF EXISTS "public"."enum_albums_status";
  DROP TYPE IF EXISTS "public"."enum__albums_v_version_visibility";
  DROP TYPE IF EXISTS "public"."enum__albums_v_version_audience";
  DROP TYPE IF EXISTS "public"."enum__albums_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__albums_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_tracks_visibility";
  DROP TYPE IF EXISTS "public"."enum_tracks_audience";
  DROP TYPE IF EXISTS "public"."enum_tracks_status";
  DROP TYPE IF EXISTS "public"."enum__tracks_v_version_visibility";
  DROP TYPE IF EXISTS "public"."enum__tracks_v_version_audience";
  DROP TYPE IF EXISTS "public"."enum__tracks_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__tracks_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_playlists_visibility";
  DROP TYPE IF EXISTS "public"."enum_playlists_audience";
  DROP TYPE IF EXISTS "public"."enum_playlists_status";
  DROP TYPE IF EXISTS "public"."enum__playlists_v_version_visibility";
  DROP TYPE IF EXISTS "public"."enum__playlists_v_version_audience";
  DROP TYPE IF EXISTS "public"."enum__playlists_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__playlists_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_surf_source";
  DROP TYPE IF EXISTS "public"."enum_surf_audience";
  DROP TYPE IF EXISTS "public"."enum_surf_status";
  DROP TYPE IF EXISTS "public"."enum__surf_v_version_source";
  DROP TYPE IF EXISTS "public"."enum__surf_v_version_audience";
  DROP TYPE IF EXISTS "public"."enum__surf_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__surf_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_responses_status";
  DROP TYPE IF EXISTS "public"."enum__responses_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__responses_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_compilations_visibility";
  DROP TYPE IF EXISTS "public"."enum_commerce_products_currency";
  DROP TYPE IF EXISTS "public"."enum_commerce_orders_currency";
  DROP TYPE IF EXISTS "public"."enum_commerce_orders_payment_method";
  DROP TYPE IF EXISTS "public"."enum_commerce_orders_payment_status";
  DROP TYPE IF EXISTS "public"."enum_commerce_orders_status";
  DROP TYPE IF EXISTS "public"."enum_exports_format";
  DROP TYPE IF EXISTS "public"."enum_exports_sort_order";
  DROP TYPE IF EXISTS "public"."enum_exports_locale";
  DROP TYPE IF EXISTS "public"."enum_exports_drafts";
  DROP TYPE IF EXISTS "public"."enum_imports_import_mode";
  DROP TYPE IF EXISTS "public"."enum_imports_status";
  DROP TYPE IF EXISTS "public"."enum_redirects_to_type";
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_log_state";
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_workflow_slug";
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_task_slug";
  DROP TYPE IF EXISTS "public"."enum_payload_folders_folder_type";
  DROP TYPE IF EXISTS "public"."enum_header_nav_items_link_type";
  DROP TYPE IF EXISTS "public"."enum_header_nav_items_link_appearance";
  DROP TYPE IF EXISTS "public"."enum_footer_nav_items_link_type";
  DROP TYPE IF EXISTS "public"."enum_footer_column1_links_link_type";
  DROP TYPE IF EXISTS "public"."enum_footer_column2_links_link_type";
  DROP TYPE IF EXISTS "public"."enum_footer_column3_links_link_type";`);
}
