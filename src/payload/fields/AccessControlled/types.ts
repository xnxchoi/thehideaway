import { FieldServerPropsMap } from "@/AccessControlled/Array/types";
import { RP_Roles } from "@/stores/Notification/NotificationStore";
import type { Access, CollectionSlug, Field } from "payload";

type FieldTypeKeys = Field["type"];
export type FieldConfigMap = {
  [X in FieldTypeKeys]: Extract<Field, { type: X }>;
};
export type FieldType = keyof FieldConfigMap;
type VisibilityLevel = "readonly" | boolean;
type CmpSansField<T extends AccessControlledFieldTypes> = Omit<
  NonNullable<AccessBase<T>["admin"]>["components"],
  "Field"
>;
export type AccessControlledFieldTypes = Exclude<
  FieldTypeKeys,
  "ui" | "join" | "collapsible" | "point" | "tabs" | "blocks" | "code" | "row"
>;
export type ACProps<T extends AccessControlledFieldTypes> = {
  allowedRoles?: RP_Roles[];
  allowAuthor?: boolean;
  conditionMap?: Partial<Record<RP_Roles, VisibilityLevel>>;
  conditionTester?: (
    props: {
      schemaOnly?: {
        field?: AccessBase<T>;
        collection?: CollectionSlug;
      };
    } & FieldServerPropsMap[T]
  ) => boolean;
  overrides?: Partial<CmpSansField<T>>;
};
export type ACCallback<T extends AccessControlledFieldTypes> = (
  props: FieldServerPropsMap[T]
) => VisibilityLevel;
export type ACResolvedSchema<T extends AccessControlledFieldTypes> = {
  [x in RP_Roles]: ACResolvedAccess<T>;
} & {
  self?: ACResolvedAccess<T>;
};
export type ACResolvedAccess<T extends AccessControlledFieldTypes> =
  | ACCallback<T>
  | ((props:FieldServerPropsMap[T]) => VisibilityLevel | Promise<VisibilityLevel>)
  | VisibilityLevel;
export type AccessControlPath<
  T extends AccessControlledFieldTypes = AccessControlledFieldTypes
> =
  `@/AccessControlled/${Capitalize<T>}${"/index.tsx" | "/index.tsx#default" | "" | "#default"}`;
export type AccessBase<
  T extends AccessControlledFieldTypes = AccessControlledFieldTypes
> = FieldConfigMap[T];
export type AccessControlSchema<T extends AccessControlledFieldTypes> = {
  accessControlled: ACResolvedSchema<T>;
};
export type WithAC<T extends AccessControlledFieldTypes> = Partial<
  NonNullable<AccessBase<T>["admin"]>["components"]
> & {
  Field: {
    path: AccessControlPath<T>;
    serverProps: AccessControlSchema<T>;
  };
};
