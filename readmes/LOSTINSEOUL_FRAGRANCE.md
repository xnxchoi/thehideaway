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
