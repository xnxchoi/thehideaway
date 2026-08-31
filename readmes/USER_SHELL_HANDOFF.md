# User shell rebuild — session handoff

**Status as of pause:** Phases 1, 2, 3 shipped. `/me/posts` editorial-pressroom direction shipped but unsatisfying — agreed to unblock via Phase 2.5 (table-grade controls). Phase 4 (admin audit) and Phase 5 (Controlbar) still queued.

This is a session-handoff doc for the broader user-shell rebuild — the convenience interfaces (`UserDropdown`, `SideDrawer`, `SearchBar`/⌘K) and the user-facing settings (`/me/settings/*`). Keep it open at the start of the next session; the goal is no rediscovery.

---

## Original prompt (verbatim, abbreviated)

> Help me build user settings and convenience functions/components to full-product calibre.
>
> `src/components/UX/Dropdown/RPDropDown.tsx`, `src/components/UX/SideDrawer`, `src/components/UX/Menu`, `.attic/src/app/(frontend)/(site)/(auth)`
>
> The first three are the site-wide persistent quick-action interfaces. Links, functions, and information that users frequent should be smartly distributed across them. Today the choice and distribution feel less-than-optimal.
>
> Scope:
> - Maximize functionality + utility of `UserDropdown` and `SideDrawer` (Menu is different)
> - `SearchBar.tsx` (⌘K) feels under-developed and under-utilized
> - User settings should be better structured in paths, presentation, navigability

---

## Mental model — three lanes, no overlap

| Surface | Role | Belongs here |
|---|---|---|
| **UserDropdown** (avatar) | Identity & ownership — "things that are mine" | Public profile (`/@slug`), Library (saved + lists), My posts (`/me/posts`), Tickets, Settings (`/me/settings`), Sign out |
| **SideDrawer** (⌘B) | Site navigation & ambient utility — "where to go + what's playing" | Reception, Essays, Surf, Radio, Directory, Membership, The Team — plus radio player, theme toggle, language toggle |
| **SearchBar** (⌘K) | Find or do — universal command surface | Content search (already works), all destinations as jump commands, recent visits, quick actions (toggle theme, sign out, copy link, go to settings/section), context-aware suggestions when signed in |

**Why this allocation:** today the dropdown leaks into admin (`/vault`), the drawer duplicates Search+Saved already in the dropdown, and ⌘K has no jump-to and no command repertoire — so users have nowhere to discover keyboard navigation.

---

## Phase status

| Phase | What | Status |
|---|---|---|
| **1. Settings restructure** | Sections, rail, panels, bento layout, copy cleanup | ✅ Shipped (see "Settings — what shipped" below) |
| **2. Link distribution** | Revise `SIDE_DRAWER_LINKS`, fix dropdown links, build `/me/posts` editorial index | ✅ Shipped (see "Phase 2 — what shipped" below) |
| **3. ⌘K command palette upgrade** | Jump commands, recents, quick actions, context-aware suggestions | ✅ First cut shipped (context-aware deferred) |
| **4. Admin (`/vault`) audit** | Match editorial voice so deeplink handoff from `/me/posts` doesn't feel schizophrenic | ⏳ In progress — see `readmes/VAULT.md`. Next is e2e list/edit/publish, **not** the bird’s-eye dashboard. |
| **5. Controlbar treatment of sub-route back-link** | Move "← Settings" from `<SubRouteHeader/>` into persistent chrome via `src/components/UX/Controlbar/` | ⏳ Queued (after 2–4) |

---

## /me/posts — design decision

**Don't port the Lexical editor.** Porting Lexical + media browser + draft/publish/versioning is a multi-week rebuild that fights Payload's strengths.

**Build `/me/posts` as a beautiful editorial index surface.** Drafts / published toggle, view counts via `UserViews`, last-edited, tags. "Edit" and "New post" deeplink to the existing `/vault/collections/posts/...` admin pages.

The handoff feels intentional rather than schizophrenic when `/me/posts` itself looks editorial — and that's exactly what the **admin audit** (Phase 4) is for: bring `/vault` voice closer to the editorial frontend so the deeplink isn't jarring.

---

## Settings — what shipped (Phase 1)

### Section restructure (axis-based, not feature-based)

