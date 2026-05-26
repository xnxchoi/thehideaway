var R = Object.defineProperty;
var C = (d, h, t) => h in d ? R(d, h, { enumerable: !0, configurable: !0, writable: !0, value: t }) : d[h] = t;
var g = (d, h, t) => C(d, typeof h != "symbol" ? h + "" : h, t);
import {
  a4 as w,
  a5 as Q,
  a6 as b,
  a7 as m,
  a8 as M,
  a9 as L,
  aa as I,
  ab as k,
  ac as D,
  c as v,
  d as y,
  g as S,
  n as A,
  v as x,
  W as E
} from "./threeDR6a5Kiu.js";
import { D as F, G as z } from "./GLTFLoader.js";

class B extends HTMLElement {
  constructor() {
    super();
    g(this, "customEasing", t => {
      let a = t, r, l;
      for (let c = 0; c < 5 && (r = 1 - a, l = 3 * r * r * a * .6 + 3 * r * a * a * .3 + a * a * a - t, !(Math.abs(l) < 1e-4)); c++) {
        const u = 3 * r * r * .6 + 6 * r * a * (.3 - .6) + 3 * a * a * (1 - .3);
        a -= l / u;
      }
      return 3 * (1 - a) * (1 - a) * a * 0 + 3 * (1 - a) * a * a * 1 + a * a * a;
    });
    this.camera = null, this.scene = null, this.renderer = null, this.model = null, this.targetRotation = 0, this.currentRotation = 0, this.rotationFactor = .2, this.isAnimating = !1, this.src = this.getAttribute("src") || "https://cdn.shopify.com/3d/models/d7e6bb9e3b5ee6e4/logo.glb", this.backgroundColor = this.getAttribute("background-color") || "transparent", this.autoRotate = this.hasAttribute("auto-rotate") ? this.getAttribute("auto-rotate") !== "false" : !1, this.container = document.createElement("div"), this.container.style.width = "100%", this.container.style.height = "100%", this.container.style.position = "relative", this.container.style.overflow = "hidden", this.canvas = document.createElement("canvas"), this.canvas.style.width = "100%", this.canvas.style.height = "100%", this.canvas.style.display = "block", this.canvas.style.position = "absolute", this.canvas.style.top = "0", this.canvas.style.left = "0", this.container.appendChild(this.canvas), this.appendChild(this.container), this.style.width = "100%", this.style.height = "100%", this.style.display = "block", this.resizeObserver = new ResizeObserver(() => {
      this.updateSize();
    }), this.performanceMonitor = {
      fps: 60,
      fpsAlpha: .2,
      fpsUpdateInterval: 1e3,
      lastFpsUpdateTime: 0,
      frameCount: 0,
      lastFrameTime: 0,
      lowPerformanceCount: 0,
      highPerformanceCount: 0,
      qualityChangeThreshold: 3,
      adaptiveQualityEnabled: !0
    }, this.modelLoaded = !1, this.loadingCallbacks = [], this.defaultQuality = this.getAttribute("quality") || "auto", this.currentQuality = this.defaultQuality, this.initialPerformanceCheckDone = !1;
  }
  
  static get observedAttributes() {
    return ["src", "background-color", "auto-rotate", "camera-orbit", "quality", "adaptive-quality"];
  }
  
  attributeChangedCallback(t, e, i) {
    if (e !== i) switch (t) {
      case"src":
        this.src = i, this.initialized && this.loadModel();
        break;
      case"background-color":
        this.backgroundColor = i, this.renderer && this.renderer.setClearColor(0, 0);
        break;
      case"auto-rotate":
        this.autoRotate = i !== "false";
        break;
      case"camera-orbit":
        if (i && this.camera) {
          const s = i.match(/^([0-9.-]+)deg\s+([0-9.-]+)deg\s+([0-9.-]+)%$/);
          if (s) {
            const a = (parseFloat(s[1]) % 360 + 360) % 360;
            parseFloat(s[2]), parseFloat(s[3]) / 100, this.targetRotation = y.degToRad(a), this.isAnimating || (this.isAnimating = !0, this.animateRotation());
          }
        }
        break;
      case"quality":
        this.defaultQuality = i || "auto", this.defaultQuality !== "auto" ? (this.adaptiveQualityEnabled = !1, this.currentQuality = this.defaultQuality, this.applyQualitySettings(this.currentQuality)) : this.adaptiveQualityEnabled = !0;
        break;
      case"adaptive-quality":
        this.adaptiveQualityEnabled = i !== "false";
        break;
    }
  }
  
