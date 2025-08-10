"use client";
// store.ts (Zustand Vanilla)
import {clamp} from "@/utilities/mathUtilities";
import {stringify} from "qs-esm";
import {subscribeWithSelector} from "zustand/middleware";
import {createStore} from "zustand/vanilla";
import {createContext, ReactNode, useContext, useRef} from "react";
import {useRPSession} from "@/lib/auth/session/RP_SessionProvider";
import {useStore} from "zustand";

export type ReadItem = {
	index: number;
	progress: number;
	bookmarked: boolean;

	viewed: boolean;
	lastViewed: string;
	collection: string;
	id: string;
	citations: {
		selection: {
			text: string;
			before: string;
			after: string;
		};
		path: string;
		reference: string;
		color: string;
		memo?: string;
	}[];
};
export type ReadStore = {
	reader: null | string;
	setReader: (reader: string | null) => void;
	pastQueue: ReadItem[];
	setPastQueue: (item: ReadItem) => void;
	queue: { collection: string; id: string }[];
	setQueue: (items: { collection: string; id: string }[]) => void;
	currentItem: ReadItem;
	currentIndex: number;
	setCurrentIndex: (index: number) => void;
	setCurrentItem: (index: number) => Promise<void>;
	nextItem: () => void;
	prevItem: () => void;
};
const initStae: Pick<
	ReadStore,
	"reader" | "currentIndex" | "currentItem" | "queue"
> = {
	currentIndex: 0,
	currentItem: null!,
	reader: null,
	queue: [],
};
const createReadStore = (
	initState: Pick<
		ReadStore,
		"reader" | "currentIndex" | "currentItem" | "queue"
	> = initStae,
) => {
	return createStore<ReadStore>()(
		subscribeWithSelector((set, get) => {
			return {
				...initState,
				setReader: (reader) => set((state) => ({...state, reader})),
				pastQueue: [],

				setCurrentIndex: (index) =>
					set((state) => ({...state, currentIndex: index})),

				setCurrentItem: async (index: number) => {
					const {
						reader,
						queue,
						pastQueue,
						currentItem,
						setPastQueue,
						currentIndex,
					} = get();
					const idx = clamp(0, index, queue.length - 1);
					if (idx === currentIndex) {
						return;
					}
					const item = queue.at(idx);
					if (!item) {
						return;
					}
					const pastq = [...pastQueue];
					if (currentItem) {
						const index = pastq.findIndex(
							(q) =>
								q.collection === currentItem.collection &&
								q.id === currentItem.id,
						);
						if (index === -1) {
							pastq.push(currentItem);
						}
					}
					const past = pastQueue.find(
						(q) =>
							q.collection === item.collection &&
							q.id === item.id &&
							q.index === idx,
					);
					const base: ReadItem = {
						...(past || {
							progress: 0.0,
							bookmarked: false,
							viewed: false,
							lastViewed: "",
							collection: item.collection,
							id: item.id,
							citations: [],
						}),
						index: idx,
					};
					if (reader) {
						const qr = stringify(
							{
								where: {
									and: [
										{author: {equals: reader}},
										{"target.value": {equals: item.id}},
										{"target.relationTo": {equals: item.collection}},
									],
								},
							},
							{addQueryPrefix: true},
						);
						const sl = stringify({
							select: {
								selection: true,
								color: true,
								reference: true,
								path: true,
								memo: true,
							},
						});
						const cites = await fetch(`/api/citations${qr}&${sl}&limit=1`, {
							method: "GET",
							headers: {
								"Content-Type": "application/json",
							},
							credentials: "include",
						}).then((res) => res.json()).catch((e) => {
							console.error(e);
							return {
								docs: [],
							};
						});
						const cite = cites.docs as {
							id: string;
							selection: {
								text: string;
								before: string;
								after: string;
							};
							path: string;
							reference: string;
							color: string;
							memo?: string;
						}[];
						const vQ = stringify(
							{
								where: {
									and: [
										{
											user: {equals: reader},
											"target.value": {equals: item.id},
											"target.relationTo": {equals: item.collection},
										},
									],
								},
							},
							{addQueryPrefix: true},
						);
						const vS = stringify({
							select: {
								viewed: true,
								lastViewed: true,
								progress: true,
							},
						});
						const viee = await fetch(`/api/userViews${vQ}&${vS}&limit=1`, {
							method: "GET",
							headers: {
								"Content-Type": "application/json",
							},
							credentials: "include",
						}).then((res) => res.json()).catch((e) => {
							console.error(e);
							return {
								docs: [],
							};
						});

						const viewe = viee.docs[0] as
							| {
							viewed: boolean;
							lastViewed: string;
							progress: number;
						}
							| undefined;
						const bq = stringify(
							{
								where: {
									and: [
										{
											user: {equals: reader},
											"target.value": {equals: item.id},
											"target.relationTo": {equals: item.collection},
										},
									],
								},
							},
							{addQueryPrefix: true},
						);

						const bookmark = await fetch(
							`/api/bookmarks${bq}&limit=1&depth=0`,
							{
								method: "GET",
								headers: {
									"Content-Type": "application/json",
								},
								credentials: "include",
							},
						).then((res) => res.json()).catch((e) => {
							console.error(e);
							return {
								docs: [],
							};
						});
						const bookmarked = bookmark.docs.length > 0;

						set(
							(state) => ({
								...state,
								currentIndex: idx,
								currentItem: {
									...base,
									citations: cite,
									bookmarked,
									viewed: viewe?.viewed ?? false,
									progress: viewe?.progress ?? 0.0,
									lastViewed: viewe?.lastViewed ?? "",
									index: idx,
								},
								pastQueue: pastq,
							}),
							true,
						);
					} else {
						set(
							(state) => ({
								...state,
								currentIndex: idx,
								currentItem: base,
								pastQueue: pastq,
							}),
							true,
						);
					}
				},
				nextItem: () => {
					const {currentIndex, setCurrentItem} = get();
					setCurrentItem(currentIndex + 1);
				},
				prevItem: () => {
					const {currentIndex, setCurrentItem} = get();
					setCurrentItem(currentIndex - 1);
				},
				setPastQueue: (item) => {
					const {pastQueue} = get();
					const index = pastQueue.findIndex(
						(q) => q.collection === item.collection && q.id === item.id,
					);
					if (index === -1) {
						set((state) => ({...state, pastQueue: [...pastQueue, item]}));
					}
				},
				setQueue: (items) => set((state) => ({...state, queue: items})),
			};
		}),
	);
};
export type ReadAPI = ReturnType<typeof createReadStore>;
const ReadCtx = createContext<ReadAPI | null>(null);
export const ReadProvider = ({children}: { children: ReactNode }) => {
	const user = useRPSession((r) => r);
	const readRef = useRef<ReadAPI | null>(null);
	if (!readRef.current) {
		readRef.current = createReadStore({
			reader: user ? user.id : null,
			queue: [],
			currentIndex: 0,
			currentItem: null!,
		});
	}
	return (
		<ReadCtx.Provider value={readRef.current}>{children}</ReadCtx.Provider>
	);
};
export const useReadStore = <T, >(selector: (state: ReadStore) => T) => {
	const store = useContext(ReadCtx);
	if (!store) {
		throw new Error("ReadStore not found");
	}
	return useStore(store, selector);
};
export const useRead = () => {
	const store = useContext(ReadCtx);
	if (!store) {
		throw new Error("ReadStore not found");
	}
	return store;
};
