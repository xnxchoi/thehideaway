"use client";
// PayloadHandoffPlugin.tsx
// React plugin for your Payload RichText (Lexical) that hands focus back to native editor
// based on Backspace at doc start without indent/outdent actions, and ArrowUp at topmost line.

import { useWriter } from "@/payload/providers/Admins";
import type { PluginComponent } from "@payloadcms/richtext-lexical";
import { useEditorConfigContext } from "@payloadcms/richtext-lexical/client";
import {
  $addUpdateTag,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  COMMAND_PRIORITY_HIGH,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_BACKSPACE_COMMAND,
  SKIP_DOM_SELECTION_TAG
} from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useRef } from "react";
import { $isCaretAtStart, $selectEnd } from "../../lexical-utils";
import { useHandoff } from "./handoffBridge";

export const ContentHandOffPlugin: PluginComponent = () => {
  const editorConfigContext = useEditorConfigContext();
  const [editor] = useLexicalComposerContext();
  const slashMenuOpen = useWriter((r) => r.slashMenuOpen);
  const menuStateRef = useRef(slashMenuOpen);
  useEffect(() => {
    menuStateRef.current = slashMenuOpen;
  }, [slashMenuOpen]);

  const setEditor = useHandoff((r) => r.setEditor);

  const titleEditor = useHandoff((r) => r.titleEditor);
  const hasRun = useRef(false);
  useEffect(() => {
    if (!editor || hasRun.current) return;
    setEditor({ target: "content", editor });
    hasRun.current = true;
    return () => {
      hasRun.current = false;
    };
  }, [setEditor, editor]);
  const isFocusInEditor = useCallback(() => {
    const editorEl = editor.getRootElement();
    const slashMenustate = !menuStateRef.current;
    if (!editorEl) {
      return false;
    }
    const activeElement = document.activeElement;
    if (activeElement) {
      return (
        slashMenustate &&
        (editorEl.contains(activeElement) || activeElement === editorEl)
      );
    } else {
      return slashMenustate;
    }
  }, [editor]);
  useEffect(() => {
    const handleBlur = () => {
      editorConfigContext.blurEditor(editorConfigContext);
    };

    // Register this editor instance with the store

    const unregisterBackspace = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event) => {
        console.log("Is backspace at start?");
        const isFocused = isFocusInEditor();
        const isStart = $isCaretAtStart();
        console.log("Is focused?", isFocused);
        console.log("Is start?", isStart);
        if (isFocused && isStart) {
          console.log("Backspace at start");
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
                handleBlur();
                titleEditor.focus(() => {
                  titleEditor.update(() => {
                    const root = $getRoot();
                    const previousText = $createTextNode(root.getTextContent());
                    const newTextNode = $createTextNode(text);
                    root.clear();
                    const newParagraphNode =
                      $createParagraphNode().append(previousText);

                    root.append(newParagraphNode);
                    newParagraphNode.selectEnd();
                    newParagraphNode.append(newTextNode);
                  });
                });
                return true;
              }
            }

            handleBlur();
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

          handleBlur();
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
        if (!titleEditor) {
          return false;
        }
        const trulyFocused = isFocusInEditor();
        if (!trulyFocused) return false;
        try {
          let isInTopLine = false;

          if ($isCaretAtStart()) {
            isInTopLine = true;
          } else {
            const domSelection = window.getSelection();
            if (domSelection && domSelection.rangeCount > 0) {
              const range = domSelection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              const editorEl = editor.getRootElement();
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
            handleBlur();

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
    };
  }, [editor, editorConfigContext, isFocusInEditor, setEditor, titleEditor]); // titleEditor is not needed in deps since it's accessed fresh from store

  return null;
};
