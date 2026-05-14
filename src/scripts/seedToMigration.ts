/**
 * seedToMigration — compiles `src/seed/initial.ts` into a SQL migration.
 *
 * Pipeline (single command, `pnpm seed:rebuild`):
 *   1. Delete any existing `99999999_000000_initial_seed.ts` and
 *      unregister it from `lib/migrations/index.ts`. We need a
 *      schema-only DB before capturing fresh seed writes.
 *   2. Spawn `payload migrate:fresh` (with `y\n` piped to its
 *      confirmation prompt). DB ends up with full schema, zero seed.
 *   3. Set SEED_CAPTURE=1 so payload.config.ts installs the Drizzle
 *      logger that pushes every issued statement into
 *      globalThis.__SEED_CAPTURE__.
 *   4. Boot Payload (its onInit is now seed-free).
 *   5. Run runInitialSeed(payload).
 *   6. Filter the captured statements: keep INSERTs into app
 *      collections, drop Payload bookkeeping (migrations table,
 *      locked-docs, preferences, jobs).
 *   7. Inline bound params into literal SQL.
 *   8. Strip RETURNING clauses (migrations don't read return values).
 *   9. Append `ON CONFLICT DO NOTHING` so re-running is a no-op.
 *  10. Write the result to `99999999_000000_initial_seed.ts` (pinned
 *      to run last because seed data depends on every other schema
 *      migration having applied).
 *  11. Re-register the migration in `lib/migrations/index.ts`.
 *  12. Spawn `payload migrate` so payload_migrations records the new
 *      migration as applied (the seed already ran live; ON CONFLICT
 *      makes this step a no-op data-wise but updates the tracker).
 *
 * Re-runnable. Idempotent. Each invocation overwrites the migration.
 */

