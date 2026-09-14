import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const productionNginx = readFileSync(
  resolve(process.cwd(), "nginx/sites-enabled/production.conf"),
  "utf8"
);

function locationBlock(config: string, declaration: string): string | null {
  const start = config.indexOf(`location ${declaration} {`);
  if (start < 0) return null;
  const openingBrace = config.indexOf("{", start);
  let depth = 0;
  for (let index = openingBrace; index < config.length; index += 1) {
    if (config[index] === "{") depth += 1;
    if (config[index] === "}") depth -= 1;
    if (depth === 0) return config.slice(openingBrace + 1, index);
  }
  return null;
}

describe("production LOSTINSEOUL nginx boundary", () => {
  it.each(["/gate", "/privacy", "/terms", "/refund"])(
    "proxies the clean LOSTINSEOUL route %s to Next",
    (route) => {
      expect(locationBlock(productionNginx, `= ${route}`)).toContain(
        "proxy_pass http://hideaway_upstream;"
      );
    }
  );

  it("does not borrow a proxy_pass from the next location block", () => {
    const config = `
      location = /gate { return 404; }
      location = /privacy { proxy_pass http://hideaway_upstream; }
    `;

    expect(locationBlock(config, "= /gate")).not.toContain("proxy_pass");
  });

  it.each([
    "/api/lost/",
    "/api/commerce/",
    "/api/auth/",
    "= /api/carts",
    "/api/carts/",
    "/api/payments/",
    "= /api/health",
    "= /api/users/me",
    "= /api/addresses"
  ])("allows the LOSTINSEOUL API boundary %s", (declaration) => {
    expect(locationBlock(productionNginx, declaration)).toContain(
      "proxy_pass http://hideaway_upstream;"
    );
  });

  it("caps commerce API request bodies", () => {
    expect(locationBlock(productionNginx, "/api/commerce/")).toContain(
      "client_max_body_size 256k;"
    );
  });

  it("rejects unrelated APIs on the LOSTINSEOUL host", () => {
    expect(locationBlock(productionNginx, "/api/")).toMatch(
      /if \(\$is_lostinseoul_host\) \{\s*return 404;/
    );
  });

  it("forwards the domain root without bouncing back to the internal prefix", () => {
    const root = locationBlock(productionNginx, "= /");
    expect(root).toContain("proxy_pass http://hideaway_upstream;");
    expect(root).not.toContain("return 302 /lostinseoul");
  });

  it.each(["/cart", "/checkout", "/fragrance", "/policy", "/auth/sign-in"])(
    "forwards clean storefront page %s",
    (route) =>
      expect(locationBlock(productionNginx, `= ${route}`)).toContain(
        "proxy_pass http://hideaway_upstream;"
      )
  );

  it.each(["products", "collections", "orders", "payment", "policy"])(
    "forwards clean storefront descendants under %s",
    (route) =>
      expect(locationBlock(productionNginx, `^~ /${route}/`)).toContain(
        "proxy_pass http://hideaway_upstream;"
      )
  );

  it.each(["/vault/", "/api/notifications/stream"])(
    "keeps the separate %s location closed on the LOST host",
    (route) =>
      expect(locationBlock(productionNginx, route)).toMatch(
        /if \(\$is_lostinseoul_host\) \{\s*return 404;/
      )
  );

  it("continues to reject arbitrary Hideaway paths on the LOSTINSEOUL host", () => {
    expect(productionNginx).toMatch(
      /location \/ \{[\s\S]*?if \(\$is_lostinseoul_host\) \{[\s\S]*?return 404;[\s\S]*?\}/
    );
  });
});
