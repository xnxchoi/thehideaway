import { beforeEach, describe, expect, it, vi } from "vitest";

const find = vi.fn();
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({ find }))
}));

describe("commerce product presentation seam", () => {
  beforeEach(() => find.mockReset());

  it("maps the minimal product into the retained storefront shape", async () => {
    find.mockResolvedValue({
      docs: [
        {
          id: "product-1",
          name: "Fragrance Object",
          slug: "fragrance-object",
          active: true,
          priceInKRW: 55_000,
          _status: "published",
          hero_media: { filename: "object.webp", alt: "Object" }
        }
      ]
    });
    const { getCommerceProductPresentation } =
      await import("./product-presentation");

    await expect(
      getCommerceProductPresentation("fragrance-object")
    ).resolves.toEqual(
      expect.objectContaining({
        id: "product-1",
        unitAmount: 55_000,
        imageUrl: "/media/object.webp",
        modes: [],
        variants: []
      })
    );
  });

  it("returns null when no active product is available", async () => {
    find.mockResolvedValue({ docs: [] });
    const { getCommerceProductPresentation } =
      await import("./product-presentation");

    await expect(getCommerceProductPresentation("missing")).resolves.toBeNull();
  });
});
