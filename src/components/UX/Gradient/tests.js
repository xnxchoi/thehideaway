import {
	ClampToEdgeWrapping,
	Color,
	ColorManagement,
	FloatType,
	LinearFilter,
	LinearSRGBColorSpace,
	NearestFilter,
	NoColorSpace,
	OrthographicCamera,
	PlaneGeometry,
	RGBAFormat,
	SRGBColorSpace,
	UnsignedByteType,
} from 'three'

class ArrayCamera extends PerspectiveCamera {
	constructor(ze = []) {
		super(), (this.isArrayCamera = !0), (this.cameras = ze)
	}
}

const _moveEvent = {
	type: 'move',
}

class DepthTexture extends Texture {
	constructor(ze, Gr, Yr, Kr, Zr, Jr, Qr, ei, ti, ri) {
		if (((ri = ri !== void 0 ? ri : DepthFormat), ri !== DepthFormat && ri !== DepthStencilFormat))
			throw new Error(
				'DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat',
			)
		Yr === void 0 && ri === DepthFormat && (Yr = UnsignedIntType),
		Yr === void 0 && ri === DepthStencilFormat && (Yr = UnsignedInt248Type),
			super(null, Kr, Zr, Jr, Qr, ei, ri, Yr, ti),
			(this.isDepthTexture = !0),
			(this.image = {
				width: ze,
				height: Gr,
			}),
			(this.magFilter = Qr !== void 0 ? Qr : NearestFilter),
			(this.minFilter = ei !== void 0 ? ei : NearestFilter),
			(this.flipY = !1),
			(this.generateMipmaps = !1),
			(this.compareFunction = null)
	}
	
	copy(ze) {
		return super.copy(ze), (this.compareFunction = ze.compareFunction), this
	}
	
	toJSON(ze) {
		const Gr = super.toJSON(ze)
		return this.compareFunction !== null && (Gr.compareFunction = this.compareFunction), Gr
	}
}

class DataTexture extends Texture {
	constructor(
		ze = null,
		Gr = 1,
		Yr = 1,
		Kr,
		Zr,
		Jr,
		Qr,
		ei,
		ti = NearestFilter,
		ri = NearestFilter,
		ni,
		ii,
	) {
		super(null, Jr, Qr, ei, ti, ri, Kr, Zr, ni, ii),
			(this.isDataTexture = !0),
			(this.image = {
				data: ze,
				width: Gr,
				height: Yr,
			}),
			(this.generateMipmaps = !1),
			(this.flipY = !1),
			(this.unpackAlignment = 1)
	}
}

const Cache = {
	enabled: !1,
	files: {},
	add: function (Wr, ze) {
		this.enabled !== !1 && (this.files[Wr] = ze)
	},
	get: function (Wr) {
		if (this.enabled !== !1) return this.files[Wr]
	},
	remove: function (Wr) {
		delete this.files[Wr]
	},
	clear: function () {
		this.files = {}
	},
}

ColorManagement.enabled = !0
const renderer = new WebGLRenderer({
	antialias: !1,
	alpha: !0,
	depth: !1,
	stencil: !0,
	powerPreference: 'high-performance',
})
renderer.setPixelRatio(config.webgl.pixelRatio)
const resize$2 = () => {
	const Wr = window.innerWidth,
		ze = window.innerHeight
	renderer.setSize(Wr, ze)
}

window.addEventListener('resize', resize$2)
resize$2()
const container = document.querySelector('.webgl'),
	canvas$1 = renderer.domElement
container.appendChild(canvas$1)
const scene = new Scene()
scene.background = new Color(16777215)
const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
camera.position.z = 1

class GPUComputationRenderer {
	constructor(ze, Gr, Yr) {
		;(this.variables = []), (this.currentTextureIndex = 0)
		let Kr = FloatType
		const Zr = new Scene(),
			Jr = new Camera()
		Jr.position.z = 1
		const Qr = {
				passThruTexture: {
					value: null,
				},
			},
			ei = ni(si(), Qr),
			ti = new Mesh(new PlaneGeometry(2, 2), ei)
		Zr.add(ti),
			(this.setDataType = function (li) {
				return (Kr = li), this
			}),
			(this.addVariable = function (li, oi, ui) {
				const ai = this.createShaderMaterial(oi),
					hi = {
						name: li,
						initialValueTexture: ui,
						material: ai,
						dependencies: null,
						renderTargets: [],
						wrapS: null,
						wrapT: null,
						minFilter: NearestFilter,
						magFilter: NearestFilter,
					}
				return this.variables.push(hi), hi
			}),
			(this.setVariableDependencies = function (li, oi) {
				li.dependencies = oi
			}),
			(this.init = function () {
				if (Yr.capabilities.isWebGL2 === !1 && Yr.extensions.has('OES_texture_float') === !1)
					return 'No OES_texture_float support for float textures.'
				if (Yr.capabilities.maxVertexTextures === 0) return 'No support for vertex shader textures.'
				for (let li = 0; li < this.variables.length; li++) {
					const oi = this.variables[li]
					;(oi.renderTargets[0] = this.createRenderTarget(
						ze,
						Gr,
						oi.wrapS,
						oi.wrapT,
						oi.minFilter,
						oi.magFilter,
					)),
						(oi.renderTargets[1] = this.createRenderTarget(
							ze,
							Gr,
							oi.wrapS,
							oi.wrapT,
							oi.minFilter,
							oi.magFilter,
						)),
						this.renderTexture(oi.initialValueTexture, oi.renderTargets[0]),
						this.renderTexture(oi.initialValueTexture, oi.renderTargets[1])
					const ui = oi.material,
						ai = ui.uniforms
					if (oi.dependencies !== null)
						for (let hi = 0; hi < oi.dependencies.length; hi++) {
							const ci = oi.dependencies[hi]
							if (ci.name !== oi.name) {
								let fi = !1
								for (let di = 0; di < this.variables.length; di++)
									if (ci.name === this.variables[di].name) {
										fi = !0
										break
									}
								if (!fi)
									return (
										'Variable dependency not found. Variable=' + oi.name + ', dependency=' + ci.name
									)
							}
							;(ai[ci.name] = {
								value: null,
							}),
								(ui.fragmentShader =
									`
uniform sampler2D ` +
									ci.name +
									`;
` +
									ui.fragmentShader)
						}
				}
				return (this.currentTextureIndex = 0), null
			}),
			(this.compute = function () {
				const li = this.currentTextureIndex,
					oi = this.currentTextureIndex === 0 ? 1 : 0
				for (let ui = 0, ai = this.variables.length; ui < ai; ui++) {
					const hi = this.variables[ui]
					if (hi.dependencies !== null) {
						const ci = hi.material.uniforms
						for (let fi = 0, di = hi.dependencies.length; fi < di; fi++) {
							const pi = hi.dependencies[fi]
							ci[pi.name].value = pi.renderTargets[li].texture
						}
					}
					this.doRenderTarget(hi.material, hi.renderTargets[oi])
				}
				this.currentTextureIndex = oi
			}),
			(this.getCurrentRenderTarget = function (li) {
				return li.renderTargets[this.currentTextureIndex]
			}),
			(this.getAlternateRenderTarget = function (li) {
				return li.renderTargets[this.currentTextureIndex === 0 ? 1 : 0]
			}),
			(this.dispose = function () {
				ti.geometry.dispose(), ti.material.dispose()
				const li = this.variables
				for (let oi = 0; oi < li.length; oi++) {
					const ui = li[oi]
					ui.initialValueTexture && ui.initialValueTexture.dispose()
					const ai = ui.renderTargets
					for (let hi = 0; hi < ai.length; hi++) ai[hi].dispose()
				}
			})
		
		function ri(li) {
			li.defines.resolution = 'vec2( ' + ze.toFixed(1) + ', ' + Gr.toFixed(1) + ' )'
		}
		
		this.addResolutionDefine = ri
		
		function ni(li, oi) {
			oi = oi || {}
			const ui = new ShaderMaterial({
				name: 'GPUComputationShader',
				uniforms: oi,
				vertexShader: ii(),
				fragmentShader: li,
			})
			return ri(ui), ui
		}
		
		;(this.createShaderMaterial = ni),
			(this.createRenderTarget = function (li, oi, ui, ai, hi, ci) {
				return (
					(li = li || ze),
						(oi = oi || Gr),
						(ui = ui || ClampToEdgeWrapping),
						(ai = ai || ClampToEdgeWrapping),
						(hi = hi || NearestFilter),
						(ci = ci || NearestFilter),
						new WebGLRenderTarget(li, oi, {
							wrapS: ui,
							wrapT: ai,
							minFilter: hi,
							magFilter: ci,
							format: RGBAFormat,
							type: Kr,
							depthBuffer: !1,
						})
				)
			}),
			(this.createTexture = function () {
				const li = new Float32Array(ze * Gr * 4),
					oi = new DataTexture(li, ze, Gr, RGBAFormat, FloatType)
				return (oi.needsUpdate = !0), oi
			}),
			(this.renderTexture = function (li, oi) {
				;(Qr.passThruTexture.value = li),
					this.doRenderTarget(ei, oi),
					(Qr.passThruTexture.value = null)
			}),
			(this.doRenderTarget = function (li, oi) {
				const ui = Yr.getRenderTarget(),
					ai = Yr.xr.enabled,
					hi = Yr.shadowMap.autoUpdate
				;(Yr.xr.enabled = !1),
					(Yr.shadowMap.autoUpdate = !1),
					(ti.material = li),
					Yr.setRenderTarget(oi),
					Yr.render(Zr, Jr),
					(ti.material = ei),
					(Yr.xr.enabled = ai),
					(Yr.shadowMap.autoUpdate = hi),
					Yr.setRenderTarget(ui)
			})
		
		function ii() {
			return `void main()	{

	gl_Position = vec4( position, 1.0 );

}
`
		}
		
		function si() {
			return `uniform sampler2D passThruTexture;

void main() {

	vec2 uv = gl_FragCoord.xy / resolution.xy;

	gl_FragColor = texture2D( passThruTexture, uv );

}
`
		}
	}
}

class GPGPU {
	constructor(ze, Gr, Yr = ze) {
		;(this.textures = {}),
			(this.variables = []),
			(this.gpuComputer = new GPUComputationRenderer(ze, Yr, Gr))
	}
	
	createTexture(ze, Gr = 8) {
		return (
			(this.textures[ze] = this.gpuComputer.createTexture()),
				this._createIndexes(Gr, this.textures[ze]),
				this.textures[ze]
		)
	}
	
	_createIndexes(ze, Gr) {
		const Yr = ze * ze
		Gr.indexes = new Float32Array(Yr * 2)
		for (let Kr = 0; Kr < Yr; Kr++)
			(Gr.indexes[Kr * 2 + 0] = (Kr % ze) / ze), (Gr.indexes[Kr * 2 + 1] = ~~(Kr / ze) / ze)
	}
	
	addVariable(ze, Gr, Yr, Kr) {
		const Zr = this.gpuComputer.addVariable(ze, Yr, Gr)
		if ((this.gpuComputer.setVariableDependencies(Zr, [Zr]), Kr))
			for (const Qr in Kr)
				Zr.material.uniforms[Qr] = {
					value: Kr[Qr],
				}
		const Jr = this.gpuComputer.init()
		Jr !== null && console.error(Jr), (this.variables[ze] = Zr)
	}
	
	addDebugPlane(ze, Gr) {
		let Yr = new Mesh(
			new PlaneGeometry(1, 1),
			new MeshBasicMaterial({
				map: this.gpuComputer.getCurrentRenderTarget(this.variables[Gr]).texture,
			}),
		)
		ze.add(Yr),
			gsapWithCSS.ticker.add(() => {
				;(Yr.material.map = this.gpuComputer.getCurrentRenderTarget(this.variables[Gr]).texture),
					(Yr.material.needsUpdate = !0)
			})
	}
}

const simulationFragShader = `
// The size of the computation (sizeX * sizeY) is defined as 'resolution' automatically in the shader.
// For example:
// #DEFINE resolution vec2( 1024.0, 1024.0 )

uniform vec2 uMouse;
uniform vec2 uPrevMouse;
uniform float uTime;
uniform float uDelta;
uniform float uMouseFactor;

// Function to calculate the minimum distance from a point to a line segment
float distanceToSegment(vec2 point, vec2 start, vec2 end) {
    vec2 lineVec = end - start;
    vec2 pointVec = point - start;
    float lineLen = length(lineVec);
    vec2 lineUnitVec = lineVec / lineLen;
    float projLength = dot(pointVec, lineUnitVec);
    projLength = clamp(projLength, 0.0, lineLen);
    vec2 projPoint = start + lineUnitVec * projLength;
    return length(point - projPoint);
}

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    vec4 data = texture2D(tPosition, uv);

    // blacken over time
    data.r = mix(data.r, .5, uDelta * .002);
    data.g = mix(data.g, .5, uDelta * .002);
    data.b = mix(data.b, 0., uDelta * .001);

    float dist = distance(uMouse, uPrevMouse);
    dist *= 1. - step(.2, dist); // avoid big straight lines when entering the canvas

    //float aspect = min(resolution.x, resolution.y) / max(resolution.x, resolution.y);
    //float mixer = smoothstep(.65, .85, aspect);
    //float aspectCorrection = mix(1., 1., mixer);
    vec2 direction = normalize(uMouse - uPrevMouse);// * aspectCorrection;

    //direction = vec2(10., 10.);
    //float angle = atan(direction.y, direction.x);
    //float hue = degrees(angle);

    // Normalize hue from -180 to 180 to 0 to 1
    //hue = mod((hue / 360.0) + 1.0, 1.0);

    // Calculate the distance to the line segment from last mouse position to current
    float distanceToLine = distanceToSegment(uv, uPrevMouse, uMouse);

    float lineInfluence = 1. - smoothstep(0., .2, distanceToLine);
    lineInfluence = clamp(lineInfluence, 0., 1.);
    lineInfluence = pow(lineInfluence, .5);

    float velocityFactor = dist * 1.;
    float influence = lineInfluence * velocityFactor * uMouseFactor;
    data.r += direction.x * 2. * influence;
    data.g += direction.y * 2. * influence;
    data.b += influence;

    data.r = clamp(data.r, 0., 1.);
    data.g = clamp(data.g, 0., 1.);
    data.b = clamp(data.b, 0., 1.);

    gl_FragColor = data;
}
`,
	mouse = new Vector2(),
	mouseUv = new Vector2(),
	prevMouseUv = new Vector2()
window.addEventListener('pointermove', (Wr) => {
	;(mouse.x = Wr.clientX),
		(mouse.y = Wr.clientY),
		prevMouseUv.copy(mouseUv),
		(mouseUv.x = mouse.x / (canvas$1.width / config.webgl.pixelRatio)),
		(mouseUv.y = 1 - mouse.y / (canvas$1.height / config.webgl.pixelRatio))
})
const uLerpedMouseUv = new Uniform(new Vector2())
gsapWithCSS.ticker.add((Wr, ze) => {
	uLerpedMouseUv.value.lerp(mouseUv, ze / 150)
})
let mouseFactorTimeout
const uMouseFactor = new Uniform(0),
	listenMouseMove = (Wr) => {
		Wr.target.getAttribute('no-webgl-hover') === null &&
		((uMouseFactor.value = 1),
		mouseFactorTimeout && clearTimeout(mouseFactorTimeout),
			(mouseFactorTimeout = setTimeout(() => {
				gsapWithCSS.to(uMouseFactor, {
					value: 0,
					duration: 0.1,
					ease: 'none',
				})
			}, 50)))
	}

window.addEventListener('mousemove', listenMouseMove)
const uResolution = new Uniform(new Vector2(canvas$1.offsetWidth, canvas$1.offsetHeight)),
	resize$1 = () => uResolution.value.set(canvas$1.offsetWidth, canvas$1.offsetHeight)
window.addEventListener('resize', resize$1)
const uScrollOffset = new Uniform(0)
lenis$1.on('scroll', (Wr) => {
	uScrollOffset.value += Wr.velocity * 3e-4
})
let ww = document.documentElement.clientWidth,
	wh = window.innerHeight,
	w = Math.floor(ww / 40),
	h$1 = Math.floor(wh / 40),
	gpgpu
const uSimulationTexture = new Uniform()
createGPGPU(w, h$1)
gsapWithCSS.ticker.add((Wr, ze) => {
	gpgpu &&
	((gpgpu.variables.tPosition.material.uniforms.uTime.value = Wr),
		(gpgpu.variables.tPosition.material.uniforms.uDelta.value = ze),
		(gpgpu.variables.tPosition.material.uniforms.uMouseFactor.value = uMouseFactor.value),
		gpgpu.gpuComputer.compute())
})
window.addEventListener('resize', () => {
	gpgpu && (gpgpu.gpuComputer.dispose(), (gpgpu.gpuComputer = null), (gpgpu = null)),
		(ww = document.documentElement.clientWidth),
		(wh = window.innerHeight),
		(w = Math.floor(ww / 40)),
		(h$1 = Math.floor(wh / 40)),
		createGPGPU(w, h$1)
})

function createGPGPU(Wr, ze) {
	;(gpgpu = new GPGPU(Wr, renderer, ze)),
		gpgpu.addVariable('tPosition', null, simulationFragShader, {
			uMouse: mouseUv,
			uPrevMouse: prevMouseUv,
			uTime: 0,
			uDelta: 0,
			uMouseFactor,
		}),
		(uSimulationTexture.value = gpgpu.gpuComputer.getCurrentRenderTarget(
			gpgpu.variables.tPosition,
		).texture)
}

