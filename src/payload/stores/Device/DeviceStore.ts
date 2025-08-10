import type {BrowserNames, IASAppKeys, OSNames} from "./browserNames";
import InAppSpy from "inapp-spy";
import {UAParser} from "ua-parser-js";

export type HA_DEVICE = {
	device: {
		type?:
			| "mobile"
			| "tablet"
			| "console"
			| "smarttv"
			| "wearable"
			| "xr"
			| "embedded";
		vendor?: string;
		model?: string;
	};
	browser: {
		name: BrowserNames | IASAppKeys;
		version?: string;
		major?: string;
		type?:
			| "crawler"
			| "cli"
			| "email"
			| "fetcher"
			| "inapp"
			| "mediaplayer"
			| "library";
	} & {
		chrome: boolean;
		firefox: boolean;
		safari: boolean;
		edge: boolean;
		ie: boolean;
		opera: boolean;
		messenger: boolean;
		node: boolean;
		instagram: boolean;
		pinterest: boolean;
		facebook: boolean;
		linkedIn: boolean;
		snapchat: boolean;
		whatsApp: boolean;
		twitter: boolean;
		weChat: boolean;
		tikTok: boolean;
		kakaotalk: boolean;
		gsa: boolean;
		threads: boolean;
		line: boolean;
		inApp: boolean;
	};
	os: {
		name: OSNames;
		version?: string;
		ios: boolean;
		android: boolean;
		windowsPhone: boolean;
		blackBerry: boolean;
		mac: boolean;
		windows: boolean;
		linux: boolean;
		chromeos: boolean;
		node: boolean;
	} & { name?: string; version?: string };
	bots: boolean;
	isTouchDevice: boolean;
	isMobile: boolean;
};

export const createDeviceStore = () => {
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
		"https://developers.google.com/+/web/snippet/",
	];
	const browser = uap.getBrowser() as UAParser.IBrowser & {
		name: BrowserNames;
	};
	const os = uap.getOS() as UAParser.IOS & { name: OSNames };
	const device = uap.getDevice();
	const {appKey, isInApp, appName} = InAppSpy();
	const l: HA_DEVICE = {
		device: {...device},
		browser: {
			...browser,
			name: appKey ?? browser.name,
			instagram: appKey === "instagram",
			pinterest: /pinterest/i.test(navigator.userAgent),
			facebook: appKey === "facebook",
			whatsApp: /whatsapp/i.test(navigator.userAgent),
			twitter: /twitter/i.test(navigator.userAgent),
			kakaotalk: browser.name === "KakaoTalk",
			weChat: /wechat|micromessenger/i.test(navigator.userAgent),
			threads: appKey === "threads",
			messenger: appKey === "messenger",
			line: appKey === "line",
			tikTok: appKey === "tiktok",
			linkedIn: appKey === "linkedin",
			snapchat: appKey === "snapchat",
			gsa: appKey === "gsa",
			chrome: browser.name === "chrome",
			firefox: browser.name === "firefox",
			safari: browser.name === "safari",
			edge: browser.name === "microsoft-edge",
			ie: browser.name === "internet-explorer",
			opera: browser.name === "opera",
			node: browser.name === "node",
			inApp: false,
		},
		os: {
			...os,
			name: isSpoofedIpad ? "ios" : (os.name ?? ""),
			ios: os.name === "iOS",
			android: os.name === "Android",
			windowsPhone: os.name === "Windows Phone",
			blackBerry: os.name === "BlackBerry",
			mac: os.name === "macOS",
			windows: os.name === "Windows",
			linux: os.name === "Linux",
			chromeos: os.name === "Chrome OS",
			node: os.name === "node",
		},
		isTouchDevice: navigator.maxTouchPoints > 0,
		isMobile:
			device.type === "mobile" || os.name === "Android" || os.name === "iOS",
		bots: !!supportedBots.filter((bot: string) =>
			navigator.userAgent.toLowerCase().includes(bot.toLowerCase()),
		).length,
	};
	l.browser.inApp =
		l.browser.kakaotalk ||
		l.browser.instagram ||
		l.browser.pinterest ||
		l.browser.facebook ||
		l.browser.linkedIn ||
		l.browser.snapchat ||
		l.browser.whatsApp ||
		l.browser.twitter ||
		l.browser.weChat ||
		l.browser.tikTok ||
		isInApp;
	if (l.browser.inApp) {
		l.browser.type = "inapp";
	}
	if (l.os.android || l.os.ios) {
		l.isMobile = true;
	}
	return l;
};
