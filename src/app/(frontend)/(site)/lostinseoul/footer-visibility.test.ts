import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  pathHidesFooterByDefault,
  pathHidesHeaderByDefault
} from "@/components/Shells/Footer/footer-visibility";

const css = readFileSync(join(__dirname, "index.css"), "utf8");
const components = readFileSync(join(__dirname, "components.tsx"), "utf8");
const footerAfterimage = readFileSync(
  join(__dirname, "footer-wordmark.tsx"),
  "utf8"
);
const footerComponent = components.slice(
  components.indexOf("export function LostFooter")
);
const storefront = readFileSync(join(__dirname, "storefront.tsx"), "utf8");
const homePage = readFileSync(join(__dirname, "page.tsx"), "utf8");
const legalPage = readFileSync(join(__dirname, "legal-page.tsx"), "utf8");
const fragranceRoute = readFileSync(
  join(__dirname, "fragrance/page.tsx"),
  "utf8"
);
const gatePage = readFileSync(join(__dirname, "gate/page.tsx"), "utf8");
const productRoute = readFileSync(
  join(__dirname, "products/[slug]/page.tsx"),
  "utf8"
);
const cartRoute = readFileSync(join(__dirname, "cart/page.tsx"), "utf8");
const checkoutRoute = readFileSync(
  join(__dirname, "checkout/page.tsx"),
  "utf8"
);
const fragrancePage = readFileSync(
  join(__dirname, "fragrance/page.client.tsx"),
  "utf8"
);
const productPage = readFileSync(
  join(__dirname, "products/[slug]/product.client.tsx"),
  "utf8"
);

describe("LOST footer visibility CSS", () => {
  it("does not hide Hideaway chrome with body:has CSS", () => {
    expect(css).not.toContain("body:has(.lost-commerce-root) #rp-header");
    expect(css).not.toContain("body:has(.lost-commerce-root) footer:not(.lost-footer)");
    expect(css).not.toContain('body:has(.lost-commerce-root) [class*="z-[238]"]');
  });

  it("hides the global Hideaway footer on internal LOST routes", () => {
    expect(pathHidesFooterByDefault("/lostinseoul")).toBe(true);
    expect(pathHidesFooterByDefault("/lostinseoul/privacy")).toBe(true);
    expect(pathHidesFooterByDefault("/lostinseoul/products/object")).toBe(true);
  });

  it("skips the Hideaway header on LOST routes without CSS display:none", () => {
    expect(pathHidesHeaderByDefault("/lostinseoul")).toBe(true);
    expect(pathHidesHeaderByDefault("/lostinseoul/products/object")).toBe(true);
    expect(pathHidesHeaderByDefault("/essays/hello")).toBe(false);
    const header = readFileSync(
      join(process.cwd(), "src/components/Shells/Header/HeaderClient.tsx"),
      "utf8"
    );
    expect(header).toContain("pathHidesHeaderByDefault");
    expect(header).toContain("if (hideHeader) return null");
  });

  it("mounts a client override so public-host LOST routes do not render the Hideaway footer", () => {
    expect(components).toContain('useFooterVisibility("hide")');
    expect(storefront).toContain("<LostGlobalFooterOverride />");
    expect(legalPage).toContain("<LostGlobalFooterOverride />");
    expect(fragrancePage).toContain("<LostGlobalFooterOverride />");
    expect(productPage).toContain("<LostGlobalFooterOverride />");
  });

  it("does not ship placeholder social media links in the storefront footer", () => {
    expect(components).not.toContain('"Instagram"');
    expect(components).not.toContain('"Threads"');
    expect(components).not.toContain('"YouTube"');
  });

  it("keeps LOST legal footer links clean instead of leaking the internal route prefix", () => {
    expect(components).toContain('className="lost-footer-link" href="/"');
    expect(components).toContain('className="lost-footer-link"');
    expect(components).toContain('href="/privacy"');
    expect(components).toContain('href="/terms"');
    expect(components).toContain('href="/refund"');
    expect(components).not.toContain('href="/lostinseoul/privacy"');
    expect(components).not.toContain('href="/lostinseoul/terms"');
    expect(components).not.toContain('href="/lostinseoul/refund"');
  });

  it("uses one restrained ending instead of stacking competing footer finales", () => {
    expect(footerComponent).not.toContain("data-lost-cursor-theme");
    expect(components).not.toContain('target?.closest(".lost-footer")');
    expect(footerComponent).toContain("bg-background text-foreground");
    expect(footerComponent).not.toContain("bg-[var(--black)]");
    expect(footerComponent).not.toContain("<LostTopBar pale />");
    expect(footerComponent).not.toContain("md:sticky md:bottom-0");
    expect(footerComponent).not.toContain('className="h-12 w-12 rounded-full');
    expect(footerAfterimage).toContain("lost-footer-wordmark");
    expect(footerComponent).toContain("<LostFooterWordmark />");
    expect(css).not.toContain(".lost-footer::after");
    expect(css).toContain("min-height: 44px");
    expect(css).toContain("color: currentColor");
    expect(footerAfterimage).not.toContain("afterimage__echo");
    expect(css).not.toContain("cursor: ew-resize");
  });

  it("composes the footer as a registered-mark editorial colophon", () => {
    expect(footerComponent).toContain("data-lost-footer-registry");
    expect(footerComponent).toContain("data-lost-footer-wordmark");
    expect(footerComponent).toContain("xl:grid-cols-3");
    expect(footerComponent).not.toContain("grid-flow-row-dense");
    expect(footerComponent).toContain("text-[1.15rem]");
    expect(footerComponent).toContain("text-[1rem]");
    expect(footerComponent.lastIndexOf("footerCopyrightLabel")).toBeLessThan(
      footerComponent.indexOf("data-lost-footer-wordmark")
    );
    expect(footerAfterimage).toContain("text-[clamp(3.5rem,15.7vw,30rem)]");
  });

  it("owns the dark footer theme at LOST route boundaries", () => {
    for (const route of [
      homePage,
      fragranceRoute,
      legalPage,
      productRoute,
      cartRoute,
      checkoutRoute
    ]) {
      expect(route).toContain('theme="dark"');
    }
    expect(gatePage).toContain("theme={null}");
    expect(gatePage).not.toContain('theme="dark"');
  });

  it("overrides the shared dark canvas with LOST route tokens", () => {
    expect(css).toContain("html:has(.lost-commerce-root)");
    expect(css).toContain("body:has(.lost-checkout-root)");
    expect(css).toContain("--bg: var(--black)");
    expect(css).toContain("--fg: var(--white)");
    expect(css).toContain("background: var(--background)");
  });
});
