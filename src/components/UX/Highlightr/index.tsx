"use client";
import {useLenis} from "lenis/react";
import {
	ChangeEventHandler,
	ComponentProps,
	type ComponentPropsWithoutRef,
	type ComponentPropsWithRef,
	createContext,
	CSSProperties,
	type MouseEvent,
	MouseEventHandler,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {useCursorStore, useMenu, useRPStore} from "@/providers/RP_Pro";
import {useWindowResize} from "@/utilities/use_window_resize";
import {cn} from "@/lib/utils";
import {Button, Link, MotionBtn} from "@/components/UX/Link";
import * as m from "motion/react-m";
import "rangy/lib/rangy-classapplier";
import * as rangey from "rangy";
import "rangy/lib/rangy-highlighter";
import 'rangy/lib/rangy-selectionsaverestore'
import "rangy/lib/rangy-textrange";
import "./_highlightr.scss";
import {AnimatePresence, HTMLMotionProps} from "motion/react";
import {useDomCursor} from "@/components/core/cursorWrapper";
import {errorToast} from "@/components/ui/sonner";
import {type ArticleOverview, AuthorOverview, SingleArticle,} from "@/payload/collections/Posts/post-types";
import {gsap} from "gsap";
import {FeaturedCard} from "@/payload/blocks/heros/ArtHero/FeatureHero";
import RichText from "@/payload/fields/RichText";
import {Locked} from "@/components/UX/Locked/Locked";
import {useTabMessenger} from "@/utilities/visibilityChange";
import {useGSAP} from "@gsap/react";
import {Card, CardContent} from '@/components/ui/card'
import {usePathname} from "next/navigation";
import type {HighlightedRange, ProcessedRangy, RangeSaveParams,} from "./types";
import {DateTime} from "luxon";
import {fallback} from "@/components/UX/Highlightr/Navigation/fallbacks";
import type Lenis from "lenis";
import {MotionBtnProps} from "@/components/UX/Link/types";
import {
	createUserHighlight,
	deleteUserHighlight,
	fetchUserHighlights,
	HighlightCreateError,
	HighlightsCollection,
	updateUserHighlight,
	useHighlighter,
} from "@/components/UX/Highlightr/provider";
import {nanoid} from "nanoid";
import {useRPSession} from "@/lib/auth/session/RP_SessionProvider";
import type {Where} from "payload";
import {stringify} from "qs-esm";
import type {Bookmark, PayloadPreference, User} from "@/payload-types";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,} from "@/components/ui/dialog";
import {Textarea} from "@/components/ui/textarea";
import {successToast} from "@components/sonner";
import {isMarkable,} from "./utils/highlight-helpers";
import {HighlightColors} from './stores'
import {useLocale, useTranslations} from "next-intl";
import {AuthUIContext, socialProviders} from "@/lib/auth/betterauth-ui/src";
import {ProviderButton} from "@/lib/auth/betterauth-ui/src/components/auth/provider-button";
import {GradientSeparator} from "@/components/ui/separator";
import {Button as UIBtn} from "@/components/ui/button";
import {delay} from "@/utilities/rp_utils";
import {useTransitionRouter} from "next-transition-router";
import {useCharacterLimit} from "@/hooks/use-character-limit";
import {toast} from "sonner";
import {Drawer} from "vaul";
import {BookmarkFilledIcon, BookmarkIcon} from "@radix-ui/react-icons";
import {HighlightPalette, Palettes} from "@/components/UX/Highlightr/stores";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";

export type RangeRect = {
	top: number; left: number; right: number; width: number;
};
export const Narrateur = ({post}: { post: SingleArticle }) => {
	return <SideBarProvider><ReadInternal post={post} /></SideBarProvider>;
};

export interface HighlightSidebarProps {
	open: boolean
	setOpen: (open: boolean) => void
	toggle: () => void
	setContent: (content: Omit<ResponseNode, 'top'> | null) => void;
	content: Omit<ResponseNode, 'top'> | null;
}

