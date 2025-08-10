"use client";
import createDeepmerge from "@fastify/deepmerge";
import {
	CitationRange,
	ProcessedRangy,
} from "@/components/UX/Highlightr/types";
import {DateTime} from "luxon";
import cuid2 from "@paralleldrive/cuid2";
import {createStore} from "zustand/vanilla";
import {persist} from "zustand/middleware";
import {merge} from "lodash-es";
import {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {StoreApi, useStore} from "zustand";
import {delay} from "@/utilities/rp_utils";
import {clamp} from "@/utilities/mathUtilities";
import {storageAvailable} from "@/utilities/isLocalStorageAvailable";
import {CollectionSlug, Where} from "payload";
import {Citation, Delta, Post} from "@/payload-types";
import {stringify} from "qs-esm";
import {errorToast} from "@/components/ui/sonner";
import T from "@/app/(frontend)/(site)/posts/[slug]/t";
import {useRPSession} from "@/lib/auth/session/RP_SessionProvider";

const deepMerge = createDeepmerge({all: true});
type HighlightStoreId<T extends HighlighterStat> =
	`highlights_${T["target"]["value"]}_${T["user"] extends undefined ? T["fingerprint"] : T["user"]}`;

type HighlighterStat = {
	target: {
		relationTo: string;
		value: string;
	};

	highlights: ProcessedRangy[];
	fingerprint: string;
	user?: string;
};
type HighlitState = {
	target:
		| {
		relationTo: Extract<CollectionSlug, "posts">;
		value: Post["id"];
		slug: Post["slug"];
		author: string;
	}
		| {
		relationTo: Extract<CollectionSlug, "delta">;
		value: Delta["id"];
		slug: Delta["slug"];
		author: string;
	};
	highlights: ProcessedRangy[];
	user: string | null;
};
type HighlighterState = HighlighterStat & {
	name: HighlightStoreId<HighlighterStat>;
};
type Ops = "update" | "add" | "remove" | "reset" | "init";
type UpdateLog<T extends keyof HighlighterState, P extends Ops> = {
	property: T;
	timestamp: string;
	operation: P;
	oldValue?: P extends "init" | "add"
		? never
		: HighlighterState[T] extends Array<infer U>
			? U extends ProcessedRangy
				? Array<Pick<ProcessedRangy, "reference" | "selection">>
				: U
			: HighlighterState[T];
	newValue?: P extends "remove"
		? never
		: P extends "add"
			? HighlighterState[T]
			: HighlighterState[T] extends Array<infer U>
				? U extends ProcessedRangy
					? Array<Pick<ProcessedRangy, "reference" | "selection">>
					: U
				: HighlighterState[T];
};
type HighlightStoredState = HighlighterState & {
	createdAt: string;
	updatedAt: string;
	updateLogs: UpdateLog<keyof HighlighterState, Ops>[];
	cuid: string;
};
type HighlighterStored = {
	state: HighlightStoredState;
};
type HighLitAction = {
	addHighlight: (
		highlights: ProcessedRangy | Array<ProcessedRangy>,
	) => Promise<void>;
	removeHighlight: (reference: string | Array<string>) => Promise<void>;
	resetHighlights: (props?: {
		[x in "user" | "target" | "highlights"]?: true;
	}) => void;

	setUser: (nextState: HighlitState["user"]) => Promise<void>;
	setArticle: (nextState: HighlitState["target"]) => Promise<void>;
};
type HighlighterActions = {
	actions: {
		setHighlights: (
			nextHighlights: HighlighterStored["state"]["highlights"],
		) => void;
		addHighlight: (highlights: ProcessedRangy[]) => void;
		removeHighlight: (references: string[]) => void;
		clearHighlights: () => void;
		setFingerprint: (
			nextFingerPrint: HighlighterStored["state"]["fingerprint"],
		) => void;
		setUser: (nextUser: HighlighterStored["state"]["user"]) => void;
		wipeStore: () => void;
	};
};
type HighlitStore = HighlitState & HighLitAction;
export const fetchUserHighlights = async (props: {
	collection: Extract<CollectionSlug, "posts" | "delta">;
	id: string;
}) => {
	const {collection, id} = props;
	const res = await fetch(
		`${process.env.NEXT_PUBLIC_SERVER_URL}/api/citations/${collection}/${id}`,
		{
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			method: "GET",
		},
	);
};
type CreateHighlightStoreProps = {
	persistence?: boolean;
} & Pick<HighlighterState, "target" | "fingerprint"> &
	Partial<Omit<HighlighterState, "target" | "fingerprint">>;
const unixNow = () => DateTime.now().toUnixInteger().toString();
const isoNow = () => DateTime.now().toISO();
type HighlighterStore = HighlighterStored & HighlighterActions;
export const createHighlighterStore = (
	props: HighlitState = {
		target: {
			slug: null!,
			author: null!,
			relationTo: "posts",
			value: null!,
		},
		highlights: [],
		user: null,
	},
) =>
	createStore<HighlitStore>()((set, get) => ({
		...props,
		setArticle: async (target) => {
			const id = target.value;
			const user = get().user;
			if (id && user && target.relationTo) {
				try {
					const res = await fetch(
						`${process.env.NEXT_PUBLIC_SERVER_URL}/api/citations/${target.relationTo}/${id}`,
						{
							credentials: "include",
							method: "GET",
						},
					);
					if (res.ok) {
						const rr = await res.json();
						const data = rr.data;
						if (!data) throw new Error("no data");
						const {citations} = data;
						if (!citations) throw new Error("no citations");
						const highlights = citations;
						set((state) => ({
							...state,
							target,
							highlights,
						}));
					}
				} catch (e) {
					errorToast(
						"We couldn't retrieve your highlights! Please try again later.",
					);
					set((state) => ({
						...state,
						target: {
							...target,
						},
						highlights: [],
					}));
				}
			} else {
				set((state) => ({
					...state,
					target: {
						...target,
					},
					highlights: [],
				}));
			}
		},
		setUser: async (user) => {
			if (user) {
				const target = get().target;
				if (target.value && target.relationTo && user) {
					try {
						const res = await fetch(
							`${process.env.NEXT_PUBLIC_SERVER_URL}/api/citations/${target.relationTo}/${target.value}`,
							{
								headers: {
									"Content-Type": "application/json",
								},
								credentials: "include",
								method: "GET",
							},
						);
						if (res.ok) {
							const rr = await res.json();
							const data = rr.data;
							if (!data) throw new Error("no data");
							const {citations} = data;
							if (!citations) throw new Error("no citations");
							const highlights = citations as CitationRange[];
							set((state) => ({
								...state,
								target: {
									...target,
								},
								highlights,
								user,
							}));
						}
					} catch (e) {
						errorToast("Something went wrong! Please try again later.");
						set((state) => ({
							...state,
							user,
							highlights: [],
						}));
					}
				} else {
					set((state) => ({
						...state,
						user,
						highlights: [],
					}));
				}
			} else {
				set((state) => ({
					...state,
					user: null,
					highlights: [],
				}));
			}
		},

		addHighlight: async (highlights) => {
			const statea = get();
			const target = statea.target;
			const user = statea.user;
			if (target.value && user) {
				try {
					const processTargets = Array.isArray(highlights)
						? highlights
						: [highlights];
					const processing = processTargets.map(async (highlight) => {
						const selection = {
							text: highlight.selection.text,
							start: '"...',
							end: '..."',
						};
						return fetch("/api/citations", {
							method: "POST",
							credentials: "include",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								target: {
									value: target.value,
									relationTo: target.relationTo,
								},
								path: `/${target.relationTo}/${target.slug}`,
								cited: target.author,
								author: user,
								selection,
								quote: selection.start + selection.text + selection.end,
								reference: highlight.reference,
								private: highlight.private || false,
								memo: highlight.memo || "",
								color: highlight.color,
							}),
						});
					});
					const result = await Promise.allSettled(processing);
					const highlighsFreal: CitationRange[] = [];

					for (const r of result) {
						if (r.status === "fulfilled" && r.value.ok) {
							const rr = (await r.value.json()) as {
								message: string;
								doc: Citation;
								[x: string]: any;
							};
							highlighsFreal.push({
								reference: rr.doc.reference,
								selection: rr.doc.selection,
								private: rr.doc.private,
								memo: rr.doc.memo,
								color: rr.doc.color,
								createdAt: rr.doc.createdAt,
								id: rr.doc.id,
								path: rr.doc.path,
								quote: rr.doc.quote,
							} satisfies CitationRange);
						}
					}
					set((state) => ({
						...state,
						highlights: [...state.highlights, ...highlighsFreal],
					}));
				} catch (e) {
					errorToast("Something went wrong! Please try again later.");
				}
			} else {
				errorToast(
					"It seems that you are not checked in... You must be authenticated to highlight.",
				);
				console.log("target or user is not defined");
			}
		},
		removeHighlight: async (references) => {
			const targets = Array.isArray(references) ? references : [references];
			const statea = get();
			const target = statea.target;
			const user = statea.user;
			if (target.value && user) {
				try {
					const where: Where = {
						and: [
							{
								"target.value": {
									equals: target.value,
								},
							},
							{
								author: {
									equals: user,
								},
							},
							{
								reference: {
									in: targets,
								},
							},
						],
					};
					const query = stringify(
						{
							where,
							select: {
								reference: true,
							},
						},
						{addQueryPrefix: true},
					);
					const res = await fetch(`/api/citations/${query}`, {
						method: "DELETE",
						credentials: "include",
						headers: {
							"Content-Type": "application/json",
						},
					});
					if (res.ok) {
						const rr = await res.json();
						const data = rr.docs;
						if (!data)
							throw new Error("No data", {
								cause: {
									type: "data",
								},
							});
						const citations = data?.map((d: any) => d.reference);
						if (!citations)
							throw new Error("No citations", {
								cause: {
									type: "citations",
								},
							});
						const deleted = citations as Citation["reference"][];
						const hh = statea.highlights.filter(
							(h) => !deleted.some((d) => d === h.reference),
						);
						set((state) => ({
							...state,
							highlights: hh,
						}));
					} else {
						throw new Error(`failed to delete citations :${targets}`, {
							cause: {
								type: "request",
							},
						});
					}
				} catch (e) {
					console.log(e);
					const cause = e.cause;
					let message = "";
					if ("type" in cause) {
						switch (cause.type) {
							case "data":
								message +=
									"Highlights may be deleted, but we couldn't confirm.";
								break;
							case "citations":
								message += "No highlights were deleted.";
								break;
							case "request":
								message += "The request failed.";
						}
					}
					errorToast(
						`Something went wrong${message.length > 0 ? ": " + message : "!"} Please try again later.`,
					);
				}
			} else {
				errorToast(
					"Have you checked in? Something went wrong- we couldn't find your highlights.",
				);
			}
		},
		resetHighlights: (args) => {
			if (args) {
				const keys = Object.keys(args);
				set((state) => ({
					...state,
					highlights: keys.includes("highlights") ? [] : [...state.highlights],
					user: keys.includes("user") ? "" : state.user,
					target: keys.includes("target")
						? {value: null!, relationTo: null!, author: null!, slug: null!}
						: state.target,
				}));
			} else {
				set((state) => ({
					...state,
					highlights: [],
				}));
			}
		},
	}));

