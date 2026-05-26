var N = Object.defineProperty;
var x = (t, i, s) => i in t ? N(t, i, { enumerable: !0, configurable: !0, writable: !0, value: s }) : t[i] = s;
var o = (t, i, s) => x(t, typeof i != "symbol" ? i + "" : i, s);
import { s as M } from "./tools.js";

var W = "1.2.3";

function T(t, i, s) {
  return Math.max(t, Math.min(i, s));
}

function H(t, i, s) {
  return (1 - s) * t + s * i;
}

function k(t, i, s, e) {
  return H(t, i, 1 - Math.exp(-s * e));
}

function A(t, i) {
  return (t % i + i) % i;
}

var D = class {
  constructor() {
    o(this, "isRunning", !1);
    o(this, "value", 0);
    o(this, "from", 0);
    o(this, "to", 0);
    o(this, "currentTime", 0);
    o(this, "lerp");
    o(this, "duration");
    o(this, "easing");
    o(this, "onUpdate");
  }
  
  advance(t) {
    var s;
    if (!this.isRunning) return;
    let i = !1;
    if (this.duration && this.easing) {
      this.currentTime += t;
      const e = T(0, this.currentTime / this.duration, 1);
      i = e >= 1;
      const r = i ? 1 : this.easing(e);
      this.value = this.from + (this.to - this.from) * r;
    } else this.lerp ? (this.value = k(this.value, this.to, this.lerp * 60, t), Math.round(this.value) === this.to && (this.value = this.to, i = !0)) : (this.value = this.to, i = !0);
    i && this.stop(), (s = this.onUpdate) == null || s.call(this, this.value, i);
  }
  
  stop() {
    this.isRunning = !1;
  }
  
  fromTo(t, i, { lerp: s, duration: e, easing: r, onStart: n, onUpdate: l }) {
    this.from = this.value = t, this.to = i, this.lerp = s, this.duration = e, this.easing = r, this.currentTime = 0, this.isRunning = !0, n == null || n(), this.onUpdate = l;
  }
};

function O(t, i) {
  let s;
  return function(...e) {
    let r = this;
    clearTimeout(s), s = setTimeout(() => {
      s = void 0, t.apply(r, e);
    }, i);
  };
}

