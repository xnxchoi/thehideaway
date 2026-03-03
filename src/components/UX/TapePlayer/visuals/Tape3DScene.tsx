"use client"

import {Suspense, useEffect, useState, type ComponentProps} from "react"
import {Canvas} from "@react-three/fiber"
import {OrbitControls} from "@react-three/drei"
import * as THREE from "three"
import {TapeModel} from "./TapeModel"

interface Tape3DSceneProps {
	/**
	 * The DOM element id used as the GSAP ScrollTrigger trigger.
	 * The element should exist in the page at or near where the 3D model
	 * is visible. Defaults to "webgl_trigger".
	 */
	scrollTriggerId?: string
	className?: string
	style?: ComponentProps<"div">["style"]
}

/**
 * Responsive aspect ratios matching the original tape3d.js breakpoints:
 *   < 480px  → 9:16 (portrait mobile)
 *   480–991px → 1:1  (tablet)
 *   ≥ 992px  → 16:9 (desktop)
 */
function useResponsiveAspectRatio() {
	const [ratio, setRatio] = useState("16 / 9")

	useEffect(() => {
		const update = () => {
			const w = window.innerWidth
			if (w < 480) setRatio("9 / 16")
			else if (w <= 991) setRatio("1 / 1")
			else setRatio("16 / 9")
		}
		update()
		window.addEventListener("resize", update)
		return () => window.removeEventListener("resize", update)
	}, [])

	return ratio
}

export function Tape3DScene({
	                            scrollTriggerId = "webgl_trigger",
	                            className,
	                            style,
                            }: Tape3DSceneProps) {
	const aspectRatio = useResponsiveAspectRatio()

	return (
		<div
			className={className}
			style={{width: "100%", aspectRatio, ...style}}
		>
			<Canvas
				shadows
				dpr={[1, 2]}
				camera={{fov: 10, position: [-8, -3, 15]}}
				gl={{
					antialias: true,
					alpha: true,
				}}
				onCreated={({gl, scene, camera}) => {
					gl.shadowMap.type = THREE.PCFSoftShadowMap
					gl.toneMapping = THREE.ACESFilmicToneMapping
					gl.toneMappingExposure = 1
					gl.outputColorSpace = THREE.SRGBColorSpace
					// Slight upward scene tilt matching original lr.rotation.set(.1, 0, 0)
					scene.rotation.set(0.1, 0, 0)
					// Camera looks at origin, matching original Fr.lookAt(0, 0, 0)
					camera.lookAt(0, 0, 0)
				}}
			>
				<Suspense fallback={null}>
					<TapeModel scrollTriggerId={scrollTriggerId}/>
				</Suspense>
				<OrbitControls enableDamping/>
			</Canvas>
		</div>
	)
}
