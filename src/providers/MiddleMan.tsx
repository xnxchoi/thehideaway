"use client";
import type { ViewportSizes } from "@/components/core/Media/types";
import { cssVariables } from "@/cssVariables";
import { useDeviceInfo, useFrameState, useRPStore } from "@/providers/RP_Pro";
import { useTheme } from "@/providers/Theme";
import {
  defaultTheme,
  getImplicitPreference,
  themeLocalStorageKey
} from "@/providers/Theme/shared";
import { themeIsValid } from "@/providers/Theme/types";
import canUseDOM from "@/utilities/canUseDOM";
import { getIsMobile } from "@/utilities/getBreakpoints";
import { storageAvailable } from "@/utilities/isLocalStorageAvailable";
import { useWindowResize } from "@/utilities/use_window_resize";
import {
  useMotionValue,
  useMotionValueEvent,
  useTransform
} from "motion/react";
import dynamic from "next/dynamic";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";

const RP_Cursor = dynamic(
  () => import("@/components/UX/Cursor").then((m) => m.default),
  {
    ssr: false
  }
);
export const MobileContext = createContext<{
  isMobile: boolean;
  isTouch: boolean;
}>({
  isMobile: false,
  isTouch: false
});

export const MobileProvider = ({ children }: { children: ReactNode }) => {
  const [isTouch, setIsTouch] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(
    getIsMobile(window.innerWidth)
  );
  const mobileState = useMotionValue(isMobile);
  useEffect(() => {
    mobileState.set(isMobile);
  }, [isMobile, mobileState]);
  const MOBILE_BREAKPOINT = 640;
  const setViewportDimensions = useRPStore((r) => r.setViewportDimensions);
  const setViewportSize = useRPStore((r) => r.setViewportSize);
  const [vs, setVs] = useState<ViewportSizes>("lg");
  const setSnapPoints = useRPStore((r) => r.setSnapPoints);
  const { left, bottom } = useFrameState();
  const vw = useMotionValue(window.innerWidth);
  const vh = useMotionValue(window.innerHeight);

  const onResize = useCallback(() => {
    setViewportDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });
    vw.set(window.innerWidth);
    vh.set(window.innerHeight);
    const v = getIsMobile(window.innerWidth)
      ? window.innerHeight * 0.35 + bottom.get()
      : window.innerWidth * 0.76 + left.get();
    setSnapPoints([`${v}px`, 1]);
  }, [bottom, left, setSnapPoints, setViewportDimensions, vh, vw]);

  // useEffect(() => {
  //   if (!isMobile) {
  //     setSnapPoints([viewportWidth * 0.76 + left + "px", 1]);
  //   } else {
  //     setSnapPoints([viewportHeight * 0.35 + bottom + "px", 1]);
  //   }
  // }, [bottom, isMobile, viewportWidth, left, setSnapPoints, viewportHeight]);
  useEffect(() => {
    window.addEventListener("resize", onResize);
    onResize();
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [onResize]);

  // useEffect(() => {
  //   if (viewportWidth > MOBILE_BREAKPOINT) {
  //     setSnapPoints([viewportWidth * 0.76 + 10 + "px", 1]);
  //   } else {
  //     setSnapPoints([viewportHeight * 0.26 + 20 + "px", 1]);
  //   }
  // }, [viewportWidth, viewportHeight, setSnapPoints]);

  const resize = useWindowResize({
    debounce: 50,
    detectVisibilityChange: false
  });
  useEffect(() => {
    setViewportSize(vs);
  }, [setViewportSize, vs]);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const mqqq = Object.entries(cssVariables.breakpoints).map(([k, value]) => {
      console.log(k, value);
      const mq = window.matchMedia(`(max-width: ${value - 1}px)`);
      const onChange = (e: MediaQueryListEventMap["change"]) => {
        if (e.matches) {
          setVs((r) => {
            const key = k as ViewportSizes;
            const prev = cssVariables.breakpoints[r];
            const next = cssVariables.breakpoints[key];
            if (next > prev) {
              return key;
            }
            return r;
          });
        }
      };
      mq.addEventListener("change", onChange);
      return () => {
        mq.removeEventListener("change", onChange);
      };
    });
    const touchQ = window.matchMedia("(hover:none)");
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    const onTouchChange = () => {
      setIsTouch(touchQ.matches);
    };
    // BUG FIX: the listeners below only fire on CHANGE, never on mount.
    // Without this initial read, `isTouch` stayed false on every real iPhone
    // (which matches `(hover: none)` from the start, so the listener never
    // fires) and the touch-mobile Controlbar / Drawer.Handle never rendered.
    setIsTouch(touchQ.matches);
    mql.addEventListener("change", onChange);
    touchQ.addEventListener("change", onTouchChange);

    return () => {
      mql.removeEventListener("change", onChange);
      touchQ.removeEventListener("change", onTouchChange);
      mqqq.forEach((r) => r());
    };
  }, [resize]);
  useEffect(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
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
export const MiddleMan = ({ children }: { children: ReactNode }) => {
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
  }, [saveTheme, setLocalStorageEnabled]);
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
