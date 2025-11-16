"use client";
// PayloadHandoffPlugin.tsx
// React plugin for your Payload RichText (Lexical) that hands focus back to native editor
// based on Backspace at doc start without indent/outdent actions, and ArrowUp at topmost line.

import type { PluginComponent } from "@payloadcms/richtext-lexical";
import {
  $addUpdateTag,
  $createParagraphNode,
  $createPoint,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_BACKSPACE_COMMAND,
  SKIP_DOM_SELECTION_TAG
} from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { useHandoff } from "./handoffBridge";
import { useWindowResize } from "@/utilities/use_window_resize";
import { $isCaretAtStart, $selectEnd } from "../../lexical-utils";

export const ContentHandOffPlugin: PluginComponent = () => {
  const [editor] = useLexicalComposerContext();
  const setEditor = useHandoff((r) => r.setEditor);
  const titleEditor = useHandoff((r) => r.titleEditor);
  const lineHeight = useRef(24);

  const editorRectRef = useRef<DOMRect>(null!);
  const lastResize = useWindowResize({
    detectHeightChange: true,
    detectVisibilityChange: false,
    debounce: 100
  });
  useEffect(() => {
    const editorEl = editor.getRootElement();
    if (editorEl) {
      editorRectRef.current = editorEl.getBoundingClientRect();
    }
  }, [editor, lastResize]);
  useEffect(() => {
    if (!editor) {
      setEditor("content", null!);
      return;
    }
    setEditor("content", editor);

    const editorEl = editor.getRootElement();
    if (!editorEl) {
      return;
    }
    const isFocusInEditor = () => {
      const editorEl = editor.getRootElement();

      if (!editorEl) {
        return false;
      }
      const activeElement = document.activeElement;
      if (activeElement) {
        return editorEl.contains(activeElement) || activeElement === editorEl;
      } else {
        return true;
      }
    };
    // Register this editor instance with the store

    const unregisterBackspace = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event) => {
        // Case e: Arrow Left
        if (isFocusInEditor() && $isCaretAtStart()) {
          // Already at start - prevent event propagation
          event?.preventDefault();
          if (titleEditor) {
            const root = $getRoot();
            $addUpdateTag(SKIP_DOM_SELECTION_TAG);
            if (!root.isEmpty()) {
              // Safely focus title editor if available
              const fd = root.getFirstDescendant();
              if (fd && fd.getTextContentSize() > 0) {
                const text = fd.getTextContent();
                fd.remove();
                editor.blur();
                titleEditor.focus(() => {
                  titleEditor.update(() => {
                    const root = $getRoot();
                    const textC = root.getTextContent();
                    root.clear();
                    const par = $createParagraphNode().append(
                      $createTextNode(textC),
                      $createTextNode(text)
                    );
                    const rs = root.append(par).getLastDescendant();
                    const ch = root.getChildren();
                    console.log(ch);
                    console.log(rs);
                  });
                });
                return true;
              }
            }
            editor.blur();
            titleEditor.focus(() => {
              titleEditor.update(() => {
                const root = $getRoot();
                const lastDesc = root.getLastDescendant();
                if (lastDesc) {
                  lastDesc.selectEnd();
                  return;
                }
                const lastChild = root.getLastChild();
                if (lastChild) {
                  lastChild.selectEnd();
                }
                return;
              });
            });
          }

          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
    const unregisterArrowLeft = editor.registerCommand(
      KEY_ARROW_LEFT_COMMAND,
      (e) => {
        const trulyFocused = isFocusInEditor();
        if (!trulyFocused) return false;
        if (!titleEditor) return false;
        const shouldHandOff = $isCaretAtStart();
        if (shouldHandOff) {
          e.preventDefault();

          editor.blur();
          // Safely focus title editor and blur content editor
          titleEditor.focus();
          titleEditor.getEditorState().read(() => {
            titleEditor.update(() => {
              const root = $getRoot();
              const lastDesc = root.getLastDescendant();
              if (lastDesc) {
                lastDesc.selectEnd();
              } else {
                root.selectEnd();
              }
            });
          });
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
    const unregisterArrowUp = editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (e) => {
        // Check if we're in an interactive element that should handle its own navigation
        const trulyFocused = isFocusInEditor();
        if (!trulyFocused) return false;
        if (!titleEditor) {
          return false;
        }
        try {
          let isInTopLine = false;

          if ($isCaretAtStart()) {
            isInTopLine = true;
          } else {
            const domSelection = window.getSelection();
            if (domSelection && domSelection.rangeCount > 0) {
              const range = domSelection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              if (editorEl) {
                const editorRect = editorEl.getBoundingClientRect();

                const vertPos = rect.top - editorRect.top;
                const lineHeight = 24; // Approximate line height - adjust as needed

                // If cursor is within the first line height of the editor, consider it "topmost"
                isInTopLine = vertPos <= lineHeight;
              }
            }
          }
          if (isInTopLine) {
            e.preventDefault();
            editor.blur();

            titleEditor.focus(() => {
              titleEditor.update(() => {
                $selectEnd();
              });
              /**
               * () => {
                const root = $getRoot();
                const lastDesc = root.getLastDescendant();
                if (lastDesc) {
                  lastDesc.selectEnd();
                } else {
                  root.selectEnd();
                }
              }
               */
            });

            return true;
          }

          return false;
        } catch (error) {
          // Fallback to simpler logic if DOM measurement fails
          console.warn(
            "Failed to measure cursor position, using fallback logic:",
            error
          );
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
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
