# Day n Night — Event Landing & RSVP

Cross-session continuity doc for the **Day n Night** event landing, RSVP'd guest credits, and ticketing flow.

**Event date:** Sunday, 24 May 2026
**Location:** Haebangchon / Itaewon, Seoul
**Event slug:** `day-n-night`
**Status:** PLANNING — root landing implementation begins this session.

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

### 2.1 Root landing (this session)

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
- **Confetti gate** — the Credits component already triggers confetti per-person via a boolean. Our gate condition: `person.id === currentUser?.profile?.id` (it's *your* profile in focus).

**Data source:** ticket-bound users with a `rsvp_profile` payload (intro, ig handle, gallery). Either:
- (a) extend the `Tickets` collection with a `rsvp_profile` group, or
- (b) extend the `Profile` collection and surface a subset for this event.

Decision queued — see § 7. Recommendation: (b), since it reuses the existing identity surface.

### 2.3 Ticketing flow (`/tickets/day-n-night`)

The existing `/tickets/[event]/page.tsx` already implements the gate-password flow. The 4-step spec maps onto it as follows:

| Spec step | Implementation |
|-----------|----------------|
| 1. Welcome | New screen inside the existing page, shown before gate input. |
| 2. Email confirm via Brevo | New: Better Auth `emailOTP` plugin (already wired) → 6-digit code, no account required. |
| 3. Take name | New step inside the gated purchase form. |
| 4. Ticket purchase + URL generation + admin confirmation + 48h password | Reuses existing Tickets collection + onTicketPaid hook. **New** order-group + order-password concept needed (see § 7.2). |

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

| Concept | Implementation option | Status |
|---------|----------------------|--------|
| Order grouping | Either (A) `Tickets.order_group` uuid + denormalized password fields OR (B) new `TicketOrders` collection. | OPEN — § 7.2 |
| Per-order 48h password | See above. | OPEN — § 7.2 |
| Initial recipient name on gift tickets | `Tickets.gift_initial_name` text (editable by purchaser, revocable by admin via `gift_name_locked` checkbox). | NEW |
| RSVP profile fields | `Profile.rsvp` group: intro (textarea 200 char), ig_handle, gallery (array of media, max 5). | NEW |
| View-preference cookie | `day-n-night.view-pref` — `"immersive" | "simplified"`. Cookie write client-side, read server-side. | NEW |

### Migrations

Per CLAUDE.md's load-bearing migration policy (`readmes/MIGRATIONS.md`):
- Every new column wrapped in `IF NOT EXISTS` / `DO $$` guard.
- Every constraint/index re-runnable.
- Mirror Payload's schema shape; let `pnpm generate:schema` produce the SQL and only edit the generated migration to add safeguards.

---

## 4. i18n

New top-level namespace: **`Event`** (forward-compatible — future events get `Event.{slug}`).

Required keys (per locale, lockstep):

```
Event.DayNNight.title                  ← "Day n Night" (kept EN in both locales per spec exemption)
Event.DayNNight.tagline                ← short marketing line
Event.DayNNight.dateLabel              ← "May 24, 2026 · Sunday" / "2026년 5월 24일 일요일"
Event.DayNNight.location               ← venue copy
Event.DayNNight.timetable.*            ← schedule rows
Event.DayNNight.dressCode.heading
Event.DayNNight.dressCode.intro
Event.DayNNight.dressCode.options.*    ← the two outfit framings
Event.DayNNight.included.food.*
Event.DayNNight.included.drinks.*
Event.DayNNight.music.*
Event.DayNNight.entryFee.*             ← amount, "cash only", Toss instructions
Event.DayNNight.cta.rsvp
Event.DayNNight.cta.viewToggle.immersive
Event.DayNNight.cta.viewToggle.simplified
Event.Guests.*                         ← credits-page strings
Event.Rsvp.*                           ← ticketing flow strings (per step)
```

**No** locale-conditional ternaries in component files. **No** parallel `*Ko` / `*En` constant pairs. The `BUSINESS` locale-pair pattern is explicitly forbidden per CLAUDE.md.

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

Mount via existing shared `<Canvas>` ([MainInternal.tsx](src/components/core/MainInternal.tsx)) using a `<View>` portal — never a second Canvas.

- **Sun** — sphere with shader-driven emissive intensity. Position driven by ScrollTrigger progress (parametric arc).
- **Moon** — same sphere geometry, swapped material at threshold via opacity crossfade.
- **Sky** — full-screen gradient quad behind the sun, color uniforms driven by scroll progress through a color stop list (pre-dawn → midday → sunset → night).
- **Optional grain overlay** — at low opacity for atmospheric depth (matches the project's Fey-direction grain texture).

### 6.4 Page loader

Net-new sun loader (existing `Hideaway_Preloader` is typographic grid, not suitable here):

- Initial state: sun small, near bottom of viewport, sky pre-dawn.
- Loader progress 0→100% drives sun rise from `y = -0.6vh` to `y = 0.3vh` (matches the first hero scroll position).
- At 100%, **hands off to the scroll-driven scene without snap** — the sun keeps the same position, the loader chrome fades out, and the user is now in the immersive scene at scroll=0.

Location: new component at `src/components/UX/Preloader/SunLoader.tsx` next to the existing typographic loader. Route-scoped (only mounts on `/day-n-night` immersive view).

### 6.5 Performance budget

Per global rules ([performance.md](.../web/performance.md)):
- LCP < 2.5s. Hero is the sun + initial copy — preload nothing heavy; the R3F scene is below LCP-critical content (or the sun is the LCP and we accept the cost).
- Bundle: < 150kb gzipped JS for landing page. R3F + drei is heavy — load via `dynamic(() => import(...), { ssr: false })` and only on immersive view.
- Motion stays on compositor-friendly properties (transform, opacity, filter).

### 6.6 Reduced-motion

Respect `prefers-reduced-motion`:
- Disable the looping scroll repeat (one-way only).
- Replace continuous sun animation with discrete keyframes at section boundaries.
- Loader: skip directly to handoff state.

---

## 7. Open decisions (must close before implementation)

### 7.1 RSVP profile fields — where do they live?

**A.** Extend `Tickets` with a `rsvp_profile` group.
- Pro: per-event scoping; deleting the ticket cleans up.
- Con: duplicates identity data; if the user has 3 tickets across 3 events, 3 copies.

**B.** Extend `Profile` with an `rsvp` group, surfaced for the current event.
- Pro: one source of truth per user; reusable for future events.
- Con: future-event leak if not scoped; need a way to mark "show on day-n-night."

**Recommendation: B**, with the `rsvp` group also carrying an `events` relationship array indicating which events the profile opts into. Defer the scoping logic — for the one-off, every profile with `rsvp.intro` set is visible.

### 7.2 Order grouping + 48h password

**A. In-place denormalization on `Tickets`:**
```
Tickets.order_group_id: text (uuid v7)
Tickets.order_password: text (denormalized — same value across siblings)
Tickets.order_password_expires_at: date
Tickets.order_password_issued_at: date
```
Pro: no new collection, no new migration of FK relationships.
Con: password update is a multi-row write; consistency burden.

**B. New `TicketOrders` collection:**
```
TicketOrders.id: uuid v7
TicketOrders.purchaser: relationship<users>
TicketOrders.password: text
TicketOrders.password_expires_at: date
TicketOrders.password_issued_at: date
TicketOrders.paid: checkbox
TicketOrders.paid_at: date
Tickets.order: relationship<ticket-orders>
```
Pro: clean parent-child semantics; password updates are single-row.
Con: new collection + migration + new admin UI surface.

**Recommendation: B**, given CLAUDE.md's "mirror Payload's schema shape" principle — Payload's idiomatic answer to "thing that owns N children" is a parent collection. The migration is small (one new table; FK on tickets).

### 7.3 Anonymous email-first or sign-in-required for ticketing?

The spec says "Get & confirm email" before account creation. Better Auth's `emailOTP` plugin (already wired, [options.ts:190](src/lib/auth/options.ts#L190)) supports anonymous OTP. Flow:

1. User enters email → OTP sent.
2. User enters OTP → account auto-created (passwordless) or session bound to email.
3. User continues purchase as authenticated user.

**Recommendation:** auto-create accounts on first OTP verify. The purchaser ends up with a real account they can use to view `/day-n-night/my` later. Cheapest path; reuses everything.

### 7.4 Confetti trigger on the guests page

Spec: confetti fires when "it is the user's profile in focus." Two interpretations:
- (a) The *currently active* guest equals the *logged-in user* — confetti on every entry of your own card.
- (b) The guest is *anyone's birthday* (tux.co's literal rule) — feels arbitrary here.

**Recommendation: (a)** — your own card is the celebration moment.

### 7.5 Immersive scope this session

Full compsych.konpo.co-grade is multi-day. This session can deliver:
- Plan doc (this file) ✓
- Route scaffolding + RPage wrap
- Simplified view fully functional (shippable promo surface)
- Immersive view scaffolded: sun loader skeleton, R3F View portal placeholder, scroll structure with placeholder content. No final sun shader / sky gradient.

**Confirm with user before build:** is "shippable simplified + scaffolded immersive" the right cut for today, with immersive completion in a follow-up session before May 22?

---

## 8. Phase plan

### Phase 1 — Foundation (this session)

1. New `events` row for `day-n-night` (admin-created or seeded).
2. i18n namespace `Event.DayNNight.*` added to both `en.json` and `ko.json`.
3. Route `/day-n-night/page.tsx` + `page.client.tsx` with RPage wrap.
4. Cookie-driven view selection (`day-n-night.view-pref`).
5. View toggle component.
6. Simplified view: fully designed and functional.
7. Immersive view: scaffolded structure with copy in place; sun + sky as placeholder static layers; horizontal-scroll skeleton with GSAP ScrollTrigger pin.
8. RSVP CTA → `/tickets/day-n-night`.

### Phase 2 — Immersive completion (next session, target ≤ May 21)

1. SunLoader component with R3F sphere + shader.
2. Sky gradient driven by scroll progress.
3. Sun/moon arc + crossfade.
4. Loop-scroll closure (back to daybreak).
5. Mobile vertical-scroll fallback.
6. Reduced-motion variant.

### Phase 3 — Guests page (next session)

1. `Profile.rsvp` group (intro, ig handle, gallery).
2. Migration with re-runnable safeguards.
3. `/day-n-night/guests/page.tsx` adapting Credits component.
4. Active profile popover with focus state.
5. Confetti gate (own-card rule).
6. Mobile horizontal snap-scroll layout.

### Phase 4 — Ticketing extension (next session)

1. `TicketOrders` collection + migration.
2. `Tickets.order` FK + `Tickets.gift_initial_name` + `Tickets.gift_name_locked`.
3. Extend `/tickets/[event]/page.client.tsx` with 4-step flow (welcome → OTP → name → purchase).
4. Order password generation + 48h expiry on admin `paid` flip.
5. `/day-n-night/my` — purchaser dashboard with link list (visual only, real URL hidden).
6. `/day-n-night/claim/[token]` — recipient claim flow gated by order password.
7. Password-mail email template via TicketMailer pattern.
8. Notification fire on admin payment confirmation.

### Phase 5 — Polish & content lock (target ≤ May 22)

1. Copy review in both locales.
2. Lighthouse + a11y audit.
3. Cross-browser smoke test (Chrome / Safari / Firefox).
4. Visual regression screenshots at 320 / 768 / 1024 / 1440.
5. Promotion soft-launch.

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

---

## 10. Open questions for product

1. **Guest list seed source** — who curates the RSVP'd list pre-event? Is every paid ticket auto-added once a profile is set, or curated manually by admin?
2. **Dress code copy** — the source draft is long-form English stream-of-consciousness. Needs a clean Korean rewrite + an English distillation. Treat this as a brand-voice exercise — see § 11.
3. **Catalyst perfume tease** — how subtle? Pure background motif, or one ambiguous line of copy?
4. **YM.FM credit** — link to a page, social handle, or just credit-in-place?
5. **Confirm: any payment method beyond cash to Toss?**

---

## 11. Brand voice anchor

Per CLAUDE.md aesthetic direction — "sparse, intentional, typographically confident." Tone: editorial, quiet, references aging youth without nostalgia.

Reference voices to mine before drafting final copy: existing surfaces at `/plans`, `/radio`. Do not import generic event-page tropes ("Join us for an unforgettable night!" — banned).

A separate voice pass should run before Phase 5.

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
