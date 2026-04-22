# The Hideaway — Design System

> Canonical reference for design tokens, components, patterns, and aesthetic principles.
> When `globals.css`, `CLAUDE.md`, and this document disagree, **this document is the source of truth** for design decisions, and drift must be reconciled via the Audit doc (`readmes/DESIGN_SYSTEM_AUDIT.md`).
> Engineering ground-truth (what actually ships) lives in `src/styles/globals.css`.

**Status:** v1.0 — Complete. Foundations + structural tokens + component canon + pattern library + motion principles + iconography + microcopy voice + accessibility commitments + theming policy + reference criteria + how-to-use.

**Canonical authorship:** This document is the design system. It is revised, never rewritten. Additions land via a dated entry at the top of the relevant section; breaking changes land via a numbered amendment in the Changelog at the bottom. Treat it the way the codebase treats `payload-types.ts` — structured, owned, diffable.

---

## Table of Contents

1. [Manifesto](#1-manifesto)
2. [The Seven Disciplines](#2-the-seven-disciplines)
3. [Color](#3-color)
4. [Typography](#4-typography)
5. [Spacing](#5-spacing)
6. [Radius](#6-radius)
7. [Shadow & Elevation](#7-shadow--elevation)
8. [Blur](#8-blur)
9. [Motion tokens (duration & easing)](#9-motion-tokens-duration--easing)
10. [Z-index](#10-z-index)
11. [Breakpoints & Grid](#11-breakpoints--grid)
12. [Buttons](#12-buttons)
13. [Cards](#13-cards)
14. [Inputs & Forms](#14-inputs--forms)
15. [Typography primitives (React wrappers)](#15-typography-primitives-react-wrappers)
16. [Badges, Tags, Pills](#16-badges-tags-pills)
17. [Layout containers](#17-layout-containers)
18. [Sticky headers & page chrome](#18-sticky-headers--page-chrome)
19. [Heroes](#19-heroes)
20. [Grids & lists](#20-grids--lists)
21. [Empty, loading & error states](#21-empty-loading--error-states)
22. [Modals, sheets & popovers](#22-modals-sheets--popovers)
23. [Command palette (CMDK)](#23-command-palette-cmdk)
24. [Navigation](#24-navigation)
25. [Motion principles](#25-motion-principles)
26. [Iconography](#26-iconography)
27. [Microcopy & voice](#27-microcopy--voice)
28. [Accessibility commitments](#28-accessibility-commitments)
29. [Theming — light & dark](#29-theming--light--dark)
30. [Reference criteria & curated library](#30-reference-criteria--curated-library)
31. [How to use this document](#31-how-to-use-this-document)
32. [Appendix: File Map](#32-appendix-file-map)
33. [Changelog](#33-changelog)

---

## 1. Manifesto

The Hideaway is an **editorial platform with the quiet confidence of a private library**.
It is not a feed. It is not a dashboard. It is a room someone built.

### Aesthetic pillars

| Pillar | What it means | What it rules out |
|---|---|---|
| **Editorial, not productized** | Surfaces read like a magazine, not a SaaS dashboard. Whitespace is generous. Hierarchy is typographic, not chromatic. | Generic card grids, "dashboardy" KPIs, filled-chip density. |
| **Typographic-first** | Type is the primary design element. Color and ornament are consequences. A page with nothing but text should still feel designed. | Decorative iconography filling the role of hierarchy. Emoji as meaning. |
| **Monochrome with one charge** | Foreground + background, modulated by opacity. The brand's single saturated moment is **Rouge** (piercing orange), used sparingly for selection, emphasis, and critical accents. | Multi-color palettes. Gradient-first visual logic. Brand color decoration. |
| **Opacity as tone** | There are no gray tokens. Tonal steps are `/70`, `/60`, `/40`, `/30`, `/20`. This keeps theme switches coherent and prevents palette drift. | Inventing new grays, using Tailwind's default `text-gray-500`, etc. |
| **Quiet interaction** | Hovers are border/opacity shifts, not fill swaps. Motion clarifies, it doesn't announce. Buttons are bordered, not solid. | Filled CTAs in primary brand color, loud hover glows, bouncy microinteractions. |
| **Discovered, not advertised** | Features feel stumbled-upon: the cassette deck, the tour, the command palette. Labels are monospaced; nothing yells. | Modal tutorials, confetti, toast explosions. |
| **Bilingual by design** | English and Korean coexist. Type scale, line heights, and monospace labels must tolerate both. | Latin-only spacing assumptions. Hardcoded letter-spacing that breaks Hangul. |

### What Hideaway is NOT

- A Medium clone. (Medium is generous; Hideaway is *deliberate*.)
- A Substack. (Substack is a newsletter funnel; Hideaway is a room.)
- A brutalist or neo-brutalist site. (No intentional ugliness, no clashing colors, no chunky borders.)
- A luxury "dark UI" product dashboard. (Dark mode is an alternate key, not the default tone.)
- A design-portfolio site. (No scroll-jacked showcases. Content is the show.)

### The single sentence

> **Hideaway is a room someone built: text is the interface, silence is the default, and every deliberate touch of color means something.**

### Promises we keep

These are the commitments this system makes to every page we ship. If a screen violates one, it fails review — regardless of how beautiful it is.

1. **Type earns hierarchy before color does.** A grayscale screenshot of the page should still read clearly.
2. **The accent is never decorative.** If rouge appears, it is carrying meaning (selection, status, emphasis) — never styling.
3. **Motion tells the truth.** Every transition reflects a spatial or state fact, and every animation survives `prefers-reduced-motion`.
4. **The chrome is quiet.** Borders over fills, opacity over grays, typography over ornament. Nothing yells.
5. **The reader wins ties.** When design pressure conflicts with reading experience — density, contrast, line length — reading wins.
6. **Both languages are first-class.** Korean and English are designed together, not translated from English.
7. **Dark is the default, and light is not an afterthought.** Both themes are designed objects.
8. **Accessibility is load-bearing.** Keyboard, screen reader, reduced motion, and forced colors are not extras; they are the system.

### The shape of the document

The rest of this document is arranged from **atomic tokens** → **components** → **patterns** → **principles** → **criteria**. Read top to bottom to onboard; jump by section thereafter. Every section ends with a banned-patterns list so drift is as explicit as the canon.

---

## 2. The Seven Disciplines

Practical rules agents and designers can apply without re-reading the manifesto each time.

1. **Type before color.** If a screen needs hierarchy, reach for scale, weight, and spacing before you reach for a palette swatch.
2. **Opacity over grays.** Tonal steps come from opacity on `foreground` / `muted-foreground` / `border`. Never introduce a new gray.
3. **Border over fill.** Buttons, inputs, and chips use borders. Filled surfaces are reserved for image cards, image placeholders, and the single primary CTA per view (and even then, prefer border + strong text).
4. **Monospace is a label, never a paragraph.** Mono is for UI chrome — nav items, eyebrows, metadata, counts, badges. Never for body copy.
5. **Motion is subtraction.** Prefer opacity and small y-shifts. Avoid scale > 1.04, rotation, and bounce > 0.2. Every animation must survive `prefers-reduced-motion`.
6. **One accent, one surface, one division.** On any given screen, a designer should be able to point at exactly one color accent, one card surface treatment, and one divider weight. More than one is drift.
7. **Density is earned.** Default to whitespace. Density is acceptable only inside explicitly "dense" surfaces (admin tables, compilation item grids for patrons, radio track lists).

---

## 3. Color

Hideaway's color system is built on **OKLCH** for perceptual uniformity across light and dark themes. All production color tokens live in [`src/styles/globals.css`](../src/styles/globals.css) under `@theme`.

### 3.1 Token taxonomy

There are **four tiers** of color tokens. Use the narrowest tier available.

```
 ─── Tier 1: Raw palette ─────────────────────────
│   --gray-1 … --gray-12      (HSL, 12 steps)     │
│   --rouge-50 … --rouge-950  (OKLCH, 11 steps)   │
│   --bleu-50 … --bleu-950    (OKLCH, 11 steps)   │
│   --piercing-orange, --rosso-corsa, etc.        │
 ─── Tier 2: Semantic theme tokens ───────────────
│   --background, --foreground                     │
│   --card, --card-foreground                      │
│   --popover, --popover-foreground                │
│   --muted, --muted-foreground                    │
│   --accent, --accent-foreground                  │
│   --border, --input, --ring                      │
 ─── Tier 3: Tonal aliases ───────────────────────
│   --faded-fg, --faded-bg                         │
│   --muted-fg, --muted-bg                         │
│   --off-fg,   --off-bg                           │
│   --opaque-fg,--opaque-bg                        │
 ─── Tier 4: Gradients & specialty ───────────────
│   --gradient-rosso-to-peach, etc.                │
│   --piercing-orange, --soft-peach, --melon       │
 ──────────────────────────────────────────────────
```

**Rule of thumb:**
- **Page surfaces, text, borders** → Tier 2 semantic tokens only (`bg-background`, `text-foreground`, `border-border`).
- **Tonal modulation** → Tier 2 + opacity (`text-foreground/70`, `border-border/30`).
- **Tier 3 aliases** → Use for contextual surfaces where the intent is "the faded version" (e.g., disabled state, nested muted surface).
- **Tier 1 raw palette** → Only inside token definitions, theme overrides, and the one charged accent.
- **Tier 4 gradients** → Marketing surfaces, heroes, auth screens. Never inside content grids.

### 3.2 Core semantic tokens

| Token | Light | Dark | Typical use |
|---|---|---|---|
| `--background` | near-white | near-black | Page surface |
| `--foreground` | near-black | near-white | Body text |
| `--card` | white | slightly-lifted black | Card surface |
| `--muted` | gray-1 | gray-11 | Disabled / inactive surfaces |
| `--muted-foreground` | gray-9 | gray-5 | Secondary text, metadata |
| `--border` | gray-3 | gray-10 | Card edge, divider |
| `--accent` | rouge-400 | rouge-500 | Selection, critical UI accent |
| `--ring` | rouge-400 | rouge-500 | Focus outline |

### 3.3 Tonal opacity scale (Required)

Use these opacity stops. Do not invent new ones.

| Stop | Role | Example |
|---|---|---|
| `/100` | Primary text, icons at full emphasis | `text-foreground` |
| `/70` | Secondary text, standard body-on-surface | `text-foreground/70` |
| `/60` | Metadata, captions, subdued labels | `text-muted-foreground/60` |
| `/40` | Tertiary hints, placeholder-adjacent | `text-muted-foreground/40` |
| `/30` | Dividers, standard borders | `border-border/30` |
| `/20` | Subtle card edges, backdrop strokes | `border-border/20` |
| `/10` | Ghost surfaces, near-invisible structure | `bg-foreground/10` |

**Banned:** `/50`, `/80`, `/90` on text. (Use `/70` or `/60` instead of `/50`; use `/100` or `/70` instead of `/80`; use `/100` instead of `/90`.)

### 3.4 The one charged accent — Rouge

The brand's only high-saturation color is **Rouge** (`--rouge-*`, also surfaced as `--piercing-orange`).

**Rouge is permitted for:**
- Text selection (`::selection` at 85% opacity)
- Focus rings (`--ring`)
- The one primary destructive / critical CTA per screen (e.g., "Delete account")
- A single editorial emphasis moment per long-form essay (pullquote bar, section marker)
- The Radio "recording" light
- Logo accents

**Rouge is NOT permitted for:**
- Links (links are underlined foreground)
- Primary buttons (buttons are bordered)
- Hover states (hovers shift border/opacity)
- Active tab indicators (use `layoutId` underline in foreground)
- Notifications, badges, chips (these use foreground/opacity)

### 3.5 Supporting accents (rare)

Bleu, soft-peach, creamy-white, piercing-green, melon, and the gradient family are **editorial assets**, not UI tokens. Permitted contexts:

- Hero backgrounds on marketing/auth pages
- Plan/tier visuals in `/plans`
- Radio cassette artwork and album fallback gradients
- Series cover fallbacks

They never appear inside content cards, forms, or dashboards.

### 3.6 Examples

```tsx
// ✅ Correct
<p className="text-foreground/70">Body copy.</p>
<p className="font-mono text-[11px] text-muted-foreground/60">Metadata.</p>
<button className="border border-border/40 hover:border-border">Save</button>
<div className="bg-card border border-border/20">Card surface.</div>

// ❌ Wrong
<p className="text-gray-500">Body copy.</p>               // raw Tailwind gray
<p className="text-foreground/50">Body copy.</p>          // banned /50 on text
<button className="bg-primary text-primary-foreground">   // filled CTA
<div className="bg-muted/40 border-2 border-accent">      // mystery surface + brand border
```

---

## 4. Typography

Typography is the primary design language. The system uses **five production typefaces**, a **10-step modular scale** (to be corrected — see Audit §4.1), and **strict weight discipline** (`font-light` for display, `font-medium` for card titles, `font-normal` for body, `font-mono` for labels).

### 4.1 Typefaces

| Role | Family | CSS var | When to use |
|---|---|---|---|
| Sans / UI | **SUIT** | `--font-sans` | Default sans; Korean-friendly; body UI |
| Mono / Labels | **Geist Mono** | `--font-mono` | All UI chrome labels, metadata, counts, eyebrows, monospaced numbers |
| Serif / Editorial | **Narcissian Nectare** | `--font-serif` | Long-form essay body, large display headings, pullquotes |
| Display / Tech | **Dots** | `--font-dots` | Rare — admin console moments, terminal-coded surfaces |
| Display / Decorative | **Siegfried** | `--font-siegfried` | Rare — nameplate moments (logo treatments, masthead-only) |

**Removed from production palette:**
- **Blase** and **Saint** are loaded but never referenced. Audit marks them for removal (see Audit §4.2).

### 4.2 Weight discipline

Only these weights ship:

| Weight | Use | Never use for |
|---|---|---|
| `font-light` (300) | Display headings, hero, page H1/H2 | Body copy, buttons |
| `font-normal` (400) | Body text, card descriptions, prose | Display |
| `font-medium` (500) | Card titles, UI button labels (when justified) | Long-form body |
| `font-mono` (weight inherited, typically 400) | All monospace chrome | Prose |

**Forbidden:** `font-semibold` (600), `font-bold` (700), `font-extrabold` (800), `font-black` (900). Hideaway does not shout.

### 4.3 Canonical scale

Base: `html { font-size: 62.5% }` → `1rem = 10px` (editorial convention).

> ⚠️ **The `@theme` scale in `globals.css` currently has three bugs** (duplicates + inversion). The **canonical scale below is what Hideaway should ship.** Audit §4.1 lists the specific fixes.

| Token | rem | px | Role |
|---|---|---|---|
| `--text-xs` | `1.0rem` | 10 | Micro labels, badges |
| `--text-sm` | `1.2rem` | 12 | Secondary UI, mono metadata |
| `--text-base` | `1.4rem` | 14 | Standard UI, card descriptions |
| `--text-md` | `1.6rem` | 16 | Body copy (default prose) |
| `--text-lg` | `1.8rem` | 18 | Emphasized body, intro paragraphs |
| `--text-xl` | `2.0rem` | 20 | Small section headings |
| `--text-2xl` | `2.4rem` | 24 | Section headings |
| `--text-3xl` | `3.0rem` | 30 | Sub-hero headings |
| `--text-4xl` | `3.6rem` | 36 | Page headings |
| `--text-5xl` | `4.8rem` | 48 | Page heroes |
| `--text-6xl` | `6.0rem` | 60 | Landing hero |
| `--text-7xl` | `7.2rem` | 72 | Marketing showpiece (rare) |

### 4.4 Semantic aliases

For prose / CMS-driven surfaces, use the semantic layer rather than scale tokens directly:

| Alias | Maps to | Use |
|---|---|---|
| `--text-body` | `--text-md` (16px) | Default reading text |
| `--text-small` | `--text-sm` (12px) | Caption, footer text |
| `--text-h1` | `--text-5xl` | Page H1 |
| `--text-h2` | `--text-4xl` | Section H2 |
| `--text-h3` | `--text-3xl` | Subsection H3 |
| `--text-h4` | `--text-2xl` | Minor heading |
| `--text-h5` | `--text-xl` | Label heading |
| `--text-h6` | `--text-lg` | Eyebrow heading |

### 4.5 Line height & tracking

| Context | line-height | tracking | Weight |
|---|---|---|---|
| Display (hero, H1) | `1.05` | `tracking-tight` (-0.02em) | `font-light` |
| Section heading (H2/H3) | `1.15` | `tracking-tight` | `font-light` |
| Body prose | `1.65` | `tracking-normal` (0) | `font-normal` |
| Card title | `1.3` | `tracking-tight` | `font-medium` |
| Mono label | `1` | `tracking-widest` (0.1em) or `[0.2em]` on eyebrows | inherited |
| Button / form mono | `1` | `tracking-widest` | inherited |

### 4.6 Canonical usage snippets

```tsx
// Page hero
<h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl font-light tracking-tight">
  Hideaway Seoul
</h1>

// Section heading
<h2 className="text-2xl xl:text-3xl font-light tracking-tight">
  Recent essays
</h2>

// Eyebrow / category label
<span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
  Essay · 12 min read
</span>

// Primary nav label
<span className="font-mono text-[11px] uppercase tracking-widest xl:text-xs">
  Radio
</span>

// Card title
<h3 className="text-sm font-medium leading-snug tracking-tight xl:text-base">
  On the grammar of rooms
</h3>

// Card subtitle / metadata
<p className="font-mono text-[10px] xl:text-[11px] text-muted-foreground/60">
  Sean Choi — Mar 14
</p>

// Prose body (long-form)
<p className="font-serif text-[1.8rem] leading-[1.65] text-foreground/90">
  The first time I walked into …
</p>

// Micro badge
<span className="font-mono text-[9px] uppercase tracking-widest xl:text-[10px]">
  Patron
</span>
```

### 4.7 Font-loading strategy

- `next/font` with `display: 'swap'` for all families.
- **Preload only** `--font-sans` (SUIT) and `--font-mono` (Geist Mono). Serif and display families lazy-load.
- Subset SUIT to Latin + Hangul. Subset Geist Mono to Latin + numerics + common symbols.
- **Budget:** No more than **120KB gzipped** of font payload above the fold on any non-essay route.

### 4.8 Bilingual discipline

- Every mono label must be legible in both Latin and Hangul at the target size. Test all `text-[10px]` and `text-[9px]` labels in Korean.
- Avoid hardcoded `letter-spacing` > `0.1em` on Hangul — it breaks syllable cohesion. Use `tracking-widest` only on Latin-first UI; Hangul mono uses `tracking-wide` or `tracking-normal`.
- Line heights in Korean prose need +0.1 vs Latin. Long-form serif prose uses `leading-[1.7]` when the locale is `ko`.

---

## 5. Spacing

Spacing is Hideaway's silent typography. It is more important than any decorative element. The scale is **4-based, rem-normalized** (1rem = 10px), and every spacing decision must resolve to a token.

### 5.1 Scale

| Token | rem | px | Role |
|---|---|---|---|
| `--space-0` | `0` | 0 | — |
| `--space-1` | `0.4rem` | 4 | Icon gutters, inline badge padding |
| `--space-2` | `0.8rem` | 8 | Tight inline spacing (tag + text) |
| `--space-3` | `1.2rem` | 12 | Form row internal, list item internal |
| `--space-4` | `1.6rem` | 16 | Card body padding (mobile), default gap |
| `--space-5` | `2.4rem` | 24 | Card body padding (desktop), section gap (mobile) |
| `--space-6` | `3.2rem` | 32 | Section gap (desktop), hero internal |
| `--space-7` | `4.8rem` | 48 | Page section rhythm (mobile) |
| `--space-8` | `6.4rem` | 64 | Page section rhythm (desktop) |
| `--space-9` | `9.6rem` | 96 | Hero + footer breathing room |
| `--space-10` | `12.8rem` | 128 | Marketing/landing breathing only |

Tailwind utilities (`p-1`, `gap-4`, `py-7`, etc.) already map to this scale when `1rem = 10px`, so authors continue to use standard utilities.

### 5.2 Reading rhythm (prose-specific)

Long-form prose uses a dedicated rhythm independent of the UI scale. Every paragraph break is a function of **line-height × stanza multiplier**.

```
Base line-height for serif body:  1.65
Paragraph break:                  0.8em below  (≈13px at 16px prose)
Stanza / new-scene break:         2.4em below  (≈38px at 16px prose)
Section heading (H2) top:         4.8em        (≈77px at 16px prose)
```

Hardcoded `mb-4` in prose surfaces is banned — use the `<Prose />` primitive (Iter 3) or the `prose.scss` stylesheet (Iter 4).

### 5.3 Gap discipline

| Context | Gap | Mobile → Desktop |
|---|---|---|
| Default content grid | `gap-4 xl:gap-5` | 16 → 24 |
| Editorial card grid | `gap-5 xl:gap-6` | 24 → 32 |
| Dense grid (radio tracks, admin tables) | `gap-2 xl:gap-3` | 8 → 12 |
| Section rhythm (vertical) | `py-7 xl:py-8` | 48 → 64 |
| Hero rhythm (vertical) | `py-8 xl:py-9` | 64 → 96 |

### 5.4 Edge padding (container gutters)

| Viewport | Gutter |
|---|---|
| `< 640px` (sm) | `px-5` (20px) |
| `640–1279px` | `px-6` (24px) |
| `≥ 1280px` (xl) | `px-10` (40px) |

Applied through the `<Container />` primitive (Iter 3). Never reimplement inline.

### 5.5 Padding discipline

- Buttons: `px-5 py-2.5` (standard), `px-4 py-2` (compact), `px-6 py-3` (hero)
- Cards: `p-3.5 xl:p-4` (default body), `p-5 xl:p-6` (roomy/editorial), `p-2 xl:p-2.5` (dense)
- Inputs: `pb-2` (borderless bottom-border inputs), no horizontal padding unless the input has a leading icon
- Dialogs: `p-6 md:p-8`
- Sheets: `p-6 md:p-8`

### 5.6 Forbidden

- `px-7` / `py-7` outside the reading-rhythm context — breaks 4-based cadence at small sizes.
- Any fractional non-standard value (`px-[17px]`, `gap-[22px]`) in app code.

---

## 6. Radius

Radius in Hideaway is **small, deliberate, and nearly imperceptible**. The brand is editorial, not friendly — pillowy buttons are forbidden.

### 6.1 Scale

| Token | value | px | Role |
|---|---|---|---|
| `--radius-none` | `0` | 0 | Hairline dividers, flush typographic blocks |
| `--radius-xs` | `0.2rem` | 2 | Inline chips, tag pills |
| `--radius-sm` | `0.4rem` | 4 | **Default: cards, images, buttons, inputs** |
| `--radius-md` | `0.6rem` | 6 | Dialog / popover surfaces |
| `--radius-lg` | `0.8rem` | 8 | Sheet / drawer surfaces |
| `--radius-xl` | `1.2rem` | 12 | Hero image wells (rare) |
| `--radius-full` | `9999px` | — | Avatars, fully round badges, play button |

### 6.2 Rules

- **All content cards use `--radius-sm`.** Never `rounded-md`, never `rounded-xl`.
- **Buttons use `--radius-sm`.** Never `rounded-full` unless it is an icon-only play/control button.
- **Images inside cards use the card's radius.** Nested radii feel soft; a card with sharp edges must contain a sharp-edged image.
- **Avatars are `rounded-full`.** No other element on the page is allowed `rounded-full` unless it is a play control or the Radio "rec" light.

---

## 7. Shadow & Elevation

Hideaway uses **almost no shadow**. Elevation is expressed by borders, stacking, and — in rare cases — a single diffuse shadow.

### 7.1 Scale

| Token | value | Role |
|---|---|---|
| `--shadow-none` | none | Default card, default button |
| `--shadow-edge` | `0 0 0 1px var(--border)` | Inline "focused" surface (search, open menu trigger) — prefer border utility |
| `--shadow-sm` | `0 1px 2px oklch(0% 0 0 / 0.06)` | Dropdown, popover, dialog (light theme only) |
| `--shadow-md` | `0 4px 14px oklch(0% 0 0 / 0.08)` | Sheet, drawer, toast (light theme only) |
| `--shadow-lg` | `0 18px 48px oklch(0% 0 0 / 0.18)` | Hero media lift (editorial moments only) |
| `--shadow-inner` | `inset 0 1px 0 oklch(100% 0 0 / 0.02)` | Inset lift on dark card surfaces |

### 7.2 Dark theme policy

In dark theme, `--shadow-sm` and `--shadow-md` drop to **zero** and elevation shifts to a subtle **border brightness step**:

```css
.dark { --shadow-sm: none; --shadow-md: none; }
.dark .elevated { border-color: oklch(100% 0 0 / 0.08); }
```

Shadows on dark backgrounds look muddy; we prefer a brighter hairline instead.

### 7.3 Forbidden

- Multi-layer stacked shadows (Material-style `0 1px 2px ..., 0 4px 6px ..., ...`)
- Colored shadows (`shadow-rouge-500/40`)
- `shadow-xl` / `shadow-2xl` anywhere
- Shadows on cards inside a grid (they compete with the grid rhythm)

---

## 8. Blur

Blur is used sparingly — only on **sticky headers**, **dialog scrims**, and **cassette/radio artwork overlays**.

| Token | value | Role |
|---|---|---|
| `--blur-sm` | `4px` | Sticky footer, secondary sticky |
| `--blur-md` | `8px` | **Default: sticky header, popover backdrop** |
| `--blur-lg` | `16px` | Dialog scrim, sheet scrim |
| `--blur-xl` | `24px` | Radio/album artwork overlay, hero wash |

### 8.1 Rules

- Always pair blur with background opacity. Example: `bg-background/90 backdrop-blur-md`.
- Never use `backdrop-blur-[…]` arbitrary values in app code.
- Safari fallback: for surfaces that depend on blur for legibility, raise background opacity to `/95` so the surface works on browsers without `backdrop-filter`.

---

## 9. Motion tokens (duration & easing)

Motion is a first-class token category. Durations and easings are finite, named, and reused.

### 9.1 Duration scale

| Token | value | Role |
|---|---|---|
| `--dur-instant` | `100ms` | Tooltip reveal, cursor state, near-invisible feedback |
| `--dur-fast` | `150ms` | **Default: hover, focus, small color/border shifts** |
| `--dur-base` | `220ms` | Tab change, popover open, page transition |
| `--dur-slow` | `350ms` | Dialog, sheet, drawer |
| `--dur-crawl` | `500ms` | Hero reveal, card entrance, masthead intro |
| `--dur-epic` | `800ms` | Marketing/landing only (scrollytelling beats) |

### 9.2 Easing scale

Reduced from thirteen ad-hoc curves to **five canonical easings**:

| Token | value | Role |
|---|---|---|
| `--ease-linear` | `linear` | Progress bars, audio scrubber |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | **Default — 90% of interactions** |
| `--ease-decelerate` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances (appear, slide-in, grow-in) |
| `--ease-accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | Exits (disappear, slide-out) |
| `--ease-emphasized` | `cubic-bezier(0.2, 0, 0, 1)` | Editorial moments (hero, masthead reveals) |

Legacy tokens (`--ease-power2`, `--ease-Sine`, `--ease-in-out-2`, etc.) are kept as aliases for one release, then removed. See Audit F-002.

### 9.3 Choosing a duration

```
UI feedback (hover, focus) ──────────── dur-fast    (150)
Content transitions (tabs, route) ───── dur-base    (220)
Overlays (popover, dropdown) ────────── dur-base    (220)
Dialogs (modal, sheet) ──────────────── dur-slow    (350)
Card / hero entrances ───────────────── dur-crawl   (500)
Marketing reveals ───────────────────── dur-epic    (800)
```

If a transition feels slow at `dur-fast`, the problem is usually the easing, not the duration. Try `ease-decelerate` before `dur-base`.

### 9.4 Choosing an easing

| You are animating… | Use |
|---|---|
| A button hover | `ease-standard` |
| A modal opening | `ease-decelerate` |
| A modal closing | `ease-accelerate` |
| A card entering on scroll | `ease-decelerate` |
| A hero headline revealing | `ease-emphasized` |
| A progress bar | `ease-linear` |

### 9.5 Motion-sensitive requirements

- All tokens except `ease-linear` respect `prefers-reduced-motion: reduce` and collapse to `1ms` duration.
- Spring-based animations (Motion `type: "spring"`) specify `bounce` between `0.05` and `0.2`. Values above `0.2` are forbidden.
- No animation exceeds `dur-epic` (800ms) without an explicit design review.

### 9.6 Tokens exported to JS

Iter 2 also generates `src/styles/tokens.ts` from `globals.css` at build-time so JS motion code can reference `tokens.duration.base`, `tokens.easing.standard` instead of hardcoding the values. See Audit F-050.

---

## 10. Z-index

A numeric z-index is a failure of stacking architecture. The scale below defines the only layers that exist.

### 10.1 Scale

| Layer | range | Token | Example |
|---|---|---|---|
| Below content | `-10 … -1` | `--z-background` (`-1`) | Decorative bg elements, grain |
| Base | `0` | `--z-base` | Default flow content |
| Raised | `1 … 9` | `--z-raised` (`5`) | Card hover lift, focused input |
| Sticky UI | `10 … 19` | `--z-sticky` (`15`) | Sticky header, sticky sidebar |
| Overlays | `20 … 29` | `--z-overlay` (`25`) | Dropdown, popover, tooltip |
| Dialogs | `30 … 39` | `--z-dialog` (`35`) | Modal, sheet, drawer |
| Toasts | `40 … 49` | `--z-toast` (`45`) | Notifications, ephemeral banners |
| System | `50 … 59` | `--z-system` (`55`) | Command palette, custom cursor |
| Debug | `100 +` | — | Dev overlays only |

### 10.2 Rules

- Only use the **named tokens** in app code. Numeric literals are reserved for intra-layer micro-ordering (e.g. `z-[16]` for a sticky sub-nav under a sticky header at 15).
- Nothing in `app/(frontend)/` ships with `z-index > 55`.
- The custom cursor is the system's highest allowed layer (`--z-system`). Nothing renders above it.

---

## 11. Breakpoints & Grid

Mobile-first. Every grid and spacing value must include an `xl:` variant (CLAUDE.md).

### 11.1 Breakpoints

| Token | min-width | Context |
|---|---|---|
| `sm` | `640px` | Large phone, small tablet |
| `md` | `768px` | Tablet |
| `lg` | `1024px` | Small laptop |
| `xl` | `1280px` | MacBook 13–14" (most users) |
| `2xl` | `1536px` | MacBook Pro 16", external monitors |
| `3xl` | `1920px` | 4K / ultrawide — rare, editorial only |

### 11.2 Container

| Container | max-w | Use |
|---|---|---|
| Wide | `max-w-7xl` (1280px) | **Default** — every page layout |
| Narrow | `max-w-2xl` (672px) | Prose, forms, auth, settings rows |
| Reading | `max-w-[68ch]` | Long-form essay body |
| Full-bleed | `w-full` | Heroes, banners, decorative sections |

**Never use `max-w-5xl` or `max-w-6xl`** — they produce awkward gutters between ~1100px and ~1400px.

### 11.3 Canonical grid column counts

| Content | sm | md | lg | xl | 2xl |
|---|---|---|---|---|---|
| Editorial cards (posts, surf) | 1 | 2 | 3 | 4 | 4 |
| Square tiles (albums, playlists) | 2 | 3 | 4 | 5 | 6 |
| Premium compilation (4:3) | 1 | 2 | 3 | 4 | 4 |
| Free compilation (16:9) | 1 | 2 | 3 | 3 | 4 |
| Dense detail (patron) | 2 | 3 | 4 | 5 | 6 |
| Dashboard rows | 1 | 1 | 2 | 2 | 3 |

### 11.4 Responsive discipline

- Every grid must declare behavior at **every** breakpoint up to `2xl`. Stopping at `lg:` leaves MacBook Pro 16" users with cavernous whitespace.
- Never shrink a column count going up. (`sm:grid-cols-3 md:grid-cols-2` is a bug.)
- Test every screen at 320, 375, 768, 1024, 1280, 1536, 1920.

---

## 12. Buttons

The button is Hideaway's loudest primitive. Keep it quiet.

### 12.1 Philosophy

- **Border over fill.** Primary action reads as `outline` — a bordered rectangle with text. Filled buttons are for destructive confirmation only.
- **Type is the label, not decoration.** Labels are monospace (`--font-mono`), uppercase, tracked. Sentence-case labels exist only for link variants inside prose.
- **One charge per surface.** A screen has at most one `accent` button (Rouge). If a screen has two primary buttons, one of them is wrong.
- **State through opacity and border-weight, not color swap.** Hover does not repaint the button.

### 12.2 Canonical variants

| Variant | Role | Class recipe |
|---|---|---|
| `primary` (default) | The single most important action on the surface | `border border-border/50 text-foreground/90 hover:border-foreground/70 hover:text-foreground` |
| `ghost` | Recessive action that still reads as a button | `border border-transparent text-foreground/70 hover:border-border/30 hover:text-foreground` |
| `link` | Inline textual action inside prose or dense UI | `underline decoration-border/40 underline-offset-4 hover:decoration-foreground/70` |
| `accent` | The single rouge moment per surface — reserve for conversions | `border border-rouge/60 text-rouge hover:border-rouge hover:text-rouge` |
| `destructive` | Irreversible action. **Only** variant permitted to use fill. | `bg-destructive text-destructive-foreground hover:bg-destructive/85` |
| `icon` | Square button wrapping a single icon — never labelled with text | Same as `ghost` plus square sizing |

All non-destructive variants share:
```
rounded-[var(--radius-sm)]
font-mono text-[var(--text-xs)] uppercase tracking-[0.12em]
transition-[color,border-color,opacity] duration-[var(--duration-base)] ease-[var(--ease-standard)]
disabled:opacity-40 disabled:pointer-events-none
focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40
```

### 12.3 Size scale

Buttons use the **spacing scale** for padding, not arbitrary Tailwind heights.

| Size | Height | Padding-x | Icon gap | Use |
|---|---|---|---|---|
| `xs` | 2.8rem (28px) | `--space-3` (12px) | `--space-2` (8px) | Dense rows, chip-like actions |
| `sm` | 3.6rem (36px) | `--space-4` (16px) | `--space-2` | Card footers, inline controls |
| `md` *(default)* | 4.4rem (44px) | `--space-5` (20px) | `--space-3` (12px) | Page actions, form submits |
| `lg` | 5.2rem (52px) | `--space-6` (24px) | `--space-3` | Hero CTAs, empty-state primary |

- Heights are deliberately anchored to multiples of **4px** aligned to the spacing scale. Do not invent heights like `h-13` or `h-14.5`.
- `h-11/12/13/14.5/16` all appear in the current button component (see Audit F-030) — these must be normalised to the table above.
- Icon-only sizes: `icon-xs` = 2.8rem square, `icon-sm` = 3.6rem, `icon-md` = 4.4rem, `icon-lg` = 5.2rem.

### 12.4 Anatomy

```
┌──────────────────────────────────┐
│ [icon?]  LABEL         [icon?]  │   gap = --space-2 or --space-3
└──────────────────────────────────┘
  └── border-border/50             ← hover: border-foreground/70
  └── rounded-[var(--radius-sm)]
  └── px-[var(--space-5)]          ← size md
  └── font-mono uppercase text-xs tracking-[0.12em]
```

Icons are **always** `stroke-width: 1.5`, inheriting `currentColor`, sized `1em` relative to the button label.

### 12.5 Canonical snippets

```tsx
// Primary — the single most important action per surface
<button className="
  inline-flex h-[4.4rem] items-center justify-center gap-[var(--space-3)]
  rounded-[var(--radius-sm)] border border-border/50
  px-[var(--space-5)]
  font-mono text-xs uppercase tracking-[0.12em] text-foreground/90
  transition-[color,border-color] duration-[var(--duration-base)] ease-[var(--ease-standard)]
  hover:border-foreground/70 hover:text-foreground
  disabled:opacity-40 disabled:pointer-events-none
  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40
">
  Subscribe
</button>

// Ghost — recessive
<button className="
  inline-flex h-[3.6rem] items-center gap-[var(--space-2)]
  rounded-[var(--radius-sm)] border border-transparent
  px-[var(--space-4)]
  font-mono text-xs uppercase tracking-[0.12em] text-foreground/70
  transition-[color,border-color] duration-[var(--duration-base)] ease-[var(--ease-standard)]
  hover:border-border/30 hover:text-foreground
">
  Cancel
</button>

// Accent — rouge; reserve for conversion moments
<button className="
  ... border-rouge/60 text-rouge
  hover:border-rouge hover:text-rouge
">
  Join the Hideaway
</button>

// Icon-only
<button aria-label="Save" className="
  inline-flex size-[3.6rem] items-center justify-center
  rounded-[var(--radius-sm)] border border-transparent text-foreground/70
  hover:border-border/30 hover:text-foreground
">
  <BookmarkIcon className="size-[1.6rem]" strokeWidth={1.5} />
</button>
```

### 12.6 Forbidden button patterns

- Solid-fill buttons in primary/brand color (Audit F-030). Filled = destructive only.
- `rounded-xl`, `rounded-2xl`, `rounded-full` on standard actions. Fully rounded is permitted only for icon-only pill toggles inside the Radio/TapePlayer UI.
- Drop shadows on buttons (`shadow-sm`, `shadow-xs`). Flat, bordered, done.
- Hover states that swap background color (e.g. `hover:bg-accent`). Hover = border-weight + text-opacity shift.
- Sentence-case labels (unless inside prose with `variant=link`).
- Stacking two same-rank buttons (e.g. two `primary`). Pair `primary` + `ghost` or `primary` + `link`.
- Heights outside the {28, 36, 44, 52} scale.

### 12.7 Button component contract

The canonical button component (`src/components/ui/button.tsx`) must export:

```tsx
type ButtonVariant = "primary" | "ghost" | "link" | "accent" | "destructive";
type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ComponentPropsWithRef<"button"> {
  variant?: ButtonVariant;  // default: "primary"
  size?: ButtonSize;        // default: "md"
  asChild?: boolean;        // Radix Slot passthrough
  loading?: boolean;        // inline spinner, disables interaction
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}
```

- `VaultButton` (admin-side) should be removed in favor of a single `Button` with an admin-theme context (Audit F-030).
- `Mutton` (motion-wrapped) stays as an opt-in export for surfaces that need layout animation.

---

## 13. Cards

The card is the editorial unit — a single work (essay, album, list, profile) rendered as a spatial object.

### 13.1 Philosophy

- **A card is a page in miniature.** It has a cover, a title, and quiet metadata — never a chart, never a KPI, never three side-by-side action buttons.
- **One border, no shadow (light).** In light mode, cards defend their edge with `border-border/20`. In dark mode, a whisper of `shadow-xs` plus `border-border/30` is allowed (see §7).
- **Media is the loudest thing on the card.** If there's cover art, it owns the top. Title comes second. Metadata last, in mono.
- **Hover deepens, never re-skins.** Border goes from `/20` → `/50`, image scales `1.04`. No background flip, no gradient bloom.

### 13.2 Canonical radius

| Card type | Radius | Token |
|---|---|---|
| Editorial card (post, surf, profile, list) | 2px | `--radius-sm` |
| Compilation card (premium) | 2px | `--radius-sm` |
| Music tile (album, track, playlist cover) | 2px | `--radius-sm` |
| Avatar | full circle | `--radius-full` |
| Dialog / modal / sheet | 4px | `--radius-md` |

The current implementations use `rounded-xl` and `rounded-lg` indiscriminately (Audit F-031). All content cards converge on `--radius-sm`.

### 13.3 Card anatomy

```
┌──────────────────────────────────┐
│                                  │
│   [cover / media]                │  aspect-ratio locked (4:3 / 16:9 / 1:1)
│     └── group-hover: scale(1.04) │  duration 500ms, ease-decelerate
│     └── gradient scrim (optional)│  from-transparent to-background/60
│                                  │
├──────────────────────────────────┤  padding-x: --space-4
│ EYEBROW                    01:14 │  mono 10px, tracking-[0.2em]
│                                  │
│ Card Title lives here            │  --text-base, font-medium
│ and may wrap to two lines.       │  line-clamp-2
│                                  │
│ ─── meta · 4 min · saved ────    │  mono 11px, text-muted/60
└──────────────────────────────────┘
  └── border-border/20 (hover: /50)
  └── rounded-[var(--radius-sm)]
  └── bg-card
  └── transition: border-color, transform 300ms
```

### 13.4 Padding & spacing inside a card

- Body padding: `p-[var(--space-4)]` (= 16px) default; `p-[var(--space-5)]` (= 20px) for large cards.
- Gap between cover and body: `0` — the border of the image meets the padding.
- Gap between eyebrow and title: `--space-2` (8px).
- Gap between title and meta: `--space-3` (12px).
- Gap between meta pills: `--space-2`.

### 13.5 Aspect ratios

| Card | Aspect | Reason |
|---|---|---|
| Post (free-tier) | `16 / 9` | Matches blog thumbnails, approachable |
| Post (premium) | `4 / 3` | More vertical, feels editorial |
| Album / track | `1 / 1` | Square is the music affordance |
| Playlist | `4 / 3` | Overlaps cassette/record feel without being square |
| List (compilation) | `3 / 2` | Breathes between 4:3 and 16:9 |
| Profile | `1 / 1` or avatar-only | Depends on card density |

### 13.6 Card variants

| Variant | When to use | Visual difference |
|---|---|---|
| `shell` (default) | Library, grid, feed | Border, body padding, hover: border → /50 |
| `quiet` | Sub-cards inside a panel (nested) | No border, only subtle divider or surface tint |
| `overlay` | Cards where title sits ON the image (premium, hero) | No body — title is absolute-positioned inside the cover with a gradient scrim |
| `flat` | Dashboard-adjacent (analytics, settings summaries) | No image; title + meta + a single value |
| `media` | Radio tiles, tape cards | Image dominates, title in mono as a data-tag |

### 13.7 Canonical snippet — default shell card

```tsx
<article className="group relative flex flex-col overflow-hidden rounded-[var(--radius-sm)] border border-border/20 bg-card transition-[border-color] duration-[var(--duration-moderate)] ease-[var(--ease-standard)] hover:border-border/50">
  <div className="relative aspect-[16/9] overflow-hidden bg-muted/20">
    <img
      src={cover}
      alt=""
      className="size-full object-cover transition-transform duration-[500ms] ease-[var(--ease-decelerate)] group-hover:scale-[1.04]"
    />
  </div>

  <div className="flex flex-1 flex-col p-[var(--space-4)]">
    <span className="font-mono text-[1.0rem] uppercase tracking-[0.2em] text-muted-foreground/60">
      {category}
    </span>

    <h3 className="mt-[var(--space-2)] line-clamp-2 text-base font-medium leading-snug tracking-tight">
      {title}
    </h3>

    <div className="mt-auto pt-[var(--space-3)] font-mono text-[1.1rem] text-muted-foreground/60">
      {author} · {readingTime}
    </div>
  </div>
</article>
```

### 13.8 Overlay card (premium)

```tsx
<article className="group relative aspect-[4/3] overflow-hidden rounded-[var(--radius-sm)] border border-border/20 hover:border-border/50">
  <img src={cover} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/25 to-transparent" />
  <div className="absolute inset-x-0 bottom-0 p-[var(--space-5)]">
    <span className="font-mono text-[1.0rem] uppercase tracking-[0.2em] text-foreground/70">{eyebrow}</span>
    <h3 className="mt-[var(--space-2)] text-xl font-light tracking-tight text-foreground">{title}</h3>
  </div>
</article>
```

### 13.9 Forbidden card patterns

- `rounded-xl` or `rounded-lg` (Audit F-031).
- Outline-styled borders using `outline-groove` (the current shadcn Card). Normal `border` only.
- Heavy shadows (`shadow-lg`, `shadow-md`) in light mode.
- Two action buttons in a card footer. One trailing link, max.
- Gradient fills over an image for "style." Scrims must exist only when they serve legibility.
- Stat chips inside editorial cards. Counts live in the meta line, rendered as mono text.

### 13.10 Card component contract

`src/components/ui/card.tsx` is the current reference but drifts from the system. Canonical contract:

```tsx
interface CardProps extends ComponentPropsWithRef<"article" | "a" | "div"> {
  variant?: "shell" | "quiet" | "overlay" | "flat" | "media"; // default: "shell"
  as?: "article" | "a" | "div"; // default: "article"
  interactive?: boolean; // enables hover border + scale
}

// Subcomponents — ALWAYS used inside <Card>, never in isolation:
<Card.Media />     // cover image slot
<Card.Body />      // padded body
<Card.Eyebrow />   // mono uppercase label
<Card.Title />     // <h3>-rendered, --text-base font-medium
<Card.Meta />      // mono metadata row
<Card.Footer />    // bottom action row (rare)
```

---

## 14. Inputs & Forms

Forms are prose with blanks. Every input is a line to write on, not a filled box.

### 14.1 Philosophy

- **Underline, not box.** The default input is `border-b` — no frame, no fill, no shadow.
- **Labels above, mono, tracked.** Labels read as eyebrows — uppercase mono, small.
- **State through line-weight, not glow.** Focus = underline opacity `/30` → `/80`. No ring, no box-shadow bloom.
- **Errors whisper in context.** Red is restricted to destructive or form-error text; the error message sits under the underline, never repaints the field.

### 14.2 Canonical recipes

#### Text input (default)

```tsx
<input
  className="
    block w-full border-0 border-b border-border/30
    bg-transparent
    py-[var(--space-2)] pr-[var(--space-1)]
    text-[var(--text-md)] font-light tracking-tight
    text-foreground placeholder:text-muted-foreground/40
    outline-none
    transition-[border-color] duration-[var(--duration-base)] ease-[var(--ease-standard)]
    focus:border-foreground/80
    disabled:opacity-40
    aria-[invalid=true]:border-destructive/80
  "
/>
```

Heights are **not** fixed on bottom-border inputs — line-height + padding does the work. For filled/framed variants (see §14.5) use the button height scale.

#### Textarea

```tsx
<textarea
  rows={4}
  className="
    block w-full resize-y border-0 border-b border-border/30
    bg-transparent
    py-[var(--space-2)]
    text-[var(--text-md)] font-light leading-relaxed tracking-tight
    placeholder:text-muted-foreground/40
    outline-none focus:border-foreground/80
  "
/>
```

#### Label

```tsx
<label className="block font-mono text-[1.0rem] uppercase tracking-[0.2em] text-muted-foreground/80">
  Display name
</label>
```

#### Helper / hint text

```tsx
<p className="mt-[var(--space-2)] font-mono text-[1.0rem] text-muted-foreground/60">
  Visible on your public profile.
</p>
```

#### Error text

```tsx
<p className="mt-[var(--space-2)] font-mono text-[1.0rem] text-destructive/90" role="alert">
  Display name must be at least 3 characters.
</p>
```

### 14.3 Field block anatomy

```
LABEL                                             ← mono 10px uppercase, muted-foreground/80
[ input ──────────────────────────── ]            ← border-b (rest: border/30, focus: foreground/80)
Helper text or error message                      ← mono 10px, muted/60 or destructive/90
```

Spacing:
- Label → Input: `--space-2` (8px)
- Input → Helper: `--space-2`
- Field → Field (vertical stack in a form): `--space-6` (24px)
- Field → Field (horizontal in a row): `--space-4` (16px)

### 14.4 Checkbox, Radio, Switch

All three use the same visual grammar: square or circle, hairline border, check mark in foreground.

```tsx
// Checkbox
<input type="checkbox" className="
  size-[1.6rem]
  appearance-none
  rounded-[var(--radius-xs)]
  border border-border/50
  bg-transparent
  transition-[background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]
  checked:border-foreground checked:bg-foreground
  checked:after:content-['✓'] checked:after:block checked:after:text-background
  hover:border-foreground/80
" />

// Radio — same but rounded-full, check = inner dot
// Switch — pill track (--radius-full), hairline border, knob slides on color change
```

### 14.5 Filled / framed variant (rare)

Only for contexts where the bottom-border pattern is ambiguous — admin tables, search modals, command palette.

```tsx
<input className="
  block w-full
  rounded-[var(--radius-sm)]
  border border-border/30
  bg-transparent
  px-[var(--space-3)] py-[var(--space-2)]
  text-[var(--text-md)] font-light
  placeholder:text-muted-foreground/40
  focus:border-foreground/60 focus:outline-none
" />
```

### 14.6 Field states matrix

| State | Border | Label | Text | Notes |
|---|---|---|---|---|
| Rest | `border-border/30` | `muted-foreground/80` | `foreground` | — |
| Hover | `border-border/60` | unchanged | unchanged | optional — many fields skip hover |
| Focus | `border-foreground/80` | unchanged | unchanged | No ring |
| Filled (has value) | `border-border/50` | unchanged | `foreground` | Visual cue the field carries data |
| Disabled | `border-border/20` | opacity `/40` | `/40` | `cursor-not-allowed` |
| Error | `border-destructive/80` | unchanged | unchanged | Error message below |
| Read-only | `border-dashed border-border/30` | unchanged | `foreground/70` | Dashed line = "this is a fact, not a field" |

### 14.7 Forbidden form patterns

- Framed inputs on marketing / auth / profile surfaces (reserved for admin and CMDK).
- `placeholder` used as label. Always a real `<label>`.
- Floating labels that animate into the border. Hideaway uses static eyebrow labels.
- Focus rings (`ring-2 ring-ring`), focus glows, box-shadows on focus.
- Red outlines that persist. Error = message; border tint is supportive, not shouty.
- `file-input` styled like a button with solid fill. Prefer a ghost button next to a filename.
- Gradient or colored form backgrounds.

### 14.8 Input component contract

```tsx
interface InputProps extends ComponentPropsWithRef<"input"> {
  variant?: "underline" | "framed";   // default: "underline"
  invalid?: boolean;                  // mirrors aria-invalid
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

interface FieldProps {
  label: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;   // input / textarea / select
}
```

A `<Field>` component is the canonical form atom — it owns label, hint, error, and spacing so no form ever manually composes `<label>+<input>+<p>`.

---

## 15. Typography primitives (React wrappers)

A typographic design system is enforced only if it **ships as code**. Hideaway uses a small set of React primitives that encapsulate every sanctioned text recipe from §4.

### 15.1 Primitive inventory

| Primitive | Renders | Default recipe | When to use |
|---|---|---|---|
| `<Display>` | `<h1>` | §4.5 "Hero display" — `text-5xl/6xl/7xl`, `font-light`, `tracking-tight` | Landing hero only — one per page, max |
| `<PageTitle>` | `<h1>` | `text-3xl xl:text-4xl`, `font-light`, `tracking-tight` | Top-of-page title on secondary pages |
| `<SectionTitle>` | `<h2>` | `text-2xl xl:text-3xl`, `font-light`, `tracking-tight` | Major sections inside a page |
| `<SubsectionTitle>` | `<h3>` | `text-xl xl:text-2xl`, `font-light`, `tracking-tight` | Nested sub-headings |
| `<CardTitle>` | `<h3>` | `text-base`, `font-medium`, `tracking-tight`, `leading-snug` | Card headings |
| `<Eyebrow>` | `<span>` | `font-mono text-[1.0rem] uppercase tracking-[0.2em] text-muted-foreground/80` | Category, kicker, overline |
| `<Label>` | `<span>` / `<label>` | `font-mono text-xs uppercase tracking-[0.12em]` | Nav, button, form labels |
| `<Meta>` | `<span>` | `font-mono text-[1.1rem] text-muted-foreground/60` | Metadata rows (read time, date, counts) |
| `<Micro>` | `<span>` | `font-mono text-[0.9rem] uppercase tracking-[0.2em] text-muted-foreground/50` | Micro badges, footnotes |
| `<Prose>` | `<p>` | `font-mono text-[1.1rem] xl:text-xs leading-relaxed` | Running body mono copy |
| `<Body>` | `<p>` | `text-md font-light leading-relaxed` | Running SUIT body copy |
| `<Lead>` | `<p>` | `text-lg xl:text-xl font-light leading-relaxed text-foreground/80` | Essay leads, section intros |
| `<Quote>` | `<blockquote>` | Narcissian Nectare, `text-2xl font-light italic` | Pull quotes in essays |
| `<Mono>` | `<code>` / `<span>` | `font-mono text-[0.95em]` | Inline code, IDs, timestamps |

### 15.2 Contract

Every primitive accepts:

```tsx
interface TypographyPrimitiveProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;           // override the default semantic element
  variant?: string;           // opt-in variant, e.g. <Meta variant="badge">
  tone?: "default" | "muted" | "ghost" | "accent";  // opacity preset
  align?: "start" | "center" | "end";
}
```

- **The `className` prop is allowed but discouraged.** If you need a different recipe, you need a different primitive.
- Primitives ship their own semantic element by default. Use `as` to override only when the semantic requires it (e.g. `<Eyebrow as="label">`).
- `tone` is the opacity selector — `muted` = `/70`, `ghost` = `/40`, never a different color.

### 15.3 Canonical implementation shape

```tsx
// components/typography/Eyebrow.tsx
import { cn } from "@/lib/utils";
import type { ElementType, HTMLAttributes, ReactNode } from "react";

interface EyebrowProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  tone?: "default" | "muted" | "ghost";
  children: ReactNode;
}

export function Eyebrow({
  as: Tag = "span",
  tone = "default",
  className,
  children,
  ...rest
}: EyebrowProps) {
  return (
    <Tag
      className={cn(
        "font-mono uppercase tracking-[0.2em]",
        "text-[var(--text-xs)]",
        tone === "default" && "text-muted-foreground/80",
        tone === "muted" && "text-muted-foreground/60",
        tone === "ghost" && "text-muted-foreground/40",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
```

### 15.4 Why wrappers (not utility classes everywhere)

- **Drift prevention.** Four devs writing four different `text-xs uppercase tracking-wide` combinations is how a codebase loses its voice. One import, one recipe.
- **Semantic correctness.** `<h1>` / `<h2>` / `<h3>` follow document outline automatically instead of being chosen at the call site.
- **Theme migrations.** When `--text-base` moves from 1.4rem to 1.5rem, every `<CardTitle>` updates. When it's `className="text-base"` everywhere, nothing updates.
- **Bilingual correctness.** Primitives can toggle `font-feature-settings` / `letter-spacing` when rendering Korean without callers knowing.
- **Reviewability.** PRs read as `<PageTitle>Library</PageTitle>` — legible even to a designer reviewing code.

### 15.5 Forbidden typography patterns

- Using `className="text-xl font-semibold ..."` instead of a primitive (Audit F-020 / F-023).
- Primitives that accept `weight` / `size` as props. Choose a different primitive instead; don't parameterize the scale.
- Inline `style={{fontSize: ...}}` anywhere outside `src/components/UX/*` effects.
- Nesting primitives to re-weight (`<Meta><strong>...</strong></Meta>`). If you need emphasis, use a different primitive.

### 15.6 Primitive file map

All primitives live under a single barrel:

```
src/components/typography/
├── Display.tsx
├── PageTitle.tsx
├── SectionTitle.tsx
├── SubsectionTitle.tsx
├── CardTitle.tsx
├── Eyebrow.tsx
├── Label.tsx
├── Meta.tsx
├── Micro.tsx
├── Prose.tsx
├── Body.tsx
├── Lead.tsx
├── Quote.tsx
├── Mono.tsx
└── index.ts       // re-exports all
```

This directory does not yet exist — creating it and migrating surfaces is tracked under Audit F-023.

---

## 16. Badges, Tags, Pills

Small text objects that mark status, count, category, or membership. Not decorative; always data.

### 16.1 Taxonomy

| Primitive | Shape | Purpose |
|---|---|---|
| `Badge` | `--radius-xs` rect, bordered | Status markers — "draft", "premium", "new" |
| `Tag` | `--radius-sm` rect, bordered, tappable | Taxonomy chips — categories, topics (link to filter) |
| `Pill` | `--radius-full`, bordered | Counts + filter chips inside toolbars |
| `Dot` | circle, 6–8px | Inline status signal (online, unread) |

### 16.2 Canonical recipes

```tsx
// Badge (status)
<span className="
  inline-flex items-center gap-[var(--space-1)]
  rounded-[var(--radius-xs)] border border-border/40
  px-[var(--space-2)] py-[0.2rem]
  font-mono text-[0.9rem] uppercase tracking-[0.2em]
  text-foreground/70
">
  Draft
</span>

// Tag (taxonomy, link)
<a href="/tags/essays" className="
  inline-flex items-center
  rounded-[var(--radius-sm)] border border-border/30
  px-[var(--space-3)] py-[var(--space-1)]
  font-mono text-[1.0rem] uppercase tracking-[0.12em]
  text-foreground/80
  transition-[border-color,color]
  hover:border-foreground/60 hover:text-foreground
">
  Essays
</a>

// Pill (count / filter)
<span className="
  inline-flex items-center gap-[var(--space-1)]
  rounded-[var(--radius-full)] border border-border/30
  px-[var(--space-3)] py-[0.25rem]
  font-mono text-[1.0rem] tracking-[0.08em]
  text-foreground/70
">
  24
</span>

// Dot
<span className="inline-block size-[0.7rem] rounded-[var(--radius-full)] bg-rouge" aria-hidden />
```

### 16.3 Color discipline

| Semantic | Border | Text | Use |
|---|---|---|---|
| Neutral | `border-border/40` | `text-foreground/70` | Default |
| Premium | `border-rouge/50` | `text-rouge` | Patron-gated content |
| Destructive | `border-destructive/50` | `text-destructive` | Warnings, draft-with-errors |
| Success (rare) | `border-border/40` | `text-foreground` | Confirmation — **never green fill** |
| Live / unread | `bg-rouge` (dot only) | — | Rouge dot is the only unread affordance |

No filled badges. No success-green. No soft-blue "info" chips. The system's color charge is Rouge and only Rouge.

### 16.4 Forbidden

- Solid-fill badges (`bg-primary text-primary-foreground`).
- Rainbow tag palettes ("essays" in blue, "surf" in green, etc.). Categorization is readable through text, not hue.
- Badges taller than the line-height of the body text next to them.
- Combining Badge + Tag + Pill styling in the same list — pick one.

---

## 17. Layout containers

A Hideaway page has exactly three container widths. Everything else is a mistake.

### 17.1 The three containers

| Container | Max width | Edge padding | Token | Use |
|---|---|---|---|---|
| `page` | `80rem` (1280px) | `--space-6` mobile → `--space-10` 2xl+ | `--container-page` | Default for every content page |
| `prose` | `40rem` (640px) | `--space-6` | `--container-prose` | Essay reading pane, forms, auth |
| `full` | `100%` | `0` | `--container-full` | Heroes, full-bleed media, video |

Never use `max-w-5xl` (= 64rem) as the page container — it produces a deadly gutter on MacBook Pro 16" and 1440+ monitors. Historical drift from early prototypes.

### 17.2 Canonical page container

```tsx
<div className="mx-auto max-w-[var(--container-page)] px-[var(--space-6)] xl:px-[var(--space-10)]">
  {children}
</div>
```

This recipe currently lives as raw `max-w-7xl px-6 xl:px-10` scattered across ~3 files (see grep result in Audit). Extract into:

```tsx
// components/layout/Page.tsx
interface PageProps {
  width?: "page" | "prose" | "full";
  children: ReactNode;
  className?: string;
}

export function Page({ width = "page", children, className }: PageProps) { /* ... */ }
```

### 17.3 Vertical rhythm inside a page

- Page header (sticky or not) → first content block: `--space-9` (40px)
- Major section → major section: `--space-12` (72px) mobile, `--space-16` (128px) desktop
- Minor section → minor section: `--space-8` (32px)
- Last content block → footer: `--space-16`

Forbidden: `mt-24`, `py-32`, or any other raw pixel-derived spacing above `--space-16`. If you need more air, you need a section break, not a larger margin.

### 17.4 Page scaffolding contract

Every page follows the same outer shape:

```
<Page>
  <StickyHeader? />        ← §18, optional
  <Hero? />                ← §19, optional
  <main>
    <Section>...</Section> ← any number
    <Section>...</Section>
  </main>
  <FooterSpacer />         ← --space-16 tail before global footer
</Page>
```

- The `<main>` wrapper is **required** for a11y — exactly one per route (Payload admin is separate).
- Sections carry their own spacing internally; siblings separated by `--space-12`/`--space-16` via a `<SectionStack>` primitive or gap utility.

---

## 18. Sticky headers & page chrome

Hideaway's sticky header is the quiet, typographic ribbon that anchors a surface without yelling.

### 18.1 Structural contract

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  EYEBROW                             nav · nav · nav · nav  │
│  H1 Page Title                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
  └── sticky top-0
  └── z-index: --z-sticky
  └── backdrop-blur: --blur-md
  └── background: bg-background/90
  └── border-bottom: border-border/30
  └── padding: py-[var(--space-5)] + page container's px
```

### 18.2 Canonical snippet

```tsx
<header className="
  sticky top-0
  z-[var(--z-sticky)]
  border-b border-border/30
  bg-background/90 backdrop-blur-[var(--blur-md)]
">
  <div className="
    mx-auto max-w-[var(--container-page)]
    px-[var(--space-6)] xl:px-[var(--space-10)]
    py-[var(--space-5)]
  ">
    <div className="flex items-end justify-between gap-[var(--space-6)]">
      <div>
        <Eyebrow>{sectionLabel}</Eyebrow>
        <PageTitle className="mt-[var(--space-1)]">{pageTitle}</PageTitle>
      </div>
      <nav aria-label={sectionLabel}>
        <ul className="flex items-center gap-[var(--space-6)]">
          {links.map(l => (
            <li key={l.href}>
              <NavLink href={l.href}>{l.label}</NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  </div>
</header>
```

### 18.3 Header variants

| Variant | When | Differences |
|---|---|---|
| `chrome` *(default)* | Content pages with a title + sub-nav | Full layout above |
| `thin` | Reading surfaces (essay detail) | No title row; only 56px-tall nav ribbon |
| `translucent` | Over hero/media | `bg-transparent` until scrolled past hero, then `bg-background/90 backdrop-blur-md` |
| `admin` (Vault) | `/vault/*` | Different type (SUIT → system-ui fallback allowed), darker tone |

### 18.4 Scroll behavior

- **Default:** Header remains visible on scroll (stays sticky).
- **Reading surface:** Header auto-hides on scroll-down, reveals on scroll-up (GSAP ScrollTrigger). Must respect reduced-motion: if `prefers-reduced-motion: reduce`, the header stays visible.
- **Never auto-hide on non-reading pages.** Navigation is part of the trust of the page.

### 18.5 Forbidden header patterns

- Sticky headers taller than `--space-16` (128px) on desktop. Breathing room lives above or below the header, not inside.
- Drop shadows under the header (`shadow-sm`, etc.). Sole divider is the hairline `border-b`.
- `position: fixed` instead of `sticky`. Fixed headers force page-wide padding hacks.
- Animating background color on scroll. Transitions are opacity or blur only.
- Two rows of sticky nav. If you need a tab row, it lives inside the page, not welded to the global chrome.

---

## 19. Heroes

A hero is a deliberate, full-bleed statement — never decorative. It exists when the page needs one piece of media to set the tone before the reader arrives at content.

### 19.1 When a hero is warranted

| Yes | No |
|---|---|
| Landing page | Settings / account |
| Essay detail | Library index |
| Curated compilation cover | Search results |
| Playlist / album detail | CMS admin |
| Profile detail (for premium roles) | Forms |

### 19.2 Size budget

| Viewport | Height |
|---|---|
| Mobile | `55vh`, min `32rem` (320px) |
| Tablet+ | `60vh`, min `42rem` (420px) |
| Desktop | `65vh`, min `52rem` (520px), max `80rem` (800px) |

Heroes never consume 100vh on non-landing pages. One full-viewport hero per session is the budget.

### 19.3 Canonical structure

```tsx
<section className="relative w-full overflow-hidden h-[55vh] md:h-[60vh] xl:h-[65vh] min-h-[32rem] xl:min-h-[52rem]">
  {/* Cover */}
  {cover ? (
    <img src={cover} alt="" className="absolute inset-0 size-full object-cover" />
  ) : (
    <HeroLetterFallback letter={title[0]} />
  )}

  {/* Scrim */}
  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/30 to-transparent" />

  {/* Content — anchored bottom-left inside container */}
  <div className="absolute inset-x-0 bottom-0">
    <div className="mx-auto max-w-[var(--container-page)] px-[var(--space-6)] xl:px-[var(--space-10)] pb-[var(--space-10)]">
      <Eyebrow tone="default">{kicker}</Eyebrow>
      <Display className="mt-[var(--space-3)] max-w-[18ch]">{title}</Display>
      <Meta className="mt-[var(--space-4)]">{byline} · {date}</Meta>
    </div>
  </div>
</section>
```

### 19.4 Letter fallback

When a hero lacks media, the initial letter of the title fills the space as a decorative element.

```tsx
<div className="absolute inset-0 flex items-center justify-center">
  <span className="font-mono font-light leading-none text-foreground/[0.04] text-[20vw]">
    {letter}
  </span>
</div>
```

The letter is **background texture, not content** — `aria-hidden` and never keyboard-focusable.

### 19.5 Content anchoring rules

- Content bottom-aligned inside the page container.
- Max text width: `~18ch` for titles, `~36ch` for sub-copy. Essay heroes may go wider (`~24ch`).
- No centered heroes. The Hideaway hero reads like a magazine spread, left-anchored.
- No two CTAs in a hero. One, or none.

### 19.6 Forbidden hero patterns

- Animated gradient backgrounds.
- Particle canvases, WebGL hero effects (reserved for *one* specific landing moment — if multiplied, banned).
- Autoplaying video hero with audio.
- Hero bars with centered bold CTAs on colored fills ("Get Started →").
- Parallax scroll-jacking on standard heroes. (Landing page has one sanctioned scrollytelling moment; other heroes stay still.)
- Heroes taller than 65vh on non-landing pages.

---

## 20. Grids & lists

The shape of a Hideaway surface is almost always a grid of cards. The rules of that grid are strict.

### 20.1 Canonical grid recipes

All grids use CSS Grid with auto-fit fallback as a safety net, and explicit column counts at breakpoints.

| Grid type | sm | md | lg | xl | 2xl | Gap |
|---|---|---|---|---|---|---|
| Editorial cards (posts, surf, profile, list) | 1 | 2 | 3 | 4 | 4 | `--space-5` → `--space-6` xl |
| Music tiles (album, track, playlist cover) | 2 | 3 | 4 | 5 | 6 | `--space-4` → `--space-5` xl |
| Compilation cards (premium, 4:3) | 1 | 2 | 3 | 4 | 4 | `--space-5` |
| Compilation cards (free, 16:9) | 1 | 2 | 3 | 3 | 4 | `--space-5` |
| Detail item grid (premium) | 2 | 3 | 4 | 5 | 6 | `--space-4` |
| Dashboard rows (settings, vault tables) | 1 | 1 | 2 | 2 | 3 | `--space-6` |

### 20.2 Canonical snippet

```tsx
<ul className="
  grid
  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
  gap-[var(--space-5)] xl:gap-[var(--space-6)]
">
  {items.map(item => (
    <li key={item.id}>
      <PostCard post={item} />
    </li>
  ))}
</ul>
```

### 20.3 List primitive contract

A `<CardGrid>` primitive encapsulates the responsive grammar so pages don't re-derive `grid-cols-*` from memory:

```tsx
interface CardGridProps {
  density?: "editorial" | "music" | "premium" | "free" | "detail" | "dashboard";
  gap?: "compact" | "standard" | "loose"; // override the density default
  children: ReactNode;
}
```

### 20.4 Horizontal rails (carousels)

Some surfaces use horizontal scroll instead of grids — "Continue reading", "From the editor", Radio now-playing shelf.

```tsx
<div className="overflow-x-auto overscroll-x-contain -mx-[var(--space-6)] xl:-mx-[var(--space-10)] px-[var(--space-6)] xl:px-[var(--space-10)]">
  <ul className="flex gap-[var(--space-5)] snap-x snap-mandatory">
    {items.map(item => (
      <li key={item.id} className="shrink-0 w-[28rem] snap-start">
        <PostCard post={item} />
      </li>
    ))}
  </ul>
</div>
```

- Rails are **opt-in**, not default. Grid remains canonical.
- Always snap to start.
- Scrollbar hidden via utility, with keyboard navigation preserved (left/right arrow handlers).

### 20.5 Forbidden grid patterns

- `auto-fit` / `minmax()` with arbitrary `minmax(280px, 1fr)` — explicit breakpoints are the contract (Audit F-033 adjacent).
- Grids that drop column count going up (`sm:grid-cols-3 md:grid-cols-2`).
- Grids without `xl:` and `2xl:` variants (dead space on MacBook Pro 16"+).
- Masonry / Pinterest layouts. Hideaway is magazine, not mood board.
- Filled dividers between grid rows. Whitespace is the divider.

---

## 21. Empty, loading & error states

The absence of content is a design surface. Hideaway does not ship spinners-on-whiteboxes or generic "Something went wrong." screens.

### 21.1 Empty state canon

Every list, grid, and search result has an empty state. The pattern is:

```
          ◫                ← 48–56px glyph, font-mono font-light, opacity 10%
          │
   You haven't saved       ← PageTitle-ish, but lighter — text-xl font-light
   anything yet
          │
   Press ⌘K to search      ← Prose, max-w-xs, muted-foreground/50
   and start your library. ← font-mono text-xs
          │
      ╭─────────╮
      │ BROWSE  │          ← Ghost or primary button
      ╰─────────╯
```

Canonical snippet:

```tsx
<div className="flex flex-col items-center justify-center py-[var(--space-16)] text-center">
  <span aria-hidden className="font-mono text-5xl font-light opacity-10">
    {symbol}
  </span>
  <p className="mt-[var(--space-4)] text-xl font-light tracking-tight text-foreground/80">
    {headline}
  </p>
  <p className="mt-[var(--space-2)] max-w-[28ch] font-mono text-[1.1rem] text-muted-foreground/50">
    {description}
  </p>
  {cta && (
    <button className="mt-[var(--space-7)] /* ghost button */">
      {cta}
    </button>
  )}
</div>
```

### 21.2 Canonical glyphs

| Context | Glyph | Rationale |
|---|---|---|
| Saved items / bookmarks | `◫` | Rectangular "kept" affordance |
| Lists / collections | `⊞` | Implied structure |
| Profiles / people | `○` | Portrait-adjacent circle |
| Search (zero results) | `⌕` | Magnifier glyph |
| Comments / annotations | `¶` | Pilcrow — reading history |
| Notifications | `◉` | Filled aperture |
| Radio / audio | `◌` | Soft circle — track slot |
| Errors | `▲` | Triangular warning |

Glyphs are always `opacity: 0.1`, `font-mono font-light`. They do **not** use icon components — they are typographic marks.

### 21.3 Loading states

Hideaway uses four loading idioms:

| Idiom | When |
|---|---|
| **Skeleton (shimmer)** | Default for cards, grids, lists. Animates opacity pulse, no gradient sweep |
| **Inline spinner** | Inside a button that's executing (`loading` prop). 1em high, inherits color |
| **Ambient progress** | Top-of-page 2px hairline bar in `--rouge/50` for route transitions |
| **Silence** | Operations under ~300ms — no indicator. The UI is allowed to be quiet |

Skeleton rules:
- Same shape/size as the real content it replaces (no generic "loading box").
- `bg-muted/20`, `animate-pulse` with `--duration-moderate` → `--duration-slower` ease-linear infinite alternate.
- No shimmering gradient sweep. We are editorial, not SaaS.

```tsx
<div className="h-[20rem] w-full rounded-[var(--radius-sm)] bg-muted/20 animate-pulse" />
```

### 21.4 Error states

Three tiers, three treatments.

| Severity | Location | Treatment |
|---|---|---|
| **Inline** (form error, single field) | Below the input | `text-destructive/90`, mono, `--text-xs` |
| **Section** (a widget can't load) | In place of the widget | Empty-state layout with `▲` glyph + "Couldn't load" + retry ghost button |
| **Page** (route-level crash) | Full page | Empty-state layout, large display text, link back home, error code in `<Mono>` at bottom |

Canonical page-error:

```tsx
<Page width="prose">
  <div className="flex flex-col items-center justify-center py-[var(--space-16)] text-center">
    <span aria-hidden className="font-mono text-5xl font-light opacity-10">▲</span>
    <h1 className="mt-[var(--space-4)] text-3xl font-light tracking-tight">
      Something came loose.
    </h1>
    <p className="mt-[var(--space-2)] max-w-[32ch] font-mono text-[1.1rem] text-muted-foreground/60">
      The page couldn't load. Try again, or head back home.
    </p>
    <div className="mt-[var(--space-7)] flex gap-[var(--space-3)]">
      <RetryButton />
      <Link href="/" /* ghost button */>Home</Link>
    </div>
    <code className="mt-[var(--space-12)] font-mono text-[0.9rem] text-muted-foreground/30">
      {errorId}
    </code>
  </div>
</Page>
```

### 21.5 Forbidden

- Generic "Oops!" / "Uh oh!" / emoji-ridden error copy.
- Spinners in the center of empty panels with no context.
- Gradient shimmer sweeps on skeletons.
- Red-filled banners at the top of the page ("Error!"). Errors live in context; globally, use the notification channel.
- Retry buttons styled as primary-fill. Retry is always ghost.

---

## 22. Modals, sheets & popovers

Three layered surfaces, three different jobs.

### 22.1 When to use which

| Surface | Job | Size |
|---|---|---|
| **Modal** (`<Dialog>`) | A focused decision or a short form. Blocks the page. | `max-w-[44rem]` default, `max-w-[36rem]` compact |
| **Sheet** (`<Sheet>`) | Ancillary content that complements the page (profile quick-view, filters). Slides from edge. | Right edge on desktop; bottom on mobile |
| **Popover** (`<Popover>`) | Contextual micro-UI anchored to a trigger (date picker, mini-menu, emoji picker). No overlay. | Auto-sized, ~`20rem` cap |
| **Dropdown** (`<DropdownMenu>`) | A list of actions anchored to a trigger. | Auto |
| **Tooltip** (`<Tooltip>`) | One-sentence hint, never a decision, never containing interactive content. | Auto |

### 22.2 Modal canon

```
                      Backdrop: bg-background/60 backdrop-blur-[var(--blur-md)]
           ╭──────────────────────────────────╮
           │                                  │     Surface:
           │ EYEBROW                        ✕ │       bg-card (same as card)
           │ Modal Title                      │       border border-border/30
           │                                  │       rounded-[var(--radius-md)]
           │ Body copy, form, or content.     │       shadow (dark mode only)
           │                                  │
           │                                  │     Padding:
           │                         [Ghost]  │       --space-8 desktop
           │                        [Primary] │       --space-6 mobile
           ╰──────────────────────────────────╯
```

Canonical snippet:

```tsx
<Dialog.Root>
  <Dialog.Backdrop className="
    fixed inset-0 z-[var(--z-overlay)]
    bg-background/60 backdrop-blur-[var(--blur-md)]
    data-[state=open]:animate-in data-[state=open]:fade-in-0
    data-[state=closed]:animate-out data-[state=closed]:fade-out-0
    duration-[var(--duration-moderate)] ease-[var(--ease-standard)]
  " />
  <Dialog.Popup className="
    fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
    z-[var(--z-modal)]
    w-[calc(100%-var(--space-8))] max-w-[44rem]
    rounded-[var(--radius-md)]
    border border-border/30 bg-card
    p-[var(--space-6)] md:p-[var(--space-8)]
    dark:shadow-[var(--shadow-md)]
    data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98]
    data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.98]
    duration-[var(--duration-moderate)] ease-[var(--ease-emphasized)]
  ">
    <div className="flex items-start justify-between gap-[var(--space-6)]">
      <div>
        <Eyebrow>{kicker}</Eyebrow>
        <SubsectionTitle className="mt-[var(--space-2)]">{title}</SubsectionTitle>
      </div>
      <Dialog.Close aria-label="Close" className="/* icon button */" />
    </div>

    <div className="mt-[var(--space-6)]">{body}</div>

    <div className="mt-[var(--space-8)] flex items-center justify-end gap-[var(--space-3)]">
      {secondary}
      {primary}
    </div>
  </Dialog.Popup>
</Dialog.Root>
```

Header, body, footer are distinct regions with `--space-6` / `--space-8` separation — never crammed.

### 22.3 Sheet canon

- Slide from the right edge on desktop (width: `min(32rem, 100vw - 4rem)`).
- Slide from the bottom on mobile (height: `auto`, max `85vh`).
- Drag handle bar on mobile only (4rem wide, `--space-1` thick, `muted-foreground/30`).
- Scroll lives inside the sheet body; header and footer stick.

### 22.4 Popover canon

- Radius: `--radius-sm`.
- Border: `border-border/30`, `bg-card`.
- Shadow: `--shadow-sm` in both modes (popovers float above content; shadow earns its keep here).
- Padding: `--space-3` to `--space-4`.
- Arrow: off. Hideaway popovers don't use pointer arrows.

### 22.5 Animation recipe

All three surfaces share the same timing vocabulary:

| Property | Duration | Easing |
|---|---|---|
| Overlay fade | `--duration-moderate` (250ms) | `--ease-standard` |
| Modal zoom-in | `--duration-moderate` | `--ease-emphasized` |
| Sheet slide-in | `--duration-moderate` | `--ease-emphasized` |
| Popover fade-in | `--duration-base` (200ms) | `--ease-decelerate` |
| Any close | `--duration-fast` (150ms) | `--ease-accelerate` |

Exit is always faster than entry (user has decided; get out of the way).

### 22.6 Focus & accessibility (quick pointers; full a11y spec in Iter 5)

- Focus trapped inside while open.
- `ESC` closes.
- Return focus to the trigger on close.
- Body scroll locked (respect `data-lenis-prevent`).
- `aria-modal="true"` on dialog surface.
- First focusable element inside gets focus on open — unless it's destructive, in which case focus the cancel button.

### 22.7 Forbidden

- Nested modals. If you need "another modal after this one", you need a multi-step modal.
- Modals that also act as route screens. Use a real page.
- Fullscreen sheets masquerading as modals.
- Tooltips with interactive content. If it's interactive, it's a popover.
- Popovers with overlay backdrops.
- Modal widths over `56rem`. If the content doesn't fit, it's a page, not a modal.
- Autoplay or video heroes inside modals.

---

## 23. Command palette (CMDK)

The command palette is Hideaway's stealthiest affordance — a quiet piece of product-power. It lives at `⌘K` / `Ctrl+K` everywhere, and its aesthetic is **search as literature**.

### 23.1 Structural contract

```
                 Backdrop: bg-background/50 backdrop-blur-[var(--blur-lg)]
   ╭─────────────────────────────────────────────╮
   │ ⌕  Search the Hideaway                      │   ← Input row: framed variant, text-lg
   ├─────────────────────────────────────────────┤
   │ ESSAYS                                      │   ← Group header: Eyebrow
   │   On silence and saving                     │   ← Item rows
   │   A library of quiet things                 │
   │                                             │
   │ LISTS                                       │
   │   Compilations · 12                         │
   │                                             │
   │ ACTIONS                                     │
   │   Toggle theme                        ⌘⇧T   │
   │   Go to library                       g l   │
   ╰─────────────────────────────────────────────╯
   └── width: max-w-[56rem]
   └── bg-card
   └── border border-border/30
   └── rounded-[var(--radius-md)]
   └── max-height: 70vh, scroll inside results
```

### 23.2 Row recipe

```tsx
<div data-selected={selected} className="
  flex items-center gap-[var(--space-3)]
  px-[var(--space-4)] py-[var(--space-3)]
  rounded-[var(--radius-xs)]
  text-foreground/80
  data-[selected=true]:bg-muted/30
  data-[selected=true]:text-foreground
  transition-[background-color,color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]
">
  <Icon className="size-[1.6rem] text-muted-foreground/60" strokeWidth={1.5} />
  <span className="flex-1 truncate text-md">{label}</span>
  {shortcut && <Kbd>{shortcut}</Kbd>}
</div>
```

### 23.3 Group headers

Groups use `<Eyebrow>` styling, separated from their items by `--space-2`, and from the previous group by `--space-5`.

### 23.4 Keyboard contract (non-negotiable)

| Key | Action |
|---|---|
| `↑` / `↓` | Move selection |
| `Enter` | Execute selected |
| `Escape` | Close |
| `⌘K` / `Ctrl+K` | Toggle open from anywhere |
| `⌘Enter` | Execute in new tab (when applicable) |
| `Tab` | Cycle groups (not items) |

### 23.5 Empty & loading

- **Empty query:** show recent + suggested. Groups: "Recent", "For you", "Try". Never a blank state.
- **Zero results:** single centered block — `⌕` glyph at opacity 0.08, "Nothing found", "Try different words or `⌘` + action."
- **Loading:** no spinner. Results update progressively, and a top-of-results hairline `--rouge/50` progress bar animates during network fetch.

### 23.6 Forbidden

- Category tabs in the command palette. Filters live in the input as tokens (`type:essay silence`).
- Right-aligned badges that aren't shortcuts.
- Rainbow category tint dots. Categories are text, always.
- Closing on scroll. Palette is modal until the user dismisses.

---

## 24. Navigation

### 24.1 Taxonomy

| Surface | Role | Pattern |
|---|---|---|
| **Global nav** | Cross-app identity + access | Top-ribbon, monospace, opacity-tiered |
| **Section nav** | Intra-section tabs (e.g. Library → Saved/Lists/Highlights) | Inline row, underline indicator |
| **Breadcrumbs** | Rare — only in CMS / deep admin | Mono, `›` separator |
| **Footer nav** | Long-tail links + legal | Editorial columns |
| **Side rail** | `/vault` admin only | Full-height, icon + label |

### 24.2 Global nav anatomy

```
[ ⌂ THE HIDEAWAY ]      Essays · Surf · Radio · Lists      [ ⌕ ] [ avatar ]
```

- Left: brand mark (wordmark in `Narcissian Nectare`, mono `ESTD` suffix optional).
- Center: primary sections, mono uppercase, `--text-xs`, tracking `0.12em`.
- Right: search trigger (`⌘K` opener) + session affordance.

Canonical nav link:

```tsx
<Link
  href={href}
  className="
    font-mono text-xs uppercase tracking-[0.12em]
    text-foreground/60
    hover:text-foreground
    aria-[current=page]:text-foreground
    transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)]
  "
>
  {label}
</Link>
```

Active state is **text opacity change only** — no underline by default, no pill background, no border. If an active indicator is needed (tabs), use a 1px underline that animates via shared `layoutId`.

### 24.3 Tab indicator (section nav)

```tsx
<nav className="relative flex gap-[var(--space-6)] border-b border-border/30">
  {tabs.map(t => (
    <NavLink key={t.id} href={t.href} className="relative py-[var(--space-4)]">
      {t.label}
      {active === t.id && (
        <motion.span
          layoutId="tab-indicator"
          className="absolute inset-x-0 -bottom-px h-px bg-foreground"
        />
      )}
    </NavLink>
  ))}
</nav>
```

Underline is **1px**, `bg-foreground` (not accent). The indicator is the affordance; color isn't.

### 24.4 Mobile navigation

- Global nav collapses into a bottom-right icon button that opens a sheet from the right.
- Sheet contents: primary sections as large mono labels (`text-2xl font-mono uppercase tracking-tight`), one per row, generous vertical rhythm (`--space-6` between items).
- No hamburger icon triple-bar in the top bar. Top bar collapses to brand-only on mobile.

### 24.5 Footer nav

Footer is editorial — a short essay + three columns + legal line.

```
   Column 1: The Hideaway    Column 2: Catalog       Column 3: Account
   About                     Essays                  Plans
   Manifesto                 Surf                    Sign in
   Press                     Radio                   Preferences
                             Lists

   ──────────────────────────────────────────────────────────────
   © 2026 Hideaway · Seoul      Terms · Privacy · Contact
```

- Column headers: `<Eyebrow>`.
- Column links: mono, `text-xs`, tracking `0.12em`, `text-foreground/70`, hover → `/100`.
- Divider: `border-border/20`, single hairline.
- Legal line: `font-mono text-[1.0rem] tracking-[0.1em] text-muted-foreground/50`.

### 24.6 Forbidden navigation patterns

- Filled active-state pills in nav.
- Hover background tints under nav items ("block hover" — never).
- Brand mark drop-shadows.
- Hamburger icons on desktop.
- Mega-menus. If you need a second level, it's a page with tabs.
- Sidebar navigation on content pages. Sidebars are reserved for `/vault` admin.

---

## 25. Motion principles

Motion at The Hideaway **clarifies relationships** — it never performs. A transition tells you where something came from, where it went, or what it is doing right now. If motion is not answering one of those three questions, it is noise.

### Governing rules

1. **Motion is diegetic.** Every transition models a physical (or spatial) fact — panels come from where they live; scrolling-in reveals what was always there; dismissal goes toward the exit. Elements never teleport.
2. **Exit is always faster than entry.** Entries deserve to be read; exits should get out of the way. Canonical: `--duration-moderate` in → `--duration-fast` out.
3. **Bounce is for arrival, not emphasis.** Springs (`bounce: 0.1–0.2`) are used on entry and layout settles. Never on exit, drag, or scroll-linked motion.
4. **One motion per surface per beat.** If two things need to move, stagger them (≤ 40ms per child, capped at 6 children — after that, collapse into a single grouped reveal).
5. **No motion for motion's sake.** Looping, idle, "breathing" animations are banned outside the radio player's cassette-reel and the tour's pointer. If you cannot answer *"what does this explain?"*, delete it.
6. **Scroll-linked motion obeys the viewport, not the clock.** Parallax and scroll-triggers use `IntersectionObserver` or scroll-driven animations — never `setInterval`-driven wrappers.

### The five motion archetypes

Every animation in the app should be one of these five and no more:

| Archetype | Purpose | Canonical tokens | Example |
|---|---|---|---|
| **Reveal** | Bringing new content into the current surface | `--duration-moderate` + `--ease-decelerate`, `opacity 0→1 + translateY(8px→0)` | Page transitions, tab content swap, list items on mount |
| **Dismiss** | Removing content from the current surface | `--duration-fast` + `--ease-accelerate`, `opacity 1→0 + translateY(0→4px)` | Closing toasts, removing highlights, unstaging items |
| **Arrive** | Introducing a new surface *from elsewhere* | `--duration-moderate` + spring (`bounce: 0.1`) | Modal entry, sheet entry, popover open, notification slide-in |
| **Carry** | Moving an element that persists between states | `--duration-slow` + `--ease-emphasized` with `layoutId` | Tab indicators, shared-element transitions, expanding cards |
| **Linger** | A micro-delay that says *"hold, I'm computing"* | `--duration-fast` + `--ease-standard`, ≤ 120ms | Button press states, hover reveals, focus rings settling |

Anything that doesn't map onto one of these five is being over-designed.

### Timing ladder (the only durations we use)

```
--duration-instant    60ms    pointer-press feedback, focus ring
--duration-fast      120ms    hover, exit, micro-reveals
--duration-moderate  220ms    default — modals, panels, tabs
--duration-slow      360ms    carries, shared elements, hero wipes
--duration-stately   560ms    once-per-session moments (page chrome, onboarding step advance)
```

**Never use durations between these values.** Every ad-hoc `duration-300ms` is design drift.

### Easing ladder

```
--ease-standard      cubic-bezier(0.2, 0, 0, 1)        default — reveal, in-place change
--ease-decelerate    cubic-bezier(0, 0, 0, 1)           enters, slides-in
--ease-accelerate    cubic-bezier(0.3, 0, 1, 1)         exits, dismisses, fly-outs
--ease-emphasized    cubic-bezier(0.2, 0, 0, 1.15)      carries, layout settles (subtle overshoot)
--ease-linear        linear                             progress bars, scrubbing, scroll-linked only
```

Any imported easing (`ease-out-power2`, `power3.inOut`, custom GSAP curves) is legacy and should resolve to one of these five via the Audit.

### Stagger rules

```ts
// Canonical list-entry stagger
transition={{
  type: "spring",
  bounce: 0.1,
  delay: Math.min(index, 5) * 0.04, // cap at 6 children (240ms max)
}}
```

- Cap at **6 children**. After 6, the stagger reads as lag, not rhythm.
- For > 6 items, use a **single grouped reveal** (container fades/translates once) and let the items inherit.
- Never stagger on exit. Exits dismiss all children simultaneously at `--duration-fast`.

### Scroll-linked motion

| Use | Don't use |
|---|---|
| `IntersectionObserver` for in-view triggers | `scroll` listeners with manual math |
| CSS `animation-timeline: scroll()` where supported | `requestAnimationFrame` scroll hijacks |
| GSAP `ScrollTrigger` (already in the stack) for pinned sections | Ad-hoc scroll wrappers reinventing the above |
| `will-change: transform` *narrowly* and removed after | `will-change: transform` on permanent elements |

Parallax is allowed on hero images and the home page only. Never on list items, cards, or body copy.

### Reduced motion (non-negotiable)

Respect `prefers-reduced-motion: reduce` absolutely. When set:

- **Reveals** collapse to `opacity 0→1` only (no translate).
- **Arrive/Dismiss** collapse to `opacity` only (no translate, no scale, no spring).
- **Carry** still uses `layoutId` but with `--duration-instant` — the relationship is preserved, the showmanship is dropped.
- **Linger** is preserved — it provides affordance feedback.
- **Scroll-linked motion** is disabled entirely. Parallax is off. Pinned sections become normal-flow sections.

Canonical hook:
```ts
// src/hooks/useReducedMotion.ts (canonical — do not re-implement)
const prefersReducedMotion = useReducedMotion();
const duration = prefersReducedMotion ? 0 : /* normal duration */;
```

All Motion (Framer) animations in the app should route through this hook. GSAP timelines should check `gsap.matchMedia({ "(prefers-reduced-motion: reduce)": ... })`.

### Banned motion patterns

- **Looping idle animations** (pulses, breathes, glows) outside the radio-player reel and tour pointer.
- **Page-load shimmer on content.** We use typographic silence (see §21 loading).
- **Ken Burns zoom on hero images.** Static is stronger.
- **Flip-card hovers.** Depth comes from typography and border weight, not 3D.
- **Count-up numbers.** If a number matters, it is stated; not animated toward.
- **Auto-playing marquees of logos / testimonials.** The site is not a trade show booth.
- **Bounce on exit.** Exits use `--ease-accelerate` — nothing else.

### When to reach for GSAP vs. Motion (Framer)

| Task | Use |
|---|---|
| Component mount/unmount, layout transitions, shared elements | **Motion** (`motion/react`, `motion/react-m`) |
| Tab indicators, layout-id shared transitions | **Motion** + `LayoutGroup` |
| Scroll-pinned sections, multi-step timelines, hero wipes | **GSAP** + `ScrollTrigger` |
| Physics (radio tape reel, Highlightr confetti-like effects) | **Motion** (`bounce`, spring) or Rapier if 3D |
| Scrubbable scroll video / hero | **GSAP** `ScrollTrigger` with `scrub: 1` |

Default is Motion. Reach for GSAP only when the timeline is multi-step and scroll-bound — do not sprinkle GSAP into component-level interactions.

---

## 26. Iconography

The Hideaway is typography-first. **Icons are the exception, not the rule** — most UI labels should be words. When an icon must appear, it behaves like a piece of type, not decoration.

### Icon set policy

**Canonical set: Lucide React** (already in the stack).

- **One family only.** Do not mix Lucide with Heroicons, Radix icons, custom SVGs, or emoji-as-icon. Every exception must be tracked in the Audit.
- **Custom SVGs are allowed** in three cases: (1) the brand mark, (2) a shape no icon set has (e.g., the cassette reel, the compilation stamp), (3) the typographic glyph registry (see §21 empty states).
- **No emoji in UI.** Emoji render inconsistently across OSes and read as brand-less. The only exception: user-generated content (comments, annotations) where emoji is user input.

### Stroke weight

Lucide ships `strokeWidth={2}` by default. **We use `strokeWidth={1.5}` globally** — this aligns with `font-light` display and `font-medium` card titles, and avoids the "heavy checkmark" feeling that makes SaaS UIs look chunky.

```tsx
// Global icon default — set once via an <Icon /> wrapper or prop spread
<Icon strokeWidth={1.5} />
```

Never pass `strokeWidth={1}` (too fragile on retina) or `strokeWidth={2.5}+` (reads as "app-y").

### Icon sizes (the only four)

```
icon-xs    12px  (0.75rem)   inline-with-text metadata, badges
icon-sm    14px  (0.875rem)  inline-with-text body copy, input adornments
icon-md    16px  (1rem)      default — buttons, nav, list items
icon-lg    20px  (1.25rem)   emphasized controls, header actions
```

**Banned sizes:** `10px` (unreadable), `18px` (drift between sm/md), `22px` / `24px` / `28px` (too assertive — replace with typographic glyph instead).

Icons larger than 20px belong in the **typographic glyph registry** (§21) — they are typography, not icons.

### Icon color

Icons inherit `color` from their text context via `currentColor`. Never hardcode a fill.

```tsx
// CORRECT — inherits from parent
<span className="text-foreground/70">
  <Icon className="size-[var(--icon-md)]" />
</span>

// WRONG — breaks the opacity-as-tone discipline
<Icon className="text-foreground" />
```

### Icon-plus-label composition

Default pattern: **icon leads, label follows, same baseline.**

```tsx
<button className="inline-flex items-center gap-[var(--space-2)]">
  <Icon className="size-[var(--icon-md)]" strokeWidth={1.5} />
  <span className="font-mono text-xs uppercase tracking-[0.12em]">Save</span>
</button>
```

- Gap is always `--space-2` (8px) — no other spacing between icon and label.
- If the label wraps to two lines, the icon aligns to the **top** of the first line, not centered.
- Icon-only buttons (no visible label) are banned in global nav. They are allowed in:
  - Toolbar inside an editor (tooltip-labeled)
  - Card context menus (the three-dot `⋯`)
  - Icon-only close buttons on modals/panels (`×`, with aria-label)

### Typographic glyphs (the preferred "icon")

For empty states, section markers, and decorative anchors, **use a glyph instead of an icon**. This keeps the page typographic and avoids the "app dashboard" vibe.

| Glyph | Meaning | Where |
|---|---|---|
| `◫` | Saved / bookmarks | Library saved state |
| `⊞` | Lists / collections | Library lists state |
| `○` | Profile / person | Empty user grid |
| `⌕` | Search | No results |
| `¶` | Prose / essay | Empty essay feed |
| `◉` | Radio / sound | Empty radio queue |
| `◌` | Draft / unpublished | Empty drafts |
| `▲` | Error / caution | Page-level errors |
| `◇` | Highlight / annotation | Empty Highlightr list |
| `§` | Section anchor | Rare — long-form anchors |
| `※` | Note / aside | Microcopy accent |

Glyphs are always monospace, `font-light`, opacity 0.1 for background/hero use, opacity 0.4–0.7 for inline use. See §21 for placement rules.

### Icon accessibility

- Decorative icon (label visible): `aria-hidden="true"`.
- Icon-only control: `aria-label="<verb-phrase>"` matching microcopy voice (§27).
- Status icons (e.g., check in a filled step): `role="img"` + `aria-label`.
- Never rely on icon-alone to convey state that cannot be inferred from context — pair with color AND a text label AND structure.

### Banned iconography patterns

- **Two-tone / duotone icons.** Breaks opacity discipline.
- **Filled icons mixed with outline icons** in the same surface.
- **Emoji-as-chrome** (🚀, ✨, 🔥 in UI headers / buttons).
- **Large decorative icons** (> 20px) as section hero. Use a typographic glyph or a real image.
- **Icons inside body paragraphs** ("Click the 🔍 icon to search"). Reference the control by its label instead.
- **Animated icons on hover.** One exception: the radio play/pause glyph, which crossfades.

---

## 27. Microcopy & voice

The Hideaway speaks like **a careful editor, not a cheerful assistant**. Its tone is literate, specific, and quiet. It assumes the reader is intelligent and has arrived on purpose.

### Voice principles

1. **Declarative, not hortatory.** State what is, not what the user should do. "Saved." not "Great — your item has been saved!"
2. **Specific, not generic.** "No essays tagged *melancholia*" beats "No results found."
3. **Spare, not terse.** The goal is ≤ 12 words per sentence, not telegraphic chop. Full sentences, no abbreviations.
4. **Human, not brand-voiced.** Never "The Hideaway thinks…", never "we're working on it." First-person plural only in policy / legal text.
5. **Confident, not apologetic.** No "Oops," "Sorry,", "Uh oh," "Whoops." Errors are named, not cushioned.
6. **Typographic, not emotive.** No exclamation marks outside of quoted speech. No emoji. No ALL CAPS outside of the mono-label convention.
7. **Literary where natural, never twee.** Editorial references (e.g., "The room is empty," "Nothing here yet — pull a thread") are welcome if they are specific and not whimsical.

### Tone calibration (examples)

| Situation | Wrong (SaaS) | Right (Hideaway) |
|---|---|---|
| Empty bookmarks | "You haven't saved anything yet! Start exploring 🚀" | "Nothing saved yet." |
| Successful save | "Awesome! Your item has been saved!" | "Saved." |
| Form validation | "Oops! Looks like that email isn't valid." | "Email address is not recognized." |
| 404 page | "Uh oh! This page doesn't exist." | "This page is not here." |
| 500 error | "Something went wrong. Please try again!" | "The server is not responding. Try again in a moment." |
| Confirm destructive | "Are you sure you want to delete? This can't be undone!" | "Delete this list. This cannot be undone." |
| Loading | "Loading awesomeness…" | (silence — see §21) |
| Onboarding CTA | "Let's get started! 🎉" | "Begin." |
| Email subscribe | "Join 10,000+ curious readers!" | "Receive dispatches." |
| Notification toast | "✅ Profile updated successfully!" | "Profile updated." |

### Button labels

Buttons are **verbs**. Always verbs. Never nouns, never sentences.

**Canonical verbs (primary):** `Save`, `Send`, `Publish`, `Open`, `Begin`, `Continue`, `Close`, `Delete`, `Remove`, `Follow`, `Subscribe`, `Sign in`, `Sign up`, `Listen`, `Read`.

**Banned button labels:** `OK`, `Submit`, `Click here`, `Go`, `Next →` (use `Continue`), `Let's go`, `Get started` (use `Begin`), `Learn more` (say what — `Read the essay`, `About the plan`).

Casing: **Sentence case** for sentence-like labels ("Sign in", "Publish essay"). **Mono-upper** for global-nav and page-nav labels, per §24.

### Form field labels

- **Sentence case.** "Email address", not "Email Address" and not "EMAIL".
- **Descriptive, not placeholder-only.** Never use placeholder as the label — labels must persist.
- **Optional marker: the word "(optional)"** in mono, right-of-label. Never `*` for required.

### Errors

Errors name the problem in the system's terms, not the user's fault.

| Situation | Message |
|---|---|
| Network down | "No connection. The network appears to be offline." |
| Server 500 | "The server is not responding." |
| Validation fail | "Email address is not recognized." / "Password must be at least 12 characters." |
| Auth expired | "This session has expired. Sign in to continue." |
| Not found | "This page is not here." / "This essay has been moved or removed." |
| Permission denied | "This requires a Patron subscription." (with a Link, not a marketing pitch) |

Never:
- "Oops,", "Sorry,", "Unfortunately," prefixes.
- Stack-trace-leaking content: "undefined is not a function", "ECONNREFUSED".
- "Please contact support" without giving a specific next step.

### Empty states

Empty states are two lines: **a glyph + a single sentence**. No two paragraphs of text, no marketing pitch. Optional: a single quiet CTA.

```
    ◫
   Nothing saved yet.
   [ Read an essay → ]
```

Avoid: "Start your journey!", "Discover amazing content!", any use of "journey", "discover", "amazing", "awesome".

### Bilingual considerations (EN / KO)

- **Mirror structure, don't translate word-by-word.** Korean reads more naturally with implied subjects; keep it that way.
- **Korean sentence endings** prefer the `-합니다` form in UI chrome (polite, editorial) and `-해요` form in user-facing prompts (warm-professional). Never `-해` (too casual for the brand).
- **Button verbs in Korean** use the `-기` nominal form for quiet labels (`저장하기`, `읽기`) or the `-하다` stem imperative for action (`저장`, `읽기` — prefer nominal in monospace chrome).
- **Numbers, measurements, dates** stay Arabic numerals. Korean counters (개, 번, 편) only in body copy, never in mono chrome.
- **Capitalization policy does not translate.** Korean has no case — use the `font-mono uppercase tracking-[0.12em]` rule with letter-spacing **set to 0** for Korean, because tracked Hangul reads as broken.
- **Line length.** Korean at the same font size packs ~30% more meaning per line than English. Narrow prose containers (`--container-prose`) work for both without adjustment, but hero headlines in Korean need a `max-ch` constraint of ~18 (vs. 24 for English).

### Bilingual copy pairs (reference)

| Function | English | Korean |
|---|---|---|
| Save (mono chrome) | `SAVE` | `저장` |
| Read (primary) | `Read the essay` | `에세이 읽기` |
| Empty (bookmarks) | `Nothing saved yet.` | `아직 저장된 글이 없습니다.` |
| 404 | `This page is not here.` | `이 페이지는 없습니다.` |
| Confirm delete | `Delete this list. This cannot be undone.` | `이 리스트를 삭제합니다. 되돌릴 수 없습니다.` |
| Subscribe | `Receive dispatches.` | `소식 받기.` |

### Banned words (site-wide)

Across all English copy:

> `awesome`, `amazing`, `journey`, `discover`, `seamless`, `empower`, `leverage`, `unlock`, `unleash`, `delight`, `boost`, `hustle`, `crush`, `rockstar`, `ninja`, `guru`, `effortless`, `unmatched`, `revolutionize`, `disrupt`, `game-changing`, `best-in-class`, `top-notch`, `world-class`.

These words signal a product, not a room.

### Tense, voice, punctuation

- **Present tense.** "Your profile is saved.", not "Your profile has been saved."
- **Active voice**, except when the agent is the system ("The server is not responding.").
- **Serial comma** yes.
- **Em dashes** sparingly, in prose copy only — never in UI microcopy.
- **Period at end of sentences** yes, even one-line empty-state copy.
- **No period** at the end of button labels or chrome labels.

---

## 28. Accessibility commitments

Accessibility is not a compliance layer; it is part of the editorial discipline. If a page is not navigable without a mouse, it is not finished.

### WCAG target

**WCAG 2.2 AA is the floor.** Specific surfaces (Highlightr reading view, Radio player) commit to AAA contrast and keyboard parity.

### Contrast floors

| Surface | Ratio | Notes |
|---|---|---|
| Body text on `bg-background` | ≥ 7:1 | AAA — this is reading copy |
| Body text on `bg-card` | ≥ 4.5:1 | AA — secondary surfaces |
| Muted text (`text-muted-foreground`) on background | ≥ 4.5:1 | AA — must still pass even at opacity |
| Chrome labels (`font-mono` uppercase) | ≥ 4.5:1 | AA — includes the `text-foreground/70` variant |
| Decorative glyphs at opacity 0.1 | no minimum | must never carry meaning alone |
| Focus ring against any surface | ≥ 3:1 | strictly enforced |

**Rule:** When you dial down opacity for tone (`text-foreground/70`, `/60`, `/40`), verify the effective contrast against the surface the element sits on. `/40` on `bg-background` fails AA — it is for glyph/ambient use only.

### Focus rings

Focus rings are **always visible on keyboard focus, never visible on pointer click**.

```tsx
// Canonical focus recipe
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
```

Rules:
- **Never remove the focus ring without replacing it.** Browser-default outlines are acceptable until replaced.
- **Ring color: `foreground/70`** — neutral, always visible. Never rouge (our only accent is reserved for status, not focus).
- **Ring offset matches the surface** — `--ring-offset-background` on background, `--ring-offset-card` on cards.
- **No custom focus styles per component.** The recipe above is the single canonical pattern.

### Keyboard interaction matrix (non-negotiable)

| Element | Keys |
|---|---|
| Button | `Enter`, `Space` |
| Link | `Enter` |
| Checkbox / Switch | `Space` |
| Radio group | `↑ ↓` or `← →` within group, `Tab` between groups |
| Select / Combobox | `Enter` to open, `↑ ↓` to navigate, `Esc` to close, `Enter` to select |
| Tabs | `← →` to navigate, `Home/End` for first/last, `Tab` to enter panel |
| Modal / Dialog | `Esc` to close, `Tab` trapped inside |
| Sheet | `Esc` to close, `Tab` trapped inside |
| Popover | `Esc` to close, `Tab` to exit (not trapped) |
| Menu | `↑ ↓` navigate, `Enter` select, `Esc` close, typeahead |
| Command palette | see §23 — `⌘K ↑ ↓ Enter Esc Tab ⌘Enter` |

All interactive components in `src/components/ui/` **must** implement this matrix. Drift here counts as a bug, not a feature request.

### Tab order

- **DOM order defines tab order.** Never use `tabindex > 0`.
- **`tabindex="-1"`** is acceptable for programmatically-focused containers (modals on open, toasts on appear).
- **Skip link** at the top of every page: `<a href="#main" className="sr-only focus:not-sr-only ...">Skip to content</a>` — canonical utility lives in `src/components/a11y/SkipLink.tsx`.

### Screen-reader contract

- **Every image has `alt`.** Decorative: `alt=""`. Content: describes the content, not the file (`"Portrait of Sontag, black-and-white"` not `"sontag_bw.jpg"`).
- **Every icon-only control has `aria-label`.** Matching microcopy voice (§27) — verbs, not nouns.
- **Live regions** for toasts and loading completion: `role="status" aria-live="polite"`. Use `aria-live="assertive"` only for destructive confirmations.
- **Landmarks.** Every page has `<header>`, `<main>`, `<footer>`. Never wrap these in `<div role="main">` — use the element.
- **Heading order is strict.** One `<h1>` per page. Never skip levels (`<h2>` → `<h4>`).
- **Form fields have labels.** Always via `<label htmlFor>` — never placeholder-as-label. Error text uses `aria-describedby` and inputs get `aria-invalid="true"`.

### Color-independence

Color never carries meaning alone. Every status is reinforced by:

- A text label ("Saved", "Error", "Unread")
- A glyph or icon (§26)
- A structural change (border weight, container)

Red (`--destructive`) and rouge (`--accent`) must always pair with a word or glyph. Color-blind users must be able to use every flow.

### Reduced motion

See §25. This is also an a11y commitment — not just an aesthetic preference. Routing all Motion and GSAP through the canonical hooks is mandatory.

### Reduced transparency (macOS)

For users who set `prefers-reduced-transparency: reduce`:
- **Backdrops** (`bg-background/80`, `bg-background/90`) become fully opaque.
- **Glass overlays** collapse to solid `bg-card` or `bg-background`.
- **Blur** (`backdrop-blur-*`) is dropped.

Canonical:
```css
@media (prefers-reduced-transparency: reduce) {
  .hdw-backdrop { background: var(--background); backdrop-filter: none; }
}
```

### Forced colors / high-contrast mode

- **Every interactive element specifies a visible border or outline** (not just background-color change) so forced-colors mode preserves affordance.
- **Never rely on shadow** as the only surface-separator.
- Honor `@media (forced-colors: active)` by letting system colors win (`forced-color-adjust: auto`).

### Touch targets

Minimum **44 × 44 px** for every interactive target on touch breakpoints (`<lg`). This is the reason button sizes collapse to `h-[var(--space-11)]` (44px) at small viewports even when their density could be lower. Density earned at desktop never comes at the cost of mobile touch affordance.

### Language attributes

- `<html lang="en">` or `<html lang="ko">` set per locale at the route level.
- Inline foreign-language spans use `<span lang="ko">…</span>` — especially for EN pages that quote Korean text, and vice versa. Screen readers switch voice accordingly.

### Commitments we make (public-facing)

These are statements we stand behind and would publish on an accessibility page:

1. Every critical flow (sign-in, read an essay, save an item, subscribe to a plan) is fully keyboard-operable.
2. Body text meets AAA contrast on the primary reading surface.
3. Motion and transparency reduce to text-first fallbacks.
4. The admin panel (`/vault`) is held to AA — no exceptions.
5. We test with VoiceOver (macOS / iOS) and NVDA (Windows) as part of release. Keyboard-only testing on every PR touching `src/components/ui/` or `src/components/core/`.

### A11y audit (resolves F-001..F-00x in Audit)

This section formalizes the a11y-related drift findings in `readmes/DESIGN_SYSTEM_AUDIT.md`. Remediation is tracked in the audit — reference F-ids in commits that address them.

---

## 29. Theming — light & dark

The Hideaway ships **both light and dark**, and **dark is the default**. Light is a considered alternate — not a first-draft lit version of dark. Each theme is designed, not computed.

### Default and switching

- **Default: dark.** On first visit, the site renders dark (matches the brand voice, matches the reading experience at night when most users read long-form).
- **Respect `prefers-color-scheme` on first visit only**, then defer to the user's explicit choice.
- **Explicit toggle** lives in account settings and in the CMDK palette (`⌘K` → "Switch theme"). Not in the global nav chrome.
- **Persisted** in `localStorage` under the canonical key `hdw:theme` with values `dark | light | system`.
- **No flash-of-wrong-theme.** The theme is applied on `<html>` before paint via an inline script in `<head>` (Next.js `layout.tsx`). This is non-negotiable.

### Theme ownership

Theming is implemented via:

- `<html class="dark">` or `<html class="light">` on the root
- `@theme` block in `src/styles/globals.css` declares tokens for each
- `next-themes` drives the toggle and persistence
- `src/providers/Theme/` wraps the app

**Never use `useTheme()` during SSR.** All theme-dependent rendering must be guarded by mount state or rendered identically in both themes on the server.

### Both themes are intentional

- **Dark is not "inverted light."** Shadows are softer, borders are fainter, typography may sit at slightly higher contrast weight.
- **Light is not "washed-out dark."** Light leans warm-paper, not clinical white. Text is near-black, not pure black.
- **Every token has a pair.** Tokens are declared in both blocks; there is no runtime computation or filter-based inversion. If a component looks right in one theme and wrong in the other, the component is wrong, not the theme.

### Token parity contract

Every semantic token listed in §3 **must** have both a `dark` and `light` value. The token name is the stable contract; the value differs. Drift here is a bug.

```css
@theme {
  --background: oklch(0.14 0 0);   /* dark — default */
  --foreground: oklch(0.96 0 0);
  --card:       oklch(0.17 0 0);
  /* ... */
}

.light {
  --background: oklch(0.98 0.005 90);  /* warm paper */
  --foreground: oklch(0.16 0 0);
  --card:       oklch(0.995 0.003 90);
  /* ... */
}
```

### Per-surface overrides

Some surfaces are **theme-locked**:

| Surface | Lock | Why |
|---|---|---|
| Radio player | dark always | The cassette deck is a photographic object; it reads as itself, not as UI chrome |
| Essay reading view | follows user theme | Reading is the primary act; user choice wins |
| Admin panel (`/vault`) | follows user theme | No special case |
| Marketing home hero | follows user theme (but with hand-tuned imagery per theme) | Imagery is re-selected per theme, not filtered |
| PDF invoices | light always | Printing context |
| Email templates | light always | Email clients can't be relied upon for dark-mode |

Theme-locked surfaces set their own root class locally (`<section className="dark">...`) — they do not read from `useTheme()`.

### Images and theme

- **Hero and editorial imagery** is theme-aware. We ship **two source files** and pick via `<picture>` + `media="(prefers-color-scheme: ...)"`. Never filter-invert an image.
- **Illustration / diagrams** in documentation use semantic tokens (`currentColor` + CSS custom props) so they theme automatically.
- **User-uploaded imagery** (avatars, essay covers) does not change per theme — user intent wins.

### Code samples in essays

Syntax highlighting ships two palettes — a dark palette aligned with the dark theme, a light palette aligned with the light theme. Both use the same semantic token names (`--code-keyword`, `--code-string`, …). The palette is swapped by `html.light` / `html.dark`.

### Focus, states, and theme

- **Focus ring color** (`foreground/70`) adapts automatically — it resolves to the right value per theme without any per-theme override.
- **Hover, active, disabled** all use opacity-as-tone and adapt automatically.
- **Selection color** (`::selection`) is `--accent / 0.25` on both themes — rouge at low opacity works in either.

### Dark-mode shadows

Shadows on dark surfaces are **less visible** — they become inner highlights or border pairs, not drop shadows. See §7. The token `--shadow-sm` on dark resolves to `0 0 0 1px rgb(255 255 255 / 0.04)` rather than a softening drop shadow.

### Theme-aware `color-scheme`

Always declare `color-scheme` so native controls (scrollbars, date pickers, form controls) match:

```css
html { color-scheme: dark; }
html.light { color-scheme: light; }
```

### Forced theme (niche)

Some routes may force a theme regardless of user preference (marketing pages that are visually theme-locked, brand partners' embedded widgets). These routes use `<html className="dark" data-theme-forced>` and **disable the toggle UI** on that surface only. This is an escape hatch, not a common pattern.

### Testing

- **Snapshot every critical surface in both themes.** Login, home, essay reading view, library, plans, admin. Visual regression catches theme drift earlier than any eyeball review.
- **Accessibility checks run on both themes.** Contrast is checked per theme; passing one does not pass both.

### Banned theming patterns

- **CSS filter inversion** (`filter: invert(1)`) as a "dark mode" shortcut.
- **Runtime-computed colors** (`lighten()`, `darken()` functions reading token values at runtime).
- **Theme-specific hardcoded hex** in components. Always read from tokens.
- **`useTheme()` gating above-the-fold content** without mount-safety guards — causes hydration mismatch and flash.
- **Separate dark/light component files** (`ButtonDark.tsx`, `ButtonLight.tsx`). One component, token-driven.

---

## 30. Reference criteria & curated library

We do not copy references. We extract **specific, decomposable patterns** — and only after confirming the pattern serves one of the Seven Disciplines. This section exists so external inspiration never enters the codebase as cargo.

### Why this section exists (the user's original directive)

Reference-gathering was deliberately deferred until the system was articulated. You cannot choose good references without knowing what you are measuring them against. Now that §1–§29 exist, this section closes the loop: here is the rubric, here is the curated shortlist, here is the reject pile.

### The rubric (Accept / Borrow / Reject)

For every external reference, evaluate on five axes. **A reference is only adopted when it scores ≥ 3 "Accept" across the five.**

| Axis | Accept | Borrow a pattern | Reject |
|---|---|---|---|
| **Aesthetic fit** | Editorial, typographic-first, monochrome-with-charge | Productized but contains an isolatable editorial moment | Maximalist, loud color, gradient-forward |
| **Hierarchy logic** | Scale + weight + spacing drive the eye | One strong pattern (e.g., a grid, a header) worth extracting | Color-coded zones, "billboard" layouts |
| **Motion discipline** | Calm, diegetic, scroll-honest | A specific transition worth porting | Auto-playing, looping, scroll-hijacking |
| **Bilingual viability** | Tolerates Hangul without breaking | English-only but the structural pattern is language-agnostic | Letter-spacing / typography assumes Latin-only |
| **A11y posture** | Keyboard/SR-first visible in the implementation | A visual idea that can be re-implemented accessibly | Hover-only reveals, mouse-mandatory interactions |

**Borrow a pattern** means: extract the single isolatable idea, re-implement from scratch inside our token system. Never port HTML/CSS directly.

### Accepted references (the canonical library)

These references are **aligned enough** that multiple patterns are worth studying. They are not to be cloned; they are lenses.

| Reference | Why it's in the library | What we borrow | What we leave |
|---|---|---|---|
| **longblack.co** | Long-form content treated as object — cover, type, typography-led hierarchy | Card-as-object treatment, heavy covers, mono metadata strip, "issue" framing for series | Their illustrative covers (we use photographic or typographic glyphs) |
| **Are.na** | Monochrome, text-driven, index-of-things aesthetic; bilingual tolerance | Index/list density balance, channel/block typography, mono-label eyebrows, margin rhythm | Their beige warmth (we use cooler paper in light theme) |
| **Dirt (dirt.fyi) / The Browser** | Editorial newsletter-as-site — restraint, typographic emphasis | Issue-based list layouts, dateline chrome, serif-for-body discipline (if we ever adopt a serif) | Their ad slots and substack scaffolding |
| **Metalab** | Restraint, whitespace, quiet product surfaces | Whitespace ratios around hero text, button border treatments, muted system messaging | Their agency-marketing scaffolding |
| **Teenage Engineering (product + site)** | Device-as-object photography, mono chrome, tactile minimalism | Object-lit photography on hero, small monospaced metadata stamps, "serial number"-style identifiers | Their hardware-product verticals (plans, specs) |
| **Apple (apple.com editorial surfaces only — e.g., Today at Apple, Apple News+)** | Typographic discipline, sectioned editorial rhythm, restraint at scale | Long-form article layouts, sectioned scroll rhythm, initial-letter fallbacks | Everything consumer-product-marketing (big product imagery, specs pages) |
| **Dieter Rams principles (not a site)** | The underlying grammar: "less, but better"; innovative yet unobtrusive | The ten principles, as a mental check on any proposed feature | n/a (they're principles, not pixels) |
| **Readymag editorial templates** | Editorial-grade magazine layouts on the web | Grid-breaking pull quotes, spread-style images, asymmetric composition in essay view | Their templating UI language |
| **Kottke.org / Craig Mod's posts** | Typography-first personal publishing, quiet UI, long-scroll respect | Marginalia, footnote treatment, "walk" article format, mono metadata | Personal-blog-only conventions |
| **GOV.UK** | A11y-first, keyboard-first, zero ornament, bilingual-capable | Focus-ring discipline, skip-link canon, form field pattern, 1:1 label-to-input fidelity | Their civic sans-serif (they're utility; we're editorial) |

### Reject pile (and why)

These references are **not** to be pulled from, even when tempting. Most of them have been suggested in prior sessions. They are recorded here so future sessions (and agents) stop re-litigating.

| Reference | Surface-level appeal | Why we reject |
|---|---|---|
| **Fey (Fey UI kit)** | Financial-dashboard aesthetic, dense mono chrome, chart discipline | **Scope mismatch.** Fey is a trading UI — its density, ticker-tape motion, and chart-forwardness are the opposite of editorial calm. The aesthetic overlap is superficial (mono chrome); the product DNA (dashboards for decisions) is the opposite of ours (rooms for reading). Revisit only if we ship a dedicated analytics surface. |
| **Linear** | Monochrome, crisp type, disciplined motion | Product-tool DNA. Tab-index-heavy, command-palette-centric, workspace-shaped — every surface is a database. We borrow *command palette* structure (see §23), not the look. |
| **Vercel / Resend marketing** | Typographic, monochrome, developer-editorial | They're product marketing; the typography is performative (massive hero text, aggressive display scale). We borrow *nothing* — the moment you copy Vercel's scale, the site stops reading like editorial. |
| **Awwwards winners (aggregate)** | Beautiful one-off microsites | 90%+ scroll-hijack, auto-play, idle animation, or gimmick-driven. Individual sites can make this library after passing the rubric; the aggregate cannot. |
| **Most Webflow showcase sites** | Editorial adjacency | Scroll-hijacked, animation-heavy, templated. The editorial veneer is cosmetic; the underlying patterns are all webflow-shaped. |
| **Apple product marketing (iPhone/Mac pages)** | Typographic mastery | The scroll-driven product parallax is the opposite of our motion ethic. Borrow from Apple *editorial* surfaces (see accepted list), not product pages. |
| **Medium** | Reading-first, type-first | Too generic-reader-by-now. Medium's design no longer carries meaning; it is the baseline Hideaway diverges from. |
| **Substack** | Reading + subscription | Newsletter funnel; community-first; chat-first. Our structure is the inverse. |
| **Notion** | Monochrome, type-first, clean | A tool for editing documents, not reading them. Our content is finished, not malleable. |
| **Brutalist / Neo-brutalist sites** | Editorial courage, anti-SaaS | Intentional ugliness, clashing color, chunky borders — violates Discipline 3 (Border over fill is quiet) and the single-accent rule. |
| **Glassmorphism-driven sites** | Depth | We use blur for backdrops, not as a hero treatment. A page built on glass cards violates Discipline 2 (Opacity as tone, not chrome). |
| **Dashboard-by-numbers admin UIs (Stripe dashboard, Linear insights)** | Information density | These are decision tools; we are a reading room. Admin (`/vault`) may borrow *data table* patterns from them; nothing else. |

### Patterns we are allowed to borrow (the concrete shortlist)

Distilled from the accepted library, these are the specific, isolatable patterns cleared for adoption. Anything outside this list requires running the rubric.

| Pattern | Source | Adopt in |
|---|---|---|
| Issue/volume framing for series (cover + issue number + mono dateline) | longblack.co, The Browser | Series & Compilations (§13 card variant) |
| Initial-letter fallback for missing hero imagery | Apple editorial, kottke.org | Heroes (§19) |
| Mono metadata strip under card title (byline · date · read time) | longblack.co, Are.na | Essay card, Surf card (§13) |
| Marginal footnotes / pull-quotes breaking the prose column | Craig Mod, Readymag | Essay reading view |
| Initial-capital drop-cap on essay open | Apple Books, print magazine canon | Essay reading view (optional, per-essay) |
| Skip link visible on first Tab press | GOV.UK | All pages (§28) |
| Command palette with grouped sections (Go to · Actions · Recents) | Linear, Raycast | §23 CMDK |
| "Recently viewed" siderail in admin | Stripe dashboard | `/vault` only |
| Asymmetric hero (image 60% / text 40%) with type spilling into image margin | Readymag, Metalab | Home hero, plan-landing hero |
| Mono serial-number stamp for object identifiers (nanoid display, issue number) | Teenage Engineering | Citations (Highlightr ref display), Compilations |
| Photographic object-lit imagery (flat light, shadow discipline) | Teenage Engineering, Apple editorial | Plans, Radio album hero |
| Ten-principle design-review checklist | Dieter Rams | This document's banned-pattern lists (already adopted implicitly) |

### Patterns we're explicitly choosing NOT to borrow

Even from accepted references:

- **Are.na's "blocks" surface pattern.** Hideaway content is finished, not collected. Do not build an Are.na-like drop zone.
- **Teenage Engineering's orange-and-cream chrome.** Our accent is rouge, our surfaces are neutral. Don't let the color palette in.
- **Metalab's project-case-study scroll.** We have no case studies. Case-study scroll patterns are off-limits.
- **Linear's keyboard-shortcut-first UX.** We expose shortcuts inside CMDK, not as a first-class navigation metaphor. Power-user UX is not the brand.

### When a new reference is proposed

The intake is explicit:

1. Run the 5-axis rubric (above). Record the scores.
2. If ≥ 3 Accept, add to "Accepted references" with the **specific pattern(s)** to study.
3. If 0–2 Accept and a pattern is still interesting, add to "Patterns we are allowed to borrow" — not to "Accepted references."
4. If 0 Accept, add to "Reject pile" with a one-line reason. This prevents re-litigation in the next session.
5. Commit the update with `docs(design): reference review — <name>` and cite the rubric scores.

### Banned sourcing behaviors

- **Pulling from Dribbble shots.** Shots are pictures, not patterns; without implementation it is impossible to verify motion, a11y, keyboard, and reduced-motion claims.
- **Porting HTML/CSS from external sources.** We re-implement inside our token system. Copy-pasted Tailwind classes are drift.
- **"The Fey thing."** Fey is rejected. Do not revisit without a new, specific product use case.
- **Training-data pattern-match.** If an agent proposes a UI and cannot cite a specific reference from the Accepted list or Allowed-patterns list, challenge the proposal; it is likely training-set drift, not a design decision.

---

## 31. How to use this document

This document is a **working instrument**, not a manifesto on a wall. Here is the contract between it and the people (and agents) who touch the codebase.

### For designers

1. **Start in §1–§2.** Everything downstream assumes you've internalized the manifesto and the seven disciplines.
2. **Token first, component second, pattern third.** When designing a new surface, reach for tokens (§3–§11) before reaching for a component. Reach for a component (§12–§16) before inventing a pattern.
3. **Run the banned-patterns list** at the end of each relevant section against your proposed design before presenting it.
4. **Any new token, new component, or new pattern** lands as an amendment here *first*, then in code. If it isn't in this doc, it isn't real.

### For engineers

1. **This document wins disagreements** between `globals.css`, `CLAUDE.md`, and itself.
2. **Before implementing UI**, read the relevant pattern section (§17–§24) and the component sections (§12–§16) it depends on.
3. **Use the canonical snippets as the starting point.** Don't ad-hoc. Every ad-hoc value is a future audit finding.
4. **When you discover drift** (an existing component violates the doc), either fix it in the same PR or record it in `readmes/DESIGN_SYSTEM_AUDIT.md` with a new F-id. Never leave drift silent.
5. **Route all motion through `useReducedMotion`** and all theme-dependent rendering through `next-themes` with mount guards. These are not suggestions.

### For agents (Claude Code, codegen assistants)

1. **Read this document before touching UI files.** It is the single most important context for any design-adjacent work, ahead of `CLAUDE.md` for pixel-level decisions.
2. **Cite section numbers in commit messages** when a change implements or reconciles a rule (e.g., "per §18 Sticky headers").
3. **Prefer "here is the rule" over "here is an example I found."** The training data is full of Tailwind and shadcn examples. This document overrides.
4. **When proposing a new pattern**, produce the rubric pass (§30) before the implementation. Don't smuggle references.
5. **When the user asks for a design**, confirm whether it is (a) adopting an existing pattern here, (b) extending a pattern (amendment needed), or (c) a new reference proposal (rubric needed). Ask if ambiguous.

### Decision tree: "I need a new UI surface"

```
Is it covered by an existing pattern (§17–§24)?
├── YES → Use the canonical snippet. Done.
└── NO  → Does it compose from existing components (§12–§16)?
         ├── YES → Compose. Document the composition if non-obvious. Done.
         └── NO  → Is there a principle covering it (§25–§29)?
                  ├── YES → Derive from the principle. Add a new pattern section to this doc. Done.
                  └── NO  → This is a new system surface. Run the reference rubric (§30) if inspiration is needed, then author a new section HERE FIRST, then implement.
```

### Decision tree: "A component in the codebase violates the doc"

```
Is the violation load-bearing (in production, user-facing)?
├── YES → Does fixing it fit in the current PR?
│         ├── YES → Fix. Cite the section in the commit.
│         └── NO  → Record in readmes/DESIGN_SYSTEM_AUDIT.md with a new F-id. Cite in the PR description.
└── NO  → Fix in the current PR or open a follow-up. Don't leave drift.
```

### Common deltas (quick reference)

When reviewing a PR or writing a component from scratch, these are the frequent drift points — check them first:

| Check | Section |
|---|---|
| Is the radius `rounded-sm` / `rounded-[var(--radius-sm)]`? | §6 |
| Is the button border-over-fill? | §12 |
| Is the card `border border-border/20`, not `outline-1 outline-groove`? | §13 |
| Is the input underlined, not boxed? | §14 |
| Is the container `max-w-[var(--container-page)]`, not `max-w-5xl`? | §17 |
| Is the sticky header `bg-background/90 backdrop-blur-[var(--blur-md)]`? | §18 |
| Is the empty state a glyph + one sentence? | §21, §27 |
| Is the icon strokeWidth `1.5`? | §26 |
| Is the focus ring `focus-visible:ring-foreground/70`? | §28 |
| Does the motion respect `useReducedMotion`? | §25, §28 |
| Does every copy string avoid the banned-words list? | §27 |
| Does every animation duration land on the five-step ladder? | §25 |

### Update cadence

- **Minor amendments** (new banned pattern, new canonical snippet, new bilingual copy pair): commit as `docs(design): §<n> — <short desc>`. Bump nothing; the doc is always current.
- **New section** (new component, new pattern): increment the TOC, add the section, commit as `docs(design): add §<n> <title>`.
- **Breaking change** (token rename, semantic shift): append to the Changelog (§33) with date, change, migration notes. Coordinate with any dependent code.

---

## 32. Appendix: File Map

Where design lives in the codebase today:

| Concern | Location | Role |
|---|---|---|
| Design tokens (authoritative) | `src/styles/globals.css` | `@theme` block + CSS custom properties |
| Tailwind config | (inline in `globals.css`) | Tailwind 4 config-in-CSS |
| Typography SCSS | `src/styles/hideaway.scss` | Legacy typographic overrides (slated for trim — see Audit) |
| Reading-surface SCSS | `src/styles/reading.scss` | Essay/Highlightr-specific type rules |
| shadcn primitives | `src/components/ui/` | Button, Card, Input, Dialog, etc. (need canonicalization — see Audit) |
| Core UI | `src/components/core/` | Hideaway's own Link, Media, Main, Button |
| UX components | `src/components/UX/` | Interactive systems (Radio, TapePlayer, Highlightr, Tour, CommandKey) |
| Motion hooks | `src/hooks/useReducedMotion.ts` | Canonical reduced-motion gate — all animations route through this |
| Theme provider | `src/providers/Theme/` | `next-themes` wrapper + persistence |
| Icon set | Lucide React (`lucide-react`) | Global icon family — strokeWidth 1.5 |
| A11y utilities | `src/components/a11y/` | SkipLink, VisuallyHidden, FocusTrap |
| Design references in project docs | `CLAUDE.md` | Layout, typography scale, card anatomy, animations |

---

## 33. Changelog

The doc is revised, never rewritten. Material changes — anything that invalidates existing code or flips a rule — are recorded here with a date, a one-line description, and a migration note where relevant. Typographic fixes, reorderings, and clarifications are not logged.

| Date | Version | Change | Migration |
|---|---|---|---|
| 2026-04-20 | 0.1 | Initial scaffold: manifesto, seven disciplines, color, typography | n/a |
| 2026-04-21 | 0.2 | Structural tokens (spacing, radius, shadow, blur, motion, z-index, grid) | Adopt `--space-*` / `--radius-*` tokens; retire ad-hoc values. See F-003..F-006 in Audit. |
| 2026-04-21 | 0.3 | Component canon (buttons, cards, inputs, typography primitives, badges) | `Button` → border-over-fill, size ladder {28,36,44,52}; Card radius → `--radius-sm`; Input → underline pattern. See F-030, F-031, F-023 in Audit. |
| 2026-04-21 | 0.4 | Pattern library (layout, sticky header, hero, grid, empty/loading/error, modal/sheet/popover, CMDK, nav) | New `Page` container primitive; canonical sticky header recipe. See F-033, F-035, F-036 in Audit. |
| 2026-04-21 | 0.5 | Motion principles, iconography, microcopy voice, a11y commitments, theming policy | Lucide stroke-width → 1.5 global; five-step duration ladder; reduced-motion routing mandatory. |
| 2026-04-21 | **1.0** | Reference criteria + curated library; "How to use" instrument section; manifesto polish with "promises we keep" block | Reject pile now enforced — **Fey is explicitly rejected**; reference intake requires 5-axis rubric pass. |

### How to add a changelog entry

1. Add a new row at the top of the table above (newest first after row 1).
2. Increment the version in the **Status** line at the top of this doc.
3. If the change is breaking, add a concise migration line. Otherwise write "n/a".
4. Cite related Audit F-ids when applicable.
5. Commit with `docs(design): changelog — v<n.n> <short>`.

---

## Closing

This document exists so that every future UI decision at The Hideaway happens **once, here, first** — and so that a designer or agent encountering the codebase a year from now can learn the system in an hour, not a week.

If a new surface demands a rule that is not here yet, **write the rule here first and the code second**. That is the entire discipline.

— *The Hideaway, April 2026.*

---
