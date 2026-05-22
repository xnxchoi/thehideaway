import { describe, expect, it } from "vitest";

import { buildGiftClaimUrl } from "./claim-url";

describe("buildGiftClaimUrl", () => {
  it("keeps Day n Night gift claims inside the event-owned loop", () => {
    expect(buildGiftClaimUrl("https://hideaway.test", "day-n-night", "abc123"))
      .toBe("https://hideaway.test/day-n-night/claim/abc123");
  });

  it("keeps non-Day n Night events on the legacy generic claim route", () => {
    expect(buildGiftClaimUrl("https://hideaway.test", "other-event", "abc123"))
      .toBe("https://hideaway.test/tickets/claim/abc123");
  });

  it("URL-encodes claim tokens before embedding them in the path", () => {
    expect(
      buildGiftClaimUrl("https://hideaway.test", "day-n-night", "abc/123")
    ).toBe("https://hideaway.test/day-n-night/claim/abc%2F123");
  });
});
