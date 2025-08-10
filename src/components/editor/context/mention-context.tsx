import {createContext, useCallback, useContext, useEffect, useRef} from 'react';
import type {StoreApi} from 'zustand';
import {createMentionStore, type MentionState} from '@/components/editor/plugins/mentions/store'

type MentionAPI = ReturnType<typeof createMentionStore>
export const MentionStoreContext = createContext<MentionAPI | undefined>(undefined);
export const MentionProvider = ({children}: { children: React.ReactNode }) => {
	const storeRef = useRef<MentionAPI>(null!);
	const fetchFn = useCallback(async (query: string) => {
		const res = await fetch(`/api/users?q=${encodeURIComponent(query)}`);
		if (!res.ok) throw new Error('Mention API failed');
		return await res.json();
	}, [])
	if (!storeRef) {
		const store = createMentionStore();

	}
}
const MentionContextProvider = ({children}: { children: React.ReactNode }) => {


	useEffect(() => {

		storeRef.current.getState().initCache(fetchFn);

		return () => {
			storeRef.current.getState().cache?.clear();
			storeRef.current.getState().destroyCache();
		};
	}, []);

	return (
		<MentionStoreContext.Provider value={storeRef.current}>
			{children}
		</MentionStoreContext.Provider>
	);
};
export const useMentionStore = () => {
	const store = useContext(MentionStoreContext);
	if (!store) throw new Error('MentionStoreContext missing');
	return store;
};