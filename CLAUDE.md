# The Hideaway

## What This Is

A content platform and CMS on **Next.js 16 + Payload CMS + PostgreSQL** for long-form essays, text
highlighting/annotation, personal collections, music, and profiles. Bilingual (en/ko), tiered access via user roles.

**Domain:** `hideawayseoul.com` · **Admin panel:** `/vault` · **Database:** `theestate`

---

## Project Structure

Standard App Router layout — read the tree on disk. Non-obvious mappings: route groups
`(frontend)/(site)/(pages|content|auth)` and `(dev)` (dev-only); `(payload)` is the Payload admin, served at `/vault`.
Features live under `src/payload` (collections/globals/plugins/fields/Lexical/search), `src/components` (`UX/`
interactive, `core/` primitives, `three/`, `ui/`, `sections/`), `src/lib` (auth integration, migrations, actions),
`src/providers`, `src/stores`. i18n JSON in `messages/`; feature dev docs in `readmes/`; infra in `nginx/` +
`postgres/`.

`payload-types.ts` is auto-generated — never edit by hand.

---

## Payload CMS Collections

Enumerate from `src/payload/collections/`. Non-obvious: `Admins` is deprecated (Better Auth entities — Sessions,
Accounts, etc. — live alongside as collections), and the radio stream endpoint hangs off Playlists/Tracks.

---

## Key Subsystems

Read the matching `readmes/*.md` before working on any of these.

- **Highlightr** (`components/UX/Highlightr/`) — post-exclusive text annotation. Rangy + floating-ui + Zustand + React Query; backed by `Citations`. Key pattern: `reference` (nanoid, in DOM) vs `id` (DB UUID, in API). → `readmes/HIGHLIGHTR.md`
- **Notifications** (`providers/Notifications/`) — React Query polling over `/api/notifications/*`. Public hook `useNotifications()` is a load-bearing contract. Phase B (SSE via `better-sse`) is queued, not active. → `readmes/NOTIFICATIONS.md`
- **Search** — Payload search plugin with composite scoring (priority + recency + richness) in `payload/search/calculateScore.ts`. API `/api/search?q=`; CMDK palette + `/search`.
- **Audio (Radio)** — Howler.js playback. Stream endpoint at `Radio/endpoints/stream.ts`; `RadioProvider.tsx`; UI in `components/content/Radio/` + `UX/TapePlayer/`.
- **Access (Locker plugin)** — role-based, collection + field level. Roles descending: `admin`, `cofounder`, `editor`, `author`, `patron`, `resident`, `user` (+ `guest` sentinel). `cofounder` sits in both `PAID_ROLES` (`resident`, `patron`, `cofounder`) and `STAFF_ROLES` (`editor`, `cofounder`, `admin`) by design.
- **Image Search plugin** — admin-side search across Unsplash/Pexels/Pixabay with LRU cache.
- **Provider SSR** — Device/Mobile/AMG hydrate after mount; `TransitionProvider` + `MiddleMan` are direct imports; TransitionManager is still client-gated. Do not bring back `ssr: false` wrappers.
- **Vault (`/vault`)** — Payload admin. Paint Payload CSS variables; custom work-queue home is interim. Bird’s-eye dashboard is deferred until admin is end-to-end functional. → `readmes/VAULT.md`
- **Settings / user shell** — `/me/settings` persistent rail + pane fade (`SHELL`). Convenience lanes: UserDropdown, SideDrawer, ⌘K. → `readmes/SETTINGS.md`
- **LOSTINSEOUL** — storefront under `src/lostinseoul/`. Naming, ecommerce, fragrance are separate docs. → `readmes/LOSTINSEOUL.md`
- **Ecommerce** — official `@payloadcms/plugin-ecommerce` owns catalog/cart/orders/transactions; warehouse ledger owns stock; membership and tickets stay separate. Phases 0–8 done; Phase 9 (nginx `/api/carts/` + `/api/payments/` on the LOST host, then PortOne **sandbox**) is next. → `readmes/ECOMMERCE.md`

### Docs map

One file per scope. Session dumps belong in `.attic/`, not here.

| Scope | File |
|---|---|
| This operating brief | `AGENTS.md` → `CLAUDE.md` (symlink pair) |
| Copy | `readmes/VOICE.md` |
| Visual / interaction | `readmes/DESIGN_SYSTEM.md` |
| Settings + user shell | `readmes/SETTINGS.md` |
| Vault | `readmes/VAULT.md` |
| LOSTINSEOUL storefront | `readmes/LOSTINSEOUL.md` |
| Catalog / cart / orders | `readmes/ECOMMERCE.md` |
| Fragrance chapter | `readmes/LOSTINSEOUL_FRAGRANCE.md` |
| Highlightr | `readmes/HIGHLIGHTR.md` |
| Notifications | `readmes/NOTIFICATIONS.md` |
| Tour | `readmes/TOUR.md` |
| Migrations | `readmes/MIGRATIONS.md` |
| Deploy / launch / ops | `readmes/DEPLOY.md`, `GOING_PUBLIC.md`, `SERVER_HARDENING.md` |
| Auth provider approval | `readmes/OAUTH_APPROVAL_FORM.md` |
| Email | `readmes/BREVO_SETUP.md` |
| Type backlog | `readmes/TYPE_DEBT.md` |

