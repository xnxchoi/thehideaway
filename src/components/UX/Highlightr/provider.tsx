"use client";
import { errorToast } from "@/components/ui/sonner";
import { GhostUser } from "@/components/UX/Highlightr/index";
import { HighlightColors } from "@/components/UX/Highlightr/stores";
import type {
  HighlightedRange,
  ProcessedRangy,
  RangeSaveParams
} from "@/components/UX/Highlightr/types";
import type { Citation, User } from "@/payload-types";
import type { Where } from "payload";
import { stringify } from "qs-esm";
import {
  createContext,
  type ReactNode,
  RefObject,
  useContext,
  useRef
} from "react";
import { type StoreApi, useStore } from "zustand";
import { createStore } from "zustand/vanilla";

export type HighlightsCollection = Citation["target"]["relationTo"];
type HighlightState = {
  targetContainer: RefObject<HTMLDivElement>;
  focusedHighlight: HighlightedRange | null;
  currentColor: HighlightColors;
  target: {
    relationTo: HighlightsCollection;
    value: string;
    slug: string;
    author: string;
    disabled?: boolean;
  };
  citations: ProcessedRangy[];
  highlights: Map<string, HighlightedRange>;
};
type HighlightActions = {
  setContainer: (container: RefObject<HTMLDivElement>) => void;
  setTarget: (
    target: {
      relationTo: HighlightsCollection;
      value: string;
      slug: string;
      author: string;
      disabled?: boolean;
    } | null
  ) => void;
  setCurrentColor: (color: HighlightColors) => void;
  addHighlight: (
    highlights: HighlightedRange | Array<HighlightedRange>
  ) => void;
  setCitations: (citations: ProcessedRangy[]) => void;
  clear: () => void;
  reset: () => void;
  removeHighlight: (reference: string | Array<string>, user: string) => void;
  setFocusedHighlight: (reference: string | null) => void;
};
type HighlighterStore = HighlightState & HighlightActions;
type HighlightFetchErrorTypes =
  | "fetch"
  | "unknown"
  | "target"
  | "docs"
  | "user"
  | "unauthorized";
type HighlightCreateErrorTypes =
  | "unknown"
  | "create"
  | "target"
  | "selection"
  | "user"
  | "unauthorized";
