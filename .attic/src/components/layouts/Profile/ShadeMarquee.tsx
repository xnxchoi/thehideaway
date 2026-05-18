import type {MarqueeState} from "@/components/layouts/Profile/types";
import {
	CanvasTexture,
	Color,
	Mesh,
	PlaneGeometry,
	RepeatWrapping,
	Scene,
	ShaderMaterial,
	Vector2,
} from "three";
import baseVertexShader from "@/components/layouts/Profile/shaders/baseVertex.glsl";
import marqueeFragmentShader from "@/components/layouts/Profile/shaders/marqueeFrag.glsl";
import {GeistMono} from "geist/font/mono";
import {useRef} from "react";

export const ShadeMarquee = ({fg}: { fg: Color }) => {
	const MQee = useRef<MarqueeState>({
		ready: false,
		canvas: null!,
		texture: null!,
		text: {
			content:
				"BRIDGING THE GAP BETWEEN THE PUBLIC AND THE INTIMATE - THE HIDEAWAY, A RESTORED PROJECT - SEOUL, BOSTON, PARIS, LONDON & LA",
			width: 500,
			height: 15,
		},
		color: fg,
		ctx: null!,
		global: null!,
		visible: false,
		translate: new Vector2(0, 0),
		props: {
			borderRadius: 0.2,
		},
		speed: 0.85,
		scale: 0.313,
		time: Math.random(),
		geometry: null!,
		material: null!,
		mesh: null!,

		top: 0,
		left: 0,
		width: 0,
		height: 0,
	});

	const initMarquee = ({scene}: { scene: Scene }) => {
		while (!MQee.current.ctx) {
			console.log("while...");
			const canvas = document.createElement("canvas");
			const context = canvas.getContext("2d");
			MQee.current.canvas = canvas;
			MQee.current.ctx = context!;
		}
		MQee.current.global = scene;
	};
	const onInitMesh = () => {
		MQee.current.geometry = new PlaneGeometry(1, 1, 1, 1);
		((MQee.current.material = new ShaderMaterial({
			vertexShader: baseVertexShader,
			fragmentShader: marqueeFragmentShader,
			transparent: true,
			uniforms: {
				cBlack: {
					value: colors.black,
				},
				opacity: {
					value: 1,
				},
				time: {
					value: 0,
				},
				resolution: {
					value: {
						x: 1,
						y: 1,
					},
				},
				i_resolution: {
					value: {
						x: 1400,
						y: 100,
					},
				},
				i_repeat: {
					value: {
						x: 1,
						y: 14,
					},
				},
				textureAspect: {value: 1.0},
				planeAspect: {value: 1.0},
				borderRadius: {
					value: 0.25,
				},
				tDiffuse: {
					value: null!,
				},
			},
		}) as MarqueeState["material"]),
			(MQee.current.mesh = new Mesh(
				MQee.current.geometry,
				MQee.current.material,
			)),
			MQee.current.global.add(MQee.current.mesh));
		const height = 15;
		const context = MQee.current.ctx;
		context.font = `${2 * height}px ${GeistMono.style.fontFamily}`;
		context.letterSpacing = "-0.02em";
		// Calculate width based on measured text
		const textMetrics = context.measureText(MQee.current.text.content);
		const width = Math.ceil(textMetrics.width);
		MQee.current.text.width = width;
		MQee.current.canvas.height = 2 * height;
		MQee.current.canvas.width = width;

		context.font = `${2 * MQee.current.text.height}px ${GeistMono.style.fontFamily}`;

		context.textBaseline = "middle";
		context.textAlign = "left";

		// Clear and set background transparent
		context.clearRect(
			0,
			0,
			MQee.current.text.width,
			2 * MQee.current.text.height,
		);

		// Render text
		context.fillStyle = "currentColor";
		context.fillText(
			MQee.current.text.content,
			0,
			(2 * MQee.current.text.height) / 2,
		);
		const texture = new CanvasTexture(MQee.current.canvas);
		texture.wrapS = RepeatWrapping;
		texture.wrapT = RepeatWrapping;
		MQee.current.texture = texture;
	};
	const renderText = () => {
		MQee.current.ctx.clearRect(
			0,
			0,
			MQee.current.text.width,
			2 * MQee.current.text.height,
		);
		MQee.current.ctx.fillStyle = `rgb(${fg.r}*255, ${fg.g}*255, ${fg.b}*255)`;
		MQee.current.ctx.fillText(
			MQee.current.text.content,
			0,
			MQee.current.text.height,
		);
		MQee.current.texture.needsUpdate = true;
	};
	const onResize = () => {
		const trigger = fvMain;
		if (trigger) {
			const element = trigger.getBoundingClientRect();
			(element &&
			((MQee.current.width = element.width),
				(MQee.current.height = element.height),
				(MQee.current.top = element.top),
				(MQee.current.left = element.left)),
			MQee.current.mesh &&
			((MQee.current.mesh.scale.x = getPxThree(MQee.current.width)),
				(MQee.current.mesh.scale.y = getPxThree(MQee.current.height)),
				(MQee.current.mesh.position.x =
					-WEBGL.width / 2 +
					getPxThree(MQee.current.left) +
					MQee.current.mesh.scale.x / 2),
				(MQee.current.mesh.position.y =
					WEBGL.height / 2 -
					getPxThree(MQee.current.top) -
					MQee.current.mesh.scale.y / 2),
				(MQee.current.mesh.position.z = 1),
				(MQee.current.mesh.material.uniforms.resolution.value.x =
					MQee.current.mesh.scale.x),
				(MQee.current.mesh.material.uniforms.resolution.value.y =
					MQee.current.mesh.scale.y),
				(MQee.current.mesh.material.uniforms.borderRadius.value =
					getPxScaleThree(
						MQee.current.props.borderRadius - 2,
						MQee.current.mesh.scale.x,
					)),
				(MQee.current.mesh.material.uniforms.i_repeat.value.x =
					(MQee.current.mesh.material.uniforms.i_resolution.value.x /
						MQee.current.width) *
					WR),
				(MQee.current.mesh.material.uniforms.i_repeat.value.y =
					(MQee.current.mesh.material.uniforms.i_resolution.value.y /
						MQee.current.height) *
					WR)));
		}
	};
	const onLoadTexture = () => {
		const texture = MQee.current.texture;
		onUpdateTexture(
			texture,
			MQee.current.text.width,
			MQee.current.text.height * 2,
		);
	};
	const onUpdateTexture = (texture, xValue, yValue) => {
		MQee.current.mesh.material.uniforms.tDiffuse.value = texture;
		MQee.current.mesh.material.uniforms.i_resolution.value.x = xValue / 2;
		MQee.current.mesh.material.uniforms.i_resolution.value.y = yValue / 2;
		MQee.current.mesh.material.uniforms.textureAspect.value = xValue / yValue;
	};
	const onScroll = (a = 0, _b = 0) => {
		MQee.current.mesh &&
		((MQee.current.translate.y = getPxThree(a)),
			(MQee.current.mesh.position.y =
				WEBGL.height / 2 -
				getPxThree(MQee.current.top) -
				MQee.current.mesh.scale.y / 2 +
				MQee.current.translate.y));
	};
	const onRender = () => {
		MQee.current.mesh &&
		((MQee.current.mesh.material.uniforms.time.value >= 1 &&
		(MQee.current.mesh.material.uniforms.time.value = 0),
			(MQee.current.time += 1e-4 * MQee.current.speed)),
			(MQee.current.mesh.material.uniforms.time.value =
				MQee.current.time + 0.05),
			(MQee.current.mesh.visible = MQee.current.visible),
			(MQee.current.mesh.position.x =
				-WEBGL.width / 2 +
				getPxThree(MQee.current.left) +
				MQee.current.mesh.scale.x / 2 +
				MQee.current.translate.x));
		renderText();
	};
	const onDestroy = () => {
		MQee.current.mesh &&
		((MQee.current.translate.x = 0),
			(MQee.current.translate.y = 0),
			(MQee.current.mesh.visible = !1));
	};
};
