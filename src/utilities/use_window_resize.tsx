"use client";
import { useEffect, useState } from "react";
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
  const [timeoutID, setTimeoutID] = useState<ReturnType<typeof setTimeout>>(
    null!
  );
  const devInfo = useDeviceInfo((r) => r.isMobile);
  const browser = useDeviceInfo((r) => r.browser.isChrome);
  useEffect(() => {
    const l = devInfo && browser;
    if (currentWidth === null) {
      setCurrentWidth(window.innerWidth);
      return;
    }
    if (currentHeight === null && detectHeightChange && !l) {
      setCurrentHeight(window.innerHeight);
      return;
    }

    function handleResize() {
      (timeoutID && clearTimeout(timeoutID),
        setTimeoutID(
          setTimeout(() => {
            (window.innerWidth !== currentWidth &&
              (setCurrentWidth(window.innerWidth),
              setLastTimestamp(Date.now())),
              window.innerHeight === currentHeight ||
                l ||
                (setCurrentHeight(window.innerHeight),
                setLastTimestamp(Date.now())));
          }, debounce)
        ));
    }

    return (
      window.removeEventListener("resize", handleResize),
      window.addEventListener("resize", handleResize),
      () => {
        window.removeEventListener("resize", handleResize);
      }
    );
  }, [
    currentWidth,
    currentHeight,
    debounce,
    detectHeightChange,
    devInfo,
    browser,
    timeoutID
  ]);
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
