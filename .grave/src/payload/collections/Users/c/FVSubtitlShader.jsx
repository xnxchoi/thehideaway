import {PlaneGeometry, ShaderMaterial, Mesh} from "three";
import {baseVertexShader} from './baseVertex.glsl'
import {fvSubtitleFragShader} from './fvSubtitleFrag.glsl'

const FVsubTitleShader = () => {
	
	const material = new ShaderMaterial({
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
	})
	const mesh = new Mesh(geometry, material)
	
}

class FVSubTitleShader {
	constructor(e = {}) {
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
			(this.mesh.scale.x = getPxThree(this.width)),
			(this.mesh.scale.y = getPxThree(this.height)),
			(this.mesh.material.uniforms.resolution.value.x = this.mesh.scale.x),
			(this.mesh.material.uniforms.resolution.value.y = this.mesh.scale.y),
			(this.mesh.material.uniforms.borderRadius.value = getPxScaleThree(
				this.borderRadius - 2,
				this.mesh.scale.x,
			)),
			(this.mesh.position.x =
				-WEBGL.width / 2 +
				getPxThree(this.left) +
				this.mesh.scale.x / 2 +
				this.translate.x),
			(this.mesh.position.y =
				WEBGL.height / 2 -
				getPxThree(this.top) -
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
		((this.translate.y = getPxThree(e)),
			(this.mesh.position.y =
				WEBGL.height / 2 -
				getPxThree(this.top) -
				this.mesh.scale.y / 2 +
				this.translate.y));
	}
	
	onStickyScroll(e = 0, t = 0) {
		if (this.mesh) {
			const n = WEBGL.height / 2 - getPxThree(this.top) - this.mesh.scale.y / 2;
			(this.translate.y = t), (this.mesh.position.y = n + this.translate.y);
		}
	}
	
	onRender() {
		this.mesh &&
		((this.mesh.visible = this.visible),
			(this.mesh.position.x =
				-WEBGL.width / 2 +
				getPxThree(this.left) +
				this.mesh.scale.x / 2 +
				this.translate.x));
	}
	
	onDestroy() {
		this.mesh && (this.mesh.visible = !1);
	}
}