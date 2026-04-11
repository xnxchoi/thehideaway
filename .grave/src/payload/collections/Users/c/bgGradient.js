import * as THREE from "three";
import baseVertexShader from "./baseVertex.glsl";
import bgGradientFragShader from "./bgGradientFrag.glsl";

const WW = window.innerWidth,
	WH = window.innerHeight;

export class BGGradient {
}

export class BGGradientFront {
	constructor(e) {
		this.WEBGL = e.WEBGL;
		this.COLOR = e.COLOR;
		(this.visible = !1),
			(this.props = e),
			(this.translate = {
				x: 0,
				y: 0,
			}),
			(this.global = e.scene),
		this.global && this.onInit();
	}
	
	getPxThree(e) {
		return (e / window.innerWidth) * this.WEBGL.width;
	}
	
	getPxScaleThree(e, t) {
		const n = t / this.WEBGL.width,
			r = window.innerWidth * n;
		return e / r;
	}
	
	onInit() {
		(this.speed = 0.01),
		IS_MOBILE_MODE && (this.speed = 0.015),
			(this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1)),
			(this.material = new THREE.ShaderMaterial({
				vertexShader: baseVertexShader,
				fragmentShader: bgGradientFragShader,
				uniforms: {
					u_opacity: {
						value: 0,
					},
					u_borderRadius: {
						value: 0,
					},
					u_resolution: {
						value: {
							x: 0,
							y: 0,
						},
					},
					u_time: {
						value: 0,
					},
					u_move: {
						value: this.props.u_move,
					},
					u_mouse: {
						value: {
							x: 0,
							y: 0,
						},
					},
					u_noisePower: {
						value: this.props.u_noisePower,
					},
					u_noiseSpeed: {
						value: this.props.u_noiseSpeed,
					},
					u_noiseDensity: {
						value: this.props.u_noiseDensity,
					},
					u_pivot: {
						value: this.props.u_pivot,
					},
					u_radius: {
						value: this.props.u_radius,
					},
					u_color1: {
						value: this.props.u_gradient1st.three,
					},
					u_color2: {
						value: this.props.u_gradient2nd.three,
					},
					u_color3: {
						value: this.props.u_gradient3rd.three,
					},
					u_color4: {
						value: this.COLOR.table.white.three,
					},
					u_gradient1st: {
						value: this.props.u_gradient1st.power,
					},
					u_gradient2nd: {
						value: this.props.u_gradient2nd.power,
					},
					u_gradient3rd: {
						value: this.props.u_gradient3rd.power,
					},
				},
				transparent: !1,
			})),
			(this.material.alphaTest = 0.5),
			(this.mesh = new THREE.Mesh(this.geometry, this.material)),
			(this.mesh.position.z = 0),
			this.global.add(this.mesh);
	}
	
	onResize(
		e = {
			width: 0,
			height: 0,
			top: 0,
			left: 0,
		},
	) {
		e &&
		((this.width = e.width),
			(this.height = e.height),
			(this.top = e.top),
			(this.left = e.left),
			(this.mesh.scale.x = this.getPxThree(this.width)),
			(this.mesh.scale.y = this.getPxThree(this.height)),
			(this.mesh.material.uniforms.u_resolution.value.x = this.mesh.scale.x),
			(this.mesh.material.uniforms.u_resolution.value.y = this.mesh.scale.y),
			(this.mesh.material.uniforms.u_borderRadius.value = this.getPxScaleThree(
				this.props.borderRadius - 2,
				this.mesh.scale.x,
			)),
			(this.mesh.position.x =
				-this.WEBGL.width / 2 +
				this.getPxThree(this.left) +
				this.mesh.scale.x / 2 +
				this.translate.x),
			(this.mesh.position.y =
				this.WEBGL.height / 2 -
				this.getPxThree(this.top) -
				this.mesh.scale.y / 2 +
				this.translate.y));
	}
	
	onScroll(e = 0, t = 0) {
		this.mesh &&
		((this.translate.y = this.getPxThree(e)),
			(this.mesh.position.y =
				this.WEBGL.height / 2 -
				this.getPxThree(this.top) -
				this.mesh.scale.y / 2 +
				this.translate.y));
	}
	
	onRender() {
		if (this.mesh) {
			this.mesh.visible = this.visible;
			const e = MOUSE.body.array[0].delta.x / WW,
				t = 1 - MOUSE.body.array[0].delta.y / WH;
			(this.mesh.material.uniforms.u_time.value += this.speed),
				(this.mesh.material.uniforms.u_mouse.value.x = e * 2 - 1),
				(this.mesh.material.uniforms.u_mouse.value.y = t * 2 - 1),
				(this.mesh.material.uniforms.u_noisePower.value = this.props.noisePower),
				(this.mesh.material.uniforms.u_noiseSpeed.value = this.props.noiseSpeed),
				(this.mesh.material.uniforms.u_noiseDensity.value =
					this.props.noiseDensity),
				(this.mesh.position.x =
					-this.WEBGL.width / 2 +
					this.getPxThree(this.left) +
					this.mesh.scale.x / 2 +
					this.translate.x);
		}
	}
	
	onDestroy() {
		this.mesh &&
		((this.translate.x = 0),
			(this.translate.y = 0),
			(this.mesh.visible = !1));
	}
}
