import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidatePath, revalidateTag } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidatePath,
  revalidateTag
}));

import { revalidatePage } from "./revalidatePage";

const payload = { logger: { info: vi.fn(), error: vi.fn() } };

describe("revalidatePage", () => {
  beforeEach(() => {
    revalidatePath.mockReset();
    revalidateTag.mockReset();
    payload.logger.info.mockReset();
    payload.logger.error.mockReset();
  });

  it("still returns the doc if revalidation throws", async () => {
    revalidatePath.mockImplementation(() => {
      throw new Error("static generation store missing");
    });
    const doc = {
      id: "p1",
      slug: "walk-published-page-abc",
      _status: "published"
    };
    await expect(
      revalidatePage({
        doc,
        previousDoc: { ...doc, _status: "draft" },
        req: { payload, context: {} }
      } as never)
    ).resolves.toEqual(doc);
  });
});
