import { describe, expect, it } from "vitest";

import {
  buildGiftClaimUrl,
  buildTicketManagementUrl,
  ticketManagementPath
} from "./event-loop";

describe("Day n Night ticket loop routes", () => {
  it("keeps Day n Night management on the event-owned my page", () => {
    expect(ticketManagementPath("day-n-night")).toBe("/day-n-night/my");
  });

  it("keeps non-Day n Night management on the generic tickets surface", () => {
    expect(ticketManagementPath("listening-party")).toBe("/tickets/my");
  });

  it("builds an absolute Day n Night management URL without a double slash", () => {
    expect(buildTicketManagementUrl("https://hideaway.test/", "day-n-night"))
      .toBe("https://hideaway.test/day-n-night/my");
  });

  it("keeps Day n Night gift claims inside the event-owned claim page", () => {
    expect(buildGiftClaimUrl("https://hideaway.test", "day-n-night", "abc123"))
      .toBe("https://hideaway.test/day-n-night/claim/abc123");
  });

  it("keeps non-Day n Night gift claims on the generic claim route", () => {
    expect(buildGiftClaimUrl("https://hideaway.test", "other-event", "abc123"))
      .toBe("https://hideaway.test/tickets/claim/abc123");
  });

  it("URL-encodes gift claim tokens before embedding them in the path", () => {
    expect(
      buildGiftClaimUrl("https://hideaway.test", "day-n-night", "abc/123")
    ).toBe("https://hideaway.test/day-n-night/claim/abc%2F123");
  });
});
