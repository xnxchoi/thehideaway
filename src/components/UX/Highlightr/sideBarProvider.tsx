'use client'
import {AuthorOverview} from "@collections/Posts/post-types";
import {
	ChangeEvent,
	ChangeEventHandler,
	ComponentProps,
	ComponentPropsWithoutRef,
	createContext,
	CSSProperties,
	MouseEventHandler,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useId,
	useRef,
	useState
} from "react";
import {AuthUIContext, socialProviders} from "@/lib/auth/betterauth-ui/src";
import {useLocale, useTranslations} from "next-intl";
import {useTransitionRouter} from "next-transition-router";
import {delay} from "@/utilities/rp_utils";
import {cn} from "@/lib/utils";
import {Card, CardContent} from "@/components/ui/card";
import {ProviderButton} from "@/lib/auth/betterauth-ui/src/components/auth/provider-button";
import {GradientSeparator} from "@/components/ui/separator";
import {Button as UIBtn} from "@/components/ui/button";
import {useCursorStore} from "@/providers/RP_Pro";
import {useDomCursor} from "@/components/core/cursorWrapper";
import {Textarea} from "@/components/ui/textarea";
import {Button, Link} from "@/components/UX/Link";
import type {HighlightedRange} from "@/components/UX/Highlightr/types";
import {useHighlighter} from "@/components/UX/Highlightr/provider";
import {useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import * as rangey from "rangy";
import {successToast} from "@components/sonner";
import {errorToast} from "@/components/ui/sonner";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {DateTime} from "luxon";
import {useRPSession} from "@/lib/auth/session/RP_SessionProvider";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {useLenis} from "lenis/react";
import {Drawer} from "vaul";
import {HighlightPalette} from "@/components/UX/Highlightr/stores";
import {HighlightMenuButton, MenuButtonCaption} from "@/components/UX/Highlightr/index";
import {useCharacterLimit} from "@/hooks/use-character-limit";

export interface HighlightSidebarProps {
	open: boolean
	setOpen: (open: boolean) => void
	toggle: () => void
	setContent: (content: Omit<ResponseNode, 'top'> | null) => void;
	content: Omit<ResponseNode, 'top'> | null;
	writing: boolean
	setWriting: (writing: boolean) => void
}

const HighlightSidebarContext = createContext<HighlightSidebarProps>({
	open: false, setOpen: () => {
	}, toggle: () => {
	}, setContent: (_) => {
	}, content: null, writing: false, setWriting: (_) => {
	}
})
export const UserBar = ({user}: { user: AuthorOverview }) => {
	return <div className={'flex justify-between'}>
		<div className={'flex items-center'}>
			<div>
				<div className={'inline-block'}>
					<div className={'outline-none'} tabIndex={-1}>
						<Link href={`/@${user.slug}`}>
							<div className={'block relative'}><Avatar>
								{user.image && (<AvatarImage height={32} width={32} src={user.image} />) || (
									<AvatarFallback className={'uppercase'}>
										{user.name.at(0)}
										{user.name.at(1)}
									</AvatarFallback>)}
							</Avatar></div>
						</Link></div>
				</div>
			</div>
			<div className={'pl-[12px] block'}>
				<div className={'flex items-center'}>
					<div className={'inline-block'}>
						<div className={'outline-none'} tabIndex={-1}>
							<Link href={`/@${user.slug}`}>
								<div className={'items-baseline flex'}>
									<p className={'break-all'}>
										{user.name}
									</p>
								</div>
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
}
const CitationView = ({
	createdAt, updatedAt, author, quote, memo, reference, ...rest
}: Omit<ResponseNode, 'top'>) => {
	const uDate = DateTime.fromISO(updatedAt);
	const cDate = DateTime.fromISO(createdAt);
	const updateValid = uDate.isValid
	const userImage = useRPSession(r => r.image);
	const userName = useRPSession(r => r.name);
	const userSlug = useRPSession(r => r.slug);
	const userId = useRPSession(r => r.id as string | null);
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
							<MemoInputField />
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
													<div className={'outline-none'}>
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
const MemoInputField = () => {
	const user = useRPSession(r => r.id as string | null);
	const writing = useHighlightSidebar('writing');
	const setIsWriting = useHighlightSidebar('setWriting');
	const [value, setValue] = useState('')
	const setCursorState = useCursorStore(r => r.setCursorState)
	const cInputWrapperRef = useRef<HTMLDivElement>(null!);
	const commentInputRef = useRef<HTMLTextAreaElement>(null!);
	const onClick = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		setCursorState(null);
		setIsWriting(false)
	}, [setCursorState, setIsWriting])
	useEffect(() => {
		const ci = cInputWrapperRef.current;
		const input = commentInputRef.current;
		if (ci) {
			if (writing) {
				input && input.focus();
				ci.removeEventListener('click', onClick)
			} else {
				ci.addEventListener('click', onClick)
			}
		}
	}, [writing, onClick])
	const [disabled, setDisabled] = useState(value.length === 0)
	useEffect(() => {
		setDisabled(value.length === 0)
	}, [value])
	const {onMouseEnter, onMouseLeave} = useDomCursor({})
	return <div
		className={'pb-0 flex-col rounded-[6px] bg-muted-faded-background/50 flex transition-[background-color,padding-bottom] duration-400 ease-in-out-2 group'}
		data-active={writing}>
		<div className={'relative flex flex-col'}>
			{user ? <div ref={cInputWrapperRef} onMouseLeave={(e) => writing ? void 0 : onMouseLeave(e)}
			             onMouseEnter={(e) => writing ? void 0 : onMouseEnter(e)}
			             className={'min-h-[15px] flex flex-col justify-between px-[12px] py-[8px] transition-[min-height,padding] duration-400 ease-in-out-2 group-data-[active="true"]:min-h-[100px] group-data-[active="true"]:py-[12px]'}>
				{writing && <><Textarea ref={commentInputRef} value={value} onChange={(e) => setValue(e.target.value)}
				                        className={'relative min-h-[24px] w-full resize-none field-sizing-content'}
				                        style={{
					                        overflowWrap: 'break-word', whiteSpace: 'pre-wrap',
				                        }} />
					<div
						className={'max-h-[100px] transition-[opacity] duration-400 ease-in-out-2 opacity-100 justify-between items-center ml-[10px] flex gap-4'}>
						<div></div>
						<div className={'self-end flex max-h-[100px] px-[8px] py-0 gap-6'}>
							<Button className={'text-xs'} onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								setCursorState(null);
								setIsWriting(false);
								setValue('');
							}}>Cancel</Button>
							<Button
								className={'px-[8px] py-[4px] rounded-[20px] transition-colors duration-400 ease-in-out-2 disabled:fg-muted-background disabled:bg-muted-foreground'}
								disabled={disabled} onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								setCursorState(null);
							}} style={{
								opacity: disabled ? '0.5' : '1',
								color: disabled ? 'var(--muted-faded-background)' : 'var(--faded-background)',
								backgroundColor: disabled ? 'var(--muted-faded-foreground)' : 'var(--faded-foreground)',
							}}>Respond</Button>
						</div>
					</div>
				</> || <span className={'text-base text-muted-foreground'}>Share your thoughts here...</span>}
			</div> : <SignInTriggerButton />}</div>
	</div>
}
export const SideBarProvider = ({children}: { children: ReactNode }) => {
	const [open, setOpen] = useState(false)
	const lenis = useLenis();
	const [content, setContent] = useState<Omit<ResponseNode, 'top'> | null>(null)
	const [writing, setWriting] = useState(false)
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
		writing, setWriting, open, setOpen, toggle: () => setOpen(o => !o), setContent, content
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
					<Drawer.Title className="text-lg font-semibold px-5 py-3">
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
export const useHighlightSidebar = <T extends keyof HighlightSidebarProps>(selector: T): HighlightSidebarProps[T] => {
	const context = useContext(HighlightSidebarContext)
	if (!context) throw new Error("useHighlightSidebar must be used within a HighlightSidebarProvider")
	return context[selector]
}
type ResponseNode = {
	top: number;
	reference: string;
	memo: string;
	quote: string;
	author: AuthorOverview;
	updatedAt: string;
	createdAt: string;
}
export const SignInCard = (props: ComponentPropsWithoutRef<'div'> & {
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

			await delay(50).then(() => {

				router.push("/sign-in");
			})
			onSignInClick(e);
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
export const MemoInput = (props: ComponentProps<'textarea'>) => {
	const {maxLength = 200, onChange, placeholder, disabled} = props;
	const id = useId()
	const {
		value, characterCount, handleChange, maxLength: limit,
	} = useCharacterLimit({maxLength, initialValue: `${props.value || ""}`})
	const oC: ChangeEventHandler<HTMLTextAreaElement> = useCallback((e) => {
		handleChange(e);
	}, [handleChange])
	return <div className={'*:not-first:mt-2'}>
		<Textarea placeholder={placeholder} className={'min-h-[120px]'} value={value} onChange={oC}
		          maxLength={maxLength} id={id} disabled={disabled} />
		<p id="«r2q»-description" className="text-off-foreground mt-2 text-right text-xs" role="status"
		   aria-live="polite"><span className="tabular-nums">{characterCount}</span>/<span
			className={'tabular-nums'}>{limit}</span></p>
	</div>
}
export const MemoButton = ({
	className, documentHandler, saveCallback, createCallback, postId
}: {
	createCallback: (prop: { userId?: string; memo?: string }) => Promise<HighlightedRange | null | undefined>;
	saveCallback: (saveParams: HighlightedRange) => Promise<HighlightedRange>;
	documentHandler: (e: Event) => void;

	postId: string;
	className?: string;
}) => {
	const userId = useRPSession(r => r.id as string | null);
	const savedSelectionRef = useRef<rangy.savedSelection | null>(null);
	const focusedHighlight = useHighlighter(r => r.focusedHighlight);
	const [open, setOpen] = useState(false);
	const [view, setView] = useState<"memo" | "signin">(userId ? "memo" : "signin",);
	const [memo, setMemo] = useState<string>((focusedHighlight as any)?.memo ?? "",);
	const initialValue = useRef(memo);
	const qc = useQueryClient();
	const [saving, setSaving] = useState(false);
	const t = useTranslations();
	useEffect(() => {
		if (open) {
			setView(userId ? "memo" : "signin");
			setMemo((focusedHighlight as any)?.memo ?? "");
			document.body.removeEventListener('click', documentHandler);
		} else {
			setMemo("");
			document.body.addEventListener('click', documentHandler);
		}
	}, [open, userId, focusedHighlight, documentHandler]);
	const [dirty, setDirty] = useState<boolean>(false)
	const setMemoValue = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
		if (initialValue.current !== e.target.value) {
			setDirty(true);
			initialValue.current = e.target.value;
		}
		setMemo(e.target.value)
	}, [])
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
					qc.invalidateQueries({
						queryKey: ["savedHighlights", postId]
					})
					setOpen(false);
					setDirty(false);
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
			qc.invalidateQueries({
				queryKey: ["savedHighlights", postId]
			})
			successToast(t("Highlights.saved"));
		} catch (e) {
			console.log(e);
			errorToast(t("Highlights.error.save.default"));
		} finally {
			savedSelectionRef.current && (rangey.removeMarkers(
				savedSelectionRef.current), savedSelectionRef.current = null);
			setSaving(false);
		}
	}, [createCallback, focusedHighlight, memo, postId, qc, saveCallback, t, userId]);

	const closeOnClick: MouseEventHandler<HTMLButtonElement> = useCallback((e) => {
		e.stopPropagation();
		setOpen(true);
		setDirty(false);

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
					<MemoInput value={memo} onChange={setMemoValue} placeholder="Write a short note…" maxLength={200}
					           className="" />
				</div>) : (<div className="grid gap-3">
					<SignInCard onSignInClick={closeOnClick} />
				</div>)}
				<DialogFooter>
					<div className="ml-auto flex items-center gap-2">
						<Button className={'rp_btn'}
						        onClick={closeOnClick}>{memo.length > 0 ? 'Cancel' : 'Close'}</Button>
						{view === "memo" && (<Button className={'rp_btn'} onClick={(e) => {
							e.stopPropagation();
							void onSave();
						}} disabled={saving || !userId || !dirty || memo.length < 1}>
							{saving ? "Saving…" : "Save"}
						</Button>)}
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</>);
};