"use client";
import InAppSpy from "inapp-spy";
import {
  BrowserName,
  BrowserType,
  DeviceType,
  DeviceVendor
} from "ua-parser-js/enums";
import { createStore } from "zustand/vanilla";

type IVendor = typeof DeviceVendor;
type Vendorr = IVendor[keyof IVendor];
type IAppName = NonNullable<ReturnType<typeof InAppSpy>["appName"]>;
type UBName = NonNullable<(typeof BrowserName)[keyof typeof BrowserName]>;
type BType = NonNullable<(typeof BrowserType)[keyof typeof BrowserType]>;
type DType = NonNullable<(typeof DeviceType)[keyof typeof DeviceType]>;
type FallbackName = "Unknown";
export const fallbackName: FallbackName = "Unknown";
export type HA_DEVICE = {
  fingerprint: string | null;
  device: {
    model: string;
    type: DType | FallbackName;
    vendor: string | Vendorr | FallbackName;
  };
  browser: {
    name: IAppName | UBName | string | FallbackName;
    type: BType | FallbackName;
  } & {
    inApp: boolean;
    isChrome: boolean;
    isSafari: boolean;
  };
  os: {
    name: string | FallbackName;
    isIOS: boolean;
    isAndroid: boolean;
  };
  isBot: boolean;
  isTouchDevice: boolean;
  isMobile: boolean;
};
export type DeviceStore = HA_DEVICE & {
  localStorage: boolean;
  setFingerPrint: (l: string) => void;
  setStorageAvailable: (l: boolean) => void;
};
export const createDeviceStore = (l: HA_DEVICE) => {
  return createStore<DeviceStore>()((set, get) => ({
    ...l,
    localStorage: false,
    setFingerPrint: (l) => set({ fingerprint: l }),
    setStorageAvailable: (l) => set({ localStorage: l })
  }));
};
