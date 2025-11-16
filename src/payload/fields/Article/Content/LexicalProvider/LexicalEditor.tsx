"use client";
import {
  $getRoot,
  BLUR_COMMAND,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  FOCUS_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND
} from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@payloadcms/richtext-lexical/lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@payloadcms/richtext-lexical/lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@payloadcms/richtext-lexical/lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@payloadcms/richtext-lexical/lexical/react/LexicalRichTextPlugin";
import { useLexicalEditable } from "@payloadcms/richtext-lexical/lexical/react/useLexicalEditable";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";

import { ClipboardPlugin } from "@/payload/Lexical/defaults/ClipboardPlugin";
import { DecoratorPlugin } from "@/payload/Lexical/defaults/DecoratorPlugin";
import { EditorPlugin } from "@/payload/Lexical/defaults/EditorPlugin";
import { NormalizeSelectionPlugin } from "@/payload/Lexical/defaults/NormalizePlugin";
import { SelectAllPlugin } from "@/payload/Lexical/defaults/SelectAllPlugin";
import { TextPlugin } from "@/payload/Lexical/defaults/TextPlugin";
import type { LexicalProviderProps } from "@/payload/Lexical/defaults/types";
import { useHandoff } from "@/payload/Lexical/Features/HandOff/handoffBridge";
import { useEditorConfigContext } from "@payloadcms/richtext-lexical/client";
import { ContentEditable } from "@payloadcms/richtext-lexical/lexical/react/LexicalContentEditable";
import { useTranslation } from "@payloadcms/ui";
import type { FC, RefObject } from "react";
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

  const editorRef = useRef(editor);
  const contentRef = useHandoff((r) => r.contentEditor);
  const isEditable = useLexicalEditable();

  const titleRef = useHandoff((r) => r.titleEditor);
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
    if (!editorRef.current || contentRef === editorRef.current) return;
    if (contentRef !== editorRef.current) {
      setEditor("content", editorRef.current);
    }
  }, [setEditor, contentRef]);
  useEffect(() => {
    if (!editor) return;
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

    const unregisterUp = editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (event) => {
        // if (isCaretAtStart()) {
        //   return true;
        // }

        if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) {
          return false;
        }
        event?.preventDefault();

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

    const unregisterArrowLeft = editor.registerCommand(
      KEY_ARROW_LEFT_COMMAND,
      (event) => {
        // Case e: Arrow Left
        // if (isCaretAtStart()) {
        //   // Already at start - prevent event propagation
        //   event?.preventDefault();
        //   return true;
        // }\
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
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
    const unregisterArrowRight = editor.registerCommand(
      KEY_ARROW_RIGHT_COMMAND,
      (event) => {
        // Case f: Arrow Right
        // if (isCaretAtEnd()) {
        //   return true;
        // }
        const root = $getRoot();

        if (event.ctrlKey || event.metaKey) {
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
      unregisterArrowLeft();
      unregisterUp();
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
              <div className="editor" ref={onRef}>
                <ContentEditable
                  aria-placeholder={t("lexical:general:placeholder")}
                  className={"ContentEditable__root"}
                  placeholder={
                    <span className={"editor-placeholder"}>
                      Write your story...
                    </span>
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
