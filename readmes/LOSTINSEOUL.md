# LOSTINSEOUL

Storefront at `/lostinseoul`. Code lives in `src/lostinseoul/` with App Router
pages under `src/app/(frontend)/(site)/lostinseoul/`.

Do not resume from the July 2026 footer handoff or the May 2026 reconciliation
note. Those are attic'd.

---

## Ownership

| Concern | Doc |
|---|---|
| Catalog, cart, orders, PortOne checkout | `ECOMMERCE.md` |
| Identifier names vs plugin/site hooks | `src/lostinseoul/NAMING.md` |
| Fragrance launch chapter | `LOSTINSEOUL_FRAGRANCE.md` |

Brand strings: `LOSTINSEOUL` (display, i18n) or `lostinseoul` (paths, CSS).
Never `LostInSeoul`. Path is the namespace — do not prefix `Lost*` on
components that already live under `@lostinseoul/`.

Site chrome vs storefront chrome is a React branch
(`lostinseoul` | hideaway), not a second CSS world or a parallel provider tree.
Reuse root Device / viewport / cursor providers. Do not reimplement pointer
tracking or breakpoints.

---

## Open on this scope

1. Finish the structural cleanup (prop-drilling, non-Tailwind leftovers,
   god-file splits only when a file owns two jobs).
2. WebGL / R3F / Three — shader correctness, scroll wobble, performance.
   Footer wordmark shader `#include` must be a real Three chunk, not a spaced
   GLSL directive.
3. Retire transitional `commerce-products` / `commerce-orders` once PDP reads
   plugin `products`.
4. Do not leave a partial migration that keeps stale fragments on the live
   path.

Gate: `src/proxy.ts` protects `/lostinseoul` and `/api/lost`. Hash is
`LOSTINSEOUL_GATE_PASSWORD_SHA256`.
