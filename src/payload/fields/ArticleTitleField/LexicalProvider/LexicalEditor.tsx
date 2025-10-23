"use client";
import {
  $createParagraphNode,
  $createRangeSelection,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  BLUR_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  FOCUS_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ENTER_COMMAND
} from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@payloadcms/richtext-lexical/lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@payloadcms/richtext-lexical/lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@payloadcms/richtext-lexical/lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@payloadcms/richtext-lexical/lexical/react/LexicalRichTextPlugin";
import { useLexicalEditable } from "@payloadcms/richtext-lexical/lexical/react/useLexicalEditable";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";

import { useHandoff } from "@/payload/Lexical/Features/HandOff/handoffBridge";
import { useEditorConfigContext } from "@payloadcms/richtext-lexical/client";
import { ContentEditable } from "@payloadcms/richtext-lexical/lexical/react/LexicalContentEditable";
import { useTranslation } from "@payloadcms/ui";
import type { FC, RefObject } from "react";
import { EditorPlugin } from "../EditorPlugin";
import type { LexicalProviderProps } from "../inline";
import { ClipboardPlugin } from "./ClipboardPlugin";
import { DecoratorPlugin } from "./DecoratorPlugin";
import "./LexicalEditor.scss";
import { NormalizeSelectionPlugin } from "./NormalizePlugin";
import { SelectAllPlugin } from "./SelectAllPlugin";
import { TextPlugin } from "./TextPlugin";
import { useAltDocCtrls } from "@/payload/providers/Admins";
export const LexicalEditor: FC<
  {
    singleLine?: boolean;
    editorContainerRef: RefObject<HTMLDivElement | null>;
    isSmallWidthViewport: boolean;
  } & Pick<LexicalProviderProps, "editorConfig" | "onChange">
