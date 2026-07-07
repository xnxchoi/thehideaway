# LOSTINSEOUL — Fragrance Launch Chapter

Cross-session continuity doc for the perfume-release surface on lostinseoul.com.
Session origin: 2026-07-02 design-synthesis session (reference deconstruction → council → build).
Read this before touching `/lostinseoul/fragrance/*` or the fragrance fields on Products.

---

## 1. Why (product brief)

- **Who:** first-time visitors arriving from the launch campaign (mid-tier mobile Korea + desktop international), and returning LOSTINSEOUL buyers who already trust the storefront.
- **What:** LOSTINSEOUL's first perfume. The launch page must do what the storefront's
  catalog grammar cannot: give one object a narrative, a place, and a single resolved
  purchase decision.
- **Why now:** the storefront (catalog, cart, checkout, PortOne, drops/campaigns) is
  built and hardened. The missing piece is the *ceremony* surface for the release.
- **MVP:** one scroll-narrative chapter inside the existing storefront shell, driven
  entirely by CMS content, ending in the existing buy module.
- **Anti-goals:** no photoreal glass/liquid attempt; no forked second site; no
  scroll-jacking outside this one chapter; no hard-coded product facts.
- **Success:** the chapter ships fact-agnostic (works with placeholder content),
  survives mid-tier mobile via fallback tiers, and converts through the existing
  commerce spine.

## 2. Reference deconstruction (condensed)

Full analysis lives in the 2026-07-02 session; the load-bearing abstractions:

**OFLYN (oflyn.fr, Awwwards SOTD 2025 — Shopify under WebGL):**
- Narrative envelope: a season-concept governs a tiny SKU set; each product is a named
  chapter with a one-line poem and a forensic material biography.
- **Ceremony at the boundary, efficiency at the core** — 3D budget spent on loader/hero/
  transitions; the PDP is flat photos and fast. ← the structural insight we adopt.
- A silent monochrome canvas makes one moving thing feel alive.
- Costs: usability is its lowest award score; the grammar collapses past ~15 SKUs.

**Bleu de Chanel L'Exclusif (studio 60fps, Awwwards HM 2025):**
- The product as real matter: glass refraction, liquid mass, light as narrative agent,
  one continuous camera, dark ground as *physics necessity* (refraction needs low
  luminance), restrained interactivity (input perturbs, never controls).
- Scroll as directed cinematography: **user drives the clock, author drives the camera.**
- Depth-ladder merchandising: one scent at several concentrations = the page structure.
- Conversion as narrative resolution: one CTA, at the end, earned.
- Costs: specialist-grade shader work (plasticky glass is worse than none); fragile past
  one hero SKU; Chanel-sized trust lets them defer commerce — a young house cannot.

**Triangulation:** Aesop (motion as courtesy; nav restock path), Byredo (name + still
life carry the story; KR localization precedent), Le Labo (the transaction as ritual —
your name on the label; enforced scarcity).

## 3. Council verdict (4-voice, 2026-07-02)

Unanimous on architecture; my opening position (dedicated route + hours-ladder now)
was overruled 3:1 and revised.

1. **Architecture — threshold theater + fast core.** One WebGL surface (this chapter).
   PDPs/cart/checkout stay flat and fast. Video fallback below a device floor;
   `prefers-reduced-motion` gets a complete editorial twin, not a degraded scene.
2. **Skin — Seoul-night relighting.** Scroll beats re-*light* one scene (neon, rain,
   sodium, dawn) rather than move a camera through geometry. Achievable with light,
   atmosphere, and abstraction — no photoreal bottle required. The bottle slot stays
   empty until original assets exist.
3. **Identity — bilingual typography as design.** Hangul and Latin as a composed pair
   on the same surface (display voice / reading voice), not a locale toggle. The only
   direction with zero WebGL risk that no reference does. next-intl still owns all
   strings; the *pairing* is layout, not a second locale store.
4. **Commerce — resolution, not ambience.** Single CTA at the narrative's end, wired to
   the existing order modes; but always reachable within one viewport of desire peak
   (sticky quiet affordance after the reveal beat).
5. **Deferred:** hours-ladder (activates only when concentration facts exist in CMS);
   commissioning ritual (buyer's name typeset on a digital label + edition numbering)
   as fast-follow.

**Launch gates surfaced by all three external voices:**
- **Product facts are the real blocker, not engineering** — fragrance name, bottle
  design, concentrations, price, edition size are unknown. Therefore everything is
  CMS-driven and the shell must render beautifully with placeholders.
- **The oflyn-ripped GLB scene (`public/assets/lostinseoul/oflyn/`) is a legal/brand
  liability** and must not ship under the house's first perfume. The fragrance chapter
  uses no oflyn-derived assets; replacing the storefront hero scene is tracked
  separately.

## 4. Design system (fragrance chapter)

- **Canvas:** near-black night ground (`--lost-night`, oklch ~10–12%), inheriting the
  storefront's OKLch token discipline. Dark ground is *functional* (light beats need
  low luminance), not a mood default.
