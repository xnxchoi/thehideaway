#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/* scripts/verify-env.ts
 *
 * CLI sanity-check for an .env file before deploying it to a VPS.
 *
 * Usage:
 *   pnpm verify:env                       # checks ./.env.production
 *   pnpm verify:env path/to/.env.staging  # checks a specific file
 *
 * Runs the same Zod schema as src/lib/env.ts against the file's keys, with
 * NODE_ENV forced to "production" so optional-in-dev requirements are
 * enforced. Exits 0 on pass, 1 on fail. Prints every issue at once.
 *
 * Does NOT load Payload, connect to a DB, or import any app code beyond the
 * env schema — runs in seconds against any .env file.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, "..");

const target = resolve(projectRoot, process.argv[2] ?? ".env.production");

if (!existsSync(target)) {
  console.error(`✗ File not found: ${target}`);
  process.exit(1);
}

// Parse .env-style file: KEY=VALUE lines, skipping comments and blanks.
// Values are not unquoted — we treat them as opaque strings (matches dotenv's
// loose-mode behavior, which is what Next.js / docker compose use).
const parseDotenv = (raw: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
};

const fileEnv = parseDotenv(readFileSync(target, "utf8"));

// compose.prod.yaml constructs DATABASE_URI from POSTGRES_* at container
// boot, so the .env file itself never declares it. Synthesize the same
// connection string here so verify:env doesn't false-positive on a perfectly
// valid file. If the user supplies POSTGRES_USER/PASSWORD/DB, we mirror the
// compose interpolation: postgresql://USER:PASS@postgres:5432/DB.
if (!fileEnv.DATABASE_URI) {
  const u = fileEnv.POSTGRES_USER || "postgres";
  const p = fileEnv.POSTGRES_PASSWORD;
  const d = fileEnv.POSTGRES_DB;
  if (p && d) {
    fileEnv.DATABASE_URI = `postgresql://${u}:${p}@postgres:5432/${d}`;
  }
}

// Force production mode so the schema demands all required vars and rejects
// CHANGE_ME_* placeholder secrets.
const previousEnv = { ...process.env };
process.env.NODE_ENV = "production";
for (const [k, v] of Object.entries(fileEnv)) process.env[k] = v;

let exitCode = 0;
try {
  // Importing src/lib/env triggers the Zod parse on first import.
  await import("../src/lib/env.ts");
  console.log(`✓ ${target}`);
  console.log(
    "  Required vars present, secrets non-placeholder, URLs well-formed."
  );
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  exitCode = 1;
} finally {
  // Restore process.env to avoid polluting any subsequent imports if this
  // script is sourced.
  for (const k of Object.keys(process.env)) {
    if (!(k in previousEnv)) delete process.env[k];
  }
  for (const [k, v] of Object.entries(previousEnv)) process.env[k] = v;
}

process.exit(exitCode);
