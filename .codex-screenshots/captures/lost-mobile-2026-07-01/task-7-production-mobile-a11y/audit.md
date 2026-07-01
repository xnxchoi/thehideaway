# LOSTINSEOUL Mobile Loop 7

Viewport: `390 x 844`

Targets:

- Production baseline: `https://lostinseoul.com/lostinseoul` on deployed `v33.0.16`
- Local patched verification: `http://localhost:3000/lostinseoul`

## Step 1 - Production Statement Collision

Screenshot: `01-storefront.png`
Snapshot: `01-storefront-snapshot.md`

Health: needs fix.

- Production has no console errors in the captured browser state.
- At scroll position `892`, the fixed mobile chrome and header actions sit over the statement section. The controls no longer overprint the product section, but the statement band still scrolls too high under the chrome.
- Product catalog remains empty on production, so product-density QA still needs representative catalog content.

## Step 2 - Local Hero Action After Fix

Screenshot: `05-local-top-final.png`
Snapshot: `05-local-top-final-snapshot.md`

Health: improved.

- The hero media action now exposes visible mobile text: `Watch video`.
- The action still keeps the icon affordance and 64px control height, preserving the existing chrome style while making the purpose clear.
- Browser state reported `0` console errors and `1` warning during local verification.

## Step 3 - Local Statement After Fix

Screenshot: `06-local-statement-final.png`
Snapshot: `06-local-statement-final-snapshot.md`

Health: improved.

- The statement section now uses a mobile chrome-safe top offset.
- Measured at the formerly bad scroll position `892`: header controls bottom at `122px`, lede top at `144px`, leaving a `22px` visible gap.
- The fixed chrome no longer intersects the statement copy.

## Verification

- RED: `pnpm vitest run 'src/app/(frontend)/(site)/(pages)/lostinseoul/mobile-chrome-state.test.ts'` failed before `mobile-chrome-state.ts` existed.
- GREEN: `pnpm vitest run 'src/app/(frontend)/(site)/(pages)/lostinseoul/mobile-chrome-state.test.ts'`
- Regression checks: `pnpm vitest run 'src/app/(frontend)/(site)/(pages)/lostinseoul/product-section-state.test.ts' 'src/app/(frontend)/(site)/(pages)/lostinseoul/cart-line-image.test.ts' 'src/app/(frontend)/(site)/(pages)/lostinseoul/products/[slug]/product-mobile-buybar-state.test.ts' 'src/lib/routes/auth.test.ts' 'src/proxy.test.ts'`
- Formatting: `pnpm exec prettier --check` on touched files.
- Targeted lint: `pnpm exec eslint` on touched files exited with `0` errors and existing `@next/next/no-img-element` warnings in `components.tsx`.

## Remaining Limits

- Production catalog is still empty, so mobile browse-to-buy QA remains blocked on production-safe product content or staging fixtures.
- Generic Hideaway sign-in remains a LOST checkout context issue.
- Full keyboard and screen-reader traversal was not completed in this loop.
