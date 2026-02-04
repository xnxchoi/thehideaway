import {createStore} from "zustand";

type VaultState = {
	pageIsTransitioning: boolean;
	navIsOpen: boolean;
};
type VaultActions = {
	setPageIsTransitioning: (state: boolean) => void;
	setNavIsOpen: (state: boolean) => void;
};
export type VaultStore = VaultActions & VaultState;
export type LexicalEditorNames = "content" | "title";
type WriterState = {
	slashMenuOpen: boolean;
};
/**
 * focusedEditor: "content" | "title" | null;
  editors: Record<
    LexicalEditorNames,
    {
      focused: boolean;
      isDirty: boolean;
    }
  >;
 */
type WriterAction = {
	setSlashMenuOpen: (state: boolean) => void;
};

export type WriterStore = WriterAction & WriterState;

export const createVaultStore = () =>
	createStore<VaultStore>()((set, get) => ({
		pageIsTransitioning: false,
		setPageIsTransitioning: (state) => set({pageIsTransitioning: state}),
		setNavIsOpen: (navIsOpen) => set({navIsOpen}),
		navIsOpen: false
	}));
export const createWriterStore = () =>
	createStore<WriterStore>()((set) => ({
		setSlashMenuOpen: (slashMenuOpen) => set({slashMenuOpen}),
		slashMenuOpen: false
	}));
