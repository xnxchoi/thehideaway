# The Hideaway — Design System

> Canonical reference for design tokens, components, patterns, and aesthetic principles.
> When `globals.css`, `CLAUDE.md`, and this document disagree, **this document is the source of truth** for design decisions, and drift must be reconciled via the Audit doc (`readmes/DESIGN_SYSTEM_AUDIT.md`).
> Engineering ground-truth (what actually ships) lives in `src/styles/globals.css`.

**Status:** Iteration 2 — Foundations + structural tokens (spacing, radius, motion, blur, z-index, shadow, breakpoints). Components, patterns, motion principles, and reference criteria follow in subsequent iterations.

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
12. [Appendix: File Map](#12-appendix-file-map)

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

> **Hideaway is where text is the interface, silence is the default, and every deliberate touch of color means something.**

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

## 12. Appendix: File Map

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
| Design references in project docs | `CLAUDE.md` | Layout, typography scale, card anatomy, animations |

---

## What's next (upcoming iterations)

- **Iter 2:** Structural tokens — spacing, radius, shadow, motion duration, blur, z-index.
- **Iter 3:** Component canon — buttons, cards, inputs, dialogs, typography wrappers.
- **Iter 4:** Patterns — layout containers, sticky headers, heroes, grids, empty/loading/error states, modals.
- **Iter 5:** Motion principles, iconography, microcopy voice, a11y commitments, theming.
- **Iter 6:** Reference selection criteria — which external designs we borrow from, and which we reject.

---