const HighlightSidebarContext = createContext<HighlightSidebarProps>({
	open: false, setOpen: () => {
	}, toggle: () => {
	}, setContent: (content) => {
	}, content: null,
})
const CitationView = ({
	createdAt, updatedAt, author, quote, memo, reference, ...rest
}: Omit<ResponseNode, 'top'>) => {
	const uDate = DateTime.fromISO(updatedAt);
	const cDate = DateTime.fromISO(createdAt);
	const updateValid = uDate.isValid
	const userImage = useRPSession(r => r.image);
	const userName = useRPSession(r => r.name);
	const userSlug = useRPSession(r => r.slug);
	const userId = useRPSession(r => r.id);
	const [adding, isAdding] = useState(false);
	let isEdited = false;
	if (updateValid) {
		isEdited = uDate.diff(cDate).as('hours') > 0;
	}
	const finalDate = updateValid ? (uDate as DateTime<true>) : cDate;
	const locale = useLocale();
	return <div className={'flex flex-col'}>
		<FocusedCitation citation={{
			author, quote, memo, reference

		}} {...rest} />
		<div className={'border-muted-foreground/20 border-b-[1px] pt-[24px] mx-[24px] my-0'}>
			<div>
				<div className={'leading-[20px] text-[14px]'}>
					<div className={'leading-[20px]'}>
						{userId && (<div className={'mb-[20px] block'}>
							<div className={'flex items-center mb-[12px]'}>
								<div className={'flex justify-between'}>
									<div className={'flex items-center'}>
										<div>
											<div className={'inline-block'}>
												<div className={'outline-none'} tabIndex={-1}>
													<Link href={`/@${userSlug}`}>
														<div className={'block relative'}><Avatar>
															{userImage && (<AvatarImage height={32} width={32}
															                            src={userImage} />) || (
																<AvatarFallback className={'uppercase'}>
																	{userName.at(0)}
																	{userName.at(1)}
																</AvatarFallback>)}
														</Avatar></div>
													</Link></div>
											</div>
										</div>
										<div className={'pl-[12px] block'}>
											<div className={'flex items-center'}>
												<div className={'inline-block'}>
													<div className={'outline-none'} tabIndex={-1}>
														<Link href={`/@${userSlug}`}>
															<div className={'items-baseline flex'}>
																<p className={'break-all'}>
																	{userName}
																</p>
															</div>
														</Link>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div
								className={'pb-0 flex-col rounded-[4px] bg-muted-faded-background flex transition-[background-color,padding-bottom] duration-400'}>
								<div className={'relative flex flex-col'}>
									{userId ? <div
										className={'min-h-[15px] px-[12px] py-[8px] transition-[min-height,padding] duration-400'}>
										{adding && <textarea className={'relative min-h-[24px]'} style={{
											overflowWrap: 'break-word', whiteSpace: 'pre-wrap',
										}} />}
									</div> : <SignInTriggerButton />}
								</div>
							</div>
						</div>)}
					</div>
				</div>
			</div>
		</div>
		<div className={'block'}>
			<div className={'block'}>
				<div className={'block mx-[24px] border-b-none'}>
					<div>
						<div className={'w-full h-full'}>
							<div className={'block pt-[25px] pb-[16px]'}>
								<div className={'flex justify-between'}>
									<div className={'flex items-center'}>
										<div>
											<div className={'inline-block'}>
												<div className={'outline-none'} tabIndex={-1}>
													<Link href={`/@${author.slug}`}>
														<div className={'block relative'}><Avatar>
															{author.image && (<AvatarImage height={32} width={32}
															                               src={author.image} />) || (
																<AvatarFallback className={'uppercase'}>
																	{author.name.at(0)}
																	{author.name.at(1)}
																</AvatarFallback>)}
														</Avatar></div>
													</Link></div>
											</div>
										</div>
										<div className={'pl-[12px] block'}>
											<div className={'flex items-center'}>
												<div className={'inline-block'}>
													<div className={'outline-none'} tabIndex={-1}>
														<Link href={`/@${author.slug}`}>
															<div className={'items-baseline flex'}>
																<p className={'break-all'}>
																	{author.displayUsername || author.name}
																</p>
															</div>
														</Link>
													</div>
												</div>
											</div>
											<div>
													<span>{finalDate.setLocale(locale).
														toRelative()}{isEdited && (<>&nbsp;{(locale === 'ko' ? '(수정)' : '(edited)')}</>)}</span>
											</div>
										</div>
									</div>
								</div>
								<div className={'mt-[5px] break-word block'}>
									<p className={'text-base font-suit'}>
										{memo}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
}
const SideBarProvider = ({children}: { children: ReactNode }) => {
	const [open, setOpen] = useState(false)
	const lenis = useLenis();
	const [content, setContent] = useState<Omit<ResponseNode, 'top'> | null>(null)
	useEffect(() => {
		lenis && (lenis[open ? 'stop' : 'start']())
	}, [open, lenis])
	const currentColor = useHighlighter(r => r.currentColor);
	useEffect(() => {
		if (!open) {
			setContent(null)
		}
	}, [open])
	return <HighlightSidebarContext.Provider value={{
		open, setOpen, toggle: () => setOpen(o => !o), setContent, content: null
	}}>
		{children}
		<Drawer.Root open={open} onOpenChange={setOpen} defaultOpen={false} autoFocus={true} direction={'right'}>
			<Drawer.Portal>
				<Drawer.Overlay className="fixed inset-0 bg-black/40 z-[249]" />
				<Drawer.Content
					className="flex flex-col gap-4 w-[400px] z-[250] fixed top-2 bottom-2 right-2 bg-background p-4"
					style={{
						'--initial-transform': 'calc(100% + 8px)', '--currentHighlight': HighlightPalette[currentColor]
					} as CSSProperties}>
					<Drawer.Title className="text-lg font-semibold">
						Response
					</Drawer.Title>
					<Drawer.Description className="text-sm text-muted-foreground hidden">
						Response.
					</Drawer.Description>
					{content && <CitationView {...content} />}
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.Root>
	</HighlightSidebarContext.Provider>
}
const FocusedCitation = ({citation}: {
	citation: Partial<HighlightedRange> & { quote: string; author: AuthorOverview; reference: string; }
}) => {
	return <div className={'p-[6px_10px_24px] block'}>
		<div className={'m-[10px_14px_0px] py-[20px] px-[16px] rounded-[3px] shadow-lg bg-background'}>
			<p className={'mt-[-0.44em] text-[18px] leading-[28px] mb-[-0.46em] font-medium text-foreground'}>
				<span className={'highlighted'}>{citation.quote}</span>
			</p>
		</div>
	</div>
}
const useHighlightSidebar = <T extends keyof HighlightSidebarProps>(selector: T): HighlightSidebarProps[T] => {
	const context = useContext(HighlightSidebarContext)
	if (!context) throw new Error("useHighlightSidebar must be used within a HighlightSidebarProvider")
	return context[selector]
}
export type BaseGhostUserField = Extract<keyof User, 'id' | 'name' | 'image' | 'displayUsername' | 'slug'>
export const GhostUser = (userOverrides?: Pick<User, BaseGhostUserField>, additionalFields?: Pick<User, Exclude<keyof User, BaseGhostUserField>>) => ({
	...(additionalFields || {}),
	id: "0",
	name: "Ghost",
	image: "",
	displayUsername: "Ghost",
	slug: "/404", ...(userOverrides || {})
}) as Partial<Omit<User, BaseGhostUserField>> & Required<Pick<User, BaseGhostUserField>>
type ResponseNode = {
	top: number;
	reference: string;
	memo: string;
	quote: string;
	author: AuthorOverview;
	updatedAt: string;
	createdAt: string;
}
const ReadInternal = ({post}: { post: SingleArticle }) => {
	const {
		id: postId, slug, author: {id: authorId},
	} = post;
	const user = useRPSession((r) => r.id);
	const userId = useMemo(() => user, [user]);
	const contentRef = useRef<HTMLDivElement>(null!);

	const [responseNodes, setResponseNodes] = useState<Array<{ top: number; reference: string }>>([]);
	const t = useTranslations();
	const [gotUser, setGotUser] = useState(false)
	const {
		data: color, refetch: colorUpdate, isLoading: colorLoading, isPending: colorPending
	} = useQuery<HighlightColors, Error, HighlightColors, ['color', string | undefined]>({
		queryKey: ['color', userId], queryFn: async ({queryKey: [_, userd]}) => {
			if ((typeof userd !== 'string') || !userd) throw new Error('No user ID')
			const r = await fetch('/api/payload-preferences/highlight-color', {
				method: 'GET', credentials: 'include',
			}).then(t => {
				if (t.ok) return t;
				throw new Error('Failed to fetch color preference');
			}).then(async (r) => await r.json() as Omit<PayloadPreference, 'id' | 'user' | 'key' | 'value'> & {
				"_id": string; "_v": number; user: string; key: string; value: HighlightColors
			}).then(r => {
				if (r.key === 'highlight-color') {
					if (Palettes.some(s => s === r.value)) return (setGotUser(true), r.value);
					throw new Error('Invalid color preference');
				}
			})
			if (!r) throw new Error('Invalid color');
			return r;
		}, enabled: Boolean(!!user),
	})
	const qc = useQueryClient();
	const colorUpdater = useMutation({
		onSuccess: ([newColor, userId]) => {

			qc.setQueryData(['color', userId], newColor)
			setCurrentColor(newColor);
		},
		mutationFn: async ({color, user}: { color: HighlightColors, user: string }) => fetch(
			`/api/payload-preferences/highlight-color`, {
				method: "POST", headers: {
					"Content-Type": "application/json",
				}, body: JSON.stringify({
					value: color,
				}), credentials: 'include'
			}).then(async (r) => {
			if (r.ok) {
				const res = await r.json() as {
					message: string; doc: {
						"user": string; "userCollection": "users" | "admins"; "key": string; "value": HighlightColors;
					}
				}
				if (res.doc && 'value' in res.doc && res.doc.value) {
					return res.doc.value;
				}
			}
			throw new Error('Update failed');
		}).then(r => {
			return [r, user] as [HighlightColors, string]
		})
	})
	const {disabled} = post;
	const {
		data: savedHighlights, refetch, isLoading,
	} = useQuery({
		queryKey: ["savedHighlights", postId], queryFn: async ({queryKey}) => {
			const p = queryKey[1];
			if (p) {
				return await fetchUserHighlights({
					collection: "posts", id: p,
				});
			}
			throw new Error('No article ID');
		}, enabled: Boolean(user), staleTime: 1000 * 60 * 2,
	});
	const pathName = usePathname();
	const setTitle = useTabMessenger((store) => store.setTitle);
	const highlighterRef = useRef<rangy.RangyHighlighter>(null!);
	const classApplierRef = useRef<rangy.RangyClassApplier>(null!);
	const [highlightMap, setHighlightMap] = useState<Array<{
		y: number; top: number;
	}>>([]);
	const containerRef = useRef<HTMLDivElement>(null!);
	const menuTrackId = useRef<ReturnType<typeof setInterval>>(null!);
	const lastResize = useWindowResize({
		debounce: 100, detectHeightChange: true,
	});
	const [progress, setProgress] = useState(0);
	const [render, setRender] = useState(false);
	const isSidebarOpen = useRPStore((r) => r.sidebarOpen);
	const toggleSidebar = useRPStore((r) => r.toggleSideDrawer);

	const postDisabled = useMemo(() => !!disabled, [disabled]);
	const [containerBounds, setContainerBounds] = useState(1);
	const scr = useLenis();
	const addHighlighter = useHighlighter((r) => r.addHighlight);
	const removeHighlighter = useHighlighter((r) => r.removeHighlight);
	useEffect(() => {
		const cont = contentRef.current || containerRef.current;
		if (cont) {
			const ratio = window.innerHeight / cont.scrollHeight;
			ratioRef.current = Math.max(1.2, ratio);
			setContainerBounds(ratio);
		}
	}, []);
	useEffect(() => {
		const cont = contentRef.current || containerRef.current;
		if (cont) {
			const ratio = window.innerHeight / cont.scrollHeight;
			ratioRef.current = Math.max(1.2, ratio);
			setContainerBounds(ratio);
		}
	}, [lastResize, scr]);

	useEffect(() => {
		setTitle(`${post.title} | @${post.author.displayUsername}`);
	}, [post, setTitle]);

	const [preamble, setPreamble] = useState<boolean>(false);
	const [lastColor, setLastColor] = useState<HighlightColors>('ORANGE');
	const lastColorRef = useRef(lastColor);
	const currentColor = useHighlighter(r => r.currentColor);
	const setCurrentColor = useHighlighter(r => r.setCurrentColor);
	const currentColorRef = useRef<HighlightColors>(currentColor);
	const highlights = useHighlighter((r) => r.highlights);
	const focusedHighlight = useHighlighter(r => r.focusedHighlight)
	const setFocusedHighlight = useHighlighter(r => r.setFocusedHighlight)
	const [menuPosition, setMenuPosition] = useState<{
		top: number; left: number;
	} | null>(null);
	const [menuTop, setMenuTop] = useState<null | number>(null);
	const [menuLeft, setMenuLeft] = useState<null | number>(null);
	const ratioRef = useRef(1);
	const menuoff = useRef(0);
	const scrollCB = useCallback((lenis: Lenis) => {
		if (!contentRef.current) return;
		setProgress(lenis.progress * ratioRef.current);
	}, [setProgress],);
	useLenis((l) => {
		l.on("scroll", scrollCB);
		return () => {
			l.off("scroll", scrollCB);
		};
	});
	const updateRect = useCallback((a: RangeRect, t: Element) => {
		const b = t.getBoundingClientRect();
		const right = Math.max(a.right, b.right);
		const left = Math.min(a.left, b.left);
		const width = right - left;
		return {
			top: Math.min(a.top, b.top), left, right, width,
		};
	}, []);
	const updateHighlightPosition = useCallback((e: HighlightedRange | Range | null) => {
		if (!e) {
			if (lastState.current) {
				setMenuPosition(null);
			}
			return;
		}

		let a: RangeRect = {
			top: 0, left: 0, right: 0, width: 0,
		};
		if ("els" in e) {
			const r = e.els[0];
			if (r) {
				a = r.getBoundingClientRect();
				e.els.forEach((e: Element) => {
					a = updateRect(a, e);
				})
			}

		} else {
			a = e.getBoundingClientRect();
		}

		const n = 0;
		setMenuPosition({
			top: a.top - 47 + window.scrollY, left: a.left + a.width / 2 - 224 - n,
		});
	}, [updateRect],);
	const lastState = useRef(render);
	useEffect(() => {
		if (!menuPosition && !lastState.current) return;
		showTO.current && (clearTimeout(showTO.current), (showTO.current = null!));
		setRender(false);
		if (!menuPosition) {
			setMenuTop(null);
			setMenuLeft(null);
			menuoff.current = 0;
			lastState.current = false;
		} else {
			setMenuLeft(menuPosition.left);
			setMenuTop(menuPosition.top);
			setRender(true);
			lastState.current = true;
		}
	}, [menuPosition]);
	const showTO = useRef<ReturnType<typeof setTimeout>>(null!);

	const handleHighlightClick = useCallback((e: Event) => {
		e.stopPropagation();
		if (!e.currentTarget) return;
		const target = e.currentTarget as Element;
		const t = highlights.find((t) => t.els.some((t) => t === target)) || null;
		const ref = target.getAttribute("data-reference");
		t && ref && (t.reference = ref);
		setFocusedHighlight(t);
		updateHighlightPosition(t);
	}, [setFocusedHighlight, updateHighlightPosition, highlights],);

	const setCursor = useCursorStore((r) => r.setCursorState);
	const onEn = useCallback(() => {
		setCursor("FOCUS");
	}, [setCursor]);
	const onExit = useCallback(() => {
		setCursor(null);
	}, [setCursor]);

	const deleteHighlight = useCallback(async ({
		userId, fh, hr,
	}: {
		userId: string; fh: HighlightedRange | null; hr: HighlightedRange[];
	}) => {
		setMenuPosition(null);
		const selection = window.getSelection();
		if (!selection) return;
		if (!userId) {
			errorToast("You must be checked in to delete highlights.");
			return;
		}
		selection.removeAllRanges();
		if (!fh || !("els" in fh) || !fh.els) return;
		const deleteResult = await deleteUserHighlight({
			author: userId, article: postId, reference: [fh.reference]
		});
		const t = document.createRange();
		const a = fh.els[0];
		const n = fh.els[fh.els.length - 1];
		a && t.setStartBefore(a);
		n && t.setEndAfter(n);
		selection.addRange(t);
		const positionRangeIndex = hr.findIndex((e) => e.reference === fh.reference);
		const isOkay = Boolean(deleteResult && positionRangeIndex !== -1);
		if (isOkay) {
			hr[positionRangeIndex]!.els.forEach((e) => {
				const parentNode = e.parentNode;
				if (parentNode) {
					if (e.className === "highlighted") {
						while (e.firstChild) {
							parentNode.insertBefore(e.firstChild, e);
						}
						e.remove();
					}
					(e as HTMLElement).style.backgroundImage = "none";
					(e as HTMLElement).classList.remove("highlighted");
					(e as HTMLElement).removeAttribute("data-reference");
				}
			});
			removeHighlighter(deleteResult!, userId)
			// setHighlights((e) => {
			// 	const t = [...e];
			// 	const sele = t[positionRangeIndex];
			// 	if (!sele) return t;
			// 	const text = sele.els.reduce((prev, next, _index) => {
			// 		return (prev += next.innerHTML);
			// 	}, "");
			//
			// 	t.splice(positionRangeIndex, 1);
			// 	return t.filter((r) => r.selection.text !== text);
			// });
			setFocusedHighlight(null);
			selection.removeAllRanges();
		} else {
			errorToast("Something went wrong while trying to delete the selection. Try again in a few secs!",);
		}
	}, [postId, removeHighlighter, setFocusedHighlight],);
	const createHighlightAPI = useCallback(async (props: RangeSaveParams | Array<RangeSaveParams>) => {
		const processTargets = Array.isArray(props) ? props : [props];
		const processing = processTargets.flatMap(r => (r.selection.text) ? r : []).map(async (highlight) =>

			createUserHighlight({
				target: {
					relationTo: "posts", value: postId, slug: slug,
				}, citation: {
					private: highlight.private || false,
					memo: highlight.memo || "",
					reference: highlight.reference, selection: {
						text: highlight.selection.text, before: `"...`, after: `..."`
					},
					color: highlight.color,
					path: highlight.path,
					userId: userId,
					cited: authorId, quote: `"...${highlight.selection.text}..."`,

				},
			}));
		const highlighsFreal: Array<Omit<HighlightedRange, 'els' | 'range'>> = [];
		const errors = new Set();
		const fi = await Promise.allSettled(processing);
		for (const r of fi) {
			if (r.status === "fulfilled" && r.value) {
				const rr = r.value;
				highlighsFreal.push({
					...rr, color: currentColorRef.current
				});
			} else if (r.status === "rejected") {
				if (r.reason instanceof HighlightCreateError) {
					errors.add(r.reason.message);
				}
			} else {
				errors.add("Something went wrong");
			}
		}

		if (errors.size > 0) {
			const errorMessages = Array.from(errors).join(", ");
			errorToast(`We couldn't create your highlights: ${errorMessages}. Please try again later.`,);
		}
		return highlighsFreal;
	}, [authorId, postId, slug, userId],);

	const createHighlight = useCallback(async ({userId, memo}: { userId?: string; memo?: string }) => {
		const base = contentRef.current;
		if (!base) return;

		const selection = rangey.getSelection();
		const rangeAt = selection.getRangeAt(0);

		if (userId && base.contains(selection.anchorNode) && isMarkable(selection)) {

			const nanoid1 = nanoid(17);

			const text = rangeAt.toString();
			if (typeof text === 'string' && text.length > 0) {

				const toPass = {
					memo: memo, reference: nanoid1, color: lastColor, userId, selection: {
						text: text, before: '"...', after: '..."',
					}, path: pathName, cited: authorId, quote: `"...${text}..."`
				} satisfies RangeSaveParams;


				const res = await createHighlightAPI(toPass);
				const newH = res.at(0);
				if (newH) {
					const previousHighlight = contentRef.current.querySelectorAll(".highlighted");
					const n = classApplierRef.current;
					n.applyToSelection();
					const highLightedNodes = contentRef.current.querySelectorAll(".highlighted");
					const elements: Element[] = [];
					const previousHighlightArray = Array.from(previousHighlight);
					highLightedNodes.forEach((e) => {
						if (!previousHighlightArray.includes(e)) {
							e.setAttribute("data-reference", nanoid1);
							elements.push(e);
						}
					});
					const newHighlight = {
						...newH,
						selection: {
							...newH.selection,
						},
						quote: newH.quote,
						id: newH.id,
						cited: newH.cited,
						reference: newH.reference,
						memo: newH.memo,
						range: rangeAt,
						els: elements,
					} satisfies HighlightedRange;
					setFocusedHighlight(newHighlight);
					addHighlighter(newHighlight);
					selection.removeAllRanges();
					return newHighlight;
				}
			}
			selection.removeAllRanges();
			return;
		} else {
			setFocusedHighlight(null);
			setMenuPosition(null);
			selection.removeAllRanges();
			return;
		}

	}, [lastColor, pathName, authorId, createHighlightAPI, setFocusedHighlight, addHighlighter],);
	useEffect(() => {
		lastColorRef.current = lastColor;
	}, [lastColor]);
	const updateHighlight = useCallback(
		async (toSave: HighlightedRange | Array<HighlightedRange>, highlightArray: Array<HighlightedRange>) => {
			const saveParams = Array.isArray(toSave) ? toSave : [toSave];
			if (saveParams.length === 0) return;
			const res = await updateUserHighlight({
				highlights: highlightArray, saveParams, user: userId, article: postId, color: currentColorRef.current,
			})
			addHighlighter(res)
			const r = res.find(a => (a.reference === saveParams[0]!.reference));
			if (r) {
				setFocusedHighlight(r);
			}
		}, [addHighlighter, postId, setFocusedHighlight, userId]);
	useEffect(() => {

		if (color) {
			setCurrentColor(color);
			currentColorRef.current = color;

		}
	}, [setCurrentColor, color])
	const changeCurrentHighlightColor = useCallback((colorWay: HighlightColors) => {
		// const toPass: HighlightedRange = {
		// 	range: fc.range,
		// 	id: fc.id,
		// 	memo: fc.memo,
		// 	path: fc.path,
		// 	cited: fc.cited,
		// 	reference: fc.reference,
		// 	selection: {
		// 		...fc.selection
		// 	},
		// 	els: fc.els,
		// 	color: colorWay,
		// 	createdAt: fc.createdAt,
		// 	private: fc.private,
		// 	quote: fc.quote,
		//
		// }
		colorUpdater.mutate({color: colorWay, user: userId})

	}, [colorUpdater, userId]);
	/**
	  const newE: ProcessedRangy[] = localHighlights.map((n) => {
		let i = "";
		focused.els.forEach((e) => {
		  i += (e as HTMLElement).innerText;
		});
		i === n.selection.text && (n.color = colorWay);
		return {
		  selection: {
			text: n.selection.text,
			before: n.selection.before,
			after: n.selection.after,
		  },
		  color: n.color,
		  createdAt: n.createdAt,
		  reference: n.reference,
		  path: n.path,
		};
	  });
	 *
	 */

	const lastRangeAt = useRef<rangy.RangyRange | null>(null);
	const containerMouseUp = useCallback(() => {
		const base = contentRef.current;
		if (!base) return;
		const e = rangey.getSelection();
		const t = e.getRangeAt(0);
		if (isMarkable(e) && t && "nativeRange" in t) {
			if (!t.collapsed && base.contains(e.anchorNode)) {
				setFocusedHighlight(null);
				updateHighlightPosition(t.nativeRange);
			}
			lastRangeAt.current = t;
		} else {
			updateHighlightPosition(null);
			setFocusedHighlight(null);
			lastRangeAt.current = null;
		}
	}, [setFocusedHighlight, updateHighlightPosition]);
	const updateMiniMap = useCallback(async (highlighters: HighlightedRange[]) => {
		const a: Array<{
			y: number; top: number;
		}> = [];
		const b: Array<{
			top: number; reference: string; memo: string; quote: string; author: AuthorOverview
			updatedAt: string; createdAt: string;
		}> = [];
		const wh = window.innerHeight;
		const cont = contentRef.current;
		if (!cont) return;
		const contDimension = cont.offsetHeight;
		const contOffset = cont.offsetTop;
		highlighters.forEach((e) => {
			let n = 0;
			let i = contOffset;
			e.els.forEach((t, i) => {
				const tt = (t as HTMLElement).offsetTop;
				if (i > 0) {
					n = Math.min(n, tt);
				} else {
					n = tt;
				}
			});
			i = i + n;
			a.push({
				y: i, top: n / contDimension * wh * 0.85,
			});
			if (e.memo && e.memo.length > 0) {
				b.push({
					quote: e.quote || `${e.selection.before}${e.selection.text}${e.selection.after}`,
					top: n,
					reference: e.reference,
					memo: e.memo,
					author: e.author,
					updatedAt: e.updatedAt,
					createdAt: e.createdAt,
				})
			}
		});
		if (b.length > 0) {
			// const r = b.reduce((prev, x) => {
			// 	if (prev.some(r => r === x.authorId)) {
			// 		return prev;
			// 	}
			// 	return [...prev, x.authorId]
			// }, [] as string[]).map(async (v) => {
			// 	const au = v;
			// 	const select: UsersSelect = {
			// 		image: true, name: true, displayUsername: true, slug: true, banned: true
			// 	}
			// 	return await fetch(`/api/users/${au}/${stringify(select, {addQueryPrefix: true})}`, {
			// 		headers: {
			// 			'Content-Type': 'application/json'
			// 		}, credentials: 'include', method: 'GET'
			// 	}).then(r => {
			// 		if (r.ok) {
			// 			return (r.json() as Promise<Pick<User, 'id' | 'image' | 'displayUsername' | 'name' | 'slug' | 'banned'>>)
			// 		}
			// 		throw new Error("Something went wrong")
			// 	})
			// });
			// const sv = await Promise.allSettled(r);
			// const re = sv.flatMap((tm, i) => {
			// 	if (tm.status === 'fulfilled') {
			// 		return( tm.value.banned ? {
			// 			...GhostUser(),
			// 			ogId: tm.value.id,
			// 		} : {
			// 			id: tm.value.id,
			// 			ogId: tm.value.id,
			// 			name: tm.value.name,
			// 			slug: tm.value.slug,
			// 			image: tm.value.image,
			// 			displayUsername: tm.value.displayUsername || tm.value.name,
			// 		}) satisfies AuthorOverview & { ogId: string };
			// 	}
			// 	return []
			// });

			setResponseNodes((vvv) => {
				const r = [...vvv]
				b.forEach((s) => {
					const eI = r.findIndex(v => v.reference === s.reference);
					if (eI > -1) {
						r[eI] = {
							...s
						}
					} else {
						r.push(s);
					}
				})
				return r;
			})
		} else {
			setResponseNodes([]);
		}
		setHighlightMap(a);
	}, []);
	useEffect(() => {
		const cont = contentRef.current;
		if (!cont) return;
		cont.removeEventListener("mouseup", containerMouseUp, false);
		cont.addEventListener("mouseup", containerMouseUp, false);
		const onResizeHighlights = () => updateHighlightPosition(focusedHighlight);
		const highlightedNodes = cont.querySelectorAll(".highlighted");
		highlightedNodes.forEach((e) => {
			e.removeEventListener("click", handleHighlightClick);
			e.removeEventListener("mouseenter", onEn);
			e.removeEventListener("mouseleave", onExit);
			e.addEventListener("mouseenter", onEn);
			e.addEventListener("mouseleave", onExit);
			e.addEventListener("click", handleHighlightClick);
		});
		window.addEventListener("resize", onResizeHighlights);
		updateMiniMap(highlights);
		return () => {
			cont.removeEventListener("mouseup", containerMouseUp, false);
			highlightedNodes.forEach((e) => {
				e.removeEventListener("click", handleHighlightClick);
				e.removeEventListener("mouseenter", onEn);
				e.removeEventListener("mouseleave", onExit);
			});
			window.removeEventListener("resize", onResizeHighlights);
		};
	}, [focusedHighlight, updateHighlightPosition, containerRef, highlights, lastResize, containerMouseUp,
		updateMiniMap, onEn, onExit, handleHighlightClick,]);

	const updateColors = useRef<(props: {
		targets: HTMLElement[]; fromColor: HighlightColors; toColor: HighlightColors;
	}) => void>(null!);
	const addListeners = useCallback((targets: HTMLElement[]) => {
		targets.forEach((e) => {
			e.addEventListener("click", handleHighlightClick);
		});
	}, [handleHighlightClick]);
	useGSAP(() => {
		updateColors.current = (props) => {
			const {targets, fromColor, toColor} = props;
			const from = HighlightPalette[fromColor];
			const to = HighlightPalette[toColor];
			gsap.to(targets, {
				onStart: () => {
					targets.forEach((e) => {
						e.classList.remove('highlighted');
						e.removeEventListener("click", handleHighlightClick);
					});
				},
				delay: 0.05,
				backgroundImage: `linear-gradient(to left, oklch(${from}/.01) 0%, okclh(${from}/.1) 40%, oklch(${to}/.01) 50%, oklch(${to}/.85) 100%)`,
				onComplete: () => {
					targets.forEach((e) => {
						e.classList.add('highlighted');
					})
					addListeners(targets);
					gsap.to(targets, {
						delay: 0.2, clearProps: "backgroundImage",
					})
				},
				duration: 0.2,
				ease: "power2.inOut",
			});

		};
	}, {dependencies: [handleHighlightClick, addListeners], scope: containerRef},);

	useEffect(() => {

		const targets = highlights.reduce((r, e) => [...r, ...(e.els as HTMLElement[])], [] as HTMLElement[]);
		targets.length > 0 && updateColors.current && (updateColors.current(
			{targets, fromColor: lastColorRef.current, toColor: currentColor}))
	}, [highlights, currentColor]);
	const handleShareHighlight = useCallback((e) => {
		e.stopPropagation();
		const se = rangey.getSelection();
		let a = se?.toString();
		if (!a && focusedHighlight) {
			a = focusedHighlight.els.map((e) => (e as HTMLElement).innerText).join(" ");
		}
		navigator.clipboard.writeText(a).then((r) => {
			successToast(t('Highlights.share.copy'));
		}).catch(e => (errorToast(t('Highlights.error.share.copy'))));
	}, [focusedHighlight, t],);
	const handleHighlightSaveOrDelete: MouseEventHandler<HTMLButtonElement> = useCallback(async (e) => {
		e.stopPropagation();
		if (!user) {
			errorToast("You must be checked in to save highlights.");
			return;
		}
		if (postDisabled) {
			errorToast("You can't save highlights on a disabled post.");
			return;
		}
		if (focusedHighlight) {
			await deleteHighlight({
				hr: highlights, userId: userId, fh: focusedHighlight,
			}).then(() => {
				setCursor(null);
			});
		} else {
			await createHighlight({
				userId,
			})
		}
	}, [user, postDisabled, focusedHighlight, deleteHighlight, highlights, userId, setCursor, createHighlight]);
	const handleUpdateHighlight = useCallback(async (fc: HighlightedRange) => {
		await updateHighlight(fc, highlights)
	}, [highlights, updateHighlight])

	const findTextNode = useCallback((e: Node, offsetValue: number) => {
		let a = 0;
		const traverseNodes = (e: Node): null | { node: Text; offset: number } => {
			if (e.nodeType === Node.TEXT_NODE) {
				const tt = e as Text;
				if (a + tt.length >= offsetValue) {
					return {
						node: tt, offset: offsetValue - a,
					};
				}
				a += tt.length;
			} else {
				for (const t of e.childNodes) {
					const result = traverseNodes(t);
					if (result) {
						return result;
					}
				}
			}
			return null;
		};
		return traverseNodes(e);
	}, []);
	const applyHighlightCallback = useCallback((t: Omit<ProcessedRangy, 'author'> & { author: AuthorOverview }) => {
		const base = contentRef.current;
		if (!base) return;
		const {text: a} = t.selection;
		const n = base.textContent?.indexOf(a) || -1;
		if (n === -1) {
			return false;
		}
		const i = n + a.length;
		const o = findTextNode(base, n);
		const s = findTextNode(base, i);
		if (!o || !s) {
			return false;
		}
		const r = rangey.createRange();
		r.setStart(o.node, o.offset);
		r.setEnd(s.node, s.offset);
		const l = Array.from(base.querySelectorAll(".highlighted"));
		const vv = rangey.getSelection();
		vv.setSingleRange(r);

		if (!classApplierRef.current) {
			classApplierRef.current = rangey.createClassApplier("highlighted", {
				ignoreWhiteSpace: true, elementTagName: "mark", normalize: true,
			});
		}
		classApplierRef.current.applyToRange(r);
		// highlighterRef.current.highlightSelection(".highlighted");
		const h = Array.from(base.querySelectorAll(".highlighted")).filter((e) => !l.includes(e),) as HTMLElement[];

		const c = {
			id: t.id,
			cited: t.cited as string,
			private: t.private,
			memo: t.memo,
			reference: t.reference,
			path: t.path,
			quote: t.quote,
			createdAt: t.createdAt, author: t.author,

			range: r,
			els: h,
			color: (Palettes.find(r => (r as string) === t.color) as null | HighlightColors) || currentColorRef.current,
			selection: {
				text: a, before: `"...`, after: `..."`,
			}, updatedAt: t.updatedAt,
		} satisfies HighlightedRange;
		const {startOffset, endOffset, startContainer, endContainer} = r;
		if (startContainer.nodeType === Node.TEXT_NODE && base.contains(
			startContainer) && (startContainer as Text).data) {
			c.selection.before = (startContainer as Text).data.substring(startOffset - 10, startOffset,);
		} else if (startContainer.previousSibling && base.contains(
			startContainer.previousSibling) && (startContainer.previousSibling as Text).data) {
			c.selection.before = (startContainer.previousSibling as Text).data.substring(
				(startContainer.previousSibling as Text).data.length - 10,);
		} else {
			return;
		}
		if (endContainer.nodeType === Node.TEXT_NODE && (endContainer as Text).data) {
			c.selection.after = (endContainer as Text).data.substring(endOffset, endOffset + 10,);
		} else if (endContainer.nextSibling && base.contains(
			endContainer.nextSibling) && endContainer.nextSibling.nodeType === Node.TEXT_NODE && (endContainer.nextSibling as Text).data) {
			c.selection.after = (endContainer.nextSibling as Text).data.substring(0, 10,);
		} else {
			return;
		}

		updateColors.current && updateColors.current({
			targets: h, fromColor: lastColorRef.current, toColor: currentColorRef.current,
		});
		vv.removeAllRanges();
		return c;
	}, [findTextNode],);
	const hasRun = useRef(false)
	useEffect(() => {
		if (savedHighlights) {

			const r = savedHighlights.docs.flatMap((range) => range || [])
			const ss: HighlightedRange[] = []
			r.forEach(c => {
				const r = applyHighlightCallback(c);
				r && (ss.push(r))
			})
			if (ss.length > 0) addHighlighter(ss)
		}
	}, [savedHighlights, applyHighlightCallback, addHighlighter])
	useLayoutEffect(() => {
		if (hasRun.current) return;
		rangey.init();
		const cont = contentRef.current;
		if (postDisabled || !userId || !cont) {
			return () => {
			};
		}

		if (!highlighterRef.current) {
			highlighterRef.current = rangey.createHighlighter();
		}
		if (!classApplierRef.current) {
			classApplierRef.current = rangey.createClassApplier("highlighted", {
				ignoreWhiteSpace: true, elementTagName: "mark", normalize: true,
			});
			highlighterRef.current.addClassApplier(classApplierRef.current);
		}

		hasRun.current = true;

		return () => {
			const e = cont.querySelectorAll("mark.highlighted");
			e.forEach((e) => {
				e.removeEventListener("click", handleHighlightClick);
			});
			hasRun.current = false;
		};
	}, [savedHighlights, applyHighlightCallback, handleHighlightClick, postDisabled, pathName, userId, addHighlighter]);

	return (<>
		<div
			className={"rp_story bg-faded-white dark:bg-faded-black z-[120] w-[calc(100vw-20px)] pb-[20px] leading-[1.28]"}
			data-themed="background-color,color"
			style={{'--currentHighlight': HighlightPalette[currentColor]} as CSSProperties}>
			<div
				className="border-x-muted-faded-foreground pointer-events-none absolute top-0 left-[18px] z-[30] h-full w-[calc(100%-36px)] border-0 border-x-[1px] border-solid opacity-20"
				style={{
					borderImage: "initial",
				}} />
			<div className="h-full w-full">
				<div className="z-[3] h-full w-full">
					<div className={"w-full"}>
						<article className="rp-article relative w-full" data-id={postId}
						         data-themed="background-color,color">
							<FeaturedCard post={post} />
							<div className="mx-auto my-[28px] w-full max-w-[var(--maxContainerWidth)] px-0 py-[32px]"
							     ref={containerRef}>
								<div className="rp-content [&>*]:col-[main] [&>aside]:col-3" ref={contentRef}>
									<Aside>
										{responseNodes.map(r => (<ResponseIndicator key={r.reference} top={r.top}
										                                            reference={r.reference} />))}
									</Aside>
									{post.disabled ? (<Locked />) : (
										<RichText data={post.content} enableGutter={false} />)}
								</div>
							</div>
							<div className="f-divider mt-[50px] h-[1px] w-full min-w-[1px]" />
						</article>
					</div>
					<HighlightMenu createCallback={createHighlight} userId={userId} target={{
						relationTo: "posts", value: postId, authorId: post.author.id,
					}} visible={render} top={menuTop} left={menuLeft} handleShareHighlight={handleShareHighlight}
					               handleUpdate={handleUpdateHighlight}
					               handleSaveHighlight={handleHighlightSaveOrDelete}
					               handleChangeHighlightColor={changeCurrentHighlightColor} />
					<MiniMap highlightMap={highlightMap} scaleRatio={containerBounds} />
				</div>
			</div>
			<div className="fixed right-0 bottom-[30px] left-0 z-[120] mx-auto mb-[24px] w-full">
				<div className={"grid grid-cols-[auto_1fr_auto] items-stretch gap-y-5"}>
					<div className="relative col-[2] justify-self-center">
						<AnimatePresence mode={"wait"}>
							{progress > 0.05 && progress < 1 && (<m.div initial={"hidden"} variants={{
								hidden: {
									y: 60, opacity: 0, zIndex: -1, transition: {
										type: "spring", bounce: 0.4, delay: 0.4,
									},
								}, visible: {
									y: 0, opacity: 1, zIndex: 120, transition: {
										type: "spring", delay: 0.1, bounce: 0.4,
									},
								},
							}} onMouseEnter={onEn} onMouseLeave={onExit} animate={"visible"} exit={"hidden"}>
								<ProgressBar progress={progress} title={post.title}>
									<BookmarkButton postId={postId} userId={userId} collection={'posts'} />
								</ProgressBar>
							</m.div>)}
						</AnimatePresence>
					</div>
				</div>
			</div>
		</div>
		<div className="relative" style={{
			backgroundImage: `linear-gradient(to bottom, oklch(var(--faded-bg)/1) 22%, oklch(var(--faded-bg)/0.95) 35%, oklch(var(--faded-bg)/0.6) 58%, oklch(var(--faded-bg)/0.2) 65%, oklch(var(--faded-bg)/0.05) 82%, oklch(var(--faded-bg)/0.001) 96%)`,
			zIndex: 100,
			height: "20vh",
			width: "100vw",
			top: "0px",
			marginTop: "0px",
			marginBottom: "-5vh",
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			position: "relative",
		}}>
			<div
				className="absolute top-0 left-0 z-[50] h-px w-screen bg-gradient-to-r from-[oklch(var(--muted-faded-fg)/0.15)] from-10% via-[oklch(var(--muted-faded-fg)/0.75)] via-50% to-[oklch(var(--muted-faded-fg)/0.15)] to-90%" />
		</div>
		<PrevNext prev={post.relatedPosts[0] || fallback({direction: "prev"})}
		          next={post.relatedPosts[1] || fallback({direction: "next"})} />
		<div
			className={"pointer-events-none fixed top-0 left-0 z-[255] h-[100lvh] w-full opacity-[0.04] transition-opacity duration-500"}
			style={{
				backgroundImage: `url(/assets/papier.png)`,
				backgroundPosition: "0% 0%",
				backgroundSize: "200px 200px",
				backgroundRepeat: "repeat",
			}}></div>
	</>);
};
const BookmarkButton = ({
	postId, userId, collection
}: {
	postId: string, userId: string, collection: Bookmark["target"]["relationTo"];
}) => {
	const qc = useQueryClient();
	const where = useMemo(() => ({
		and: [{
			'target.value': {
				equals: postId,
			}
		}, {
			user: {
				equals: userId
			}
		}, {
			'target.relationTo': {
				equals: `${collection}`,
			}
		}]
	}) as Where, [userId, postId, collection]);
	const [initialized, setInitialized] = useState(false);
	const fetcher = useCallback(async () => {
		const r = await fetch(`/api/bookmarks/count/${stringify(where, {addQueryPrefix: true})}`);
		if (r.ok) {
			const res = await r.json() as {
				totalDocs: number;
			};
			return res.totalDocs > 0;
		}
		throw new Error('Not found');
	}, [where,])
	const {refetch, data: hasBookmark, isPending, isError, isFetching, isSuccess} = useQuery({
		queryKey: ['bookmarks', userId, postId, collection], queryFn: fetcher, enabled: !initialized,
	})
	const [bookmarked, setBookmarked] = useState(Boolean(hasBookmark));
	useEffect(() => {
		if (!isPending) {
			if (isSuccess) {
				setBookmarked(hasBookmark || false);
			} else {
				setBookmarked(false);
			}
		}
	}, [hasBookmark, isPending, isSuccess, isError])
	const removeBookmark = useRPSession(r => r.deleteBookmark)
	const addBookmark = useRPSession(r => r.addBookmark)
	const hasBookmarkRef = useRef(!!hasBookmark);
	useEffect(() => {
		hasBookmarkRef.current = !!hasBookmark;
	}, [hasBookmark])
	const dB = useCallback(async () => {

		const args = stringify({where}, {addQueryPrefix: true});
		const res = await fetch(`/api/bookmarks/${args}`, {
			method: "DELETE", credentials: "include", headers: {
				'Content-Type': 'application/json'
			}
		}).then(async r => await r.json() as { docs: Bookmark[]; errors: object[] }).then(r => {
			if (r.docs && r.docs.length > 0) {
				return r.docs[0] as Bookmark;
			}
			return null;
		}).catch(e => {
			console.log(e)
			return null
		})
		if (res) {
			removeBookmark({
				collection: res.target.relationTo as Bookmark['target']['relationTo'], id: res.target.value as string
			})
			return true;
		}
		return false;
	}, [removeBookmark, where])
	const body = useMemo(() => ({
		target: {
			relationTo: collection, value: postId
		}, user: userId,
	}) as Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>, [postId, userId, collection])
	const cB = useCallback(async () => {


		const res = await fetch('/api/bookmarks', {
			method: "POST", headers: {
				'Content-Type': 'application/json'
			}, credentials: "include", body: JSON.stringify(body)
		}).then(async r => await r.json() as { doc: Bookmark; message: object[] }).then(r => {
			if (r.doc) {
				return r.doc as Bookmark;
			}
			return null;
		}).catch(e => {
			console.log(e)
			return null
		})
		if (res) {
			addBookmark({
				id: res.target.value as string, collection: res.target.relationTo as Bookmark['target']['relationTo']
			})
			return true;
		}

		return false;
	}, [body, addBookmark])
	const createBookmark = useMutation({
		mutationFn: cB, onSuccess: (res) => {
			if (res) {
				qc.setQueryData(['bookmarks', userId, postId, collection], true);
			}
		}
	})
	const deleteBoookmark = useMutation({
		mutationFn: dB, onSuccess: (res) => {
			if (res) {
				qc.setQueryData(['bookmarks', userId, postId, collection], false);
			}
		}
	})
	const bookmarkSaveOrDelete: MouseEventHandler = useCallback(async (e) => {
		e.preventDefault();
		if (hasBookmarkRef.current) {
			deleteBoookmark.mutate()
		} else {
			createBookmark.mutate()
		}
	}, [deleteBoookmark, createBookmark])
	return (!userId || !postId) ? (<></>) : (<div className={'flex'}>
		<MotionBtn transition={{type: "spring", bounce: 0.4}} whileTap={{scale: 0.9}} whileHover={{
			scale: 1.1,
		}} onClick={bookmarkSaveOrDelete}
		           className={'flex h-full items-center justify-center [&_svg_path]:stroke-[1.5px]'}
		           disabled={isFetching || isPending}>
			{bookmarked ? <BookmarkFilledIcon strokeLinecap={'round'} strokeLinejoin={'miter'} /> :
				<BookmarkIcon strokeLinecap={'round'} strokeLinejoin={'miter'} />}
		</MotionBtn>
	</div>)
}

