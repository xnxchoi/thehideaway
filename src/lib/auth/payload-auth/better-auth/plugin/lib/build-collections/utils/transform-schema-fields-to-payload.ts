import type {
  BuiltBetterAuthSchema,
  FieldRule
} from "@payload-auth/better-auth/plugin/types";
import type { DBFieldAttribute } from "better-auth/db";
import type { Field, RelationshipField } from "payload";
import { getAdditionalFieldProperties } from "./model-field-transformations";

export function getCollectionFields({
  schema,
  fieldRules = [],
  additionalProperties = {},
  protectedFieldKeys = []
}: {
  schema: BuiltBetterAuthSchema;
  fieldRules?: FieldRule[];
  additionalProperties?: Record<
    string,
    (field: DBFieldAttribute) => Partial<Field>
  >;
  protectedFieldKeys?: readonly string[];
}): Field[] | null {
  const payloadFields = Object.entries(schema.fields)
    .filter(([fieldKey]) => fieldKey !== "id")
    .map(([fieldKey, field]) => {
      return convertSchemaFieldToPayload({
        field,
        fieldKey,
        fieldRules,
        additionalProperties,
        protectRead: protectedFieldKeys.includes(fieldKey)
      });
    });

  return payloadFields;
}

export function convertSchemaFieldToPayload({
  field,
  fieldKey,
  fieldRules = [],
  additionalProperties = {},
  protectRead = false
}: {
  field: DBFieldAttribute;
  fieldKey: string;
  fieldRules?: FieldRule[];
  additionalProperties?: Record<
    string,
    (field: DBFieldAttribute) => Partial<Field>
  >;
  protectRead?: boolean;
}): Field {
  const { type, hasMany } = getPayloadFieldProperties({ field });
  const additionalFieldProperties = getAdditionalFieldProperties({
    field,
    fieldKey,
    fieldRules,
    additionalProperties
  });
  const shouldProtectRead = field.returned === false || protectRead;
  const protectedFieldProperties = shouldProtectRead
    ? applyReadProtection(additionalFieldProperties)
    : additionalFieldProperties;
  const baseField = {
    name: field.fieldName ?? fieldKey,
    type,
    ...(hasMany && { hasMany }),
    ...(field.required && { required: true }),
    ...(field.unique && { unique: true }),
    ...protectedFieldProperties,
    custom: {
      betterAuthFieldKey: fieldKey
    }
  } as Field;

  if (field.references) {
    return {
      ...baseField,
      ...("relationTo" in additionalFieldProperties
        ? { relationTo: additionalFieldProperties.relationTo }
        : { relationTo: field.references.model })
    } as RelationshipField;
  }

  return baseField;
}

function applyReadProtection(fieldProperties: Partial<Field>): Partial<Field> {
  const access =
    "access" in fieldProperties ? fieldProperties.access : undefined;
  const admin = "admin" in fieldProperties ? fieldProperties.admin : undefined;
  return {
    ...fieldProperties,
    access: {
      ...access,
      read: () => false
    },
    admin: {
      ...admin,
      hidden: true,
      readOnly: true
    }
  } as Partial<Field>;
}

export function getPayloadFieldProperties({
  field
}: {
  field: DBFieldAttribute;
}): {
  type: Field["type"];
  hasMany?: boolean;
} {
  const type = field.type;

  if ("references" in field) {
    return { type: "relationship" };
  }

  if (type === "number[]") {
    return { type: "number", hasMany: true };
  }

  if (type === "string[]") {
    return { type: "text", hasMany: true };
  }

  switch (type) {
    case "boolean":
      return { type: "checkbox" };
    case "date":
      return { type: "date" };
    case "string":
      return { type: "text" };
    case "number":
      return { type: "number" };
    default:
      return { type: "text" };
  }
}
