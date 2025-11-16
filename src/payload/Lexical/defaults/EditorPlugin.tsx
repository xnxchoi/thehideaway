"use client";
import type { SanitizedPlugin } from "@payloadcms/richtext-lexical";
import React from "react";

export const EditorPlugin: React.FC<{
  anchorElem?: HTMLDivElement;
  clientProps: unknown;
  plugin: SanitizedPlugin;
}> = ({ anchorElem, clientProps, plugin }) => {
  if (plugin.position === "floatingAnchorElem" && anchorElem) {
    return (
      plugin.Component && (
        <plugin.Component anchorElem={anchorElem} clientProps={clientProps} />
      )
    );
  }

  // @ts-expect-error - ts is not able to infer that plugin.Component is of type PluginComponent
  return plugin.Component && <plugin.Component clientProps={clientProps} />;
};
