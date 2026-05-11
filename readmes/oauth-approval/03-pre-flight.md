# Pre-Flight — Before You Submit Either Console

Run this checklist *once*, before you click "Publish app" (Google) or
"검수 요청" (Naver). If anything is red, do not submit — fix first.

---

## 1. DNS + TLS

```bash
# A record resolves to the production VPS
dig +short hideawayseoul.com

# HTTPS responds with 200 (or a 3xx that lands on 200)
curl -sI https://hideawayseoul.com/ | head -1

# Cert is valid and not self-signed
echo | openssl s_client -servername hideawayseoul.com -connect hideawayseoul.com:443 2>/dev/null | openssl x509 -noout -issuer -dates
```

- [ ] Apex resolves to the production VPS IP.
- [ ] `https://hideawayseoul.com` returns 200 (with no cert warnings in
      a real browser, not just curl).
- [ ] Issuer is a real CA (Let's Encrypt / R3 / R10 / E1 / E5 / similar).
      `notAfter` is at least 30 days out.

---

## 2. Public-facing URLs respond cleanly

```bash
for path in / /sign-in /sign-up /privacy /terms; do
  printf "%-12s %s\n" "$path" "$(curl -s -o /dev/null -w '%{http_code}' https://hideawayseoul.com$path)"
done
```

- [ ] `/` → 200
- [ ] `/sign-in` → 200 (and renders Google + Naver buttons)
- [ ] `/sign-up` → 200
- [ ] `/privacy` → 200 (and renders Restored Projects + 2026-04-15 effective date)
- [ ] `/terms` → 200

If `/privacy` renders the page but the legal entity name says
"`[PLACEHOLDER]`" or similar, your env vars or `business.ts` defaults didn't
load — fix before submitting.

---

## 3. Production env vars on the VPS

SSH in and verify these are set in the running container's env:

```bash
# Inside the production container or .env.production
NEXT_PUBLIC_SERVER_URL=https://hideawayseoul.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://hideawayseoul.com
COOKIE_DOMAIN=hideawayseoul.com

GOOGLE_CLIENT_ID=…           # set after Phase 3 of 01-google-console.md
GOOGLE_CLIENT_SECRET=…
AUTH_NAVER_ID=…              # set after Phase 1 of 02-naver-console.md
AUTH_NAVER_SECRET=…
```

- [ ] All four `NEXT_PUBLIC_*` and `COOKIE_DOMAIN` values point at the
      production domain (no `localhost`, no IP).
- [ ] Google client ID/secret present.
- [ ] Naver client ID/secret present.
- [ ] Service has been **restarted** since these were set — env changes don't
      hot-reload.

---

## 4. Callback URLs match exactly

The `redirect_uri` Better Auth sends to each provider must be a byte-perfect
match to what's registered in the console.

```bash
# Outbound redirect URI Better Auth will use
node -e 'console.log(`${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/api/auth/callback/google`)'
node -e 'console.log(`${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/api/auth/callback/naver`)'
```

- [ ] Output for Google matches the **Authorized redirect URI** registered in
      Google Cloud Console → Credentials → OAuth 2.0 Client.
- [ ] Output for Naver matches the **Callback URL** registered in Naver
      Developers → Application → API 설정.

Watch out for:

- Trailing slashes (don't add one)
- `http://` vs `https://` (production must be `https://`)
- `www.` prefix (we don't use it; production should be apex)

---

## 5. Provider buttons actually render

Open `https://hideawayseoul.com/sign-in` in a real browser:

- [ ] **Sign in with Google** button renders (with the multicolor G icon).
- [ ] **Sign in with Naver** button renders (with the green N icon).
- [ ] **Sign in with Passkey** button renders.
- [ ] Clicking each one initiates the OAuth flow without 500ing.
      (You can cancel out of the consent screen — we just need the redirect to
      happen, which proves Better Auth's client config is wired.)

If a button is missing, check `src/app/(frontend)/(site)/(auth)/authProviders.tsx`
and confirm `social.providers` includes `"google"` and
`genericOAuth.providers` includes the Naver entry.

---

## 6. Privacy + Terms render correct values

Open both pages in a real browser:

- [ ] `/privacy` — every paragraph is real prose, no `[PLACEHOLDER]` strings,
      effective date reads `2026-04-15`, contact email is
      `concierge@hideawayseoul.com`, hosting provider is `ITEasy`.
- [ ] `/terms` — same checks. Liability cap reads "fees paid in the last 12
      months". Governing law is "Republic of Korea".
- [ ] Both pages have a **language toggle** that shows the Korean version
      cleanly (Naver reviewers will check this).

---

## 7. Screenshots are current

- [ ] `screenshots/01-sign-in-page.png` was captured against
      **production HTTPS**, not localhost. (Visible URL bar matters for Naver.)
- [ ] If brand visuals changed since the dev-mode screenshots in this folder,
      re-capture with `node /tmp/hideaway-shots/capture.mjs` (point the script
      at the prod URL first).

---

## 8. Email inbox is monitored

Both consoles will email you about review status to:

- Google: `hideawayseoul@gmail.com`
- Naver: the email associated with your Naver account
- Privacy/legal contact for users: `concierge@hideawayseoul.com`

- [ ] All three inboxes are reachable and someone is checking them.
- [ ] `concierge@…` has at least an auto-acknowledgement reply set up — Naver
      reviewers occasionally email this address to test it's monitored.

---

## Final go / no-go

| All checks above are green?              | Action                                            |
|------------------------------------------|---------------------------------------------------|
| ✅ All green                              | Submit Google first (Phase 4 of `01-google-console.md`), then Naver (Phase 2 of `02-naver-console.md`). |
| ⚠️ Anything yellow                       | Fix it before submitting. Review costs days; pre-flight costs minutes. |
| 🚫 DNS/TLS not live or callbacks mismatched | Do not submit. Reviewers will reject and you'll re-queue.            |