import { execSync } from "child_process";
import { writeFileSync, readFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";

type CapturedStatement = { query: string; params: unknown[] };

const MIGRATION_NAME = "99999999_000000_initial_seed";
const MIGRATIONS_DIR = "src/lib/migrations";

/**
 * Tables to drop from the capture. Anything Payload writes for its own
 * bookkeeping should never end up in a seed migration:
 * - `payload_migrations`: Payload's own migration tracking; updated by
 *   the migrate command itself.
 * - `payload_locked_documents` / `payload_locked_documents_rels`:
 *   admin-UI document locks; ephemeral runtime state.
 * - `payload_preferences`: per-user UI prefs; user-specific.
 * - `payload_jobs`: job queue; per-environment state.
 */
const SKIP_TABLES = new Set([
  "payload_migrations",
  "payload_locked_documents",
  "payload_locked_documents_rels",
  "payload_preferences",
  "payload_jobs",
  "payload_jobs_log"
]);

/**
 * Skip any table whose name starts with an underscore. By Payload
 * convention these are internal shadow tables:
 *   - `_<collection>_v` — version history snapshots
 *   - `_<collection>_v_locales` — per-locale version variants
 *   - `_<collection>_v_<arrayfield>` — version snapshots of array fields
 *
 * Versions are reconstructed on the first edit after seeding, so
 * including them in the seed migration buys nothing and creates a
 * web of FK references back to `_<collection>_v.id` (Drizzle emits
 * those id columns as `default`, breaking on migrate:fresh).
 */
const isInternalShadowTable = (table: string): boolean => table.startsWith("_");

/* ── Param inlining ────────────────────────────────────────────── */

function escapeLiteral(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) {
      throw new Error(`Non-finite number in seed param: ${v}`);
    }
    return String(v);
  }
  if (typeof v === "bigint") return v.toString();
  if (v instanceof Date) return `'${v.toISOString()}'::timestamptz`;
  if (Array.isArray(v)) {
    if (v.length === 0) return "ARRAY[]::text[]";
    return `ARRAY[${v.map(escapeLiteral).join(",")}]`;
  }
  if (Buffer.isBuffer(v)) {
    return `'\\x${v.toString("hex")}'::bytea`;
  }
  if (typeof v === "object") {
    return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(v).replace(/'/g, "''")}'`;
}

function inlineParams(query: string, params: unknown[]): string {
  return query.replace(/\$(\d+)/g, (_match, idx) => {
    const i = parseInt(idx, 10) - 1;
    if (i < 0 || i >= params.length) {
      throw new Error(
        `Param $${idx} out of range (have ${params.length} params): ${query}`
      );
    }
    return escapeLiteral(params[i]);
  });
}

/* ── Statement post-processing ─────────────────────────────────── */

function tableOfInsert(query: string): string | null {
  const m = query.match(/insert\s+into\s+["']?([a-zA-Z0-9_]+)["']?/i);
  return m ? m[1]! : null;
}

function stripReturning(query: string): string {
  return query.replace(/\s+returning\s+[\s\S]*$/i, "").trim();
}

function appendOnConflictDoNothing(query: string): string {
  // Postgres rejects `ON CONFLICT DO NOTHING` if there's a trailing
  // semicolon. Strip it, append, then re-add.
  const trimmed = query.replace(/;\s*$/, "");
  // Skip if already present (defensive — Drizzle usually doesn't emit
  // it on its own, but Better Auth's internal upserts might).
  if (/on\s+conflict\b/i.test(trimmed)) return `${trimmed};`;
  return `${trimmed} ON CONFLICT DO NOTHING;`;
}

/* ── File emission ─────────────────────────────────────────────── */

function renderMigrationFile(statements: string[]): string {
  const header = `import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * ⚠ AUTO-GENERATED. DO NOT EDIT BY HAND. ⚠
 *
 * Source of truth: \`src/seed/initial.ts\` (Payload-native).
 * Regenerate via: \`pnpm seed:rebuild\`.
 *
 * Captured ${statements.length} INSERT statements during a clean run
 * of \`runInitialSeed\`. Each statement is post-processed:
 *   - Bound params inlined as literals.
 *   - RETURNING clauses stripped.
 *   - ON CONFLICT DO NOTHING appended so re-applying against an
 *     already-seeded DB is a no-op.
 *
 * Filename is timestamped \`99999999_000000\` to pin this migration
 * to run last — seed data depends on every other schema migration
 * having applied.
 *
 * Generated at: ${new Date().toISOString()}
 */

`;

  const upBody = statements.map((s) => `    ${s}`).join("\n");

  return `${header}export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql\`
${upBody}
  \`);
}

export async function down({ db: _db }: MigrateDownArgs): Promise<void> {
  // Down is a no-op. Seed rows are removed by truncating the
  // affected tables — that's a destructive operation that should
  // never run automatically. If you need to clear seeds, run
  // \`pnpm migrate:fresh\` or DELETE the rows manually.
}
`;
}

/* ── index.ts registration ─────────────────────────────────────── */

function unregisterFromIndex(): void {
  const indexPath = join(MIGRATIONS_DIR, "index.ts");
  const current = readFileSync(indexPath, "utf-8");

  // Drop the import line.
  const importPattern = new RegExp(
    `^import \\* as migration_${MIGRATION_NAME} from "\\./${MIGRATION_NAME}";\\n`,
    "m"
  );
  let next = current.replace(importPattern, "");

  // Drop the entry block + leading comma if present.
  const entryPattern = new RegExp(
    `,?\\n\\s*\\{\\s*up: migration_${MIGRATION_NAME}\\.up,\\s*down: migration_${MIGRATION_NAME}\\.down,\\s*name: "${MIGRATION_NAME}"\\s*\\}`,
    "m"
  );
  next = next.replace(entryPattern, "");

  if (next !== current) {
    writeFileSync(indexPath, next);
  }
}

function ensureRegisteredInIndex(): void {
  const indexPath = join(MIGRATIONS_DIR, "index.ts");
  const current = readFileSync(indexPath, "utf-8");

  const importLine = `import * as migration_${MIGRATION_NAME} from "./${MIGRATION_NAME}";`;
  const entryBlock = `  {
    up: migration_${MIGRATION_NAME}.up,
    down: migration_${MIGRATION_NAME}.down,
    name: "${MIGRATION_NAME}"
  }`;

  if (current.includes(importLine)) {
    // Already registered. Nothing to do.
    return;
  }

  // Insert the import after the last existing import.
  const lines = current.split("\n");
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s+\*\s+as\s+migration_/.test(lines[i]!)) lastImportIdx = i;
  }
  if (lastImportIdx === -1) {
    throw new Error("Couldn't find existing migration imports in index.ts");
  }
  lines.splice(lastImportIdx + 1, 0, importLine);

  // Insert the entry block before the closing `];` of the migrations array.
  const closeIdx = lines.findIndex((l) => l.trim() === "];");
  if (closeIdx === -1) {
    throw new Error("Couldn't find closing `];` of migrations array");
  }
  // Add comma to the previous last entry if it doesn't have one.
  for (let j = closeIdx - 1; j > 0; j--) {
    const t = lines[j]!.trim();
    if (t === "") continue;
    if (t === "}") {
      lines[j] = lines[j]!.replace(/}\s*$/, "},");
      break;
    }
    break;
  }
  lines.splice(closeIdx, 0, entryBlock);

  writeFileSync(indexPath, lines.join("\n"));
}

