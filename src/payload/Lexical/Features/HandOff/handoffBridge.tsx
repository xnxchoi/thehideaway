"use client";
import { $getRoot, LexicalEditor } from "@payloadcms/richtext-lexical/lexical";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState
} from "react";

export type EditorBridge = {
  contentEditor: LexicalEditor | null;
  titleEditor: LexicalEditor | null;

  // Set editor instances directly
  setEditor: (
    target: "content" | "title",
    editor: LexicalEditor | null
  ) => void;

  // Focus methods that always get fresh state
  focusContent: () => boolean;
  focusTitle: () => boolean;
  focus: (target: "content" | "title") => boolean;

  // Clear all editors
  clear: () => void;
};

export const EditorBridgedContext = createContext<EditorBridge | undefined>(
  undefined
);

export const HandoffBridge = ({ children }: { children: ReactNode }) => {
  const contentEditorRef = useRef<LexicalEditor | null>(null);
  const titleEditorRef = useRef<LexicalEditor | null>(null);

  // Set editor instances directly
  const setEditor = useCallback(
    (target: "content" | "title", editor: LexicalEditor | null) => {
      try {
        switch (target) {
          case "content":
            contentEditorRef.current = editor;
            break;
          case "title":
            titleEditorRef.current = editor;
            break;
        }
      } catch (error) {
        console.error("Error setting editor:", error);
      }
    },
    []
  );
  const $caretToFirst = useCallback(({ editor }: { editor: LexicalEditor }) => {
    try {
      editor.update(() => {
        const root = $getRoot();
        const firstDesc = root.getFirstDescendant();
        if (!firstDesc) {
          const firstChild = root.getFirstChild();
          if (firstChild) {
            firstChild.selectStart();
          }
          return;
        }
        firstDesc.selectStart();
      });
    } catch (error) {
      console.error("Error moving caret to first:", error);
    }
  }, []);

  const $caretToLast = useCallback(({ editor }: { editor: LexicalEditor }) => {
    try {
      editor.update(() => {
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
      });
    } catch (error) {
      console.error("Error moving caret to last:", error);
    }
  }, []);
  // Focus methods that always get fresh state
  const focusContent = useCallback(() => {
    if (!contentEditorRef.current) {
      return false;
    }
    try {
      contentEditorRef.current.focus(() => {
        contentEditorRef.current &&
          $caretToFirst({
            editor: contentEditorRef.current
          });
        titleEditorRef.current?.blur();
      });
      return true;
    } catch (error) {
      console.error("Error focusing content editor:", error);
      return false;
    }
  }, [$caretToFirst]);
  const focusTitle = useCallback(() => {
    if (!titleEditorRef.current) {
      return false;
    }
    try {
      titleEditorRef.current.focus(() => {
        contentEditorRef.current?.blur();
        titleEditorRef.current &&
          $caretToLast({
            editor: titleEditorRef.current
          });
      });
      return true;
    } catch (error) {
      console.error("Error focusing title editor:", error);
      return false;
    }
  }, [$caretToLast]);

  // Generic focus method
  const focus = useCallback(
    (target: "content" | "title") => {
      const targetEditor =
        target === "content"
          ? contentEditorRef.current
          : titleEditorRef.current;
      const otherEditor =
        target === "content"
          ? titleEditorRef.current
          : contentEditorRef.current;

      if (!targetEditor) return false;

      try {
        targetEditor.focus(() => {
          otherEditor?.blur();
          target === "content"
            ? $caretToFirst({ editor: targetEditor })
            : $caretToLast({ editor: targetEditor });
        });
        return true;
      } catch (error) {
        console.error(`Error focusing ${target} editor:`, error);
        return false;
      }
    },
    [$caretToFirst, $caretToLast]
  );

  // Clear all editors
  const clear = useCallback(() => {
    contentEditorRef.current = null;
    titleEditorRef.current = null;
  }, []);

  const contextValue = useCallback(
    () => ({
      contentEditor: contentEditorRef.current,
      titleEditor: titleEditorRef.current,
      setEditor,
      focusContent,
      focusTitle,
      focus,
      clear
    }),
    [setEditor, focusContent, focusTitle, focus, clear]
  );

  return (
    <EditorBridgedContext.Provider value={contextValue()}>
      {children}
    </EditorBridgedContext.Provider>
  );
};

export const useHandoff = <T,>(selector: (store: EditorBridge) => T) => {
  const store = useContext(EditorBridgedContext);
  if (!store) {
    throw new Error("useHandoff must be used within a HandoffBridge");
  }
  return selector(store);
};
