# The Hideaway — Design System

Canonical reference for tokens, component anatomy, and dashboard patterns. This file is the single source of truth; `src/styles/globals.css`, `src/styles/payloadStyles.css`, `src/styles/hideaway.scss`, and `src/app/(frontend)/estate.scss` are the implementation.

---

## 0. Principles

1. **Editorial, typographic-first, monochrome.** Type is the primary design element. Color is a punctuation mark.
2. **Opacity is the tonal tool.** No secondary grey palette — one foreground, one background, opacity variants.
3. **Motion clarifies, never decorates.** Transitions carry state changes; they do not announce themselves.
4. **Density with restraint.** Whitespace defines hierarchy. No uniform padding as a replacement for rhythm.
5. **Desktop-first.** Default styles target desktop; mobile is `max-width` override.

---

## 1. Color

### 1.1 Root unit

All colors are `oklch(L C H)`. Never introduce RGB/HSL tokens. The one exception (`--bg-menu-wrapper`) is a migration debt — see §13.

### 1.2 Palette (source of truth)

Defined in `src/styles/globals.css` and mirrored in `src/styles/payloadStyles.css`.

**Achromatic**
- `--off-black`, `--off-white`
- `--black-100` through `--black-900` (9 steps)
- `--white-100` through `--white-900` (9 steps)

**Rouge** (primary warm accent) — `--rouge-50` through `--rouge-950` (12 steps). `--rouge-500` is the canonical "red."

**Bleu** (primary cool accent) — `--bleu-50` through `--bleu-950` (12 steps).

**Piercing** (signal colors, single-stop) — `--piercing-orange`, `--piercing-green`, `--piercing-yellow`, `--piercing-purple`.

**Pastel** (soft accents, single-stop) — `--pastel-sky`, `--pastel-rose`, `--pastel-mint`, etc.

### 1.3 Aliases

Semantic aliases that point to palette values. These are what components reference.

```css
--fg:                    /* foreground — resolves by theme */
--bg:                    /* background */
--bg-primary:            /* card / elevated surface */
--logo:                  /* brand mark color */
--border:                /* default border */
--ring:                  /* focus ring */
```

Red/rouge aliases collapse to the scale:
```css
--red:          var(--rouge-500);
--rosso-corsa:  var(--rouge-500);   /* legacy alias; prefer --red */
```

### 1.4 State-aware nav surface (`--n-s-*`)

Theme-responsive tokens that also invert inside `body.menu__open *`. Defined in `globals.css:843-921`.

| Token | Role |
|---|---|
| `--n-s-bg` | Nav surface background |
| `--n-s-fg` | Nav surface foreground (text/icon) |
| `--n-s-btn` | Nav-contextual button color |
| `--n-s-bb` | Nav-contextual border/separator |

Reference these anywhere a component must invert inside an open menu overlay.

### 1.5 Selection

- Frontend: `selection { background: oklch(from var(--piercing-orange) l c h/0.85); color: var(--off-black); }`
- Admin (Payload): `selection { background: var(--bleu-200); }` — intentional divergence.

### 1.6 Opacity tonal scale

Use opacity on `--fg` / `--border` to create hierarchy. Do not invent new grey tokens.

```
text-foreground         primary
text-foreground/70      secondary
text-muted-foreground   subdued
text-muted-foreground/60 tertiary / metadata
text-muted-foreground/40 ghost / hint

border-border/20        default card edge
border-border/30        standard divider
border-border/50        hover / active
```

---

## 2. Typography

### 2.1 Families

```css
--font-sans:   var(--font-suit);                /* default body */
--font-mono:   var(--font-geist-mono);          /* metadata, labels, counts */
--font-serif:  var(--font-narcissianNectare);   /* editorial display */
--font-dots:   …                                /* decorative */
--font-siegfried: …                             /* decorative */
```

### 2.2 Scale (canonical, post-fix)

Root font-size is `62.5%` → `1rem = 10px`. Tokens live in `@theme` in `globals.css`.

