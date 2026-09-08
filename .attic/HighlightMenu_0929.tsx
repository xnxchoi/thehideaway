"use client";
import { useDomCursor } from "@/components/core/cursorWrapper";
import { errorToast } from "@/components/ui/sonner";
import LockedGate from "@/components/UX/Highlightr/Gated";
import type { HighlightsCollectionSlug } from "@/components/UX/Highlightr/types";
import {
  createUserHighlight,
  deleteUserHighlight,
  fetchUserHighlights,
  HighlightCreateError,
  updateUserHighlight,
  useHighlighter
} from "@/components/UX/Highlightr/providers/HighlighterProvider";
import { useHighlightSidebar } from "@/components/UX/Highlightr/sideBarProvider";
import { HighlightPalette, Palettes } from "@/components/UX/Highlightr/stores";
import { Button } from "@/components/UX/Button";
import { MotionBtn } from "@/components/UX/Button";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { cn } from "@/lib/utils";
import type { Bookmark, User } from "@/payload-types";
import { FeaturedCard } from "@/payload/blocks/heros/ArtHero/FeatureHero";
import type { AuthorOverview, SingleArticle } from "@types/collections/posts";
import RichText from "@/payload/fields/RichText";
import { useNavEvents } from "@/providers/Navigation/_client-nav-events";
import { useCursor } from "@/providers/RP_Pro";
import { delay } from "@/utilities/rp_utils";
import { useWindowResize } from "@/utilities/use_window_resize";
import {
  autoUpdate,
  flip,
  inline,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useTransitionStatus
} from "@floating-ui/react";
import { useGSAP } from "@gsap/react";
import { BookmarkFilledIcon, BookmarkIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gsap } from "gsap";
import type Lenis from "lenis";
import { useLenis } from "lenis/react";
import { AnimatePresence, useMotionValue } from "motion/react";
import { nanoid } from "nanoid";
import { useTranslations } from "next-intl";
import { useTransitionState } from "next-transition-router";
import { usePathname } from "next/navigation";
import type { Where } from "payload";
import { stringify } from "qs-esm";
import { useRanger } from "../src/components/UX/Highlightr/providers/RangerProvider";

import { useCitations } from "@/app/(frontend)/(site)/posts/[slug]/layout.client";
import {
  type ComponentPropsWithoutRef,
  type ComponentPropsWithRef,
  createContext,
  type MouseEvent,
  MouseEventHandler,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useShallow } from "zustand/shallow";
import { SignedFooter } from "../src/components/UX/Signature";
import { DynamicBreadcrumb } from "../src/components/UX/Highlightr/DynamicIsland";
import { FloatHighlightMenu } from "../src/components/UX/Highlightr/HighlightMenu";
import {
  PrivateMemoizer,
  usePrivateNote
} from "../src/components/UX/Highlightr/PrivateHighlights";
import type { HighlightColors } from "../src/components/UX/Highlightr/stores";
import "./styles/_highlightr.scss";
import type {
  HighlightedRange,
  ProcessedRangy,
  RangeSaveParams
} from "../src/components/UX/Highlightr/types";
import {
  clearSelection,
  ensureRange,
  getAnchestorIdentifyableNode,
  isMarkable
} from "../src/components/UX/Highlightr/utils/highlight-helpers";

export type RangeRect = {
  top: number;
  left: number;
  right: number;
  width: number;
};
type FloaterHightlight = {
  setOpen: (open: boolean) => void;
  open: boolean;
};
const FloaterContext = createContext<FloaterHightlight>({
  setOpen: (open: boolean) => {},
  open: false
});
const FloatMenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <FloaterContext.Provider value={{ setOpen, open }}>
      {children}
    </FloaterContext.Provider>
  );
};
export const useFloater = <T,>(selector: (state: FloaterHightlight) => T) => {
  const ctx = useContext(FloaterContext);
  return selector(ctx);
};

export const Narrateur = ({ post }: { post: SingleArticle }) => {
  return (
    <FloatMenuProvider>
      <Article post={post} />
    </FloatMenuProvider>
  );
};
const Article = ({
  post: { id, slug, author, ...rest }
}: {
  post: SingleArticle;
}) => {
  const authorId = useMemo(() => author.id, [author]);
  const addHighlighter = useHighlighter((r) => r.addHighlight);
  const setFocusedHighlight = useHighlighter((r) => r.setFocusedHighlight);
  const currentColor = useHighlighter(useShallow((r) => r.currentColor));
  const currentColorRef = useRef(currentColor);
  useEffect(() => {
    currentColorRef.current = currentColor;
  }, [currentColor]);
  const userId = useRPSession(useShallow((r) => r.id));
  const postId = useMemo(() => id, [id]);
  const contentiner = useRanger((r) => r.targetContainer);
  const setVisi = useFloater((r) => r.setOpen);
  const coreCreate = useCitations((r) => r.create);
  const createHighlight = useCallback(
    async (params: Pick<RangeSaveParams, "memo" | "private">) => {
      const base = contentiner;
      if (!base) throw new HighlightCreateError("unknown");
      if (!userId) throw new HighlightCreateError("user");

      try {
        const toPass = {
          ...params,

          color: currentColorRef.current,
          author: userId,

          path: slug,
          cited: authorId,
          target: {
            value: postId,
            relationTo: "posts"
          }
        } satisfies Omit<RangeSaveParams, "reference" | "selection" | "quote">;

        const newH = await coreCreate({
          params: toPass,
          container: base,
          slug
        });
        if (!newH) throw new HighlightCreateError("create");
        return newH;
      } catch (e) {
        setFocusedHighlight(null);
        setVisi(false);

        if (e instanceof HighlightCreateError) {
          throw e;
        }
        throw new HighlightCreateError("unknown");
      }
    },
    [
      contentiner,
      userId,
      slug,
      authorId,
      postId,
      coreCreate,
      setFocusedHighlight,
      setVisi
    ]
  );
  const updd = useCitations((r) => r.update);
  const handleUpdateHighlight = useCallback(
    async (toSave: HighlightedRange) => {
      return await updd({ ...toSave, article: postId, user: userId });
    },
    [updd, postId, userId]
  );
  return (
    <PrivateMemoizer
      saveCallback={handleUpdateHighlight}
      createCallback={createHighlight}
    >
      <ReadInternal post={{ id, slug, author, ...rest }} />
    </PrivateMemoizer>
  );
};

export type BaseGhostUserField = Extract<
  keyof User,
  "id" | "name" | "image" | "displayUsername" | "slug"
