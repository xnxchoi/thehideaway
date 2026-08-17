# Homepage Hero — Design Reference & Plan

> **Purpose.** Persistent cross-session reference for the visual layout of the homepage hero, owned by [
`src/components/layouts/ArticleFrontpage/index.tsx`](../src/components/layouts/ArticleFrontpage/index.tsx). This
> document does not govern copy. User-facing text follows `readmes/VOICE.md`.
>
> **Scope of current sprint.** Rewrite of `ArticleFrontpage` and the `HomeSquare` slot it embeds. **Out of scope:** archive/paginated index pages, category/tag landing pages — see *Future Work* at end.
>
> **Last updated.** 2026-05-07.

---

## 1. Inverse — Top Hero Deconstruction (DEEP)

> Source: live audit via WebFetch + class/CSS introspection of `inverse.com`.

### 1.1 Hero Anatomy
One zone, **four content slots** in a single grid composition before the page rhythm changes (next zone is an "Inverse Recommends" tabbed cylinder):

- **Slot 1 — Lead** — single image-led story with caption + subtitle + byline. Image-dominant.
- **Slot 2 — Secondary A** — square-image card with image-left / type-right mini-layout.
- **Slot 3 — Secondary B** — same shape as Secondary A.
- **Slot 4 — "The Latest"** — type-led headline list (~8 dated headlines, no images).

### 1.2 Grid Topology
- Wrapper is `display: grid` with **`grid-template-columns: repeat(6, 1fr)`** at ≥1024px; `1fr 1fr` (2-col) below; full linearize at narrow mobile.
- Asymmetric, two-row composition:
  - Lead: `grid-column: 1 / 5` (4 of 6 cols) row 1.
  - Secondary A: `grid-column: 1 / 3` row 2.
  - Secondary B: `grid-column: 3 / 5` row 2.
  - "The Latest" rail: `grid-column: 5 / -1` rows 1 / 3 — **a tall right rail spanning both rows**.
- Outer container `border-radius: calc(var(--collectionRadius) * 2)` (≈20px) — the entire hero sits in **one rounded card on a soft gradient ground**.

### 1.3 Silhouette Logic (THE KEY MOVE)
- Lead image: `padding-top: 56%` (≈16:9 letterbox), full width of its 4-col span.
- Secondary thumbs: square (Imgix face-cropped, 205×205 → 323×323 → 177×177 across breakpoints).
- "The Latest" rail: zero images. Pure type list with top-bordered separators.
- **Tiny radii.** `--collectionRadius: 5px` mobile / `10px` desktop. Image radius = `calc(--collectionRadius / 2)` ≈ **2.5–5px**. Outer card = `calc(--collectionRadius * 2)` ≈ **10–20px**. Almost square.
- **Signature trick:** `:after` masks a wavy SVG silhouette into the bottom edge of the lead image, blending it into the pale chartreuse body color. Image isn't a clean rectangle — it dissolves into the card. A `backdrop-filter: blur(7px)` gradient strip reinforces this.
- Image is flush to its slot, not insetted. Card chrome wraps everything; the image defines the silhouette of the lead, not of the secondaries.
- Negative-margin glue: `margin-left: calc(--halfGutter * -.5)` and `margin-right: calc(--halfGutter * -.5)` so slots butt-join at the gutter line — no double gap.

### 1.4 Type Ladder
| Element                | Family                   | Size (desktop / mobile)         | Weight          | Tracking | Line-height                             |
|------------------------|--------------------------|---------------------------------|-----------------|----------|-----------------------------------------|
| Lead headline          | SuisseWorks (serif)      | 2.5rem (~40px) / 1.5rem (~24px) | 400             | -.01em   | 1.2                                     |
| Lead subtitle          | sans (inherit)           | 1rem / 0.875rem                 | 400             | —        | 1.2 (max-width 70%, `mt: -10px`)        |
| Secondary headline     | sans                     | 1.25rem (~20px)                 | 600+            | -.01em   | tight                                   |
| Eyebrow chip           | Obviously (display sans) | 0.625rem (~10px)                | —               | wide     | — (uppercase, `border: 1px solid` pill) |
| Byline                 | SuisseIntl (sans)        | ~0.75rem                        | —               | —        | uppercase                               |
| "Latest" list item     | sans                     | 1.25rem                         | 800 (extrabold) | -.01em   | 1.1                                     |
| "Latest" section label | Obviously                | 1.75rem                         | 800             | —        | 1.1                                     |

