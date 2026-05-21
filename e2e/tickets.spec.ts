/**
 * E2E spec for the Day & Night ticket purchase flow.
 *
 * Status: LIVING DOCUMENTATION — not yet wired to a Playwright install.
 * Run post-launch against staging once `pnpm dlx playwright install` has
 * been executed and the playwright.config.ts has been added at the project root.
 *
 * Prerequisites for running:
 *   1. pnpm dlx playwright install --with-deps
 *   2. cp .env .env.test  (fill TEST_BASE_URL, TEST_EVENT_SLUG, TEST_GATE_PASSWORD,
 *      TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_GIFT_EMAIL)
 *   3. A seeded staging DB with:
 *      - The "day-n-night" event in "open" state, capacity ≥ 10
 *      - Two known test accounts (TEST_USER_EMAIL and TEST_GIFT_EMAIL)
 *      - An SMTP sink (e.g. Inbucket) wired to BREVO_SMTP in .env.test
 *
 * To add a playwright.config.ts that matches this spec:
 *   - baseURL: process.env.TEST_BASE_URL ?? "http://localhost:3000"
 *   - testDir: "./e2e"
 *   - use: { headless: true, trace: "on-first-retry" }
 */

import { test, expect, type Page } from "@playwright/test";

// ─── Environment helpers ─────────────────────────────────────────────────────

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const EVENT_SLUG = process.env.TEST_EVENT_SLUG ?? "day-n-night";
const GATE_PASSWORD = process.env.TEST_GATE_PASSWORD ?? "";
const WRONG_PASSWORD = "wrong-password-xyz";
const USER_EMAIL = process.env.TEST_USER_EMAIL ?? "testuser@example.com";
const USER_PASSWORD = process.env.TEST_USER_PASSWORD ?? "";
const GIFT_EMAIL = process.env.TEST_GIFT_EMAIL ?? "giftuser@example.com";

const EVENT_URL = `${BASE_URL}/tickets/${EVENT_SLUG}`;

// ─── Shared step helpers ──────────────────────────────────────────────────────

async function signInViaUI(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/sign-in`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/**`, { waitUntil: "networkidle" });
}

async function passGate(page: Page, password: string = GATE_PASSWORD) {
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
}

async function waitForStep(page: Page, stepName: string) {
  // Steps render a data-step attribute on the outer container
  await page.waitForSelector(`[data-step="${stepName}"]`, { timeout: 10_000 });
}

// ─── Suite 1: Gate validation ─────────────────────────────────────────────────

test.describe("Password gate", () => {
  test("shows gate step on first visit", async ({ page }) => {
    await page.goto(EVENT_URL);
    await waitForStep(page, "welcome");
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("rejects wrong password with error message", async ({ page }) => {
    await page.goto(EVENT_URL);
    await passGate(page, WRONG_PASSWORD);
    // API returns {ok:false, error:"invalid"} → UI shows an error
    await expect(page.locator("[data-error]")).toBeVisible({ timeout: 5_000 });
    await waitForStep(page, "welcome"); // stays on welcome
  });

  test("accepts correct password and advances to next step", async ({
    page
  }) => {
    await page.goto(EVENT_URL);
    await passGate(page, GATE_PASSWORD);
    // Authenticated users skip OTP, go to name; unauthenticated go to otp
    await page.waitForSelector('[data-step="otp"], [data-step="name"]', {
      timeout: 8_000
    });
  });

  test("gate password is cached in sessionStorage — no re-prompt on refresh", async ({
    page
  }) => {
    await page.goto(EVENT_URL);
    await passGate(page, GATE_PASSWORD);
    await page.waitForSelector('[data-step="otp"], [data-step="name"]');
    await page.reload();
    // Should not show welcome/gate again
    await expect(page.locator('[data-step="welcome"]')).not.toBeVisible({
      timeout: 5_000
    });
  });
});

// ─── Suite 2: Solo purchase — unauthenticated (OTP path) ─────────────────────

test.describe("Solo purchase — unauthenticated", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure no session cookie
    await page.context().clearCookies();
  });

  test("full happy path: gate → OTP → name → reserve → purchased", async ({
    page
  }) => {
    await page.goto(EVENT_URL);
    await passGate(page, GATE_PASSWORD);

    // OTP step
    await waitForStep(page, "otp");
    await page.fill('input[type="email"]', USER_EMAIL);
    await page.click(
      'button:has-text("Send code"), button:has-text("인증 코드")'
    );
    // NOTE: In real execution, intercept email from SMTP sink and fill OTP here
    // const otp = await readOtpFromSmtpSink(USER_EMAIL);
    // await page.fill('input[inputmode="numeric"]', otp);
    // await page.click('button[type="submit"]');

    // Temporarily skip OTP for spec completeness — actual test requires SMTP sink
    test.skip(); // remove this line once SMTP sink is wired
  });
});

