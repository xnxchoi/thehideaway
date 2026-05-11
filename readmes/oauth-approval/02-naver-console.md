# Naver Login — Console Submission

Step-by-step. Tick boxes as you go. Values come from `form-filled.md`.

> Console URL: <https://developers.naver.com/apps/>
> Login with the Naver ID that owns `hideawayseoul`.

Naver review is hands-on (a real human reads your description and clicks
through your screenshots) and tends to take **1–3 business days**. Submit early
in the week if you can.

---

## Phase 1 — Create application

Path: **Application → 애플리케이션 등록 (Register Application)**

- [ ] **애플리케이션 이름 (App name, Korean):** `하이드어웨이`
- [ ] **사용 API:** select **네이버 로그인 (Naver Login)** — only.
      Do not check Naver Maps, Search, Papago, or any other API. Each extra API
      = extra review surface.

### 제공 정보 선택 (Permitted info)

Tick **only**:

- [ ] `이메일 주소 (Email)` — required for account linking
- [ ] `이름 (Name)` — required for the display name

Leave unchecked:

- [ ] ~~별명 (Nickname)~~
- [ ] ~~프로필 사진 (Profile image)~~
- [ ] ~~성별 (Gender)~~
- [ ] ~~생일 (Birthday)~~
- [ ] ~~연령대 (Age range)~~
- [ ] ~~휴대전화번호 (Mobile)~~

Asking for less = approval in days, not weeks.

### 환경 정보 (Environment)

- [ ] **서비스 환경:** `PC웹 (Web)`
- [ ] **서비스 URL:** `https://hideawayseoul.com`
- [ ] **네이버 로그인 Callback URL:**
      ```
      https://hideawayseoul.com/api/auth/callback/naver
      http://localhost:3000/api/auth/callback/naver
      ```
      *(Some Naver UIs accept multiple lines; some only one. If only one slot,
      enter the production URL — `localhost` callbacks are auto-allowed for the
      registered app.)*
- [ ] **Save.**

You'll now see your app's **Client ID** and **Client Secret** under the
**개요 (Overview)** tab.

- [ ] Copy **Client ID** → set as `AUTH_NAVER_ID` on the production VPS.
- [ ] Copy **Client Secret** → set as `AUTH_NAVER_SECRET` on the production VPS.

---

## Phase 2 — Submit for review (검수 요청)

Path: **내 애플리케이션 → 검수 상태 → 검수 요청**

You'll fill in two free-text fields. Both are in Korean.

### 서비스 설명 (Service description)

```
에디토리얼 에세이와 큐레이션 컬렉션을 제공하는 멤버십 기반 읽기 플랫폼입니다.
사용자는 글을 읽고, 하이라이트와 메모를 남기며, 자신만의 리스트를 구성할 수 있습니다.
```

### 네이버 로그인 사용 목적 (Naver login use case)

```
회원가입 및 로그인을 간소화하기 위해 네이버 아이디로 로그인을 사용합니다.
사용자의 이메일과 이름만 수집합니다.
```

### Required attachment — login button screenshot

Naver requires a screenshot proving the **Naver login button is rendered on the
service's login page**. Use:

- `screenshots/01-sign-in-page.png` for the dev/staging capture, **or**
- a fresh capture of `https://hideawayseoul.com/sign-in` once production is up.

The Naver button is the green `N` row, third from the top in the provider list.
That visibility is what reviewers verify.

> Recommended: submit with the production capture. Naver rejects dev-host
> screenshots intermittently if `localhost` is visible in the URL bar.

- [ ] Attach the screenshot.
- [ ] Submit.

---

## Phase 3 — Smoke test (after approval email)

When you receive `검수 완료` (review approved):

- [ ] Open an incognito window.
- [ ] Go to `https://hideawayseoul.com/sign-in`.
- [ ] Click **Sign in with Naver**.
- [ ] Confirm the consent screen shows:
      - [ ] App name: **하이드어웨이**
      - [ ] Only **이메일 주소, 이름** as requested info
      - [ ] No "검수중" (under-review) banner
- [ ] Approve and confirm you land back on the site authenticated.

---

## Common gotchas

| Symptom                                              | Cause                                                       | Fix                                                                                |
|------------------------------------------------------|-------------------------------------------------------------|------------------------------------------------------------------------------------|
| Review rejected — "스크린샷에 로그인 버튼이 없습니다" | Screenshot doesn't show the Naver-N button clearly          | Re-capture with the sign-in card filling most of the frame; save as PNG, not JPEG  |
| Review rejected — "서비스 URL 접근 불가"             | DNS/HTTPS for `hideawayseoul.com` not yet live              | Don't submit until production is publicly reachable                                |
| Review rejected — "과도한 정보 요청"                  | You ticked optional info fields you don't need              | Untick everything except email + name; resubmit                                    |
| `redirect_uri_mismatch` after approval               | Callback URL exact-match issue (trailing slash, http/https) | Edit callback in Naver console; must be byte-identical to what Better Auth sends   |
| `403 invalid_request: redirect_uri`                  | Localhost callback not in the list                          | Add `http://localhost:3000/api/auth/callback/naver` as a second callback           |
| Approved but consent screen feels English-default    | Browser locale; Naver consent inherits from Naver session   | Test with `?lang=ko` or via a Korean-locale browser to verify the Korean copy lands |

---

## Reference screenshots

Both of these capture the Naver button correctly:

- `screenshots/01-sign-in-page.png` — desktop, 1440×900
- `screenshots/01b-sign-in-mobile.png` — mobile, 390×844 (iPhone 14 Pro size)

Either works for the upload, but the desktop one is what Naver historically
prefers.
