import { describe, expect, it } from "vitest";
import { isProductionEnvironment } from "./env";

describe("environment validation mode", () => {
  it("treats Next production phases as production", () => {
    expect(
      isProductionEnvironment({ NEXT_PHASE: "phase-production-build" })
    ).toBe(true);
    expect(
      isProductionEnvironment({ NEXT_PHASE: "phase-production-server" })
    ).toBe(true);
  });

  it("does not require production-only variables during development", () => {
    expect(
      isProductionEnvironment({
        NODE_ENV: "development",
        NEXT_PHASE: "phase-development-server"
      })
    ).toBe(false);
    expect(
      isProductionEnvironment({ NEXT_PHASE: "phase-development-server" })
    ).toBe(false);
  });
});
