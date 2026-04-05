"use client";

import { createSearchBarStore, RP_SearchBar } from "@/stores/CMDK/SearchStore";
import { createCursorStore, HA_CURS } from "@/stores/Cursor/CursorStore";
import { OSNames } from "@/stores/Device/browserNames";
import {
  createDeviceStore,
  DeviceStore,
  HA_DEVICE
} from "@/stores/Device/DeviceStore";
import {
  createMenuStructure,
  FrameSide,
  RP_BluePrint
} from "@/stores/Frame_Ctrl";

import { createHAStore, HA_VAULT } from "@/stores/RP_Ui";

import { createId } from "@paralleldrive/cuid2";
import { getThumbmark } from "@thumbmarkjs/thumbmarkjs";

import InAppSpy from "inapp-spy";
import { MotionValue, useMotionValue, useTransform } from "motion/react";
import { useTransitionState } from "next-transition-router";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef
} from "react";

import { UAParser } from "ua-parser-js";
import { useStore } from "zustand";
import { shallow, useShallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

export type HAAPI = ReturnType<typeof createHAStore>;
export type HACPI = ReturnType<typeof createCursorStore>;
export type DeviceAPI = ReturnType<typeof createDeviceStore>;

export const DeviceContext = createContext<DeviceAPI | undefined>(undefined);
export const HAStoreContext = createContext<HAAPI | undefined>(undefined);
export const CurContext = createContext<HACPI | undefined>(undefined);

export interface DeviceProviderProps {
  children: ReactNode;
}

export interface HAStoreProviderProps {
  children: ReactNode;
}

export interface CurProviderProps {
  children: ReactNode;
}

type OSEnvTestTargets =
  | "ios"
  | "android"
  | "mac"
  | "windows"
  | "linux"
  | "node";
type InAppTestTargets =
  | "instagram"
  | "pinterest"
  | "facebook"
  | "whatsApp"
  | "twitter"
  | "kakaotalk"
  | "weChat"
  | "naver"
  | "threads"
  | "messenger"
  | "line"
  | "tikTok";
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
    const majorBrowsers = {
      chrome: browser.name === "Chrome",
      firefox: browser.name === "Firefox",
      safari: browser.name === "Safari"
    };
    const apps: Record<InAppTestTargets, boolean> = {
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
    const oss: Record<OSEnvTestTargets, boolean> = {
      ios: false,
      android: false,
      mac: false,
      windows: false,
      linux: false,
      node: false
    };
    switch (os.name) {
      case "iOS":
        oss.ios = true;
        break;
      case "Android":
        oss.android = true;
        break;
      case "macOS":
        oss.mac = true;
        break;
      case "Windows":
        oss.windows = true;
        break;
      case "Linux":
        oss.linux = true;
        break;
      case "node":
        oss.node = true;
        break;
    }

    const inApp: boolean =
      isInApp ||
      browser.type === "inapp" ||
      Object.values(apps).some((v) => v) ||
      false;
    const l: HA_DEVICE = {
      fingerprint: null,
      device: {
        model: device.model || "Unknown",
        vendor: device.vendor || "Unknown",
        type: device.type || "Unknown"
      },
      browser: {
        type: inApp ? "inapp" : browser.type || "Unknown",
        name: browser.name || appName || "Unknown",
        inApp,
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
      isBot: !!supportedBots.filter((bot: string) =>
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
        setFingerprint(res.thumbmark);
      })
      .catch((e) => {
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
export const CursorProvider = ({ children }: CurProviderProps) => {
  const sRef = useRef<HACPI>(null!);
  if (!sRef.current) {
    sRef.current = createCursorStore();
  }
  return (
    <CurContext.Provider value={sRef.current}>{children}</CurContext.Provider>
  );
};

export const useCursor = <T,>(selector: (store: HA_CURS) => T): T => {
  const haStoreContext = useContext(CurContext);
  if (!haStoreContext) {
    throw new Error(`useCursorStore must be used within CurStoreProvider`);
  }
  return useStoreWithEqualityFn(haStoreContext, selector, shallow);
};
export const useRPStore = <T,>(selector: (store: HA_VAULT) => T): T => {
  const haStoreContext = useContext(HAStoreContext);
  if (!haStoreContext) {
    throw new Error("useRPStore must be used within RPStoreProvider");
  }
  return useStore(haStoreContext, selector);
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
type FramerAPI = {
  [x in FrameSide]: MotionValue<number>;
} & {
  navState: MotionValue<boolean>;
  activeKey: MotionValue<string | -1>;
  setActiveKey: (key: string | null | -1) => void;
  focusedKey: MotionValue<string | -1>;
  setFocusedKey: (key: string | null | -1) => void;
};
const FrameContext = createContext<FramerAPI | undefined>(undefined);
const MenuContext = createContext<MenuAPI | undefined>(undefined);
export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const bleuContext = useRef<MenuAPI>(undefined);
  if (!bleuContext.current) {
    bleuContext.current = createMenuStructure();
  }

  return (
    <MenuContext value={bleuContext.current}>
      <AMG>{children}</AMG>
    </MenuContext>
  );
};
export const useMenu = <T,>(selector: (store: RP_BluePrint) => T): T => {
  const store = useContext(MenuContext);
  if (!store) {
    throw new Error("useMenu must be used within a MenuProvider");
  }
  return useStore(store, selector);
};
export const useFrameState = <T,>() => {
  const store = useContext(FrameContext);
  if (!store)
    throw new Error("useFrameState must be used within a MenuProvider");
  return store;
};
export const useFrameFactor = <T,>(selector: (store: FramerAPI) => T) => {
  const store = useContext(FrameContext);
  if (!store)
    throw new Error("useFrameState must be used within a MenuProvider");
  return selector(store);
};
const AMG = ({ children }: { children: ReactNode }) => {
  const { stage } = useTransitionState();
  const navIsOpen = useRPStore(useShallow((r) => r.navIsOpen));
  const navState = useMotionValue(navIsOpen);

  const activeKey = useMotionValue<string | -1>(-1);
  const setActiveKey = useCallback(
    (key: string | null | -1) => {
      const cur = activeKey.get();
      const to = key || -1;
      cur !== to && activeKey.set(to);
    },
    [activeKey]
  );
  useEffect(() => {
    if (stage === "leaving") {
      activeKey.set(-1);
    }
  }, [stage, activeKey]);
  const focusedKey = useMotionValue<string | -1>(-1);
  const setFocusedKey = useCallback(
    (key: string | null | -1) => {
      const cur = focusedKey.get();
      const to = key || -1;
      cur !== to && focusedKey.set(to);
    },
    [focusedKey]
  );
  const fullscreen = useMenu((l) => l.fullscreen);
  const fsVal = useMotionValue(fullscreen);
  useEffect(() => {
    fsVal.set(fullscreen);
  }, [fullscreen, fsVal]);
  const top = useTransform(() => (fsVal.get() ? 0 : 10) as number);
  const left = useTransform(() => (fsVal.get() ? 0 : 10) as number);
  const bottom = useTransform(() => (fsVal.get() ? 0 : 30) as number);
  const right = useTransform(() => (fsVal.get() ? 0 : 10) as number);

  return (
    <FrameContext
      value={{
        activeKey,
        setActiveKey,
        setFocusedKey,
        focusedKey,
        left,

        top,
        bottom,
        right,
        navState
      }}
    >
      {children}
    </FrameContext>
  );
};
