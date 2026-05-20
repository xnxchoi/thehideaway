# Day n Night — pre-launch audit

Date: 2026-05-19 · Status: BLOCK before going live (CRITICAL items below) · Source synthesis from `/code-review`, `/security-review`, `/product-lens`, `/frontend-design`, `/frontend-patterns`, `/coding-standards` lenses.

The event ships **May 24** (5 days out). This document ranks every finding by user-impact severity and groups fixes by phase. Phase 1 is mandatory; Phase 2 is strongly recommended; Phase 3 is polish.

---

## TL;DR — what will go wrong if we ship as-is

1. **Two pieces of false information will mislead users.** The `/claim` "expired" copy is shown for a "not yet activated" state ("Ask the buyer to resend" — but there's nothing to resend, the host just hasn't marked paid yet). And the claim success copy says *"We have emailed your ticket"* — no email is sent.
2. **A purchaser cannot trust a gift-ticket restriction.** The Tickets schema declares a `claim_email` field meant to scope a gift to one recipient; the claim action never checks it. Anyone with the URL + 48 h password can claim.
3. **The 48 h order password and 30-day gate cookie have no rate-limit and no abuse alert.** Both passwords are crackable via parallel server-action POSTs.
4. **The `/my` page is search-indexable and renders the password as plain HTML.** Browser screenshots, history sync, and any indexing crawl exposes it.
5. **Closing act is structurally broken** — it skips the `.actInner` wrapper every other act uses, applies an invalid Tailwind class (`grid-cols-[1/3]`), and the inline `font-mono` eyebrow isn't styled like the other four acts. Visible inconsistency on the last screen.
6. **Korean users see raw English** on `/my` ("Confirmed", "Pending", "Order password", "Claimed", "X ticket/s") and `/guests` ("Hosts", "Past Attendees", "Guests" — even though the Korean keys exist in `ko.json` and are simply never wired up).
7. **Sean will receive ~10–15 DMs in the 72 h before the event** asking about payment, address, dress, +1, late policy, parking, weather, and "is this real?" — almost all preventable with a `Survival Kit` block on the simplified card.

---

## Findings — by severity (cross-domain)

### CRITICAL (6) — block ship

| # | Domain | File | Issue | User harm |
|---|---|---|---|---|
| C1 | Security | `claim/[token]/action.ts:42` | `claim_email` declared on Tickets but never enforced in `submitClaim` | Purchaser who intended to restrict a gift to one email gets no protection. Stolen URL + password = redirected ticket. |
| C2 | Security | `claim/[token]/action.ts:30` | No rate-limit on `submitClaim`; 48 h password is ~46 bits at 10 req/s | Brute-force feasible across parallel attackers. |
| C3 | Code | `claim/[token]/page.tsx:99–106` | `not-activated` and `expired` render the same "Ask the buyer to resend" copy | Recipient hits an unactivated link, DMs buyer to "resend"; both DM Sean. False instruction. |
| C4 | Code | `claim/[token]` success copy | `messages/{en,ko}.json Event.Rsvp.claim.success.body` says *"We have emailed your ticket"* — `submitClaim` sends no email | False promise; user waits for email that never arrives. |
| C5 | Security | `my/page.tsx:52–62` | Tickets fetch uses `overrideAccess: true` scoped only by `orderIds`. Safe today, but a silent Payload outage produces `orderIds=[]` → "empty list" UI when reality is "DB error" | Buyer thinks orders vanished. |
| C6 | Visual + Code | `Timeline.tsx:606–662` + `styles.module.scss:1200–1224` | Closing act skips `.actInner`, applies invalid `grid-cols-[1/3]` Tailwind, doesn't use `.actEyebrow`/`.closingStack`/`.closingTitle` — those classes are now dead | Closing screen has wrong top padding, footer collapses to one line, eyebrow loses caps/tracking. The user's "quirks" complaint lands hardest here. |

### HIGH (14) — fix before launch

#### Security / abuse

