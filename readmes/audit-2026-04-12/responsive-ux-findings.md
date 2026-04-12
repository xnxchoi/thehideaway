# Responsive / UX / Aesthetic Violations — 2026-04-12

Inventory from Phase 1 reconnaissance for Phases 4 and 6.

---

## Missing `xl:` Variants (Responsive — Phase 4)

CLAUDE.md mandates: "Never stop at `lg:` — every grid and spacing value needs an `xl:` variant."

| File | Line | Issue |
|---|---|---|
| `src/blocks/heros/PostHero/index.tsx` | 23 | Grid stops at `lg:` |
| `src/blocks/Content/Component.tsx` | 24 | `lg:grid-cols-4` with no `xl:` |
| `src/blocks/FOTD/index.tsx` | 22, 27, 53 | Multiple `lg:` without `xl:` |
| `src/app/(frontend)/(site)/(auth)/me/lists/page.client.tsx` | 111 | Inconsistent — uses `xl:grid-cols-4` elsewhere but stops at `lg:` here |
| `src/components/content/archive-view/ArchiveFeature/ArchiveFeatureCard.tsx` | 104, 137 | Stops at `lg:` |
| `src/components/layouts/ArticleFrontpage/index.tsx` | 25, 30, 65 | Multiple stops at `lg:` |
| `src/components/layouts/Categories/index.tsx` | 20, 62 | Stops at `lg:` |
| `src/components/layouts/Tagged/Item.tsx` | 33 | Stops at `lg:` |
| `src/data-table/data-table-skeleton.tsx` | — | Skeleton layout not xl:-aware |
| `src/data-table/data-table-pagination.tsx` | — | Pagination layout not xl:-aware |

---

## Touch Targets Below 44×44px (Phase 4)

Apple HIG / WCAG minimum for touch is 44×44. CLAUDE.md calls out "native-feeling on major devices."

| File | Line | Issue |
|---|---|---|
| `src/app/(frontend)/(site)/(auth)/me/lists/page.client.tsx` | 231 | `h-6 w-6` (24px) |
| `src/app/(frontend)/(site)/(auth)/me/lists/[hashId]/page.client.tsx` | 431 | `h-6 w-6` (24px) |
| `src/app/(frontend)/(site)/(content)/lists/[username]/[hashId]/page.client.tsx` | 245 | `h-7 w-7` (28px) |
| Multiple | — | `py-1` / `py-1.5` / `py-0.5` buttons — effective hit area under 32px |

**Fix pattern:** Wrap small icons in a larger hit-area container:
```tsx
<button className="grid h-11 w-11 place-items-center">
  <Icon className="h-4 w-4" />
</button>
```

---

## Typography Violations (Phase 6 — aesthetic consistency)

CLAUDE.md mandates: "font-light for display headings; font-medium only for card titles and UI labels."

| File | Line | Issue |
|---|---|---|
| `src/app/(frontend)/(site)/(auth)/reset-password/page.tsx` | 10 | `<h1>` with `font-bold` → should be `font-light` |
| `src/app/(frontend)/(site)/(auth)/accept-invitation/[id]/page.tsx` | 121, 135 | `<h2>` with `font-bold` |
| `src/blocks/FOTD/index.tsx` | 45, 71, 169 | `font-bold` on headings |
| `src/components/ui/card.tsx` | 30 | Card title `font-semibold` → should be `font-medium` |
| `src/components/ui/sheet.tsx` | 100 | Sheet title `font-semibold` |
| `src/components/ui/drawer.tsx` | 105 | Drawer title `font-semibold` |
| `src/components/content/archive-view/ArchiveFeature/ArchiveFeatureCard.tsx` | 167, 258 | `font-bold` on card titles |
| `src/components/content/surf/surf.tsx` | 198, 308, 393 | Bold card titles |

---

## Color Token Violations (Phase 6)

CLAUDE.md: "Never create new color tokens — use opacity variants of existing tokens."

| File | Line | Issue |
|---|---|---|
| `src/components/UX/Notifications/ConnectionStatus.tsx` | 89 | `bg-blue-500/10` hardcoded |
| `src/payload/fields/ColorPicker/components/popover.tsx` | 20 | `bg-blue-500` hardcoded |
| `src/payload/elements/SidebarControls/client.tsx` | 52–53 | `neutral-white` custom tokens |
| `src/components/data-table/data-table-action-bar.tsx` | 121, 164 | `dark:bg-zinc-900` hardcoded |

---

## Phase 4 Status

1. ~~Missing `xl:` variants~~ — DONE (Content block fixed; others use explicit positioned grids where xl: isn't applicable; data-table files don't exist)
2. ~~Touch targets~~ — DONE (h-6/h-7 → h-11 in lists views)
3. Hover-only interactions audit — DEFERRED (needs additional recon)

## Phase 6 Status

1. ~~Typography violations~~ — DONE (font-bold → font-light on display headings; font-bold/font-semibold → font-medium on card titles and UI primitives)
2. ~~Color token violations~~ — DONE (stray bg-blue-500 removed; dark:bg-zinc-900 → dark:bg-card; ConnectionStatus semantic colors left intentionally; SidebarControls is admin context)
3. Additional recon needed: card radii (`rounded-lg` vs `rounded-sm`), container widths (`max-w-5xl` hunts), border visibility consistency — DEFERRED
