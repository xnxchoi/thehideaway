# LOSTINSEOUL Mobile Loop 6

Viewport: 390 x 844
Target: `http://localhost:3000/lostinseoul`

## Step 1 - Products section after chrome patch

Screenshot: `01-products-chrome-separated-390.png`

Health: improved.

- The top chrome now has an opaque mobile backing layer, so product content does not visually overprint the logo/search/cart controls.
- The centered `LOSTINSEOUL` wordmark and the search/cart row are separated vertically at 390px.
- Local data contains product fixtures, so this screenshot verifies the chrome layer with populated cards, not the production-empty catalog.

## Remaining Limit

The production catalog is still empty. The empty-catalog label is covered by `product-section-state.test.ts`; visual verification of the production-empty state requires either production content publishing or a production-safe fixture decision.
