<!-- Generated: 2026-11-02 | Files scanned: 2221 | Token estimate: ~600 -->
# Dependencies

Runtime is Node, package manager pnpm. Next `output: "standalone"`. Deploy images: `dev.Dockerfile`, `pack.Dockerfile`, `migrate.Dockerfile`, `nginx/Dockerfile`, `postgres/dev.Dockerfile`. Compose: `compose.dev.yaml`, `compose.prod.yaml`.

## Platform

| Package | Use |
|---|---|
| `next@16` | App Router, proxy, cacheComponents |
| `payload@3.88` + `@payloadcms/next` `@payloadcms/db-postgres` `@payloadcms/richtext-lexical` | CMS, DB, editor |
| `better-auth@1.7` `@better-auth/passkey` `@payload-auth/better-auth` | Session, OAuth, WebAuthn |
| `next-intl` | en/ko strings (`messages/en.json`, `messages/ko.json`) |
| `@tanstack/react-query` | Client server-state |
| `zustand` | UI stores |
| `motion` | Animation (`motion/react-m`) |
| `sharp` | Payload image pipeline |
| `vitest` | Tests (`pnpm test`) |

## Payload plugins (package.json)

`plugin-ecommerce`, `plugin-search`, `plugin-seo`, `plugin-redirects`, `plugin-form-builder` (not mounted), `plugin-import-export`, `plugin-nested-docs` (not mounted), `@payload-bites/image-search`, `@oversightstudio/blur-data-urls`.

## External services

| Service | Where |
|---|---|
| PostgreSQL `theestate` | `DATABASE_URI`, local docker `postgres` |
| PortOne | `@portone/server-sdk`, ecommerce adapter, `POST /api/lost/webhooks/portone` |
| Google / Naver / Kakao OAuth | `src/lib/auth/options.ts` socialProviders |
| Email (Nodemailer + Brevo) | `src/lib/email.ts`, `@payloadcms/email-nodemailer`, `readmes/BREVO_SETUP.md` |
| Unsplash / Pexels / Pixabay | `src/payload/plugins/image-search` |
| Captcha | `@captchafox/react`, `@hcaptcha/react-hcaptcha`, `@marsidev/react-turnstile` |
| SOPS/age | `pnpm env:decrypt` for `.env.production.enc` |

## Client libraries that define surfaces

Howler (radio), Lexical 0.41 (editor), `@react-three/fiber` + drei + rapier (fragrance / 3D), `@floating-ui/react` (Highlightr), `@dnd-kit/*` (sortable admin/settings), Radix + `@base-ui/react` (primitives), `lenis` (smooth scroll), GSAP (`@gsap/react`), Phosphor + Tabler icons.

## Ops scripts

`pnpm dev` / `dev:init`, `migrate`, `micreate`, `generate:types|schema|importmap`, `attic`, `release:cut`, `verify:env`, `sync:deploy-rules`. Nginx site files: `nginx/sites-enabled/`. Env contract: `src/lib/env.ts` (throws in production on missing vars).
