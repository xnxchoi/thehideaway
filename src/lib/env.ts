import { z } from "zod";

/**
 * Runtime env validation. The schema runs on first import and throws a
 * single error listing every missing or malformed variable, so a misconfigured
 * deploy fails fast instead of silently breaking at first OAuth callback or
 * first FX lookup.
 *
 * Counterpart to src/environment.d.ts (which only provides type declarations).
 *
 * Categories:
 *   - required    : prod boot must fail without these
 *   - optional    : feature degrades gracefully if absent (e.g. Brevo SMTP)
 *   - public/baked: NEXT_PUBLIC_* — frozen at `pnpm build` time
 *   - private     : read at runtime; must be present in the running container
 */

const required = z.string().min(1, "required");
const url = z.string().url("must be a full URL (https://…)");
// Hex secrets — accept any non-trivial string, but flag the placeholder.
const secret = z
  .string()
  .min(16, "must be at least 16 chars (use openssl rand -hex 32)")
  .refine((v) => !v.startsWith("CHANGE_ME"), {
    message: "still set to the .env.production.example placeholder"
  });

const schema = z.object({
  // ── Application secrets ─────────────────────────────────────────────────
  PAYLOAD_SECRET: secret,
  BETTER_AUTH_SECRET: secret,
  PREVIEW_SECRET: secret,
  CRON_SECRET: secret,

  // ── Database ────────────────────────────────────────────────────────────
  DATABASE_URI: required,

  // ── OAuth — required at launch ──────────────────────────────────────────
  GOOGLE_CLIENT_ID: required,
  GOOGLE_CLIENT_SECRET: required,
  AUTH_NAVER_ID: required,
  AUTH_NAVER_SECRET: required,

  // ── External APIs (currency / holiday) ──────────────────────────────────
  EXCHANGE_RATE_API_KEY: required,
  HOLIDAY_API_KEY: required,

  // ── Public / baked ──────────────────────────────────────────────────────
  NEXT_PUBLIC_SERVER_URL: url,
  NEXT_PUBLIC_BETTER_AUTH_URL: url,

  // ── Email — optional at launch (manual checkout falls back to logger) ──
  BREVO_SMTP_USER: z.string().optional(),
  BREVO_SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),

  // ── Manual checkout — optional banner string ────────────────────────────
  NEXT_PUBLIC_BANK_ACCOUNT: z.string().optional(),

  // ── Tickets — optional Toss ID for toss.me/{id}/{amount} links ─────────
  NEXT_PUBLIC_TOSS_ID: z.string().optional(),

  // ── Auth misc ───────────────────────────────────────────────────────────
  COOKIE_DOMAIN: z.string().optional(),

  // ── Node runtime ────────────────────────────────────────────────────────
  NODE_ENV: z.enum(["development", "test", "production"]).optional()
});

const isProduction = process.env.NODE_ENV === "production";
const skipValidation =
  process.env.SKIP_ENV_VALIDATION === "1" ||
  process.env.NODE_ENV === "test" ||
  // Type generation, schema generation, etc. — Payload CLI loads payload.config
  // without a real prod env, and we don't want to refuse those operations.
  process.env.PAYLOAD_GENERATE === "1";

const parsed = skipValidation
  ? schema.partial().safeParse(process.env)
  : schema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((issue) => {
    const key = issue.path.join(".");
    return `  • ${key}: ${issue.message}`;
  });
  const banner = "Environment validation failed";
  const help =
    "See .env.production.example for the full list of required variables.\n" +
    "Set SKIP_ENV_VALIDATION=1 to bypass during one-off CLI tasks (NOT for prod).";
  const message = `\n${banner}\n${"─".repeat(banner.length)}\n${lines.join("\n")}\n\n${help}\n`;

  if (isProduction) {
    // Production: fail fast. A misconfigured deploy must NOT silently start.
    throw new Error(message);
  }
  // Development / staging: warn loudly but keep going so a half-configured
  // dev box still boots. The same misconfig WILL throw in production.
  console.warn(message);
}

export const env = (parsed.success ? parsed.data : process.env) as z.infer<
  typeof schema
>;
