"use client"
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {errorToast, successToast} from "@/components/ui/sonner";
import {useRPSession} from "@/lib/auth/session/RP_SessionProvider";
import {cn} from "@/lib/utils";
import {Button} from "@/components/UX/Link";
import {useQueryClient} from "@tanstack/react-query";
import * as rangey from "rangy";
import "rangy/lib/rangy-classapplier";
import "rangy/lib/rangy-highlighter";
import 'rangy/lib/rangy-selectionsaverestore';
import "rangy/lib/rangy-textrange";
import m from "motion/react-m";
import {useTranslations} from "next-intl";
import {
	ChangeEvent, ComponentPropsWithRef, CSSProperties, useCallback, useEffect, useMemo, useRef, useState
} from "react";
import {toast} from "sonner";
import {HighlightMenuButton, HighlightMenuProps, MenuButtonCaption, useFloater} from ".";
import {usePrivateNote} from "./PrivateHighlights";
import {HighlightCreateError, useHighlighter} from "./provider";
import {MemoInput, SignInCard} from "./sideBarProvider";
import {HighlightColors, HighlightPalette, Palettes} from "./stores";
import {HighlightedRange} from "./types";
import {delay} from "@/utilities/rp_utils";

import {useDomCursor} from "@/components/core/cursorWrapper";
import {MotionBtnProps} from "@/components/UX/Link/types";

