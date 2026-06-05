# Going public — pre-flip checklist

> **Status:** The repo is currently **private** (`xnxchoi/thehideaway`).
> This document captures everything that must happen _before_ the visibility
> flips to public, because the git history contains real secrets that were
> tracked at one point.

If you flip the repo to public without doing this, every secret listed in
section 2 below becomes world-readable forever via the git history — even
after you delete the file. GitHub's secret scanning will find them within
minutes and start sending exposure alerts to the providers.

---

## 1. Why this doc exists

`.env` and `.env.local` were committed to git from early in the project's
life (since `2025-09-17` for `.env`, `2026-03-10` for `.env.local`). They
contained real values for production-grade credentials. They have since been
untracked (see `chore(env)` commit) but the historical commits still hold
the old values.

While the repo stays private, only collaborators with read access can see
those values. The day visibility changes, that audience becomes everyone.

---

## 2. Secrets that are in git history

Every variable listed below was at some point committed with a real value.
**All of these must be rotated before the visibility flip**, regardless of
whether you also rewrite git history (section 3).

### High-impact (auth + payment + DB)

| Variable                                        | Where to rotate                                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `PAYLOAD_SECRET`                                | Generate: `openssl rand -hex 32`. Update `.env.production` on the VPS, restart.                                                 |
| `BETTER_AUTH_SECRET`                            | Generate: `openssl rand -hex 32`. Update `.env.production`, restart. **Invalidates all active sessions** — users sign in again. |
| `CRON_SECRET`                                   | Generate: `openssl rand -hex 16`. Update `.env.production`, restart.                                                            |
| `PREVIEW_SECRET`                                | Generate: `openssl rand -hex 16`. Update `.env.production`, restart.                                                            |
| `DATABASE_URI` password (= `POSTGRES_PASSWORD`) | Stop pg container, `ALTER USER postgres PASSWORD '<new>'`, update `.env.production`, restart.                                   |

### OAuth (Google + Naver + Kakao)

| Variable                    | Where to rotate                                                                                                                                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GOOGLE_CLIENT_SECRET`      | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client → ⋮ → Reset secret. Then update `.env.production`.                                                                                                                        |
| `AUTH_ADMINS_GOOGLE_SECRET` | Same flow on the _admin_ OAuth client.                                                                                                                                                                                                            |
| `AUTH_NAVER_SECRET`         | Naver Developers → 내 애플리케이션 → 개요 → Client Secret → 재발급 (Re-issue). Update `.env.production`.                                                                                                                                          |
| `AUTH_KAKAO_SECRET`         | Kakao Developers → 내 애플리케이션 → 카카오 로그인 → 보안 → Client Secret. Rotate and update `.env.production`.                                                                                                                                   |
| (`*_ID` values)             | OAuth _client IDs_ are not strictly secret — they're sent to the browser on every consent screen. Leaking them lets someone impersonate the consent screen ("phishing"), but they cannot mint tokens. Rotate only if you suspect active phishing. |

### Third-party API keys

| Variable                | Where to rotate                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| `BREVO_SMTP_PASS`       | Brevo dashboard → Settings → SMTP & API → SMTP → regenerate.                                        |
| `UNSPLASH_ACCESS_KEY`      | Unsplash → Your Applications → app → ⋮ → Regenerate access key.                                     |
| `HOLIDAY_API_KEY`       | data.go.kr → My Page → API → Re-issue.                                                              |
| `EXCHANGE_RATE_API_KEY` | koreaexim.go.kr → My Page → API key reset. (Free tier; low impact.)                                 |
| `MAPBOX_API_KEY`        | Mapbox → Account → Access tokens → rotate. Restrict the new token to `hideawayseoul.com` referrers. |
| `SPOTIFY_*`             | Spotify Developer Dashboard → app → Rotate client secret. (Dev-only.)                               |

### Dev-only (no rotation strictly needed)

| Variable              | Note                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `DEV_BUTLER_PASSWORD` | Only meaningful in dev (`NODE_ENV !== 'production'`). Pick a new local value, no further action. |
| `DEV_READER_PASSWORD` | Same.                                                                                            |

---

## 3. (Optional) Scrubbing git history

Rotation is the _real_ fix. History rewrite is cosmetic — it stops casual
crawlers from finding the old values, but anyone who cloned the repo while
visibility was public already has the secrets locally.

If you still want to scrub:

```bash
# Install git-filter-repo (the BFG successor recommended by git docs):
brew install git-filter-repo

# CLONE a fresh mirror — never run filter-repo against your working repo.
cd /tmp
git clone --mirror https://github.com/xnxchoi/thehideaway.git
cd thehideaway.git

# Remove the env files from EVERY commit in EVERY branch.
git filter-repo \
  --invert-paths \
  --path .env \
  --path .env.local

# Force-push the rewritten history.
# WARNING: rewrites SHAs. Every collaborator must re-clone afterward.
git push --force --all
git push --force --tags
```

After the rewrite:

- Every open pull request points to dead SHAs. Re-open them against the new history.
- Every CI cache that keyed on commit SHA is invalid. Clear it.
- Every collaborator's local clone is broken until they re-clone.

For a private repo about to go public, this is **only worth it if** you've
already rotated everything (which makes history scrubbing redundant) and
want to remove the historical clutter from the GitHub blob storage. Almost
always the rotation alone is enough.

---

## 4. Pre-flip checklist

Run this in order. Don't flip visibility until every box is checked.

- [ ] All secrets in section 2 rotated, new values deployed, old values revoked at the provider.
- [ ] `pnpm tsc --noEmit | grep "error TS" | wc -l` is at or below the current TYPE_DEBT.md baseline.
- [ ] `pnpm build` succeeds locally.
- [ ] Production smoke test: sign-in flows for Google + Naver + Kakao work with the rotated secrets.
- [ ] `gitleaks detect --no-banner` returns clean against the current working tree.
  ```bash
  # Quick install: brew install gitleaks
  gitleaks detect --no-banner
  # Or against history (slower):
  gitleaks detect --no-banner --log-level error
  ```
- [ ] `git log --all -p -- .env .env.local | head` shows no NEW secret material added since the rotation.
- [ ] LICENSE file present and correct for public visibility.
- [ ] README.md is presentable (no "TODO before public release" / personal notes).
- [ ] `.github/CODEOWNERS` reflects who should review PRs.
- [ ] Any private vendor mirrors (`src/lib/auth/betterauth-ui/`, `reference/`) audited for license compatibility.
- [ ] Decide on issue templates, PR templates, contribution policy.
- [ ] Flip visibility.
- [ ] Within 24h, check GitHub's security tab for any secret-scanning alerts; if any fire, treat them as new exposures and rotate again.

---

## 5. Going forward (after the flip)

- Treat every PR like an outside contribution. Don't merge a PR that
  introduces a new tracked `.env*` file — the gitignore + tooling should
  catch it but trust pre-commit hooks, not human review.
- Install [`gitleaks`](https://github.com/gitleaks/gitleaks) as a GitHub
  Action or a pre-commit hook to fail builds that introduce secrets.
- Periodically (quarterly?) re-check the production secret values against
  the providers — were any rotated by the provider's own policy? Make sure
  the deployed values still work.
