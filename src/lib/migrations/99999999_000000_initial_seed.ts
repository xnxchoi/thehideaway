import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * ⚠ AUTO-GENERATED. DO NOT EDIT BY HAND. ⚠
 *
 * Source of truth: `src/seed/initial.ts` (Payload-native).
 * Regenerate via: `pnpm seed:rebuild`.
 *
 * Captured 35 INSERT statements during a clean run
 * of `runInitialSeed`. Each statement is post-processed:
 *   - Bound params inlined as literals.
 *   - RETURNING clauses stripped.
 *   - ON CONFLICT (id) DO NOTHING appended so re-applying against an
 *     already-seeded DB is a no-op.
 *
 * Filename is timestamped `99999999_000000` to pin this migration
 * to run last — seed data depends on every other schema migration
 * having applied.
 *
 * Generated at: 2026-05-15T02:27:11.557Z
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Guard: Payload's onInit hook may create a concierge user before this
  // migration runs, using a Payload-generated UUID that differs from the
  // hardcoded seed UUID. If left in place, the bare ON CONFLICT DO NOTHING
  // on the users INSERT silently skips, leaving profile.author_id pointing
  // at a UUID that doesn't exist → FK violation.
  //
  // All FK columns that reference users.id use ON DELETE SET NULL, so
  // deleting the conflicting row is safe on a fresh database — no cascade
  // deletes, no orphan errors.
  await db.execute(sql`
    DO $$
    BEGIN
      -- Idempotent: seed UUID already present → nothing to do.
      IF EXISTS (
        SELECT 1 FROM "users"
        WHERE "id" = '019e2975-91a7-722c-9923-1a8f82574aab'
      ) THEN
        RETURN;
      END IF;

      -- Remove any concierge user created by Payload onInit with a
      -- different UUID so the seed INSERT below succeeds on conflict (id).
      DELETE FROM "users"
      WHERE ("email" = 'sean.sungyoon.choi@gmail.com' OR "username" = 'concierge')
        AND "id" <> '019e2975-91a7-722c-9923-1a8f82574aab';
    END;
    $$;
  `);

  await db.execute(sql`
    insert into "users" ("id", "slug", "first_name", "last_name", "verified", "username", "bio", "location", "link", "email", "role", "onboarded", "banned", "two_factor_enabled", "email_verified", "name", "portrait", "onboarding_progress", "image", "created_at", "updated_at", "display_username", "normalized_email", "ban_reason", "ban_expires", "_status") values ('019e2975-91a7-722c-9923-1a8f82574aab', 'concierge', 'The', 'Concierge', true, 'concierge', 'A member of The Hideaway.', 'Seoul', 'https://thehideaway.com', 'sean.sungyoon.choi@gmail.com', 'admin', true, false, false, true, 'The Concierge', default, default, default, '2026-05-15T11:27:11.410+09:00', '2026-05-15T02:27:11.401Z', default, default, default, default, 'published') ON CONFLICT (id) DO NOTHING;
    insert into "profile" ("id", "author_id", "slug", "title", "hero_title", "hero_subtitle", "hero_gradient1", "hero_gradient2", "locked", "authority", "audience", "updated_at", "created_at", "_status") values ('019e2975-91c5-7c51-937f-4c9d5876a86e', '019e2975-91a7-722c-9923-1a8f82574aab', 'concierge', '@concierge#1', 'The Concierge', 'The hideaway', '#d40000', '#9aa989', false, '0', 'public', '2026-05-15T02:27:11.432Z', '2026-05-15T02:27:11.432Z', 'draft') ON CONFLICT (id) DO NOTHING;
    insert into "profile_slides" ("_order", "_parent_id", "id", "title", "visuals_id", "content") values (1, '019e2975-91c5-7c51-937f-4c9d5876a86e', '019e2975-91c5-7c51-937f-4c9ec329dcb4', 'About The', NULL, '{"root":{"type":"root","format":"","indent":0,"direction":"ltr","version":1,"children":[{"type":"paragraph","format":"justify","indent":0,"textStyle":"","textFormat":0,"version":1,"children":[{"mode":"normal","text":"The Concierge is a admin of The Hideaway since May 15, 2026","type":"text","style":"","detail":0,"format":0,"version":1}],"direction":"ltr"}]}}'), (2, '019e2975-91c5-7c51-937f-4c9d5876a86e', '019e2975-91c6-796f-b96b-723bc31856f2', 'The: Archive', NULL, '{"root":{"type":"root","format":"","indent":0,"direction":"ltr","version":1,"children":[{"type":"paragraph","format":"justify","indent":0,"textStyle":"","textFormat":0,"version":1,"children":[{"mode":"normal","text":"The''s writings and creations to this date","type":"text","style":"","detail":0,"format":0,"version":1}],"direction":"ltr"}]}}') ON CONFLICT (id) DO NOTHING;
    insert into "categories" ("id", "title", "description", "slug", "popularity", "identity_accent", "identity_layout", "updated_at", "created_at") values ('019e2975-91dd-770f-bd8f-fa0fc9de4871', 'Uncategorized', 'Default bucket for all reflections without a category.', 'uncategorized', '0', 'none', 'left', '2026-05-15T02:27:11.454Z', '2026-05-15T02:27:11.454Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-91e2-7338-8d34-628b4b60f93b', 'Life', '019e2975-91a7-722c-9923-1a8f82574aab', 'life', 'SQlF0xXUbOk', true, 'life', '0', '2026-05-15T02:27:11.459Z', '2026-05-15T02:27:11.459Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-91e9-7257-bf94-051bf1b6a0b1', 'Startup', '019e2975-91a7-722c-9923-1a8f82574aab', 'startup', 'UTCfp17-HDV', true, 'startup', '0', '2026-05-15T02:27:11.465Z', '2026-05-15T02:27:11.465Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-91ed-7946-8b15-a1aba3400da6', 'Blockchain', '019e2975-91a7-722c-9923-1a8f82574aab', 'blockchain', 'GaMrEKTB66o', true, 'blockchain', '0', '2026-05-15T02:27:11.469Z', '2026-05-15T02:27:11.469Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-91f1-71ce-90da-022f3a1ae130', 'Poetry', '019e2975-91a7-722c-9923-1a8f82574aab', 'poetry', 'BJRwodjzw69', true, 'poetry', '0', '2026-05-15T02:27:11.473Z', '2026-05-15T02:27:11.473Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-91f5-7697-8b9f-cb651fed5d24', 'Life Lessons', '019e2975-91a7-722c-9923-1a8f82574aab', 'life-lessons', 'cY8njGpzoUC', true, 'life-lessons', '0', '2026-05-15T02:27:11.477Z', '2026-05-15T02:27:11.477Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-91f9-73bd-9302-4dc1cd30a02a', 'Politics', '019e2975-91a7-722c-9923-1a8f82574aab', 'politics', 'yXBltoINj6g', true, 'politics', '0', '2026-05-15T02:27:11.481Z', '2026-05-15T02:27:11.481Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-91fe-74e3-9ea0-af557e4a192a', 'Health', '019e2975-91a7-722c-9923-1a8f82574aab', 'health', 'Jn87OHysA3-', true, 'health', '0', '2026-05-15T02:27:11.486Z', '2026-05-15T02:27:11.486Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-9201-7440-bbbe-bf2f6e31bdc8', 'Love', '019e2975-91a7-722c-9923-1a8f82574aab', 'love', 'LYzvNtJjlBf', true, 'love', '0', '2026-05-15T02:27:11.489Z', '2026-05-15T02:27:11.489Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-9204-73d1-8962-5cc13eca6617', 'Travel', '019e2975-91a7-722c-9923-1a8f82574aab', 'travel', 'OTt737wEBwJ', true, 'travel', '0', '2026-05-15T02:27:11.492Z', '2026-05-15T02:27:11.492Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-9208-7bd6-8df6-cba76774c216', 'Technology', '019e2975-91a7-722c-9923-1a8f82574aab', 'technology', 'eY-B-VDq0cP', true, 'technology', '0', '2026-05-15T02:27:11.496Z', '2026-05-15T02:27:11.496Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-920b-7786-b818-f80cdc01276c', 'Entrepreneurship', '019e2975-91a7-722c-9923-1a8f82574aab', 'entrepreneurship', '7NJJZlufjWg', true, 'entrepreneurship', '0', '2026-05-15T02:27:11.499Z', '2026-05-15T02:27:11.499Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-920d-7569-88c8-df681c66a486', 'Self Improvement', '019e2975-91a7-722c-9923-1a8f82574aab', 'self-improvement', 'nZMwefaFC3_', true, 'self-improvement', '0', '2026-05-15T02:27:11.502Z', '2026-05-15T02:27:11.502Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-9210-7446-9da0-83b2315405b5', 'Education', '019e2975-91a7-722c-9923-1a8f82574aab', 'education', 'w9JTse0JBUO', true, 'education', '0', '2026-05-15T02:27:11.504Z', '2026-05-15T02:27:11.504Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-9213-7a5d-96db-17cc44bb65b8', 'Writing', '019e2975-91a7-722c-9923-1a8f82574aab', 'writing', 'eqJNPDnWRqJ', true, 'writing', '0', '2026-05-15T02:27:11.507Z', '2026-05-15T02:27:11.507Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-9216-7dd7-8413-1e2d760ea8c8', 'Business', '019e2975-91a7-722c-9923-1a8f82574aab', 'business', 'i3-EmYNgwTh', true, 'business', '0', '2026-05-15T02:27:11.510Z', '2026-05-15T02:27:11.510Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-9219-730e-8c9d-f2d4175d6b0a', 'Cryptocurrency', '019e2975-91a7-722c-9923-1a8f82574aab', 'cryptocurrency', 'UfJPMZncIMK', true, 'cryptocurrency', '0', '2026-05-15T02:27:11.513Z', '2026-05-15T02:27:11.513Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-921b-70c9-8dd9-e210c75a046f', 'Bitcoin', '019e2975-91a7-722c-9923-1a8f82574aab', 'bitcoin', '3jF_rG0yS9F', true, 'bitcoin', '0', '2026-05-15T02:27:11.516Z', '2026-05-15T02:27:11.516Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-921f-7e3a-b89f-f1f03f8b789a', 'Design', '019e2975-91a7-722c-9923-1a8f82574aab', 'design', '3A8T1qwBIDQ', true, 'design', '0', '2026-05-15T02:27:11.519Z', '2026-05-15T02:27:11.519Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-9222-7039-8221-651a5df93077', 'Social Media', '019e2975-91a7-722c-9923-1a8f82574aab', 'social-media', 'qKeXvGv5KxE', true, 'social-media', '0', '2026-05-15T02:27:11.522Z', '2026-05-15T02:27:11.522Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-9225-7025-8c61-4d9f6bea3b9c', 'Music', '019e2975-91a7-722c-9923-1a8f82574aab', 'music', 'KLjoptmvcz6', true, 'music', '0', '2026-05-15T02:27:11.525Z', '2026-05-15T02:27:11.525Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-9227-7afa-8862-11c79d3b36c7', 'Relationships', '019e2975-91a7-722c-9923-1a8f82574aab', 'relationships', 'Kv7cvWQFX5Z', true, 'relationships', '0', '2026-05-15T02:27:11.527Z', '2026-05-15T02:27:11.527Z') ON CONFLICT (id) DO NOTHING;
    insert into "tags" ("id", "title", "author_id", "slug_key", "hash_id", "slug_lock", "slug", "tag_count", "updated_at", "created_at") values ('019e2975-922a-7267-a18d-de8c5cec93dc', 'Sports', '019e2975-91a7-722c-9923-1a8f82574aab', 'sports', 'Bs6TeqeSDti', true, 'sports', '0', '2026-05-15T02:27:11.530Z', '2026-05-15T02:27:11.530Z') ON CONFLICT (id) DO NOTHING;
    insert into "currency" ("id", "name", "slug_key", "hash_id", "slug_lock", "slug", "kr_nm", "updated_at", "created_at") values ('019e2975-922d-7cf4-87ca-ceba557d821d', 'KRW', 'krw', 'c0VMNtZOgbJ', true, 'krw-c0VMNtZOgbJ', '원', '2026-05-15T02:27:11.534Z', '2026-05-15T02:27:11.534Z') ON CONFLICT (id) DO NOTHING;
    insert into "plans" ("id", "name", "tier", "tier_label", "validity", "type", "description", "seat_limit", "discount_label", "sort", "state", "updated_at", "created_at") values ('019e2975-9231-7bf3-b739-7c86e8d06573', 'Resident · Yearly · KRW', 'resident', 'Resident', 'yearly', 'one_time', 'Pay once. Read everything Resident-locked for a year. Stay in for free if your work earns it.', '50', 'LIMITED 50', '10', 'active', '2026-05-15T02:27:11.538Z', '2026-05-15T02:27:11.538Z') ON CONFLICT (id) DO NOTHING;
    insert into "plans_features" ("_order", "_parent_id", "id", "label", "included") values (1, '019e2975-9231-7bf3-b739-7c86e8d06573', '019e2975-9231-7bf3-b739-7c874397ee1e', 'Read all Resident-locked essays', true), (2, '019e2975-9231-7bf3-b739-7c86e8d06573', '019e2975-9231-7bf3-b739-7c8809c40097', 'Highlight + memo', true), (3, '019e2975-9231-7bf3-b739-7c86e8d06573', '019e2975-9231-7bf3-b739-7c89408b18ab', 'Comment + bookmark', true), (4, '019e2975-9231-7bf3-b739-7c86e8d06573', '019e2975-9231-7bf3-b739-7c8aa0b6db07', 'Renews free if your work earns it', true), (5, '019e2975-9231-7bf3-b739-7c86e8d06573', '019e2975-9231-7bf3-b739-7c8b234297b7', 'Patron-only drops & events', false) ON CONFLICT (id) DO NOTHING;
    insert into "plans_payment_methods" ("order", "parent_id", "value", "id") values (1, '019e2975-9231-7bf3-b739-7c86e8d06573', 'bank_transfer', default), (2, '019e2975-9231-7bf3-b739-7c86e8d06573', 'cash', default) ON CONFLICT DO NOTHING;
    insert into "prices" ("id", "nickname", "plan_id", "currency_id", "unit_amount", "type", "recurring_interval", "recurring_interval_count", "recurring_trial_period_days", "active", "updated_at", "created_at") values ('019e2975-9237-757e-8f65-e40b009559f1', 'Resident · Yearly · KRW · KRW', '019e2975-9231-7bf3-b739-7c86e8d06573', '019e2975-922d-7cf4-87ca-ceba557d821d', '33000', 'one_time', 'month', '1', '0', true, '2026-05-15T02:27:11.544Z', '2026-05-15T02:27:11.544Z') ON CONFLICT (id) DO NOTHING;
    insert into "plans" ("id", "name", "tier", "tier_label", "validity", "type", "description", "seat_limit", "discount_label", "sort", "state", "updated_at", "created_at") values ('019e2975-923c-7755-bb8a-4ac717b94ff9', 'Patron · Lifetime · KRW', 'patron', 'Patron', 'lifetime', 'one_time', 'Pay once. The door stays open. Founders get drop priority and quarterly print, no expiry.', '5', 'LIMITED 5 · LIFETIME', '20', 'active', '2026-05-15T02:27:11.549Z', '2026-05-15T02:27:11.548Z') ON CONFLICT (id) DO NOTHING;
    insert into "plans_features" ("_order", "_parent_id", "id", "label", "included") values (1, '019e2975-923c-7755-bb8a-4ac717b94ff9', '019e2975-923c-7755-bb8a-4ac8f5883ee8', 'Everything in Resident, forever', true), (2, '019e2975-923c-7755-bb8a-4ac717b94ff9', '019e2975-923c-7755-bb8a-4ac9e9a367ad', 'Read all Patron-locked essays', true), (3, '019e2975-923c-7755-bb8a-4ac717b94ff9', '019e2975-923c-7755-bb8a-4aca3e83d70d', 'Priority access to drops', true), (4, '019e2975-923c-7755-bb8a-4ac717b94ff9', '019e2975-923c-7755-bb8a-4acb6aa2f118', 'Exclusive event invites', true), (5, '019e2975-923c-7755-bb8a-4ac717b94ff9', '019e2975-923c-7755-bb8a-4acc0d4a0010', 'Patron-only quarterly print', true) ON CONFLICT (id) DO NOTHING;
    insert into "plans_payment_methods" ("order", "parent_id", "value", "id") values (1, '019e2975-923c-7755-bb8a-4ac717b94ff9', 'bank_transfer', default), (2, '019e2975-923c-7755-bb8a-4ac717b94ff9', 'cash', default) ON CONFLICT DO NOTHING;
    insert into "prices" ("id", "nickname", "plan_id", "currency_id", "unit_amount", "type", "recurring_interval", "recurring_interval_count", "recurring_trial_period_days", "active", "updated_at", "created_at") values ('019e2975-9240-77d5-b4b5-bb46deaf4080', 'Patron · Lifetime · KRW · KRW', '019e2975-923c-7755-bb8a-4ac717b94ff9', '019e2975-922d-7cf4-87ca-ceba557d821d', '390000', 'one_time', 'month', '1', '0', true, '2026-05-15T02:27:11.553Z', '2026-05-15T02:27:11.553Z') ON CONFLICT (id) DO NOTHING;
  `);
}

export async function down({ db: _db }: MigrateDownArgs): Promise<void> {
  // Down is a no-op. Seed rows are removed by truncating the
  // affected tables — that's a destructive operation that should
  // never run automatically. If you need to clear seeds, run
  // `pnpm migrate:fresh` or DELETE the rows manually.
}
