#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseURL = new URL(
  process.env.BASE_URL || process.argv[2] || "https://hideawayseoul.com"
);
const screenshotDir = resolve(
  projectRoot,
  "readmes/oauth-approval/screenshots"
);
const callbackReportPath = resolve(
  projectRoot,
  "readmes/oauth-approval/callbacks.md"
);

const screenshotTargets = [
  {
    name: "04-homepage-prod.png",
    path: "/",
    viewport: { width: 1440, height: 900 }
  },
  {
    name: "01-sign-in-page-prod.png",
    path: "/sign-in",
    viewport: { width: 1440, height: 900 }
  },
  {
    name: "01b-sign-in-mobile-prod.png",
    path: "/sign-in",
    viewport: { width: 390, height: 844 }
  },
  {
    name: "05-sign-up-page-prod.png",
    path: "/sign-up",
    viewport: { width: 1440, height: 900 }
  },
  {
    name: "02-privacy-page-prod.png",
    path: "/privacy",
    viewport: { width: 1440, height: 900 }
  },
  {
    name: "03-terms-page-prod.png",
    path: "/terms",
    viewport: { width: 1440, height: 900 }
  }
];

const providers = [
  {
    id: "google",
    kind: "native",
    endpoint: "/api/auth/sign-in/social",
    body: { provider: "google", callbackURL: "/", disableRedirect: true }
  },
  {
    id: "naver",
    kind: "generic-oauth",
    endpoint: "/api/auth/sign-in/oauth2",
    body: { providerId: "naver", callbackURL: "/", disableRedirect: true }
  },
  {
    id: "kakao",
    kind: "generic-oauth",
    endpoint: "/api/auth/sign-in/oauth2",
    body: { providerId: "kakao", callbackURL: "/", disableRedirect: true }
  }
];

function absoluteURL(path) {
  return new URL(path, baseURL).toString();
}

function markdownFence(value) {
  return `\`\`\`\n${value || "(not returned)"}\n\`\`\``;
}

async function captureScreenshots(page) {
  await mkdir(screenshotDir, { recursive: true });

  for (const target of screenshotTargets) {
    await page.setViewportSize(target.viewport);
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(absoluteURL(target.path), {
      waitUntil: "networkidle",
      timeout: 45000
    });
    await page.screenshot({
      path: resolve(screenshotDir, target.name),
      fullPage: true
    });
    console.log(`captured ${target.name}`);
  }
}

async function readProviderRedirects(request) {
  const rows = [];

  for (const provider of providers) {
    const response = await request.post(absoluteURL(provider.endpoint), {
      data: provider.body,
      headers: {
        "Content-Type": "application/json"
      }
    });
    const status = response.status();
    let data = null;
    try {
      data = await response.json();
    } catch {
      data = { error: await response.text() };
    }

    const authURL = typeof data?.url === "string" ? data.url : "";
    let redirectURI = "";
    if (authURL) {
      try {
        redirectURI = new URL(authURL).searchParams.get("redirect_uri") || "";
      } catch {
        redirectURI = "";
      }
    }

    rows.push({
      ...provider,
      status,
      authURL,
      redirectURI,
      error: authURL ? "" : JSON.stringify(data)
    });
  }

  return rows;
}

async function writeCallbackReport(rows) {
  const generatedAt = new Date().toISOString();
  const lines = [
    "# OAuth Approval Callback Report",
    "",
    `Generated: \`${generatedAt}\``,
    `Base URL: \`${baseURL.origin}\``,
    "",
    "Use the `redirect_uri` values below in provider consoles. They are read from the app's actual Better Auth redirect responses and should supersede hand-derived callback guesses.",
    "",
    "| Provider | Type | Status | redirect_uri |",
    "|---|---|---:|---|"
  ];

  for (const row of rows) {
    lines.push(
      `| ${row.id} | ${row.kind} | ${row.status} | \`${row.redirectURI || "not returned"}\` |`
    );
  }

  lines.push("", "## Provider Authorization URLs", "");
  for (const row of rows) {
    lines.push(`### ${row.id}`, "");
    lines.push("Authorization URL:");
    lines.push(markdownFence(row.authURL));
    if (row.error) {
      lines.push("", "Error response:");
      lines.push(markdownFence(row.error));
    }
    lines.push("");
  }

  await writeFile(callbackReportPath, `${lines.join("\n")}\n`, "utf8");
  console.log(`wrote ${callbackReportPath}`);
}

const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await captureScreenshots(page);
  const redirects = await readProviderRedirects(context.request);
  await writeCallbackReport(redirects);
} finally {
  await browser.close();
}
