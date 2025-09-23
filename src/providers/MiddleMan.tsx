"use client";
import dynamic from "next/dynamic";
import { useDeviceInfo, useMenu, useRPStore } from "@/providers/RP_Pro";
import { useTheme } from "@/providers/Theme";
import {
  defaultTheme,
  getImplicitPreference,
  themeLocalStorageKey
} from "@/providers/Theme/shared";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import { storageAvailable } from "@/utilities/isLocalStorageAvailable";
import { themeIsValid } from "@/providers/Theme/types";
import canUseDOM from "@/utilities/canUseDOM";
import { useWindowResize } from "@/utilities/use_window_resize";
import { PageType, useVoyageur } from "@/stores/Routing/RP_Voyageur";

const RP_Cursor = dynamic(
  () => import("@/components/UX/Cursor").then((m) => m.default),
  {
    ssr: false
  }
);
const MobileContext = createContext<{ isMobile: boolean; isTouch: boolean }>({
  isMobile: false,
  isTouch: false
});
const MobileProvider = ({ children }: { children: React.ReactNode }) => {
  const [isTouch, setIsTouch] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const MOBILE_BREAKPOINT = 968;
  const setViewportDimensions = useRPStore((r) => r.setViewportDimensions);
  const setSnapPoints = useRPStore((r) => r.setSnapPoints);
  const frames = useMenu((r) => r.frames);
  const { left, bottom } = frames;
  const viewportWidth = useRPStore((r) => r.viewportWidth);
  const viewportHeight = useRPStore((r) => r.viewportHeight);
  const lastMobile = useRef(isMobile);
  const onResize = useCallback(() => {
    setViewportDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, [setViewportDimensions]);
  useEffect(() => {
    window.addEventListener("resize", onResize);
    onResize();
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [onResize]);
  useEffect(() => {
    if (!isMobile) {
      setSnapPoints([viewportWidth * 0.76 + left + "px", 1]);
    } else {
      setSnapPoints([viewportHeight * 0.26 + bottom + "px", 1]);
    }
  }, [left, viewportWidth, isMobile, viewportHeight, bottom, setSnapPoints]);

  // useEffect(() => {
  //   if (viewportWidth > MOBILE_BREAKPOINT) {
  //     setSnapPoints([viewportWidth * 0.76 + 10 + "px", 1]);
  //   } else {
  //     setSnapPoints([viewportHeight * 0.26 + 20 + "px", 1]);
  //   }
  // }, [viewportWidth, viewportHeight, setSnapPoints]);

  const resize = useWindowResize({
    debounce: 100,
    detectVisibilityChange: false
  });
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const touchQ = window.matchMedia("(hover:none)");
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    const onTouchChange = () => {
      setIsTouch(touchQ.matches);
    };
    mql.addEventListener("change", onChange);
    touchQ.addEventListener("change", onTouchChange);
    setIsTouch(window.innerWidth < MOBILE_BREAKPOINT);
    return () => {
      mql.removeEventListener("change", onChange);
      touchQ.removeEventListener("change", onTouchChange);
    };
  }, [resize]);

  return (
    <MobileContext.Provider value={{ isTouch, isMobile }}>
      {!isTouch && <RP_Cursor />}
      {children}
    </MobileContext.Provider>
  );
};
export const useIsMobile = () => {
  const mobileCtx = useContext(MobileContext);
  if (!mobileCtx) {
    throw new Error("useIsMobile must be used within a MobileProvider");
  }
  return mobileCtx;
};
export const MiddleMan = ({ children }: { children: React.ReactNode }) => {
  const pageType = useVoyageur((l) => l.pageType);
  const lastPageType = useRef<PageType>(pageType);
  const localStorageEnabled = useDeviceInfo((r) => r.localStorage),
    setLocalStorageEnabled = useDeviceInfo((r) => r.setStorageAvailable);
  const locked = useTheme((r) => r.locked);
  const setTheme = useTheme((store) => store.setTheme);
  const saveTheme = useTheme((r) => r.saveTheme);
  const pageTheme = useTheme((store) => store.pageTheme);
  const savedTheme = useTheme((store) => store.savedTheme);
  const theme = useTheme((store) => store.theme);

  useEffect(() => {
    if (canUseDOM) {
      const s = storageAvailable("localStorage");
      setLocalStorageEnabled(s);
      let implicitPreference = getImplicitPreference() ?? defaultTheme;
      if (s) {
        const k = window.localStorage.getItem(themeLocalStorageKey);
        if (themeIsValid(k)) {
          implicitPreference = k;
        }
      }
      saveTheme(implicitPreference);
    }
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  useEffect(() => {
    setTheme(locked ? pageTheme || defaultTheme : savedTheme || defaultTheme);
  }, [pageTheme, savedTheme, locked, setTheme]);
  useEffect(() => {
    if (localStorageEnabled) {
      if (savedTheme) {
        window.localStorage.setItem(themeLocalStorageKey, savedTheme);
      } else {
        window.localStorage.removeItem(themeLocalStorageKey);
      }
    }
  }, [localStorageEnabled, savedTheme]);

  return <MobileProvider>{children}</MobileProvider>;
};
