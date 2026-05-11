# OAuth Approval — The Hideaway

Everything you need to submit Google OAuth and Naver Login for review, in one folder.

This is the *operational* packet — not a design doc. Open the file you need, copy
the value, paste it into the console. Each console has its own checklist.

## What's in here

```
oauth-approval/
├── README.md                ← you are here
├── form-filled.md           Source-of-truth answers (legal entity, app names, etc.)
├── 01-google-console.md     Step-by-step Google OAuth Consent Screen submission
├── 02-naver-console.md      Step-by-step Naver Developers submission
├── 03-pre-flight.md         Pre-flight checklist (env vars, callbacks, DNS)
└── screenshots/
    ├── 01-sign-in-page.png       Desktop sign-in (shows Google + Naver + Passkey)
    ├── 01b-sign-in-mobile.png    Mobile 390×844 sign-in (Naver review preview)
    ├── 02-privacy-page.png       /privacy in dark mode
    ├── 03-terms-page.png         /terms in dark mode
    ├── 04-homepage.png           Editorial home — what reviewers land on
    └── 05-sign-up-page.png       /sign-up showing the same provider buttons
```

> Screenshots in this folder were captured against `localhost:3000` in dark mode at
> 1440×900 (and 390×844 mobile) on 2026-05-08. **Naver requires a screenshot of
> the login button on the live production domain** — when you finalize the deploy,
> retake `01-sign-in-page.png` against `https://hideawayseoul.com/sign-in` and
> drop it in alongside the existing image (suffix it `…-prod.png`).

## How to use this packet

1. Read `form-filled.md` once, end-to-end. It's short. It contains every value
   you'll be asked for — legal entity, contact emails, app names, descriptions.
2. Open `01-google-console.md` and walk it top-to-bottom. Tick boxes as you go.
3. Open `02-naver-console.md` and do the same.
4. Run `03-pre-flight.md` *before* you click "Publish" / "Submit for review" in
   either console.

The two consoles can be submitted in any order, but **Google is faster to
approve** (usually same-day for non-sensitive scopes), so do Google first if
you want to test end-to-end auth in production sooner.

## Scopes we're requesting

Both providers: **email + profile only**. No restricted scopes (no Drive, no
Gmail, no Calendar, no Naver Mail, no contacts). This keeps both apps in
"non-sensitive" review territory and dramatically shortens turnaround.

If a future feature needs more scopes (e.g. importing user contacts), that's a
separate review submission — do not bundle it into this one.

## What's already done in code

- `/privacy` and `/terms` are live and use values from `src/constants/business.ts`.
  No `[PLACEHOLDER]` strings remain in those files.
- Sign-in renders Google + Naver + Passkey buttons via
  `src/app/(frontend)/(site)/(auth)/authProviders.tsx`.
- Naver provider is wired through Better Auth's generic OAuth — see
  `src/lib/auth/payload-auth/`.
- Callback handlers exist at `/api/auth/callback/google` and
  `/api/auth/callback/naver` (Better Auth's catch-all).

## What's blocking submission today

Nothing in the code. The blockers are operational:

- [ ] Production env vars set on the VPS (see `03-pre-flight.md`).
- [ ] DNS for `hideawayseoul.com` resolving to the production VPS.
- [ ] HTTPS certificate provisioned (Let's Encrypt or equivalent).
- [ ] Production smoke test of `/sign-in`, `/privacy`, `/terms` over HTTPS.

Once those are green, both consoles can be submitted the same evening.

## After approval

Once Google and Naver flip status from "Testing" → "In production":

1. Verify the consent-screen branding renders correctly (app name, logo, support
   email) on a fresh browser.
2. Run a real end-to-end auth flow on production with each provider.
3. Archive the approval emails into a separate folder (`approvals/` next to
   this one) — useful evidence if you ever need to re-verify.