function styles(Wr) {
	return `
    .p-gui {
        --main-border-radius: 5px;
        --color-bg: #121212;
        --color-border: #484848;
        --color-border-2: rgba(255,255,255,.1);
        --color-accent: #1681ca;
        --color-accent-hover: #218fda;
    
        position: ${Wr};
        top: 0;
        left: 0;
        transform: translate3d(0,0,0);
        padding-top: 21px;
        background: var(--color-bg);
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        font-family: Verdana, Arial, sans-serif;
        width: 290px;
        overflow: auto;
        box-shadow: 0 0 2px black;
        box-sizing: border-box;
        z-index: 99999;
        user-select: none;
        border-bottom-right-radius: 3px;
        border-bottom-left-radius: 3px;
        cursor: auto;
        border-radius: var(--main-border-radius);
        border: 1px solid var(--color-border);
        line-height: normal;
    }
    
    .p-gui * {
        font-size: 11px;
    }
    
    .p-gui::-webkit-scrollbar,
    .p-gui *::-webkit-scrollbar {
        width: 10px;
    }
    
    .p-gui::-webkit-scrollbar-track,
    .p-gui *::-webkit-scrollbar-track {
        background: #2f2f2f;
        border-radius: 3px;
    }
    
    .p-gui::-webkit-scrollbar-thumb,
    .p-gui *::-webkit-scrollbar-thumb {
        background: #757576;
        border-radius: 10px;
        box-sizing: border-box;
        border: 1px solid #2f2f2f;
    }
    
    .p-gui--collapsed {
        height: 0;
        padding: 21px 10px 0 10px;
        overflow: hidden;
    }
    
    .p-gui__header {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 20px;
        background-color: rgba(0, 0, 0, .8);
        cursor: grab;
        color: grey;
        font-size: 10px;
        line-height: 20px;
        padding-left: 12px;
        box-sizing: border-box;
        touch-action: none;
    }
    
    .p-gui__header-close {
        width: 20px;
        height: 20px;
        position: absolute;
        top: 0;
        right: 5px;
        cursor: pointer;
        background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUAQMAAAC3R49OAAAABlBMVEUAAAD///+l2Z/dAAAAAXRSTlMAQObYZgAAABFJREFUCNdjIAb8//8BjIkAAOrOBd3TR0jRAAAAAElFTkSuQmCC);
        background-size: 50% 50%;
        background-position: center;
        background-repeat: no-repeat;
    }
    
    .p-gui--collapsed .p-gui__header-close {
        background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUAQMAAAC3R49OAAAABlBMVEUAAAD///+l2Z/dAAAAAXRSTlMAQObYZgAAABVJREFUCNdjYEhgIIj///8AwsSoBQD43QydY5mb0QAAAABJRU5ErkJggg==);
    }
    
    .p-gui__image-container {
        width: 100%;
        padding: 3px;
        display: flex;
        justify-content: flex-start;
        flex-wrap: wrap;
    }
    
    .p-gui__image {
        background-size: cover;
        cursor: pointer;
        position: relative;
        margin: 1px 2.5px 19px 2.5px;
        border-radius: var(--main-border-radius);
        flex: 0 0 calc(33.333% - 5px);
        height: 90px;
        background-position: center;
    }

    .p-gui__image--selected::after {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        content: '';
        border: 1px solid #06FF89;
        box-sizing: border-box;
        border-radius: var(--main-border-radius);
    }
    
    .p-gui__image-text {
        position: absolute;
        bottom: -15px;
        color: #eee;
        text-shadow: 0 -1px 0 #111;
        white-space: nowrap;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .p-gui__button,
    .p-gui__switch,
    .p-gui__list,
    .p-gui__vector2,
    .p-gui__color {
        width: 100%;
        padding: 7px 13px;
        color: white;
        cursor: pointer;
        position: relative;
        box-sizing: border-box;
        margin-bottom: 3px;
        margin: 3px;
        
        border: 1px solid var(--color-border-2);
        border-radius: var(--main-border-radius);
    }

    .p-gui__vector2 {
        padding: 7px;
    }
    
    .p-gui__button,
    .p-gui__switch {
        margin-right: 4px;
        margin-left: 4px;
    }
    
    .p-gui__button {
        background: var(--color-accent);
        text-align: center;
        color: white;
        border: none;
    }
    
    .p-gui__button:hover {
        background: var(--color-accent-hover);
    }
    
    .p-gui__switch {
        background: rgba(255, 255, 255, .05);
    }

    .p-gui__switch:hover {
        background: rgba(255, 255, 255, .1);
    }
    
    .p-gui__folder .p-gui__button,
    .p-gui__folder .p-gui__switch {
        margin-right: 0;
        margin-left: 0;
    }
    
    .p-gui__vector2 {
        background: transparent;
        aspect-ratio: 1;
        padding-bottom: 0;
    }
    
    .p-gui__vector2-area {
        position: relative;
        background: rgba(0, 0, 0, .3);
        margin-top: 8px;
        width: 100%;
        height: calc(100% - 28px);
        touch-action: none;
    }
    
    .p-gui__vector2-line {
        position: absolute;
        background: white;
        opacity: .3;
        pointer-events: none;
    }
    
    .p-gui__vector2-line-x {
        width: 100%;
        height: 1px;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
    }
    
    .p-gui__vector2-line-y {
        width: 1px;
        height: 100%;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
    }
    
    .p-gui__vector2-dot {
        position: absolute;
        top: 0;
        left: 0;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #d5d5d5;
        border: 2px solid #ff9999;
        transform: translate(-50%, -50%);
        pointer-events: none;
    }
    
    .p-gui__switch-checkbox {
        width: 5px;
        height: 5px;
        background-color: rgba(0, 0, 0, .5);
        border: 1px solid grey;
        position: absolute;
        top: 0;
        right: 10px;
        bottom: 0;
        margin: auto;
        border-radius: 50%;
        pointer-events: none;
    }
    
    .p-gui__switch-checkbox--active {
        background-color: #00ff89;
        box-shadow: 0 0 7px #00ff89;
    }
    
    .p-gui__list,
    .p-gui__color {
        cursor: default;
    }
    
    .p-gui__list-dropdown,
    .p-gui__color-picker {
        position: absolute;
        right: 5px;
        top: 0;
        bottom: 0;
        margin: auto;
        height: 21px;
        cursor: pointer;
        border-radius: 3px;
        border: 1px solid var(--color-border-2);
        outline: none;
    }
    
    .p-gui__list-dropdown {
        background: rgba(255, 255, 255,.05);
        color: white;
        padding: 0 12px;
        top: 0px;
    }
    
    .p-gui__list-dropdown:hover {
        background: rgba(255, 255, 255, .1);
    }
    
    .p-gui__color-picker {
        -webkit-appearance: none;
        padding: 0;
        background-color: transparent;
        border: 1px solid #222222;
        overflow: hidden;
    }
    
    .p-gui__color-picker::-webkit-color-swatch-wrapper {
        padding: 0;
    }
    .p-gui__color-picker::-webkit-color-swatch {
        border: none;
    }
    
    .p-gui__slider {
        width: 100%;
        margin-bottom: 10px;
        padding: 7px;
        color: white;
        position: relative;
        min-height: 14px;
    }
    
    .p-gui__slider-ctrl {
        -webkit-appearance: none;
        padding: 0;
        font: inherit;
        outline: none;
        opacity: .8;
        background: var(--color-accent);
        box-sizing: border-box;
        cursor: pointer;
        position: absolute;
        bottom: -4px; /* 5px height -1px de dépassement du curseur */
        right: 0;
        height: 5px;
        width: 100%;
        margin: 0;
    }
    
    /* la zone de déplacement */
    .p-gui__slider-ctrl::-webkit-slider-runnable-track {
        height: 13px;
        border: none;
        border-radius: 0;
        background-color: transparent;  /* supprimé définie sur l'input */
    }
    
    /* Curseur */
    .p-gui__slider-ctrl::-webkit-slider-thumb {
        -webkit-appearance: none;       /* également nécessaire sur le curseur */
        width: 15px;
        height: 7px;
        border: none;             /* pris en compte sur Webkit et Edge */
        background: white;       /* pris en compte sur Webkit only */
        position: relative;
        top: 3px;
        border-radius: 1px;
    }
    
    .p-gui__slider-value,
    .p-gui__vector-value {
        display: inline-block;
        position: absolute;
        right: 7px;
    }
    
    .p-gui__folder {
        width: 100%;
        position: relative;
        background: #434343;
        overflow: auto;
        margin-bottom: 3px;
        display: flex;
        flex-wrap: wrap;
        border: 1px solid grey;
        padding: 0 3px;
        border-radius: var(--main-border-radius);
    }
    
    .p-gui__folder:last-of-type {
        margin-bottom: 0;
        border-bottom: none;
    }
    
    .p-gui__folder--first {
        margin-top: 0;
    }
    
    .p-gui__folder--closed {
        height: 32px;
        overflow: hidden;
    }
    
    .p-gui__folder-header {
        padding: 10px 5px;
        background-color: rgba(0, 0, 0, .5);
        color: white;
        cursor: pointer;
        width: 100%;
        margin: 0 -2px 2px -3px;
    }
    
    .p-gui__folder-header:hover {
        background-color: rgba(0, 0, 0, .75);
    }
    
    .p-gui__folder-arrow {
        width: 8px;
        height: 8px;
        display: inline-block;
        background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAHlBMVEUAAAD///////////////////////////////////8kfJuVAAAACXRSTlMA9Z1fCdMo1yxEJnA0AAAAK0lEQVQI12PABlRgjKkJUMZMYRhjpgqMAZSEMICSaIzpDWiKhdENhEhgAgATSg5jyWnYewAAAABJRU5ErkJggg==);
        background-size: contain;
        margin-right: 5px;
        transform: rotate(90deg)
    }
    
    .p-gui__folder--closed .p-gui__folder-arrow {
        transform: rotate(0deg);
    }
    `
}

class GUI {
	constructor(ze = {}) {
		if (
			(ze.container
				? ((this.container =
					typeof ze.container == 'string' ? document.querySelector(ze.container) : ze.container),
					(this.position_type = 'absolute'))
				: ((this.container = document.body), (this.position_type = 'fixed')),
			typeof ze.onUpdate == 'function' && (this.onUpdate = ze.onUpdate),
				(this.propReferences = []),
				(this.folders = []),
				ze.isFolder)
		) {
			this._folderConstructor(ze.folderOptions)
			return
		}
		;(this.name = ze != null && typeof ze.name == 'string' ? ze.name : ''),
			(this.backgroundColor = ze.color || null),
			this.container == document.body
				? (this.maxHeight = window.innerHeight)
				: (this.maxHeight = Math.min(this.container.clientHeight, window.innerHeight)),
		ze.maxHeight &&
		((this.initMaxHeight = ze.maxHeight),
			(this.maxHeight = Math.min(this.initMaxHeight, this.maxHeight))),
			(this.screenCorner = this._parseScreenCorner(ze.position)),
		window.perfectGUI || (window.perfectGUI = {}),
			window.perfectGUI.instanceCounter == null
				? (window.perfectGUI.instanceCounter = 0)
				: window.perfectGUI.instanceCounter++,
			(this.instanceId = window.perfectGUI.instanceCounter),
			(this.wrapperWidth = ze.width || 290),
			(this.stylesheet = document.createElement('style')),
			this.stylesheet.setAttribute('type', 'text/css'),
			this.stylesheet.setAttribute('id', 'lm-gui-stylesheet'),
			document.head.append(this.stylesheet),
		this.instanceId == 0 && this._addStyles(`${styles(this.position_type)}`),
			this._styleInstance(),
			this._addWrapper(),
			this.wrapper.setAttribute('data-corner-x', this.screenCorner.x),
			this.wrapper.setAttribute('data-corner-y', this.screenCorner.y),
		ze.autoRepositioning != !1 &&
		window.addEventListener('resize', this._handleResize.bind(this)),
			this._handleResize(),
			(this.hasBeenDragged = !1),
		ze.draggable == !0 && this._makeDraggable(),
			(this.closed = !1),
		ze.closed && this.toggleClose()
	}
	
	_styleInstance() {
		let ze = this._getScrollbarWidth(this.container)
		if (
			(this.screenCorner.x == 'left'
				? (this.xOffset = 0)
				: (this.xOffset = this.container.clientWidth - this.wrapperWidth - ze),
			this.instanceId > 0)
		) {
			let Gr = this.container.querySelectorAll('.p-gui')
			for (let Yr = 0; Yr < Gr.length; Yr++)
				this.screenCorner.y == Gr[Yr].dataset.cornerY &&
				(this.screenCorner.x == 'left' && Gr[Yr].dataset.cornerX == 'left'
					? (this.xOffset += Gr[Yr].offsetWidth)
					: this.screenCorner.x == 'right' &&
					Gr[Yr].dataset.cornerX == 'right' &&
					(this.xOffset -= Gr[Yr].offsetWidth))
		}
		;(this.yOffset = 0),
			(this.position = {
				prevX: this.xOffset,
				prevY: this.yOffset,
				x: this.xOffset,
				y: this.yOffset,
			}),
			this._addStyles(`#p-gui-${this.instanceId} {
            width: ${this.wrapperWidth}px;
            max-height: ${this.maxHeight}px;
            transform: translate3d(${this.xOffset}px,${this.yOffset}px,0);
            ${this.screenCorner.y == 'top' ? '' : 'top: auto; bottom: 0;'}
            ${this.backgroundColor ? 'background: ' + this.backgroundColor + ';' : ''}
        }`)
	}
	
	_folderConstructor(ze) {
		;(this.wrapper = ze.wrapper), typeof ze.onUpdate == 'function' && (this.onUpdate = ze.onUpdate)
	}
	
	_parseScreenCorner(ze) {
		let Gr = {
			x: 'right',
			y: 'top',
		}
		return (
			ze == null ||
			(typeof ze != 'string' && console.error('[perfect-gui] Position must be a string.'),
			ze.includes('left') && (Gr.x = 'left'),
			ze.includes('bottom') && (Gr.y = 'bottom')),
				Gr
		)
	}
	
	_getScrollbarWidth(ze) {
		return ze === document.body
			? window.innerWidth - document.documentElement.clientWidth
			: ze.offsetWidth - ze.clientWidth
	}
	
	_handleResize() {
		if (
			(this.container == document.body
				? (this.maxHeight = window.innerHeight)
				: (this.maxHeight = Math.min(this.container.clientHeight, window.innerHeight)),
			this.initMaxHeight && (this.maxHeight = Math.min(this.initMaxHeight, this.maxHeight)),
				(this.wrapper.style.maxHeight = this.maxHeight + 'px'),
				this.hasBeenDragged)
		)
			return
		let ze = this._getScrollbarWidth(this.container)
		if (
			((this.xOffset =
				this.screenCorner.x == 'left' ? 0 : this.container.clientWidth - this.wrapperWidth - ze),
			this.instanceId > 0)
		) {
			let Gr = this.container.querySelectorAll(
				`.p-gui:not(#${this.wrapper.id}):not([data-dragged])`,
			)
			for (
				let Yr = 0;
				Yr < Gr.length && !(parseInt(Gr[Yr].id.replace('p-gui-', '')) > this.instanceId);
				Yr++
			)
				this.screenCorner.y == Gr[Yr].dataset.cornerY &&
				(this.screenCorner.x == 'left' && Gr[Yr].dataset.cornerX == 'left'
					? (this.xOffset += Gr[Yr].offsetWidth)
					: this.screenCorner.x == 'right' &&
					Gr[Yr].dataset.cornerX == 'right' &&
					(this.xOffset -= Gr[Yr].offsetWidth))
		}
		;(this.position = {
			prevX: this.xOffset,
			prevY: this.yOffset,
			x: this.xOffset,
			y: this.yOffset,
		}),
			(this.wrapper.style.transform = `translate3d(${this.position.x}px, ${this.position.y}px, 0)`)
	}
	
	_addStyles(ze) {
		this.stylesheet.innerHTML += ze
	}
	
	_addWrapper() {
		;(this.wrapper = document.createElement('div')),
			(this.wrapper.id = 'p-gui-' + this.instanceId),
			(this.wrapper.className = 'p-gui'),
			this.container.append(this.wrapper),
			(this.header = document.createElement('div')),
			(this.header.className = 'p-gui__header'),
			(this.header.textContent = this.name),
			(this.header.style = `${this.backgroundColor ? 'border-color: ' + this.backgroundColor + ';' : ''}`),
			this.wrapper.append(this.header)
		const ze = document.createElement('div')
		;(ze.className = 'p-gui__header-close'),
			ze.addEventListener('click', this.toggleClose.bind(this)),
			this.header.append(ze)
	}
	
	button(ze, Gr) {
		let Yr = ''
		typeof ze != 'string'
			? typeof ze == 'object' && ze != null && ze.hasOwnProperty('name')
				? (Yr = ze.name == '' ? ' ' : ze.name)
				: (Yr = ' ')
			: (Yr = ze == '' ? ' ' : ze),
			(this.imageContainer = null)
		const Kr = document.createElement('div')
		;(Kr.className = 'p-gui__button'),
			(Kr.textContent = Yr),
			Kr.addEventListener('click', () => {
				this.onUpdate && this.onUpdate(), Gr && Gr()
			}),
			this.wrapper.append(Kr),
		typeof ze.color == 'string' &&
		(Kr.style.setProperty('--color-accent', ze.color),
			Kr.style.setProperty('--color-accent-hover', ze.hoverColor || ze.color))
	}
	
	image(ze = {}, Gr) {
		if (typeof ze != 'object')
			throw Error(`[GUI] image() first parameter must be an object. Received: ${typeof ze}.`)
		let Yr
		if (typeof ze.path == 'string') Yr = ze.path
		else
			throw typeof ze.path == null
				? Error('[GUI] image() path must be provided.')
				: Error('[GUI] image() path must be a string.')
		let Kr = Yr.replace(/^.*[\\\/]/, ''),
			Zr
		ze.name == null ? (Zr = Kr) : (Zr = (typeof ze.name == 'string' && ze.name) || ' ')
		const Jr = ze.selected === !0,
			Qr = ze.selectionBorder !== !1
		let ei = ''
		ze.width &&
		(typeof ze.width == 'number' && (ze.width += 'px'),
			(ei += `flex: 0 0 calc(${ze.width} - 5px); `)),
		ze.height &&
		(typeof ze.height == 'number' && (ze.height += 'px'), (ei += `height: ${ze.height}; `)),
		this.imageContainer ||
		((this.imageContainer = document.createElement('div')),
			(this.imageContainer.className = 'p-gui__image-container'),
			this.wrapper.append(this.imageContainer))
		const ti = document.createElement('div')
		;(ti.className = 'p-gui__image'),
			(ti.style = 'background-image: url(' + Yr + '); ' + ei),
			this.imageContainer.append(ti),
		Jr && Qr && ti.classList.add('p-gui__image--selected')
		const ri = document.createElement('div')
		return (
			(ri.className = 'p-gui__image-text'),
				(ri.textContent = Zr),
				ti.append(ri),
				ti.addEventListener('click', () => {
					let ni = ti.parentElement.querySelectorAll('.p-gui__image--selected')
					for (let ii = 0; ii < ni.length; ii++) ni[ii].classList.remove('p-gui__image--selected')
					Qr && ti.classList.add('p-gui__image--selected'),
					typeof Gr == 'function' &&
					Gr({
						path: Yr,
						text: Zr,
					}),
					this.onUpdate && this.onUpdate()
				}),
				ti
		)
	}
	