| Token | Value | Notes |
|---|---|---|
| `--text-xs` | `1rem` | 10px — micro metadata |
| `--text-sm` | `1.2rem` | 12px |
| `--text-base` | `1.4rem` | 14px — default body |
| `--text-lg` | `1.6rem` | 16px — **post-migration value** (see §13 task T-02) |
| `--text-xl` | `2rem` | 20px |
| `--text-2xl` | `2.4rem` | 24px |
| `--text-3xl` | `2.8rem` | 28px |
| `--text-4xl` | `3.2rem` | 32px |
| `--text-5xl` | `3.6rem` | 36px |
| `--text-6xl` | `4rem` | 40px — **post-migration value** (see §13 task T-03) |
| `--text-7xl` | `4.4rem` | 44px |
| `--text-8xl` | `4.8rem` | 48px |
| `--text-9xl` | `5.6rem` | 56px |

### 2.3 Weight

- `font-light` (300) — all display headings, hero type
- `font-normal` (400) — default body
- `font-medium` (500) — card titles, UI labels only
- No `font-bold` or `font-semibold` in editorial surfaces

### 2.4 Tracking & leading patterns

```tsx
// Display (hero / page heading)
"font-light tracking-tight"

// Monospace UI label
"font-mono uppercase tracking-widest"

// Monospace eyebrow (extra-tight)
"font-mono uppercase tracking-[0.2em]"

// Prose / body
"leading-relaxed"

// Card title
"font-medium leading-snug tracking-tight"
```

### 2.5 Type recipes

See `CLAUDE.md` → *Typography Scale* for the full recipe set (display, monospace UI, body/card). Recipes there are authoritative for Tailwind class composition.

---

## 3. Spacing

### 3.1 Gutters (layout-scale)

| Token | Value | Role |
|---|---|---|
| `--gutter` | `2rem` (desktop) / `1.6rem` (mobile) | Primary page gutter |
| `--gutter-sm` | `1.6rem` | Secondary |
| `--gutter-xs` | `0.8rem` | Tight |
| `--vertical-gutter` | `14rem` | Section vertical rhythm |
| `--pad-grid` | `clamp(20px, 5vw, 92px)` | Grid outer padding (fluid) |

### 3.2 Grid

| Token | Value |
|---|---|
| `--min-width-col` | `200px` |
| `--grid-gutter` | `36px var(--gutter)` |

### 3.3 Component gutter

`--component-gutter: 1.2rem` — internal spacing inside compact components (notifications, dropdowns). Defined per-component; lifted to root is TBD.

---

## 4. Radius

**Single canonical scale** (globals.css `@theme`). Delete `--rounded-small/normal/large` (see §13 task T-01).

| Token | Value | Role |
|---|---|---|
| `--radius` | `0.8rem` | Base |
| `--radius-sm` | `calc(var(--radius) - 4px)` | Tight corners (small inputs, chips) |
| `--radius-md` | `calc(var(--radius) - 2px)` | Standard (buttons, inputs) |
| `--radius-lg` | `var(--radius)` | Cards |
| `--radius-xl` | `calc(var(--radius) + 4px)` | Large surfaces, modals |
| `--radius-pill` | `999px` | Pills, circular buttons, sticky heads |

Tailwind `rounded-sm` used as the editorial card default maps to `--radius-sm`.

---

## 5. Borders

- **Hairline:** always `1px`. Never `0.1rem` (renders inconsistently at the 62.5% root).
- **Color:** `var(--border)` with opacity variants (`/20`, `/30`, `/50`).
- **Style:** `solid` is default; `dashed` is reserved for empty-state affordances.

```css
border: 1px solid oklch(from var(--border) l c h / 0.2);
```

---

## 6. Breakpoints

**Desktop-first.** Default styles assume desktop; mobile overrides use `max-width`.

Tokens in `globals.css` `@theme`:

| Token | Value | Role |
|---|---|---|
| `--breakpoint-xs` | `480px` | Large phone |
| `--breakpoint-sm` | `640px` | Phone / small tablet |
| `--breakpoint-md` | `768px` | Tablet — **default mobile boundary** |
| `--breakpoint-lg` | `1024px` | Small laptop |
| `--breakpoint-xl` | `1280px` | Standard desktop |
| `--breakpoint-2xl` | `1536px` | Large desktop |
| `--breakpoint-3xl` | `1920px` | Ultra-wide |