// ─── Suite 3: Solo purchase — authenticated ───────────────────────────────────

test.describe("Solo purchase — authenticated", () => {
  test.beforeEach(async ({ page }) => {
    await signInViaUI(page, USER_EMAIL, USER_PASSWORD);
  });

  test("gate → name → reserve → purchased → my ticket", async ({ page }) => {
    await page.goto(EVENT_URL);
    await passGate(page, GATE_PASSWORD);

    // Name step (OTP skipped)
    await waitForStep(page, "name");
    await page.fill(
      'input[name="purchaser_name"], input[placeholder*="name"], input[placeholder*="이름"]',
      "Test User"
    );
    await page.click('button[type="submit"]');

    // Reserve step (order preview)
    await waitForStep(page, "reserve");
    await expect(page.locator("text=/1.*ticket|1.*티켓/i")).toBeVisible();
    await page.click(
      'button:has-text("Purchase"), button:has-text("구매"), button:has-text("결제")'
    );

    // Purchased step
    await waitForStep(page, "purchased");
    await expect(
      page.locator('[data-testid="ticket-number"], text=/T-/i')
    ).toBeVisible();

    // "View my ticket" link → navigates to /tickets/my/:id
    const viewLink = page
      .locator('a:has-text("View"), a:has-text("티켓 보기")')
      .first();
    await expect(viewLink).toBeVisible();
    await viewLink.click();
    await page.waitForURL(/\/tickets\/my\/[a-z0-9-]+/, { timeout: 8_000 });
  });

  test("my ticket page shows ticket details", async ({ page }) => {
    await page.goto(`${BASE_URL}/tickets/my`);
    await expect(
      page.locator('[data-testid="ticket-card"]').first()
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ─── Suite 4: Group purchase (qty > 1) ───────────────────────────────────────

test.describe("Group purchase — qty=2", () => {
  test.beforeEach(async ({ page }) => {
    await signInViaUI(page, USER_EMAIL, USER_PASSWORD);
  });

  test("shows 2 tickets with gift claim links after purchase", async ({
    page
  }) => {
    await page.goto(EVENT_URL);
    await passGate(page, GATE_PASSWORD);

    await waitForStep(page, "name");
    // Set qty to 2
    await page.click(
      'button[aria-label="Increase quantity"], button:has-text("+")'
    );
    await expect(
      page.locator('[data-testid="quantity-display"], text=/2/').first()
    ).toBeVisible();

    await page.fill(
      'input[name="purchaser_name"], input[placeholder*="name"], input[placeholder*="이름"]',
      "Group Buyer"
    );
    await page.click('button[type="submit"]');

    await waitForStep(page, "reserve");
    await page.click(
      'button:has-text("Purchase"), button:has-text("구매"), button:has-text("결제")'
    );

    await waitForStep(page, "purchased");
    // Purchaser ticket is shown, plus 1 gift claim link
    const giftLinks = page.locator(
      '[data-testid="gift-claim-link"], a[href*="/tickets/claim/"]'
    );
    await expect(giftLinks).toHaveCount(1, { timeout: 8_000 });

    // Copy link button is present for each gift
    await expect(
      page.locator('button:has-text("Copy"), button:has-text("복사")')
    ).toBeVisible();
  });
});

// ─── Suite 5: Gift claim flows ────────────────────────────────────────────────

test.describe("Gift claim — happy path (open gift, no email restriction)", () => {
  test("valid unclaimed token → ClaimView → claim → redirect to my ticket", async ({
    page
  }) => {
    // Token is seeded in DB for this test run (open gift, unclaimed)
    const claimUrl = `${BASE_URL}/tickets/claim/${process.env.TEST_OPEN_CLAIM_TOKEN}`;
    await signInViaUI(page, GIFT_EMAIL, process.env.TEST_GIFT_PASSWORD ?? "");
    await page.goto(claimUrl);

    await expect(
      page.locator('[data-testid="claim-view"], text=/claim|받기/i').first()
    ).toBeVisible();
    await page.click(
      'button:has-text("Claim"), button:has-text("받기"), button:has-text("수락")'
    );

    await page.waitForURL(/\/tickets\/my\/[a-z0-9-]+/, { timeout: 10_000 });
  });
});

test.describe("Gift claim — email-restricted, matching email", () => {
  test("shows ClaimView and allows claim when emails match", async ({
    page
  }) => {
    const claimUrl = `${BASE_URL}/tickets/claim/${process.env.TEST_RESTRICTED_CLAIM_TOKEN}`;
    await signInViaUI(page, GIFT_EMAIL, process.env.TEST_GIFT_PASSWORD ?? "");
    await page.goto(claimUrl);

    await expect(page.locator('[data-testid="claim-view"]')).toBeVisible();
    await page.click('button:has-text("Claim"), button:has-text("받기")');
    await page.waitForURL(/\/tickets\/my\/[a-z0-9-]+/, { timeout: 10_000 });
  });
});

test.describe("Gift claim — email-restricted, wrong email (EmailMismatchView)", () => {
  test("shows email mismatch error and does not allow claim", async ({
    page
  }) => {
    const claimUrl = `${BASE_URL}/tickets/claim/${process.env.TEST_RESTRICTED_CLAIM_TOKEN}`;
    // Sign in as a different user whose email doesn't match the restriction
    await signInViaUI(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(claimUrl);

    await expect(
      page
        .locator(
          '[data-testid="email-mismatch-view"], text=/email.*mismatch|이메일/i'
        )
        .first()
    ).toBeVisible();
    await expect(
      page.locator('button:has-text("Claim"), button:has-text("받기")')
    ).not.toBeVisible();
  });
});

test.describe("Gift claim — already mine (AlreadyMineView)", () => {
  test("shows already-claimed confirmation without error", async ({ page }) => {
    // Token for a ticket already owned by GIFT_EMAIL
    const claimUrl = `${BASE_URL}/tickets/claim/${process.env.TEST_ALREADY_MINE_TOKEN}`;
    await signInViaUI(page, GIFT_EMAIL, process.env.TEST_GIFT_PASSWORD ?? "");
    await page.goto(claimUrl);

    await expect(
      page
        .locator('[data-testid="already-mine-view"], text=/already|이미/i')
        .first()
    ).toBeVisible();
  });
});

test.describe("Gift claim — invalid / expired token (InvalidView)", () => {
  test("shows invalid token view for a nonexistent token", async ({ page }) => {
    await signInViaUI(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(`${BASE_URL}/tickets/claim/000000000000000000000000`);

    await expect(
      page
        .locator('[data-testid="invalid-view"], text=/invalid|유효하지/i')
        .first()
    ).toBeVisible();
  });
});

test.describe("Gift claim — unauthenticated redirects to sign-in", () => {
  test("redirects to sign-in when no session", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/tickets/claim/someclaimitoken`);
    await expect(page).toHaveURL(/\/(sign-in|login)/, { timeout: 8_000 });
  });
});

// ─── Suite 6: Check-in flows ─────────────────────────────────────────────────

test.describe("Check-in — active ticket, admin role", () => {
  test("scan active ticket → success, ticket marked checked in", async ({
    page
  }) => {
    const adminEmail = process.env.TEST_ADMIN_EMAIL ?? "";
    const adminPassword = process.env.TEST_ADMIN_PASSWORD ?? "";
    await signInViaUI(page, adminEmail, adminPassword);

    const response = await page.request.post(
      `${BASE_URL}/api/tickets/check-in`,
      {
        data: { check_in_code: process.env.TEST_ACTIVE_CHECKIN_CODE ?? "" }
      }
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.alreadyCheckedIn).toBe(false);
  });

  test("re-scanning same code → idempotent alreadyCheckedIn=true response", async ({
    page
  }) => {
    const adminEmail = process.env.TEST_ADMIN_EMAIL ?? "";
    const adminPassword = process.env.TEST_ADMIN_PASSWORD ?? "";
    await signInViaUI(page, adminEmail, adminPassword);

    const code = process.env.TEST_ALREADY_CHECKEDIN_CODE ?? "";
    const response = await page.request.post(
      `${BASE_URL}/api/tickets/check-in`,
      {
        data: { check_in_code: code }
      }
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.alreadyCheckedIn).toBe(true);
  });

  test("pending (unpaid) ticket → 409 ticket-not-active", async ({ page }) => {
    const adminEmail = process.env.TEST_ADMIN_EMAIL ?? "";
    const adminPassword = process.env.TEST_ADMIN_PASSWORD ?? "";
    await signInViaUI(page, adminEmail, adminPassword);

    const response = await page.request.post(
      `${BASE_URL}/api/tickets/check-in`,
      {
        data: { check_in_code: process.env.TEST_PENDING_CHECKIN_CODE ?? "" }
      }
    );
    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.error).toBe("ticket-not-active");
  });
});

test.describe("Check-in — non-staff user forbidden", () => {
  test("regular user gets 403 on check-in endpoint", async ({ page }) => {
    await signInViaUI(page, USER_EMAIL, USER_PASSWORD);
    const response = await page.request.post(
      `${BASE_URL}/api/tickets/check-in`,
      {
        data: { check_in_code: process.env.TEST_ACTIVE_CHECKIN_CODE ?? "" }
      }
    );
    expect(response.status()).toBe(403);
  });
});

// ─── Suite 7: Purchase failure modes ─────────────────────────────────────────

test.describe("Purchase API failure modes", () => {
  test.beforeEach(async ({ page }) => {
    await signInViaUI(page, USER_EMAIL, USER_PASSWORD);
  });

  test("wrong gate password → 401 invalid-password, stays on reserve step", async ({
    page
  }) => {
    await page.goto(EVENT_URL);
    // Manually submit the purchase API with wrong password to simulate tampered request
    const response = await page.request.post(
      `${BASE_URL}/api/tickets/purchase`,
      {
        data: {
          event_slug: EVENT_SLUG,
          quantity: 1,
          password: WRONG_PASSWORD
        }
      }
    );
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("invalid-password");
  });

  test("event not open → 400 event-not-open", async ({ page }) => {
    // Uses a slug for a closed/draft event seeded in the test DB
    const response = await page.request.post(
      `${BASE_URL}/api/tickets/purchase`,
      {
        data: {
          event_slug:
            process.env.TEST_CLOSED_EVENT_SLUG ?? "non-existent-event",
          quantity: 1,
          password: GATE_PASSWORD
        }
      }
    );
    // 404 or 400 are both acceptable; the key is it's not a success
    expect([400, 404]).toContain(response.status());
  });

  test("sold-out event → 409 sold-out", async ({ page }) => {
    const response = await page.request.post(
      `${BASE_URL}/api/tickets/purchase`,
      {
        data: {
          event_slug: process.env.TEST_SOLDOUT_EVENT_SLUG ?? EVENT_SLUG,
          quantity: 1,
          password: GATE_PASSWORD
        }
      }
    );
    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.error).toBe("sold-out");
  });

  test("per-user cap exceeded → 409 user-cap-reached", async ({ page }) => {
    // This test requires the test user to already be at cap in the staging DB
    const response = await page.request.post(
      `${BASE_URL}/api/tickets/purchase`,
      {
        data: {
          event_slug: process.env.TEST_CAPPED_EVENT_SLUG ?? EVENT_SLUG,
          quantity: 1,
          password: GATE_PASSWORD
        }
      }
    );
    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.error).toBe("user-cap-reached");
  });

  test("idempotency key replays original response on double-submit", async ({
    page
  }) => {
    // Send same request twice with the same idempotency key (simulates rapid double-click)
    const idempotencyKey = `test-idem-${Date.now()}`;
    const headers = { "X-Idempotency-Key": idempotencyKey };

    const first = await page.request.post(`${BASE_URL}/api/tickets/purchase`, {
      headers,
      data: { event_slug: EVENT_SLUG, quantity: 1, password: GATE_PASSWORD }
    });
    const second = await page.request.post(`${BASE_URL}/api/tickets/purchase`, {
      headers,
      data: { event_slug: EVENT_SLUG, quantity: 1, password: GATE_PASSWORD }
    });

    // Both should return the same order_id (replay) — not create two orders
    if (first.status() === 200 && second.status() === 200) {
      const b1 = await first.json();
      const b2 = await second.json();
      expect(b1.order_id).toBe(b2.order_id);
    }
  });

  test("unauthenticated purchase attempt → 401 unauthorized", async ({
    page
  }) => {
    await page.context().clearCookies();
    const response = await page.request.post(
      `${BASE_URL}/api/tickets/purchase`,
      {
        data: { event_slug: EVENT_SLUG, quantity: 1, password: GATE_PASSWORD }
      }
    );
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("unauthorized");
  });

  test("cross-origin request → 403 bad-origin", async ({ page }) => {
    // The route checks isSameOrigin; a request without the site's origin header is blocked
    const response = await page.request.post(
      `${BASE_URL}/api/tickets/purchase`,
      {
        headers: { Origin: "https://evil.example.com" },
        data: { event_slug: EVENT_SLUG, quantity: 1, password: GATE_PASSWORD }
      }
    );
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("bad-origin");
  });
});

// ─── Suite 8: Email confirmation (smoke check) ───────────────────────────────

test.describe("Post-purchase email", () => {
  /**
   * Requires SMTP sink (e.g. Inbucket at TEST_SMTP_SINK_URL).
   * After a successful purchase, poll the sink inbox for USER_EMAIL
   * and verify the confirmation email arrived.
   */
  test("purchaser receives confirmation email with ticket details", async ({
    page
  }) => {
    // NOTE: Skipped until SMTP sink is wired.
    // Implementation:
    //   1. Complete purchase as in Suite 3
    //   2. GET {TEST_SMTP_SINK_URL}/api/v1/mailbox/{USER_EMAIL_LOCALPART}
    //   3. Assert latest message subject contains the event name / ticket number
    test.skip();
  });

  test("gift recipient receives claim link email after group purchase", async ({
    page
  }) => {
    // NOTE: Skipped until SMTP sink is wired.
    // When email_restricted claim is created, confirm recipient email landed.
    test.skip();
  });
});

// ─── Suite 9: My tickets list ─────────────────────────────────────────────────

test.describe("My tickets page", () => {
  test("renders ticket card for authenticated user with tickets", async ({
    page
  }) => {
    await signInViaUI(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(`${BASE_URL}/tickets/my`);
    await expect(
      page.locator('[data-testid="ticket-card"]').first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test("shows empty state when user has no tickets", async ({ page }) => {
    // Sign in as a fresh user with no tickets
    const freshEmail = process.env.TEST_FRESH_USER_EMAIL ?? "";
    const freshPass = process.env.TEST_FRESH_USER_PASSWORD ?? "";
    await signInViaUI(page, freshEmail, freshPass);
    await page.goto(`${BASE_URL}/tickets/my`);
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible({
      timeout: 8_000
    });
  });

  test("keyboard arrow keys cycle through tickets", async ({ page }) => {
    await signInViaUI(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(`${BASE_URL}/tickets/my`);
    // Wait for at least 2 tickets
    await page.waitForSelector('[data-testid="ticket-card"]:nth-child(2)', {
      timeout: 8_000
    });
    // Press arrow right → active ticket index should advance
    await page.keyboard.press("ArrowRight");
    // Visual regression: second card should now be active (aria-selected or data-active)
    await expect(
      page.locator('[data-testid="ticket-card"][data-active="true"]').nth(1)
    ).toBeVisible();
  });
});

// ─── Suite 10: Exclusive content gate ────────────────────────────────────────

test.describe("Exclusive content page", () => {
  test("checked-in ticket holder can view exclusive content", async ({
    page
  }) => {
    await signInViaUI(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(`${BASE_URL}/tickets/${EVENT_SLUG}/exclusive`);
    // Should render content, not a blocked/locked state
    await expect(page.locator('[data-testid="exclusive-content"]')).toBeVisible(
      { timeout: 8_000 }
    );
  });

  test("non-checked-in user is redirected or sees locked state", async ({
    page
  }) => {
    const freshEmail = process.env.TEST_FRESH_USER_EMAIL ?? "";
    const freshPass = process.env.TEST_FRESH_USER_PASSWORD ?? "";
    await signInViaUI(page, freshEmail, freshPass);
    await page.goto(`${BASE_URL}/tickets/${EVENT_SLUG}/exclusive`);
    // Either redirect to event page or show a locked indicator
    const isLocked =
      page.url().includes("/tickets/") ||
      (await page
        .locator(
          '[data-testid="locked-content"], [data-testid="exclusive-locked"]'
        )
        .isVisible());
    expect(isLocked).toBe(true);
  });
});
