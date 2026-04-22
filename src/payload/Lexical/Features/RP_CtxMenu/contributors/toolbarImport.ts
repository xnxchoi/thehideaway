"use client";

import { $getSelection } from "@payloadcms/richtext-lexical/lexical";
import type {
  BaseSelection,
  LexicalEditor
} from "@payloadcms/richtext-lexical/lexical";

import type {
  ContextMenuContributor,
  ContextMenuGroup,
  ContextMenuItem,
  EditorContext,
  ImportFilter
} from "../types";
import { applyImportFilter } from "../utils/filter";

/**
 * Minimal structural mirror of Payload's ToolbarGroup/ToolbarGroupItem. We
 * keep the shape loose on purpose — we don't want RP_CtxMenu to depend on
 * Payload's internal type paths, just to consume the public feature config.
 */
type ToolbarLabel =
  | string
  | ((args: {
      featureClientSchemaMap: unknown;
      i18n: unknown;
      schemaPath: string;
    }) => string);

interface ToolbarItemLike {
  key: string;
  label?: ToolbarLabel;
  ChildComponent?: React.FC;
  Component?: unknown;
  order?: number;
  isActive?: (args: {
    editor: LexicalEditor;
    editorConfigContext: unknown;
    selection: BaseSelection;
  }) => boolean;
  isEnabled?: (args: {
    editor: LexicalEditor;
    editorConfigContext: unknown;
    selection: BaseSelection;
  }) => boolean;
  onSelect?: (args: { editor: LexicalEditor; isActive: boolean }) => void;
}

interface ToolbarGroupLike {
  key: string;
  type?: "buttons" | "dropdown";
  items: ToolbarItemLike[];
  order?: number;
  isEnabled?: (args: {
    editor: LexicalEditor;
    editorConfigContext: unknown;
    selection: BaseSelection;
  }) => boolean;
}

type ToolbarKind = "fixed" | "inline";

function readGroups(
  context: EditorContext,
  kind: ToolbarKind
): ToolbarGroupLike[] {
  const cfg = context.editorConfigContext?.editorConfig;
  const features = cfg?.features as
    | {
        toolbarFixed?: { groups?: ToolbarGroupLike[] };
        toolbarInline?: { groups?: ToolbarGroupLike[] };
      }
    | undefined;
  const bucket =
    kind === "fixed" ? features?.toolbarFixed : features?.toolbarInline;
  return bucket?.groups ?? [];
}

function resolveLabel(
  input: ToolbarLabel | undefined,
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

function readCurrentSelection(editor: LexicalEditor): BaseSelection | null {
  let result: BaseSelection | null = null;
  editor.getEditorState().read(() => {
    result = $getSelection();
  });
  return result;
}

export interface ToolbarImportOptions {
  /** Which toolbar config to consume. Default: "inline". */
  source?: ToolbarKind;
  /** Per-item filter. */
  filter?: ImportFilter<ToolbarItemLike>;
  /** Group-level filter. */
  groupFilter?: ImportFilter<ToolbarGroupLike>;
  /** Override target group key. Default: "format". */
  groupKey?: string;
  /** Override target group label. */
  groupLabel?: string;
  /** Sort hint for the resulting group. Default: 60. */
  groupOrder?: number;
  /**
   * Gate the entire contribution. Default: require a real text range — most
   * inline-toolbar actions (bold, italic, links) only make sense over a
   * selected range.
   */
  isActive?: (context: EditorContext) => boolean;
}

const defaultIsActive = (context: EditorContext) => context.hasTextSelection;

/**
 * Auto-imports toolbar items from `editorConfig.features.toolbarFixed` /
 * `toolbarInline` as context-menu entries. Items that replace their rendering
 * with a custom `Component` (and therefore no `onSelect`) are skipped — those
 * aren't representable as simple menu rows.
 *
 * Honors Payload's own `isActive` and `isEnabled` predicates so hint checkmarks
 * and disabled state reflect what the toolbar would show for the current
 * selection.
 */
export function createToolbarImportContributor(
  options: ToolbarImportOptions = {}
): ContextMenuContributor {
  const {
    source = "inline",
    filter,
    groupFilter,
    groupKey = "format",
    groupLabel,
    groupOrder = 60,
    isActive = defaultIsActive
  } = options;

  return {
    id: `rp-ctxmenu.toolbarImport.${source}`,
    order: 60,
    resolve(context) {
      if (!isActive(context)) return null;

      const selection = readCurrentSelection(context.editor);
      if (!selection) return null;

      const sourceGroups = readGroups(context, source);
      if (sourceGroups.length === 0) return null;

      const items: ContextMenuItem[] = [];
      let order = 0;

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

        // Group-level isEnabled gates the entire group (matches toolbar).
        if (sourceGroup.isEnabled) {
          try {
            const enabled = sourceGroup.isEnabled({
              editor: context.editor,
              editorConfigContext: context.editorConfigContext,
              selection
            });
            if (!enabled) continue;
          } catch {
            // On throw, fall through and let the per-item predicate handle it.
          }
        }

        for (const sourceItem of sourceGroup.items ?? []) {
          // Custom Component-only items don't expose an onSelect — can't be
          // mapped to a simple menu row, so skip them.
          if (!sourceItem.onSelect) continue;

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

          let itemActive = false;
          let itemDisabled = false;

          if (sourceItem.isActive) {
            try {
              itemActive = Boolean(
                sourceItem.isActive({
                  editor: context.editor,
                  editorConfigContext: context.editorConfigContext,
                  selection
                })
              );
            } catch {
              itemActive = false;
            }
          }

          if (sourceItem.isEnabled) {
            try {
              itemDisabled = !sourceItem.isEnabled({
                editor: context.editor,
                editorConfigContext: context.editorConfigContext,
                selection
              });
            } catch {
              itemDisabled = false;
            }
          }

          order += 1;
          const label = resolveLabel(sourceItem.label, context, sourceItem.key);
          const Icon = sourceItem.ChildComponent as unknown as
            | React.ComponentType<{ className?: string }>
            | undefined;

          const capturedOnSelect = sourceItem.onSelect;
          items.push({
            kind: "item",
            key: `toolbar:${source}:${sourceGroup.key}:${sourceItem.key}`,
            label,
            Icon,
            hint: itemActive ? "✓" : undefined,
            disabled: itemDisabled,
            order,
            onSelect: ({ context: ctx }) => {
              capturedOnSelect({
                editor: ctx.editor,
                isActive: itemActive
              });
            }
          });
        }
      }

      if (items.length === 0) return null;
      const group: ContextMenuGroup = {
        key: groupKey,
        label: groupLabel,
        order: groupOrder,
        items
      };
      return [group];
    }
  };
}
