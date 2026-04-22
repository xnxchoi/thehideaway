import type { LexicalEditor } from "@payloadcms/richtext-lexical/lexical";
import type { useEditorConfigContext } from "@payloadcms/richtext-lexical/client";
import type { ComponentType, ReactNode } from "react";

type EditorConfigContextType = ReturnType<typeof useEditorConfigContext>;

/**
 * Editor selection kind derived from the current Lexical selection at the
 * moment the menu opens.
 */
export type SelectionKind =
  | "range-text" // non-empty text range selected
  | "caret" // collapsed caret, no range
  | "node" // one or more nodes selected (NodeSelection)
  | "none"; // no active selection

/**
 * Snapshot of the editor state when the context menu opens. Contributors read
 * this to decide which items to show.
 *
 * The snapshot is immutable — re-opening the menu yields a fresh snapshot.
 */
export interface EditorContext {
  /** Coordinates where the menu was opened (viewport pixels). */
  readonly x: number;
  readonly y: number;
  /** DOM element under the pointer at open time. */
  readonly domTarget: HTMLElement | null;
  /** The Lexical editor instance. */
  readonly editor: LexicalEditor;
  /** Full editor-config context. Exposed for contributors that need i18n/schema. */
  readonly editorConfigContext: EditorConfigContextType;

  /** Selection shape. */
  readonly selectionKind: SelectionKind;
  /** True when selection is a non-empty text range. */
  readonly hasTextSelection: boolean;
  /** Plain-text content of the selection, when applicable. */
  readonly selectedText: string;

  /**
   * Node key of the target block (paragraph, heading, block-level node) closest
   * to the click, or the block that contains the caret/anchor of the selection.
   */
  readonly targetBlockKey: string | null;
  /**
   * Lexical `__type` of the target block (e.g. "paragraph", "heading", "quote",
   * "code", "ambientAudioAnchor"). Null if unresolved.
   */
  readonly targetBlockType: string | null;
  /**
   * Node key of the exact node the click landed on. May equal `targetBlockKey`
   * or be a descendant (inline mark, inline block, text node).
   */
  readonly targetNodeKey: string | null;
  /**
   * Lexical `__type` of the exact target node.
   */
  readonly targetNodeType: string | null;
  /** Node keys of ancestors between the target node and the root. */
  readonly ancestorNodeKeys: readonly string[];
  /** Lexical `__type` of each ancestor. */
  readonly ancestorNodeTypes: readonly string[];
  /** True when the target block contains no text. */
  readonly isEmptyBlock: boolean;
  /**
   * Free-form data any contributor can attach during a `resolve()` pass.
   * Keys should be namespaced (e.g. `"ambientAudio.groupId"`).
   */
  readonly data: Readonly<Record<string, unknown>>;
}

/**
 * A single menu entry. Leaf items render as clickable rows; submenu items
 * render as rows with a nested popup.
 */
export type ContextMenuItem =
  | ContextMenuLeafItem
  | ContextMenuSubmenuItem
  | ContextMenuSeparatorItem;

export interface ContextMenuLeafItem {
  readonly kind: "item";
  /** Globally unique. Used for de-dup across contributors. */
  readonly key: string;
  readonly label: string;
  /** Optional icon component rendered before the label. */
  readonly Icon?: ComponentType<{ className?: string }>;
  /** Optional trailing text (shortcut, hint). */
  readonly hint?: string;
  /** Visual tone. Danger items render with the rouge accent. */
  readonly tone?: "default" | "danger" | "accent";
  /** When true, the item is rendered but not clickable. */
  readonly disabled?: boolean;
  /** Called when the item is activated. */
  onSelect: (args: { context: EditorContext }) => void;
  /** Sort hint. Lower numbers render first. Default: 100. */
  readonly order?: number;
}

export interface ContextMenuSubmenuItem {
  readonly kind: "submenu";
  readonly key: string;
  readonly label: string;
  readonly Icon?: ComponentType<{ className?: string }>;
  readonly hint?: string;
  readonly disabled?: boolean;
  readonly items: readonly ContextMenuItem[];
  readonly order?: number;
}

export interface ContextMenuSeparatorItem {
  readonly kind: "separator";
  readonly key: string;
  readonly order?: number;
}

/**
 * A named bucket for items. Groups with the same key are merged; their items
 * are concatenated and sorted by `order`.
 */
export interface ContextMenuGroup {
  readonly key: string;
  readonly label?: string;
  readonly items: readonly ContextMenuItem[];
  /** Sort hint among groups. Default: 100. */
  readonly order?: number;
}

/**
 * Filter that decides which keys survive an auto-import. Every contributor
 * that imports from an external source (toolbar, slash menu) accepts this.
 *
 * Evaluation order:
 *   1. If `include` is provided, the key MUST match one of its entries.
 *   2. If `exclude` is provided, the key MUST NOT match any of its entries.
 *   3. If `predicate` is provided, it is consulted last.
 *
 * Entries may be exact strings or `RegExp`. `predicate` receives the raw item
 * plus the current context so filters can depend on selection state.
 */
export interface ImportFilter<T = unknown> {
  readonly include?: ReadonlyArray<string | RegExp>;
  readonly exclude?: ReadonlyArray<string | RegExp>;
  readonly predicate?: (args: { item: T; context: EditorContext }) => boolean;
}

/**
 * A contributor is a function that returns the groups it wants to contribute,
 * given the current context. Returning `null` or an empty array means "no
 * contribution for this context".
 */
export interface ContextMenuContributor {
  /** Stable id for the contributor. Used for registry bookkeeping. */
  readonly id: string;
  /** Sort hint among contributors. Default: 100. */
  readonly order?: number;
  /** Called every time the menu opens. */
  readonly resolve: (
    context: EditorContext
  ) => readonly ContextMenuGroup[] | null | undefined;
}

/**
 * Props accepted by the provider at the plugin level. The feature wraps the
 * editor with a `<ContextMenuProvider>` and contributors register via
 * `useRegisterContextMenuContributor`.
 */
export interface ContextMenuProviderProps {
  children: ReactNode;
}