	slider(ze = {}, Gr) {
		var oi, ui
		if (typeof ze != 'object')
			throw Error(`[GUI] slider() first parameter must be an object. Received: ${typeof ze}.`)
		let Yr = (typeof ze.name == 'string' && ze.name) || ' ',
			Kr = !1,
			Zr = null,
			Jr = ze.obj,
			Qr = ze.prop,
			ei = typeof ze.value == 'number' ? ze.value : null,
			ti = (oi = ze.min) != null ? oi : 0,
			ri = (ui = ze.max) != null ? ui : 1,
			ni = ze.step || (ri - ti) / 100
		if (ei !== null)
			(Qr != null || Jr != null) &&
			console.warn(
				'[GUI] slider() "obj" and "prop" parameters are ignored when a "value" parameter is used.',
			)
		else if (Qr != null && Jr != null) {
			if (typeof Qr != 'string')
				throw Error(`[GUI] slider() "prop" parameter must be an string. Received: ${typeof Qr}.`)
			if (typeof Jr != 'object')
				throw Error(`[GUI] slider() "obj" parameter must be an object. Received: ${typeof Jr}.`)
			Yr == ' ' && (Yr = Qr), (Zr = this.propReferences.push(Jr[Qr]) - 1), (Kr = !0)
		} else
			((Qr != null && Jr == null) || (Qr == null && Jr == null)) &&
			console.warn('[GUI] slider() "obj" and "prop" parameters must be used together.'),
				(ei = (ri - ti) / 2)
		this.imageContainer = null
		const ii = document.createElement('div')
		;(ii.className = 'p-gui__slider'), (ii.textContent = Yr), this.wrapper.append(ii)
		const si = document.createElement('input')
		;(si.className = 'p-gui__slider-ctrl'),
			si.setAttribute('type', 'range'),
			si.setAttribute('min', ti),
			si.setAttribute('max', ri),
			si.setAttribute('step', ni),
			si.setAttribute('value', Kr ? Jr[Qr] : ei),
			ii.append(si)
		const li = document.createElement('div')
		;(li.className = 'p-gui__slider-value'),
			(li.textContent = String(Kr ? Jr[Qr] : ei)),
			ii.append(li),
			si.addEventListener('input', () => {
				;(li.textContent = si.value),
					Kr
						? (Jr[Qr] = parseFloat(si.value))
						: typeof Gr == 'function' && Gr(parseFloat(si.value)),
				this.onUpdate && this.onUpdate()
			}),
		Kr &&
		Object.defineProperty(Jr, Qr, {
			set: (ai) => {
				;(this.propReferences[Zr] = ai),
					(si.value = ai),
					(li.textContent = String(ai)),
				typeof Gr == 'function' && Gr(parseFloat(si.value))
			},
			get: () => this.propReferences[Zr],
		})
	}
	
	toggle(ze = {}, Gr) {
		if (typeof ze != 'object')
			throw Error(`[GUI] toggle() first parameter must be an object. Received: ${typeof ze}.`)
		let Yr = (typeof ze.name == 'string' && ze.name) || ' ',
			Kr = !1,
			Zr = null,
			Jr = ze.obj,
			Qr = ze.prop,
			ei = typeof ze.value == 'boolean' ? ze.value : null
		if (ei !== null)
			(Qr != null || Jr != null) &&
			console.warn(
				'[GUI] toggle() "obj" and "prop" parameters are ignored when a "value" parameter is used.',
			)
		else if (Qr != null && Jr != null) {
			if (typeof Qr != 'string')
				throw Error(`[GUI] toggle() "prop" parameter must be an string. Received: ${typeof Qr}.`)
			if (typeof Jr != 'object')
				throw Error(`[GUI] toggle() "obj" parameter must be an object. Received: ${typeof Jr}.`)
			Yr == ' ' && (Yr = Qr), (Zr = this.propReferences.push(Jr[Qr]) - 1), (Kr = !0)
		} else
			((Qr != null && Jr == null) || (Qr == null && Jr == null)) &&
			console.warn('[GUI] toggle() "obj" and "prop" parameters must be used together.')
		this.imageContainer = null
		const ti = document.createElement('div')
		;(ti.textContent = Yr),
			(ti.className = 'p-gui__switch'),
			this.wrapper.append(ti),
			ti.addEventListener('click', (ii) => {
				const si = ii.target.childNodes[1]
				let li = !0
				si.classList.contains('p-gui__switch-checkbox--active') && (li = !1),
					si.classList.toggle('p-gui__switch-checkbox--active'),
					Kr ? (Jr[Qr] = li) : typeof Gr == 'function' && Gr(li),
				this.onUpdate && this.onUpdate()
			})
		let ri = (() =>
			Kr
				? Jr[Qr]
					? ' p-gui__switch-checkbox--active'
					: ''
				: ei
					? ' p-gui__switch-checkbox--active'
					: '')()
		const ni = document.createElement('div')
		;(ni.className = 'p-gui__switch-checkbox' + ri),
			ti.append(ni),
		Kr &&
		Object.defineProperty(Jr, Qr, {
			set: (ii) => {
				;(this.propReferences[Zr] = ii),
					ii
						? ni.classList.add('p-gui__switch-checkbox--active')
						: ni.classList.remove('p-gui__switch-checkbox--active'),
				typeof Gr == 'function' && Gr(ii)
			},
			get: () => this.propReferences[Zr],
		})
	}
	
	list(ze = {}, Gr) {
		if (typeof ze != 'object')
			throw Error(`[GUI] list() first parameter must be an object. Received: ${typeof ze}.`)
		let Yr = typeof ze.name == 'string' ? ze.name : ' ',
			Kr = !1,
			Zr = null,
			Jr = ze.obj,
			Qr = ze.prop,
			ei = Array.isArray(ze.values) ? ze.values : null,
			ti,
			ri = typeof ei[0] != 'string'
		if (
			((Gr = typeof Gr == 'function' ? Gr : null),
			ze.value !== void 0 || (ze.value === void 0 && Jr === void 0 && Qr === void 0))
		)
			(Qr != null || Jr != null) &&
			console.warn(
				'[GUI] list() "obj" and "prop" parameters are ignored when a "value" parameter is used.',
			),
				(ti = (() => {
					if (!ei) return null
					if (typeof ze.value == 'string') return ei.indexOf(ze.value)
					if (typeof ze.value == 'number') return ze.value
				})())
		else if (Qr != null && Jr != null) {
			if (typeof Qr != 'string')
				throw Error(`[GUI] list() "prop" parameter must be an string. Received: ${typeof Qr}.`)
			if (typeof Jr != 'object')
				throw Error(`[GUI] list() "obj" parameter must be an object. Received: ${typeof Jr}.`)
					;
			(ti = (() => {
				if (!ei) return null
				if (typeof Jr[Qr] == 'string')
					return ri ? ei.find((si) => si.value === Jr[Qr]).value : ei.indexOf(Jr[Qr])
				if (typeof Jr[Qr] == 'number')
					return ri ? ei.find((si) => si.value === Jr[Qr]).value : Jr[Qr]
			})()),
				(Zr = this.propReferences.push(Jr[Qr]) - 1),
				(Kr = !0)
		} else
			((Qr != null && Jr == null) || (Qr == null && Jr == null)) &&
			console.warn('[GUI] list() "obj" and "prop" parameters must be used together.')
		this.imageContainer = null
		let ni = document.createElement('div')
		;(ni.className = 'p-gui__list'), (ni.textContent = Yr), this.wrapper.append(ni)
		let ii = document.createElement('select')
		ni.append(ii),
			(ii.className = 'p-gui__list-dropdown'),
			ii.addEventListener('change', (si) => {
				Kr ? (Jr[Qr] = si.target.value) : Gr && Gr(si.target.value),
				this.onUpdate && this.onUpdate()
			}),
		ei &&
		ei.forEach((si, li) => {
			const oi = ri ? si.name : si,
				ui = ri ? si.value : si
			let ai = document.createElement('option')
			ai.setAttribute('value', ui),
				(ai.textContent = oi),
				ii.append(ai),
			((!ri && ti == li) || (ri && ti == ui)) && ai.setAttribute('selected', '')
		}),
		Kr &&
		Object.defineProperty(Jr, Qr, {
			set: (si) => {
				let li, oi, ui
				ri
					? ((ui = ei.find((hi) => hi.value == si)),
						(oi = (ui == null ? void 0 : ui.value) || ei[0].value),
						(li = ei.indexOf(ui)))
					: (typeof si == 'string' && ((li = ei.indexOf(si)), (oi = si)),
					typeof si == 'number' && ((li = si), (oi = ei[si]))),
					(this.propReferences[Zr] = ri ? oi : si)
				const ai = ii.querySelector('[selected]')
				ai && ai.removeAttribute('selected'),
					ii.querySelectorAll('option')[li].setAttribute('selected', ''),
				typeof Gr == 'function' && Gr(ri ? ui : oi, li)
			},
			get: () => this.propReferences[Zr],
		})
	}
	
	vector2(ze = {}, Gr) {
		var di, pi, mi, Si
		if (typeof ze != 'object')
			throw Error(`[GUI] vector2() first parameter must be an object. Received: ${typeof ze}.`)
		let Yr = (typeof ze.name == 'string' && ze.name) || ' '
		const Kr = (di = ze.x.min) != null ? di : 0,
			Zr = (pi = ze.x.max) != null ? pi : 1,
			Jr = (mi = ze.y.min) != null ? mi : 0,
			Qr = (Si = ze.y.max) != null ? Si : 1,
			ei = ze.x.obj,
			ti = ze.x.prop,
			ri = this.propReferences.push(ei[ti]) - 1,
			ni = ze.y.obj,
			ii = ze.y.prop,
			si = this.propReferences.push(ni[ii]) - 1
		;(Gr = typeof Gr == 'function' ? Gr : null), (this.imageContainer = null)
		const li = document.createElement('div')
		;(li.className = 'p-gui__vector2'), (li.textContent = Yr), this.wrapper.append(li)
		const oi = document.createElement('div')
		;(oi.className = 'p-gui__vector-value'),
			(oi.textContent = ei[ti] + ', ' + ni[ii]),
			li.append(oi)
		const ui = document.createElement('div')
		;(ui.className = 'p-gui__vector2-area'),
			li.append(ui),
			ui.addEventListener('click', (yi) => {
				;(ei[ti] = parseFloat(this._mapLinear(yi.offsetX, 0, ui.clientWidth, Kr, Zr).toFixed(2))),
					(ni[ii] = parseFloat(this._mapLinear(yi.offsetY, 0, ui.clientHeight, Qr, Jr).toFixed(2))),
				Gr && Gr(ei[ti], ei[ii]),
				this.onUpdate && this.onUpdate()
			})
		let ai = !1
		ui.addEventListener('pointerdown', (yi) => {
			ai = !0
		}),
			ui.addEventListener('pointerup', () => {
				ai = !1
			}),
			ui.addEventListener('pointermove', (yi) => {
				ai &&
				((ei[ti] = parseFloat(this._mapLinear(yi.offsetX, 0, ui.clientWidth, Kr, Zr).toFixed(2))),
					(ni[ii] = parseFloat(this._mapLinear(yi.offsetY, 0, ui.clientHeight, Qr, Jr).toFixed(2))),
				Gr && Gr(ei[ti], ei[ii])),
				this.onUpdate && this.onUpdate()
			})
		const hi = document.createElement('div')
		;(hi.className = 'p-gui__vector2-line p-gui__vector2-line-x'), ui.append(hi)
		const ci = document.createElement('div')
		;(ci.className = 'p-gui__vector2-line p-gui__vector2-line-y'), ui.append(ci)
		const fi = document.createElement('div')
		;(fi.className = 'p-gui__vector2-dot'),
			ui.append(fi),
			(fi.style.left = this._mapLinear(ei[ti], Kr, Zr, 0, ui.clientWidth) + 'px'),
			(fi.style.top = this._mapLinear(ni[ii], Jr, Qr, ui.clientHeight, 0) + 'px'),
			Object.defineProperty(ei, ti, {
				set: (yi) => {
					;(this.propReferences[ri] = yi),
						(fi.style.left = this._mapLinear(yi, Kr, Zr, 0, ui.clientWidth) + 'px'),
						(oi.textContent = String(yi) + ', ' + ni[ii])
				},
				get: () => this.propReferences[ri],
			}),
			Object.defineProperty(ni, ii, {
				set: (yi) => {
					;(this.propReferences[si] = yi),
						(fi.style.top = this._mapLinear(yi, Jr, Qr, ui.clientHeight, 0) + 'px'),
						(oi.textContent = ei[ti] + ', ' + String(yi))
				},
				get: () => this.propReferences[si],
			})
	}
	
	color(ze = {}, Gr) {
		if (typeof ze != 'object')
			throw Error(`[GUI] color() first parameter must be an object. Received: ${typeof ze}.`)
		let Yr = (typeof ze.name == 'string' && ze.name) || ' ',
			Kr = !1,
			Zr = null,
			Jr = ze.obj,
			Qr = ze.prop,
			ei
		if (
			(typeof ze.value == 'string' &&
			(ze.value.length != 7 || ze.value[0] != '#'
				? console.error(
					`[GUI] color() 'value' parameter must be an hexadecimal string in the format "#ffffff". Received: "${ze.value}".`,
				)
				: (ei = ze.value)),
			ei || (ei = '#000000'),
			ze.value !== void 0)
		)
			(Qr != null || Jr != null) &&
			console.warn(
				'[GUI] color() "obj" and "prop" parameters are ignored when a "value" parameter is used.',
			)
		else if (Qr != null && Jr != null) {
			if (typeof Qr != 'string')
				throw Error(`[GUI] color() "prop" parameter must be an string. Received: ${typeof Qr}.`)
			if (typeof Jr != 'object')
				throw Error(`[GUI] color() "obj" parameter must be an object. Received: ${typeof Jr}.`)
			Yr == ' ' && (Yr = Qr), (Zr = this.propReferences.push(Jr[Qr]) - 1), (Kr = !0)
		} else
			((Qr != null && Jr == null) || (Qr == null && Jr == null)) &&
			console.warn('[GUI] color() "obj" and "prop" parameters must be used together.')
		this.imageContainer = null
		const ti = document.createElement('div')
		;(ti.className = 'p-gui__color'), (ti.textContent = Yr), this.wrapper.append(ti)
		const ri = document.createElement('input')
		;(ri.className = 'p-gui__color-picker'),
			ri.setAttribute('type', 'color'),
			(ri.value = ei),
			ti.append(ri),
		typeof Gr == 'function' &&
		ri.addEventListener('input', () => {
			Kr ? (Jr[Qr] = ri.value) : typeof Gr == 'function' && Gr(ri.value),
			this.onUpdate && this.onUpdate()
		}),
		Kr &&
		Object.defineProperty(Jr, Qr, {
			set: (ni) => {
				;(this.propReferences[Zr] = ni), (ri.value = ni), typeof Gr == 'function' && Gr(ni)
			},
			get: () => this.propReferences[Zr],
		})
	}
	
	folder(ze = {}) {
		let Gr = typeof ze.closed == 'boolean' ? ze.closed : !1,
			Yr = ze.name || '',
			Kr = ze.color || null,
			Zr = ze.maxHeight || null
		this.imageContainer = null
		let Jr = 'p-gui__folder'
		this.folders.length == 0 && (Jr += ' p-gui__folder--first'),
		Gr && (Jr += ' p-gui__folder--closed')
		let Qr = Kr ? `background-color: ${Kr};` : ''
		Qr += Zr ? `max-height: ${Zr}px;` : ''
		const ei = document.createElement('div')
		;(ei.className = Jr), (ei.style = Qr), this.wrapper.append(ei)
		const ti = document.createElement('div')
		;(ti.innerHTML = `<span class="p-gui__folder-arrow"></span>${Yr}`),
			(ti.className = 'p-gui__folder-header'),
			ei.append(ti),
			ti.addEventListener('click', () => {
				ei.classList.toggle('p-gui__folder--closed')
			})
		let ri = new GUI({
			isFolder: !0,
			folderOptions: {
				wrapper: ei,
				onUpdate: this.onUpdate,
			},
		})
		return this.folders.push(ri), ri
	}
	
	_makeDraggable() {
		var ze = this
		this.header.addEventListener('pointerdown', Gr), this.header.addEventListener('pointerup', Kr)
		
		function Gr(Zr) {
			Zr.preventDefault(),
				(ze.position.initX = ze.position.x),
				(ze.position.initY = ze.position.y),
				(ze.position.prevX = Zr.clientX),
				(ze.position.prevY = Zr.clientY),
				document.addEventListener('pointermove', Yr)
		}
		
		function Yr(Zr) {
			Zr.preventDefault(),
			ze.hasBeenDragged ||
			((ze.hasBeenDragged = !0), ze.wrapper.setAttribute('data-dragged', 'true')),
				(ze.position.x = ze.position.initX + Zr.clientX - ze.position.prevX),
				(ze.position.y = ze.position.initY + Zr.clientY - ze.position.prevY),
				(ze.wrapper.style.transform =
					'translate3d(' + ze.position.x + 'px,' + ze.position.y + 'px,0)')
		}
		
		function Kr(Zr) {
			document.removeEventListener('pointermove', Yr)
		}
	}
	
