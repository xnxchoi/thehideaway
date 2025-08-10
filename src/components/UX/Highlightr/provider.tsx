"use client";
import type {
	ProcessedRangy,
	RangeSaveParams,
} from "@/components/UX/Highlightr/types";
import {createStore} from "zustand/vanilla";
import {createContext, type ReactNode, useContext, useRef} from "react";
import {type StoreApi, useStore} from "zustand";
import type {Where} from "payload";
import type {Citation} from "@/payload-types";
import {stringify} from "qs-esm";
import {errorToast} from "@/components/ui/sonner";

export type HighlightsCollection = Citation["target"]["relationTo"];
type HighlightState = {
	target: {
		relationTo: HighlightsCollection;
		value: string;
		slug: string;
		author: string;
	};
	highlights: ProcessedRangy[];
};
type HighlightActions = {
	addHighlight: (highlights: ProcessedRangy | Array<ProcessedRangy>) => void;
	removeHighlight: (reference: string | Array<string>, user: string) => void;
};
type HighlighterStore = HighlightState & HighlightActions;
type HighlightFetchErrorTypes =
	| "fetch"
	| "unknown"
	| "target"
	| "docs"
	| "user"
	| "unauthorized";
type HighlightFetchErrorMap = {
	[key in HighlightFetchErrorTypes]: string;
};
const highlightCreateErrorMap: HighlightFetchErrorMap = {
	fetch:
		"We couldn't create your highlight! Please check the network connection and try again. If the issue persists, please contact support.",
	unknown:
		"Something went wrong! Refresh the page and try again. If the issue persists, please contact support.",
	target:
		"We could not find the target article. Please try again later or contact support if the issue persists. If you are the author of the article, please check that the article is published.",
	docs: "We couldn't create your highlight! Please try again later.",
	user: "You are not authorized to add highlights. Contact support if you believe this is an error.",
	unauthorized: "Please check in to add highlights.",
};
const highlightFetchErrorMap: HighlightFetchErrorMap = {
	fetch:
		"We couldn't fetch your highlights! Please check the network connection and try again. If the issue persists, please contact support.",
	unknown:
		"Something went wrong! Refresh the page and try again. If the issue persists, please contact support.",
	target:
		"We could not find the target article. Please try again later or contact support if the issue persists. If you are the author of the article, please check that the article is published.",
	docs: "No highlights found for the given article.",
	user: "Something went wrong! You can refresh the page to fetch your highlights.",
	unauthorized: "Please check in to add highlights.",
};

export class HighlightFetchError extends Error {
	override name = "HighlightFetchError";

	constructor(type: HighlightFetchErrorTypes = "unknown") {
		super();

		this.message = highlightFetchErrorMap[type];
		this.cause = type;
	}

	override message: HighlightFetchErrorMap[HighlightFetchErrorTypes];
	override cause: HighlightFetchErrorTypes;
}

export class HighlightCreateError extends Error {
	override name = "HighlightCreateError";

	constructor(type: HighlightFetchErrorTypes = "unknown") {
		super();
		this.message = highlightCreateErrorMap[type];
		this.cause = type;
	}

	override message: HighlightFetchErrorMap[HighlightFetchErrorTypes];
	override cause: HighlightFetchErrorTypes;
}