| # | File | Issue | Fix |
|---|---|---|---|
| H1 | `DayNNightGate/action.ts:34` | No rate-limit on gate POST. 30-day cookie means one crack = persistent access | In-action `RateLimiterMemory` keyed by IP (10 req / 60 s) |
| H2 | `event-gate.ts:32–41` | HMAC is keyed on `eventId` only — password rotation does **not** invalidate existing cookies | Add password hash (or `password_version` counter) to HMAC message: `${eventId}.${expiresAtMs}.${passwordHash}` |
| H3 | `my/page.tsx:122` + `src/app/robots.ts` | `/my` not in robots disallow; password rendered as plain HTML in DOM | Add `/day-n-night/` to disallow list. Set `metadata.robots = "noindex, nofollow"` on `/my` and `/claim/[token]`. Add reveal-on-click affordance (`filter: blur` toggled by button) |
| H4 | `claim/[token]/page.tsx:116–163` | Four distinct error states (not-found / not-activated / expired / already-claimed) are individually rendered → enables token-state mapping | Collapse `not-activated` + `not-found` + `expired` into one render kind (still distinguish `already-claimed` so a double-click doesn't confuse). Keep the internal `kind` enum for analytics. |

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
| H9 | `Timeline.tsx Cookout/Night/Closing RevealStages` | `whileInView` reveals inside a GSAP-pinned horizontal track may fire on mount instead of on arrival — `useScrollTimeline.ts:19` already documents this caveat for DressRoom | Migrate Cookout/Night/Closing reveals to the `active` prop driven by `useDayNNightScene.progress` threshold, mirroring how the Loader uses `loaderProgress` |
| H10 | `Scrubber.tsx:27, 114–115` | Docstring says labels sit at section CENTER; code uses `layout.startsFrac` (section START). With variable-width acts, "Closing" label drifts left of its act | Use `layout.centersFrac` for `labelPositions` |
| H11 | `styles.module.scss:653–659` `.openingStack` | `grid-template-rows: repeat(12, 1fr)` constrains the title to 1/12 viewport height — clips display type on shorter screens, breaks editorial rhythm | Switch to `grid-auto-rows: auto` + explicit `gap` |
| H12 | `styles.module.scss:677` `.openingTitle` | Uses `--color-faded-black` (always near-black) instead of `--dn-fg` (per-frame adaptive) | Replace with `var(--dn-fg)` |
| H13 | Cross-route | `/my` is `max-w-3xl` while Gate and `/claim` are `max-w-md` | Standardize: gate/claim stay `max-w-md` (single-action screens). `/my` is a list — use `max-w-2xl` so it feels related but earns its width |
| H14 | `my/page.tsx:110, 124` | `text-off-white/35` on ticket-count, `/45` on passwordHint — both below the `/55` legibility floor for informative UI text on dark surfaces | Bump both to `/55` minimum |

### MEDIUM (12) — fix in Phase 2

| # | File | Issue |
|---|---|---|
| M1 | `guests/page.tsx:78–80` | `rsvp.intro` non-empty is the only opt-in marker. Add `rsvp.consented` boolean (user-set, defaults false) so a host editing a profile can't accidentally surface someone publicly |
| M2 | `guests/page.tsx, my/page.tsx, claim/[token]/action.ts` | Three near-identical copies of `resolveViewerId` / `resolveViewer`. Extract to `src/lib/payload/resolveViewerId.ts` |
| M3 | `my/page.tsx:56` | `depth: 1` on tickets populates `event` with `gate_password` into server HTML. Set `depth: 0` — page only reads scalar fields |
| M4 | `ClaimGate.tsx:61` vs `DayNNightGate/index.tsx:75` | Password `maxLength` mismatch (50 vs 200). Pick one documented ceiling per password type; mirror server-side trim |
| M5 | `Timeline.tsx` | 666 LOC in one file — at project ceiling. Extract per-act components: `OpeningAct`, `CookoutAct`, `DressAct`, `NightAct`, `ClosingAct`. Timeline.tsx drops to pin machinery only |
| M6 | `styles.module.scss` | ~120 lines of dead classes (`.actHeader`, `.actLabel`, `.actLabelStrong`, `.actTime`, `.actBody`, `.actLede`, `.actFooter`, `.actFooterItem`, `.closingStack`, `.closingTitle`, `.dressMoodboard`, `.loaderRing`). Remove and add a stop-the-line comment about which acts use bespoke layouts |
| M7 | `Polaroid.tsx:138–156` | 9 polaroids × 1 rAF each = 9 rAF callbacks/frame. Consolidate to one shared rAF that broadcasts via a MotionValue selector |
| M8 | `guests/page.tsx:53–63` | `ProfileWithRsvp` is a local cast over `Profile`. Run `pnpm generate:types` and remove the cast as soon as the migration is in CI |
| M9 | Security — gate copy | The hint copy currently doesn't tell a user where to find the password or what to do if they don't have it. Add a `mailto:` or DM contact link on the gate page |
| M10 | Product | 48 h TTL on order password creates an avoidable failure mode — recipient delays → "expired" → DMs buyer → DMs Sean. Extend to 7 days OR add a "reissue this order's password" button on `/my` |
| M11 | Product — `/guests` discoverability | The page exists and is unlinked from the landing. Add a subtle "Who's coming →" link on simplified view (and Closing act on immersive) |
| M12 | Cross-route | Inline `as { id: string; ... }` casts on Payload returns (in `my/page.tsx:50, 65–70`) are fragile. Document with `// TODO(types)` until `payload-types.ts` regenerates |

### LOW (8) — fix in Phase 3 or punt to post-launch

| # | File | Issue |
|---|---|---|
| L1 | `issueOrderPaidPassword.ts:69` | Modulo bias on `buf[i] % 54` — 40 of 54 chars are ~2.4% more likely. < 0.1 bit entropy loss; not exploitable. Add rejection sampling when convenient |
| L2 | `event-gate.ts:21` | `PAYLOAD_SECRET` doubles as HMAC key. A future rotation strands attendees mid-session. Consider dedicated `EVENT_GATE_SECRET` with fallback |
| L3 | `DayNNightGate/action.ts:79` | Cookie `path: "/day-n-night"` matches `/day-n-nightclub` too (RFC 6265 prefix). Cosmetic, no current impact |
| L4 | `Timeline.tsx:612` | Closing eyebrow uses `"block w-full"` Tailwind instead of `s.actEyebrow` → loses mono caps + tracking. Confirms the C6 layout regression |
| L5 | `styles.module.scss:507–511` | Commented-out `@media (max-width: 1023px) { display: none; }` inside `.body` — dead comment block |
| L6 | `styles.module.scss:657, 1106` | `var(--font-mono )` trailing space inside parens — lints clean but offends linters |
| L7 | `claim/[token]/page.tsx:80` | `RPage slug={["day-n-night", "claim"]}` drops the `[token]` segment — page transitions may key incorrectly between distinct claim URLs |
| L8 | `guests/page.tsx:11–14` | Metadata `description` hardcoded English only |

---

## Product risk — beyond bug-class

The above is what reviewers find when reading code. The **product-lens** finds what the user *experiences*. These are not bugs; they're decisions you've made implicitly that will produce specific complaints.

### Top 5 user-anxiety moments (ranked by likelihood × intensity)

1. **"Is this real or am I about to get scammed?"** — Korean reader sees a personal Toss account number for a stranger named `리스토어드프로젝트` and "Cash on arrival, or transfer." Post-2020 voice-phishing awareness in Korea triggers immediate pause. Worse: the URL is password-gated, which both *enhances* exclusivity and *amplifies* scam pattern-match.
2. **"Will I be the only person here?"** — `/guests` is built but unlinked. The user can't verify they're not walking into an empty room or a stranger's birthday.
3. **"What do I actually wear?"** — Dress section is editorial-poetic. "Throwback" / "Forward" room labels are art-director cool but tell a new guest nothing prescriptive. Night act's "Sharp. Chic. Dressed to impress." contradicts the laid-back daytime polaroid moodboard.
4. **"Did my transfer arrive?"** — No transaction receipt. Buyer transfers, then... silence. The only confirmation path is Sean manually flipping `paid` in admin → recipient sees `/my` update. But the recipient doesn't know `/my` exists.
5. **"I lost the password / am I in the wrong place?"** — Gate page assumes prior knowledge. No "DM Sean if you got here by accident" affordance. Failure mode is "feel stupid + DM Sean."

### Top 15 expected complaints to Sean's DMs

Ranked by P(it happens) before May 24.

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

### Unintended communications

- **"This is complicated."** — Password gate + 2-view toggle + immersive scroll + cash transfer + (hidden) `/my` + (hidden) `/guests` + (hidden) `/claim`. To Sean, this is "one URL." To the guest, this is a quest. Korean event culture especially favors *legibility* (clear time, place, RSVP form, done).
- **"You should already know."** — The gate page assumes the password is known; `/my` assumes the dashboard's existence is known. Every surface presumes prior knowledge → when wrong, the user feels stupid.
- **"Cash to a personal Toss account."** — Brand says editorial-curated. Payment method says backyard. The mismatch suggests "this might be a side project."
- **"This is for an expat / W-Seoul crowd."** — Polaroid moodboard is all Western film stills (Romeo + Juliet, Mean Girls, Pulp Fiction, Big Lebowski, Crazy Stupid Love). To a Seoul-resident attendee from a different cohort: they're at the periphery of the in-joke. Mixing one Korean reference (a Park Chan-wook frame, a Squid Game still, a Lee Byung-hun) broadens the welcome at no cost.

### Korean-context specifics

- **Address format quirk:** `Sowol-ro 20-gil 64, 3F` is romanized. Koreans use 도로명주소 (소월로20길 64, 3층). Either show both or — much better — link to Kakao Map and let the map resolve it.
- **The phrase "Something quiet, unannounced, will be there"** translates poorly. The Korean reader gets ominous/evasive, not editorial-mysterious. Cut it or make the surprise explicit.
- **`act.day.body` and `cookout.heading` Korean strings still contain English fragments.** Spot-check `ko.json` for English bleed before launch.
- **Cash-on-arrival is unusual in 2026 Seoul.** Even pojangmacha take Toss-pay. Either lean into it ("Bring 65k, old-school") or commit to digital with a confirmation flow.

---

## Phased action plan

### Phase 1 — must-fix before going live (Mon–Tue, ~6 h work)

Anything that **misleads users** or **enables abuse**. Block public RSVP send-out until done.

- [ ] **C1** Enforce `claim_email` in `submitClaim`
- [ ] **C2 + H1** Add `RateLimiterMemory` to both server actions (claim + gate), IP-keyed
- [ ] **C3** Add `Event.Rsvp.claim.errors.notActivated` key; wire to `not-activated` state
- [ ] **C4** Either implement claim-confirmation email OR rewrite the success copy to drop the email promise. Recommended: drop the promise for now ("You're on the list. See you May 24.")
- [ ] **C5** Add explicit error state on `/my` for `orders === null` (Payload outage vs. empty list)
- [ ] **C6** Wrap Closing act in `<div className={s.actInner}>`. Restructure footer to match authored `.closingFoot` grid. Replace inline `font-mono` with `s.actEyebrow`. Apply `.closingStack` + `.closingTitle` properly.
- [ ] **H3** Add `/day-n-night/` to `robots.ts` disallow. Set `metadata.robots = "noindex, nofollow"` on `/my` and `/claim/[token]`. Add reveal-on-click on the password block.
- [ ] **H5 + H6** Wire all 5 `/my` hardcoded strings + 3 `/guests` tier titles through next-intl
- [ ] **H9** Migrate Cookout/Night/Closing reveals to `active` prop driven by scene progress threshold (mirror the dress room pattern)
- [ ] **H13 + H14** Standardize max-widths cross-route. Bump opacities below `/55` to clear the legibility floor
- [ ] **Product P1** Add the **Survival Kit** block to simplified view: tap-to-copy address + Kakao Map link · tap-to-copy Toss account + amount · dress code in 8 plain words · single host-contact DM link · +1 policy line · late-arrival policy line. This single block eliminates ~70 % of the host-DM volume.

**Gate:** After Phase 1, do one human walkthrough as each persona:
- A first-time guest who got the URL via DM (no prior knowledge)
- A buyer who just transferred and is waiting for confirmation
- A gift recipient with a click-through URL
- A Korean monolingual reader

Each should be able to complete their journey without DMing.

### Phase 2 — strongly recommended before launch (Wed, ~4 h work)

Anything that affects user trust or sets up post-event complaints.

- [ ] **H2** Add password hash to HMAC input so rotation invalidates cookies
- [ ] **H4** Collapse `not-found` / `not-activated` / `expired` into one render state on `/claim`. Keep internal `kind` for telemetry
- [ ] **H7 + H8** Fix `ClaimGate.tsx:82` ellipsis pattern; resolve `"throttled"` enum
- [ ] **H10** Scrubber labels to `centersFrac` (or update doc-comment to match start-anchored intent)
- [ ] **H11** Drop `repeat(12, 1fr)` on `.openingStack`
- [ ] **H12** `.openingTitle` color → `var(--dn-fg)`
- [ ] **M1** Add `rsvp.consented` boolean to Profile + include in guests query
- [ ] **M9** Gate page: add "DM Sean if you got here by accident" affordance
- [ ] **M10** 48 h TTL → 7 days OR `/my` reissue button
- [ ] **M11** `/guests` discoverability — link from simplified view + Closing act
- [ ] **Product P2** Confirm-payment loop: either commit to the existing `/tickets/day-n-night` flow as the only path, OR add "you'll get a confirmation DM within 24 h" promise + host-side ack responsibility

### Phase 3 — polish (Thu+, < 4 h work)

- [ ] **M2** Extract `resolveViewerId` shared helper
- [ ] **M3** `/my` tickets `depth: 1` → `depth: 0`
- [ ] **M4** Reconcile `maxLength` between Gate and ClaimGate
- [ ] **M5** Split `Timeline.tsx` into per-act components
- [ ] **M6** Delete ~120 lines of dead SCSS classes
- [ ] **M7** Single shared rAF for all polaroids
- [ ] **M8 + M12** Run `pnpm generate:types`; remove inline casts
- [ ] **L1–L8** Sweep the LOW list
- [ ] **Product P3** Inject one Korean-coded reference into the Dress moodboard

### Post-launch

- [ ] Telemetry on the 4 `/claim` outcomes
- [ ] Telemetry on gate-attempts vs successes (anomaly detection for brute-force)
- [ ] Per-event scoping of `rsvp.tier` (`rsvp.events` relationship) — currently a single global RSVP — deferred until event #2 ships per `DAY_N_NIGHT.md` § 7.1

---

## Verdict

The product **works** and the page **looks good**. Three categories of risk remain:

1. **Two user-facing lies (C3, C4)** — they will produce false complaints to the host. Trivially fixable.
2. **Security floor (C1, C2, H1, H3) is too low** for a paid event with a 30-day cookie and password-claimable gift tickets. Adding rate-limit + `claim_email` enforcement + noindex is < 1 h of work and dramatically raises the floor.
3. **Information architecture is host-centric not guest-centric.** The fix is the **Survival Kit block** on simplified view. Without it, Sean will spend May 22–24 answering DMs about address, payment, and dress code. With it, he gets to enjoy the event.

If Phase 1 ships, the surface is launchable. Phase 2 is the difference between "the page works" and "the page reads as a finished product." Phase 3 is post-launch hygiene.
