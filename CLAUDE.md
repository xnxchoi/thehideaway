# The Hideaway

## What This Is

An editorial platform and CMS on **Next.js 16 + Payload CMS + PostgreSQL** — Medium meets a private members' club: long-form essays, text highlighting/annotation, personal collections, music, and profiles, in a typographic-first monochrome aesthetic. Bilingual (en/ko), tiered access via user roles.

**Domain:** `hideawayseoul.com` · **Admin panel:** `/vault` · **Database:** `theestate`

---

## Tech Stack

| Layer          | Technology                                                                       |
| -------------- | -------------------------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router, Turbopack, React 19)                                     |
| CMS            | Payload CMS (latest) — custom collections, plugins, fields                       |
| Database       | PostgreSQL via Drizzle ORM (`@payloadcms/db-postgres`)                            |
| Auth           | Fork of Payload-Auth (Better Auth adapter) — email/pw, Google, Naver, passkeys, 2FA |
| Styling        | Tailwind CSS 4; SCSS modules in `/payload` for complex features                  |
| State (client) | Zustand + React Query (TanStack)                                                 |
| Animations     | Motion (Framer Motion) for UI; GSAP for scroll/timeline                          |
| 3D             | Three.js + React Three Fiber + Drei + Rapier                                     |
| Audio          | Howler.js + music-metadata                                                        |
| Rich text      | Lexical with custom features                                                      |
| i18n           | next-intl (locales: `en`, `ko`)                                                   |
| Email          | Nodemailer via Brevo SMTP                                                         |
| Images         | Sharp + Blurhash                                                                  |
| Validation     | Zod 4                                                                             |
| UI primitives  | BaseUI + shadcn/ui                                                                |
| IDs            | UUID v7 (Payload), nanoid (citations/references)                                 |

---

## Project Structure

```
src/
├── app/
│   ├── (frontend)/
│   │   ├── (site)/(pages)      Static pages (home, radio, plans, search…)
│   │   ├── (site)/(content)    Dynamic content (essays, surf, lists, users)
│   │   ├── (site)/(auth)       Login, signup, forgot-password
│   │   └── (dev)/              Dev-only utilities
│   ├── (payload)/              Payload admin → /vault
│   └── api/                    API routes (auth, search, notifications, image-courier)
├── payload/
│   ├── collections/            All Payload collections (see below)
│   ├── globals/                Header, Footer
│   ├── plugins/                locker, membership, image-search, search, tag, likes
│   ├── fields/                 Custom field types (slug, handle, image, rich text, estate)
│   ├── Lexical/                Rich text editor config + custom features
│   └── search/                 Search scoring logic
├── lib/
│   ├── auth/payload-auth/      Better Auth ↔ Payload integration
│   ├── migrations/             Drizzle migration files
│   └── actions/auth.ts         Auth server actions
├── providers/                  React context (Session, Theme, Query, Radio)
├── stores/                     Zustand (RP_Ui, Device, Cursor, Notification, Routing)
├── components/
│   ├── UX/                     Interactive: Radio, TapePlayer, Highlightr, CommandKey…
│   ├── core/                   Layout primitives (Link, Media, Main)
│   ├── three/ · ui/ · sections/
├── hooks/ · styles/ · utilities/ · types/ · constants/ · i18n/ · access/

messages/                       i18n JSON (en.json, ko.json)
readmes/                        Feature dev docs (HIGHLIGHTR.md, NOTIFICATIONS.md…)
nginx/ · postgres/
```

`payload-types.ts` is auto-generated — never edit by hand.

---

## Payload CMS Collections

- **Content:** Posts (essays), Surf (short-form), Pages, Series/SeriesItem/SeriesSubmission, Categories, Tags
- **Users & Social:** Users, Profile, Follows, Bookmarks, Comments, Notifications (SSE), UserViews, Citations (Highlightr), Compilations/CompiledCompilations
- **Media:** Media, UserMedia, Assets
- **Audio (Radio):** Albums, Tracks, Playlists (+ stream endpoint)
- **Commerce:** Products, ProductCategory, Plans, Prices, Subscriptions, Invoices, Coupons, FXRate, Holidays
- **System:** Admins (deprecated), DeferredEmails, EmailQuota, Sessions/Accounts + other Better Auth entities

---

## Key Subsystems

Read the matching `readmes/*.md` before working on any of these.

