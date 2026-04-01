# The Hideaway — Design & Code Guidelines

## Aesthetic Direction

The Hideaway is an editorial platform with a quiet, typographic-first aesthetic. Design references:

- **Medium** — information hierarchy, reading experience, clean spatial rhythm
- **Longblack.co** — highlight prettification, content as object, editorial gravitas
- **metalab.com** — restraint, systematic whitespace, confident negative space
- **Awwwards.com** — curation UI, bookmark-to-collection flows
- **jonway.studio** — compilation aesthetic, editorial grids, identity-forward layouts

The governing tone is: *sparse, intentional, typographically confident*. Features should feel discovered rather than advertised. Avoid decoration for its own sake.

---

## Layout Containers

Always use `max-w-7xl` as the base container for content pages. This prevents excessive gutters on wide displays (MacBook Pro 16", external monitors) while remaining comfortable on laptop screens.

```tsx
// Standard container
<div className="mx-auto max-w-7xl px-6 xl:px-10">

// Narrow (prose / forms)
<div className="mx-auto max-w-2xl px-6">

// Full-bleed (heroes, banners)
<section className="w-full">  {/* no max-width */}
```

**Never use `max-w-5xl` for primary page layouts** — it creates awkward gutters above ~1100px.

---

## Responsive Breakpoints

Always author for mobile-first, but **never stop at `lg:`**. Every grid and spacing value should have an `xl:` variant.

| Breakpoint | Width  | Context |
|-----------|--------|---------|
| `sm:`     | 640px  | Large phone / small tablet |
| `md:`     | 768px  | Tablet |
| `lg:`     | 1024px | Small laptop |
| `xl:`     | 1280px | MacBook 13–14" |
| `2xl:`    | 1536px | MacBook Pro 16" / large monitors |

### Grid column targets

| Content type | sm | md | lg | xl | 2xl |
|-------------|----|----|----|----|-----|
| Editorial cards (posts, surf, profile) | 1 | 2 | 3 | 4 | 4 |
| Music / square tiles (albums, tracks, playlists) | 2 | 3 | 4 | 5 | 6 |
| Compilation cards (premium, 4:3) | 1 | 2 | 3 | 4 | 4 |
| Compilation cards (free, 16:9) | 1 | 2 | 3 | 3 | 4 |
| Detail item grid (premium) | 2 | 3 | 4 | 5 | 6 |

### Gap scaling

```tsx
className="gap-4 xl:gap-5"      // standard grids
className="gap-5 xl:gap-6"      // larger card grids
```

---

## Typography Scale

Typography is the primary design element. Use weight `font-light` for display headings; `font-medium` only for card titles and UI labels; `font-mono` for metadata, counts, badges, and navigation labels.

### Display / hero headings

```tsx
// Page heroes (public facing)
className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl font-light tracking-tight"

// Page section headings
className="text-2xl xl:text-3xl font-light tracking-tight"

// Sub-section / detail headings
className="text-xl xl:text-2xl 2xl:text-3xl font-light tracking-tight"
```

### Monospace UI labels (nav, eyebrows, badges)

```tsx
// Primary nav / action labels
className="font-mono text-[11px] uppercase tracking-widest xl:text-xs"

// Eyebrow / category labels (above headings)
className="font-mono text-[10px] uppercase tracking-[0.2em] xl:text-xs"

// Metadata / counts / secondary labels
className="font-mono text-[10px] xl:text-[11px]"

// Micro badges (visibility, type)
className="font-mono text-[9px] uppercase tracking-widest xl:text-[10px]"
```

### Body / card copy

```tsx
// Card titles
className="text-sm font-medium leading-snug tracking-tight xl:text-base"

// Card descriptions / subtitles
className="font-mono text-[10px] xl:text-[11px]"

// Prose / descriptions (longer text)
className="font-mono text-[11px] xl:text-xs leading-relaxed"
```

---

## Color & Opacity System

The design uses a single foreground/background token system with **opacity as the primary tonal tool** — not separate grey tokens.

```tsx
// Primary text
text-foreground

// Secondary text (subdued)
text-foreground/70
text-muted-foreground

// Tertiary / metadata
text-muted-foreground/60

// Ghost / hint
text-muted-foreground/40
text-muted-foreground/25

// Borders
border-border/20   // very subtle (default card edge)
border-border/30   // standard divider
border-border/50   // hover / active state

// Backgrounds
bg-card            // card/surface
bg-muted/20        // image placeholder
bg-background/80   // overlay (backdrop)
bg-background/90   // sticky header
```

Never reach for new color tokens — use opacity variants of existing tokens.

---

## Card Anatomy

Cards follow a consistent anatomy across the site:

```
┌──────────────────────────┐
│  [image area]            │  aspect-ratio locked, overflow-hidden
│  ↳ gradient overlay      │  from-transparent to-background/60
│  ↳ hover: scale(1.04)    │  transition-transform duration-500
├──────────────────────────┤
│  [body]          p-3.5   │  xl:p-4
│   Title          text-sm │  xl:text-base, font-medium
│   Subtitle       text-xs │  font-mono, muted-foreground/60
├──────────────────────────┤  (optional footer row)
│  [meta]          py-2    │  item count, visibility badge, context menu
└──────────────────────────┘
```

All cards use `rounded-sm` (not `rounded-lg`) and `border-border/20`. On hover: `border-border/50`.

---

## Sticky Headers

Every auth page has a sticky top header with this structure:

```tsx
<header className="sticky top-0 z-20 border-b border-border/30 bg-background/90 backdrop-blur-md">
  <div className="mx-auto max-w-7xl px-6 py-5 xl:px-10">
    <div className="flex items-end justify-between">
      {/* Left: eyebrow label + h1 */}
      {/* Right: nav links / actions (font-mono text-[11px] uppercase tracking-widest) */}
    </div>
    {/* Optional: tab bar below, -mb-px */}
  </div>
</header>
```

---

## Heroes (Full-Bleed)

Used on public-facing collection/compilation pages:

```tsx
<section className="relative h-[55vh] min-h-[340px] w-full overflow-hidden">
  {/* Background: cover image or gradient fallback with large initial letter */}
  {/* Gradient overlay: from-black/30 via-black/40 to-background */}
  {/* Content anchored to bottom-left inside max-w-7xl container */}
</section>
```

The initial-letter fallback uses `text-[20vw] font-mono font-light text-foreground/[0.04]` — barely visible, purely textural.

---

## Animations

Use Framer Motion (`motion/react` / `motion/react-m`) consistently:

```tsx
// Standard card entrance
initial={{ opacity: 0, scale: 0.97 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}

// Staggered list
transition={{ type: "spring", bounce: 0.1, delay: index * 0.04 }}

// Page/tab transitions
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -8 }}
transition={{ duration: 0.22 }}

// Panels / sheets (slide from edge)
initial={{ x: "100%" }}
animate={{ x: 0 }}
exit={{ x: "100%" }}
transition={{ type: "spring", bounce: 0.05, duration: 0.4 }}

// Modals / overlays
initial={{ opacity: 0, y: 24 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: 24 }}
transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
```

Use `LayoutGroup` + `layoutId` for animated tab indicators. Keep `bounce` low (0.05–0.2) — the aesthetic is calm, not bouncy.

---

## Empty States

Every collection view has a bespoke empty state. Pattern:

```tsx
<div className="flex flex-col items-center justify-center py-24 text-center">
  <span className="mb-4 font-mono text-5xl opacity-10">{symbol}</span>
  <p className="text-base font-light text-foreground/70">{headline}</p>
  <p className="mt-1.5 max-w-xs font-mono text-[11px] text-muted-foreground/50">{sub}</p>
  {/* Optional CTA */}
  <button className="mt-7 border border-border/40 px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest ...">
    {cta}
  </button>
</div>
```

Symbol candidates: `◫` (saved), `⊞` (lists), `○` (profiles), etc. Keep opacity at 10% — purely suggestive.

---

## Role-Based Layout Tiering

Premium users (`patron`, `author`, `editor`, `admin`) receive editorial-grade layouts. Free users (`user`) receive standard layouts.

```tsx
const isPremium = (role: string) =>
  ["patron", "author", "editor", "admin"].includes(role);
```

Premium differentiators:
- More grid columns
- 4:3 cover-overlay cards vs 16:9 standard cards
- Denser information display
- Overlay title on cover image (premium) vs below-image title (free)

Subscription role assignment is not yet implemented. Use the `role` field on the user directly.

---

## Forms & Inputs

Use borderless, bottom-border-only inputs:

```tsx
<input className="w-full border-b border-border/30 bg-transparent pb-2 text-sm font-light tracking-tight placeholder:text-muted-foreground/30 focus:border-foreground/40 focus:outline-none" />
```

Submit buttons:

```tsx
<button className="border border-border/40 px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest text-foreground/80 transition-colors hover:border-border hover:text-foreground disabled:opacity-40">
  Submit
</button>
```

Never use filled/coloured CTA buttons. Actions are communicated through text weight, underlines, and border visibility — not fill color.

---

## File Conventions

- `page.tsx` — server component (data fetching, auth checks, redirects)
- `page.client.tsx` — client component (default export, receives server-fetched props)
- `actions.ts` — server actions (`"use server"`) co-located next to the collection they serve
- Collections live in `src/payload/collections/`; if a collection needs server actions, create a subdirectory: `Collections/actions.ts`
