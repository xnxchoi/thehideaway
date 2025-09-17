"use client";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";

import {
  createHAStore,
  createRafStore,
  createScrollStore,
  createTransStore,
  HA_SCROLLED,
  HA_VAULT,
  PhaseStep,
  RAF,
  RPT
} from "@/stores/RP_Ui";
import {
  createDeviceStore,
  DeviceStore,
  HA_DEVICE
} from "@/stores/Device/DeviceStore";
import { createCursorStore, HA_CURS } from "@/stores/Cursor/CursorStore";
import { useStore } from "zustand/index";
import { createSearchBarStore, RP_SearchBar } from "@/stores/CMDK/SearchStore";
import { createMenuStructure, RP_BluePrint } from "@/stores/Frame_Ctrl";
import { useVoyageur } from "@/stores/Routing/RP_Voyageur";
import { TransitionRouter } from "next-transition-router";
import InAppSpy from "inapp-spy";
import { isAIBot, isBot } from "ua-parser-js/helpers";
import { OSNames } from "@/stores/Device/browserNames";
import { UAParser } from "ua-parser-js";
import { getThumbmark } from "@thumbmarkjs/thumbmarkjs";
import { createId } from "@paralleldrive/cuid2";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";
import { gsap } from "gsap";
import { useTheme } from "./Theme";
import { useLenis } from "lenis/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { NavEventsProvider } from "@/providers/Navigation/_client-nav-events";

export type RafAPI = ReturnType<typeof createRafStore>;
export type HAAPI = ReturnType<typeof createHAStore>;
export type HACPI = ReturnType<typeof createCursorStore>;
export type DeviceAPI = ReturnType<typeof createDeviceStore>;
export type TransAPI = ReturnType<typeof createTransStore>;
export type ScrollAPI = ReturnType<typeof createScrollStore>;
export const DeviceContext = createContext<DeviceAPI | undefined>(undefined);
export const TransContext = createContext<TransAPI | undefined>(undefined);
export const HAStoreContext = createContext<HAAPI | undefined>(undefined);
export const CurContext = createContext<HACPI | undefined>(undefined);
export const RafContext = createContext<RafAPI | undefined>(undefined);
export const ScrollContext = createContext<ScrollAPI | undefined>(undefined);

export interface DeviceProviderProps {
  children: ReactNode;
}

export interface HAStoreProviderProps {
  children: ReactNode;
}

export interface CurProviderProps {
  children: ReactNode;
}

export interface TransProviderProps {
  children: ReactNode;
}

