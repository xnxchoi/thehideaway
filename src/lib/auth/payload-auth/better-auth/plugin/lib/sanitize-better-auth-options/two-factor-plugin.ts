import {
  baModelFieldKeys,
  baModelKey
} from "@payload-auth/better-auth/plugin/constants";
import { set } from "@payload-auth/better-auth/plugin/utils/set";
import {
  getSchemaCollectionSlug,
  getSchemaFieldName
} from "../build-collections/utils/collection-schema";
import type { BetterAuthSchemas } from "@payload-auth/better-auth/types";

export function configureTwoFactorPlugin(
  plugin: any,
  resolvedSchemas: BetterAuthSchemas
): void {
  const model = baModelKey.twoFactor;
  set(
    plugin,
    `schema.${model}.modelName`,
    getSchemaCollectionSlug(resolvedSchemas, model)
  );
  set(
    plugin,
    `schema.${model}.fields.userId.fieldName`,
    getSchemaFieldName(
      resolvedSchemas,
      model,
      baModelFieldKeys.twoFactor.userId
    )
  );
  set(
    plugin,
    `schema.${model}.fields.userId.references.model`,
    getSchemaCollectionSlug(resolvedSchemas, baModelKey.user)
  );
}
