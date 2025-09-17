"use client";

import {
  CSSProperties,
  ReactNode,
  useEffect,
  lazy,
  useState,
  useCallback,
  createContext,
  useContext
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  HIGHLIGHT_PALETTE,
  HighlightColors,
  HighlightPalette,
  Palettes
} from "@/components/UX/Highlightr/stores";
import type { PayloadPreference } from "@/payload-types";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import {
  createUserHighlight,
  HighlightCreateError,
  updateUserHighlight,
  useHighlighter
} from "@/components/UX/Highlightr/provider";
import dynamic from "next/dynamic";
import { useRanger } from "@/components/UX/Highlightr/RangerProvider";
import type {
  RangeSaveParams,
  HighlightedRange
} from "@/components/UX/Highlightr/types";
import {
  ensureRange,
  isMarkable,
  clearSelection
} from "@/components/UX/Highlightr/utils/highlight-helpers";
import { nanoid } from "nanoid";
const RangerProvider = dynamic(
  () =>
    import("@/components/UX/Highlightr/RangerProvider").then(
      (r) => r.RangerProvider
    ),
  {
    ssr: false
  }
);

export function LayoutClient({ children }: { children: ReactNode }) {
  const setCurrentColor = useHighlighter((r) => r.setCurrentColor);
  const currentColor = useHighlighter((r) => r.currentColor);
  const [currentPalette, setCurrentPalette] = useState<
    HIGHLIGHT_PALETTE[HighlightColors]
  >(HighlightPalette[currentColor]);
  const uId = useRPSession((r) => r.id as string | null);
  const addHighlighter = useHighlighter((r) => r.addHighlight);
  const setFocusedHighlight = useHighlighter((r) => r.setFocusedHighlight);
  const [userId, setUserId] = useState(uId || "");
  const [loggedIn, setLoggedIn] = useState(!!uId);
  useEffect(() => {
    setUserId(uId || "");
    setLoggedIn(!!uId);
  }, [uId]);
  const {
    data: color,
    refetch: colorUpdate,
    isLoading: colorLoading,
    isPending: colorPending
  } = useQuery<HighlightColors, Error, HighlightColors, ["color", string]>({
    queryKey: ["color", userId],
    queryFn: async ({ queryKey: [color, userId] }) => {
      const r = await fetch("/api/payload-preferences/highlight-color", {
        method: "GET",
        credentials: "include"
      })
        .then((t) => {
          if (t.ok) return t;
          throw new Error("Failed to fetch color preference");
        })
        .then(
          async (r) =>
            (await r.json()) as Omit<
              PayloadPreference,
              "id" | "user" | "key" | "value"
            > & {
              _id: string;
              _v: number;
              user: string;
              key: string;
              value: HighlightColors;
            }
        )
        .then((r) => {
          if (r.key === "highlight-color") {
            if (Palettes.some((s) => (s as string) === r.value))
              return r.value as HighlightColors;
            throw new Error("Invalid color preference");
          }
        });
      if (!r) throw new Error("Invalid color");
      return r;
    },
    enabled: loggedIn
  });
  useEffect(() => {
    if (color) {
      setCurrentColor(color);
    }
  }, [setCurrentColor, colorPending, colorLoading, color]);
  useEffect(() => {
    setCurrentPalette(HighlightPalette[currentColor]);
  }, [currentColor, setCurrentPalette]);

  return (
    <div style={{ "--currentHighlight": currentPalette } as CSSProperties}>
      <RangerProvider>
        <CitationProvider>{children}</CitationProvider>
      </RangerProvider>
    </div>
  );
}
type CitationState = {
  create: (props: {
    params: Omit<RangeSaveParams, "selection" | "quote" | "reference">;
    container: HTMLElement;
    slug: string;
  }) => Promise<HighlightedRange>;
  update: (
    toSave: HighlightedRange & { article: string; user: string }
  ) => Promise<HighlightedRange>;
};

