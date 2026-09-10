# LOSTINSEOUL

Storefront at `/lostinseoul`. Code lives in `src/lostinseoul/` with App Router
pages under `src/app/(frontend)/(site)/lostinseoul/`.

Do not resume from the July 2026 footer handoff or the May 2026 reconciliation
note. Those are attic'd.

---

## Ownership

| Concern | Doc |
|---|---|
| Catalog, cart, orders, PortOne checkout | `ECOMMERCE.md` (phases 0–8 done; **Phase 9 not started**) |
| Identifier names vs plugin/site hooks | `src/lostinseoul/NAMING.md` |
| Fragrance launch chapter | `LOSTINSEOUL_FRAGRANCE.md` |

Brand strings: `LOSTINSEOUL` (display, i18n) or `lostinseoul` (paths, CSS).
Never `LostInSeoul`. Path is the namespace — do not prefix `Lost*` on
components that already live under `@lostinseoul/`.

Site chrome vs storefront chrome is a React branch
(`lostinseoul` | hideaway), not a second CSS world or a parallel provider tree.
Reuse root Device / viewport / cursor providers. Do not reimplement pointer
tracking or breakpoints.

Hideaway header is skipped in React (`pathHidesHeaderByDefault("/lostinseoul")`
→ `HeaderClient` returns null). Do not hide it with `body:has()` CSS.

Chrome state (bag / search / commerce root ref / entry phase) lives in
`src/lostinseoul/page-status.tsx` as **split contexts**. Do not go back to a
`document` CustomEvent bus or prop-drill bag/search into the WebGL hero.

---

## Open on this scope

Ecommerce cutover is documented in `ECOMMERCE.md`. Do not treat storefront
polish as Phase 9.

1. Leftover non-Tailwind CSS (`src/lostinseoul/index.css` Lenis / bag-frame /
   collection-grid / entry-logo; cart-overlay `<style>`). Convert only when
   asked.
2. WebGL / R3F — scroll still felt laggy and wobbly after camera/dpr/reflector
   work (`hero-scroll-motion.ts`, `hero-three.tsx`). Footer wordmark GLSL
   must not use spaced `#include < … >` directives; the invalid clipping
   include was removed because the shader does not clip.
3. Do not leave stale `/api/lost/cart` or `/api/commerce` callers on the live
   path (Phase 8 retirement test). Product webhook is
   `/api/payments/portone/webhooks`; membership stays
   `/api/lost/webhooks/portone`.

Gate: `src/proxy.ts` protects `/lostinseoul` and `/api/lost`. Hash is
`LOSTINSEOUL_GATE_PASSWORD_SHA256`.
