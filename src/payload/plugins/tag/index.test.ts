import { describe, expect, it } from "vitest";

import { tagPlugin } from "./index";

describe("tagPlugin", () => {
  it("adds tagged relationships without a reverse join field", () => {
    const config = tagPlugin({
      collections: ["posts"],
      enabled: true
    })({
      collections: [
        {
          slug: "posts",
          fields: [{ name: "title", type: "text" }]
        }
      ]
    });

    const posts = config.collections?.find((collection) => collection.slug === "posts");
    const tags = config.collections?.find((collection) => collection.slug === "tags");

    expect(
      posts?.fields.some(
        (field) => "name" in field && field.name === "tagged" && field.type === "relationship"
      )
    ).toBe(true);

    expect(
      tags?.fields.some(
        (field) =>
          "name" in field && field.name === "taggedItems" && field.type === "join"
      )
    ).toBe(false);
  });
});
