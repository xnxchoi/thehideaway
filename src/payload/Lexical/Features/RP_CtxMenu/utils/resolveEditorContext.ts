import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  $isRootNode,
  $isTextNode,
  type LexicalEditor,
  type LexicalNode
} from "@payloadcms/richtext-lexical/lexical";
import type { useEditorConfigContext } from "@payloadcms/richtext-lexical/client";

import type { EditorContext, SelectionKind } from "../types";

type EditorConfigContextType = ReturnType<typeof useEditorConfigContext>;

function domNodeFromPoint(x: number, y: number): Node | null {
  type DocumentWithCaret = Document & {
    caretPositionFromPoint?: (
      x: number,
      y: number
    ) => { offsetNode: Node; offset: number } | null;
  };
  const doc = document as DocumentWithCaret;

  if (typeof doc.caretPositionFromPoint === "function") {
    const pos = doc.caretPositionFromPoint(x, y);
    if (pos?.offsetNode) return pos.offsetNode;
  }
  if (typeof doc.caretRangeFromPoint === "function") {
    const range = doc.caretRangeFromPoint(x, y);
    if (range) return range.startContainer;
  }
  return document.elementFromPoint(x, y);
}

function findNearestBlockAncestor(
  node: LexicalNode | null
): LexicalNode | null {
  let current: LexicalNode | null = node;
  while (current) {
    if ($isRootNode(current)) return null;
    if ($isElementNode(current) && !current.isInline()) return current;
    current = current.getParent();
  }
  return null;
}

/**
 * Resolve the editor context for a right-click at (x, y). Uses Lexical's
 * current selection when it already spans text, otherwise reads the DOM node
 * under the pointer and maps it back to Lexical.
 */
export function resolveEditorContext(args: {
  editor: LexicalEditor;
  editorConfigContext: EditorConfigContextType;
  x: number;
  y: number;
  domTarget: HTMLElement | null;
}): EditorContext {
  const { editor, editorConfigContext, x, y, domTarget } = args;

  let selectionKind: SelectionKind = "none";
  let hasTextSelection = false;
  let selectedText = "";
  let targetBlockKey: string | null = null;
  let targetBlockType: string | null = null;
  let targetNodeKey: string | null = null;
  let targetNodeType: string | null = null;
  let ancestorKeys: string[] = [];
  let ancestorTypes: string[] = [];
  let isEmptyBlock = false;

  editor.read(() => {
    const selection = $getSelection();

    // Prefer an existing non-empty range; falls back to pointer hit-test.
    if ($isRangeSelection(selection)) {
      const text = selection.getTextContent();
      hasTextSelection = text.length > 0;
      selectedText = text;
      selectionKind = hasTextSelection ? "range-text" : "caret";
    } else if ($isNodeSelection(selection)) {
      selectionKind = "node";
    }

    const domHit = domNodeFromPoint(x, y);
    let hit: LexicalNode | null = null;
    if (domHit) hit = $getNearestNodeFromDOMNode(domHit);

    // If pointer did not land on anything but we have a selection, use its
    // anchor node as the target.
    if (!hit && $isRangeSelection(selection)) {
      hit = selection.anchor.getNode();
    }
    if (!hit) {
      const root = $getRoot();
      const first = root.getFirstChild();
      if (first) hit = first;
    }

    if (hit) {
      targetNodeKey = hit.getKey();
      targetNodeType = hit.getType();

      const block = findNearestBlockAncestor(hit);
      if (block) {
        targetBlockKey = block.getKey();
        targetBlockType = block.getType();
        if ($isElementNode(block)) {
          isEmptyBlock = block.getTextContentSize() === 0;
        }
      }

      const parents = hit.getParents();
      ancestorKeys = parents
        .filter((p) => !$isRootNode(p))
        .map((p) => p.getKey());
      ancestorTypes = parents
        .filter((p) => !$isRootNode(p))
        .map((p) => p.getType());
    }

    // Sanity: if the target node is text-only, expose its parent as "node" too.
    if (targetNodeKey && $isTextNode($getNodeByKey(targetNodeKey))) {
      // no-op; already captured above
    }
  });

  return {
    x,
    y,
    domTarget,
    editor,
    editorConfigContext,
    selectionKind,
    hasTextSelection,
    selectedText,
    targetBlockKey,
    targetBlockType,
    targetNodeKey,
    targetNodeType,
    ancestorNodeKeys: ancestorKeys,
    ancestorNodeTypes: ancestorTypes,
    isEmptyBlock,
    data: {}
  };
}
