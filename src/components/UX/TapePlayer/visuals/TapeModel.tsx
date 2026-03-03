"use client"

/**
 * TapeModel — inner R3F scene component for the tape player 3D model.
 *
 * Converted from the minified vanilla Three.js script in ./rip/tape3d.js.
 * See the plan file for a full symbol-decoding table.
 *
 * ─── Asset TODO list ──────────────────────────────────────────────────────────
 * Before shipping to production, download the four assets and place them at:
 *
 *   /public/draco/draco_wasm_wrapper.js   ← already in rip/, move it
 *   /public/draco/draco_decoder.wasm      ← already in rip/, move it
 *   /public/models/tape/SFmodel42.gltf    ← download from original GitHub URL
 *   /public/env/urban_alley_01_1k.hdr     ← download from original GitHub URL
 *   /public/video/display.mp4             ← download from original GitHub URL
 *
 * Then update the five TODO comments below to use the /public/ paths.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {useEffect, useRef} from "react"
import {useFrame, useThree} from "@react-three/fiber"
import {useGLTF, Environment} from "@react-three/drei"
import {useLenis} from "lenis/react"
import {gsap} from "gsap"
import {ScrollTrigger} from "gsap/ScrollTrigger"
import * as THREE from "three"

gsap.registerPlugin(ScrollTrigger)

// ─── DRACO decoder path ───────────────────────────────────────────────────────
// TODO: replace with '/draco/' once draco_wasm_wrapper.js + draco_decoder.wasm
//       are moved from rip/ into /public/draco/
useGLTF.setDecoderPath(
	"https://raw.githubusercontent.com/kujira22/kujira_webgl/master/cw/draco/"
)

// ─── Asset URLs (dev fallbacks — replace with /public/ paths for production) ──

// TODO: replace with '/models/tape/SFmodel42.gltf'
const MODEL_URL =
	"https://raw.githubusercontent.com/kujira22/kujira_webgl/master/SF24/models/SFmodel42.gltf"

// TODO: replace with '/env/urban_alley_01_1k.hdr'
const HDR_URL =
	"https://raw.githubusercontent.com/kujira22/kujira_webgl/master/SF24/ev/urban_alley_01_1k.hdr"

// TODO: replace with '/video/display.mp4'
const VIDEO_URL =
	"https://raw.githubusercontent.com/kujira22/kujira_webgl/master/SF24/video/Display.mp4"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Constant idle disk rotation speed (Gb in original). */
const BASE_DISK_SPEED = -0.005

/** Initial model rotation.y */
const INIT_ROT_Y = -0.6

/** Initial model position.y */
const INIT_POS_Y = -0.2

// ─────────────────────────────────────────────────────────────────────────────

interface TapeModelProps {
	scrollTriggerId?: string
}