export const fetchUserHighlights = async (props: {
	collection: HighlightsCollection;
	id: string;
}) => {
	const {collection, id} = props;
	return await fetch(
		`${process.env.NEXT_PUBLIC_SERVER_URL}/api/citations/getNotes/?collection=${collection}&id=${id}`,
		{
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			method: "GET",
		},
	).then(async (res) => {
		if (res.ok) {
			return (await res.json()) as {
				docs: ProcessedRangy[];
				target: {
					relationTo: HighlightsCollection;
					value: string;
				};
				user: string;
			};
		}
		throw new HighlightFetchError("fetch");
	}).then((r) => {
		return r;
	}).catch((e) => {
		if (e instanceof HighlightFetchError) throw e;
		throw new HighlightFetchError("unknown");
	});
};
export const createUserHighlight = async (props: {
	citation: RangeSaveParams;
	target: {
		value: string;
		relationTo: HighlightsCollection;
		slug: string;
	};
}) => {
	const {citation, target} = props;
	const {
		userId,
		selection,
		quote,
		reference,
		color,
		cited,
		path,
		private: isPrivate,
		memo,
	} = citation;
	try {
		const createData = {
			target: {
				relationTo: target.relationTo,
				value: target.value,
			},
			path,
			cited,
			author: userId,
			selection,
			quote,
			color,
			private: isPrivate || false,
			memo: memo || null,
			reference,
		} satisfies Omit<Citation, "createdAt" | "updatedAt" | "id">;
		const res = await fetch("/api/citations", {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(createData),
		});
		if (res.ok) {
			const rr = (await res.json()) as {
				message: string;
				doc: Citation;
				[x: string]: any;
			};
			if ("doc" in rr) {
				return {
					id: rr.doc.id,
					cited: rr.doc.cited as string,
					quote: rr.doc.quote,
					reference: rr.doc.reference,
					selection: {
						after: rr.doc.selection.after || "",
						before: rr.doc.selection.before,
						text: rr.doc.selection.text || "",
					},
					private: rr.doc.private,
					memo: rr.doc.memo,
					color: rr.doc.color,
					createdAt: rr.doc.createdAt,
					path: rr.doc.path,
				} satisfies ProcessedRangy;
			} else {
				throw new HighlightCreateError("docs");
			}
		} else {
			if (res.status === 401 || res.status === 403) {
				throw new HighlightCreateError("unauthorized");
			}
			throw new HighlightCreateError("fetch");
		}
	} catch (e) {
		if (e instanceof HighlightCreateError) throw e;
		throw new HighlightCreateError("unknown");
	}
};
/**
 *
 * resetHighlights: (props?: {
 *     [x in "user" | "target" | "highlights"]?: true;
 *   }) => void;
 *
 *   setUser: (nextState: HighlightState["user"]) => Promise<void>;
 *   setArticle: (nextState: HighlightState["target"]) => Promise<void>;
 *  setUser: async (user) => {
 *       const statea = get();
 *       if (user) {
 *         if (statea.user !== user) {
 *           const target = get().target;
 *           if (target.value && target.relationTo) {
 *             const res = await fetchUserHighlights({
 *               collection: target.relationTo,
 *               id: target.value,
 *             })
 *               .then((r) => r.docs)
 *               .catch((e) => {
 *                 if (e instanceof HighlightFetchError) {
 *                   errorToast(e.message);
 *                 }
 *                 errorToast("Something went wrong! Please try again later.");
 *                 return null;
 *               });
 *             set((state) => ({
 *               ...state,
 *               user,
 *               highlights: [...(res || [])],
 *             }));
 *           } else {
 *             set((state) => ({
 *               ...state,
 *               user,
 *               highlights: [],
 *             }));
 *           }
 *         }
 *       } else {
 *         if (statea.user !== null) {
 *           set((state) => ({
 *             ...state,
 *             user: null,
 *             highlights: [],
 *           }));
 *         }
 *       }
 *     },
 *      setArticle: async (target) => {
 *       const id = target.value;
 *       const user = get().user;
 *       if (id && user && target.relationTo) {
 *         const re = await fetchUserHighlights({
 *           collection: target.relationTo,
 *           id,
 *         })
 *           .then((highlights) => {
 *             return highlights.docs;
 *           })
 *           .catch((e) => {
 *             if (e instanceof HighlightFetchError) {
 *               errorToast(e.message);
 *             }
 *             errorToast(
 *               "We couldn't retrieve your highlights! Please try again later.",
 *             );
 *             return null;
 *           });
 *         if (re) {
 *           set((state) => ({
 *             ...state,
 *             target: {
 *               relationTo: target.relationTo,
 *               value: target.value,
 *               slug: target.slug,
 *               author: target.author,
 *             },
 *             highlights: re,
 *           }));
 *         } else {
 *           set((state) => ({
 *             ...state,
 *             target: {
 *               relationTo: target.relationTo,
 *               value: target.value,
 *               slug: target.slug,
 *               author: target.author,
 *             },
 *             highlights: [],
 *           }));
 *         }
 *       } else {
 *         set((state) => ({
 *           ...state,
 *           target: {
 *             relationTo: target.relationTo,
 *             value: target.value,
 *             slug: target.slug,
 *             author: target.author,
 *           },
 *           highlights: [],
 *         }));
 *       }
 *     },
    resetHighlights: (args) => {
      if (args) {
        const keys = Object.keys(args);
        set((state) => ({
          ...state,
          highlights: keys.includes("highlights") ? [] : [...state.highlights],
          user: keys.includes("user") ? "" : state.user,
          target: {
            ...((keys.includes("target") && {
              value: null!,
              relationTo: null!,
              author: null!,
              slug: null!,
            }) ||
              state.target),
          },
        }));
      } else {
        set((state) => ({
          ...state,
          highlights: [],
        }));
      }
    },
 *
 */
export const createHighlighterStore = (props: HighlightState) =>
	createStore<HighlighterStore>()((set, get) => ({
		...props,

		addHighlight: (highlights) =>
			set((state) => {
				return {
					...state,
					highlights: Array.isArray(highlights)
						? [...state.highlights, ...highlights]
						: [...state.highlights, highlights],
				};
			}),
		removeHighlight: (references) => {
			const targets = Array.isArray(references) ? references : [references];
			const statea = get();

			const hh = statea.highlights.filter(
				(h) => !targets.some((d) => d === h.reference),
			);
			set((state) => ({
				...state,
				highlights: hh,
			}));
		},
	}));

const HighlighterContext = createContext<StoreApi<HighlighterStore> | null>(
	null,
);
export const HighlighterProvider = ({
	target,
	highlights,
	children,
}: {
	children: ReactNode;
	target: {
		relationTo: HighlightsCollection;
		value: string;
		slug: string;
		author: string;
	};
	highlights: ProcessedRangy[];
}) => {
	const highlighter = useRef<StoreApi<HighlighterStore>>(null!);
	if (!highlighter.current) {
		highlighter.current = createHighlighterStore({
			target: {
				...target,
			},
			highlights: [...highlights],
		});
	}
	return (
		<HighlighterContext.Provider value={highlighter.current}>
			{children}
		</HighlighterContext.Provider>
	);
};
export const useHighlighter = <T, >(
	selector: (store: HighlighterStore) => T,
) => {
	const highlighter = useContext(HighlighterContext);
	if (!highlighter) {
		throw new Error("useHighlighter must be used within a HighlighterProvider");
	}
	return useStore(highlighter, selector);
};
