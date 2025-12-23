"use client";
import {LexicalEditor} from "@payloadcms/richtext-lexical/lexical";
import type { ReactNode } from "react";
import {createContext, useContext, useRef} from "react";
import {createStore, useStore, type StoreApi} from "zustand";

export type EditorBridge = {
  contentEditor: LexicalEditor | null;
  titleEditor: LexicalEditor | null;

  // Set editor instances directly
	setEditor: (props: {
		target: "content" | "title";
		editor: LexicalEditor | null;
	}) => void;

  // Clear all editors
  clear: () => void;
};
const createEditorBridge = () =>
	createStore<EditorBridge>()((set, get) => ({
		contentEditor: null,
		titleEditor: null,
		setEditor: ({target, editor}) => {
			set((state) => ({
				...state,
				[`${target}Editor`]: editor
			}));
		},
		clear: () =>
			set((state) => ({...state, contentEditor: null, titleEditor: null}))
	}));
type BridgedEditor = StoreApi<EditorBridge>;
export const EditorBridgedContext = createContext<BridgedEditor | undefined>(
  undefined
);

export const HandoffBridge = ({ children }: { children: ReactNode }) => {
	const bridgedEditorRef = useRef<BridgedEditor>(null!);
	if (!bridgedEditorRef.current) {
		bridgedEditorRef.current = createEditorBridge();
	}
  return (
	  <EditorBridgedContext.Provider value={bridgedEditorRef.current}>
      {children}
    </EditorBridgedContext.Provider>
  );
};

export const useHandoff = <T,>(selector: (store: EditorBridge) => T) => {
  const store = useContext(EditorBridgedContext);
  if (!store) {
    throw new Error("useHandoff must be used within a HandoffBridge");
  }
	return useStore(store, selector);
};
