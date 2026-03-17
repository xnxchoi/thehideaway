"use client";
import { useAdminCursor } from "@/hooks/useAdminCursor";
import { cn } from "@/lib/utils";
import { Toaster } from "@/payload/components/sonner";
import PC from "@/payload/providers/Admins/cssClasses";
import {
  createVaultStore,
  createWriterStore,
  VaultStore,
  WriterStore
} from "@/payload/stores";
import { QueryProvider } from "@/providers/QueryProvider";
import { DeviceProvider } from "@/providers/RP_Pro";

import { AdminThemeProvider, useTheme } from "@/providers/Theme";
import { useConfig, useNav } from "@payloadcms/ui";
import { ReactLenis, useLenis } from "lenis/react";
import { LazyMotion } from "motion/react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import {
  createContext,
  type Dispatch,
  type FC,
  type MouseEventHandler,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { StoreApi, useStore } from "zustand";
import { AdminMiddleMan } from "./MiddleMen";

type EventCursor = {
  listener: (e: MouseEvent) => void;
  callback: [(e: HTMLElement) => void];
  qualifiers: string[];
};
type CursorManager = {
  hover: EventCursor[];
  click: EventCursor[];
};
type TopLayerInterface = {
  open: boolean;
  miscOpen: boolean;
  setMiscOpen: (state: boolean) => void;
  contextMenuOpen: boolean;
  setContextMenuOpen: (state: boolean) => void;
  dialogOpen: boolean;
  setDialogOpen: (state: boolean) => void;
};