**Media query convention:**

```css
/* Mobile override */
@media (max-width: 768px) { … }

/* Large-desktop enhancement (not a general boundary) */
@media (min-width: 1280px) { … }
```

Legacy `min-width: 967px` queries exist; they are outliers and should be reclassified during migration (see §13 task T-08).

---

## 7. Motion

### 7.1 Easings (globals.css `@theme` lines 516–531)

```css
--ease-linear
--ease-default
--ease-power2
--ease-power3
--ease-power4
--ease-out
--ease-in
--ease-Sine
--ease-in-out-2
--ease-in-out-power2
--ease-in-out-power3
```

Prefer `--ease-power3` for entries and `--ease-out` for hover states.

### 7.2 Duration convention

No duration tokens yet. Conventions in-use:

| Intent | Duration |
|---|---|
| Micro (hover, focus, link underline) | `150ms` |
| Short (button state, tooltip reveal) | `200–250ms` |
| Standard (card hover, panel slide) | `300–400ms` |
| Long (page transition, hero reveal) | `500–700ms` |

Formalizing as `--duration-fast/base/slow` is a future task.

### 7.3 Signature Motion recipes

See `CLAUDE.md` → *Animations*. Keep `bounce` in the 0.05–0.2 range.

---

## 8. Component Anatomy

### 8.1 Button — `.rp_btn` (`src/styles/hideaway.scss:69`)

```
border-radius:   --radius-pill         (was 5rem)
padding:         --button-px-md var(--button-py-md)
height:          --button-h-md          (2.4rem base, 3.2rem md, 3.6rem lg)
background:      transparent
backdrop-filter: blur(2.4rem)
border:          1px solid transparent
font-weight:     350
letter-spacing:  -0.01em
line-height:     2
transition:      all 0.2s var(--ease-out)
```

Variants: `--sm`, `--md` (default), `--lg`. Mobile height scales to `1.4rem / 2rem / 2.56rem`.

### 8.2 Circular button — `.circ-bt` (hideaway.scss:517)

```
shape:           circle (aspect-ratio 1)
backdrop-filter: blur(1.4rem)
border:          1px solid transparent
color system:    inherits --n-s-* when inside nav
```

### 8.3 Input (borderless)

```tsx
<input className="w-full border-b border-border/30 bg-transparent pb-2
  text-sm font-light tracking-tight
  placeholder:text-muted-foreground/30
  focus:border-foreground/40 focus:outline-none" />
```

Never filled. Bottom border only. Focus state increases border opacity, not color.

### 8.4 Card

Anatomy in `CLAUDE.md` → *Card Anatomy*. Canonical spec:
- `rounded-sm` (`--radius-sm`)
- `border-border/20` default, `border-border/50` hover
- Image: aspect-ratio locked, `overflow-hidden`, gradient overlay `from-transparent to-background/60`
- Hover: `scale(1.04)` on image, `duration-500`
- Body padding: `p-3.5` (`xl:p-4`)

### 8.5 Dropdown — `.dropdown-wrapper` (hideaway.scss:603)

```
--open-width:    160px
border-radius:   0.6rem (closed), 0.8rem (open) → standardize to --radius-md
backdrop-filter: blur(1.4rem)
```

### 8.6 Notification — `.notif__item` (hideaway.scss:950)

```
width:           22.5rem
height:          10rem
border-radius:   --radius-lg (0.8rem)
--component-gutter: 1.2rem
```

### 8.7 Sticky header

```tsx
<header className="sticky top-0 z-20 border-b border-border/30
  bg-background/90 backdrop-blur-md">
  <div className="mx-auto max-w-7xl px-6 py-5 xl:px-10">…</div>
</header>
```

Pill-shape sticky nav variant: `border-radius: --radius-pill`.

### 8.8 Tooltip

```
padding:       20px
font-size:     1.5rem
line-height:   100%
border-radius: --radius-lg
```

Multiline variant: `white-space: normal; text-align: left; line-height: 120%`.

### 8.9 Tag — `.rp_tag`

