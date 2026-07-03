import { z } from "zod";

/**
 * Runtime env validation. The schema runs on first import and throws a
 * single error listing every missing or malformed variable, so a misconfigured
 * deploy fails fast instead of silently breaking at first OAuth callback or
 * first FX lookup.
 *
 * Counterpart to src/environment.d.ts (which only provides type declarations).
 *
 * Also the single source of truth for `.env.production.template` — every entry
 * carries a `.describe()` annotation that scripts/gen-env-template.ts parses
 * into a sectioned, commented template. Edit this file when you need to
 * add/remove a variable, then run `pnpm env:template:gen`.
 *
 * Tiers:
 *   - required    : prod boot must fail without these
 *   - optional    : feature degrades gracefully if absent (e.g. Brevo SMTP)
 *   - deployment  : consumed by docker-compose interpolation or the postgres
 *                   container, not by the running Next.js app
 *   - dev         : only set in local development (.env / .env.local), not
 *                   expected on the prod VPS
 *
 * Categories (drive section ordering in the generated template):
 *   secrets, db, auth-oauth, urls, external-api, email, plugins,
 *   admin-auth, misc, dev, runtime
 */

const required = z.string().min(1, "required");
const url = z.string().url("must be a full URL (https://…)");
// Hex secrets — accept any non-trivial string, but flag the placeholder.
const secret = z
  .string()
  .min(16, "must be at least 16 chars (use openssl rand -hex 32)")
  .refine((v) => !v.startsWith("CHANGE_ME"), {
    message: "still set to the .env.production.template placeholder"
  });

// Annotation format consumed by gen-env-template.ts: pipe-delimited fields
// `<tier>|<category>|<one-line description>[|hint]`. Keep description short
// (< 80 chars); use the optional 4th field for "where to obtain" hints.
const d = (
  tier: string,
  category: string,
  description: string,
  hint?: string
): string => [tier, category, description, hint ?? ""].join("|");