type HighlightFetchErrorMap = {
  [key in HighlightFetchErrorTypes]: string;
};
type HighlightCreateErrorMap = {
  [key in HighlightCreateErrorTypes]: string;
};
const highlightCreateErrorMap: HighlightCreateErrorMap = {
  create:
    "We couldn't create your highlight! Please check the network connection and try again. If the issue persists, please contact support.",
  unknown:
    "Something went wrong! Refresh the page and try again. If the issue persists, please contact support.",
  target:
    "We could not find the target article. Please try again later or contact support if the issue persists. If you are the author of the article, please check that the article is published.",
  selection:
    "The selection was invalid. It was probably empty. But it could also be a bug. Try again... And let us know if this issue persists.",
  user: "You are not authorized to add highlights. Contact support if you believe this is an error.",
  unauthorized: "Please check in to add highlights."
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
  unauthorized: "Please check in to add highlights."
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

  constructor(type: HighlightCreateErrorTypes = "unknown") {
    super();
    this.message = highlightCreateErrorMap[type];
    this.cause = type;
  }

  override message: HighlightCreateErrorMap[HighlightCreateErrorTypes];
  override cause: HighlightCreateErrorTypes;
}
export const fetchAuthorOverview = async ({
  authorId
}: {
  authorId: string;
}) => {
  const select = {
    id: true,
    name: true,
    displayUsername: true,
    banned: true,
    image: true,
    slug: true
  } as const;

  const author = await fetch(
    `/api/users/${authorId}/${stringify({ select }, { addQueryPrefix: true })}`,
    {
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      method: "GET"
    }
  )
    .then((r) => {
      if (r.ok) {
        return r.json() as Promise<Pick<User, keyof typeof select>>;
      }
      throw new Error("Failed to fetch user");
    })
    .then((r) => {
      if (r) {
        if (!r.banned)
          return {
            id: r.id,
            name: r.name,
            displayUsername: r.displayUsername || r.name,
            image: r.image,
            slug: r.slug
          };
      }
      throw new Error("Failed to fetch user");
    })
    .catch((e) => {
      console.log(e);
      return GhostUser();
    });
  return author;
};
export const fetchUserHighlights = async (props: {
  collection: HighlightsCollection;
  id: string;
}) => {
  const { collection, id } = props;
  return await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/citations/getNotes/?collection=${collection}&id=${id}`,
    {
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      method: "GET"
    }
  )
    .then(async (res) => {
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
    })
    .then(async (r) => {
      return {
        docs: r.docs,
        target: {
          relationTo: r.target.relationTo,
          value: r.target.value
        },
        user: r.user as string
      };
    })
    .catch((e) => {
      if (e instanceof HighlightFetchError) throw e;
      throw new HighlightFetchError("unknown");
    });
};
export const createUserHighlight = async (props: {
  citation: RangeSaveParams;
  target: {
    slug: string;
  };
}) => {
  const { citation, target } = props;
  const arr: HighlightColors[] = ["GREEN", "YELLOW", "ORANGE", "BLUE"];
  const {
    author,
    selection,
    quote,
    reference,
    color,
    cited,
    path,
    private: isPrivate,
    memo
  } = citation;
  try {
    const createData = {
      ...citation,
      path,
      cited,
      author,
      selection,
      quote,
      color,
      private: isPrivate || false,
      memo: memo || null,
      reference
    } satisfies Omit<Citation, "createdAt" | "updatedAt" | "id">;
    const res = await fetch("/api/citations", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(createData)
    });
    if (res.ok) {
      const rr = (await res.json()) as {
        message: string;
        doc: Citation;
      };
      if ("doc" in rr) {
        const authorId = rr.doc.author as string;
        const author = await fetchAuthorOverview({ authorId });
        return {
          id: rr.doc.id,
          cited: rr.doc.cited as string,
          quote: rr.doc.quote,
          reference: rr.doc.reference,
          selection: {
            after: rr.doc.selection.after || "",
            before: rr.doc.selection.before,
            text: rr.doc.selection.text || ""
          },
          author,
          private: rr.doc.private,
          memo: rr.doc.memo,
          color:
            (arr.find(
              (c) => (c as string) === rr.doc.color
            ) as null | HighlightColors) || "ORANGE",
          createdAt: rr.doc.createdAt,
          updatedAt: rr.doc.updatedAt,
          path: rr.doc.path
        } satisfies Omit<HighlightedRange, "els" | "range">;
      } else {
        throw new HighlightCreateError("unknown");
      }
    } else {
      if (res.status === 401 || res.status === 403) {
        throw new HighlightCreateError("unauthorized");
      }
      throw new HighlightCreateError("create");
    }
  } catch (e) {
    if (e instanceof HighlightCreateError) throw e;
    throw new HighlightCreateError("unknown");
  }
};
export const updateUserHighlight = async ({
  saveParams,
  user: userId,
  article: postId,
  color
}: {
  saveParams: Array<HighlightedRange>;
  user: string;
  article: string;
  color: HighlightColors;
}) => {
  const toSaveArray = saveParams;

  const resultPromises = toSaveArray.map(async ({ els, range, ...rest }) => {
    const where: Where = {
      and: [
        {
          reference: {
            equals: rest.reference
          }
        },
        {
          author: {
            equals: userId
          }
        },
        {
          "target.value": {
            equals: postId
          }
        }
      ]
    };
    return await fetch(
      `/api/citations/${stringify({ where }, { addQueryPrefix: true })}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(rest)
      }
    )
      .then(async (res) => {
        if (res.ok) {
          const newDoc = (await res.json()) as Citation;
          return {
            ...newDoc,
            range,
            els,
            color,
            cited: newDoc.cited as string,
            updatedAt: newDoc.updatedAt,
            author: rest.author
          } satisfies HighlightedRange;
        }
        throw new Error("Failed to update highlight", {
          cause: {
            type: "data"
          }
        });
      })
      .catch((e) => {
        console.log(e);
        throw e;
      });
  });
  const result: PromiseSettledResult<HighlightedRange>[] =
    await Promise.allSettled(resultPromises);
  const errors: Set<{ id: string | null; message: string }> = new Set();
  const highlightArray: HighlightedRange[] = [];
  for (const r of result) {
    if (r.status === "fulfilled" && r.value) {
      highlightArray.push(r.value);
    } else {
      const targetId = toSaveArray[result.indexOf(r)];
      errors.add({
        id: targetId?.id ? targetId.id : null,
        message:
          r.status === "rejected" && r.reason instanceof Error
            ? r.reason.message
            : "Something went wrong"
      });
    }
  }
  if (errors.size > 0) {
    const era = Array.from(errors);
    const errorMessages = era
      .map((r) => `${r.id ? r.id : "(unknown id)"}:\t${r.message}`)
      .join("\n ");
    errorToast(
      `We couldn't update your highlight(s), please try again later.\nDetails\n\n${errorMessages}`
    );
  }
  return highlightArray;
};
export const deleteUserHighlight = async (props: {
  author: string;
  article: string;
  reference: string | string[];
}) => {
  const { author, article, reference: r } = props;
  const reference = Array.isArray(r) ? r : [r];
  const where: Where = {
    and: [
      {
        "target.value": {
          equals: article
        }
      },
      {
        author: {
          equals: author
        }
      },
      {
        reference: {
          in: reference
        }
      }
    ]
  };
  const query = stringify(
    {
      where,
      select: {
        reference: true
      }
    },
    { addQueryPrefix: true }
  );
  return await fetch(`/api/citations/${query}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(async (res) => {
      if (res.ok) {
        const rr = await res.json();
        const data = rr?.docs;
        if (!data)
          throw new Error("No data", {
            cause: {
              type: "data"
            }
          });
        const citations = (data as Citation[]).map((d) => d.reference);
        if (!citations)
          throw new Error("No citations", {
            cause: {
              type: "citations"
            }
          });
        return citations;
      }
      return null;
    })
    .catch((e) => {
      console.log(e);
      const cause = e.cause;
      let message = "";
      if ("type" in cause) {
        switch (cause.type) {
          case "data":
            message += "Highlights may be deleted, but we couldn't confirm.";
            break;
          case "citations":
            message += "No highlights were deleted.";
            break;
          case "request":
            message += "The request failed.";
        }
      }
      errorToast(
        `Something went wrong${message.length > 0 ? ": " + message : "!"} Please try again later.`
      );
      return null;
    });
};
export const createHighlighterStore = (props: HighlightState) =>
  createStore<HighlighterStore>()((set, get) => ({
    ...props,
    setContainer: (targetContainer) => set({ targetContainer }),
    setTarget: (target) =>
      set((state) => ({
        ...state,
        target: target || null!,
        highlights: new Map(),
        citations: [],
        focusedHighlight: null
      })),
    setCurrentColor: (currentColor) => set({ currentColor }),
    setFocusedHighlight: (focus) =>
      set((state) => {
        return {
          ...state,
          focusedHighlight: focus ? state.highlights.get(focus) || null : null
        };
      }),
    setCitations: (citations) => set({ citations }),
    addHighlight: (highlights) =>
      set((state) => {
        const h = Array.isArray(highlights) ? highlights : [highlights];
        const res = new Map(state.highlights);
        h.forEach((r) => {
          res.set(r.reference, r);
        });
        const fc = state.focusedHighlight;
        return {
          ...state,
          highlights: res,
          focusedHighlight: (fc && res.get(fc.reference)) || null,
          citations: [
            ...state.citations.filter(
              (r) => !h.some((s) => s.reference === r.reference)
            )
          ]
        };
      }, true),
    removeHighlight: (references) =>
      set((state) => {
        const f = Array.isArray(references) ? references : [references];
        const res = new Map(state.highlights);
        f.forEach((r) => {
          res.delete(r);
        });
        const fc = state.focusedHighlight;

        return {
          ...state,
          highlights: res,
          focusedHighlight: (fc && res.get(fc.reference)) || null,
          citations: [
            ...state.citations.filter((r) => !f.some((s) => s === r.reference))
          ]
        };
      }),
    clear: () =>
      set({ highlights: new Map(), citations: [], focusedHighlight: null }),
    reset: () =>
      set({
        highlights: new Map(),
        citations: [],
        focusedHighlight: null,
        target: null!,
        targetContainer: null!
      })
  }));
const HighlighterContext = createContext<StoreApi<HighlighterStore> | null>(
  null
);
export const HighlighterProvider = ({
  target,
  children
}: {
  children: ReactNode;
  target: null | {
    relationTo: HighlightsCollection;
    value: string;
    slug: string;
    author: string;
  };
}) => {
  const highlighter = useRef<StoreApi<HighlighterStore>>(null!);
  if (!highlighter.current) {
    highlighter.current = createHighlighterStore({
      targetContainer: null!,
      target: null!,
      highlights: new Map(),
      citations: [],
      focusedHighlight: null,
      currentColor: "ORANGE"
    });
  }
  return (
    <HighlighterContext.Provider value={highlighter.current}>
      {children}
    </HighlighterContext.Provider>
  );
};
export const useHighlighter = <T,>(
  selector: (store: HighlighterStore) => T
) => {
  const highlighter = useContext(HighlighterContext);
  if (!highlighter) {
    throw new Error("useHighlighter must be used within a HighlighterProvider");
  }
  return useStore(highlighter, selector);
};