	toggleClose() {
		;(this.closed = !this.closed), this.wrapper.classList.toggle('p-gui--collapsed')
	}
	
	kill() {
		this.wrapper.remove()
	}
	
	_mapLinear(ze, Gr, Yr, Kr, Zr) {
		return Kr + ((ze - Gr) * (Zr - Kr)) / (Yr - Gr)
	}
}

const noiseImageUrl = '/dist/assets/3seamless-7f29af5e.png',
	uTime = new Uniform(0),
	uSize = new Uniform(0.2),
	uOffset = new Uniform(new Vector2(0.42, 0.6)),
	uSpeed = new Uniform(0.02),
	uColor1 = new Uniform(new Color('rgb(65,66,73)')),
	uColor2 = new Uniform(new Color('rgb(36,39,51)')),
	uColor3 = new Uniform(new Color('rgb(49,103,160)')),
	uColor4 = new Uniform(new Color('rgb(117,153,245)')),
	noiseTexture = new TextureLoader().load(noiseImageUrl)
noiseTexture.wrapS = noiseTexture.wrapT = RepeatWrapping
const uNoiseTexture = new Uniform(noiseTexture),
	uColorMixer = new Uniform(0),
	uMenuMode = new Uniform(0),
	uAdditionalZoom = new Uniform(0),
	uAdditionalOffset = new Uniform(new Vector2(0, 0))
gsapWithCSS.ticker.add((Wr) => (uTime.value = Wr))
let gui$1
const debug$1 = {
		mount: () => {
			gui$1 ||
			((gui$1 = new GUI({
				name: 'gradient',
				closed: !0,
			})),
				gui$1.slider({
					name: 'size',
					obj: uSize,
					prop: 'value',
					max: 2,
				}),
				gui$1.vector2({
					name: 'Position',
					x: {
						obj: uOffset.value,
						prop: 'x',
						min: uOffset.value.x - 2,
						max: uOffset.value.x + 2,
					},
					y: {
						obj: uOffset.value,
						prop: 'y',
						min: uOffset.value.y - 2,
						max: uOffset.value.y + 2,
					},
				}),
				gui$1.slider({
					name: 'speed',
					obj: uSpeed,
					prop: 'value',
					min: 0,
					max: 0.1,
				}),
				gui$1.color(
					{
						name: 'color1',
						value: '#' + uColor1.value.getHexString(),
					},
					(Wr) => {
						uColor1.value.set(Wr)
					},
				),
				gui$1.color(
					{
						name: 'color2',
						value: '#' + uColor2.value.getHexString(),
					},
					(Wr) => {
						uColor2.value.set(Wr)
					},
				),
				gui$1.color(
					{
						name: 'color3',
						value: '#' + uColor3.value.getHexString(),
					},
					(Wr) => {
						uColor3.value.set(Wr)
					},
				),
				gui$1.color(
					{
						name: 'color4',
						value: '#' + uColor4.value.getHexString(),
					},
					(Wr) => {
						uColor4.value.set(Wr)
					},
				),
				gui$1.slider({
					name: 'uColorMixer',
					obj: uColorMixer,
					prop: 'value',
				}))
		},
		unmount: () => {
			gui$1 && gui$1.kill(), (gui$1 = void 0)
		},
	},
	material = new ShaderMaterial({
		vertexShader: `
    varying vec2 vUv;

    void main() {
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
      vUv = uv;
    }`,
		fragmentShader: `
    varying vec2 vUv;

    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform vec3 uColor4;
    uniform float uSize;
    uniform vec2 uOffset;
    uniform float uSpeed;
    uniform sampler2D uNoiseTexture;
    uniform sampler2D uSimulationTexture;
    uniform vec2 uResolution;
    uniform float uColorMixer;
    uniform float uMenuMode;
    uniform float uAdditionalZoom;
    uniform vec2 uAdditionalOffset;
    uniform float uScrollOffset;

    void main() {
        vec2 nUv = (-.5 + vUv) * 2.;
        if( uResolution.x < uResolution.y ) {
            nUv.x *= uResolution.x / uResolution.y;
        } else {
            nUv.y *= uResolution.y / uResolution.x;
        }
        nUv = nUv / 2. + .5;

        float additionalZoom = uAdditionalZoom * (1. - uMenuMode);
        vec2 offset = uOffset + uAdditionalOffset * (1. - uMenuMode);
        offset.y -= uScrollOffset;

        vec2 bUv = nUv * (uSize * 2. + additionalZoom) + offset * uMenuMode; // dUv
        vec2 nUv1 = bUv + offset * (1. - uMenuMode) + uTime * uSpeed;
        bUv.y -= .5;
        vec2 nUv2 = bUv + offset * (1. - uMenuMode) - uTime * uSpeed;

        vec4 noiseColor1 = texture2D(uNoiseTexture, nUv1);
        float noise1 = noiseColor1.r;

        vec4 noiseColor2 = texture2D(uNoiseTexture, nUv2);
        float noise2 = noiseColor2.r;

        //float noise = clamp(noise1 * .5 + noise2 * .5, 0., 1.);
        float noise = clamp((noise1 + noise2) / 2., 0., 1.);

        vec2 nUv3 = bUv + noise * .5;
        noise = texture2D(uNoiseTexture, nUv3).r;


        // coloring
        vec3 color = vec3(0.);
        noise = mix(noise, noise * 1.25 + .15, uMenuMode);
        if (noise < 0.25) {
            color = mix(uColor1, uColor2, noise / 0.25);
        } else if (noise < 0.5) {
            color = mix(uColor2, uColor3, (noise - 0.25) / 0.25);
        } else if (noise < 0.75) {
            color = mix(uColor3, uColor4, (noise - 0.5) / 0.25);
        } else {
            color = uColor4;
        }

        //color = step(.5, color);

        //color = mix(color, pow(color, vec3(2.)), uColorMixer);
        vec3 alt = pow(color, vec3(2.));
        alt = alt * 1. - step(.01, color);
        color = mix(color, alt, uColorMixer);

        gl_FragColor = vec4(color, 1.);
        //gl_FragColor = gpgpuColor;

        #include <tonemapping_fragment>
        #include <colorspace_fragment>
    }`,
		uniforms: {
			uMouse: uLerpedMouseUv,
			uTime,
			uColor1,
			uColor2,
			uColor3,
			uColor4,
			uSize,
			uOffset,
			uSpeed,
			uNoiseTexture,
			uSimulationTexture,
			uResolution,
			uColorMixer,
			uMenuMode,
			uAdditionalZoom,
			uAdditionalOffset,
			uScrollOffset,
		},
	})
/**
 * postprocessing v6.35.4 build Fri Apr 26 2024
 * https://github.com/pmndrs/postprocessing
 * Copyright 2015-2024 Raoul van Rüschen
 * @license Zlib
 */
var MILLISECONDS_TO_SECONDS = 1 / 1e3,
	SECONDS_TO_MILLISECONDS = 1e3,
	Timer = class {
		constructor() {
			;(this.startTime = performance.now()),
				(this.previousTime = 0),
				(this.currentTime = 0),
				(this._delta = 0),
				(this._elapsed = 0),
				(this._fixedDelta = 1e3 / 60),
				(this.timescale = 1),
				(this.useFixedDelta = !1),
				(this._autoReset = !1)
		}
		
		get autoReset() {
			return this._autoReset
		}
		
		set autoReset(Wr) {
			typeof document < 'u' &&
			document.hidden !== void 0 &&
			(Wr
				? document.addEventListener('visibilitychange', this)
				: document.removeEventListener('visibilitychange', this),
				(this._autoReset = Wr))
		}
		
		get delta() {
			return this._delta * MILLISECONDS_TO_SECONDS
		}
		
		get fixedDelta() {
			return this._fixedDelta * MILLISECONDS_TO_SECONDS
		}
		
		set fixedDelta(Wr) {
			this._fixedDelta = Wr * SECONDS_TO_MILLISECONDS
		}
		
		get elapsed() {
			return this._elapsed * MILLISECONDS_TO_SECONDS
		}
		
		update(Wr) {
			this.useFixedDelta
				? (this._delta = this.fixedDelta)
				: ((this.previousTime = this.currentTime),
					(this.currentTime = (Wr !== void 0 ? Wr : performance.now()) - this.startTime),
					(this._delta = this.currentTime - this.previousTime)),
				(this._delta *= this.timescale),
				(this._elapsed += this._delta)
		}
		
		reset() {
			;(this._delta = 0),
				(this._elapsed = 0),
				(this.currentTime = performance.now() - this.startTime)
		}
		
		getDelta() {
			return this.delta
		}
		
		getElapsed() {
			return this.elapsed
		}
		
		handleEvent(Wr) {
			document.hidden || (this.currentTime = performance.now() - this.startTime)
		}
		
		dispose() {
			this.autoReset = !1
		}
	},
	dummyCamera = new Camera(),
	geometry = null

function getFullscreenTriangle() {
	if (geometry === null) {
		const Wr = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]),
			ze = new Float32Array([0, 0, 2, 0, 0, 2])
		;(geometry = new BufferGeometry()),
			geometry.setAttribute !== void 0
				? (geometry.setAttribute('position', new BufferAttribute(Wr, 3)),
					geometry.setAttribute('uv', new BufferAttribute(ze, 2)))
				: (geometry.addAttribute('position', new BufferAttribute(Wr, 3)),
					geometry.addAttribute('uv', new BufferAttribute(ze, 2)))
	}
	return geometry
}

var Pass = class gs {
		constructor(ze = 'Pass', Gr = new Scene(), Yr = dummyCamera) {
			;(this.name = ze),
				(this.renderer = null),
				(this.scene = Gr),
				(this.camera = Yr),
				(this.screen = null),
				(this.rtt = !0),
				(this.needsSwap = !0),
				(this.needsDepthTexture = !1),
				(this.enabled = !0)
		}
		
		get renderToScreen() {
			return !this.rtt
		}
		
		set renderToScreen(ze) {
			if (this.rtt === ze) {
				const Gr = this.fullscreenMaterial
				Gr !== null && (Gr.needsUpdate = !0), (this.rtt = !ze)
			}
		}
		
		set mainScene(ze) {
		}
		
		set mainCamera(ze) {
		}
		
		get fullscreenMaterial() {
			return this.screen !== null ? this.screen.material : null
		}
		
		set fullscreenMaterial(ze) {
			let Gr = this.screen
			Gr !== null
				? (Gr.material = ze)
				: ((Gr = new Mesh(getFullscreenTriangle(), ze)),
					(Gr.frustumCulled = !1),
				this.scene === null && (this.scene = new Scene()),
					this.scene.add(Gr),
					(this.screen = Gr))
		}
		
		setRenderer(ze) {
			this.renderer = ze
		}
		
		isEnabled() {
			return this.enabled
		}
		
		setEnabled(ze) {
			this.enabled = ze
		}
		
		getFullscreenMaterial() {
			return this.fullscreenMaterial
		}
		
		setFullscreenMaterial(ze) {
			this.fullscreenMaterial = ze
		}
		
		getDepthTexture() {
			return null
		}
		
		setDepthTexture(ze, Gr = BasicDepthPacking) {
		}
		
		render(ze, Gr, Yr, Kr, Zr) {
			throw new Error('Render method not implemented!')
		}
		
		setSize(ze, Gr) {
		}
		
		initialize(ze, Gr, Yr) {
		}
		
		dispose() {
			for (const ze of Object.keys(this)) {
				const Gr = this[ze]
				;(Gr instanceof WebGLRenderTarget ||
					Gr instanceof Material ||
					Gr instanceof Texture ||
					Gr instanceof gs) &&
				this[ze].dispose()
			}
		}
	},
	ClearMaskPass = class extends Pass {
		constructor() {
			super('ClearMaskPass', null, null), (this.needsSwap = !1)
		}
		
		render(Wr, ze, Gr, Yr, Kr) {
			const Zr = Wr.state.buffers.stencil
			Zr.setLocked(!1), Zr.setTest(!1)
		}
	},
	revision = Number(REVISION.replace(/\D+/g, ''))

function updateFragmentShader(Wr) {
	return revision < 154 ? Wr.replace('colorspace_fragment', 'encodings_fragment') : Wr
}