No type-on-image overlays — text always sits below the image. The wavy mask handles the "blend" instead.

### 1.5 Color & Texture
- Tokens: `--colorA #151515` near-black; `--colorC #ededed` off-white; `--colorE #d9d9d9` greige; `--colorG #e6ffb9` chartreuse hero accent; `--colorJ #f9ce60` mustard and `#a4b8ff` periwinkle for sibling cards.
- Hero body fills with `--colorG` chartreuse below the masked image. Backdrop is greige `--colorD`.
- Outer wrapper uses a **subtle vertical gradient on a tinted card**.
- Borders: `1px solid currentColor` for chips and list separators. Solid-on-tinted-bg, no opacity tricks.
- Texture: only the wavy SVG bottom mask + `blur(7px)` backdrop strip.

### 1.6 Spacing & Rhythm
- `--maxContainerWidth: 1440px`. `--pageGutter: 1.25rem` mobile / `2.5rem` desktop. `--halfGutter: 1.25rem` desktop = grid `column-gap` and `row-gap`.
- `--cardBorder: .625rem` mobile / `1.25rem` desktop.
- `--featureCardHeight: clamp(550px, calc(100vh - headerHeight), 1000px)` — hero is **viewport-height-clamped on first paint**.

### 1.7 Responsive Behavior
- ≥1024px: 6-col asymmetric two-row grid with the tall right rail.
- 768–1023px: drops to `1fr 1fr`. Right rail reflows below; secondaries become 2-up. Asymmetry sacrificed early.
- <768px: full linearization. Lead image stacks above headline; secondaries become single-column rows (image-left / headline-right inside their own 2-col mini-grid). Pill chips persist.

### 1.8 What's Worth Stealing (for The Hideaway)
1. **The asymmetric two-row, 6-col composition with a tall type-only rail.** Highest-leverage layout move. Translate: swap chartreuse card for `bg-card` with `border border-border/20`; keep `grid-cols-6` + `col-span-4` lead, `col-span-2 row-span-2` rail.
2. **Single rounded "card-of-cards" wrapper** with very small radii (5–10px). Already on-spec for CLAUDE.md.
3. **Type-only "Latest" rail as a peer to image cards.** `border-t border-border/30` rows, `font-medium tracking-tight text-base xl:text-lg`, `font-mono text-[10px] muted-foreground/60` for timestamps.
4. **Lead image silhouette dissolved into the card.** Skip the wavy SVG; use a 6–8% height `from-card` gradient overlay at the bottom of the hero image so it bleeds into the type block. One subtle move, big silhouette payoff.
5. **Eyebrow as a `border 1px` pill in display-wide font.** Already on-spec.

### 1.9 What to AVOID (from Inverse)
1. **Bold solid hero panel paint** (chartreuse, mustard, periwinkle) — Inverse uses color blocks as identity. The Hideaway is monochrome; replace with `bg-muted/20` and let typography carry weight.
2. **Display-wide condensed extrabold headlines.** Loud and tabloid. The Hideaway's `font-light tracking-tight` is the opposite mood — keep it.
3. **The wavy SVG bottom mask.** Witty for Inverse, decorative-out-of-tone for a "sparse, intentional, typographically confident" aesthetic. Use a flat hairline edge instead.

---

## 2. The Verge — Top Hero Deconstruction (DEEP)

> Source: live audit via WebFetch on `theverge.com`.

### 2.1 Hero Anatomy
**Single dominant lead + 4 stacked secondaries** to its right — the classic "featured well + rail" pattern. Slot count: **5** (1 lead + 4 secondaries). The hero ends where a second tier of equal-weight stories begins, flowing into a **"Most Popular"** numbered widget that acts as the visual rule separating curated hero from chronological mid-section. Below, a labeled **"Latest / Following"** tab divides curation from the chronological "quickposts" stream.

### 2.2 Slot Hierarchy

