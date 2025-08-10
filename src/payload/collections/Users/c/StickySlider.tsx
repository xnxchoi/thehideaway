"use client";
import {useCallback, useEffect, useMemo, useRef} from "react";
import {useFrame, useThree} from "@react-three/fiber";
import {useLenis} from "lenis/react";
import * as THREE from "three";
import baseVertexShader from "./baseVertex.glsl";
import stickyFrag from "./stickyFrag.glsl";
import {useWindowResize} from "@/utilities/use_window_resize";
import {gsap} from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {OrthographicCamera, View} from "@react-three/drei";
import {useInView} from "react-intersection-observer";
import {RequiredAndNonNullable} from "@/utilities/typeUtilities";
import Lenis from "lenis";

type Camera = (THREE.OrthographicCamera | THREE.PerspectiveCamera) & {
	manual?: boolean;
};

// Define texture entry interface
export interface TextureEntry {
	texture: null | THREE.Texture;
	video?: { src: string };
	image?: { src: string };
}

type Append<T extends any[], U> = [...T, U];

type CreateArrOfLen<
	N extends number,
	CurrArr extends any[] = [],
> = CurrArr["length"] extends N
	? CurrArr
	: CreateArrOfLen<N, Append<CurrArr, any>>;

type ConcatArr<A extends any[], B extends any[]> = [...A, ...B];

type Length<T extends any[]> = T["length"] extends number ? T["length"] : never;

type Add<A extends number, B extends number> = Length<
	ConcatArr<CreateArrOfLen<A>, CreateArrOfLen<B>>
>;
type Incr<T extends number> = Add<T, 1>;
// Helper: Build a tuple of length N
type BuildTuple<
	L extends number,
	T extends unknown[] = [],
> = T["length"] extends L ? T : BuildTuple<L, [...T, unknown]>;

// Helper: Convert tuple indices into number literals
type EnumerateInternal<
	T extends unknown[],
	Acc extends number[] = [],
> = T extends [infer _, ...infer Rest]
	? EnumerateInternal<Rest, [...Acc, Acc["length"]]>
	: Acc;

// Converts number[] to string literals
type ToStringUnion<T extends number[]> = `${T[number]}`;

// Main type: Generates "1" | "2" | ... | "N"
type StringRange<From extends number, To extends number> =
	| Exclude<
	ToStringUnion<EnumerateInternal<BuildTuple<To>>>,
	ToStringUnion<EnumerateInternal<BuildTuple<From>>>
>
	| `${To}`;
type TSlideNumber = StringRange<1, 4>;
type TSlide = "tSlide";

type PrefixConcat<
	Prefix extends string,
	Keys extends string,
> = `${Prefix}${Keys}`;
export type SlideKeys = PrefixConcat<TSlide, TSlideNumber>;
type SlidePowers = PrefixConcat<"slidePower", TSlideNumber>;

// Component props interface
interface StickySliderProps {
	textures: { [key in SlideKeys]?: TextureEntry };
	borderRadius?: number;
	fadeDensity?: number;
	fadePower?: number;
	borderWidth?: number;
	selector?: string;
	stickySlideEls: HTMLDivElement[];
}

type SliderUniformKeys =
	| "opacity"
	| "resolution"
	| "i_resolution"
	| "borderRadius"
	| "fadeDensity"
	| "fadePower"
	| "borderWidth"
	| "borderColor"
	| SlidePowers
	| SlideKeys;