- **Accent:** one juice-derived accent token (`--lost-juice`) sampled from the product
  when facts arrive; placeholder is a han-river sodium amber. Palette is inherited from
  the object, never applied to it.
- **Type:** existing mono-tracking chrome stays; the chapter introduces the bilingual
  display pair — KO display / EN reading (swapped per locale). Scale follows the
  project hero ramp; contrast floor rules apply (informative text ≥ AA).
- **Motion:** Lenis + Motion for DOM; beats are scroll-scrubbed light/opacity states.
  Compositor-friendly only. `[0.6, 0, 0.3, 1]` easing family, consistent with entry.
- **Scene tiers:** (1) WebGL relighting scene, (2) video render fallback,
  (3) editorial twin (static imagery + full DOM text) — tier 3 is the reduced-motion
  and no-JS truth, and every beat's copy exists in DOM regardless of tier.

## 5. Voice profile (derived from live site copy)

Source: LOSTINSEOUL namespace in `messages/en.json` ("Objects, editions, and small
commitments from the city…", "Limited runs, Seoul dispatch", "Made in Seoul").

- Declarative, compressed sentences. No exclamation, no persuasion vocabulary.
- Nouns over adjectives: "objects," "editions," "commitments," "dispatch."
- Scarcity stated as fact, never as urgency ("Some only happen if enough people commit").
- Lowercase sentence case for prose; uppercase reserved for the wordmark and chrome.
- Fragrance copy extends this: accord/material language stays forensic (Le Labo-plain),
  narrative lines stay one-breath short (OFLYN-fragment), never both in one block.
- KO copy is written as KO, not translated EN — same register: 담백한 서술형, no 존댓말
  marketing filler.

## 6. Architecture (implementation)

- **Route:** `src/app/(frontend)/(site)/(pages)/lostinseoul/fragrance/page.tsx`
  (server; fetches the fragrance product/drop) + `page.client.tsx` (chapter surface).
  Lives inside the storefront shell — same chrome, cart, entry/cursor systems.
  `/lostinseoul/*` scoping in proxy/nginx already covers it.
- **Data:** driven by Products rows (storefront `lostinseoul`) flagged as fragrance,
  via an optional `fragrance` field group (concentration, accords, notes, edition
  fields — all optional). Absent facts → placeholder-composed shell.
- **Scene:** new original scene module (no oflyn assets) following the established
  hero-three patterns (pause states, scroll uniforms, postprocessing) but beat-driven:
  a light-state timeline mapped to scroll progress.
- **Commerce exit:** the final beat renders the existing buy affordances (mode-aware:
  buy / commit / private) against the chapter canvas.
- **i18n:** all strings under a `LOSTINSEOUL.fragrance` namespace, en+ko in lockstep.

## 7. Status log

- 2026-07-02 — Direction committed (this doc). Implementation session started.
- 2026-07-03 — v1 shipped at `/lostinseoul/fragrance` (route, beats, original
  procedural relighting scene, tier logic, bilingual display pair, commerce
  beat, sticky affordance, en+ko copy). Verified headless at desktop/mobile/
  reduced-motion/ko; 116 lostinseoul tests green; zero new type errors.
  Adversarial dual review (correctness + design/perf) ran; all blocking
  findings fixed. Honest amendments and open items:
  - **CSR bailout is site-wide, not chapter-specific**: no lostinseoul route
    SSRs page DOM (RPage/transition layer bails to client — `next/dynamic`
    bailout visible in streamed HTML). The "editorial twin is the SSR truth"
    clause in §4 therefore currently means *client-rendered DOM truth*; the
    twin is still complete (full text, no-WebGL, reduced-motion). SSR
    restoration is tracked as its own task — it affects the whole storefront's
    SEO, not just this chapter.
  - **Video tier is stubbed**: `getLostFragranceRenderTier` can return
    `"video"` (no WebGL, or mobile with reported memory ≤ 4GB) but no render
    asset exists yet, so video-tier users get the editorial presentation.
    When a rendered loop lands, mount it in `page.client.tsx` behind the tier.
  - **Bilingual display pairing**: Latin display = Geist Mono 700, Hangul
    display = SUIT 800 (`fragrance.css`), verified via computed styles. Every
    beat heading carries an sr-only active-locale twin so the document
    outline reads in the user's language; arrival is the `h1`.
  - **Commerce guardrails**: quote-only private orders and multi-variant
    products do NOT add to bag from the chapter — the CTA becomes a link into
    the product page's full flow (parity with `product.client.tsx`).
  - **Scene lifecycle**: fresh canvas element per effect run — cleanup calls
    `renderer.forceContextLoss()`, which permanently kills that canvas's
    context, so remounts (StrictMode) must not reuse the element. Do not
    "simplify" this back to a JSX canvas ref.
  - **Deferred (fast-follow)**: fragrance CMS fields (`fragrance` json on
    Products + accords/concentration rows in the reveal panel — re-add the
    `reveal.notesLabel`/`reveal.concentrationLabel` keys then), commissioning
    ritual (named label + edition numbering), hours-ladder (when
    concentration facts exist), per-beat editorial art direction beyond the
    alternating anchors, three.js chrome bundle split (task chip filed),
    replacement of the oflyn-derived storefront hero scene (launch gate for
    the house, separate from this chapter).
- 2026-07-05 — Scene development pass (v1 read as "dark void with colored
  fog"; references D.S. & Durga / Bleu de Chanel L'Exclusif / Maison
  Crivelli). What changed:
  - **City reads as a place now**: lit-window instancing + hand-placed neon
    signage on the procedural skyline (`fragrance-city.ts`, deterministic,
    tested); fog eased 0.05 → 0.034 so the skyline survives.
  - **Wet-asphalt ground shader** (`fragrance-ground.ts`): puddle-masked
    stretched reflections of each sign / the sweep light / the reveal column,
    plus a localized key-light pool per beat. This is the Seoul-night
    signature surface — tune `uWet` per beat via the light states.
  - **Authored camera** (`fragrance-camera.ts`, pure + tested): one composed
    shot per beat, smoothstep-interpolated by scroll — Chanel grammar (user
    drives the clock, author drives the camera). Keys align to beat starts.
  - **Particles fixed**: rain is LineSegments streaks, motes are soft round
    sprites kept ahead of the camera path (no lens-ball blowups).
  - **Reveal object**: an additive column of light on a plinth at the object
    slot (bottle stays empty per launch gate); breathes with reveal progress,
    reflects in the ground, hidden until the reveal beat.
  - **Film grain** (postprocessing NoiseEffect, overlay 0.11) kills the dark
    gradient banding.
  - **Night rail** (DOM): fixed right-edge beat nav on lg+, active tick shows
    the beat's localized eyebrow (reuses existing strings — no new message
    keys); hides with bag open and past chapter end.
  - Light states gained `wet` / `windows` / `signs` channels per beat.
  - Verified: 119 lostinseoul tests green; desktop/mobile/reduced-motion/ko
    headless passes; zero new type errors (footer prop + translator errors
    in this dir are pre-existing type debt).

