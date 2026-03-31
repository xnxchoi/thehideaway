"use client";
import { ClipboardPlugin } from "@/payload/Lexical/defaults/ClipboardPlugin";
import { DecoratorPlugin } from "@/payload/Lexical/defaults/DecoratorPlugin";
import { EditorPlugin } from "@/payload/Lexical/defaults/EditorPlugin";
import { NormalizeSelectionPlugin } from "@/payload/Lexical/defaults/NormalizePlugin";
import { SelectAllPlugin } from "@/payload/Lexical/defaults/SelectAllPlugin";
import { TextPlugin } from "@/payload/Lexical/defaults/TextPlugin";
import type { LexicalProviderProps } from "@/payload/Lexical/defaults/types";
import { useHandoff } from "@/payload/Lexical/Features/HandOff/handoffBridge";
import {
  $isCaretAtEnd,
  $isCaretAtStart
} from "@/payload/Lexical/lexical-utils";
import { useAltDocCtrls } from "@/payload/providers/Admins";
import { useEditorConfigContext } from "@payloadcms/richtext-lexical/client";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  BLUR_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  FOCUS_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_ENTER_COMMAND
} from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { ContentEditable } from "@payloadcms/richtext-lexical/lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@payloadcms/richtext-lexical/lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@payloadcms/richtext-lexical/lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@payloadcms/richtext-lexical/lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@payloadcms/richtext-lexical/lexical/react/LexicalRichTextPlugin";
import { useLexicalEditable } from "@payloadcms/richtext-lexical/lexical/react/useLexicalEditable";
import { useTranslation } from "@payloadcms/ui";
import { createCommand, LexicalCommand } from "lexical";
import type { FC, RefObject } from "react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";

const FOCUS_INLINE_LEXICAL: LexicalCommand<void> = createCommand();
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
  const hasRun = useRef(false);
  useEffect(() => {
    if (!editor || hasRun.current) return;
    setEditor({ target: "title", editor });
    hasRun.current = true;
    return () => {
      hasRun.current = false;
    };
  }, [setEditor, editor]);

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
    const splitTextAtCaret = (textContent: string, caretPosition: number) => {
      if (caretPosition === 0) {
        return { before: "", after: textContent };
      } else if (caretPosition >= textContent.length) {
        return { before: textContent, after: "" };
      } else {
        return {
          before: textContent.substring(0, caretPosition),
          after: textContent.substring(caretPosition)
        };
      }
    };
    const handleBlur = () => {
      editorConfigContext.blurEditor(editorConfigContext);
    };

    // Helper functions for title editor state
    const getTitleState = () => {
      const selection = $getSelection();
      let caretPosition = 0;
      if ($isRangeSelection(selection)) {
        caretPosition = selection.anchor.offset;
      }

      const root = $getRoot();
      const textContent = root.getTextContent();
      const isEmpty = textContent.length < 1;

      return { textContent, caretPosition, isEmpty };
    };
    const unregisterEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        // Case b: Enter + any other key - do nothing, let event propagate
        event?.preventDefault();
        if (!contentRef || event?.altKey || event?.metaKey || event?.ctrlKey) {
          return true;
        }
        const root = $getRoot();

        const textContent = root.getTextContent();

        const selection = $getSelection();
        let caretPosition = 0;
        if ($isRangeSelection(selection)) {
          caretPosition = selection.anchor.offset;
        }
        if (textContent.length < 1) {
          editor.blur();
          contentRef.focus();
        }
        const { before, after } = splitTextAtCaret(textContent, caretPosition);

        const titleRoot = $getRoot();
        titleRoot.clear();
        titleRoot.append(
          $createParagraphNode().append($createTextNode(before))
        );

        editor.blur();
        contentRef.focus(() => {
          contentRef.update(() => {
            const root = $getRoot();
            const newParagraph = $createParagraphNode().append(
              $createTextNode(after)
            );

            root.getFirstChild()?.insertBefore(newParagraph) ||
              root.append(newParagraph);
            newParagraph.selectStart();
          });
        });

        return true;
      },
      COMMAND_PRIORITY_CRITICAL
    );
    const unregisterDown = editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (event) => {
        // Case c: Arrow Down - move focus to editor instance below (contentRef)
        if (contentRef) {
          event?.preventDefault();
          contentRef.focus();
          editor.blur();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    const unregisterUp = editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (event) => {
        if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) {
          return false;
        }
        event?.preventDefault();

        if ($isCaretAtStart()) {
          return true;
        }
        const root = $getRoot();
        const firstDesc = root.getFirstDescendant();
        if (!firstDesc) {
          const firstChild = root.getFirstChild();
          if (firstChild) {
            firstChild.selectStart();
          }
          return true;
        }
        firstDesc.selectStart();
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
    const unregisterBackspace = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event) => {
        // Case e: Arrow Left
        if ($isCaretAtStart()) {
          // Already at start - prevent event propagation
          event?.preventDefault();
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
    const unregisterArrowLeft = editor.registerCommand(
      KEY_ARROW_LEFT_COMMAND,
      (event) => {
        // Case e: Arrow Left
        if ($isCaretAtStart()) {
          // Already at start - prevent event propagation
          event?.preventDefault();
          return true;
        }
        const root = $getRoot();
        if (event.ctrlKey || event.metaKey || root.isEmpty()) {
          event?.preventDefault();
          const firstDesc = root.getFirstDescendant();
          if (!firstDesc) {
            const firstChild = root.getFirstChild();
            if (firstChild) {
              firstChild.selectStart();
            }
            return true;
          }
          firstDesc.selectStart();
          return true;

          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
    const unregisterArrowRight = editor.registerCommand(
      KEY_ARROW_RIGHT_COMMAND,
      (event) => {
        // Case f: Arrow Right
        if ($isCaretAtEnd()) {
          // At end - move focus to content editor
          if (contentRef) {
            event?.preventDefault();
            editor.blur();
            contentRef.focus();
          }
          return true;
        }
        const root = $getRoot();

        if (event.ctrlKey || event.metaKey || root.isEmpty()) {
          // Text is empty - place caret at end (same as start)
          event?.preventDefault();
          const lastDesc = root.getLastDescendant();
          if (lastDesc) {
            lastDesc.selectEnd();
          } else {
            const lastChild = root.getLastChild();
            if (lastChild) {
              lastChild.selectEnd();
            }
          }

          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
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
      unregisterUp();
      unregisterArrowLeft();
      unregisterBackspace();
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
                  className={"ContentEditable__root text-[42px]!"}
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