/* ── Main ──────────────────────────────────────────────────────── */

async function main(): Promise<void> {
  // 1. Wipe any previous seed migration so the upcoming migrate:fresh
  //    leaves us with a schema-only DB (no stale seed rows).
  const outPath = join(MIGRATIONS_DIR, `${MIGRATION_NAME}.ts`);
  if (existsSync(outPath)) {
    unlinkSync(outPath);
    console.log("[seed:rebuild] removed existing seed migration file");
  }
  unregisterFromIndex();
  console.log("[seed:rebuild] unregistered seed migration from index.ts");

  // 2. Migrate:fresh. `yes` keeps a continuous stream of confirmations
  //    so any retried prompts also clear. stdio inherited so the user
  //    sees Payload's migration progress in real time.
  console.log("[seed:rebuild] running migrate:fresh");
  execSync(
    "yes | cross-env NODE_OPTIONS=--no-deprecation payload migrate:fresh",
    { stdio: ["inherit", "inherit", "inherit"], shell: "/bin/bash" }
  );

  // 3. Install the capture buffer and flip the env flag before
  //    importing payload-config. The adapter checks SEED_CAPTURE at
  //    module-load time, so this MUST happen before getPayload.
  process.env.SEED_CAPTURE = "1";
  const buffer: CapturedStatement[] = [];
  (
    globalThis as unknown as {
      __SEED_CAPTURE__: CapturedStatement[];
    }
  ).__SEED_CAPTURE__ = buffer;

  // Late-import so the env flag is set first.
  const { getPayload } = await import("payload");
  const { default: config } = await import("@payload-config");
  const { runInitialSeed } = await import("@/seed/initial");

  console.log("[seed:rebuild] booting Payload");
  const payload = await getPayload({ config });

  console.log("[seed:rebuild] running initial seed");
  await runInitialSeed(payload);

  console.log(`[seed:rebuild] captured ${buffer.length} total statements`);

  // Pull INSERTs only, drop bookkeeping tables, drop Payload's internal
  // shadow tables (versions, locale variants of versions, etc.).
  const inserts = buffer
    .map((s) => ({ ...s, _table: tableOfInsert(s.query) }))
    .filter((s) => {
      if (!s._table) return false;
      if (!/^\s*insert\s+into/i.test(s.query)) return false;
      if (SKIP_TABLES.has(s._table)) return false;
      if (isInternalShadowTable(s._table)) return false;
      return true;
    });

  console.log(
    `[seed:rebuild] ${inserts.length} INSERT statements after filtering`
  );

  const compiled = inserts.map((s) => {
    const inlined = inlineParams(s.query, s.params);
    const stripped = stripReturning(inlined);
    return appendOnConflictDoNothing(stripped);
  });

  writeFileSync(outPath, renderMigrationFile(compiled));
  console.log(`[seed:rebuild] wrote ${outPath}`);

  ensureRegisteredInIndex();
  console.log(`[seed:rebuild] ensured registration in index.ts`);

  // 12. Tell Payload "this migration ran" so the tracker is consistent
  //     with reality. The seed already ran live in step 5; the SQL we
  //     just wrote is a transcription. `payload migrate` will execute
  //     the new file, every INSERT will hit ON CONFLICT DO NOTHING
  //     (no data change), and payload_migrations gets the row.
  console.log("[seed:rebuild] applying newly-generated migration");
  execSync("cross-env NODE_OPTIONS=--no-deprecation payload migrate", {
    stdio: "inherit"
  });

  console.log("[seed:rebuild] done");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed:rebuild] failed:", err);
  process.exit(1);
});
