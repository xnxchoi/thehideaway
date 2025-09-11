"use client";

import {errorToast, successToast} from "@/components/ui/sonner";
import {useCharacterLimit} from "@/hooks/use-character-limit";
import {
	autoUpdate,
	FloatingFocusManager,
	FloatingPortal,
	offset,
	useClick,
	useDismiss,
	useFloating,
	UseFloatingReturn,
	useInteractions,
	UseInteractionsReturn,
	useMergeRefs,
	useRole,
	useTransitionStatus
} from "@floating-ui/react";
import {Button} from "@payloadcms/ui";
import {useQueryClient} from "@tanstack/react-query";
import {useTranslations} from "next-intl";
import {
	ChangeEventHandler, createContext, ReactNode, useCallback, useContext, useEffect, useId, useMemo, useRef, useState
} from "react";
import {HighlightedRange, RangeSaveParams} from "./types";
import {useHighlighter} from "./provider";
import {useRPSession} from "@/lib/auth/session/RP_SessionProvider";
import * as rangey from "rangy";
import "rangy/lib/rangy-classapplier";
import "rangy/lib/rangy-highlighter";
import 'rangy/lib/rangy-selectionsaverestore';
import "rangy/lib/rangy-textrange";
import {Textarea} from "@/components/ui/textarea";
import {Dialog, DialogContent, DialogHeading} from "./floatDialog";
import {UserBar} from "./sideBarProvider";
import {ComponentPropsWithRef} from "@react-spring/three";