---

## 8. DIRECTION RESET — Catalyst (2026-07-06)

**Everything in §2–§5 above (the "Seoul night" relighting travelogue) is
SUPERSEDED as concept.** The scroll→light-state→camera *architecture* is sound
and reusable; the *subject* it rendered (literal city, clock-times, districts)
was rejected by the founder twice as "too literal." Do not resurrect the
Seoul-night beats/copy. The engine survives; the world it depicts does not.

### The concept (from the founder's author-note letter — BACKSTAGE, never on page)

The perfume is **Catalyst**, first movement of LOSTINSEOUL's return as a
**"Retail Art House"** (2016–2026, decade comeback, ~7-year hiatus after 19 S/S).

- **Catalyst = a chemical catalyst**: inert, nonreactive, static *alone* — but
  "ready to explode on contact with the right materials."
- **Product truth (load-bearing):** it is NOT a standalone fragrance. It is a
  **catalyzer** — worn under/over skin or another scent, it **strengthens and
  harmonizes** the whole. It **projects to others, not to the wearer** ("자신보다
  타인에게 강하게 발향"). Defined *through the other* (타자). The fragrance has no
  fixed self; it becomes what it meets, louder.
- **Persona:** Seoul as a teenager — hypercompetitive, deferential, untamed;
  brilliant, magnetic, driven; and anxious, imposter-ridden, **directionless**
  ("success at all cost" / no answer to "for what?"). *"I'm ready to burn baby,
  light me up."* Contradiction is the engine, and its beauty.
- **Emotional payload (conveyed, NEVER stated literally):** *"buy this, spray
  it — let me burn the world for you."* Reckless, incandescent, offered outward.

### Visual thesis (chemistry leads, but NON-literal — no bunsen flame)

The page **is** the reaction. Expressed as two transitions:
**static → kinetic** and **colorless → colorful**. House is monochrome; **color
+ motion are the reaction made visible** (Chanel "monochrome pierced by one
event"), earned, brief, climactic — not decoration.

### Locked script structure (v0.1 — STRUCTURE APPROVED by founder; copy NOT)

Three movements = the chemistry and the psychology at once:
1. **INERT** — Catalyst alone: static, colorless, coiled. (Honest: it really is
   subdued alone.)
2. **CONTACT** — meets *the other*: your skin, your scent, you the viewer. The
   **viewer is the reagent** (scroll/cursor = contact). Defined through the other.
3. **IGNITION** — kinetic, colorful: it burns *what it touches* into harmony —
   louder, outward, for the world. Object surfaces here (withheld till this beat,
   Chanel). → commerce resolution.

### Copy rule (the founder's register, not the caption-writer's)

- **Two registers, NEVER mixed in one block** (existing house discipline, §5):
  - *Art/narrative register* (the movements) — oblique, one-breath, speaks
    *from* the concept's mouth (first-person, reckless, adolescent — the
    "light me up" voice), never a how-to, never narrating the visual.
  - *Forensic register* (one small plain block near the buy) — states the
    catalyzer function flatly so no one misreads the purchase (layering,
    projects-to-others). Le-Labo-dry.
- **Copy is the founder's strength and is PARKED** until the visuals exist.
  Do NOT pitch aphoristic design-captions (e.g. "Alone, inert. On you, a
  reaction.") — they read as an AI fragrance-ad impression. Write copy LAST,
  against the finished world, in the reckless first-person voice or near-silence.

### Reference houses (Stage 0 dossiers — distilled; full research in session 2026-07-06)

- **D.S. & Durga:** smell-as-displacement — write *an object under a condition*,
  let the nose infer; three-layer copy (riddle logline → scene sentence →
  first-person essay); riddle names. Steal the message-first engine; avoid
  literal travelogue + whimsy-without-craft.
- **Chanel (Bleu / Les Exclusifs):** one idea stated once; negation/self-
  authorship rhetoric; **name-as-object**; monochrome + one event; withhold the
  bottle; Soulages "paint not product." Skip the auteur/celebrity/licensed-music
  apparatus a young house can't afford.
- **Maison Crivelli:** **contrast IS the grammar** (irreconcilable sensations
  forced together); one captured moment, location withheld, wearer completes it;
  brief perfumers with a moodboard. Do it in **value/texture, monochrome** — not
  his loud bi-chromatic hue.

### Pre-production pipeline (implementation FROZEN until Stage 3 locks)

Founder-mandated order — no code before the shot deck is locked:
- **Stage 0 — reference dossier** ✅ done (3 houses).
- **Stage 1 — concept + script** ✅ structure locked; copy parked.
- **Stage 2 — moodboard** 🔄 in progress: case studies for static→kinetic and
  colorless→colorful (abstract, never literal fire), assembled into a viewable
  board grouped by the 3 movements.
- **Stage 3 — scene-by-scene reference deck**: every scene describable through
  reference images alone.
- **Stage 4 — blueprint the build** (gated on Stage 3).

### Code status — THROWAWAY SKETCH, do not build on

The uncommitted "light-air" scene (shaft/haze/motes in `fragrance-scene*.ts`,
`fragrance-light.ts` continuous field, `fragrance-phases.ts` open/bloom/suspend/
resolve, abstract copy in messages) was a Stage-pre sketch built BEFORE the
Catalyst concept landed. It is **not** the design. Kept on disk only as a
disposable sketch; the real scene follows the locked script + shot deck.
Literal city modules (`fragrance-city/ground/stage`) already atticked.

- 2026-07-06 — Direction reset to **Catalyst** (this section). Ran 3-house
  reference research + council (reskin-vs-teardown → reskin). Flipped to
  message-leads-scene, pre-production-before-implementation. Script structure
  approved; copy parked; Stage 2 moodboard research in flight.

- 2026-07-06 — **Colour locked: SODIUM EMBER** (not cold blue). Catalyst's single
  earned colour event is a deep sodium/ember — the incandescence of "light me up."
  Kept deep and rare (never candy-bright) so warm-on-black doesn't read familiar.
  Stage-2 moodboard shipped + repainted to ember. Next: Stage 3 scene deck.

- 2026-07-06 — **Composition: bottle-as-hero + reaction-as-backdrop** (SŌM model,
  product-forward). The object is NOT fully withheld now — the tube bottle is the
  display subject throughout; the reaction (ember, static→kinetic) plays on the
  backdrop and rim-lights the glass. Adjusts deck S5 from "object first appears"
  → "burn peaks around the object." Placeholder interactive 3D bottle built as a
  self-contained WebGL artifact (lathe tube, satin glass + dark cap, ember-lit,
  slenderness/radius sliders) — proportions TBD by founder. Not repo code yet.

- 2026-07-06 — **Stage 3 scene deck shipped** (5 scenes: Dormant · Contact ·
  Ignition · Peak · Held/commerce). Format: real reference pics (CC embedded +
  attributed, art/film linked-not-redistributed), art-direction spec per scene,
  bottle-in-scene state, parked copy. Bottle-as-hero + reaction-backdrop. Forensic
  catalyzer block drafted in S5 (founder to approve). Colour = sodium ember.
  Bottle: clear cylinder + tiered chrome cap + ember juice, ~3.4/0.35.
  Artifacts (session): moodboard, bottle study, scene deck. Next gate: Stage 4
  blueprint the build — only on founder sign-off of the deck.

---

## 9. RESUME POINT — 2026-07-06 evening (device-restart handoff)

Mid-build on the Catalyst page. **The scene renders but is not yet good.** Read
this whole section before resuming — it captures the critical "eyes" method,
the current visual state, and the exact next steps.

### THE CRITICAL UNLOCK — how to SEE the WebGL (do not build blind)

The claude-in-chrome extension CANNOT screenshot the animating page (the rAF
loop blocks CDP `document_idle`, and the automation tab is `document.hidden` so
the scene loop pauses). **Building the scene blind is what produced a page the
founder rejected outright.** The fix: **headless Playwright** (chromium +
swiftshader) renders the page *visible-to-itself*, so the animation runs and
screenshots capture real frames.

Recipe:
1. Dev server: `pnpm dev` (serves `http://localhost:3000/lostinseoul/fragrance`).
2. Run the capture script (below), then `Read` the PNGs it writes — Claude can
   view them. Also feed founder screen-recordings through the
   `claude-video-vision` MCP (`video_watch`) — that works too.

Capture script (recreate at a scratch path if `/tmp` was wiped — it lived at
`…/scratchpad/shot-fragrance.mjs`). Note the `createRequire` shim so a script
outside the repo can resolve the project's `playwright`:

```js
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire("/Users/seanschoi/WebstormProjects/thehideaway/");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "./frames"; mkdirSync(OUT, { recursive: true });
const URL = "http://localhost:3000/lostinseoul/fragrance";
const browser = await chromium.launch({ headless: true, args: [
  "--use-gl=angle","--use-angle=swiftshader","--ignore-gpu-blocklist",
  "--enable-unsafe-swiftshader","--enable-webgl" ] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector('[data-lost-fragrance-scene-ready="true"]', { timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(1500);
for (const p of [0,0.25,0.5,0.75,1]) {
  await page.evaluate((prog)=>{ const m=document.documentElement.scrollHeight-window.innerHeight; window.scrollTo(0, Math.round(m*prog)); }, p);
  await page.waitForTimeout(1100);
  await page.screenshot({ path: `${OUT}/f_${String(Math.round(p*100)).padStart(3,"0")}.png` });
}
await browser.close();
```
Run: `node <script>.mjs`  → writes `f_000..f_100.png`; `Read` them.
**Every visual change from here MUST be verified with a capture before showing the founder.**

### Current visual state (what the last captures showed)

- **Bottle material — MUCH improved, was the #1 failure.** Was opaque milky
  plastic; now (after shader rewrite) reads as glass: dark empty-glass shoulder,
  translucent ember **juice** glowing in the lower body, brighter chrome cap.
  Still could be more convincingly glass (no real refraction; it's fresnel-rim +
  juice-glow + dark body). Good enough to build on.
- **Backdrop — FIXED (2026-07-06 eve).** Was a full-frame orange flood at the
  scroll midpoint. Two coordinated fixes, both grounded in the locked Stage 3
  deck (pulled via WebFetch — work against the deck, not §9 prose):
  1. **Temporal (fragrance-light.ts reaction keys, re-timed to the phase
     boundaries):** long colourless dormant (near-zero to ~0.34), a *hairline*
     at contact, the bloom born from the dark across ignition to full only at
     **peak-start ~0.6 (earned LATE)**, brief crown at 0.82, afterglow to 1.0.
     The old curve hit full bloom at 0.47 (the midpoint) — a direct violation of
     "colourless→colourful, ignition is movement 3 of 3."
  2. **Spatial (backdrop shader):** bloom now issues from one origin behind the
     bottle, narrow/tall, tight falloff + high exponent → frame stays ~90% black
     ("black 95% of the frame", "one origin outward"). No more flood.
  Verified via headless capture: f_000 near-black colourless, f_050 a *contained*
  ember pool (was a wash), f_075 deeper sodium juice + slight projection.
  Remaining polish (not blocking, revisit after layout): juice is a touch bright/
  orange — deepen toward "deep sodium ember"; peak could throw a little wider.
- **BLACK DOT ARTIFACT — RESOLVED (was a headless-capture artifact, NOT geometry).**
  2026-07-06: proved it is the site's custom cursor (`LostCursorBridge`) resting at
  viewport-centre when the pointer never moves — it sits at screen (720,450) on a
  1440×900 shot, which coincidentally lands on the centred bottle. Moving the mouse
  to a corner (`page.mouse.move(1420,24)`) removes it entirely; DOM probe found no
  round element and no pointer uniform reaches the scene. The capture script now
  parks the mouse in a corner before every shot. Nothing to fix in the lathe.
- Bloom lowered to 0.62 (halo tamed). Motes restored to `particulate * 0.32`.

### STILL WRONG — not yet touched (the founder flagged all three)

- **Caption/copy:** still the OLD light-air copy ("빛 / Light / Bloom /
  Suspension / 머무름 / № 01"). `messages/en.json` + `ko.json` fragrance block,
  `page.tsx` copyFrom, and `page.client.tsx` `PHASE_ORDER` are ALL still
  `open/bloom/suspend/resolve`. Must recast to the 5 Catalyst scenes
  (dormant/contact/ignition/peak/held), near-silent, with the forensic catalyzer
  block in Held (draft in deck §S5).
- **Layout:** still the generic template (big word left, bottle centre, standard
  site footer). Must be rebuilt to the deck's cinematic dark composition.
- **Animation:** currently just background-colour fades + word-swaps. No real
  static→kinetic / ignition / projection beat. Build the actual motion, verify
  each step via capture.

### NEXT STEPS (in order)

1. ~~**Black-dot bug**~~ — DONE: proved to be the custom-cursor capture artifact (see above); capture script fixed to park the mouse. No scene change needed.
2. ~~**Backdrop**~~ — DONE (2026-07-06 eve): re-timed reaction curve (colourless-early, ignite-late) + contained bloom shader, both grounded in the Stage 3 deck; verified via capture. 27 fragrance tests green.
3. **Copy recast (NEXT)** — messages en+ko + page.tsx + page.client `PHASE_ORDER` → 5 Catalyst scene IDs (dormant/contact/ignition/peak/held). STRUCTURAL ONLY: fix the phase-id mismatch (page.client still `open/bloom/suspend/resolve` — resolves the transient type errors), strip the dead 빛/Bloom/Suspension copy, drop in near-silent placeholders. Keep the founder's-register narrative copy PARKED (writing Catalyst captions is banned until visuals are final). The one real copy is the forensic Held block — use the deck §S5 draft verbatim, don't invent: *"A catalyzer, not a soloist. Worn under or over what's already yours — skin, or another scent — it strengthens and harmonises the whole. It carries to others, not to you."* then *"Catalyst. Limited run, Seoul dispatch."*
4. **Layout rebuild** — page.client + fragrance.css to the deck composition (bottle-hero, dark, editorial).
5. **Animation** — real reaction choreography; verify via capture each change.
6. **Verify** — `pnpm vitest run "…/lostinseoul/fragrance"` (26 tests currently green), capture frames, and a real-browser check.

### State of the code (what's DONE and correct)

- `fragrance-phases.ts` (+test): 5 scenes dormant/contact/ignition/peak/held. ✅
- `fragrance-light.ts` (+test): `evaluateLostFragranceReaction` — continuous
  ember reaction field over scroll (background/ember/reaction/juice/key/
  projection/particulate/exposure). ✅ pure + tested.
- `fragrance-camera.ts` (+test): keys reframed to hold the bottle. ✅
- `fragrance-scene-objects.ts`: `buildLostCatalystBottle` (lathe, glass+juice+
  chrome shader), `buildLostEmberBackdrop`, `buildLostEmberMotes`. Bottle good;
  backdrop needs tightening (above).
- `fragrance-scene.tsx`: composes them, scroll-driven, ready-on-mount fixed. ✅
- 26 fragrance tests green; no NEW type errors in scene modules (page.client/
  page.tsx have transient phase-id mismatches from the not-yet-recast copy —
  non-blocking, `ignoreBuildErrors` on).

### Uncommitted / git note

Everything above is UNCOMMITTED on shared `main` (concurrent sessions share this
tree). Nothing committed this build. Atticked earlier: fragrance-city/ground/
stage. On resume, re-check `git status` before editing.

### Reference artifacts (on claude.ai — survive restart)

- Moodboard: https://claude.ai/code/artifact/802fc32a-3fed-46db-bcd6-0a9023661606
- Bottle study: https://claude.ai/code/artifact/9f8850cc-73f6-4941-a90c-69569e94b1f2
- Scene deck (5 scenes, the design target): https://claude.ai/code/artifact/63d8e9bf-2b95-4bcc-80a0-fd6762485734
- **Reaction look-candidate v1 (ember plume, 2026-07-07): https://claude.ai/code/artifact/d927c1de-b40c-42d2-b1ea-225d069bf162** — awaiting founder verdict (see §10).

---

## 10. DIRECTION PIVOT — abstract reaction as hero (2026-07-07)

**The whole bottle-in-a-void scene was rejected: founder's words, "the scene is shit."**
The literal glowing-juice bottle read as a cheap CGI product render — the exact
too-literal, template read the concept exists to kill. Polishing it (contained
backdrop + re-timed curve, §9) improved the wrong object. **A realtime procedural
lathe bottle will never read as a Retail Art House launch — do not resume it.**

**New locked direction (founder-picked, 2026-07-07): the ABSTRACT REACTION is the
hero; the bottle is withheld, surfacing only at ignition/peak.** Ink-plume /
ferrofluid / ember-core against ~95% black — the deck's own S2–S3 references,
which name the **Seveso ink-plume as "the closest 1:1 to the concept."** Monochrome
pierced by one event; the object is not the subject, the reaction is.

- **Medium:** WebGL stays the vessel (founder passed on "scrap WebGL for rendered
  film"). Whether the reaction is a shader or a mapped/generated loop is decided
  against a blessed look — TBD by the candidate verdict.
- **Look-candidate shipped + LOVED** (artifact above): a real domain-warped
  ember-plume shader — deep sodium ember, ~95% black, no bottle, scroll drives
  colourless → ignition → afterglow. Verified premium via headless capture
  (`plume.html` + `shot-plume.mjs` in scratch). Founder 2026-07-07: *"oh HELL YES
  … I LOVE the color and the rising plume."* Direction (colour + rising plume) is
  **locked**.
- **v2 (2026-07-07) — founder's two tweaks, both built + verified, same artifact URL:**
  1. **Still black-water surface** below a waterline (~y=-0.28): the plume reflects
     in it (rippled, dims with depth) + a faint pre-ignition sheen so the quiet
     water reads early, then "lights up" as the plume ignites — a coherent SCENE,
     not a floating plume. Maps to the deck: Dormant=still water, Contact=ripple/
     "viewer is the reagent", Ignition=water catches fire in reflection.
  2. **Emissive glow** — hottest filaments self-emit + a restrained 6-tap soft
     halo (fake single-pass bloom) so it "feels like a flame," not a flood.
- **v3 (2026-07-07) — fixed "plume cropped by the water"** (founder flagged the
  hard mirror seam): dropped the waterline low (y=-0.36) so the plume rises from
  it rather than being bisected; reflection now diffuse + ripple-broken (3-tap
  vertical blur, fast depth fade) not a clean mirror twin; soft glowing contact
  mist straddles the waterline so the plume *emerges* from the water. Same URL.
- **v4 (2026-07-07) — "quiet, occasional" ripples** (founder: uncropping made it
  read less like water): added concentric ripple rings — 3 slow emitters on
  8/12/16s cycles with 5.5s life, so long still gaps between rings; crests catch
  ember light so the surface reads as a body of water. Restored reflection a touch
  (refAmt 0.34→0.40). `ripRing`/`waterRipples` in `plume.html`. Same URL.
- **v5 (2026-07-07) — plume ROOTED on the water** (founder: ripples brought back the
  "clipping"; ref = fire-trails.vercel.app, flames sitting on a rippling surface with
  visible roots). Fix: lifted the plume (origin -0.24→-0.14) and raised the waterline
  to its root (waterY -0.36→-0.17, lower third); the base now spills firelight onto
  the wet rippling water (`rootBase` glow + ripple-lit wet glints) so flame & surface
  integrate, reflection streaks down. No hard horizon crop. Same URL.
  Tunable live: ripple-ring prominence (currently a bit bold), how high the plume sits.
- **v6 (2026-07-07) — smaller ripples, glassier water** (founder: ripple size read as
  "water literally in your face" — too big; wanted a more reflective surface, keep the
  near-black). Fix: shrank the ripple field (ring radius 0.13→0.045, finer wave
  52→130, tighter front, foreshorten squash 2.6→3.4, emitters spread wider) so it reads
  as a *distant* body of water; and made the surface more reflective — brighter/deeper
  mirror (reflection 0.42→0.62, falloff -1.9→-1.35), extra ripple-shimmer distortion,
  and a grazing-angle Fresnel sheen at the horizon. Shade stays near-black. Same URL.
- **v7 (2026-07-07) — sourceless ambient night-light** (founder: add "invisible
  lighting" so the water retains visibility when the flame is low, but reflections must
  not reveal an obvious artificial source). Fix: a broad night-sky ambient wash on the
  water (`nightSky` ≈ 0.018, no hue/hotspot) that is *darkest at the horizon seam*
  (`nearView = smoothstep(0,0.55,depth)` → 0 at the waterline) and lifts gently toward
  the viewer, broken by a slow low-freq `fbm` shimmer + ripple crests so it reads as
  living water not flat fog. No bright seam line, no localized source; the plume
  reflection stays the only "source." Early/afterglow water now legible; lit frame
  unchanged. Same URL.
- **v8 (2026-07-07) — broken water reflection, ambient reverted** (founder: retracted
  the ambient — "don't need it"; the plume read toned-down [it was the ambient grey
  flattening contrast]; surface needed to be *less silky / flat / vertically stretched*;
  target = fire-trails.vercel.app water — captured its reference: reflection is a compact,
  shattered kiss at the surface under the flame, not a long vertical mirror; rest of the
  water is black). Fix: removed the v7 `nightSky` ambient entirely; reworked the surface —
  added fine `fbm` wind-chop on top of the rings (`surf = rings + chop*0.6`); reflection
  now SHORT (falloff -1.35→-3.6, dies fast into the water) and shattered horizontally
  (`bands = smoothstep(-0.1,0.3,surf)`, heavy `disp` displacement) so it reads broken not
  silky; added a compact hot `glint` where flame kisses its reflection + specular sparkle
  on the chop. Plume restored to full contrast. Same URL.
- **v9 (2026-07-07) — vertical banding killed, horizontal ripple bands** (founder: v8
  still showed hard vertical light columns dropping from the base). Root cause: the
  `glint` sampled the plume at a *fixed height* for every pixel → any bright x painted a
  full vertical column down; and the reflection's `0.3+` brightness floor let the mirrored
  vertical stem show through. Fix: breakup now driven by horizontal ripple *ridges*
  (`ridge = sin(depth*58 …)`, a function of DEPTH not x, noise-warped so it's water not
  scanlines); `bandMask` reaches 0 in the troughs (no floor) so no vertical column can
  survive; reflection + glint sheared sideways per-row by `disp` and both multiplied by
  `bandMask`. Reads as horizontal water ripples receding from the viewer. Same URL.
  Tunable: band frequency (`depth*58`) for finer/coarser ripples; add foreshortening so
  bands bunch toward the horizon; the ripple rings (`waterRipples`) are currently unused —
  fold back in if we want the occasional concentric disturbance again.
- **v10 (2026-07-07) — zebra fixed + live control panel** (founder: v9 read as a
  "zebra" — the single low-freq `sin(depth*58)` + `smoothstep` made hard on/off stripes).
  Fix: replaced the regular sine bands with FINE IRREGULAR layered `fbm` ripple (higher
  freq toward the horizon), a GENTLE brightness shimmer (`(1-uShimmer)+uShimmer*rip`,
  never full on/off) and a moderate horizontal `disp` smear to keep the column broken —
  a soft compact reflected glow, no stripes, no vertical column. Then wired the major
  values to uniforms and added a **leva-style inline control panel** (top-right; vanilla
  JS since real leva needs React+CDN which the artifact CSP blocks): SCENE freeze+progress
  (scrub the reaction without scrolling), PLUME brightness/root-height/bloom, WATER
  waterline/refl.length/ripple-contrast/refl.break-up/ripple-density/wet-sparkle, TONE
  exposure. Panel lives in both `plume.html` and `artifact-plume.html`; when the look is
  blessed, bake the chosen `P` values back into the shader constants before porting to
  the real scene (the panel + uniforms are dev-only scaffolding, not for production).
  Same URL.
  **Still a disposable candidate** — do NOT wire into `/lostinseoul/fragrance` yet.
  Open for live tuning: exact early-water visibility, an *interactive* cursor/
  scroll contact-ripple (Contact beat), ember depth. Perf note for the real build:
  the fake bloom is ~9 turb calls/px — replace with a proper bloom pass / lower
  octaves when it becomes the actual scene.
- **PARKED, do not let it resurface as a surprise:** withholding the bottle only
  *defers* the cheap-bottle problem — the lathe still can't appear at the reveal.
  When the look is blessed, the ignition/peak bottle reveal needs a real asset
  (rendered loop / quality GLB), not the procedural lathe.
- **Fragrance scene modules** (`fragrance-scene*.ts`, bottle builder, the §9
  backdrop/curve work): superseded as the *hero* approach. The reaction-field
  timing + phase grammar may still be reusable; the bottle-in-void composition is
  not. Await the look verdict before rebuilding the scene.

**Next gate:** founder reacts to look-candidate v1 (yes / no / adjust). Only then
blueprint the real build. No scene code until a look is pointed at.
