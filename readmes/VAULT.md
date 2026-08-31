# Vault (`/vault`)

Payload admin at `/vault`. Visual grammar lives in `readmes/DESIGN_SYSTEM.md` → “Vault / Operating Room”. Load `.claude/skills/admin-fey-surfaces/SKILL.md` before changing this surface.

This file is the session handoff. Open it first after a compact.

---

## Resume after compact

**Do not build the bird’s-eye dashboard next.**

Next job: an **end-to-end functional admin** — list, edit, publish, preview, nav, and no compile/runtime 500s. The home page is an interim work queue. Its scope (Drafts / Recent / Locked) is accepted. It is **not** a dashboard yet.

User law (2026-08-31), kept verbatim:

> A dashboard should be a birds-eye-view summation encompassing the key points of interest for the user. It would include, of course, the cumulative status of one's work, but it also includes things like number of views in the past {insert period appropriate here}, new comments, new likes, a new reader, the user's tier, subscription summary, to list a few off the top of my head.
>
> But this work comes after we have a end-to-end functional admin-side first.

Confirm with the user before expanding dashboard scope. Do not invent widgets, charts, or fake activity.

---

## Current home (interim)

Custom Dashboard view, Local API, not Payload experimental widgets.

| Bay | Query | Collections |
|---|---|---|
| Drafts | `_status: draft`, `draft: true` | `posts`, `surf`, `pages` |
| Recent | latest `updatedAt`, drafts included | same |
| Locked | `payload-locked-documents` (access `Boolean(user)`) | same; other lock targets dropped |

- Registered at `src/payload.config.ts` → `admin.components.views.dashboard`.
- Code: `src/payload/views/Dashboard/{index.tsx,index.scss,home.ts,work.ts}` + tests.
- Copy: `messages/{en,ko}.json` → `Vault.home.*`. Loaded with `loadVaultHomeCatalog` from **Payload locale**, not `getTranslations`. `src/i18n/request.ts` always reads the site locale cookie and ignores a `locale` override.
- Empty tables are honest: local DB had 0 posts / 0 surf / 0 pages. Do not seed fake rows to fill the hole.
- Failed finds return `errors` + `role="alert"` `loadError`. Do not treat a thrown query as an empty queue.
- Whole-row hit target (`::after` overlay). Label / empty / `th` contrast at 60%. `tr:focus-within` outline.

GAN round 2 on this home: **7.48 PASS**. Remaining non-blockers then: the empty hole is real (no work in DB **and** this is queues, not a dashboard).

---

## Deferred: bird’s-eye dashboard

Pickup only after the e2e admin checklist below is done.

### What it is

A summation of the signed-in staff member’s world, not a third nav and not three empty tables.

Keep the work queues as **one** region (cumulative work status). Add regions that answer: what changed, who arrived, what the account is.

### Regions (user-stated, not a closed list)

| Region | Intent | Likely source (do not wire yet) |
|---|---|---|
| Work status | Drafts / recent / locked (already scoped) | `src/payload/views/Dashboard/work.ts` |
| Views in a period | Count of views over an appropriate window | `userViews` (`src/payload/collections/UserViews/`) |
| New comments | Unread / recent responses on the user’s work | `responses` (`src/payload/collections/Comments.ts`) |
| New likes | Recent likes on the user’s work | Likes plugin (`src/payload/plugins/Likes/`) — `likers` + `likes` on likeable collections |
| New reader | Someone new following or first-viewing | `follows` (`src/payload/collections/Follows/`) and/or first `userViews` |
| User’s tier | Role / membership plate | `users.role`; Subscriptions role-sync hooks in admin-fey-surfaces |
| Subscription summary | Plan, status, expiry — not a billing console | `subscriptions` (`src/payload/collections/(consumption)/Subscriptions/`) |

Period for views is **not chosen**. Pick it when implementing (7 days vs 30 days vs calendar month) against real volume. Do not invent a window now.

### Constraints when that work starts