```
font-size:     8px
border-radius: --radius-pill
text-transform: uppercase
```

Extended variant `.tagged`: larger radius, `font-weight: 600`.

### 8.10 Cursor — `.rp__cursor` (hideaway.scss:412–515)

```
size:          9.6rem (ring), 120px (text variant width)
transition:    transform, opacity
state-aware:   hover, press, drag, text
```

Do not alter without consulting `src/stores/Cursor/`.

---

## 9. Layout Containers

| Container | Class | Use |
|---|---|---|
| Standard | `mx-auto max-w-7xl px-6 xl:px-10` | Primary page layouts — **default** |
| Narrow | `mx-auto max-w-2xl px-6` | Prose, forms |
| Full-bleed | `w-full` | Heroes, banners |

**Never use `max-w-5xl`** — creates awkward gutters ~1100px+.

Grid column targets and gap scaling per content type live in `CLAUDE.md` → *Responsive Breakpoints*.

---

## 10. Dashboard Blueprint

Seven patterns for the Hideaway's admin/analytics surfaces. Editorial aesthetic carried into data UI — no default chart-library look.

### 10.1 Tabular numerics

All numeric values use `font-mono` + `font-variant-numeric: tabular-nums`. Alignment right. Units in the adjacent cell, not inline. Decimals in a dimmer tone (`text-muted-foreground/60`).

### 10.2 Small multiples

Dense grids of tiny charts sharing axes. Each chart ≤120px wide. Minimal chrome: no legends, no gridlines — one baseline, one data line. Use for week-over-week or per-segment comparison.

### 10.3 Opacity bands

Stratify table rows and chart elements by opacity tier: current period `1.0`, prior period `0.5`, baseline `0.25`. No color swap. The user's eye catches the active band automatically.

### 10.4 Underline-only interactive states

Dashboard tables and metric tiles never shift color on hover. Underline appears (via `border-b border-border/50`) or intensifies. Active row gets a 1px left rail in `--piercing-orange` — the only time signal color enters.

### 10.5 Activity feeds as text-first

Event streams render as typographic lists, not cards. Monospace timestamp (right-aligned, muted), prose predicate, inline actor avatar at `size-4`. No icons for event type — verbs carry the distinction.

### 10.6 Monospace eyebrows + sticky section heads

Each dashboard section opens with:
```tsx
<div className="sticky top-0 border-b border-border/30 bg-background/90 backdrop-blur-md">
  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Section label</p>
  <h2 className="text-2xl font-light tracking-tight">Section title</h2>
</div>
```

Sticky heads create spatial bookmarks during long dashboard scrolls.

### 10.7 Editorial bento KPIs

Top-level KPI row is a 12-column bento — not a uniform 4-card grid. Primary metric spans 6, two secondary metrics 3+3, context strip spans 12 below. Hierarchy via size, not color.

---

## 11. Intentional Divergences

Documented so they are not accidentally "reconciled" in future cleanups.

| # | Divergence | Rationale |
|---|---|---|
| D-01 | Selection color differs frontend (`piercing-orange/0.85`) vs admin (`bleu-200`) | Editorial frontend vs utility admin context |
| D-02 | `hr` 5-stop gradient on frontend, absent in admin | Admin does not decorate dividers |
| D-03 | `html { opacity: 0 }` fade-in on frontend, absent in admin | Admin does not need the editorial entrance |

---

## 12. Intentional Patterns to Preserve

- **Borderless inputs** (bottom-border only) — never revert to filled/boxed inputs.
- **Monochrome buttons** — actions signal via text weight, underline, border. Never fill color.
- **62.5% root + rem everywhere** — preserves the "1.6rem = 16px" readable math.
- **`.grave/` archive convention** — see `CLAUDE.md`.

---

## 13. Migration Checklist

Ordered cleanup tasks. Each is atomic — can ship independently.

### T-01 — Collapse radius scales ✅ DONE

Value-preserving mapping (at 62.5% root: `0.4rem = 4px`, `0.8rem = 8px`, `1.2rem = 12px`; derived scale: `sm = 4px`, `md = 6px`, `lg = 8px`, `xl = 12px`):

