# Database Migrations Policy

This document is the canonical reference for how SQL migrations are written, generated, edited, and applied in this project. Every contributor (human or agent) must follow it.

> See also: the `Database & Migrations` section in [`CLAUDE.md`](../CLAUDE.md) for the high-level overview.

---

## Two Load-Bearing Rules

### Rule 1 — Backward compatibility is **not** a factor

The DB is wipeable. Migrations may be applied liberally; no preservation work is required for data shape, no parallel-shadow tables, no soft-deprecation aliases. If a redesign is correct, the migration ships and the old shape goes away.

### Rule 2 — Every migration must be re-runnable

Even though backward compatibility is irrelevant, migrations *do* fail in predictable ways during dev, and unguarded statements turn a one-line fix into a manual recovery. Every CREATE / DROP / ALTER / UPDATE must be wrapped with appropriate existence safeguards.

The four failure modes:

1. Dropping something that does not exist
2. Dropping something referenced as a foreign key / constraint from another table
3. Creating something that already exists
4. Updating something that does not exist

This applies at every level of the schema: tables, columns, indices, compound indices, sequences, enums, constraints, foreign keys, triggers, functions, custom types.

---

## Procedure

### Step 1 — Define the schema through Payload, then generate

The default and required path is Payload-native:

**A. Payload-native (`pnpm micreate`)**

1. Define the schema in collection, global, field, or plugin config and register it through `src/payload.config.ts`.
2. Run `pnpm micreate` so Payload generates the migration from the config diff.
3. Review the generated TypeScript migration. Edit it only for the mandatory safeguards in Step 2 or a documented
   generator limitation.
4. Run `pnpm generate:schema` and `pnpm generate:types`.
5. Review the regenerated schema and type artifacts, but never hand-edit `src/payload-generated-schema.ts` or
   `src/types/payload-types.ts`.
6. Integrate pre- or post-migration behavior through Payload hooks or plugin lifecycle where possible.
7. Then proceed to Step 2.

**B. Exceptional hand-written operation**

Do not create a migration file manually when a collection/global/field/plugin config change can generate the intended
shape. A manual operation is allowed only when Payload cannot express it, such as a partial index, functional index,
sequence, bulk data backfill, or cleanup of orphaned relationship rows.

1. Generate the surrounding Payload schema migration first when applicable.
2. Document the exact generator limitation with `WHY-OVERRIDE-PAYLOAD` in the config and migration.
3. Add only the unsupported operation to the generated migration, with the safeguards from Step 2.
4. If no Payload schema change exists, document why a standalone hand-written migration is unavoidable before creating
   it.

### Step 2 — Add safeguards to every operation

Every statement in `up()` and `down()` must use the appropriate guard for its entity type:

| Operation | Inline-guarded form | Postgres supports? |
|-----------|---------------------|--------------------|
| `CREATE TABLE` | `CREATE TABLE IF NOT EXISTS` | Yes |
| `DROP TABLE` | `DROP TABLE IF EXISTS` | Yes |
| `CREATE INDEX` | `CREATE INDEX IF NOT EXISTS` | Yes |
| `DROP INDEX` | `DROP INDEX IF EXISTS` | Yes |
| `CREATE SEQUENCE` | `CREATE SEQUENCE IF NOT EXISTS` | Yes |
| `DROP SEQUENCE` | `DROP SEQUENCE IF EXISTS` | Yes |
| `CREATE TYPE` / enum | `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object ...` | No inline form |
| `DROP TYPE` | `DROP TYPE IF EXISTS` | Yes |
| `ADD COLUMN` | `ADD COLUMN IF NOT EXISTS` | Yes |
| `DROP COLUMN` | `DROP COLUMN IF EXISTS` | Yes |
| `ADD CONSTRAINT` | `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint ...) THEN ...` | No inline form |
| `DROP CONSTRAINT` | `DROP CONSTRAINT IF EXISTS` | Yes |
| `ALTER COLUMN TYPE` | Wrap in `DO $$` block that checks `information_schema.columns` | No inline form |

### Step 3 — Handle FK-blocked drops explicitly

When dropping a column or table that another table references via FK:

1. `DROP CONSTRAINT IF EXISTS <child_fk_name>` on the dependent table — first.
2. *Then* `DROP COLUMN IF EXISTS` / `DROP TABLE IF EXISTS` on the target.
3. Optionally, for table drops where many constraints may dangle, append `CASCADE` to the `DROP TABLE` — but prefer explicit constraint drops where the FK names are known.

