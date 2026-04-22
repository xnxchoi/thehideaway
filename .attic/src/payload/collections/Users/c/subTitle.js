import * as THREE from "three";
import baseVertexShader from "./baseVertex.glsl";
import fvSubtitleFragShader from "./fvSubtitleFrag.glsl";

export class FVSubTitleShader {
	constructor(e = {}) {
		this.WEBGL = e.WEBGL;
		this.COLOR = e.COLOR;
		(this.visible = !1),
			(this.ready = !1),
			(this.props = e),
			(this.el = e.el),
			(this.global = e.scene),
			(this.translate = {
				x: 0,
				y: 0,
			}),
		this.global && (this.onInitMesh(), this.onResize(!1), this.onScroll());
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
				fragmentShader: fvSubtitleFragShader,
				transparent: !0,
				uniforms: {
					opacity: {
						value: 1,
					},
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
					borderRadius: {
						value: 0,
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
			borderRadius: 10,
		},
	) {
		e &&
		((this.width = e.width),
			(this.height = e.height),
			(this.top = e.top),
			(this.left = e.left),
			(this.borderRadius = e.borderRadius),
			(this.mesh.scale.x = this.getPxThree(this.width)),
			(this.mesh.scale.y = this.getPxThree(this.height)),
			(this.mesh.material.uniforms.resolution.value.x = this.mesh.scale.x),
			(this.mesh.material.uniforms.resolution.value.y = this.mesh.scale.y),
			(this.mesh.material.uniforms.borderRadius.value = this.getPxScaleThree(
				this.borderRadius - 2,
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
	
	onStickyScroll(e = 0, t = 0) {
		if (this.mesh) {
			const n =
				this.WEBGL.height / 2 -
				this.getPxThree(this.top) -
				this.mesh.scale.y / 2;
			(this.translate.y = t), (this.mesh.position.y = n + this.translate.y);
		}
	}
	
	onRender() {
		this.mesh &&
		((this.mesh.visible = this.visible),
			(this.mesh.position.x =
				-this.WEBGL.width / 2 +
				this.getPxThree(this.left) +
				this.mesh.scale.x / 2 +
				this.translate.x));
	}
	
	onDestroy() {
		this.mesh && (this.mesh.visible = !1);
	}
}