var copy_default = `#include <common>
#include <dithering_pars_fragment>
#ifdef FRAMEBUFFER_PRECISION_HIGH
uniform mediump sampler2D inputBuffer;
#else
uniform lowp sampler2D inputBuffer;
#endif
uniform float opacity;varying vec2 vUv;void main(){vec4 texel=texture2D(inputBuffer,vUv);gl_FragColor=opacity*texel;
#include <colorspace_fragment>
#include <dithering_fragment>
}`,
	common_default =
		'varying vec2 vUv;void main(){vUv=position.xy*0.5+0.5;gl_Position=vec4(position.xy,1.0,1.0);}',
	CopyMaterial = class extends ShaderMaterial {
		constructor() {
			super({
				name: 'CopyMaterial',
				uniforms: {
					inputBuffer: new Uniform(null),
					opacity: new Uniform(1),
				},
				blending: NoBlending,
				toneMapped: !1,
				depthWrite: !1,
				depthTest: !1,
				fragmentShader: copy_default,
				vertexShader: common_default,
			}),
				(this.fragmentShader = updateFragmentShader(this.fragmentShader))
		}
		
		set inputBuffer(Wr) {
			this.uniforms.inputBuffer.value = Wr
		}
		
		setInputBuffer(Wr) {
			this.uniforms.inputBuffer.value = Wr
		}
		
		getOpacity(Wr) {
			return this.uniforms.opacity.value
		}
		
		setOpacity(Wr) {
			this.uniforms.opacity.value = Wr
		}
	},
	CopyPass = class extends Pass {
		constructor(Wr, ze = !0) {
			super('CopyPass'),
				(this.fullscreenMaterial = new CopyMaterial()),
				(this.needsSwap = !1),
				(this.renderTarget = Wr),
			Wr === void 0 &&
			((this.renderTarget = new WebGLRenderTarget(1, 1, {
				minFilter: LinearFilter,
				magFilter: LinearFilter,
				stencilBuffer: !1,
				depthBuffer: !1,
			})),
				(this.renderTarget.texture.name = 'CopyPass.Target')),
				(this.autoResize = ze)
		}
		
		get resize() {
			return this.autoResize
		}
		
		set resize(Wr) {
			this.autoResize = Wr
		}
		
		get texture() {
			return this.renderTarget.texture
		}
		
		getTexture() {
			return this.renderTarget.texture
		}
		
		setAutoResizeEnabled(Wr) {
			this.autoResize = Wr
		}
		
		render(Wr, ze, Gr, Yr, Kr) {
			;(this.fullscreenMaterial.inputBuffer = ze.texture),
				Wr.setRenderTarget(this.renderToScreen ? null : this.renderTarget),
				Wr.render(this.scene, this.camera)
		}
		
		setSize(Wr, ze) {
			this.autoResize && this.renderTarget.setSize(Wr, ze)
		}
		
		initialize(Wr, ze, Gr) {
			Gr !== void 0 &&
			((this.renderTarget.texture.type = Gr),
				Gr !== UnsignedByteType
					? (this.fullscreenMaterial.defines.FRAMEBUFFER_PRECISION_HIGH = '1')
					: Wr !== null &&
					Wr.outputColorSpace === SRGBColorSpace &&
					(this.renderTarget.texture.colorSpace = SRGBColorSpace))
		}
	},
	color = new Color(),
	ClearPass = class extends Pass {
		constructor(Wr = !0, ze = !0, Gr = !1) {
			super('ClearPass', null, null),
				(this.needsSwap = !1),
				(this.color = Wr),
				(this.depth = ze),
				(this.stencil = Gr),
				(this.overrideClearColor = null),
				(this.overrideClearAlpha = -1)
		}
		
		setClearFlags(Wr, ze, Gr) {
			;(this.color = Wr), (this.depth = ze), (this.stencil = Gr)
		}
		
		getOverrideClearColor() {
			return this.overrideClearColor
		}
		
		setOverrideClearColor(Wr) {
			this.overrideClearColor = Wr
		}
		
		getOverrideClearAlpha() {
			return this.overrideClearAlpha
		}
		
		setOverrideClearAlpha(Wr) {
			this.overrideClearAlpha = Wr
		}
		
		render(Wr, ze, Gr, Yr, Kr) {
			const Zr = this.overrideClearColor,
				Jr = this.overrideClearAlpha,
				Qr = Wr.getClearAlpha(),
				ei = Zr !== null,
				ti = Jr >= 0
			ei
				? (Wr.getClearColor(color), Wr.setClearColor(Zr, ti ? Jr : Qr))
				: ti && Wr.setClearAlpha(Jr),
				Wr.setRenderTarget(this.renderToScreen ? null : ze),
				Wr.clear(this.color, this.depth, this.stencil),
				ei ? Wr.setClearColor(color, Qr) : ti && Wr.setClearAlpha(Qr)
		}
	},
	MaskPass = class extends Pass {
		constructor(Wr, ze) {
			super('MaskPass', Wr, ze),
				(this.needsSwap = !1),
				(this.clearPass = new ClearPass(!1, !1, !0)),
				(this.inverse = !1)
		}
		
		set mainScene(Wr) {
			this.scene = Wr
		}
		
		set mainCamera(Wr) {
			this.camera = Wr
		}
		
		get inverted() {
			return this.inverse
		}
		
		set inverted(Wr) {
			this.inverse = Wr
		}
		
		get clear() {
			return this.clearPass.enabled
		}
		
		set clear(Wr) {
			this.clearPass.enabled = Wr
		}
		
		getClearPass() {
			return this.clearPass
		}
		
		isInverted() {
			return this.inverted
		}
		
		setInverted(Wr) {
			this.inverted = Wr
		}
		
		render(Wr, ze, Gr, Yr, Kr) {
			const Zr = Wr.getContext(),
				Jr = Wr.state.buffers,
				Qr = this.scene,
				ei = this.camera,
				ti = this.clearPass,
				ri = this.inverted ? 0 : 1,
				ni = 1 - ri
			Jr.color.setMask(!1),
				Jr.depth.setMask(!1),
				Jr.color.setLocked(!0),
				Jr.depth.setLocked(!0),
				Jr.stencil.setTest(!0),
				Jr.stencil.setOp(Zr.REPLACE, Zr.REPLACE, Zr.REPLACE),
				Jr.stencil.setFunc(Zr.ALWAYS, ri, 4294967295),
				Jr.stencil.setClear(ni),
				Jr.stencil.setLocked(!0),
			this.clearPass.enabled &&
			(this.renderToScreen ? ti.render(Wr, null) : (ti.render(Wr, ze), ti.render(Wr, Gr))),
				this.renderToScreen
					? (Wr.setRenderTarget(null), Wr.render(Qr, ei))
					: (Wr.setRenderTarget(ze), Wr.render(Qr, ei), Wr.setRenderTarget(Gr), Wr.render(Qr, ei)),
				Jr.color.setLocked(!1),
				Jr.depth.setLocked(!1),
				Jr.stencil.setLocked(!1),
				Jr.stencil.setFunc(Zr.EQUAL, 1, 4294967295),
				Jr.stencil.setOp(Zr.KEEP, Zr.KEEP, Zr.KEEP),
				Jr.stencil.setLocked(!0)
		}
	},
	EffectComposer = class {
		constructor(
			Wr = null,
			{
				depthBuffer: ze = !0,
				stencilBuffer: Gr = !1,
				multisampling: Yr = 0,
				frameBufferType: Kr,
			} = {},
		) {
			;(this.renderer = null),
				(this.inputBuffer = this.createBuffer(ze, Gr, Kr, Yr)),
				(this.outputBuffer = this.inputBuffer.clone()),
				(this.copyPass = new CopyPass()),
				(this.depthTexture = null),
				(this.passes = []),
				(this.timer = new Timer()),
				(this.autoRenderToScreen = !0),
				this.setRenderer(Wr)
		}
		
		get multisampling() {
			return this.inputBuffer.samples || 0
		}
		
		set multisampling(Wr) {
			const ze = this.inputBuffer,
				Gr = this.multisampling
			Gr > 0 && Wr > 0
				? ((this.inputBuffer.samples = Wr),
					(this.outputBuffer.samples = Wr),
					this.inputBuffer.dispose(),
					this.outputBuffer.dispose())
				: Gr !== Wr &&
				(this.inputBuffer.dispose(),
					this.outputBuffer.dispose(),
					(this.inputBuffer = this.createBuffer(
						ze.depthBuffer,
						ze.stencilBuffer,
						ze.texture.type,
						Wr,
					)),
					(this.inputBuffer.depthTexture = this.depthTexture),
					(this.outputBuffer = this.inputBuffer.clone()))
		}
		
		getTimer() {
			return this.timer
		}
		
		getRenderer() {
			return this.renderer
		}
		
		setRenderer(Wr) {
			if (((this.renderer = Wr), Wr !== null)) {
				const ze = Wr.getSize(new Vector2()),
					Gr = Wr.getContext().getContextAttributes().alpha,
					Yr = this.inputBuffer.texture.type
				Yr === UnsignedByteType &&
				Wr.outputColorSpace === SRGBColorSpace &&
				((this.inputBuffer.texture.colorSpace = SRGBColorSpace),
					(this.outputBuffer.texture.colorSpace = SRGBColorSpace),
					this.inputBuffer.dispose(),
					this.outputBuffer.dispose()),
					(Wr.autoClear = !1),
					this.setSize(ze.width, ze.height)
				for (const Kr of this.passes) Kr.initialize(Wr, Gr, Yr)
			}
		}
		
		replaceRenderer(Wr, ze = !0) {
			const Gr = this.renderer,
				Yr = Gr.domElement.parentNode
			return (
				this.setRenderer(Wr),
				ze && Yr !== null && (Yr.removeChild(Gr.domElement), Yr.appendChild(Wr.domElement)),
					Gr
			)
		}
		
		createDepthTexture() {
			const Wr = (this.depthTexture = new DepthTexture())
			return (
				(this.inputBuffer.depthTexture = Wr),
					this.inputBuffer.dispose(),
					this.inputBuffer.stencilBuffer
						? ((Wr.format = DepthStencilFormat), (Wr.type = UnsignedInt248Type))
						: (Wr.type = UnsignedIntType),
					Wr
			)
		}
		
		deleteDepthTexture() {
			if (this.depthTexture !== null) {
				this.depthTexture.dispose(),
					(this.depthTexture = null),
					(this.inputBuffer.depthTexture = null),
					this.inputBuffer.dispose()
				for (const Wr of this.passes) Wr.setDepthTexture(null)
			}
		}
		
		createBuffer(Wr, ze, Gr, Yr) {
			const Kr = this.renderer,
				Zr = Kr === null ? new Vector2() : Kr.getDrawingBufferSize(new Vector2()),
				Jr = {
					minFilter: LinearFilter,
					magFilter: LinearFilter,
					stencilBuffer: ze,
					depthBuffer: Wr,
					type: Gr,
				},
				Qr = new WebGLRenderTarget(Zr.width, Zr.height, Jr)
			return (
				Yr > 0 && ((Qr.ignoreDepthForMultisampleCopy = !1), (Qr.samples = Yr)),
				Gr === UnsignedByteType &&
				Kr !== null &&
				Kr.outputColorSpace === SRGBColorSpace &&
				(Qr.texture.colorSpace = SRGBColorSpace),
					(Qr.texture.name = 'EffectComposer.Buffer'),
					(Qr.texture.generateMipmaps = !1),
					Qr
			)
		}
		
		setMainScene(Wr) {
			for (const ze of this.passes) ze.mainScene = Wr
		}
		
		setMainCamera(Wr) {
			for (const ze of this.passes) ze.mainCamera = Wr
		}
		
		addPass(Wr, ze) {
			const Gr = this.passes,
				Yr = this.renderer,
				Kr = Yr.getDrawingBufferSize(new Vector2()),
				Zr = Yr.getContext().getContextAttributes().alpha,
				Jr = this.inputBuffer.texture.type
			if (
				(Wr.setRenderer(Yr),
					Wr.setSize(Kr.width, Kr.height),
					Wr.initialize(Yr, Zr, Jr),
				this.autoRenderToScreen &&
				(Gr.length > 0 && (Gr[Gr.length - 1].renderToScreen = !1),
				Wr.renderToScreen && (this.autoRenderToScreen = !1)),
					ze !== void 0 ? Gr.splice(ze, 0, Wr) : Gr.push(Wr),
				this.autoRenderToScreen && (Gr[Gr.length - 1].renderToScreen = !0),
				Wr.needsDepthTexture || this.depthTexture !== null)
			)
				if (this.depthTexture === null) {
					const Qr = this.createDepthTexture()
					for (Wr of Gr) Wr.setDepthTexture(Qr)
				} else Wr.setDepthTexture(this.depthTexture)
		}
		
		removePass(Wr) {
			const ze = this.passes,
				Gr = ze.indexOf(Wr)
			if (Gr !== -1 && ze.splice(Gr, 1).length > 0) {
				if (this.depthTexture !== null) {
					const Zr = (Qr, ei) => Qr || ei.needsDepthTexture
					ze.reduce(Zr, !1) ||
					(Wr.getDepthTexture() === this.depthTexture && Wr.setDepthTexture(null),
						this.deleteDepthTexture())
				}
				this.autoRenderToScreen &&
				Gr === ze.length &&
				((Wr.renderToScreen = !1), ze.length > 0 && (ze[ze.length - 1].renderToScreen = !0))
			}
		}
		
		removeAllPasses() {
			const Wr = this.passes
			this.deleteDepthTexture(),
			Wr.length > 0 &&
			(this.autoRenderToScreen && (Wr[Wr.length - 1].renderToScreen = !1), (this.passes = []))
		}
		
		render(Wr) {
			const ze = this.renderer,
				Gr = this.copyPass
			let Yr = this.inputBuffer,
				Kr = this.outputBuffer,
				Zr = !1,
				Jr,
				Qr,
				ei
			Wr === void 0 && (this.timer.update(), (Wr = this.timer.getDelta()))
			for (const ti of this.passes)
				ti.enabled &&
				(ti.render(ze, Yr, Kr, Wr, Zr),
				ti.needsSwap &&
				(Zr &&
				((Gr.renderToScreen = ti.renderToScreen),
					(Jr = ze.getContext()),
					(Qr = ze.state.buffers.stencil),
					Qr.setFunc(Jr.NOTEQUAL, 1, 4294967295),
					Gr.render(ze, Yr, Kr, Wr, Zr),
					Qr.setFunc(Jr.EQUAL, 1, 4294967295)),
					(ei = Yr),
					(Yr = Kr),
					(Kr = ei)),
					ti instanceof MaskPass ? (Zr = !0) : ti instanceof ClearMaskPass && (Zr = !1))
		}
		
		setSize(Wr, ze, Gr) {
			const Yr = this.renderer,
				Kr = Yr.getSize(new Vector2())
			;(Wr === void 0 || ze === void 0) && ((Wr = Kr.width), (ze = Kr.height)),
			(Kr.width !== Wr || Kr.height !== ze) && Yr.setSize(Wr, ze, Gr)
			const Zr = Yr.getDrawingBufferSize(new Vector2())
			this.inputBuffer.setSize(Zr.width, Zr.height), this.outputBuffer.setSize(Zr.width, Zr.height)
			for (const Jr of this.passes) Jr.setSize(Zr.width, Zr.height)
		}
		
		reset() {
			this.dispose(), (this.autoRenderToScreen = !0)
		}
		
		dispose() {
			for (const Wr of this.passes) Wr.dispose()
			;
			(this.passes = []),
			this.inputBuffer !== null && this.inputBuffer.dispose(),
			this.outputBuffer !== null && this.outputBuffer.dispose(),
				this.deleteDepthTexture(),
				this.copyPass.dispose(),
				this.timer.dispose()
		}
	},
	EffectAttribute = {
		NONE: 0,
		DEPTH: 1,
		CONVOLUTION: 2,
	},
	EffectShaderSection = {
		FRAGMENT_HEAD: 'FRAGMENT_HEAD',
		FRAGMENT_MAIN_UV: 'FRAGMENT_MAIN_UV',
		FRAGMENT_MAIN_IMAGE: 'FRAGMENT_MAIN_IMAGE',
		VERTEX_HEAD: 'VERTEX_HEAD',
		VERTEX_MAIN_SUPPORT: 'VERTEX_MAIN_SUPPORT',
	},
	EffectShaderData = class {
		constructor() {
			;(this.shaderParts = new Map([
				[EffectShaderSection.FRAGMENT_HEAD, null],
				[EffectShaderSection.FRAGMENT_MAIN_UV, null],
				[EffectShaderSection.FRAGMENT_MAIN_IMAGE, null],
				[EffectShaderSection.VERTEX_HEAD, null],
				[EffectShaderSection.VERTEX_MAIN_SUPPORT, null],
			])),
				(this.defines = new Map()),
				(this.uniforms = new Map()),
				(this.blendModes = new Map()),
				(this.extensions = new Set()),
				(this.attributes = EffectAttribute.NONE),
				(this.varyings = new Set()),
				(this.uvTransformation = !1),
				(this.readDepth = !1),
				(this.colorSpace = LinearSRGBColorSpace)
		}
	},
	workaroundEnabled = !1,
	OverrideMaterialManager = class {
		constructor(Wr = null) {
			;(this.originalMaterials = new Map()),
				(this.material = null),
				(this.materials = null),
				(this.materialsBackSide = null),
				(this.materialsDoubleSide = null),
				(this.materialsFlatShaded = null),
				(this.materialsFlatShadedBackSide = null),
				(this.materialsFlatShadedDoubleSide = null),
				this.setMaterial(Wr),
				(this.meshCount = 0),
				(this.replaceMaterial = (ze) => {
					if (ze.isMesh) {
						let Gr
						if (ze.material.flatShading)
							switch (ze.material.side) {
								case DoubleSide:
									Gr = this.materialsFlatShadedDoubleSide
									break
								case BackSide:
									Gr = this.materialsFlatShadedBackSide
									break
								default:
									Gr = this.materialsFlatShaded
									break
							}
						else
							switch (ze.material.side) {
								case DoubleSide:
									Gr = this.materialsDoubleSide
									break
								case BackSide:
									Gr = this.materialsBackSide
									break
								default:
									Gr = this.materials
									break
							}
						this.originalMaterials.set(ze, ze.material),
							ze.isSkinnedMesh
								? (ze.material = Gr[2])
								: ze.isInstancedMesh
									? (ze.material = Gr[1])
									: (ze.material = Gr[0]),
							++this.meshCount
					}
				})
		}
		
		static get workaroundEnabled() {
			return workaroundEnabled
		}
		
		static set workaroundEnabled(Wr) {
			workaroundEnabled = Wr
		}
		
		cloneMaterial(Wr) {
			if (!(Wr instanceof ShaderMaterial)) return Wr.clone()
			const ze = Wr.uniforms,
				Gr = new Map()
			for (const Kr in ze) {
				const Zr = ze[Kr].value
				Zr.isRenderTargetTexture && ((ze[Kr].value = null), Gr.set(Kr, Zr))
			}
			const Yr = Wr.clone()
			for (const Kr of Gr) (ze[Kr[0]].value = Kr[1]), (Yr.uniforms[Kr[0]].value = Kr[1])
			return Yr
		}
		
		setMaterial(Wr) {
			if ((this.disposeMaterials(), (this.material = Wr), Wr !== null)) {
				const ze = (this.materials = [
					this.cloneMaterial(Wr),
					this.cloneMaterial(Wr),
					this.cloneMaterial(Wr),
				])
				for (const Gr of ze) (Gr.uniforms = Object.assign({}, Wr.uniforms)), (Gr.side = FrontSide)
				;
				(ze[2].skinning = !0),
					(this.materialsBackSide = ze.map((Gr) => {
						const Yr = this.cloneMaterial(Gr)
						return (Yr.uniforms = Object.assign({}, Wr.uniforms)), (Yr.side = BackSide), Yr
					})),
					(this.materialsDoubleSide = ze.map((Gr) => {
						const Yr = this.cloneMaterial(Gr)
						return (Yr.uniforms = Object.assign({}, Wr.uniforms)), (Yr.side = DoubleSide), Yr
					})),
					(this.materialsFlatShaded = ze.map((Gr) => {
						const Yr = this.cloneMaterial(Gr)
						return (Yr.uniforms = Object.assign({}, Wr.uniforms)), (Yr.flatShading = !0), Yr
					})),
					(this.materialsFlatShadedBackSide = ze.map((Gr) => {
						const Yr = this.cloneMaterial(Gr)
						return (
							(Yr.uniforms = Object.assign({}, Wr.uniforms)),
								(Yr.flatShading = !0),
								(Yr.side = BackSide),
								Yr
						)
					})),
					(this.materialsFlatShadedDoubleSide = ze.map((Gr) => {
						const Yr = this.cloneMaterial(Gr)
						return (
							(Yr.uniforms = Object.assign({}, Wr.uniforms)),
								(Yr.flatShading = !0),
								(Yr.side = DoubleSide),
								Yr
						)
					}))
			}
		}
		
		render(Wr, ze, Gr) {
			const Yr = Wr.shadowMap.enabled
			if (((Wr.shadowMap.enabled = !1), workaroundEnabled)) {
				const Kr = this.originalMaterials
				;(this.meshCount = 0), ze.traverse(this.replaceMaterial), Wr.render(ze, Gr)
				for (const Zr of Kr) Zr[0].material = Zr[1]
				this.meshCount !== Kr.size && Kr.clear()
			} else {
				const Kr = ze.overrideMaterial
				;(ze.overrideMaterial = this.material), Wr.render(ze, Gr), (ze.overrideMaterial = Kr)
			}
			Wr.shadowMap.enabled = Yr
		}
		
		disposeMaterials() {
			if (this.material !== null) {
				const Wr = this.materials
					.concat(this.materialsBackSide)
					.concat(this.materialsDoubleSide)
					.concat(this.materialsFlatShaded)
					.concat(this.materialsFlatShadedBackSide)
					.concat(this.materialsFlatShadedDoubleSide)
				for (const ze of Wr) ze.dispose()
			}
		}
		
		dispose() {
			this.originalMaterials.clear(), this.disposeMaterials()
		}
	},
	AUTO_SIZE = -1,
	Resolution = class extends EventDispatcher {
		constructor(Wr, ze = AUTO_SIZE, Gr = AUTO_SIZE, Yr = 1) {
			super(),
				(this.resizable = Wr),
				(this.baseSize = new Vector2(1, 1)),
				(this.preferredSize = new Vector2(ze, Gr)),
				(this.target = this.preferredSize),
				(this.s = Yr),
				(this.effectiveSize = new Vector2()),
				this.addEventListener('change', () => this.updateEffectiveSize()),
				this.updateEffectiveSize()
		}
		
		static get AUTO_SIZE() {
			return AUTO_SIZE
		}
		
		get width() {
			return this.effectiveSize.width
		}
		
		set width(Wr) {
			this.preferredWidth = Wr
		}
		
		get height() {
			return this.effectiveSize.height
		}
		
		set height(Wr) {
			this.preferredHeight = Wr
		}
		
		get scale() {
			return this.s
		}
		
		set scale(Wr) {
			this.s !== Wr &&
			((this.s = Wr),
				this.preferredSize.setScalar(AUTO_SIZE),
				this.dispatchEvent({
					type: 'change',
				}),
				this.resizable.setSize(this.baseSize.width, this.baseSize.height))
		}
		
		get baseWidth() {
			return this.baseSize.width
		}
		
		set baseWidth(Wr) {
			this.baseSize.width !== Wr &&
			((this.baseSize.width = Wr),
				this.dispatchEvent({
					type: 'change',
				}),
				this.resizable.setSize(this.baseSize.width, this.baseSize.height))
		}
		
		get baseHeight() {
			return this.baseSize.height
		}
		
		set baseHeight(Wr) {
			this.baseSize.height !== Wr &&
			((this.baseSize.height = Wr),
				this.dispatchEvent({
					type: 'change',
				}),
				this.resizable.setSize(this.baseSize.width, this.baseSize.height))
		}
		
		get preferredWidth() {
			return this.preferredSize.width
		}
		
		set preferredWidth(Wr) {
			this.preferredSize.width !== Wr &&
			((this.preferredSize.width = Wr),
				this.dispatchEvent({
					type: 'change',
				}),
				this.resizable.setSize(this.baseSize.width, this.baseSize.height))
		}
		
		get preferredHeight() {
			return this.preferredSize.height
		}
		
		set preferredHeight(Wr) {
			this.preferredSize.height !== Wr &&
			((this.preferredSize.height = Wr),
				this.dispatchEvent({
					type: 'change',
				}),
				this.resizable.setSize(this.baseSize.width, this.baseSize.height))
		}
		
		updateEffectiveSize() {
			const Wr = this.baseSize,
				ze = this.preferredSize,
				Gr = this.effectiveSize,
				Yr = this.scale
			ze.width !== AUTO_SIZE
				? (Gr.width = ze.width)
				: ze.height !== AUTO_SIZE
					? (Gr.width = Math.round(ze.height * (Wr.width / Math.max(Wr.height, 1))))
					: (Gr.width = Math.round(Wr.width * Yr)),
				ze.height !== AUTO_SIZE
					? (Gr.height = ze.height)
					: ze.width !== AUTO_SIZE
						? (Gr.height = Math.round(ze.width / Math.max(Wr.width / Math.max(Wr.height, 1), 1)))
						: (Gr.height = Math.round(Wr.height * Yr))
		}
		
		getWidth() {
			return this.width
		}
		
		getHeight() {
			return this.height
		}
		
		getScale() {
			return this.scale
		}
		
		setScale(Wr) {
			this.scale = Wr
		}
		
		getBaseWidth() {
			return this.baseWidth
		}
		
		setBaseWidth(Wr) {
			this.baseWidth = Wr
		}
		
		getBaseHeight() {
			return this.baseHeight
		}
		
		setBaseHeight(Wr) {
			this.baseHeight = Wr
		}
		
		setBaseSize(Wr, ze) {
			;(this.baseSize.width !== Wr || this.baseSize.height !== ze) &&
			(this.baseSize.set(Wr, ze),
				this.dispatchEvent({
					type: 'change',
				}),
				this.resizable.setSize(this.baseSize.width, this.baseSize.height))
		}
		
		getPreferredWidth() {
			return this.preferredWidth
		}
		
		setPreferredWidth(Wr) {
			this.preferredWidth = Wr
		}
		
		getPreferredHeight() {
			return this.preferredHeight
		}
		
		setPreferredHeight(Wr) {
			this.preferredHeight = Wr
		}
		
		setPreferredSize(Wr, ze) {
			;(this.preferredSize.width !== Wr || this.preferredSize.height !== ze) &&
			(this.preferredSize.set(Wr, ze),
				this.dispatchEvent({
					type: 'change',
				}),
				this.resizable.setSize(this.baseSize.width, this.baseSize.height))
		}
		
		copy(Wr) {
			;(this.s = Wr.scale),
				this.baseSize.set(Wr.baseWidth, Wr.baseHeight),
				this.preferredSize.set(Wr.preferredWidth, Wr.preferredHeight),
				this.dispatchEvent({
					type: 'change',
				}),
				this.resizable.setSize(this.baseSize.width, this.baseSize.height)
		}
	},
	BlendFunction = {
		SKIP: 9,
		SET: 30,
		ADD: 0,
		ALPHA: 1,
		AVERAGE: 2,
		COLOR: 3,
		COLOR_BURN: 4,
		COLOR_DODGE: 5,
		DARKEN: 6,
		DIFFERENCE: 7,
		DIVIDE: 8,
		DST: 9,
		EXCLUSION: 10,
		HARD_LIGHT: 11,
		HARD_MIX: 12,
		HUE: 13,
		INVERT: 14,
		INVERT_RGB: 15,
		LIGHTEN: 16,
		LINEAR_BURN: 17,
		LINEAR_DODGE: 18,
		LINEAR_LIGHT: 19,
		LUMINOSITY: 20,
		MULTIPLY: 21,
		NEGATION: 22,
		NORMAL: 23,
		OVERLAY: 24,
		PIN_LIGHT: 25,
		REFLECT: 26,
		SATURATION: 27,
		SCREEN: 28,
		SOFT_LIGHT: 29,
		SRC: 30,
		SUBTRACT: 31,
		VIVID_LIGHT: 32,
	},
	add_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,x+y,opacity);}',
	alpha_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,y,min(y.a,opacity));}',
	average_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,(x+y)*0.5,opacity);}',
	color_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec3 xHSL=RGBToHSL(x.rgb);vec3 yHSL=RGBToHSL(y.rgb);vec3 z=HSLToRGB(vec3(yHSL.rg,xHSL.b));return vec4(mix(x.rgb,z,opacity),y.a);}',
	color_burn_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec4 z=mix(step(0.0,y)*(1.0-min(vec4(1.0),(1.0-x)/y)),vec4(1.0),step(1.0,x));return mix(x,z,opacity);}',
	color_dodge_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec4 z=step(0.0,x)*mix(min(vec4(1.0),x/max(1.0-y,1e-9)),vec4(1.0),step(1.0,y));return mix(x,z,opacity);}',
	darken_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,min(x,y),opacity);}',
	difference_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,abs(x-y),opacity);}',
	divide_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,x/max(y,1e-12),opacity);}',
	exclusion_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,(x+y-2.0*x*y),opacity);}',
	hard_light_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec4 a=min(x,1.0),b=min(y,1.0);vec4 z=mix(2.0*a*b,1.0-2.0*(1.0-a)*(1.0-b),step(0.5,y));return mix(x,z,opacity);}',
	hard_mix_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,step(1.0,x+y),opacity);}',
	hue_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec3 xHSL=RGBToHSL(x.rgb);vec3 yHSL=RGBToHSL(y.rgb);vec3 z=HSLToRGB(vec3(yHSL.r,xHSL.gb));return vec4(mix(x.rgb,z,opacity),y.a);}',
	invert_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,1.0-y,opacity);}',
	invert_rgb_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,y*(1.0-x),opacity);}',
	lighten_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,max(x,y),opacity);}',
	linear_burn_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,clamp(y+x-1.0,0.0,1.0),opacity);}',
	linear_dodge_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,min(x+y,1.0),opacity);}',
	linear_light_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,clamp(2.0*y+x-1.0,0.0,1.0),opacity);}',
	luminosity_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec3 xHSL=RGBToHSL(x.rgb);vec3 yHSL=RGBToHSL(y.rgb);vec3 z=HSLToRGB(vec3(xHSL.rg,yHSL.b));return vec4(mix(x.rgb,z,opacity),y.a);}',
	multiply_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,x*y,opacity);}',
	negation_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,1.0-abs(1.0-x-y),opacity);}',
	normal_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,y,opacity);}',
	overlay_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec4 z=mix(2.0*y*x,1.0-2.0*(1.0-y)*(1.0-x),step(0.5,x));return mix(x,z,opacity);}',
	pin_light_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec4 y2=2.0*y;vec4 z=mix(mix(y2,x,step(0.5*x,y)),max(vec4(0.0),y2-1.0),step(x,(y2-1.0)));return mix(x,z,opacity);}',
	reflect_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec4 z=mix(min(x*x/max(1.0-y,1e-12),1.0),y,step(1.0,y));return mix(x,z,opacity);}',
	saturation_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec3 xHSL=RGBToHSL(x.rgb);vec3 yHSL=RGBToHSL(y.rgb);vec3 z=HSLToRGB(vec3(xHSL.r,yHSL.g,xHSL.b));return vec4(mix(x.rgb,z,opacity),y.a);}',
	screen_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,x+y-min(x*y,1.0),opacity);}',
	soft_light_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec4 y2=2.0*y;vec4 w=step(0.5,y);vec4 z=mix(x-(1.0-y2)*x*(1.0-x),mix(x+(y2-1.0)*(sqrt(x)-x),x+(y2-1.0)*x*((16.0*x-12.0)*x+3.0),w*(1.0-step(0.25,x))),w);return mix(x,z,opacity);}',
	src_default = 'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return y;}',
	subtract_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,max(x+y-1.0,0.0),opacity);}',
	vivid_light_default =
		'vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec4 z=mix(max(1.0-min((1.0-x)/(2.0*y),1.0),0.0),min(x/(2.0*(1.0-y)),1.0),step(0.5,y));return mix(x,z,opacity);}',
	blendFunctions = new Map([
		[BlendFunction.ADD, add_default],
		[BlendFunction.ALPHA, alpha_default],
		[BlendFunction.AVERAGE, average_default],
		[BlendFunction.COLOR, color_default],
		[BlendFunction.COLOR_BURN, color_burn_default],
		[BlendFunction.COLOR_DODGE, color_dodge_default],
		[BlendFunction.DARKEN, darken_default],
		[BlendFunction.DIFFERENCE, difference_default],
		[BlendFunction.DIVIDE, divide_default],
		[BlendFunction.DST, null],
		[BlendFunction.EXCLUSION, exclusion_default],
		[BlendFunction.HARD_LIGHT, hard_light_default],
		[BlendFunction.HARD_MIX, hard_mix_default],
		[BlendFunction.HUE, hue_default],
		[BlendFunction.INVERT, invert_default],
		[BlendFunction.INVERT_RGB, invert_rgb_default],
		[BlendFunction.LIGHTEN, lighten_default],
		[BlendFunction.LINEAR_BURN, linear_burn_default],
		[BlendFunction.LINEAR_DODGE, linear_dodge_default],
		[BlendFunction.LINEAR_LIGHT, linear_light_default],
		[BlendFunction.LUMINOSITY, luminosity_default],
		[BlendFunction.MULTIPLY, multiply_default],
		[BlendFunction.NEGATION, negation_default],
		[BlendFunction.NORMAL, normal_default],
		[BlendFunction.OVERLAY, overlay_default],
		[BlendFunction.PIN_LIGHT, pin_light_default],
		[BlendFunction.REFLECT, reflect_default],
		[BlendFunction.SATURATION, saturation_default],
		[BlendFunction.SCREEN, screen_default],
		[BlendFunction.SOFT_LIGHT, soft_light_default],
		[BlendFunction.SRC, src_default],
		[BlendFunction.SUBTRACT, subtract_default],
		[BlendFunction.VIVID_LIGHT, vivid_light_default],
	]),
	BlendMode = class extends EventDispatcher {
		constructor(Wr, ze = 1) {
			super(), (this._blendFunction = Wr), (this.opacity = new Uniform(ze))
		}
		
		get blendFunction() {
			return this._blendFunction
		}
		
		set blendFunction(Wr) {
			;(this._blendFunction = Wr),
				this.dispatchEvent({
					type: 'change',
				})
		}
		
		getOpacity() {
			return this.opacity.value
		}
		
		setOpacity(Wr) {
			this.opacity.value = Wr
		}
		
		getBlendFunction() {
			return this.blendFunction
		}
		
		setBlendFunction(Wr) {
			this.blendFunction = Wr
		}
		
		getShaderCode() {
			return blendFunctions.get(this.blendFunction)
		}
	},
	KernelSize = {
		VERY_SMALL: 0,
		SMALL: 1,
		MEDIUM: 2,
		LARGE: 3,
		VERY_LARGE: 4,
		HUGE: 5,
	},
	convolution_kawase_default = `#ifdef FRAMEBUFFER_PRECISION_HIGH
uniform mediump sampler2D inputBuffer;
#else
uniform lowp sampler2D inputBuffer;
#endif
varying vec2 vUv0;varying vec2 vUv1;varying vec2 vUv2;varying vec2 vUv3;void main(){vec4 sum=texture2D(inputBuffer,vUv0);sum+=texture2D(inputBuffer,vUv1);sum+=texture2D(inputBuffer,vUv2);sum+=texture2D(inputBuffer,vUv3);gl_FragColor=sum*0.25;
#include <colorspace_fragment>
}`,
	convolution_kawase_default2 =
		'uniform vec4 texelSize;uniform float kernel;uniform float scale;varying vec2 vUv0;varying vec2 vUv1;varying vec2 vUv2;varying vec2 vUv3;void main(){vec2 uv=position.xy*0.5+0.5;vec2 dUv=(texelSize.xy*vec2(kernel)+texelSize.zw)*scale;vUv0=vec2(uv.x-dUv.x,uv.y+dUv.y);vUv1=vec2(uv.x+dUv.x,uv.y+dUv.y);vUv2=vec2(uv.x+dUv.x,uv.y-dUv.y);vUv3=vec2(uv.x-dUv.x,uv.y-dUv.y);gl_Position=vec4(position.xy,1.0,1.0);}',
	kernelPresets = [
		new Float32Array([0, 0]),
		new Float32Array([0, 1, 1]),
		new Float32Array([0, 1, 1, 2]),
		new Float32Array([0, 1, 2, 2, 3]),
		new Float32Array([0, 1, 2, 3, 4, 4, 5]),
		new Float32Array([0, 1, 2, 3, 4, 5, 7, 8, 9, 10]),
	],
	KawaseBlurMaterial = class extends ShaderMaterial {
		constructor(Wr = new Vector4()) {
			super({
				name: 'KawaseBlurMaterial',
				uniforms: {
					inputBuffer: new Uniform(null),
					texelSize: new Uniform(new Vector4()),
					scale: new Uniform(1),
					kernel: new Uniform(0),
				},
				blending: NoBlending,
				toneMapped: !1,
				depthWrite: !1,
				depthTest: !1,
				fragmentShader: convolution_kawase_default,
				vertexShader: convolution_kawase_default2,
			}),
				(this.fragmentShader = updateFragmentShader(this.fragmentShader)),
				this.setTexelSize(Wr.x, Wr.y),
				(this.kernelSize = KernelSize.MEDIUM)
		}
		
		set inputBuffer(Wr) {
			this.uniforms.inputBuffer.value = Wr
		}
		
		get kernelSequence() {
			return kernelPresets[this.kernelSize]
		}
		
		get scale() {
			return this.uniforms.scale.value
		}
		
		set scale(Wr) {
			this.uniforms.scale.value = Wr
		}
		
		get kernel() {
			return this.uniforms.kernel.value
		}
		
		set kernel(Wr) {
			this.uniforms.kernel.value = Wr
		}
		
		setInputBuffer(Wr) {
			this.inputBuffer = Wr
		}
		
		getScale() {
			return this.uniforms.scale.value
		}
		
		setScale(Wr) {
			this.uniforms.scale.value = Wr
		}
		
		getKernel() {
			return null
		}
		
		setKernel(Wr) {
			this.kernel = Wr
		}
		
		setTexelSize(Wr, ze) {
			this.uniforms.texelSize.value.set(Wr, ze, Wr * 0.5, ze * 0.5)
		}
		
		setSize(Wr, ze) {
			const Gr = 1 / Wr,
				Yr = 1 / ze
			this.uniforms.texelSize.value.set(Gr, Yr, Gr * 0.5, Yr * 0.5)
		}
	},
	KawaseBlurPass = class extends Pass {
		constructor({
			            kernelSize: Wr = KernelSize.MEDIUM,
			            resolutionScale: ze = 0.5,
			            width: Gr = Resolution.AUTO_SIZE,
			            height: Yr = Resolution.AUTO_SIZE,
			            resolutionX: Kr = Gr,
			            resolutionY: Zr = Yr,
		            } = {}) {
			super('KawaseBlurPass'),
				(this.renderTargetA = new WebGLRenderTarget(1, 1, {
					depthBuffer: !1,
				})),
				(this.renderTargetA.texture.name = 'Blur.Target.A'),
				(this.renderTargetB = this.renderTargetA.clone()),
				(this.renderTargetB.texture.name = 'Blur.Target.B')
			const Jr = (this.resolution = new Resolution(this, Kr, Zr, ze))
			Jr.addEventListener('change', (Qr) => this.setSize(Jr.baseWidth, Jr.baseHeight)),
				(this._blurMaterial = new KawaseBlurMaterial()),
				(this._blurMaterial.kernelSize = Wr),
				(this.copyMaterial = new CopyMaterial())
		}
		
		static get AUTO_SIZE() {
			return Resolution.AUTO_SIZE
		}
		
		get blurMaterial() {
			return this._blurMaterial
		}
		
		set blurMaterial(Wr) {
			this._blurMaterial = Wr
		}
		
		get dithering() {
			return this.copyMaterial.dithering
		}
		
		set dithering(Wr) {
			this.copyMaterial.dithering = Wr
		}
		
		get kernelSize() {
			return this.blurMaterial.kernelSize
		}
		
		set kernelSize(Wr) {
			this.blurMaterial.kernelSize = Wr
		}
		
		get width() {
			return this.resolution.width
		}
		
		set width(Wr) {
			this.resolution.preferredWidth = Wr
		}
		
		get height() {
			return this.resolution.height
		}
		
		set height(Wr) {
			this.resolution.preferredHeight = Wr
		}
		
		get scale() {
			return this.blurMaterial.scale
		}
		
		set scale(Wr) {
			this.blurMaterial.scale = Wr
		}
		
		getResolution() {
			return this.resolution
		}
		
		getScale() {
			return this.blurMaterial.scale
		}
		
		setScale(Wr) {
			this.blurMaterial.scale = Wr
		}
		
		getKernelSize() {
			return this.kernelSize
		}
		
		setKernelSize(Wr) {
			this.kernelSize = Wr
		}
		
		getResolutionScale() {
			return this.resolution.scale
		}
		
		setResolutionScale(Wr) {
			this.resolution.scale = Wr
		}
		
		render(Wr, ze, Gr, Yr, Kr) {
			const Zr = this.scene,
				Jr = this.camera,
				Qr = this.renderTargetA,
				ei = this.renderTargetB,
				ti = this.blurMaterial,
				ri = ti.kernelSequence
			let ni = ze
			this.fullscreenMaterial = ti
			for (let ii = 0, si = ri.length; ii < si; ++ii) {
				const li = ii & 1 ? ei : Qr
				;(ti.kernel = ri[ii]),
					(ti.inputBuffer = ni.texture),
					Wr.setRenderTarget(li),
					Wr.render(Zr, Jr),
					(ni = li)
			}
			;(this.fullscreenMaterial = this.copyMaterial),
				(this.copyMaterial.inputBuffer = ni.texture),
				Wr.setRenderTarget(this.renderToScreen ? null : Gr),
				Wr.render(Zr, Jr)
		}
		
		setSize(Wr, ze) {
			const Gr = this.resolution
			Gr.setBaseSize(Wr, ze)
			const Yr = Gr.width,
				Kr = Gr.height
			this.renderTargetA.setSize(Yr, Kr),
				this.renderTargetB.setSize(Yr, Kr),
				this.blurMaterial.setSize(Wr, ze)
		}
		
		initialize(Wr, ze, Gr) {
			Gr !== void 0 &&
			((this.renderTargetA.texture.type = Gr),
				(this.renderTargetB.texture.type = Gr),
				Gr !== UnsignedByteType
					? ((this.blurMaterial.defines.FRAMEBUFFER_PRECISION_HIGH = '1'),
						(this.copyMaterial.defines.FRAMEBUFFER_PRECISION_HIGH = '1'))
					: Wr !== null &&
					Wr.outputColorSpace === SRGBColorSpace &&
					((this.renderTargetA.texture.colorSpace = SRGBColorSpace),
						(this.renderTargetB.texture.colorSpace = SRGBColorSpace)))
		}
	},
	Effect = class extends EventDispatcher {
		constructor(
			Wr,
			ze,
			{
				attributes: Gr = EffectAttribute.NONE,
				blendFunction: Yr = BlendFunction.NORMAL,
				defines: Kr = new Map(),
				uniforms: Zr = new Map(),
				extensions: Jr = null,
				vertexShader: Qr = null,
			} = {},
		) {
			super(),
				(this.name = Wr),
				(this.renderer = null),
				(this.attributes = Gr),
				(this.fragmentShader = ze),
				(this.vertexShader = Qr),
				(this.defines = Kr),
				(this.uniforms = Zr),
				(this.extensions = Jr),
				(this.blendMode = new BlendMode(Yr)),
				this.blendMode.addEventListener('change', (ei) => this.setChanged()),
				(this._inputColorSpace = LinearSRGBColorSpace),
				(this._outputColorSpace = NoColorSpace)
		}
		
		get inputColorSpace() {
			return this._inputColorSpace
		}
		
		set inputColorSpace(Wr) {
			;(this._inputColorSpace = Wr), this.setChanged()
		}
		
		get outputColorSpace() {
			return this._outputColorSpace
		}
		
		set outputColorSpace(Wr) {
			;(this._outputColorSpace = Wr), this.setChanged()
		}
		
		set mainScene(Wr) {
		}
		
		set mainCamera(Wr) {
		}
		
		getName() {
			return this.name
		}
		
		setRenderer(Wr) {
			this.renderer = Wr
		}
		
		getDefines() {
			return this.defines
		}
		
		getUniforms() {
			return this.uniforms
		}
		
		getExtensions() {
			return this.extensions
		}
		
		getBlendMode() {
			return this.blendMode
		}
		
		getAttributes() {
			return this.attributes
		}
		
		setAttributes(Wr) {
			;(this.attributes = Wr), this.setChanged()
		}
		
		getFragmentShader() {
			return this.fragmentShader
		}
		
		setFragmentShader(Wr) {
			;(this.fragmentShader = Wr), this.setChanged()
		}
		
		getVertexShader() {
			return this.vertexShader
		}
		
		setVertexShader(Wr) {
			;(this.vertexShader = Wr), this.setChanged()
		}
		
		setChanged() {
			this.dispatchEvent({
				type: 'change',
			})
		}
		
		setDepthTexture(Wr, ze = BasicDepthPacking) {
		}
		
		update(Wr, ze, Gr) {
		}
		
		setSize(Wr, ze) {
		}
		
		initialize(Wr, ze, Gr) {
		}
		
		dispose() {
			for (const Wr of Object.keys(this)) {
				const ze = this[Wr]
				;(ze instanceof WebGLRenderTarget ||
					ze instanceof Material ||
					ze instanceof Texture ||
					ze instanceof Pass) &&
				this[Wr].dispose()
			}
		}
	},
	RenderPass = class extends Pass {
		constructor(Wr, ze, Gr = null) {
			super('RenderPass', Wr, ze),
				(this.needsSwap = !1),
				(this.clearPass = new ClearPass()),
				(this.overrideMaterialManager = Gr === null ? null : new OverrideMaterialManager(Gr)),
				(this.ignoreBackground = !1),
				(this.skipShadowMapUpdate = !1),
				(this.selection = null)
		}
		
		set mainScene(Wr) {
			this.scene = Wr
		}
		
		set mainCamera(Wr) {
			this.camera = Wr
		}
		
		get renderToScreen() {
			return super.renderToScreen
		}
		
		set renderToScreen(Wr) {
			;(super.renderToScreen = Wr), (this.clearPass.renderToScreen = Wr)
		}
		
		get overrideMaterial() {
			const Wr = this.overrideMaterialManager
			return Wr !== null ? Wr.material : null
		}
		
		set overrideMaterial(Wr) {
			const ze = this.overrideMaterialManager
			Wr !== null
				? ze !== null
					? ze.setMaterial(Wr)
					: (this.overrideMaterialManager = new OverrideMaterialManager(Wr))
				: ze !== null && (ze.dispose(), (this.overrideMaterialManager = null))
		}
		
		get clear() {
			return this.clearPass.enabled
		}
		
		set clear(Wr) {
			this.clearPass.enabled = Wr
		}
		
		getOverrideMaterial() {
			return this.overrideMaterial
		}
		
		setOverrideMaterial(Wr) {
			this.overrideMaterial = Wr
		}
		
		getSelection() {
			return this.selection
		}
		
		setSelection(Wr) {
			this.selection = Wr
		}
		
		isBackgroundDisabled() {
			return this.ignoreBackground
		}
		
		setBackgroundDisabled(Wr) {
			this.ignoreBackground = Wr
		}
		
		isShadowMapDisabled() {
			return this.skipShadowMapUpdate
		}
		
		setShadowMapDisabled(Wr) {
			this.skipShadowMapUpdate = Wr
		}
		
		getClearPass() {
			return this.clearPass
		}
		
		render(Wr, ze, Gr, Yr, Kr) {
			const Zr = this.scene,
				Jr = this.camera,
				Qr = this.selection,
				ei = Jr.layers.mask,
				ti = Zr.background,
				ri = Wr.shadowMap.autoUpdate,
				ni = this.renderToScreen ? null : ze
			Qr !== null && Jr.layers.set(Qr.getLayer()),
			this.skipShadowMapUpdate && (Wr.shadowMap.autoUpdate = !1),
			(this.ignoreBackground || this.clearPass.overrideClearColor !== null) &&
			(Zr.background = null),
			this.clearPass.enabled && this.clearPass.render(Wr, ze),
				Wr.setRenderTarget(ni),
				this.overrideMaterialManager !== null
					? this.overrideMaterialManager.render(Wr, Zr, Jr)
					: Wr.render(Zr, Jr),
				(Jr.layers.mask = ei),
				(Zr.background = ti),
				(Wr.shadowMap.autoUpdate = ri)
		}
	},
	effect_default = `#include <common>
#include <packing>
#include <dithering_pars_fragment>
#define packFloatToRGBA(v) packDepthToRGBA(v)
#define unpackRGBAToFloat(v) unpackRGBAToDepth(v)
#ifdef FRAMEBUFFER_PRECISION_HIGH
uniform mediump sampler2D inputBuffer;
#else
uniform lowp sampler2D inputBuffer;
#endif
#if DEPTH_PACKING == 3201
uniform lowp sampler2D depthBuffer;
#elif defined(GL_FRAGMENT_PRECISION_HIGH)
uniform highp sampler2D depthBuffer;
#else
uniform mediump sampler2D depthBuffer;
#endif
uniform vec2 resolution;uniform vec2 texelSize;uniform float cameraNear;uniform float cameraFar;uniform float aspect;uniform float time;varying vec2 vUv;
#if THREE_REVISION < 143
#define luminance(v) linearToRelativeLuminance(v)
#endif
#if THREE_REVISION >= 137
vec4 sRGBToLinear(const in vec4 value){return vec4(mix(pow(value.rgb*0.9478672986+vec3(0.0521327014),vec3(2.4)),value.rgb*0.0773993808,vec3(lessThanEqual(value.rgb,vec3(0.04045)))),value.a);}
#endif
float readDepth(const in vec2 uv){
#if DEPTH_PACKING == 3201
return unpackRGBAToDepth(texture2D(depthBuffer,uv));
#else
return texture2D(depthBuffer,uv).r;
#endif
}float getViewZ(const in float depth){
#ifdef PERSPECTIVE_CAMERA
return perspectiveDepthToViewZ(depth,cameraNear,cameraFar);
#else
return orthographicDepthToViewZ(depth,cameraNear,cameraFar);
#endif
}vec3 RGBToHCV(const in vec3 RGB){vec4 P=mix(vec4(RGB.bg,-1.0,2.0/3.0),vec4(RGB.gb,0.0,-1.0/3.0),step(RGB.b,RGB.g));vec4 Q=mix(vec4(P.xyw,RGB.r),vec4(RGB.r,P.yzx),step(P.x,RGB.r));float C=Q.x-min(Q.w,Q.y);float H=abs((Q.w-Q.y)/(6.0*C+EPSILON)+Q.z);return vec3(H,C,Q.x);}vec3 RGBToHSL(const in vec3 RGB){vec3 HCV=RGBToHCV(RGB);float L=HCV.z-HCV.y*0.5;float S=HCV.y/(1.0-abs(L*2.0-1.0)+EPSILON);return vec3(HCV.x,S,L);}vec3 HueToRGB(const in float H){float R=abs(H*6.0-3.0)-1.0;float G=2.0-abs(H*6.0-2.0);float B=2.0-abs(H*6.0-4.0);return clamp(vec3(R,G,B),0.0,1.0);}vec3 HSLToRGB(const in vec3 HSL){vec3 RGB=HueToRGB(HSL.x);float C=(1.0-abs(2.0*HSL.z-1.0))*HSL.y;return(RGB-0.5)*C+HSL.z;}FRAGMENT_HEAD void main(){FRAGMENT_MAIN_UV vec4 color0=texture2D(inputBuffer,UV);vec4 color1=vec4(0.0);FRAGMENT_MAIN_IMAGE color0.a=clamp(color0.a,0.0,1.0);gl_FragColor=color0;
#ifdef ENCODE_OUTPUT
#include <colorspace_fragment>
#endif
#include <dithering_fragment>
}`,
	effect_default2 =
		'uniform vec2 resolution;uniform vec2 texelSize;uniform float cameraNear;uniform float cameraFar;uniform float aspect;uniform float time;varying vec2 vUv;VERTEX_HEAD void main(){vUv=position.xy*0.5+0.5;VERTEX_MAIN_SUPPORT gl_Position=vec4(position.xy,1.0,1.0);}',
	EffectMaterial = class extends ShaderMaterial {
		constructor(Wr, ze, Gr, Yr, Kr = !1) {
			super({
				name: 'EffectMaterial',
				defines: {
					THREE_REVISION: REVISION.replace(/\D+/g, ''),
					DEPTH_PACKING: '0',
					ENCODE_OUTPUT: '1',
				},
				uniforms: {
					inputBuffer: new Uniform(null),
					depthBuffer: new Uniform(null),
					resolution: new Uniform(new Vector2()),
					texelSize: new Uniform(new Vector2()),
					cameraNear: new Uniform(0.3),
					cameraFar: new Uniform(1e3),
					aspect: new Uniform(1),
					time: new Uniform(0),
				},
				blending: NoBlending,
				toneMapped: !1,
				depthWrite: !1,
				depthTest: !1,
				dithering: Kr,
			}),
			Wr && this.setShaderParts(Wr),
			ze && this.setDefines(ze),
			Gr && this.setUniforms(Gr),
				this.copyCameraSettings(Yr)
		}
		
		static get Section() {
			return EffectShaderSection
		}
		
		set inputBuffer(Wr) {
			this.uniforms.inputBuffer.value = Wr
		}
		
		get depthBuffer() {
			return this.uniforms.depthBuffer.value
		}
		
		set depthBuffer(Wr) {
			this.uniforms.depthBuffer.value = Wr
		}
		
		get depthPacking() {
			return Number(this.defines.DEPTH_PACKING)
		}
		
		set depthPacking(Wr) {
			;(this.defines.DEPTH_PACKING = Wr.toFixed(0)), (this.needsUpdate = !0)
		}
		
		get encodeOutput() {
			return this.defines.ENCODE_OUTPUT !== void 0
		}
		
		set encodeOutput(Wr) {
			this.encodeOutput !== Wr &&
			(Wr ? (this.defines.ENCODE_OUTPUT = '1') : delete this.defines.ENCODE_OUTPUT,
				(this.needsUpdate = !0))
		}
		
		get time() {
			return this.uniforms.time.value
		}
		
		set time(Wr) {
			this.uniforms.time.value = Wr
		}
		
		setInputBuffer(Wr) {
			this.uniforms.inputBuffer.value = Wr
		}
		
		setDepthBuffer(Wr, ze = BasicDepthPacking) {
			;(this.depthBuffer = Wr), (this.depthPacking = ze)
		}
		
		setShaderData(Wr) {
			this.setShaderParts(Wr.shaderParts),
				this.setDefines(Wr.defines),
				this.setUniforms(Wr.uniforms),
				this.setExtensions(Wr.extensions)
		}
		
		setShaderParts(Wr) {
			return (
				(this.fragmentShader = effect_default
					.replace(
						EffectShaderSection.FRAGMENT_HEAD,
						Wr.get(EffectShaderSection.FRAGMENT_HEAD) || '',
					)
					.replace(
						EffectShaderSection.FRAGMENT_MAIN_UV,
						Wr.get(EffectShaderSection.FRAGMENT_MAIN_UV) || '',
					)
					.replace(
						EffectShaderSection.FRAGMENT_MAIN_IMAGE,
						Wr.get(EffectShaderSection.FRAGMENT_MAIN_IMAGE) || '',
					)),
					(this.vertexShader = effect_default2
						.replace(EffectShaderSection.VERTEX_HEAD, Wr.get(EffectShaderSection.VERTEX_HEAD) || '')
						.replace(
							EffectShaderSection.VERTEX_MAIN_SUPPORT,
							Wr.get(EffectShaderSection.VERTEX_MAIN_SUPPORT) || '',
						)),
					(this.fragmentShader = updateFragmentShader(this.fragmentShader)),
					(this.needsUpdate = !0),
					this
			)
		}
		
		setDefines(Wr) {
			for (const ze of Wr.entries()) this.defines[ze[0]] = ze[1]
			return (this.needsUpdate = !0), this
		}
		
		setUniforms(Wr) {
			for (const ze of Wr.entries()) this.uniforms[ze[0]] = ze[1]
			return this
		}
		
		setExtensions(Wr) {
			this.extensions = {}
			for (const ze of Wr) this.extensions[ze] = !0
			return this
		}
		
		isOutputEncodingEnabled(Wr) {
			return this.encodeOutput
		}
		
		setOutputEncodingEnabled(Wr) {
			this.encodeOutput = Wr
		}
		
		setDeltaTime(Wr) {
			this.uniforms.time.value += Wr
		}
		
		adoptCameraSettings(Wr) {
			this.copyCameraSettings(Wr)
		}
		
		copyCameraSettings(Wr) {
			Wr &&
			((this.uniforms.cameraNear.value = Wr.near),
				(this.uniforms.cameraFar.value = Wr.far),
				Wr instanceof PerspectiveCamera
					? (this.defines.PERSPECTIVE_CAMERA = '1')
					: delete this.defines.PERSPECTIVE_CAMERA,
				(this.needsUpdate = !0))
		}
		
		setSize(Wr, ze) {
			const Gr = this.uniforms
			Gr.resolution.value.set(Wr, ze),
				Gr.texelSize.value.set(1 / Wr, 1 / ze),
				(Gr.aspect.value = Wr / ze)
		}
	}

