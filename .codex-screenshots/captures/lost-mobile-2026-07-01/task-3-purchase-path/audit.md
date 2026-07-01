# LOSTINSEOUL Mobile Audit - Task 3

Capture targets:
- `http://localhost:3000/lostinseoul/checkout`
- `POST http://localhost:3000/api/lost/checkout/intent`

Capture frame: 390 x 844 mobile viewport, rendered from the current local dev server through the transient same-origin audit frame used for this run.

## Step 1 - Anonymous Checkout Before Fix

Screenshot: `01-checkout-mobile.jpg`

Strengths:
- The route correctly requires authentication before order creation.

UX issues:
- The buyer is handed to the generic Hideaway sign-in screen, which is visually disconnected from the LOST storefront.
- Before the fix, the direct redirect URL used `callbackUrl=/lostinseoul/checkout`, but the sign-in page only consumed `redirectTo`/`redirect`, so successful sign-in could miss the checkout return path.

Accessibility risks:
- The generic sign-in screen appears crowded in the mobile frame, with global menu/command-palette chrome visible above the form.

Evidence limits:
- This screenshot confirms the anonymous redirect surface, not the post-login authenticated checkout form.

## Step 2 - Checkout Auth Redirect After Fix

Screenshot: `02-checkout-auth-redirect-fixed-mobile.jpg`

Direct URL evidence: `auth-redirect-url.json`

Strengths:
- The direct anonymous checkout redirect now lands at `/sign-in?redirectTo=%2Flostinseoul%2Fcheckout`, matching the sign-in page's success-target parser.
- The sign-in parser now also accepts legacy `callbackUrl` and `next` query names, so older protected pages keep their intended return behavior.

UX issues:
- The visual sign-in screen remains generic Hideaway rather than LOST-specific. This is no longer a functional return-path blocker, but it is still a brand/context handoff issue.

Accessibility risks:
- Full keyboard and screen-reader verification is still needed for the auth provider buttons and return flow.

## API Boundary

Probe:

```text
POST /api/lost/checkout/intent
origin: http://localhost:3000
```

Observed response:

```json
{"ok":false,"error":"unauthorized"}
```

Status: `401 Unauthorized`

Health:
- Correct. The API refuses checkout intent creation without a Payload-authenticated user.
- Existing checkout intent tests still pass for order creation, inventory reservation, rollback, and PortOne product link generation.

Verification:
- RED: `src/lib/routes/auth.test.ts` and `src/proxy.test.ts` failed on the checkout return path and legacy query support.
- GREEN: `pnpm vitest run src/lib/routes/auth.test.ts src/proxy.test.ts src/app/api/lost/checkout/intent/route.test.ts`
- Targeted lint: `pnpm exec eslint` exited cleanly for redirect and checkout intent files, with one existing `@typescript-eslint/no-explicit-any` warning in `src/app/api/lost/checkout/intent/route.ts`.
