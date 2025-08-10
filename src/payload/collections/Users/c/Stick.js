import * as THREE from "three";
import baseVertexShader from "./baseVertex.glsl";
import stickyFrag from "./stickyFrag.glsl";

export class StickySlider {
	constructor(e) {
		this.WEBGL = e.WEBGL;
		this.COLOR = e.COLOR;
		(this.ready = !1),
			(this.props = e),
			(this.el = e.el),
			(this.global = e.scene),
			(this.borderRadius = e.borderRadius || 0),
			(this.params = {
				fadeDensity: 6.5,
				fadePower: 5,
				borderWidth: 0.15,
			}),
			(this.translate = {
				x: 0,
				y: 0,
			}),
		this.global &&
		(this.onInitMesh(),
			this.onResize(!1),
			this.onScroll(),
			(this.textures = {
				...e.textures,
			}));
	}
	
	getPxThree(e) {
		return (e / window.innerWidth) * this.WEBGL.width;
	}
	
	getPxScaleThree(e, t) {
		const n = t / this.WEBGL.width,
			r = window.innerWidth * n;
		return e / r;
	}
	
	getVideo(e) {
	}
	
	onLoadTexture() {
		Object.keys(this.textures).forEach((e, t) => {
			const n = this.textures[e];
			let r = null;
			n.video
				? ((r = getVideoSrc(
					n.video.d1x,
					n.video.d2x,
					n.video.mob,
					n.video.d1x,
				)),
					(r = CDN_URL + r + "?v=" + VERSION),
					(n.el = document.createElement("video")),
					(n.el.preload = "metadata"),
					(n.el.muted = !0),
					(n.el.loop = !0),
					n.el.setAttribute("crossorigin", "anonymous"),
					n.el.setAttribute("muted", ""),
					n.el.setAttribute("playsinline", "playsinline"),
					(n.el.src = r),
					onPlayVideo(n.el),
					(n.tex = new THREE.VideoTexture(n.el)))
				: ((r = getSrc(n.image.d1x, n.image.d2x, n.image.mob, n.image.d1x)),
					(r = CDN_URL + r + ".webp?v=" + VERSION),
					(n.tex = new THREE.TextureLoader().load(r))),
			this.material.uniforms[e] && (this.material.uniforms[e].value = n.tex);
		});
	}
	
	onInitMesh() {
		(this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1)),
			(this.material = new THREE.ShaderMaterial({
				vertexShader: baseVertexShader,
				fragmentShader: stickyFrag,
				transparent: !0,
				uniforms: {
					u_opacity: {
						value: 0,
					},
					u_resolution: {
						value: {
							x: 0,
							y: 0,
						},
					},
					u_i_resolution: {
						value: {
							x: 0,
							y: 0,
						},
					},
					u_borderRadius: {
						value: 0,
					},
					u_fadeDensity: {
						value: this.params.fadeDensity,
					},
					u_fadePower: {
						value: this.params.fadePower,
					},
					u_borderWidth: {
						value: this.params.borderWidth,
					},
					u_borderColor: {
						value: this.COLOR.white,
					},
					u_slidePower1: {
						value: 0,
					},
					u_slidePower2: {
						value: 0,
					},
					u_slidePower3: {
						value: 0,
					},
					u_slidePower4: {
						value: 0,
					},
					u_tSlide1: {
						value: null,
					},
					u_tSlide2: {
						value: null,
					},
					u_tSlide3: {
						value: null,
					},
					u_tSlide4: {
						value: null,
					},
				},
			})),
			(this.mesh = new THREE.Mesh(this.geometry, this.material)),
			this.global.add(this.mesh);
	}
	
	onResize() {
		const e = document.querySelector(
			'[data-gl-type="about-sticky-img-slider"]',
		);
		if (e) {
			const t = e.getBoundingClientRect();
			(this.width = t.width),
				(this.height = t.height),
				(this.top = window.innerHeight),
				(this.left = t.left),
				(this.mesh.scale.x = this.getPxThree(this.width)),
				(this.mesh.scale.y = this.getPxThree(this.height)),
				(this.mesh.material.uniforms.u_resolution.value.x = this.mesh.scale.x),
				(this.mesh.material.uniforms.u_resolution.value.y = this.mesh.scale.y),
				(this.mesh.material.uniforms.u_borderRadius.value = this.getPxScaleThree(
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
					this.getPxThree(window.innerHeight * 1.5) +
					this.translate.y);
		}
	}
	
	onScroll(e = 0, t = 0, n = 0) {
		this.mesh &&
		((this.translate.y =
			t != 1 ? this.getPxThree(e) : this.getPxThree(window.innerHeight)),
			(this.mesh.position.y =
				this.WEBGL.height / 2 -
				this.getPxThree(window.innerHeight * 1.5) +
				this.translate.y));
	}
	
	onSync(e, t) {
		const n = Math.min(t * 2, 1);
		switch (e) {
			case "sticky-slider-1":
				this.mesh.material.uniforms.u_slidePower1.value = n;
				break;
			case "sticky-slider-2":
				this.mesh.material.uniforms.u_slidePower2.value = n;
				break;
			case "sticky-slider-3":
				this.mesh.material.uniforms.u_slidePower3.value = n;
				break;
			case "sticky-slider-4":
				this.mesh.material.uniforms.u_slidePower4.value = n;
				break;
		}
	}
	
	onRender() {
		this.mesh &&
		((this.mesh.visible = this.visible),
			(this.mesh.position.x =
				-this.WEBGL.width / 2 +
				this.getPxThree(this.left) +
				this.mesh.scale.x / 2 +
				this.translate.x),
			(this.mesh.material.uniforms.u_fadeDensity.value = this.params.fadeDensity),
			(this.mesh.material.uniforms.u_fadePower.value = this.params.fadePower),
			(this.mesh.material.uniforms.u_borderWidth.value =
				this.params.borderWidth));
	}
	
	onDestroy() {
		this.mesh &&
		((this.mesh.visible = !1),
			(this.mesh.material.uniforms.u_slidePower1.value = 0),
			(this.mesh.material.uniforms.u_slidePower2.value = 0),
			(this.mesh.material.uniforms.u_slidePower3.value = 0),
			(this.mesh.material.uniforms.u_slidePower4.value = 0)),
			Object.keys(this.textures).forEach((e, t) => {
				const n = this.textures[e];
				n.el = null;
			});
	}
	
	onTouch() {
		Object.keys(this.textures).forEach((e, t) => {
			const n = this.textures[e];
			n.el && n.el.paused && onPlayVideo(n.el);
		});
	}
}