function prefixSubstrings(Wr, ze, Gr) {
	for (const Yr of ze) {
		const Kr = '$1' + Wr + Yr.charAt(0).toUpperCase() + Yr.slice(1),
			Zr = new RegExp('([^\\.])(\\b' + Yr + '\\b)', 'g')
		for (const Jr of Gr.entries()) Jr[1] !== null && Gr.set(Jr[0], Jr[1].replace(Zr, Kr))
	}
}

function integrateEffect(Wr, ze, Gr) {
	let Yr = ze.getFragmentShader(),
		Kr = ze.getVertexShader()
	const Zr = Yr !== void 0 && /mainImage/.test(Yr),
		Jr = Yr !== void 0 && /mainUv/.test(Yr)
	if (((Gr.attributes |= ze.getAttributes()), Yr === void 0))
		throw new Error(`Missing fragment shader (${ze.name})`)
	if (Jr && Gr.attributes & EffectAttribute.CONVOLUTION)
		throw new Error(
			`Effects that transform UVs are incompatible with convolution effects (${ze.name})`,
		)
	if (!Zr && !Jr) throw new Error(`Could not find mainImage or mainUv function (${ze.name})`)
	{
		const Qr = /\w+\s+(\w+)\([\w\s,]*\)\s*{/g,
			ei = Gr.shaderParts
		let ti = ei.get(EffectShaderSection.FRAGMENT_HEAD) || '',
			ri = ei.get(EffectShaderSection.FRAGMENT_MAIN_UV) || '',
			ni = ei.get(EffectShaderSection.FRAGMENT_MAIN_IMAGE) || '',
			ii = ei.get(EffectShaderSection.VERTEX_HEAD) || '',
			si = ei.get(EffectShaderSection.VERTEX_MAIN_SUPPORT) || ''
		const li = new Set(),
			oi = new Set()
		if (
			(Jr &&
			((ri += `	${Wr}MainUv(UV);
`),
				(Gr.uvTransformation = !0)),
			Kr !== null && /mainSupport/.test(Kr))
		) {
			const hi = /mainSupport *\([\w\s]*?uv\s*?\)/.test(Kr)
			;(si += `	${Wr}MainSupport(`),
				(si += hi
					? `vUv);
`
					: `);
`)
			for (const ci of Kr.matchAll(/(?:varying\s+\w+\s+([\S\s]*?);)/g))
				for (const fi of ci[1].split(/\s*,\s*/)) Gr.varyings.add(fi), li.add(fi), oi.add(fi)
			for (const ci of Kr.matchAll(Qr)) oi.add(ci[1])
		}
		for (const hi of Yr.matchAll(Qr)) oi.add(hi[1])
		for (const hi of ze.defines.keys()) oi.add(hi.replace(/\([\w\s,]*\)/g, ''))
		for (const hi of ze.uniforms.keys()) oi.add(hi)
		oi.delete('while'),
			oi.delete('for'),
			oi.delete('if'),
			ze.uniforms.forEach((hi, ci) =>
				Gr.uniforms.set(Wr + ci.charAt(0).toUpperCase() + ci.slice(1), hi),
			),
			ze.defines.forEach((hi, ci) =>
				Gr.defines.set(Wr + ci.charAt(0).toUpperCase() + ci.slice(1), hi),
			)
		const ui = new Map([
			['fragment', Yr],
			['vertex', Kr],
		])
		prefixSubstrings(Wr, oi, Gr.defines),
			prefixSubstrings(Wr, oi, ui),
			(Yr = ui.get('fragment')),
			(Kr = ui.get('vertex'))
		const ai = ze.blendMode
		if ((Gr.blendModes.set(ai.blendFunction, ai), Zr)) {
			ze.inputColorSpace !== null &&
			ze.inputColorSpace !== Gr.colorSpace &&
			(ni +=
				ze.inputColorSpace === SRGBColorSpace
					? `color0 = LinearTosRGB(color0);
	`
					: `color0 = sRGBToLinear(color0);
	`),
				ze.outputColorSpace !== NoColorSpace
					? (Gr.colorSpace = ze.outputColorSpace)
					: ze.inputColorSpace !== null && (Gr.colorSpace = ze.inputColorSpace)
			const hi = /MainImage *\([\w\s,]*?depth[\w\s,]*?\)/
			;(ni += `${Wr}MainImage(color0, UV, `),
			Gr.attributes & EffectAttribute.DEPTH &&
			hi.test(Yr) &&
			((ni += 'depth, '), (Gr.readDepth = !0)),
				(ni += `color1);
	`)
			const ci = Wr + 'BlendOpacity'
			Gr.uniforms.set(ci, ai.opacity),
				(ni += `color0 = blend${ai.blendFunction}(color0, color1, ${ci});

	`),
				(ti += `uniform float ${ci};

`)
		}
		if (
			((ti +=
				Yr +
				`
`),
			Kr !== null &&
			(ii +=
				Kr +
				`
`),
				ei.set(EffectShaderSection.FRAGMENT_HEAD, ti),
				ei.set(EffectShaderSection.FRAGMENT_MAIN_UV, ri),
				ei.set(EffectShaderSection.FRAGMENT_MAIN_IMAGE, ni),
				ei.set(EffectShaderSection.VERTEX_HEAD, ii),
				ei.set(EffectShaderSection.VERTEX_MAIN_SUPPORT, si),
			ze.extensions !== null)
		)
			for (const hi of ze.extensions) Gr.extensions.add(hi)
	}
}

var EffectPass = class extends Pass {
	constructor(Wr, ...ze) {
		super('EffectPass'),
			(this.fullscreenMaterial = new EffectMaterial(null, null, null, Wr)),
			(this.listener = (Gr) => this.handleEvent(Gr)),
			(this.effects = []),
			this.setEffects(ze),
			(this.skipRendering = !1),
			(this.minTime = 1),
			(this.maxTime = Number.POSITIVE_INFINITY),
			(this.timeScale = 1)
	}
	
	set mainScene(Wr) {
		for (const ze of this.effects) ze.mainScene = Wr
	}
	
	set mainCamera(Wr) {
		this.fullscreenMaterial.copyCameraSettings(Wr)
		for (const ze of this.effects) ze.mainCamera = Wr
	}
	
	get encodeOutput() {
		return this.fullscreenMaterial.encodeOutput
	}
	
	set encodeOutput(Wr) {
		this.fullscreenMaterial.encodeOutput = Wr
	}
	
	get dithering() {
		return this.fullscreenMaterial.dithering
	}
	
	set dithering(Wr) {
		const ze = this.fullscreenMaterial
		;(ze.dithering = Wr), (ze.needsUpdate = !0)
	}
	
	setEffects(Wr) {
		for (const ze of this.effects) ze.removeEventListener('change', this.listener)
		this.effects = Wr.sort((ze, Gr) => Gr.attributes - ze.attributes)
		for (const ze of this.effects) ze.addEventListener('change', this.listener)
	}
	
	updateMaterial() {
		const Wr = new EffectShaderData()
		let ze = 0
		for (const Jr of this.effects)
			if (Jr.blendMode.blendFunction === BlendFunction.DST)
				Wr.attributes |= Jr.getAttributes() & EffectAttribute.DEPTH
			else {
				if (Wr.attributes & Jr.getAttributes() & EffectAttribute.CONVOLUTION)
					throw new Error(`Convolution effects cannot be merged (${Jr.name})`)
				integrateEffect('e' + ze++, Jr, Wr)
			}
		let Gr = Wr.shaderParts.get(EffectShaderSection.FRAGMENT_HEAD),
			Yr = Wr.shaderParts.get(EffectShaderSection.FRAGMENT_MAIN_IMAGE),
			Kr = Wr.shaderParts.get(EffectShaderSection.FRAGMENT_MAIN_UV)
		const Zr = /\bblend\b/g
		for (const Jr of Wr.blendModes.values())
			Gr +=
				Jr.getShaderCode().replace(Zr, `blend${Jr.blendFunction}`) +
				`
`
		Wr.attributes & EffectAttribute.DEPTH
			? (Wr.readDepth &&
			(Yr =
				`float depth = readDepth(UV);

	` + Yr),
				(this.needsDepthTexture = this.getDepthTexture() === null))
			: (this.needsDepthTexture = !1),
		Wr.colorSpace === SRGBColorSpace &&
		(Yr += `color0 = sRGBToLinear(color0);
	`),
			Wr.uvTransformation
				? ((Kr =
					`vec2 transformedUv = vUv;
` + Kr),
					Wr.defines.set('UV', 'transformedUv'))
				: Wr.defines.set('UV', 'vUv'),
			Wr.shaderParts.set(EffectShaderSection.FRAGMENT_HEAD, Gr),
			Wr.shaderParts.set(EffectShaderSection.FRAGMENT_MAIN_IMAGE, Yr),
			Wr.shaderParts.set(EffectShaderSection.FRAGMENT_MAIN_UV, Kr)
		for (const [Jr, Qr] of Wr.shaderParts)
			Qr !== null &&
			Wr.shaderParts.set(
				Jr,
				Qr.trim().replace(
					/^#/,
					`
#`,
				),
			)
			;
		(this.skipRendering = ze === 0),
			(this.needsSwap = !this.skipRendering),
			this.fullscreenMaterial.setShaderData(Wr)
	}
	
	recompile() {
		this.updateMaterial()
	}
	
	getDepthTexture() {
		return this.fullscreenMaterial.depthBuffer
	}
	
	setDepthTexture(Wr, ze = BasicDepthPacking) {
		;(this.fullscreenMaterial.depthBuffer = Wr), (this.fullscreenMaterial.depthPacking = ze)
		for (const Gr of this.effects) Gr.setDepthTexture(Wr, ze)
	}
	
	render(Wr, ze, Gr, Yr, Kr) {
		for (const Zr of this.effects) Zr.update(Wr, ze, Yr)
		if (!this.skipRendering || this.renderToScreen) {
			const Zr = this.fullscreenMaterial
			;(Zr.inputBuffer = ze.texture),
				(Zr.time += Yr * this.timeScale),
				Wr.setRenderTarget(this.renderToScreen ? null : Gr),
				Wr.render(this.scene, this.camera)
		}
	}
	
	setSize(Wr, ze) {
		this.fullscreenMaterial.setSize(Wr, ze)
		for (const Gr of this.effects) Gr.setSize(Wr, ze)
	}
	
	initialize(Wr, ze, Gr) {
		this.renderer = Wr
		for (const Yr of this.effects) Yr.initialize(Wr, ze, Gr)
		this.updateMaterial(),
		Gr !== void 0 &&
		Gr !== UnsignedByteType &&
		(this.fullscreenMaterial.defines.FRAMEBUFFER_PRECISION_HIGH = '1')
	}
	
	dispose() {
		super.dispose()
		for (const Wr of this.effects) Wr.removeEventListener('change', this.listener), Wr.dispose()
	}
	
	handleEvent(Wr) {
		switch (Wr.type) {
			case 'change':
				this.recompile()
				break
		}
	}
}

const grain = `uniform float uXCount;
uniform float uYCount;
uniform float uIntensity;

vec2 hash(vec2 p) // replace this by something better
{
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(in vec2 p) {
  const float K1 = 0.366025404; // (sqrt(3)-1)/2;
  const float K2 = 0.211324865; // (3-sqrt(3))/6;

  vec2 i = floor(p + (p.x + p.y) * K1);
  vec2 a = p - i + (i.x + i.y) * K2;
  float m = step(a.y, a.x);
  vec2 o = vec2(m, 1.0 - m);
  vec2 b = a - o + K2;
  vec2 c = a - 1.0 + 2.0 * K2;
  vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
  vec3 n =
      h * h * h * h *
      vec3(dot(a, hash(i + 0.0)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
  return dot(n, vec3(70.0));
}

float speed = 12.;
// float intensity = .01;

float random2d(vec2 coord) {
  return fract(sin(dot(coord.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float blendSoftLight(float base, float blend) {
  return (blend < 0.5)
             ? (2.0 * base * blend + base * base * (1.0 - 2.0 * blend))
             : (sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend));
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
  return vec3(blendSoftLight(base.r, blend.r), blendSoftLight(base.g, blend.g),
              blendSoftLight(base.b, blend.b));
}

vec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {
  return (blendSoftLight(base, blend) * opacity + base * (1.0 - opacity));
}

void mainImage(const in vec4 inputColor, const in vec2 uv,
               out vec4 outputColor) {
  float gridX = floor(uv.x * uXCount) / uXCount;
  float gridY = 1.0 - floor(uv.y * uYCount) / uYCount;
  float t = mod(time, 1.);
  // float timeSpeed = time; // -> fluide (it's random, so we cant control the
  // speed)
  float timeSpeed = floor(t * 8.); // -> saccadé
  // float timeSpeed = 1.;
  // float intensity = (inputColor.r + inputColor.g + inputColor.b) / 3.;
  float grain = random2d(vec2(gridX + timeSpeed, gridY));

  grain -= grain / 2.;
  grain *= .1;

  vec3 resultColor =
      blendSoftLight(inputColor.rgb, inputColor.rgb + grain, uIntensity);

  outputColor = vec4(resultColor, 1.0);
  // outputColor = vec4(inputColor.rgb, 1.0);
}
`,
	pixelSize = window.devicePixelRatio,
	uXCount = new Uniform(canvas$1.offsetWidth / pixelSize),
	uYCount = new Uniform(canvas$1.offsetHeight / pixelSize),
	uIntensity = new Uniform(1.29),
	renderPass = new RenderPass(scene, camera),
	grainEffect = new Effect('grain', grain, {
		blendFunction: BlendFunction.NORMAL,
		uniforms: new Map([
			['uXCount', uXCount],
			['uYCount', uYCount],
			['uIntensity', uIntensity],
		]),
	}),
	blurPass = new KawaseBlurPass()
blurPass.scale = 2
const displacementEffect = new Effect(
		'displacement',
		`
    uniform sampler2D uSimulationTexture;
    uniform vec2 uDisplacementStrength;
    uniform float uCursorColoring;

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        // UV aspect fix
        /* vec2 nUv = (-.5 + uv) * 2.;
        if( resolution.x < resolution.y ) {
            nUv.x *= resolution.x / resolution.y;
        } else {
            nUv.y *= resolution.y / resolution.x;
        }
        nUv = nUv / 2. + .5; */

        vec4 gpgpuColor = texture2D(uSimulationTexture, vUv);

        vec2 dUv = vec2(
            uv.x - (-0.5 + gpgpuColor.r) * uDisplacementStrength.x * gpgpuColor.b,
            uv.y - (-0.5 + gpgpuColor.g) * uDisplacementStrength.y * gpgpuColor.b
        );

        vec4 color = texture2D(inputBuffer, dUv);

        color.rgb += color.rgb * gpgpuColor.b * uCursorColoring;

        outputColor = vec4(color.rgb, 1.0);
    }`,
		{
			blendFunction: BlendFunction.NORMAL,
			uniforms: new Map([
				['uSimulationTexture', uSimulationTexture],
				['uDisplacementStrength', new Uniform(new Vector2(2, 2))],
				['uCursorColoring', new Uniform(1.5)],
			]),
		},
	),
	effectPass = new EffectPass(camera, displacementEffect, grainEffect),
	passes = [renderPass, blurPass, effectPass]
let gui

function debug() {
	function Wr() {
		;(gui = new GUI({
			name: 'grain',
			closed: !0,
		})),
			gui.slider({
				name: 'intensity',
				obj: uIntensity,
				prop: 'value',
				max: 100,
			})
	}
	
	function ze() {
		gui && gui.kill(), (gui = void 0)
	}
	
	return {
		mount: Wr,
		unmount: ze,
	}
}

let background

class PresetManager {
	static registerChange() {
		background || (background = canvasManager.getEffect('gradient')),
		this.current && (this.previous = this.current)
	}
	
	static set(ze) {
		switch (ze) {
			case 'menu':
				this.menu()
				break
			case 'culture':
				this.culture()
				break
			default:
				this.normal()
		}
	}
	
	static normal(ze = !1) {
		if ((this.registerChange(), (this.current = 'normal'), !ze))
			background.setSize(0.2),
				background.setGrainIntensity(1.29),
				background.setColor1('rgb(65,66,73)'),
				background.setColor2('rgb(36,39,51)'),
				background.setColor3('rgb(49,103,160)'),
				background.setColor4('rgb(117,153,245)'),
				(blurPass.scale = 2),
				(uColorMixer.value = 0),
				(uMenuMode.value = 0)
		else {
			const Gr = gsapWithCSS.timeline({
				defaults: {
					ease: 'power2.inOut',
					duration: 1,
				},
			})
			Gr.to(
				uSize,
				{
					value: 0.2,
				},
				0,
			),
				Gr.to(
					uIntensity,
					{
						value: 1.29,
					},
					0,
				),
				Gr.to(
					uColor1.value,
					{
						r: 0.05286064,
						g: 0.05448027,
						b: 0.06662593,
					},
					0,
				),
				Gr.to(
					uColor2.value,
					{
						r: 0.01764195,
						g: 0.02028856,
						b: 0.03310476,
					},
					0,
				),
				Gr.to(
					uColor3.value,
					{
						r: 0.03071344,
						g: 0.13563332,
						b: 0.35153259,
					},
					0,
				),
				Gr.to(
					uColor4.value,
					{
						r: 0.17788841,
						g: 0.31854677,
						b: 0.91309865,
					},
					0,
				),
				Gr.to(
					blurPass,
					{
						scale: 2,
					},
					0,
				),
				Gr.to(
					uColorMixer,
					{
						value: 0,
					},
					0,
				),
				Gr.to(
					uMenuMode,
					{
						value: 0,
					},
					0,
				)
		}
	}
	
	static menu() {
		this.registerChange(),
			(this.current = 'menu'),
			background.setSize(0.1),
			background.setGrainIntensity(1.29),
			background.setColor1('rgb(65,66,73)'),
			background.setColor2('rgb(36,39,51)'),
			background.setColor3('rgb(49,103,160)'),
			background.setColor4('rgb(117,153,245)'),
			(blurPass.scale = 5),
			(uColorMixer.value = 0.32),
			(uMenuMode.value = 1)
	}
	
	static culture(ze) {
		if ((this.registerChange(), (this.current = 'culture'), !ze))
			background.setSize(0.13),
				background.setGrainIntensity(1.32),
				background.setColor1(0.02624122, 0.02732089, 0.0343398),
				background.setColor2(0.00913405, 0.00972121, 0.01520851),
				background.setColor3(0.01096009, 0.07036009, 0.20863687),
				background.setColor4(0.00477695, 0.01370208, 0.06480326),
				(blurPass.scale = 2),
				(uColorMixer.value = 0),
				(uMenuMode.value = 0)
		else {
			const Gr = gsapWithCSS.timeline({
				defaults: {
					ease: 'power2.inOut',
					duration: 1,
				},
			})
			Gr.to(
				uSize,
				{
					value: 0.13,
				},
				0,
			),
				Gr.to(
					uIntensity,
					{
						value: 1.32,
					},
					0,
				),
				Gr.to(
					uColor1.value,
					{
						r: 0.02624122,
						g: 0.02732089,
						b: 0.0343398,
					},
					0,
				),
				Gr.to(
					uColor2.value,
					{
						r: 0.00913405,
						g: 0.00972121,
						b: 0.01520851,
					},
					0,
				),
				Gr.to(
					uColor3.value,
					{
						r: 0.01096009,
						g: 0.07036009,
						b: 0.20863687,
					},
					0,
				),
				Gr.to(
					uColor4.value,
					{
						r: 0.00477695,
						g: 0.01370208,
						b: 0.06480326,
					},
					0,
				),
				Gr.to(
					blurPass,
					{
						scale: 2,
					},
					0,
				),
				Gr.to(
					uColorMixer,
					{
						value: 0,
					},
					0,
				),
				Gr.to(
					uMenuMode,
					{
						value: 0,
					},
					0,
				)
		}
	}
}
