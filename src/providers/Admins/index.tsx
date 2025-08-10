"use client";
import "@/styles/payloadStyles.css";
import {
	CurProvider,
	DeviceProvider,
	HAStoreProvider,
	MenuProvider,
	RafProvider,
	useCursorStore,
} from "@/providers/RP_Pro";

import React, {useCallback, useEffect, useMemo, useRef} from "react";
import {ThemeProvider} from "@/providers/Theme";
import {ReactLenis} from "lenis/react";
import {usePathname} from "next/navigation";

import {LazyMotion} from "motion/react";
import {MiddleMan} from "@/providers/MiddleMan";
import {VoyageurProvider} from "@/stores/Routing/RP_Voyageur";
import {delay} from "@/utilities/rp_utils";
import {Toaster} from "@/payload/components/sonner";

type EventCursor = {
	listener: (e: MouseEvent) => void;
	callback: [(e: HTMLElement) => void];
	qualifiers: string[];
};
type CursorManager = {
	hover: EventCursor[];
	click: EventCursor[];
};

const Middle = ({children}: { children: React.ReactNode }) => {
	const pathname = usePathname();
	const setCursorState = useCursorStore((l) => l.setCursorState);

	const onMouseEnter = useCallback((e: MouseEvent) => {
		const target = e.target as HTMLElement;
		if (target.tagName === "BUTTON" || target.tagName === "INPUT") {
			(target as HTMLButtonElement | HTMLInputElement).disabled ||
			(target.tagName === "INPUT" && (target as HTMLInputElement).readOnly) ||
			(target.tagName === "BUTTON" && /(active)/i.test(target.className))
				? setCursorState(null)
				: setCursorState("FOCUS");
		}
		setCursorState("FOCUS");
	}, []);
	const onMouseLeave = useCallback((e: MouseEvent) => {
		setCursorState(null);
	}, []);

	const lastPathname = useRef(pathname);
	const lastHovers = useRef<Array<HTMLElement>>([]);
	const lastClicks = useRef<Array<[HTMLElement, (e: MouseEvent) => void]>>([]);
	const lastObserves = useRef<Array<MutationObserver>>([]);
	const lastPopupButtons = useRef<Array<HTMLButtonElement> | null>(null);
	const lastTabsFieldButtons = useRef<Array<HTMLButtonElement> | null>(null);
	const lastCheckBoxes = useRef<Array<HTMLInputElement> | null>(null);

	const delayThenAttach = useCallback(
		(target: HTMLElement) =>
			delay(100).then(() => {
				target.querySelectorAll("button").forEach((a) => {
					a.addEventListener("mouseenter", onMouseEnter);
					a.addEventListener("mouseleave", onMouseLeave);
				});
			}),
		[onMouseEnter, onMouseLeave],
	);
	const popupButtonClickCallback = useCallback(
		(e: MouseEvent) => {
			const popup = (e.target as HTMLButtonElement).closest(".popup__content");
			if (popup) {
				delayThenAttach(popup as HTMLElement);
			}
		},
		[delayThenAttach],
	);
	const onClickCallback = useCallback(
		(e: MouseEvent) => {
			delay(100).then(() => {
				const leaveWithoutSaving = document.getElementById(
					"leave-without-saving",
				);
				if (leaveWithoutSaving) {
					leaveWithoutSaving.querySelectorAll("button").forEach((a) => {
						a.addEventListener("mouseenter", onMouseEnter);
						a.addEventListener("mouseleave", onMouseLeave);
					});
				}
			});
		},
		[onMouseEnter, onMouseLeave],
	);
	const resetAllEvents = useCallback(() => {
		while (lastHovers.current.length > 0) {
			const a = lastHovers.current.pop();
			a &&
			(a.removeEventListener("mouseenter", onMouseEnter),
				a.removeEventListener("mouseleave", onMouseLeave));
		}
		while (lastClicks.current.length > 0) {
			const [a, b] = lastClicks.current.pop() || [null, null];
			a && b && a.removeEventListener("click", b);
		}
	}, [onMouseEnter, onMouseLeave]);
	const buttonAttach = useCallback(() => {
		const links = document.querySelectorAll("a");

		links.forEach((a) => {
			a.addEventListener("mouseenter", onMouseEnter);
			a.addEventListener("mouseleave", onMouseLeave);
			a.addEventListener("click", onClickCallback);
			lastClicks.current.push([a, onClickCallback]);
			lastHovers.current.push(a);
		});

		document.querySelectorAll("button").forEach((a) => {
			a.addEventListener("mouseenter", onMouseEnter);
			a.addEventListener("mouseleave", onMouseLeave);
			lastHovers.current.push(a);
		});

		document.querySelectorAll("button.popup-button").forEach((a) => {
			a.addEventListener("click", popupButtonClickCallback);
			lastClicks.current.push([
				a as HTMLButtonElement,
				popupButtonClickCallback,
			]);
		});

		document.querySelectorAll("button.toolbar-popup__dropdown").forEach((a) => {
			a.addEventListener("click", (e: MouseEvent) => {
				const tg = e.target as HTMLButtonElement;
				tg.classList.contains("active");
			});
		});
		document.querySelectorAll('input[type="checkbox"]').forEach((a) => {
			a.addEventListener("mouseenter", onMouseEnter);
			a.addEventListener("mouseleave", onMouseLeave);
			lastHovers.current.push(a as HTMLInputElement);
		});
	}, [onMouseEnter, onMouseLeave, onClickCallback, popupButtonClickCallback]);
	const st = useCallback(
		(e: HTMLElement) => {
			e.addEventListener("mouseenter", onMouseEnter);
			e.addEventListener("mouseleave", onMouseLeave);
			lastHovers.current.push(e);
		},
		[onMouseEnter, onMouseLeave],
	);
	const addDefaults = useCallback(
		(e: NodeListOf<HTMLElement>) => {
			e.forEach(st);
		},
		[st],
	);
	const addToStandards = useCallback(
		(e: NodeList | HTMLElement) => {
			if (e instanceof NodeList) {
				e.forEach((r) => {
					if (r.nodeType === Node.ELEMENT_NODE) {
						addToStandards(r as HTMLElement);
					}
				});
			} else {
				addDefaults(
					e.querySelectorAll(
						'button, a, input[type="checkbox"],input[type="button"],input[type="radio"],input[type="range"]',
					),
				);
			}
		},
		[addDefaults],
	);
	const removeTheNodes = useCallback((e: NodeList) => {
		if (e.length < 1) return;
		e.forEach((a) => {
			if (a.nodeType === Node.ELEMENT_NODE) {
				const n = a as HTMLElement;
				const r = lastHovers.current.indexOf(n);
				const v = r > -1 && lastHovers.current.splice(r, 1);
				const t = lastClicks.current.findIndex((a) => a[0] === n);
				const u = t > -1 && lastClicks.current.splice(t, 1);
				Array.isArray(v) &&
				v.forEach((a) => {
					a &&
					(a.removeEventListener("mouseenter", onMouseEnter),
						a.removeEventListener("mouseleave", onMouseLeave));
				});
				Array.isArray(u) &&
				u.forEach(([r, v]) => {
					r && r.removeEventListener("click", v);
				});
			}
		});
	}, []);

	const dropdownCallback = useCallback(
		(e: MutationRecord[]) => {
			e.forEach((r) => {
				if (r.type !== "childList") return;
				r.addedNodes && addToStandards(r.addedNodes);
				r.removedNodes && removeTheNodes(r.removedNodes);
			});
		},
		[addToStandards, removeTheNodes],
	);
	const mutationCallback = useCallback(
		(mutationsList: MutationRecord[]) => {
			mutationsList.forEach((mutation) => {
				if (mutation.type === "childList") {
					mutation.addedNodes && addToStandards(mutation.addedNodes);
					mutation.removedNodes && removeTheNodes(mutation.removedNodes);
				}
			});
		},
		[addToStandards, removeTheNodes],
	);

	const pathRegexr = useMemo(
		() =>
			/^\/vault\/((collections\/(posts|delta|users|userMedia|media|assets|albums|playlists|tracks|profiles\/(create|([a-z-_0-9]+\/edit))))|(account))/,
		[],
	);
	const bodyWatcher = useRef<MutationObserver | null>(null);
	const popupWatcher = useRef<MutationObserver | null>(null);
	const cleanUpMutator = useCallback(() => {
		const woMutator = popupWatcher.current;
		woMutator && woMutator?.disconnect();
		const cl = lastClicks.current;
		const neww = cl.filter((a) => {
			return Boolean(a[0]);
		});
		const neww2 = lastHovers.current.flatMap((a) => {
			return a ? a : [];
		});
		lastClicks.current = neww;
		lastHovers.current = neww2;
		popupWatcher.current = null;
	}, []);
	const isTg = useCallback(
		(n: HTMLElement) =>
			n?.classList?.contains("toolbar-popup__dropdown-items") || false,
		[],
	);
	useEffect(() => {
		if (lastPathname.current === pathname) return;
		while (lastObserves.current.length > 0) {
			const a = lastObserves.current.pop();
			a?.disconnect();
		}
		setCursorState(null);
		delay(200).then(() => {
			resetAllEvents();
			buttonAttach();
		});

		lastPathname.current = pathname;
		if (pathRegexr.test(pathname)) {
			const els = document.querySelectorAll(
				".rich-text-lexical__wrap .editor-container,.ContentEditable__root,.tabs-field__tab .render-fields",
			);
			const hasLexical =
				document.querySelectorAll(".rich-text-lexical__wrap .editor-container").length > 0;

			if (hasLexical) {
				!bodyWatcher.current &&
				(bodyWatcher.current = new MutationObserver((recs) => {
					recs.forEach((rec) => {
						if (rec.type === "childList") {
							if (rec.removedNodes.length > 0) {
								rec.removedNodes.forEach((el) => {
									if (el.nodeType !== Node.ELEMENT_NODE) return;
									const n = el as HTMLElement;
									if (isTg(n)) {
										cleanUpMutator();
									}
								});
							}
							if (rec.addedNodes.length > 0) {
								rec.addedNodes.forEach((el) => {
									if (el.nodeType !== Node.ELEMENT_NODE) return;
									const n = el as HTMLElement;
									if (isTg(n)) {
										cleanUpMutator();
										popupWatcher.current = new MutationObserver(
											dropdownCallback,
										);
										popupWatcher.current.observe(n, {childList: true});
									}
								});
							}
						}
					});
				}));
			}
			els.forEach((el) => {
				const mutation = new MutationObserver(mutationCallback);
				mutation.observe(el, {
					childList: true,
				});
				lastObserves.current.push(mutation);
			});
		}
	}, [
		buttonAttach,
		mutationCallback,
		pathRegexr,
		pathname,
		resetAllEvents,
		setCursorState,
	]);

	return <>{children}</>;
};
const features = () => import("@/providers/Motion").then((r) => r.default);
const AdminsProviders: React.FC<{
	children: React.ReactNode;
}> = ({children}) => {
	return (
		<DeviceProvider>
			<VoyageurProvider>
				<ReactLenis root={true}>
					<HAStoreProvider>
						<ThemeProvider>
							<LazyMotion features={features} strict={true}>
								<RafProvider>
									<MenuProvider>
										<CurProvider>
											<MiddleMan>
												<Middle>{children}</Middle>
												<Toaster />
											</MiddleMan>
										</CurProvider>
									</MenuProvider>
								</RafProvider>
							</LazyMotion>
						</ThemeProvider>
					</HAStoreProvider>
				</ReactLenis>
			</VoyageurProvider>
		</DeviceProvider>
	);
};
export default AdminsProviders;
