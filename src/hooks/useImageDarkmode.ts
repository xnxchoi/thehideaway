"use client"
import {calculateBrightness} from "@/utilities/calculateImageBrightness"
import {useWindowSize} from "hamo"
import {RefObject, useCallback, useEffect, useRef, useState} from "react";
import imageCompression from "browser-image-compression";
import {StaticImageData} from "next/image";

type ImageEditorState = {
	file: File | null;
	src: string | null;
	objectPosition: string;
	canvasRef: RefObject<HTMLCanvasElement>
	contextRef: RefObject<CanvasRenderingContext2D>
	imgRef: RefObject<HTMLImageElement>
	targetWidth: number;
	targetHeight: number;
	naturalWidth: number;
	naturalHeight: number;
	aspectRatio: number;
}
type ImageEditorDispatch = {
	setFile: (file: File | null) => void;
	setSrc: (src: string | null) => void;
	setObjectPosition: (objectPosition: string) => void;
	setImageSize: (props: { width: number; height: number }) => void;
	setTargetWidth: (width: number) => void;
	setTargetHeight: (height: number) => void;
	setAspectRatio: (aspectRatio: number) => void;

}
const useImageEditor = ({src, objectPosition}: { src: string; objectPosition: string }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null!)
	const contextRef = useRef<CanvasRenderingContext2D>(null!)
	const canvasSize = useRef<{ width: number; height: number; }>({width: 0, height: 0,});
	const imgRef = useRef<HTMLImageElement>(null!)
	const [aspectRatio, setAspectRatio] = useState(4 / 3)
	const [targetWidth, setTargetWidth] = useState(300)
	const [targetHeight, setTargetHeight] = useState(225)
	const hasInitializedRef = useRef(false)
	const clearCanvas = () => {
		contextRef.current.clearRect(
			0,
			0,
			canvasRef.current.width,
			canvasRef.current.height
		);
	};
	const loadImage = useCallback(
		(src: string) =>
			new Promise((resolve: (value: HTMLImageElement) => void) => {
				const shadowImage = new Image();
				shadowImage.crossOrigin = "Anonymous";

				shadowImage.onload = () => {

					resolve(shadowImage);
				};

				shadowImage.src = src;
			}),
		[]
	);
	const drawImage = useCallback(
		async (src: string, options?: {
			objectPosition?: string; callback?: (args?: {
				naturalWidth?: number;
				naturalHeight?: number;
			}) => void | Promise<void>;
		}) => {
			const shadowImage = imgRef.current;
			const cb = options?.callback;
			const naturalWidth = shadowImage.naturalWidth;
			const naturalHeight = shadowImage.naturalHeight;
			canvasRef.current.width = naturalWidth;
			canvasRef.current.height = naturalHeight;
			canvasSize.current = {width: naturalWidth, height: naturalHeight}
			const source = {
				left: 0,
				top: 0,
				width: naturalWidth,
				height: naturalHeight
			};

			contextRef.current.drawImage(
				shadowImage,
				source.left,
				source.top,
				source.width,
				source.height,
			);

			cb?.({
				naturalWidth,
				naturalHeight,
			});
		},
		[loadImage]
	);

	const resizeImage = useCallback(
		(file: File, width: number, height: number): Promise<Blob> => {
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = (e) => {
					const img = document.createElement("img");
					img.onload = () => {
						const canvas = canvasRef.current!;
						const ctx = canvas.getContext("2d")!;

						const imageAspectRatio = img.naturalWidth / img.naturalHeight;
						const targetWidth = Math.min(width, img.naturalWidth);

						const targetHeight = targetWidth / imageAspectRatio;

						const drawWidth = targetWidth;
						const drawHeight = targetHeight;
						const offsetX = (targetWidth - drawWidth) / 2;
						const offsetY = 0;

						canvas.width = width;
						canvas.height = height;

						clearCanvas()
						ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

						canvas.toBlob(
							(blob) => {
								resolve(blob!);
							},
							"image/jpeg",
							0.9
						);
					};
					img.onerror = reject;
					img.src = e.target?.result as string;
				};
				reader.onerror = reject;
				reader.readAsDataURL(file);
			});
		},
		[]
	);
	const createCanvas = () => {
		canvasRef.current = document.createElement("canvas");
		const ctx = canvasRef.current.getContext("2d");
		if (!ctx) return;
		contextRef.current = ctx;
		// document.body.appendChild(canvas.current);
	};
	const processImage = useCallback(
		async (file: File) => {
			const options = {
				maxSizeMB: 2,
				maxWidthOrHeight: 300,
				alwaysKeepResolution: true,
				useWebWorker: true,
			};
			const compressedFile = await imageCompression(file, options);
		}, [])
	useEffect(() => {
		if (!hasInitializedRef.current) {
			hasInitializedRef.current = true;
			createCanvas()
		}
		loadImage(src).then(img => {
			imgRef.current = img
		})

	}, [src, objectPosition, drawImage,]);
}