export type PrivateHighlights = {
	memo: string;
	setMemo: (memo: string) => void;
	setOpen: (open: boolean) => void;
	disabled: boolean;
	setDisabled: (disabled: boolean) => void;
	toggleOpen: () => void;
	open: boolean;
	view: 'edit' | 'view';
	setView: (view: 'edit' | 'view') => void;
	ctx: Omit<UseFloatingReturn, 'refs'> & UseInteractionsReturn;
	isMounted: boolean;
	status: "initial" | "unmounted" | "open" | "close";
	refs: UseFloatingReturn['refs'];
};
export const PrivateMemoContext = createContext<PrivateHighlights>(null!)
export const PrivateMemoizer = (props: {
	createCallback: (prop: Pick<RangeSaveParams, 'private' | 'memo'>) => Promise<HighlightedRange>;
	saveCallback: (saveParams: HighlightedRange) => Promise<HighlightedRange>;
	children: ReactNode;
}) => {


	const {saveCallback, createCallback, children} = props;
	const [memo, setMemo] = useState<string>("");
	const [open, setOpen] = useState(false);
	const toggleOpen = () => {
		setOpen(!open);
	}
	const [isOpen, setIsOpen] = useState(false);
	const t = useTranslations();
	const ctx = useFloating({
		placement: "right-start",
		open: isOpen,
		onOpenChange: setIsOpen,
		middleware: [offset(10)],
		whileElementsMounted: autoUpdate
	});
	const {refs, ...context} = ctx;
	const {status, isMounted} = useTransitionStatus(context.context);

	const click = useClick(context.context);
	const dismiss = useDismiss(context.context, {
		outsidePressEvent: 'mousedown',

	});
	const role = useRole(context.context);
	const interactions = useInteractions([click, dismiss, role]);
	const [disabled, setDisabled] = useState(false);
	const [view, setView] = useState<'edit' | 'view'>('view');
	const target = useHighlighter(r => r.target);
	const postId = useMemo(() => target?.value, [target]);
	const userId = useRPSession(r => r.id as null | string);
	const highlights = useHighlighter(r => r.highlights);
	const userName = useRPSession((r) => r.name);
	const userImage = useRPSession(r => r.image);
	const userD = useRPSession(r => r.displayUsername);
	const userS = useRPSession(r => r.slug);
	const savedSelectionRef = useRef<rangy.savedSelection | null>(null);
	const [saving, setSaving] = useState(false);

	const focusedHighlight = useHighlighter(r => r.focusedHighlight);
	const fc = useRef(focusedHighlight);
	useEffect(() => {
		setDisabled(!userId || saving);
	}, [userId, saving])
	useEffect(() => {
		fc.current = focusedHighlight;
	}, [focusedHighlight])
	const lastValue = useRef("");
	useEffect(() => {
		if (!userId) {
			setIsOpen(false);
			return;
		}
		if (open) {
			savedSelectionRef.current = fc.current ? null : rangey.saveSelection();
			lastValue.current = fc.current?.memo || "";
			setMemo(fc.current?.memo || "");
			if (!fc.current) {
				setView('edit');
			}
			setDirty(false);
			setIsOpen(true);
		} else {
			savedSelectionRef.current = null;
			setMemo("");
			lastValue.current = ""
			setDirty(false);
			setIsOpen(false);
		}
	}, [open, userId])
	const qc = useQueryClient();
	const [dirty, setDirty] = useState<boolean>(false)
	const onSave = useCallback(async (e) => {
		e.stopPropagation();
		if (!userId || !postId || !memo || memo.length < 1) {
			return setSaving(false);
		}
		if (!fc.current) {
			if (savedSelectionRef.current) {
				setSaving(true);
				rangey.restoreSelection(savedSelectionRef.current);
				rangey.removeMarkers(savedSelectionRef.current);
				savedSelectionRef.current = null;
				await createCallback({private: true, memo}).then(r => {
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
				...fc.current, memo, private: true,

			} satisfies HighlightedRange;
			await saveCallback(body);
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
	}, [createCallback, memo, postId, qc, saveCallback, t, userId]);
	const textAreaId = useId()
	const {
		value, characterCount, handleChange, maxLength: limit,
	} = useCharacterLimit({maxLength: 200, initialValue: memo})
	const oC: ChangeEventHandler<HTMLTextAreaElement> = useCallback((e) => {
		if (e.target.disabled) return;
		handleChange(e);
	}, [handleChange])
	useEffect(() => {
		if (lastValue.current !== value) {
			setDirty(true);
		}
		lastValue.current = value;
		setMemo(value);
	}, [value, setMemo]);
	return <PrivateMemoContext.Provider value={{
		memo,
		setMemo,
		setOpen,
		setView,
		toggleOpen,
		open: isOpen,
		view,
		disabled,
		setDisabled,
		refs,
		ctx: {...ctx, ...interactions},
		isMounted,
		status
	}}>
		{children}
		{isOpen && (<Dialog open={isOpen} onOpenChange={setOpen}>
			<DialogContent focusManager={{
				modal: false,

			}}>
				<div className={'flex p-[12px_20px] items-center bg-muted-faded-background/85 '}>
					<div className={'-ml-[4px] block mr-[8px] [&_svg]:align-middle'}></div>
					<div className={'top-px flex-[1_1_auto] relative block'}>
						<DialogHeading
							className={'uppercase text-[13px] leading-[18px] text-muted-foreground  tracking-[0.077em]'}>
						<span className={'text-[13px] leading-[20px] text-muted-foreground'}>
						{view === 'view' ? 'Private Note' : 'Edit'}
						</span>
						</DialogHeading>
					</div>
					<div className={'top-px flex-[1_1_auto] relative block'}>
						<p className={'text-[13px] leading-[20px]'}>
							Learn More </p>
					</div>
				</div>
				{view === 'edit' ? (<div className={'block p-[12px_20px]'}>
					<div className={'block'}>
						<div className={'flex items-center mb-[12px]'}></div>
						<div className={'mb-[12px] block'}>
							<div className={'*:not-first:mt-2'}>
								<Textarea placeholder={"Something on this note for your eyes only.."}
								          className={'min-h-[120px]'} value={value} onChange={oC} maxLength={limit}
								          id={textAreaId} disabled={saving || !userId} />
								<p id={`${textAreaId}-description`}
								   className="text-off-foreground mt-2 text-right text-xs" role="status"
								   aria-live="polite"><span className="tabular-nums">{characterCount}</span>/<span
									className={'tabular-nums'}>{limit}</span></p>
							</div>
						</div>
						<div className={'text-[14px] leading-[20px] text-muted-foreground'}>
							<div className={'flex justify-between'}>
								<div className={'flex'}><Button
									className={'disabled:opacity-30 bg-transparent disabled:fg-muted-background'}
									onClick={onSave} disabled={saving || !userId || !dirty || !memo || memo.length < 1}>
									{saving ? "Saving…" : "Save"}
								</Button></div>
								<div className={'flex'}><Button disabled={saving} onClick={(e) => {
									e.preventDefault();
									setOpen(false);
								}}>Cancel</Button></div>
							</div>
						</div>
					</div>
				</div>) : (<div className={'p-[0_20px] block'}>
					<div className={'p-[12px_0] block'}>
						<div className={'mb-[12px] flex items-center'}>{userId && <UserBar user={{
							name: userName, image: userImage, displayUsername: userD, slug: userS, id: userId
						}} />}</div>
						<div className={'block whitespace-pre-wrap'}>
							{memo}
						</div>
					</div>
					<div
						className={'mb-0 p-[12px_0] border-t-px border-solid border-muted-faded-background/65 mt-[8px] flex'}>
						<div className={'text-[14px]'}></div>
					</div>
				</div>)}</DialogContent>
		</Dialog>)}
	</PrivateMemoContext.Provider>
}
const PrivateDialog = (props: ComponentPropsWithRef<'div'> & { children: ReactNode }) => {
	const disabled = usePrivateNote(r => r.disabled);
	const focusedHighlight = useHighlighter(r => r.focusedHighlight);
	const fc = useRef(focusedHighlight);
	useEffect(() => {
		fc.current = focusedHighlight
	}, [focusedHighlight]);
	const {context: floatingContext, ...context} = usePrivateNote(r => r.ctx);
	const isMounted = usePrivateNote(r => r.isMounted);
	const refs = usePrivateNote(r => r.refs);
	const open = usePrivateNote(r => r.open);
	const {ref: propRef, ...reste} = props;
	const ref = useMergeRefs([refs.setFloating, propRef]);
	const view = usePrivateNote(r => r.view);
	useEffect(() => {
		if (isMounted) {
			if (fc.current) {

			}
		}

	}, [open])

	return isMounted && (<FloatingPortal><FloatingFocusManager context={floatingContext} modal={false}
	                                                           disabled={disabled || !open || view !== 'edit'}>
		<div
			{...reste} ref={ref} {...context.getFloatingProps(reste)}>{reste.children}</div>
	</FloatingFocusManager></FloatingPortal>);
}
export const usePrivateNote = <T, >(selector: (state: PrivateHighlights) => T) => {
	const context = useContext(PrivateMemoContext);
	if (!context) throw new Error('usePrivateNote must be used within a PrivateMemoizer');
	return selector(context);
}