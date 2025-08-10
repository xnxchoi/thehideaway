"use client";
import InAppSpy from "inapp-spy";
import {Browser, BrowserType, Device, Vendor} from "ua-parser-js/enums";
import {createStore} from "zustand/vanilla";

type IVendor = typeof Vendor;
type Vendorr = IVendor[keyof IVendor];
type IAppName = NonNullable<ReturnType<typeof InAppSpy>["appName"]>;
type UBName = NonNullable<(typeof Browser)[keyof typeof Browser]>;
type BType = NonNullable<(typeof BrowserType)[keyof typeof BrowserType]>;
type DType = NonNullable<(typeof Device)[keyof typeof Device]>;
export type HA_DEVICE = {
	fingerprint: string | null;
	device: {
		model: string;
		type: DType | "Unknown";
		vendor: string | Vendorr | "Unknown";
	};
	browser: {
		name: IAppName | UBName | string | "Unknown";
		type: BType | "Unknown";
	} & {
		inApp: boolean;
		isChrome: boolean;
		isSafari: boolean;
	};
	os: {
		name: string | "Unknown";
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
		setFingerPrint: (l) => set({fingerprint: l}),
		setStorageAvailable: (l) => set({localStorage: l}),
	}));
};