const useImageDarkmode = ({src, objectPosition}: {
	src: string | StaticImageData;
	objectPosition: string
}) => {
	const initial = useRef(true);
	const canvas = useRef<HTMLCanvasElement>(null!);
	const context = useRef<CanvasRenderingContext2D>(null!);
	const canvasSize = useRef<{ width: number; height: number; }>({width: 0, height: 0,});

	const {width: windowWidth, height: windowHeight} = useWindowSize(50);
	const [darkmode, setDarkmode] = useState(false)
	const clearCanvas = () => {
		context.current.clearRect(
			0,
			0,
			canvas.current.width,
			canvas.current.height
		);
	};

	const getIsDarkmode = useCallback(
		() =>
			new Promise((resolve: (value: boolean) => void) => {

				const {data} = context.current.getImageData(
					0,
					0,
					canvasSize.current.width,
					canvasSize.current.height
				);

				const pixels = canvasSize.current.width * canvasSize.current.height;

				calculateBrightness({data, pixels}, (mean) =>
					resolve(mean <= 255 / 2)
				);
			}),
		[]
	);
	const setIsDarkmode = useCallback(async () => {
		const isDarkmode = await getIsDarkmode();
		setDarkmode(isDarkmode);

		clearCanvas();
	}, [getIsDarkmode]);
	const loadImage = useCallback(
		(src: string) =>
			new Promise((resolve: (value: HTMLImageElement) => void) => {
				const shadowImage = new Image();
				shadowImage.crossOrigin = "Anonymous";

				shadowImage.onload = () => {
					resolve(shadowImage);
				};

				shadowImage.src = src;
			}),
		[]
	);

	const drawImage = useCallback(
		async (src: string | StaticImageData, objectPosition: string, cb: () => void) => {
			const shadowImage = await loadImage(typeof src === "string" ? src : src.src);

			const naturalWidth = shadowImage.naturalWidth;
			const naturalHeight = shadowImage.naturalHeight;
			canvas.current.width = naturalWidth;
			canvas.current.height = naturalHeight;
			canvasSize.current = {width: naturalWidth, height: naturalHeight}
			const source = {
				left: 0,
				top: 0,
				width: naturalWidth,
				height: naturalHeight
			};

			context.current.drawImage(
				shadowImage,
				source.left,
				source.top,
				source.width,
				source.height,
			);

			cb();
		},
		[loadImage]
	);

	const createCanvas = () => {
		canvas.current = document.createElement("canvas");
		const ctx = canvas.current.getContext("2d");
		if (!ctx) return;
		context.current = ctx;
		// document.body.appendChild(canvas.current);
	};

	/* init */

	useEffect(() => {
		if (initial.current) {
			initial.current = false;
			createCanvas();
		}

		drawImage(src, objectPosition, setIsDarkmode);
	}, [windowWidth, windowHeight, src, objectPosition, drawImage, setIsDarkmode]);

	return darkmode;
};

export default useImageDarkmode;
