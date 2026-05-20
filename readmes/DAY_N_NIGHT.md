# Day n Night — Event Landing & RSVP

Cross-session continuity doc for the **Day n Night** event landing, RSVP'd guest credits, and ticketing flow.

**Event date:** Sunday, 24 May 2026
**Location:** Haebangchon / Itaewon, Seoul
**Event slug:** `day-n-night`
**Status:** Phase 5a code-floor work shipped 2026-05-20 (P4C + audit CRITICALs/HIGHs + Survival Kit scaffold). **Launch gate NOT yet green** — user walkthrough flagged regressions + polish gaps not caught by the static audit: Scrubber stopped working, reveals hidden when acts enter viewport, Opening reveal completes during loader hand-off, typography too tight, sections land awkwardly without a soft-pin, Survival Kit needs redesign. Tracked as **Phase 5b-UF** in § 14.6 (after Phase 5a) and as tasks #55-#61. See § 13 iteration log for the chronological trail.

> This is the single source of truth for the surface. `DAY_N_NIGHT_AUDIT.md` and `DAY_N_NIGHT_DRESS_REDESIGN.md` have been folded in (§ 14 and § 15 respectively) and archived to `.attic/readmes/`.

---

## 0. Purpose

Build a bilingual (KO body + EN titles) promotional and informational surface for a one-off cookout-to-cocktails event, with three distinct sub-paths:

1. **Root** (`/day-n-night`) — promo landing with simplified and immersive view variants.
2. **RSVP'd guests** (`/day-n-night/guests`) — looping credits-style guest list with active-profile popovers.
3. **Ticketing** (`/tickets/day-n-night`) — 4-step purchase flow reusing the existing Events + Tickets infrastructure.

The brand undercurrent is "change" — paired thematically with the unreleased perfume "catalyst." The visual story must carry day → night transition without revealing the perfume.

---

## 1. Route layout

```
/day-n-night                          ← root landing (simplified ↔ immersive)
/day-n-night/guests                   ← RSVP'd credits
/day-n-night/my                       ← purchaser order management (links + 48h password state)
/day-n-night/claim/[token]            ← gift-ticket redemption (gated by order password)

/tickets/day-n-night                  ← existing gated purchase page (slug=day-n-night)
/tickets/day-n-night/exclusive        ← post-event content (existing pattern)
/tickets/my/[ticketId]                ← existing per-ticket QR/check-in page
```

**Why both `/day-n-night` and `/tickets/day-n-night`?** The promo surface needs full visual freedom (R3F, horizontal scroll, custom loader); the gated purchase flow already has a polished, production-tested implementation. Cleanest reuse without mutating working code.

**Promo → ticketing handoff:** the "RSVP" CTA on `/day-n-night` deep-links to `/tickets/day-n-night`. The gate password is shared via the same channels the user already uses (DM / private invite).

---

## 2. Sub-feature scope

### 2.1 Root landing

Two co-existing views, switchable via:
- **Cookie** (`day-n-night.view-pref`) — set by the toggle, read server-side.
- **Heuristic** — first visit → immersive; subsequent visits → simplified (per spec, "users will want to see [simplified] as the event date draws near").
- **Toggle** — small switch component, top-right, persists choice.

**Simplified view** — week.wild.plus/athens-26-grade minimalism. Date, time, location, dress code one-liner, RSVP CTA. Single screen, no scroll story.

**Immersive view** — full compsych.konpo.co-grade story. See § 6.

### 2.2 RSVP'd guests (`/day-n-night/guests`)

Direct adaptation of [Credits/index.tsx](src/components/sections/Credits/index.tsx):

- **Desktop:** GSAP-ticker vertical looping scroll, centermost item is "active." Hover → set active. Click → focus modal.
- **Mobile:** horizontal snap scroll, snapped index = active. Tap → focus.
- **Active profile popover** — name + portrait + 200-word intro. Focus state expands to instagram handle + up to 5 photos. Photo gallery: swipable on mobile, 5-up grid on desktop (matches `petragarmon.com/en/talent`).
- **Confetti gate** — the Credits component already triggers confetti per-person via a boolean. Our gate condition: `Credited.patronage = (viewerId === author.id)` — it's *your* profile in focus.

**Data source:** Profile rows with `rsvp.intro` set (opt-in marker). `rsvp.tier` (`host` / `past` / `guest`) maps onto Credits' position slots.

### 2.3 Ticketing flow (`/tickets/day-n-night`)

The existing `/tickets/[event]/page.tsx` already implements the gate-password flow. The 4-step spec maps onto it as follows:

| Spec step | Implementation |
|-----------|----------------|
| 1. Welcome | New screen inside the existing page, shown before gate input. |
| 2. Email confirm via Brevo | New: Better Auth `emailOTP` plugin (already wired) → 6-digit code, no account required. |
| 3. Take name | New step inside the gated purchase form. |
| 4. Ticket purchase + URL generation + admin confirmation + 48h password | Reuses existing Tickets collection + onTicketPaid hook. **New** order-group + order-password concept (see § 7.2). |

---

## 3. Data model — what's reused vs new

### Reused (no changes)

| Collection | Role |
|-----------|------|
| `events` ([Events/index.ts](src/payload/collections/(consumption)/Events/index.ts)) | Event row keyed by `slug=day-n-night`. `gate_password` is the per-event purchase gate; `payment_instructions` carries the Toss bank details. |
| `tickets` ([Tickets/index.ts](src/payload/collections/(consumption)/Tickets/index.ts)) | One row per individual ticket. Existing `claim_token` + `claim_email` + `paid` flag cover gift redemption. `onTicketPaid` hook already sends activation email via Brevo. |
| `users` / `profile` | Account + public profile. Profile gets a small `rsvp` group (see § 7.1). |
| `notifications` | Payment-confirmation notification fires when admin flips `paid`. |

### New (this feature)

| Concept | Implementation | Status |
|---------|---------------|--------|
| Order grouping | New `ticket-orders` collection (option B from §7.2). Columns: `purchaser`, `event`, `purchaser_name`, `paid`, `paid_at`, `password`, `password_issued_at`, `password_expires_at`. `Tickets.order` is the FK. | DONE — migration `20260519_180000_ticket_orders.ts` |
| Per-order 48h password | Generated inside `ticket-orders` `afterChange` hook (`issueOrderPaidPassword`) the moment an admin flips `paid` to true. 8 chars from an ambiguity-safe alphabet (no 0/O/1/l/I); 48h TTL stamped on `password_expires_at`. **Mail-out not yet wired** — password is persisted but not emailed. | DONE (persistence) / PENDING (mail) |
| Initial recipient name on gift tickets | `Tickets.gift_initial_name` text (editable by purchaser) + `Tickets.gift_name_locked` checkbox (admin-only). | DONE — same migration |
| RSVP profile fields | `Profile.rsvp` group: `tier` enum (`host` \| `past` \| `guest`, default `guest`), `intro` (textarea, 200 char), `igHandle` (camelCase), `gallery` (array of `userMedia`, max 5). | DONE — migrations `20260518_180000_profile_rsvp_group.ts` + `20260519_120000_profile_rsvp_tier.ts` |
| View-preference cookie | `day-n-night.view-pref` — `"immersive" \| "simplified"`. Client write, server read. | DONE |
| **Event-gate password layer (new — not in original spec)** | HMAC-SHA256-signed HttpOnly cookie scoped to `/day-n-night`, 30-day TTL. Server action constant-time-compares against `events.gate_password` and issues the signed cookie. Route-group `layout.tsx` gates *everything* under `/day-n-night/*` (landing, guests, my, claim). Helpers in `src/lib/event-gate.ts`; UI in `src/components/sections/DayNNightGate/`. | DONE |

### Migrations

Per CLAUDE.md's load-bearing migration policy (`readmes/MIGRATIONS.md`):
- Every new column wrapped in `IF NOT EXISTS` / `DO $$` guard.
- Every constraint/index re-runnable.
- Mirror Payload's schema shape; let `pnpm generate:schema` produce the SQL and only edit the generated migration to add safeguards.

---

## 4. i18n

Top-level namespace: **`Event`** (forward-compatible — future events get `Event.{slug}`).

Shipped namespaces (en + ko lockstep, see `messages/en.json` / `messages/ko.json`):

```
Event.DayNNight.*                      ← landing copy (title, date, dressCode, included, entry, rsvpCta, viewToggle, loader, footer, scrollHint, audio, scrubber, moodboard, …)
Event.Guests.*                         ← guests-page strings (eyebrow, title, subtitle, tier, empty, intro, instagram, gallery, actions, you, navigation)
Event.Gate.*                           ← event-gate password UI (eyebrow, title, subtitle, placeholder, submit, submitting, errors.{missing|invalid|noEvent|generic}, hint, footer)
Event.Rsvp.*                           ← 4-step purchase flow + my + claim (steps.welcome, steps.otp, steps.name, steps.purchase, my.*, claim.*)
```

Notes:
- "Day n Night" is kept English in both locales per the original spec exemption.
- Adding a new key requires a same-diff edit to both locale files. Missing keys fail loudly at runtime via `MISSING_MESSAGE` per `next-intl` defaults.

**No** locale-conditional ternaries in component files. **No** parallel `*Ko` / `*En` constant pairs. The `BUSINESS` locale-pair pattern is explicitly forbidden per CLAUDE.md.

**Known i18n gaps** (see § 14 H5–H8): `/my` page renders 5 hardcoded English strings; `/guests` page hardcodes `TIER_TITLES` even though Korean keys exist at `Event.Guests.tier.*`; `ClaimGate.tsx` concatenates a raw `…` onto a translated submit label. These are Phase 5 blockers.

---

## 4.5 Event-gate password layer

A second, surface-wide password layer landed after the original spec was written. It is **distinct from `events.gate_password` as used by `/tickets/[event]`**, even though it reads the same database column.

| Surface | Gate | Persistence |
|---------|------|-------------|
| `/tickets/day-n-night` (existing) | Same `events.gate_password` value entered into the existing client gate. | `sessionStorage` — re-prompts every browser session. |
| `/day-n-night/*` (new) | Same `events.gate_password` value, validated by a server action that issues an HMAC-signed cookie. | HttpOnly cookie `event-gate.day-n-night`, 30-day TTL, scoped to `/day-n-night`. |

### Pieces

