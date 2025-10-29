"use client";
import type { ViewportSizes } from "@/components/UX/Media/types";
import { cssVariables } from "@/cssVariables";
import { useDeviceInfo, useMenu, useRPStore } from "@/providers/RP_Pro";
import { useTheme } from "@/providers/Theme";
import {
  defaultTheme,
  getImplicitPreference,
  themeLocalStorageKey
} from "@/providers/Theme/shared";
import { themeIsValid } from "@/providers/Theme/types";
import canUseDOM from "@/utilities/canUseDOM";
import { storageAvailable } from "@/utilities/isLocalStorageAvailable";
import { useWindowResize } from "@/utilities/use_window_resize";
import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ChangeEventHandler,
  type ReactNode
} from "react";
import { useShallow } from "zustand/shallow";

const RP_Cursor = dynamic(
  () => import("@/components/UX/Cursor").then((m) => m.default),
  {
    ssr: false
  }
);
const AdminCursor = dynamic(() => import("@/payload/components/Cursor/index").then((r) => r.default), {ssr: false});
const MobileContext = createContext<{ isMobile: boolean; isTouch: boolean }>({
  isMobile: false,
  isTouch: false
});

const MobileProvider = ({ children }: { children: ReactNode }) => {
  const [isTouch, setIsTouch] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const MOBILE_BREAKPOINT = 640;
  const setViewportDimensions = useRPStore((r) => r.setViewportDimensions);
  const setViewportSize = useRPStore((r) => r.setViewportSize);
  const [vs, setVs] = useState<ViewportSizes>("lg");
  const setSnapPoints = useRPStore((r) => r.setSnapPoints);
  const left = useMenu(useShallow((r) => r.left));
  const bottom = useMenu(useShallow((r) => r.bottom));

  const viewportWidth = useRPStore((r) => r.viewportWidth);
  const viewportHeight = useRPStore((r) => r.viewportHeight);
  const onResize = useCallback(() => {
    setViewportDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, [setViewportDimensions]);

  useEffect(() => {
    if (!isMobile) {
      setSnapPoints([viewportWidth * 0.76 + left + "px", 1]);
    } else {
      console.log("bottom,", bottom);
      console.log("viewportHeight", viewportHeight);
      setSnapPoints([viewportHeight * 0.35 + bottom + "px", 1]);
    }
  }, [bottom, isMobile, viewportWidth, left, setSnapPoints, viewportHeight]);
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
    debounce: 100,
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

const AdminMobileProvider = ({ children }: { children: ReactNode }) => {
  const [isTouch, setIsTouch] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const MOBILE_BREAKPOINT = 640;

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

    return () => {
      mql.removeEventListener("change", onChange);
      touchQ.removeEventListener("change", onTouchChange);
    };
  }, [resize]);

  return (
    <MobileContext.Provider value={{ isTouch, isMobile }}>
	    {!isTouch && <AdminCursor />}
      {children}
    </MobileContext.Provider>
  );
};
export const AdminMiddleMan = ({ children }: { children: ReactNode }) => {
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

  return <AdminMobileProvider>{children}</AdminMobileProvider>;
};
