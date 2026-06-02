# OAuth Approval — Historical Fill-In Form

Status: superseded by the operational packet in
[`oauth-approval/`](./oauth-approval/).

Use these current files instead:

- [`oauth-approval/README.md`](./oauth-approval/README.md) — packet index
- [`oauth-approval/form-filled.md`](./oauth-approval/form-filled.md) — provider-console values
- [`oauth-approval/callbacks.md`](./oauth-approval/callbacks.md) — generated callback URLs
- [`oauth-approval/01-google-console.md`](./oauth-approval/01-google-console.md)
- [`oauth-approval/02-naver-console.md`](./oauth-approval/02-naver-console.md)
- [`oauth-approval/03-kakao-console.md`](./oauth-approval/03-kakao-console.md)
- [`oauth-approval/04-pre-flight.md`](./oauth-approval/04-pre-flight.md)

Generate fresh screenshots and callback URLs after deploy:

```bash
BASE_URL=https://hideawayseoul.com pnpm oauth:approval:report
```

The active approval scope is Google OAuth, Naver Login, and Kakao Login. Kakao is
now implemented as a Better Auth generic OAuth provider and should be submitted
with `account_email` and `profile_nickname` only.
