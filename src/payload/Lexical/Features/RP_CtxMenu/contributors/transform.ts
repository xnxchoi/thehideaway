"use client";

import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $setSelection
} from "@payloadcms/richtext-lexical/lexical";
import { $setBlocksType } from "@payloadcms/richtext-lexical/lexical/selection";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  HeadingNode,
  HeadingTagType,
  QuoteNode
} from "@payloadcms/richtext-lexical/lexical/rich-text";

import type {
  ContextMenuContributor,
  ContextMenuGroup,
  ContextMenuItem,
  EditorContext
} from "../types";

type TargetKind = "paragraph" | "h1" | "h2" | "h3" | "quote";

interface TurnIntoOption {
  key: string;
  label: string;
  kind: TargetKind;
  hint?: string;
}

const OPTIONS: readonly TurnIntoOption[] = [
  { key: "turn.paragraph", label: "Paragraph", kind: "paragraph" },
  { key: "turn.h1", label: "Heading 1", kind: "h1" },
  { key: "turn.h2", label: "Heading 2", kind: "h2" },
  { key: "turn.h3", label: "Heading 3", kind: "h3" },
  { key: "turn.quote", label: "Quote", kind: "quote" }
];

function currentBlockKind(context: EditorContext): TargetKind | null {
  switch (context.targetBlockType) {
    case "paragraph":
      return "paragraph";
    case "heading": {
      // Peek at the heading tag to differentiate h1/h2/h3. We avoid a full
      // editor read for labels and only read the tag when we need it to
      // decorate the currently-selected turn-into row.
      let tag: HeadingTagType | null = null;
      context.editor.getEditorState().read(() => {
        const key = context.targetBlockKey;
        if (!key) return;
        const node = $getNodeByKey(key);
        if (node && $isHeadingNode(node)) {
          tag = node.getTag();
        }
      });
      if (tag === "h1" || tag === "h2" || tag === "h3") return tag;
      return null;
    }
    case "quote":
      return "quote";
    default:
      return null;
  }
}

/**
 * Selects the target block so `$setBlocksType` operates on it even when the
 * user right-clicked outside of any active selection.
 */
function ensureSelectionOnTargetBlock(context: EditorContext): void {
  const { targetBlockKey } = context;
  if (!targetBlockKey) return;

  context.editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorTop = selection.anchor.getNode().getTopLevelElement();
      if (anchorTop && anchorTop.getKey() === targetBlockKey) return;
    }

    const node = $getNodeByKey(targetBlockKey);
    if (!node) return;

    const parent = node.getParent();
    if (!parent || $isRootOrShadowRoot(parent)) {
      // Place a collapsed selection inside the block's first descendant so
      // $setBlocksType has a valid BaseSelection to work with.
      const firstDescendant = (
        node as HeadingNode | QuoteNode
      ).getFirstDescendant?.();
      if (firstDescendant) {
        const range = firstDescendant.selectStart();
        $setSelection(range);
      } else {
        const range = (node as HeadingNode | QuoteNode).selectStart();
        $setSelection(range);
      }
    }
  });
}

function applyTransform(context: EditorContext, kind: TargetKind): void {
  ensureSelectionOnTargetBlock(context);

  context.editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    switch (kind) {
      case "paragraph":
        $setBlocksType(selection, () => $createParagraphNode());
        return;
      case "h1":
      case "h2":
      case "h3":
        $setBlocksType(selection, () => $createHeadingNode(kind));
        return;
      case "quote":
        $setBlocksType(selection, () => $createQuoteNode());
        return;
    }
  });
}

/**
 * "Turn into" contributor — mirrors Notion's block transform menu. Offers
 * paragraph / heading 1-3 / quote. Visible whenever a resolvable block sits
 * under the caret.
 */
export const transformContributor: ContextMenuContributor = {
  id: "rp-ctxmenu.transform",
  order: 40,
  resolve(context) {
    // Only offer block transforms when we can resolve a target block.
    if (!context.targetBlockKey) return null;

    // Skip for blocks that aren't simple text containers. Lists, code, and
    // custom blocks (ambient anchors, inline blocks) keep their own menus.
    const allowed = new Set(["paragraph", "heading", "quote"]);
    if (context.targetBlockType && !allowed.has(context.targetBlockType)) {
      return null;
    }

    const current = currentBlockKind(context);

    const items: ContextMenuItem[] = OPTIONS.map((opt, idx) => ({
      kind: "item" as const,
      key: opt.key,
      label: opt.label,
      hint: current === opt.kind ? "✓" : undefined,
      order: idx * 10,
      onSelect: ({ context: ctx }) => applyTransform(ctx, opt.kind)
    }));

    const turnInto: ContextMenuItem = {
      kind: "submenu",
      key: "turn-into",
      label: "Turn into",
      order: 10,
      items
    };

    const group: ContextMenuGroup = {
      key: "block",
      order: 40,
      items: [turnInto]
    };
    return [group];
  }
};
