import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidatePath } = vi.hoisted(() => ({
  revalidatePath: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidatePath
}));

import { validateSurf } from "./validateSurf";

const payload = {
  logger: {
    info: vi.fn()
  }
};

describe("validateSurf", () => {
  beforeEach(() => {
    revalidatePath.mockReset();
    payload.logger.info.mockReset();
  });

  it("skips revalidation when disabled by request context", async () => {
    const doc = {
      id: "surf-1",
      slug: "admin-editor-qa-surf-fixture001",
      _status: "published"
    };

    await validateSurf({
      doc,
      previousDoc: { ...doc, _status: "draft" },
      req: {
        payload,
        context: {
          disableRevalidate: true
        }
      }
    } as never);

    expect(revalidatePath).not.toHaveBeenCalled();
    expect(payload.logger.info).not.toHaveBeenCalled();
  });

  it("revalidates the current published surf path by default", async () => {
    const doc = {
      id: "surf-1",
      slug: "admin-editor-qa-surf-fixture001",
      _status: "published"
    };

    await validateSurf({
      doc,
      previousDoc: { ...doc, _status: "draft" },
      req: {
        payload,
        context: {}
      }
    } as never);

    expect(revalidatePath).toHaveBeenCalledWith(
      "/surf/admin-editor-qa-surf-fixture001"
    );
  });
});
