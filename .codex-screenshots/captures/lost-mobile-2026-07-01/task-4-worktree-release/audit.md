# LOSTINSEOUL Worktree / Release Safety Audit - Task 4

Audit target: current local git worktree after the LOST mobile loop.

## Evidence Checked

- `git log --oneline -5`
- `git status --short`
- `git diff --stat`
- `git diff --name-status`
- Targeted status/diff for adjacent auth-origin files

Latest commit:

```text
91c6b8ad fix: harden lost checkout mobile flow
```

## Current State

The worktree is not release-clean. Current status/diff evidence shows a large dirty surface, including:

- Deleted historical `.codex-screenshots/*` image artifacts.
- `.grave/[hashId]/*` deletions.
- Deployment, Nginx, readme, and script edits.
- Invoice, Payload admin/editor, Surf, migration, style, auth, and API-origin edits.
- New admin/editor docs and invoice scripts.
- The LOST mobile loop files from this run.

## Files Touched In This Loop

These files were intentionally edited or created during this loop:

- `src/app/(frontend)/(site)/(pages)/lostinseoul/products/[slug]/product.client.tsx`
- `src/app/(frontend)/(site)/(pages)/lostinseoul/products/[slug]/product-mobile-buybar-state.ts`
- `src/app/(frontend)/(site)/(pages)/lostinseoul/products/[slug]/product-mobile-buybar-state.test.ts`
- `src/app/(frontend)/(site)/(pages)/lostinseoul/cart-line-image.tsx`
- `src/app/(frontend)/(site)/(pages)/lostinseoul/cart-line-image.test.ts`
- `src/app/(frontend)/(site)/(pages)/lostinseoul/cart-overlay.tsx`
- `src/app/(frontend)/(site)/(pages)/lostinseoul/cart/page.client.tsx`
- `src/lib/routes/auth.ts`
- `src/lib/routes/auth.test.ts`
- `src/proxy.ts`
- `src/proxy.test.ts`
- `.codex-screenshots/captures/lost-mobile-2026-07-01/**`

The transient `public/__codex-lost-mobile-frame.html` capture helper was removed after screenshots were taken. Do not include it in any release commit.

## Adjacent Auth-Origin WIP

The worktree also contains adjacent LOST/auth-origin changes that were present outside this loop's Task 1-3 edits:

- `src/lib/api/isSameOrigin.ts`
- `src/lib/api/isSameOrigin.test.ts`
- `src/lib/auth/client.ts`
- `src/lib/auth/options.ts`
- `src/lib/auth/options.test.ts`
- `src/lib/auth/readAuthBaseURL.ts`
- `src/lib/auth/readAuthBaseURL.test.ts`

Current targeted status shows five modified files and two untracked `readAuthBaseURL` files in this adjacent group. These may belong to prior LOST auth-origin work, but they should not be silently swept into this loop's commit or silently excluded from a broader LOST auth-origin release. They need an explicit include/exclude decision.

## Verification Evidence For This Loop

Focused checks run during this loop:

- `pnpm vitest run 'src/app/(frontend)/(site)/(pages)/lostinseoul/products/[slug]/product-mobile-buybar-state.test.ts' 'src/app/(frontend)/(site)/(pages)/lostinseoul/products/[slug]/product-gallery-state.test.ts'`
- `pnpm vitest run 'src/app/(frontend)/(site)/(pages)/lostinseoul/cart-line-image.test.ts' 'src/lib/lost-commerce/useLostCart.test.ts'`
- `pnpm vitest run src/lib/routes/auth.test.ts src/proxy.test.ts src/app/api/lost/checkout/intent/route.test.ts`
- Final focused test sweep: 7 test files passed, 32 tests passed.
- Targeted `pnpm exec eslint` on the touched LOST cart, product, redirect, and checkout-intent files exited with no errors. It reported warnings for existing raw media `<img>` usage in `product.client.tsx` and one existing `@typescript-eslint/no-explicit-any` warning in `src/app/api/lost/checkout/intent/route.ts`.

Project-wide `pnpm lint` is not currently a usable release gate because the script calls `next lint`, which Next 16 interprets here as a `lint` project directory.

## Release-Safe Path

Recommendation:

- Do not run release tooling from the full current worktree.
- If committing only this loop, stage exactly the "Files Touched In This Loop" list above and exclude the adjacent auth-origin WIP unless the user explicitly wants that bundled.
- If releasing a broader LOST auth-origin bundle, first review and verify the adjacent auth-origin WIP list as part of that bundle; do not rely on this Task 4 audit alone as approval for those files.
- Leave unrelated modified/deleted files untouched unless the user explicitly asks for cleanup or splitting.
- Treat `.codex-screenshots/captures/lost-mobile-2026-07-01/**` as audit evidence. Commit it only if the project wants design-review evidence in git.

## Health

The overall worktree is not release-ready. This loop's code changes have focused verification evidence, but the broader tree needs an explicit staging split before any commit or release.
