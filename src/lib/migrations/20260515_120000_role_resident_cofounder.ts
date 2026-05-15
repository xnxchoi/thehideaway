import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Track A — Role rename + Cofounder tier + presentation removal.
 *
 * - Renames role enum value `member` → `resident` on three Postgres
 *   enums: enum_users_role (column users.role), enum__users_v_version_role
 *   (column _users_v.version_role), enum_admin_invitations_role (column
 *   admin_invitations.role).
 * - Adds enum value `cofounder` to all three role enums.
 * - Renames Plans tier enum value `member` → `resident` on enum_plans_tier;
 *   adds enum value `cofounder`. Resets the column default through the
 *   rename so the new default is `'resident'`.
 * - Drops the unused `presentation` column on `plans` and the now-orphaned
 *   `enum_plans_presentation` type.
 *
 * Backward compatibility is not a factor (DB is wipeable). All operations
 * are idempotent per readmes/MIGRATIONS.md. The rename is wrapped in a
 * pg_enum-existence check so a re-run is a no-op.
 *
 * Postgres caveat: ALTER TYPE ... ADD VALUE cannot run inside a transaction
 * block in Postgres < 12. Payload's migrator uses one transaction per
 * migration file, so this migration relies on Postgres ≥ 12 where ADD VALUE
 * is transaction-safe. Project deployment is on Postgres 16; this is fine.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ── Phase 1: Drop column defaults that reference the value being renamed ──
    ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
    ALTER TABLE "_users_v" ALTER COLUMN "version_role" DROP DEFAULT;
    ALTER TABLE "admin_invitations" ALTER COLUMN "role" DROP DEFAULT;
    ALTER TABLE "plans" ALTER COLUMN "tier" DROP DEFAULT;

    -- ── Phase 2: Rename 'member' to 'resident' on all four enums ────────────
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'member'
          AND enumtypid = '"enum_users_role"'::regtype
      ) THEN
        ALTER TYPE "enum_users_role" RENAME VALUE 'member' TO 'resident';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'member'
          AND enumtypid = '"enum__users_v_version_role"'::regtype
      ) THEN
        ALTER TYPE "enum__users_v_version_role" RENAME VALUE 'member' TO 'resident';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'member'
          AND enumtypid = '"enum_admin_invitations_role"'::regtype
      ) THEN
        ALTER TYPE "enum_admin_invitations_role" RENAME VALUE 'member' TO 'resident';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'member'
          AND enumtypid = '"enum_plans_tier"'::regtype
      ) THEN
        ALTER TYPE "enum_plans_tier" RENAME VALUE 'member' TO 'resident';
      END IF;
    END $$;

    -- ── Phase 3: Add 'cofounder' to all four enums ──────────────────────────
    ALTER TYPE "enum_users_role"             ADD VALUE IF NOT EXISTS 'cofounder';
    ALTER TYPE "enum__users_v_version_role"  ADD VALUE IF NOT EXISTS 'cofounder';
    ALTER TYPE "enum_admin_invitations_role" ADD VALUE IF NOT EXISTS 'cofounder';
    ALTER TYPE "enum_plans_tier"             ADD VALUE IF NOT EXISTS 'cofounder';

    -- ── Phase 4: Restore column defaults ─────────────────────────────────────
    ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'::"enum_users_role";
    ALTER TABLE "_users_v" ALTER COLUMN "version_role" SET DEFAULT 'user'::"enum__users_v_version_role";
    ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DEFAULT 'admin'::"enum_admin_invitations_role";
    ALTER TABLE "plans" ALTER COLUMN "tier" SET DEFAULT 'resident'::"enum_plans_tier";

    -- ── Phase 5: Drop the presentation column and its enum ──────────────────
    ALTER TABLE "plans" DROP COLUMN IF EXISTS "presentation";
    DROP TYPE IF EXISTS "enum_plans_presentation";
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Recreate presentation enum + column
    DO $$ BEGIN
      CREATE TYPE "enum_plans_presentation" AS ENUM ('standard', 'founder');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
    ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "presentation"
      "enum_plans_presentation" DEFAULT 'standard' NOT NULL;

    -- Reverse rename: resident → member. Cofounder remains as a benign enum
    -- artifact; Postgres does not support DROP VALUE on an enum without a
    -- column-rebuild dance, and Rule 1 of MIGRATIONS.md says backward-compat
    -- is not a factor — the down() is for migrate:fresh resets, not prod
    -- rollback, so leaving cofounder in the enum is acceptable.
    ALTER TABLE "plans" ALTER COLUMN "tier" DROP DEFAULT;
    ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
    ALTER TABLE "_users_v" ALTER COLUMN "version_role" DROP DEFAULT;
    ALTER TABLE "admin_invitations" ALTER COLUMN "role" DROP DEFAULT;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'resident' AND enumtypid = '"enum_users_role"'::regtype) THEN
        ALTER TYPE "enum_users_role" RENAME VALUE 'resident' TO 'member';
      END IF;
    END $$;
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'resident' AND enumtypid = '"enum__users_v_version_role"'::regtype) THEN
        ALTER TYPE "enum__users_v_version_role" RENAME VALUE 'resident' TO 'member';
      END IF;
    END $$;
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'resident' AND enumtypid = '"enum_admin_invitations_role"'::regtype) THEN
        ALTER TYPE "enum_admin_invitations_role" RENAME VALUE 'resident' TO 'member';
      END IF;
    END $$;
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'resident' AND enumtypid = '"enum_plans_tier"'::regtype) THEN
        ALTER TYPE "enum_plans_tier" RENAME VALUE 'resident' TO 'member';
      END IF;
    END $$;

    ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'::"enum_users_role";
    ALTER TABLE "_users_v" ALTER COLUMN "version_role" SET DEFAULT 'user'::"enum__users_v_version_role";
    ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DEFAULT 'admin'::"enum_admin_invitations_role";
    ALTER TABLE "plans" ALTER COLUMN "tier" SET DEFAULT 'member'::"enum_plans_tier";
  `);
}
