import type { ImageSearchPluginOptions } from "./types";

export const defaultPluginOptions: Required<ImageSearchPluginOptions> = {
  enabled: true,
  providerAccess: ({ req: { user } }) => Boolean(user)
};