- **Highlightr** (`components/UX/Highlightr/`) — post-exclusive text annotation. Rangy + floating-ui + Zustand + React Query; backed by `Citations`. Key pattern: `reference` (nanoid, in DOM) vs `id` (DB UUID, in API). → `readmes/HIGHLIGHTR.md`
- **Notifications** (`providers/Notifications/`) — React Query polling over `/api/notifications/*`. Public hook `useNotifications()` is a load-bearing contract. Phase B (SSE via `better-sse`) is queued, not active. → `readmes/NOTIFICATIONS.md`
- **Search** — Payload search plugin with composite scoring (priority + recency + richness) in `payload/search/calculateScore.ts`. API `/api/search?q=`; CMDK palette + `/search`.
- **Audio (Radio)** — Howler.js playback. Stream endpoint at `Radio/endpoints/stream.ts`; `RadioProvider.tsx`; UI in `components/content/Radio/` + `UX/TapePlayer/`.
- **Access (Locker plugin)** — role-based, collection + field level. Roles descending: `admin`, `cofounder`, `editor`, `author`, `patron`, `resident`, `user` (+ `guest` sentinel). `cofounder` sits in both `PAID_ROLES` (`resident`, `patron`, `cofounder`) and `STAFF_ROLES` (`editor`, `cofounder`, `admin`) by design.
- **Image Search plugin** — admin-side search across Unsplash/Pexels/Pixabay with LRU cache.

---

## Authentication

Better Auth integrated with Payload. Providers: email/password, Google, Naver, Passkeys (WebAuthn), TOTP 2FA. Routes at `/api/auth/[...all]`. Cookie session, server-validated via `payload.betterAuth`. Client hook: `useRPSession`. On init, seeds a `concierge` admin if none exists.

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

Docker-based deploy (dev/prod.Dockerfile) behind Nginx. → `readmes/DEPLOYMENT.md`.

### File conventions

- `page.tsx` — server component (data fetch, auth, redirects)
- `page.client.tsx` — client component (default export, receives server props)
- `actions.ts` — `"use server"`, co-located with the collection it serves
- Collections in `src/payload/collections/`; subdirs for hooks/endpoints/actions

---

## Code Archaeology

Two directories sit outside `src/`, excluded from the production build.

- **`.attic/` — archived dormant code.** **Never `rm` a file — always `pnpm attic <path>`** (mirrors the source path). Git-tracked; excluded from Docker + tsconfig, so type errors inside don't hit CI.
- **`reference/` — study/benchmark code.** Foreign code for reading/porting only, never imported by production. Own `reference/tsconfig.json` (`strict: false`). When ready to use, port into `src/` properly — don't import directly.

**Type debt:** ~537 TS errors deferred post-launch. `typescript.ignoreBuildErrors: true` keeps the build green. Backlog + fix order in **`readmes/TYPE_DEBT.md`**. Count: `pnpm tsc --noEmit 2>&1 | grep "error TS" | wc -l`.

---

## Localization (next-intl)

**next-intl is the single source of locale and of every user-facing string. No parallel stores. No exceptions.**

1. **Every user-facing string lives in `messages/*.json`.** No `KO_*`/`EN_*` label constants, no `{ slug, label, blurb }` alongside structural data, no inline `isKo ? "한글" : "English"` ternaries.
2. **No parallel locale stores anywhere** — including `src/constants/*`. If a value varies by locale, it goes in `messages/`. The `*Ko`/`*En` fields in `BUSINESS` are deprecated; don't add new locale-pair fields outside `messages/`.
3. **Locale detection (`useLocale`/`getLocale`) is for HTML attributes only** (`lang={locale}` for screen readers / fonts). Branching content on locale is what `t()` is for.

The failure mode to never reintroduce: a second locale store dressed as convenience — a KO string beside an EN string in a constants file with an `isKo` switch picking between them at the call site. Every label tweak then means two edits; every new locale, a third field.

**Reading translations:** client → `useTranslations("NS")`; server / action → `await getTranslations("NS")`. Scope to the deepest namespace the call site reads. Structural files hold slugs + ordering only; labels/blurbs are fetched per-call by translating against the slug.

**Adding a key:** add it to `en.json` and `ko.json` in the same diff. Missing keys fail loudly (`MISSING_MESSAGE`).

**Canonical examples:** `core/LegalFooter/LegalFooter.tsx` (server, nested NS) · `UX/Settings/SettingsRail.tsx` + `sections.ts` (client, slug list → translated labels) · `(auth)/me/settings/general/page.client.tsx` (full-page shape).

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

The Hideaway is editorial with a quiet, typographic-first aesthetic — *sparse, intentional, typographically confident*; features feel discovered, not advertised. References: Fey (color/direction), Medium (hierarchy), Longblack.co, metalab.com, Awwwards, jonway.studio.

> Everything below is a **point of reference, not binding enforcement** — class names, structure, and direction are starting points. Pick the role that fits the surface.

### Layout & responsive

