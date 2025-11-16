/* eslint-disable jsx-a11y/click-events-have-key-events */
"use client";

import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { useEditorConfigContext } from "@payloadcms/richtext-lexical/client";
import {
  $createParagraphNode,
  $getRoot
} from "@payloadcms/richtext-lexical/lexical";
import React from "react";

const baseClass = "insert-paragraph-at-end";

export const InsertParagraphAtEndPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const { editorConfig } = useEditorConfigContext();

  if (editorConfig?.admin?.hideInsertParagraphAtEnd) {
    return null;
  }

  const onClick = () => {
    editor.update(() => {
      const paragraphNode = $createParagraphNode();
      $getRoot().append(paragraphNode);
      paragraphNode.select();
    });
  };

  return (
    // TODO: convert to button
    <div
      aria-label="Insert Paragraph"
      className={baseClass}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className={`${baseClass}-inside`}>
        <span>+</span>
      </div>
    </div>
  );
};
