"use client";
// PayloadHandoffPlugin.tsx
// React plugin for your Payload RichText (Lexical) that hands focus back to native editor
// based on Backspace at doc start without indent/outdent actions, and ArrowUp at topmost line.

import type { PluginComponent } from "@payloadcms/richtext-lexical";
import { useEditorConfigContext } from "@payloadcms/richtext-lexical/client";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_BACKSPACE_COMMAND
} from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { useHandoff } from "./handoffBridge";

export const ContentHandOffPlugin: PluginComponent = () => {
  const [editor] = useLexicalComposerContext();
  const editorConfigContext = useEditorConfigContext();
  const setEditor = useHandoff((r) => r.setEditor);
  const titleEditor = useHandoff((r) => r.titleEditor);

  useEffect(() => {
    // Register this editor instance with the store
    setEditor("content", editor);

    const unregisterBackspace = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (e) => {
        const selection = $getSelection();

        // Guard 1: Must be a collapsed range selection
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }
        const anchorNode = selection.anchor.getNode();
        const topLevel = anchorNode.getTopLevelElementOrThrow();
        // Helper 1: Are we inside an indent/outdent actor?
        // Consider list, quote, code, markdown-like structures. Also any element with indentDepth > 0.
        const isList = topLevel.getType() === "list-item";
        const isQuote = topLevel.getType() === "quote";
        const isCode = topLevel.getType() === "code";
        // Basic indentation depth check if your theme maintains indent depth via format/attrs
        // Lexical core doesn't include indent depth on arbitrary nodes; adapt if you track it.
        const hasIndentDepth =
          typeof topLevel.__indent === "number" ? topLevel.__indent > 0 : false;

        const inIndentActor = isList || isQuote || isCode || hasIndentDepth;
        if (inIndentActor) {
          return false;
        }
        const root = $getRoot();
        if (!$isRootOrShadowRoot(root)) return false;
        const firstTopLevelChild = root.getFirstChild();
        if (!firstTopLevelChild) {
          // Empty doc: treat as start
          e.preventDefault();

          // Safely focus title editor if available
          if (titleEditor) {
            titleEditor.focus();
            editor.blur();
          }

          return true;
        }

        const isAtFirstTopLevel = topLevel === firstTopLevelChild;
        const isAtOffsetZero = selection.anchor.offset === 0;

        // For Backspace, also require there's nothing before anchor in the current paragraph.
        // Check previous sibling chain within the paragraph.
        const parentElement = anchorNode.getParent();
        if (!parentElement) return false;

        const hasPrevSibling = parentElement.getPreviousSibling() !== null;
        const anchorHasPrevSibling = anchorNode.getPreviousSibling() !== null;

        const atAbsoluteStart =
          isAtFirstTopLevel &&
          isAtOffsetZero &&
          !hasPrevSibling &&
          !anchorHasPrevSibling;
        const shouldHandOff = titleEditor && atAbsoluteStart;
        if (shouldHandOff) {
          e.preventDefault();

          // Safely focus title editor and blur content editor
          titleEditor.focus();
          editor.blur();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_EDITOR
    );
    const unregisterArrowLeft = editor.registerCommand(
      KEY_ARROW_LEFT_COMMAND,
      (e) => {
        const selection = $getSelection();

        // Guard 1: Must be a collapsed range selection
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }
        const anchorNode = selection.anchor.getNode();
        const topLevel = anchorNode.getTopLevelElementOrThrow();
        const root = $getRoot();
        if (!$isRootOrShadowRoot(root)) return false;
        const firstTopLevelChild = root.getFirstChild();
        if (!firstTopLevelChild) {
          // Empty doc: treat as start
          e.preventDefault();

          // Safely focus title editor if available
          if (titleEditor) {
            titleEditor.focus();
            editor.blur();
          }

          return true;
        }

        const isAtFirstTopLevel = topLevel === firstTopLevelChild;
        const isAtOffsetZero = selection.anchor.offset === 0;

        // For ArrowLeft, also require there's nothing before anchor in the current paragraph.
        // Check previous sibling chain within the paragraph.
        const parentElement = anchorNode.getParent();
        if (!parentElement) return false;

        const hasPrevSibling = parentElement.getPreviousSibling() !== null;
        const anchorHasPrevSibling = anchorNode.getPreviousSibling() !== null;

        const atAbsoluteStart =
          isAtFirstTopLevel &&
          isAtOffsetZero &&
          !hasPrevSibling &&
          !anchorHasPrevSibling;
        const shouldHandOff = titleEditor && atAbsoluteStart;
        if (shouldHandOff) {
          e.preventDefault();

          // Safely focus title editor and blur content editor
          titleEditor.focus();
          editor.blur();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_EDITOR
    );
    const unregisterArrowUp = editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (e) => {
        const selection = $getSelection();

        // Guard: Must be a collapsed range selection
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        // Check if we're in an interactive element that should handle its own navigation
        const activeElement = document.activeElement;
        if (activeElement && activeElement !== editor.getRootElement()) {
          // We're focused on some other element (input, select, etc.) - don't interfere
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const topLevel = anchorNode.getTopLevelElementOrThrow();
        const root = $getRoot();

        if (!$isRootOrShadowRoot(root)) return false;

        const firstTopLevelChild = root.getFirstChild();
        if (!firstTopLevelChild) {
          // Empty doc: hand off to title
          if (titleEditor) {
            e.preventDefault();
            titleEditor.focus();
            editor.blur();
          }
          return true;
        }

        // Check if we're in the first top-level element (topmost line)
        const isAtFirstTopLevel = topLevel === firstTopLevelChild;

        if (!isAtFirstTopLevel) {
          return false; // Not in topmost line
        }

        // Additional checks for nodes that might need arrow key navigation
        const nodeType = topLevel.getType();

        // Skip handoff for certain interactive node types that depend on arrow keys
        const interactiveNodeTypes = [
          "select", // Custom select nodes
          "autocomplete", // Autocomplete nodes
          "mention", // Mention picker nodes
          "table-cell", // Table navigation
          "code-highlight" // Code editor navigation
        ];

        if (interactiveNodeTypes.includes(nodeType)) {
          return false;
        }

        // For nodes with complex internal navigation (like tables), check if we're truly at the visual top
        if (nodeType === "table") {
          // Let table handle its own navigation unless we're in the first row
          const tableNode = topLevel;
          // This is a simplified check - you might need more sophisticated table position detection
          return false;
        }

        // Check if the cursor is visually at the topmost line by using DOM position
        try {
          const domSelection = window.getSelection();
          if (domSelection && domSelection.rangeCount > 0) {
            const range = domSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const editorElement = editor.getRootElement();

            if (editorElement) {
              const editorRect = editorElement.getBoundingClientRect();
              const lineHeight = 24; // Approximate line height - adjust as needed

              // If cursor is within the first line height of the editor, consider it "topmost"
              const isInTopLine = rect.top - editorRect.top < lineHeight;

              if (isInTopLine && titleEditor) {
                e.preventDefault();
                titleEditor.focus();
                editor.blur();
                return true;
              }
            }
          }
        } catch (error) {
          // Fallback to simpler logic if DOM measurement fails
          console.warn(
            "Failed to measure cursor position, using fallback logic:",
            error
          );

          // Simple fallback: if at start of first element, hand off
          const isAtStart = selection.anchor.offset === 0;
          const parentElement = anchorNode.getParent();
          const hasPrevSibling = parentElement?.getPreviousSibling() !== null;
          const anchorHasPrevSibling = anchorNode.getPreviousSibling() !== null;

          const shouldHandOff =
            isAtStart &&
            !hasPrevSibling &&
            !anchorHasPrevSibling &&
            titleEditor;

          if (shouldHandOff) {
            e.preventDefault();
            titleEditor.focus();
            editor.blur();
            return true;
          }
        }

        return false;
      },
      COMMAND_PRIORITY_EDITOR
    );
    return () => {
      unregisterArrowUp();
      unregisterBackspace();
      unregisterArrowLeft();
      // Clean up this editor from the store
      setEditor("content", null);
    };
  }, [editor, setEditor, titleEditor]); // titleEditor is not needed in deps since it's accessed fresh from store

  return null;
};