```tsx
<div className="px-6 xl:px-10">   // standard page container
<div className="mx-auto px-6">    // narrow (prose / forms)
<section className="w-full">      // full-bleed (heroes, banners)
```

Mobile-first. Grid column targets (sm/md/lg/xl/2xl):

| Content                                   | sm | md | lg | xl | 2xl |
| ----------------------------------------- | -- | -- | -- | -- | --- |
| Editorial cards (posts, surf, profile)    | 1  | 2  | 3  | 4  | 4   |
| Music / square tiles                      | 2  | 3  | 4  | 5  | 6   |
| Compilation cards (premium 4:3)           | 1  | 2  | 3  | 4  | 4   |
| Compilation cards (free 16:9)             | 1  | 2  | 3  | 3  | 4   |
| Detail item grid (premium)                | 2  | 3  | 4  | 5  | 6   |

Gaps: `gap-4 xl:gap-5` standard · `gap-5 xl:gap-6` larger cards.

### Typography

Four faces, used deliberately — never all four on one screen.

| Face                     | When                                                                 | Weight pairing                          |
| ------------------------ | -------------------------------------------------------------------- | --------------------------------------- |
| **Serif** (`font-serif`) | Theatrical/selling surfaces — marketing, hero spotlights, CX moments | `font-bold` headlines; `font-medium` body |
| **Sans** (`font-sans`)   | Focused content & admin — settings, vault, reading, dashboards       | `font-light` display; `font-medium` labels; `font-normal` body |
| **Wide** (`font-wide`)   | Editorial weight without serif — section headers, big ticker labels  | `font-bold`/`font-black`                 |
| **Mono** (`font-mono`)   | Sparingly — editorial chrome (eyebrows, byline/caption meta), tabular numerals, code. **Not** the default for admin/settings. |  |

Rule of thumb: settings/vault = mostly sans, lightly seasoned with mono. Marketing/hero = serif or wide.

**Scale ramps.** `text-6xl` is the desktop floor for page heroes (mobile may step to `text-5xl` only on genuine overflow at narrow widths — heroes stay big).

```tsx
// Page hero                text-6xl md:text-7xl 2xl:text-8xl font-light tracking-tight
// Page hero, serif         text-6xl md:text-7xl 2xl:text-8xl font-serif font-bold tracking-tight
// Page section heading      text-3xl xl:text-4xl 2xl:text-5xl font-light tracking-tight
// Sub-section / detail       text-2xl xl:text-3xl 2xl:text-4xl font-light tracking-tight
// Nav label (sans, active)   text-sm font-medium tracking-tight
// Editorial eyebrow (mono)   font-mono text-[10px] uppercase tracking-[0.2em] xl:text-xs
// Tabular metadata (mono)    font-mono text-[10px] tabular-nums xl:text-[11px]
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

| Tier                                  | Purpose                                              | Min (dark) | Min (light) |
| ------------------------------------- | ---------------------------------------------------- | ---------- | ----------- |
| **Body**                              | Sentences, form values, descriptions                 | `/65`      | `/65`       |
| **UI label / metadata**               | Mono-caps labels, eyebrows, counts                   | `/55`      | `/60`       |
| **Secondary headline / inactive nav** | De-emphasized but still readable                     | `/45`      | `/50`       |
| **Decorative only**                   | Watermarks, ghosts, atmospheric overlays, hover hints | any        | any         |

Informative tiers target ≥ 4.5:1 (WCAG AA). Tempted by `/40`–`/30` for readable text → bump up a tier or commit to decorative (`aria-hidden`). Borders/dividers/shadow tints aren't text — not bound by the floor.

### Component anatomy

- **Cards:** `rounded-lg`, `border-border/20` (→ `/50` on hover). Image `aspect-*` locked + `overflow-hidden`, gradient overlay `to-background/60`, hover `scale(1.04)` `transition-transform duration-500`. Body `p-3.5 xl:p-4`. Optional footer for count / badge / menu.
- **Sticky header:** `sticky top-0 z-20 border-b border-border/30 bg-background/90 backdrop-blur-md`; inner `mx-auto px-6 py-5 xl:px-10`, flex `items-end justify-between` (eyebrow + h1 left, mono nav links right).
- **Hero (full-bleed):** `relative h-[55vh] w-full overflow-hidden`; cover image or gradient fallback; overlay `from-black/30 via-black/40 to-background`; content bottom-left in `max-w-7xl`. Initial-letter fallback `text-[20vw] font-mono font-light text-foreground/[0.04]`.
- **Empty state:** centered `py-24`; symbol `font-mono text-5xl opacity-10` (`◫` saved · `⊞` lists · `○` profiles); headline `text-base font-light text-foreground/70`; mono sub; bordered mono-caps CTA.
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

### Role-based layout tiering

Premium (`patron`, `author`, `editor`, `admin`) get editorial-grade layouts (more columns, 4:3 overlay cards, denser display); free (`user`) get standard (16:9, title below image).

```tsx
const isPremium = (role: string) =>
  ["patron", "author", "editor", "admin"].includes(role);
