import { chromium } from "playwright";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ORIGIN = "http://localhost:3000";
const APP_ROOT = new URL(
  "../Users/seanschoi/WebstormProjects/thehideaway/src/app/(frontend)/",
  "file:///"
).pathname;

const ROOT = "/Users/seanschoi/WebstormProjects/thehideaway/src/app/(frontend)";

const collectPageFiles = (dir, acc = []) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) collectPageFiles(full, acc);
    else if (name === "page.tsx") acc.push(full);
  }
  return acc;
};

const toUrlPath = (file) => {
  let rel = file.slice(ROOT.length).replace(/\\/g, "/");
  rel = rel.replace(/\/page\.tsx$/, "");
  rel = rel.replace(/\/\([^/]+\)/g, "");
  if (!rel || rel === "/") return "/";
  return rel.startsWith("/") ? rel : `/${rel}`;
};

const PLACEHOLDERS = {
  "[id]": "test-id",
  "[path]": "sign-in",
  "[slug]": "surf",
  "[page]": "2",
  "[pageNumber]": "2",
  "[username]": "hideaway",
  "[hashId]": "test-hash",
  "[user]": "hideaway",
  "[token]": "test-token",
  "[ref]": "test-ref"
};

const fillDynamic = (path) =>
  path.replace(/\[([^\]]+)\]/g, (_, key) => PLACEHOLDERS[`[${key}]`] ?? "test");

const isDynamic = (path) => path.includes("[") || path.includes("...");

const pageFiles = collectPageFiles(ROOT);
const routePatterns = [...new Set(pageFiles.map(toUrlPath))].sort();

const staticPaths = routePatterns.filter((p) => !isDynamic(p));
const dynamicPatterns = routePatterns.filter((p) => isDynamic(p));

const extraFromSitemap = async () => {
  try {
    const res = await fetch(`${ORIGIN}/sitemap.xml`);
    if (!res.ok) return [];
    const xml = await res.text();
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => {
        try {
          return new URL(m[1]).pathname;
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
};

const extraFromIndexes = async () => {
  const seeds = ["/", "/essays", "/users", "/radio", "/tagged", "/lostinseoul", "/plans"];
  const hrefs = new Set();
  for (const seed of seeds) {
    try {
      const res = await fetch(`${ORIGIN}${seed}`);
      if (!res.ok) continue;
      const html = await res.text();
      for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
        if (m[1].startsWith("/_next") || m[1].startsWith("/api")) continue;
        hrefs.add(m[1]);
      }
    } catch {
      /* ignore */
    }
  }
  return [...hrefs];
};

const sitemapPaths = await extraFromSitemap();
const indexPaths = await extraFromIndexes();

const filledDynamic = dynamicPatterns.map((p) =>
  p.includes("[...") ? "/this-route-does-not-exist-xyz" : fillDynamic(p)
);

const urls = [
  ...new Set([...staticPaths, ...filledDynamic, ...sitemapPaths, ...indexPaths])
]
  .filter((p) => p.startsWith("/") && !p.startsWith("/_next") && !p.startsWith("/api"))
  .sort();

console.log(
  JSON.stringify(
    {
      routePatterns,
      staticCount: staticPaths.length,
      dynamicPatternCount: dynamicPatterns.length,
      sitemapCount: sitemapPaths.length,
      indexLinkCount: indexPaths.length,
      visitCount: urls.length
    },
    null,
    2
  )
);

const browser = await chromium.launch();
const results = [];

for (const path of urls) {
  const page = await browser.newPage();
  const logs = [];
  page.on("console", (msg) => logs.push({ type: msg.type(), text: msg.text() }));
  page.on("pageerror", (err) =>
    logs.push({ type: "pageerror", text: err.message })
  );
  let status = 0;
  let bailout = false;
  let inAppSpy = false;
  let error = null;
  try {
    const response = await page.goto(`${ORIGIN}${path}`, {
      waitUntil: "load",
      timeout: 25000
    });
    status = response?.status() ?? 0;
    await page.waitForTimeout(1200);
    let html = "";
    try {
      html = await page.content();
    } catch {
      html = "";
    }
    bailout = /BAILOUT_TO_CLIENT_SIDE_RENDERING/.test(html);
    inAppSpy = /Window is not available/.test(html);
  } catch (e) {
    error = e.message.slice(0, 240);
  }
  const hydration = logs.filter((l) =>
    /hydrat|did not match|Minified React error #418|#423|#425/i.test(l.text)
  );
  const pageerrors = logs.filter((l) => l.type === "pageerror");
  results.push({
    path,
    status,
    hydration: hydration.length,
    bailout,
    inAppSpy,
    pageerrors: pageerrors.length,
    error,
    hydrationSample: hydration[0]?.text.slice(0, 180) ?? null,
    pageerrorSample: pageerrors[0]?.text.slice(0, 180) ?? null
  });
  await page.close();
  const mark =
    hydration.length || bailout || inAppSpy || error ? "FAIL" : "ok";
  console.log(
    `${mark.padEnd(4)} ${String(status).padStart(3)} hyd=${hydration.length} ${path}`
  );
}

await browser.close();

const failing = results.filter(
  (r) => r.hydration || r.bailout || r.inAppSpy || r.error
);
const byStatus = results.reduce((acc, r) => {
  acc[r.status] = (acc[r.status] || 0) + 1;
  return acc;
}, {});

console.log("\n=== SUMMARY ===");
console.log(
  JSON.stringify(
    {
      visited: results.length,
      failing: failing.length,
      hydrationFails: results.filter((r) => r.hydration).length,
      bailoutFails: results.filter((r) => r.bailout).length,
      inAppSpyFails: results.filter((r) => r.inAppSpy).length,
      timeoutOrError: results.filter((r) => r.error).length,
      byStatus,
      failingPaths: failing
    },
    null,
    2
  )
);

process.exit(failing.filter((r) => r.hydration || r.bailout || r.inAppSpy).length > 0 ? 1 : 0);
