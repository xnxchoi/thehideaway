import { describe, expect, it, vi } from "vitest";

const redirect = vi.fn((href: string) => {
  throw new Error(`NEXT_REDIRECT:${href}`);
});

vi.mock("next/navigation", () => ({ redirect }));

describe("/checkout membership seam", () => {
  it("keeps the route static until membership commerce is reconnected", async () => {
    const { default: CheckoutPage } = await import("./page");

    expect(() => CheckoutPage()).toThrow("NEXT_REDIRECT:/plans");
    expect(redirect).toHaveBeenCalledWith("/plans");
  });
});
