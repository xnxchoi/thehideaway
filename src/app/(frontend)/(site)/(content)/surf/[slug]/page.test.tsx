import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  find: vi.fn()
}));

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({
    find: mocks.find
  }))
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  })
}));

vi.mock("@/components/content/surf/surf", () => ({
  SurfContent: (props: unknown) =>
    React.createElement("mock-surf-content", props)
}));

const richContent = {
  root: {
    children: [
      {
        children: [{ text: "The full Lexical body.", type: "text" }],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1
      }
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1
  }
};

async function renderSurfPage(slug = "small-wave") {
  const { default: SurfPage } = await import("./page");
  return SurfPage({ params: Promise.resolve({ slug }) });
}

describe("/surf/[slug]", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.find.mockReset().mockResolvedValue({
      docs: [
        {
          id: "surf-1",
          title: "A Small Wave",
          slug: "small-wave",
          content: richContent
        }
      ]
    });
  });

  it("renders the fetched Lexical content instead of only the title", async () => {
    const element = await renderSurfPage();

    expect(React.isValidElement(element)).toBe(true);
    expect((element.props as { className: string }).className).toContain(
      "min-h-screen"
    );
    const child = (element.props as { children: React.ReactElement }).children;
    expect(React.isValidElement(child)).toBe(true);
    expect(child.props).toEqual({
      content: richContent,
      title: "A Small Wave"
    });
    expect(mocks.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "surf",
        limit: 1,
        select: expect.objectContaining({
          content: true,
          title: true
        }),
        where: {
          slug: {
            equals: "small-wave"
          }
        }
      })
    );
  });

  it("returns notFound when no surf entry matches the slug", async () => {
    mocks.find.mockResolvedValueOnce({ docs: [] });

    await expect(renderSurfPage("missing-wave")).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
  });
});
