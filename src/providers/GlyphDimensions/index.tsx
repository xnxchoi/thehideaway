"use client";

import {merge} from "lodash-es";
import {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
} from "react";
import {createStore, useStore} from "zustand";
import {Blase, NarcissianNectare, RalewayDots, Suit} from "../../../fonts";
import {GeistMono} from "geist/font/mono";
import {GeistSans} from "geist/font/sans";

function quickselect_median(arr) {
	const L = arr.length,
		halfL = L / 2;
	if (L % 2 == 1) return quickselect(arr, halfL);
	else return 0.5 * (quickselect(arr, halfL - 1) + quickselect(arr, halfL));
}

function quickselect(arr, k) {
	// Select the kth element in arr
	// arr: List of numerics
	// k: Index
	// return: The kth element (in numerical order) of arr
	if (arr.length == 1) return arr[0];
	else {
		const pivot = arr[0];
		const lows = arr.filter((e) => e < pivot);
		const highs = arr.filter((e) => e > pivot);
		const pivots = arr.filter((e) => e == pivot);
		if (k < lows.length)
			// the pivot is too high
			return quickselect(lows, k);
		else if (k < lows.length + pivots.length)
			// We got lucky and guessed the median
			return pivot; // the pivot is too low
		else return quickselect(highs, k - lows.length - pivots.length);
	}
}

// from https://fonts.google.com/specimen/Open+Sans#standard-styles
const glyphs = {
	latin: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
	hangul:
		"가거것고공그기나내는다대도되럽로르를리무보부불비사상서성소수스시신아어에유은을의이인일있자장재적전정제조주지치키하한허화걷맵꿰밑덧깎낚엇휩힘앞멋값갚겆겪곪굇굳굶귓깁깍깜끝꽂꽤꿉껌껐껍끗낡넓눋눗눙늦늪닢닻댁덫듦딤딪땁땋땍떽떼뜬라래랗러렌례륙률륭릇린맏맣마며몇몹뭐뭅묏믈믹밖밴볏붙브빛빗빚뻐뺄뾰삘삔산세셈쇠숍숲쉿싫싶싯쐰썩썬쏠앉않얻여영옛오옳왼욘욧웹으잣절젱중짓짰쭘찢찧찾책쳐촘촬캔코콧탯탸턱텃튄틔파팽퍼푄표했횃횟흰흡",
	cyrillic:
		"АБВГҐДЂЕЁЄЖЗЅИІЇЙЈКЛЉМНЊОПРСТЋУЎФХЦЧЏШЩЪЫЬЭЮЯабвгґдђеёєжзѕиіїйјклљмнњопрстћуўфхцчџшщъыьэюя",
	numbers: "0123456789",
	punctuation: "‘?’“!”(%)[#]{@}/&\<-+÷×=>®©₩$€£¥¢:;,.*",
	special: "ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ",
	chinese: "丁",
	japanese: "あ",
};

const sum = (x: number, y: number) => x + y;
type FontSize = `${number}px`;
type FontFamily =
	| "Dotos"
	| "RalewayDots"
	| "Suit"
	| "Blase"
	| "NarcissianNectare"
	| "GeistSans"
	| "GeistMono";
