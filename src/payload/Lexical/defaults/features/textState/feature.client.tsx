"use client";

import { ToolbarGroup } from "@payloadcms/richtext-lexical";
import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import { ToolbarDropdownGroup } from "node_modules/@payloadcms/richtext-lexical/dist/features/toolbars/types";
import { TextStateIcon } from "node_modules/@payloadcms/richtext-lexical/dist/lexical/ui/icons/TextState";
import type { TextStateFeatureProps } from "./feature.server";

import {
  registerTextStates,
  setTextState,
  type StateMap,
  StatePlugin
} from "./textState";

const toolbarGroups = (
  props: TextStateFeatureProps,
  stateMap: StateMap
): ToolbarGroup[] => {
  const items: ToolbarDropdownGroup["items"] = [];

  for (const stateKey in props.state) {
    const key = props.state[stateKey]!;
    for (const stateValue in key) {
      const meta = key[stateValue]!;
      items.push({
        //@ts-expect-error ee
        ChildComponent: () => <TextStateIcon css={meta.css} />,
        key: stateValue,
        label: meta.label,
        onSelect: ({ editor }) => {
          setTextState(editor, stateMap, stateKey, stateValue);
        }
      });
    }
  }

  const clearStyle: ToolbarDropdownGroup["items"] = [
    {
      ChildComponent: () => <TextStateIcon />,
      key: `clear-style`,
      label: ({ i18n }) => i18n.t("lexical:textState:defaultStyle"),
      onSelect: ({ editor }) => {
        for (const stateKey in props.state) {
          setTextState(editor, stateMap, stateKey, undefined);
        }
      },
      order: 1
    }
  ];

  return [
    {
      type: "dropdown",
      ChildComponent: () => (
        <TextStateIcon css={{ color: "var(--theme-elevation-600)" }} />
      ),
      items: [...clearStyle, ...items],
      key: "textState",
      order: 30
    }
  ];
};

export const TextStateFeatureClient =
  createClientFeature<TextStateFeatureProps>(({ props }) => {
    const stateMap = registerTextStates(props.state);
    return {
      plugins: [
        {
          Component: () => StatePlugin({ stateMap }),
          position: "normal"
        }
      ],
      toolbarFixed: {
        groups: toolbarGroups(props, stateMap)
      },
      toolbarInline: {
        groups: toolbarGroups(props, stateMap)
      }
    };
  });
