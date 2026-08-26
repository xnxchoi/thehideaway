"use client";
import {MobileContext} from "@/providers/MiddleMan";
import {CursorProvider, useDeviceInfo} from "@/providers/RP_Pro";
import {useTheme} from "@/providers/Theme";

import {themeIsValid} from "@/providers/Theme/types";
import canUseDOM from "@/utilities/canUseDOM";
import {storageAvailable} from "@/utilities/isLocalStorageAvailable";

import {
	defaultTheme,
	getImplicitPreference,
	themeLocalStorageKey
} from "@/providers/Theme/shared";
import {useTheme as useThemePayload} from "@payloadcms/ui";
import dynamic from "next/dynamic";
import {useEffect, useState, type ReactNode} from "react";


const AdminCursor = dynamic(
	() => import("@/payload/components/Cursor/index").then((r) => r.default),
	{ssr: false}
);
const AdminMobileProvider = ({children}: { children: ReactNode }) => {
	const [isTouch, setIsTouch] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [pointerReady, setPointerReady] = useState(false);
	const MOBILE_BREAKPOINT = 640;

	useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
		const touchQ = window.matchMedia("(hover:none)");
		setIsTouch(touchQ.matches);
		setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		setPointerReady(true);
		const onChange = () => {
			setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		};
		const onTouchChange = () => {
			setIsTouch(touchQ.matches);
		};
		mql.addEventListener("change", onChange);
		touchQ.addEventListener("change", onTouchChange);

		return () => {
			mql.removeEventListener("change", onChange);
			touchQ.removeEventListener("change", onTouchChange);
		};
	}, []);

	return (
		<MobileContext.Provider value={{isTouch, isMobile}}>
			{pointerReady && !isTouch && <AdminCursor/>}
			{children}
		</MobileContext.Provider>
	);
};
export const AdminMiddleMan = ({children}: { children: ReactNode }) => {
	const localStorageEnabled = useDeviceInfo((r) => r.localStorage),
		setLocalStorageEnabled = useDeviceInfo((r) => r.setStorageAvailable);
	const locked = useTheme((r) => r.locked);
	const setTheme = useTheme((store) => store.setTheme);
	const saveTheme = useTheme((r) => r.saveTheme);
	const pageTheme = useTheme((store) => store.pageTheme);
	const savedTheme = useTheme((store) => store.savedTheme);
	const theme = useTheme((store) => store.theme);
	const {theme: payloadTheme} = useThemePayload();

	useEffect(() => {
		setTheme(payloadTheme);
	}, [payloadTheme, setTheme]);
	useEffect(() => {
		if (canUseDOM) {
			const s = storageAvailable("localStorage");
			setLocalStorageEnabled(s);
			let implicitPreference = getImplicitPreference() ?? defaultTheme;
			if (s) {
				const k = window.localStorage.getItem(themeLocalStorageKey);
				if (themeIsValid(k)) {
					implicitPreference = k;
				}
			}
			saveTheme(implicitPreference);
		}
	}, [saveTheme, setLocalStorageEnabled]);
	useEffect(() => {
		document.documentElement.setAttribute("data-theme", theme);
		document.documentElement.classList.toggle("dark", theme === "dark");
	}, [theme]);
	useEffect(() => {
		setTheme(locked ? pageTheme || defaultTheme : savedTheme || defaultTheme);
	}, [pageTheme, savedTheme, locked, setTheme]);
	useEffect(() => {
		if (localStorageEnabled) {
			if (savedTheme) {
				window.localStorage.setItem(themeLocalStorageKey, savedTheme);
			} else {
				window.localStorage.removeItem(themeLocalStorageKey);
			}
		}
	}, [localStorageEnabled, savedTheme]);

	return (
		<CursorProvider>
			<AdminMobileProvider>{children}</AdminMobileProvider>
		</CursorProvider>
	);
};