### Step 4 — Provide a safeguarded `down()`

The reverse migration follows the same rules. `down()` is rarely run in production but is run constantly in dev resets — if it can't survive a re-apply, it can't survive `pnpm migrate:fresh`.

---

## Examples

### Hand-written migration — minimal template

```ts
import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "example" (
      "id" uuid PRIMARY KEY,
      "name" text NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "example_name_idx" ON "example" ("name");

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'example_name_uniq'
      ) THEN
        ALTER TABLE "example" ADD CONSTRAINT "example_name_uniq" UNIQUE ("name");
      END IF;
    END $$;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "example" DROP CONSTRAINT IF EXISTS "example_name_uniq";
    DROP INDEX IF EXISTS "example_name_idx";
    DROP TABLE IF EXISTS "example";
  `);
}
```

### FK-blocked drop pattern

```ts
await db.execute(sql`
  -- Drop dependent FK first
  ALTER TABLE "plans"
    DROP CONSTRAINT IF EXISTS "plans_compare_at_id_prices_id_fk";

  -- Then drop the column it pointed at
  ALTER TABLE "plans" DROP COLUMN IF EXISTS "compare_at_id";

  -- Then drop the target table
  DROP TABLE IF EXISTS "prices_currencies";
  DROP TABLE IF EXISTS "prices";
`);
```

### Enum (no inline `IF NOT EXISTS`)

```ts
await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "invoice_status" AS ENUM ('paid', 'pending', 'void');
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$;
`);
```

---

## Payload-Mirroring Principle

This is the **hidden mission-critical factor** that governs every schema decision.

> When writing any code that touches DB schema, naming conventions, or CRUD semantics — replicate PayloadCMS's own setup as closely as possible. Mirror even Payload's bugs, flaws, and quirks. Only override when the site is literally inoperable otherwise.

**Why:** Payload bugs are widely shared across the user base; the Payload core team fixes them, and the fix arrives for free on the next upgrade. Proprietary divergence does not get that benefit — it becomes load-bearing local code that this codebase maintains forever, and every Payload upgrade has to manually reconcile each divergence. Opportunity cost is therefore far higher for proprietary fixes.

### Practical conventions to mirror

From `src/payload-generated-schema.ts` and existing migrations:

| Concept | Payload pattern | Use this |
|---------|-----------------|----------|
| Singular relationship | Column `<field>_id uuid` with FK to `<target>(id)` | Yes |
| HasMany relationship | Row in `<collection>_rels` with `path text`, `<target>_id` | Yes |
| Array field | Child table `<collection>_<field>` with `_parent_id uuid`, `_order integer` | Yes |
| Locked-document tracking | `payload_locked_documents_rels.<collection>_id` per collection | Yes |
| Created/updated timestamps | `created_at`, `updated_at` columns + indices | Yes |
| Soft-delete (if any) | Match Payload's drafts/versions table shape | Yes |
| ID type | `uuid` (v7 via `uuidv7` package) | Yes |

### When you see something that looks wrong in Payload's output

1. Document the observation (in this readme, or in a `// WHY-PAYLOAD:` comment).
2. **Mirror it unless doing so violates this project's migration safety rules.** Idempotency and existence-guard
   corrections from Step 2 are mandatory even when Payload generated the unsafe statement. Otherwise, do not fix a
   Payload quirk unless it blocks shipping.
3. If you must override, flag with a `// WHY-OVERRIDE-PAYLOAD:` comment in both the collection config and the migration, explaining what specifically broke.

### When Payload-native and raw-SQL both achieve the same outcome

Always prefer the Payload field config. If the generator is later re-run, the regeneration will produce the correct shape — divergent SQL won't.

---

## Preference Order for Any Change

1. **Payload field/collection config** — first choice. Hooks, plugins, virtual fields, access rules, custom field components.
2. **Payload `req.payload.*` API calls** — `find`, `create`, `update`, `delete`. Honors access rules and lifecycle hooks.
3. **Drizzle queries** — second choice. Use when Payload's API is missing the operation or insufficient for performance.
4. **Raw SQL in generated migrations** — last resort, only when Payload cannot express the operation:
   - Column-type changes
   - Sequences
   - Partial / functional indices
   - Bulk data backfills
   - Cleanup of orphaned `_rels` rows that Payload's generator can't express