- **Deleted** `--rounded-small`, `--rounded-normal`, `--rounded-large`, `--button-rounded`, `--button-rounded-full` from `src/app/(frontend)/estate.scss`.
- **Added** `--radius-pill: 999px` to `globals.css` `@theme`.
- **Added** derived scale (`--radius-sm/md/lg/xl`) + `--radius-pill` to `payloadStyles.css` `:root` for admin/frontend parity (was previously missing).
- **Migrated** callsites (`--rounded-small` → `--radius-sm`, `--rounded-normal` → `--radius-lg`, `--rounded-large` → `--radius-xl`) across `__controlbar.scss`, `__tabs.scss`, `__executor.scss`, `__signup.scss`, `hideaway.scss`.
- **Replaced** `border-radius: 5rem` → `var(--radius-pill)` in `hideaway.scss` (`.rp_btn`, `.circ-bt`) and `__auth.scss`.
- `.grave/` archive left untouched by design.

### T-02 — Restore `--text-lg` to `1.6rem` + migrate callsites ✅ DONE

- **Pinned** `--text-h5: var(--text-base)` in both `globals.css:681` and `payloadStyles.css:549` to preserve the 1.4rem h5 rendering (value-preserving per T-01 precedent).
- **Updated** base-layer `h5` and `code` `@apply text-lg` → `@apply text-base` in both CSS files to stay consistent with the pinned token.
- **Bumped** `--text-lg: 1.4rem` → `1.6rem` in `globals.css:58` and `payloadStyles.css:67`.
- **Migrated** `text-lg` → `text-base` across 33 TSX files (all editorial, auth, UI primitive, and better-auth-ui dialog callsites). Responsive variants (`xl:text-lg`, `md:text-lg`, etc.) converted in the same pass; downstream visual is preserved because the new `--text-base` matches the pre-migration `--text-lg` value.
- **Grep verification**: `\btext-lg\b` now returns only the two CSS token definitions — zero active callsites.

### T-03 — Migrate `text-6xl` callsites + update `--text-6xl` to `4rem` ✅ DONE

- **Migrated** `text-6xl` → `text-4xl` across 4 files: `blocks/heros/PostHero/index.tsx`, `me/library/lists/page.client.tsx`, `content/lists/[username]/[hashId]/page.client.tsx`, `components/Radio/Showcase/ShowcaseHero.tsx`. Value-preserving (both resolved to 3.2rem pre-migration).
- **Bumped** `--text-6xl: 3.2rem` → `4rem` in `globals.css:70` and `payloadStyles.css:79`.
- **Known follow-up**: `--text-5xl` (currently `2.8rem`) sits below `--text-4xl` (`3.2rem`) — an inversion. `--text-7xl` (`3.6rem`) is tight against the new 6xl. Responsive ladders using `md:text-5xl xl:text-6xl 2xl:text-7xl` will still render non-monotonically until 5xl/7xl are fixed in a subsequent task.

### T-04 — Color duplicate aliases ✅ DONE

- **Aliased** `--red` and `--rosso-corsa` to `var(--rouge-500)` in `globals.css`, `payloadStyles.css`, and `custom.scss`. Rendered colors were within 0.2% ΔL in oklch — change is visually imperceptible and collapses three near-duplicates into one canonical source.
- **Deleted** `--pastel-sky-blue` base token from `globals.css` and `payloadStyles.css` (and `custom.scss`). Deleted the `--pastel-sky-` typo token.
- **Preserved** the Tailwind-exposed `--color-pastel-sky-blue` (used in 8 gradient stops across both stylesheets) by aliasing it to `var(--pastel-sky)` in the `@theme inline` blocks.
- `@theme` (non-inline) blocks in `payloadStyles.css` still carry hardcoded oklch for the Tailwind palette — left alone to avoid build-time risk; the exposed palette token is semantically correct even if not aliased.

### T-05 — Convert `--bg-menu-wrapper` to oklch ✅ DONE

