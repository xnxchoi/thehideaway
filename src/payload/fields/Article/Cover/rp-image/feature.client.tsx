"use client";

import { $isRPImageNode } from "@/payload/fields/Article/Cover/rp-image/client/node/RP_ImageNode";
import { DarkRoomPlugin } from "@/payload/fields/Article/Cover/rp-image/client/plugin";
import {
  createClientFeature,
  slashMenuBasicGroupWithItems,
  toolbarAddDropdownGroupWithItems
} from "@payloadcms/richtext-lexical/client";
import { INSERT_UPLOAD_WITH_DRAWER_COMMAND } from "node_modules/@payloadcms/richtext-lexical/dist/features/upload/client/drawer/commands";
import { ExclusiveUploadFeatureProps } from "node_modules/@payloadcms/richtext-lexical/dist/features/upload/server";
import { $isNodeSelection } from "lexical";
import { UploadIcon } from "lucide-react";

export type UploadFeaturePropsClient = {
  collections: {
    [collection: string]: {
      hasExtraFields: boolean;
    };
  };
} & ExclusiveUploadFeatureProps;

export const RPImageFeatureClient =
  createClientFeature<UploadFeaturePropsClient>({
    nodes: [],
    plugins: [
      {
        Component: DarkRoomPlugin,
        position: "normal"
      }
    ],
    slashMenu: {
      groups: [
        slashMenuBasicGroupWithItems([
          {
            Icon: UploadIcon,
            key: "upload",
            keywords: [
              "upload",
              "image",
              "file",
              "img",
              "picture",
              "photo",
              "media"
            ],
            label: ({ i18n }) => {
              return i18n.t("lexical:upload:label");
            },
            onSelect: ({ editor }) => {
              editor.dispatchCommand(INSERT_UPLOAD_WITH_DRAWER_COMMAND, {
                replace: false
              });
            }
          }
        ])
      ]
    },
    toolbarFixed: {
      groups: [
        toolbarAddDropdownGroupWithItems([
          {
            ChildComponent: UploadIcon,
            isActive: ({ selection }) => {
              if (
                !$isNodeSelection(selection) ||
                !selection.getNodes().length
              ) {
                return false;
              }

              const firstNode = selection.getNodes()[0];
              return $isRPImageNode(firstNode);
            },
            key: "upload",
            label: ({ i18n }) => {
              return i18n.t("lexical:upload:label");
            },
            onSelect: ({ editor }) => {
              editor.dispatchCommand(INSERT_UPLOAD_WITH_DRAWER_COMMAND, {
                replace: false
              });
            }
          }
        ])
      ]
    }
  });
