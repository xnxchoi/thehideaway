import { baModelKey } from "@payload-auth/better-auth/plugin/constants";
import { getCollectionFieldNameByFieldKeyUntyped } from "@payload-auth/better-auth/plugin/helpers/get-collection";
import {
  type CollectionBeforeDeleteHook,
  type CollectionConfig,
  type CollectionSlug,
  commitTransaction,
  initTransaction,
  killTransaction
} from "payload";

type UserDependency = {
  fieldKey: string;
  modelKey: string;
  operator?: "equals" | "like";
  value?: (userId: string | number) => string | number;
};

const userDependencies: UserDependency[] = [
  { modelKey: baModelKey.account, fieldKey: "userId" },
  { modelKey: baModelKey.session, fieldKey: "userId" },
  {
    modelKey: baModelKey.verification,
    fieldKey: "value",
    operator: "like",
    value: (userId) => `"${userId}"`
  },
  { modelKey: baModelKey.passkey, fieldKey: "userId" },
  { modelKey: baModelKey.twoFactor, fieldKey: "userId" },
  { modelKey: baModelKey.member, fieldKey: "userId" },
  { modelKey: baModelKey.teamMember, fieldKey: "userId" },
  { modelKey: baModelKey.invitation, fieldKey: "inviterId" },
  { modelKey: baModelKey.subscription, fieldKey: "referenceId" },
  { modelKey: baModelKey.apikey, fieldKey: "referenceId" },
  { modelKey: baModelKey.oauthApplication, fieldKey: "userId" },
  { modelKey: baModelKey.oauthAccessToken, fieldKey: "userId" },
  { modelKey: baModelKey.oauthConsent, fieldKey: "userId" },
  { modelKey: baModelKey.deviceCode, fieldKey: "userId" }
];

function findCollectionByModelKey(
  collections: Record<string, { config: CollectionConfig }>,
  modelKey: string
): CollectionConfig | undefined {
  return Object.values(collections).find(
    ({ config }) =>
      config.custom?.betterAuthModelKey === modelKey || config.slug === modelKey
  )?.config;
}

export function getBeforeDeleteHook(): CollectionBeforeDeleteHook {
  const hook: CollectionBeforeDeleteHook = async ({ req, id }) => {
    const collections = req.payload.collections;
    const shouldCommit = await initTransaction(req);

    try {
      const { payload } = req;

      for (const dependency of userDependencies) {
        const collection = findCollectionByModelKey(
          collections,
          dependency.modelKey
        );
        if (!collection) continue;

        const fieldName = getCollectionFieldNameByFieldKeyUntyped(
          collection,
          dependency.fieldKey
        );
        const operator = dependency.operator ?? "equals";
        const value = dependency.value?.(id) ?? id;

        await payload.delete({
          collection: collection.slug as CollectionSlug,
          overrideAccess: true,
          where: {
            [fieldName]: {
              [operator]: value
            }
          },
          req
        });
      }

      if (shouldCommit) {
        await commitTransaction(req);
      }
    } catch (error) {
      await killTransaction(req);
      throw error;
    }
  };

  return hook;
}