const IntDeviceProvider = ({ children }: DeviceProviderProps) => {
  const storeRef = useRef<DeviceAPI>(null!);
  if (!storeRef.current) {
    const uap = new UAParser();
    const isSpoofedIpad =
      /iPad/.test(navigator.platform) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const supportedBots = [
      "facebookexternalhit",
      "skypeuripreview",
      "baiduspider",
      "linkedinbot",
      "ia_archiver",
      "duckduckbot",
      "twitterbot",
      "googlebot",
      "yandexbot",
      "bingbot",
      "facebot",
      "tumblr",
      "slurp",
      "google (+https://developers.google.com/+/web/snippet/)",
      "https://developers.google.com/+/web/snippet/"
    ];
    const browser = uap.getBrowser();
    const os = uap.getOS() as UAParser.IOS & { name: OSNames };
    const device = uap.getDevice();
    const { isInApp, appName } = InAppSpy();
    const uaParsed = uap.getResult();
    const isbot = isAIBot(uaParsed) || isBot(uaParsed);
    const majorBrowsers = {
      chrome: browser.name === "Chrome",
      firefox: browser.name === "Firefox",
      safari: browser.name === "Safari"
    };
    const apps = {
      instagram: appName === "Instagram",
      pinterest: /pinterest/i.test(navigator.userAgent),
      facebook: appName === "Facebook",
      whatsApp: /whatsapp/i.test(navigator.userAgent),
      twitter:
        browser.name === "Twitter" ||
        appName === "Twitter" ||
        /twitter/i.test(navigator.userAgent),
      kakaotalk: browser.name === "KakaoTalk",
      weChat: browser.name === "WeChat" || appName === "WeChat",
      naver: browser.name === "Naver",
      threads: appName === "Threads",
      messenger: appName === "Facebook Messenger",
      line: appName === "Line" || browser.name === "Line",
      tikTok: appName === "TikTok" || browser.name === "TikTok"
    };
    const oss = {
      ios: os.name === "iOS",
      android: os.name === "Android",
      mac: os.name === "macOS",
      windows: os.name === "Windows",
      linux: os.name === "Linux",
      node: os.name === "node"
    };

    const isInAppGuess =
      Object.values(apps).some((v) => v) || isInApp || browser.type === "inapp";

    const l: HA_DEVICE = {
      fingerprint: null,
      device: {
        model: device.model || "Unknown",
        vendor: device.vendor || "Unknown",
        type: device.type || "Unknown"
      },
      browser: {
        type: isInAppGuess ? "inapp" : browser.type || "Unknown",
        name: browser.name || appName || "Unknown",
        inApp: isInAppGuess,
        isChrome: majorBrowsers.chrome,
        isSafari: majorBrowsers.safari
      },
      os: {
        name: isSpoofedIpad ? "ios" : (os.name ?? "Unknown"),
        isAndroid: oss.android,
        isIOS: oss.ios
      },
      isTouchDevice: navigator.maxTouchPoints > 0,
      isMobile: device.type === "mobile",
      isBot:
        isbot &&
        !!supportedBots.filter((bot: string) =>
          navigator.userAgent.toLowerCase().includes(bot.toLowerCase())
        ).length
    };
    storeRef.current = createDeviceStore({ ...l });
  }
  return (
    <DeviceContext.Provider value={storeRef.current}>
      {children}
    </DeviceContext.Provider>
  );
};
const Thumbprint = ({ children }: { children: ReactNode }) => {
  const setFingerprint = useDeviceInfo((r) => r.setFingerPrint);
  useEffect(() => {
    const thumbmark = getThumbmark();
    thumbmark
      .then((res) => {
        console.log("Fingerprinting complete:", res.thumbmark);
        setFingerprint(res.thumbmark);
      })
      .catch((e) => {
        console.error("Fingerprinting failed due to an error:", e);
        /**flimsy fallback to account for errors; this is done out of necessity as
         **/
        setFingerprint(createId());
      });
  }, [setFingerprint]);
  return <>{children}</>;
};
export const DeviceProvider = ({ children }: DeviceProviderProps) => {
  return (
    <IntDeviceProvider>
      <Thumbprint>{children}</Thumbprint>
    </IntDeviceProvider>
  );
};