> = (props) => {
  const {
    editorConfig,

    editorContainerRef,
    isSmallWidthViewport,
    onChange
  } = props;
  const editorConfigContext = useEditorConfigContext();
  const [editor] = useLexicalComposerContext();
  const setEditor = useHandoff((r) => r.setEditor);
  const setShowAltDoc = useAltDocCtrls((r) => r.setPeeked);
  const onEnter = useCallback(() => {
    setShowAltDoc(true);
  }, [setShowAltDoc]);
  const onLeave = useCallback(() => {
    setShowAltDoc(false);
  }, [setShowAltDoc]);
  const editorRef = useRef(editor);
  const titleRef = useHandoff((r) => r.titleEditor);
  const isEditable = useLexicalEditable();
  const contentRef = useHandoff((r) => r.contentEditor);
  const { t } = useTranslation<{}, string>();
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };
  const handleFocus = useCallback(() => {
    editorConfigContext.focusEditor(editorConfigContext);
  }, [editorConfigContext]);
  useEffect(() => {
    if (!editorRef.current || titleRef === editorRef.current) return;
    if (titleRef !== editorRef.current) {
      setEditor("title", editorRef.current);
    }
  }, [setEditor, titleRef]);
  useEffect(() => {
    if (!editorConfigContext?.uuid) {
      console.error(
        "Lexical Editor must be used within an EditorConfigProvider"
      );
      return;
    }
    if (editorConfigContext?.parentEditor?.uuid) {
      editorConfigContext.parentEditor?.registerChild(
        editorConfigContext.uuid,
        editorConfigContext
      );
    }

    const handleFocus = () => {
      editorConfigContext.focusEditor(editorConfigContext);
    };

    const handleBlur = () => {
      editorConfigContext.blurEditor(editorConfigContext);
    };

    const unregisterEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        // Always hand off to content editor on Enter in title
        if (contentRef) {
          event?.preventDefault();

          contentRef.focus();
          editor.blur();

          // Determine if Alt/Option key was pressed
          const isAltEnter = event?.altKey || event?.metaKey;

          // Set cursor position in content editor based on modifier keys
          contentRef.update(() => {
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
            }
          });

          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
    const unregisterDown = editor.registerCommand(
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
          if (contentRef) {
            e?.preventDefault();
            contentRef.focus();
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

        const shouldHandOff = contentRef && atAbsoluteEnd;
        if (shouldHandOff) {
          e?.preventDefault();
          contentRef.focus();
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
          if (contentRef) {
            e?.preventDefault();
            contentRef.focus();
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

        const shouldHandOff = contentRef && atAbsoluteEnd;
        if (shouldHandOff) {
          e?.preventDefault();

          contentRef.focus();
          editor.blur();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
    const unregisterFocus = editor.registerCommand<MouseEvent>(
      FOCUS_COMMAND,
      (e) => {
        e.preventDefault();
        handleFocus();
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    const unregisterBlur = editor.registerCommand<MouseEvent>(
      BLUR_COMMAND,
      () => {
        handleBlur();
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    return () => {
      unregisterEnter();
      unregisterDown();
      unregisterArrowRight();
      unregisterFocus();
      unregisterBlur();
      editorConfigContext.parentEditor?.unregisterChild?.(
        editorConfigContext.uuid
      );
    };
  }, [editor, editorConfigContext, setEditor, contentRef]);

  return (
    <Fragment>
      {editorConfig.features.plugins?.map((plugin) => {
        if (plugin.position === "aboveContainer") {
          return (
            <EditorPlugin
              clientProps={plugin.clientProps}
              key={plugin.key}
              plugin={plugin}
            />
          );
        }
      })}
      <div className="editor-container" ref={editorContainerRef}>
        {editorConfig.features.plugins?.map((plugin) => {
          if (plugin.position === "top") {
            return (
              <EditorPlugin
                clientProps={plugin.clientProps}
                key={plugin.key}
                plugin={plugin}
              />
            );
          }
        })}
        <RichTextPlugin
          contentEditable={
            <div className="editor-scroller">
              <div
                className="editor"
                ref={onRef}
                onMouseEnter={onEnter}
                onMouseLeave={onLeave}
              >
                <ContentEditable
                  aria-placeholder={t("lexical:general:placeholder")}
                  className={"ContentEditable__root"}
                  style={{
                    fontSize: "42px"
                  }}
                  placeholder={
                    <span className={"editor-placeholder"}>Title here</span>
                  }
                />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <NormalizeSelectionPlugin />

        <DecoratorPlugin />
        <ClipboardPlugin />
        <TextPlugin features={editorConfig.features} />
        <SelectAllPlugin />
        {isEditable && (
          <OnChangePlugin
            // Selection changes can be ignored here, reducing the
            // frequency that the FieldComponent and Payload receive updates.
            // Selection changes are only needed if you are saving selection state
            ignoreSelectionChange
            onChange={(editorState, editor, tags) => {
              // Ignore any onChange event triggered by focus only
              if (!tags.has("focus") || tags.size > 1) {
                if (onChange != null) {
                  onChange(editorState, editor, tags);
                }
              }
            }}
          />
        )}
        {floatingAnchorElem && (
          <Fragment>
            {editorConfig?.features.plugins?.map((plugin) => {
              if (
                plugin.position === "floatingAnchorElem" &&
                !(plugin.desktopOnly === true && isSmallWidthViewport)
              ) {
                return (
                  <EditorPlugin
                    anchorElem={floatingAnchorElem}
                    clientProps={plugin.clientProps}
                    key={plugin.key}
                    plugin={plugin}
                  />
                );
              }
            })}
          </Fragment>
        )}
        {isEditable && (
          <Fragment>
            <HistoryPlugin />
          </Fragment>
        )}
        {editorConfig.features.plugins?.map((plugin) => {
          if (plugin.position === "normal") {
            return (
              <EditorPlugin
                clientProps={plugin.clientProps}
                key={plugin.key}
                plugin={plugin}
              />
            );
          }
        })}
        {editorConfig.features.plugins?.map((plugin) => {
          if (plugin.position === "bottom") {
            return (
              <EditorPlugin
                clientProps={plugin.clientProps}
                key={plugin.key}
                plugin={plugin}
              />
            );
          }
        })}
      </div>
      {editorConfig.features.plugins?.map((plugin) => {
        if (plugin.position === "belowContainer") {
          return (
            <EditorPlugin
              clientProps={plugin.clientProps}
              key={plugin.key}
              plugin={plugin}
            />
          );
        }
      })}
    </Fragment>
  );
};
