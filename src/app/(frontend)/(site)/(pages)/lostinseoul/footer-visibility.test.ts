import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { pathHidesFooterByDefault } from "@/components/Shells/Footer/footer-visibility";

const css = readFileSync(join(__dirname, "index.css"), "utf8");
const components = readFileSync(join(__dirname, "components.tsx"), "utf8");
const storefront = readFileSync(join(__dirname, "storefront.tsx"), "utf8");
const legalPage = readFileSync(join(__dirname, "legal-page.tsx"), "utf8");
const fragrancePage = readFileSync(
  join(__dirname, "fragrance/page.client.tsx"),
  "utf8"
);
const productPage = readFileSync(
  join(__dirname, "products/[slug]/product.client.tsx"),
  "utf8"
);

describe("LOST footer visibility CSS", () => {
  it("does not hide the storefront footer with the global footer suppression rule", () => {
    expect(css).toContain("footer:not(.lost-footer)");
    expect(css).not.toContain("body:has(.lost-commerce-root) footer,");
  });

  it("hides the global Hideaway footer on internal LOST routes", () => {
    expect(pathHidesFooterByDefault("/lostinseoul")).toBe(true);
    expect(pathHidesFooterByDefault("/lostinseoul/privacy")).toBe(true);
    expect(pathHidesFooterByDefault("/lostinseoul/products/object")).toBe(true);
  });

  it("mounts a client override so public-host LOST routes do not render the Hideaway footer", () => {
    expect(components).toContain("useFooterVisibility(\"hide\")");
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
    expect(components).toContain('href="/privacy"');
    expect(components).toContain('href="/terms"');
    expect(components).toContain('href="/refund"');
    expect(components).not.toContain('href="/lostinseoul/privacy"');
    expect(components).not.toContain('href="/lostinseoul/terms"');
    expect(components).not.toContain('href="/lostinseoul/refund"');
  });

  it("keeps the oversized footer mark out of mobile sticky overlap", () => {
    expect(components).not.toContain('className="sticky bottom-0 z-0');
    expect(components).toContain("md:sticky md:bottom-0");
  });
});
