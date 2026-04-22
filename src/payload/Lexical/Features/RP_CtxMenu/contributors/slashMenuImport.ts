"use client";

import type {
  ContextMenuContributor,
  ContextMenuGroup,
  ContextMenuItem,
  EditorContext,
  ImportFilter
} from "../types";
import { applyImportFilter } from "../utils/filter";

type SlashMenuItemLike = {
  key: string;
  label?:
    | string
    | ((args: {
        i18n: unknown;
        schemaPath: string;
        featureClientSchemaMap: unknown;
      }) => string);
  Icon?: React.FC;
  keywords?: string[];
  onSelect: (args: { editor: unknown; queryString: string }) => void;
};

type SlashMenuGroupLike = {
  key: string;
  label?: SlashMenuItemLike["label"];
  items: SlashMenuItemLike[];
};

function readGroups(context: EditorContext): SlashMenuGroupLike[] {
  const cfg = context.editorConfigContext?.editorConfig;
  const features = cfg?.features as
    | {
        slashMenu?: {
          groups?: SlashMenuGroupLike[];
          dynamicGroups?: Array<
            (args: {
              editor: unknown;
              queryString: string;
            }) => SlashMenuGroupLike[]
          >;
        };
      }
    | undefined;
  if (!features?.slashMenu) return [];

  const staticGroups = features.slashMenu.groups ?? [];
  const dynamic: SlashMenuGroupLike[] = [];
  for (const fn of features.slashMenu.dynamicGroups ?? []) {
    try {
      const result = fn({ editor: context.editor, queryString: "" });
      if (Array.isArray(result)) dynamic.push(...result);
    } catch {
      // If a dynamic group throws with an empty query, skip it.
    }
  }
  return [...staticGroups, ...dynamic];
}

function resolveLabel(
  input: SlashMenuItemLike["label"] | undefined,
  context: EditorContext,
  fallback: string
): string {
  if (!input) return fallback;
  if (typeof input === "string") return input;
  try {
    const fieldProps = context.editorConfigContext.fieldProps as {
      schemaPath?: string;
    };
    return input({
      i18n: (context.editorConfigContext as unknown as { i18n?: unknown }).i18n,
      schemaPath: fieldProps?.schemaPath ?? "",
      featureClientSchemaMap: (
        context.editorConfigContext as unknown as {
          featureClientSchemaMap?: unknown;
        }
      ).featureClientSchemaMap
    });
  } catch {
    return fallback;
  }
}

export interface SlashMenuImportOptions {
  /** Filter applied to every item by `key`. */
  filter?: ImportFilter<SlashMenuItemLike>;
  /** Group-level filter. Decides whether to import a whole group. */
  groupFilter?: ImportFilter<SlashMenuGroupLike>;
  /** Override the target group key that imported items land in. */
  groupKey?: string;
  /** Override the target group label. Not used when wrapped in a submenu. */
  groupLabel?: string;
  /** Sort hint for the resulting group. Default: 80. */
  groupOrder?: number;
  /** Override the submenu trigger label. Default: "Insert block". */
  submenuLabel?: string;
  /**
   * Gate the entire contribution. By default, the slash items only appear
   * when the caret is in an empty block — matching Notion's pattern, where
   * "Add block" suggestions are most useful there.
   */
  isActive?: (context: EditorContext) => boolean;
}

const defaultIsActive = (context: EditorContext) =>
  context.isEmptyBlock || !context.hasTextSelection;

export function createSlashMenuImportContributor(
  options: SlashMenuImportOptions = {}
): ContextMenuContributor {
  const {
    filter,
    groupFilter,
    groupKey = "insert",
    groupOrder = 80,
    submenuLabel = "Insert block",
    isActive = defaultIsActive
  } = options;

  return {
    id: "rp-ctxmenu.slashMenuImport",
    order: 80,
    resolve(context) {
      if (!isActive(context)) return null;

      const sourceGroups = readGroups(context);
      if (sourceGroups.length === 0) return null;

      const subItems: ContextMenuItem[] = [];
      let order = 0;
      let groupIndex = 0;

      for (const sourceGroup of sourceGroups) {
        if (
          !applyImportFilter({
            key: sourceGroup.key,
            item: sourceGroup,
            context,
            filter: groupFilter
          })
        ) {
          continue;
        }

        const before = subItems.length;
        for (const sourceItem of sourceGroup.items ?? []) {
          if (
            !applyImportFilter({
              key: sourceItem.key,
              item: sourceItem,
              context,
              filter
            })
          ) {
            continue;
          }
          order += 1;
          const label = resolveLabel(sourceItem.label, context, sourceItem.key);
          const Icon = sourceItem.Icon as unknown as
            | React.ComponentType<{ className?: string }>
            | undefined;
          if (subItems.length === before && groupIndex > 0) {
            subItems.push({
              kind: "separator",
              key: `slash:sep:${sourceGroup.key}`,
              order
            });
            order += 1;
          }
          subItems.push({
            kind: "item",
            key: `slash:${sourceGroup.key}:${sourceItem.key}`,
            label,
            Icon,
            order,
            onSelect: ({ context: ctx }) => {
              sourceItem.onSelect({ editor: ctx.editor, queryString: "" });
            }
          });
        }
        if (subItems.length > before) groupIndex += 1;
      }

      if (subItems.length === 0) return null;
      const group: ContextMenuGroup = {
        key: groupKey,
        order: groupOrder,
        items: [
          {
            kind: "submenu",
            key: "rp-ctxmenu.insert",
            label: submenuLabel,
            order: 0,
            items: subItems
          }
        ]
      };
      return [group];
    }
  };
}
