# The Hideaway — Design System

> Canonical reference for design tokens, components, patterns, and aesthetic principles.
> When `globals.css`, `CLAUDE.md`, and this document disagree, **this document is the source of truth** for design decisions, and drift must be reconciled via the Audit doc (`readmes/DESIGN_SYSTEM_AUDIT.md`).
> Engineering ground-truth (what actually ships) lives in `src/styles/globals.css`.

**Status:** Iteration 3 — Foundations + structural tokens + component canon (buttons, cards, inputs, typography primitives, badges). Patterns, motion principles, and reference criteria follow in subsequent iterations.

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
17. [Appendix: File Map](#17-appendix-file-map)

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

## 17. Appendix: File Map

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

- **Iter 4:** Patterns — layout containers, sticky headers, heroes, grids, empty/loading/error states, modals, dialogs, sheets, popovers, command palette.
- **Iter 5:** Motion principles, iconography (stroke widths + icon set selection), microcopy voice, a11y commitments, dark/light theming policy.
- **Iter 6:** Reference selection criteria — which external designs we borrow from, and which we reject. Final aesthetic manifesto polish.

---
