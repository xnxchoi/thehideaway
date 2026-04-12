# Security Surface Audit — 2026-04-12

Inventory of backend attack surface from Phase 1 reconnaissance. Items are ordered by severity. This document is the source of truth for Phase 2 fixes.

---

## CRITICAL / HIGH

### 1. SSRF in `/api/image-courier`

**File:** `src/app/api/image-courier/route.ts` (line 12)
**Severity:** HIGH
**Issue:** Endpoint fetches arbitrary user-supplied URL with no host/IP allowlist, no private-range blocking, no redirect cap. Attacker can hit internal metadata endpoints (169.254.169.254), localhost services, or internal network.
**Contrast:** `src/app/api/link-preview/route.ts` already implements proper host validation — port that pattern.
**Fix:** Validate URL scheme (`http`/`https` only), resolve hostname, reject private/loopback/link-local ranges, cap redirects, enforce fetch timeout, cap response size, validate content-type.

### 2. SQL injection risk in `/api/search/users`

**File:** `src/app/api/search/users/route.ts` (line 48)
**Severity:** HIGH
**Issue:** Uses `sql.raw(excludeIds)` — raw SQL template construction from request-derived input.
**Fix:** Use parameterized query via `drizzle-orm` `inArray`/`notInArray` helpers or `sql.placeholder`. Validate all IDs against UUID regex before any SQL path.

### 3. Weak auth on `/api/dev`

**File:** `src/app/api/dev/route.ts`
**Severity:** HIGH
**Issue:** Only guarded by `NODE_ENV !== "development"` check. If `NODE_ENV` is misconfigured in prod (e.g., `NODE_ENV=dev` or unset), endpoint opens. PDF generator with arbitrary input.
**Fix:** Add explicit admin-role auth check via payload session. Remove entirely in production build, or hard-gate by `process.env.NODE_ENV === "development"` AND auth check.

### 4. Unbounded `getUserFollowers` / `getUserFollows`

**Files:**
- `src/payload/collections/Users/endpoints/getUserFollows.ts` (line 12)
- `src/payload/collections/Users/endpoints/getUserFollowers.ts` (line 13)

**Severity:** HIGH (data exposure + DoS)
**Issue:** No auth check. Returns up to 3000 documents per request. Scrapeable social graph.
**Fix:** Require authenticated session, add pagination (limit 50, max 100), verify requester has permission to view target's social graph (public profile check).

### 5. `overrideAccess: true` in user-triggered endpoints

**Files:**
- `src/payload/collections/Users/index.ts` — `/api/users/:id/details` inline handler
- `src/payload/collections/Profile/endpoints/getProfileBookmarks.ts` (line 24)
- `src/payload/collections/Bookmarks/createBookmark.ts` (all CRUD operations)

