import {
  $createRangeSelection,
  $createTextNode,
  $getEditor,
  $getRoot,
  $isDecoratorNode,
  $isElementNode,
  $isParagraphNode,
  $isTextNode,
  $nodesOfType,
  $setSelection,
  createCommand,
  LexicalCommand,
  LexicalNode,
  TextNode,
  type LexicalEditor,
  type RootNode
} from "@payloadcms/richtext-lexical/lexical";
import { $getSelectionInfo } from "./mention-utils";
import { $createMentionNode, MentionNode } from "./nodes/MentionNode";
import type { MentionItem } from "./nodes/types";
import { $isPlaceholderNode } from "../Placeholder/PlaceholderNode";

export interface InsertMention {
  /**
   * The value to insert after the trigger.
   */
  value: string;
  /**
   * Whether to focus the editor after inserting the mention.
   * @default true
   */
  focus?: boolean;
  /**
   * The data to associate with the mention.
   */
  data: MentionItem;
}

export interface RemoveMentions {
  /**
   * An optional value to search for when removing mentions.
   */
  value?: string;
  /**
   * Whether to focus the editor after removing the mention.
   * @default true
   */
  focus?: boolean;
}

export interface RenameMentions {
  /**
   * The new value to replace the old value with.
   */
  newValue: string;
  /**
   * An optional value to search for when renaming mentions.
   */
  value?: string;
  /**
   * Whether to focus the editor after renaming the mention.
   * @default true
   */
  focus?: boolean;
}

export interface HasMentions {
  /**
   * An optional value to search for when checking for mentions.
   */
  value?: string;
}

export interface OpenMentionMenu {}

export const INSERT_MENTION_COMMAND: LexicalCommand<InsertMention> =
  createCommand("INSERT_MENTION_COMMAND");

export const REMOVE_MENTIONS_COMMAND: LexicalCommand<RemoveMentions> =
  createCommand("REMOVE_MENTIONS_COMMAND");

export const RENAME_MENTIONS_COMMAND: LexicalCommand<RenameMentions> =
  createCommand("RENAME_MENTIONS_COMMAND");

export const OPEN_MENTION_MENU_COMMAND: LexicalCommand<OpenMentionMenu> =
  createCommand("OPEN_MENTION_MENU_COMMAND");

export function $insertTriggerAtSelection(autoSpace?: boolean) {
  return $insertMentionOrTrigger("@", undefined, autoSpace);
}

export function $insertMentionAtSelection(
  data: MentionItem,
  autoSpace?: boolean
) {
  return $insertMentionOrTrigger("@", data, autoSpace);
}

function $insertMentionOrTrigger(trigger: string, data?: MentionItem, autoSpace?: boolean) {
  const selectionInfo = $getSelectionInfo();
  if (!selectionInfo) {
    return false;
  }

  const {
    node,
    selection,
    wordCharBeforeCursor,
    wordCharAfterCursor,
    cursorAtStartOfNode,
    cursorAtEndOfNode,
    prevNode,
    nextNode
  } = selectionInfo;

  // Insert a mention node or a text node with the trigger to open the mention menu.
  const mentionNode = data
    ? $createMentionNode({ id: data.id, data })
    : $createTextNode(trigger);

  const nodes: LexicalNode[] = [];
  // Insert a mention with a leading space
  if (!($isParagraphNode(node) && cursorAtStartOfNode) && !$isTextNode(node)) {
    if (autoSpace) {
      nodes.push($createTextNode(" "));
    }
    nodes.push(mentionNode);
    selection.insertNodes(nodes);
    return true;
  }

  let spaceNode: TextNode | null = null;
  if (
    autoSpace &&
    (wordCharBeforeCursor ||
      (cursorAtStartOfNode && prevNode !== null && !$isTextNode(prevNode)))
  ) {
    nodes.push($createTextNode(" "));
  }
  nodes.push(mentionNode);
  if (
    autoSpace &&
    (wordCharAfterCursor ||
      (cursorAtEndOfNode && nextNode !== null && !$isTextNode(nextNode)))
  ) {
    spaceNode = $createTextNode(" ");
    nodes.push(spaceNode);
  }

  selection.insertNodes(nodes);

  if (nodes.length > 1) {
    if ($isTextNode(mentionNode)) {
      mentionNode.select();
    } else if (spaceNode) {
      spaceNode.selectPrevious();
    }
  }

  return true;
}

