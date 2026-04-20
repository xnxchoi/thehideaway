# The Hideaway — Design System

> Canonical reference for design tokens, components, patterns, and aesthetic principles.
> When `globals.css`, `CLAUDE.md`, and this document disagree, **this document is the source of truth** for design decisions, and drift must be reconciled via the Audit doc (`readmes/DESIGN_SYSTEM_AUDIT.md`).
> Engineering ground-truth (what actually ships) lives in `src/styles/globals.css`.

**Status:** Iteration 1 — Foundations (manifesto, color, type). Structural tokens, components, patterns, motion, and reference criteria follow in subsequent iterations.

---

## Table of Contents

1. [Manifesto](#1-manifesto)
2. [The Seven Disciplines](#2-the-seven-disciplines)
3. [Color](#3-color)
4. [Typography](#4-typography)
5. [Appendix: File Map](#5-appendix-file-map)

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

## 5. Appendix: File Map

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