**Severity:** HIGH
**Issue:** Bypasses Payload's access control layer entirely. Any bugs in the endpoint's manual auth checks become privilege escalation.
**Fix:** Remove `overrideAccess: true` where possible. Where required (e.g., to read fields the user can't normally see), narrow the scope to the specific operation and re-assert ownership checks.

### 6. Possible overrides bypass in `ensureHandleIsUnique`

**File:** `src/payload/collections/Users/endpoints/ensureHandleIsUnique.ts` (line 26)
**Severity:** MEDIUM-HIGH
**Issue:** Checks `user?.role !== "admin" && user?.id !== userId` gated by `!overrides`. If `overrides` flag can be set from request body, auth is bypassed.
**Fix:** Never trust client-supplied `overrides`. Derive from server-side context only.

### 7. `createCompilation` accepts unverified `userId`

**File:** `src/payload/collections/Compilations/actions.ts`
**Severity:** HIGH
**Issue:** `createCompilation` accepts `userId` from caller without verifying it matches session user. Other ops in same file have ownership checks.
**Fix:** Ignore client-supplied `userId` — always derive from `payload.betterAuth` session.

### 8. `/api/payload-jobs/run` auth

**File:** `src/app/api/payload-jobs/run/route.ts`
**Severity:** MEDIUM (needs verification)
**Issue:** Uses `CRON_SECRET` Bearer token auth. Need to verify: timing-safe comparison, secret presence validation at startup, rejection of missing header.
**Fix:** Audit the comparison logic; use `crypto.timingSafeEqual`.

---

## MEDIUM

### 9. Missing rate limiting

No global rate limiter visible on:
- `/api/auth/**` (Better Auth should have its own, but verify)
- `/api/search/**`
- `/api/image-courier`
- `/api/link-preview`
- Form submission server actions

### 10. Error message leakage

Need pass over all `catch` blocks in route handlers to ensure stack traces / internal error messages aren't returned to client.

### 11. CSP / security headers

Verify `next.config.ts` headers block. Minimum needed:
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (or frame-ancestors via CSP)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` with nonce-based script-src

### 12. Radio stream — origin-gated + path traversal via `readFile`

**File:** `src/payload/collections/Radio/endpoints/stream.ts`
**Severity:** HIGH
**Issue:** Endpoint streams audio for any track UUID with no access restriction. Uses `readFile(track.url)` directly — if a track record's `url` field is poisoned (e.g., via compromised admin or SQL injection), attacker can read arbitrary files from the server filesystem. Note: endpoint is not actively consumed yet (Howler loads static `/track_media/*.ogg` directly), but exists for future Payload-managed tracks.
**Fix:** Origin/Referer gate (only requests from `NEXT_PUBLIC_SERVER_URL` allowed — blocks remote/hotlinking). Validate track ID as UUID. Resolve the real path via `fs.realpath` and assert it falls within the `public/track_media/` directory before reading.

### 13. UserMedia — no MIME type restrictions (SVG XSS vector)

**File:** `src/payload/collections/UserMedia.ts`
**Severity:** MEDIUM
**Issue:** Upload config has no `mimeTypes` allowlist. The `beforeOperation` hook checks `mimetype.indexOf("image")` but only gates the rename/darkmode logic — it does not reject non-image uploads. An SVG with embedded `<script>` uploaded to `public/users/` creates stored XSS when served directly.
**Fix:** Add `mimeTypes` allowlist to upload config restricting to `image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/gif`. This blocks SVG and all non-image uploads at the Payload level before hooks run.

### 14. SSE notifications stream — endpoint not implemented

**File:** `src/app/api/notifications/stream/route.ts` (missing)
**Severity:** MEDIUM (potential)
**Issue:** Client-side code (`useNotificationSSE.ts`) connects to `/api/notifications/stream` but the server-side route handler does not exist. The SSE security guide (`readmes/SSE_SECURITY_GUIDE.md`) documents auth requirements but they are unimplemented. When this endpoint is built, it must validate the session before establishing the SSE connection.
**Status:** N/A — endpoint does not exist yet. Flag for implementation review.

---

## Fix Status

| # | Issue | Status |
|---|---|---|
| 1 | SSRF on `/api/image-courier` | FIXED |
| 2 | SQL injection on `/api/search/users` | FIXED |
| 3 | Unbounded follows endpoints | FIXED |
| 4 | `/api/dev` hard-gate | FIXED |
| 5 | `ensureHandleIsUnique` overrides bypass | FIXED |
| 6 | `createCompilation` userId trust | FIXED |
| 7 | `overrideAccess: true` audit | FIXED |
| 8 | `/api/payload-jobs/run` timing-safe | FIXED |
| 9 | Rate limiting | FIXED (sliding-window in middleware.ts) |
| 10 | Error message leakage | FIXED (opaque messages in all route handlers) |
| 11 | CSP / security headers | PARTIAL (nginx has HSTS/XCO/XFO/RP but CSP is `default-src *` — no-op) |
| 12 | Radio stream origin gate + path traversal | FIXED (origin/referer gate + UUID validation + realpath containment check) |
| 13 | UserMedia MIME type restrictions | FIXED (allowlist: jpeg, png, webp, avif, gif) |
| 14 | SSE stream endpoint missing | N/A (endpoint not yet implemented — flagged for review when built) |
