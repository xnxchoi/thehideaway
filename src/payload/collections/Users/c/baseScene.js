import * as THREE from "three";
import {webGLScreen} from "@/payload/collections/Members/c/webGLScreen.js";

var baseVertexShader = `varying vec2 vUv;
void main(){
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}`,
	baseFragShader = `varying vec2 vUv;

uniform sampler2D tMouse;
uniform sampler2D tFront;
uniform sampler2D tBack;
uniform vec3 cBlack;
uniform vec3 cBg;

uniform vec2 resolution;
uniform vec2 i_resolution;

const float PI = 3.1415926;
uniform float time;

uniform float wakuNaiVisible;
uniform float wakuSenOpacity;

vec3 LinearTosRGB(vec3 linear) { return pow(linear, vec3(1.0 / 2.2)); }

void main() {

	
	vec2 vUvA = vec2( vUv.x, vUv.y * resolution.y / resolution.x );

	
	vec3 tBg = LinearTosRGB( cBg );
	vec3 tBlack = LinearTosRGB( cBlack );

	
	vec4 iMouse = texture( tMouse, vUv );
	vec4 iFront = texture( tFront, vUv );
	

	
	
	
	

	
	vec4 iBack  = texture( tBack, vUv );

	
	vec3 col = vec3(1.0);
	float alpha = iBack.a * iFront.a;

	alpha = iMouse.r > 0.99
	    ? mix(iFront.a, iBack.a, wakuNaiVisible)
	    : iMouse.r > 0.1
	        ? ((iFront.r + iFront.g + iFront.b) * iFront.a + (iBack.r + iBack.g + iBack.b) * iBack.a) / 6.0 != 0.0
	            ? wakuSenOpacity
	            : 0.0
	        : iFront.a;

	col = iMouse.r > 0.99
	    ? mix(iFront.rgb, iBack.rgb, wakuNaiVisible)
	    : iMouse.r > 0.1
	        ? tBlack * 0.9
	        : iFront.rgb;

	
	

	
	
	
	
	

	

	
	
	
	
	

	

	
	
	
	
	

	

	
	gl_FragColor = vec4( col, alpha );
	
	
	

}`;
const RESCALE = 0.1;
export const baseScene = (el) => {
	const COLOR = {
		black: new THREE.Color("#1f1f1f"),
		gray: new THREE.Color("#ececec"),
		white: new THREE.Color("#ffffff"),
	};
	const children = {
		SCREEN: null,
		DOM: null,
		ABOUT: null,
	};
	const canvas = el;
	const p_camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
	const renderer = new THREE.WebGLRenderer({
		alpha: true,
		antialias: true,
		canvas: canvas,
	});
	const params = {
		edgePower: 20,
		noiseSpeed: 0.5,
		noiseDensity: 5,
		waveSpeed: 0.5,
		waveDisp: {
			x: 5,
			y: 5,
		},
		wavePower: 0.1,
		mouse: {
			size: 0.9,
			age: 0.2,
		},
		trail: {
			power: 0.5,
		},
	};
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.shadowMap.enabled = !1;
	const scene = new THREE.Scene();
	
	let height = window.innerHeight,
		width = window.innerWidth;
	let aspect = width / height;
	const o_camera = new THREE.OrthographicCamera(
		(-height * aspect) / 2,
		(height * aspect) / 2,
		height / 2,
		-height / 2,
		-height / 2,
		height / 2,
	);
	const fov = 15;
	const padding = {
		x: 0,
		y: 0,
	};
	const final = new THREE.Mesh();
	let far = -(height / 2) / Math.tan((fov * Math.PI) / 180 / 2);
	const onInit = () => {
		const i = new THREE.PlaneGeometry(1, 1, 1, 1),
			e = new THREE.ShaderMaterial({
				vertexShader: baseVertexShader,
				fragmentShader: `const int MAX_TRAIL_SIZE = ${24};
			${baseFragShader}`,
				uniforms: {
					resolution: {
						value: {
							x: 0,
							y: 0,
						},
					},
					i_resolution: {
						value: {
							x: 0,
							y: 0,
						},
					},
					cBlack: {
						value: COLOR.black,
					},
					cBg: {
						value: COLOR.gray,
					},
					time: {
						value: 0,
					},
					tMouse: {
						value: null,
					},
					tFront: {
						value: null,
					},
					tBack: {
						value: null,
					},
					wakuNaiVisible: {
						value: 1,
					},
					wakuSenOpacity: {
						value: 1,
					},
				},
				transparent: !0,
			});
		e.alphaTest = 0.5;
		final.geometry = i;
		final.material = e;
		scene.add(final);
		children.SCREEN = webGLScreen({
			COLOR,
			WEBGL: {
				renderer,
				final,
				scene,
				o_camera,
				width,
				height,
			},
		});
		
		children.SCREEN.once();
	};
	const onResize = () => {
		(width = window.innerWidth * RESCALE),
			(height = window.innerHeight * RESCALE),
			(aspect = width / height),
			(padding.x = getPxThree(20)),
			(padding.y = getPxThree(15)),
		final &&
		((final.scale.x = width),
			(final.scale.y = height),
			(final.material.uniforms.resolution.value.x = final.scale.x),
			(final.material.uniforms.resolution.value.y = final.scale.y),
			(final.material.uniforms.i_resolution.value.x = 1800),
			(final.material.uniforms.i_resolution.value.y = 1063)),
			renderer.setSize(window.innerWidth, window.innerHeight);
		p_camera &&
		((far = -(height / 2) / Math.tan((fov * Math.PI) / 180 / 2)),
			(p_camera.aspect = width / height),
			(p_camera.position.z = -far),
			p_camera.updateProjectionMatrix()),
		o_camera &&
		((o_camera.left = -width / 2),
			(o_camera.right = width / 2),
			(o_camera.top = height / 2),
			(o_camera.bottom = -height / 2),
			(o_camera.near = -height / 2),
			(o_camera.far = height / 2),
			o_camera.updateProjectionMatrix());
	};
	const onUpdate = () => {
		final.material &&
		// ((final.material.uniforms.wakuNaiVisible.value =
		// 	PAGE_TRANSITION.page.single.ptFade +
		// 	PAGE_TRANSITION.page.works.ptFade +
		// 	PAGE_TRANSITION.page.info.ptFade),
		// 	(final.material.uniforms.wakuSenOpacity.value =
		// 		PAGE_TRANSITION.page["error-500"].ptFadeMouse +
		// 		PAGE_TRANSITION.page["error-404"].ptFadeMouse +
		// 		PAGE_TRANSITION.page.info.ptFadeMouse +
		// 		PAGE_TRANSITION.page.works.ptFadeMouse +
		// 		PAGE_TRANSITION.page.home.ptFadeMouse),
		(final.material.uniforms.time.value += 0.01);
	};
	const onRender = () => {
		children.SCREEN.onRender();
		renderer.setRenderTarget(null), renderer.render(scene, o_camera);
	};
	
	// WEBGL_SCREEN.onRender(),
	// WEBGL_DOM.onRender(),
	// WEBGL_WORKS.onRender(),
	// WEBGL_HOME.onRender(),
	// WEBGL_ABOUT.onRender(),
	// WEBGL_SINGLE.onRender(),
	// WEBGL_ARCHIVE.onRender(),
	// WEBGL_MOUSE.onRender(),
	// WEBGL_404.onRender(),
};
