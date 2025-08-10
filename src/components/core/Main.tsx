"use client";

import {ReactNode, useRef} from "react";
import {ContentMask} from "../UX/ContentMask";
import {PageTransitionPortal} from "../UX/Transition/PageTransitionPortal";

import {FXFrame} from "../UX/FXFrame/FXFrame";
import {MenuMediaPreview} from "../UX/MediaPreview/MenuMediaPreview";
import {Canvas} from "@react-three/fiber";
import {OrthographicCamera, View} from "@react-three/drei";
import {Linus} from "../UX/Scroll";
import {PerformanceRegress} from "../UX/Gradient/Gradient";
import {Controlbar} from "@/components/UX/Controlbar";

export const Main = ({children}: { children: ReactNode }) => {
	const mainRef = useRef<HTMLElement>(null!);

	return (
		<main ref={mainRef}>
			<MenuMediaPreview />
			<ContentMask>{children}</ContentMask>
			<PageTransitionPortal />
			<FXFrame />
			<Controlbar />
			<Canvas performance={{min: 0.2}} style={{
				position: "fixed",
				inset: 0,
				zIndex: 40,
				width: "100vw",
				height: "100vh",
			}} gl={{
				premultipliedAlpha: false,
				alpha: true,
				antialias: false,
			}} className="preview__gradient" eventSource={mainRef}>
				<OrthographicCamera makeDefault position={[0, 0, 1]} />
				<View.Port />
				<PerformanceRegress />
			</Canvas>
			<Linus root={true} />
		</main>
	);
};