export const ScrollProvider = ({ children }: { children: ReactNode }) => {
  const storeRef = useRef<ScrollAPI>(null!);
  if (!storeRef.current) {
    storeRef.current = createScrollStore();
  }
  return (
    <ScrollContext.Provider value={storeRef.current}>
      {children}
    </ScrollContext.Provider>
  );
};
export const useScroll = <T,>(selector: (store: HA_SCROLLED) => T): T => {
  const scrollContext = useContext(ScrollContext);
  if (!scrollContext) {
    throw new Error("useScroll must be used within ScrollProvider");
  }
  return useStore(scrollContext, selector);
};
export const HAStoreProvider = ({ children }: HAStoreProviderProps) => {
  const storeRef = useRef<HAAPI>(null!);
  if (!storeRef.current) {
    storeRef.current = createHAStore();
  }

  return (
    <HAStoreContext.Provider value={storeRef.current}>
      {children}
    </HAStoreContext.Provider>
  );
};
const TransitionManager = ({ children }: { children: ReactNode }) => {
  const setCurrentPhase = useRPTransition((l) => l.setCurrentPhase);
  const clearPageTheme = useTheme((l) => l.clearPageTheme);
  const currentPhase = useRPTransition((l) => l.currentPhase);
  const currentStep = useRPTransition((l) => l.currentStep);
  const getCallback = useRPTransition((l) => l.getCallback);
  const pageType = useVoyageur((l) => l.pageType);
  const setTransitionType = useRPStore((l) => l.setTransitionOutType);
  const scroll = useLenis();
  gsap.registerPlugin(ScrollTrigger);

  const scrollRefresher = useCallback(() => {
    scroll && scroll.resize();
  }, [scroll]);
  const slug = useVoyageur((l) => l.slug);
  const pageRef = useRef({ type: pageType, pageSlug: slug });
  const to = useRef<ReturnType<typeof setTimeout>>(null!);
  const cleanCallbacks = useRPTransition((l) => l.cleanCallbacks);
  const [currentPhaseStep, setCurrentPhaseStep] = useState<PhaseStep | null>(
    null
  );
  const pageIsTransitioning = useRPStore((l) => l.pageIsTransitioning);
  const setPageIsTransitioning = useRPStore((l) => l.setPageIsTransitioning);
  const setCanInteract = useRPStore((l) => l.setCanInteract);
  const setCursor = useCursorStore((r) => r.setCursorState);
  const resetCursorTheme = useCursorStore((r) => r.resetCursorTheme);
  const resetCursor = useCallback(
    () => (setCursor(null), resetCursorTheme()),
    [resetCursorTheme, setCursor]
  );
  const scrollToTop = useCallback(() => window.scroll(0, 0), []);

  return (
    <TransitionRouter
      leave={(next, from, to) => {
        gsap.to(".rp-container", {
          autoAlpha: 0,
          duration: 0.3,
          ease: "power2.inOut",
          onComplete: () => (
            scrollToTop(),
            setPageIsTransitioning(true),
            next(),
            clearPageTheme(),
            resetCursor()
          )
        });
      }}
      enter={(next, from, to) => {
        gsap.set(".rp-container", {
          autoAlpha: 0
        });
        gsap.fromTo(
          ".rp-container",
          {
            autoAlpha: 0
          },
          {
            onStart: () => {
              next();
              setCanInteract(false);
            },
            autoAlpha: 1,
            duration: 0.3,
            ease: "power2.inOut",
            delay: 0.2,
            onComplete: () => {
              setPageIsTransitioning(false);
              setCanInteract(true);
              document.body.style.setProperty("pointer-events", "auto");
            }
          }
        );
      }}
    >
      {children}
    </TransitionRouter>
  );
};
const TransContextProvider = ({ children }: TransProviderProps) => {
  const storeRef = useRef<TransAPI>(undefined);
  if (!storeRef.current) {
    storeRef.current = createTransStore();
  }
  return (
    <TransContext.Provider value={storeRef.current}>
      {children}{" "}
    </TransContext.Provider>
  );
};
export const TransProvider = ({ children }: TransProviderProps) => {
  return (
    <TransContextProvider>
      <TransitionManager>
        <NavEventsProvider>{children}</NavEventsProvider>
      </TransitionManager>
    </TransContextProvider>
  );
};
export const useRPTransition = <T,>(selector: (store: RPT) => T): T => {
  const transContext = useContext(TransContext);
  if (!transContext) {
    throw new Error("useRPTransition must be used within TransProvider");
  }
  return useStore(transContext, selector);
};
export const RafProvider = (l: { children: ReactNode }) => {
  const { children } = l;
  const animations = useRef(0);
  const [animationList, setAnimation] = useState<
    Record<string, (l?: any) => void>
  >({});
  const storeRef = useRef<RafAPI>(null!);
  if (!storeRef.current) {
    storeRef.current = createRafStore({
      addToRaf: ({ key, callback }) =>
        setAnimation({
          ...animationList,
          [key]: callback
        }),
      removeFromRaf: (l) =>
        setAnimation(() => (delete animationList[l], animationList))
    });
  }
  useEffect(() => {
    animations.current && cancelAnimationFrame(animations.current);
    const render = () => {
      Object.keys(animationList).forEach((l) => {
        animationList[l] && animationList[l]();
      });
      animations.current = requestAnimationFrame(render);
    };
    render();
  }, [animationList]);
  return (
    <RafContext.Provider value={storeRef.current}>
      {children}
    </RafContext.Provider>
  );
};
export const CurProvider = ({ children }: CurProviderProps) => {
  const sRef = useRef<HACPI>(null!);
  if (!sRef.current) {
    sRef.current = createCursorStore();
  }
  return (
    <CurContext.Provider value={sRef.current}>{children}</CurContext.Provider>
  );
};
export const useCursorStore = <T,>(selector: (store: HA_CURS) => T): T => {
  const haStoreContext = useContext(CurContext);
  if (!haStoreContext) {
    throw new Error(`useCursorStore must be used within CurStoreProvider`);
  }
  return useStoreWithEqualityFn(haStoreContext, selector, shallow);
};
export const useCursorAPI = () => {
  const haStoreContext = useContext(CurContext);
  if (!haStoreContext) {
    throw new Error(`useCursorStore must be used within CurStoreProvider`);
  }
  return haStoreContext;
};
export const useRPStore = <T,>(selector: (store: HA_VAULT) => T): T => {
  const haStoreContext = useContext(HAStoreContext);
  if (!haStoreContext) {
    throw new Error("useRPStore must be used within RPStoreProvider");
  }
  return useStore(haStoreContext, selector);
};
export const useRPStoreWithSelector = <T,>(
  selector: (store: HA_VAULT) => T
): [T, HAAPI] => {
  const haStoreContext = useContext(HAStoreContext);
  if (!haStoreContext) {
    throw new Error("useRPStore must be used within RPStoreProvider");
  }
  return [useStore(haStoreContext, selector), haStoreContext];
};

