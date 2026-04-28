import type { CollectionSlug, SelectField } from "payload";
import { audienceFieldAdmin } from "./admin";

export const AUDIENCE_VALUES = [
  "public",
  "any_user",
  "members",
  "patrons",
  "curated"
] as const;

export type AudienceValue = (typeof AUDIENCE_VALUES)[number];

export const audienceToLockState = (
  audience: AudienceValue | null | undefined
): { locked: boolean; authority: number } => {
  switch (audience) {
    case "any_user":
      return { locked: true, authority: 1 };
    case "members":
      return { locked: true, authority: 2 };
    case "patrons":
      return { locked: true, authority: 3 };
    case "curated":
      return { locked: true, authority: 1000 };
    case "public":
    default:
      return { locked: false, authority: 0 };
  }
};

export const lockStateToAudience = (
  locked: boolean | null | undefined,
  authority: number | null | undefined
): AudienceValue => {
  if (!locked) return "public";
  const auth = typeof authority === "number" ? authority : 0;
  if (auth >= 1000) return "curated";
  if (auth >= 3) return "patrons";
  if (auth >= 2) return "members";
  return "any_user";
};

export const audienceField = (props: {
  collection: CollectionSlug;
  overrides?: Partial<SelectField>;
}): SelectField => {
  const { collection, overrides } = props;
  const config: SelectField = {
    name: "audience",
    type: "select",
    defaultValue: "public",
    options: [
      { label: "Public — anyone can read", value: "public" },
      { label: "Any registered user", value: "any_user" },
      { label: "Members and above", value: "members" },
      { label: "Patrons and above", value: "patrons" },
      { label: "Curated list only", value: "curated" }
    ],
    admin: audienceFieldAdmin({
      collection,
      overrides: overrides?.admin || {}
    }),
    hooks: {
      beforeChange: [
        ({ value, siblingData }) => {
          const audience = (value ?? "public") as AudienceValue;
          const { locked, authority } = audienceToLockState(audience);
          siblingData.locked = locked;
          siblingData.authority = authority;
          return audience;
        }
      ],
      afterRead: [
        ({ value, siblingData }) => {
          if (
            typeof value === "string" &&
            (AUDIENCE_VALUES as readonly string[]).includes(value)
          ) {
            return value;
          }
          return lockStateToAudience(
            siblingData?.locked as boolean | null | undefined,
            siblingData?.authority as number | null | undefined
          );
        }
      ]
    },
    ...overrides
  };
  return config;
};