  connectedCallback() {
    this.initialized || (this.init(), this.resizeObserver.observe(this), this.isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent), this.detectSystemCapabilities());
  }
  
  disconnectedCallback() {
    this.resizeObserver.unobserve(this), window.cancelAnimationFrame(this.animationFrame), this.model && (this.scene.remove(this.model), this.model.traverse(t => {
      t.geometry && t.geometry.dispose(), t.material && (Array.isArray(t.material) ? t.material.forEach(e => e.dispose()) : t.material.dispose());
    })), this.renderer && (this.renderer.dispose(), this.renderer = null);
  }
  
  detectSystemCapabilities() {
    const t = navigator.hardwareConcurrency || 4;
    let e = "medium";
    if (window.performance && window.performance.memory) {
      const a = window.performance.memory;
      a.jsHeapSizeLimit < 512 * 1024 * 1024 ? e = "low" : a.jsHeapSizeLimit > 2048 * 1024 * 1024 && (e = "high");
    }
    let i = "medium";
    try {
      const a = document.createElement("canvas"), r = a.getContext("webgl") || a.getContext("experimental-webgl");
      if (r) {
        const l = r.getExtension("WEBGL_debug_renderer_info");
        if (l) {
          const c = r.getParameter(l.UNMASKED_RENDERER_WEBGL),
            u = ["RTX", "GTX", "AMD Radeon Pro", "Quadro", "Intel Iris"],
            f = ["Intel HD Graphics", "Mali-G", "Adreno 5", "Adreno 6", "Apple A"];
          u.some(o => c.includes(o)) ? i = "high" : f.some(o => c.includes(o)) && (i = "low");
        }
      }
    } catch (a) {
      console.warn("Erreur lors de la détection du GPU", a);
    }
    let s, n = !1;
    this.isMobileDevice ? i === "low" || e === "low" ? (s = "low", n = !0) : (t <= 4, s = "medium") : i === "high" && t >= 6 ? s = "high" : i === "low" || t < 4 ? (s = "medium", n = !0) : s = "high", n && (this.autoRotate = !1, this.hasAttribute("auto-rotate") && this.setAttribute("auto-rotate", "false"), console.debug("Rotation automatique désactivée sur appareil de faible puissance")), this.defaultQuality === "auto" ? (this.currentQuality = s, console.debug("Qualité initiale détectée:", s)) : this.currentQuality = this.defaultQuality, this.isLowPowerDevice = n, this.applyQualitySettings(this.currentQuality);
  }
  
  applyQualitySettings(t) {
    if (!this.renderer) return;
    const e = window.devicePixelRatio || 1;
    switch (t) {
      case"low":
        this.renderer.setPixelRatio(Math.min(e, 1)), this.renderer.shadowMap.enabled = !1, this.model && this.model.traverse(i => {
          i.isMesh && i.material && (i.material.metalness = .6, i.material.roughness = .4, i.castShadow = !1, i.receiveShadow = !1);
        });
        break;
      case"medium":
        this.renderer.setPixelRatio(Math.min(e, 1.5)), this.renderer.shadowMap.enabled = !0, this.renderer.shadowMap.type = Q, this.model && this.model.traverse(i => {
          i.isMesh && i.material && (i.material.metalness = 1, i.material.roughness = .2, i.castShadow = !0, i.receiveShadow = !0);
        });
        break;
      case"high":
      default:
        this.renderer.setPixelRatio(e), this.renderer.shadowMap.enabled = !0, this.renderer.shadowMap.type = w, this.model && this.model.traverse(i => {
          i.isMesh && i.material;
        });
        break;
    }
    this.updateSize();
  }
  
  init() {
    this.scene = new A, this.camera = new x(35, 1, .1, 1e3), this.camera.position.z = 4.5, this.renderer = new E({
      canvas: this.canvas,
      antialias: !0,
      alpha: !0,
      precision: "highp",
      preserveDrawingBuffer: !0,
      powerPreference: "high-performance",
      stencil: !1
    }), this.renderer.setClearColor(0, 0), this.renderer.outputEncoding = S, this.renderer.shadowMap.enabled = !0, this.renderer.shadowMap.type = w;
    const t = new b(16777215, 2);
    this.scene.add(t);
    const e = new m(16777215, 20);
    e.position.set(0, 0, 30), e.castShadow = !0, e.shadow.mapSize.width = 1024, e.shadow.mapSize.height = 1024, e.shadow.bias = -.001, e.shadow.normalBias = .02, e.shadow.radius = 2, e.target.position.set(0, 0, 0), this.scene.add(e.target), this.scene.add(e), e && this.model && (e.target.position.copy(this.model.position), e.target.updateMatrixWorld());
    const i = new m(16777215, 5);
    i.position.set(-10, 0, 5), this.scene.add(i);
    const s = new m(16777215, 5);
    s.position.set(10, 0, 5), this.scene.add(s), new m(16777215, 40).position.set(0, 10, 5), new M(16777215, 30, 20).position.set(4, 4, 8), new M(16777215, 20, 20).position.set(-4, -4, 8), this.loadModel(), this.animate(), this.initialized = !0;
  }
  
  loadModel() {
    this.model && (this.scene.remove(this.model), this.model = null);
    const t = new F;
    t.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
    const e = new z;
    e.setDRACOLoader(t);
    const i = new L;
    i.onProgress = (s, n, a) => {
      const r = n / a * 100;
      this.dispatchEvent(new CustomEvent("loading-progress", { detail: { progress: r, url: s, loaded: n, total: a } }));
    }, e.manager = i, e.load(this.src, s => {
      this.model = s.scene;
      const n = new I().setFromObject(this.model), a = n.getCenter(new v);
      this.model.position.x = -a.x, this.model.position.y = -a.y, this.model.position.z = -a.z;
      const r = n.getSize(new v), c = 3.39 / Math.max(r.x, r.y, r.z);
      this.model.scale.multiplyScalar(c), this.model.position.y += .3, this.model.traverse(o => {
        if (o.isMesh && o.material) {
          if (o.material.isMeshStandardMaterial) o.material.metalness = .9, o.material.roughness = .1, o.material.envMapIntensity = 2; else {
            const p = o.material, P = new k({
              color: p.color ? p.color.getHex() : 16777215,
              map: p.map,
              metalness: .9,
              roughness: .1,
              envMapIntensity: 1.5
            });
            o.material = P;
          }
          o.castShadow = !0, o.receiveShadow = !0;
        }
      }), new D(this.renderer).compileEquirectangularShader();
      const f = new b(16777215, 1.2);
      this.scene.add(f), this.scene.add(this.model), this.modelLoaded = !0, this.scene.add(this.model), this.modelLoaded = !0, this.applyQualitySettings(this.currentQuality), this.loadingCallbacks.forEach(o => o()), this.loadingCallbacks = [], this.dispatchEvent(new CustomEvent("model-loaded"));
    }, s => {
      const n = Math.round(s.loaded / s.total * 100);
      this.dispatchEvent(new CustomEvent("progress", { detail: { progress: n } }));
    }, s => {
      console.error("Error loading model:", s), this.dispatchEvent(new CustomEvent("error", { detail: { message: s.message } }));
    });
  }
  
  updateSize() {
    if (!this.renderer) return;
    const t = this.getBoundingClientRect(), e = t.width, i = t.height;
    this.canvas.width = e, this.canvas.height = i, this.camera.aspect = e / i, this.camera.updateProjectionMatrix(), this.renderer.setSize(e, i, !1);
  }
  
  adaptQualityBasedOnPerformance(t) {
    !this.adaptiveQualityEnabled || this.defaultQuality !== "auto" || (t < 30 ? (this.lowPerformanceCount++, this.highPerformanceCount = 0, this.lowPerformanceCount >= this.performanceMonitor.qualityChangeThreshold && (this.currentQuality === "high" ? (console.debug("FPS bas détecté, passage à qualité moyenne"), this.currentQuality = "medium", this.applyQualitySettings(this.currentQuality)) : this.currentQuality === "medium" && (console.debug("FPS bas détecté, passage à qualité basse"), this.currentQuality = "low", this.applyQualitySettings(this.currentQuality)), this.lowPerformanceCount = 0)) : t > 55 ? (this.highPerformanceCount++, this.lowPerformanceCount = 0, this.highPerformanceCount >= this.performanceMonitor.qualityChangeThreshold * 2 && (this.currentQuality === "low" ? (console.debug("Bonnes performances détectées, passage à qualité moyenne"), this.currentQuality = "medium", this.applyQualitySettings(this.currentQuality)) : this.currentQuality === "medium" && !this.isMobileDevice && (console.debug("Excellentes performances détectées, passage à haute qualité"), this.currentQuality = "high", this.applyQualitySettings(this.currentQuality)), this.highPerformanceCount = 0)) : (this.lowPerformanceCount = 0, this.highPerformanceCount = 0));
  }
  
  animate() {
    this.animationFrame = requestAnimationFrame(() => this.animate());
    const t = performance.now();
    if (t - this.performanceMonitor.lastFrameTime, this.performanceMonitor.lastFrameTime = t, this.performanceMonitor.frameCount++, t >= this.performanceMonitor.lastFpsUpdateTime + this.performanceMonitor.fpsUpdateInterval) {
      const e = t - this.performanceMonitor.lastFpsUpdateTime, i = this.performanceMonitor.frameCount * 1e3 / e;
      this.performanceMonitor.fps = this.performanceMonitor.fps === 60 ? i : this.performanceMonitor.fps * (1 - this.performanceMonitor.fpsAlpha) + i * this.performanceMonitor.fpsAlpha, this.performanceMonitor.lastFpsUpdateTime = t, this.performanceMonitor.frameCount = 0, this.adaptQualityBasedOnPerformance(this.performanceMonitor.fps);
    }
    if (this.autoRotate && this.model && !this.isLowPowerDevice) this.currentRotation += .01, this.currentRotation > Math.PI * 2 && (this.currentRotation -= Math.PI * 2), this.model.rotation.y = this.currentRotation; else if (this.isAnimating && this.model && !this.isLowPowerDevice) {
      let e = this.targetRotation - this.currentRotation;
      e > Math.PI ? e -= Math.PI * 2 : e < -Math.PI && (e += Math.PI * 2), Math.abs(e) < .001 ? (this.currentRotation = this.targetRotation, this.isAnimating = !1) : (this.currentRotation += e * .1, this.currentRotation > Math.PI * 2 ? this.currentRotation -= Math.PI * 2 : this.currentRotation < 0 && (this.currentRotation += Math.PI * 2)), this.model.rotation.y = this.currentRotation;
    } else if (this.isAnimating && this.model && !this.isLowPowerDevice) {
      let e = this.targetRotation - this.currentRotation;
      if (e > Math.PI ? e -= Math.PI * 2 : e < -Math.PI && (e += Math.PI * 2), Math.abs(e) < .001) this.currentRotation = this.targetRotation, this.isAnimating = !1; else {
        const i = 1 - Math.abs(e) / (Math.PI * 2);
        let s;
        this.useCustomEasing && this.customEasingFunction ? s = this.customEasingFunction(i) * .2 : s = .1, this.currentRotation += e * s, this.currentRotation > Math.PI * 2 ? this.currentRotation -= Math.PI * 2 : this.currentRotation < 0 && (this.currentRotation += Math.PI * 2);
      }
      this.model.rotation.y = this.currentRotation;
    }
    this.renderer.render(this.scene, this.camera);
  }
  
  animateRotation() {
    this.model && (this.isAnimating || (this.isAnimating = !0, this.animate()));
  }
  
  rotate(t, e = !1) {
    const i = y.degToRad(t);
    return this.targetRotation = (i % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2), this.useCustomEasing = e && this.customEasing, this.isAnimating || (this.isAnimating = !0, this.animateRotation()), this;
  }
  
  setAutoRotate(t) {
    return t && this.isLowPowerDevice ? (console.debug("Rotation automatique non activée sur appareil de faible puissance"), this) : (this.autoRotate = t, this.setAttribute("auto-rotate", t ? "true" : "false"), this);
  }
  
  setQuality(t) {
    return this.setAttribute("quality", t), this;
  }
  
  enableAdaptiveQuality(t = !0) {
    return this.adaptiveQualityEnabled = t, this.setAttribute("adaptive-quality", t ? "true" : "false"), this;
  }
  
  onLoad(t) {
    return this.modelLoaded ? t() : this.loadingCallbacks.push(t), this;
  }
  
  setSource(t) {
    return this.setAttribute("src", t), this;
  }
}

export { B as default };
