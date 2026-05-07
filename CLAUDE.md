# The Hideaway

## What This Is

An editorial platform and content management system built on **Next.js 16 + Payload CMS + PostgreSQL**. Think Medium meets a private members' club: users read long-form essays, highlight and annotate text, curate personal collections, listen to music, and manage profiles — all wrapped in a typographic-first, monochrome aesthetic.

The platform is bilingual (English / Korean) and supports tiered access via user roles.

**Domain:** `hideawayseoul.com`
**Admin panel:** `/vault`
**Database name:** `theestate`

---

## Tech Stack

| Layer          | Technology                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Framework      | Next.js 16 (App Router, Turbopack, React 19)                                                           |
| CMS            | Payload CMS (latest) with custom collections, plugins, fields                                          |
| Database       | PostgreSQL via Drizzle ORM (`@payloadcms/db-postgres`)                                                 |
| Auth           | Fork of Payload-Auth, a Payload Adapter for Better Auth — email/password, Google, Naver, passkeys, 2FA |
| Styling        | Tailwind CSS 4; /payload directory additionally uses SCSS modules for complex features                 |
| State (client) | Zustand stores + React Query (TanStack)                                                                |
| Animations     | Motion (Framer Motion) for UI; GSAP for scroll/timeline                                                |
| 3D             | Three.js + React Three Fiber + Drei + Rapier (physics)                                                 |
| Audio          | Howler.js + music-metadata for parsing                                                                 |
| Rich text      | Lexical (Payload's editor) with custom features                                                        |
| i18n           | next-intl (locales: `en`, `ko`)                                                                        |
| Email          | Nodemailer via Brevo SMTP                                                                              |
| Images         | Sharp for optimization, Blurhash for placeholders                                                      |
| Validation     | Zod 4                                                                                                  |
| UI primitives  | BaseUI + shadcn/ui                                                                                     |
| IDs            | UUID v7 (Payload), nanoid (citations/references)                                                       |

---

## Project Structure

```
src/
├── app/
│   ├── (frontend)/
│   │   ├── (site)/
│   │   │   ├── (pages)/          Static pages (home, radio, plans, search, privacy...)
│   │   │   ├── (content)/        Dynamic content (essays, surf, lists, users)
│   │   │   └── (auth)/           Login, signup, forgot-password
│   │   └── (dev)/                Dev-only utilities
│   ├── (payload)/                Payload admin → /vault
│   └── api/                      API routes (auth, search, notifications, image-courier)
│
├── payload/
│   ├── collections/              All Payload collections (see below)
│   ├── globals/                  Header, Footer
│   ├── plugins/                  locker, membership, image-search, search, tag, likes
│   ├── fields/                   Custom field types (slug, handle, image, rich text, estate)
│   ├── Lexical/                  Rich text editor config + custom features (mentions, etc.)
│   └── search/                   Search scoring logic
│
├── lib/
│   ├── auth/payload-auth/        Better Auth ↔ Payload integration
│   ├── migrations/               Drizzle migration files
│   └── actions/auth.ts           Auth server actions
│
├── providers/                    React context (Session, Theme, Query, Radio)
├── stores/                       Zustand stores (RP_Ui, Device, Cursor, Notification, Routing)
├── components/
│   ├── UX/                       Interactive: Radio, TapePlayer, Highlightr, CommandKey, Cursor, Tour
│   ├── core/                     Layout primitives (Link, Media, Main)
│   ├── three/                    Three.js components (meshline)
│   ├── ui/                       shadcn/ui components
│   └── sections/                 Page sections
│
├── hooks/                        Custom React hooks
├── styles/                       Global CSS/SCSS (globals.css, hideaway.scss, reading.scss)
├── utilities/                    Helpers (getURL, getMeUser, getMediaUrl, Helpers.ts)
├── types/                        TypeScript types (payload-types.ts is auto-generated)
├── constants/                    API endpoints, animation values, localStorage keys
├── i18n/                         Locale config
└── access/                       Access control helpers

messages/                         i18n JSON files (en.json, ko.json)
readmes/                          Feature dev docs (HIGHLIGHTR.md, SSE_NOTIFICATIONS.md, etc.)
nginx/                            Reverse proxy config
postgres/                         DB Docker setup + nanoid SQL extension
```

---

## Payload CMS Collections

### Content
- **Posts** — Long-form essays with rich text, media, categories, tags
- **Surf** — Shorter-form content (trend/wave articles)
- **Pages** — Static/marketing pages
- **Series / SeriesItem / SeriesSubmission** — Multi-part content series
- **Categories, Tags** — Taxonomy

### Users & Social
- **Users** — Accounts with roles, profiles, locales, versioning
- **Profile** — Public-facing user profiles
- **Follows** — User follow relationships
- **Bookmarks** — Saved content
- **Comments** — Content comments
- **Notifications** — Real-time (SSE) notifications
- **UserViews** — Analytics tracking
- **Citations** — Highlight/annotation system (Highlightr)
- **Compilations / CompiledCompilations** — Curated content lists** ### Media
- **Media** — User uploads + some general use cases
- **UserMedia** — User uploads
- **Assets** — System-level files

### Audio (Radio)
- **Albums, Tracks, Playlists** — Full music system with stream endpoint

### Commerce
- **Products, ProductCategory, Plans, Prices, Subscriptions** — Membership tiers
- **Invoices** — PDF generation via pdfmake
- **Coupons, FXRate, Holidays** — Pricing support

### System
- **Admins** — Admin users (separate from Users, deprecated; left for compatibility)
- **DeferredEmails, EmailQuota** — Email queue and rate limiting
- **Sessions, Accounts, and other non-Payload collections **  — most are Payload Auth implementations of Better Auth entities

---

## Key Subsystems

### Highlightr (Text Annotation)
Post-exclusive, user-driven content interaction layer.
Users can highlight text, add memos (public, 200 char), private notes, and share selections. Full dev reference: `readmes/HIGHLIGHTR.md`.

- **Stack:** Rangy (selection) + floating-ui (menus) + Zustand (state) + React Query (data)
- **Backend:** `Citations` collection with access control
- **Key pattern:** `reference` (nanoid, used in DOM) vs `id` (DB UUID, used in API)
- **Location:** `src/components/UX/Highlightr/`

### Real-Time Notifications (SSE) * unimplemented*
Server-Sent Events replace polling. Full reference: `readmes/SSE_NOTIFICATIONS.md`.

- **Endpoint:** `/api/notifications/stream`
- **Hook:** `useNotificationSSE.ts`
- **Fallback:** HTTP polling when SSE unavailable
- **Hooks:** Payload collection hooks trigger SSE broadcasts on CRUD

### Search
Payload's search plugin with custom composite relevance scoring (priority + recency + richness).

- **API:** `/api/search?q=query&limit=20`
- **Scoring:** `src/payload/search/calculateScore.ts`
- **UI:** CMDK command palette + `/search` page

### Audio (Radio)
Music playback via Howler.js. Albums, tracks, and playlists with a cassette tape player UI.

- **Stream:** Payload custom endpoint at `/Radio/endpoints/stream.ts`
- **Provider:** `RadioProvider.tsx`
- **UI:** `src/components/content/Radio/`, `src/components/UX/TapePlayer/`

### Access Control (Locker Plugin)
Role-based access at collection and field level. Roles: `admin`, `editor`, `author`, `patron`,`member`, `user`.

### Image Search Plugin
Admin-side image search across Unsplash, Pexels, Pixabay with LRU caching.

---

## Authentication

- **Framework:** Better Auth integrated with Payload CMS
- **Providers:** Email/password, Google OAuth, Naver OAuth, Passkeys (WebAuthn), TOTP 2FA
- **Routes:** `/api/auth/[...all]` (Better Auth catch-all)
- **Session:** Cookie-based, server-validated via `payload.betterAuth`
- **Hook:** `useRPSession` for client-side session access
- **Admin seed:** On init, creates a `concierge` admin user if none exists

---

## Routing

### URL Rewrites
- `/@:user/essays/:slug` → `/essays/:slug`
- `/@:user/:path*` → `/users/:user/:path*`

### Route Groups
- `(frontend)/(site)/(pages)/` — Static pages
- `(frontend)/(site)/(content)/` — Dynamic content with slugs
- `(frontend)/(site)/(auth)/` — Auth flows
- `(payload)/` — Admin panel at `/vault`

### Middleware
- CORS headers for `NEXT_PUBLIC_SERVER_URL`
- IE browser detection → incompatibility redirect

---

## Database & Migrations

- **ORM:** Drizzle via `@payloadcms/db-postgres`
- **ID type:** UUID (v7)
- **Pool:** Max 350 connections
- **Migrations:** `src/lib/migrations/` — run via `pnpm migrate`
- **Schema push disabled** (`push: false`) — always use migrations
- **Scripts:** `pnpm migrate`, `pnpm migrate:fresh`, `pnpm micreate`, `pnpm generate:types`

---

## Development

### Scripts
```bash
pnpm dev              # Start dev server (Turbopack)
pnpm dev:pgstart      # Start PostgreSQL Docker container
pnpm dev:init         # Start DB + migrate + run dev
pnpm build            # Production build
pnpm generate:types   # Regenerate Payload types → src/types/payload-types.ts
pnpm generate:schema  # Generate DB schema
pnpm lint             # ESLint
pnpm format           # Prettier
```

### Deployment
Docker-based (dev.Dockerfile, prod.Dockerfile) behind Nginx reverse proxy. Full guide: `readmes/DEPLOYMENT.md`.

### Feature Dev Docs
Cross-session continuity documents for complex subsystems live in `readmes/`:
- `HIGHLIGHTR.md` — Text annotation system (architecture, iteration log, known issues)
- `SSE_NOTIFICATIONS.md` — Real-time notification architecture
- `SSE_SECURITY_GUIDE.md` — SSE security considerations
- `DEPLOYMENT.md` — Docker deployment guide
- `BREVO_SETUP.md` — Email service setup
- `tour-flow/` — Onboarding tour development docs

**Read the relevant `readmes/*.md` file before working on any of these subsystems.**

---

## File Conventions

- `page.tsx` — Server component (data fetching, auth checks, redirects)
- `page.client.tsx` — Client component (default export, receives server-fetched props)
- `actions.ts` — Server actions (`"use server"`) co-located with the collection they serve
- Collections live in `src/payload/collections/`; subdirectories for hooks, endpoints, actions
- Types are auto-generated — run `pnpm generate:types` after collection schema changes
- `payload-types.ts` is the generated file — never edit manually

---

## Code Archaeology

Two special directories sit outside `src/` and are excluded from the production build.

### `.attic/` — Archived dormant code

Files that are removed from the active codebase but kept for recovery. **Never `rm` a file — always use `pnpm attic`.**

```bash
pnpm attic src/components/OldWidget.tsx          # single file
pnpm attic src/payload/collections/Delta         # whole directory
```

- Path structure is mirrored: `src/foo/bar.tsx` → `.attic/src/foo/bar.tsx`
- `.attic/` is **tracked by git** so the archive survives across clones
- Excluded from Docker image via `.dockerignore`
- Excluded from `tsconfig.json` via `"exclude": [".attic/**"]`
- Type errors inside `.attic/` do not affect CI

### `reference/` — Study/benchmark code

Foreign code ripped in from external projects purely for reading and porting — not imported by any production file.

- Has its own `reference/tsconfig.json` (extends root, `strict: false`) so IDEs type-check it without blocking CI
- Excluded from main `tsconfig.json` via `"exclude": ["reference/**"]`
- Excluded from Docker image via `.dockerignore`
- When a file from `reference/` is ready to use, port it into `src/` properly; don't import directly

### Type debt

\~537 TypeScript errors are deferred post-launch. `typescript.ignoreBuildErrors: true` in `next.config.ts` keeps the production build green. The full backlog with fix order lives in **`readmes/TYPE_DEBT.md`**.

```bash
pnpm tsc --noEmit 2>&1 | grep "error TS" | wc -l   # current error count
```

---

## State Management Patterns

| What                                | Where                                 | Tool                  |
| ----------------------------------- | ------------------------------------- | --------------------- |
| UI state (sidebar, viewport, theme) | `stores/RP_Ui.ts`                     | Zustand               |
| Device detection                    | `stores/Device/`                      | Zustand               |
| Custom cursor                       | `stores/Cursor/`                      | Zustand               |
| Notification queue                  | `stores/Notification/`                | Zustand               |
| Routing state                       | `stores/Routing/`                     | Zustand               |
| Server data (fetching, caching)     | Components/hooks                      | React Query           |
| Auth session                        | `providers/Session/`                  | Context               |
| Theme (light/dark)                  | `providers/Theme/`                    | next-themes + Context |
| Highlightr citations                | `components/UX/Highlightr/providers/` | Zustand + Context     |

**Pattern:** Use `useShallow` on Zustand selectors when selecting Map/object values to prevent unnecessary re-renders.

---

## Aesthetic Direction

The Hideaway is editorial with a quiet, typographic-first aesthetic. Design references: Fey (color, gradient, visual direction), Medium (hierarchy, reading), Longblack.co (content as object), metalab.com (restraint, whitespace), Awwwards (curation UI), jonway.studio (compilation grids).

The governing tone: *sparse, intentional, typographically confident*. Features should feel discovered rather than advertised.

---

## Layout Containers
> The code below is not absolute — not in structure, not in className styling, not in design direction — and should be regarded as a point of reference, not a binding enforcement.

```tsx
// Standard container — use primary page layouts
<div className="px-6 xl:px-10">

// Narrow (prose / forms)
<div className="mx-auto px-6">

// Full-bleed (heroes, banners)
<section className="w-full">
```

 

---

## Responsive Breakpoints

Mobile-first. **Never stop at `lg:`** — every grid and spacing value needs an `xl:` variant.

| Breakpoint | Screen Width | Context                          |
| ---------- | ------------ | -------------------------------- |
| `sm:`      | 640px        | Large phone / small tablet       |
| `md:`      | 768px        | Tablet                           |
| `lg:`      | 1024px       | Small laptop                     |
| `xl:`      | 1280px       | MacBook 13–14"                   |
| `2xl:`     | 1536px       | MacBook Pro 16" / large monitors |

### Grid column targets

| Content type                                     | sm  | md  | lg  | xl  | 2xl |
| ------------------------------------------------ | --- | --- | --- | --- | --- |
| Editorial cards (posts, surf, profile)           | 1   | 2   | 3   | 4   | 4   |
| Music / square tiles (albums, tracks, playlists) | 2   | 3   | 4   | 5   | 6   |
| Compilation cards (premium, 4:3)                 | 1   | 2   | 3   | 4   | 4   |
| Compilation cards (free, 16:9)                   | 1   | 2   | 3   | 3   | 4   |
| Detail item grid (premium)                       | 2   | 3   | 4   | 5   | 6   |

### Gap scaling

```tsx
className="gap-4 xl:gap-5"      // standard grids
className="gap-5 xl:gap-6"      // larger card grids
```

---

## Typography
> The code below is a starting reference, not a binding enforcement. Pick the role that fits the surface; never mix all four faces on one screen.

Typography carries hierarchy and tone. The Hideaway uses four text personalities deliberately, never interchangeably.

### Personality roles

| Face | When | Pairing |
|---|---|---|
| **Serif** (`font-serif`) | Theatrical surfaces — marketing, hero spotlights, advertising, customer-experience moments. The "selling" voice. | `font-bold` for headlines; `font-medium` for body when serif body is wanted. |
| **Sans** (`font-sans`) | Focused content and admin — settings, vault, reading interfaces, dashboards, profile editing. The "working" voice. | `font-light` for display; `font-medium` for UI labels and card titles; `font-normal` for body. |
| **Wide** (`font-wide`) | Editorial weight without serif theatrics — section headers and big ticker labels when a serif feels too soft. | `font-bold` or `font-black`. |
| **Mono** (`font-mono`) | Sparingly. Reserved for editorial chrome on content surfaces (article eyebrows, byline metadata, caption credits), tabular numerals in counts and badges, and code. **Should not be the default for admin or settings surfaces.** Treat mono as a flavour, not a system. |

Rule of thumb: a settings or vault surface is mostly sans, lightly seasoned with mono. A marketing or hero surface leans serif or wide. Never mix all four faces on one screen.

### Display / hero headings

`text-6xl` is the floor for page-hero scale. Never below — at any breakpoint.

```tsx
// Page heroes — scales up only, never down
className="text-6xl md:text-7xl 2xl:text-8xl font-light tracking-tight"

// Page section headings (within a page)
className="text-3xl xl:text-4xl 2xl:text-5xl font-light tracking-tight"

// Sub-section / detail headings
className="text-2xl xl:text-3xl 2xl:text-4xl font-light tracking-tight"
```

For serif heroes, keep the same scale ramp but swap face and weight:

```tsx
className="text-6xl md:text-7xl 2xl:text-8xl font-serif font-bold tracking-tight"
```

### UI labels

Sans is the default for admin / settings / vault. Mono is reserved for metadata, counts, and editorial chrome on content surfaces.

```tsx
// Primary action / nav label (sans, admin surfaces)
className="text-sm font-medium tracking-tight"

// Secondary / inactive nav label (sans)
className="text-sm font-normal text-foreground/60"

// Editorial section eyebrow (mono caps — content surfaces only)
className="font-mono text-[10px] uppercase tracking-[0.2em] xl:text-xs"

// Tabular metadata (mono, tabular-nums)
className="font-mono text-[10px] tabular-nums xl:text-[11px]"
```

### Body / card copy

```tsx
// Card title
className="text-base font-medium leading-snug tracking-tight xl:text-lg"

// Card description / subtitle (sans on admin, mono on editorial cards)
className="text-sm font-normal text-foreground/70"

// Prose body
className="text-base font-normal leading-relaxed"

// Editorial article eyebrow (mono, content surface only)
className="font-mono text-[11px] uppercase tracking-widest text-foreground/65"
```

---

## Color & Opacity System
> The code className below are not absolute and should be regarded as a point of reference, not a binding enforcement.

Given  **neutral** colors such as the `foreground` and 
`background` tokens,  prefer **opacity as the tonal/shade tool** rather than introduce a new color.
```tsx
text-foreground                // Primary text
text-foreground/70             // Secondary
text-muted-foreground          // Subdued
text-muted-foreground/60       // Tertiary / metadata
text-muted-foreground/40       // Ghost / hint

border-border/20               // Subtle (default card edge)
border-border/30               // Standard divider
border-border/50               // Hover / active

bg-card                        // Card surface
bg-muted/20                    // Image placeholder
bg-background/80               // Overlay backdrop
bg-background/90               // Sticky header
```

### Legibility floor (lower clamp)

Opacity is the tonal tool, but **text colors must clear the contrast floor**. Below the floor, an element is decorative-only (watermarks, ghost symbols, atmospheric grain) — never copy a user is meant to read.

| Tier                                  | Purpose                                                           | Min opacity (dark) | Min opacity (light) |
| ------------------------------------- | ----------------------------------------------------------------- | ------------------ | ------------------- |
| **Body**                              | Sentences, paragraph copy, form values, descriptions              | `/65`              | `/65`               |
| **UI label / metadata**               | Mono-caps labels, row labels, eyebrows, counts                    | `/55`              | `/60`               |
| **Secondary headline / inactive nav** | De-emphasized but still readable headings, faded section labels   | `/45`              | `/50`               |
| **Decorative only**                   | Watermarks, ghost symbols, atmospheric overlays, hover-only hints | any                | any                 |

Rules:
- The "informative" tiers above (body / label / secondary) target ≥ 4.5:1 contrast (WCAG AA normal text). Decorative tier has no floor.
- If you're tempted to use `/40`, `/35`, `/30` etc. for *readable* text, you're below the floor — bump to the next tier up, or commit to making it decorative (no informative content, role=presentation, or aria-hidden).
- Light mode and dark mode often need different opacities to hit the same perceived contrast; respect the per-mode column.
- Borders, dividers, and shadow tints are not text — they're not bound by the floor. `border-border/15` is fine.
- This applies project-wide, not just to settings or admin surfaces.

---

## Card Anatomy
> The designs - layout and style classNames - are not absolute and should be regarded as a point of reference, not binding enforcement.
```
┌──────────────────────────┐
│  [image]                 │  aspect-ratio locked, overflow-hidden
│  ↳ gradient overlay      │  from-transparent to-background/60
│  ↳ hover: scale(1.04)   │  transition-transform duration-500
├──────────────────────────┤
│  [body]         p-3.5    │  xl:p-4
│   Title         text-sm  │  xl:text-base, font-medium
│   Subtitle      text-xs  │  font-mono, muted-foreground/60
├──────────────────────────┤  (optional footer)
│  [meta]         py-2     │  item count, visibility badge, context menu
└──────────────────────────┘
```

All cards: `rounded-lg`, `border-border/20`. On hover: `border-border/50`.

---

## Sticky Headers
> The code below is not absolute — not in structure, not in className styling, not in design direction — and should be regarded as a point of reference, not a binding enforcement.

```tsx
<header className="sticky top-0 z-20 border-b border-border/30 bg-background/90 backdrop-blur-md">
  <div className="mx-auto px-6 py-5 xl:px-10">
    <div className="flex items-end justify-between">
      {/* Left: eyebrow label + h1 */}
      {/* Right: nav links (font-mono text-[11px] uppercase tracking-widest) */}
    </div>
  </div>
</header>
```

---

## Heroes (Full-Bleed)
> The code below is not absolute — not in structure, not in className styling, not in design direction — and should be regarded as a point of reference, not a binding enforcement.

```tsx
<section className="relative h-[55vh] w-full overflow-hidden">
  {/* Cover image or gradient fallback with large initial letter */}
  {/* Gradient overlay: from-black/30 via-black/40 to-background */}
  {/* Content anchored bottom-left inside max-w-7xl container */}
</section>
```

Initial-letter fallback: `text-[20vw] font-mono font-light text-foreground/[0.04]`

---

## Animations

Use Motion `motion/react` for hooks, methods and `<AnimatePresence/>`.

**Critical:** 
when importing for component prefix — `m` for components, e.g.,  `<m.div/>` —**never** import from the path; instead, it should **always** be `import * as m from "motion/react-m";`
> The code below is not absolute — not in structure, not in styling, not in animation, not in design direction — and should be regarded as a point of reference, not a binding enforcement.
```tsx
// Card entrance
initial={{ opacity: 0, scale: 0.97 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}

// Staggered list
transition={{ type: "spring", bounce: 0.1, delay: index * 0.04 }}

// Page/tab transitions
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.22 }}

// Panels/sheets
initial={{ x: "100%" }}
animate={{ x: 0 }}
transition={{ type: "spring", bounce: 0.05, duration: 0.4 }}

// Modals
initial={{ opacity: 0, y: 24 }}
animate={{ opacity: 1, y: 0 }}
transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
```

Use `LayoutGroup` + `layoutId` for tab indicators. Keep `bounce` low (0.05–0.2).

---

## Empty States
> The code below is not absolute — not in structure, not in className styling, not in design direction — and should be regarded as a point of reference, not a binding enforcement.

```tsx
<div className="flex flex-col items-center justify-center py-24 text-center">
  <span className="mb-4 font-mono text-5xl opacity-10">{symbol}</span>
  <p className="text-base font-light text-foreground/70">{headline}</p>
  <p className="mt-1.5 max-w-xs font-mono text-[11px] text-muted-foreground/50">{sub}</p>
  <button className="mt-7 border border-border/40 px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest ...">
    {cta}
  </button>
</div>
```

Symbol candidates: `◫` (saved), `⊞` (lists), `○` (profiles). Opacity 10%.

---

## Role-Based Layout Tiering

Premium (`patron`, `author`, `editor`, `admin`) get editorial-grade layouts. Free (`user`) get standard.

```tsx
const isPremium = (role: string) =>
  ["patron", "author", "editor", "admin"].includes(role);
```

Premium: more grid columns, 4:3 overlay cards, denser display. Free: 16:9 standard cards, title below image. Subscription assignment is not yet wired — role is set directly on the user.

---

## Forms & Inputs
> The code below is not absolute — not in structure, not in className styling, not in design direction — and should be regarded as a point of reference, not a binding enforcement.

Borderless, bottom-border-only:

```tsx
<input className="w-full border-b border-border/30 bg-transparent pb-2 text-sm font-light tracking-tight placeholder:text-muted-foreground/30 focus:border-foreground/40 focus:outline-none" />
```

Submit buttons:

```tsx
<button className="border border-border/40 px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest text-foreground/80 transition-colors hover:border-border hover:text-foreground disabled:opacity-40">
  Submit
</button>
```

Actions are communicated through text weight, underlines, and border visibility — not fill color.

---

## Admin surfaces (Fey direction)

`/me/settings`, `/vault` (custom Hideaway-side admin areas), and any future "operating room" surface follow the **Fey direction** — a synthesis of Fey.com's lifted-dark-panel chrome adapted to The Hideaway's sans-leaning admin tone.

> The code below is a starting reference, not a binding enforcement. The synthesis evolves as we build.

### Canvas

A single deep-luminance canvas carrying:
- One **warm radial bleed** anchored off-screen — atmosphere, not decoration. Subtle in dark; a low-contrast warm wash in light.
- Subtle grain overlay at very low opacity (`/[0.02]`–`/[0.04]`).

No per-panel atmosphere on top of this. Atmosphere lives at canvas level only.

### Panels (lifted, not flat)

Panels are **lifted dark pools** in the canvas, distinguished by luminance gradient + shadow rather than borders.

```tsx
<div className={cn(
  "relative rounded-2xl",
  "bg-foreground/[0.04] dark:bg-foreground/[0.05]",
  // top-edge inner highlight — the lift
  "before:absolute before:inset-x-0 before:top-0 before:h-px",
  "before:bg-gradient-to-r before:from-transparent before:via-foreground/20 before:to-transparent",
  // outer shadow — the float
  "shadow-[0_2px_24px_-8px_rgba(0,0,0,0.4)] dark:shadow-[0_2px_28px_-8px_rgba(0,0,0,0.6)]"
)}>
  ...
</div>
```

Radius: `rounded-2xl` (~16px). No visible borders; rely on luminance + shadow.

### Internal panel composition (2-column)

Inside a panel, sections use a 2-column grid: left = description; right = controls.

```tsx
<section className="grid gap-x-12 gap-y-8 p-7 xl:p-9 xl:grid-cols-[minmax(220px,5fr)_minmax(0,7fr)]">
  <div>
    {/* eyebrow + title + blurb (left column) */}
  </div>
  <div className="flex flex-col gap-1">
    {/* row pills (right column) */}
  </div>
</section>
```

This composition uses horizontal space without center-narrowing into a prose column.

### Row pills (inset, not divided)

Field rows are **self-contained inset pills**, never divider-separated lines.

```tsx
<div className={cn(
  "relative flex items-center justify-between gap-4 rounded-xl px-4 py-3",
  "bg-foreground/[0.025] dark:bg-foreground/[0.03]",
  "before:absolute before:inset-x-2 before:top-0 before:h-px",
  "before:bg-gradient-to-r before:from-transparent before:via-foreground/10 before:to-transparent"
)}>
  <span className="flex items-center gap-3">
    <Icon className="size-4 text-foreground/55" />
    <span className="text-sm">{label}</span>
  </span>
  <span>{control}</span>
</div>
```

### Categorical color tiles for sections

Sections may carry a small colored icon tile (~28px rounded square) with a monochrome glyph as identity. Colors are **identity, not decoration**, and use a finite token set:

```css
/* Hideaway category tokens (admin-only) */
--cat-account:    oklch(72% 0.10 50);   /* warm orange */
--cat-options:    oklch(60% 0.12 280);  /* muted purple */
--cat-support:    oklch(70% 0.14 160);  /* soft green */
--cat-billing:    oklch(60% 0.18 25);   /* ember red */
--cat-data:       oklch(75% 0.04 90);   /* bone neutral */
```

Each color is used once per surface, paired with a section title. Never as decoration on body text or as a fill on buttons.

### Field affordance tiers

Edit affordance is communicated by component, not by inline `<input>` styling:

| Tier | Component | Visual signal |
|---|---|---|
| 1 — Locked | `<LockedField>` | Mono value; dotted underline; trailing 12px lock glyph at `/35`. Cursor: not-allowed. |
| 2 — Deferred edit | `<EditableField>` | Sans value; on hover: hairline underline appears + trailing pencil glyph rises `/30 → /80`. Click swaps row to inline input + esc/save controls. |
| 3 — Soft control | `<ToggleField>` | iOS-style switch or radio set; 1px inset focus ring at `foreground/40`. |
| 4 — Verified action | `<ActionField>` | Sans pill button → modal (password change, 2FA, passkey, sign-out everywhere). |

The signature interaction is **deferred edit**: an editable row looks read-only at rest, reveals its editability on hover, and only becomes a true input on click. This avoids the "page full of input boxes" look.

### Status objects (right companion column)

Where Fey uses a photorealistic 3D wallet, The Hideaway uses the **Plaque** (titanium membership plate, hanging from a lanyard, with engraved name) — see `src/components/layouts/Registration/MembershipBadge.tsx`. The same model is reused across registration, profile, and the settings overview, with view-specific behaviour:

| Surface | Variant | Behaviour |
|---|---|---|
| Registration | `BADGE` (live form preview) | Full physics + drag interaction; rope joints |
| Settings overview (xl+) | `PLATE` (stationary) | Slow idle drift; no drag; static name baked in |
| Mobile / small screens | None | Replaced with typographic member-since/handle/role block |

Loaded behind `useInView` + Suspense + a static-PNG first-paint fallback. Never on mobile; never above-the-fold without lazy gating.

### Layout (iOS × Fey hybrid)

```
/me/settings              ← overview canvas (Fey 2-pane)
                            left: stacked panels (non-sensitive groups)
                            right: Plaque companion column

/me/settings/security     ← dedicated route (sensitive)
/me/settings/passkeys     ← dedicated route (sensitive)
/me/settings/connected    ← dedicated route (oauth, sensitive)
/me/settings/subscriptions ← dedicated route (financial)

mobile (< lg):
/me/settings              ← iOS-style navigation index
                            list of section links, no panels
                            tapping a row navigates to /me/settings/[section]
```

Sensitive items get their own routes; non-sensitive items share the overview canvas.

### Scope

Anything that lives outside of `(auth)/me/*`, `(payload)/vault/*`, or future operating-room surfaces should NOT use the Fey direction. Editorial / content / marketing surfaces stay in the editorial-mono direction described elsewhere in this doc.