const schema = z.object({
  // ── Application secrets ─────────────────────────────────────────────────
  PAYLOAD_SECRET: secret.describe(
    d(
      "required",
      "secrets",
      "Server-side secret signing JWTs and CSRF tokens.",
      "openssl rand -hex 32"
    )
  ),
  BETTER_AUTH_SECRET: secret.describe(
    d(
      "required",
      "secrets",
      "Better Auth signing secret.",
      "openssl rand -hex 32"
    )
  ),
  PREVIEW_SECRET: secret.describe(
    d(
      "required",
      "secrets",
      "Preview-mode shared secret (URL token for draft posts).",
      "openssl rand -hex 16"
    )
  ),
  CRON_SECRET: secret.describe(
    d(
      "required",
      "secrets",
      "Auth token for cron-triggered endpoints.",
      "openssl rand -hex 16"
    )
  ),

  // ── Database ────────────────────────────────────────────────────────────
  DATABASE_URI: required.describe(
    d(
      "required",
      "db",
      "Postgres connection string. In prod, compose constructs this from POSTGRES_* below.",
      "postgresql://USER:PASSWORD@postgres:5432/DB"
    )
  ),

  // ── OAuth — required at launch ──────────────────────────────────────────
  GOOGLE_CLIENT_ID: required.describe(
    d(
      "required",
      "auth-oauth",
      "Google OAuth client ID for end-user sign-in.",
      "https://console.cloud.google.com/apis/credentials"
    )
  ),
  GOOGLE_CLIENT_SECRET: required.describe(
    d(
      "required",
      "auth-oauth",
      "Google OAuth client secret.",
      "https://console.cloud.google.com/apis/credentials"
    )
  ),
  AUTH_NAVER_ID: required.describe(
    d(
      "required",
      "auth-oauth",
      "Naver OAuth client ID.",
      "https://developers.naver.com/apps/"
    )
  ),
  AUTH_NAVER_SECRET: required.describe(
    d(
      "required",
      "auth-oauth",
      "Naver OAuth client secret.",
      "https://developers.naver.com/apps/"
    )
  ),
  AUTH_KAKAO_ID: required.describe(
    d(
      "required",
      "auth-oauth",
      "Kakao OAuth REST API key for end-user sign-in.",
      "https://developers.kakao.com/console/app"
    )
  ),
  AUTH_KAKAO_SECRET: required.describe(
    d(
      "required",
      "auth-oauth",
      "Kakao OAuth client secret.",
      "https://developers.kakao.com/console/app"
    )
  ),

  // ── External APIs (currency / holiday) ──────────────────────────────────
  EXCHANGE_RATE_API_KEY: required.describe(
    d(
      "required",
      "external-api",
      "Korea Eximbank FX API auth key.",
      "https://www.koreaexim.go.kr/"
    )
  ),
  HOLIDAY_API_KEY: required.describe(
    d(
      "required",
      "external-api",
      "Korean public-holiday data.go.kr service key.",
      "https://www.data.go.kr/"
    )
  ),
  NEXT_PUBLIC_EXCHANGE_RATE_URL: url.describe(
    d(
      "required",
      "external-api",
      "Eximbank FX endpoint URL. Baked into the client bundle."
    )
  ),
  NEXT_PUBLIC_HOLIDAY_API_URL: url.describe(
    d(
      "required",
      "external-api",
      "Holiday API base URL. Baked into the client bundle."
    )
  ),

  // ── Public / baked ──────────────────────────────────────────────────────
  NEXT_PUBLIC_SERVER_URL: url.describe(
    d(
      "required",
      "urls",
      "Canonical site origin used for absolute URL construction.",
      "https://hideawayseoul.com"
    )
  ),
  NEXT_PUBLIC_BETTER_AUTH_URL: url.describe(
    d(
      "required",
      "urls",
      "Better Auth base URL (typically same as NEXT_PUBLIC_SERVER_URL).",
      "https://hideawayseoul.com"
    )
  ),
  NEXT_PUBLIC_PRODUCTION_URL: z
    .string()
    .url()
    .optional()
    .describe(
      d(
        "optional",
        "urls",
        "Extra trusted origin for Better Auth (only set when staging/preview hosts share prod cookies)."
      )
    ),
  NEXT_PUBLIC_LOSTINSEOUL_URL: z
    .string()
    .url()
    .optional()
    .describe(
      d(
        "optional",
        "urls",
        "LOSTINSEOUL storefront origin routed into the same Next/Payload app.",
        "https://lostinseoul.com"
      )
    ),
  PAYLOAD_PUBLIC_SERVER_URL: z
    .string()
    .url()
    .optional()
    .describe(
      d(
        "optional",
        "urls",
        "Legacy Payload fallback for absolute URL composition in admin meta. Defaults to NEXT_PUBLIC_SERVER_URL."
      )
    ),
  BASE_URL: z
    .string()
    .url()
    .optional()
    .describe(
      d(
        "optional",
        "urls",
        "Email-template absolute-URL fallback. Only set if the renderer can't reach NEXT_PUBLIC_SERVER_URL."
      )
    ),
  NEXT_PUBLIC_BASE_URL: z
    .string()
    .url()
    .optional()
    .describe(
      d(
        "optional",
        "urls",
        "Client-side fallback used by the email-template preview UI."
      )
    ),

  // ── Email — optional at launch (manual checkout falls back to logger) ──
  BREVO_SMTP_USER: z
    .string()
    .optional()
    .describe(
      d(
        "optional",
        "email",
        "Brevo SMTP username (transactional email).",
        "https://app.brevo.com/settings/keys/smtp"
      )
    ),
  BREVO_SMTP_PASS: z
    .string()
    .optional()
    .describe(d("optional", "email", "Brevo SMTP password / API key.")),
  EMAIL_FROM: z
    .string()
    .email()
    .optional()
    .describe(
      d(
        "optional",
        "email",
        "Default From: address on outgoing transactional mail."
      )
    ),
  EMAIL_FROM_NAME: z
    .string()
    .optional()
    .describe(d("optional", "email", "Default sender display name.")),
  ADMIN_EMAIL: z
    .string()
    .email()
    .optional()
    .describe(
      d(
        "optional",
        "email",
        "Admin notification recipient (signup alerts, errors)."
      )
    ),

  // ── Site / branding (used by email template + meta fallbacks) ───────────
  SITE_NAME: z
    .string()
    .optional()
    .describe(
      d(
        "optional",
        "misc",
        "Server-side site name used in email templates. Defaults to project literal."
      )
    ),
  NEXT_PUBLIC_SITE_NAME: z
    .string()
    .optional()
    .describe(
      d(
        "optional",
        "misc",
        "Client-side site name (mirrors SITE_NAME for the email preview UI)."
      )
    ),

  // ── Upload / interaction limits ─────────────────────────────────────────
  NEXT_PUBLIC_IMAGE_MAX_FILE_SIZE: z
    .string()
    .optional()
    .describe(
      d(
        "optional",
        "misc",
        "Per-upload byte cap, parsed as Number(). Example: 10485760 = 10 MB."
      )
    ),

  // ── Maps ────────────────────────────────────────────────────────────────
  MAPBOX_API_KEY: z
    .string()
    .optional()
    .describe(
      d(
        "optional",
        "external-api",
        "Mapbox token for /api/places/search autocomplete.",
        "https://account.mapbox.com/access-tokens"
      )
    ),

  // ── Manual checkout — optional banner string ────────────────────────────
  NEXT_PUBLIC_BANK_ACCOUNT: z
    .string()
    .optional()
    .describe(
      d(
        "optional",
        "misc",
        "Bank-transfer detail string shown on the manual-checkout success screen."
      )
    ),

  // ── LOSTINSEOUL / PortOne checkout ───────────────────────────────────
  PORTONE_CLIENT_KEY: z
    .string()
    .optional()
    .describe(
      d(
        "optional",
        "external-api",
        "PortOne Global client key for LOSTINSEOUL checkout.",
        "https://admin.portone.cloud/"
      )
    ),
  PORTONE_SECRET_KEY: z
    .string()
    .optional()
    .describe(
      d(
        "optional",
        "external-api",
        "PortOne Global server secret for signing and webhook reconciliation.",
        "https://admin.portone.cloud/"
      )
    ),
  PORTONE_API_JWT: z
    .string()
    .optional()
    .describe(
      d(
        "optional",
        "external-api",
        "Bearer JWT for PortOne server APIs such as refunds.",
        "https://docs.portone.cloud/reference/post_api-refund-portone-order-ref"
      )
    ),
  PORTONE_STORE_ID: z
    .string()
    .optional()
    .describe(
      d(
        "optional",
        "external-api",
        "PortOne V2 Store ID for LOSTINSEOUL checkout.",
        "https://developers.portone.io/opi/ko/integration/start/v2/checkout?v=v2"
      )
    ),

  PORTONE_CHANNEL_KEY: z
    .string()
    .optional()
    .describe(
      d(
        "optional",
        "external-api",
        "PortOne V2 channel key for LOSTINSEOUL checkout.",
        "https://developers.portone.io/opi/ko/integration/start/v2/checkout?v=v2"
      )
    ),

  PORTONE_API_SECRET: z
    .string()
    .optional()
    .describe(
      d(
        "optional",
        "external-api",
        "PortOne V2 API Secret for server-side payment verification.",
        "https://developers.portone.io/opi/ko/quick-guide/payment?v=v2"
      )
    ),

  PORTONE_ENVIRONMENT: z
    .enum(["sandbox", "production"])
    .optional()
    .describe(
      d(
        "optional",
        "external-api",
        "PortOne checkout environment. Defaults to sandbox when unset."
      )
    ),
  PORTONE_DEFAULT_CHANNEL: z
    .string()
    .optional()
    .describe(
      d(
        "optional",
        "external-api",
        "Default PortOne payment channel key for checkout payloads."
      )
    ),
  PORTONE_DEFAULT_METHOD: z
    .string()
    .optional()
    .describe(
      d(
        "optional",
        "external-api",
        "Default PortOne payment method for checkout payloads."
      )
    ),
  PORTONE_WEBHOOK_SECRET: z
    .string()
    .optional()
    .describe(
      d(
        "optional",
        "external-api",
        "Shared secret accepted by the LOSTINSEOUL PortOne webhook endpoint. For Standard-Webhooks signature verification use the whsec_… secret from the PortOne console."
      )
    ),
  PORTONE_WEBHOOK_REQUIRE_SIGNATURE: z
    .string()
    .optional()
    .describe(
      d(
        "optional",
        "external-api",
        'When "true", the PortOne webhook rejects requests without Standard-Webhooks signature headers (disables the legacy shared-secret header fallback).'
      )
    ),

  // ── Auth misc ───────────────────────────────────────────────────────────
  COOKIE_DOMAIN: z
    .string()
    .optional()
    .describe(
      d(
        "optional",
        "auth-oauth",
        "Cookie domain for cross-subdomain session sharing.",
        "hideawayseoul.com"
      )
    ),

  // ── Admin OAuth (separate Google project) ───────────────────────────────
  AUTH_ADMINS_GOOGLE_ID: z
    .string()
    .optional()
    .describe(
      d(
        "optional",
        "admin-auth",
        "Admin-only Google OAuth client ID (separate GCP project recommended)."
      )
    ),
  AUTH_ADMINS_GOOGLE_SECRET: z
    .string()
    .optional()
    .describe(
      d("optional", "admin-auth", "Admin-only Google OAuth client secret.")
    ),

  // ── Plugins — image search providers ────────────────────────────────────
  UNSPLASH_ACCESS_KEY: z
    .string()
    .describe(
      d(
        "optional",
        "plugins",
        "Unsplash access key, mandatory since the site technically relies on unsplash to maintain a image-richlayout",
        "https://unsplash.com/developers"
      )
    ),
  UNSPLASH_COLLECTION_ID: z
    .string()
    .optional()
    .describe(
      d(
        "optional",
        "plugins",
        "Default Unsplash collection ID used by image-search."
      )
    ),
  // ── Plugins — audio (Radio collection) ──────────────────────────────────
  SPOTIFY_CLIENT_ID: z
    .string()
    .optional()
    .describe(
      d(
        "optional",
        "plugins",
        "Spotify API client ID for the Radio collection metadata enrichment."
      )
    ),
  SPOTIFY_SECRET: z
    .string()
    .optional()
    .describe(d("optional", "plugins", "Spotify API client secret.")),

  // ── Deployment (compose-interpolated; not read by the Next.js app) ──────
  POSTGRES_USER: z
    .string()
    .optional()
    .describe(
      d(
        "deployment",
        "db",
        "Username for the postgres container and compose-built DATABASE_URI."
      )
    ),
  POSTGRES_PASSWORD: z
    .string()
    .optional()
    // compose.prod.yaml builds DATABASE_URI by raw shell interpolation:
    //   postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
    // Without URL-encoding, characters that have URI authority meaning would
    // silently corrupt parsing (an `@` in the password would re-anchor the
    // host portion). Reject them at validation time rather than discovering
    // a misparsed connection string under load. Allowed sub-delims (`!`, `$`,
    // `*`, etc.) stay legal per RFC 3986.
    .refine((v) => v === undefined || !/[@:/?#[\]]/.test(v), {
      message:
        "must not contain @ : / ? # [ ] — these have meaning in postgresql:// URIs and would silently break DATABASE_URI interpolation. Use letters, digits, sub-delims (! $ & ' ( ) * + , ; =) or pct-encode in advance."
    })
    .describe(
      d(
        "deployment",
        "db",
        "Password for the postgres container. Must contain no URI-reserved characters (@ : / ? # [ ])."
      )
    ),
  POSTGRES_DB: z
    .string()
    .optional()
    .describe(
      d(
        "deployment",
        "db",
        "Database name. Must match the schema your migrations target.",
        "theestate"
      )
    ),

  // ── Dev-only (fixture creds; never set on prod VPS) ─────────────────────
  DEV_BUTLER_PASSWORD: z
    .string()
    .optional()
    .describe(
      d(
        "dev",
        "dev",
        "Dev-only password for the butler-login backdoor on /sign-in. Must be unset in prod."
      )
    ),
  DEV_READER_PASSWORD: z
    .string()
    .optional()
    .describe(
      d("dev", "dev", "Dev-only password for the readers-seed fixture login.")
    ),

  // ── Node runtime ────────────────────────────────────────────────────────
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .optional()
    .describe(
      d(
        "optional",
        "runtime",
        "Node environment. Compose sets this to `production` in prod."
      )
    )
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
    "See .env.production.template for the full list of required variables.\n" +
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

// Re-exported for scripts/gen-env-template.ts — the only consumer outside this
// module. Keep this export named `envSchema` so the generator's import path
// stays stable.
export { schema as envSchema };