export function TapeModel({scrollTriggerId = "webgl_trigger"}: TapeModelProps) {
	const {scene} = useGLTF(MODEL_URL)
	const {scene: r3fScene} = useThree()

	/** The "Disk" mesh that spins in response to scroll velocity. */
	const diskRef = useRef<THREE.Object3D | null>(null)

	/** Raw scroll velocity fed by Lenis (hg in original). */
	const scrollVelocityRef = useRef(0)

	/** Exponentially smoothed velocity (qc in original). */
	const smoothedVelocityRef = useRef(0)

	/** The PointLight so GSAP can animate its position. */
	const lightRef = useRef<THREE.PointLight>(null!)

	/** Reference to the replaced Metal MeshStandardMaterial. */
	const metalMatRef = useRef<THREE.MeshStandardMaterial | null>(null)

	// ─── Material setup, disk ref, video texture ────────────────────────────────
	useEffect(() => {
		if (!scene) return

		scene.receiveShadow = true
		scene.castShadow = true
		scene.position.set(0, INIT_POS_Y, 0)
		scene.rotation.y = INIT_ROT_Y

		// Locate the Disk mesh for the animation loop
		diskRef.current = scene.getObjectByName("Disk") ?? null

		scene.traverse((obj) => {
			if (!(obj instanceof THREE.Mesh) || !obj.material) return
			const mat = obj.material as THREE.Material & { name?: string }

			// ── Display mesh — video texture as emissive map ─────────────────────
			if (mat.name === "Display") {
				// TODO: replace VIDEO_URL with '/video/display.mp4' for production
				const video = document.createElement("video")
				video.src = VIDEO_URL
				video.crossOrigin = "anonymous"
				video.loop = true
				video.muted = true
				video.playsInline = true

				const videoTex = new THREE.VideoTexture(video)
				videoTex.minFilter = THREE.LinearFilter
				videoTex.magFilter = THREE.LinearFilter
				videoTex.format = THREE.RGBAFormat
				videoTex.flipY = false

				const displayMat = obj.material as THREE.MeshStandardMaterial
				// 0x96F7FF decoded from original decimal literal 9893887
				displayMat.emissive = new THREE.Color(0x96f7ff)
				displayMat.emissiveIntensity = 200
				displayMat.emissiveMap = videoTex
				displayMat.needsUpdate = true

				// Attempt autoplay after a short delay (mirrors original 2 s setTimeout)
				setTimeout(() => {
					video.play().catch(() => {
						// Autoplay may be blocked on mobile until user gesture
					})
				}, 2000)
			}

			// ── black_glass — MeshPhysicalMaterial with transmission ─────────────
			if (mat.name === "black_glass") {
				obj.material = new THREE.MeshPhysicalMaterial({
					color: "#111111",
					metalness: 0,
					roughness: 0,
					transmission: 1,
					ior: 1.3,
					thickness: 0.3,
					transparent: false,
					envMap: (r3fScene.environment as THREE.Texture) ?? undefined,
				})
				obj.material.needsUpdate = true
			}

			// ── Black — plain MeshStandardMaterial ───────────────────────────────
			if (mat.name === "Black") {
				obj.material = new THREE.MeshStandardMaterial({
					color: "#1c1c1c",
					metalness: 0,
					roughness: 1,
				})
				obj.material.needsUpdate = true
			}

			// ── Metal — polished material with normal map from original ──────────
			if (mat.name === "Metal") {
				const original = obj.material as THREE.MeshStandardMaterial
				const metalMat = new THREE.MeshStandardMaterial({
					color: "#EBEFF4",
					metalness: 0.85,
					roughness: 0.2,
					envMap: (r3fScene.environment as THREE.Texture) ?? undefined,
					envMapIntensity: 0.1,
					normalMap: original.normalMap,
					normalScale: original.normalScale?.clone(),
				})
				metalMat.normalScale?.set(0.5, 0.5)
				metalMat.needsUpdate = true
				obj.material = metalMat
				metalMatRef.current = metalMat
			}
		})
	}, [scene, r3fScene])

	// ─── Responsive model scale ───────────────────────────────────────────────
	useEffect(() => {
		if (!scene) return

		const updateScale = () => {
			// < 991 px → 0.5 scale (mobile + tablet), ≥ 992 px → 0.6
			const s = window.innerWidth < 991 ? 0.5 : 0.6
			scene.scale.set(s, s, s)
		}
		updateScale()
		window.addEventListener("resize", updateScale)
		return () => window.removeEventListener("resize", updateScale)
	}, [scene])

	// ─── GSAP ScrollTrigger animations ───────────────────────────────────────
	useEffect(() => {
		if (!scene || !lightRef.current) return
		const light = lightRef.current
		const metalMat = metalMatRef.current
		const triggerSelector = `#${scrollTriggerId}`

		// 1. Model rotation.y and position.y over scroll
		const modelST = ScrollTrigger.create({
			trigger: triggerSelector,
			start: "top center+=50%",
			end: "bottom center-=50%",
			scrub: true,
			onUpdate: (self) => {
				scene.rotation.y = INIT_ROT_Y + self.progress * ((2 * Math.PI) / 6)
				scene.position.y = INIT_POS_Y + self.progress * 0.6
			},
		})

		// 2. PointLight position animation (x:-0.5, y:-0.5 — duplicate x key fixed)
		const lightAnim = gsap.to(light.position, {
			x: -0.5,
			y: -0.5,
			ease: "none",
		})
		const lightST = ScrollTrigger.create({
			trigger: triggerSelector,
			start: "top bottom-=20%",
			end: "bottom top+=0%",
			scrub: true,
			animation: lightAnim,
		})

		// 3. Metal material envMapIntensity 0.1 → 3
		let metalST: ScrollTrigger | null = null
		let metalAnim: gsap.core.Tween | null = null
		if (metalMat) {
			metalAnim = gsap.to(metalMat, {
				envMapIntensity: 3,
				ease: "none",
				onUpdate: () => {
					metalMat.needsUpdate = true
				},
			})
			metalST = ScrollTrigger.create({
				trigger: triggerSelector,
				start: "top bottom-=20%",
				end: "bottom top+=0%",
				scrub: true,
				animation: metalAnim,
			})
		}

		return () => {
			modelST.kill()
			lightST.kill()
			lightAnim.kill()
			metalST?.kill()
			metalAnim?.kill()
		}
	}, [scene, scrollTriggerId])

	// ─── Lenis scroll velocity → disk rotation ────────────────────────────────
	// Mirrors: Mi.on('scroll', ({ velocity }) => { hg = -velocity * 0.005 })
	useLenis(({velocity}) => {
		scrollVelocityRef.current = -velocity * 0.005
	})

	// ─── Animation loop ───────────────────────────────────────────────────────
	// Mirrors the requestAnimationFrame loop (dg) from the original.
	useFrame(() => {
		// Pause rendering when tab is hidden (mirrors Gl / document.hidden check)
		if (document.hidden) return

		if (diskRef.current) {
			// Exponential smoothing: qc += (hg - qc) * 0.1
			smoothedVelocityRef.current +=
				(scrollVelocityRef.current - smoothedVelocityRef.current) * 0.1
			diskRef.current.rotation.y += BASE_DISK_SPEED + smoothedVelocityRef.current
		}
	})

	return (
		<>
			{/*
			 * HDR environment lighting.
			 * TODO: replace HDR_URL with '/env/urban_alley_01_1k.hdr' for production.
			 * `background={false}` keeps the env map for lighting only (no visible skybox).
			 */}
			<Environment files={HDR_URL} background={false}/>

			{/*
			 * PointLight — original: new J_(0xFF7829, 50, 3.5, 3.6)
			 * GSAP ScrollTrigger will animate this light's position.x and position.y.
			 */}
			<pointLight
				ref={lightRef}
				color={0xff7829}
				intensity={50}
				distance={3.5}
				decay={3.6}
				position={[-2, -1.3, 2]}
				castShadow
			/>

			{/* The GLTF model — materials are overridden in useEffect above */}
			<primitive object={scene}/>
		</>
	)
}