- Custom Local API home stays. Do not switch to Payload experimental dashboard widgets. Built-in widget is only `collections` (card wall); user rejected it.
- Settings `Panel` is for `/me/settings` and Hideaway-owned custom views that hold work — not a miniature nav, not a postcard of five links.
- Copy in `messages/en.json` + `messages/ko.json` in the same diff. `readmes/VOICE.md`: standard, compact, neutral. No invented reassurance.
- Locale: Payload admin locale → `loadVaultHomeCatalog` pattern. Never `getTranslations` for vault chrome.
- Silent query failure must still surface as `errors` / `loadError`, never as “No drafts.”
- Do not mix leftover Lost in Seoul / ecommerce / Payload 3.88.0 pin diffs into this work.

---

## Next: end-to-end functional admin

This is the work after compact. Goal: a staff member can list, open, edit, save, publish, and preview posts/surf/pages without a 500, without a ghost shell, and without schedule-publish crashing the compile.

### Checklist

1. **List** — stock Payload list under `#restored-vault` + `vault-theme.scss`. Confirm posts, surf, pages (and a non-custom collection) load, filter, and open.
2. **Edit** — Posts and Surf use custom `EditView` (`src/payload/views/Edit/`). Other collections use stock edit under the same CSS. Confirm save, draft, versions, live preview.
3. **Publish** — `src/payload/elements/PublishButton/publishClient.tsx` works. **Schedule publish is unhooked.** `ScheduleDrawer` was omitted because Payload 3.88.0 DatePicker `library.scss` (`//` comments + `@layer`) crashes Next’s sass→CSS pipeline and poisons the whole `/vault` compile (and can take auth APIs with it). Re-enable only when that file is valid CSS or the pin moves off 3.88.0.
4. **Nav** — live chrome is stock Payload template + `#restored-vault` + Admins providers (peek-nav). Collections currently dump ungrouped. Grouping is in scope for e2e admin; do not restyle a ghost.
5. **Ghost forks** — `src/payload/views/index.tsx` (`DefaultTemplate`), `src/payload/elements/AppHeader`, `src/payload/elements/Nav` exist on disk and are **not registered**. Wire or delete; do not restyle them as if they were live.
6. **Dead seed banner** — `src/payload/components/BeforeDashboard` is leftover Payload starter copy and is not registered. Remove when touching dashboard chrome, not as a substitute for the bird’s-eye home.
7. **No 500s** — compiling `/vault` must not poison `/api/auth`. If DatePicker re-enters the graph, wipe `.next` and keep ScheduleDrawer omitted.
8. **html `font-size: 62.5%`** on vault (1rem = 10px). Theme and home SCSS assume that.

### Out of scope until the checklist is done

Views-over-period, comments, likes, new reader, tier, subscription summary, charts, native dashboard widgets, Settings-style 3-column shell on List/Edit.

### Walk results (2026-08-31)

Butler signed in. `/vault` home and posts/surf/pages list returned 200. Custom Posts/Surf create rendered (title editor, Save Draft, Publish changes, preview). Stock Pages edit rendered. Schedule still omitted. No DatePicker compile poison this run.

| Surface | Result |
|---|---|
| Posts list | Empty list + Create New. Honest. |
| Posts create → Publish | Button works. Blocked by required **Content** and **Category**. No `uncategorized` row in this DB. |
| Surf list | Empty + Create New. Honest. |
| Surf create → Publish | `relatedSurfs` prefills fixed. Create with `meta.title` publishes (`Walk published surf`). UI **Publish changes** still 400s if SEO title is empty. |
| Pages list | Loads. Leftover empty-title drafts (`undefined-…` / `null-…` slugs) from before the autosave/slug fix remain. |
| Pages create → Publish | Autosave off; untitled create rejected. Slug is title + hash (no `undefined-`/`null-`). Publish persists (`Walk UI published page`). Search sync fills The Hideaway when the page has no author. |
| Tags list (stock) | Fixed: list loads (`Walk tag`). Reverse `taggedItems` join removed. |
| Tags create | Title saved (`Walk tag` / `walk-tag` in DB). |

**Blockers to fix next (still not the dashboard):**

