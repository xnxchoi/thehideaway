// store/mentionStore.ts
import {createStore} from "zustand/vanilla";
import {LRUCache as LRU} from "lru-cache";
import {MakeRequired} from "@/utilities/typeUtilities";
import {User} from "@/payload-types";

export type MentionItem = MakeRequired<Pick<User, "id" | "name" | "slug">> &
	Pick<User, "image">;
type MentionResult = MentionItem;

export interface MentionState {
	cache: {
		get: (query: string) => Promise<MentionResult[]>;
		clear: () => void;
	} | null;
	initCache: (fetchFn: (q: string) => Promise<MentionResult[]>) => void;
	destroyCache: () => void;
}

export const createMentionStore = () =>
	createStore<MentionState>((set) => ({
		cache: null,
		initCache(fetchFn) {
			const lru = new LRU<string, MentionResult[]>({
				max: 100,
				ttl: 1000 * 60 * 5,
			});
			set({
				cache: {
					async get(query) {
						const cached = lru.get(query);
						if (cached) return cached;
						const res = await fetchFn(query);
						lru.set(query, res);
						return res;
					},
					clear() {
						lru.clear();
					},
				},
			});
		},
		destroyCache() {
			set({cache: null});
		},
	}));
/***
 * type QueryStatus = 'error' | 'loading' | 'loaded' | 'idle'
export type MentionState = {
  results: MentionItem[];
  queryString: string | null;
  count: number;
  status: QueryStatus
  error: boolean | any;
  cache: LRUCache<MentionItem>
}
export type MentionAction = {
  setResults: (l: MentionItem[] | null) => void;
  appendResults: (l: (Array<MentionItem> | MentionItem)) => void;
  resetResults: () => void;
  setQuery: (l: string | null) => void;
  clearQuery: () => void;
  setStatus: (l: QueryStatus) => void;
  resetStatus: () => void;
}
export type MentionStore = MentionAction & MentionState
export const createMentionStore = (initState: MentionState = {
  cache: null!,
  results: [],
  queryString: null,
  count: 0,
  status: 'idle',
  error: false,
}) => {
  return createStore<MentionStore>()((set, get) => ({
    ...initState,
    setResults: (l) => set({ results: l ? [...l] : [] }),
    setStatus: (status) => set({ status }),
    appendResults: (l) => set((state) => ({
      ...state,
      results: [...state.results, ...(Array.isArray(l) ? l : [l])]
    })),
    resetResults: () => set({ results: [] }),
    resetStatus: () => set({
      status: 'idle'
    }),
    clearQuery: () => set({
      queryString: null,
      results: [],
      status: 'idle'
    }),
    setQuery: (l) => set(state => {
      const cur = state;
      cur.queryString = l;
      if (!l) {
        cur.results = [];
      }
      return cur;
    })
  }))
}
 */
