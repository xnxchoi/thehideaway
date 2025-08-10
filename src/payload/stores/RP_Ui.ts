"use client";

import {createStore} from "zustand/vanilla";
import type {RefObject} from "react";

export type RafRaf = {
	raf: null | number | RefObject<number | null>;
};
export type RafAct = {
	addToRaf: (l: { key: string; callback: (l?: any) => void }) => void;
	removeFromRaf: (l: string) => void;
};
export type RAF = RafRaf & RafAct;
const rafInit = {
	raf: null,
};
export const createRafStore = (
	actions: Partial<RafAct> = {},
	initState: RafRaf = rafInit,
) => {
	return createStore<RAF>()((set) => ({
		addToRaf: () => {
		},
		removeFromRaf: () => {
		},
		...actions,
		...initState,
	}));
};
