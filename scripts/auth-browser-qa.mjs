import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ORIGIN = process.env.AUTH_QA_ORIGIN ?? "http://localhost:3000";
const OUT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../.claude/tdd/auth-browser-qa"
);

mkdirSync(OUT_DIR, { recursive: true });

const ROUTES = [
  {
    path: "/sign-in",
    ready: ["Sign In"],
    expect: [
      "Sign in with Google",
      "Sign in with Naver",
      "Sign in with Kakao",
      "Passkey"
    ]
  },
  {
    path: "/sign-up",
    ready: ["Before you sign up", "Sign Up"],
    expect: ["Before you sign up", "Agree to all"]
  },
  {
    path: "/forgot-password",
    ready: ["Forgot Password"],
    expect: ["Send reset link", "Go back"]
  },
  {
    path: "/reset-password",
    ready: ["Reset Password", "New Password"],
    expect: ["Save new password", "Enter your new password below"],
    forbid: ["Enter your email to reset your password"]
  },
  {
    path: "/lostinseoul/auth/sign-in",
    ready: ["Sign In"],
    expect: ["Sign in with Google"]
  },
  {
    path: "/two-factor",
    ready: ["Two-factor"],
    expect: ["Verify", "Use email instead"]
  },
  {
    path: "/two-factor/otp",
    ready: ["Two-factor"],
    expect: ["Send email code"]
  }
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 375, height: 812 }
];

const report = {
  origin: ORIGIN,
  startedAt: new Date().toISOString(),
  smoke: [],
  interactions: [],
  visual: [],
  accessibility: [],
  consoleErrors: [],
  networkFailures: [],
  verdict: "INCONCLUSIVE"
};

const collectPageNoise = (page, bucket) => {
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (
      /Download the React DevTools|Fast Refresh|HMR|\[next-auth\]|401 \(UNAUTHORIZED\)|status of 401/i.test(
        text
      )
    ) {
      return;
    }
    report.consoleErrors.push({ bucket, text });
  });
  page.on("response", (res) => {
    const status = res.status();
    if (status >= 400 && !res.url().includes("_next/static")) {
      report.networkFailures.push({
        bucket,
        status,
        url: res.url()
      });
    }
  });
};

const dumpFailure = async (page, slug) => {
  const shot = join(OUT_DIR, `${slug}-${Date.now()}.png`);
  await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
  const body = await page
    .locator("body")
    .innerText()
    .catch(() => "");
  return {
    url: page.url(),
    body: body.slice(0, 800),
    screenshot: shot
  };
};

const waitForAny = async (page, titles) => {
  const locator = page.getByText(new RegExp(titles.map((t) => `^${t}$`).join("|")));
  try {
    await locator.first().waitFor({ state: "visible", timeout: 20000 });
    await waitForPainted(page);
  } catch (error) {
    const dump = await dumpFailure(page, "timeout");
    error.message += `\nurl=${dump.url}\nbody=${dump.body}\nscreenshot=${dump.screenshot}`;
    throw error;
  }
};

const dismissChrome = async (page) => {
  await page.keyboard.press("Escape").catch(() => {});
  await page.keyboard.press("Escape").catch(() => {});
};

const waitForAuthReady = async (page) => {
  await page
    .locator('[data-auth-ready="true"]')
    .first()
    .waitFor({ state: "attached", timeout: 15000 });
};

const waitForPainted = async (page) => {
  await page.waitForFunction(() => {
    const html = document.documentElement;
    const theme = html.getAttribute("data-theme");
    const opacity = Number(getComputedStyle(html).opacity);
    return (theme === "light" || theme === "dark") && opacity > 0.5;
  }, { timeout: 15000 });
};

const newIsolatedPage = async (browser, bucket) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "en-US"
  });
  const page = await context.newPage();
  collectPageNoise(page, bucket);
  return { context, page };
};