```

Role is driven by Subscription state via three coordinated `Subscriptions` hooks:

- `autoActivateOnPaid` (beforeChange) — admin checks `paid` on a `pending` row → status `active` + stamps `expires_at` from plan validity (yearly → +1y; lifetime → null).
- `syncRoleAfterSubscriptionChange` (afterChange) — on `pending→active`, promotes `user.role` to the plan tier (`resident`/`patron`/`cofounder`); on `active→inactive`, re-derives from remaining active subs (highest wins, else `user`). Staff roles (`STAFF_ROLES`) are never touched.
- `issueInvoiceOnPaid` (afterChange) — issues an Invoice once per sub via the `invoice_number_seq` counter.

Admin overrides survive: explicit `expires_at` writes and manual `subscription_status` writes (e.g. `canceled`) bypass auto-activation.

### Admin surfaces — Fey direction

`(auth)/me/settings/*`, `(payload)/vault/*`, and future "operating-room" surfaces follow the **Fey direction** (Fey.com lifted-dark-panel chrome, adapted to a sans-leaning admin tone). Everything outside those paths stays in the editorial-mono direction above.

- **Canvas:** near-uniform deep-luminance (`oklch(8–10% 0 0)` dark / near-paper light). The expensive feel is the uniformity. Optional very low-intensity warm radial bleed or grain (`/[0.02]`–`/[0.04]`); when in doubt, leave uniform.
- **Architecture (xl+):** 3 columns — nav rail (`~232px`, `TableOfContents` mode="route" labelStyle="sans", no panel behind it) · main canvas (`1fr`, vertical Panel stack) · optional companion column (`~360–420px`, lazy Plaque). Below `lg`: rail becomes an iOS-style index page; companion → typographic member block.
- **Panels:** lifted dark pools, not flat. `rounded-2xl` outer, no borders — luminance gradient + shadow do the work: `bg-foreground/[0.04] dark:bg-foreground/[0.05]`, top-edge inner highlight via `before:` gradient hairline, outer `shadow-[0_2px_24px_-8px_rgba(0,0,0,0.4)]`. Inset rows step down to `rounded-lg` (two-step radius so pills don't read as nested cards).
- **Internal composition:** 2-column grid — left description, right controls: `grid gap-x-12 gap-y-8 p-7 xl:p-9 xl:grid-cols-[minmax(220px,5fr)_minmax(0,7fr)]`. Uses horizontal space without center-narrowing.
- **Row pills:** self-contained inset pills, never divider lines — `rounded-lg px-4 py-3 bg-foreground/[0.025]` + `before:` hairline; icon `size-4 text-foreground/55` + label left, control right.
- **Category tokens (admin-only):** small ~28px colored icon tile as section identity, each color used once per surface, never on body text or button fills:
  ```css
  --cat-account: oklch(72% 0.10 50);   /* warm orange */
  --cat-options: oklch(60% 0.12 280);  /* muted purple */
  --cat-support: oklch(70% 0.14 160);  /* soft green */
  --cat-billing: oklch(60% 0.18 25);   /* ember red */
  --cat-data:    oklch(75% 0.04 90);   /* bone neutral */
  ```
- **Field affordance tiers** — communicated by component, not inline input styling: `<LockedField>` (value + trailing lock glyph `/35`) · `<EditableField>` (read-only at rest; hover reveals underline + pencil; click → inline input) · `<ToggleField>` (switch/radio, inset focus ring) · `<ActionField>` (pill → modal for pw/2FA/passkey/sign-out). The signature interaction is **deferred edit**: rows look read-only at rest, reveal editability on hover, become inputs only on click.
- **Status object:** the **Plaque** (titanium membership plate on a lanyard) — `components/layouts/Registration/MembershipBadge.tsx`. `BADGE` (full physics + drag) at registration · `PLATE` (idle drift, static name) on settings overview xl+ · none on mobile. Loaded behind `useInView` + Suspense + static-PNG fallback; never on mobile, never above-the-fold without lazy gating.
- **Layout:** `/me/settings` overview (2-pane) for non-sensitive groups; sensitive items get dedicated routes (`/security`, `/passkeys`, `/connected`, `/subscriptions`). Mobile (`<lg`): `/me/settings` is an iOS-style index; tapping a row navigates to `/me/settings/[section]`.
