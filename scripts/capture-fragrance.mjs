// Headless capture for the LOSTINSEOUL Catalyst fragrance chapter.
//
// Restores the "eyes" method from readmes/LOSTINSEOUL_FRAGRANCE.md §9: the
// claude-in-chrome extension cannot screenshot the animating WebGL page (the
// rAF loop blocks CDP document_idle and the automation tab is document.hidden
// so the scene loop pauses). Headless Playwright chromium on swiftshader
// renders the page visible-to-itself, so the animation actually runs and the
// screenshots capture real frames.
//
// RENDERER CAVEAT: swiftshader renders MeshPhysicalMaterial{transmission:1.0}
// as an OPAQUE SLAB. Judge ONLY silhouette, proportion, edge profile, framing.
// Never judge material, transparency, refraction, colour, exposure, or bloom.
//
// Usage:
//   node scripts/capture-fragrance.mjs
//   PORT=3000 OUT=.capture URL_PATH=/lostinseoul/fragrance node scripts/capture-fragrance.mjs
//
// Env:
//   PORT      dev-server port                (default 3000)
//   OUT       output directory for PNGs       (default .capture)
//   URL_PATH  path to capture                 (default /lostinseoul/fragrance)

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

// createRequire anchored at the repo root so playwright resolves even if this
// script is copied to a scratch path outside the package (per §9).
const require = createRequire(
  "/Users/seanschoi/WebstormProjects/thehideaway/"
);
const { chromium } = require("playwright");

const PORT = process.env.PORT || "3000";
const OUT = resolve(process.env.OUT || ".capture");
const URL_PATH = process.env.URL_PATH || "/lostinseoul/fragrance";

const ORIGIN = `http://localhost:${PORT}`;
const TARGET_URL = `${ORIGIN}${URL_PATH}`;

// The lostinseoul.gate password cookie. proxy.ts gates every /lostinseoul/*
// path via hasLostGateCookie() (src/lib/lostinseoul/gate.ts), which compares
// the cookie named LOST_GATE_COOKIE_NAME against the fixed post-auth value
// LOST_GATE_COOKIE_VALUE. Setting it directly lets the capture skip the gate.
// Keep in sync with src/lib/lostinseoul/gate.ts.
const LOST_GATE_COOKIE_NAME = "lostinseoul.gate";
const LOST_GATE_COOKIE_VALUE =
  "3f9c89c8a38beabc1fc84adc476cfe230f276da8223682ecfbd1e6b500bfd722";

// Scroll progress checkpoints to capture (matches the fragrance beat timeline:
// dormant / contact / ignition-onset / peak / afterglow).
const PROGRESS_STOPS = [0.0, 0.35, 0.6, 0.85, 1.0];

const SCENE_READY_SELECTOR = '[data-lost-fragrance-scene-ready="true"]';

function fail(message) {
  console.error(`[capture-fragrance] ERROR: ${message}`);
  process.exit(1);
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    // swiftshader software-GL flags from §9 — makes WebGL2 available headless.
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--ignore-gpu-blocklist",
      "--enable-unsafe-swiftshader",
      "--enable-webgl"
    ]
  });

  try {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });

    // Set the gate cookie before navigation so the request never redirects to
    // /gate. url form supplies domain + path (localhost, "/").
    await ctx.addCookies([
      {
        name: LOST_GATE_COOKIE_NAME,
        value: LOST_GATE_COOKIE_VALUE,
        url: ORIGIN
      }
    ]);

    const page = await ctx.newPage();

    const response = await page.goto(TARGET_URL, {
      waitUntil: "networkidle",
      timeout: 60000
    });

    if (response && response.status() >= 400) {
      fail(
        `navigation to ${TARGET_URL} returned HTTP ${response.status()} ` +
          `(gate cookie may be stale — check src/lib/lostinseoul/gate.ts)`
      );
    }

    // The scene-ready attribute only flips true in the "webgl" render tier
    // (fragrance-tier.ts). A 1440-wide, non-reduced-motion, swiftshader-WebGL2
    // context resolves to webgl, so this should fire.
    try {
      await page.waitForSelector(SCENE_READY_SELECTOR, { timeout: 45000 });
    } catch {
      const tier = await page
        .locator("[data-lost-fragrance-tier]")
        .first()
        .getAttribute("data-lost-fragrance-tier")
        .catch(() => null);
      fail(
        `scene never became ready (no ${SCENE_READY_SELECTOR} within 45s). ` +
          `Resolved render tier: ${tier ?? "unknown"}. Expected "webgl". ` +
          `If tier is "editorial"/"video" the WebGL scene does not mount and ` +
          `there is nothing to capture.`
      );
    }

    // Let the first frames settle after ready.
    await page.waitForTimeout(1500);

    const written = [];
    for (const prog of PROGRESS_STOPS) {
      await page.evaluate((p) => {
        const max =
          document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, Math.round(max * p));
      }, prog);

      // Let scroll-scrubbed light/camera states interpolate to this beat.
      await page.waitForTimeout(1100);

      const label = String(Math.round(prog * 100)).padStart(3, "0");
      const path = `${OUT}/f_${label}.png`;
      await page.screenshot({ path });
      written.push(path);
      console.log(`[capture-fragrance] wrote ${path}`);
    }

    console.log(
      `[capture-fragrance] OK — ${written.length} frames in ${OUT}`
    );
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  fail(err?.stack || String(err));
});
