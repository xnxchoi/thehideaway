import type { DBFieldAttribute } from "better-auth/db";
import type { Field } from "payload";
import { describe, expect, it, vi } from "vitest";

import type { BuiltBetterAuthSchema } from "../../../types";
import {
  convertSchemaFieldToPayload,
  getCollectionFields
} from "./transform-schema-fields-to-payload";

const schemaWithFields = (
  fields: Record<string, DBFieldAttribute>
): BuiltBetterAuthSchema => ({
  modelName: "auth-records",
  fields,
  order: 1
});

const getReadAccess = (field: Field) => {
  if (!("access" in field)) {
    return undefined;
  }

  return field.access?.read;
};

describe("Better Auth schema field transformation", () => {
  it("leaves the primary id to Payload so the configured UUID type is preserved", () => {
    const fields = getCollectionFields({
      schema: schemaWithFields({
        id: { type: "string", required: true, unique: true },
        email: { type: "string", required: true }
      })
    });

    expect(
      fields?.map((field) => ("name" in field ? field.name : null))
    ).toEqual(["email"]);
  });

  it("denies ordinary reads and hides fields marked returned false", async () => {
    const canCreate = vi.fn(() => true);
    const field = convertSchemaFieldToPayload({
      field: { type: "string", returned: false },
      fieldKey: "secret",
      additionalProperties: {
        secret: () => ({
          access: { create: canCreate },
          admin: { description: "Internal credential" }
        })
      }
    });

    expect(field.admin).toMatchObject({
      description: "Internal credential",
      hidden: true,
      readOnly: true
    });
    expect("access" in field ? field.access?.create : undefined).toBe(
      canCreate
    );
    expect(await getReadAccess(field)?.({} as never)).toBe(false);
  });

  it("does not add read restrictions to ordinary returned fields", () => {
    const field = convertSchemaFieldToPayload({
      field: { type: "string" },
      fieldKey: "displayName"
    });

    expect(field.admin).toBeUndefined();
    expect(getReadAccess(field)).toBeUndefined();
  });

  it.each([
    ["session token", "token"],
    ["verification value", "value"]
  ])(
    "explicitly protects %s when Better Auth omits returned false",
    async (_, fieldKey) => {
      const [field] =
        getCollectionFields({
          schema: schemaWithFields({ [fieldKey]: { type: "string" } }),
          protectedFieldKeys: [fieldKey]
        }) ?? [];

      expect(field.admin).toMatchObject({ hidden: true, readOnly: true });
      expect(await getReadAccess(field)?.({} as never)).toBe(false);
    }
  );
});
