# App Directory Structure

Reference for the `src/app/` directory layout in this Next.js + Payload CMS project.

---

## Directory Tree

```
src/app/
├── (frontend)/                    # All public-facing pages
│   ├── layout.tsx                 # Root frontend layout (providers, Header, Menu, SideDrawer)
│   ├── not-found.tsx              # Custom 404
│   ├── (dev)/                     # Development-only pages (excluded from prod)
│   │   ├── dev/                   # Component showcase
│   │   ├── dodo/                  # Component testing
│   │   └── lexy/                  # Component testing
│   └── (site)/                    # Main website
│       ├── page.tsx               # Homepage (/)
│       ├── [slug]/                # Dynamic CMS Pages collection pages
│       ├── [...not_found]/        # Catch-all 404 fallback
│       ├── (pages)/               # Static/informational pages
│       │   ├── home/              # /home — alternate home with tape player
│       │   ├── search/            # /search — global search (CMDK)
│       │   ├── radio/             # /radio — music player interface
│       │   ├── plans/             # /plans — membership tiers
│       │   ├── the-team/          # /the-team
│       │   ├── lostinseoul/       # /lostinseoul — editorial feature
│       │   ├── privacy/           # /privacy
│       │   ├── terms/             # /terms
│       │   └── next/              # Draft preview routes (preview/exit-preview)
│       ├── (content)/             # Dynamic content routes
│       │   ├── essays/            # /essays — posts listing + /essays/[slug] detail
│       │   │   ├── [slug]/        # Individual essay
│       │   │   └── in/[pageNumber]/ # Paginated listing
│       │   ├── surf/[slug]/       # /surf/[slug] — curated external content
│       │   ├── tagged/[slug]/     # /tagged/[slug] — category pages + pagination
│       │   ├── archived/[slug]/   # /archived/[slug] — archived content + pagination
│       │   ├── users/             # /users — directory listing
│       │   │   └── [user]/        # /users/[user] — profile, posts, profile sub-routes
│       │   └── lists/[username]/[hashId]/ # /lists/[username]/[hashId] — public user lists
│       └── (auth)/                # Authentication pages
│           ├── sign-in/           # /sign-in
│           ├── sign-up/           # /sign-up
│           ├── forgot-password/   # /forgot-password
│           ├── reset-password/    # /reset-password
│           ├── two-factor/        # /two-factor + /two-factor/otp
│           ├── auth/[path]/       # Better Auth OAuth callbacks
│           ├── accept-invitation/[id]/ # Org invitation acceptance
│           ├── admin-ba/          # Better Auth admin panel
│           ├── account/[path]/    # Account settings
│           ├── prive/             # Private dashboard
│           └── me/                # User dashboard
│               ├── onboarding/    # /me/onboarding
│               ├── saved/         # /me/saved — bookmarks
│               ├── lists/         # /me/lists + /me/lists/[hashId]
│               └── notifications/ # /me/notifications
├── (payload)/                     # Payload CMS admin (auto-generated, do not modify)
│   ├── api/[...slug]/             # Payload REST API
│   └── vault/[[...segments]]/     # Admin dashboard at /vault
└── api/                           # Custom API routes
    ├── auth/[...all]/             # Better Auth catch-all handler
    ├── search/                    # Global search + /search/users
    ├── image-courier/             # Image proxy/optimization
    ├── gated/[collection]/[id]/   # Protected content access
    ├── payload-jobs/run/          # Background job execution
    └── dev/                       # Dev utilities
```

---

## Route Groups

### `(frontend)` vs `(payload)`

Standard Payload CMS split. The frontend group wraps all public pages with providers, theme context, and navigation (Header, Menu, SideDrawer). Payload gets its own auto-generated layout at `/vault`.

### `(site)`

Groups all website pages under a shared layout with navigation context. Contains three sub-groups plus the homepage and dynamic slug routes.

### `(pages)`

Static and informational pages that don't map to Payload collections. Content is either hardcoded or pulled from the Pages collection. Search, radio, plans, privacy, terms all live here.

### `(content)`

Dynamic content driven by Payload collections (posts, surf, tags, users, lists). Pages use `generateStaticParams` for static generation where applicable.

### `(auth)`

All authentication flows. Mix of Better Auth UI components (sign-in, sign-up, account) and custom pages (`me/*`, `prive`). Some routes are stale from early better-auth-ui integration.

### `(dev)`

Development-only pages for component testing. Excluded from production builds via `process.env.NODE_ENV` checks.

---

## Library-Imposed Structure

**Payload CMS** -- The `(payload)/` directory is auto-generated. `layout.tsx` and `vault/` must not be modified. Payload REST API lives at `(payload)/api/[...slug]`.

**Better Auth** -- `api/auth/[...all]` catch-all is required by the library. `auth/[path]` handles OAuth callbacks. `account/[path]` and `admin-ba` come from better-auth-ui demos and may be partially stale.

**next-intl** -- Requires plugin wrapping in `next.config.ts`. Locale files in `messages/`.

**Payload Pages collection** -- `[slug]` at the site root catches dynamic CMS pages. Must come after explicit routes to avoid conflicts.

---

## URL Rewrites

Defined in `next.config.ts`. Order matters -- specific rewrites before the catch-all:

| Pattern | Rewrites to | Purpose |
|---|---|---|
| `/@:user/essays/:slug` | `/essays/:slug` | Vanity URLs for author essays |
| `/@:user/surf/:slug` | `/surf/:slug` | Vanity URLs for author surf items |
| `/@:user/lists/:hashId` | `/lists/:user/:hashId` | Vanity URLs for user lists |
| `/@:user/:path*` | `/users/:user/:path*` | Catch-all vanity URLs for user content |

---

## Caveats

1. **Routing priority.** `[slug]` at `(site)/` root and `[...not_found]` catch-all create a priority chain: explicit routes in `(pages)`, `(content)`, `(auth)` take precedence, then `[slug]`, then catch-all.

2. **Stale auth routes.** Several routes (`admin-ba`, `accept-invitation`, `prive`) originated from library demos and may not be actively used.

3. **Dual homepages.** `/home` and `/` both serve as homepages. `/home` includes the tape player hero variant.

4. **Detail-only routes.** No index page exists for `/archived` or `/surf` -- they require a slug.

5. **Pagination inconsistency.** `essays/in/[pageNumber]` is the only collection using this pagination pattern. Other collections use `[slug]/[page]`.

---

## Future Directions

- Consolidate `/home` with `/` or differentiate their purposes clearly.
- Add index pages for `/surf` and `/archived` if they should be browseable.
- Clean up stale auth routes from library demos.
- Consider moving `me/` out of `(auth)` since it's a user dashboard, not an auth flow.