const ProgressBar = ({
	progress, title, children, ...props
}: Omit<HTMLMotionProps<'div'>, 'ref'> & {
	progress: number; title: string;
}) => {
	return (<>
		<m.div className="relative z-[120] overflow-hidden rounded-[18px] p-1"
		       {...props} transition={{type: "spring", bounce: 0.25}} whileTap={{scale: 0.9}} whileHover={{
			scale: 1.1, borderColor: "oklch(var(--transparent-white)/0.001)",
		}}>
			<div className="bg-muted-off-background/35 absolute top-0 left-0 z-[120] h-full w-full"></div>
			<m.div className="absolute top-0 left-0 z-[119] h-full w-full opacity-[0.001]"
			       transition={{type: "spring", bounce: 0.25}} variants={{
				active: {
					opacity: 1, backdropFilter: "blur(20px) saturate(1.15)",
				}, hidden: {
					backdropFilter: "blur(0px) saturate(1)", opacity: 0.001,
				},
			}} animate={"active"} initial={"hidden"} exit={"hidden"}></m.div>
			<div
				className="relative z-[120] flex w-fit max-w-[400px] min-w-[150px] origin-[50%_50%_0px] transform-none flex-col flex-nowrap items-start justify-center gap-0 overflow-hidden rounded-[12px] border-[oklab(0.7716_-0.00387748_-0.0277302/0.1)] px-[12px] py-[6px] select-none">
				<div
					className="filter-blur-0 transform-origin-[50%_50%_0px] flex w-full transform-none items-center gap-4 opacity-100">
					<div className="h-8 w-8 origin-[50%_50%_0px] rounded-[50%]">
						<svg width="20" height="20" viewBox="0 0 20 20" style={{transform: "rotate(-90deg)"}}>
							<defs>
								<linearGradient id="col" gradientUnits="userSpaceOnUse">
									<stop offset="0%" stopColor="oklch(var(--faded-fg)/.7)" />
									<stop offset="85%" stopColor="oklch(var(--faded-d-gray)/.8)" />
								</linearGradient>
							</defs>
							<circle className={"stroke-off-l-gray/100 dark:stroke-off-d-gray/100"} cx="10" cy="10" r="8"
							        strokeWidth="1.25" fill="none" strokeLinecap="round"></circle>
							<circle className={"stroke-[url(#col)]"} cx="10" cy="10" r="8" strokeWidth="1.25"
							        fill="none" strokeDasharray={`${progress}px 1px`} strokeLinecap="round"
							        pathLength="1" strokeDashoffset="0px"></circle>
						</svg>
					</div>
					<div
						className={"m-0 overflow-hidden p-0 text-center align-middle font-sans text-lg font-light tracking-[0.3px] text-ellipsis whitespace-nowrap"}>
						{title}
					</div>
					{children && (<m.div className={'flex items-center gap-2 h-full justify-center'}>
						{children}
					</m.div>)}
				</div>
			</div>
		</m.div>
		<div className="relative"></div>
	</>);
};
export type HighlightMenuProps = {
	visible: boolean;
	top: number | null;
	left: number | null;

	createCallback: (prop: { userId?: string; memo?: string }) => Promise<HighlightedRange | null | undefined>;
	handleShareHighlight: (e: MouseEvent<HTMLButtonElement>) => void;
	handleSaveHighlight: (e: MouseEvent<HTMLButtonElement>) => void;
	handleChangeHighlightColor: (color: HighlightColors,) => void;

	handleUpdate: (fc: HighlightedRange) => Promise<void>;
	target: {
		relationTo: HighlightsCollection; value: string; authorId: string;
	};
	userId?: string;
};
const HighlightMenu = ({
	visible, userId,

	handleShareHighlight, handleUpdate, createCallback, top, left, handleSaveHighlight, handleChangeHighlightColor,

	target,
}: HighlightMenuProps) => {
	const currentHighlightColor = useHighlighter(r => r.currentColor)
	const [render, setRender] = useState(false);
	const {authorId} = target;
	const ref = useRef<HTMLDivElement>(null!);
	const lastVisible = useRef(false);
	const focusedHighlight = useHighlighter(r => r.focusedHighlight);
	const lastCoords = useRef({x: 0, y: 0});
	const lastTime = useRef(0);
	const doMe = useCallback((e: Event) => {
		if (!e.target) return;
		if (!ref.current) {
			document.body.removeEventListener("click", doMe);
			return;
		}
		if (!ref.current.contains(e.target as HTMLElement)) {
			setRender(false);
			document.body.removeEventListener("click", doMe);
		}
	}, []);
	useEffect(() => {
		const now = DateTime.now().toMillis();
		const delta = now - lastTime.current;
		document.body.removeEventListener("click", doMe);
		if (lastVisible.current !== visible || delta > 400) {
			const topo = typeof top === "number" ? top : 0;
			const lefto = typeof left === "number" ? left : 0;
			lastCoords.current = {x: lefto, y: topo};
			setRender(visible);
			lastTime.current = now;
			document.body.addEventListener("click", doMe);
		}

		lastVisible.current = visible;
	}, [visible, top, left, doMe]);

	return (<AnimatePresence mode="wait">
		{render && (<m.div ref={ref} key={"res"}
		                   className={cn("absolute z-[250] m-0 flex overflow-hidden rounded-2xl border-none opacity-0",
			                   "pointer-events-auto",)} data-themed={"background-color"} style={{
			top: `${lastCoords.current.y}px`, left: `${lastCoords.current.x}px`,
		}} initial={{
			opacity: 0,
		}} animate={{
			opacity: 1, transition: {
				delay: 0.1,
			},
		}} exit={{
			opacity: 0,
		}} transition={{
			duration: 0.3, ease: "easeOut",
		}}>
			<div className={"relative z-[210] h-full w-full p-0"}>
				<div className={"bg-faded-d-gray dark:bg-faded-l-gray absolute top-0 left-0 z-[1] h-full w-full"} />
				<m.div className={"text-off-foreground z-[23] flex h-[44px] items-center px-3.5"}>
					<HighlightSaveButton saveCallback={handleUpdate} createCallback={createCallback}
					                     className={'border-r-[1px]'} documentHandler={doMe} userId={userId}
					                     authorId={authorId}>
					</HighlightSaveButton>
					<HighlightMenuButton onClick={handleSaveHighlight}>
						{focusedHighlight ? "Delete" : "Highlight"}
						<MenuButtonCaption>
							<svg width="7" height="7.5" viewBox="0 0 7 7.5" fill="none"
							     xmlns="http://www.w3.org/2000/svg">
								<path
									d="M3.7 7.46C3.33 7.46 3.08 7.11 3.08 6.66C3.08 6.41 3.17 6.03 3.35 5.52C3.53 5 3.62 4.5 3.62 3.98C3.18 4.25 2.85 4.53 2.6 4.81C2.1 5.37 1.61 5.92 1.09 5.92C0.77 5.92 0.51 5.67 0.51 5.37C0.51 5.04 0.78 4.71 1.37 4.55C1.66 4.47 1.99 4.38 2.36 4.31C2.72 4.24 3.12 4.08 3.54 3.84C3.11 3.6 2.7 3.44 2.32 3.36C1.57 3.2 0.97 3.07 0.71 2.77C0.58 2.62 0.51 2.46 0.51 2.29C0.51 1.99 0.75 1.76 1.1 1.76C1.63 1.76 2.25 2.46 2.69 2.96C2.91 3.21 3.22 3.46 3.62 3.7V3.57C3.62 3.17 3.59 2.84 3.51 2.6C3.35 2.12 3.1 1.37 3.1 1.02C3.1 0.559999 3.36 0.22 3.72 0.22C4.07 0.22 4.34 0.54 4.34 1.02C4.34 1.26 4.25 1.65 4.07 2.18C3.89 2.71 3.8 3.22 3.8 3.7C4.37 3.34 4.3 3.38 4.79 2.91C5.26 2.39 5.59 2.07 5.77 1.95C5.96 1.82 6.15 1.76 6.35 1.76C6.67 1.76 6.91 1.98 6.91 2.29C6.91 2.63 6.66 2.92 6.08 3.11C5.8 3.2 5.47 3.28 5.1 3.36C4.72 3.44 4.32 3.6 3.88 3.84C4.31 4.08 4.7 4.23 5.07 4.31C5.8 4.47 6.42 4.61 6.7 4.9C6.84 5.05 6.91 5.2 6.91 5.37C6.91 5.67 6.67 5.92 6.32 5.92C5.73 5.92 4.97 4.98 4.68 4.65C4.54 4.49 4.24 4.26 3.8 3.98V4.11C3.8 4.54 3.89 5.02 4.06 5.54C4.23 6.06 4.32 6.43 4.32 6.66C4.32 7.13 4.05 7.46 3.7 7.46Z"
									fill="currentColor" />
							</svg>
						</MenuButtonCaption>
					</HighlightMenuButton>
					<HighlightMenuButton focusedHighlight={!!focusedHighlight} onClick={handleShareHighlight}>
						Share
						<MenuButtonCaption>
							<svg width="8" height="8" viewBox="0 0 11 11" fill="none"
							     xmlns="http://www.w3.org/2000/svg">
								<path d="M0.98223 4.62115H7.33145V10.9704H0.98223V4.62115Z" fill="currentColor" />
								<path d="M4.63299 0.970398H10.9822V7.31962H9.15048L9.13914 2.80188H4.63299V0.970398Z"
								      fill="currentColor" />
							</svg>
						</MenuButtonCaption>
					</HighlightMenuButton>
					{focusedHighlight && (<m.div initial={{
						scaleX: 0.001, opacity: 0,
					}} animate={{
						scaleX: 1, opacity: 1,
					}} exit={{
						scaleX: 0.001, opacity: 0,
					}} transition={{
						type: "tween", duration: 0.2, ease: "easeOut",
					}} className={"z-[13] mr-[16px] ml-[16px] flex gap-[4px]"}>
						{Palettes.map((palette, index) => (
							<HighlightColorPickerItem key={palette} color={HighlightPalette[palette]}
							                          isActive={currentHighlightColor === palette} onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
							}} onMouseDown={(e) => {
								e.stopPropagation();
								handleChangeHighlightColor(palette)
							}} onMouseUp={(e) => e.stopPropagation()}></HighlightColorPickerItem>))}
					</m.div>)}
				</m.div>
			</div>
		</m.div>)}
	</AnimatePresence>);
};
const SignInCard = (props: ComponentPropsWithoutRef<'div'> & {
	onSignInClick: MouseEventHandler<HTMLButtonElement>;
}) => {
	const {onSignInClick, ...rest} = props;
	const {localization, social} = useContext(AuthUIContext);
	const providers = social?.providers;
	const [isSubmitting, setIsSubmitting] = useState(false);
	const t = useTranslations("UI.SignIn");
	useEffect(() => {
		const handlePageHide = () => {
			setIsSubmitting(false);
		};

		window.addEventListener("pagehide", handlePageHide);

		return () => {
			setIsSubmitting(false);
			window.removeEventListener("pagehide", handlePageHide);
		};
	}, []);
	const router = useTransitionRouter()
	const onClick: MouseEventHandler<HTMLButtonElement> = useCallback((e) => {
		e.preventDefault();
		if ((e.target as HTMLButtonElement).disabled) return;
		setIsSubmitting(true);
		delay(50).then(async () => {

			onSignInClick(e);
			await delay(100).then(() => {

				router.push("/sign-in");
			})
		})
	}, [onSignInClick, router]);
	const lyt = social?.providers && social.providers.length > 2 ? "horizontal" : "vertical";

	return (<div className={cn("flex flex-col gap-9")}>
		<Card className="bg-[oklch(var(--faded-bg)/.5)]">
			<CardContent className={cn("grid gap-9")}>
				<div className="grid gap-4">
					<div className={cn("flex w-full items-center justify-between gap-4",
						lyt === 'horizontal' ? "flex-wrap" : "flex-col")}>
						{social?.providers?.map((provider) => {
							const socialProvider = socialProviders.find(
								(socialProvider) => socialProvider.provider === provider,);
							if (!socialProvider) return null;

							return (
								<ProviderButton key={provider} isSubmitting={isSubmitting} localization={localization}
								                provider={socialProvider} setIsSubmitting={setIsSubmitting}
								                socialLayout={lyt} />);
						})}
					</div>
					<GradientSeparator caption={t("separator")} />
					<UIBtn variant="outline" onClick={onClick}
					       className="focus-visible:ring-ring text-foreground hover:bg-[oklch(var(--faded-bg)/.65)] hover:*:text-off-foreground *:transition-colors *:duration-300 *:ease inline-flex h-14 min-h-[35px] w-full items-center justify-center gap-[8px] rounded-md border border-[oklch(var(--faded-fg)/.65)] bg-[oklch(var(--off-bg)/.3)] px-4 py-3 text-md font-medium whitespace-nowrap shadow-sm transition-colors duration-300 ease focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-6 [&_svg]:shrink-0"
					       disabled={isSubmitting}>
						<span className="">{t("providers")}</span>
					</UIBtn>
				</div>
			</CardContent>
		</Card></div>)
}
const SignInTriggerButton = () => {
	const [isOpen, setOpen] = useState(false);
	return <Dialog open={isOpen} onOpenChange={setOpen}>
		<DialogTrigger asChild>
		</DialogTrigger>
		<DialogContent onClick={(e) => e.stopPropagation()}>
			<DialogHeader>
				<DialogTitle>
					Check In
				</DialogTitle>
			</DialogHeader>
			<div className="grid gap-3">
				<SignInCard onSignInClick={() => {
				}} />
			</div>
		</DialogContent>
	</Dialog>
}
const HighlightSaveButton = ({
	userId, authorId, className, documentHandler, saveCallback, createCallback,
}: {
	createCallback: (prop: { userId?: string; memo?: string }) => Promise<HighlightedRange | null | undefined>;
	saveCallback: (saveParams: HighlightedRange) => Promise<void>;
	documentHandler: (e: Event) => void;

	userId?: string;
	authorId?: string;
	className?: string;
}) => {
	const savedSelectionRef = useRef<rangy.savedSelection | null>(null);
	const focusedHighlight = useHighlighter(r => r.focusedHighlight);
	const [open, setOpen] = useState(false);
	const [view, setView] = useState<"memo" | "signin">(userId ? "memo" : "signin",);
	const docId = focusedHighlight?.id || null;
	const [memo, setMemo] = useState<string>((focusedHighlight as any)?.memo ?? "",);
	const [saving, setSaving] = useState(false);
	const t = useTranslations();
	useEffect(() => {
		if (open) {
			setView(userId ? "memo" : "signin");
			setMemo((focusedHighlight as any)?.memo ?? "");
			document.body.removeEventListener('click', documentHandler);
		} else {
			document.body.addEventListener('click', documentHandler);
		}
	}, [open, userId, focusedHighlight, documentHandler]);
	const onSave = useCallback(async () => {

		if (!userId) {
			setView("signin");
			toast(t("Highlights.error.save.signin"));
			return setSaving(false);
		}
		if (!focusedHighlight) {
			if (savedSelectionRef.current) {
				setSaving(true);
				rangey.restoreSelection(savedSelectionRef.current);
				rangey.removeMarkers(savedSelectionRef.current);
				savedSelectionRef.current = null;
				await createCallback({userId, memo}).then(r => {
					if (r) {
						successToast(t("Highlights.saved"));

					} else {
						errorToast(t("Highlights.error.save.select"));
					}
					setOpen(false);
				});

			}
			savedSelectionRef.current && (rangey.removeMarkers(
				savedSelectionRef.current), savedSelectionRef.current = null);
			setSaving(false);

			return;
		}
		try {
			setSaving(true);
			// const where: Where = {
			// 	reference: {equals: focusedHighlight.reference},
			// };
			const body = {
				...focusedHighlight, memo,

			} satisfies HighlightedRange;
			await saveCallback(body);
			setOpen(false);
			successToast(t("Highlights.saved"));
		} catch (e) {
			console.log(e);
			errorToast(t("Highlights.error.save.default"));
		} finally {
			savedSelectionRef.current && (rangey.removeMarkers(
				savedSelectionRef.current), savedSelectionRef.current = null);
			setSaving(false);
		}
	}, [createCallback, focusedHighlight, memo, saveCallback, t, userId]);
	const closeOnClick: MouseEventHandler<HTMLButtonElement> = useCallback((e) => {
		e.stopPropagation();
		setOpen(true);
	}, [setOpen])

	const [isOpen, setIsOpen] = useState(false);
	useEffect(() => {
		if (open) {
			savedSelectionRef.current = rangey.saveSelection();
			setIsOpen(true);
		} else {
			savedSelectionRef.current = null;
			setIsOpen(false);
		}
	}, [open])
	return (<>
		<Dialog open={isOpen} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<HighlightMenuButton className={className} focusedHighlight={true} onClick={closeOnClick}>
					{focusedHighlight && focusedHighlight.memo ? "Edit" : "Memo"}
					<MenuButtonCaption>
						<svg width="8" height="8" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M2 2h8v8H2z" fill="currentColor" />
							<path d="M4 4h4v1H4zM4 6h4v1H4zM4 8h3v1H4z" fill="oklch(var(--faded-bg)/1)" />
						</svg>
					</MenuButtonCaption>
				</HighlightMenuButton>
			</DialogTrigger>
			<DialogContent onClick={(e) => e.stopPropagation()}>
				<DialogHeader>
					<DialogTitle>
						{view === "memo" ? "Memo" : "Sign in"}
					</DialogTitle>
				</DialogHeader>
				{view === "memo" ? (<div className="grid gap-3">
					<MemoInput value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Write a short note…"
					           maxLength={200} className="" />
				</div>) : (<div className="grid gap-3">
					<SignInCard onSignInClick={closeOnClick} />
				</div>)}
				<DialogFooter>
					<div className="ml-auto flex items-center gap-2">
						<Button onClick={(e) => {
							e.stopPropagation();
							setOpen(false);
						}} disabled={saving}>
							Back
						</Button>
						{view === "memo" && (<Button onClick={(e) => {
							e.stopPropagation();
							void onSave();
						}} disabled={saving || !userId}>
							{saving ? "Saving…" : "Save"}
						</Button>)}
						<Button onClick={closeOnClick}>Close</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</>);
};
const ResponseIndicator = (props: ComponentPropsWithoutRef<'div'> & {
	top: number; reference: string;
}) => {
	const {reference, top, ...rest} = props;
	const highlights = useHighlighter(r => r.highlights);
	const target = useMemo(() => highlights.find(h => (h.reference === reference) && !!(h.memo)) || null,
		[highlights, reference]);
	const setOpen = useHighlightSidebar('setOpen');
	const setContent = useHighlightSidebar('setContent');

	const onClick = useCallback((e: MouseEvent) => {
		if (target) {
			setContent({

				author: target.author,
				createdAt: target.createdAt,
				memo: target.memo!,
				quote: target.quote!,
				reference,
				updatedAt: target.updatedAt,
			})
		}

		setOpen(true);
	}, [target])

	return <div style={{transform: `translateY(${props.top}px)`}} className={"flex items-center gap-2"}>
		<div className={'relative'}>
			<Button onClick={onClick}
			        className="flex text-[calc(var(--text-base)*0.55)] items-center justify-center z-[30] aspect-[4/3] h-[var(--text-base)] w-auto px-[3px] py-[2px] border-muted border-[1px] rounded-[5px_5px_5px_0] whitespace-nowrap bg-background dark:bg-faded-background dark:border-muted-faded-foreground text-center">
				<span
					className={'left-[0.5px] -bottom-[3px] w-[4.5px] h-[4.5px] bg-background dark:bg-faded-background absolute [clip-path:polygon(0_0,0_100%,100%_0)] z-[20]'} />
				<span
					className={"absolute [clip-path:polygon(0_0,0_100%,100%_0)] bg-muted dark:bg-muted-faded-foreground -left-[0.5px] bottom-[-6px] w-[6px] h-[7px] z-[15]"} />
				<span className="leading-[1.5] uppercase">
                1
            </span>
			</Button></div>
	</div>
}
const Aside = ({children}: { children: ReactNode }) => {
	return (

		<>
			<style>
				{`
			aside > div{
			 max-width: 100%;
			 position:absolute;
			 display:flex;
			 align-items:center;
			 white-space:nowrap;
			 width: 100%;
			 margin-left:20px;
			 margin-top:2px;
			 gap:8px;
			}
			`}
			</style>
			<aside className={'top-0'}>
				{children}
			</aside>
		</>)
}
const MemoInput = (props: ComponentProps<'textarea'>) => {
	const {maxLength = 200, onChange, placeholder} = props;
	const id = useId()
	const {
		value, characterCount, handleChange, maxLength: limit,
	} = useCharacterLimit({maxLength, initialValue: `${props.value || ""}`})
	const oC: ChangeEventHandler<HTMLTextAreaElement> = useCallback((e) => {
		handleChange(e);
		onChange?.(e);
	}, [handleChange, onChange])
	return <div className={'*:not-first:mt-2'}>
		<Textarea placeholder={placeholder} className={'min-h-[120px]'} value={value} onChange={oC}
		          maxLength={maxLength} id={id} />
		<p id="«r2q»-description" className="text-off-foreground mt-2 text-right text-xs" role="status"
		   aria-live="polite"><span className="tabular-nums">{characterCount}</span>/<span
			className={'tabular-nums'}>{limit}</span></p>
	</div>
}
const HighlightColorPicker = ({
	children, className, ...props
}: ComponentPropsWithRef<"div">) => {
	return (<div className={cn("mr-[16px] ml-[16px] flex gap-[4px]", className)}
	             {...props}
	>
		{children}
	</div>);
};
const HighlightColorPickerItem = ({
	children, className, isActive, onClick, onMouseDown, onMouseUp, ref, color, style, ...props
}: MotionBtnProps & {
	isActive: boolean; color?: string;
}) => {
	const [variant, setVariant] = useState<"active" | "inactive">(isActive ? "active" : "inactive",);
	useEffect(() => {
		setVariant(isActive ? "active" : "inactive");
	}, [isActive]);
	const {onMouseEnter, onMouseLeave} = useDomCursor({
		enterCondition: () => (isActive ? null : "FOCUS"),
	});
	/**
	 * after:absolute after:rounded-[1px] after:w-[calc(100%-1px)] after:h-[calc(100%-1px)] after:border-[1px] after:border-solid after:inset-[.5px] after:content-['']
	 */
	return (<m.button className={cn(
		"bg-off-foreground relative h-[12px] w-[16px] border-[1px] border-solid border-transparent data-active:border-muted-background",
		className,)} onClick={onClick} ref={ref} initial={"hidden"} whileHover={{scale: isActive ? 1 : 1.2}}
	                  transition={{type: "spring", bounce: 0.25}} whileTap={{scale: isActive ? 1 : 0.9}}
	                  animate={variant} variants={{
		hidden: {
			opacity: 0, scale: 0,
		}, active: {
			opacity: 1, scale: 1, borderRadius: 3,
		}, inactive: {
			opacity: 1, scale: 1, borderRadius: 2,
		},
	}} data-active={isActive} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseEnter={onMouseEnter}
	                  onMouseLeave={onMouseLeave} style={{
		backgroundColor: `${color ? ("oklch(" + color + "/.9)") : ("var(--color-creamy-white)")}`, ...style,
	}} disabled={isActive}
	                  {...props}
	>
		{children}
	</m.button>);
};
const HighlightMenuButton = ({
	children, className, focusedHighlight = true, ...props
}: ComponentPropsWithRef<"button"> & { focusedHighlight?: boolean }) => {
	return (<Button className={cn(
		"text-faded-background/90 ease-in-out-2 !border-faded-background/90 hover:text-piercing-orange hover:[&_path]:fill-piercing-orange z-[10] flex items-center border-0 border-dashed bg-transparent px-[16px] py-0 text-base leading-0 font-light tracking-[0.05rem] antialiased transition-colors [&_svg]:inline-block [&:nth-of-type(2)_svg]:-left-[0.25px] [&:nth-of-type(3)_svg]:left-[0.5px]",
		className, focusedHighlight ? "border-r-[1px]" : "border-r-[0px]",)}
	                {...props}
	>
		{children}
	</Button>);
};
const MenuButtonCaption = ({
	children, pre = "[", post = "]", className, ...props
}: ComponentPropsWithRef<"div"> & { pre?: string; post?: string }) => {
	return (<div
		className={cn("mb-[2px] ml-[6px] flex items-center text-base lowercase [&_svg]:relative [&_svg]:top-[0.5px]",
			className,)}
		{...props}
	>
		<>{pre}</>
		{children}
		<>{post}</>
	</div>);
};
const MiniMapItem = ({
	onMouseEnter: onEnter, onMouseLeave: onLeave, style, ...props
}: ComponentPropsWithRef<"div">) => {
	const {onMouseEnter, onMouseLeave} = useDomCursor({
		onEnter, onLeave,
	});
	const color = useHighlighter(r => r.currentColor)
	return (<div
		className="border-foreground/20 ease-out-power2 pointer-events-auto absolute top-0 left-0 z-10 h-[3px] w-full border-0 border-b-[1px] transition-all duration-200 hover:-top-[3px] hover:h-[10px]"
		{...props} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
		style={{backgroundColor: `color-mix(in oklch,oklch(${HighlightPalette[color]}/1) 85%,var(--color-faded-white))`, ...style}}></div>);
};
const MiniMap = ({
	highlightMap, scaleRatio, ...props
}: ComponentPropsWithoutRef<"div"> & {
	highlightMap: Array<{
		y: number; top: number;
	}>; scaleRatio: number;
}) => {
	const currentColor = useHighlighter(r => r.currentColor)
	const mapBackdropRef = useRef<HTMLDivElement>(null!);
	const mapTrackRef = useRef<HTMLDivElement>(null!);
	const highMaps = useRef<HTMLDivElement[]>([]);
	const lastResize = useWindowResize({
		detectVisibilityChange: false, detectHeightChange: true,
	});
	const lenis = useLenis();
	const [scale, setScale] = useState(1);
	useEffect(() => {
		setScale(scaleRatio);
	}, [lastResize, scaleRatio]);

	useGSAP(() => {
		highMaps.current.forEach((e, t) => {
			const y = highlightMap[t]?.top;
			if (!y) return;
			gsap.to(e, {
				translateY: y * scale, duration: 0.1, ease: "power2.inOut",
			});
		});
	}, [scale]);
	return (<div
		className="pointer-events-none fixed top-[55px] right-[40px] bottom-[50px] z-[250] w-[24px] origin-[0_0] scale-x-50 overflow-hidden transition-transform duration-200"
		ref={mapTrackRef}
		{...props}
	>
		<div ref={mapBackdropRef} className="absolute h-full w-full origin-[100%_0]"></div>
		{highlightMap.map((e, t) => (<MiniMapItem ref={el => {
			(el && (highMaps.current[t] = el))
		}} onClick={() => {
			lenis?.scrollTo(e.y - 250);
		}} key={'highMap' + t} color={currentColor} style={{transform: `translateY(${e.top}px)`}} />))}
	</div>);
};
const PrevNext = ({
	prev, next,
}: {
	prev: ArticleOverview; next: ArticleOverview;
}) => {
	const lastResize = useWindowResize({
		detectVisibilityChange: false, detectHeightChange: true, debounce: 100,
	});
	const resetCursorTheme = useCursorStore((r) => r.resetCursorTheme);
	const toggleCursorTheme = useCursorStore((r) => r.toggleCursorTheme);
	const containerRef = useRef<HTMLDivElement>(null!);
	const {bottom} = useMenu((r) => r.frames);
	const lastBottom = useRef(bottom);
	useEffect(() => {
		if (!containerRef.current) {
			return;
		}

		const e = containerRef.current.getBoundingClientRect().height;
		const t = document.documentElement.clientHeight;
		containerRef.current.style.bottom = `${(e - t) * -1 - 36 + bottom}px`;
		lastBottom.current = bottom;
	}, [lastResize, bottom]);
	useEffect(() => {
		const throttledScroll = (() => {
			let isThrottled = false;

			return () => {
				if (!isThrottled) {
					if (window.scrollY > 2000 && containerRef.current && containerRef.current.getBoundingClientRect().top < 36) {
						const e = containerRef.current.getBoundingClientRect().height;
						const t = window.innerHeight;
						containerRef.current.style.top = "auto";
						containerRef.current.style.bottom = `${(e - t) * -1 - 36 + lastBottom.current}px`;
					}

					isThrottled = true;
					setTimeout(() => {
						isThrottled = false;
					}, 100);
				}
			};
		})();
		window.addEventListener("scroll", throttledScroll);
		return () => {
			window.removeEventListener("scroll", throttledScroll);
		};
	}, []);
	return (<div
		className={"border-foreground boder-t-[1px] text-background sticky top-[0px] z-0 mt-[-10px] flex w-screen flex-col justify-between overflow-hidden border-0 border-solid bg-[oklch(var(--faded-fg)/1)] pt-0 pb-[8px]"}
		ref={containerRef} onMouseEnter={toggleCursorTheme} onMouseLeave={resetCursorTheme}>
		<div
			className="after:border-foreground [&>a]:text-faded-background relative flex h-[calc(100svh-35px)] min-h-[400px] w-full items-start gap-[31px] bg-[oklch(var(--faded-fg)/1)] pb-[24px] after:absolute after:bottom-0 after:left-0 after:mt-[12px] after:h-px after:w-full after:border-t-[1px] after:border-solid after:opacity-20 after:content-[''] min-lg:p-[0_27px_24px_26px] [&_h1]:m-0 [&_h1]:leading-[0.84] [&>a]:h-full [&>a]:w-1/2"
			style={{textDecoration: "none"}}>
			<div
				className={"border-muted-off-background/20 bg-faded-foreground after:bg-muted-off-background/20 pointer-events-none absolute top-0 left-[calc(50%-16px)] z-[1] h-full w-[32px] border-x-[1px] border-dashed after:absolute after:top-0 after:left-1/2 after:h-full after:w-px after:content-['']"}></div>
			<Link href={`/posts/${prev.slug}`} onClick={resetCursorTheme} className={"overflow-hidden rounded-lg"}>
				<div
					className="ease-out-power2 relative flex h-full w-full flex-col justify-end bg-[oklch(var(--faded-fg)/1)] text-[oklch(var(--faded-bg)/1)] transition-colors duration-200 hover:bg-[oklch(var(--faded-bg)/1)] hover:text-[oklch(var(--faded-fg)/1)] min-lg:px-[14px] min-lg:py-[10px]">
					<h1 className="fixed !top-[55px] m-0 font-serif text-[calc(10px+5.8vmax+5.8vmin)] leading-[0.84] font-light tracking-[-0.05em]">
						Past&nbsp;
						<span>
							<em> musings</em>
						</span>
					</h1>
					<div
						className="m-0 flex h-auto w-full justify-between gap-12.5 font-mono text-base leading-[1.4] -tracking-[0.03em] break-words uppercase [&_span]:self-end [&_span]:min-lg:min-w-1/2">
						<span>
							{prev.title + " // "}
							<span>{prev.author.name}</span>
						</span>
						<span>{prev.subtitle}</span>
					</div>
				</div>
			</Link>
			<Link href={`/posts/${next.slug}`} onClick={resetCursorTheme} className={"overflow-hidden rounded-lg"}>
				<div
					className="ease-out-power2 relative flex h-full w-full flex-col justify-end bg-[oklch(var(--faded-fg)/1)] break-words text-[oklch(var(--faded-bg)/1)] transition-colors duration-200 hover:bg-[oklch(var(--faded-bg)/1)] hover:text-[oklch(var(--faded-fg)/1)] min-lg:px-[14px] min-lg:py-[10px]">
					<div
						className="fixed !top-[80px] z-[5] m-0 flex h-auto w-[calc(50%-44px)] justify-between gap-[32px] text-right font-mono text-base leading-[1.4] -tracking-[0.03em] uppercase min-lg:w-[calc(50%-97px)] min-lg:self-end min-lg:[&_span]:max-w-1/2">
						<span>
							{next.title + " // "}
							<span className={"hidden min-lg:inline"}>
								{next.author.name}
							</span>
						</span>
						<span className={"hidden min-lg:inline"}>{next.subtitle}</span>
					</div>
					<h1 className={"m-0 text-right font-serif text-[calc(10px+5.8vmax+5.8vmin)] leading-[0.84] font-light tracking-[-0.05em] min-lg:mr-[12px]"}
					    style={{
						    alignSelf: "flex-end",
					    }}>
						Recent&nbsp;<em>tea</em>
					</h1>
				</div>
			</Link>
			<div
				className={"after:border-background absolute bottom-0 z-[2] h-[24px] w-full after:absolute after:top-0 after:left-0 after:z-[2] after:w-full after:border-t-[1px] after:border-solid after:opacity-20 after:content-['']"}></div>
		</div>
		<div
			className="border-x-muted-faded-background pointer-events-none absolute top-0 left-[28px] z-[30] h-full w-[calc(100%-56px)] border-0 border-x-[1px] border-solid opacity-20"
			style={{
				borderImage: "initial",
			}} />
	</div>);
};