import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("baseline migration discovery", () => {
  it("keeps test and helper modules outside Payload's migration directory", () => {
    // Payload imports every top-level .ts/.js file except index, including tests.
    const discoveredFiles = readdirSync(
      new URL("./migrations-baseline/", import.meta.url)
    ).filter(
      (file) => /\.(ts|js)$/.test(file) && !/^index\.(ts|js)$/.test(file)
    );

    expect(discoveredFiles.length).toBeGreaterThan(0);
    expect(
      discoveredFiles.filter(
        (file) => !/^\d{8}_\d{6}(?:_[a-z0-9_]+)?\.(ts|js)$/.test(file)
      )
    ).toEqual([]);
  });
});
