import {lockCollections} from "@/payload/plugins/locker/lockCollections";
import type {CollectionConfig, CollectionSlug, Plugin} from "payload";

export interface LockerPluginConfig {
  /**
   * Enable or disable plugin
   *
   * @default true
   */
  enabled?: boolean;

  /**
   * The slug of the collection that contains the users
   *
   * @default []
   */
  targetCollections?: CollectionSlug[];
  userCollections?: CollectionSlug[];
  collectionOverrides?: {
    [x in CollectionSlug]?: Partial<CollectionConfig<x>>;
  };
}

export const lockerPlugin =
  (pluginOptions: LockerPluginConfig): Plugin =>
  (incomingConfig) => {
    const config = { ...incomingConfig };

    // If the plugin is disabled, return the config as is
    if (pluginOptions.enabled === false) {
      return config;
    }

    // Generate users collection
    config.collections = [...(config.collections || [])];
    lockCollections(config.collections, pluginOptions);
    config.collections
      .filter((r) => r.fields.some((x) => x?.admin?.position === "sidebar"))
      .forEach((coll) => {
        if (coll) {
          coll.fields = [
            {
              type: "ui",
              name: "sidebarControl",
              admin: {
                components: {
                  Field: "@/payload/fields/SidebarControls/index.tsx"
                },
                position: "sidebar"
              }
            },
            ...coll.fields
          ];
        }
      });
    // Add custom components to admin
    config.admin = {
      ...config.admin
    };

    return config;
  };