// export const createHighlighterStore = ({
//   user,
//     target,
//     highlights,
//     slug,
// }: HighlitState) => {
//   const now = DateTime.now().toISO();
//   const initStore: HighlighterStored = {
//     state: {
//       target,
//       name: `highlights_${target.value}_${user ? user : fingerprint}`,
//       highlights: highlights || [],
//       fingerprint,
//       createdAt: now,
//       updatedAt: now,
//       updateLogs: [],
//       cuid: null!,
//     },
//   };
//   const { name } = initStore.state;
//
//   if (user) {
//     initStore.state.user = user;
//   }
//
//   if (persistence) {
//     const pastStore = localStorage.getItem(name);
//     if (!pastStore) {
//       initStore.state.cuid = cuid2.createId();
//       localStorage.setItem(name, JSON.stringify(initStore));
//     }
//
//     return persistStore({ initStore, fingerprint, user });
//   } else {
//     return sessionStore({ initStore, fingerprint, user });
//   }
// };
const sessionStore = ({
	initStore,
	fingerprint,
	user,
}: {
	initStore: HighlighterStored;
	fingerprint?: string;
	user?: string;
}) => {
	return createStore<HighlighterStore>()((set) => ({
		state: {
			...initStore.state,
			fingerprint: fingerprint || "",
			user: user || "",
		},
		actions: {
			setHighlights: (highlights) =>
				set((state) => {
					const {
						state: {highlights: _oldHighlights, ...otherstate},
						...rest
					} = state;
					const newstate = merge(
						{},
						{
							...otherstate,
						},
						{highlights, updatedAt: isoNow()},
					) satisfies HighlightStoredState;
					const final = merge(
						{},
						{...rest},
						{state: newstate},
					) satisfies HighlighterStored;
					return final;
				}),
			addHighlight: (highlight) =>
				set((state) =>
					deepMerge(state, {
						state: {
							highlights: highlight,
							updateLogs: [
								{
									operation: "add",
									property: "highlights",
									timestamp: unixNow(),
									newValue: highlight,
								} as UpdateLog<"highlights", "add">,
							],
							updatedAt: isoNow(),
						},
					}),
				),
			clearHighlights: () => {
				set((state) => {
					const t = {...state};
					t.state.highlights = [];
					const log = {
						operation: "reset",
						property: "highlights",
						timestamp: unixNow(),
					} as UpdateLog<"highlights", "reset">;
					t.state.updateLogs.push(log);
					t.state.updatedAt = isoNow();
					return t;
				});
			},
			setFingerprint: (fingerprint) =>
				set((state) => deepMerge(state, {state: {fingerprint}})),
			setUser: (user) => set((state) => deepMerge(state, {state: {user}})),
			removeHighlight: (references) => {
				set((state) => {
					const curH = [...state.state.highlights];
					const deleteds = references.flatMap((reference) => {
						const delI = curH.findIndex((h) => h.reference === reference);
						if (delI === -1) return [];
						const deleted = curH.slice(delI, delI + 1)[0]!;
						const {selection, reference: ref} = deleted;
						return {selection, reference: ref};
					});
					const final = curH.filter(
						(h) => !deleteds.some((r) => r.reference === h.reference),
					);
					const log = {
						operation: "remove",
						property: "highlights",
						timestamp: unixNow(),
						oldValue: deleteds,
					} as UpdateLog<"highlights", "remove">;
					return deepMerge(
						{
							...state,
							state: {
								...state.state,
								highlights: final,
								updatedAt: isoNow(),
							},
						},
						{
							state: {
								updateLogs: [log],
							},
						},
					);
				});
			},
			wipeStore: () => {
				set(
					(state) => ({
						...state,
						state: {
							...state.state,
							highlights: [],
							updateLogs: [],
						},
					}),
					true,
				);
			},
		},
	}));
};
const persistStore = ({
	initStore,
	fingerprint,
	user,
}: {
	initStore: HighlighterStored;
	fingerprint?: string;
	user?: string;
}) => {
	return createStore<HighlighterStore>()(
		persist(
			(set) => ({
				state: {
					...initStore.state,
					fingerprint: fingerprint || initStore.state.fingerprint || "",
					user: user || initStore.state.user || "",
				},
				actions: {
					setHighlights: (highlights) =>
						set((state) => {
							const {
								state: {highlights: oldHighlights, ...otherstate},
								...rest
							} = state;
							const newstate = merge(
								{},
								{
									...otherstate,
								},
								{highlights, updatedAt: isoNow()},
							) satisfies HighlightStoredState;
							const final = merge(
								{},
								{...rest},
								{state: newstate},
							) satisfies HighlighterStored;
							return final;
						}),
					addHighlight: (highlight) =>
						set((state) =>
							deepMerge(state, {
								state: {
									highlights: highlight,
									updateLogs: [
										{
											operation: "add",
											property: "highlights",
											timestamp: unixNow(),
											newValue: highlight,
										} as UpdateLog<"highlights", "add">,
									],
									updatedAt: isoNow(),
								},
							}),
						),
					clearHighlights: () => {
						set((state) => {
							const t = {...state};
							t.state.highlights = [];
							const log = {
								operation: "reset",
								property: "highlights",
								timestamp: unixNow(),
							} as UpdateLog<"highlights", "reset">;
							t.state.updateLogs.push(log);
							t.state.updatedAt = isoNow();
							return t;
						});
					},
					setFingerprint: (fingerprint) =>
						set((state) => deepMerge(state, {state: {fingerprint}})),
					setUser: (user) =>
						set((state) => deepMerge(state, {state: {user}})),
					removeHighlight: (references) => {
						set((state) => {
							const curH = [...state.state.highlights];
							const deleteds = references.flatMap((reference) => {
								const delI = curH.findIndex((h) => h.reference === reference);
								if (delI === -1) return [];
								const deleted = curH.slice(delI, delI + 1)[0]!;
								const {selection, reference: ref} = deleted;
								return {selection, reference: ref};
							});
							const final = curH.filter(
								(h) => !deleteds.some((r) => r.reference === h.reference),
							);
							const log = {
								operation: "remove",
								property: "highlights",
								timestamp: unixNow(),
								oldValue: deleteds,
							} as UpdateLog<"highlights", "remove">;
							return deepMerge(
								{
									...state,
									state: {
										...state.state,
										highlights: final,
										updatedAt: isoNow(),
									},
								},
								{
									state: {
										updateLogs: [log],
									},
								},
							);
						});
					},
					wipeStore: () => {
						set(
							(state) => ({
								...state,
								state: {
									...state.state,
									highlights: [],
									updateLogs: [],
								},
							}),
							true,
						);
					},
				},
			}),
			{
				name: `highlights_${initStore.state.target.value}`,
				partialize: (store) =>
					({
						state: {
							...store.state,
							highlights: [...store.state.highlights],
						},
					}) satisfies {
						state: {
							highlights: ProcessedRangy[];
						} & Omit<HighlighterStore["state"], "highlights">;
					},
				merge: (persistedState, store) =>
					deepMerge(store, persistedState) as HighlighterStore,
			},
		),
	);
};
type HighlightAPI = ReturnType<typeof createHighlighterStore>;
// const High = createContext<HighlightAPI | null>(null);
// type ExH = HighlighterStore["actions"] &
//   HighlighterStore["state"] & {
//     persist: boolean;
//
//     updateComplete: boolean;
//     setUpdateComplete: (s: boolean) => void;
//   };
// export const HighlighterContext = createContext<ExH>({
//   addHighlight: () => {},
//   clearHighlights: () => {},
//   removeHighlight: () => {},
//   setHighlights: () => {},
//   setFingerprint: () => {},
//   setUser: () => {},
//   wipeStore: () => {},
//   highlights: [],
//   name: null!,
//   updatedAt: null!,
//   updateLogs: [],
//   cuid: null!,
//   createdAt: null!,
//   target: {
//     relationTo: "",
//     value: "",
//   },
//   fingerprint: null!,
//
//   persist: false,
//   updateComplete: false,
//   setUpdateComplete: (s) => {},
// });
//
// type HighlighterProviderProps = {
//   children: ReactNode;
//   fingerprint: string;
//   target: {
//     relationTo: string;
//     value: string;
//   };
//   user?: string;
// };
// export const HighlighterProvider = ({
//   children,
//   user,
//   target,
//   fingerprint,
// }: HighlighterProviderProps) => {
//   return (
//     <Higher user={user} target={target} fingerprint={fingerprint}>
//       {children}
//     </Higher>
//   );
// };
// const Higher = ({
//   user,
//   target,
//   fingerprint,
//   children,
// }: {
//   fingerprint: string;
//   target: { value: string; relationTo: string };
//   user?: string;
//   children: ReactNode;
// }) => {
//   const highlighter = useRef<HighlightAPI>(null!);
//   if (!highlighter.current) {
//     const persistence = storageAvailable("localStorage");
//     highlighter.current = createHighlighterStore({
//       target,
//       persistence,
//       fingerprint,
//       user,
//     });
//   }
//   return (
//     <High.Provider value={highlighter.current}>
//       <HighlightMiddle>{children}</HighlightMiddle>
//     </High.Provider>
//   );
// };
// const useHigh = <T,>(selector: (store: HighlighterStore) => T) => {
//   const highlighter = useContext(High);
//   if (!highlighter)
//     throw new Error("useHigh must be used within a HighProvider");
//   return useStore(highlighter, selector);
// };
// const HighlightMiddle = ({ children }: { children: ReactNode }) => {
//   const highlighter = useHigh((r) => r);
//   const wipeStore = useHigh((r) => r.actions.wipeStore);
//   const highlights = useHigh((r) => r.state.highlights);
//   const name = useHigh((r) => r.state.name);
//   const updatedAt = useHigh((r) => r.state.updatedAt);
//   const addHighlight = useHigh((r) => r.actions.addHighlight);
//   const removeHighlight = useHigh((r) => r.actions.removeHighlight);
//   const setHighlights = useHigh((r) => r.actions.setHighlights);
//   const setFingerprint = useHigh((r) => r.actions.setFingerprint);
//   const setUser = useHigh((r) => r.actions.setUser);
//   const user = useHigh((r) => r.state.user);
//   const clearHighlights = useHigh((r) => r.actions.clearHighlights);
//   const updateLogs = useHigh((r) => r.state.updateLogs);
//   const cuid = useHigh((r) => r.state.cuid);
//   const createdAt = useHigh((r) => r.state.createdAt);
//   const target = useHigh((r) => r.state.target);
//   const fingerprint = useHigh((r) => r.state.fingerprint);
//   const [updateComplete, setUpdateComplete] = useState(false);
//   const nowMil = useCallback(() => DateTime.now().toMillis(), []);
//   const lastUpdateState = useRef(updateComplete);
//   const lastUpdateTime = useRef(nowMil());
//   const debounce = 150;
//   const [_internalUpdateFlag, _setinternalUpdateFlag] = useState(false);
//   const debouncePad = useRef(10);
//   const persist = useMemo(() => storageAvailable("localStorage"), []);
//   useEffect(() => {
//     if (persist && highlighter && lastUpdateState.current !== updateComplete) {
//       if (updateComplete) {
//         const cur = nowMil();
//         const diff = cur - lastUpdateTime.current;
//         debouncePad.current = clamp(10, diff, debounce);
//         _setinternalUpdateFlag(true);
//       } else {
//         _setinternalUpdateFlag(false);
//       }
//       lastUpdateState.current = updateComplete;
//     }
//   }, [highlighter, nowMil, persist, updateComplete]);
//   useEffect(() => {
//     if (_internalUpdateFlag) {
//       const ms = debouncePad.current;
//       delay(ms).then(() => {
//         //check if new unsaved changes have occurred in the meantime
//         const noUntrackedChanges = lastUpdateState.current;
//         //we only wipe the store if changes have been saved
//         noUntrackedChanges &&
//           (wipeStore(), (lastUpdateTime.current = nowMil()));
//       });
//     } else {
//       debouncePad.current = 10;
//     }
//   }, [_internalUpdateFlag, nowMil, wipeStore]);
//   return (
//     <HighlighterContext.Provider
//       value={{
//         addHighlight,
//         clearHighlights,
//         createdAt,
//         updatedAt,
//         updateLogs,
//         name,
//         target,
//         setUpdateComplete,
//         updateComplete,
//         highlights,
//         fingerprint,
//         cuid,
//         removeHighlight,
//         setHighlights,
//         wipeStore,
//         setFingerprint,
//         user,
//         setUser,
//
//         persist,
//       }}
//     >
//       {children}
//     </HighlighterContext.Provider>
//   );
// };
const HighlighterContext = createContext<StoreApi<HighlitStore> | null>(null);
export const HighlighterProvider = ({children}: { children: ReactNode }) => {
	const highlighter = useRef<StoreApi<HighlitStore>>(null!);
	const user = useRPSession((r) => r.id);
	if (!highlighter.current) {
		highlighter.current = createHighlighterStore({
			user,
			target: {
				relationTo: "posts",
				value: null!,
				slug: null!,
				author: null!,
			},
			highlights: [],
		});
	}
	return (
		<HighlighterContext.Provider value={highlighter.current}>
			{children}
		</HighlighterContext.Provider>
	);
};
export const useHighlighter = <T, >(selector: (store: HighlitStore) => T) => {
	const highlighter = useContext(HighlighterContext);
	if (!highlighter) {
		throw new Error("useHighlighter must be used within a HighlighterProvider");
	}
	return useStore(highlighter, selector);
};