export const CitationContext = createContext<CitationState>(null!);

export const CitationProvider = ({ children }: { children: ReactNode }) => {
  const ranger = useRanger((r) => r.ranger);
  const classApplier = useRanger((r) => r.classApplier);
  const addHighlighter = useHighlighter((r) => r.addHighlight);
  const setFocusedHighlight = useHighlighter((r) => r.setFocusedHighlight);
  const coreCreate = useCallback(
    async ({
      params,
      container: content,
      slug
    }: {
      params: Omit<RangeSaveParams, "selection" | "quote" | "reference">;
      container: HTMLElement;
      slug: string;
    }) => {
      const base = content;
      if (!base) throw new HighlightCreateError("unknown");
      const userId = params.author;
      if (!userId) throw new HighlightCreateError("user");
      const selection = ranger.getSelection();
      const rangeAt = ensureRange(selection);
      if (
        !rangeAt ||
        !base.contains(selection.anchorNode) ||
        !isMarkable(selection)
      ) {
        clearSelection(selection);
        throw new HighlightCreateError("selection");
      }
      try {
        const nanoid1 = nanoid(17);
        const text = rangeAt.toString();
        if (!text || text.length < 1) {
          throw new HighlightCreateError("selection");
        }
        const toPass = {
          ...params,
          selection: {
            text,
            before: `"...`,
            after: `..."`
          },
          quote: `"...${text}..."`,
          private: params.private || false,
          reference: nanoid1
        } satisfies RangeSaveParams;
        const newH = await createUserHighlight({
          target: {
            slug: slug
          },
          citation: {
            ...toPass
          }
        });

        if (!newH) throw new HighlightCreateError("create");
        const previousHighlight = base.querySelectorAll(".highlighted");
        classApplier.applyToSelection();
        const highLightedNodes = base.querySelectorAll(".highlighted");
        const elements: Element[] = [];
        const previousHighlightArray = Array.from(previousHighlight);
        highLightedNodes.forEach((e) => {
          if (!previousHighlightArray.includes(e)) {
            e.setAttribute("data-reference", nanoid1);
            elements.push(e);
          }
        });
        const newHighlight: HighlightedRange = {
          ...newH,
          selection: {
            ...newH.selection
          },
          quote: newH.quote,
          id: newH.id,
          cited: newH.cited,
          reference: newH.reference,
          memo: newH.memo,
          range: rangeAt,
          els: elements
        };
        addHighlighter(newHighlight);
        setFocusedHighlight(newH.reference);
        selection.removeAllRanges();
        return newHighlight;
      } catch (e) {
        setFocusedHighlight(null);

        if (e instanceof HighlightCreateError) {
          throw e;
        }
        throw new HighlightCreateError("unknown");
      }
    },
    [addHighlighter, classApplier, ranger, setFocusedHighlight]
  );
  const coreUpdate = useCallback(
    async (toSave: HighlightedRange & { article: string; user: string }) => {
      const { article, user, ...saveParam } = toSave;
      const saveParams = [saveParam];
      try {
        const res = await updateUserHighlight({
          saveParams,
          user,
          article,
          color: saveParam.color
        });
        const rv = res[0];
        if (!rv) throw new HighlightCreateError("create");
        addHighlighter(res);
        setFocusedHighlight(rv.reference);
        return rv;
      } catch (e) {
        if (e instanceof HighlightCreateError) {
          throw e;
        }
        throw new HighlightCreateError("unknown");
      }
    },
    [addHighlighter, setFocusedHighlight]
  );
  return (
    <CitationContext.Provider
      value={{ create: coreCreate, update: coreUpdate }}
    >
      {children}
    </CitationContext.Provider>
  );
};
export const useCitations = <T,>(selector: (state: CitationState) => T) => {
  const ctx = useContext(CitationContext);
  if (!ctx) {
    throw new Error("useCitations must be used within a PredatorProvider");
  }
  return selector(ctx);
};