const record = (list, row) => {
  list.push(row);
  return row.pass;
};

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        locale: "en-US"
      });
      await context.addCookies([
        {
          name: "__rp_consent",
          value: encodeURIComponent(
            JSON.stringify({
              v: "2026-04-15",
              terms: new Date().toISOString(),
              privacy: new Date().toISOString(),
              age: true,
              marketing: false,
              ts: new Date().toISOString()
            })
          ),
          url: ORIGIN
        }
      ]);
      const page = await context.newPage();
      collectPageNoise(page, viewport.name);

      for (const route of ROUTES) {
        const url = `${ORIGIN}${route.path}`;
        const response = await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 30000
        });
        const status = response?.status() ?? 0;
        await waitForAny(page, route.ready);
        await waitForPainted(page);
        const body = await page.locator("body").innerText();
        const missing = [
          ...route.expect.filter((needle) => !body.includes(needle)),
          ...(route.forbid ?? [])
            .filter((needle) => body.includes(needle))
            .map((needle) => `forbidden:${needle}`)
        ];
        const shot = join(
          OUT_DIR,
          `${viewport.name}${route.path.replaceAll("/", "_") || "_root"}.png`
        );
        await page.screenshot({ path: shot, fullPage: true });

        report.smoke.push({
          viewport: viewport.name,
          path: route.path,
          status,
          missing,
          screenshot: shot
        });
        report.visual.push({
          viewport: viewport.name,
          path: route.path,
          screenshot: shot
        });
      }

      await context.close();
    }

    {
      const { context, page } = await newIsolatedPage(browser, "interactions");
      await page.goto(`${ORIGIN}/sign-in`, { waitUntil: "domcontentloaded" });
      await waitForAny(page, ["Sign In"]);
      await waitForAuthReady(page);
      await dismissChrome(page);
      await page.getByRole("button", { name: /^login$/i }).click();
      await page
        .getByText("Sign In", { exact: true })
        .first()
        .waitFor({ state: "visible", timeout: 8000 })
        .catch(() => {});
      const headingVisible = await page
        .getByText("Sign In", { exact: true })
        .first()
        .isVisible()
        .catch(() => false);
      const url = new URL(page.url());
      const pass =
        url.pathname === "/sign-in" &&
        !url.searchParams.has("email") &&
        headingVisible;
      const dump = pass ? { url: page.url() } : await dumpFailure(page, "empty-submit");
      record(report.interactions, {
        name: "empty sign-in submit stays on sign-in",
        pass,
        ...dump
      });
      await context.close();
    }

    {
      const { context, page } = await newIsolatedPage(browser, "interactions");
      await page.goto(`${ORIGIN}/sign-in`, { waitUntil: "domcontentloaded" });
      await waitForAny(page, ["Sign In"]);
      await waitForAuthReady(page);
      await dismissChrome(page);
      await page.locator('input[placeholder="Username or email"]').fill(
        "nobody-qa@example.com"
      );
      await page.locator('input[placeholder="Password"]').fill("wrong-password-qa");
      await page.getByRole("button", { name: /^login$/i }).click();
      await page.waitForTimeout(1500);
      record(report.interactions, {
        name: "invalid credentials do not navigate away",
        pass: new URL(page.url()).pathname === "/sign-in",
        url: page.url()
      });
      await context.close();
    }

    {
      const { context, page } = await newIsolatedPage(browser, "interactions");
      await page.goto(`${ORIGIN}/sign-up`, { waitUntil: "domcontentloaded" });
      await waitForAny(page, ["Before you sign up"]);
      await waitForAuthReady(page);
      await dismissChrome(page);
      try {
        await page
          .getByRole("checkbox", { name: /agree to all/i })
          .check({ force: true });
        const continueBtn = page.getByRole("button", { name: /^continue$/i });
        await continueBtn.waitFor({ state: "visible", timeout: 8000 });
        await continueBtn.click({ force: true, timeout: 8000 }).catch(() => {});
        await page.getByText("Create an account", { exact: true }).waitFor({
          timeout: 10000
        });
        record(report.interactions, {
          name: "sign-up consent reveals the sign-up form",
          pass: (await page.locator("body").innerText()).includes(
            "Create an account"
          )
        });
      } catch (error) {
        const dump = await dumpFailure(page, "consent-failed");
        record(report.interactions, {
          name: "sign-up consent reveals the sign-up form",
          pass: false,
          error: String(error.message),
          ...dump
        });
      }
      await context.close();
    }

    {
      const { context, page } = await newIsolatedPage(browser, "interactions");
      await page.goto(`${ORIGIN}/sign-in`, { waitUntil: "domcontentloaded" });
      await waitForAny(page, ["Sign In"]);
      await waitForAuthReady(page);
      await dismissChrome(page);
      try {
        const forgot = page.getByRole("link", {
          name: "Forgot your password?"
        });
        await forgot.click({ force: true });
        await page.waitForURL(
          (url) => url.pathname === "/forgot-password",
          { timeout: 15000 }
        );
        await waitForAny(page, ["Forgot Password"]);
        record(report.interactions, {
          name: "forgot-password link",
          pass: new URL(page.url()).pathname === "/forgot-password",
          url: page.url()
        });
      } catch (error) {
        const dump = await dumpFailure(page, "forgot-password");
        record(report.interactions, {
          name: "forgot-password link",
          pass: false,
          error: String(error.message),
          ...dump
        });
      }
      await context.close();
    }

    {
      const { context, page } = await newIsolatedPage(browser, "interactions");
      try {
        const response = await page.goto(`${ORIGIN}/auth/sign-in`, {
          waitUntil: "domcontentloaded",
          timeout: 20000
        });
        await page.waitForURL((url) => url.pathname === "/sign-in", {
          timeout: 10000
        });
        record(report.interactions, {
          name: "/auth/sign-in redirects to /sign-in",
          pass: new URL(page.url()).pathname === "/sign-in",
          url: page.url(),
          status: response?.status() ?? 0
        });
      } catch (error) {
        const dump = await dumpFailure(page, "auth-redirect");
        record(report.interactions, {
          name: "/auth/sign-in redirects to /sign-in",
          pass: false,
          error: String(error.message),
          ...dump
        });
      }
      await context.close();
    }

    {
      const { context, page } = await newIsolatedPage(browser, "interactions");
      try {
        await page.goto(`${ORIGIN}/account/settings`, {
          waitUntil: "domcontentloaded"
        });
        await page.waitForURL(
          (url) => !url.pathname.startsWith("/account"),
          { timeout: 10000 }
        );
        record(report.interactions, {
          name: "/account/settings leaves the old account view",
          pass: !new URL(page.url()).pathname.startsWith("/account"),
          url: page.url()
        });
      } catch (error) {
        const dump = await dumpFailure(page, "account-redirect");
        record(report.interactions, {
          name: "/account/settings leaves the old account view",
          pass: false,
          error: String(error.message),
          ...dump
        });
      }
      await context.close();
    }

    {
      const { context, page } = await newIsolatedPage(browser, "interactions");
      await page.goto(`${ORIGIN}/sign-in`, { waitUntil: "domcontentloaded" });
      await waitForAny(page, ["Sign In"]);
      await waitForAuthReady(page);
      await dismissChrome(page);
      const butler = page.getByRole("button", { name: /sign in as butler/i });
      if (await butler.count()) {
        try {
          await butler.click({ force: true });
          await page.waitForURL(
            (url) => url.pathname.startsWith("/me"),
            { timeout: 20000 }
          );
          record(report.interactions, {
            name: "butler local sign-in reaches /me",
            pass: new URL(page.url()).pathname.startsWith("/me"),
            url: page.url()
          });
        } catch (error) {
          const dump = await dumpFailure(page, "butler");
          record(report.interactions, {
            name: "butler local sign-in reaches /me",
            pass: false,
            error: String(error.message),
            ...dump
          });
        }
      } else {
        record(report.interactions, {
          name: "butler local sign-in reaches /me",
          pass: false,
          error: "Butler button not present"
        });
      }
      await context.close();
    }

    {
      const { context, page } = await newIsolatedPage(browser, "a11y");
      await page.goto(`${ORIGIN}/sign-in`, { waitUntil: "domcontentloaded" });
      await waitForAny(page, ["Sign In"]);
      await waitForAuthReady(page);
      await dismissChrome(page);
      let reached = false;
      let active = { tag: "", placeholder: "", name: "" };
      for (let i = 0; i < 25; i += 1) {
        await page.keyboard.press("Tab");
        active = await page.evaluate(() => ({
          tag: document.activeElement?.tagName ?? "",
          placeholder: document.activeElement?.getAttribute("placeholder") ?? "",
          name: document.activeElement?.getAttribute("name") ?? "",
          role: document.activeElement?.getAttribute("role") ?? ""
        }));
        if (
          active.placeholder === "Username or email" ||
          active.name === "email" ||
          (active.tag === "INPUT" && active.placeholder.length > 0)
        ) {
          reached = true;
          break;
        }
      }
      record(report.accessibility, {
        name: "keyboard tab reaches the username field",
        pass: reached,
        active
      });

      const google = page.getByRole("button", { name: "Sign in with Google" });
      record(report.accessibility, {
        name: "google provider has an accessible name",
        pass: await google.isVisible()
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }

  const smokeFail = report.smoke.some(
    (row) => row.status >= 400 || row.missing.length > 0
  );
  const interactionFail = report.interactions.some((row) => row.pass === false);
  const a11yFail = report.accessibility.some((row) => row.pass === false);
  report.finishedAt = new Date().toISOString();
  report.verdict =
    smokeFail || interactionFail || a11yFail ? "DO NOT SHIP" : "SHIP WITH FIXES";
  if (
    !smokeFail &&
    !interactionFail &&
    !a11yFail &&
    report.consoleErrors.length === 0 &&
    report.networkFailures.filter((row) => row.status !== 401).length === 0
  ) {
    report.verdict = "SHIP";
  }

  writeFileSync(join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (report.verdict === "DO NOT SHIP") process.exit(1);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