export function $removeMention(trigger: string, value?: string, focus = true) {
  let removed = false;
  let prev: LexicalNode | null = null;
  let next: LexicalNode | null = null;
  const mentions = $findMentionNodes();
  for (const mention of mentions) {
    const sameTrigger = mention.getTrigger() === trigger;
    const sameValue = mention.getValue() === value;
    if (sameTrigger && (sameValue || !value)) {
      prev = mention.getPreviousSibling();
      next = mention.getNextSibling();
      mention.remove();
      removed = true;
      // Prevent double spaces
      if (
        $isTextNode(prev) &&
        prev.getTextContent().endsWith(" ") &&
        next &&
        next.getTextContent().startsWith(" ")
      ) {
        prev.setTextContent(prev.getTextContent().slice(0, -1));
      }
      // Remove trailing space
      if (
        (next === null || $isPlaceholderNode(next)) &&
        $isTextNode(prev) &&
        prev.getTextContent().endsWith(" ")
      ) {
        prev.setTextContent(prev.getTextContent().trimEnd());
      }
    }
  }
  if (removed && focus) {
    focusEditor(prev, next);
  } else if (!focus) {
    $setSelection(null);
  }
  return removed;
}

export function $renameMention(
  trigger: string,
  newValue: string,
  value?: string,
  focus = true
) {
  const mentions = $findMentionNodes();
  let renamedMention: MentionNode | null = null;
  for (const mention of mentions) {
    const sameTrigger = mention.getTrigger() === trigger;
    const sameValue = mention.getValue() === value;
    if (sameTrigger && (sameValue || !value)) {
      renamedMention = mention;
      mention.setValue(newValue);
    }
  }
  if (renamedMention && focus) {
    const prev = renamedMention.getPreviousSibling();
    const next = renamedMention.getNextSibling();
    focusEditor(prev, next);
    if (next && $isTextNode(next)) {
      next.select(0, 0);
    } else {
      $selectEnd();
    }
  } else if (!focus) {
    $setSelection(null);
  }
  return renamedMention !== null;
}

function focusEditor(prev: LexicalNode | null, next: LexicalNode | null) {
  if (next && $isTextNode(next)) {
    next.select(0, 0);
  } else if (prev && $isTextNode(prev)) {
    prev.select();
  } else {
    $selectEnd();
  }
}
function getLastNode(root: RootNode) {
  const descendant = root.getLastDescendant();
  if ($isElementNode(descendant) || $isTextNode(descendant)) {
    return descendant;
  }
  if ($isDecoratorNode(descendant)) {
    return descendant.getParent();
  }
  return root;
}

export function $selectEnd() {
  const root = $getRoot();
  const lastNode = getLastNode(root);
  const key = lastNode?.getKey();
  const offset = $isElementNode(lastNode)
    ? lastNode.getChildrenSize()
    : $isTextNode(lastNode)
      ? lastNode.getTextContent().length
      : 0;
  const type = $isElementNode(lastNode) ? "element" : "text";
  if (key) {
    const newSelection = $createRangeSelection();
    newSelection.anchor.set(key, offset, type);
    newSelection.focus.set(key, offset, type);
    $setSelection(newSelection);
  }
}
export function $findMentionNodes(editor?: LexicalEditor) {
  editor = editor ?? $getEditor();
  if (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    MentionNode &&
    editor.hasNodes([MentionNode])
  ) {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    return $nodesOfType(MentionNode);
  }
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  return $nodesOfType(MentionNode);
}