The **lead** is the only story with a **subtitle**. It carries a large image. The four secondaries are byline + headline
only, no subtitle, much smaller / no image. Within the secondaries one is differentiated by a **red "LIVE" pill**.
Otherwise peer. Hierarchy is enforced by:
- Image presence
- Subtitle presence
- Headline scale
- A single live-status chip — **not** by color or category badging.

### 2.3 Curation Signals (KEY)
Visible mix:

- **Lead:** long-form feature or explainer. Signaled by length, subtitle, and headline scale.
- **Slot 2:** live news event with `LIVE` badge and **plural byline**. Plural byline itself signals "ongoing coverage."
- **Slot 3:** review — declarative-superlative headline. No "Review" badge — grammar carries the type.
- **Slot 4:** first-person column — "It's time to let my iPhone Mini go." Voice signals column.
- **Slot 5:** scoop — "Here's what Microsoft is offering…" by a known beat reporter. **Author identity is the credibility signal.**

Story type is **rarely badged explicitly**. Type is encoded in:
1. **Headline grammar** (declarative-superlative → review; "It's time to…" → opinion; "Here's what…" → scoop).
2. **Author identity** (readers recognize beats).

### 2.4 Metadata Language
Per slot: byline + relative timestamp ("11:00 AM UTC", "An hour ago"). **No comment counts, no reaction counts, no "X reading now," no source attribution words** in the hero. Tags pushed to bottom of page. The hero is deliberately **clean of taxonomy noise.** Only chip in the hero: `LIVE`.

### 2.5 Visual Weight Distribution

Lead: large image (~16:9 or 4:5), headline + subtitle + byline below. Secondaries: text-dominant, image absent or
thumbnail-scale. **Image-to-text ratio collapses sharply between slot 1 and slots 2–5 — that ratio shift IS the
hierarchy.**

### 2.6 Copy

Do not use the reference site's headline style as a writing reference. Copy follows `readmes/VOICE.md`.

### 2.7 Layout Topology
Desktop: lead-left + secondary-rail-right, two-column. Tablet/mobile: clean stack inferred from markup order. The "Latest/Following" stream is a single-column river underneath, separated by "Most Popular" as a rule.

### 2.8 What's Worth Stealing (for The Hideaway)

1. **Subtitle as hierarchy, not a default.** Only the lead gets a subtitle. Secondaries are headline-only.
2. **Author identity as the badge.** Hideaway can lean into prominent author handles (`@username` is already routed) on featured essays.
3. **A single semantic chip type** rather than a colored taxonomy garden. Reserve one chip — e.g. a small `NEW` or `STAFF PICK` mark in mono — and let everything else be unbadged.
4. **Headline grammar encodes story type.** Editors adopt patterns instead of building a category-pill system.
5. **A numbered "Headliners" / "Most Popular" widget as the hero's terminator.** Strong visual rule that closes the curated zone before any chronological river. Five numbered rows in `font-mono`.

### 2.9 What NOT to Borrow
- The **timestamped quickpost stream** — pure newsroom cadence; would shred Hideaway's slow tempo.
- **Plural-byline live coverage** as a hero affordance — implies a news desk and breaking events.
- **Red `LIVE` pill** specifically — any saturated color shouts against monochrome discipline. If a status chip is needed, a thin outlined `font-mono` mark fits better.

---

## 3. The Atlantic — Top Hero Reference (LIGHT)

> ⚠️ **Caveat.** WebFetch on `theatlantic.com` failed during audit (likely paywalled / bot-blocked). Notes below are prior-knowledge synthesis. **Verify against live site before porting any specific class/value.**

### 3.1 Layout shape

Single dominant lead occupies the top zone, paired with a tight stack of 2–3 secondary headlines in a narrow right rail.
Lead pairs a large landscape image with a stacked headline-and-subtitle block beneath or beside it — not overlaid.

### 3.2 Type strategy

Custom serif display ("Atlantic Serif" / similar) for headlines; sans-serif for section labels, subtitles, and bylines.
Lead headline ~40–56px desktop, regular weight, with a smaller italic subtitle below in the same serif. Strong scale
contrast — secondary headlines drop to ~22–26px.

### 3.3 What's distinctive (worth borrowing eventually)

- All-caps sans-serif **section label** above the headline, tightly tracked, often colored or rule-separated.
- **Italic subtitle** in the same serif family, often two full lines.
- Byline + read-time as a single quiet line of small caps or sans, no avatar clutter.

