import {useThree} from "@react-three/fiber"
import {useFBO, View} from "@react-three/drei"
import {useMemo, useRef, useEffect, useState} from "react"
import {useFrame} from "@react-three/fiber"
import {extend, shaderMaterial} from "@react-three/drei"
import {baseVertexShader, baseFragShader} from "./BaseScene"
import * as THREE from "three"
import {Color} from "three"
import {OrthographicCamera} from "@react-three/drei"

export const ScreenView = () => {
	const {width, height, gl, viewport, aspect} = useThree()
	const front = useMemo(() => {
		const scene = new THREE.Scene()
		const fbo = useFBO(width, height, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBFormat,
		})
		return {scene, fbo}
	}, [])
	const back = useMemo(() => {
		const scene = new THREE.Scene()
		const fbo = useFBO(width, height, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBFormat,
		})
		return {scene, fbo}
	}, [])
	const baseMaterial = shaderMaterial({
		vertexShader: baseVertexShader,
		fragmentShader: `const int MAX_TRAIL_SIZE =${24};` + baseFragShader,
		uniforms: {
			resolution: {x: width, y: height},
			i_resolution: {x: 1800, y: 1063},
			cBlack: new Color('#1f1f1f'),
			cBg: new Color('#ececec'),
			time: 0,
			tMouse: null,
			tFront: front.fbo.texture,
			tBack: back.fbo.texture,
			wakuNaiVisible: 1,
			wakuSenOpacity: 1,
		},
		transparent: true,
		alphaTest: 0.5,
	})
	const BaseM = extend(baseMaterial)
	const baseMaterialRef = useRef()
	useEffect(() => {
		gl.setSize(width, height)
	}, [width, height])
	useEffect(() => {
		
		gl.setPixelRatio(width / height)
	}, [width, height])
	useEffect(() => {
		gl.shadowMap.enabled = false
	}, [])
	
	useFrame((state) => {
		state.gl.setRenderTarget(front.fbo)
		state.gl.render(front.scene, state.camera)
		state.gl.setRenderTarget(back.fbo)
		state.gl.render(back.scene, state.camera)
		
	})
	return <>
		<OrthographicCamera makeDefault position={[0, 0, 1]} zoom={1} left={(-height * aspect) / 2}
		                    right={(height * aspect) / 2} top={height / 2} bottom={-height / 2} near={-height / 2}
		                    far={height / 2} />
		<mesh>
			<planeGeometry args={[1, 1]} />
			<BaseM ref={baseMaterialRef} />
		</mesh>
	</>
}