1. `uncategorized` — seeded 2026-08-31. Row is in `categories`. Helper `ensureUncategorized` runs after Payload init; baseline migration `20260831_120000_uncategorized_category` is the durable insert. Posts create now resolves the default category. Content is still required to publish.
2. Tags list — fixed 2026-08-31. Removed polymorphic `taggedItems` join (`on: "tagged"` hasMany rels). Payload/Drizzle emitted `select "id",  as "tagged"`. Tagging on posts/surf/etc is unchanged; count stays on `tagCount`.
3. Surf `relatedSurfs` — fixed 2026-08-31. Create no longer prefills published posts/surfs; filterOptions only excludes self after the doc has an id. UI publish still requires `meta.title` (SEO sidebar).
4. Pages autosave/slug/publish — fixed 2026-08-31. `autosave: false`; skip untitled create; hashed slug skips blank/`undefined`/`null` keys; search `author` defaults to The Hideaway so publish is not rolled back.
5. Next Instant UI overlay (“1 Insight” / uncached data on `/vault/[[...segments]]`) sits on staff chrome.
6. Nav still ungrouped. Ghost `DefaultTemplate` forks still unwired.

---

## Architecture (do not re-litigate)

**Paint Payload, do not replace it.**

- Theme lever: Payload CSS variables in `src/payload/scss/vault-theme.scss` (`--color-base-*`, `--theme-*`, radius, `--font-body`). Import from `src/app/(payload)/layout.tsx` **after** `@payloadcms/next/css`. Relative `@import` from `custom.scss` failed (“Can't find stylesheet”).
- Live shell: stock Payload template + `#restored-vault` in `src/app/(payload)/custom.scss` + `src/payload/providers/Admins`.
- Fey is method, not a carbon copy. Hideaway warm oklch. No Fey/Oscura hex. No shadcn `--sidebar-*` as a second admin theme.
- Nav peek/hover stays. Surface is a lifted pool, not `backdrop-filter` glass. Canvas grain `/[0.02]`–`/[0.04]`.
- Custom EditView is Posts/Surf only.
- Do not wrap every List/Edit field in Settings `Panel`.

---

## Traps

| Trap | Law |
|---|---|
| `getTranslations` on vault | Follows site locale cookie. Use `vaultHomeLocale` + `loadVaultHomeCatalog`. |
| Payload experimental widgets | Rejected. Custom Local API only. |
| Five-link Settings postcard home | Rejected. Do not bring it back. |
| Empty queues vs failed queries | `errors` + `loadError`; never bless silent failure as empty. |
| ScheduleDrawer / DatePicker | Stay omitted on Payload 3.88.0. |
| Mixed worktree | Do not fold leftover `lostinseoul`, ecommerce/inventory/merchandising, Payload pin, essays/paywall/locker, or `public/Icon\r` into vault commits. Do not push a mixed tree. |
| Fake data to fill the hole | Empty DB is empty. Dashboard emptiness is also a missing product, deferred. |

---

## File map

| Path | Role |
|---|---|
| `src/payload/views/Dashboard/` | Custom `/vault` home |
| `src/payload/scss/vault-theme.scss` | Payload CSS-variable theme |
| `src/app/(payload)/layout.tsx` | Imports vault-theme after Payload CSS |
| `src/app/(payload)/custom.scss` | `#restored-vault` layout contract |
| `src/payload/providers/Admins/` | Peek nav, sidebar FSM, theme |
| `src/payload/views/Edit/` | Posts/Surf custom edit |
| `src/payload/elements/PublishButton/publishClient.tsx` | Publish; ScheduleDrawer omitted |
| `src/payload/views/index.tsx` + `elements/AppHeader` + `elements/Nav` | Unwired forks |
| `messages/en.json`, `messages/ko.json` | `Vault.home.*` |
| `readmes/DESIGN_SYSTEM.md` | Vault / Operating Room |
| `readmes/vault-design-tokens.json` | Token dump |
| `readmes/vault-design-preview.html` | Static preview |
| `.claude/skills/admin-fey-surfaces/SKILL.md` | Fey method + settings vs vault |
| `readmes/VOICE.md` | User-facing copy |