var q = class {
  constructor(t, i, { autoResize: s = !0, debounce: e = 250 } = {}) {
    o(this, "width", 0);
    o(this, "height", 0);
    o(this, "scrollHeight", 0);
    o(this, "scrollWidth", 0);
    o(this, "debouncedResize");
    o(this, "wrapperResizeObserver");
    o(this, "contentResizeObserver");
    o(this, "resize", () => {
      this.onWrapperResize(), this.onContentResize();
    });
    o(this, "onWrapperResize", () => {
      this.wrapper instanceof Window ? (this.width = window.innerWidth, this.height = window.innerHeight) : (this.width = this.wrapper.clientWidth, this.height = this.wrapper.clientHeight);
    });
    o(this, "onContentResize", () => {
      this.wrapper instanceof Window ? (this.scrollHeight = this.content.scrollHeight, this.scrollWidth = this.content.scrollWidth) : (this.scrollHeight = this.wrapper.scrollHeight, this.scrollWidth = this.wrapper.scrollWidth);
    });
    this.wrapper = t, this.content = i, s && (this.debouncedResize = O(this.resize, e), this.wrapper instanceof Window ? window.addEventListener("resize", this.debouncedResize, !1) : (this.wrapperResizeObserver = new ResizeObserver(this.debouncedResize), this.wrapperResizeObserver.observe(this.wrapper)), this.contentResizeObserver = new ResizeObserver(this.debouncedResize), this.contentResizeObserver.observe(this.content)), this.resize();
  }
  
  destroy() {
    var t, i;
    (t = this.wrapperResizeObserver) == null || t.disconnect(), (i = this.contentResizeObserver) == null || i.disconnect(), this.wrapper === window && this.debouncedResize && window.removeEventListener("resize", this.debouncedResize, !1);
  }
  
  get limit() {
    return { x: this.scrollWidth - this.width, y: this.scrollHeight - this.height };
  }
}, z = class {
  constructor() {
    o(this, "events", {});
  }
  
  emit(t, ...i) {
    var e;
    let s = this.events[t] || [];
    for (let r = 0, n = s.length; r < n; r++) (e = s[r]) == null || e.call(s, ...i);
  }
  
  on(t, i) {
    var s;
    return (s = this.events[t]) != null && s.push(i) || (this.events[t] = [i]), () => {
      var e;
      this.events[t] = (e = this.events[t]) == null ? void 0 : e.filter(r => i !== r);
    };
  }
  
  off(t, i) {
    var s;
    this.events[t] = (s = this.events[t]) == null ? void 0 : s.filter(e => i !== e);
  }
  
  destroy() {
    this.events = {};
  }
}, b = 100 / 6, v = { passive: !1 }, P = class {
  constructor(t, i = { wheelMultiplier: 1, touchMultiplier: 1 }) {
    o(this, "touchStart", { x: 0, y: 0 });
    o(this, "lastDelta", { x: 0, y: 0 });
    o(this, "window", { width: 0, height: 0 });
    o(this, "emitter", new z);
    o(this, "onTouchStart", t => {
      const { clientX: i, clientY: s } = t.targetTouches ? t.targetTouches[0] : t;
      this.touchStart.x = i, this.touchStart.y = s, this.lastDelta = {
        x: 0,
        y: 0
      }, this.emitter.emit("scroll", { deltaX: 0, deltaY: 0, event: t });
    });
    o(this, "onTouchMove", t => {
      const { clientX: i, clientY: s } = t.targetTouches ? t.targetTouches[0] : t,
        e = -(i - this.touchStart.x) * this.options.touchMultiplier,
        r = -(s - this.touchStart.y) * this.options.touchMultiplier;
      this.touchStart.x = i, this.touchStart.y = s, this.lastDelta = {
        x: e,
        y: r
      }, this.emitter.emit("scroll", { deltaX: e, deltaY: r, event: t });
    });
    o(this, "onTouchEnd", t => {
      this.emitter.emit("scroll", { deltaX: this.lastDelta.x, deltaY: this.lastDelta.y, event: t });
    });
    o(this, "onWheel", t => {
      let { deltaX: i, deltaY: s, deltaMode: e } = t;
      const r = e === 1 ? b : e === 2 ? this.window.width : 1, n = e === 1 ? b : e === 2 ? this.window.height : 1;
      i *= r, s *= n, i *= this.options.wheelMultiplier, s *= this.options.wheelMultiplier, this.emitter.emit("scroll", {
        deltaX: i,
        deltaY: s,
        event: t
      });
    });
    o(this, "onWindowResize", () => {
      this.window = { width: window.innerWidth, height: window.innerHeight };
    });
    this.element = t, this.options = i, window.addEventListener("resize", this.onWindowResize, !1), this.onWindowResize(), this.element.addEventListener("wheel", this.onWheel, v), this.element.addEventListener("touchstart", this.onTouchStart, v), this.element.addEventListener("touchmove", this.onTouchMove, v), this.element.addEventListener("touchend", this.onTouchEnd, v);
  }
  
  on(t, i) {
    return this.emitter.on(t, i);
  }
  
  destroy() {
    this.emitter.destroy(), window.removeEventListener("resize", this.onWindowResize, !1), this.element.removeEventListener("wheel", this.onWheel, v), this.element.removeEventListener("touchstart", this.onTouchStart, v), this.element.removeEventListener("touchmove", this.onTouchMove, v), this.element.removeEventListener("touchend", this.onTouchEnd, v);
  }
}, I = class {
  constructor({
                wrapper: t = window,
                content: i = document.documentElement,
                eventsTarget: s = t,
                smoothWheel: e = !0,
                syncTouch: r = !1,
                syncTouchLerp: n = .075,
                touchInertiaMultiplier: l = 35,
                duration: c,
                easing: h = _ => Math.min(1, 1.001 - Math.pow(2, -10 * _)),
                lerp: u = .1,
                infinite: p = !1,
                orientation: f = "vertical",
                gestureOrientation: a = "vertical",
                touchMultiplier: m = 1,
                wheelMultiplier: S = 1,
                autoResize: w = !0,
                prevent: d,
                virtualScroll: g,
                overscroll: y = !0,
                autoRaf: E = !1,
                anchors: R = !1,
                __experimental__naiveDimensions: L = !1
              } = {}) {
    o(this, "_isScrolling", !1);
    o(this, "_isStopped", !1);
    o(this, "_isLocked", !1);
    o(this, "_preventNextNativeScrollEvent", !1);
    o(this, "_resetVelocityTimeout", null);
    o(this, "__rafID", null);
    o(this, "isTouching");
    o(this, "time", 0);
    o(this, "userData", {});
    o(this, "lastVelocity", 0);
    o(this, "velocity", 0);
    o(this, "direction", 0);
    o(this, "options");
    o(this, "targetScroll");
    o(this, "animatedScroll");
    o(this, "animate", new D);
    o(this, "emitter", new z);
    o(this, "dimensions");
    o(this, "virtualScroll");
    o(this, "onScrollEnd", t => {
      t instanceof CustomEvent || (this.isScrolling === "smooth" || this.isScrolling === !1) && t.stopPropagation();
    });
    o(this, "dispatchScrollendEvent", () => {
      this.options.wrapper.dispatchEvent(new CustomEvent("scrollend", {
        bubbles: this.options.wrapper === window,
        detail: { lenisScrollEnd: !0 }
      }));
    });
    o(this, "onClick", t => {
      const s = t.composedPath().find(e => {
        var r, n, l;
        return e instanceof HTMLAnchorElement && (((r = e.getAttribute("href")) == null ? void 0 : r.startsWith("#")) || ((n = e.getAttribute("href")) == null ? void 0 : n.startsWith("/#")) || ((l = e.getAttribute("href")) == null ? void 0 : l.startsWith("./#")));
      });
      if (s) {
        const e = s.getAttribute("href");
        if (e) {
          const r = typeof this.options.anchors == "object" && this.options.anchors ? this.options.anchors : void 0;
          this.scrollTo(`#${e.split("#")[1]}`, r);
        }
      }
    });
    o(this, "onPointerDown", t => {
      t.button === 1 && this.reset();
    });
    o(this, "onVirtualScroll", t => {
      if (typeof this.options.virtualScroll == "function" && this.options.virtualScroll(t) === !1) return;
      const { deltaX: i, deltaY: s, event: e } = t;
      if (this.emitter.emit("virtual-scroll", {
        deltaX: i,
        deltaY: s,
        event: e
      }), e.ctrlKey || e.lenisStopPropagation) return;
      const r = e.type.includes("touch"), n = e.type.includes("wheel");
      this.isTouching = e.type === "touchstart" || e.type === "touchmove";
      const l = i === 0 && s === 0;
      if (this.options.syncTouch && r && e.type === "touchstart" && l && !this.isStopped && !this.isLocked) {
        this.reset();
        return;
      }
      const h = this.options.gestureOrientation === "vertical" && s === 0 || this.options.gestureOrientation === "horizontal" && i === 0;
      if (l || h) return;
      let u = e.composedPath();
      u = u.slice(0, u.indexOf(this.rootElement));
      const p = this.options.prevent;
      if (u.find(d => {
        var g, y, E;
        return d instanceof HTMLElement && (typeof p == "function" && (p == null ? void 0 : p(d)) || ((g = d.hasAttribute) == null ? void 0 : g.call(d, "data-lenis-prevent")) || r && ((y = d.hasAttribute) == null ? void 0 : y.call(d, "data-lenis-prevent-touch")) || n && ((E = d.hasAttribute) == null ? void 0 : E.call(d, "data-lenis-prevent-wheel")));
      })) return;
      if (this.isStopped || this.isLocked) {
        e.preventDefault();
        return;
      }
      if (!(this.options.syncTouch && r || this.options.smoothWheel && n)) {
        this.isScrolling = "native", this.animate.stop(), e.lenisStopPropagation = !0;
        return;
      }
      let a = s;
      this.options.gestureOrientation === "both" ? a = Math.abs(s) > Math.abs(i) ? s : i : this.options.gestureOrientation === "horizontal" && (a = i), (!this.options.overscroll || this.options.infinite || this.options.wrapper !== window && (this.animatedScroll > 0 && this.animatedScroll < this.limit || this.animatedScroll === 0 && s > 0 || this.animatedScroll === this.limit && s < 0)) && (e.lenisStopPropagation = !0), e.preventDefault();
      const m = r && this.options.syncTouch, w = r && e.type === "touchend" && Math.abs(a) > 5;
      w && (a = this.velocity * this.options.touchInertiaMultiplier), this.scrollTo(this.targetScroll + a, {
        programmatic: !1, ...m ? { lerp: w ? this.options.syncTouchLerp : 1 } : {
          lerp: this.options.lerp,
          duration: this.options.duration,
          easing: this.options.easing
        }
      });
    });
    o(this, "onNativeScroll", () => {
      if (this._resetVelocityTimeout !== null && (clearTimeout(this._resetVelocityTimeout), this._resetVelocityTimeout = null), this._preventNextNativeScrollEvent) {
        this._preventNextNativeScrollEvent = !1;
        return;
      }
      if (this.isScrolling === !1 || this.isScrolling === "native") {
        const t = this.animatedScroll;
        this.animatedScroll = this.targetScroll = this.actualScroll, this.lastVelocity = this.velocity, this.velocity = this.animatedScroll - t, this.direction = Math.sign(this.animatedScroll - t), this.isStopped || (this.isScrolling = "native"), this.emit(), this.velocity !== 0 && (this._resetVelocityTimeout = setTimeout(() => {
          this.lastVelocity = this.velocity, this.velocity = 0, this.isScrolling = !1, this.emit();
        }, 400));
      }
    });
    o(this, "raf", t => {
      const i = t - (this.time || t);
      this.time = t, this.animate.advance(i * .001), this.options.autoRaf && (this.__rafID = requestAnimationFrame(this.raf));
    });
    window.lenisVersion = W, (!t || t === document.documentElement) && (t = window), this.options = {
      wrapper: t,
      content: i,
      eventsTarget: s,
      smoothWheel: e,
      syncTouch: r,
      syncTouchLerp: n,
      touchInertiaMultiplier: l,
      duration: c,
      easing: h,
      lerp: u,
      infinite: p,
      gestureOrientation: a,
      orientation: f,
      touchMultiplier: m,
      wheelMultiplier: S,
      autoResize: w,
      prevent: d,
      virtualScroll: g,
      overscroll: y,
      autoRaf: E,
      anchors: R,
      __experimental__naiveDimensions: L
    }, this.dimensions = new q(t, i, { autoResize: w }), this.updateClassName(), this.targetScroll = this.animatedScroll = this.actualScroll, this.options.wrapper.addEventListener("scroll", this.onNativeScroll, !1), this.options.wrapper.addEventListener("scrollend", this.onScrollEnd, { capture: !0 }), this.options.anchors && this.options.wrapper === window && this.options.wrapper.addEventListener("click", this.onClick, !1), this.options.wrapper.addEventListener("pointerdown", this.onPointerDown, !1), this.virtualScroll = new P(s, {
      touchMultiplier: m,
      wheelMultiplier: S
    }), this.virtualScroll.on("scroll", this.onVirtualScroll), this.options.autoRaf && (this.__rafID = requestAnimationFrame(this.raf));
  }
  
  destroy() {
    this.emitter.destroy(), this.options.wrapper.removeEventListener("scroll", this.onNativeScroll, !1), this.options.wrapper.removeEventListener("scrollend", this.onScrollEnd, { capture: !0 }), this.options.wrapper.removeEventListener("pointerdown", this.onPointerDown, !1), this.options.anchors && this.options.wrapper === window && this.options.wrapper.removeEventListener("click", this.onClick, !1), this.virtualScroll.destroy(), this.dimensions.destroy(), this.cleanUpClassName(), this.__rafID && cancelAnimationFrame(this.__rafID);
  }
  
  on(t, i) {
    return this.emitter.on(t, i);
  }
  
  off(t, i) {
    return this.emitter.off(t, i);
  }
  
  setScroll(t) {
    this.isHorizontal ? this.options.wrapper.scrollTo({
      left: t,
      behavior: "instant"
    }) : this.options.wrapper.scrollTo({ top: t, behavior: "instant" });
  }
  
  resize() {
    this.dimensions.resize(), this.animatedScroll = this.targetScroll = this.actualScroll, this.emit();
  }
  
  emit() {
    this.emitter.emit("scroll", this);
  }
  
  reset() {
    this.isLocked = !1, this.isScrolling = !1, this.animatedScroll = this.targetScroll = this.actualScroll, this.lastVelocity = this.velocity = 0, this.animate.stop();
  }
  
  start() {
    this.isStopped && (this.reset(), this.isStopped = !1);
  }
  
  stop() {
    this.isStopped || (this.reset(), this.isStopped = !0);
  }
  
  scrollTo(t, {
    offset: i = 0,
    immediate: s = !1,
    lock: e = !1,
    duration: r = this.options.duration,
    easing: n = this.options.easing,
    lerp: l = this.options.lerp,
    onStart: c,
    onComplete: h,
    force: u = !1,
    programmatic: p = !0,
    userData: f
  } = {}) {
    if (!((this.isStopped || this.isLocked) && !u)) {
      if (typeof t == "string" && ["top", "left", "start"].includes(t)) t = 0; else if (typeof t == "string" && ["bottom", "right", "end"].includes(t)) t = this.limit; else {
        let a;
        if (typeof t == "string" ? a = document.querySelector(t) : t instanceof HTMLElement && (t != null && t.nodeType) && (a = t), a) {
          if (this.options.wrapper !== window) {
            const S = this.rootElement.getBoundingClientRect();
            i -= this.isHorizontal ? S.left : S.top;
          }
          const m = a.getBoundingClientRect();
          t = (this.isHorizontal ? m.left : m.top) + this.animatedScroll;
        }
      }
      if (typeof t == "number") {
        if (t += i, t = Math.round(t), this.options.infinite ? p && (this.targetScroll = this.animatedScroll = this.scroll) : t = T(0, t, this.limit), t === this.targetScroll) {
          c == null || c(this), h == null || h(this);
          return;
        }
        if (this.userData = f ?? {}, s) {
          this.animatedScroll = this.targetScroll = t, this.setScroll(this.scroll), this.reset(), this.preventNextNativeScrollEvent(), this.emit(), h == null || h(this), this.userData = {}, requestAnimationFrame(() => {
            this.dispatchScrollendEvent();
          });
          return;
        }
        p || (this.targetScroll = t), this.animate.fromTo(this.animatedScroll, t, {
          duration: r,
          easing: n,
          lerp: l,
          onStart: () => {
            e && (this.isLocked = !0), this.isScrolling = "smooth", c == null || c(this);
          },
          onUpdate: (a, m) => {
            this.isScrolling = "smooth", this.lastVelocity = this.velocity, this.velocity = a - this.animatedScroll, this.direction = Math.sign(this.velocity), this.animatedScroll = a, this.setScroll(this.scroll), p && (this.targetScroll = a), m || this.emit(), m && (this.reset(), this.emit(), h == null || h(this), this.userData = {}, requestAnimationFrame(() => {
              this.dispatchScrollendEvent();
            }), this.preventNextNativeScrollEvent());
          }
        });
      }
    }
  }
  
  preventNextNativeScrollEvent() {
    this._preventNextNativeScrollEvent = !0, requestAnimationFrame(() => {
      this._preventNextNativeScrollEvent = !1;
    });
  }
  
  get rootElement() {
    return this.options.wrapper === window ? document.documentElement : this.options.wrapper;
  }
  
  get limit() {
    return this.options.__experimental__naiveDimensions ? this.isHorizontal ? this.rootElement.scrollWidth - this.rootElement.clientWidth : this.rootElement.scrollHeight - this.rootElement.clientHeight : this.dimensions.limit[this.isHorizontal ? "x" : "y"];
  }
  
  get isHorizontal() {
    return this.options.orientation === "horizontal";
  }
  
  get actualScroll() {
    const t = this.options.wrapper;
    return this.isHorizontal ? t.scrollX ?? t.scrollLeft : t.scrollY ?? t.scrollTop;
  }
  
  get scroll() {
    return this.options.infinite ? A(this.animatedScroll, this.limit) : this.animatedScroll;
  }
  
  get progress() {
    return this.limit === 0 ? 1 : this.scroll / this.limit;
  }
  
  get isScrolling() {
    return this._isScrolling;
  }
  
  set isScrolling(t) {
    this._isScrolling !== t && (this._isScrolling = t, this.updateClassName());
  }
  
  get isStopped() {
    return this._isStopped;
  }
  
  set isStopped(t) {
    this._isStopped !== t && (this._isStopped = t, this.updateClassName());
  }
  
  get isLocked() {
    return this._isLocked;
  }
  
  set isLocked(t) {
    this._isLocked !== t && (this._isLocked = t, this.updateClassName());
  }
  
  get isSmooth() {
    return this.isScrolling === "smooth";
  }
  
  get className() {
    let t = "lenis";
    return this.isStopped && (t += " lenis-stopped"), this.isLocked && (t += " lenis-locked"), this.isScrolling && (t += " lenis-scrolling"), this.isScrolling === "smooth" && (t += " lenis-smooth"), t;
  }
  
  updateClassName() {
    this.cleanUpClassName(), this.rootElement.className = `${this.rootElement.className} ${this.className}`.trim();
  }
  
  cleanUpClassName() {
    this.rootElement.className = this.rootElement.className.replace(/lenis(-\w+)?/g, "").trim();
  }
};

