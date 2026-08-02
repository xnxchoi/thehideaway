import { beforeEach, describe, expect, it, vi } from "vitest";

describe("createTransform.transformInput", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("preserves explicit null and skips undefined fields", async () => {
    vi.doMock("better-auth/db", () => ({
      getAuthTables: () => ({
        user: {
          modelName: "users",
          fields: {
            name: { fieldName: "displayName" },
            bio: {},
            email: {}
          }
        }
      })
    }));

    const { createTransform } = await import("./transform");

    const payload = {
      collections: {
        users: {
          config: {
            slug: "users",
            custom: { betterAuthModelKey: "user" },
            fields: [
              {
                name: "displayName",
                type: "text",
                custom: { betterAuthFieldKey: "name" }
              },
              { name: "bio", type: "text" },
              { name: "email", type: "text" }
            ]
          }
        }
      }
    };

    const { transformInput } = createTransform({} as never, false);

    expect(
      transformInput({
        data: {
          name: null,
          bio: undefined,
          email: "author@hideaway.test"
        },
        model: "user" as never,
        idType: "text",
        payload: payload as never
      })
    ).toEqual({
      displayName: null,
      email: "author@hideaway.test"
    });
  });
});
