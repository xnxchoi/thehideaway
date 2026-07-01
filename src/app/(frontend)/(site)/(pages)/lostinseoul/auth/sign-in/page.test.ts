import { describe, expect, it } from "vitest";

import { lostSignInMetadata } from "./metadata";

describe("LOSTINSEOUL sign-in metadata", () => {
  it("keeps the browser title in LOST context", () => {
    expect(lostSignInMetadata.title).toBe("LOSTINSEOUL - Sign In");
  });
});
