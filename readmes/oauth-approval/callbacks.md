# OAuth Approval Callback Report

Not generated yet for the current deployment.

Run after production has the current code and real provider env vars:

```bash
BASE_URL=https://hideawayseoul.com pnpm oauth:approval:report
```

The command overwrites this file with the exact outbound `redirect_uri` values
for Google, Naver, and Kakao.

Expected route shapes:

| Provider | Type          | Expected production shape                                  |
| -------- | ------------- | ---------------------------------------------------------- |
| Google   | native        | `https://hideawayseoul.com/api/auth/callback/google`       |
| Naver    | generic OAuth | `https://hideawayseoul.com/api/auth/oauth2/callback/naver` |
| Kakao    | generic OAuth | `https://hideawayseoul.com/api/auth/oauth2/callback/kakao` |
