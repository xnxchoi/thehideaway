import React, {useRef, useEffect, useState, useCallback} from "react";
import classNames from "classnames";
import {useStore} from "@/store"; // hypothetical store hook
import {delay, preloadImages} from "@/utils"; // hypothetical utils
import useNavigation from "@/hooks/useNavigation"; // hypothetical hook
import TranslatingText from "@/components/TranslatingText"; // assumed component
import styles from "./Preloader.module.css";
import {useVoyageur} from "@/stores/Routing/RP_Voyageur";
import {cn} from "@/lib/utils";
import TranslatingText from "@/components/UX/TranslatingText/TranslatingText"; // assumed CSS module

const LOCAL_STORAGE_KEY = "lastPreloadTime";

const Preloader = () => {
	const navigationSettings = useStore(
		(state) => state.globalSettings.navigation,
	);
	const isPreloaderVisible = useStore((state) => state.isPreloader);
	const navigationData = useStore((state) => state.navigationPageItemData);
	const setEnablePreloaderAnimation = useStore(
		(state) => state.setEnablePreloaderAnimation,
	);
	const setPreloaderAnimationType = useStore(
		(state) => state.setPreloaderAnimationType,
	);
	const cursorTheme = useStore((state) => state.cursorTheme);
	const preloaderAnimationType = useStore(
		(state) => state.preloaderAnimationType,
	);

	const leftRef = useRef(null);
	const rightRef = useRef(null);
	const wrapperRef = useRef(null);
	const initializedRef = useRef(false);
	const currentTime = useState(() => new Date())[0];

	const isHome = useVoyageur((r) => r.isHome);

	// Extracting texts
	const {preloader: {title1, title2, title3, randomTexts = []} = {}} =
	navigationSettings || {};

	const [random1, random2, random3] = randomTexts;

	const loadAssets = useCallback(async (onComplete) => {
		const imagesToLoad = Array.from(
			document.querySelectorAll('[data-preloader="true"]'),
		);
		const preloadContainer = document.createElement("div");
		preloadContainer.classList.add(styles.loadableImageContainer);
		document.body.appendChild(preloadContainer);

		const clonedImages = imagesToLoad.map((el) => el.cloneNode(true));
		clonedImages.forEach((el) => preloadContainer.appendChild(el));

		await delay(300);

		const urls = clonedImages.map((img) => {
			if (img.nodeName === "IMG") return img.currentSrc;
			const nestedImg = img.querySelector("img");
			return nestedImg?.currentSrc;
		}).filter(Boolean);

		if (urls.length) {
			preloadImages({
				urls,
				onComplete: () => {
					onComplete?.();
					preloadContainer.remove();
				},
			});
		}
	}, []);

	// Preloader decision logic
	useEffect(() => {
		if (initializedRef.current) return;
		initializedRef.current = true;

		const now = Date.now();
		const storedTime = parseInt(localStorage.getItem(LOCAL_STORAGE_KEY), 10);

		if (!storedTime && isHome) {
			localStorage.setItem(LOCAL_STORAGE_KEY, `${now}`);
			setPreloaderAnimationType("SLOW");
		} else if (now - storedTime > 86400000 && isHome) {
			localStorage.setItem(LOCAL_STORAGE_KEY, `${now}`);
			setPreloaderAnimationType("SLOW");
		} else {
			setPreloaderAnimationType("FAST");
		}

		setEnablePreloaderAnimation(true);
	}, [isHome, setPreloaderAnimationType, setEnablePreloaderAnimation]);

	// Lazy asset loading for SLOW animation
	useEffect(() => {
		if (navigationData && preloaderAnimationType === "SLOW") {
			delay(250).then(loadAssets);
		}
	}, [navigationData, preloaderAnimationType, loadAssets]);

	if (!isPreloaderVisible) return null;

	return (
		<div className={classNames(styles.Preloader, styles[cursorTheme])} ref={wrapperRef}>
			<div className={styles.leftContent} ref={leftRef}>
				{title1 &&
					title2 &&
					title3 &&
					random1 &&
					random2 &&
					random3 &&
					preloaderAnimationType !== "FAST" && (
						<>
							<TranslatingText id="TITLE_1" text={title1} className={cn("")} />
							<TranslatingText id="TITLE_2" text={title2}
							                 className={classNames(styles.translatingText,
								                 styles.large)} />
							<TranslatingText id="TITLE_3" text={title3}
							                 className={classNames(styles.translatingText,
								                 styles.large)} />
							<TranslatingText id="RANDOM_TEXT_1" text={random1}
							                 className={styles.translatingText} hideMobile />
							<TranslatingText id="RANDOM_TEXT_2" text={random2}
							                 className={styles.translatingText} hideMobile />
							<TranslatingText id="RANDOM_TEXT_3" text={random3}
							                 className={styles.translatingText} hideMobile />
							<TranslatingText id="RANDOM_TEXT_4"
							                 text={`${currentTime.getHours() % 12 || 12}:${currentTime.getMinutes().
								                 toString().
								                 padStart(2, "0")} ${currentTime.toLocaleTimeString(
								                 "en-us", {timeZoneName: "short"}).split(" ")[2]}`}
							                 className={styles.translatingText} hideMobile />
						</>
					)}
				{Array.from({length: 12}).map((_, i) => (
					<span key={i} className={styles.gridPositioningBox} data-grid-box={i + 1}>
            {["TOP_LEFT", "TOP_RIGHT", "BOTTOM_LEFT", "BOTTOM_RIGHT"].map(
	            (pos) => (
		            <span key={pos} data-position={pos} />
	            ),
            )}
						<span className={styles.gridPositioningBox__number}>{i + 1}</span>
          </span>
				))}
			</div>
			<div className={styles.rightContent} ref={rightRef}>
				{Array.from({length: 12}).map((_, i) => (
					<span key={i} className={styles.gridPositioningBox} data-grid-box={i + 13}>
            {["TOP_LEFT", "TOP_RIGHT", "BOTTOM_LEFT", "BOTTOM_RIGHT"].map(
	            (pos) => (
		            <span key={pos} data-position={pos} />
	            ),
            )}
						<span className={styles.gridPositioningBox__number}>{i + 13}</span>
          </span>
				))}
			</div>
		</div>
	);
};

export default Preloader;
