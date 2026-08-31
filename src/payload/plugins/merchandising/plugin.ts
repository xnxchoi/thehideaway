import { Config, Plugin } from "payload";

import {
  ProductCategory,
  ProductSubCategory
} from "@/payload/collections/(consumption)/ProductCategory";
import { ProductDrops } from "@/payload/collections/(consumption)/ProductDrops";

export interface MerchandisingPluginConfig {
  enabled: boolean;
}

export const MerchandisingPlugin =
  (pluginConfig: MerchandisingPluginConfig): Plugin =>
  (incomingConfig: Config) => {
    const config = incomingConfig;
    if (!pluginConfig.enabled) {
      return config;
    }
    config.collections = config.collections ?? [];
    config.collections.push(
      ProductCategory,
      ProductSubCategory,
      ProductDrops
    );

    return config;
  };
