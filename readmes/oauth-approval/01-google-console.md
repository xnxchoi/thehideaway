# Google OAuth — Console Submission

Step-by-step. Tick boxes as you go. Values come from `form-filled.md`.

> Console URL: <https://console.cloud.google.com/>

---

## Phase 1 — Project & API enablement

- [ ] Sign in to the Google Cloud Console with `hideawayseoul@gmail.com`.
- [ ] Create (or open) a project named **`The Hideaway`**.
      The project ID can be auto-generated; only the name is user-visible.
- [ ] Make sure the project is selected (top-bar project switcher).

---

## Phase 2 — OAuth Consent Screen

Path: **APIs & Services → OAuth consent screen**

- [ ] User Type: `External` → Create.
- [ ] **App name:** `The Hideaway`
- [ ] **User support email:** `hideawayseoul@gmail.com`
- [ ] **App logo:** *skip for now* — optional; can be added post-approval. If
      uploading, use a square PNG ≥ 120×120, ≤ 1MB. Avoid the favicon at
      `/public/favicon.ico` — it's optimized for browser tabs, not consent
      screens. Use a dedicated `oauth-logo.png` from the brand assets folder.
- [ ] **Application home page:** `https://hideawayseoul.com`
- [ ] **Application privacy policy link:** `https://hideawayseoul.com/privacy`
- [ ] **Application terms of service link:** `https://hideawayseoul.com/terms`
- [ ] **Authorized domains:** add `hideawayseoul.com` *(only the apex — Google
      auto-covers `www.` and any subdomain whose TLS terminates on the same cert).*
- [ ] **Developer contact information:** `hideawayseoul@gmail.com`
- [ ] Save and continue.

### Scopes step

- [ ] Click **Add or Remove Scopes**.
- [ ] Tick exactly these three:
      - [ ] `.../auth/userinfo.email`
      - [ ] `.../auth/userinfo.profile`
      - [ ] `openid`
- [ ] Update → Save and continue. **No restricted scopes.**

### Test users step

- [ ] Add at least your own email + one or two trusted testers. This is only
      relevant while the app is in `Testing`. Skip once you push to production.
- [ ] Save and continue → Back to dashboard.

---

## Phase 3 — Credentials (the actual OAuth client)

Path: **APIs & Services → Credentials → + Create credentials → OAuth client ID**

- [ ] **Application type:** `Web application`
- [ ] **Name:** `The Hideaway — Web` (internal, not user-visible)
- [ ] **Authorized JavaScript origins:**
      ```
      https://hideawayseoul.com
      http://localhost:3000
      ```
- [ ] **Authorized redirect URIs:**
      ```
      https://hideawayseoul.com/api/auth/callback/google
      http://localhost:3000/api/auth/callback/google
      ```
- [ ] Create.
- [ ] Copy the **Client ID** → set as `GOOGLE_CLIENT_ID` on the production VPS.
- [ ] Copy the **Client Secret** → set as `GOOGLE_CLIENT_SECRET` on the
      production VPS. **Don't commit this anywhere.**

---

## Phase 4 — Publish to production

Path: **OAuth consent screen → Publishing status → Publish app**

- [ ] Confirm the publish dialog. For **non-sensitive scopes (email + profile
      only)** Google approves without manual review — you should see the status
      flip from `Testing` → `In production` immediately.
- [ ] If Google asks for verification, that means a sensitive/restricted scope
      slipped in. Go back to Phase 2 → Scopes and remove anything beyond
      `email`, `profile`, `openid`.

---

## Phase 5 — Smoke test

After deploy + DNS:

- [ ] Open an incognito window.
- [ ] Go to `https://hideawayseoul.com/sign-in`.
- [ ] Click **Sign in with Google**.
- [ ] Confirm the consent screen shows:
      - [ ] App name: **The Hideaway**
      - [ ] No "unverified app" warning (would mean publish didn't take effect)
      - [ ] Privacy + Terms links resolve to your pages
      - [ ] Only `email` + `profile` scopes are requested
- [ ] Approve and confirm you land back on the site authenticated.

If the consent screen still says "Test" or shows `hideawayseoul@gmail.com` as
the publisher email instead of "The Hideaway" as the app name, the publish step
in Phase 4 didn't go through — return to the OAuth consent screen page and
re-publish.

---

## Common gotchas

| Symptom                                                     | Cause                                                    | Fix                                                                              |
|-------------------------------------------------------------|----------------------------------------------------------|----------------------------------------------------------------------------------|
| `redirect_uri_mismatch` on auth                             | Callback URL not registered                              | Add `…/api/auth/callback/google` exactly to redirect URIs                        |
| `This app isn't verified`                                   | Restricted scopes selected, or publish hasn't taken      | Remove non-essential scopes; click **Publish app**                               |
| Consent screen shows raw email instead of app name          | Consent screen step never saved                          | Re-enter the OAuth consent screen form, save, publish again                      |
| `invalid_client` from Better Auth                           | Wrong client ID or secret on the VPS                     | Re-copy from Credentials → OAuth 2.0 Client → ⋮ → Reset secret if compromised   |
| Auth works locally but breaks on prod                       | `NEXT_PUBLIC_BETTER_AUTH_URL` still pointing to localhost | Set it to `https://hideawayseoul.com` and rebuild                                |

---

## Reference screenshot

The consent-screen review may surface a screenshot of where the Google login
button appears. Use:

- `screenshots/01-sign-in-page.png` (desktop)
- `screenshots/01b-sign-in-mobile.png` (mobile)

Replace with `…-prod.png` captures once the live HTTPS site is up.