- **Replaced** `--bg-menu-wrapper: 12, 12, 12` (RGB tuple) with `--bg-menu-wrapper: oklch(16.54% 0 0)` in `hideaway.scss:18`. Matches the sRGB(12,12,12) gray within visual tolerance.
- **Migrated** 3 callers from `rgba(var(--bg-menu-wrapper), 0.8)` → `oklch(from var(--bg-menu-wrapper) l c h / 0.8)` in `hideaway.scss`, `__controlbar.scss`, `__executor.scss`. Token is now a first-class color, not a component tuple.

### T-06 — Standardize hairline borders to `1px` ✅ DONE

- **Migrated** hairline `0.1rem` declarations to explicit `1px` across `hideaway.scss` (5 borders + 2 menu-line positional hairlines), `__auth.scss` (1 border), and `Button/index.tsx` (`border-[0.1rem]` → `border-[1px]` in 2 variants).
- Rationale: `0.1rem` depends on root font-size scaling; `1px` is explicit and always renders a true hairline at any zoom level or root size.

- Grep `border: 0.1rem` and `border-width: 0.1rem` → replace with `1px`.
- Same for `border-top/right/bottom/left: 0.1rem`.

### T-07 — Move `estate.scss` px tokens to rem

At 62.5% root, `1rem = 10px`.

| Token | Current | New |
|---|---|---|
| `--min-width-col` | `200px` | `20rem` |
| `--grid-gutter` | `36px var(--gutter)` | `3.6rem var(--gutter)` |
| `--button-pad` | `24px` | `2.4rem` |
| `--height-input` | `48px` | `4.8rem` |
| `--pad-input` | `16px` | `1.6rem` |
| `--loader-size` | `24px` | `2.4rem` |

`--pad-grid: clamp(20px, 5vw, 92px)` may stay in px (it's a fluid clamp and min/max are design-visual boundaries, not typographic rhythm).

### T-08 — Reclassify `min-width: 967px` queries

- **Grep** `@media (min-width: 967px)` and `@media only screen and (min-width: 967px)`.
- **Audit each** — is it intended as a general desktop rule or a large-desktop enhancement?
- **Migrate** to `@media (min-width: 1280px)` (xl) or fold into the default (remove the query) per case.

### T-09 — Unify button height/padding tokens

- **Add** to `globals.css`:
  ```css
  --button-h-sm: 2.4rem;
  --button-h-md: 3.2rem;
  --button-h-lg: 3.6rem;
  --button-px-sm: 1.2rem;
  --button-px-md: 1.6rem;
  --button-px-lg: 2rem;
  ```
- **Delete** from `hideaway.scss`: `--button-height`, `--button-height-md`, `--button-height-lg`, `--button-padding`.
- **Delete** from `estate.scss`: `--height-input`, `--pad-input`, `--button-pad`.
- **Update** `.rp_btn` and inputs to reference the new tokens.

### T-10 — Formalize duration tokens

- **Add** to `globals.css` `@theme`:
  ```css
  --duration-fast:  150ms;
  --duration-base:  250ms;
  --duration-slow:  400ms;
  ```
- No callsite migration required — new code uses tokens, old code migrates opportunistically.

---

## 14. File Map

| File | Scope | Role |
|---|---|---|
| `src/styles/globals.css` | Frontend | Tokens (palette, type, radius, breakpoints, easings) + theme aliases + `--n-s-*` |
| `src/styles/payloadStyles.css` | Admin | Mirror of globals.css for the Payload admin context |
| `src/styles/hideaway.scss` | Frontend | Component patterns (`.rp_btn`, `.circ-bt`, `.dropdown-wrapper`, `.notif__item`, `.rp__cursor`, `.rp_tag`) |
| `src/app/(frontend)/estate.scss` | Frontend | Layout tokens (`--pad-grid`, `--grid-gutter`, `--min-width-col`) — migration target for T-01, T-07, T-09 |
| `readmes/DESIGN_SYSTEM.md` | — | This file |

---

## 15. Contributing to the Design System

1. **Read before adding.** If a token or component exists, extend it. Do not introduce a parallel version.
2. **Aesthetic divergence requires justification.** See §11 for the bar.
3. **Token changes must land with callsite migration.** See T-02 / T-03 for the pattern.
4. **Document intentional divergences in §11.** Undocumented divergence is debt.