### Open work

1. Vault e2e list / edit / publish / preview. Not the bird’s-eye dashboard.
2. Ecommerce Phase 9 (`readmes/ECOMMERCE.md`) — staging prove, nginx allowlist, PortOne sandbox. Not a production dashboard click. Storefront WebGL/CSS leftovers are a separate lane (`readmes/LOSTINSEOUL.md`).
3. Settings Controlbar back-link, ⌘K context suggestions, `/me/posts` table controls.
4. Notifications Phase B (SSE). Polling stays until that ships.
5. Type debt, incrementally, post-launch.

---

## Authentication

Better Auth 1.7 integrated with Payload. First-party screens in
`src/components/auth/` — do not reintroduce vendored betterauth-ui. Kakao and
Naver live in `socialProviders` (`signIn.social({ provider })`). Also:
email/password, Google, Passkeys (WebAuthn), TOTP 2FA. Routes at
`/api/auth/[...all]`. Cookie session, server-validated via `payload.betterAuth`.
Client hook: `useRPSession`. On init, seeds a `concierge` admin if none exists.
Dev-only auth lab: `src/lib/auth/dev/lab/`.

---

## Routing

**URL rewrites:** `/@:user/essays/:slug` → `/essays/:slug` · `/@:user/:path*` → `/users/:user/:path*`

**Route groups:** `(pages)` static · `(content)` dynamic/slug · `(auth)` auth flows · `(payload)` admin at `/vault`

**Middleware:** CORS for `NEXT_PUBLIC_SERVER_URL`; IE detection → incompatibility redirect.

---

## Database & Migrations

Drizzle via `@payloadcms/db-postgres`. UUID (v7) IDs. Pool max 350. Schema push disabled (`push: false`) — always migrate. Scripts: `pnpm migrate`, `migrate:fresh`, `micreate`, `generate:types`.

Two rules: **(1)** backward compat is a non-factor (DB is wipeable); **(2)** every migration must be idempotent — guard every `CREATE`/`DROP`/`ALTER`/`UPDATE` at every level (tables, columns, indices, sequences, enums, constraints, FKs, triggers, types). And **mirror Payload's schema shape exactly, quirks included** — override only if the site is otherwise inoperable.

Full procedure, templates, FK-drop ordering: **`readmes/MIGRATIONS.md`**.

---

## Development

```bash
pnpm dev              # dev server (Turbopack)
pnpm dev:pgstart      # start PostgreSQL Docker container
pnpm dev:init         # DB + migrate + dev
pnpm build
pnpm generate:types   # → src/types/payload-types.ts (run after schema changes)
pnpm generate:schema
pnpm lint · pnpm format
```

Docker-based deploy (dev/prod.Dockerfile) behind Nginx. → `readmes/DEPLOY.md`.

### File conventions

- `page.tsx` — server component (data fetch, auth, redirects)
- `page.client.tsx` — client component (default export, receives server props)
- `actions.ts` — `"use server"`, co-located with the collection it serves
- Collections in `src/payload/collections/`; subdirs for hooks/endpoints/actions

---

## Code Archaeology

Two directories sit outside `src/`, excluded from the production build.

- **`.attic/` — archived dormant code.** **Never `rm` a file — always `pnpm attic <path>`** (mirrors the source path). Gitignored local stash; excluded from Docker + tsconfig, so type errors inside don't hit CI. Role and usage: `scripts/attic.sh` and this section.
- **`reference/` — optional local-only study/benchmark code.** Git-ignored external material for reading/porting only,
  never imported by production. When ready to use, port into `src/` properly — don't import directly.

**Type debt:** deferred post-launch. `typescript.ignoreBuildErrors: true` keeps the build green. Backlog in **`readmes/TYPE_DEBT.md`**. Count: `pnpm tsc --noEmit 2>&1 | grep "error TS" | wc -l`.

---

## Localization (next-intl)

**next-intl is the single source of locale and of every user-facing string. No parallel stores. No exceptions.**

1. **Every user-facing string lives in `messages/*.json`.** No `KO_*`/`EN_*` label constants, no
   `{ slug, label, description }` alongside structural data, no inline `isKo ? "한글" : "English"` ternaries.
