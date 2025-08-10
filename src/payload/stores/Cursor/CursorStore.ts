import {createStore} from "zustand/vanilla";
import {subscribeWithSelector} from "zustand/middleware";

export type HA_CURSOR = {
	cursorState: null | string;
	mouseCoordinates: {
		x: number;
		y: number;
	};
	cursorTheme: "light" | "dark" | string;
	baseCursorTheme: "light" | "dark" | string;
};
export type HA_CURSOR_ACT = {
	setCursorState: (nextState: HA_CURSOR["cursorState"]) => void;
	setMouseCoordinates: (coords: HA_CURSOR["mouseCoordinates"]) => void;
	setCursorTheme: (theme: string | "light" | "dark") => void;
	setBaseCursorTheme: (theme: string | "light" | "dark") => void;
	resetCursorTheme: () => void;
};

const curInit: HA_CURSOR = {
	cursorState: null,
	mouseCoordinates: {
		x: 0,
		y: 0,
	},
	baseCursorTheme: "light",
	cursorTheme: "light",
};

export type HA_CURS = HA_CURSOR & HA_CURSOR_ACT;
export const createCursorStore = (initState: HA_CURSOR = curInit) => {
	return createStore<HA_CURS>()(
		subscribeWithSelector((set) => ({
			...initState,
			setMouseCoordinates: (mouseCoordinates) => set({mouseCoordinates}),
			setCursorState: (cursorState) => set({cursorState}),
			setCursorTheme: (l: string | "light" | "dark") => set({cursorTheme: l}),
			setBaseCursorTheme: (l: string | "light" | "dark") =>
				set({baseCursorTheme: l}),
			resetCursorTheme: () =>
				set((state) => ({
					...state,
					cursorTheme: state.baseCursorTheme,
				})),
		})),
	);
};