type FontKey = `${FontFamily} ${FontSize} `;
type GlyphDimension = {
	avg: number;
	max: number;
	min: number;
	median: number;
};
type TypeFaceInfo = {
	lang: ("en" | "ko")[];
};
type GlyphDimensionState = {
	typeFaces: FontFamily[];
	fonts: Record<FontFamily, Record<FontSize, GlyphDimension>>;
	glyphs: typeof glyphs;
};
type GlyphDimensionStoreActions = {
	setFontDimensions: (l: {
		target: FontFamily;
		size: FontSize;
		dimensions: number[];
	}) => void;
	getFontDimensions: (l: FontFamily, size: FontSize) => GlyphDimension | null;
};
type GlyphDimensionStore = GlyphDimensionState & GlyphDimensionStoreActions;
const createGlyphDimensionStore = () => {
	return createStore<GlyphDimensionStore>()((set, get) => ({
		typeFaces: [],

		fonts: {
			Dotos: {},
			RalewayDots: {},
			Suit: {},
			Blase: {},
			NarcissianNectare: {},
			GeistSans: {},
			GeistMono: {},
		},
		glyphs: glyphs,
		setFontDimensions: (l: {
			target: FontFamily;
			size: FontSize;
			dimensions: number[];
		}) =>
			set((state) => {
				const {target, size, dimensions} = l;
				if (dimensions.length < 1) return state;
				const fonts = new Set(state.typeFaces);
				const hasFont = fonts.has(target);
				if (!hasFont) {
					fonts.add(target);
				}
				const targetFont = state.fonts[target] || {};
				const {[size]: _, ...rest} = targetFont;

				const a: GlyphDimension = {
					avg: dimensions.reduce(sum, 0) / dimensions.length,
					max: Math.max(...dimensions),
					min: Math.min(...dimensions),
					median: quickselect_median(dimensions),
				};
				const updatedFontInfo = merge(rest, {[size]: a});
				return {
					...state,
					fonts: {
						...state.fonts,
						[target]: updatedFontInfo,
					},
					typeFaces: Array.from(fonts),
				};
			}),
		getFontDimensions: (fontFamily: FontFamily, size: FontSize) => {
			if (get().typeFaces.indexOf(fontFamily) < 0) return null;
			return get().fonts[fontFamily]![`${size}px`] || null;
		}, // getFontWidth: (l: FontKey) => {
		//     const [fontFamily, fontSize] = l.split(" ") as [FontFamily, FontSize]
		//     if (get().typeFaces.indexOf(fontFamily) < 0) return null
		//     return get().getAverage(l)
		// },
		// getAverage: (l: FontKey) => {
		//     const [fontFamily, fontSize] = l.split(" ") as [FontFamily, FontSize]
		//     if (get().typeFaces.indexOf(fontFamily) < 0) return null
		//     return get().fonts[fontFamily]![fontSize]?.avg || null
		// },
		// getMin: (l: FontKey) => {
		//     const [fontFamily, fontSize] = l.split(" ") as [FontFamily, FontSize]
		//     if (get().typeFaces.indexOf(fontFamily) < 0) return null
		//     return get().fonts[fontFamily]![fontSize]?.min || null
		// },
		// getMedian: (l: FontKey) => {
		//     const [fontFamily, fontSize] = l.split(" ") as [FontFamily, FontSize]
		//     if (get().typeFaces.indexOf(fontFamily) < 0) return null
		//     return get().fonts[fontFamily]![fontSize]?.median || null
		// },

		// getMax: (l: FontKey) => {
		//     const [fontFamily, fontSize] = l.split(" ") as [FontFamily, FontSize]
		//     if (get().typeFaces.indexOf(fontFamily) < 0) return null
		//     return get().fonts[fontFamily]![fontSize]?.max || null
		// },
	}));
};
export type GlyphAPI = ReturnType<typeof createGlyphDimensionStore>;
export const GlyphContext = createContext<GlyphAPI | undefined>(undefined);
const GlProvider = ({children}: { children: ReactNode }) => {
	const glyphRef = useRef<GlyphAPI>(undefined);
	if (!glyphRef.current) {
		glyphRef.current = createGlyphDimensionStore();
	}
	return (
		<GlyphContext.Provider value={glyphRef.current}>
			{children}
		</GlyphContext.Provider>
	);
};
const useIntG = <T, >(selector: (glyph: GlyphDimensionStore) => T) => {
	const glyph = useContext(GlyphContext);
	if (!glyph) {
		throw new Error("useIntG must be used within GlyphContext!");
	}
	return useStore(glyph, selector);
};
type GlyphInfo = {
	getFontWidth: (font: FontFamily, size: number) => number | null;
	getAverage: (font: FontFamily, size: number) => number | null;
	getMax: (font: FontFamily, size: number) => number | null;
	getMin: (font: FontFamily, size: number) => number | null;
	getMedian: (font: FontFamily, size: number) => number | null;
};
const GlyphInfoCtx = createContext<GlyphInfo>(null!);
export const GlyphDimensions = ({children}: { children: ReactNode }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null!);
	const fontFamilies = useMemo(
		() => ({
			RalewayDots: RalewayDots.style.fontFamily,
			Suit: Suit.style.fontFamily,
			Blase: Blase.style.fontFamily,
			NarcissianNectare: NarcissianNectare.style.fontFamily,
			GeistSans: GeistSans.style.fontFamily,
			GeistMono: GeistMono.style.fontFamily,
		}),
		[],
	);
	const latin = useIntG((state) => state.glyphs.latin);
	const numbers = useIntG((state) => state.glyphs.numbers);
	const punctuation = useIntG((state) => state.glyphs.punctuation);
	const special = useIntG((state) => state.glyphs.special);
	const typeFaces = useIntG((state) => state.typeFaces);
	const setFontDimensions = useIntG((state) => state.setFontDimensions);
	const getFontDimension = useIntG((state) => state.getFontDimensions);
	const stdGlyphs = useMemo(() => {
		return latin + numbers + punctuation + special;
	}, [latin, numbers, punctuation, special]);

	const calculateGlyphDimensions = useCallback(
		(font: FontFamily, size: number, supportedLangs: TypeFaceInfo["lang"]) => {
			if (!canvasRef.current) {
				canvasRef.current = document.createElement("canvas");
			}
			const context = canvasRef.current.getContext("2d");
			if (!context) return [];
			context.font = `${fontFamilies[font]} ${size}px`;
			let glyphset = stdGlyphs;
			if (supportedLangs.includes("ko")) {
				glyphset += glyphs.hangul;
			}
			return [...glyphset].map((g) => context.measureText(g).width);
		},
		[stdGlyphs, fontFamilies],
	);
	const getFontDimensions = useCallback(
		(font: FontFamily, size: number) => {
			const fontSize = `${size}px` as FontSize;
			const fontFamily = font;
			let shouldCalculate = false;
			let dimensions = getFontDimension(font, fontSize);

			if (typeFaces.indexOf(fontFamily) < 0) {
				shouldCalculate = true;
			}
			if (dimensions === null) {
				shouldCalculate = true;
			}
			if (shouldCalculate) {
				const sizes = calculateGlyphDimensions(font, size, ["en"]);
				if (sizes.length > 0) {
					setFontDimensions({
						target: font,
						size: fontSize,
						dimensions: sizes,
					});
					dimensions = getFontDimension(font, fontSize);
				} else {
					throw new Error(
						`Failed to calculate glyph dimensions for ${font}, ${size}`,
					);
				}
			}
			return dimensions as GlyphDimension;
		},
		[typeFaces, getFontDimension, setFontDimensions, calculateGlyphDimensions],
	);

	const getAverage = useCallback(
		(font: FontFamily, size: number) => {
			const dimensions = getFontDimensions(font, size);
			return dimensions?.avg || null;
		},
		[getFontDimensions],
	);
	const getFontWidth = useCallback(
		(font: FontFamily, size: number) => {
			const dimensions = getFontDimensions(font, size);
			return dimensions?.avg || null;
		},
		[getFontDimensions],
	);

	return (
		<>
			<GlyphInfoCtx.Provider value={{
				getFontWidth,
				getAverage,
				getMin: (font: FontFamily, size: number) => {
					const dimensions = getFontDimensions(font, size);
					return dimensions?.min || null;
				},
				getMedian: (font: FontFamily, size: number) => {
					const dimensions = getFontDimensions(font, size);
					return dimensions?.median || null;
				},
				getMax: (font: FontFamily, size: number) => {
					const dimensions = getFontDimensions(font, size);
					return dimensions?.max || null;
				},
			}}>
				{children}
			</GlyphInfoCtx.Provider>
		</>
	);
};
export const useGlyph = <T, >(selector: (glyph: GlyphInfo) => T): T => {
	const glyph = useContext(GlyphInfoCtx);
	if (!glyph) {
		throw new Error("useGlyph must be used within GlyphDimensions!");
	}
	return selector(glyph);
};

export const GlyphProvider = ({children}: { children: ReactNode }) => {
	return (
		<GlProvider>
			<GlyphDimensions>{children}</GlyphDimensions>
		</GlProvider>
	);
};
