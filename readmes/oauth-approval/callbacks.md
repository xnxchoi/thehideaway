# OAuth Approval Callback Report

Generated: `2026-06-04T02:00:41.833Z`
Base URL: `https://hideawayseoul.com`

Use the `redirect_uri` values below in provider consoles. They are read from the app's actual Better Auth redirect responses and should supersede hand-derived callback guesses.

| Provider | Type | Status | redirect_uri |
|---|---|---:|---|
| google | native | 200 | `https://hideawayseoul.com/api/auth/callback/google` |
| naver | generic-oauth | 200 | `https://hideawayseoul.com/api/auth/oauth2/callback/naver` |
| kakao | generic-oauth | 200 | `https://hideawayseoul.com/api/auth/oauth2/callback/kakao` |

## Provider Authorization URLs

### google

Authorization URL:
```
https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=969293287204-ljsaa5nels91a2qnbs5v8qtncobo8urr.apps.googleusercontent.com&state=wV_hFFDOyO_tSzo3isLZjLBVIdvjLUEe&scope=email+profile+openid&redirect_uri=https%3A%2F%2Fhideawayseoul.com%2Fapi%2Fauth%2Fcallback%2Fgoogle&code_challenge_method=S256&code_challenge=5H97wpNXooxxDjReQuAW7TnaQ0fION7qJPIePDAH5vs&include_granted_scopes=true
```

### naver

Authorization URL:
```
https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=I8ZvzV6f2jDy4XSHvG1s&state=1_fGPlc9gxAmuaqR1JBt21V7j6yJSr7y&scope=profile+email&redirect_uri=https%3A%2F%2Fhideawayseoul.com%2Fapi%2Fauth%2Foauth2%2Fcallback%2Fnaver
```

### kakao

Authorization URL:
```
https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=0248bf37cbadcbd0cb4f90ca7d5bfd0f&state=ZNE-OK6V_PnVBsUm3GkiQdSVUeXH8XPL&scope=profile_nickname+account_email&redirect_uri=https%3A%2F%2Fhideawayseoul.com%2Fapi%2Fauth%2Foauth2%2Fcallback%2Fkakao
```

