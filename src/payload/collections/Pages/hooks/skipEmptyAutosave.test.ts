import { APIError } from "payload";
import { describe, expect, it } from "vitest";

import { skipEmptyPageAutosave } from "./skipEmptyAutosave";

describe("skipEmptyPageAutosave", () => {
  it("throws on autosave without a title", () => {
    expect(() =>
      skipEmptyPageAutosave({
        data: { title: "" },
        operation: "update",
        req: { query: { autosave: "true" } }
      } as never)
    ).toThrow(APIError);
  });

  it("throws on create without a title", () => {
    expect(() =>
      skipEmptyPageAutosave({
        data: {},
        operation: "create",
        req: { query: {} }
      } as never)
    ).toThrow(APIError);
  });


  it("allows autosave once a title exists", () => {
    expect(
      skipEmptyPageAutosave({
        data: { title: "Walk published page" },
        req: { query: { autosave: "true" } }
      } as never)
    ).toEqual({ title: "Walk published page" });
  });

  it("does not block a publish", () => {
    expect(
      skipEmptyPageAutosave({
        data: { title: "Walk published page", _status: "published" },
        req: { query: {} }
      } as never)
    ).toEqual({ title: "Walk published page", _status: "published" });
  });
});
