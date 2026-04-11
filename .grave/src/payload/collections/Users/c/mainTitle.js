import fvTitleFragShader from "./fvTitleMainFrag.glsl";
import baseVertexShader from "./baseVertex.glsl";
import * as THREE from "three";

export class FVMainTitle {
	constructor(e) {
		(this.WEBGL = e.WEBGL),
			(this.COLOR = e.COLOR),
			(this.ready = !1),
			(this.props = e),
			(this.global = e.scene),
			(this.visible = !0),
			(this.scale = {
				f1: 0,
				x: 1,
				y: 1,
			}),
			(this.translate = {
				x: 0,
				y: 0,
			}),
		this.global && (this.onInitMesh(), this.onResize(!1));
	}
	
	getPxThree(e) {
		return (e / window.innerWidth) * this.WEBGL.width;
	}
	
	onInitMesh() {
		const e = new THREE.PlaneGeometry(1, 1, 1, 1),
			t = new THREE.ShaderMaterial({
				vertexShader: baseVertexShader,
				fragmentShader: fvTitleFragShader,
				transparent: !0,
				uniforms: {
					inkbleed: {
						value: 1,
					},
					opacity: {
						value: 1,
					},
					cBlack: {
						value: this.COLOR.black,
					},
					edgeSharp: {
						value: 0.2,
					},
					tNormal: {
						value: null,
					},
					tShadow: {
						value: null,
					},
				},
			});
		(this.mesh = new THREE.Mesh(e, t)), this.global.add(this.mesh);
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
			(this.mesh.scale.x = this.getPxThree(this.width) * this.scale.x),
			(this.mesh.scale.y = this.getPxThree(this.height) * this.scale.y),
			(this.mesh.position.x =
				-this.WEBGL.width / 2 +
				this.getPxThree(this.left) +
				this.getPxThree(this.width) / 2 +
				this.translate.x),
			(this.mesh.position.y =
				this.WEBGL.height / 2 -
				this.getPxThree(this.top) -
				this.getPxThree(this.height) / 2 +
				this.translate.y),
			(this.mesh.position.z = 3));
	}
	
	onUpdateTexture(e, t) {
		(this.mesh.material.uniforms.tNormal.value = e),
			(this.mesh.material.uniforms.tShadow.value = t);
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
	
	onStickyScroll(e = 0, t = 0, n = 0) {
		if (this.mesh) {
			this.scale.f1 = n;
			const r =
				this.WEBGL.height / 2 -
				this.getPxThree(this.top) -
				this.mesh.scale.y / 2;
			(this.translate.y = t), (this.mesh.position.y = r + this.translate.y);
		}
	}
	
	onRender() {
		this.mesh &&
		((this.mesh.visible = this.visible),
			(this.scale.x = 1 - this.scale.f1 * 0.2),
			(this.scale.y = 1 - this.scale.f1 * 0.2),
			(this.mesh.scale.x = this.getPxThree(this.width) * this.scale.x),
			(this.mesh.scale.y = this.getPxThree(this.height) * this.scale.y),
			(this.mesh.position.x =
				-this.WEBGL.width / 2 +
				this.getPxThree(this.left) +
				this.getPxThree(this.width) / 2 +
				this.translate.x));
	}
	
	onDestroy() {
		this.mesh && (this.mesh.visible = !1);
	}
}
