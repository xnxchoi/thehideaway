import { describe, expect, it } from "vitest";

import { lostLaunchInventoryAction } from "./lostLaunchInventory";

describe("LOST launch inventory recovery", () => {
  it("initializes an empty launch inventory", () => {
    expect(lostLaunchInventoryAction(0, null)).toBe("initialize");
  });

  it("closes an open launch receipt after stock was released", () => {
    expect(lostLaunchInventoryAction(5, "open")).toBe("close_receipt");
  });

  it("accepts complete or independently provisioned launch stock", () => {
    expect(lostLaunchInventoryAction(5, "closed")).toBe("complete");
    expect(lostLaunchInventoryAction(5, null)).toBe("complete");
  });

  it.each([
    [0, "closed"],
    [5, "draft"],
    [4, null],
    [6, "closed"]
  ] as const)(
    "rejects quantity %s with receipt state %s",
    (quantity, status) => {
      expect(() => lostLaunchInventoryAction(quantity, status)).toThrow(
        "lost-launch-hoodie-inventory-state"
      );
    }
  );
});