export const FloatHighlightMenu = ({
	mounted,
	handleUpdate,
	handleSaveHighlight,
	handleChangeHighlightColor,
	createCallback,
	ref,
	style,
	floatingStyles,
	status,
	...rest
}: ComponentPropsWithRef<'div'> & Pick<HighlightMenuProps, 'handleUpdate' | 'handleSaveHighlight' | 'handleChangeHighlightColor' | 'createCallback'> & {
	floatingStyles: CSSProperties; mounted: boolean; status: "close" | "initial" | "open" | "unmounted"
}) => {
	const palettee = useMemo(() => Palettes, [])
	const privateMemoOpen = usePrivateNote(r => r.open)
	const [memoOpen, setMemoOpen] = useState(false)
	const t = useTranslations()

	const focusedHighlight = useHighlighter(r => r.focusedHighlight);
	const fc = useRef(focusedHighlight)
	useEffect(() => {
		fc.current = focusedHighlight
	}, [focusedHighlight])
	const target = useHighlighter(r => r.target)
	const userId = useRPSession(r => r.id as null | string)
	const postId = useMemo(() => target?.value || "", [target])
	const currentHighlightColor = useHighlighter(r => r.currentColor)
	const lastVisible = useRef(false);
	const [memo, setMemo] = useState("")
	const savedSelectionRef = useRef<rangy.savedSelection | null>(null);
	const qc = useQueryClient();
	const setFocused = useHighlighter(r => r.setFocusedHighlight);
	const onSave = useCallback(async (e) => {
		e.preventDefault();
		if (!userId) {
			setMemoView("signin");
			toast(t("Highlights.error.save.signin"));
			return setSaving(false);
		}
		try {
			setSaving(true);
			const res = await Promise.allSettled([fc.current ? (await handleUpdate({
				...fc.current, memo,
			})) : savedSelectionRef.current ? (rangey.restoreSelection(savedSelectionRef.current), await createCallback(
				{private: false, memo})) : (delay(150).
				then(() => {
					throw new HighlightCreateError('selection')
				}))]) satisfies [PromiseSettledResult<HighlightedRange>];
			res.forEach((cas, i) => {
				if (i > 0) return
				if (cas.status === 'fulfilled') {
					const r = cas.value;
					setFocused(r.reference);
					successToast(t("Highlights.saved"));
					qc.invalidateQueries({
						queryKey: ["savedHighlights", postId]
					})
					savedSelectionRef.current && rangey.removeMarkers(savedSelectionRef.current);
					savedSelectionRef.current = null;
					setDirty(false);
					setMemoOpen(false);
				} else {
					throw cas.reason
				}
			})
		} catch (e) {
			console.log(e);
			if (e instanceof HighlightCreateError) {
				errorToast(e.message)
			} else {
				errorToast(t("Highlights.error.save.default"))
			}
		} finally {
			setSaving(false);

		}
	}, [userId, t, createCallback, memo, handleUpdate, setFocused, qc, postId]);
	const setRender = useFloater(r => r.setOpen);
	const [saving, setSaving] = useState(false)
	const [memoView, setMemoView] = useState<'edit' | 'signin' | 'view'>('view')
	const innerRef = useRef<HTMLDivElement>(null!);
	const closeMemo = useCallback(() => {
		setMemoOpen(false)
	}, [])
	const doMe = useCallback((e: Event) => {
		if (!e.target) return;
		if (!innerRef.current) {
			document.body.removeEventListener("click", doMe);
			return;
		}
		if (!innerRef.current.contains(e.target as HTMLElement)) {
			setRender(false);
			document.body.removeEventListener("click", doMe);
		}
	}, []);
	const [dirty, setDirty] = useState(false)
	const lastValue = useRef<string>(memo)
	const setMemoValue = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
		if (e.target.value.length > 0) {
			setDirty(lastValue.current !== e.target.value)
		} else {
			setDirty(false)
		}
		setMemo(e.target.value)
		lastValue.current = e.target.value
	}, [])

	const handleShareHighlight = useCallback((e) => {
		e.stopPropagation();
		const se = rangey.getSelection();
		let a = se?.toString();
		if (!a && focusedHighlight) {
			a = focusedHighlight.els.map((e) => (e as HTMLElement).innerText).join(" ");
		}
		navigator.clipboard.writeText(a).then((r) => {
			successToast(t('Highlights.share.copy'));
		}).catch(() => (errorToast(t('Highlights.error.share.copy'))));
	}, [focusedHighlight, t],);

	const setPrivateNotary = usePrivateNote(r => r.setOpen);
	const setPrivateView = usePrivateNote(r => r.setView);


	const onPrivateClick = useCallback((e) => {
		e.preventDefault();
		setPrivateView('edit');
		setPrivateNotary(true);
		setRender(false)
	}, [setPrivateView, setPrivateNotary, setRender]);

	return mounted && <div ref={ref} key={"res"}
	                       className={cn("z-[250] m-0 flex overflow-hidden rounded-2xl border-none",
		                       "pointer-events-auto",)} data-themed={"background-color"} style={{
		...floatingStyles
	}} {...rest}>
		<div ref={innerRef} data-status={status} className={"highlightMenu relative z-[210] h-full w-full p-0"}
		     style={{...style}}>
			<div className={"bg-faded-d-gray dark:bg-faded-l-gray absolute top-0 left-0 z-[1] h-full w-full"} />
			<m.div className={"text-off-foreground z-[23] flex h-[44px] items-center px-3.5"}>
				<Dialog open={memoOpen} onOpenChange={setMemoOpen}>
					<DialogTrigger asChild>
						<HighlightMenuButton focusedHighlight={true} onClick={() => setMemoOpen(true)}>
							{focusedHighlight && focusedHighlight.memo ? "Edit" : "Memo"}
							<MenuButtonCaption>
								<svg width="8" height="8" viewBox="0 0 12 12" fill="none"
								     xmlns="http://www.w3.org/2000/svg">
									<path d="M2 2h8v8H2z" fill="currentColor" />
									<path d="M4 4h4v1H4zM4 6h4v1H4zM4 8h3v1H4z" fill="oklch(var(--faded-bg)/1)" />
								</svg>
							</MenuButtonCaption>
						</HighlightMenuButton>
					</DialogTrigger>
					<DialogContent onClick={(e) => e.stopPropagation()}>
						<DialogHeader>
							<DialogTitle>
								{memoView === "edit" ? "Memo" : "Sign in"}
							</DialogTitle>
						</DialogHeader>
						{!userId && (<div className="grid gap-3">
							<SignInCard onSignInClick={closeMemo} />
						</div>)}
						{userId && memoView === "edit" && (<div className="grid gap-3">
							<MemoInput value={memo} onChange={setMemoValue} placeholder="Write a short note…"
							           maxLength={200} className="" />
						</div>)}
						<DialogFooter>
							<div className="ml-auto flex items-center gap-2">
								<Button className={'rp_btn'}
								        onClick={closeMemo}>{memo.length > 0 ? 'Cancel' : 'Close'}</Button>
								{memoView === "edit" && (<Button className={'rp_btn'} onClick={onSave}
								                                 disabled={saving || !userId || !dirty || memo.length < 1}>
									{saving ? "Saving…" : "Save"}
								</Button>)}
							</div>
						</DialogFooter>
					</DialogContent>
				</Dialog>
				<HighlightMenuButton onClick={handleSaveHighlight}>
					<MenuButtonCaption>
						{focusedHighlight ? "Delete" : "Highlight"}
						{/*<svg width="7" height="7.5" viewBox="0 0 7 7.5" fill="none" xmlns="http://www.w3.org/2000/svg">*/}
						{/*	<path*/}
						{/*		d="M3.7 7.46C3.33 7.46 3.08 7.11 3.08 6.66C3.08 6.41 3.17 6.03 3.35 5.52C3.53 5 3.62 4.5 3.62 3.98C3.18 4.25 2.85 4.53 2.6 4.81C2.1 5.37 1.61 5.92 1.09 5.92C0.77 5.92 0.51 5.67 0.51 5.37C0.51 5.04 0.78 4.71 1.37 4.55C1.66 4.47 1.99 4.38 2.36 4.31C2.72 4.24 3.12 4.08 3.54 3.84C3.11 3.6 2.7 3.44 2.32 3.36C1.57 3.2 0.97 3.07 0.71 2.77C0.58 2.62 0.51 2.46 0.51 2.29C0.51 1.99 0.75 1.76 1.1 1.76C1.63 1.76 2.25 2.46 2.69 2.96C2.91 3.21 3.22 3.46 3.62 3.7V3.57C3.62 3.17 3.59 2.84 3.51 2.6C3.35 2.12 3.1 1.37 3.1 1.02C3.1 0.559999 3.36 0.22 3.72 0.22C4.07 0.22 4.34 0.54 4.34 1.02C4.34 1.26 4.25 1.65 4.07 2.18C3.89 2.71 3.8 3.22 3.8 3.7C4.37 3.34 4.3 3.38 4.79 2.91C5.26 2.39 5.59 2.07 5.77 1.95C5.96 1.82 6.15 1.76 6.35 1.76C6.67 1.76 6.91 1.98 6.91 2.29C6.91 2.63 6.66 2.92 6.08 3.11C5.8 3.2 5.47 3.28 5.1 3.36C4.72 3.44 4.32 3.6 3.88 3.84C4.31 4.08 4.7 4.23 5.07 4.31C5.8 4.47 6.42 4.61 6.7 4.9C6.84 5.05 6.91 5.2 6.91 5.37C6.91 5.67 6.67 5.92 6.32 5.92C5.73 5.92 4.97 4.98 4.68 4.65C4.54 4.49 4.24 4.26 3.8 3.98V4.11C3.8 4.54 3.89 5.02 4.06 5.54C4.23 6.06 4.32 6.43 4.32 6.66C4.32 7.13 4.05 7.46 3.7 7.46Z"*/}
						{/*		fill="currentColor" />*/}
						{/*</svg>*/}
					</MenuButtonCaption>
				</HighlightMenuButton>
				<HighlightMenuButton onClick={onPrivateClick}>
					Private Note
				</HighlightMenuButton>
				<HighlightMenuButton focusedHighlight={!!focusedHighlight} onClick={handleShareHighlight}>
					Share
					<MenuButtonCaption>
						<svg width="8" height="8" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
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
					{palettee.map((palette,) => (<HighlightColorPickerItem key={palette} color={palette}
					                                                       handleSelect={handleChangeHighlightColor}
					                                                       onClick={(e) => {
						                                                       e.stopPropagation();
						                                                       e.preventDefault();
					                                                       }}
					                                                       onMouseUp={(e) => e.stopPropagation()}></HighlightColorPickerItem>))}
				</m.div>)}
			</m.div>
		</div>
	</div>
};
const HighlightColorPickerItem = ({
	handleSelect, children, className, onClick, onMouseUp, ref, color, style, ...props
}: MotionBtnProps & {
	color: HighlightColors; handleSelect: (color: HighlightColors) => void;
}) => {
	const currentColor = useHighlighter(r => r.currentColor);
	const [isActive, setIsActive] = useState(currentColor === color);
	const palette = useMemo(() => HighlightPalette[color], [color])
	const onMouseDown = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		handleSelect(color);
	}, [color, handleSelect])
	const [variant, setVariant] = useState<"active" | "inactive">(isActive ? "active" : "inactive",);
	const lastActive = useRef(isActive);
	useEffect(() => {
		const aa = currentColor === color;
		setIsActive(aa);
		setVariant(aa ? "active" : "inactive");
		lastActive.current = aa;
	}, [currentColor, color])


	const {onMouseEnter, onMouseLeave} = useDomCursor({
		enterCondition: () => (lastActive.current ? null : "FOCUS"),
	});
	/**
	 * after:absolute after:rounded-[1px] after:w-[calc(100%-1px)] after:h-[calc(100%-1px)] after:border-[1px] after:border-solid after:inset-[.5px] after:content-['']
	 */
	return (<m.button className={cn(
		"bg-off-foreground relative h-[12px] w-[16px] border-[1px] border-solid border-transparent data-[active=true]:border-muted-faded-background/60 data-[active=true]:border-[1px]",
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
		backgroundColor: `oklch(${palette}/.9)`, ...style,
	}} disabled={isActive}
	                  {...props}
	>
		{children}
	</m.button>);
};