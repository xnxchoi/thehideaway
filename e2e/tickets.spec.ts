/**
 * Day n Night closed-loop E2E spec.
 *
 * This file is intentionally narrow: it verifies the event loop contract
 * that must not regress during the shipping sprint:
 *   /day-n-night -> /tickets/day-n-night -> purchase confirmation ->
 *   /day-n-night/my, with gift claim links under /day-n-night/claim/:token.
 *
 * Local execution is currently blocked until the repo adds @playwright/test
 * and a playwright.config.ts. The executable coverage for the same backend
 * contract lives in Vitest under:
 *   - src/app/api/tickets/purchase/route.test.ts
 *   - src/lib/tickets/event-loop.test.ts
 */

import { expect, test, type Page } from "@playwright/test";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const EVENT_SLUG = process.env.TEST_EVENT_SLUG ?? "day-n-night";
const GATE_PASSWORD = process.env.TEST_GATE_PASSWORD ?? "seoul2026";
const USER_EMAIL = process.env.TEST_USER_EMAIL ?? "";
const USER_PASSWORD = process.env.TEST_USER_PASSWORD ?? "";

const LANDING_URL = `${BASE_URL}/day-n-night`;
const TICKET_URL = `${BASE_URL}/tickets/${EVENT_SLUG}`;

async function passTicketGate(page: Page) {
  await page.goto(TICKET_URL);
  await page.getByLabel("Access code").fill(GATE_PASSWORD);
  await page.getByRole("button", { name: "Enter" }).click();
  await expect(page.getByTestId("day-n-night-rsvp-step")).toHaveAttribute(
    "data-step",
    "welcome"
  );
}

async function signIn(page: Page) {
  test.skip(!USER_EMAIL || !USER_PASSWORD, "TEST_USER_EMAIL/PASSWORD required");
  await page.goto(`${BASE_URL}/sign-in`);
  await page.locator('input[type="email"]').fill(USER_EMAIL);
  await page.locator('input[type="password"]').fill(USER_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`${BASE_URL}/**`);
}

test.describe("Day n Night closed loop", () => {
  test("landing keeps primary reservation CTAs inside /tickets/day-n-night", async ({
    page
  }) => {
    await page.goto(LANDING_URL);
    const reserveLinks = page.locator('a[href="/tickets/day-n-night"]');
    await expect(reserveLinks.first()).toBeVisible();
    await expect(page).not.toHaveURL(/\/tickets\/my|\/tickets\/claim/);
  });

  test("ticket gate opens into the current RSVP welcome step", async ({
    page
  }) => {
    await passTicketGate(page);
    await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
  });

  test("authenticated purchase confirmation links back to /day-n-night/my and emits event claim links", async ({
    page
  }) => {
    await signIn(page);
    await passTicketGate(page);

    await page.getByRole("button", { name: "Start" }).click();
    await expect(page.getByTestId("day-n-night-rsvp-step")).toHaveAttribute(
      "data-step",
      "name"
    );

    await page.getByLabel("First and last name").fill("E2E Buyer");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByTestId("day-n-night-rsvp-step")).toHaveAttribute(
      "data-step",
      "reserve"
    );

    await page.getByRole("button", { name: "2" }).click();
    await page.getByRole("button", { name: /Request 2/i }).click();

    await expect(page.getByTestId("day-n-night-rsvp-step")).toHaveAttribute(
      "data-step",
      "purchased",
      { timeout: 10_000 }
    );
    await expect(page.getByTestId("view-my-tickets")).toHaveAttribute(
      "href",
      "/day-n-night/my"
    );
    await expect(page.getByTestId("gift-claim-link")).toHaveCount(1);
  });
});
