"use client";

import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState
} from "react";
import { useRoutePathname } from "@/lib/lostinseoul/domain-context";
import { type EntryPhase, useEntrySequence } from "./entry-motion";
import { isEntryPath } from "./routes";

type CartOpenState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

type SearchState = {
  query: string;
  setQuery: (query: string) => void;
};

type WatchVideoState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CartOpenCtx = createContext<CartOpenState | null>(null);
const SearchCtx = createContext<SearchState | null>(null);
const CommerceRootContext = createContext<RefObject<HTMLElement | null> | null>(
  null
);
const TransitionCtx = createContext<EntryPhase>("ready");
const SceneStateCtx = createContext<() => void>(() => undefined);
const WatchVideoCtx = createContext<WatchVideoState | null>(null);

export function ChromeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [watchOpen, setWatchOpen] = useState(false);
  const commerceRootRef = useRef<HTMLElement>(null);
  const cartOpen = useMemo(() => ({ open, setOpen }), [open]);
  const search = useMemo(() => ({ query, setQuery }), [query]);
  const watchVideo = useMemo(
    () => ({ open: watchOpen, setOpen: setWatchOpen }),
    [watchOpen]
  );

  return (
    <CartOpenCtx.Provider value={cartOpen}>
      <SearchCtx.Provider value={search}>
        <WatchVideoCtx.Provider value={watchVideo}>
          <CommerceRootContext.Provider value={commerceRootRef}>
            {children}
          </CommerceRootContext.Provider>
        </WatchVideoCtx.Provider>
      </SearchCtx.Provider>
    </CartOpenCtx.Provider>
  );
}

export function EntryProvider({ children }: { children: ReactNode }) {
  const pathname = useRoutePathname() ?? "";
  const [sceneReady, setSceneReady] = useState(false);
  const markSceneReady = useCallback(() => {
    setSceneReady(true);
  }, []);
  const phase = useEntrySequence(sceneReady, isEntryPath(pathname));

  return (
    <SceneStateCtx.Provider value={markSceneReady}>
      <TransitionCtx.Provider value={phase}>{children}</TransitionCtx.Provider>
    </SceneStateCtx.Provider>
  );
}

export function useCartOpen(): CartOpenState {
  const value = useContext(CartOpenCtx);
  if (!value) {
    throw new Error("useCartOpen must be used within ChromeProvider");
  }
  return value;
}

export function useSearch(): SearchState {
  const value = useContext(SearchCtx);
  if (!value) {
    throw new Error("useSearch must be used within ChromeProvider");
  }
  return value;
}

export function useCommerceRef(): RefObject<HTMLElement | null> {
  const value = useContext(CommerceRootContext);
  if (!value) {
    throw new Error("useCommerceRef must be used within ChromeProvider");
  }
  return value;
}

export function useEntry(): EntryPhase {
  return useContext(TransitionCtx);
}

export function useScene(): () => void {
  return useContext(SceneStateCtx);
}

export function useWatchVideo(): WatchVideoState {
  const value = useContext(WatchVideoCtx);
  if (!value) {
    throw new Error("useWatchVideo must be used within ChromeProvider");
  }
  return value;
}

export function CommerceMain({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useCommerceRef();
  const { open: cartOpen } = useCartOpen();
  const { open: watchOpen } = useWatchVideo();
  return (
    <div
      className={className}
      data-lost-cart-open={cartOpen ? "true" : "false"}
      data-lost-video-open={watchOpen ? "true" : "false"}
      ref={ref}
    >
      {children}
    </div>
  );
}
