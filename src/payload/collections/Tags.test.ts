import { describe, expect, it } from "vitest";

import { Tags } from "./Tags";

describe("Tags collection", () => {
  it("does not register a polymorphic taggedItems join", () => {
    const joins = Tags.fields.filter(
      (field) =>
        "name" in field &&
        field.name === "taggedItems" &&
        field.type === "join"
    );
    expect(joins).toEqual([]);
  });

  it("still counts tagged documents on the tag row", () => {
    expect(
      Tags.fields.some(
        (field) => "name" in field && field.name === "tagCount"
      )
    ).toBe(true);
  });
});