2. **No parallel locale stores anywhere** — including `src/constants/*`. If a value varies by locale, it goes in `messages/`. The `*Ko`/`*En` fields in `BUSINESS` are deprecated; don't add new locale-pair fields outside `messages/`.
3. **Locale detection (`useLocale`/`getLocale`) is for HTML attributes only** (`lang={locale}` for screen readers / fonts). Branching content on locale is what `t()` is for.

The failure mode to never reintroduce: a second locale store dressed as convenience — a KO string beside an EN string in a constants file with an `isKo` switch picking between them at the call site. Every label tweak then means two edits; every new locale, a third field.

**Reading translations:** client → `useTranslations("NS")`; server / action → `await getTranslations("NS")`. Scope to
the deepest namespace the call site reads. Structural files hold slugs + ordering only; labels and descriptions are
fetched per-call by translating against the slug.

**Adding a key:** add it to `en.json` and `ko.json` in the same diff. Missing keys fail loudly (`MISSING_MESSAGE`).

**Canonical examples:** `core/LegalFooter/LegalFooter.tsx` (server, nested NS) · `UX/Settings/SettingsRail.tsx` + `sections.ts` (client, slug list → translated labels) · `(auth)/me/settings/general/page.client.tsx` (full-page shape).

### Copy

`readmes/VOICE.md` is the source of truth for user-facing text.

- Default to standard, compact, neutral language in every locale.
- Do not add style unless the user explicitly requests it for the specific copy.
- Do not invent explanations, reasons, promises, timelines, reassurance, or future behavior.
- Visual or brand direction does not authorize stylized writing.
- Use ordinary content names: `title`, `headline`, `subtitle`, `description`, `label`, `caption`, `body`, and
  `helperText`.
- Do not introduce publishing jargon such as `eyebrow`, `lede`, `dek`, `blurb`, `kicker`, or `colophon`. Existing
  occurrences are legacy identifiers, not conventions.

---

## State Management

| Concern                          | Where                                 | Tool                  |
| -------------------------------- | ------------------------------------- | --------------------- |
| UI (sidebar, viewport, theme)    | `stores/RP_Ui.ts`                     | Zustand               |
| Device / Cursor / Notification / Routing | `stores/*/`                   | Zustand               |
| Server data (fetch, cache)       | components/hooks                      | React Query           |
| Auth session                     | `providers/Session/`                  | Context               |
| Theme                            | `providers/Theme/`                    | next-themes + Context |
| Highlightr citations             | `components/UX/Highlightr/providers/` | Zustand + Context     |

Use `useShallow` on Zustand selectors when selecting Map/object values.

Every frontend page (server or client) wraps its rendered content in `<RPage>` for transitions and page-state bookkeeping.

---

## Design System

The Hideaway uses a sparse, typography-first visual system. References: Fey (color/direction), Medium (hierarchy),
Longblack.co, metalab.com, Awwwards, jonway.studio. These references govern visual design only, not copy style.

> Everything below is a **point of reference, not binding enforcement** — class names, structure, and direction are starting points. Pick the role that fits the surface.

### Layout & responsive

```tsx
<div className="px-6 xl:px-10">   // standard page container
<div className="mx-auto px-6">    // narrow (prose / forms)
<section className="w-full">      // full-bleed (heroes, banners)
```

Mobile-first. Grid column targets (sm/md/lg/xl/2xl):

| Content                              | sm | md | lg | xl | 2xl |
|--------------------------------------|----|----|----|----|-----|
| Content cards (posts, surf, profile) | 1  | 2  | 3  | 4  | 4   |
| Music / square tiles                 | 2  | 3  | 4  | 5  | 6   |
| Compilation cards (premium 4:3)      | 1  | 2  | 3  | 4  | 4   |
| Compilation cards (free 16:9)        | 1  | 2  | 3  | 3  | 4   |
| Detail item grid (premium)           | 2  | 3  | 4  | 5  | 6   |

Gaps: `gap-4 xl:gap-5` standard · `gap-5 xl:gap-6` larger cards.

### Typography

Four faces, used deliberately — never all four on one screen.

| Face                     | When                                                                                                            | Weight pairing                                                 |
|--------------------------|-----------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| **Serif** (`font-serif`) | Marketing and hero surfaces                                                                                     | `font-bold` headlines; `font-medium` body                      |
| **Sans** (`font-sans`)   | Focused content & admin — settings, vault, reading, dashboards                                                  | `font-light` display; `font-medium` labels; `font-normal` body |
| **Wide** (`font-wide`)   | Section headers and large ticker labels                                                                         | `font-bold`/`font-black`                                       |
| **Mono** (`font-mono`)   | Sparingly — metadata labels, bylines, captions, tabular numerals, code. **Not** the default for admin/settings. |                                                                |

Rule of thumb: settings/vault = mostly sans, lightly seasoned with mono. Marketing/hero = serif or wide.