- **`src/lib/event-gate.ts`** — `issueEventGateCookieValue()` and `verifyEventGateCookieValue()`. Cookie format is `<expiresAtMs>.<hex-hmac>`; HMAC is computed over `eventId + expiresAtMs` using `PAYLOAD_SECRET`. Rotating the secret invalidates every outstanding cookie.
- **`src/components/sections/DayNNightGate/`** — `index.tsx` (the editorial-mono gate UI as a client component using `useActionState`) and `action.ts` (the `"use server"` action that does the constant-time compare + cookie issuance + `revalidatePath`).
- **`src/app/(frontend)/(site)/(pages)/day-n-night/layout.tsx`** — route-group layout that runs on every request to `/day-n-night/*`. It looks up the event row, verifies the cookie, and short-circuits to `<DayNNightGate />` when the cookie is missing/tampered/expired. Falls open (renders children) when the event row doesn't exist or `gate_password` is null, so seeding the row doesn't brick the page.

### Design notes

- The raw password is **never persisted client-side** — the cookie carries an HMAC tied to the event id, not the password itself.
- Tampering with `expiresAtMs` invalidates the HMAC (constant-time check), so the cookie can't be back-dated or extended.
- Cookie path is `/day-n-night` (not `/`), so it doesn't leak to other surfaces.
- `path` is intentionally not `/` so logging into another invite-only surface in the future can use a separately scoped cookie.

### Operational

- Seed the event row with a gate password before the surface goes live (Payload admin → Events → day-n-night → Gate password). Without a value, the gate is open by design.
- Rotating the password invalidates `/day-n-night` access only after existing cookies expire (30 days). Rotating `PAYLOAD_SECRET` invalidates them immediately.
- The existing `/tickets/[event]` gate (sessionStorage) is unchanged. Both layers can run with the same password.

### Known weaknesses (Phase 5)

- **No rate-limit on the POST.** A 30-day cookie means one successful brute-force = persistent access. See § 14 H1.
- **HMAC is keyed on `eventId` only** — password rotation does not invalidate existing cookies. See § 14 H2.
- Cookie `path: "/day-n-night"` also matches `/day-n-nightclub` per RFC 6265 prefix rules. Cosmetic, no current impact (no sibling route). See § 14 L3.

---

## 5. Theme

Force **dark** on the immersive view (matches the night-mode endpoint of the day→night transition); allow the user's theme on the simplified view. Wired via the existing client-component-with-`useTheme`-side-effect pattern from [plans/page.client.tsx](src/app/(frontend)/(site)/(pages)/plans/page.client.tsx).

---

## 6. Immersive view — visual & technical design

### 6.1 Story arc

The page tells a single story across two acts, tied to one continuous scroll:

1. **Daybreak** — landing state. Sun is below horizon, sky is pre-dawn purple-blue.
2. **Sunrise → midday** — sun rises through the loader handoff, hits its zenith. Sky transitions to clear bright tone. BBQ + cookout copy lives here.
3. **Sunset** — sun arcs down. Sky warms to amber. Music + live performance copy.
4. **Nightfall** — sun is replaced by moon. Sky deepens to navy. Dress-code (night side) + cocktail copy.
5. **Closing** — RSVP CTA, footer.

### 6.2 Layout

- **Horizontal scroll** for the main timeline (mapped from vertical scroll via GSAP ScrollTrigger pin + translateX). The compsych.konpo.co pattern.
- **Looping scroll** — the timeline loops back to daybreak after closing, signaling "this story repeats; you can re-enter."
- **Mobile** — collapse to vertical scroll; the sky/sun still animates via scroll progress, but the timeline content stacks vertically.

### 6.3 R3F scene

Mount via existing shared `<Canvas>` ([MainInternal.tsx](src/components/core/MainInternal.tsx)) using a `<View>` portal. A second Canvas is to be used only when it is the clearly (runtime resource, weighted 0.7 & dev resource, weighted 0.3) efficient approach.

