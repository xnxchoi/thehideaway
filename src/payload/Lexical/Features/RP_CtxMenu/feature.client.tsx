"use client";

import { createClientFeature } from "@payloadcms/richtext-lexical/client";

import { DefaultContributorsProvider } from "./contributors/DefaultContributors";
import { ContextMenuPlugin } from "./plugin/ContextMenuPlugin";
import { ContextMenuRegistryProvider } from "./registry/ContributorRegistry";
import { CtxMenuStoreProvider } from "./store/ctxMenuStore";

/**
 * Wraps the editor in the store + registry providers, then registers the
 * default contributors (clipboard, transform, slash-menu-import,
 * toolbar-import) and mounts the right-click capture plugin.
 *
 * Individual features (e.g. AmbientAudio) register additional contributors
 * of their own via `useRegisterContextMenuContributor` from within their own
 * providers/plugins — those will compose with the defaults at open time.
 */
export const RPContextMenuClientFeature = createClientFeature({
  plugins: [{ Component: ContextMenuPlugin, position: "bottom" }],
  providers: [
    CtxMenuStoreProvider,
    ContextMenuRegistryProvider,
    DefaultContributorsProvider
  ]
});
