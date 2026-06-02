# OAuth Pre-Flight

Run once before publishing Google or submitting Naver/Kakao review. If anything
is red, fix it before submitting.

## 1. DNS And TLS

```bash
dig +short hideawayseoul.com
curl -sI https://hideawayseoul.com/ | head -1
echo | openssl s_client -servername hideawayseoul.com -connect hideawayseoul.com:443 2>/dev/null | openssl x509 -noout -issuer -dates
```

- [ ] Apex resolves to the production VPS.
- [ ] HTTPS returns 200 or a redirect that lands on 200.
- [ ] Certificate is valid and not self-signed.

## 2. Public Pages

```bash
for path in / /sign-in /sign-up /privacy /terms; do
  printf "%-12s %s\n" "$path" "$(curl -s -o /dev/null -w '%{http_code}' https://hideawayseoul.com$path)"
done
```

- [ ] `/` -> 200.
- [ ] `/sign-in` -> 200 and shows Google, Naver, Kakao, passkey, email/password.
- [ ] `/sign-up` -> 200 and shows the same provider options.
- [ ] `/privacy` -> 200 and discloses Google, Naver, Kakao social sign-in data.
- [ ] `/terms` -> 200.
- [ ] No visible draft markers, dev URLs, or stale provider list.

## 3. Production Env

Run:

```bash
pnpm verify:env
pnpm env:template:verify
```

Required OAuth vars:

```env
NEXT_PUBLIC_SERVER_URL=https://hideawayseoul.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://hideawayseoul.com
COOKIE_DOMAIN=hideawayseoul.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
AUTH_NAVER_ID=...
AUTH_NAVER_SECRET=...
AUTH_KAKAO_ID=...
AUTH_KAKAO_SECRET=...
```

- [ ] Real values are set in production env or encrypted env storage.
- [ ] Service has been restarted after env changes.
- [ ] No provider secret is committed.

## 4. Callback Report

Generate screenshots and callback values:

```bash
BASE_URL=https://hideawayseoul.com pnpm oauth:approval:report
```

- [ ] `callbacks.md` exists.
- [ ] Google row has a `redirect_uri`.
- [ ] Naver row has a `redirect_uri`.
- [ ] Kakao row has a `redirect_uri`.
- [ ] Console callback values match `callbacks.md` byte-for-byte.

Expected route shapes:

```text
Google native: https://hideawayseoul.com/api/auth/callback/google
Naver generic: https://hideawayseoul.com/api/auth/oauth2/callback/naver
Kakao generic: https://hideawayseoul.com/api/auth/oauth2/callback/kakao
```

## 5. Screenshot Evidence

- [ ] `screenshots/01-sign-in-page-prod.png` shows the live production URL and
      all provider buttons.
- [ ] `screenshots/01b-sign-in-mobile-prod.png` shows the mobile provider list.
- [ ] `screenshots/02-privacy-page-prod.png` shows the live privacy page.
- [ ] `screenshots/03-terms-page-prod.png` shows the live terms page.
- [ ] `screenshots/04-homepage-prod.png` shows the public homepage.
- [ ] `screenshots/05-sign-up-page-prod.png` shows sign-up provider options.

## 6. Provider Redirects

From a fresh browser:

- [ ] Google button reaches Google OAuth without an app-side 500.
- [ ] Naver button reaches Naver Login without an app-side 500.
- [ ] Kakao button reaches Kakao Login without an app-side 500.
- [ ] Stop at provider consent/login. Do not complete login before approval.

## 7. Inbox Monitoring

- [ ] `concierge@hideawayseoul.com` is monitored for Google.
- [ ] The owning Naver account email is monitored.
- [ ] The owning Kakao Developers account email is monitored.
- [ ] `concierge@hideawayseoul.com` is monitored for reviewer contact.

## Go / No-Go

| State                              | Action                           |
| ---------------------------------- | -------------------------------- |
| All checks green                   | Submit Google, Naver, and Kakao. |
| Any public page/callback/env issue | Fix before submission.           |
| DNS/TLS not live                   | Do not submit.                   |
