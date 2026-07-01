# LOSTINSEOUL Mobile Audit - Task 1

Capture target: `http://localhost:3000/lostinseoul`

Capture frame: 390 x 844 mobile viewport. Screenshots were rendered from the current local dev server through a transient same-origin audit frame; the retained local frame copy is `mobile-frame.html`.

## Step 1 - Storefront Entry

Screenshot: `01-storefront-mobile.jpg`

Strengths:
- The first screen clearly communicates the restored-project mood and the `LOSTINSEOUL` brand without relying on explanatory copy.
- Search and cart controls remain visible in the header, and the cart count is legible.

UX issues:
- The hero interaction target is visually ambiguous: the centered expand control floats over the image without a clear label.
- The `Products` affordance appears low in the viewport and reads more like a card than the primary path into shopping.

Accessibility risks:
- The icon-only search and centered image action need accessible names and focus-visible states verified in code/browser interaction.
- The small floating image action may be below the comfortable touch-target floor unless its hit area is larger than its visible square.

Evidence limits:
- This screenshot confirms responsive layout and visible hierarchy only. Keyboard order, screen-reader labels, and actual target bounds still need DOM or interaction checks.

## Step 2 - Collection Entry

Screenshot: `02-collection-mobile.jpg`

Strengths:
- The collection shell keeps the same brand, cart, search, and cinematic image treatment as the storefront.
- The collection title and dispatch label are visible without requiring scroll.

UX issues:
- The collection entry repeats the same ambiguous floating image action and low `Products` affordance from the storefront.
- The shopping path still depends on the user recognizing the bottom card as a primary action.

Accessibility risks:
- The centered image action should expose a clear accessible name, not only a visual expand glyph.
- The `Products` card likely needs focus and touch-state verification because it is the main forward path.

Evidence limits:
- The screenshot verifies the shell state but does not verify the scroll-to-products interaction or focus order.

## Step 3 - Product First View Before Fix

Screenshot: `03-product-top-mobile.jpg`

Strengths:
- Product name, price, stock state, order mode, and variants are all present in the first product view.
- The image carousel thumbs remain visible and reachable.

UX issues:
- Primary purchase actions were pushed to the viewport edge and were partly cut off on the first product view.
- The available-stock pill sits over visually busy media and competes with product artwork text.

Accessibility risks:
- Partly cut off purchase buttons increase the risk of missed or uncertain touch targets.
- The fixed header, image carousel, and purchase controls need keyboard traversal verification.

Evidence limits:
- This was captured before the code change and is retained as the failure evidence for the Task 1 fix.

## Step 4 - Product Actions After Scroll

Screenshot: `04-product-actions-mobile.jpg`

Strengths:
- Once scrolled, purchase actions, detail panels, and care/shipping sections are clear and scannable.
- The two purchase buttons are large enough and visually distinct.

UX issues:
- Requiring a scroll before the full purchase area is comfortably visible makes the product first view weaker as a commerce page.

Accessibility risks:
- Accordion controls use clear plus affordances visually; keyboard and `aria-expanded` behavior still need interaction verification.

Evidence limits:
- This screenshot verifies the scrolled visual state, not the expanded panel content.

## Step 5 - Add To Cart Feedback

Screenshot: `05-cart-after-add-mobile.jpg`

Strengths:
- The add-to-cart button changes copy immediately, so the user gets direct feedback without leaving the page.

UX issues:
- The feedback is contained inside the same button area; there is no visible path to cart from this scrolled state.

Accessibility risks:
- The changed button label should be announced to assistive technology, or paired with a live status region.

Evidence limits:
- This screenshot verifies visual feedback only. It does not confirm cart persistence or screen-reader announcement.

## Step 6 - Product First View After Fix

Screenshot: `06-product-buybar-fixed-mobile.jpg`

Strengths:
- The product first view now keeps price and both purchase actions visible at the bottom of the mobile viewport.
- The fix uses the existing `lost-product-mobile-buybar` markup rather than introducing a new purchase surface.

Remaining risks:
- The fixed buy bar duplicates the in-flow purchase buttons, so follow-up QA should check that focus order and repeated controls are not confusing.
- The stock pill/media overlap remains a polish issue, but it no longer blocks the purchase action.