### 3.4 What NOT to borrow
- Sponsored / native ad units jammed into the hero stack — disrupts editorial signal.
- Heavy red accents on section labels — would clash with the monochrome palette.

### 3.5 Note for future session

Use this visual hierarchy for the **Essays index / archive landing page** — section label → headline → italic subtitle →
byline. **Not** the main feed.

---

## 4. The New Yorker — Top Hero Reference (LIGHT)

> ⚠️ Same caveat as §3 — prior-knowledge synthesis. Verify before porting.

### 4.1 Layout shape
Asymmetric split: a single illustrated lead piece on the left (often a commissioned editorial illustration, not a photo), and a vertical column of 3–4 secondary article links on the right separated by hairline rules. Image is portrait or near-square, never full-bleed.

### 4.2 Type strategy
House serif drives almost everything (Neutraface-adjacent display + Caslon for body). Lead headline ~36–48px, **light/regular weight, never bold** — relies on size and air, not weight. Sans-serif used sparingly for category kickers and small-caps bylines.

### 4.3 What's distinctive (worth borrowing eventually)
- **Illustration over photography** for the lead — gives every hero a singular drawn voice no stock image can match.
- **Hairline horizontal rules** (1px, full opacity) separate every secondary headline in the side column — extremely magazine-coded.
- **Small-caps byline** treatment.
- Department label ("THE TALK OF THE TOWN", "ANNALS OF…") as tiny tracked caps above the headline.

### 4.4 What NOT to borrow
- The dense department-label vocabulary — only works with a century of editorial taxonomy.
- Print-replica column widths — feel cramped on modern viewports.

### 4.5 Note for future session
Steal when building a **single-essay or compilation landing page** that wants to feel like a "cover" — illustration + light-weight serif + tracked small-caps byline. Hairline-rule stacked secondary list also worth porting to Compilations index.

Representative tone: *"What We Lose When We Stop Reading Letters"*

---

## 5. Synthesis — The Hideaway's Top Hero

### 5.1 Inheritance map
| Source                    | What we inherit                                                                                                                                               |
|---------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Inverse**               | Grid topology (6-col asymmetric two-row + tall type-only rail), card-of-cards wrapper, small radii, image silhouette dissolution via gradient, category label |
| **Verge**                 | Subtitle hierarchy, author identity, single chip type, headline structure, numbered-list terminator                                                           |
| **Atlantic** *(future)*   | Italic-serif subtitle, all-caps section-label rhythm, small-caps byline — for archive / longread index                                                        |
| **New Yorker** *(future)* | Illustration-as-lead, hairline rules, light-weight headline at small sizes — for compilation / cover-style landings                                           |

### 5.2 Topology decision
Adopt Inverse's exact 6-col asymmetric two-row structure. The current `ArticleFrontpage` already attempts this (`lg:grid-cols-[repeat(6,1fr)]` + lead `lg:col-[1/5]` + secondaries `lg:col-[1/3]` and `lg:col-[3/5]` row 2 + rail `lg:col-[5/-1]`) — so this is **execution refinement, not topology overhaul**. The "rethink" lever pulls hardest on chrome, type, ratios, breakpoint behavior, and the Headliners rail design.

> **Design-system alignment note.** v2 — adjusted to comply with...(deleted; originally Design System) after a deeper read. Specifically:
> - All content cards use `rounded-sm` (4px). **`rounded-md` is forbidden** on cards (§6.2).
> - Category-label tracking is `tracking-[0.2em]`, not `tracking-widest`.
> - Forbidden weights: `font-semibold`, `font-bold`, `font-extrabold` (§4.2). Hideaway does not shout.
> - Banned text opacities: `/50`, `/80`, `/90`. Use `/70`, `/60`, `/40` (§3.3).
> - Edge gutters: `px-5 sm:px-6 xl:px-10` (§5.4). `px-5` at base is part of spec.
> - Motion: hovers run at `dur-fast` (150ms) `ease-standard`; no 500ms hovers. Hero-entrance moments use `ease-emphasized` (§9).
> - Note: `cssVariables.ts` defines `2xl: 1440` while DESIGN_SYSTEM.md §11.1 says `2xl: 1536`. Following Tailwind defaults (`2xl=1536`) since that's what `globals.css` `@theme` ships; treat 1440 as a legacy JS mirror until it's reconciled.

