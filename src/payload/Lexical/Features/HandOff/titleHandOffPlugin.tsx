"use client";
// TitleHandoffPlugin.tsx
// React plugin for title field that hands focus to content editor
// based on Enter key or ArrowDown at end of title

import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import type { PluginComponent } from "@payloadcms/richtext-lexical";
import { useEditorConfigContext } from "@payloadcms/richtext-lexical/client";
import {
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_EDITOR,
  ElementNode,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ENTER_COMMAND
} from "@payloadcms/richtext-lexical/lexical";
import { useEffect } from "react";
import { useHandoff } from "./handoffBridge";

type Props = {
  focusContentPosition?: "start" | "end"; // default 'start'
};

export const TitleHandOffPlugin: PluginComponent<Props> = ({
  clientProps: { focusContentPosition = "start" }
}) => {
  const [editor] = useLexicalComposerContext();
  const editorConfigContext = useEditorConfigContext();
  const setEditor = useHandoff((r) => r.setEditor);
  const contentEditor = useHandoff((r) => r.contentEditor);

  useEffect(() => {
    // Register this editor instance with the store
    setEditor("title", editor);

    const unregisterEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        // Always hand off to content editor on Enter in title
        if (contentEditor) {
          event?.preventDefault();

          contentEditor.focus();
          editor.blur();

          // Determine if Alt/Option key was pressed
          const isAltEnter = event?.altKey || event?.metaKey;

          // Set cursor position in content editor based on modifier keys
          contentEditor.update(() => {
            try {
              const root = $getRoot();
              const children = root.getChildren();
              const hasBlocks = children.length > 0;

              if (isAltEnter) {
                // Alt/Option + Enter behavior
                if (hasBlocks) {
                  // Find first text-related node (paragraph, heading, quote, etc.)
                  const firstTextNode = children.find((child) => {
                    const nodeType = child.getType();
                    const textRelatedTypes = [
                      "paragraph",
                      "heading",
                      "quote",
                      "list",
                      "list-item",
                      "code",
                      "text",
                      "linebreak"
                    ];
                    return (
                      textRelatedTypes.includes(nodeType) ||
                      ($isElementNode(child) && child.getChildrenSize() > 0)
                    );
                  });

                  if (firstTextNode) {
                    // Set caret to start of first text-related node
                    if ($isElementNode(firstTextNode)) {
                      firstTextNode.selectStart();
                    } else {
                      const selection = $createRangeSelection();
                      selection.anchor.set(firstTextNode.getKey(), 0, "text");
                      selection.focus.set(firstTextNode.getKey(), 0, "text");
                      $setSelection(selection);
                    }
                  } else {
                    // No text-related nodes found, create new paragraph
                    const newParagraph = $createParagraphNode();
                    root.append(newParagraph);
                    newParagraph.selectEnd();
                  }
                } else {
                  // No blocks exist - create new empty paragraph
                  const newParagraph = $createParagraphNode();
                  root.append(newParagraph);
                  newParagraph.selectEnd();
                }
              } else {
                // Regular Enter behavior
                if (hasBlocks) {
                  // Append new paragraph to beginning of editor
                  const newParagraph = $createParagraphNode();

                  // Insert as first child
                  const firstChild = root.getFirstChild();
                  if (firstChild) {
                    firstChild.insertBefore(newParagraph);
                  } else {
                    root.append(newParagraph);
                  }

                  // Set caret to end of new paragraph (same as beginning since it's empty)
                  newParagraph.selectEnd();
                } else {
                  // No blocks exist - insert first paragraph block
                  const newParagraph = $createParagraphNode();
                  root.append(newParagraph);

                  // Set caret to beginning (=end since paragraph is empty)
                  newParagraph.selectStart();
                }
              }
            } catch (error) {
              console.warn("Failed to handle Enter key positioning:", error);

              // Fallback: use original positioning logic
              const root = $getRoot();
              if (focusContentPosition === "start") {
                const firstChild = root.getFirstChild();
                if (firstChild) {
                  if ($isElementNode(firstChild)) {
                    firstChild.selectStart();
                  } else {
                    const selection = $createRangeSelection();
                    selection.anchor.set(firstChild.getKey(), 0, "text");
                    selection.focus.set(firstChild.getKey(), 0, "text");
                    $setSelection(selection);
                  }
                } else {
                  root.selectStart();
                }
              } else {
                const lastChild = root.getLastChild();
                if (lastChild) {
                  if ($isElementNode(lastChild)) {
                    lastChild.selectEnd();
                  } else {
                    const textLength = lastChild.getTextContentSize();
                    const selection = $createRangeSelection();
                    selection.anchor.set(
                      lastChild.getKey(),
                      textLength,
                      "text"
                    );
                    selection.focus.set(lastChild.getKey(), textLength, "text");
                    $setSelection(selection);
                  }
                } else {
                  root.selectEnd();
                }
              }
            }
          });

          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_EDITOR
    );

    const unregisterArrowDown = editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (e) => {
        const selection = $getSelection();

        // Guard: Must be a collapsed range selection
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const topLevel = anchorNode.getTopLevelElementOrThrow();
        const root = $getRoot();

        if (!$isRootOrShadowRoot(root)) return false;

        const lastTopLevelChild = root.getLastChild();
        if (!lastTopLevelChild) {
          // Empty doc: hand off to content
          if (contentEditor) {
            e?.preventDefault();
            contentEditor.focus();
            editor.blur();
          }
          return true;
        }

        const isAtLastTopLevel = topLevel === lastTopLevelChild;
        const isAtEnd =
          selection.anchor.offset === anchorNode.getTextContentSize();

        // Check if we're at the absolute end of the title
        const parentElement = anchorNode.getParent();
        if (!parentElement) return false;

        const hasNextSibling = parentElement.getNextSibling() !== null;
        const anchorHasNextSibling = anchorNode.getNextSibling() !== null;

        const atAbsoluteEnd =
          isAtLastTopLevel &&
          isAtEnd &&
          !hasNextSibling &&
          !anchorHasNextSibling;

        const shouldHandOff = contentEditor && atAbsoluteEnd;
        if (shouldHandOff) {
          e?.preventDefault();
          contentEditor.focus();
          editor.blur();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_EDITOR
    );
    const unregisterArrowRight = editor.registerCommand(
      KEY_ARROW_RIGHT_COMMAND,
      (e) => {
        const selection = $getSelection();

        // Guard: Must be a collapsed range selection
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const topLevel = anchorNode.getTopLevelElementOrThrow();
        const root = $getRoot();

        if (!$isRootOrShadowRoot(root)) return false;

        const lastTopLevelChild = root.getLastChild();
        if (!lastTopLevelChild) {
          // Empty doc: hand off to content
          if (contentEditor) {
            e?.preventDefault();
            contentEditor.focus();
            editor.blur();
          }
          return true;
        }

        const isAtLastTopLevel = topLevel === lastTopLevelChild;
        const isAtEnd =
          selection.anchor.offset === anchorNode.getTextContentSize();

        // Check if we're at the absolute end of the title
        const parentElement = anchorNode.getParent();
        if (!parentElement) return false;

        const hasNextSibling = parentElement.getNextSibling() !== null;
        const anchorHasNextSibling = anchorNode.getNextSibling() !== null;

        const atAbsoluteEnd =
          isAtLastTopLevel &&
          isAtEnd &&
          !hasNextSibling &&
          !anchorHasNextSibling;

        const shouldHandOff = contentEditor && atAbsoluteEnd;
        if (shouldHandOff) {
          e?.preventDefault();
          contentEditor.focus();
          editor.blur();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
    return () => {
      unregisterEnter();
      unregisterArrowDown();
      unregisterArrowRight();
      // Clean up this editor from the store
      setEditor("title", null);
    };
  }, [editor, setEditor, focusContentPosition, contentEditor]); // contentEditor is accessed fresh from store

  return null;
};
