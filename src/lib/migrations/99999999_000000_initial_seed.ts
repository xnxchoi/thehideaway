import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * ⚠ AUTO-GENERATED. DO NOT EDIT BY HAND. ⚠
 *
 * Source of truth: `src/seed/initial.ts` (Payload-native).
 * Regenerate via: `pnpm seed:rebuild`.
 *
 * Captured 13 INSERT statements during a clean run
 * of `runInitialSeed`. Each statement is post-processed:
 *   - Bound params inlined as literals.
 *   - RETURNING clauses stripped.
 *   - ON CONFLICT DO NOTHING appended so re-applying against an
 *     already-seeded DB is a no-op.
 *
 * Filename is timestamped `99999999_000000` to pin this migration
 * to run last — seed data depends on every other schema migration
 * having applied.
 *
 * Generated at: 2026-05-14T10:55:32.090Z
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    insert into "users" ("id", "slug", "first_name", "last_name", "verified", "username", "bio", "location", "link", "email", "role", "onboarded", "banned", "two_factor_enabled", "email_verified", "name", "portrait", "onboarding_progress", "image", "created_at", "updated_at", "display_username", "normalized_email", "ban_reason", "ban_expires", "_status") values ('019e2620-9cb5-7106-b94b-51e0d662d681', 'concierge', 'The', 'Concierge', true, 'concierge', 'A member of The Hideaway.', 'Seoul', 'https://thehideaway.com', 'sean.sungyoon.choi@gmail.com', 'admin', true, false, false, true, 'The Concierge', default, default, default, '2026-05-14T19:55:32.027+09:00', '2026-05-14T10:55:32.023Z', default, default, default, default, 'published') ON CONFLICT DO NOTHING;
    insert into "profile" ("id", "author_id", "slug", "title", "hero_title", "hero_subtitle", "hero_gradient1", "hero_gradient2", "locked", "authority", "audience", "updated_at", "created_at", "_status") values ('019e2620-9cca-7295-92c6-cffb11b9abb5', '019e2620-9cb5-7106-b94b-51e0d662d681', 'concierge', '@concierge#1', 'The Concierge', 'The hideaway', '#E74B58', '#F5C78E', false, '0', 'public', '2026-05-14T10:55:32.044Z', '2026-05-14T10:55:32.044Z', 'draft') ON CONFLICT DO NOTHING;
    insert into "profile_slides" ("_order", "_parent_id", "id", "title", "visuals_id", "content") values (1, '019e2620-9cca-7295-92c6-cffb11b9abb5', '019e2620-9cca-7295-92c6-cffc3932bbbc', 'About The', NULL, '{"root":{"type":"root","format":"","indent":0,"direction":"ltr","version":1,"children":[{"type":"paragraph","format":"justify","indent":0,"textStyle":"","textFormat":0,"version":1,"children":[{"mode":"normal","text":"The Concierge is a admin of The Hideaway since May 14, 2026","type":"text","style":"","detail":0,"format":0,"version":1}],"direction":"ltr"}]}}'), (2, '019e2620-9cca-7295-92c6-cffb11b9abb5', '019e2620-9ccb-7acf-9852-e4c24effd2a6', 'The: Archive', NULL, '{"root":{"type":"root","format":"","indent":0,"direction":"ltr","version":1,"children":[{"type":"paragraph","format":"justify","indent":0,"textStyle":"","textFormat":0,"version":1,"children":[{"mode":"normal","text":"The''s writings and creations to this date","type":"text","style":"","detail":0,"format":0,"version":1}],"direction":"ltr"}]}}') ON CONFLICT DO NOTHING;
    insert into "categories" ("id", "title", "description", "slug", "popularity", "identity_accent", "identity_layout", "updated_at", "created_at") values ('019e2620-9cdd-73ac-9d6b-7f0a442f1f71', 'Uncategorized', 'Default bucket for all reflections without a category.', 'uncategorized', '0', 'none', 'left', '2026-05-14T10:55:32.062Z', '2026-05-14T10:55:32.062Z') ON CONFLICT DO NOTHING;
    insert into "currency" ("id", "name", "slug_key", "hash_id", "slug_lock", "slug", "kr_nm", "updated_at", "created_at") values ('019e2620-9ce1-7785-9d31-07fba2b9493e', 'KRW', 'krw', '3K1pTpXZipt', true, 'krw-3K1pTpXZipt', '원', '2026-05-14T10:55:32.066Z', '2026-05-14T10:55:32.066Z') ON CONFLICT DO NOTHING;
    insert into "plans" ("id", "name", "tier", "tier_label", "validity", "type", "description", "seat_limit", "discount_label", "sort", "state", "updated_at", "created_at") values ('019e2620-9ce5-7358-a195-63e06a97c01e', 'Member · Yearly · KRW', 'member', 'Member', 'yearly', 'one_time', 'Pay once. Read everything Member-locked for a year. Stay in for free if your work earns it.', '50', 'LIMITED 50', '10', 'active', '2026-05-14T10:55:32.070Z', '2026-05-14T10:55:32.070Z') ON CONFLICT DO NOTHING;
    insert into "plans_features" ("_order", "_parent_id", "id", "label", "included") values (1, '019e2620-9ce5-7358-a195-63e06a97c01e', '019e2620-9ce5-7358-a195-63e1203ecb20', 'Read all Member-locked essays', true), (2, '019e2620-9ce5-7358-a195-63e06a97c01e', '019e2620-9ce5-7358-a195-63e275772bed', 'Highlight + memo', true), (3, '019e2620-9ce5-7358-a195-63e06a97c01e', '019e2620-9ce5-7358-a195-63e3b500b7b8', 'Comment + bookmark', true), (4, '019e2620-9ce5-7358-a195-63e06a97c01e', '019e2620-9ce5-7358-a195-63e40f3ffc64', 'Renews free if your work earns it', true), (5, '019e2620-9ce5-7358-a195-63e06a97c01e', '019e2620-9ce5-7358-a195-63e508a6b5ac', 'Patron-only drops & events', false) ON CONFLICT DO NOTHING;
    insert into "plans_payment_methods" ("order", "parent_id", "value", "id") values (1, '019e2620-9ce5-7358-a195-63e06a97c01e', 'bank_transfer', default), (2, '019e2620-9ce5-7358-a195-63e06a97c01e', 'cash', default) ON CONFLICT DO NOTHING;
    insert into "prices" ("id", "nickname", "plan_id", "currency_id", "unit_amount", "type", "recurring_interval", "recurring_interval_count", "recurring_trial_period_days", "active", "updated_at", "created_at") values ('019e2620-9ceb-7650-9887-5c5367493745', 'Member · Yearly · KRW · KRW', '019e2620-9ce5-7358-a195-63e06a97c01e', '019e2620-9ce1-7785-9d31-07fba2b9493e', '33000', 'one_time', 'month', '1', '0', true, '2026-05-14T10:55:32.075Z', '2026-05-14T10:55:32.075Z') ON CONFLICT DO NOTHING;
    insert into "plans" ("id", "name", "tier", "tier_label", "validity", "type", "description", "seat_limit", "discount_label", "sort", "state", "updated_at", "created_at") values ('019e2620-9cf1-7d9d-b273-f8a1ba1e793f', 'Patron · Lifetime · KRW', 'patron', 'Patron', 'lifetime', 'one_time', 'Pay once. The door stays open. Founders get drop priority and quarterly print, no expiry.', '5', 'LIMITED 5 · LIFETIME', '20', 'active', '2026-05-14T10:55:32.082Z', '2026-05-14T10:55:32.082Z') ON CONFLICT DO NOTHING;
    insert into "plans_features" ("_order", "_parent_id", "id", "label", "included") values (1, '019e2620-9cf1-7d9d-b273-f8a1ba1e793f', '019e2620-9cf1-7d9d-b273-f8a2e065d156', 'Everything in Member, forever', true), (2, '019e2620-9cf1-7d9d-b273-f8a1ba1e793f', '019e2620-9cf1-7d9d-b273-f8a334824e7e', 'Read all Patron-locked essays', true), (3, '019e2620-9cf1-7d9d-b273-f8a1ba1e793f', '019e2620-9cf1-7d9d-b273-f8a45adc4190', 'Priority access to drops', true), (4, '019e2620-9cf1-7d9d-b273-f8a1ba1e793f', '019e2620-9cf1-7d9d-b273-f8a58636dd67', 'Exclusive event invites', true), (5, '019e2620-9cf1-7d9d-b273-f8a1ba1e793f', '019e2620-9cf1-7d9d-b273-f8a64483490a', 'Patron-only quarterly print', true) ON CONFLICT DO NOTHING;
    insert into "plans_payment_methods" ("order", "parent_id", "value", "id") values (1, '019e2620-9cf1-7d9d-b273-f8a1ba1e793f', 'bank_transfer', default), (2, '019e2620-9cf1-7d9d-b273-f8a1ba1e793f', 'cash', default) ON CONFLICT DO NOTHING;
    insert into "prices" ("id", "nickname", "plan_id", "currency_id", "unit_amount", "type", "recurring_interval", "recurring_interval_count", "recurring_trial_period_days", "active", "updated_at", "created_at") values ('019e2620-9cf6-71ec-a5b0-ecf60c9795fa', 'Patron · Lifetime · KRW · KRW', '019e2620-9cf1-7d9d-b273-f8a1ba1e793f', '019e2620-9ce1-7785-9d31-07fba2b9493e', '390000', 'one_time', 'month', '1', '0', true, '2026-05-14T10:55:32.087Z', '2026-05-14T10:55:32.086Z') ON CONFLICT DO NOTHING;
  `);
}

export async function down({ db: _db }: MigrateDownArgs): Promise<void> {
  // Down is a no-op. Seed rows are removed by truncating the
  // affected tables — that's a destructive operation that should
  // never run automatically. If you need to clear seeds, run
  // `pnpm migrate:fresh` or DELETE the rows manually.
}