### 5.3 Slot specs

**Outer wrapper**
- `<section>` with `mx-auto max-w-7xl px-5 sm:px-6 xl:px-10` outer; inner card `bg-card border border-border/20 rounded-sm overflow-hidden` (one rounded chrome — the "card-of-cards").
- Internal grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-px bg-border/20` — `gap-px` + `bg-border/20` produces hairline dividers between slots without per-slot borders. Each slot gets `bg-card` to fill cells. (This is a hairline-divider-via-grid-gap trick: the parent's `bg-border/20` shows through 1px gaps.)

**Lead (slot 1)** — `lg:col-span-4 lg:row-span-1`
- Image: 16:9 (`aspect-video`), full width of slot, flush to slot edges. Bottom ~8% gradient `from-card via-card/0 to-transparent` overlay for silhouette dissolution. (Inverse's wavy-mask move, translated to monochrome.)
- Below image, padding `p-5 xl:p-6` (roomy-editorial card padding per §5.5):
  - **Eyebrow chip (category)**: `inline-block border border-border/40 rounded-xs px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60`. (`rounded-xs` = 2px per §6.1; chip is rectangular, not pill — pill `rounded-full` reserved for avatars/play controls per §6.2.)
  - **Headline**: `<h2>` with `font-serif font-light text-3xl sm:text-4xl md:text-5xl xl:text-6xl tracking-tight leading-[1.05] text-balance`. (Hideaway scale: `1rem=10px`, so `text-6xl`=60px, `text-3xl`=30px. Lands in Inverse's neighborhood.)
  - **Dek** (only on lead — Verge rule): `font-serif italic text-base sm:text-lg lg:text-xl text-foreground/70 leading-snug max-w-[60ch]`. (Atlantic flavor.)
  - **Byline**: `mt-3 font-mono text-[10px] xl:text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60` — `By {author} · {relative date}`.
- Whole slot wrapped in a single `<Link>` (overlay absolute, no nested links).

**Secondary A & B (slots 2 & 3)** — each `lg:col-span-2 lg:row-span-1` in row 2
- Mini-grid: image-left (`aspect-square`, ~120px desktop, flush to slot edge top + left) + type-right with `p-4 xl:p-5`.
- **Headline**: `font-medium text-base xl:text-lg tracking-tight leading-snug` (per §4.6 card-title snippet, slightly bumped — secondaries are still hero-zone, not generic grid cards).
- Category label + byline mono — **no subtitle**.
- Hover: image scales `1.02` at `duration-150 ease-[cubic-bezier(.4,0,.2,1)]`; surrounding type stays still.

**Headliners rail (slot 4)** — `lg:col-span-2 lg:row-span-2`
- Type-only. Header row: `font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 px-5 py-3 border-b border-border/30` showing **HEADLINERS**.
- 5 numbered items (Verge "Most Popular" rhythm), each row:
  - Mono number (`01`–`05`) at left, `font-mono text-[10px] text-muted-foreground/40`.
  - Title: `text-base xl:text-lg font-medium tracking-tight leading-snug text-balance`.
  - Byline + relative date below in `font-mono text-[10px] xl:text-[11px] text-muted-foreground/60`.
  - `border-t border-border/30` between items (none on first), `px-5 py-4`.
- Hover: title `text-foreground` (was `/70`), border `border-border/30 → border-border/50`. No fill swap.

### 5.4 Color & motion
- **Color** (Tier 2 only): `bg-card`, `border-border/20` (subtle card edges), `border-border/30` (dividers), `text-foreground/70` (secondary text), `text-muted-foreground/60` (metadata), `text-muted-foreground/40` (tertiary hints). **No accent fills, no Rouge** (Rouge is reserved for the one charged moment per surface; the hero is not it — §3.4).
- **Motion**:
  - Image hover: `transform scale(1.02) duration-[var(--dur-fast)] ease-[var(--ease-standard)]` (150ms, standard easing per §9.1/§9.2).
  - Border/text hover: same duration, `transition-[color,border-color]`.
  - **No entrance animation on first paint** (LCP discipline; the hero is the largest paint).
  - `prefers-reduced-motion`: collapse all transitions to `1ms` (§9.5).

### 5.5 Responsive ladder
Breakpoints sourced from [`src/cssVariables.ts`](../src/cssVariables.ts) / Tailwind v4 `@theme`. Note the `2xl=1440 vs 1536` drift mentioned above.

| Breakpoint | Width | Behavior |
|---|---|---|
| base | <640px | Full linearize. Lead full-width with image on top. Secondaries stack as full-width image-left/type-right rows. Headliners full-width below as a numbered list. Outer gutters `px-5`. |
| `sm` | 640px | Same as base. Outer gutters `px-6`. |
| `md` | 768px | Two-up secondaries (side-by-side); lead still full-width above. Headliners full-width below. |
| `lg` | 1024px | **Inverse 6-col asymmetric two-row composition activates.** Lead 4×1, secondaries 2×1 each in row 2, Headliners 2×2 right rail. |
| `xl` | 1280px | Same composition, larger type ladder, gutters `px-10`. |
| `2xl` | 1440px (per cssVariables.ts) | Container hits `max-w-7xl` cap (1280px); margins absorb extra width. No layout change. |
| `3xl` | 1920px | Same as 2xl. (4K editorial-only breakpoint.) |

### 5.6 Componentization
- Replace `HomeSquare` with `<FeaturedHero article={post} />` (lead-only, reusable in FOTD block too).
- New `<HeadlinersRail items={posts} />` extracted as a sibling component.
- `ArticleFrontpage` becomes the composition layer: outer chrome + grid + slotting.
- Update [`src/blocks/FOTD/index.tsx`](../src/blocks/FOTD/index.tsx) to use `<FeaturedHero>` directly (its layout is HomeSquare-only).

### 5.7 Reconciled answers (post two-agent review)

The harsh-critic / pragmatic-builder pass (2026-05-07) closed the open questions and surfaced one strategic concern. Decisions:

1. **Headline cap = `text-6xl xl:`. No `text-7xl` option.** (Builder F2 — ship now.)
2. **Dek = sans for v1.** `font-sans text-foreground/70 leading-snug max-w-[60ch]`. Italic-serif (Atlantic flavor) deferred until Narcissian Nectare italic is verified for Korean glyph coverage. (Builder F1.)
3. **Byline date format = relative** (`DateTime.fromISO(d).toRelative() ?? ""`). Lower visual weight, matches existing site idiom. Absolute-date format reserved for archive/longread surfaces (future).
4. **Headliners count = `posts.slice(3, 8).length`.** Variable; if `posts` has fewer than 8 entries, the rail shows fewer rows (1–5). If `posts.length < 4` (only lead + maybe secondaries available), **the rail collapses entirely** and the layout reflows: lead `lg:col-span-6` (full width), secondaries `lg:col-span-3` each in row 2. This is the slow-cadence escape hatch (Critic A1, B1).

### 5.8 Strategic defense — "is the chrome too loud for slow editorial cadence?"

The harsh critic flagged that adopting Inverse's information topology (8-slot featured well) into a slow-publishing editorial register manufactures editorial activity that doesn't exist. **Accepted in spirit, rejected in form.** Mitigations:

- §5.7-4 makes the rail dynamic — the hero degrades to lead-plus-secondaries when content is sparse.
- The chrome (`bg-card border border-border/20 rounded-sm`) is **the same chrome every other card on the site already uses** (DESIGN_SYSTEM.md §3.6). It is not Inverse-imported chrome; it's project-native chrome arranged in an Inverse-shaped grid. Atlantic/NY's "page-substrate openness" is a different aesthetic the project hasn't adopted elsewhere — adopting it only on the homepage hero would be louder than the bordered grid.
- The grid topology is upstream of *desktop* layout. On mobile (where most users land), every site linearizes; the topology question is moot.

### 5.9 Cuts and additions (post-review)

**Cut from v2:**

- Italic-serif subtitle → sans subtitle.
- `text-7xl` 2xl option → cap at `text-6xl`.
- Absolute-positioned circular rank badges in Headliners → inline `01 — Headline` mono prefix on all breakpoints (Builder F3).
- Per-slot multi-property hover transitions → single `group-hover:scale-[1.02]` on image + one `transition-colors` on the link (Builder F4).
- Cursor-theme-inversion logic in the lead → dropped. `FeaturedHero` becomes a **server component** (Builder B7 — saves client bundle, improves LCP).

**Added (Builder G):**
- `article.image === null` fallback path: `<PlaceHolderImage>` in lead + secondaries + Headliners.
- `article.author?.name ?? "Hideaway"` byline fallback.
- `posts.length < 1` → return null (don't render hero on empty data).
- `posts.length < 4` → render lead + secondaries only, drop rail (per §5.7-4).
- Lead image gets `loading="eager"` + `fetchPriority="high"`. **Secondary images get `loading="lazy"`** (current code wrongly sets `loading="eager"` on `posts[2]`; fix in same pass).
- Preserve outer `min-h-[85vh]` shell for CLS protection (Builder C).

**Resolved spec gaps:**
- Category chip: **build inline span**, not via `<RP_BadgeTag>` (which is non-compliant: pill radius, `font-medium` not mono). Class recipe: `inline-block rounded-sm border border-border/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60`.
- Bottom-8% gradient: sibling overlay div, not `:after`.
- `gap-px` + `bg-border/20` divider trick: Tailwind v4 supports natively. Hairlines collapse to row stripes on mobile — that's intentional (cleaner than per-card borders).
- `<h2>` for lead → **kept as `<span>`**. Page-level `<h1>` belongs to masthead/header upstream; using `<h2>` inside ArticleHero risks duplicate-h2 conflicts on pages that already have section headings. Use `<span>` with display typography (the same compromise we made on the previous HomeSquare iteration).

---

## 6. Future Work (out of scope this sprint)

Stored here so the next session inherits the trail.

### 6.1 Archive / paginated index pages
- Apply the **type-only-rail** pattern to archive index headers (Inverse-derived).
- Consider section label → headline → italic subtitle → small-caps byline for individual archive items.

### 6.2 Category / tag landing pages
- Each category gets its own "front page" that is a *quieter* version of the homepage hero (single column, no rail).
- The category name itself acts as the section label, promoted from chip to display scale.

### 6.3 Single-essay "cover" page (Compilations)
- New Yorker-style: illustration over photography where editorially appropriate.
- Hairline-rule stacked secondary list for related essays.

### 6.4 References to revisit (potential steals not yet harvested)
- The Verge's "Most Popular" widget micro-interactions (rank changes? hover states?).
- Inverse's `--featureCardHeight: clamp(550px, calc(100vh - h), 1000px)` viewport-clamped hero — nice for desktop, audit whether it works on shorter laptops.
- Atlantic's read-time micro-copy as a metadata standard.
- New Yorker's department-label vocabulary as a long-term taxonomy redesign target.

---

## 7. Implementation Plan (this sprint)

### 7.1 Files touched
- ✏️ Rewrite: [`src/components/layouts/ArticleFrontpage/index.tsx`](../src/components/layouts/ArticleFrontpage/index.tsx)
- ✏️ Rewrite: [`src/components/sections/HomeSquare/index.tsx`](../src/components/sections/HomeSquare/index.tsx) → becomes `<FeaturedHero>` (renamed conceptually; file path may stay or be replaced — TBD).
- ✏️ New (extracted from above): `src/components/sections/HeadlinersRail/index.tsx`
- ✏️ Update: [`src/blocks/FOTD/index.tsx`](../src/blocks/FOTD/index.tsx) — switch to new `<FeaturedHero>`.
- 📦 Snapshots already in `.attic/`.

### 7.2 Sequence
1. Build `<FeaturedHero>` standalone (lead slot only).
2. Build `<HeadlinersRail>`.
3. Rewrite `ArticleFrontpage` composition.
4. Update `FOTD` to use `FeaturedHero`.
5. Visual sanity check at 320 / 375 / 768 / 1024 / 1280 / 1536.
6. Drift check vs this doc.
7. Commit + push.

### 7.3 Done = passes
- All 6 breakpoints render without overflow.
- Lead headline never gets clipped by any container.
- Headliners rail collapses gracefully to a full-width list at `< lg`.
- No accent color introduced.
- Type ladder matches §5.3.
- `pnpm build` is green (or no-worse than current TYPE_DEBT count).
