import {useCursorStore} from "@/providers/RP_Pro";
import {useIsMobile} from "@/utilities/getBreakpoints";
import {ComponentProps, useCallback} from "react";
import {ThreeEvent} from "@react-three/fiber";

type DOMMouseEventHandler<T> = (event: React.MouseEvent<T>) => void;
type ThreePointerEventHandler = (event: ThreeEvent<PointerEvent>) => void;

interface UseCursorHandlersOptions<T = HTMLElement> {
	onEnter?: DOMMouseEventHandler<T> | ThreePointerEventHandler;
	onLeave?: DOMMouseEventHandler<T> | ThreePointerEventHandler;
}

type SomeDivProps = ComponentProps<"div"> & {
	customStuff1?: string;
	customStuff2?: number;
};

interface CursorHandlers<T = HTMLElement> {
	onMouseEnter: DOMMouseEventHandler<T>;
	onMouseLeave: DOMMouseEventHandler<T>;
	onPointerOver: ThreePointerEventHandler;
	onPointerOut: ThreePointerEventHandler;
}

type EventType = "dom" | "three";

type EventHandlers<T extends EventType, E> = T extends "dom"
	? {
		onMouseEnter: (e: React.MouseEvent<E>) => void;
		onMouseLeave: (e: React.MouseEvent<E>) => void;
	}
	: {
		onPointerOver: (e: ThreeEvent<PointerEvent>) => void;
		onPointerOut: (e: ThreeEvent<PointerEvent>) => void;
	};
export type MarqueeState = ["MARQUEE", string];
export type TextCursorState = "HOVER" | "DRAG" | "CLOSE" | string;
export type CursorState = "FOCUS" | null;
export type CursorStated = TextCursorState | CursorState;
type CursorHandlersOptions<T extends EventType, E> = Partial<{
	onEnter: T extends "dom"
		? (e: React.MouseEvent<E>) => void
		: (e: ThreeEvent<PointerEvent>) => void;
	onLeave: T extends "dom"
		? (e: React.MouseEvent<E>) => void
		: (e: ThreeEvent<PointerEvent>) => void;
	overrides?: {
		onEnter?: {
			condition: (
				e?: T extends "dom" ? React.MouseEvent<E> : ThreeEvent<PointerEvent>,
			) => CursorStated;
		};
		onLeave?: {
			condition: (
				e?: T extends "dom" ? React.MouseEvent<E> : ThreeEvent<PointerEvent>,
			) => CursorState;
		};
	};
}>;
type DomCursorOptions<E> = Partial<{
	onEnter: (e: React.MouseEvent<E>) => void;
	onLeave: (e: React.MouseEvent<E>) => void;
	marquee?: {
		enter?: (e: React.MouseEvent<E>) => boolean;
		leave?: (e: React.MouseEvent<E>) => boolean;
	};
	enterCondition?: (e: React.MouseEvent<E>) => CursorStated;
	leaveCondition?: (e: React.MouseEvent<E>) => CursorStated;
}>;
type DomHandlers<E> = {
	onMouseEnter: (e: React.MouseEvent<E>) => void;
	onMouseLeave: (e: React.MouseEvent<E>) => void;
};

export function useDomCursor<E extends HTMLElement>({
	onEnter,
	onLeave,
	enterCondition,
	leaveCondition,
	marquee,
}: DomCursorOptions<E>): DomHandlers<E> {
	const {isMobile} = useIsMobile();
	const setCur = useCursorStore((l) => l.setCursorState);
	const setMarquee = useCursorStore((l) => l.setMarquee);
	const {enter: onEnterMarquee, leave: onLeaveMarquee} = marquee || {};
	const onMouseEnter: DomHandlers<E>["onMouseEnter"] = useCallback(
		(e) => {
			if (isMobile) return;
			const disabled = (e.target as HTMLDivElement).dataset.disabled;
			const active = (e.target as HTMLDivElement).dataset.active;
			const nullCondition = Boolean(
				(disabled && disabled === "true") || (active && active === "true"),
			);
			const onEnterState: CursorStated = enterCondition
				? enterCondition(e)
				: nullCondition
					? null
					: "FOCUS";
			setCur(onEnterState);
			onEnter?.(e);
			if (onEnterMarquee) {
				const result = onEnterMarquee(e);
				setMarquee(result);
			} else {
				setMarquee(false);
			}
		},
		[onEnter, enterCondition, isMobile],
	);
	const onMouseLeave: DomHandlers<E>["onMouseLeave"] = useCallback(
		(e) => {
			if (isMobile) return;
			const onLeaveState: CursorStated = leaveCondition
				? leaveCondition(e)
				: null;
			setCur(onLeaveState);
			onLeave?.(e);
			if (onLeaveMarquee) {
				const result = onLeaveMarquee(e);
				setMarquee(result);
			} else {
				setMarquee(false);
			}
		},
		[onLeave, leaveCondition, isMobile],
	);
	return {
		onMouseEnter,
		onMouseLeave,
	};
}

export function useCursorHandlers<T extends EventType, E = HTMLElement>(
	type: T,
	{onEnter, onLeave}: CursorHandlersOptions<T, E> = {},
): EventHandlers<T, E> {
	const {isMobile} = useIsMobile();
	const setCur = useCursorStore((l) => l.setCursorState);
	const handleEnter = useCallback(
		(e: any) => {
			!isMobile && setCur("FOCUS");
			onEnter?.(e);
		},
		[onEnter],
	);

	const handleLeave = useCallback(
		(e: any) => {
			!isMobile && setCur(null);
			onLeave?.(e);
		},
		[onLeave],
	);

	return type === "dom"
		? ({
			onMouseEnter: handleEnter,
			onMouseLeave: handleLeave,
		} as EventHandlers<T, E>)
		: ({
			onPointerOver: handleEnter,
			onPointerOut: handleLeave,
		} as EventHandlers<T, E>);
}
