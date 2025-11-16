"use client";
import { type MentionItem } from "@/components/editor/plugins/mentions/store";
import type { UserOverview } from "@/types/collections/posts";
import { useAuth } from "@payloadcms/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash-es";
import type { Where } from "payload";
import { stringify } from "qs-esm";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useDebounce } from "../editor-hooks/use-debounce";

type MentionAPI = {
  items: UserOverview[];
  queryString?: string | null;
  page: number;

  totalDocs: number;
  totalPages: number;
  isReady: boolean;
  isError: boolean;
  isLoading: boolean;
  error?: Error;
  setQueryString: (query: string) => void;
  clear: () => void;
};
export const MentionAPIContext = createContext<MentionAPI | undefined>(
  undefined
);
export const MentionProvider = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const [queryString, setQs] = useState("");
  const [dQs, setDqS] = useState(queryString);
  const setDebouncedQueryString = useCallback((query: string) => {
    setDqS(query);
  }, []);
  const setQueryString = useDebounce(setDebouncedQueryString, 15);
  useEffect(() => {
    setQs(dQs);
  }, [dQs]);

  const lastQuery = useRef("");
  const lastQueryTime = useRef(0);
  const [page, setPage] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const { user } = useAuth();
  const userId = user?.id;
  const [isEnabled, setIsEnabled] = useState(Boolean(userId));
  const select = useMemo(
    () => ({
      image: true,
      id: true,
      name: true,
      slug: true
    }),
    []
  );
  const qc = useQueryClient();
  useEffect(() => {
    lastQuery.current = queryString;
    lastQueryTime.current = performance.now();
  }, [queryString]);
  const clear = useCallback(() => {
    setQueryString.cancel();
    qc.cancelQueries({ queryKey: ["mentionLexical"] });
    setDqS("");
    setPage(1);
    lastQuery.current = "";
    lastQueryTime.current = 0;
  }, [setQueryString, qc]);
  const fetchFn = useCallback(
    async ({
      queryKey: [_qn, { userId, queryString, page }]
    }: {
      queryKey: [string, { userId: string; queryString: string; page: number }];
    }) => {
      const where: Where & { and: ({ or: Where[] } | Where)[] } = {
        and: [
          {
            id: {
              not_equals: userId
            }
          },
          {
            banned: {
              not_equals: true
            }
          },
          {
            or: [
              {
                name: {
                  contains: queryString
                }
              },
              {
                slug: {
                  contains: queryString
                }
              },
              {
                displayUsername: {
                  contains: queryString
                }
              }
            ]
          }
        ]
      };
      const res = await fetch(
        `/api/users${stringify({ where }, { addQueryPrefix: true })}&${stringify({ select })}&limit=10&page=${page}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          }
        }
      );
      if (res.ok) {
        const r = (await res.json()) as {
          docs: UserOverview[];
          hasNextPage: boolean;
          hasPrevPage: boolean;
          totalDocs: number;
          totalPages: number;
          page: number;
          limit: number;
          nextPage?: null | string;
          prevPage?: null | string;
        };
        if (r) {
          return {
            totalDocs: r.totalDocs,
            docs: r.docs,
            totalPages: r.totalPages
          };
        }
      }
      throw new Error("Mention API failed");
    },
    [select]
  );
  const { isFetching, isLoading, isPending, error, isError, data } = useQuery({
    queryKey: [
      "mentionLexical",
      {
        userId: (userId as string | undefined | null) || "",
        queryString,
        page
      }
    ],

    enabled: isEnabled,
    queryFn: fetchFn,
    gcTime: 45 * 1000,
    staleTime: Infinity,
    placeholderData: {
      docs: [],
      totalDocs: 0,
      totalPages: 0
    }
  });
  useEffect(() => {
    setIsEnabled(Boolean(userId));
  }, [userId]);
  useEffect(() => {
    setIsReady(
      !isLoading &&
        !isPending &&
        !isError &&
        isEnabled &&
        data &&
        "docs" in data &&
        Array.isArray(data.docs) &&
        data.docs.length > 0
    );
  }, [isLoading, isPending, isError, isEnabled, data]);
  return (
    <MentionAPIContext.Provider
      value={{
        setQueryString,
        clear,
        isReady,
        isError,
        items: data?.docs || [],
        page,
        totalPages: data?.totalPages || 0,
        totalDocs: data?.totalDocs || 0,
        isLoading: isPending || isFetching || isLoading,
        queryString
      }}
    >
      {children}
    </MentionAPIContext.Provider>
  );
};
export const useMentionStore = <T,>(selector: (store: MentionAPI) => T) => {
  const mc = useContext(MentionAPIContext);
  if (!mc) {
    throw new Error("useMention must be used within a MentionProvider");
  }

  return selector(mc);
};
export const useMention = (query?: string | null) => {
  const setQuery = useMentionStore((r) => r.setQueryString);

  const data = useMentionStore((r) => r.items);
  const isReady = useMentionStore((r) => r.isReady);
  const isLoading = useMentionStore((r) => r.isLoading);
  const isError = useMentionStore((r) => r.isError);
  const page = useMentionStore((r) => r.page);
  const totalPages = useMentionStore((r) => r.totalPages);
  const totalDocs = useMentionStore((r) => r.totalDocs);
  const queryString = useMentionStore((r) => r.queryString);
  const clearQuery = useMentionStore((r) => r.clear);
  const [response, setResponse] = useState<UserOverview[] | null>(data);
  useEffect(() => {
    if (query && query.length > 0) {
      setQuery(query);
    } else {
      clearQuery();
    }
  }, [clearQuery, query, setQuery]);
  useEffect(() => {
    setResponse(queryString ? data : null);
  }, [data, queryString]);
  return response;
};