>;
export const GhostUser = (
  userOverrides?: Pick<User, BaseGhostUserField>,
  additionalFields?: Pick<User, Exclude<keyof User, BaseGhostUserField>>
) =>
  ({
    ...(additionalFields || {}),
    id: "0",
    name: "Ghost",
    image: "",
    displayUsername: "Ghost",
    slug: "/404",
    ...(userOverrides || {})
  }) as Partial<Omit<User, BaseGhostUserField>> &
    Required<Pick<User, BaseGhostUserField>>;
type AV<A extends Record<any, any>> = {
  -readonly [key in keyof A]: A[key];
};
type VirtualDOMRect = AV<Omit<DOMRect, "toJSON">>;

const ReadInternal = ({ post }: { post: SingleArticle }) => {
  const {
    id: postId,
    slug,
    author: { id: authorId },
    content: postContent,
    disabled,
    locked
  } = post;

  const { direction } = useNavEvents();
  const [naved, setNaved] = useState(true);
  useEffect(() => {
    setNaved(direction === null);
  }, [direction]);
  const user = useRPSession(useShallow((r) => r?.id));
  const userId = useMemo(() => user, [user]);
  const [enableHighlight, setEnableHighlight] = useState(!!user && !disabled);
  const contentRef = useRef<HTMLDivElement>(null!);
  const ranger = useRanger((r) => r.ranger, contentRef);
  const highlighter = useRanger((r) => r.highlighter);
  const classApplier = useRanger((r) => r.classApplier);
  const { isReady } = useTransitionState();
  const visi = useFloater(useShallow((r) => r.open));
  const setVisi = useFloater((r) => r.setOpen);
  const { refs, floatingStyles, context } = useFloating({
    placement: "top",
    open: visi,
    onOpenChange: setVisi,
    middleware: [offset(10), inline(), shift(), flip()],
    whileElementsMounted: autoUpdate
  });
  const { status, isMounted } = useTransitionStatus(context);
  const prefs = usePrivateNote((r) => r.refs);
  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  const [responseNodes, setResponseNodes] = useState<
    Array<{ top: number; reference: string }>
  >([]);
  const [privateNodes, setPrivateNodes] = useState<
    Array<{ top: number; reference: string }>
  >([]);
  const t = useTranslations();
  const setCurrentColor = useHighlighter((r) => r.setCurrentColor);
  const qc = useQueryClient();
  const colorUpdater = useMutation({
    onSuccess: ([newColor, userId]) => {
      qc.setQueryData(["color"], (old) => {
        return newColor;
      });
      setCurrentColor(newColor);
    },
    mutationFn: async ({
      color,
      user
    }: {
      color: HighlightColors;
      user: string;
    }) =>
      await fetch(`/api/payload-preferences/highlight-color`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          value: color
        }),
        credentials: "include"
      }).then(async (r) => {
        if (r.ok) {
          const res = (await r.json()) as {
            message: string;
            doc: {
              user: string;
              userCollection: "users" | "admins";
              key: string;
              value: HighlightColors;
            };
          };
          if (res.doc && "value" in res.doc && res.doc.value) {
            return [res.doc.value, user] as [HighlightColors, string];
          }
        }
        throw new Error("Update failed");
      })
  });
  useEffect(() => {
    setEnableHighlight(!!user && !disabled);
  }, [user, disabled]);
  const {
    data: savedHighlights,
    refetch,
    isLoading: hLoading,
    isPending: hPending,
    isSuccess: hSuccess
  } = useQuery({
    queryKey: ["savedHighlights", { postId }],
    queryFn: async ({
      queryKey: [_, { postId }]
    }: {
      queryKey: [string, { postId: string }];
    }) => {
      return await delay(150).then(
        async () =>
          await fetchUserHighlights({
            collection: "posts",
            id: postId!
          }).then((r) => r.docs)
      );
    },
    enabled: enableHighlight,
    staleTime: Infinity,
    gcTime: 60 * 1000,
    refetchOnWindowFocus: false
  });
  const pathName = usePathname();

  const [highlightMap, setHighlightMap] = useState<
    Array<{
      y: number;
      top: number;
    }>
  >([]);
  const containerRef = useRef<HTMLDivElement>(null!);
  const lastResize = useWindowResize({
    debounce: 100,
    detectHeightChange: true
  });

  const postDisabled = useMemo(() => !!disabled, [disabled]);
  const [containerBounds, setContainerBounds] = useState(0.25);
  const scr = useLenis();
  const addHighlighter = useHighlighter((r) => r.addHighlight);
  const removeHighlighter = useHighlighter((r) => r.removeHighlight);

  useEffect(() => {
    const cont = contentRef.current;
    if (cont) {
      const ratio = window.innerHeight / cont.offsetHeight;
      ratioRef.current = Math.max(0.25, ratio);
      setContainerBounds(ratio);
    }
  }, [lastResize, scr]);
  const progress = useMotionValue(0);
  const [preamble, setPreamble] = useState<boolean>(false);
  const [lastColor, setLastColor] = useState<HighlightColors>("ORANGE");
  const lastColorRef = useRef(lastColor);
  const currentColor = useHighlighter(useShallow((r) => r.currentColor));

  const currentColorRef = useRef<HighlightColors>(currentColor);
  const highlights = useHighlighter(useShallow((r) => r.highlights));
  const focusedHighlight = useHighlighter(
    useShallow((r) => r.focusedHighlight)
  );
  const setFocusedHighlight = useHighlighter((r) => r.setFocusedHighlight);

  const scrollYRef = useRef(0);
  const ratioRef = useRef(1);
  const scrollCB = useCallback(
    (lenis: Lenis) => {
      if (!contentRef.current) return;
      scrollYRef.current = lenis.scroll;
      progress.set(lenis.progress);
    },
    [progress]
  );
  useEffect(() => {
    scr && scr.on("scroll", scrollCB);
    return () => {
      scr && scr.off("scroll", scrollCB);
    };
  }, [scr, scrollCB]);
  const setPrivOpen = usePrivateNote((r) => r.setOpen);
  const setPrivView = usePrivateNote((r) => r.setView);

  const updateDOMRect = useCallback(
    (a: VirtualDOMRect, t: Element): VirtualDOMRect => {
      const b = t.getBoundingClientRect();
      const right = Math.min(a.right, b.right);
      const left = Math.min(a.left, b.left);
      const height = Math.min(a.height, b.height);
      const width = right - left;
      const y = Math.min(a.y, b.y);
      const bottom = Math.max(a.bottom, b.bottom);
      const top = Math.min(a.top, b.top);
      const x = Math.min(a.x, b.x);
      return {
        top,
        left,
        right,
        width,
        height,
        y,
        bottom,
        x
      };
    },
    []
  );
  useEffect(() => {
    currentColorRef.current = currentColor;
  }, [currentColor]);
  const getHighlightsRect = useCallback(
    (e: HighlightedRange) => {
      let a: VirtualDOMRect = {
        top: 0,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
        bottom: 0,
        x: 0,
        y: 0
      };
      const r = e.els[0];
      if (r) {
        a = r.getBoundingClientRect();
        e.els.forEach((e: Element) => {
          a = updateDOMRect(a, e);
        });
      }
      return a;
    },
    [updateDOMRect]
  );
  const getHighlightsRects = useCallback((e: HighlightedRange) => {
    const a = e.els[0];
    if (a) {
      return a.getClientRects();
    }
    return e.range.nativeRange.getClientRects();
  }, []);

  const handleHighlightClick = useCallback(
    (e: Event) => {
      e.stopPropagation();
      if (!e.currentTarget) return;
      const target = e.currentTarget as Element;
      const ref = target.getAttribute("data-reference");
      setFocusedHighlight(ref);
    },
    [setFocusedHighlight]
  );
  useEffect(() => {
    if (focusedHighlight) {
      if (focusedHighlight.private) {
        const ance = getAnchestorIdentifyableNode(
          focusedHighlight.els[0] as Node
        );
        if (ance) {
          prefs.setReference(ance);
          setPrivView("view");
          setPrivOpen(true);
        }
      } else {
        refs.setReference({
          getBoundingClientRect: () => getHighlightsRect(focusedHighlight),
          getClientRects: () => getHighlightsRects(focusedHighlight)
        });

        setVisi(true);
      }
    } else {
    }
  }, [
    focusedHighlight,
    getHighlightsRect,
    getHighlightsRects,
    prefs,
    refs,
    setPrivOpen,
    setPrivView,
    setVisi
  ]);
  const setCursor = useCursor((r) => r.setCursorState);
  const onEn = useCallback(() => {
    setCursor("FOCUS");
  }, [setCursor]);
  const onExit = useCallback(() => {
    setCursor(null);
  }, [setCursor]);

  const deleteHighlight = useCallback(
    async ({
      userId,
      fh,
      hr
    }: {
      userId: string;
      fh: HighlightedRange | null;
      hr: Map<string, HighlightedRange>;
    }) => {
      setVisi(false);
      const selection = window.getSelection();
      if (!selection) return;
      if (!userId) {
        errorToast("You must be checked in to delete highlights.");
        return;
      }
      selection.removeAllRanges();
      if (!fh || !("els" in fh) || !fh.els) return;
      const deleteResult = await deleteUserHighlight({
        author: userId,
        article: postId,
        reference: [fh.reference]
      });
      const t = document.createRange();
      const a = fh.els[0];
      const n = fh.els[fh.els.length - 1];
      a && t.setStartBefore(a);
      n && t.setEndAfter(n);
      selection.addRange(t);
      const tat = hr.get(fh.reference);
      if (deleteResult && tat) {
        tat.els.forEach((e) => {
          const parentNode = e.parentNode;
          if (parentNode) {
            if (e.className === "highlighted") {
              while (e.firstChild) {
                parentNode.insertBefore(e.firstChild, e);
              }
              e.remove();
            }
            (e as HTMLElement).style.backgroundImage = "none";
            (e as HTMLElement).classList.remove("highlighted");
            (e as HTMLElement).removeAttribute("data-reference");
            (e as HTMLElement).removeEventListener(
              "click",
              handleHighlightClick
            );
          }
        });
        removeHighlighter(deleteResult, userId);
      } else {
        errorToast(
          "Something went wrong while trying to delete the selection. Try again in a few secs!"
        );
      }
      setFocusedHighlight(null);
      refs.setReference(null);
      setVisi(false);
      selection.removeAllRanges();
    },
    [
      handleHighlightClick,
      postId,
      refs,
      removeHighlighter,
      setFocusedHighlight,
      setVisi
    ]
  );

  const createHighlight = useCallback(
    async (params: Pick<RangeSaveParams, "memo" | "private">) => {
      const base = contentRef.current;
      if (!base) throw new HighlightCreateError("unknown");
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
          reference: nanoid1,
          color: currentColorRef.current,
          author: userId,
          selection: {
            text: text,
            before: '"...',
            after: '..."'
          },
          path: pathName,
          cited: authorId,
          quote: `"...${text}..."`,
          target: {
            value: postId,
            relationTo: "posts"
          }
        } satisfies RangeSaveParams;

        const newH = await createUserHighlight({
          target: {
            slug: slug
          },
          citation: {
            target: {
              relationTo: "posts",
              value: postId
            },
            private: toPass.private || false,
            memo: toPass.memo || "",
            reference: toPass.reference,
            selection: {
              text: toPass.selection.text,
              before: `"...`,
              after: `..."`
            },
            color: toPass.color,
            path: toPass.path,
            author: userId,
            cited: authorId,
            quote: `"...${toPass.selection.text}..."`
          }
        });

        if (!newH) throw new HighlightCreateError("create");
        const previousHighlight =
          contentRef.current.querySelectorAll(".highlighted");
        classApplier.applyToSelection();
        const highLightedNodes =
          contentRef.current.querySelectorAll(".highlighted");
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
        setVisi(false);

        if (e instanceof HighlightCreateError) {
          throw e;
        }
        throw new HighlightCreateError("unknown");
      }
    },
    [
      userId,
      ranger,
      pathName,
      authorId,
      postId,
      slug,
      classApplier,
      addHighlighter,
      setFocusedHighlight,
      setVisi
    ]
  );
  useEffect(() => {
    lastColorRef.current = lastColor;
  }, [lastColor]);
  const updateHighlight = useCallback(
    async (toSave: HighlightedRange | Array<HighlightedRange>) => {
      const saveParams = Array.isArray(toSave) ? toSave : [toSave];
      if (saveParams.length === 0) return;
      try {
        const res = await updateUserHighlight({
          saveParams,
          user: userId,
          article: postId,
          color: currentColorRef.current
        });

        addHighlighter(res);
        const rv = res[0];
        if (!rv) throw new HighlightCreateError("create");
        const r = rv.reference;
        if (!r) {
          setVisi(false);
          refs.setReference(null);
        }
        setFocusedHighlight(r);
        return rv;
      } catch (e) {
        if (e instanceof HighlightCreateError) {
          throw e;
        }
        throw new HighlightCreateError("unknown");
      }
    },
    [addHighlighter, postId, refs, setFocusedHighlight, setVisi, userId]
  );

  const changeCurrentHighlightColor = useCallback(
    (colorWay: HighlightColors) => {
      colorUpdater.mutate({ color: colorWay, user: userId });
    },
    [colorUpdater, userId]
  );
  const lastRangeAt = useRef<rangy.RangyRange | null>(null);

  const containerMouseUp = useCallback(() => {
    const base = contentRef.current;
    if (!base) return;
    const e = ranger.getSelection();
    const t = ensureRange(e);
    if (!t) {
      setFocusedHighlight(null);
      setVisi(false);
      refs.setReference(null);
      lastRangeAt.current = null;
      return;
    }
    if (isMarkable(e) && t && "nativeRange" in t) {
      if (!t.collapsed && base.contains(e.anchorNode)) {
        setFocusedHighlight(null);
        refs.setReference({
          getBoundingClientRect: () => t.nativeRange.getBoundingClientRect(),
          getClientRects: () => t.nativeRange.getClientRects()
        });
        const ance = getAnchestorIdentifyableNode(e.anchorNode!) as HTMLElement;
        prefs.setReference(ance);
        setPrivView("edit");
        setVisi(true);
      }
      lastRangeAt.current = t;
    } else {
      setFocusedHighlight(null);
      setVisi(false);
      refs.setReference(null);
      prefs.setReference(null);
      lastRangeAt.current = null;
    }
  }, [prefs, ranger, refs, setFocusedHighlight, setPrivView, setVisi]);
  const updateMiniMap = useCallback(
    (highlighter: Map<string, HighlightedRange>) => {
      const highlighters = highlighter.values();
      const a: Array<{
        y: number;
        top: number;
      }> = [];
      const wh = window.innerHeight;
      const cont = contentRef.current;
      if (!cont) return;
      const contDimension = cont.offsetHeight;
      const contOffset = cont.offsetTop;
      highlighters.forEach((e) => {
        let n = 0;
        let i = contOffset;
        e.els.forEach((t, i) => {
          const tt = (t as HTMLElement).offsetTop;
          if (i > 0) {
            n = Math.min(n, tt);
          } else {
            n = tt;
          }
        });
        i = i + n;
        a.push({
          y: i,
          top: (n / contDimension) * wh * 0.85
        });
      });

      setHighlightMap(a);
    },
    []
  );
  const updateResponseNodes = useCallback(
    (highlighter: Map<string, HighlightedRange>) => {
      const highlighters = highlighter.values();
      const b: Array<{
        top: number;
        reference: string;
        memo: string;
        quote: string;
        author: AuthorOverview;
        updatedAt: string;
        createdAt: string;
      }> = [];
      const c: Array<{
        top: number;
        reference: string;
        memo: string;
        quote: string;
        author: AuthorOverview;
        updatedAt: string;
        createdAt: string;
      }> = [];
      highlighters.forEach((e) => {
        let n = 0;
        e.els.forEach((t, i) => {
          const tt = (t as HTMLElement).offsetTop;
          if (i > 0) {
            n = Math.min(n, tt);
          } else {
            n = tt;
          }
        });
        if (e.memo && e.memo.length > 0) {
          if (e?.private) {
            const el = e.els[0] as HTMLElement;
            const pa = el.closest(
              '[data-selectable="true"]'
            ) as HTMLElement | null;
            pa && (n = pa.offsetTop);
          }
          const pass = {
            quote:
              e.quote ||
              `${e.selection.before}${e.selection.text}${e.selection.after}`,
            top: n,
            reference: e.reference,
            memo: e.memo,
            author: e.author,
            updatedAt: e.updatedAt,
            createdAt: e.createdAt
          };
          e.private ? c.push(pass) : b.push(pass);
        }
      });
      if (b.length > 0) {
        setResponseNodes(b);
      } else {
        setResponseNodes([]);
      }
      if (c.length > 0) {
        setPrivateNodes(c);
      } else {
        setPrivateNodes([]);
      }
    },
    []
  );
  const fc = useRef(focusedHighlight);
  useEffect(() => {
    fc.current = focusedHighlight;
  }, [focusedHighlight]);

  const updaterC = useCallback(
    (highlights: Map<string, HighlightedRange>, cont: HTMLDivElement) => {
      cont.removeEventListener("mouseup", containerMouseUp, false);
      cont.addEventListener("mouseup", containerMouseUp, false);
      const highlightedNodes = cont.querySelectorAll(".highlighted");
      highlightedNodes.forEach((e) => {
        e.removeEventListener("click", handleHighlightClick);
        e.removeEventListener("mouseenter", onEn);
        e.removeEventListener("mouseleave", onExit);
        e.addEventListener("mouseenter", onEn);
        e.addEventListener("mouseleave", onExit);
        e.addEventListener("click", handleHighlightClick);
      });
      updateMiniMap(highlights);
      updateResponseNodes(highlights);
    },
    [
      containerMouseUp,
      handleHighlightClick,
      onEn,
      onExit,
      updateMiniMap,
      updateResponseNodes
    ]
  );
  useEffect(() => {
    const cont = contentRef.current;
    if (!cont) return;
    if (!isReady) return;

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        updaterC(highlights, cont);
      })
    );
    return () => {
      cont.removeEventListener("mouseup", containerMouseUp, false);
      const highlightedNodes = cont.querySelectorAll(".highlighted");
      highlightedNodes.forEach((e) => {
        e.removeEventListener("click", handleHighlightClick);
        e.removeEventListener("mouseenter", onEn);
        e.removeEventListener("mouseleave", onExit);
      });
    };
  }, [
    highlights,
    updaterC,
    isReady,
    naved,
    containerMouseUp,
    handleHighlightClick,
    onEn,
    onExit
  ]);

  const updateColors = useRef<
    (props: {
      targets: HTMLElement[];
      fromColor: HighlightColors;
      toColor: HighlightColors;
    }) => void
  >(null!);
  const addListeners = useCallback(
    (targets: HTMLElement[]) => {
      targets.forEach((e) => {
        e.addEventListener("click", handleHighlightClick);
      });
    },
    [handleHighlightClick]
  );
  useGSAP(
    () => {
      updateColors.current = (props) => {
        const { targets, fromColor, toColor } = props;
        const from = HighlightPalette[fromColor];
        const to = HighlightPalette[toColor];
        gsap.to(targets, {
          onStart: () => {
            targets.forEach((e) => {
              e.classList.remove("highlighted");
              e.removeEventListener("click", handleHighlightClick);
            });
          },
          delay: 0.05,
          backgroundImage: `linear-gradient(to left, oklch(${from}/.01) 0%, okclh(${from}/.1) 40%, oklch(${to}/.01) 50%, oklch(${to}/.85) 100%)`,
          onComplete: () => {
            targets.forEach((e) => {
              e.classList.add("highlighted");
            });
            addListeners(targets);
            gsap.to(targets, {
              delay: 0.2,
              clearProps: "backgroundImage"
            });
          },
          duration: 0.2,
          ease: "power2.inOut"
        });
      };
    },
    { dependencies: [handleHighlightClick, addListeners], scope: containerRef }
  );

  useEffect(() => {
    const targets = Array.from(highlights.values()).reduce(
      (r, e) => [...r, ...(e.els as HTMLElement[])],
      [] as HTMLElement[]
    );
    targets.length > 0 &&
      updateColors.current &&
      updateColors.current({
        targets,
        fromColor: lastColorRef.current,
        toColor: currentColor
      });
  }, [highlights, currentColor]);

  const handleHighlightSaveOrDelete: MouseEventHandler<HTMLButtonElement> =
    useCallback(
      async (e) => {
        e.stopPropagation();
        if (!userId) {
          errorToast("You must be checked in to save highlights.");
          return;
        }
        if (postDisabled) {
          errorToast("You can't save highlights on a disabled post.");
          return;
        }
        if (focusedHighlight) {
          await deleteHighlight({
            hr: highlights,
            userId: userId,
            fh: focusedHighlight
          });
        } else {
          await createHighlight({ private: false }).catch((e) => {
            if (e instanceof HighlightCreateError) {
              errorToast(e.message);
            } else {
              errorToast(t("Highlights.error.save.default"));
            }
          });
        }
      },
      [
        postDisabled,
        focusedHighlight,
        deleteHighlight,
        highlights,
        userId,
        createHighlight,
        t
      ]
    );
  const handleUpdateHighlight = useCallback(
    async (fc: HighlightedRange) => {
      const c = await updateHighlight(fc)
        .then((r) => {
          if (!r) throw new HighlightCreateError("create");
          return r as HighlightedRange;
        })
        .catch((e) => {
          if (e instanceof HighlightCreateError) {
            throw e;
          }
          throw new HighlightCreateError("unknown");
        });
      return c;
    },
    [updateHighlight]
  );
  const lastVisi = useRef(visi);
  useEffect(() => {
    if (lastVisi.current !== visi) {
      lastVisi.current = visi;
      if (!lastVisi.current) setCursor(null);
    }
  }, [visi, setCursor]);

  const findTextNode = useCallback((e: Node, offsetValue: number) => {
    let a = 0;
    const traverseNodes = (e: Node): null | { node: Text; offset: number } => {
      if (e.nodeType === Node.TEXT_NODE) {
        const tt = e as Text;
        if (a + tt.length >= offsetValue) {
          return {
            node: tt,
            offset: offsetValue - a
          };
        }
        a += tt.length;
      } else {
        for (const t of e.childNodes) {
          const result = traverseNodes(t);
          if (result) {
            return result;
          }
        }
      }
      return null;
    };
    return traverseNodes(e);
  }, []);
  const applyHighlightCallback = useCallback(
    (t: Omit<ProcessedRangy, "author"> & { author: AuthorOverview }) => {
      const base = contentRef.current;
      if (!base) return;
      const { text: a } = t.selection;
      const n = base.textContent?.indexOf(a) || -1;
      if (n === -1) {
        return false;
      }
      const i = n + a.length;
      const o = findTextNode(base, n);
      const s = findTextNode(base, i);
      if (!o || !s) {
        return false;
      }
      const r = ranger.createRange();
      r.setStart(o.node, o.offset);
      r.setEnd(s.node, s.offset);
      const l = Array.from(base.querySelectorAll(".highlighted"));
      const vv = ranger.getSelection();
      vv.setSingleRange(r);

      classApplier.applyToRange(r);

      // highlighterRef.current.highlightSelection(".highlighted");
      const h = Array.from(base.querySelectorAll(".highlighted")).filter(
        (e) => !l.includes(e)
      ) as HTMLElement[];
      h.forEach((el) => el.setAttribute("data-reference", t.reference));
      const c = {
        id: t.id,
        cited: t.cited as string,
        private: t.private,
        memo: t.memo,
        reference: t.reference,
        path: t.path,
        quote: t.quote,
        createdAt: t.createdAt,
        author: t.author,

        range: r,
        els: h,
        color:
          (Palettes.find(
            (r) => (r as string) === t.color
          ) as null | HighlightColors) || currentColorRef.current,
        selection: {
          text: a,
          before: `"...`,
          after: `..."`
        },
        updatedAt: t.updatedAt
      } satisfies HighlightedRange;
      const { startOffset, endOffset, startContainer, endContainer } = r;
      if (
        startContainer.nodeType === Node.TEXT_NODE &&
        base.contains(startContainer) &&
        (startContainer as Text).data
      ) {
        c.selection.before = (startContainer as Text).data.substring(
          startOffset - 10,
          startOffset
        );
      } else if (
        startContainer.previousSibling &&
        base.contains(startContainer.previousSibling) &&
        (startContainer.previousSibling as Text).data
      ) {
        c.selection.before = (
          startContainer.previousSibling as Text
        ).data.substring(
          (startContainer.previousSibling as Text).data.length - 10
        );
      } else {
        return;
      }
      if (
        endContainer.nodeType === Node.TEXT_NODE &&
        (endContainer as Text).data
      ) {
        c.selection.after = (endContainer as Text).data.substring(
          endOffset,
          endOffset + 10
        );
      } else if (
        endContainer.nextSibling &&
        base.contains(endContainer.nextSibling) &&
        endContainer.nextSibling.nodeType === Node.TEXT_NODE &&
        (endContainer.nextSibling as Text).data
      ) {
        c.selection.after = (endContainer.nextSibling as Text).data.substring(
          0,
          10
        );
      } else {
        return;
      }

      updateColors.current &&
        updateColors.current({
          targets: h,
          fromColor: lastColorRef.current,
          toColor: currentColorRef.current
        });
      vv.removeAllRanges();
      return c;
    },
    [classApplier, findTextNode, ranger]
  );
  const hasRun = useRef(false);
  useEffect(() => {
    if (!hPending && !hLoading) {
      if (hSuccess && savedHighlights) {
        const ss = savedHighlights.flatMap((c) => {
          const r = applyHighlightCallback(c);
          return r ? r : [];
        });
        if (ss.length > 0) addHighlighter(ss);
      }
    }
  }, [
    savedHighlights,
    applyHighlightCallback,
    hSuccess,
    hPending,
    hLoading,
    addHighlighter
  ]);
  useLayoutEffect(() => {
    if (hasRun.current) return;
    if (!isReady) return;

    const cont = contentRef.current;
    if (postDisabled || !userId || !cont) {
      return () => {};
    }
    const ratio = window.innerHeight / cont.offsetHeight;
    ratioRef.current = Math.max(0.25, ratio);
    setContainerBounds(ratio);

    if (direction !== null) {
      qc.invalidateQueries({ queryKey: ["savedHighlights"] });
    }
    hasRun.current = true;

    return () => {
      const e = cont.querySelectorAll("mark.highlighted");
      e.forEach((e) => {
        e.removeEventListener("click", handleHighlightClick);
      });
      hasRun.current = false;
    };
  }, [
    savedHighlights,
    isReady,
    applyHighlightCallback,
    handleHighlightClick,
    postDisabled,
    pathName,
    userId,
    addHighlighter,
    direction,
    qc
  ]);

  return (
    <>
      <div
        className="pointer-events-none absolute top-0 left-[18px] z-[30] h-full w-[calc(100%-36px)] border-0 border-x-[1px] border-solid border-x-muted-faded-foreground opacity-20"
        style={{
          borderImage: "initial"
        }}
      />
      <div className="h-full w-full">
        <div className="z-[3] h-full w-full">
          <div className={"w-full"}>
            <article
              className="rp-article relative w-full"
              data-id={postId}
              data-themed="background-color,color"
            >
              <FeaturedCard post={post} />
              <div
                className="mx-auto my-[28px] w-full max-w-[var(--maxContainerWidth)] px-0 py-[32px]"
                ref={containerRef}
              >
                <div
                  className="rp-content [&>*]:col-[main] [&>aside]:col-3"
                  ref={contentRef}
                >
                  <Aside>
                    <ResponseMap responseNodes={responseNodes} />
                    {privateNodes.map((r) => (
                      <PrivateIndicator
                        key={r.reference}
                        top={r.top}
                        reference={r.reference}
                      />
                    ))}
                  </Aside>
                  {locked || disabled ? (
                    <LockedGate id={postId} collection={"posts"} />
                  ) : (
                    <RichText data={postContent} enableGutter={false} />
                  )}
                </div>
              </div>
              <div className="f-divider mt-[50px] h-[1px] w-full min-w-[1px]" />
              <SignedFooter />
            </article>
          </div>
          {/*<HighlightMenu createCallback={createHighlight} target={{*/}
          {/*	relationTo: "posts", value: postId, authorId: post.author.id,*/}
          {/*}} visible={render} top={menuTop} left={menuLeft} handleUpdate={handleUpdateHighlight}*/}
          {/*               handleSaveHighlight={handleHighlightSaveOrDelete}*/}
          {/*               handleChangeHighlightColor={changeCurrentHighlightColor} />*/}
          {
            <FloatHighlightMenu
              ref={refs.setFloating}
              handleSaveHighlight={handleHighlightSaveOrDelete}
              handleChangeHighlightColor={changeCurrentHighlightColor}
              handleUpdate={handleUpdateHighlight}
              createCallback={createHighlight}
              floatingStyles={floatingStyles}
              style={{}}
              status={status}
              {...getFloatingProps()}
              mounted={isMounted}
            />
          }
          <MiniMap highlightMap={highlightMap} scaleRatio={containerBounds} />
        </div>
      </div>
      <div className="fixed right-0 bottom-[30px] left-0 z-[120] mx-auto mb-[24px] w-full">
        <div className={"grid grid-cols-[auto_1fr_auto] items-stretch gap-y-5"}>
          <div className="relative col-[2] justify-self-center">
            <AnimatePresence mode={"sync"} initial={true} propagate={true}>
              <DynamicBreadcrumb title={post.title} progress={progress}>
                <BookmarkButton
                  postId={postId}
                  userId={userId}
                  collection={"posts"}
                />
              </DynamicBreadcrumb>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
};
const ResponseMap = ({
  responseNodes
}: {
  responseNodes: Array<{ top: number; reference: string }>;
}) => {
  const responseNodeEls = useRef<HTMLDivElement[]>([]);
  const lastResize = useWindowResize({
    debounce: 100,
    detectHeightChange: true,
    detectVisibilityChange: true
  });
  const { contextSafe } = useGSAP();
  const updatePositions = useMemo(
    () =>
      contextSafe((v: HTMLDivElement[]) => {
        gsap.killTweensOf(v);
        gsap.to(v, {
          autoAlpha: 0,
          duration: 0.2,
          ease: "power2.inOut",
          onComplete: () => {
            v.forEach((r) => {
              const reference = r.getAttribute("data-reference");
              if (!reference) return;
              const el = document.querySelector(
                'mark[data-reference="' + reference + '"]'
              ) as HTMLElement | null;
              if (!el) return;
              gsap.set(el, {
                top: r.offsetTop
              });
            });
          }
        });
        gsap.to(v, {
          autoAlpha: 1,
          delay: 0.3,
          duration: 0.2,
          ease: "power2.inOut"
        });
      }),
    [contextSafe]
  );
  useEffect(() => {
    const r = responseNodeEls.current;
    updatePositions(r);
    return () => {
      gsap.killTweensOf(r);
    };
  }, [lastResize, updatePositions]);
  return (
    <>
      {responseNodes.map((r, i) => (
        <ResponseIndicator
          top={r.top}
          reference={r.reference}
          key={r.reference + "Response"}
          ref={(el) => {
            el && (responseNodeEls.current[i] = el);
          }}
        />
      ))}
    </>
  );
};
const BookmarkButton = ({
  postId,
  userId,
  collection
}: {
  postId: string;
  userId: string;
  collection: Bookmark["target"]["relationTo"];
}) => {
  const qc = useQueryClient();
  const where = useMemo(
    () =>
      ({
        and: [
          {
            "target.value": {
              equals: postId
            }
          },
          {
            user: {
              equals: userId
            }
          },
          {
            "target.relationTo": {
              equals: `${collection}`
            }
          }
        ]
      }) as Where,
    [userId, postId, collection]
  );
  const [initialized, setInitialized] = useState(false);
  const fetcher = useCallback(async () => {
    const r = await fetch(
      `/api/bookmarks/count/${stringify(where, { addQueryPrefix: true })}`
    );
    if (r.ok) {
      const res = (await r.json()) as {
        totalDocs: number;
      };
      setInitialized(true);
      return res.totalDocs > 0;
    }
    throw new Error("Not found");
  }, [where]);
  const {
    refetch,
    data: hasBookmark,
    isPending,
    isError,
    isFetching,
    isSuccess
  } = useQuery({
    queryKey: ["bookmarks", userId, postId, collection],
    queryFn: fetcher,
    enabled: !initialized
  });
  const [bookmarked, setBookmarked] = useState(Boolean(hasBookmark));
  useEffect(() => {
    if (!isPending) {
      setBookmarked(hasBookmark || false);
    }
  }, [hasBookmark, isPending, isSuccess, isError]);
  const removeBookmark = useRPSession((r) => r.deleteBookmark);
  const addBookmark = useRPSession((r) => r.addBookmark);
  const hasBookmarkRef = useRef(!!hasBookmark);
  useEffect(() => {
    hasBookmarkRef.current = !!hasBookmark;
  }, [hasBookmark]);
  const dB = useCallback(async () => {
    const args = stringify({ where }, { addQueryPrefix: true });
    const res = await fetch(`/api/bookmarks/${args}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(
        async (r) => (await r.json()) as { docs: Bookmark[]; errors: object[] }
      )
      .then((r) => {
        if (r.docs && r.docs.length > 0) {
          return r.docs[0] as Bookmark;
        }
        return null;
      })
      .catch((e) => {
        console.log(e);
        return null;
      });
    if (res) {
      removeBookmark({
        collection: res.target.relationTo as Bookmark["target"]["relationTo"],
        id: res.target.value as string
      });
      return true;
    }
    return false;
  }, [removeBookmark, where]);
  const body = useMemo(
    () =>
      ({
        target: {
          relationTo: collection,
          value: postId
        },
        user: userId
      }) as Omit<Bookmark, "id" | "createdAt" | "updatedAt">,
    [postId, userId, collection]
  );
  const cB = useCallback(async () => {
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify(body)
    })
      .then(
        async (r) => (await r.json()) as { doc: Bookmark; message: object[] }
      )
      .then((r) => {
        if (r.doc) {
          return r.doc as Bookmark;
        }
        return null;
      })
      .catch((e) => {
        console.log(e);
        return null;
      });
    if (res) {
      addBookmark({
        id: res.target.value as string,
        collection: res.target.relationTo as Bookmark["target"]["relationTo"]
      });
      return true;
    }

    return false;
  }, [body, addBookmark]);
  const createBookmark = useMutation({
    mutationFn: cB,
    onSuccess: (res) => {
      if (res) {
        qc.setQueryData(["bookmarks", userId, postId, collection], true);
      }
    }
  });
  const deleteBoookmark = useMutation({
    mutationFn: dB,
    onSuccess: (res) => {
      if (res) {
        qc.setQueryData(["bookmarks", userId, postId, collection], false);
      }
    }
  });
  const bookmarkSaveOrDelete: MouseEventHandler = useCallback(
    async (e) => {
      e.preventDefault();
      if (hasBookmark) {
        deleteBoookmark.mutate();
      } else {
        createBookmark.mutate();
      }
    },
    [deleteBoookmark, createBookmark, hasBookmark]
  );
  return !userId || !postId ? (
    <></>
  ) : (
    <div className={"flex h-8 min-w-8"}>
      <MotionBtn
        transition={{ type: "spring", bounce: 0.4 }}
        whileTap={{ scale: 0.9 }}
        whileHover={{
          scale: 1.1
        }}
        onClick={bookmarkSaveOrDelete}
        className={
          "flex h-full items-center justify-center [&_path]:fill-muted-faded-background/55 [&_path]:stroke-none [&_path]:outline-none dark:[&_path]:fill-muted-faded-foreground/55 [&_svg]:size-8"
        }
        disabled={isFetching || isPending}
      >
        {bookmarked ? <BookmarkFilledIcon /> : <BookmarkIcon />}
      </MotionBtn>
    </div>
  );
};

export type HighlightMenuProps = {
  visible: boolean;
  top: number | null;
  left: number | null;

  createCallback: (
    prop: Pick<RangeSaveParams, "memo" | "private">
  ) => Promise<HighlightedRange>;
  handleSaveHighlight: (e: MouseEvent<HTMLButtonElement>) => void;
  handleChangeHighlightColor: (color: HighlightColors) => void;

  handleUpdate: (fc: HighlightedRange) => Promise<HighlightedRange>;
  target: {
    relationTo: HighlightsCollectionSlug;
    value: string;
    authorId: string;
  };
};

const ResponseIndicator = (
  props: ComponentPropsWithRef<"div"> & {
    top: number;
    reference: string;
  }
) => {
  const { top, ref, reference: refer, ...rest } = props;
  const highlights = useHighlighter(useShallow((r) => r.highlights));
  const setOpen = useHighlightSidebar("setOpen");
  const setContent = useHighlightSidebar("setContent");

  const onClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      const tg = highlights.get(refer) || null;
      if (tg && tg.memo && tg.memo.length) {
        setContent({
          author: tg.author,
          createdAt: tg.createdAt,
          memo: tg.memo,
          quote: tg.quote!,
          reference: tg.reference,
          updatedAt: tg.updatedAt
        });
      } else {
        setContent(null);
      }
      setOpen(true);
    },
    [highlights, setOpen, refer, setContent]
  );

  return (
    <div
      style={{ top: `${props.top}px` }}
      className={
        "absolute mt-1 flex max-w-full items-center gap-3 whitespace-nowrap"
      }
      ref={ref}
      {...rest}
    >
      <div className={"relative"}>
        <Button
          onClick={onClick}
          className="z-[30] flex aspect-[4/3] h-[var(--text-base)] w-auto items-center justify-center rounded-[5px_5px_5px_0] border-[1px] border-muted bg-background px-[3px] py-[2px] text-center text-[calc(var(--text-base)*0.55)] whitespace-nowrap dark:border-muted-faded-foreground dark:bg-faded-background"
        >
          <span
            className={
              "absolute -bottom-[3px] left-[0.5px] z-[20] h-[4.5px] w-[4.5px] bg-background [clip-path:polygon(0_0,0_100%,100%_0)] dark:bg-faded-background"
            }
          />
          <span
            className={
              "absolute bottom-[-6px] -left-[0.5px] z-[15] h-[7px] w-[6px] bg-muted [clip-path:polygon(0_0,0_100%,100%_0)] dark:bg-muted-faded-foreground"
            }
          />
          <span className="leading-[1.5] uppercase">1</span>
        </Button>
      </div>
    </div>
  );
};

const PrivateIndicator = (
  props: ComponentPropsWithoutRef<"div"> & {
    top: number;
    reference: string;
  }
) => {
  const { top, reference: refer, ...rest } = props;

  const setOpen = usePrivateNote((r) => r.setOpen);
  const setView = usePrivateNote((r) => r.setView);
  const setFocusedHighlight = useHighlighter((r) => r.setFocusedHighlight);

  const onClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      setFocusedHighlight(refer);
      setView("view");
      setOpen(true);
    },
    [setFocusedHighlight, refer, setView, setOpen]
  );

  return (
    <div
      style={{ transform: `translateY(${props.top}px)` }}
      className={"flex items-center gap-2"}
      {...rest}
    >
      <div className={"relative"}>
        <Button
          onClick={onClick}
          className="z-[30] flex aspect-[4/3] h-[var(--text-base)] w-auto items-center justify-center rounded-[5px_5px_5px_0] border-[1px] border-muted bg-background px-[3px] py-[2px] text-center text-[calc(var(--text-base)*0.55)] whitespace-nowrap dark:border-muted-faded-foreground dark:bg-faded-background"
        ></Button>
      </div>
    </div>
  );
};

const Aside = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <style>
        {`
			aside > div{
			 max-width: 100%;
			 position:absolute;
			 display:flex;
			 align-items:center;
			 white-space:nowrap;
			 width: 100%;
			 margin-left:20px;
			 margin-top:2px;
			 gap:8px;
			}
			`}
      </style>
      <aside className={"top-0"}>{children}</aside>
    </>
  );
};

export const HighlightMenuButton = ({
  children,
  className,
  focusedHighlight = true,
  ...props
}: ComponentPropsWithRef<"button"> & { focusedHighlight?: boolean }) => {
  return (
    <Button
      className={cn(
        "z-[10] flex items-center border-0 border-r-[1px] border-dashed !border-faded-background/90 bg-transparent px-[16px] py-0 text-base leading-0 font-light tracking-[0.05rem] text-faded-background/90 antialiased transition-colors ease-in-out-2 last-of-type:border-r-0 hover:text-piercing-orange hover:[&_path]:fill-piercing-orange [&_svg]:inline-block nth-of-type-[2]:[&_svg]:-left-[0.25px] nth-last-of-type-[2]:[&_svg]:left-[0.5px]",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};
export const MenuButtonCaption = ({
  children,
  pre = "[",
  post = "]",
  icon = true,
  className,
  ...props
}: ComponentPropsWithRef<"div"> & {
  pre?: string;
  post?: string;
  icon?: boolean;
}) => {
  return (
    <div
      className={cn(
        "mb-[2px] ml-[6px] flex items-center text-base [&_svg]:relative [&_svg]:top-[0.5px]",
        className,
        icon
          ? "lowercase"
          : "border-r-px border-dashed border-faded-background/80"
      )}
      {...props}
    >
      {icon ? (
        <>
          {pre}
          {children}
          {post}
        </>
      ) : (
        <>{children}</>
      )}
    </div>
  );
};
const MiniMapItem = ({
  onMouseEnter: onEnter,
  onMouseLeave: onLeave,
  style,
  ...props
}: ComponentPropsWithRef<"div">) => {
  const { onMouseEnter, onMouseLeave } = useDomCursor({
    onEnter,
    onLeave
  });
  const color = useHighlighter(useShallow((r) => r.currentColor));
  return (
    <div
      className="pointer-events-auto absolute top-0 left-0 z-10 h-[3px] w-full border-0 border-b-[1px] border-foreground/20 transition-all duration-200 ease-out-power2 hover:-top-[3px] hover:h-[10px]"
      {...props}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        backgroundColor: `color-mix(in oklch,oklch(${HighlightPalette[color]}/1) 85%,var(--color-faded-white))`,
        ...style
      }}
    ></div>
  );
};
const MiniMap = ({
  highlightMap,
  scaleRatio,
  ...props
}: ComponentPropsWithoutRef<"div"> & {
  highlightMap: Array<{
    y: number;
    top: number;
  }>;
  scaleRatio: number;
}) => {
  const currentColor = useHighlighter(useShallow((r) => r.currentColor));
  const mapBackdropRef = useRef<HTMLDivElement>(null!);
  const mapTrackRef = useRef<HTMLDivElement>(null!);
  const highMaps = useRef<HTMLDivElement[]>([]);
  const lastResize = useWindowResize({
    detectVisibilityChange: false,
    detectHeightChange: true
  });
  const lenis = useLenis();
  const [scale, setScale] = useState(1);
  useEffect(() => {
    setScale(scaleRatio);
  }, [lastResize, scaleRatio]);

  useGSAP(() => {
    highMaps.current.forEach((e, t) => {
      const y = highlightMap[t]?.top;
      if (!y) return;
      gsap.to(e, {
        translateY: y * scale,
        duration: 0.1,
        ease: "power2.inOut"
      });
    });
  }, [scale]);
  return (
    <div
      className="pointer-events-none fixed top-[55px] right-[40px] bottom-[50px] z-[250] w-[24px] origin-[0_0] scale-x-50 overflow-hidden transition-transform duration-200"
      ref={mapTrackRef}
      {...props}
    >
      <div
        ref={mapBackdropRef}
        className="absolute h-full w-full origin-[100%_0]"
      ></div>
      {highlightMap.map((e, t) => (
        <MiniMapItem
          ref={(el) => {
            el && (highMaps.current[t] = el);
          }}
          onClick={() => {
            lenis?.scrollTo(e.y - 250);
          }}
          key={"highMap" + t}
          color={currentColor}
          style={{ transform: `translateY(${e.top}px)` }}
        />
      ))}
    </div>
  );
};