| Section | Holds |
|---|---|
| **General** | Interface preferences — language, theme, motion (read-only OS mirror) |
| **Profile** | Public-facing identity — name, bio, location, link |
| **Account** | Administrative — handle, sign-in email, password, address (placeholder), subscriptions/billing |
| **Security** | Credential protections — 2FA, sessions, OAuth providers, passkeys, account closure |
| **Notifications** | What we send + how often (preferences in preparation) |

**Retired routes (now redirects):**
- `/connected` → `/security` (OAuth + passkeys are credential protections)
- `/appearance` → `/general` (single setting + read-only OS mirror, didn't earn its own page)
- `/subscriptions` → `/account` (administrative, not its own surface)
- `/highlights` → `/me/settings` (content, not configuration; future activity surface)

### Architecture

- **Layout:** `xl:` 2-col (rail | main), wrapper capped at `max-w-7xl` / `max-w-[1440px]` 2xl
- **Rail:** `<SettingsRail/>` — macOS-styled, icon tile + label, rounded-md active row. **Deliberately separate from `<TableOfContents/>`** (which is editorial: numbers + mono caps + gradient pill, reserved for `/terms`, `/privacy`, etc.)
- **Main:** `<PanelBento/>` wraps panels — single col below 2xl, 2-col bento at 2xl
- **No companion column.** Earlier iteration had a 3-col layout with a "you-are-you" identity card on the right; user called it vanity chrome, killed.
- **Mobile:** rail collapses; `/me/settings` hub page acts as iOS Settings drill-down with `<SectionLink/>` stack

### Primitives

- `<Panel/>`, `<PanelGrid/>`, `<PanelHeader/>`, `<PanelControls/>`, `<PanelBento/>` — `Panel.tsx`
- `<Masthead/>` — hub editorial top zone (top-right anchored, avatar left + type stack right)
- `<QuickStrip/>` — hub direct toggles (theme, locale, security status link)
- `<SectionLink/>` + `<SectionGroup/>` — hub mobile section list
- `<SubRouteHeader/>` — sub-route title + back link (back link is `xl:hidden` since rail covers it)
- `<SettingsRail/>` — admin nav rail
- Field family: `LockedField`, `EditableField`, `EditableLink`, `EditableLocation`, `ToggleField`, `ChoiceField`, `ActionField`, `ActionButton` — `fields/`

### Hub (`/me/settings`)
Masthead + QuickStrip on every breakpoint; the SectionGroup stack is `xl:hidden` (rail handles it on desktop).

### Mapbox
`/api/places/search` proxy holds the secret token, applies city-grade filter. Client helper at `_helpers/searchPlaces.ts`. Wired into `<EditableLocation/>` on Profile.


### i18n
Settings pages are migrating to `next-intl` with the `Settings.*` namespace. `messages/{en,ko}.json` is the canonical place for copy. `sections.ts` is structural data only — labels live in i18n.

---

## Active corrections / recurring directives (load-bearing)

These are patterns the user has corrected me on more than once. Internalize:

1. **"Never take my words without validating and evaluating critically."** Push back when the user's framing is partially wrong. Example: when they framed sections as "scope, sensitivity, security," cohesion + frequency was actually load-bearing; sensitivity was secondary. Don't just nod.

2. **Editorial top-right alignment, not center-stack.** "Top right alignment was a command from god." The Masthead's right-anchored type stack is the signature, derived from management-consulting roots. Don't drift back to center-stack defaults.

3. **Fey direction ≠ stuffing extra columns.** Fey is dense, adjacent, lifted panels — bento. The "vanity profile card on the right" attempt was the wrong read. When the user says "fill the empty space," don't add chrome — pack panels denser.

4. **Don't put visual preferences in Account.** Account = sign-in / credential identity. Theme + motion belong in General. Categorize by axis, not by the nearest non-empty page.

5. **Reading primitives ≠ admin primitives.** `<TableOfContents/>` is for long-form documents. `<SettingsRail/>` is for
   admin. Keep them separate when their functions differ.

6. **Drop filler text.** Use one clear heading. Add a description only when it explains behavior the user needs to know.

7. **The user is doing a lot of in-flight i18n + lint integration in parallel.** Their lint passes are real edits — don't revert them. The system reminder messages about "modified, either by the user or by a linter" mean exactly that.

8. **Persist queues. Don't just nod in chat.** This document exists because I forgot the queue between turns. Write things down going forward.

---

## Files modified during Phase 1

**Settings primitives** (`src/components/UX/Settings/`)
- `Panel.tsx` — `Panel`, `PanelBento`, `PanelGrid`, `PanelHeader`, `PanelControls`. Vertical stack, eyebrow-only header, 2-col bento at 2xl.
- `Masthead.tsx`, `SectionLink.tsx`, `QuickStrip.tsx`, `SubRouteHeader.tsx`, `SettingsRail.tsx`
- `sections.ts` — slug list only; labels in i18n
- `index.ts` — exports
- `fields/` — typed field family
- **Legacy slated for deletion:** `GlassPanel.tsx` (2 known type errors; retained because nothing should re-import it; safe to remove with cleanup pass), `SettingsHeader.tsx`, `SettingsRow.tsx`, `EditableText.tsx`, `EditorialButton.tsx`, `SectionEmpty.tsx`

**Settings routes** (`src/app/(frontend)/(site)/(auth)/me/settings/`)
- `layout.tsx` — 2-col grid, `overflow-x-clip` for RPage's `w-screen`
- `page.tsx` + `page.client.tsx` — hub
- `general/`, `profile/`, `account/`, `security/`, `notifications/` — sub-routes
- `connected/`, `appearance/`, `subscriptions/`, `highlights/` — redirects only
- `_helpers/` — `setLocale.ts`, `searchPlaces.ts`, `updateProfile.ts`, `LocaleField.tsx`

**Mapbox proxy**
- `src/app/api/places/search/route.ts` — server-only, holds `MAPBOX_API_KEY`

**i18n**
- `messages/en.json`, `messages/ko.json` — `Settings.*` namespace migration in progress

---

## Phase 2 — what shipped

### 2.1 Dropdown links corrected (`RPDropDown.tsx`)
- **Settings**: `/me/settings/profile` → `/me/settings` (hub, not a sub-route — lets the user land on the editorial overview canvas first)
- **Your Posts**: `/vault/collections/posts` → `/me/posts`

### 2.2 `SIDE_DRAWER_LINKS` revised (`src/constants/navigation.ts`)
Drawer is now site-nav only per the three-lane model. Pulled out: Search (⌘K's job), Saved (UserDropdown's library lane), Latest (redundant with Essays). Pushed in: Reception, Essays, Surf, Radio, Directory, Membership, The Team. Radio player remains integrated below the link list.

### 2.3 `/me/posts` editorial index
- `page.tsx` — server, gates on `currentUser` + role (user/author/editor/admin/patron), redirects unauth
- `_helpers/queryUserPosts.ts` — `payload.find` with `draft: true`, `overrideAccess: false`, `user`, scoped to `author.equals = user.id`. Returns `{ rows, counts: { all, published, draft } }`
- `page.client.tsx` — sticky editorial header (eyebrow "Authorship" + h1 "Posts" + count, "+ New post" deeplink), tabs (All / Published / Drafts) with `LayoutGroup` indicator matching `/me/library/saved`, 16:9 cover cards with status badge + relative-time + tags, hover-revealed Edit/Read CTAs deeplinking to `/vault/collections/posts/{id}` and `/essays/{slug}`, per-tab empty states with "Start a draft" CTA
- Initial-letter fallback when post has no cover

### 2.x — what was *not* done in this pass (queued/deferred)
- **Theme + locale toggles in SideDrawer body.** The handoff lists them as ambient utility for the drawer; the drawer body currently only hosts the link list and `DrawerPlayer`. Adding toggles is a small follow-up component edit, not a constants change — queued.
- **i18n keys for `/me/posts`.** Surrounding `/me/library/*` pages still ship inline English; deferring until that whole subtree migrates to `Settings.*`-style namespaces.
- **View counts.** Polymorphic `userViews.target` query needs care; deferred — column reserved in the card layout (relative-time slot can pair with views badge later).

### 2.4 `/me/posts` redesign passes (post-Phase-2.3 iteration)
Three iterations on the surface based on user critique:

**Iteration A — first cut (the "previous direction").** Sticky header with `border-b border-border/30 bg-background/90 backdrop-blur-md`, `max-w-7xl` content, mono-caps eyebrow, mono-caps tabs, 16:9 cover-card grid, status-pill badge, `◫` watermark on empty state. Rejected — sticky bar competed visually with the floating capsule global header (full-bleed border vs. centered ~645px capsule), and "narrower than the page" feeling.

**Iteration B — Fey panel attempt.** Lifted dark-pool `<Panel>` with row-pill list inside. Rejected — Fey direction is correct for `/me/settings/*` but wrong for an authoring shelf; the user's content shouldn't read as a settings table.

**Iteration C — editorial pressroom (current).** `max-w-5xl 2xl:max-w-6xl` reading-width column. Rail bound to content width (no full-bleed chrome) — only chrome is hairline-gradient top + bottom edges, fading at the ends. List = editorial newspaper-stack rows: PUBLISHED · date · 2w eyebrow (DRAFT · italic title for drafts), large sans title, subtitle, mono-caps tags, trailing thumbnail (md+) or initial-letter fallback. Read/Edit chips inline at the bottom of the title block (NOT absolute top-right — that collided with the thumbnail). Below md, sticky disengages, tabs flow inline.

**Copy rule (post-iteration C critique).** The user rejected manufactured taglines, passive subject-omission, and noun
stacks. Use standard, factual sentences with a clear subject and verb. Outcome:
- Masthead tagline removed entirely. Tab counts already show "All N · Published M · Drafts K"; the prose tagline was redundant.
- Empty-state copy rewritten:
  - "You haven't written anything yet." / "Your drafts and published posts will show up on this page."
  - "You haven't published anything yet." / "Drafts you publish will appear on this page."
  - "You don't have any drafts." / "Posts you start without publishing stay here as drafts."

### 2.5 — Posts table-grade controls (NEXT — user-confirmed unblock)
After several editorial-pressroom iterations on `/me/posts`, the user confirmed the underlying problem is *not* the visual direction but the *interaction model*: a list of editorial rows with hover-revealed actions doesn't carry weight when you have N posts, especially scaling. User: *"tables may be a fix to all of this."* That's the next phase.

Treat as one design pass — DON'T ship piecemeal:
- **Multi-axis filters** beyond status (date range, tags, has-cover, author when collaborators land, etc.). Probably as filter chips above the table or a popover filter set.
- **Multi-row selection** with bulk actions (publish drafts, archive, delete, set-tag). Checkbox per row + select-all + sticky bulk-action bar when ≥1 row selected.
- **Sort key picker** (updated, published, title, views-once-wired). Column-header click for sort direction.
- **Real pagination** — the server `queryUserPosts` is currently hard-capped `limit: 200` and doesn't propagate `totalDocs`. Cursor-based pagination + `totalDocs` propagation belong here. The current "Showing N of {tabCount} — older posts are not loaded yet." is a placeholder.
- **Column structure** to consider: cover thumbnail (small) · title + subtitle · status · tags · last-edited · views · actions. Density is the goal — table rows can be tighter than editorial rows.

### 2.4 outcome — to revisit AFTER 2.5
The editorial-pressroom direction shipped (current state) but isn't loved. Holding the file as-is until the table pass; it's reachable, deeplinks work, copy is in the right tone register. The visual direction can be revisited once the interaction model (table) is in place — at that point the question becomes whether the table itself is dressed editorially or industrially.

### Lessons from 2.4 iterations (worth keeping)
- **Project uses 10px-rem.** Tailwind `rem`-tokens resolve at 10px/rem here, so `max-w-7xl` (80rem) is 800px not 1280px. Use `[px]` arbitrary values when an exact width matters. Logged in project memory.
- **The site has a floating capsule global header** (animated width, ~645–full viewport, fixed position). Page sticky chrome that uses `border-b backdrop-blur` competes with the capsule visually. Pages should use hairline-gradient edges + `bg-background` (not `bg-background/90`).
- **`(auth)/me/*` is not strictly Fey direction.** CLAUDE.md's "Admin surfaces (Fey direction)" applies to settings-cohort surfaces (`/me/settings`, `/vault`). `/me/posts` is editorial-author cohort — Fey panels don't fit. The CLAUDE.md scope rule is broad; the user's content surfaces (posts list, library) are editorial, not admin-table.
- **Copy:** plain declarative subject + verb. No "shelf is waiting" and no noun-stack taglines. Drop taglines when the
  interface already provides the same information.
- **Layout shift on hover is non-negotiable.** Reserved space + opacity beats `display: none` + hover.
- **Page chrome anchors viewport, content reads at editorial cap.** All content elements (masthead, rail, rows, footer) share one `max-w-[1280px]` left-anchored cap; structural rules (hairlines) attach to the outer full-width container so they extend to viewport edges.
- **Asymmetric outer padding on lg+** clears the SideDrawer/SideNotch peek. `lg:pl-24 xl:pl-32 2xl:pl-40 lg:pr-12`.

---

## Diagnoses for Phase 2 (link distribution) — historical, kept for reference

### Current state — `UserDropdown` (`RPDropDown.tsx`)
- Profile (`/@slug`) ✓
- **Settings → `/vault/account` ❌** (admin panel, wrong for regular user — should be `/me/settings`)
- Tickets (`/tickets/my`)
- **Your Posts → `/vault/collections/posts` ❌** (admin, should be `/me/posts`)
- Sign Out

### Current state — `SideDrawer`
4 links: Latest, Directory, Search, Saved + radio player. Sparse. Search and Saved duplicate dropdown / SearchBar.

### Current state — `SearchBar` (⌘K)
- Search ✓
- Default state: 2 nav items (Essays / The Team) + account/get-started
- Submenu: 2 items
- **No jump-to commands, no recents, no quick actions, no context awareness.** Massive room for ⌘K to become a real command palette.

### Phase 2 immediate tasks
1. **Fix the two wrong links in dropdown.** `Settings → /me/settings`, `Your Posts → /me/posts`.
2. **Revise `SIDE_DRAWER_LINKS`** per the three-lane model — pull Search/Saved out, push site-nav in (Reception, Essays, Surf, Radio, Directory, Membership, The Team).
3. **Build `/me/posts`** as the editorial index surface (drafts/published, view counts via `UserViews`, last-edited, tags). "Edit" + "New post" deeplink to `/vault/collections/posts/...`.

---

## Phase 3 — what shipped

### New files
- `src/components/UX/CommandKey/jumps.ts` — typed `Jump` records: `DISCOVER_JUMPS`, `SIGNED_IN_JUMPS(slug)`, `SETTINGS_JUMPS`, `SIGNED_OUT_JUMPS`. Adds the hint text that renders as `rp_tag` on the right of each row.
- `src/components/UX/CommandKey/useRecents.ts` — `useRecentsTracker()` hook + `useRecents(path)` core. localStorage-backed (key `rp:cmdk:recents`), capped at 6 entries, skips `/api/`, auth flows, onboarding. Pretty-prints paths via a `PATH_LABELS` table (`/me/settings/security` → `Settings · Security`, `/@slug` → `@slug`, `/essays/foo-bar` → `Essay · Foo Bar`, etc.). Tracks current pathname via `usePathname()` since `SearchBar` mounts in `HeaderClient` on every page.

### `SearchBar.tsx` changes
- Default state restructured into 5 groups: **Recent** (≤5, only when present and excluding current path), **Discover** (Reception, Essays, Surf, Radio, Directory, Team, Membership), **Yours** (signed-in: profile, saved, lists, posts, inbox, settings), **Settings** (signed-in: General/Profile/Account/Security/Notifications), **Quick actions** (theme toggle, locale toggle via `setLocaleAction`, copy current link, sign out).
- Quick actions for signed-out users: theme, locale only (no copy-link / sign-out).
- Fixed two stale `/vault/account` references (default-state Settings entry + the SubCommand "Settings" SubItem) → `/me/settings`.
- Locale label uses `useLocale()` from `next-intl`; switch action calls the existing `setLocaleAction` server function. Sign-out posts to `/api/users/logout` then `location.reload()` (matches `RPDropDown.tsx`). Copy-link uses `navigator.clipboard.writeText(window.location.href)`, fails silent.
- Theme toggle now closes the palette before flipping (the existing footer toggle stayed in place; the in-list quick-action mirrors it).
- New `JumpItem` helper renders a `Jump` as a `LinkedCommandItem` with `type` = hint, so the existing `rp_tag` styling kicks in.

### Deferred (Phase 3 follow-ups, queued)
- **Context-aware suggestions.** Goal: on `/essays/[slug]` surface "Edit this draft" (when author), "Save", "Copy link"; on `/@user` surface "Follow / unfollow"; etc. Needs route-shape detection + a small registry mapping `(route pattern, signed-in role) → JumpItem[]`. Defer until the route shape registry exists; should live alongside `jumps.ts`.
- **Filter tokens in input** (`type:essay silence`, `from:@kim`, etc.). The CLAUDE.md design system explicitly calls for "categories live as filter tokens, not tabs." Needs an input parser feeding the search API. Bigger surface than this pass.
- **Recents purge UX.** No way for the user to clear the recents list yet. Add a "Clear recent" item at the bottom of the Recent group, or expose via the Actions submenu.
- **Cmdk fuzzy-filter on jump-to during typing.** Current behavior: typing hides the default-state groups in favor of search-API results. A nicer pattern is to keep jump-to items rendered (cmdk filters by `value`) and merge them under search results, so "set" matches "Settings · Security" alongside content matches.

---

## Phase 3 — ⌘K command palette upgrade (original brief)

Existing surface: `src/components/UX/CommandKey/SearchBar.tsx`. Already has `cmdk`, `CommandDialog`, debounced search, and a footer subcommand. Bones are there.

What's missing (target):
- **Jump-to commands** — every destination indexed (sections, settings sub-routes, public profile, library, etc.)
- **Recent visits** — pull from a small client-side recents store
- **Quick actions** — toggle theme, sign out, copy current link, go to settings/section, switch language
- **Context-aware suggestions** — when on a post, surface "edit this," "share," "save"; when signed-in, surface library; etc.

Design guidance from CLAUDE.md / `DESIGN_SYSTEM.md`:
- ⌘K is "the stealthiest affordance — a quiet piece of product-power"
- "Search as literature"
- Categories live as filter tokens in the input (`type:essay silence`), not tabs

---

## Phase 4 — admin (`/vault`) audit

Goal: tone alignment so `/me/posts` → `/vault/collections/posts/...` deeplinks don't feel like crossing a border.

Not yet scoped beyond: bring Payload admin chrome closer to editorial voice, focus on the surfaces a non-admin user lands on (the post-editing pages specifically). Do NOT try to redo every Payload internal screen.

---

## Open follow-ups (not in any phase)

- **Payload schema add:** `streetAddress` / `addressLines` block on Users, then unlock the Address `<LockedField/>` placeholder in Account → real `<EditableField/>`. Migration + types regen required.
- **Plaque (3D titanium membership card):** reserved companion slot in `<Masthead/>` (xl+). Lazy-loaded with static-PNG first-paint fallback. Not on mobile.
- **RPage hoist:** ideal architectural fix is to lift `<RPage>` from per-page to layout level. Attempted previously, broke transitions. Deferred. Current `overflow-x-clip` on settings layout is the band-aid for RPage's inner `w-screen`.
- **GlassPanel typecheck:** ✅ Fixed by switching to `createElement` to bypass JSX-strictness with the `ElementType` polymorphism. Settings tree now zero-error. The file itself is still in the legacy "slated for deletion" list, but the path now is *delete when callers also retire* (currently still consumed via `SectionEmpty` from active `notifications/page.tsx`, and via `SettingsRow` from dead-but-untouched `connected/appearance/highlights` page.client.tsx — those page.client files are dead code behind redirects and can be `pnpm attic`'d together with the legacy primitives in a single cleanup pass).
- **Dead `SettingsCompanion.tsx` / `SettingsCompanionAuto.tsx`:** already deleted, but check git status for stragglers.

---

## When picking this up in a new session

1. Read this file end-to-end before doing anything.
2. Confirm `pnpm tsc --noEmit` against the settings tree shows only the two known `GlassPanel` errors.
3. Start with **Phase 2.1**: fix the two wrong links in `UserDropdown`. Smallest possible win, immediate user-visible improvement.
4. Then **Phase 2.2** (drawer revision) → **Phase 2.3** (`/me/posts` editorial index) → Phase 3 → Phase 4.
5. Persist any new queue items to this file as you go.
