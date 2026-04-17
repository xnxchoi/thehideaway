import type {
  Payload,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig
} from "payload";

import { getRouteWithoutAdmin, isAdminRoute } from "./shared";

type Args = {
  adminRoute: string;
  config: SanitizedConfig;
  defaultIDType: Payload["db"]["defaultIDType"];
  payload?: Payload;
  route: string;
};

type RouteInfo = {
  collectionConfig?: SanitizedCollectionConfig;
  collectionSlug?: string;
  docID?: string;
  globalConfig?: SanitizedGlobalConfig;
  globalSlug?: string;
};

export function getRouteInfo({
  adminRoute,
  config,
  defaultIDType,
  payload,
  route
}: Args): RouteInfo {
  if (isAdminRoute({ adminRoute, config, route })) {
    const routeWithoutAdmin = getRouteWithoutAdmin({ adminRoute, route });
    const routeSegments = routeWithoutAdmin.split("/").filter(Boolean);
    const [entityType, entitySlug, createOrID] = routeSegments;
    const collectionSlug =
      entityType === "collections" ? entitySlug : undefined;
    const globalSlug = entityType === "globals" ? entitySlug : undefined;

    let collectionConfig: SanitizedCollectionConfig | undefined;
    let globalConfig: SanitizedGlobalConfig | undefined;
    let idType = defaultIDType;

    if (collectionSlug) {
      //@ts-expect-error payload hasn't typed this'
      collectionConfig = payload?.collections?.[collectionSlug]?.config;
    }

    if (globalSlug) {
      globalConfig = config.globals.find(
        (global) => global.slug === globalSlug
      );
    }

    // If the collection is using a custom ID, we need to determine its type
    if (collectionConfig && payload && collectionSlug) {
      //@ts-expect-error payload hasn't typed this'
      if (payload.collections?.[collectionSlug]?.customIDType) {
        //@ts-expect-error payload hasn't typed this'
        idType = payload.collections?.[collectionSlug]?.customIDType;
      }
    }

    const docID =
      collectionSlug && createOrID !== "create" ? createOrID : undefined;

    return {
      collectionConfig,
      collectionSlug,
      docID,
      globalConfig,
      globalSlug
    };
  }

  return {};
}
