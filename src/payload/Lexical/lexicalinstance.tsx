"use client";
import {
  InitialConfigType,
  LexicalComposer
} from "@payloadcms/richtext-lexical/lexical/react/LexicalComposer";
import { RichTextPlugin } from "@payloadcms/richtext-lexical/lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@payloadcms/richtext-lexical/lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@payloadcms/richtext-lexical/lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@payloadcms/richtext-lexical/lexical/react/LexicalOnChangePlugin";
import type { SanitizedConfig } from "payload";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  EditorConfig,
  type EditorState
} from "@payloadcms/richtext-lexical/lexical";
import "./LexicalEditor.scss";
import "./EditorTheme.scss";

interface EditorProps {
  config: EditorConfig;
  initialContent?: undefined;
  onChange?: (editorState: EditorState) => void;
}

const LoadingEditor = () => (
  <div className="editor-loading">Loading editor...</div>
);

function onError(error: Error) {
  console.error(error);
}

export const LexicalFrontendEditor = ({
  config,
  initialContent,
  onChange
}: EditorProps) => {
  const [editorConfig, setEditorConfig] = useState<InitialConfigType>(null!);
  const [serializedContent, setSerializedContent] = useState<string>("");
  const initialConfig = useMemo<InitialConfigType>(() => {
    return {
      editable: true,
      editorState: undefined,
      namespace: config.namespace,
      onError,
      theme: config.theme
    };
    // Important: do not add readOnly and value to the dependencies array. This will cause the entire lexical editor to re-render if the document is saved, which will
    // cause the editor to lose focus.
  }, [editorConfig]);

  const handleEditorChange = (editorState: EditorState) => {
    const serialized = JSON.stringify(editorState.toJSON());
    setSerializedContent(serialized);
    if (onChange) onChange(editorState);
  };

  const copyToClipboard = () => {
    if (serializedContent) {
      navigator.clipboard.writeText(serializedContent);
    }
  };

  return (
    <div className="editor-container">
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={<ContentEditable />}
          placeholder={<div>Enter your content...</div>}
          ErrorBoundary={LoadingEditor}
        />
        <HistoryPlugin />
        <OnChangePlugin onChange={handleEditorChange} />
      </LexicalComposer>
      <Button
	      className="fixed bottom-[55px] left-[50%] z-[245] h-[45px] w-[175px] translate-x-[-50%] rounded-xl backdrop-blur-lg transition-all duration-200 ease-in-out hover:bg-foreground/20 hover:text-[bg]"
        onClick={copyToClipboard}
      >
        Copy to Clipboard
      </Button>
    </div>
  );
};