class X extends HTMLElement {
  constructor() {
    super(), this.lenis = new I({ autoRaf: !0 }), M(this.lenis), this.transition = document.querySelector("t-transition"), this.bag = document.querySelector("t-open-bag"), this.menuMobile = document.querySelector("t-open-menu-mobile"), this.reloadJs = document.querySelector("t-reload-js"), this.footer = document.querySelector("footer"), this.logo = document.querySelector("t-logo"), this.progressBar = document.querySelector("[data-scroll-bar-progress]"), this.currentRotation = 0, this.rotationFactor = .2, this.footerProgress = 0, this.footerBar = document.querySelector("[data-bar-footer]");
  }
  
  handleScroll(i) {
    const s = i.progress * 100;
    this.progressBar.style.width = `${s}%`;
    const e = i.velocity, r = document.documentElement.scrollHeight - window.innerHeight, n = this.lenis.actualScroll;
    if (n <= 5 || n >= r - 5) {
      const c = (this.currentRotation % 360 + 360) % 360, h = Math.min(c, 360 - c), u = Math.abs(c - 180);
      h <= u ? this.currentRotation = c < 180 ? 0 : 360 : this.currentRotation = 180;
    } else this.currentRotation += e * this.rotationFactor;
    this.logo && this.logo.rotate(this.currentRotation);
    const l = document.querySelector("t-hero-three");
    l && l.webgl && typeof l.handleScroll == "function" && l.handleScroll(i);
  }
  