**Scale ramps.** `text-6xl` is the desktop floor for page heroes (mobile may step to `text-5xl` only on genuine overflow at narrow widths — heroes stay big).

```tsx
// Page hero                text-6xl md:text-7xl 2xl:text-8xl font-light tracking-tight
// Page hero, serif         text-6xl md:text-7xl 2xl:text-8xl font-serif font-bold tracking-tight
// Page section heading      text-3xl xl:text-4xl 2xl:text-5xl font-light tracking-tight
// Sub-section / detail       text-2xl xl:text-3xl 2xl:text-4xl font-light tracking-tight
// Nav label (sans, active)   text-sm font-medium tracking-tight
// Metadata label (mono)      font-sans text-[10px] uppercase tracking-[0.2em] xl:text-xs
// Tabular metadata (mono)    font-sans text-[10px] tabular-nums xl:text-[11px]
// Card title                 text-base font-medium leading-snug tracking-tight xl:text-lg
// Prose body                 text-base font-normal leading-relaxed
```

### Color & opacity

On neutral `foreground`/`background` tokens, prefer **opacity as the tonal tool** over introducing a new color.

```tsx
text-foreground · /70 secondary · text-muted-foreground · /60 metadata · /40 ghost
border-border/20 subtle · /30 divider · /50 hover
bg-card · bg-muted/20 placeholder · bg-background/80 overlay · /90 sticky header
```

**Legibility floor.** Opacity is tonal, but readable text must clear the contrast floor. Below it, an element is decorative-only (watermarks, ghost symbols, grain) — never copy a user is meant to read.

| Tier                                  | Purpose                              | Min (dark) | Min (light) |
|---------------------------------------|--------------------------------------|------------|-------------|
| **Body**                              | Sentences, form values, descriptions | `/65`      | `/65`       |
| **UI label / metadata**               | Mono-caps labels and counts          | `/55`      | `/60`       |
| **Secondary headline / inactive nav** | De-emphasized but still readable     | `/45`      | `/50`       |
| **Decorative only**                   | Watermarks, overlays, hover hints    | any        | any         |

Informative tiers target ≥ 4.5:1 (WCAG AA). Tempted by `/40`–`/30` for readable text → bump up a tier or commit to decorative (`aria-hidden`). Borders/dividers/shadow tints aren't text — not bound by the floor.

### Component anatomy

- **Cards:** `rounded-lg`, `border-border/20` (→ `/50` on hover). Image `aspect-*` locked + `overflow-hidden`, gradient overlay `to-background/60`, hover `scale(1.04)` `transition-transform duration-500`. Body `p-3.5 xl:p-4`. Optional footer for count / badge / menu.
- **Sticky header:** `sticky top-0 z-20 border-b border-border/30 bg-background/90 backdrop-blur-md`; inner
  `mx-auto px-6 py-5 xl:px-10`, flex `items-end justify-between` (label + h1 left, mono nav links right).
- **Hero (full-bleed):** `relative h-[55vh] w-full overflow-hidden`; cover image or gradient fallback; overlay
  `from-black/30 via-black/40 to-background`; content bottom-left in `max-w-7xl`. Initial-letter fallback
  `text-[20vw] font-sans font-light text-foreground/[0.04]`.
- **Empty state:** centered `py-24`; symbol `font-sans text-5xl opacity-10` (`◫` saved · `⊞` lists · `○` profiles);
  headline `text-base font-light text-foreground/70`; mono sub; bordered mono-caps CTA.
- **Forms:** borderless, bottom-border-only inputs (`border-b border-border/30 bg-transparent … focus:border-foreground/40`). Submit = bordered mono-caps button, no fill. Action communicated via weight/underline/border visibility, not fill color.

### Animation

Use Motion `motion/react` for hooks/methods and `<AnimatePresence/>`. **Import components as `import * as m from "motion/react-m";`** and use `<m.div/>` — never from the plain path.

```tsx
// Card entrance    initial {opacity:0, scale:0.97} → {1,1}  spring bounce 0.15 duration 0.35
// Stagger          delay: index * 0.04
// Page/tab         {opacity:0, y:8} → {1,0}  duration 0.22
// Panel/sheet      {x:"100%"} → {x:0}  spring bounce 0.05 duration 0.4
// Modal            {opacity:0, y:24} → {1,0}  spring bounce 0.15 duration 0.4
```

`LayoutGroup` + `layoutId` for tab indicators. Keep `bounce` 0.05–0.2.

### Role-based tiering & admin surfaces

Layout tiering by role, the three `Subscriptions` role-sync hooks, and the Fey admin-surface direction for
`/me/settings` + `/vault` moved to the **`admin-fey-surfaces`** skill (`.claude/skills/admin-fey-surfaces/SKILL.md`).
Load it before touching those surfaces or subscription/role logic.
