import { describe, expect, it } from "vitest";
import { mergeCollectionFields } from "./merge-collection-fields";

describe("mergeCollectionFields", () => {
  it("reuses existing Payload fields while retaining Better Auth metadata", () => {
    const existingAccess = { update: () => false };
    const fields = mergeCollectionFields(
      [
        {
          name: "bio",
          type: "text",
          defaultValue: "Existing default",
          index: true,
          access: existingAccess,
          custom: { payloadOwned: true }
        }
      ],
      [
        {
          name: "bio",
          type: "text",
          required: false,
          custom: { betterAuthFieldKey: "bio" }
        },
        {
          name: "email",
          type: "email",
          required: true,
          custom: { betterAuthFieldKey: "email" }
        }
      ]
    );

    expect(fields).toHaveLength(2);
    expect(fields[0]).toMatchObject({
      name: "bio",
      defaultValue: "Existing default",
      index: true,
      access: existingAccess,
      custom: { betterAuthFieldKey: "bio", payloadOwned: true }
    });
    expect(fields[1]).toMatchObject({
      name: "email",
      custom: { betterAuthFieldKey: "email" }
    });
  });
});
