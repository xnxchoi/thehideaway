#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/* scripts/gen-env-template.ts
 *
 * Generates .env.production.template from the Zod schema in src/lib/env.ts.
 *
 * Usage:
 *   pnpm env:template:gen          - write the template to .env.production.template
 *   pnpm env:template:verify       - exit 1 if the on-disk template differs
 *                                    from what the schema would generate (CI gate)
 *
 * The template is the canonical "what does prod expect" doc. Real values live
 * encrypted in .env.production.enc (sops + age) and never in the template.
 *
 * Adds, removes, or relabels a variable? Edit src/lib/env.ts, then run this.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

// Import the schema. The module also runs the validator on import - pass
// SKIP_ENV_VALIDATION so the import doesn't validate this script's own env.
// Wrapped so a missing/broken env.ts surfaces a one-line diagnostic instead
// of a raw Node module-resolution stack trace.
process.env.SKIP_ENV_VALIDATION = "1";
let envSchema: z.ZodObject<z.ZodRawShape>;
try {
  // The `.ts` extension is required by Node's --experimental-strip-types
  // resolver — do NOT let a formatter strip it.
  //@ts-expect-error node req
  ({ envSchema } = await import("../src/lib/env.ts"));
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error("✗ Failed to import src/lib/env (the schema source):");
  console.error(`    ${message}`);
  process.exit(1);
}

// ── Annotation parsing ──────────────────────────────────────────────────────

type Tier = "required" | "optional" | "deployment" | "dev";

interface FieldMeta {
  readonly key: string;
  readonly tier: Tier;
  readonly category: string;
  readonly description: string;
  readonly hint: string;
}

function parseDescribe(key: string, raw: string | undefined): FieldMeta {
  if (raw === undefined || raw === "") {
    return {
      key,
      tier: "optional",
      category: "misc",
      description: "(no description in schema)",
      hint: ""
    };
  }
  // Split first three on "|"; everything after the third pipe is the hint,
  // joined back together. Without this rejoin, a description containing a
  // literal "|" (a URL with `|` in a query string, natural text "this | that")
  // would silently truncate description and corrupt hint.
  const parts = raw.split("|");
  const tier = parts[0];
  const category = parts[1];
  const description = parts[2];
  const hint = parts.slice(3).join("|");
  return {
    key,
    tier: normalizeTier(tier),
    category: (category ?? "misc").trim(),
    description: (description ?? "").trim(),
    hint: hint.trim()
  };
}

function normalizeTier(raw: string | undefined): Tier {
  if (
    raw === "required" ||
    raw === "optional" ||
    raw === "deployment" ||
    raw === "dev"
  ) {
    return raw;
  }
  return "optional";
}

// ── Template body ───────────────────────────────────────────────────────────

const SECTION_ORDER: readonly string[] = [
  "secrets",
  "db",
  "auth-oauth",
  "admin-auth",
  "urls",
  "external-api",
  "email",
  "plugins",
  "misc",
  "dev",
  "runtime"
] as const;

const SECTION_TITLES: Record<string, string> = {
  secrets: "Application secrets",
  db: "Database (compose-interpolated POSTGRES_* build DATABASE_URI)",
  "auth-oauth": "OAuth — end-user sign-in",
  "admin-auth": "Admin OAuth (separate Google project)",
  urls: "Public URLs (baked into client bundle at build)",
  "external-api": "External APIs (currency, holiday, maps)",
  email: "Email (Brevo SMTP — optional at launch)",
  plugins: "Plugins (image search, audio metadata)",
  misc: "Site branding, limits, manual checkout",
  dev: "Dev-only — must NOT be set on prod VPS",
  runtime: "Node runtime (compose sets these automatically)"
};

function placeholderFor(meta: FieldMeta): string {
  switch (meta.category) {
    case "secrets":
      return "CHANGE_ME_RUN_OPENSSL_RAND_HEX_32";
    case "db":
      if (meta.key === "DATABASE_URI") {
        return "postgresql://USER:PASSWORD@postgres:5432/DB";
      }
      if (meta.key === "POSTGRES_PASSWORD") return "CHANGE_ME_DB_PASSWORD";
      if (meta.key === "POSTGRES_USER") return "postgres";
      if (meta.key === "POSTGRES_DB") return "theestate";
      return "CHANGE_ME";
    case "urls":
      return "https://example.com";
    case "auth-oauth":
    case "admin-auth":
      if (meta.key.endsWith("_ID")) return "CHANGE_ME_CLIENT_ID";
      if (meta.key.endsWith("_SECRET")) return "CHANGE_ME_CLIENT_SECRET";
      if (meta.key === "COOKIE_DOMAIN") return "example.com";
      return "CHANGE_ME";
    case "external-api":
      if (meta.key.endsWith("_URL")) return "https://example.com/api";
      return "CHANGE_ME_API_KEY";
    case "email":
      if (meta.key === "EMAIL_FROM" || meta.key === "ADMIN_EMAIL")
        return "you@example.com";
      if (meta.key === "EMAIL_FROM_NAME") return "Your Site";
      return "CHANGE_ME";
    case "plugins":
      return "CHANGE_ME_PROVIDER_KEY";
    case "dev":
      return "";
    case "runtime":
      if (meta.key === "NODE_ENV") return "production";
      return "";
    default:
      return "CHANGE_ME";
  }
}

