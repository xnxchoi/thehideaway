import type { LexicalEditor } from "@payloadcms/richtext-lexical/lexical";
import type { RefObject } from "react";
import { createStore } from "zustand/vanilla";

export type HandoffBridgeStore = {
  // Editor instances - stable references
  contentEditor: LexicalEditor | null;
  titleEditor: LexicalEditor | null;

  // Actions
  setEditor: (
    target: "content" | "title",
    editor: LexicalEditor | null
  ) => void;

  // Focus methods that always use current editor instances
  focusContent: () => boolean;
  focusTitle: () => boolean;
  focus: (target: "content" | "title") => boolean;

  // Cleanup
  clear: () => void;
};

export const createBridge = () => {
  return createStore<HandoffBridgeStore>()((set, get) => ({
    // Initial state
    contentEditor: null,
    titleEditor: null,

    // Set editor instances directly
    setEditor: (target: "content" | "title", editor: LexicalEditor | null) =>
      set((state) => ({
        ...state,
        [target === "content" ? "contentEditor" : "titleEditor"]: editor
      })),

    // Focus methods that always get fresh state
    focusContent: () => {
      const { contentEditor, titleEditor } = get();
      if (!contentEditor) return false;

      contentEditor.focus(() => {
        titleEditor?.blur();
      });
      return true;
    },

    focusTitle: () => {
      const { titleEditor, contentEditor } = get();
      if (!titleEditor) return false;

      titleEditor.focus(() => {
        contentEditor?.blur();
      });
      return true;
    },

    // Generic focus method
    focus: (target: "content" | "title") => {
      const state = get();
      const targetEditor =
        target === "content" ? state.contentEditor : state.titleEditor;
      const otherEditor =
        target === "content" ? state.titleEditor : state.contentEditor;

      if (!targetEditor) return false;

      targetEditor.focus(() => {
        otherEditor?.blur();
      });
      return true;
    },

    // Clear all editors
    clear: () =>
      set({
        contentEditor: null,
        titleEditor: null
      })
  }));
};
