"use client";
import {RenderTexture, shaderMaterial} from "@react-three/drei";
import {useFrame, useThree} from "@react-three/fiber";
import {useRef} from "react";
import baseVertexShader from "@/payload/collections/Members/c/baseVertex.glsl";
import baseFragShader from "@/payload/collections/Members/c//baseFrag.glsl";
import * as THREE from "three";
import bgFragShader from "./bgFrag.glsl";

export const BaseScene = () => {
	const {width, height, gl, scale, viewport, aspect} = useThree();
	const color = new THREE.Color();
	// const bgMaterial = shaderMaterial(
	//   {
	//     opacity: 0.0,
	//     cGg: new THREE.Color("#ececec"),
	//   },
	//   baseVertexShader,
	//   bgFragShader,
	// );
	// const baseMaterial = shaderMaterial({
	//   vertexShader: baseVertexShader,
	//   fragmentShader: `const int MAX_TRAIL_SIZE =${24};` + baseFragShader,
	//   uniforms: {
	//     resolution: { x: 1000, y: 956 },
	//     i_resolution: { x: 1800, y: 1063 },
	//     cBlack: new THREE.Color("#1f1f1f"),
	//     cBg: new THREE.Color("#ececec"),
	//     time: 0,
	//     tMouse: null,
	//     tFront: null,
	//     tBack: null,
	//     wakuNaiVisible: 1,
	//     wakuSenOpacity: 1,
	//   },
	//   transparent: true,
	//   alphaTest: 0.5,
	// });
	//
	//
	const baseMRef = useRef();
	// const BGM = extend(bgMaterial);
	const flag = useRef(false);
	
	useFrame((state) => {
		const {width, height, viewport, gl} = state;
		if (!flag.current) {
			gl.setSize(width, height);
			gl.setPixelRatio(width / height);
			gl.shadowMap.enabled = false;
			
			flag.current = true;
		} else {
		}
	});
	return (
		<>
			<mesh>
				<planeGeometry args={[1, 1]} />
				<shaderMaterial vertexShader={baseVertexShader} fragmentShader={baseFragShader} uniforms={{
					resolution: {value: {x: 1000, y: 956}},
					i_resolution: {value: {x: 1800, y: 1063}},
					cBlack: {value: color.setHex(0x1f1f1f)},
					cBg: {value: color.setHex(0xececec)},
					time: {value: 0},
					tMouse: {value: null},
					tFront: {value: null},
					tBack: {value: null},
					wakuNaiVisible: {value: 1},
					wakuSenOpacity: {value: 1},
				}} alphaTest={0.5} transparent={true} ref={baseMRef}>
					<RenderTexture attach="uniforms-tFront" minFilter={THREE.LinearFilter}
					               magFilter={THREE.LinearFilter}>
						<planeGeometry args={[1, 1]} />
						<shaderMaterial uniforms={{
							opacity: {value: 0.0},
							cBg: {value: color.setHex(0xececec)},
						}} vertexShader={baseVertexShader} fragmentShader={bgFragShader} />
					</RenderTexture>
					<RenderTexture attach="uniforms-tBack" minFilter={THREE.LinearFilter}
					               magFilter={THREE.LinearFilter}>
						<planeGeometry args={[1, 1]} />
						<shaderMaterial uniforms={{
							opacity: {value: 1.0},
							cBg: {value: color.setHex(0xececec)},
						}} vertexShader={baseVertexShader} fragmentShader={bgFragShader} />
					</RenderTexture>
				</shaderMaterial>
			</mesh>
		</>
	);
};