export type SliderMaterialUniforms = {
	[key in SliderUniformKeys]: THREE.Uniform;
};
export default function StickySlider({
	textures = {},
	borderRadius = 0,
	fadeDensity = 6.5,
	fadePower = 5,
	borderWidth = 0.15,

	selector = '[data-gl-type="about-sticky-img-slider"]',
	stickySlideEls,
}: StickySliderProps) {
	// Geometry & material

	const {inView, ref} = useInView({
		threshold: 0.1,
		rootMargin: "0px 0px -5%",
	});
	// Load textures
	// useEffect(() => {
	//   Object.entries(textures).forEach(([key, texInfo]) => {
	//     let tex: THREE.Texture
	//     if (texInfo.video) {
	//       const videoEl = document.createElement("video")
	//       videoEl.preload = "metadata"
	//       videoEl.muted = true
	//       videoEl.loop = true
	//       videoEl.crossOrigin = "anonymous"
	//       videoEl.setAttribute("playsinline", "playsinline")
	//       videoEl.src = texInfo.video.src
	//       videoEl.play()
	//       tex = new THREE.VideoTexture(videoEl)
	//     } else if (texInfo.image) {
	//       tex = new THREE.TextureLoader().load(texInfo.image.src)
	//     } else {
	//       return
	//     }
	//     texInfo.texture = tex
	//     if (material.uniforms[key]) {
	//       (material.uniforms[key] as any).value = tex
	//     }
	//   })
	// }, [])

	return (
		<View ref={ref as unknown as React.RefObject<HTMLDivElement>}
		      className="absolute inset-0 z-[25] pointer-events-none"
		      data-gl-type="about-sticky-img-slider">
			<StickyShade stickySlideEls={stickySlideEls} visible={inView} textures={textures}
			             borderRadius={borderRadius} borderWidth={borderWidth} selector={selector}
			             fadeDensity={fadeDensity} fadePower={fadePower} />
		</View>
	);
}
const StickyShade = (
	props: RequiredAndNonNullable<StickySliderProps> & { visible: boolean },
) => {
	const {
		textures,
		borderRadius,
		fadeDensity,
		fadePower,
		borderWidth,
		selector,
		visible,
		stickySlideEls,
	} = props;
	const {width: vpW, height: vpH} = useThree((r) => r.viewport);

	const resize = useWindowResize({detectHeightChange: true});
	const shouldResize = useRef(false);
	const elRef = useRef<HTMLElement | null>(document.querySelector(selector));
	const scaleX = useRef(1);
	const scaleY = useRef(1);
	const leftOffset = useRef(0);
	useEffect(() => {
		const el = elRef.current;
		if (!el) return;
		const {width: w, height: h, left} = el.getBoundingClientRect();
		scaleX.current = w * 0.1;
		scaleY.current = h * 0.1;
		leftOffset.current = left;
		shouldResize.current = true;
	}, []);
	useEffect(() => {
		const el = elRef.current;
		if (!el) return;
		const {width: w, height: h, left} = el.getBoundingClientRect();
		scaleX.current = w * 0.1;
		scaleY.current = h * 0.1;
		leftOffset.current = left;
		shouldResize.current = true;
	}, [resize]);

	const stickyMaterial = useMemo(
		() =>
			new THREE.ShaderMaterial({
				vertexShader: baseVertexShader,
				fragmentShader: stickyFrag,
				transparent: true,
				uniforms: {
					opacity: {value: 1},
					resolution: {value: new THREE.Vector2(300, 400)},
					i_resolution: {value: new THREE.Vector2(300, 400)},
					borderRadius: {value: borderRadius},
					fadeDensity: {value: fadeDensity},
					fadePower: {value: fadePower},
					borderWidth: {value: borderWidth},
					borderColor: {value: new THREE.Color(1, 1, 1)},
					slidePower1: {value: 0},
					slidePower2: {value: 0},
					slidePower3: {value: 0},
					slidePower4: {value: 0},
					tSlide1: {value: textures.tSlide1!.texture!},
					tSlide2: {value: textures.tSlide2!.texture!},
					tSlide3: {value: textures.tSlide3!.texture!},
					tSlide4: {value: textures.tSlide4!.texture!},
				},
			}),
		[borderRadius, fadeDensity, fadePower, borderWidth, textures],
	);

	const meshRef = useRef<
		THREE.Mesh & {
		material: THREE.ShaderMaterial & { uniforms: SliderMaterialUniforms };
	}
	>(null!);
	gsap.registerPlugin(ScrollTrigger);
	const slideMap = useRef(
		new WeakMap<
			HTMLElement,
			{
				slide: HTMLElement;
				index: number;
				tl: GSAPTimeline | null;
				observer: IntersectionObserver | null;
			}
		>(),
	);
	const stickySlides = useMemo(
		() =>
			Array.from(stickySlideEls).map(
				(slide, i) =>
					({
						slide,
						index: i,
						tl: null,
						observer: null,
					}) as {
						slide: HTMLElement;
						index: number;
						tl: GSAPTimeline | null;
						observer: IntersectionObserver | null;
					},
			),
		[stickySlideEls],
	) satisfies {
		slide: HTMLElement;
		index: number;
		tl: GSAPTimeline | null;
		observer: IntersectionObserver | null;
	}[];
	useEffect(() => {
		stickySlides.forEach((r) => {
			slideMap.current.set(r.slide, r);
		});
		return () => {
			stickySlides.forEach((r) => {
				slideMap.current.delete(r.slide);
			});
		};
	}, [stickySlides]);
	useEffect(() => {
		stickySlides.forEach((slideEl, i) => {
			const listener = (entries: IntersectionObserverEntry[]) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						gsap.to(slideEl.slide, {
							ease: "none",
							scrollTrigger: {
								scroller: document.documentElement,
								trigger: slideEl.slide,
								start: "top bottom",
								end: "bottom top",
								scrub: 0.01,
								onUpdate: (o) => {
									const {scroll, progress} = o;
									const mesh = meshRef.current;
									if (!mesh) return;
									slideEl.slide.style.setProperty("--p1", progress.toString());
									slideEl.slide.style.setProperty(
										"--p2",
										(1 - progress).toString(),
									);
									const n = Math.min(progress * 2, 1);
									const tg = entry.target as HTMLElement;
									const s = slideMap.current.get(tg);
									if (!s) return;
									switch (s.index) {
										case 0:
											mesh.material.uniforms.slidePower1!.value = n;
											break;
										case 1:
											mesh.material.uniforms.slidePower2!.value = n;
											break;
										case 2:
											mesh.material.uniforms.slidePower3!.value = n;
											break;
										case 3:
											mesh.material.uniforms.slidePower4!.value = n;
											break;
									}
								},
							},
						});
					}
				});
			};
			const observer = new IntersectionObserver(listener, {threshold: 0});

			slideEl.observer = observer;
			slideEl.observer.observe(slideEl.slide);
		});
		return () => {
			stickySlides.forEach((slideEl) => {
				slideEl.observer && slideEl.observer.disconnect();
			});
			ScrollTrigger.killAll();
		};
	}, [stickySlides]);
	const lenis = useLenis();
	const handleScroll = useCallback(
		({scroll}: Lenis) => {
			if (!meshRef.current?.material?.uniforms) return;
			const mesh = meshRef.current;

			const translateY = scroll * 0.1;

			mesh.position.y =
				vpH / 2 -
				((window.innerHeight * 1.5) / window.innerWidth) * vpW +
				translateY;
		},
		[vpW, vpH],
	);
	useEffect(() => {
		if (!lenis) return;

		lenis.on("scroll", handleScroll);
		return () => lenis.off("scroll", handleScroll);
	}, [lenis, handleScroll]);
	// Helpers
	useFrame((state) => {
		if (!meshRef.current?.material?.uniforms) return;

		const mesh = meshRef.current;

		mesh.material.uniforms.fadeDensity!.value = fadeDensity;
		mesh.material.uniforms.fadePower!.value = fadePower;
		mesh.material.uniforms.borderWidth!.value = borderWidth;
		if (shouldResize.current) {
			mesh.scale.set(scaleX.current, scaleY.current, 1);
			mesh.material.uniforms.resolution!.value.set(300, 400);
			mesh.material.uniforms.i_resolution!.value.set(300, 400);
			mesh.material.uniforms!.borderRadius!.value =
				(borderRadius - 2) /
				(window.innerWidth * (scaleX.current / state.viewport.width));

			mesh.position.set(
				-state.viewport.width / 2 +
				leftOffset.current * 0.1 +
				scaleX.current / 2,
				state.viewport.height / 2 - window.innerHeight * 1.5 * 0.1,
				0,
			);
			shouldResize.current = false;
		}
	});
	return (
		<>
			<OrthographicCamera position={[0, 0, 1]} />
			<mesh ref={meshRef} material={stickyMaterial} visible={visible}>
				<planeGeometry args={[1, 1, 1, 1]} />
			</mesh>
		</>
	);
};
/**
 *
 *   const getPxScaleThree = (element: number, trigger: number) =>
 *     element / (trigger * 0.1);
 *
 *   const getPxThree = useCallback((element: number) => element * 0.1, []);
 */
