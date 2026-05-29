# LOSTINSEOUL Reconciliation - 2026-05-29

This pass reconciled the local dirty LOSTINSEOUL work from
`/Users/seanschoi/WebstormProjects/thehideaway` onto remote `origin/main`
commit `e9f175a7` in the isolated Codex worktree
`/Users/seanschoi/.codex/worktrees/d8bc/thehideaway`.

## Policy Applied

- Remote wins by default for equivalent overlap.
- Remote always wins for motion, animation, transitions, and interaction
  timing.
- Local changes were treated as source material, not as a patch to apply
  wholesale.
- The primary worktree was not edited during reconciliation analysis. Before
  updating it, preserve its failed merge/revert residue with a named stash and
  fast-forward only.

## Decisions

| Area                                                                                   | Winner                                  | Reason                                                                                                                                                                                                                                | Rejected alternative                                                                                                          |
| -------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| LOSTINSEOUL motion utilities, cursor theme, cart frame, hero/product animation helpers | Remote                                  | The remote branch had dedicated tested motion modules and the user set motion-related conflicts to remote-always-wins.                                                                                                                | Local staged deletes of the remote motion utility files, plus local Lenis/runtime rewrites and scroll-observer shell changes. |
| Better Auth UI fork path                                                               | Remote                                  | Remote moved the fork to `src/lib/external/betterauth-ui`; build verification showed `tsconfig.json` still pointed at the old path, so the alias was corrected to preserve the remote move.                                           | Local rollback residue that moved `betterauth-ui` back under `src/lib/auth`.                                                  |
| Product variants in LOSTINSEOUL queries and UI                                         | Local functionality inside remote shell | Local had broader product variant coverage. The implementation keeps the remote product page structure and motion imports, then adds variant normalization, variant selection, translated stock labels, and variant-aware cart lines. | Wholesale local `product.client.tsx`, including LostHeader/Lenis bridge and motion-affecting scroll changes.                  |
| Cart serialization                                                                     | Local functionality                     | Server checkout resolution already understood `variantId`; local client work completed the missing client-to-server serialization and display path.                                                                                   | Rest/spread serialization that could leak client-only display fields or lose variant display context.                         |
| Collection drop navigation data                                                        | Local data fix                          | Local collection query returned active drops; remote collection page passed an empty drop list. The page now keeps remote `LostStorefront` and passes `collection.drops`.                                                             | Local `LostCollectionStorefront`, which was tied to local motion/Lenis changes.                                               |
| Standalone cart page stylesheet                                                        | Local fix from browser evidence         | Browser verification showed the cart page used LOSTINSEOUL CSS variables without loading the stylesheet, causing black-on-black rendering. Importing `../index.css` fixed the cart while preserving remote layout.                    | Leaving cart visually unreadable because the issue was discovered during the variant-cart verification path.                  |
| LOSTINSEOUL seed fixture                                                               | Local                                   | `package.json` already had `seed:lost-products`, but the target script was missing. The adopted fixture creates drops, categories, products, media, variants, and a request-to-order campaign.                                        | No seed file, which made product/detail flows harder to test with real data.                                                  |
| Seed media in shared local DB / isolated worktree                                      | Local hardening                         | The shared DB can contain media records whose files exist in another worktree. The seed now restores missing `public/media` originals for existing seed media docs before reusing them.                                               | Existing-media short-circuit that left broken images in this worktree.                                                        |
| Favicon worker, reference GLB duplicates, global transition page-group changes         | Remote / no adoption                    | These were outside the LOSTINSEOUL data/cart scope or transition-related.                                                                                                                                                             | Local untracked `public/scripts/favicon.worker.js`, `reference/oflyn/*.glb`, and transition page-group edits/tests.           |

## Council Verdict

The review council converged on the same rule: keep the remote motion and
platform shell, extract only local non-motion product data, cart, collection,
and seed coverage, and avoid broad local file adoption.

## Verification

- `pnpm vitest run src/lib/lost-commerce/queries.test.ts src/lib/lost-commerce/useLostCart.test.ts src/lib/lost-commerce/cart.test.ts src/app/(frontend)/(site)/(pages)/lostinseoul/*-motion.test.ts src/app/(frontend)/(site)/(pages)/lostinseoul/cursor-theme.test.ts`
  - Passed: 12 files, 67 tests.
- `pnpm exec prettier --check ...`
  - Passed for touched files.
- `pnpm exec eslint ...`
  - Passed with existing `@next/next/no-img-element` warnings on LOSTINSEOUL image surfaces.
- `pnpm build`
  - Passed with explicit local dummy env values and `SKIP_ENV_VALIDATION=1`.
  - Local DB emitted existing dev-fixture production-sanity warnings during static generation; build still completed.
- `pnpm test`
  - Failed on one unrelated Day n Night visual contract:
    `src/app/(frontend)/(site)/(content)/tickets/[event]/page.client.visual-contract.test.ts`
    expected `max-w-[460px]` but current source has `max-w-184`.
- Browser checks:
  - `/lostinseoul` rendered seeded products.
  - `/lostinseoul/products/parasol-0230` rendered product images, variants, translated stock status, and remote detail-panel motion.
  - Selecting `Smoke / Blue` and adding to cart persisted the variant label.
  - `/lostinseoul/cart` and `/lostinseoul/checkout` displayed the
    `Smoke / Blue` variant line.
  - `/lostinseoul/collections/available-now` rendered the expected collection products.
  - Mobile viewport `390x844` showed product, variants, direct purchase, and cart controls.