function isOptional(zodType: z.ZodTypeAny): boolean {
  return zodType.isOptional?.() ?? false;
}

function getDescription(zodType: z.ZodTypeAny): string | undefined {
  // Zod stores .describe() at type.description. With ZodOptional / ZodEffects
  // wrappers it can be on the wrapper itself or on the inner def.
  const own = (zodType as { description?: string }).description;
  if (typeof own === "string" && own.length > 0) return own;
  const inner = (
    zodType as { _def?: { innerType?: z.ZodTypeAny; schema?: z.ZodTypeAny } }
  )._def;
  if (inner?.innerType) return getDescription(inner.innerType);
  if (inner?.schema) return getDescription(inner.schema);
  return undefined;
}

function collectFields(schema: z.ZodObject<z.ZodRawShape>): FieldMeta[] {
  const shape = schema.shape;
  const out: FieldMeta[] = [];
  for (const key of Object.keys(shape)) {
    const fieldType = shape[key];
    if (!fieldType) continue;
    //@ts-expect-error feid
    const description = getDescription(fieldType);
    const meta = parseDescribe(key, description);
    // If the annotation claims `required` but the type is actually optional,
    // trust the type. Keeps the two in sync without a separate audit step.
    const tier =
      //@ts-expect-error feid
      meta.tier === "required" && isOptional(fieldType)
        ? "optional"
        : meta.tier;
    out.push({ ...meta, tier });
  }
  return out;
}

function wrap(text: string, width: number, prefix: string): string[] {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let current = "";
  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length + prefix.length > width) {
      out.push(prefix + current);
      current = word;
    } else {
      current = current + " " + word;
    }
  }
  if (current.length > 0) out.push(prefix + current);
  return out;
}

function renderTemplate(fields: readonly FieldMeta[]): string {
  const lines: string[] = [
    "# .env.production.template — GENERATED FROM src/lib/env.ts. DO NOT EDIT BY HAND.",
    "#",
    '# This is the canonical "what does prod expect" document. Real values live',
    "# encrypted in .env.production.enc (sops + age). To edit values, run:",
    "#   pnpm env:edit",
    "#",
    "# To add/remove a variable: edit src/lib/env.ts, then run:",
    "#   pnpm env:template:gen",
    "#",
    "# Tiers:",
    "#   [required]   — prod boot fails without this",
    "#   [optional]   — feature degrades gracefully if absent",
    "#   [deployment] — read by docker-compose / postgres, not by the Next.js app",
    "#   [dev]        — local-dev only; must NOT be set on the prod VPS",
    ""
  ];

  const grouped = new Map<string, FieldMeta[]>();
  for (const field of fields) {
    const list = grouped.get(field.category) ?? [];
    list.push(field);
    grouped.set(field.category, list);
  }

  const orderedCategories = [
    ...SECTION_ORDER.filter((c) => grouped.has(c)),
    ...[...grouped.keys()].filter((c) => !SECTION_ORDER.includes(c)).sort()
  ];

  for (const category of orderedCategories) {
    const fieldsInSection = grouped.get(category);
    if (!fieldsInSection || fieldsInSection.length === 0) continue;
    const title = SECTION_TITLES[category] ?? category;

    lines.push(`# ── ${title} ────────────────────────────────────────────`);
    lines.push("");

    for (const field of fieldsInSection) {
      if (field.description.length > 0) {
        for (const wrapped of wrap(field.description, 80, "# ")) {
          lines.push(wrapped);
        }
      }
      lines.push(
        `# [${field.tier}]${field.hint.length > 0 ? `  hint: ${field.hint}` : ""}`
      );
      const value = placeholderFor(field);
      lines.push(`${field.key}=${value}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

// ── CLI ─────────────────────────────────────────────────────────────────────

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, "..");
const templatePath = resolve(projectRoot, ".env.production.template");

type Mode = "gen" | "verify";

function parseMode(argv: readonly string[]): Mode {
  const arg = argv[0];
  if (arg === "verify" || arg === "--verify") return "verify";
  return "gen";
}

function main(): void {
  const mode = parseMode(process.argv.slice(2));
  const fields = collectFields(envSchema as z.ZodObject<z.ZodRawShape>);
  const expected = renderTemplate(fields);

  if (mode === "verify") {
    let actual: string | null = null;
    try {
      actual = readFileSync(templatePath, "utf8");
    } catch {
      actual = null;
    }
    if (actual === expected) {
      console.log("✓ .env.production.template is in sync with src/lib/env.ts");
      process.exit(0);
    }
    if (actual === null) {
      console.error("✗ .env.production.template is missing");
    } else {
      console.error(
        "✗ .env.production.template is out of sync with src/lib/env.ts"
      );
    }
    console.error("");
    console.error("  Fix: run `pnpm env:template:gen` and commit the result.");
    process.exit(1);
  }

  writeFileSync(templatePath, expected, "utf8");
  console.log(`✓ wrote ${templatePath} (${fields.length} variables)`);
}

main();
