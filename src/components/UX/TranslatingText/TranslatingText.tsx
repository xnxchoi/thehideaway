import React, {useCallback, useEffect, useRef} from "react";
import gsap from "gsap";
import styles from "./TranslatingText.module.css";
import {useStore} from "zustand/index";
import {useDeviceInfo, useRPStore} from "@/providers/RP_Pro";
import {cn} from "@/lib/utils";
import {wait} from "@/utilities/wait";
import {cva} from "class-variance-authority"; // CSS Module
import {useIsMobile} from "@/providers/MiddleMan";

const ANIMATION_CONFIG = {
	DURATION: 1,
	EASE: "Power3.easeInOut",
};
const variants = cva("absolute z-[10] opacity-0 font-normal", {
	variants: {
		hideMobile: {
			true: "hidden lg:block",
			false: "block",
		},
		size: {
			default:
				"text-[1.4rem] leading-[1] whitespace-nowrap -tracking-[.01em] lg:text-[1.6rem] font-",
			large:
				"font-300 text-[4.4rem] -tracking-[.02em] leading-[.8] lg:text-[8.8rem]",
		},
	},
	defaultVariants: {
		size: "default",
		hideMobile: false,
	},
});
const getOffsetFromCorner = (corner, width, height) => {
	switch (corner) {
		case "TOP_LEFT":
			return {x: 0, y: 0};
		case "TOP_RIGHT":
			return {x: -width, y: 0};
		case "BOTTOM_RIGHT":
			return {x: -width, y: -height};
		case "BOTTOM_LEFT":
			return {x: 0, y: -height};
		default:
			return {x: 0, y: 0};
	}
};

const computeGridOffset = ({number, corner, offset}) => {
	const box = document.querySelector(`[data-grid-box="${number}"]`);
	const cornerEl = box?.querySelector(`[data-position="${corner}"]`);
	const wrapper = document.querySelector(`.${styles.text}`); // container for measuring spacing

	if (!box || !cornerEl || !wrapper) return {x: 0, y: 0};

	const {top, left} = cornerEl.getBoundingClientRect();
	const gridGap = parseInt(
		getComputedStyle(wrapper).getPropertyValue("gap"),
		10,
	);
	const boxWidth = box.offsetWidth + gridGap;
	const boxHeight = box.offsetHeight + gridGap;

	let xOffset = 0,
		yOffset = 0;

	if (typeof offset?.x === "string") {
		const [dir, mult] = offset.x.split("_");
		xOffset = parseInt(mult) * boxWidth * (dir === "LEFT" ? -1 : 1);
	} else if (typeof offset?.x === "number") {
		xOffset = offset.x;
	}

	if (typeof offset?.y === "string") {
		const [dir, mult] = offset.y.split("_");
		yOffset = parseInt(mult) * boxHeight * (dir === "UP" ? -1 : 1);
	} else if (typeof offset?.y === "number") {
		yOffset = offset.y;
	}

	return {
		x: left + xOffset,
		y: top + yOffset,
	};
};
export type TranslatePosition = {
	number: number;
	corner: string;
	offset?: {
		x?: string;
		y?: string;
	};
};
export type TranslatingTextProps = {
	id: string;
	text: string;
	size?: "default" | "large";
	className?: string;
	introPosition?: TranslatePosition;
	positions: TranslatePosition[];
	introPositionMobile: TranslatePosition;
	positionsMobile: TranslatePosition[];
	hideMobile?: boolean;
};
const TranslatingText = ({
	id,
	text,
	className,
	introPosition,
	positions = [],
	size = "default",
	introPositionMobile,
	positionsMobile = [],
	hideMobile = false,
}: TranslatingTextProps) => {
	const wrapperRef = useRef(null);
	const mainTextRef = useRef(null);
	const timelineRef = useRef(null);

	const {isMobile} = useIsMobile();
	const enableAnimation = useRPStore((state) => state.enablePreloaderAnimation);
	const initiatedRef = useRef(false);

	const getSize = useCallback(() => {
		if (!mainTextRef.current) return {width: 0, height: 0};
		return {
			width: mainTextRef.current.offsetWidth,
			height: mainTextRef.current.offsetHeight,
		};
	}, []);

	const getFinalPosition = useCallback(
		(pos) => {
			const base = computeGridOffset(pos);
			const offset = getOffsetFromCorner(
				pos.corner,
				...Object.values(getSize()),
			);
			return {
				x: base.x + offset.x,
				y: base.y + offset.y,
			};
		},
		[getSize],
	);

	const moveToIntroPosition = useCallback(() => {
		if (!wrapperRef.current || !introPosition) return;
		const pos =
			isMobile && introPositionMobile ? introPositionMobile : introPosition;
		const {x, y} = getFinalPosition(pos);
		gsap.set(wrapperRef.current, {x, y});
	}, [introPosition, introPositionMobile, isMobile, getFinalPosition]);

	const animateToFirstPosition = useCallback(async () => {
		if (!positions.length || !wrapperRef.current) return;
		await wait(50);

		const first =
			isMobile && positionsMobile.length ? positionsMobile[0] : positions[0];
		const {x, y} = getFinalPosition(first);

		gsap.killTweensOf(wrapperRef.current);
		return gsap.to(wrapperRef.current, {
			x,
			y,
			duration: ANIMATION_CONFIG.DURATION,
			ease: ANIMATION_CONFIG.EASE,
		});
	}, [positions, positionsMobile, isMobile, getFinalPosition]);

	const startLoopingAnimation = useCallback(() => {
		if (!positions.length || !wrapperRef.current || (isMobile && hideMobile))
			return;

		const sequence = (isMobile ? positionsMobile : positions).slice(1);
		const loopPositions = [...sequence, positions[1], positions[0]];

		const tl = gsap.timeline({repeat: -1});
		loopPositions.forEach((pos) => {
			const {x, y} = getFinalPosition(pos);
			tl.to(wrapperRef.current, {
				x,
				y,
				duration: ANIMATION_CONFIG.DURATION,
				ease: ANIMATION_CONFIG.EASE,
			});
		});

		timelineRef.current = tl;
	}, [positions, positionsMobile, getFinalPosition, isMobile, hideMobile]);

	const initiateAnimation = useCallback(async () => {
		if (initiatedRef.current) return;

		moveToIntroPosition();

		if (enableAnimation) {
			initiatedRef.current = true;
			gsap.set(wrapperRef.current, {autoAlpha: 1});
			await animateToFirstPosition();
			startLoopingAnimation();
		}
	}, [
		moveToIntroPosition,
		animateToFirstPosition,
		startLoopingAnimation,
		enableAnimation,
	]);

	useEffect(() => {
		initiateAnimation();
	}, [initiateAnimation]);

	if (!text) return null;

	return (
		<p className={cn(variants({size, hideMobile}), className)} ref={wrapperRef} data-id={id}>
      <span className={styles.mainText} ref={mainTextRef}>
        {text}
      </span>
			<span className={styles.textTopLeft}>{text}</span>
			<span className={styles.textTopMiddle}>{text}</span>
			<span className={styles.textTopRight}>{text}</span>
			<span className={styles.textRightMiddle}>{text}</span>
			<span className={styles.textBottomLeft}>{text}</span>
			<span className={styles.textBottomMiddle}>{text}</span>
			<span className={styles.textBottomRight}>{text}</span>
			<span className={styles.textLeftMiddle}>{text}</span>
		</p>
	);
};
const PreloaderText = () => {
	<TranslatingText text={} />;
};
