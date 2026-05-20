"use client";
import { useEffect, useRef, useState } from "react";
import { useDeviceInfo } from "@/providers/RP_Pro";

export type resizeListenerProps = {
  debounce?: number;
  detectHeightChange?: boolean;
  detectVisibilityChange?: boolean;
};

export const useWindowResize = ({
  debounce = 300,
  detectHeightChange = false,
  detectVisibilityChange = false
}: resizeListenerProps = {}) => {
  const [currentWidth, setCurrentWidth] = useState<number>(null!);
  const [currentHeight, setCurrentHeight] = useState<number>(null!);
  const [lastTimestamp, setLastTimestamp] = useState<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const lastWindowWidth = useRef<number>(null);
  const lastWindowHeight = useRef<number>(null);
  useEffect(() => {
    lastWindowWidth.current = currentWidth;
    return () => {
      lastWindowWidth.current = null;
    };
  }, [currentWidth]);
  useEffect(() => {
    lastWindowHeight.current = currentHeight;
    return () => {
      lastWindowHeight.current = null;
    };
  }, [currentHeight]);
  const devInfo = useDeviceInfo((r) => r);
  const browser = useDeviceInfo((r) => r.browser.isChrome);
  useEffect(() => {
    console.log("devInfo", devInfo);
    const l = devInfo.isMobile && browser;
    if (lastWindowWidth.current === null) {
      setCurrentWidth(window.innerWidth);
      return;
    }
    if (lastWindowHeight.current === null && detectHeightChange && !l) {
      setCurrentHeight(window.innerHeight);
      return;
    }

    function handleResize() {
      (timeoutRef.current && clearTimeout(timeoutRef.current),
        (timeoutRef.current = setTimeout(() => {
          (window.innerWidth !== lastWindowWidth.current &&
            (setCurrentWidth(window.innerWidth), setLastTimestamp(Date.now())),
            window.innerHeight === lastWindowHeight.current ||
              l ||
              (setCurrentHeight(window.innerHeight),
              setLastTimestamp(Date.now())));
        }, debounce)));
    }

    return (
      window.removeEventListener("resize", handleResize),
      window.addEventListener("resize", handleResize),
      () => {
        window.removeEventListener("resize", handleResize);
      }
    );
  }, [debounce, detectHeightChange, devInfo, browser]);
  useEffect(() => {
    const handleVisibilityChange = () => {
      setTimeout(() => {
        detectVisibilityChange && setLastTimestamp(Date.now());
      }, 50);
    };

    return (
      window.removeEventListener("visibilitychange", handleVisibilityChange),
      window.addEventListener("visibilitychange", handleVisibilityChange),
      () => {
        window.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    );
  }, [detectVisibilityChange]);
  return lastTimestamp;
};
