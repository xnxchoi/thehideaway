# User Flows Inventory — 2026-04-12

Map of auth, onboarding, and user data management surfaces for Phase 3 functionality audit.

---

## Auth Routes

- `src/app/(frontend)/(site)/(auth)/sign-in/page.tsx` — email/password, OAuth (Google, Naver), passkey. Redirects to `/me` on success.
- `src/app/(frontend)/(site)/(auth)/sign-up/page.tsx` — registration. Redirects to `/me` on success.
- `src/app/(frontend)/(site)/(auth)/forgot-password/page.tsx`
- `src/app/(frontend)/(site)/(auth)/reset-password/page.tsx`
- `src/app/(frontend)/(site)/(auth)/accept-invitation/[id]/page.tsx`

**Auth stack:** Better Auth client (`src/lib/auth/client.ts`) with plugins: email/password, Google OAuth, Naver OAuth, passkeys (WebAuthn), TOTP 2FA, magic link, organization, multi-session.

---

## Onboarding (Registration Tour)

**Entry point:** `src/app/(frontend)/(site)/(auth)/me/onboarding/page.tsx`
**Orchestrator:** `src/components/UX/Tour/RegistrationTour.tsx`

Path classification:
- `PASSIVE_PATHS` — tour pauses, doesn't re-inject
- `AUTH_PATHS` — auth-related pages where tour should not interfere

**Steps** (`src/stores/Tour/TourStore.ts`):
1. `welcome` — severity: `required`
2. `profile` — severity: `required` — firstName, lastName (required); bio (optional ≤200 char)
3. `details` — severity: `low-optional` — location, link (both optional)
4. `complete` — severity: `complete`

**Form schemas:** `src/components/UX/Tour/Onboard/Form/schema.ts`

**Severity types:** `required`, `high-optional`, `low-optional`, `complete`

---

## Account Settings

**Entry:** `src/app/(frontend)/(site)/(auth)/account/[path]/page.tsx` (dynamic segment)
**UI:** `src/lib/auth/betterauth-ui/src/components/account/account-view.tsx`

**Tabs:** SETTINGS, SECURITY, ORGANIZATIONS, API_KEYS

Manages: profile info, email, password, 2FA, passkeys, sessions, API keys, org memberships.

---

## User Data Management

### Saved / Bookmarks
- **Page:** `src/app/(frontend)/(site)/(auth)/me/saved/page.tsx`
- **Collection:** `src/payload/collections/Bookmarks/`
- **Server actions:** `createBookmark.ts`, `deleteBookmark.ts` (all use `overrideAccess: true` — see security-surface.md #5)

### Lists / Compilations
- **Page:** `src/app/(frontend)/(site)/(auth)/me/lists/page.tsx` (index)
- **Detail:** `src/app/(frontend)/(site)/(auth)/me/lists/[hashId]/page.client.tsx`
- **Public view:** `src/app/(frontend)/(site)/(content)/lists/[username]/[hashId]/page.client.tsx`
- **Collection:** `src/payload/collections/Compilations/`
- **Server actions:** `src/payload/collections/Compilations/actions.ts` — `createCompilation` has the unverified-userId issue (see security #7)

### Highlights / Citations (Highlightr)
- **Collection:** `src/payload/collections/Citations/`
- **Component:** `src/components/UX/Highlightr/HighlightMenu.tsx`
- **Store:** Zustand provider in `src/components/UX/Highlightr/providers/`
- **Docs:** `readmes/HIGHLIGHTR.md`

### Follows
- **Endpoints:** `getUserFollowers.ts`, `getUserFollows.ts` (see security #4 — no auth, unbounded)
- **Collection:** `src/payload/collections/Follows/`

### History / Views
- **Collection:** `src/payload/collections/UserViews/`

### Profile
- **Collection:** `src/payload/collections/Profile/`
- **Public page:** `/users/:username` (via rewrite from `/@:user/:path*`)
- **Endpoint:** `getProfileBookmarks.ts` (see security #5 — `overrideAccess: true`)

---

## Navigation Constants

**File:** `src/constants/navigation.ts`

### MENU_LINKS (lines 16–23) — main full-screen menu
```
/
/essays
/radio
/search
/plans
/the-team
```

### SIDE_DRAWER_LINKS (lines 29–34) — side drawer
```
/essays
/users
/search
/me/saved
```

**Notable gaps to verify in Phase 5:**
- No direct link to `/me/lists` in nav
- No direct link to `/me/highlights` or citations view
- `/me/saved` is in side drawer but not main menu
- No profile/account shortcut in main menu
- Discover/surf (shorter-form content) not linked
- Categories/tags taxonomy has no top-level entry

---

## Layout / Shell

- `src/app/(frontend)/layout.tsx` — root layout with providers
- `src/components/core/Header/HeaderClient.tsx` — responsive header
- `src/components/UX/Menu/index.tsx` — full-screen nav overlay
- `src/components/UX/SideDrawer/index.tsx` — 24vw desktop / bottom sheet mobile
- `src/components/UX/CommandKey/` — CMDK command palette

---

## URL Rewrites (from `next.config.ts`)

- `/@:user/essays/:slug` → `/essays/:slug`
- `/@:user/:path*` → `/users/:user/:path*`

---

## Phase 3 Flow Exercise Checklist

- [ ] Sign up → onboarding → welcome → profile → details → complete → `/me`
- [ ] Sign in (all 5 providers) → `/me`
- [ ] Forgot password → reset → sign-in
- [ ] Account settings → each tab loads, saves, errors
- [ ] Create bookmark from post → see in `/me/saved` → remove
- [ ] Create list → add item → rename → make private → delete
- [ ] Create highlight → add memo → share → delete
- [ ] Follow user → unfollow → verify counts
- [ ] Profile edit → locale switch → signout
- [ ] 2FA enable → disable
- [ ] Passkey enroll → sign-in with passkey