  connectedCallback() {
    this.lenis.on("scroll", this.handleScroll.bind(this)), this.footer;
  }
  
  static get observedAttributes() {
    return ["data-scroll-transition", "data-reload-collection"];
  }
  
  attributeChangedCallback(i, s, e) {
    var r, n, l, c, h, u, p;
    if (i === "data-scroll-transition") {
      if (e === "true") {
        const f = `-${this.lenis.actualScroll}px`;
        (r = this.transition) == null || r.setAttribute("data-scroll-top", f), (n = this.bag) == null || n.setAttribute("data-scroll", "null"), this.lenis.stop(), this.lenis.setScroll(0);
      }
      if (e === "end-transition-play-scroll") {
        if (this.valueScroll = (c = (l = this.bag) == null ? void 0 : l.getAttribute("data-scroll")) == null ? void 0 : c.split("_")[1], this.valueScroll) {
          const a = this.valueScroll.replace("-", "").replace("px", "");
          this.lenis.setScroll(a);
        }
        this.lenis.start(), this.valueScroll || (h = this.reloadJs) == null || h.setAttribute("data-transition-page", "true");
      }
      if (e === "bag") {
        const f = `-${this.lenis.actualScroll}px`;
        (u = this.bag) == null || u.setAttribute("data-scroll", `stop_${f}`), this.lenis.stop();
      }
      e === "menu" && (this.lenis.stop(), (p = this.menuMobile) == null || p.setAttribute("data-scroll", "stop")), e === "panel-details" && this.lenis.stop(), e === "three" && this.lenis.stop(), e === "filter-mobile" && (this.lenis.stop(), document.documentElement.classList.add("lenis-special-filter"));
    }
    i === "data-reload-collection" && e === "collection" && this.lenis.scrollTo(0, { duration: .5 });
  }
  
  disconnectedCallback() {
    this.lenis.destroy(), this.footer && this.footer.removeEventListener("wheel", this.handleFooterWheel.bind(this));
  }
}

export { X as default };