---

## Seeding mechanics

Boot-time data (the concierge admin, the "uncategorized" Category, default tags, the KRW Currency, the launch Plans + Prices, etc.) does **not** live in `payload.config.ts:onInit`. That pattern deadlocks: while Payload is initializing, slug / handle field hooks call `getPayload()` for uniqueness checks, get the still-initializing instance back, and the await never resolves. See [payload#8852](https://github.com/payloadcms/payload/issues/8852) — Payload closed it as "not planned." The local codebase comment that explains why `seedButler` is wrapped in `setTimeout(0, …)` flags the same hazard.

The seeding pipeline:

```
src/seed/initial.ts                       ← Source of truth. Payload-native.
        │                                   You read + edit this.
        │
        ▼  pnpm seed:rebuild
src/scripts/seedToMigration.ts            ← Generator.
        │                                   - Deletes the prior seed migration file.
        │                                   - Runs `payload migrate:fresh`.
        │                                   - Boots Payload with SEED_CAPTURE=1.
        │                                   - Runs runInitialSeed; the Drizzle
        │                                     logger records every issued INSERT.
        │                                   - Inlines bound params, strips
        │                                     RETURNING clauses, appends
        │                                     `ON CONFLICT DO NOTHING`.
        │                                   - Writes the compiled SQL to:
        ▼
src/lib/migrations/99999999_000000_initial_seed.ts
                                          ← Build artifact. Regenerated wholesale
                                            on every `pnpm seed:rebuild`. Header
                                            says DO NOT EDIT.
```

**Why two artifacts.** The Payload-native source stays editable and human-legible. The generated SQL is the canonical execution path: fast, deadlock-free, idempotent, and runnable from any context (prod boot, CI, ad-hoc migrate). Editing the SQL migration directly is wrong — regenerate from the source.

**When to run `pnpm seed:rebuild`:**

- After editing `src/seed/initial.ts` (adding a tag, changing a Plan, etc.).
- After a Payload upgrade (Payload's internal write shape may shift; regenerating picks up the new shape).
- After a schema migration that affects a seeded collection.

**Filename / ordering:** the seed migration is pinned to `99999999_000000_initial_seed` so it always runs last — every other schema migration must be applied before seed rows reference them.

**Idempotency:** every INSERT in the generated migration carries `ON CONFLICT DO NOTHING`. Re-applying the migration against an already-seeded DB is a no-op data-wise.

**When NOT to use this for seeding:**

- Per-user / per-tenant fixtures — use a runtime hook or a one-off script, not the boot seed.
- Dev-only fixtures that depend on env vars (`DEV_BUTLER_PASSWORD` etc.) — keep them in `src/lib/auth/dev/seed*` and let `payload.config.ts:onInit` fire them via the `setTimeout(0, …)` shim. They're env-conditional and have no place in a production-bound migration.
- Anything that mutates rows across re-runs — `ON CONFLICT DO NOTHING` only handles "create if missing," not upsert semantics.

---

## Checklist Before Committing a Migration

- [ ] The schema change was defined through Payload config first and generated with `pnpm micreate`.
- [ ] No migration was authored manually when Payload could generate the same shape.
- [ ] Any manual SQL has a documented generator limitation and `WHY-OVERRIDE-PAYLOAD` where applicable.
- [ ] File name matches `YYYYMMDD_HHMMSS_label.ts` and is included in `src/lib/migrations/index.ts`.
- [ ] Every `CREATE` has `IF NOT EXISTS` (or `DO $$` for enums / constraints).
- [ ] Every `DROP` has `IF EXISTS`.
- [ ] Every `ADD COLUMN` has `IF NOT EXISTS`.
- [ ] Every `DROP COLUMN` has `IF EXISTS`, and any FK referencing it is dropped first.
- [ ] Every constraint add is wrapped in `DO $$ ... IF NOT EXISTS (SELECT 1 FROM pg_constraint ...) ...`.
- [ ] `down()` mirrors the safeguard pattern and is fully reversible (or documents what's lost).
- [ ] Schema choices mirror Payload's generated shape; any deviation has a `WHY-OVERRIDE-PAYLOAD:` comment.
- [ ] `pnpm generate:types` has been re-run if the migration changed a Payload-tracked shape.
- [ ] Smoke-tested locally with `pnpm migrate:fresh` followed by `pnpm migrate`.
