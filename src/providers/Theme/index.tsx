"use client"

import React, {Context, createContext, useContext, useRef} from "react"

import {getImplicitPreference} from "./shared"
import type {Theme, ThemeContextType} from "./types"
import {createStore} from "zustand"
import {useStore} from "zustand/index"

const initialContext: ThemeContextType = {
	savedTheme: "dark",
	pageTheme: null,
	theme: "dark",
	locked: false,
}
export const FALLBACK_THEME: Theme = "dark"
type ThemeActions = {
	saveTheme: (theme: Theme) => void
	setTheme: (theme: Theme | null) => void // eslint-disable-line no-unused-vars
	setPageTheme: (theme: Theme | null, lock?: boolean) => void // eslint-disable-line no-unused-vars
	clearSave: () => void
	setLocked: (locked: boolean) => void
	clearPageTheme: () => void
	toggleTheme: () => void
	setBaseTheme: () => void
}
type ThemeStore = ThemeContextType & ThemeActions
const createThemeStore = (init: ThemeContextType = initialContext) => {
	return createStore<ThemeStore>()((set) => ({
		...init,
		saveTheme: (themeToSet: Theme) =>
			set((state) => ({
				...state,
				savedTheme: themeToSet,
			})),
		clearSave: () =>
			set((state) => {
				const def = getImplicitPreference() ?? FALLBACK_THEME
				return {
					...state,
					theme: (state.locked && state.pageTheme) || def,
					savedTheme: def,
				}
			}),
		toggleTheme: () =>
			set((state) => {
				if (state.locked) return state
				const vice = state.savedTheme === "dark" ? "light" : "dark"

				return {
					...state,
					theme: vice,
					savedTheme: vice,
				}
			}),
		setLocked: (locked: boolean) => set({locked}),
		setTheme: (themeToSet: Theme) =>
			set((state) => {
				if (state.theme === themeToSet) return state
				return {
					...state,
					theme: state.locked
						? (state.pageTheme || FALLBACK_THEME)
						: themeToSet || FALLBACK_THEME,
				}
			}),
		setBaseTheme: () =>
			set((state) => ({
				...state,
				theme:
					state.locked
						? (state.pageTheme || FALLBACK_THEME)
						: (state.savedTheme || FALLBACK_THEME),
			})),
		setPageTheme: (themeToSet: Theme | null, lock: boolean = true) =>
			set((state) => ({
				...state,
				pageTheme: themeToSet,
				locked: lock,
			})),
		clearPageTheme: () =>
			set((state) => ({
				...state,
				theme: state.savedTheme || FALLBACK_THEME,
				pageTheme: null,
				locked: false,
			})),
	}))
}
export type ThemeAPI = ReturnType<typeof createThemeStore>
const ThemeContext: Context<ThemeAPI | undefined> = createContext(undefined)

export const ThemeProvider = ({children}: { children: React.ReactNode }) => {
	const themeRef = useRef<ThemeAPI>(null!)
	if (!themeRef.current) {
		themeRef.current = createThemeStore()
	}
	return (
		<ThemeContext.Provider value={themeRef.current}>
			{children}
		</ThemeContext.Provider>
	)
}
export const useTheme = <T, >(selector: (store: ThemeStore) => T): T => {
	const context = useContext(ThemeContext)
	if (!context) {
		throw new Error("useTheme must be used within ThemeProvider")
	}
	return useStore(context, selector)
}

// export const useTheme = (): ThemeContextType => useContext(ThemeContext)