export const useRaf = <T,>(selector: (store: RAF) => T) => {
  const rafContext = useContext(RafContext);
  if (!rafContext) {
    throw new Error("useRafStore must be used within RafStoreProvider");
  }
  return useStore(rafContext, selector);
};
export type SearchAPI = ReturnType<typeof createSearchBarStore>;
const SearchBarContext = createContext<SearchAPI | undefined>(undefined);
export const SearchBarProvider = ({ children }: { children: ReactNode }) => {
  const searchBar = useRef<SearchAPI>(null!);
  if (!searchBar.current) {
    searchBar.current = createSearchBarStore();
  }
  return (
    <SearchBarContext.Provider value={searchBar.current}>
      {children}
    </SearchBarContext.Provider>
  );
};
export const useSearchBar = <T,>(selector: (store: RP_SearchBar) => T): T => {
  const searchBar = useContext(SearchBarContext);
  if (!searchBar) {
    throw new Error("useSearchBar must be used within a SearchBarProvider");
  }
  return useStore(searchBar, selector);
};
export const useDeviceInfo = <T,>(selector: (store: DeviceStore) => T) => {
  const deviceContext = useContext(DeviceContext);
  if (!deviceContext) {
    throw new Error("getDeviceInfo must be used within a DeviceProvider");
  }
  return useStore(deviceContext, selector);
};
type MenuAPI = ReturnType<typeof createMenuStructure>;
const MenuContext = createContext<MenuAPI | undefined>(undefined);
export const MenuProvider = ({ children }: { children: React.ReactNode }) => {
  const bleuContext = useRef<MenuAPI>(undefined);
  if (!bleuContext.current) {
    bleuContext.current = createMenuStructure();
  }

  return (
    <MenuContext.Provider value={bleuContext.current}>
      {children}
    </MenuContext.Provider>
  );
};
export const useMenu = <T,>(selector: (store: RP_BluePrint) => T): T => {
  const store = useContext(MenuContext);
  if (!store) {
    throw new Error("useMenu must be used within a MenuProvider");
  }
  return useStore(store, selector);
};