type UserBarNav = {
  open: boolean;
  setOpen: (state: boolean) => void;
};
type PideBarStore = {
  held: boolean;
  setHeld: (state: boolean) => void;
  enabled: boolean;
  peeked: boolean;
  setEnabled: (state: boolean) => void;
  toggle: () => void;
  setState: (state: boolean) => void;
  setPeeked: Dispatch<SetStateAction<boolean>>;
  open: boolean;
};
const OpenStateCTX = createContext<TopLayerInterface | null>(null);
const OpenStateProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [miscOpen, _setMiscOpen] = useState(false);
  const setMiscOpen = useCallback((r: boolean) => {
    _setMiscOpen(r);
  }, []);
  useEffect(() => {
    setOpen(contextMenuOpen || dialogOpen || miscOpen);
  }, [contextMenuOpen, dialogOpen, miscOpen]);
  return (
    <OpenStateCTX.Provider
      value={{
        open,
        miscOpen,
        setMiscOpen,
        contextMenuOpen,
        setContextMenuOpen,
        dialogOpen,
        setDialogOpen
      }}
    >
      {children}
    </OpenStateCTX.Provider>
  );
};
export const useOpenState = <T,>(selector: (store: TopLayerInterface) => T) => {
  const gg = useContext(OpenStateCTX);
  if (!gg) {
    throw new Error("useOpenState must be used within a OpenStateProvider");
  }
  return selector(gg);
};
const UserBarContext = createContext<UserBarNav>(null!);
const UserBarProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <UserBarContext.Provider value={{ open, setOpen }}>
      {children}
    </UserBarContext.Provider>
  );
};
export const useUserBarNav = <T,>(selector: (store: UserBarNav) => T) => {
  const gg = useContext(UserBarContext);
  if (!gg) {
    throw new Error("useUserBarNav must be used within a UserBarProvider");
  }
  return selector(gg);
};
type NavBarStore = {
  navFixed: boolean;
  setNavFixed: (state: boolean) => void;
  toggleNav: () => void;
  visible: boolean;
  setActive: (state: boolean) => void;
};
const NavbarContext = createContext<NavBarStore>(null!);
const NavbarProvider = ({ children }: { children: ReactNode }) => {
  const { navOpen: navFixed, navRef, setNavOpen: setNavFixed } = useNav();
  const setNavOpen = useVault((r) => r.setNavIsOpen);
  const navEl = useRef<HTMLDivElement>(null!);
  const lastNavState = useRef(navFixed);
  const lastVisible = useRef(false);
  const userBarOpen = useUserBarNav((r) => r.open);
  const toggleNav = useCallback(() => {
    setNavFixed(!lastNavState.current);
  }, [setNavFixed]);
  const [float, setFloat] = useState(false);
  const [hovered, setHovered] = useState(false);

  const path = usePathname();
  const lenis = useLenis();

  const isSet = useRef(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    visible ? lenis?.stop() : lenis?.start();
    const naver = navEl.current;
    naver && naver.classList[visible ? "add" : "remove"]("hovered");
    if (!navFixed) {
      if (navButton.current) {
        navButton.current.classList[visible ? "add" : "remove"]("hovered");
      }
    }

    lastVisible.current = visible;
  }, [lenis, visible, navFixed]);
  const lastHovered = useRef(hovered),
    lastFloat = useRef(float);
  useEffect(() => {
    lastHovered.current = hovered;
    lastFloat.current = float;
  }, [hovered, float]);
  useEffect(() => {
    setVisible(navFixed ? float : hovered || float || userBarOpen);
  }, [float, hovered, navFixed, userBarOpen]);
  useEffect(() => {
    setNavOpen(visible);
  }, [visible, setNavOpen]);
  const setActive = useCallback((state: boolean) => {
    if (state) {
      setVisible(true);
    } else {
      setVisible(lastFloat.current || lastHovered.current || false);
    }
  }, []);
  const navButton = useRef<HTMLButtonElement>(null!);
  const navContainer = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    if (!navRef.current) return;
    if (isSet.current) return;
    const navContCandidates = document.querySelectorAll(
      PC.templates
        .map((r) => `.${PC.wrapped}-${r}`)
        .map((r) => r + "__" + "nav-toggler-wrapper")
        .join(",")
    );
    const navCont = navContCandidates.item(0) as HTMLDivElement | null;

    const navTog =
      (navCont &&
        (navCont.querySelector("button") as HTMLButtonElement | null)) ||
      null;
    const onEnter = () => {
      setFloat(true);
    };

    const onLeave = () => {
      setFloat(false);
    };

    const navwrap = navRef.current.parentElement as HTMLDivElement;
    navCont && (navContainer.current = navCont);
    navwrap && (navEl.current = navwrap);
    navTog && (navButton.current = navTog);
    if (navwrap) {
      navwrap.addEventListener("mouseenter", onEnter);
      navwrap.addEventListener("mouseleave", onLeave);
    }
    return () => {
      isSet.current = false;

      navwrap?.removeEventListener("mouseenter", onEnter);
      navwrap?.removeEventListener("mouseleave", onLeave);
      navEl.current = null!;
      navButton.current = null!;
    };
  }, [navRef, path]);
  useEffect(() => {
    if (navEl.current) {
      navEl.current.removeAttribute("inert");
      if (!navFixed) {
        const onEnter2 = () => {
          setHovered(true);
        };
        const onLeave2 = () => {
          setTimeout(() => {
            setHovered(false);
          }, 50);
        };
        navButton.current.addEventListener("mouseenter", onEnter2);
        navContainer.current.addEventListener("mouseleave", onLeave2);
      }
    }
    lastNavState.current = navFixed;
  }, [navFixed, navRef, path]);
  return (
    <NavbarContext.Provider
      value={{
        navFixed,
        toggleNav,
        setNavFixed,
        visible,
        setActive
      }}
    >
      {children}
    </NavbarContext.Provider>
  );
};
export const useRPNav = <T,>(selector: (store: NavBarStore) => T) => {
  const gg = useContext(NavbarContext);
  if (!gg) {
    throw new Error("useRPNav must be used within a NavbarProvider");
  }
  return selector(gg);
};
const PidebarContext = createContext<PideBarStore>(null!);
const PidebarProvider = ({ children }: { children: ReactNode }) => {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const [held, setHeld] = useState(false);
  const config = useConfig();
  const path = usePathname();
  const enabledState = useRef(enabled);
  const setState = useCallback(
    (state: boolean) => setOpen(enabledState.current ? state : false),
    []
  );
  const toggle = useCallback(
    () =>
      enabledState.current &&
      setOpen((state) => enabledState.current && !state),
    []
  );

  const regex = useMemo(() => {
    const adminPath = config.config.routes.admin.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const collectionSlugs = config.config.collections
      .map((c) => c.slug)
      .join("|");
    // Match: /admin/collections/{slug}/{id} or /admin/collections/{slug}/create
    return new RegExp(
      `^${adminPath}/collections/(${collectionSlugs})/(create|[a-zA-Z0-9_-]{1,50})$`
    );
  }, [config]);
  useEffect(() => {
    if (regex.test(path)) {
      enabledState.current = true;
      setEnabled(true);
    } else {
      enabledState.current = false;
      setEnabled(false);
    }
  }, [path, regex]);

  useEffect(() => {
    enabledState.current = enabled;
  }, [enabled]);

  const cleaner = useRef<null | (() => void)>(null);

  // const setNavInteractions = useCallback((n: HTMLDivElement) => {
  //   if (isSet.current) return null;

  //   if (navwrap) {
  //     const onEnter = () => {
  //       setFloat(true);
  //     };

  //     const onLeave = () => {
  //       setFloat(false);
  //     };

  //     navwrap.addEventListener("mouseenter", onEnter);
  //     navwrap.addEventListener("mouseleave", onLeave);
  //     isSet.current = true;
  //   }
  //   return null;
  // }, []);

  return (
    <PidebarContext.Provider
      value={{
        enabled,
        toggle,
        setState,
        open,
        peeked,
        setPeeked,
        setEnabled,
        held,
        setHeld
      }}
    >
      {children}
    </PidebarContext.Provider>
  );
};
export type ExternalImageItem = {
  source: "unsplash" | "local";
  sourceId: string;
  url: string;
};
export type ImageSearcherStore = {
  drawerOpen: boolean;
  setItem: (item: ExternalImageItem | null) => void;
  setSearcherOpen: (state: boolean) => void;
  toggleDrawer: () => void;
  selected?: null | ExternalImageItem;
};
const ImageSearcherCtx = createContext<ImageSearcherStore>(null!);
export const ImageSearchProvider = ({ children }: { children: ReactNode }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<ExternalImageItem | null>(null);
  const setItem = useCallback((item: ExternalImageItem | null) => {
    setSelected(item);
  }, []);
  const setSearcherOpen = useCallback((state: boolean) => {
    setDrawerOpen(state);
  }, []);
  const toggleDrawer = useCallback(() => {
    setDrawerOpen((state) => !state);
  }, []);
  return (
    <ImageSearcherCtx.Provider
      value={{ drawerOpen, setItem, setSearcherOpen, toggleDrawer, selected }}
    >
      {children}
    </ImageSearcherCtx.Provider>
  );
};
export const useImageSearcher = <T,>(
  selector: (store: ImageSearcherStore) => T
) => {
  const cc = useContext(ImageSearcherCtx);
  if (!cc) {
    throw new Error(
      "useImageSearcher must be used inside ImageSearcher provider"
    );
  }
  return selector(cc);
};
type AlternateDocCtrlStore = {
  peeked: boolean;
  setPeeked: (state: boolean) => void;
  togglePeeked: (state: boolean) => void;
};
const AlternateDocCtrlsContext = createContext<AlternateDocCtrlStore>(null!);
export const AlternateDocProvider = ({ children }: { children: ReactNode }) => {
  const [peeked, setPee] = useState(false);
  const togglePeeked = useCallback((state: boolean) => {
    setPee(state);
  }, []);
  const setPeeked = useCallback((state: boolean) => {
    setPee(state);
  }, []);
  return (
    <AlternateDocCtrlsContext.Provider
      value={{ peeked, setPeeked, togglePeeked }}
    >
      {children}
    </AlternateDocCtrlsContext.Provider>
  );
};
export const useAltDocCtrls = <T,>(
  selector: (store: AlternateDocCtrlStore) => T
) => {
  const cc = useContext(AlternateDocCtrlsContext);
  if (!cc) {
    throw new Error(
      "useAltDocCtrls must be used inside AlternateDocCtrls provider"
    );
  }
  return selector(cc);
};
export const useVaultSidebar = <T,>(selector: (store: PideBarStore) => T) => {
  const context = useContext(PidebarContext);
  if (!context) {
    throw new Error("useVaultSidebar must be used within PidebarProvider");
  }
  return selector(context);
};
const AMDKeyManager = ({ children }: { children: ReactNode }) => {
  const toggleTheme = useTheme((store) => store.toggleTheme);
  const toggleNav = useRPNav((r) => r.toggleNav);
  const theme = useTheme((r) => r.theme);
  const togglePide = useVaultSidebar((store) => store.toggle);
  const pideOpen = useVaultSidebar((store) => store.open);

  const pideEnabled = useVaultSidebar((store) => store.enabled);
  const pidePeeked = useVaultSidebar((store) => store.peeked);
  const setPeeked = useVaultSidebar((store) => store.setPeeked);
  const pider = useRef<HTMLDivElement>(null!);
  const keyPressed = useCallback(
    (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "m":
          case "M":
            return (e.preventDefault(), togglePide());
          case "h":
          case "H":
            return (e.preventDefault(), toggleTheme());
          case "u":
          case "U":
            return (e.preventDefault(), toggleNav());
        }
      }
    },
    [togglePide, toggleTheme, toggleNav]
  );
  const openRef = useRef(pideOpen),
    peekRef = useRef(pidePeeked),
    lastOpenRef = useRef(pideOpen);
  useEffect(() => {
    lastOpenRef.current = openRef.current;
    openRef.current = pideOpen;
    peekRef.current = pidePeeked;
  }, [pideOpen, pidePeeked]);
  const onEnter: MouseEventHandler = useCallback(
    (e) => {
      setPeeked(true);
    },
    [setPeeked]
  );

  const onLeave: MouseEventHandler = useCallback(
    (e) => {
      setPeeked(false);
    },
    [setPeeked]
  );

  useEffect(() => {
    document.addEventListener("keydown", keyPressed);
    return () => document.removeEventListener("keydown", keyPressed);
  }, [keyPressed]);
  return (
    <div
      id={"restored-vault"}
      className={cn("relative", {
        sidebar__wrapped: pideEnabled
      })}
      data-sidebar-open={pideOpen}
      data-sidebar-peek={pidePeeked}
      ref={pider}
      data-theme={theme}
    >
      {children}
      {pideEnabled && !pideOpen && (
        <div
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          className={cn(
            "fixed right-0 bottom-0 z-0 block w-[60px] bg-transparent"
          )}
          style={{
            top: pideOpen ? "0px" : "100px",
            bottom: "45px"
          }}
        />
      )}
    </div>
  );
};
const Middle = ({ children }: { children: ReactNode }) => {
  useAdminCursor();

  return (
    <OpenStateProvider>
      <UserBarProvider>
        <NavbarProvider>
          <PidebarProvider>
            <AMDKeyManager>
              <ImageSearchProvider>{children} </ImageSearchProvider>
            </AMDKeyManager>
          </PidebarProvider>
        </NavbarProvider>
      </UserBarProvider>
    </OpenStateProvider>
  );
};
const VaultContext = createContext<StoreApi<VaultStore> | null>(null);
const VaultProvider = ({ children }: { children: ReactNode }) => {
  const vaultStoreRef = useRef<StoreApi<VaultStore>>(null!);
  if (!vaultStoreRef.current) {
    vaultStoreRef.current = createVaultStore();
  }
  return (
    <VaultContext.Provider value={vaultStoreRef.current}>
      {children}
    </VaultContext.Provider>
  );
};
export const useVault = <T,>(selector: (store: VaultStore) => T) => {
  const v = useContext(VaultContext);
  if (!v) {
    throw new Error("useVuault must be used inside VaultProvider");
  }
  return useStore(v, selector);
};
const WriterContext = createContext<StoreApi<WriterStore> | null>(null);
export const WriterProvider = ({ children }: { children: ReactNode }) => {
  const writerStoreRef = useRef<StoreApi<WriterStore>>(null!);
  if (!writerStoreRef.current) {
    writerStoreRef.current = createWriterStore();
  }
  return (
    <WriterContext.Provider value={writerStoreRef.current}>
      {children}
    </WriterContext.Provider>
  );
};
export const useWriter = <T,>(selector: (store: WriterStore) => T) => {
  const w = useContext(WriterContext);
  if (!w) {
    throw new Error("useWriter must be used inside WriterProvider");
  }
  return useStore(w, selector);
};
const CoordinatorCtx = dynamic(
  () => import("@/providers/CoordinatorCtx").then((r) => r.CoordinatorCtx),
  { ssr: false }
);
const features = () => import("@/providers/Motion").then((r) => r.default);
const AdminsProviders: FC<{
  children: ReactNode;
}> = ({ children }) => {
  return (
    <VaultProvider>
      <QueryProvider>
        <DeviceProvider>
          <ReactLenis root={true}>
            <AdminThemeProvider>
              <LazyMotion features={features} strict={true}>
                <CoordinatorCtx>
                  <AdminMiddleMan>
                    <Middle>{children}</Middle>
                    <Toaster />
                  </AdminMiddleMan>
                </CoordinatorCtx>
              </LazyMotion>
            </AdminThemeProvider>
          </ReactLenis>
        </DeviceProvider>
      </QueryProvider>
    </VaultProvider>
  );
};
export default AdminsProviders;
