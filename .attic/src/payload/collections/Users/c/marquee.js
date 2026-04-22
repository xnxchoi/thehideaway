import * as THREE from "three";
import baseVertexShader from "./baseVertex.glsl";
import marqueeFragmentShader from "./marqueeFrag.glsl";

export class MarqueeShader {
	constructor(e) {
		this.COLOR = e.COLOR;
		this.visible = !1;
		this.WEBGL = e.WEBGL;
		this.ready = !1;
		(this.props = e),
			(this.global = e.scene),
			(this.translate = {
				x: 0,
				y: 0,
			}),
			(this.speed = e.speed || 0.5),
			(this.scale = e.scale || 0.31),
			(this.time = Math.random()),
		this.global && (this.onInitMesh(), (this.ready = !0));
	}
	
	getPxThree(e) {
		return (e / window.innerWidth) * this.WEBGL.width;
	}
	
	getPxScaleThree(e, t) {
		const n = t / this.WEBGL.width,
			r = window.innerWidth * n;
		return e / r;
	}
	
	onInitMesh() {
		(this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1)),
			(this.material = new THREE.ShaderMaterial({
				vertexShader: baseVertexShader,
				fragmentShader: marqueeFragmentShader,
				transparent: !0,
				uniforms: {
					cBlack: {
						value: this.COLOR.table.black.three,
					},
					opacity: {
						value: 1,
					},
					time: {
						value: 0,
					},
					resolution: {
						value: {
							x: 0,
							y: 0,
						},
					},
					i_resolution: {
						value: {
							x: 14400,
							y: 100,
						},
					},
					i_repeat: {
						value: {
							x: 1,
							y: 1,
						},
					},
					borderRadius: {
						value: 0.25,
					},
					tDiffuse: {
						value: null,
					},
				},
			})),
			(this.mesh = new THREE.Mesh(this.geometry, this.material)),
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
			(this.left = e.left)),
		this.mesh &&
		((this.mesh.scale.x = this.getPxThree(this.width)),
			(this.mesh.scale.y = this.getPxThree(this.height)),
			(this.mesh.position.x =
				-WEBGL.width / 2 +
				this.getPxThree(this.left) +
				this.mesh.scale.x / 2),
			(this.mesh.position.y =
				WEBGL.height / 2 - this.getPxThree(this.top) - this.mesh.scale.y / 2),
			(this.mesh.position.z = 1),
			(this.mesh.material.uniforms.resolution.value.x = this.mesh.scale.x),
			(this.mesh.material.uniforms.resolution.value.y = this.mesh.scale.y),
			(this.mesh.material.uniforms.borderRadius.value = this.getPxScaleThree(
				this.props.borderRadius - 2,
				this.mesh.scale.x,
			)),
			(this.mesh.material.uniforms.i_repeat.value.x =
				(1 /
					(this.width / this.mesh.material.uniforms.i_resolution.value.x)) *
				this.scale *
				WR),
			(this.mesh.material.uniforms.i_repeat.value.y =
				(1 /
					(this.height / this.mesh.material.uniforms.i_resolution.value.y)) *
				this.scale *
				WR));
	}
	
	onUpdateTexture(e, t, n) {
		(this.mesh.material.uniforms.tDiffuse.value = e),
			(this.mesh.material.uniforms.i_resolution.value.x = t),
			(this.mesh.material.uniforms.i_resolution.value.y = n);
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
		this.mesh &&
		((this.mesh.material.uniforms.time.value >= 1 &&
		(this.mesh.material.uniforms.time.value = 0),
			(this.time += 1e-4 * this.speed)),
			(this.mesh.material.uniforms.time.value = this.time),
			(this.mesh.visible = this.visible),
			(this.mesh.position.x =
				-this.WEBGL.width / 2 +
				this.getPxThree(this.left) +
				this.mesh.scale.x / 2 +
				this.translate.x));
	}
	
	onDestroy() {
		this.mesh &&
		((this.translate.x = 0),
			(this.translate.y = 0),
			(this.mesh.visible = !1));
	}
}