- **Sun** — sphere with shader-driven emissive intensity. Position driven by ScrollTrigger progress (parametric arc).
- **Moon** — same sphere geometry, swapped material at threshold via opacity crossfade.
- **Sky** — full-screen gradient quad behind the sun, color uniforms driven by scroll progress through a color stop list (pre-dawn → midday → sunset → night).
- **Grain overlay** — at low opacity for atmospheric depth (matches the project's Fey-direction grain texture).

### 6.4 Page loader

Net-new sun loader (existing `Hideaway_Preloader` is typographic grid, not suitable here):

- Initial state: sun below the "horizon"; horizon is placed slightly below vertical center of viewport; sky pre-dawn.
- Loader progress 0→100% drives sun rise from `y = -0.6vh` to `y = 0.3vh` (matches the first hero scroll position).
- At 100%, **hands off to the scroll-driven scene without snap** — the sun and the horizon zoom out, the horizon pushed downward and the sun toward the first hero scroll position at matched pace. The horizon fades out as it nears the bottom viewport, and the user is now in the immersive scene at scroll=0.

Location: `src/components/UX/Preloader/SunLoader.tsx`. Route-scoped (only mounts on `/day-n-night` immersive view).

### 6.5 Acts (Timeline)

The immersive timeline is composed of 5 acts laid out horizontally inside a pinned track. Each act has its own `--act-w` (CSS var multiplied against `100vw`). The Timeline measures resulting widths in `setLayout`; no JS table to keep in sync.

| Act | `--act-w` | Notes |
|---|---|---|
| Opening | 1.0 | Loader handoff lands here. `.openingStack` carries the display title. |
| Cookout | 1.0 | Polaroid moodboard + body copy. |
| **Dress** | **3.2** | Horizontal-parallax corridor: eyebrow lead-in (0.2 vw) + Room 01 (1.5 vw) + Room 02 (1.5 vw). See § 15 for full design rationale. |
| Night | 1.0 | "Mood shift." section + announcement line ("Something quiet, unannounced…") + tribute block. |
| Closing | 1.0 | RSVP CTA + footer. **Structurally broken — see § 14 C6.** |

### 6.6 Polaroid texture system

`src/components/sections/DayNNight/Immersive/Polaroid.tsx` is a discriminated-union component with three variants:

| Variant | Use | Renders |
|---|---|---|
| `clean` (default) | Cookout / Night moodboards | Plain paper-card frame, per-photo aspect, serif caption below. |
| `stamped` | Dress rooms | Photo + mint-tinted `card-N_front-clear@2x.png` overlay on top (frame border + corner doodle). Locked to portrait 0.76 aspect; photo `object-cover` into the texture's transparent window. Serif caption below the card. |
| `back` | Dress rooms (ambient) | Standalone "back of card" texture; no photo, no caption. Decorative scatter. |

Master polaroid aspect: `POLAROID_ASPECT = 0.76` (matches the texture PNGs, ≈956×1247–1268).

Texture assets live at `public/assets/textures/photograph/`:
- `card-2_front-clear@2x.png`, `card-4_front-clear@2x.png` — overlay variants
- `card-4_back-2@2x.png` — back variant
- `672a4022c04412b253b0af22_card-2_back@2x.png` — back variant (CMS-id prefix retained on disk; the path map in `Polaroid.tsx` is the single source of truth, so the asset isn't renamed)

Caption voice is unified across all variants and acts: upright serif at 12px (in 10px-rem scale ~ `text-[12px]`), no italic, no line-clamp. The marker-pen voice was permanently retired during the dress redesign — see § 15.

### 6.7 Reveals

Reveal choreography in the immersive view comes from two cooperating systems:

1. **Motion `<RevealStage>` / `<RevealItem>`** (`src/components/sections/DayNNight/Immersive/Reveal.tsx`) — stage + child variants, `whileInView`-driven OR `active`-prop-driven. The latter is for surfaces that live inside a GSAP-pinned horizontal track, where `IntersectionObserver` fires unreliably (because the elements never leave the viewport on the vertical axis).
2. **`useScrollTimeline` hook + DressRoom** — store-progress-driven GSAP child timelines. See § 15 for the full design.

Known issue (Phase 5 H9): Cookout / Night / Closing still use `whileInView` and may fire on mount instead of on horizontal arrival. Migrate them to the `active`-prop pattern driven by `useDayNNightScene.progress` thresholds — same shape as the Loader.

### 6.8 Performance budget

Per global rules (web/performance.md):
- LCP < 2.5s. Hero is the sun + initial copy — preload nothing heavy; the R3F scene is below LCP-critical content (or the sun is the LCP and we accept the cost).
- Bundle: < 150kb gzipped JS for landing page. R3F + drei is heavy — load via `dynamic(() => import(...), { ssr: false })` and only on immersive view.
- Motion stays on compositor-friendly properties (transform, opacity, filter).
- 4 polaroid texture PNGs ≤ 140 KB each (< 600 KB total added to first scroll into Dress).

---

## 7. Closed decisions (kept as audit trail)

All five decisions in this section have been resolved. Outcomes summarised inline; original arguments preserved for future-event reference.

### 7.1 RSVP profile fields — where do they live?

**RESOLVED:** Option B, with a tweak. The `events[]` scoping array was dropped in favour of a simpler `rsvp.tier` enum (`host` / `past` / `guest`). For the one-off Day n Night, any profile with `rsvp.intro` set is considered opted-in; the tier orders the credits roll (Hosts → Past Attendees → Guests). Per-event scoping (`rsvp.events` relationship) is deferred until event #2 ships.

Original arguments:

**A.** Extend `Tickets` with a `rsvp_profile` group.
- Pro: per-event scoping; deleting the ticket cleans up.
- Con: duplicates identity data; if the user has 3 tickets across 3 events, 3 copies.

**B.** Extend `Profile` with an `rsvp` group, surfaced for the current event.
- Pro: one source of truth per user; reusable for future events.
- Con: future-event leak if not scoped; need a way to mark "show on day-n-night."

### 7.2 Order grouping + 48h password

**RESOLVED:** Option B (new `ticket-orders` collection). See § 3 New table for the final shape. Password is persisted; mail-out is the only outstanding piece. Per CLAUDE.md's "mirror Payload's schema shape" principle — Payload's idiomatic answer to "thing that owns N children" is a parent collection. The migration is small (one new table; FK on tickets).

Original arguments:

**A. In-place denormalization on `Tickets`:**
```
Tickets.order_group_id: text (uuid v7)
Tickets.order_password: text (denormalized — same value across siblings)
Tickets.order_password_expires_at: date
Tickets.order_password_issued_at: date
```
Pro: no new collection. Con: password update is a multi-row write; consistency burden.

**B. New `TicketOrders` collection:**
```
TicketOrders.id, purchaser, password, password_expires_at, password_issued_at, paid, paid_at
Tickets.order: relationship<ticket-orders>
```
Pro: clean parent-child semantics; password updates are single-row. Con: new collection + migration + new admin UI surface.

### 7.3 Anonymous email-first or sign-in-required for ticketing?

**RESOLVED (recommendation only — not yet implemented):** Auto-create account on first OTP verify. Carries into Phase 4 as the "OTP step" of the 4-step purchase flow (pending).

Better Auth's `emailOTP` plugin (already wired, [options.ts:190](src/lib/auth/options.ts#L190)) supports anonymous OTP. Flow:
1. User enters email → OTP sent.
2. User enters OTP → account auto-created (passwordless) or session bound to email.
3. User continues purchase as authenticated user.

The purchaser ends up with a real account they can use to view `/day-n-night/my` later. Cheapest path; reuses everything.

### 7.4 Confetti trigger on the guests page

**RESOLVED:** Option (a) — fires when the active guest's `authorId` equals the current viewer's `id`. Implemented by setting `Credited.patronage = (viewerId === author.id)` in the server fetch at `/day-n-night/guests/page.tsx`. Credits' existing confetti gate fires off `patronage`.

**Known follow-up** (spawned as separate task, see § 14 M-list): the desktop hover handler in `Credits/index.tsx` adds `gsap.ticker.add(render)` on every hover of a patronage row without a paired remove. Mobile path has the `!isParty` guard; desktop is missing it. Cosmetic / perf issue, not blocking.

### 7.5 Immersive scope this session

**RESOLVED:** Shipped beyond the "scaffolded immersive" cut. The Immersive view now has SunLoader, Polaroid, Reveal, Timeline, DayNightAudio, Scrubber, DressRoom components — see `src/components/sections/DayNNight/Immersive/`.

---

## 8. Phase plan

### Phase 1 — Foundation — ✅ DONE

1. ✅ New `events` row seeded for `day-n-night` (`gate_password = "sunshine-2026"`).
2. ✅ i18n namespace `Event.DayNNight.*` added to both `en.json` and `ko.json`.
3. ✅ Route `/day-n-night/page.tsx` + `page.client.tsx` with RPage wrap.
4. ✅ Cookie-driven view selection (`day-n-night.view-pref`).
5. ✅ View toggle component.
6. ✅ Simplified view: fully designed and functional.
7. ✅ Immersive view: scaffolded structure with copy in place.
8. ✅ RSVP CTA → `/tickets/day-n-night`.

### Phase 2 — Immersive completion — ✅ DONE

1. ✅ SunLoader component.
2. ✅ Sky / scrubber / DayNightAudio.
3. ✅ Polaroid + Reveal sequence.
4. ✅ Timeline (5 acts).
5. ✅ Mobile fallback.
6. ✅ Dress corridor redesign — § 15 captures the full design + iteration log.
7. (Reduced-motion variant deferred — not yet shipped.)

### Phase 3 — Guests page — ✅ DONE (via Credits reuse)

1. ✅ `Profile.rsvp` group with `tier`, `intro`, `igHandle`, `gallery`.
2. ✅ Two re-runnable migrations.
3. ✅ `/day-n-night/guests/page.tsx` — server fetches RSVP profiles, joins authors (Profile.author is `maxDepth: 0`), maps each into `Credited` with `tier → position` mapping (`host → admin`, `past → cofounder`, `guest → user`).
4. ✅ Credits component renders the active-profile popover + portrait crossfade out of the box.
5. ✅ Confetti gate via `Credited.patronage = (viewerId === author.id)`.
6. (A bespoke Petra-Garmon-style scroll layout was built first then deliberately atticed in favour of reusing the existing `Credits` component, which already had hover/confetti/portrait UX. Atticed source lives at `.attic/src/components/sections/DayNNightGuests/`.)

Credits got one backwards-compatible API change: a new optional `titles?: Partial<Record<RP_Roles, string>>` prop. `/day-n-night/guests` passes `{ admin: "Hosts", cofounder: "Past Attendees", user: "Guests" }`; the existing call shape (`<Credits people={…} />`) keeps working. **Note:** these labels are hardcoded English — see § 14 H6.

### Phase 4 — Ticketing extension — ⚠️ PARTIAL

1. ✅ `ticket-orders` collection + migration (`20260519_180000_ticket_orders.ts`).
2. ✅ `Tickets.order` FK + `Tickets.gift_initial_name` + `Tickets.gift_name_locked` — same migration.
3. ❌ Extend `/tickets/[event]/page.client.tsx` with 4-step flow (welcome → OTP → name → purchase). **NOT STARTED** — biggest remaining piece. The existing client gate uses sessionStorage and a single password+quantity form; rebuilding it as 4 steps without breaking the live `/tickets/[event]` surface for *other* events needs its own focused pass.
4. ✅ Order password generation + 48h expiry on admin `paid` flip (`issueOrderPaidPassword` hook).
5. ✅ `/day-n-night/my` — purchaser dashboard, server-fetches the viewer's orders + sibling tickets, surfaces the 48h password to the purchaser once.
6. ✅ `/day-n-night/claim/[token]` — recipient claim flow. Server resolves five render states (not-found, not-activated, expired, already-claimed, ready); `ClaimGate` client component runs the server action that constant-time-validates the password, stamps `claimed_at`, binds the ticket to the viewer if signed in.
7. ❌ Password-mail email template via TicketMailer pattern. **Persistence ships but email does not.** The hook stamps the password; the mailer side hasn't been written. Template, transactional fire from inside `issueOrderPaidPassword`, and an idempotency stamp (a `mailed_at` column) are the remaining work.
8. ❌ Notification fire on admin payment confirmation. Not started.

Additional Phase 4 deliverable that *did* ship and wasn't in the original plan: the event-gate password layer at `/day-n-night/*` (§ 4.5). HMAC-signed 30-day cookie, route-group layout, server action.

### Phase 5 — Pre-launch must-fix + polish (target ≤ May 22) — ⏳ IN PROGRESS

Phase 5 is the close-out lane. It bundles **two distinct workstreams** under a single launch gate:

1. **Phase 4 close-out (P4C)** — the three ❌ items from Phase 4 that the spec needs but never shipped: the 4-step purchase flow rebuild (`/tickets/[event]/page.client.tsx`), the password mail-out (`issueOrderPaidPassword` → Brevo template + `mailed_at` idempotency stamp), and the admin-paid `notifications` row. **Without these the paid-ticketing path is non-functional**, so they ship with — not after — Phase 5a.
2. **Audit-driven fixes (5a/5b/5c)** — the tranches in § 14.6.

| Tranche | Scope | Effort |
|---|---|---|
| **P4C** | 4-step purchase flow + password mail-out + admin-paid notification | ~6 h |
| **Phase 5a** — mandatory before going live | Every § 14 CRITICAL + the security-floor HIGHs (rate-limit, robots/noindex, claim_email enforcement, i18n gaps on `/my` + `/guests`, Survival Kit block on simplified view, Closing-act structural fix) | ~6 h |
| **Phase 5b** — strongly recommended | HMAC binding to password hash, claim-state collapse, scrubber centersFrac, openingStack/openingTitle visual fixes, `rsvp.consented` opt-in, gate "DM Sean" affordance, 48h → 7-day TTL OR reissue button, `/guests` discoverability link, payment confirmation loop commitment | ~4 h |
| **Phase 5c** — polish | Extract shared helpers, Timeline.tsx per-act split, dead-SCSS sweep, single-rAF polaroid consolidation, `pnpm generate:types` + remove inline casts, LOW-tier hygiene, one Korean-coded moodboard reference | ~4 h (post-launch acceptable) |

**Launch gate:** P4C + Phase 5a both green → public RSVP send-out unblocked. See § 14 for every finding and the detailed action plan.

---

## 9. Anti-patterns to avoid

Pulled from project rules and CLAUDE.md:

- **No locale-conditional ternaries** in component files (`isKo ? a : b`). All copy via `useTranslations` / `getTranslations`.
- **No second R3F Canvas** — portal into the shared one via `<View>`.
- **No CSS marquee** for the credits loop — match the existing GSAP-ticker pattern.
- **No mutation of the existing `/tickets/[event]` page** until ticketing extension phase — it's load-bearing for the event.
- **No new `gsap.registerPlugin(ScrollTrigger)`** at module scope without a guard — already registered in [TransitionProvider.tsx:38](src/providers/TransitionProvider.tsx#L38).
- **No new email transporter** — use the existing `TicketMailer` pattern at [ticket-mailer.ts](src/lib/email/ticket-mailer.ts) for any new mail.
- **No raw `<input>` for inline edits** in the purchase flow — use the deferred-edit pattern from the Fey-direction admin spec if a settings-style row appears.
- **No animation of layout-bound properties** — transform / opacity / filter only.
- **No `whileInView` reveals inside the horizontal-pinned track** — use the `active`-prop pattern driven by `useDayNNightScene.progress` (see § 6.7).
- **Don't rename `672a4022c04412b253b0af22_card-2_back@2x.png`** on disk — the path map in `Polaroid.tsx` is the single source of truth, and renaming busts CDN caches unnecessarily.

---

## 10. Open questions for product

1. **Guest list seed source** — who curates the RSVP'd list pre-event? Is every paid ticket auto-added once a profile is set, or curated manually by admin?
2. **Dress code copy** — the source draft is long-form English stream-of-consciousness. Needs a clean Korean rewrite + an English distillation. Treat this as a brand-voice exercise — see § 11.
3. **Catalyst perfume tease** — how subtle? Pure background motif, or one ambiguous line of copy?
4. **YM.FM credit** — link to a page, social handle, or just credit-in-place?
5. **Confirm: any payment method beyond cash to Toss?** See § 14 product-risk discussion.

---

## 11. Brand voice anchor

Voice and copy rules for this page live in **`readmes/VOICE.md`** — the canonical voice and translation guide. Read it before writing any user-facing string for `/day-n-night` (English or Korean).

For this surface specifically:

- Tone: editorial, quiet, references aging youth without nostalgia.
- Reference surfaces to study before drafting: `/plans`, `/radio`.
- Banned: generic event-page tropes ("Join us for an unforgettable night!", emoji, exclamation marks, `~세요` endings in Korean).
- Dress-code copy (§10 Q2) is a brand-voice exercise — class B (atmospheric) in VOICE.md §3.1.1 terms; allow tone, but run it past §3.4's three checks.

A dedicated voice pass against `VOICE.md` should run before Phase 5a ships. Specific known issues (see § 14 product-risk section):
- "Something quiet, unannounced, will be there" translates poorly to Korean — reads ominous/evasive, not editorial-mysterious. Either cut or rewrite Korean.
- `act.day.body` and `cookout.heading` Korean strings still contain English fragments — spot-check `ko.json` for English bleed.
- Address `Sowol-ro 20-gil 64, 3F` is romanized; Koreans use 도로명주소 (소월로20길 64, 3층). Show both, or link to Kakao Map.

---

## 12. References

- **Tux Creative** — https://tux.co/en/people — credits scroll typography + confetti pattern.
- **Petra Garmon** — https://petragarmon.com/en/talent — mobile responsive layout for guest list.
- **Compsych / Konpo** — https://compsych.konpo.co — immersive scroll story, page loader, looping scroll.
- **Wild Week / Athens 26** — https://week.wild.plus/athens-26 — simplified view reference.

---

## 13. Owner notes

- Primary stakeholder: site owner (event host).
- Co-host: friend.
- Time-critical: event May 24; promo surface should be shippable by May 20–21.
- Iteration log: append below per session.

### Iteration log

- **2026-05-18** — Plan drafted. Reuse scope confirmed (Events + Tickets infrastructure). Phase 1 starts this session pending two confirmations: (a) the "shippable simplified + scaffolded immersive" cut for today vs pushing further, (b) closure of the four open decisions in § 7.

- **2026-05-19 (morning)** — Phases 1–2 shipped. Immersive view ran beyond the "scaffolded" cut: SunLoader, Polaroid, Reveal, Timeline, DayNightAudio, Scrubber. Dress-code redesign drafted (now folded into § 15).

- **2026-05-19 (mid-day)** — Phase 3 attempted as a bespoke Petra-Garmon-style scrolling credits at `src/components/sections/DayNNightGuests/`. Built: GuestsView, hooks (focused/hovered/active state, scroll velocity, background mode), Lenis snap, velocity-driven gap tightening, infinite-loop triple-buffer. Then **deliberately atticed** at user request — moved to `.attic/src/components/sections/DayNNightGuests/` — in favour of reusing the existing editorial `Credits` section. Atticed code remains recoverable if we want the PG-style layout back.

- **2026-05-19 (afternoon)** — Phase 3 redone via Credits reuse. Added an optional `titles?: Partial<Record<RP_Roles, string>>` prop to `Credits` (backwards-compatible — falls back to original "Founders / Cofounders / …" labels when the prop is omitted). Wrote `/day-n-night/guests/page.tsx` to server-fetch RSVP profiles, resolve authors in a follow-up query (Profile.author is `maxDepth: 0`), map each into `Credited`. PRP plan saved at `.claude/PRPs/plans/event-guests-into-credits.plan.md`. Santa-loop dual review converged on NICE after fixing a `role` field nullability widening; one out-of-scope follow-up spawned (Credits desktop confetti `gsap.ticker.add` leak on hover).

- **2026-05-19 (evening)** — Phase 4 partial:
  - Event-gate password layer at `/day-n-night/*` (HMAC cookie, 30d) — new layer not in the original spec. See § 4.5.
  - `ticket-orders` collection + re-runnable migration + `issueOrderPaidPassword` afterChange hook (generates an 8-char password from an ambiguity-safe alphabet + stamps 48h expiry the moment admin flips `paid`).
  - `Tickets.gift_initial_name`, `Tickets.gift_name_locked`, `Tickets.order` FK — same migration.
  - `/day-n-night/my` — purchaser dashboard (server fetch, surfaces password once).
  - `/day-n-night/claim/[token]` — recipient flow with five render states; server action constant-time-validates the password.
  - `Event.Gate.*` + `Event.Rsvp.*` i18n keys added in en+ko lockstep.

- **2026-05-19 (dress redesign session)** — Three-phase dress redesign shipped (§ 15): caption unification + secret relocation; polaroid texture variant system; corridor + per-room GSAP choreography. Marker-pen caption voice permanently retired. `act.night.announcement` relocated from Dress.

- **2026-05-19/20 (audit pass)** — Cross-lens audit ran (`/code-review`, `/security-review`, `/product-lens`, `/frontend-design`, `/frontend-patterns`, `/coding-standards`). 6 CRITICAL + 14 HIGH + 12 MEDIUM + 8 LOW findings captured in § 14. Status moves to BLOCKED on Phase 5a items before public RSVP send-out.

- **2026-05-20** — Doc consolidation: `DAY_N_NIGHT_AUDIT.md` and `DAY_N_NIGHT_DRESS_REDESIGN.md` folded into this file as § 14 and § 15, then archived via `pnpm attic` to `.attic/readmes/`. Single source of truth restored.

- **2026-05-20 (P4C-2)** — Order-password mail-out shipped. 5 files: `20260520_140000_ticket_orders_mailed_at_locale.ts` migration (adds `mailed_at` + `locale` columns, both `IF NOT EXISTS`-guarded per re-runnable policy); `TicketOrders/index.ts` field declarations; `TicketMailer.sendOrderPaidPassword` reading copy from new `Event.Order.PasswordMail` namespace via `getTranslations({ locale })`; full rewrite of `issueOrderPaidPassword` into combined Phase A (issuance) + Phase B (mail) with single persist + bounded re-entry; `messages/{en,ko}.json` lockstep keys.
  - **Locale source-of-truth decision**: per-order `ticket-orders.locale` column (default `'ko'`). Users collection has no locale field; cookie locale isn't available in afterChange context. P4C-1 must snapshot the purchaser's session locale into this column at order create time; admin can manually override.
  - **Self-healing**: SMTP failure leaves `mailed_at` null → next admin save retries. Admin clearing `password` for re-issue also clears stale `mailed_at` so the new password gets mailed. Bounded re-entry: maximum 2 hook invocations per save on success, 3 on failure.
  - **Code-reviewer pass**: 0 CRITICAL, 1 HIGH (admin re-issue path silently skipped Phase B if `mailed_at` was still set — fixed by moving Phase B's gate from `doc.mailed_at` to local `effectiveMailedAt` state, and clearing it inside Phase A when password regenerates), 1 MEDIUM (existing `formatDateTime` hard-codes `en-GB` for the older 5 mailer methods; out of P4C-2 scope but flagged for Phase 5b/c).
  - **Remaining P4C**: P4C-1 (4-step purchase flow with locale snapshot) and P4C-3 (admin-paid notification row) before the joint launch gate with Phase 5a clears.

- **2026-05-20 (P4C-1)** — 4-step purchase flow shipped + scaffold i18n sweep. 5 files: `tickets/purchase/route.ts` (adds `resolveOrderLocale()` reading the next-intl `locale` cookie; creates the parent `ticket-orders` row INSIDE the existing per-event advisory lock + transaction before any ticket mints; links each minted ticket via `order: orderId`; new optional `purchaser_name` zod field); `tickets/[event]/page.tsx` (forwards `session.user.email` + `session.user.name` to the client so OTP + name steps pre-fill); `tickets/[event]/page.client.tsx` (step state machine `welcome → otp → name → reserve → purchased`, gated behind `event.slug === "day-n-night"` so non-day-n-night events keep legacy single-screen flow); `messages/{en,ko}.json` lockstep additions for `Event.Rsvp.{gate,status,purchased,reserve,bar}` namespaces.
  - **Authed-user shortcut**: OTP step skipped when `isAuthedNow` is true at welcome → advance time. `authClient.useSession()` provides live session state, so after an OTP sign-in inside the flow the session flips and the rest of the steps see the authenticated identity.
  - **Locale source-of-truth realized**: the column added in P4C-2 now gets populated from the next-intl cookie at order create time. Default is `"ko"` for unknown cookie values (column default + Korean-leaning audience).
  - **Order row creation lives in the existing transaction**: same `eventPurchaseLock(payload, transactionID, event.id)` that serializes ticket mints — a failed mint rolls back the order row too. `idem.put(response)` cache now keys an `order_id`-bearing response so a double-submit replays the exact same order.
  - **Backward compat**: `useStepFlow = event.slug === "day-n-night"`. All other events render the legacy `ReserveView` / `PurchasedView` directly with byte-for-byte identical behavior; `purchaser_name` is omitted from those bodies and the server falls back to `session.user.name`.
  - **Code-reviewer pass**: 0 CRITICAL, 2 HIGH (1) ~25 inline English strings in the scaffold violated the next-intl single-source-of-truth rule on the Korean-leaning conversion path — fixed by adding `Event.Rsvp.{gate,status,purchased,reserve,bar}` namespaces to both locales and rewiring every string through `useTranslations`; (2) all inputs (email, OTP code, name, gate passcode) and the quantity button group lacked accessible labels — fixed by adding `<label htmlFor>` pairs, `aria-label` mirrors, and `role="group"` + `aria-label` on the quantity container.
  - **Remaining P4C**: P4C-3 (admin-paid `notifications` row) before the joint launch gate with Phase 5a clears.

- **2026-05-20 (Phase 5a finish — H9 + P5a-Product-1 Survival Kit)** — Last two items shipped, launch gate green.
  - **H9 (reveals → scene-progress)**: extended `RevealStage` with a `progressThreshold` prop. Boolean selector against `useDayNNightScene.progress` — fires the visible variant on threshold crossing, re-renders only at the crossing (Zustand boolean-selector pattern). Wired into the 3 acts that previously used `whileInView` inside the GSAP-pinned track: Cookout (0.219), Night (0.604), Closing (0.84). Each threshold sits ~0.04–0.06 before the act's polaroid anchor so the 0.85s blur-in lands by the time the user is reading the heading.
  - **P5a-Product-1 (Survival Kit)**: new `src/components/sections/DayNNight/SurvivalKit.tsx` mounted in `SimplifiedView` below the RSVP CTA. Six rows: tap-to-copy address + Kakao Map link, tap-to-copy Toss account + amount (single paste lands both), dress code, single host-contact mailto, +1 policy, late-arrival policy. New `Event.DayNNight.survivalKit.*` namespace in both en + ko locales. Copy values are placeholders pending host review (the user owns final content per the standing constraint that "any changes in the text content would be my own work").

- **2026-05-20 (Phase 5a sweep — CRITICALs C1-C7 + HIGHs H1/H3/H5/H6/H13/H14)** — Two commits cleared the launch-blocking floor:
  - **c640e1f (Wave 1+2 — security + i18n + outage state + reveal)**: C1 (claim_email enforcement in submitClaim), C2+H1 (RateLimiterMemory on both server actions via new `src/lib/api/serverActionRateLimit.ts`), C3 (notActivated key wired), C4 (dropped "we emailed your ticket" lie), C5 (explicit outage state on /my for orders=null), H3 (robots disallow + noindex metadata + PasswordReveal tap-to-reveal client component), H5 (5 /my strings → next-intl with ICU plural for ticket count), H6 (TIER_TITLES on /guests → getTranslations), H13 (/my max-w-3xl → max-w-2xl), H14 (opacities /35→/55, /45→/65 clearing the legibility floor).
  - **b3d1548 (Wave 3 — SunLoader regression)**: C7 — restored the May 19 effect. 5 bugs fixed: added missing `<div ref={sunRef} />` (rAF transforms now have a target), `clip-[path:...]` → `[clip-path:...]` (correct Tailwind arbitrary-property syntax), `cubir-bezier` → `cubic-bezier` typo fix, chrome positioning restored (`absolute bottom-[18%] left-1/2 grid w-[min(80vw,360px)] -translate-x-1/2 justify-items-center text-center`), `group-[data-hiding='true']:` → `group-data-[hiding='true']:` (correct Tailwind 4 group-data-attribute syntax). C6 verified — the SCSS→Tailwind conversion (c00ef71) had already resolved the audit's specific complaints; current Closing act mirrors Act 2 structure byte-for-byte.
  - **Deferred to next session**: H9 (Cookout/Night/Closing reveals → `active` prop driven by scene-progress threshold), P5a-Product-1 (Survival Kit block on simplified view). Phase 5a launch gate is now closeable on critical-floor terms; H9 + Survival Kit are polish that doesn't block ship.

- **2026-05-20 (sweep — P4C-3 + 4 LOWs)** — Cleanup sweep clearing the residual LOWs from prior code-reviewer passes plus P4C's final missing piece. 9 files changed:
  - **P4C-3 — Admin-paid notification**: new `TicketOrders/hooks/onOrderPaid.ts` mirrors `Tickets/hooks/onTicketPaid` shape; registered as the first afterChange on `ticket-orders` so the notification lands before the (slower) Brevo mail.
  - **L1 — Locale cookie constant**: new `src/i18n/cookie.ts` exports `LOCALE_COOKIE_NAME` + `readLocaleCookie(store, fallback)`. Migrated 7 callsites: `i18n/request.ts`, `tickets/purchase/route.ts`, `invoice/pdf/route.ts`, `me/settings/page.tsx`, `me/settings/general/page.tsx`, `me/settings/_helpers/setLocale.ts` (also dedup'd its local `SUPPORTED` → imports `locales` directly), `lib/actions/locale.ts`. Different surfaces pass different fallbacks (next-intl global → "en", day-n-night purchase → "ko") so the contract stays explicit at each site.
  - **L2 — Step machine dual-render**: collapsed dead `case "purchased": return null` by falling through to `reserve`. The `if (purchased)` early-return above the switch still handles the real terminal state; the switch is now exhaustive over `FlowStep` without a no-op branch.
  - **L3 — Welcome title typo**: `Event.Rsvp.steps.welcome.title` in en.json: "A short steps before tickets." → "A few short steps before tickets." Korean unchanged (already correct).
  - **L4 — Name pre-fill staleness**: added `nameTouched` state + a one-way sync effect (`liveSession.user.name → purchaserName`) gated on `!nameTouched`. User input via `setPurchaserName` flips the touched flag so a session change post-typing doesn't clobber input. Effect uses `setPurchaserNameInternal` (the raw setter) to avoid flipping `nameTouched` itself.
  - **Deferred**: MEDIUM from P4C-2 code-reviewer (older 5 mailer methods hard-code `en-GB`). The bare date-format fix without bilingual body copy would render a Korean date inside an English body — a worse mismatch than the current English-only state. Defer to Phase 5b alongside the full bilingual mailer body copy refactor.
  - **Code-reviewer pass**: PASS — 0 CRITICAL, 0 HIGH. Two informational LOWs noted: (1) `setLocale.ts` `SUPPORTED` duplication — fixed in-PR by importing `locales`; (2) `onOrderPaid` outer try/catch vs `onTicketPaid` inner try/catch — left as-is since the hook only does one operation today, cosmetic divergence.

### Carry-overs to next session

| Item | What's missing |
|------|----------------|
| Phase 5a (must-fix) | See § 14 action plan. ~6 h. Includes claim_email enforcement, rate-limits, robots noindex, /my + /guests i18n wiring, Closing-act structural fix, Survival Kit block, false-promise copy fixes (C3, C4). |
| Phase 5b (recommended) | See § 14. ~4 h. HMAC binding to password hash, claim-state collapse, scrubber centers, openingStack fix, rsvp.consented, gate help link, TTL extension, /guests discoverability. |
| 4-step purchase flow | Welcome → emailOTP → name → existing purchase. `/tickets/[event]/page.client.tsx` rewrite — careful, this is shared with other events. |
| Password mail-out | The password is stamped server-side but never mailed. Need a Brevo template + transactional fire from inside `issueOrderPaidPassword` + a `mailed_at` idempotency stamp. |
| Admin-payment notification | Fire a `notifications` row when admin marks paid (mirrors the existing per-ticket `onTicketPaid` notification). |
| Reduced-motion variant on immersive | Deferred from Phase 2. DressRoom already gates on `prefers-reduced-motion`; the other acts don't. |
| Phase 5c (polish) | See § 14. Timeline.tsx split, dead SCSS sweep, single-rAF polaroids, generate:types + remove casts, LOW-tier hygiene. |
| `Credits` desktop confetti `gsap.ticker.add` leak | Spawned as a side task; pre-existing in Credits, now visible because we set `patronage=true` on the viewer's own row. |

---

## 14. Pre-launch audit (folded in from `DAY_N_NIGHT_AUDIT.md`, 2026-05-19)

> The event ships **May 24**. This section ranks every finding by user-impact severity and groups fixes into Phase 5a / 5b / 5c. **Phase 5a is mandatory before the public RSVP send-out goes out.**

### 14.0 TL;DR — what will go wrong if we ship as-is

1. **Two pieces of false information will mislead users.** The `/claim` "expired" copy is shown for a "not yet activated" state ("Ask the buyer to resend" — but there's nothing to resend, the host just hasn't marked paid yet). And the claim success copy says *"We have emailed your ticket"* — no email is sent.
2. **A purchaser cannot trust a gift-ticket restriction.** The Tickets schema declares a `claim_email` field meant to scope a gift to one recipient; the claim action never checks it. Anyone with the URL + 48h password can claim.
3. **The 48h order password and 30-day gate cookie have no rate-limit and no abuse alert.** Both passwords are crackable via parallel server-action POSTs.
4. **The `/my` page is search-indexable and renders the password as plain HTML.** Browser screenshots, history sync, and any indexing crawl exposes it.
5. **Closing act is structurally broken** — it skips the `.actInner` wrapper every other act uses, applies an invalid Tailwind class (`grid-cols-[1/3]`), and the inline `font-mono` eyebrow isn't styled like the other four acts. Visible inconsistency on the last screen.
6. **Korean users see raw English** on `/my` ("Confirmed", "Pending", "Order password", "Claimed", "X ticket/s") and `/guests` ("Hosts", "Past Attendees", "Guests" — Korean keys exist in `ko.json` and are simply never wired up).
7. **Sean will receive ~10–15 DMs in the 72h before the event** asking about payment, address, dress, +1, late policy, parking, weather, and "is this real?" — almost all preventable with a Survival Kit block on the simplified card.

### 14.1 CRITICAL (6) — block ship

| # | Domain | File | Issue | User harm |
|---|---|---|---|---|
| C1 | Security | `claim/[token]/action.ts` (full body) | `claim_email` declared on Tickets but never enforced in `submitClaim` | Purchaser who intended to restrict a gift to one email gets no protection. Stolen URL + password = redirected ticket. |
| C2 | Security | `claim/[token]/action.ts:30` | No rate-limit on `submitClaim`; 48h password is ~46 bits at 10 req/s | Brute-force feasible across parallel attackers. |
| C3 | Code | `claim/[token]/page.tsx:99–106` | `not-activated` and `expired` both render `t("errors.expired")` ("Ask the buyer to resend") | Recipient hits an unactivated link, DMs buyer to "resend"; both DM Sean. False instruction. |
| C4 | Code | `claim/[token]` success copy | `messages/{en,ko}.json Event.Rsvp.claim.success.body` says *"We have emailed your ticket"* — `submitClaim` sends no email | False promise; user waits for email that never arrives. |
| C5 | Security | `my/page.tsx:39–48` | `orders` fetch can fail silently (`.catch(() => null)`); UI renders empty list when DB is down. (Line numbers re-anchored against current source from the audit's original 52–62 citation.) | Buyer thinks orders vanished. Add explicit error state. |
| C6 | Visual + Code | `Timeline.tsx` closing act + `styles.module.scss` | Closing act skips `.actInner`, applies invalid `grid-cols-[1/3]` Tailwind, doesn't use `.actEyebrow`/`.closingStack`/`.closingTitle` — those classes are now dead | Closing screen has wrong top padding, footer collapses, eyebrow loses caps/tracking. The user's "quirks" complaint lands hardest here. |

### 14.2 HIGH (14) — fix before launch

#### Security / abuse

| # | File | Issue | Fix |
|---|---|---|---|
| H1 | `DayNNightGate/action.ts:34` | No rate-limit on gate POST. 30-day cookie means one crack = persistent access | In-action `RateLimiterMemory` keyed by IP (10 req / 60 s) |
| H2 | `event-gate.ts:32–41` | HMAC is keyed on `eventId` only — password rotation does **not** invalidate existing cookies | Add password hash (or `password_version` counter) to HMAC message: `${eventId}.${expiresAtMs}.${passwordHash}` |
| H3 | `my/page.tsx` + `src/app/robots.ts` | `/my` not in robots disallow; password rendered as plain HTML in DOM | Add `/day-n-night/` to disallow list. Set `metadata.robots = "noindex, nofollow"` on `/my` and `/claim/[token]`. Add reveal-on-click affordance (`filter: blur` toggled by button) |
| H4 | `claim/[token]/page.tsx:97–109` | Four distinct error states (not-found / not-activated / expired / already-claimed) are individually rendered → enables token-state mapping | Collapse `not-activated` + `not-found` + `expired` into one render kind (still distinguish `already-claimed` so a double-click doesn't confuse). Keep the internal `kind` enum for analytics. |

#### Code / type / i18n

| # | File | Issue | Fix |
|---|---|---|---|
| H5 | `my/page.tsx:108, 111, 119, 150` | Five hardcoded English strings (Confirmed, Pending, ticket/tickets, Order password, Claimed) | Add `Event.Rsvp.my.{confirmed, pending, ticketCount, orderPassword, claimed}` to both locale files. Use ICU plural for ticket count. |
| H6 | `guests/page.tsx:40–44` | `TIER_TITLES` hardcoded English (Hosts / Past Attendees / Guests) — the Korean keys already exist at `Event.Guests.tier.*` but are never read | `const t = await getTranslations("Event.Guests"); const TIER_TITLES = { admin: t("tier.host"), cofounder: t("tier.past"), user: t("tier.guest") };` |
| H7 | `ClaimGate.tsx:82` | `pending ? t("submit") + "…"` — appends raw ellipsis to a translated string | Add `Event.Rsvp.claim.submitting`; use it for the pending label |
| H8 | `DayNNightGate/action.ts:19` | `GateActionState.error = "throttled"` declared but never returned + no i18n key | Either remove the union member or implement rate-limit + add `Event.Gate.errors.throttled` |

#### Visual / layout

| # | File | Issue | Fix |
|---|---|---|---|
| H9 | `Timeline.tsx` Cookout/Night/Closing RevealStages | `whileInView` reveals inside a GSAP-pinned horizontal track may fire on mount instead of on arrival — `useScrollTimeline.ts:19` already documents this caveat for DressRoom | Migrate Cookout/Night/Closing reveals to the `active` prop driven by `useDayNNightScene.progress` threshold, mirroring how the Loader uses `loaderProgress` |
| H10 | `Scrubber.tsx:27, 114–115` | Docstring says labels sit at section CENTER; code uses `layout.startsFrac` (section START). With variable-width acts, "Closing" label drifts left of its act | Use `layout.centersFrac` for `labelPositions`, or update doc-comment to match start-anchored intent |
| H11 | `styles.module.scss` `.openingStack` | `grid-template-rows: repeat(12, 1fr)` constrains the title to 1/12 viewport height — clips display type on shorter screens, breaks editorial rhythm | Switch to `grid-auto-rows: auto` + explicit `gap` |
| H12 | `styles.module.scss` `.openingTitle` | Uses `--color-faded-black` (always near-black) instead of `--dn-fg` (per-frame adaptive) | Replace with `var(--dn-fg)` |
| H13 | Cross-route | `/my` is `max-w-3xl` while Gate and `/claim` are `max-w-md` | Standardize: gate/claim stay `max-w-md` (single-action screens). `/my` is a list — use `max-w-2xl` so it feels related but earns its width |
| H14 | `my/page.tsx:110, 124` | `text-off-white/35` on ticket-count, `/45` on passwordHint — both below the `/55` legibility floor for informative UI text on dark surfaces | Bump both to `/55` minimum |

### 14.3 MEDIUM (12) — Phase 5b

| # | File | Issue |
|---|---|---|
| M1 | `guests/page.tsx:78–80` | `rsvp.intro` non-empty is the only opt-in marker. Add `rsvp.consented` boolean (user-set, defaults false) so a host editing a profile can't accidentally surface someone publicly |
| M2 | `guests/page.tsx`, `my/page.tsx`, `claim/[token]/action.ts` | Three near-identical copies of `resolveViewerId` / `resolveViewer`. Extract to `src/lib/payload/resolveViewerId.ts` |
| M3 | `my/page.tsx:56` | `depth: 1` on tickets populates `event` with `gate_password` into server HTML. Set `depth: 0` — page only reads scalar fields |
| M4 | `ClaimGate.tsx:61` vs `DayNNightGate/index.tsx:75` | Password `maxLength` mismatch (50 vs 200). Pick one documented ceiling per password type; mirror server-side trim |
| M5 | `Timeline.tsx` | 706 LOC in one file — past project ceiling. Extract per-act components: `OpeningAct`, `CookoutAct`, `DressAct`, `NightAct`, `ClosingAct`. Timeline.tsx drops to pin machinery only |
| M6 | `styles.module.scss` | ~120 lines of dead classes (`.actHeader`, `.actLabel`, `.actLabelStrong`, `.actTime`, `.actBody`, `.actLede`, `.actFooter`, `.actFooterItem`, `.closingStack`, `.closingTitle`, `.dressMoodboard`, `.loaderRing`). Remove and add a stop-the-line comment about which acts use bespoke layouts |
| M7 | `Polaroid.tsx` | N polaroids × 1 rAF each = N rAF callbacks/frame. Consolidate to one shared rAF that broadcasts via a MotionValue selector |
| M8 | `guests/page.tsx:53–63` | `ProfileWithRsvp` is a local cast over `Profile`. Run `pnpm generate:types` and remove the cast as soon as the migration is in CI |
| M9 | `DayNNightGate/index.tsx` | The hint copy currently doesn't tell a user where to find the password or what to do if they don't have it. Add a `mailto:` or DM contact link on the gate page |
| M10 | Product | 48h TTL on order password creates an avoidable failure mode — recipient delays → "expired" → DMs buyer → DMs Sean. Extend to 7 days OR add a "reissue this order's password" button on `/my` |
| M11 | Product — `/guests` discoverability | The page exists and is unlinked from the landing. Add a subtle "Who's coming →" link on simplified view (and Closing act on immersive) |
| M12 | Cross-route | Inline `as { id: string; ... }` casts on Payload returns (in `my/page.tsx:50, 65–70`) are fragile. Document with `// TODO(types)` until `payload-types.ts` regenerates |

### 14.4 LOW (8) — Phase 5c

| # | File | Issue |
|---|---|---|
| L1 | `issueOrderPaidPassword.ts:69` | Modulo bias on `buf[i] % 54` — 40 of 54 chars are ~2.4% more likely. < 0.1 bit entropy loss; not exploitable. Add rejection sampling when convenient |
| L2 | `event-gate.ts:21` | `PAYLOAD_SECRET` doubles as HMAC key. A future rotation strands attendees mid-session. Consider dedicated `EVENT_GATE_SECRET` with fallback |
| L3 | `DayNNightGate/action.ts:79` | Cookie `path: "/day-n-night"` matches `/day-n-nightclub` too (RFC 6265 prefix). Cosmetic, no current impact |
| L4 | `Timeline.tsx` closing eyebrow | Uses `"block w-full"` Tailwind instead of `s.actEyebrow` → loses mono caps + tracking. Confirms the C6 layout regression |
| L5 | `styles.module.scss:507–511` | Commented-out `@media (max-width: 1023px) { display: none; }` inside `.body` — dead comment block |
| L6 | `styles.module.scss:657, 1106` | `var(--font-mono )` trailing space inside parens — lints clean but offends linters |
| L7 | `claim/[token]/page.tsx:80` | `RPage slug={["day-n-night", "claim"]}` drops the `[token]` segment — page transitions may key incorrectly between distinct claim URLs |
| L8 | `guests/page.tsx:11–14` | Metadata `description` hardcoded English only |

### 14.5 Product risk — beyond bug-class

The above is what reviewers find when reading code. The **product-lens** finds what the user *experiences*. These are not bugs; they're decisions made implicitly that will produce specific complaints.

#### Top 5 user-anxiety moments (ranked by likelihood × intensity)

1. **"Is this real or am I about to get scammed?"** — Korean reader sees a personal Toss account number for a stranger and "Cash on arrival, or transfer." Post-2020 voice-phishing awareness in Korea triggers immediate pause. Worse: the URL is password-gated, which both *enhances* exclusivity and *amplifies* scam pattern-match.
2. **"Will I be the only person here?"** — `/guests` is built but unlinked. The user can't verify they're not walking into an empty room or a stranger's birthday.
3. **"What do I actually wear?"** — Dress section is editorial-poetic. "Throwback" / "Forward" room labels are art-director cool but tell a new guest nothing prescriptive. Night act's "Sharp. Chic. Dressed to impress." contradicts the laid-back daytime polaroid moodboard.
4. **"Did my transfer arrive?"** — No transaction receipt. Buyer transfers, then... silence. The only confirmation path is Sean manually flipping `paid` in admin → recipient sees `/my` update. But the recipient doesn't know `/my` exists.
5. **"I lost the password / am I in the wrong place?"** — Gate page assumes prior knowledge. No "DM Sean if you got here by accident" affordance. Failure mode is "feel stupid + DM Sean."

#### Top 15 expected complaints to Sean's DMs (P before May 24)

1. "Where do I send the money again?"
2. "What's the address? Drop a Kakao Map link?"
3. "Can I bring [friend]?"
4. "What if I show up at 19:30?"
5. "Is it OK if I'm vegetarian/allergic?"
6. "Where do I park?" (Haebangchon is car-hostile)
7. "It'll rain — is the rooftop covered?"
8. "My friend's link/password expired"
9. "I can't get past the password — case-sensitive?"
10. "What's the dress code in plain words?"
11. "Refund if I can't make it?"
12. "Audio doesn't play on iPhone"
13. "Where's /my? Why didn't you tell me about it?"
14. "I got a gift ticket but the password expired — help"
15. "Are you sure I'm invited?"

#### Unintended communications

- **"This is complicated."** — Password gate + 2-view toggle + immersive scroll + cash transfer + (hidden) `/my` + (hidden) `/guests` + (hidden) `/claim`. To Sean, this is "one URL." To the guest, this is a quest. Korean event culture especially favors *legibility* (clear time, place, RSVP form, done).
- **"You should already know."** — The gate page assumes the password is known; `/my` assumes the dashboard's existence is known. Every surface presumes prior knowledge → when wrong, the user feels stupid.
- **"Cash to a personal Toss account."** — Brand says editorial-curated. Payment method says backyard. The mismatch suggests "this might be a side project."
- **"This is for an expat / W-Seoul crowd."** — Polaroid moodboard is all Western film stills. To a Seoul-resident attendee from a different cohort: they're at the periphery of the in-joke. Mixing one Korean reference broadens the welcome at no cost.

#### Korean-context specifics

- **Address format quirk:** `Sowol-ro 20-gil 64, 3F` is romanized. Koreans use 도로명주소 (소월로20길 64, 3층). Either show both or — much better — link to Kakao Map and let the map resolve it.
- **The phrase "Something quiet, unannounced, will be there"** translates poorly. The Korean reader gets ominous/evasive, not editorial-mysterious. Cut it or make the surprise explicit.
- **`act.day.body` and `cookout.heading` Korean strings still contain English fragments.** Spot-check `ko.json` for English bleed before launch.
- **Cash-on-arrival is unusual in 2026 Seoul.** Even pojangmacha take Toss-pay. Either lean into it ("Bring 65k, old-school") or commit to digital with a confirmation flow.

### 14.6 Phased action plan

#### Phase 4 close-out (P4C) — non-negotiable prerequisite to launch (~6h)

These are the three Phase 4 ❌ items from § 8. They're not "audit findings" — they're the spec's required functionality that simply hasn't shipped yet. Without them the ticketing flow has no end-to-end path. **P4C ships with Phase 5a, not after.**

- [x] **P4C-1** ✅ shipped 2026-05-20. 4-step purchase flow on `/tickets/[event]/page.client.tsx` (welcome → emailOTP → name → reserve → purchased). Gated behind `event.slug === "day-n-night"`; non-day-n-night events keep the legacy single-screen flow byte-for-byte. OTP step is skipped when the user already has an authenticated session (the session itself proves email control). Locale snapshot lands via `resolveOrderLocale()` reading the `locale` cookie on the purchase API and persisting into `ticket-orders.locale` inside the existing transaction — same lock, same idempotency-key, same rollback semantics. Order row is created BEFORE any ticket mints, then each ticket is FK'd to it via `order: orderId`.
- [x] **P4C-2** Password mail-out: ✅ shipped 2026-05-20. `sendOrderPaidPassword` on `TicketMailer` + per-locale copy in `Event.Order.PasswordMail` (en + ko) + `mailed_at` column on `ticket-orders` for idempotency + locale column for per-order language selection. `issueOrderPaidPassword` afterChange now does combined Phase A (password issuance) + Phase B (mail dispatch) in a single persist with bounded re-entry. Self-healing: SMTP failure leaves `mailed_at` null → next admin save retries; admin clearing `password` to force re-issue also clears stale `mailed_at` so the new password gets mailed.
- [x] **P4C-3** ✅ shipped 2026-05-20. New `onOrderPaid` afterChange hook on `ticket-orders` fires the in-app notification when admin flips `paid:false → true`. Mirrors `onTicketPaid` exactly (notifications.type "access", importance 2). Hook order in the collection is `[onOrderPaid, issueOrderPaidPassword]` — notification first (cheap insert, minimal latency for the user's `/notifications` view), Brevo mail second (network-bound). Both hooks are independent best-effort: either can fail without affecting the other. The `becamePaid` guard short-circuits the re-entry caused by `issueOrderPaidPassword`'s internal `payload.update`, so each genuine paid edge produces exactly one notification.

#### Phase 5a — audit must-fix before going live (~6h)

Anything that **misleads users** or **enables abuse**. Block public RSVP send-out until done.

- [x] **C1** ✅ shipped 2026-05-20 (c640e1f). `submitClaim` enforces `claim_email` when set — requires signed-in viewer with matching email (case-insensitive, trimmed) before binding the ticket.
- [x] **C2 + H1** ✅ shipped 2026-05-20 (c640e1f). New `src/lib/api/serverActionRateLimit.ts` mirrors the REST helper for server actions. Applied to `submitClaim` (auth preset, viewer-id or IP) and `submitEventGate` (auth, IP only). 10 attempts / 60s.
- [x] **C3** ✅ shipped 2026-05-20 (c640e1f). `Event.Rsvp.claim.errors.notActivated` added in both locales; wired in `claim/[token]/page.tsx` for the `not-activated` state. Replaces the misleading "ask the buyer to resend" copy.
- [x] **C4** ✅ shipped 2026-05-20 (c640e1f). Claim success body rewritten in both locales: "You're set. See you on May 24." (Korean: "예약이 완료되었어요. 5월 24일에 만나요.") Email promise dropped.
- [x] **C5** ✅ shipped 2026-05-20 (c640e1f). `/day-n-night/my` distinguishes `orders === null` (outage) from empty list. Outage state renders `role="alert"` with dedicated copy (`Event.Rsvp.my.outage`) + logs the underlying error.
- [x] **C6** ✅ verified 2026-05-20. The audit's specific complaints (missing `.actInner` wrapper, invalid `grid-cols-[1/3]` Tailwind, missing `.actEyebrow`) were resolved by the c00ef71 SCSS → Tailwind conversion. Current Closing act structure mirrors Act 2 (Cookout) byte-for-byte at the wrapper + eyebrow + grid layer.
- [x] **C7 (regression, flagged + shipped 2026-05-20)** — `SunLoader.tsx` May 19 effect restored. Five bugs fixed in commit b3d1548: (1) added the missing `<div ref={sunRef} />` element with a 64px radial-gradient sun anchored at the viewport's vertical midline; the existing rAF tick now drives it correctly; (2) `clip-[path:inset(...)]` → `[clip-path:inset(...)]` (correct Tailwind arbitrary-property syntax); (3) `cubir-bezier` → `cubic-bezier` typo fix; (4) chrome positioning restored (`absolute bottom-[18%] left-1/2 grid w-[min(80vw,360px)] -translate-x-1/2 justify-items-center text-center`); (5) the dead `[data-dn-loader-spotlight]` rule in dn.css left in place for Phase 5c cleanup — the new horizon-line + explicit sun model the rAF code was designed for is now wired correctly. Bonus fix: `group-[data-hiding='true']:` → `group-data-[hiding='true']:` (correct Tailwind 4 group-data-attribute syntax) so the hide-out transition fires.
- [x] **H3** ✅ shipped 2026-05-20 (c640e1f). `robots.ts` disallows `/day-n-night/my` + `/day-n-night/claim/`. `metadata.robots = { index: false, follow: false }` on both pages. New `PasswordReveal` client component blurs the 48h password by default with a tap-to-reveal toggle (`filter:blur(8px)` + `select:none` until clicked).
- [x] **H5 + H6** ✅ shipped 2026-05-20 (c640e1f). `/day-n-night/my`: 5 strings (`confirmed`, `pending`, `ticketCount` with ICU plural, `orderPassword`, `claimed`) wired through `Event.Rsvp.my.*`. `/day-n-night/guests`: `TIER_TITLES` reads `Event.Guests.tier.{host,past,guest}` via `getTranslations`.
- [x] **H9** ✅ shipped 2026-05-20. Extended `RevealStage` with a `progressThreshold` prop that subscribes to `useDayNNightScene.progress` via a boolean selector — fires the visible variant when the scene's progress crosses the threshold. Re-renders only on the crossing (not every rAF tick). Wired into Cookout (threshold `ANCHOR_COOKOUT - 0.06 = 0.219`), Night (`ANCHOR_NIGHT - 0.06 = 0.604`), and Closing (`ANCHOR_CLOSING - 0.04 = 0.84`). Each value sits a hair before the act's polaroid anchor so the 0.85s blur-in lands by the time the user is reading the heading. Replaces the prior `whileInView` triggers that could misfire on mount inside the GSAP-pinned horizontal track.
- [x] **H13 + H14** ✅ shipped 2026-05-20 (c640e1f). `/day-n-night/my` `max-w-3xl` → `max-w-2xl`. Opacity bumps: ticket-count `/35` → `/55`, password hint `/45` → `/65`. Both clear the AA legibility floor for informative UI text.
- [x] **P5a-Product-1 (Survival Kit)** ✅ shipped 2026-05-20. New `SurvivalKit.tsx` mounted below the RSVP CTA in `SimplifiedView`. Six rows: (1) tap-to-copy address + Kakao Map link; (2) tap-to-copy Toss account + amount (single paste lands both); (3) dress code in one plain sentence; (4) single host-contact mailto; (5) +1 policy line; (6) late-arrival policy line. All copy in `Event.DayNNight.survivalKit.*` in both locales. Clipboard fails are silent — user can long-press the visible text as fallback. ⚠️ Korean + English copy values are placeholders pending user review (host owns final content).

**Gate:** After Phase 5a, do one human walkthrough as each persona:
- A first-time guest who got the URL via DM (no prior knowledge)
- A buyer who just transferred and is waiting for confirmation
- A gift recipient with a click-through URL
- A Korean monolingual reader

Each should be able to complete their journey without DMing.

#### Phase 5b-UF — user-feedback pass (2026-05-20, post Phase 5a)

After Phase 5a's code-floor work landed (commit 0e96fb8), the user walked the surface and flagged regressions + polish gaps that the audit's static lens didn't catch. Tracked as P5b-* tasks (#55-#61) so they survive context compaction.

- [ ] **P5b-P0.1 — Scrubber regression**. The Scrubber suddenly stopped working. Not directly touched in the latest sweep — investigate. Likely vectors: `useShallow` selector change on `horizonLoop` in store, SunLoader rAF behavior shifts (C7 fix wrote sun JSX but the tick code already existed), or earlier SCSS→Tailwind conversion fallout. Read `Scrubber.tsx` + store; bisect against last known good (commit 5d336b2, May 19).
- [ ] **P5b-P0.2 — Reveal thresholds misfire on entry**. H9 thresholds anchor on act-CENTER minus 0.04–0.06 (Cookout 0.219, Night 0.604, Closing 0.84). User reports reveals are still hidden when the act enters viewport — meaning by the time the threshold fires the user is already looking at hidden copy and the 0.85s blur-in arrives too late. Redrive from per-act START frac (computed from the rendered layout via `useDayNNightScene.acts[]` or similar) with a small pre-roll so the blur-in lands before the heading is visible.
- [ ] **P5b-P0.3 — Opening reveal sync with loader hand-off**. The Opening uses `phase === "playing"` to gate its stagger. But `phase` flips during the 700ms loader fade-out (see SunLoader.tsx `playTimeout`), so the Opening's ~1s stagger starts and finishes while the loader is still on screen. User sees Opening already-revealed when the loader clears. Fix: gate on `phase === "playing"` AND a separate "loader unmounted" signal (Immersive/index.tsx owns that lifecycle).
- [ ] **P5b-P1.1 — Section hero soft-pin**. Each act's hero (title + lede) should be screen-sized with a subtle "lock" so the user can't end up parked between sections at awkward positions. Sub-5% scrolls past the hero center pull back to the hero; >5% scrolls release through. **Not CSS snap** — incompatible with Lenis. Use GSAP ScrollTrigger snap config wired into the existing Lenis driver. Subtle — must not feel like a jail.
- [ ] **P5b-P1.2 — Typography spacing audit + pass**. Whole-surface audit. User flag: "too tightly spaced together" across the page. Invoke `/design-system` before touching code; apply spacing recommendations consistently. Margins between blocks, line-height on body, breathing around heroes.
- [ ] **P5b-P1.3 — Survival Kit redesign**. The dl-row layout shipped in 0e96fb8 reads as a knockoff of the existing simplified-view rhythm — "horrendous" per user. Needs its own visual identity that earns its place below the editorial header. Invoke `/frontend-design` + `/brand-voice` before rebuilding. Same 6 functional rows; different composition.
- [ ] **P5b-P1.4 — Additional polish (TBD)**. User noted "and more I have yet to formulate words for" — reserve a follow-up pass once P0 + P1.1-P1.3 land.

**Quality gates for this phase:**
- `/frontend-design` invoked before touching design code (P1.2, P1.3)
- `/design-system` invoked for the spacing audit (P1.2)
- `/brand-voice` invoked for Survival Kit copy + composition (P1.3)
- `/santa-loop` adversarial dual-review on the design-touching commits before push (P5b-Gate, #61)
- `/strategic-compact` after every loop completion (procedural ritual locked in)

#### Phase 5b — strongly recommended (~4h)

- [ ] **H2** Add password hash to HMAC input so rotation invalidates cookies
- [ ] **H4** Collapse `not-found` / `not-activated` / `expired` into one render state on `/claim`. Keep internal `kind` for telemetry
- [ ] **H7 + H8** Fix `ClaimGate.tsx:82` ellipsis pattern; resolve `"throttled"` enum
- [ ] **H10** Scrubber labels to `centersFrac` (or update doc-comment to match start-anchored intent)
- [ ] **H11** Drop `repeat(12, 1fr)` on `.openingStack`
- [ ] **H12** `.openingTitle` color → `var(--dn-fg)`
- [ ] **M1** Add `rsvp.consented` boolean to Profile + include in guests query
- [ ] **M9** Gate page: add "DM Sean if you got here by accident" affordance
- [ ] **M10** 48h TTL → 7 days OR `/my` reissue button
- [ ] **M11** `/guests` discoverability — link from simplified view + Closing act
- [ ] **P5b-Product-2** Confirm-payment loop: either commit to the existing `/tickets/day-n-night` flow as the only path, OR add "you'll get a confirmation DM within 24h" promise + host-side ack responsibility

#### Phase 5c — polish (~4h, post-launch acceptable)

- [ ] **M2** Extract `resolveViewerId` shared helper
- [ ] **M3** `/my` tickets `depth: 1` → `depth: 0`
- [ ] **M4** Reconcile `maxLength` between Gate and ClaimGate
- [ ] **M5** Split `Timeline.tsx` into per-act components
- [ ] **M6** Delete ~120 lines of dead SCSS classes
- [ ] **M7** Single shared rAF for all polaroids
- [ ] **M8 + M12** Run `pnpm generate:types`; remove inline casts
- [ ] **L1–L8** Sweep the LOW list
- [ ] **P5c-Product-3** Inject one Korean-coded reference into the Dress moodboard

#### Post-launch

- [ ] Telemetry on the 4 `/claim` outcomes
- [ ] Telemetry on gate-attempts vs successes (anomaly detection for brute-force)
- [ ] Per-event scoping of `rsvp.tier` (`rsvp.events` relationship) — currently a single global RSVP — deferred until event #2 ships per § 7.1

### 14.7 Verdict

The product **works** and the page **looks good**. Four categories of risk remain:

1. **Spec items still unbuilt (P4C-1, P4C-2, P4C-3)** — the 4-step purchase flow, password mail-out, and admin-paid notification. Without these, the paid-ticketing UX is non-functional regardless of how clean the audit fixes land. These ship with Phase 5a, not as polish.
2. **Two user-facing lies (C3, C4)** — they will produce false complaints to the host. Trivially fixable.
3. **Security floor (C1, C2, H1, H3) is too low** for a paid event with a 30-day cookie and password-claimable gift tickets. Adding rate-limit + `claim_email` enforcement + noindex is < 1h of work and dramatically raises the floor.
4. **Information architecture is host-centric not guest-centric.** The fix is the **Survival Kit block** on simplified view. Without it, Sean will spend May 22–24 answering DMs about address, payment, and dress code. With it, he gets to enjoy the event.

**Launch gate:** P4C + Phase 5a both green → surface is launchable end-to-end (promo + ticketing). Phase 5a alone (without P4C) makes the *promo* surface launchable but leaves the ticketing path broken. Phase 5b is the difference between "the page works" and "the page reads as a finished product." Phase 5c is post-launch hygiene.

---

## 15. Appendix — Dress corridor redesign (folded in from `DAY_N_NIGHT_DRESS_REDESIGN.md`)

> Shipped 2026-05-19 in three phases. Captured here as design rationale + a reference for similar future corridor sections.

### 15.1 Summary

Redesigned the **Dress** act of the immersive timeline into a horizontal-parallax corridor with two option "rooms" (≥150vw each), promoted polaroids to the protagonist of each room, applied existing polaroid-texture PNGs (mint-tinted frames + back-card stickers) as a typed variant system, unified all polaroid captions to one serif style, and relocated the "Something quiet, unannounced" line out of Dress into Night below "Mood shift."

User story: *as a visitor, I want the Dress section to feel like flipping through someone's moodboard for the night rather than reading two squashed columns of body copy.*

### 15.2 Architectural decisions

| Decision | Choice |
|---|---|
| Act width | `.actDress { --act-w: 3.2; }` — 1.5 (room 01) + 1.5 (room 02) + 0.2 (eyebrow lead-in). Anchor (`ANCHOR_DRESS = 0.478`) **does not move** — widening the act doesn't shift the sun. |
| Reveal driver | Per-room GSAP child timeline with `horizontal: true` ScrollTrigger. **Fallback:** if `horizontal: true` doesn't fire inside the parent pinned track, drive timeline progress from `useDayNNightScene.getState().progress` in rAF — mirror the `LoaderReveal` pattern. The shipped DressRoom uses the `useScrollTimeline` hook which abstracts this. |
| Polaroid system | Discriminated-union variants (`clean` \| `stamped` \| `back`) — see § 6.6. |
| Caption voice | Unified serif, normal weight, no italic, no line-clamp. Marker-pen voice (`captionStyle="marker"`) permanently retired. |
| Per-room layout | 3 internal positional bands (Anchor → Cluster → Read), each ~50vw of the room's 150vw width. Polaroids absolute-positioned inside the Cluster band. |
| Reduced motion | DressRoom gates its GSAP timeline on `matchMedia("(prefers-reduced-motion: reduce)").matches`; when true, sets heading/body/polaroids to fully visible synchronously. |

### 15.3 Implementation phases (as shipped)

1. **Phase 1** — Caption unification + secret relocation. Pure copy/style. Dropped `captionStyle="marker"`, deleted `.polaroidMarker`, renamed `.polaroidSerif` → `.polaroidCaption`. Deleted `dressCode.intro` and `secret` keys. Added `act.night.announcement`. Updated `dressCode.heading` to `"One rule: Don't dress your age."` Inserted `<RevealItem>` for the announcement after Night's `sectionTitle`.
2. **Phase 2** — Polaroid texture variant system. Added the discriminated union, key→path maps, `POLAROID_ASPECT = 0.76`. Dress polaroids swapped to `variant="stamped"` with `overlay="card-{2,4}_front-clear"`; added `variant="back"` decorative scatter per room.
3. **Phase 3** — Corridor + per-room choreography. Bumped `--act-w` to 3.2, replaced `.dressColsBespoke` with `.dressCorridor` + `<DressRoom>` instances. Each DressRoom owns its 3-band JSX and a GSAP timeline keyed off horizontal scroll progress.

### 15.4 Acceptance criteria (all met at ship time)

| # | Criterion |
|---|---|
| 1 | Kicker reads "III · One rule: Don't dress your age." |
| 2 | No intro paragraph in Dress |
| 3 | All polaroid captions unified (serif normal, no clipping, no marker) |
| 4 | Polaroids visually larger (≥220px width) |
| 5 | Each option room ≥150vw wide |
| 6 | Heading reveals before body; body reveals on scroll progress |
| 7 | "Something quiet, unannounced..." in Night |
| 8 | Stamped polaroids show mint frame + doodle |
| 9 | Each room has 1 ambient back card |
| 10 | All polaroids 0.76 portrait aspect |
| 11 | Dress act total width = 3.2 × 100vw (`--act-w: 3.2`) |
| 12 | Reduced-motion users see instant reveals |
| 13 | Loader → Opening handoff visually unchanged (regression) |
| 14 | Cookout / Night / Closing layouts visually unchanged (regression) |

### 15.5 Notes / risks (post-ship)

- **Romeo photo (landscape 1.499)** crops to portrait 0.76; verify face stays in frame after any moodboard image swap. Fix per-photo with `object-position` only if needed.
- **`672a4022c04412b253b0af22_card-2_back@2x.png`** retains its CMS-id prefix on disk. Path map in `Polaroid.tsx` is the single source of truth — do not rename.
- **`horizontal: true` ScrollTrigger** is load-bearing for the per-room reveals. If a future GSAP upgrade or Lenis change breaks this, fall back to the store-driven rAF pattern documented in `useScrollTimeline.ts`.
- Dress-only chromatic shift across the corridor (teal → orange) was deliberately deferred — sky palette is already coupled to scene progress; layering a Dress-only shift is its own decision.
- Touch / gyro-driven polaroid drift is out of scope; scroll-only.

### 15.6 What this appendix replaces

The full PRP doc that drove this work (file: `readmes/DAY_N_NIGHT_DRESS_REDESIGN.md`) is now archived at `.attic/readmes/DAY_N_NIGHT_DRESS_REDESIGN.md`. Recoverable via `git log -- .attic/readmes/`.

The PRP's "Mandatory reading" P0/P1/P2 file:line table is intentionally not preserved here — the shipped code is now the source of truth. Anyone wanting the original PRP context can read the atticed copy.
