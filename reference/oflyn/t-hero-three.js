import { g as Zi } from "./tools.js";
import { g as Q } from "./imndex.js";
import {
  $ as Mr,
  _ as Sr,
  a as nt,
  A as _r,
  a0 as tt,
  a1 as Tr,
  a2 as kr,
  a3 as Rr,
  b as ur,
  B as Ft,
  C as st,
  c as E,
  d as pr,
  D as Gs,
  e as mr,
  E as xi,
  f as es,
  F as gr,
  g as z,
  G as it,
  h as vr,
  H as ts,
  i as fr,
  I as wr,
  j as br,
  J as xr,
  k as re,
  K as yr,
  L as ie,
  l as y,
  M as ze,
  m as Ws,
  N as Ks,
  n as ci,
  o as qs,
  O as je,
  P as js,
  p as _e,
  Q as Qi,
  q as Et,
  R as dr,
  r as we,
  S as Ji,
  s as K,
  T as Ie,
  t as We,
  U as Te,
  u as $s,
  V as b,
  v as dt,
  W as hr,
  w as Ys,
  x as Xs,
  X as Pr,
  y as Zs,
  Y as Cr,
  z as hi,
  Z as Er
} from "./threeDR6a5Kiu.js";
import { D as Dr, G as Ar } from "./GLTFLoaderC1FxACvP.js";

const St = document.documentElement;
let Y;

function Lr() {
  Y = document.createElement("div"), Object.assign(Y.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "200px",
    height: "10px",
    overflowY: "scroll",
    pointerEvents: "none",
    userSelect: "none",
    zIndex: -1,
    opacity: 0
  });
  
  function t() {
    const i = document.createElement("div"), s = { width: "1px", height: "100vh", overflowY: "hidden" };
    Object.assign(Y.style, {
      width: "200px",
      height: "10px",
      overflowY: "scroll"
    }), Object.assign(i.style, { width: "100%", height: "150%" }), Y.appendChild(i), document.body.appendChild(Y);
    const n = parseFloat(getComputedStyle(St).zoom), r = isNaN(n) ? 1 : n, o = Math.round((200 - Y.clientWidth) * r);
    return St.style.setProperty("--scrollbar-width", o + "px"), document.body.removeChild(Y), Y.removeChild(i), Object.assign(Y.style, s), o;
  }
  
  function e() {
    document.body.appendChild(Y);
    const s = Y.getBoundingClientRect().height;
    return document.body.removeChild(Y), St.style.setProperty("--inner-height", window.innerHeight + "px"), St.style.setProperty("--vp-height", s + "px"), s;
  }
  
  return { measureScrollbarWidth: t, measureViewportHeight: e };
}

function Br(t, e = 1, i = {}, s) {
  const n = i.bind || null, r = i.trail != null ? !!i.trail : !0;
  i.tail != null && i.tail;
  let o, a, l, h = null, c = r;
  
  function u() {
    h = null, r && (c = !0), t.call(n, o, a, l);
  }
  
  return function(p, d, f) {
    clearTimeout(h), h = null, o = p, a = d, l = f, r && c && (c = !1, t.call(n, o, a, l)), h === null && (h = setTimeout(u, e));
  };
}

function is(t, e, i, s) {
  this.fn = e, this.ctx = i || null, this.owner = t, this.once = !!s;
}

function $t(t) {
  if (!t || !t.owner) return;
  t.prev && (t.prev.next = t.next), t.next && (t.next.prev = t.prev);
  const e = t.owner;
  t.ctx = t.fn = t.owner = null, t === e._first && (e._first = t.next), t === e._last && (e._last = t.prev);
}

class Dt {
  constructor() {
    this._first = this._last = null, this._isStoreSignal = !0;
  }
  
  emit(e, i, s) {
    let n = this._first;
    for (; n;) n.fn.call(n.ctx, e, i, s), n.once && this.unwatch(n), n = n.next;
  }
  
  watch(e, i, s) {
    const n = new is(this, e, i, s);
    return this._first ? (this._last.next = n, n.prev = this._last, this._last = n) : (this._first = n, this._last = n), n;
  }
  
  watchOnce(e, i) {
    return this.watch(e, i, !0);
  }
  
  unwatch(e, i) {
    if (e instanceof is) return $t(e);
    i || (i = null);
    let s = this._first;
    for (; s;) s.fn === e && s.ctx === i && $t(s), s = s.next;
  }
  
  unwatchAll() {
    let e = this._first;
    for (this._first = this._last = null; e;) $t(e), e = e.next;
  }
}

Dt.prototype.destroy = Dt.prototype.unwatchAll;

function ui() {
  return new Dt;
}

function Vr(t) {
  let e;
  const i = Br(r, 200, { trail: !1 }),
    s = { width: 10, height: 10, domHeight: 10, viewportRatio: 1, pixelRatio: 1, visible: !0, scrollBar: 0 };
  
  function n() {
    e = Lr(), s.scrollBar = e.measureScrollbarWidth(), document.addEventListener("visibilitychange", a, !1), window.addEventListener("resize", () => {
      i();
    }, !1), t.hooks.resize = ui(), r();
  }
  
  function r() {
    o(), s.width = window.innerWidth, s.height = window.innerWidth <= 768 ? window.screen.height - 184 : window.innerHeight, s.domHeight = e.measureViewportHeight(), s.viewportRatio = s.width / s.height, t.hooks.resize.emit();
  }
  
  function o() {
    s.pixelRatio = window.devicePixelRatio || 1;
  }
  
  function a() {
    s.visible = !document.hidden, r();
  }
  
  n(), t.viewport = s;
}

function Qs(t, e = 0, i = 1) {
  return Math.min(Math.max(t, e), i);
}

function ss(t, e, i, s, n) {
  return s + (n - s) * ((t - e) / (i - e));
}

function Yt(t, e, i, s, n) {
  const r = s + (n - s) * ((t - e) / (i - e));
  return Math.max(s, Math.min(n, r));
}

function Ee(t, e, i) {
  return t * (1 - i) + e * i;
}

function pe(t, e, i, s) {
  return Ee(t, e, 1 - Math.exp(-i * .05 * s));
}

function Xt(t = 6) {
  const e = new Float64Array(t), i = { value: 0, push: o, reset: a };
  let s, n, r;
  return s = n = r = 0, i;
  
  function o(l) {
    s < t && s++, r = (r + 1) % t;
    const h = e[r];
    return e[r] = l, n += l - h, i.value = n / s;
  }
  
  function a() {
    s = n = r = 0;
    for (let l = 0; l < t; l++) e[l] = 0;
  }
}

const Or = Number.MAX_SAFE_INTEGER;

function Ur(t) {
  const e = Xt(20), i = Xt(6);
  let s = !1, n = performance.now();
  const r = Xt(20);
  t.hooks.afterFrame.watchOnce(() => {
    s = !0;
  });
  const o = {
    dt: 0,
    clampedDt: 0,
    averageDt: 16.6667,
    stableDt: 16.6667,
    elapsed: 0,
    pausedElapsed: 0,
    frameNum: 0,
    isPaused: !0,
    isStarted: !0,
    clampFps: 60,
    set clampTo60Fps(d) {
      o.clampFps = d ? 60 : 0;
    },
    init: a,
    start: c,
    stop: u,
    resume: l,
    pause: h,
    customLoop: null
  };
  
  function a() {
    o.customLoop ? o.customLoop(p) : Q.ticker.add(p), o.isStarted = !0, o.isPaused = !1;
  }
  
  function l() {
    o.isPaused = !1;
  }
  
  function h() {
    o.isPaused = !0;
  }
  
  function c() {
    o.isStarted = !0;
  }
  
  function u() {
    o.isStarted = !1;
  }
  
  function p(d) {
    const f = n;
    n = performance.now(), d = n - f, d === 0 && (d = 16.6667), s && (s = !1, d = 16.6667, e.reset(), i.reset(), r.reset()), o.clampedDt = Qs(d === void 0 ? 16.6667 : d, 1, 130), o.averageDt = e.push(d), o.dt = d, o.frameNum = (o.frameNum + 1) % Or, o.elapsed += d, o.isStarted && (o.isPaused || (o.pausedElapsed += d, t.frame()));
  }
  
  t.time = o;
}

const Ir = { "3k": 2880 * 1620 };

function zr(t) {
  let e;
  const i = new st("#7A7C79");
  let s = 1, n = 2, r = Ir["3k"];
  const o = new b;
  let a = 1;
  const l = { antialias: !0, alpha: !1, debug: !0 },
    h = { init: c, drawingBufferSize: o, pixelRatio: a, resize: u, destroy: d };
  t.hooks.beforeFrame.watch(() => {
    e.info.reset();
  });
  
  function c() {
    l.canvas = document.querySelector("[data-canvas]"), e = new hr(l), e.setClearColor(i), t.threeRenderer = e, u();
  }
  
  function u() {
    const { width: f, height: m, domHeight: B } = t.viewport;
    let v = Qs(t.viewport.pixelRatio, s, n);
    const x = new b, g = new b(f, m);
    e.getSize(x);
    let A = v * f * m;
    A > r && (v /= A / r), e.getPixelRatio() !== v && e.setPixelRatio(v), x.equals(g) || e.setSize(g.x, g.y), p();
  }
  
  function p() {
    const f = new b;
    e.getDrawingBufferSize(f), o.copy(f), a = e.getPixelRatio();
  }
  
  function d() {
    e.dispose();
  }
  
  t.renderer = h;
}

function Fr(t) {
  const e = {
    time: { type: "f", value: 0 },
    viewport: { type: "v4", value: new nt },
    res: { type: "v2", value: new b }
  }, i = { PI: Math.PI, PI2: Math.PI * 2, PI_HALF: Math.PI * .5 };
  
  function s() {
    const { viewport: r, res: o } = e, { width: a, height: l, pixelRatio: h, viewportRatio: c } = t.viewport;
    r.value.set(a, l, h, c), o.value.copy(t.renderer.drawingBufferSize);
  }
  
  function n() {
    const { elapsed: r, stableDt: o } = t.time;
    e.time.value = r * .001;
  }
  
  Object.assign(t, { uniforms: e, defines: i, shaders: { resize: s, update: n } });
}/*! Tweakpane 4.0.5 (c) 2016 cocopon, licensed under the MIT license. */
function R(t) {
  return t == null;
}

function yi(t) {
  return t !== null && typeof t == "object";
}

function di(t) {
  return t !== null && typeof t == "object";
}

function Nr(t, e) {
  if (t.length !== e.length) return !1;
  for (let i = 0; i < t.length; i++) if (t[i] !== e[i]) return !1;
  return !0;
}

function ke(t, e) {
  return Array.from(new Set([...Object.keys(t), ...Object.keys(e)])).reduce((s, n) => {
    const r = t[n], o = e[n];
    return di(r) && di(o) ? Object.assign(Object.assign({}, s), { [n]: ke(r, o) }) : Object.assign(Object.assign({}, s), { [n]: n in e ? o : r });
  }, {});
}

function Pi(t) {
  return yi(t) ? "target" in t : !1;
}

const Hr = {
  alreadydisposed: () => "View has been already disposed",
  invalidparams: t => `Invalid parameters for '${t.name}'`,
  nomatchingcontroller: t => `No matching controller for '${t.key}'`,
  nomatchingview: t => `No matching view for '${JSON.stringify(t.params)}'`,
  notbindable: () => "Value is not bindable",
  notcompatible: t => `Not compatible with  plugin '${t.id}'`,
  propertynotfound: t => `Property '${t.name}' not found`,
  shouldneverhappen: () => "This error should never happen"
};

class V {
  static alreadyDisposed() {
    return new V({ type: "alreadydisposed" });
  }
  
  static notBindable() {
    return new V({ type: "notbindable" });
  }
  
  static notCompatible(e, i) {
    return new V({ type: "notcompatible", context: { id: `${e}.${i}` } });
  }
  
  static propertyNotFound(e) {
    return new V({ type: "propertynotfound", context: { name: e } });
  }
  
  static shouldNeverHappen() {
    return new V({ type: "shouldneverhappen" });
  }
  
  constructor(e) {
    var i;
    this.message = (i = Hr[e.type](e.context)) !== null && i !== void 0 ? i : "Unexpected error", this.name = this.constructor.name, this.stack = new Error(this.message).stack, this.type = e.type;
  }
  
  toString() {
    return this.message;
  }
}

class Lt {
  constructor(e, i) {
    this.obj_ = e, this.key = i;
  }
  
  static isBindable(e) {
    return !(e === null || typeof e != "object" && typeof e != "function");
  }
  
  read() {
    return this.obj_[this.key];
  }
  
  write(e) {
    this.obj_[this.key] = e;
  }
  
  writeProperty(e, i) {
    const s = this.read();
    if (!Lt.isBindable(s)) throw V.notBindable();
    if (!(e in s)) throw V.propertyNotFound(e);
    s[e] = i;
  }
}

class O {
  constructor() {
    this.observers_ = {};
  }
  
  on(e, i, s) {
    var n;
    let r = this.observers_[e];
    return r || (r = this.observers_[e] = []), r.push({
      handler: i,
      key: (n = s == null ? void 0 : s.key) !== null && n !== void 0 ? n : i
    }), this;
  }
  
  off(e, i) {
    const s = this.observers_[e];
    return s && (this.observers_[e] = s.filter(n => n.key !== i)), this;
  }
  
  emit(e, i) {
    const s = this.observers_[e];
    s && s.forEach(n => {
      n.handler(i);
    });
  }
}

class jr {
  constructor(e, i) {
    var s;
    this.constraint_ = i == null ? void 0 : i.constraint, this.equals_ = (s = i == null ? void 0 : i.equals) !== null && s !== void 0 ? s : (n, r) => n === r, this.emitter = new O, this.rawValue_ = e;
  }
  
  get constraint() {
    return this.constraint_;
  }
  
  get rawValue() {
    return this.rawValue_;
  }
  
  set rawValue(e) {
    this.setRawValue(e, { forceEmit: !1, last: !0 });
  }
  
  setRawValue(e, i) {
    const s = i ?? { forceEmit: !1, last: !0 }, n = this.constraint_ ? this.constraint_.constrain(e) : e,
      r = this.rawValue_;
    this.equals_(r, n) && !s.forceEmit || (this.emitter.emit("beforechange", { sender: this }), this.rawValue_ = n, this.emitter.emit("change", {
      options: s,
      previousRawValue: r,
      rawValue: n,
      sender: this
    }));
  }
}

class Gr {
  constructor(e) {
    this.emitter = new O, this.value_ = e;
  }
  
  get rawValue() {
    return this.value_;
  }
  
  set rawValue(e) {
    this.setRawValue(e, { forceEmit: !1, last: !0 });
  }
  
  setRawValue(e, i) {
    const s = i ?? { forceEmit: !1, last: !0 }, n = this.value_;
    n === e && !s.forceEmit || (this.emitter.emit("beforechange", { sender: this }), this.value_ = e, this.emitter.emit("change", {
      options: s,
      previousRawValue: n,
      rawValue: this.value_,
      sender: this
    }));
  }
}

class Wr {
  constructor(e) {
    this.emitter = new O, this.onValueBeforeChange_ = this.onValueBeforeChange_.bind(this), this.onValueChange_ = this.onValueChange_.bind(this), this.value_ = e, this.value_.emitter.on("beforechange", this.onValueBeforeChange_), this.value_.emitter.on("change", this.onValueChange_);
  }
  
  get rawValue() {
    return this.value_.rawValue;
  }
  
  onValueBeforeChange_(e) {
    this.emitter.emit("beforechange", Object.assign(Object.assign({}, e), { sender: this }));
  }
  
  onValueChange_(e) {
    this.emitter.emit("change", Object.assign(Object.assign({}, e), { sender: this }));
  }
}

function D(t, e) {
  const i = e == null ? void 0 : e.constraint, s = e == null ? void 0 : e.equals;
  return !i && !s ? new Gr(t) : new jr(t, e);
}

function Kr(t) {
  return [new Wr(t), (e, i) => {
    t.setRawValue(e, i);
  }];
}

class _ {
  constructor(e) {
    this.emitter = new O, this.valMap_ = e;
    for (const i in this.valMap_) this.valMap_[i].emitter.on("change", () => {
      this.emitter.emit("change", { key: i, sender: this });
    });
  }
  
  static createCore(e) {
    return Object.keys(e).reduce((s, n) => Object.assign(s, { [n]: D(e[n]) }), {});
  }
  
  static fromObject(e) {
    const i = this.createCore(e);
    return new _(i);
  }
  
  get(e) {
    return this.valMap_[e].rawValue;
  }
  
  set(e, i) {
    this.valMap_[e].rawValue = i;
  }
  
  value(e) {
    return this.valMap_[e];
  }
}

class pt {
  constructor(e) {
    this.values = _.fromObject({ max: e.max, min: e.min });
  }
  
  constrain(e) {
    const i = this.values.get("max"), s = this.values.get("min");
    return Math.min(Math.max(e, s), i);
  }
}

class qr {
  constructor(e) {
    this.values = _.fromObject({ max: e.max, min: e.min });
  }
  
  constrain(e) {
    const i = this.values.get("max"), s = this.values.get("min");
    let n = e;
    return R(s) || (n = Math.max(n, s)), R(i) || (n = Math.min(n, i)), n;
  }
}

class $r {
  constructor(e, i = 0) {
    this.step = e, this.origin = i;
  }
  
  constrain(e) {
    const i = this.origin % this.step, s = Math.round((e - i) / this.step);
    return i + s * this.step;
  }
}

class Yr {
  constructor(e) {
    this.text = e;
  }
  
  evaluate() {
    return Number(this.text);
  }
  
  toString() {
    return this.text;
  }
}

const Xr = {
  "**": (t, e) => Math.pow(t, e),
  "*": (t, e) => t * e,
  "/": (t, e) => t / e,
  "%": (t, e) => t % e,
  "+": (t, e) => t + e,
  "-": (t, e) => t - e,
  "<<": (t, e) => t << e,
  ">>": (t, e) => t >> e,
  ">>>": (t, e) => t >>> e,
  "&": (t, e) => t & e,
  "^": (t, e) => t ^ e,
  "|": (t, e) => t | e
};

class Zr {
  constructor(e, i, s) {
    this.left = i, this.operator = e, this.right = s;
  }
  
  evaluate() {
    const e = Xr[this.operator];
    if (!e) throw new Error(`unexpected binary operator: '${this.operator}`);
    return e(this.left.evaluate(), this.right.evaluate());
  }
  
  toString() {
    return ["b(", this.left.toString(), this.operator, this.right.toString(), ")"].join(" ");
  }
}

const Qr = { "+": t => t, "-": t => -t, "~": t => ~t };

class Jr {
  constructor(e, i) {
    this.operator = e, this.expression = i;
  }
  
  evaluate() {
    const e = Qr[this.operator];
    if (!e) throw new Error(`unexpected unary operator: '${this.operator}`);
    return e(this.expression.evaluate());
  }
  
  toString() {
    return ["u(", this.operator, this.expression.toString(), ")"].join(" ");
  }
}

function Ci(t) {
  return (e, i) => {
    for (let s = 0; s < t.length; s++) {
      const n = t[s](e, i);
      if (n !== "") return n;
    }
    return "";
  };
}

function rt(t, e) {
  var i;
  const s = t.substr(e).match(/^\s+/);
  return (i = s && s[0]) !== null && i !== void 0 ? i : "";
}

function eo(t, e) {
  const i = t.substr(e, 1);
  return i.match(/^[1-9]$/) ? i : "";
}

function ot(t, e) {
  var i;
  const s = t.substr(e).match(/^[0-9]+/);
  return (i = s && s[0]) !== null && i !== void 0 ? i : "";
}

function to(t, e) {
  const i = ot(t, e);
  if (i !== "") return i;
  const s = t.substr(e, 1);
  if (e += 1, s !== "-" && s !== "+") return "";
  const n = ot(t, e);
  return n === "" ? "" : s + n;
}

function Ei(t, e) {
  const i = t.substr(e, 1);
  if (e += 1, i.toLowerCase() !== "e") return "";
  const s = to(t, e);
  return s === "" ? "" : i + s;
}

function Js(t, e) {
  const i = t.substr(e, 1);
  if (i === "0") return i;
  const s = eo(t, e);
  return e += s.length, s === "" ? "" : s + ot(t, e);
}

function io(t, e) {
  const i = Js(t, e);
  if (e += i.length, i === "") return "";
  const s = t.substr(e, 1);
  if (e += s.length, s !== ".") return "";
  const n = ot(t, e);
  return e += n.length, i + s + n + Ei(t, e);
}

function so(t, e) {
  const i = t.substr(e, 1);
  if (e += i.length, i !== ".") return "";
  const s = ot(t, e);
  return e += s.length, s === "" ? "" : i + s + Ei(t, e);
}

function no(t, e) {
  const i = Js(t, e);
  return e += i.length, i === "" ? "" : i + Ei(t, e);
}

const ro = Ci([io, so, no]);

function oo(t, e) {
  var i;
  const s = t.substr(e).match(/^[01]+/);
  return (i = s && s[0]) !== null && i !== void 0 ? i : "";
}

function ao(t, e) {
  const i = t.substr(e, 2);
  if (e += i.length, i.toLowerCase() !== "0b") return "";
  const s = oo(t, e);
  return s === "" ? "" : i + s;
}

function lo(t, e) {
  var i;
  const s = t.substr(e).match(/^[0-7]+/);
  return (i = s && s[0]) !== null && i !== void 0 ? i : "";
}

function co(t, e) {
  const i = t.substr(e, 2);
  if (e += i.length, i.toLowerCase() !== "0o") return "";
  const s = lo(t, e);
  return s === "" ? "" : i + s;
}

function ho(t, e) {
  var i;
  const s = t.substr(e).match(/^[0-9a-f]+/i);
  return (i = s && s[0]) !== null && i !== void 0 ? i : "";
}

function uo(t, e) {
  const i = t.substr(e, 2);
  if (e += i.length, i.toLowerCase() !== "0x") return "";
  const s = ho(t, e);
  return s === "" ? "" : i + s;
}

const po = Ci([ao, co, uo]), mo = Ci([po, ro]);

function vo(t, e) {
  const i = mo(t, e);
  return e += i.length, i === "" ? null : { evaluable: new Yr(i), cursor: e };
}

function fo(t, e) {
  const i = t.substr(e, 1);
  if (e += i.length, i !== "(") return null;
  const s = tn(t, e);
  if (!s) return null;
  e = s.cursor, e += rt(t, e).length;
  const n = t.substr(e, 1);
  return e += n.length, n !== ")" ? null : { evaluable: s.evaluable, cursor: e };
}

function bo(t, e) {
  var i;
  return (i = vo(t, e)) !== null && i !== void 0 ? i : fo(t, e);
}

function en(t, e) {
  const i = bo(t, e);
  if (i) return i;
  const s = t.substr(e, 1);
  if (e += s.length, s !== "+" && s !== "-" && s !== "~") return null;
  const n = en(t, e);
  return n ? (e = n.cursor, { cursor: e, evaluable: new Jr(s, n.evaluable) }) : null;
}

function go(t, e, i) {
  i += rt(e, i).length;
  const s = t.filter(n => e.startsWith(n, i))[0];
  return s ? (i += s.length, i += rt(e, i).length, { cursor: i, operator: s }) : null;
}

function _o(t, e) {
  return (i, s) => {
    const n = t(i, s);
    if (!n) return null;
    s = n.cursor;
    let r = n.evaluable;
    for (; ;) {
      const o = go(e, i, s);
      if (!o) break;
      s = o.cursor;
      const a = t(i, s);
      if (!a) return null;
      s = a.cursor, r = new Zr(o.operator, r, a.evaluable);
    }
    return r ? { cursor: s, evaluable: r } : null;
  };
}

const wo = [["**"], ["*", "/", "%"], ["+", "-"], ["<<", ">>>", ">>"], ["&"], ["^"], ["|"]].reduce((t, e) => _o(t, e), en);

function tn(t, e) {
  return e += rt(t, e).length, wo(t, e);
}

function xo(t) {
  const e = tn(t, 0);
  return !e || e.cursor + rt(t, e.cursor).length !== t.length ? null : e.evaluable;
}

function he(t) {
  var e;
  const i = xo(t);
  return (e = i == null ? void 0 : i.evaluate()) !== null && e !== void 0 ? e : null;
}

function sn(t) {
  if (typeof t == "number") return t;
  if (typeof t == "string") {
    const e = he(t);
    if (!R(e)) return e;
  }
  return 0;
}

function yo(t) {
  return String(t);
}

function W(t) {
  return e => e.toFixed(Math.max(Math.min(t, 20), 0));
}

function T(t, e, i, s, n) {
  const r = (t - e) / (i - e);
  return s + r * (n - s);
}

function ns(t) {
  return String(t.toFixed(10)).split(".")[1].replace(/0+$/, "").length;
}

function I(t, e, i) {
  return Math.min(Math.max(t, e), i);
}

function nn(t, e) {
  return (t % e + e) % e;
}

function Po(t, e) {
  return R(t.step) ? Math.max(ns(e), 2) : ns(t.step);
}

function rn(t) {
  var e;
  return (e = t.step) !== null && e !== void 0 ? e : 1;
}

function on(t, e) {
  var i;
  const s = Math.abs((i = t.step) !== null && i !== void 0 ? i : e);
  return s === 0 ? .1 : Math.pow(10, Math.floor(Math.log10(s)) - 1);
}

function an(t, e) {
  return R(t.step) ? null : new $r(t.step, e);
}

function ln(t) {
  return !R(t.max) && !R(t.min) ? new pt({ max: t.max, min: t.min }) : !R(t.max) || !R(t.min) ? new qr({
    max: t.max,
    min: t.min
  }) : null;
}

function cn(t, e) {
  var i, s, n;
  return {
    formatter: (i = t.format) !== null && i !== void 0 ? i : W(Po(t, e)),
    keyScale: (s = t.keyScale) !== null && s !== void 0 ? s : rn(t),
    pointerScale: (n = t.pointerScale) !== null && n !== void 0 ? n : on(t, e)
  };
}

function hn(t) {
  return {
    format: t.optional.function,
    keyScale: t.optional.number,
    max: t.optional.number,
    min: t.optional.number,
    pointerScale: t.optional.number,
    step: t.optional.number
  };
}

function Si(t) {
  return { constraint: t.constraint, textProps: _.fromObject(cn(t.params, t.initialValue)) };
}

class De {
  constructor(e) {
    this.controller = e;
  }
  
  get element() {
    return this.controller.view.element;
  }
  
  get disabled() {
    return this.controller.viewProps.get("disabled");
  }
  
  set disabled(e) {
    this.controller.viewProps.set("disabled", e);
  }
  
  get hidden() {
    return this.controller.viewProps.get("hidden");
  }
  
  set hidden(e) {
    this.controller.viewProps.set("hidden", e);
  }
  
  dispose() {
    this.controller.viewProps.set("disposed", !0);
  }
  
  importState(e) {
    return this.controller.importState(e);
  }
  
  exportState() {
    return this.controller.exportState();
  }
}

class Nt {
  constructor(e) {
    this.target = e;
  }
}

class mt extends Nt {
  constructor(e, i, s) {
    super(e), this.value = i, this.last = s ?? !0;
  }
}

class Co extends Nt {
  constructor(e, i) {
    super(e), this.expanded = i;
  }
}

class Eo extends Nt {
  constructor(e, i) {
    super(e), this.index = i;
  }
}

class So extends Nt {
  constructor(e, i) {
    super(e), this.native = i;
  }
}

class at extends De {
  constructor(e) {
    super(e), this.onValueChange_ = this.onValueChange_.bind(this), this.emitter_ = new O, this.controller.value.emitter.on("change", this.onValueChange_);
  }
  
  get label() {
    return this.controller.labelController.props.get("label");
  }
  
  set label(e) {
    this.controller.labelController.props.set("label", e);
  }
  
  get key() {
    return this.controller.value.binding.target.key;
  }
  
  get tag() {
    return this.controller.tag;
  }
  
  set tag(e) {
    this.controller.tag = e;
  }
  
  on(e, i) {
    const s = i.bind(this);
    return this.emitter_.on(e, n => {
      s(n);
    }, { key: i }), this;
  }
  
  off(e, i) {
    return this.emitter_.off(e, i), this;
  }
  
  refresh() {
    this.controller.value.fetch();
  }
  
  onValueChange_(e) {
    const i = this.controller.value;
    this.emitter_.emit("change", new mt(this, i.binding.target.read(), e.options.last));
  }
}

class Mo {
  constructor(e, i) {
    this.onValueBeforeChange_ = this.onValueBeforeChange_.bind(this), this.onValueChange_ = this.onValueChange_.bind(this), this.binding = i, this.value_ = e, this.value_.emitter.on("beforechange", this.onValueBeforeChange_), this.value_.emitter.on("change", this.onValueChange_), this.emitter = new O;
  }
  
  get rawValue() {
    return this.value_.rawValue;
  }
  
  set rawValue(e) {
    this.value_.rawValue = e;
  }
  
  setRawValue(e, i) {
    this.value_.setRawValue(e, i);
  }
  
  fetch() {
    this.value_.rawValue = this.binding.read();
  }
  
  push() {
    this.binding.write(this.value_.rawValue);
  }
  
  onValueBeforeChange_(e) {
    this.emitter.emit("beforechange", Object.assign(Object.assign({}, e), { sender: this }));
  }
  
  onValueChange_(e) {
    this.push(), this.emitter.emit("change", Object.assign(Object.assign({}, e), { sender: this }));
  }
}

function To(t) {
  if (!("binding" in t)) return !1;
  const e = t.binding;
  return Pi(e) && "read" in e && "write" in e;
}

function ko(t, e) {
  const s = Object.keys(e).reduce((n, r) => {
    if (n === void 0) return;
    const o = e[r], a = o(t[r]);
    return a.succeeded ? Object.assign(Object.assign({}, n), { [r]: a.value }) : void 0;
  }, {});
  return s;
}

function Ro(t, e) {
  return t.reduce((i, s) => {
    if (i === void 0) return;
    const n = e(s);
    if (!(!n.succeeded || n.value === void 0)) return [...i, n.value];
  }, []);
}

function Ao(t) {
  return t === null ? !1 : typeof t == "object";
}

function oe(t) {
  return e => i => {
    if (!e && i === void 0) return { succeeded: !1, value: void 0 };
    if (e && i === void 0) return { succeeded: !0, value: void 0 };
    const s = t(i);
    return s !== void 0 ? { succeeded: !0, value: s } : { succeeded: !1, value: void 0 };
  };
}

function rs(t) {
  return {
    custom: e => oe(e)(t),
    boolean: oe(e => typeof e == "boolean" ? e : void 0)(t),
    number: oe(e => typeof e == "number" ? e : void 0)(t),
    string: oe(e => typeof e == "string" ? e : void 0)(t),
    function: oe(e => typeof e == "function" ? e : void 0)(t),
    constant: e => oe(i => i === e ? e : void 0)(t),
    raw: oe(e => e)(t),
    object: e => oe(i => {
      if (Ao(i)) return ko(i, e);
    })(t),
    array: e => oe(i => {
      if (Array.isArray(i)) return Ro(i, e);
    })(t)
  };
}

const pi = { optional: rs(!0), required: rs(!1) };

function L(t, e) {
  const i = e(pi), s = pi.required.object(i)(t);
  return s.succeeded ? s.value : void 0;
}

function q(t, e, i, s) {
  if (e && !e(t)) return !1;
  const n = L(t, i);
  return n ? s(n) : !1;
}

function $(t, e) {
  var i;
  return ke((i = t == null ? void 0 : t()) !== null && i !== void 0 ? i : {}, e);
}

function Se(t) {
  return "value" in t;
}

function un(t) {
  if (!yi(t) || !("binding" in t)) return !1;
  const e = t.binding;
  return Pi(e);
}

const ee = "http://www.w3.org/2000/svg";

function Bt(t) {
  t.offsetHeight;
}

function Do(t, e) {
  const i = t.style.transition;
  t.style.transition = "none", e(), t.style.transition = i;
}

function Mi(t) {
  return t.ontouchstart !== void 0;
}

function Lo() {
  return globalThis;
}

function Bo() {
  return Lo().document;
}

function Vo(t) {
  const e = t.ownerDocument.defaultView;
  return e && "document" in e ? t.getContext("2d", { willReadFrequently: !0 }) : null;
}

const Oo = {
  check: "<path d=\"M2 8l4 4l8 -8\"/>",
  dropdown: "<path d=\"M5 7h6l-3 3 z\"/>",
  p2dpad: "<path d=\"M8 4v8\"/><path d=\"M4 8h8\"/><circle cx=\"12\" cy=\"12\" r=\"1.2\"/>"
};

function Ht(t, e) {
  const i = t.createElementNS(ee, "svg");
  return i.innerHTML = Oo[e], i;
}

function dn(t, e, i) {
  t.insertBefore(e, t.children[i]);
}

function Ti(t) {
  t.parentElement && t.parentElement.removeChild(t);
}

function pn(t) {
  for (; t.children.length > 0;) t.removeChild(t.children[0]);
}

function Uo(t) {
  for (; t.childNodes.length > 0;) t.removeChild(t.childNodes[0]);
}

function mn(t) {
  return t.relatedTarget ? t.relatedTarget : "explicitOriginalTarget" in t ? t.explicitOriginalTarget : null;
}

function ce(t, e) {
  t.emitter.on("change", i => {
    e(i.rawValue);
  }), e(t.rawValue);
}

function se(t, e, i) {
  ce(t.value(e), i);
}

const Io = "tp";

function P(t) {
  return (i, s) => [Io, "-", t, "v", i ? `_${i}` : "", s ? `-${s}` : ""].join("");
}

const Ze = P("lbl");

function zo(t, e) {
  const i = t.createDocumentFragment();
  return e.split(`
`).map(n => t.createTextNode(n)).forEach((n, r) => {
    r > 0 && i.appendChild(t.createElement("br")), i.appendChild(n);
  }), i;
}

class vn {
  constructor(e, i) {
    this.element = e.createElement("div"), this.element.classList.add(Ze()), i.viewProps.bindClassModifiers(this.element);
    const s = e.createElement("div");
    s.classList.add(Ze("l")), se(i.props, "label", r => {
      R(r) ? this.element.classList.add(Ze(void 0, "nol")) : (this.element.classList.remove(Ze(void 0, "nol")), Uo(s), s.appendChild(zo(e, r)));
    }), this.element.appendChild(s), this.labelElement = s;
    const n = e.createElement("div");
    n.classList.add(Ze("v")), this.element.appendChild(n), this.valueElement = n;
  }
}

class fn {
  constructor(e, i) {
    this.props = i.props, this.valueController = i.valueController, this.viewProps = i.valueController.viewProps, this.view = new vn(e, {
      props: i.props,
      viewProps: this.viewProps
    }), this.view.valueElement.appendChild(this.valueController.view.element);
  }
  
  importProps(e) {
    return q(e, null, i => ({ label: i.optional.string }), i => (this.props.set("label", i.label), !0));
  }
  
  exportProps() {
    return $(null, { label: this.props.get("label") });
  }
}

function Fo() {
  return ["veryfirst", "first", "last", "verylast"];
}

const os = P(""), as = { veryfirst: "vfst", first: "fst", last: "lst", verylast: "vlst" };

class jt {
  constructor(e) {
    this.parent_ = null, this.blade = e.blade, this.view = e.view, this.viewProps = e.viewProps;
    const i = this.view.element;
    this.blade.value("positions").emitter.on("change", () => {
      Fo().forEach(s => {
        i.classList.remove(os(void 0, as[s]));
      }), this.blade.get("positions").forEach(s => {
        i.classList.add(os(void 0, as[s]));
      });
    }), this.viewProps.handleDispose(() => {
      Ti(i);
    });
  }
  
  get parent() {
    return this.parent_;
  }
  
  set parent(e) {
    this.parent_ = e, this.viewProps.set("parent", this.parent_ ? this.parent_.viewProps : null);
  }
  
  importState(e) {
    return q(e, null, i => ({
      disabled: i.required.boolean,
      hidden: i.required.boolean
    }), i => (this.viewProps.importState(i), !0));
  }
  
  exportState() {
    return $(null, Object.assign({}, this.viewProps.exportState()));
  }
}

class Re extends jt {
  constructor(e, i) {
    if (i.value !== i.valueController.value) throw V.shouldNeverHappen();
    const s = i.valueController.viewProps,
      n = new fn(e, { blade: i.blade, props: i.props, valueController: i.valueController });
    super(Object.assign(Object.assign({}, i), {
      view: new vn(e, { props: i.props, viewProps: s }),
      viewProps: s
    })), this.labelController = n, this.value = i.value, this.valueController = i.valueController, this.view.valueElement.appendChild(this.valueController.view.element);
  }
  
  importState(e) {
    return q(e, i => {
      var s, n, r;
      return super.importState(i) && this.labelController.importProps(i) && ((r = (n = (s = this.valueController).importProps) === null || n === void 0 ? void 0 : n.call(s, e)) !== null && r !== void 0 ? r : !0);
    }, i => ({ value: i.optional.raw }), i => (i.value && (this.value.rawValue = i.value), !0));
  }
  
  exportState() {
    var e, i, s;
    return $(() => super.exportState(), Object.assign(Object.assign({ value: this.value.rawValue }, this.labelController.exportProps()), (s = (i = (e = this.valueController).exportProps) === null || i === void 0 ? void 0 : i.call(e)) !== null && s !== void 0 ? s : {}));
  }
}

function ls(t) {
  const e = Object.assign({}, t);
  return delete e.value, e;
}

class bn extends Re {
  constructor(e, i) {
    super(e, i), this.tag = i.tag;
  }
  
  importState(e) {
    return q(e, i => super.importState(ls(e)), i => ({ tag: i.optional.string }), i => (this.tag = i.tag, !0));
  }
  
  exportState() {
    return $(() => ls(super.exportState()), {
      binding: {
        key: this.value.binding.target.key,
        value: this.value.binding.target.read()
      }, tag: this.tag
    });
  }
}

function No(t) {
  return Se(t) && un(t.value);
}

class Ho extends bn {
  importState(e) {
    return q(e, i => super.importState(i), i => ({ binding: i.required.object({ value: i.required.raw }) }), i => (this.value.binding.inject(i.binding.value), this.value.fetch(), !0));
  }
}

function jo(t) {
  return Se(t) && To(t.value);
}

function gn(t, e) {
  for (; t.length < e;) t.push(void 0);
}

function Go(t) {
  const e = [];
  return gn(e, t), e;
}

function Wo(t) {
  const e = t.indexOf(void 0);
  return e < 0 ? t : t.slice(0, e);
}

function Ko(t, e) {
  const i = [...Wo(t), e];
  return i.length > t.length ? i.splice(0, i.length - t.length) : gn(i, t.length), i;
}

class qo {
  constructor(e) {
    this.emitter = new O, this.onTick_ = this.onTick_.bind(this), this.onValueBeforeChange_ = this.onValueBeforeChange_.bind(this), this.onValueChange_ = this.onValueChange_.bind(this), this.binding = e.binding, this.value_ = D(Go(e.bufferSize)), this.value_.emitter.on("beforechange", this.onValueBeforeChange_), this.value_.emitter.on("change", this.onValueChange_), this.ticker = e.ticker, this.ticker.emitter.on("tick", this.onTick_), this.fetch();
  }
  
  get rawValue() {
    return this.value_.rawValue;
  }
  
  set rawValue(e) {
    this.value_.rawValue = e;
  }
  
  setRawValue(e, i) {
    this.value_.setRawValue(e, i);
  }
  
  fetch() {
    this.value_.rawValue = Ko(this.value_.rawValue, this.binding.read());
  }
  
  onTick_() {
    this.fetch();
  }
  
  onValueBeforeChange_(e) {
    this.emitter.emit("beforechange", Object.assign(Object.assign({}, e), { sender: this }));
  }
  
  onValueChange_(e) {
    this.emitter.emit("change", Object.assign(Object.assign({}, e), { sender: this }));
  }
}

function $o(t) {
  if (!("binding" in t)) return !1;
  const e = t.binding;
  return Pi(e) && "read" in e && !("write" in e);
}

class Yo extends bn {
  exportState() {
    return $(() => super.exportState(), { binding: { readonly: !0 } });
  }
}

function Xo(t) {
  return Se(t) && $o(t.value);
}

class Zo extends De {
  get label() {
    return this.controller.labelController.props.get("label");
  }
  
  set label(e) {
    this.controller.labelController.props.set("label", e);
  }
  
  get title() {
    var e;
    return (e = this.controller.buttonController.props.get("title")) !== null && e !== void 0 ? e : "";
  }
  
  set title(e) {
    this.controller.buttonController.props.set("title", e);
  }
  
  on(e, i) {
    const s = i.bind(this);
    return this.controller.buttonController.emitter.on(e, r => {
      s(new So(this, r.nativeEvent));
    }), this;
  }
  
  off(e, i) {
    return this.controller.buttonController.emitter.off(e, i), this;
  }
}

function Qo(t, e, i) {
  i ? t.classList.add(e) : t.classList.remove(e);
}

function Ke(t, e) {
  return i => {
    Qo(t, e, i);
  };
}

function ki(t, e) {
  ce(t, i => {
    e.textContent = i ?? "";
  });
}

const Zt = P("btn");

class Jo {
  constructor(e, i) {
    this.element = e.createElement("div"), this.element.classList.add(Zt()), i.viewProps.bindClassModifiers(this.element);
    const s = e.createElement("button");
    s.classList.add(Zt("b")), i.viewProps.bindDisabled(s), this.element.appendChild(s), this.buttonElement = s;
    const n = e.createElement("div");
    n.classList.add(Zt("t")), ki(i.props.value("title"), n), this.buttonElement.appendChild(n);
  }
}

class ea {
  constructor(e, i) {
    this.emitter = new O, this.onClick_ = this.onClick_.bind(this), this.props = i.props, this.viewProps = i.viewProps, this.view = new Jo(e, {
      props: this.props,
      viewProps: this.viewProps
    }), this.view.buttonElement.addEventListener("click", this.onClick_);
  }
  
  importProps(e) {
    return q(e, null, i => ({ title: i.optional.string }), i => (this.props.set("title", i.title), !0));
  }
  
  exportProps() {
    return $(null, { title: this.props.get("title") });
  }
  
  onClick_(e) {
    this.emitter.emit("click", { nativeEvent: e, sender: this });
  }
}

class cs extends jt {
  constructor(e, i) {
    const s = new ea(e, { props: i.buttonProps, viewProps: i.viewProps }),
      n = new fn(e, { blade: i.blade, props: i.labelProps, valueController: s });
    super({ blade: i.blade, view: n.view, viewProps: i.viewProps }), this.buttonController = s, this.labelController = n;
  }
  
  importState(e) {
    return q(e, i => super.importState(i) && this.buttonController.importProps(i) && this.labelController.importProps(i), () => ({}), () => !0);
  }
  
  exportState() {
    return $(() => super.exportState(), Object.assign(Object.assign({}, this.buttonController.exportProps()), this.labelController.exportProps()));
  }
}

class _n {
  constructor(e) {
    const [i, s] = e.split("-"), n = i.split(".");
    this.major = parseInt(n[0], 10), this.minor = parseInt(n[1], 10), this.patch = parseInt(n[2], 10), this.prerelease = s ?? null;
  }
  
  toString() {
    const e = [this.major, this.minor, this.patch].join(".");
    return this.prerelease !== null ? [e, this.prerelease].join("-") : e;
  }
}

const qe = new _n("2.0.5");

function H(t) {
  return Object.assign({ core: qe }, t);
}

const ta = H({
  id: "button", type: "blade", accept(t) {
    const e = L(t, i => ({ title: i.required.string, view: i.required.constant("button"), label: i.optional.string }));
    return e ? { params: e } : null;
  }, controller(t) {
    return new cs(t.document, {
      blade: t.blade,
      buttonProps: _.fromObject({ title: t.params.title }),
      labelProps: _.fromObject({ label: t.params.label }),
      viewProps: t.viewProps
    });
  }, api(t) {
    return t.controller instanceof cs ? new Zo(t.controller) : null;
  }
});

function ia(t, e) {
  return t.addBlade(Object.assign(Object.assign({}, e), { view: "button" }));
}

function sa(t, e) {
  return t.addBlade(Object.assign(Object.assign({}, e), { view: "folder" }));
}

function na(t, e) {
  return t.addBlade(Object.assign(Object.assign({}, e), { view: "tab" }));
}

function ra(t) {
  return yi(t) ? "refresh" in t && typeof t.refresh == "function" : !1;
}

function oa(t, e) {
  if (!Lt.isBindable(t)) throw V.notBindable();
  return new Lt(t, e);
}

class aa {
  constructor(e, i) {
    this.onRackValueChange_ = this.onRackValueChange_.bind(this), this.controller_ = e, this.emitter_ = new O, this.pool_ = i, this.controller_.rack.emitter.on("valuechange", this.onRackValueChange_);
  }
  
  get children() {
    return this.controller_.rack.children.map(e => this.pool_.createApi(e));
  }
  
  addBinding(e, i, s) {
    const n = s ?? {}, r = this.controller_.element.ownerDocument, o = this.pool_.createBinding(r, oa(e, i), n),
      a = this.pool_.createBindingApi(o);
    return this.add(a, n.index);
  }
  
  addFolder(e) {
    return sa(this, e);
  }
  
  addButton(e) {
    return ia(this, e);
  }
  
  addTab(e) {
    return na(this, e);
  }
  
  add(e, i) {
    const s = e.controller;
    return this.controller_.rack.add(s, i), e;
  }
  
  remove(e) {
    this.controller_.rack.remove(e.controller);
  }
  
  addBlade(e) {
    const i = this.controller_.element.ownerDocument, s = this.pool_.createBlade(i, e), n = this.pool_.createApi(s);
    return this.add(n, e.index);
  }
  
  on(e, i) {
    const s = i.bind(this);
    return this.emitter_.on(e, n => {
      s(n);
    }, { key: i }), this;
  }
  
  off(e, i) {
    return this.emitter_.off(e, i), this;
  }
  
  refresh() {
    this.children.forEach(e => {
      ra(e) && e.refresh();
    });
  }
  
  onRackValueChange_(e) {
    const i = e.bladeController, s = this.pool_.createApi(i), n = un(i.value) ? i.value.binding : null;
    this.emitter_.emit("change", new mt(s, n ? n.target.read() : i.value.rawValue, e.options.last));
  }
}

class Ri extends De {
  constructor(e, i) {
    super(e), this.rackApi_ = new aa(e.rackController, i);
  }
  
  refresh() {
    this.rackApi_.refresh();
  }
}

class Ai extends jt {
  constructor(e) {
    super({
      blade: e.blade,
      view: e.view,
      viewProps: e.rackController.viewProps
    }), this.rackController = e.rackController;
  }
  
  importState(e) {
    return q(e, i => super.importState(i), i => ({ children: i.required.array(i.required.raw) }), i => this.rackController.rack.children.every((s, n) => s.importState(i.children[n])));
  }
  
  exportState() {
    return $(() => super.exportState(), { children: this.rackController.rack.children.map(e => e.exportState()) });
  }
}

function mi(t) {
  return "rackController" in t;
}

class la {
  constructor(e) {
    this.emitter = new O, this.items_ = [], this.cache_ = new Set, this.onSubListAdd_ = this.onSubListAdd_.bind(this), this.onSubListRemove_ = this.onSubListRemove_.bind(this), this.extract_ = e;
  }
  
  get items() {
    return this.items_;
  }
  
  allItems() {
    return Array.from(this.cache_);
  }
  
  find(e) {
    for (const i of this.allItems()) if (e(i)) return i;
    return null;
  }
  
  includes(e) {
    return this.cache_.has(e);
  }
  
  add(e, i) {
    if (this.includes(e)) throw V.shouldNeverHappen();
    const s = i !== void 0 ? i : this.items_.length;
    this.items_.splice(s, 0, e), this.cache_.add(e);
    const n = this.extract_(e);
    n && (n.emitter.on("add", this.onSubListAdd_), n.emitter.on("remove", this.onSubListRemove_), n.allItems().forEach(r => {
      this.cache_.add(r);
    })), this.emitter.emit("add", { index: s, item: e, root: this, target: this });
  }
  
  remove(e) {
    const i = this.items_.indexOf(e);
    if (i < 0) return;
    this.items_.splice(i, 1), this.cache_.delete(e);
    const s = this.extract_(e);
    s && (s.allItems().forEach(n => {
      this.cache_.delete(n);
    }), s.emitter.off("add", this.onSubListAdd_), s.emitter.off("remove", this.onSubListRemove_)), this.emitter.emit("remove", {
      index: i,
      item: e,
      root: this,
      target: this
    });
  }
  
  onSubListAdd_(e) {
    this.cache_.add(e.item), this.emitter.emit("add", { index: e.index, item: e.item, root: this, target: e.target });
  }
  
  onSubListRemove_(e) {
    this.cache_.delete(e.item), this.emitter.emit("remove", {
      index: e.index,
      item: e.item,
      root: this,
      target: e.target
    });
  }
}

function ca(t, e) {
  for (let i = 0; i < t.length; i++) {
    const s = t[i];
    if (Se(s) && s.value === e) return s;
  }
  return null;
}

function ha(t) {
  return mi(t) ? t.rackController.rack.bcSet_ : null;
}

class ua {
  constructor(e) {
    var i, s;
    this.emitter = new O, this.onBladePositionsChange_ = this.onBladePositionsChange_.bind(this), this.onSetAdd_ = this.onSetAdd_.bind(this), this.onSetRemove_ = this.onSetRemove_.bind(this), this.onChildDispose_ = this.onChildDispose_.bind(this), this.onChildPositionsChange_ = this.onChildPositionsChange_.bind(this), this.onChildValueChange_ = this.onChildValueChange_.bind(this), this.onChildViewPropsChange_ = this.onChildViewPropsChange_.bind(this), this.onRackLayout_ = this.onRackLayout_.bind(this), this.onRackValueChange_ = this.onRackValueChange_.bind(this), this.blade_ = (i = e.blade) !== null && i !== void 0 ? i : null, (s = this.blade_) === null || s === void 0 || s.value("positions").emitter.on("change", this.onBladePositionsChange_), this.viewProps = e.viewProps, this.bcSet_ = new la(ha), this.bcSet_.emitter.on("add", this.onSetAdd_), this.bcSet_.emitter.on("remove", this.onSetRemove_);
  }
  
  get children() {
    return this.bcSet_.items;
  }
  
  add(e, i) {
    var s;
    (s = e.parent) === null || s === void 0 || s.remove(e), e.parent = this, this.bcSet_.add(e, i);
  }
  
  remove(e) {
    e.parent = null, this.bcSet_.remove(e);
  }
  
  find(e) {
    return this.bcSet_.allItems().filter(e);
  }
  
  onSetAdd_(e) {
    this.updatePositions_();
    const i = e.target === e.root;
    if (this.emitter.emit("add", { bladeController: e.item, index: e.index, root: i, sender: this }), !i) return;
    const s = e.item;
    if (s.viewProps.emitter.on("change", this.onChildViewPropsChange_), s.blade.value("positions").emitter.on("change", this.onChildPositionsChange_), s.viewProps.handleDispose(this.onChildDispose_), Se(s)) s.value.emitter.on("change", this.onChildValueChange_); else if (mi(s)) {
      const n = s.rackController.rack;
      if (n) {
        const r = n.emitter;
        r.on("layout", this.onRackLayout_), r.on("valuechange", this.onRackValueChange_);
      }
    }
  }
  
  onSetRemove_(e) {
    this.updatePositions_();
    const i = e.target === e.root;
    if (this.emitter.emit("remove", { bladeController: e.item, root: i, sender: this }), !i) return;
    const s = e.item;
    if (Se(s)) s.value.emitter.off("change", this.onChildValueChange_); else if (mi(s)) {
      const n = s.rackController.rack;
      if (n) {
        const r = n.emitter;
        r.off("layout", this.onRackLayout_), r.off("valuechange", this.onRackValueChange_);
      }
    }
  }
  
  updatePositions_() {
    const e = this.bcSet_.items.filter(n => !n.viewProps.get("hidden")), i = e[0], s = e[e.length - 1];
    this.bcSet_.items.forEach(n => {
      const r = [];
      n === i && (r.push("first"), (!this.blade_ || this.blade_.get("positions").includes("veryfirst")) && r.push("veryfirst")), n === s && (r.push("last"), (!this.blade_ || this.blade_.get("positions").includes("verylast")) && r.push("verylast")), n.blade.set("positions", r);
    });
  }
  
  onChildPositionsChange_() {
    this.updatePositions_(), this.emitter.emit("layout", { sender: this });
  }
  
  onChildViewPropsChange_(e) {
    this.updatePositions_(), this.emitter.emit("layout", { sender: this });
  }
  
  onChildDispose_() {
    this.bcSet_.items.filter(i => i.viewProps.get("disposed")).forEach(i => {
      this.bcSet_.remove(i);
    });
  }
  
  onChildValueChange_(e) {
    const i = ca(this.find(Se), e.sender);
    if (!i) throw V.alreadyDisposed();
    this.emitter.emit("valuechange", { bladeController: i, options: e.options, sender: this });
  }
  
  onRackLayout_(e) {
    this.updatePositions_(), this.emitter.emit("layout", { sender: this });
  }
  
  onRackValueChange_(e) {
    this.emitter.emit("valuechange", { bladeController: e.bladeController, options: e.options, sender: this });
  }
  
  onBladePositionsChange_() {
    this.updatePositions_();
  }
}

class Di {
  constructor(e) {
    this.onRackAdd_ = this.onRackAdd_.bind(this), this.onRackRemove_ = this.onRackRemove_.bind(this), this.element = e.element, this.viewProps = e.viewProps;
    const i = new ua({ blade: e.root ? void 0 : e.blade, viewProps: e.viewProps });
    i.emitter.on("add", this.onRackAdd_), i.emitter.on("remove", this.onRackRemove_), this.rack = i, this.viewProps.handleDispose(() => {
      for (let s = this.rack.children.length - 1; s >= 0; s--) this.rack.children[s].viewProps.set("disposed", !0);
    });
  }
  
  onRackAdd_(e) {
    e.root && dn(this.element, e.bladeController.view.element, e.index);
  }
  
  onRackRemove_(e) {
    e.root && Ti(e.bladeController.view.element);
  }
}

function $e() {
  return new _({ positions: D([], { equals: Nr }) });
}

class vt extends _ {
  constructor(e) {
    super(e);
  }
  
  static create(e) {
    const i = { completed: !0, expanded: e, expandedHeight: null, shouldFixHeight: !1, temporaryExpanded: null },
      s = _.createCore(i);
    return new vt(s);
  }
  
  get styleExpanded() {
    var e;
    return (e = this.get("temporaryExpanded")) !== null && e !== void 0 ? e : this.get("expanded");
  }
  
  get styleHeight() {
    if (!this.styleExpanded) return "0";
    const e = this.get("expandedHeight");
    return this.get("shouldFixHeight") && !R(e) ? `${e}px` : "auto";
  }
  
  bindExpandedClass(e, i) {
    const s = () => {
      this.styleExpanded ? e.classList.add(i) : e.classList.remove(i);
    };
    se(this, "expanded", s), se(this, "temporaryExpanded", s);
  }
  
  cleanUpTransition() {
    this.set("shouldFixHeight", !1), this.set("expandedHeight", null), this.set("completed", !0);
  }
}

function da(t, e) {
  let i = 0;
  return Do(e, () => {
    t.set("expandedHeight", null), t.set("temporaryExpanded", !0), Bt(e), i = e.clientHeight, t.set("temporaryExpanded", null), Bt(e);
  }), i;
}

function hs(t, e) {
  e.style.height = t.styleHeight;
}

function Li(t, e) {
  t.value("expanded").emitter.on("beforechange", () => {
    if (t.set("completed", !1), R(t.get("expandedHeight"))) {
      const i = da(t, e);
      i > 0 && t.set("expandedHeight", i);
    }
    t.set("shouldFixHeight", !0), Bt(e);
  }), t.emitter.on("change", () => {
    hs(t, e);
  }), hs(t, e), e.addEventListener("transitionend", i => {
    i.propertyName === "height" && t.cleanUpTransition();
  });
}

class wn extends Ri {
  constructor(e, i) {
    super(e, i), this.emitter_ = new O, this.controller.foldable.value("expanded").emitter.on("change", s => {
      this.emitter_.emit("fold", new Co(this, s.sender.rawValue));
    }), this.rackApi_.on("change", s => {
      this.emitter_.emit("change", s);
    });
  }
  
  get expanded() {
    return this.controller.foldable.get("expanded");
  }
  
  set expanded(e) {
    this.controller.foldable.set("expanded", e);
  }
  
  get title() {
    return this.controller.props.get("title");
  }
  
  set title(e) {
    this.controller.props.set("title", e);
  }
  
  get children() {
    return this.rackApi_.children;
  }
  
  addBinding(e, i, s) {
    return this.rackApi_.addBinding(e, i, s);
  }
  
  addFolder(e) {
    return this.rackApi_.addFolder(e);
  }
  
  addButton(e) {
    return this.rackApi_.addButton(e);
  }
  
  addTab(e) {
    return this.rackApi_.addTab(e);
  }
  
  add(e, i) {
    return this.rackApi_.add(e, i);
  }
  
  remove(e) {
    this.rackApi_.remove(e);
  }
  
  addBlade(e) {
    return this.rackApi_.addBlade(e);
  }
  
  on(e, i) {
    const s = i.bind(this);
    return this.emitter_.on(e, n => {
      s(n);
    }, { key: i }), this;
  }
  
  off(e, i) {
    return this.emitter_.off(e, i), this;
  }
}

const xn = P("cnt");

class pa {
  constructor(e, i) {
    var s;
    this.className_ = P((s = i.viewName) !== null && s !== void 0 ? s : "fld"), this.element = e.createElement("div"), this.element.classList.add(this.className_(), xn()), i.viewProps.bindClassModifiers(this.element), this.foldable_ = i.foldable, this.foldable_.bindExpandedClass(this.element, this.className_(void 0, "expanded")), se(this.foldable_, "completed", Ke(this.element, this.className_(void 0, "cpl")));
    const n = e.createElement("button");
    n.classList.add(this.className_("b")), se(i.props, "title", h => {
      R(h) ? this.element.classList.add(this.className_(void 0, "not")) : this.element.classList.remove(this.className_(void 0, "not"));
    }), i.viewProps.bindDisabled(n), this.element.appendChild(n), this.buttonElement = n;
    const r = e.createElement("div");
    r.classList.add(this.className_("i")), this.element.appendChild(r);
    const o = e.createElement("div");
    o.classList.add(this.className_("t")), ki(i.props.value("title"), o), this.buttonElement.appendChild(o), this.titleElement = o;
    const a = e.createElement("div");
    a.classList.add(this.className_("m")), this.buttonElement.appendChild(a);
    const l = e.createElement("div");
    l.classList.add(this.className_("c")), this.element.appendChild(l), this.containerElement = l;
  }
}

class vi extends Ai {
  constructor(e, i) {
    var s;
    const n = vt.create((s = i.expanded) !== null && s !== void 0 ? s : !0),
      r = new pa(e, { foldable: n, props: i.props, viewName: i.root ? "rot" : void 0, viewProps: i.viewProps });
    super(Object.assign(Object.assign({}, i), {
      rackController: new Di({
        blade: i.blade,
        element: r.containerElement,
        root: i.root,
        viewProps: i.viewProps
      }), view: r
    })), this.onTitleClick_ = this.onTitleClick_.bind(this), this.props = i.props, this.foldable = n, Li(this.foldable, this.view.containerElement), this.rackController.rack.emitter.on("add", () => {
      this.foldable.cleanUpTransition();
    }), this.rackController.rack.emitter.on("remove", () => {
      this.foldable.cleanUpTransition();
    }), this.view.buttonElement.addEventListener("click", this.onTitleClick_);
  }
  
  get document() {
    return this.view.element.ownerDocument;
  }
  
  importState(e) {
    return q(e, i => super.importState(i), i => ({
      expanded: i.required.boolean,
      title: i.optional.string
    }), i => (this.foldable.set("expanded", i.expanded), this.props.set("title", i.title), !0));
  }
  
  exportState() {
    return $(() => super.exportState(), { expanded: this.foldable.get("expanded"), title: this.props.get("title") });
  }
  
  onTitleClick_() {
    this.foldable.set("expanded", !this.foldable.get("expanded"));
  }
}

const ma = H({
  id: "folder", type: "blade", accept(t) {
    const e = L(t, i => ({
      title: i.required.string,
      view: i.required.constant("folder"),
      expanded: i.optional.boolean
    }));
    return e ? { params: e } : null;
  }, controller(t) {
    return new vi(t.document, {
      blade: t.blade,
      expanded: t.params.expanded,
      props: _.fromObject({ title: t.params.title }),
      viewProps: t.viewProps
    });
  }, api(t) {
    return t.controller instanceof vi ? new wn(t.controller, t.pool) : null;
  }
}), va = P("");

function us(t, e) {
  return Ke(t, va(void 0, e));
}

class de extends _ {
  constructor(e) {
    var i;
    super(e), this.onDisabledChange_ = this.onDisabledChange_.bind(this), this.onParentChange_ = this.onParentChange_.bind(this), this.onParentGlobalDisabledChange_ = this.onParentGlobalDisabledChange_.bind(this), [this.globalDisabled_, this.setGlobalDisabled_] = Kr(D(this.getGlobalDisabled_())), this.value("disabled").emitter.on("change", this.onDisabledChange_), this.value("parent").emitter.on("change", this.onParentChange_), (i = this.get("parent")) === null || i === void 0 || i.globalDisabled.emitter.on("change", this.onParentGlobalDisabledChange_);
  }
  
  static create(e) {
    var i, s, n;
    const r = e ?? {};
    return new de(_.createCore({
      disabled: (i = r.disabled) !== null && i !== void 0 ? i : !1,
      disposed: !1,
      hidden: (s = r.hidden) !== null && s !== void 0 ? s : !1,
      parent: (n = r.parent) !== null && n !== void 0 ? n : null
    }));
  }
  
  get globalDisabled() {
    return this.globalDisabled_;
  }
  
  bindClassModifiers(e) {
    ce(this.globalDisabled_, us(e, "disabled")), se(this, "hidden", us(e, "hidden"));
  }
  
  bindDisabled(e) {
    ce(this.globalDisabled_, i => {
      e.disabled = i;
    });
  }
  
  bindTabIndex(e) {
    ce(this.globalDisabled_, i => {
      e.tabIndex = i ? -1 : 0;
    });
  }
  
  handleDispose(e) {
    this.value("disposed").emitter.on("change", i => {
      i && e();
    });
  }
  
  importState(e) {
    this.set("disabled", e.disabled), this.set("hidden", e.hidden);
  }
  
  exportState() {
    return { disabled: this.get("disabled"), hidden: this.get("hidden") };
  }
  
  getGlobalDisabled_() {
    const e = this.get("parent");
    return (e ? e.globalDisabled.rawValue : !1) || this.get("disabled");
  }
  
  updateGlobalDisabled_() {
    this.setGlobalDisabled_(this.getGlobalDisabled_());
  }
  
  onDisabledChange_() {
    this.updateGlobalDisabled_();
  }
  
  onParentGlobalDisabledChange_() {
    this.updateGlobalDisabled_();
  }
  
  onParentChange_(e) {
    var i;
    const s = e.previousRawValue;
    s == null || s.globalDisabled.emitter.off("change", this.onParentGlobalDisabledChange_), (i = this.get("parent")) === null || i === void 0 || i.globalDisabled.emitter.on("change", this.onParentGlobalDisabledChange_), this.updateGlobalDisabled_();
  }
}

const ds = P("tbp");

class fa {
  constructor(e, i) {
    this.element = e.createElement("div"), this.element.classList.add(ds()), i.viewProps.bindClassModifiers(this.element);
    const s = e.createElement("div");
    s.classList.add(ds("c")), this.element.appendChild(s), this.containerElement = s;
  }
}

const Qe = P("tbi");

class ba {
  constructor(e, i) {
    this.element = e.createElement("div"), this.element.classList.add(Qe()), i.viewProps.bindClassModifiers(this.element), se(i.props, "selected", r => {
      r ? this.element.classList.add(Qe(void 0, "sel")) : this.element.classList.remove(Qe(void 0, "sel"));
    });
    const s = e.createElement("button");
    s.classList.add(Qe("b")), i.viewProps.bindDisabled(s), this.element.appendChild(s), this.buttonElement = s;
    const n = e.createElement("div");
    n.classList.add(Qe("t")), ki(i.props.value("title"), n), this.buttonElement.appendChild(n), this.titleElement = n;
  }
}

class ga {
  constructor(e, i) {
    this.emitter = new O, this.onClick_ = this.onClick_.bind(this), this.props = i.props, this.viewProps = i.viewProps, this.view = new ba(e, {
      props: i.props,
      viewProps: i.viewProps
    }), this.view.buttonElement.addEventListener("click", this.onClick_);
  }
  
  onClick_() {
    this.emitter.emit("click", { sender: this });
  }
}

class fi extends Ai {
  constructor(e, i) {
    const s = new fa(e, { viewProps: i.viewProps });
    super(Object.assign(Object.assign({}, i), {
      rackController: new Di({
        blade: i.blade,
        element: s.containerElement,
        viewProps: i.viewProps
      }), view: s
    })), this.onItemClick_ = this.onItemClick_.bind(this), this.ic_ = new ga(e, {
      props: i.itemProps,
      viewProps: de.create()
    }), this.ic_.emitter.on("click", this.onItemClick_), this.props = i.props, se(this.props, "selected", n => {
      this.itemController.props.set("selected", n), this.viewProps.set("hidden", !n);
    });
  }
  
  get itemController() {
    return this.ic_;
  }
  
  importState(e) {
    return q(e, i => super.importState(i), i => ({
      selected: i.required.boolean,
      title: i.required.string
    }), i => (this.ic_.props.set("selected", i.selected), this.ic_.props.set("title", i.title), !0));
  }
  
  exportState() {
    return $(() => super.exportState(), {
      selected: this.ic_.props.get("selected"),
      title: this.ic_.props.get("title")
    });
  }
  
  onItemClick_() {
    this.props.set("selected", !0);
  }
}

class _a extends Ri {
  constructor(e, i) {
    super(e, i), this.emitter_ = new O, this.onSelect_ = this.onSelect_.bind(this), this.pool_ = i, this.rackApi_.on("change", s => {
      this.emitter_.emit("change", s);
    }), this.controller.tab.selectedIndex.emitter.on("change", this.onSelect_);
  }
  
  get pages() {
    return this.rackApi_.children;
  }
  
  addPage(e) {
    const i = this.controller.view.element.ownerDocument, s = new fi(i, {
      blade: $e(),
      itemProps: _.fromObject({ selected: !1, title: e.title }),
      props: _.fromObject({ selected: !1 }),
      viewProps: de.create()
    }), n = this.pool_.createApi(s);
    return this.rackApi_.add(n, e.index);
  }
  
  removePage(e) {
    this.rackApi_.remove(this.rackApi_.children[e]);
  }
  
  on(e, i) {
    const s = i.bind(this);
    return this.emitter_.on(e, n => {
      s(n);
    }, { key: i }), this;
  }
  
  off(e, i) {
    return this.emitter_.off(e, i), this;
  }
  
  onSelect_(e) {
    this.emitter_.emit("select", new Eo(this, e.rawValue));
  }
}

class wa extends Ri {
  get title() {
    var e;
    return (e = this.controller.itemController.props.get("title")) !== null && e !== void 0 ? e : "";
  }
  
  set title(e) {
    this.controller.itemController.props.set("title", e);
  }
  
  get selected() {
    return this.controller.props.get("selected");
  }
  
  set selected(e) {
    this.controller.props.set("selected", e);
  }
  
  get children() {
    return this.rackApi_.children;
  }
  
  addButton(e) {
    return this.rackApi_.addButton(e);
  }
  
  addFolder(e) {
    return this.rackApi_.addFolder(e);
  }
  
  addTab(e) {
    return this.rackApi_.addTab(e);
  }
  
  add(e, i) {
    this.rackApi_.add(e, i);
  }
  
  remove(e) {
    this.rackApi_.remove(e);
  }
  
  addBinding(e, i, s) {
    return this.rackApi_.addBinding(e, i, s);
  }
  
  addBlade(e) {
    return this.rackApi_.addBlade(e);
  }
}

const ps = -1;

class xa {
  constructor() {
    this.onItemSelectedChange_ = this.onItemSelectedChange_.bind(this), this.empty = D(!0), this.selectedIndex = D(ps), this.items_ = [];
  }
  
  add(e, i) {
    const s = i ?? this.items_.length;
    this.items_.splice(s, 0, e), e.emitter.on("change", this.onItemSelectedChange_), this.keepSelection_();
  }
  
  remove(e) {
    const i = this.items_.indexOf(e);
    i < 0 || (this.items_.splice(i, 1), e.emitter.off("change", this.onItemSelectedChange_), this.keepSelection_());
  }
  
  keepSelection_() {
    if (this.items_.length === 0) {
      this.selectedIndex.rawValue = ps, this.empty.rawValue = !0;
      return;
    }
    const e = this.items_.findIndex(i => i.rawValue);
    e < 0 ? (this.items_.forEach((i, s) => {
      i.rawValue = s === 0;
    }), this.selectedIndex.rawValue = 0) : (this.items_.forEach((i, s) => {
      i.rawValue = s === e;
    }), this.selectedIndex.rawValue = e), this.empty.rawValue = !1;
  }
  
  onItemSelectedChange_(e) {
    if (e.rawValue) {
      const i = this.items_.findIndex(s => s === e.sender);
      this.items_.forEach((s, n) => {
        s.rawValue = n === i;
      }), this.selectedIndex.rawValue = i;
    } else this.keepSelection_();
  }
}

const Je = P("tab");

class ya {
  constructor(e, i) {
    this.element = e.createElement("div"), this.element.classList.add(Je(), xn()), i.viewProps.bindClassModifiers(this.element), ce(i.empty, Ke(this.element, Je(void 0, "nop")));
    const s = e.createElement("div");
    s.classList.add(Je("t")), this.element.appendChild(s), this.itemsElement = s;
    const n = e.createElement("div");
    n.classList.add(Je("i")), this.element.appendChild(n);
    const r = e.createElement("div");
    r.classList.add(Je("c")), this.element.appendChild(r), this.contentsElement = r;
  }
}

class ms extends Ai {
  constructor(e, i) {
    const s = new xa, n = new ya(e, { empty: s.empty, viewProps: i.viewProps });
    super({
      blade: i.blade,
      rackController: new Di({ blade: i.blade, element: n.contentsElement, viewProps: i.viewProps }),
      view: n
    }), this.onRackAdd_ = this.onRackAdd_.bind(this), this.onRackRemove_ = this.onRackRemove_.bind(this);
    const r = this.rackController.rack;
    r.emitter.on("add", this.onRackAdd_), r.emitter.on("remove", this.onRackRemove_), this.tab = s;
  }
  
  add(e, i) {
    this.rackController.rack.add(e, i);
  }
  
  remove(e) {
    this.rackController.rack.remove(this.rackController.rack.children[e]);
  }
  
  onRackAdd_(e) {
    if (!e.root) return;
    const i = e.bladeController;
    dn(this.view.itemsElement, i.itemController.view.element, e.index), i.itemController.viewProps.set("parent", this.viewProps), this.tab.add(i.props.value("selected"));
  }
  
  onRackRemove_(e) {
    if (!e.root) return;
    const i = e.bladeController;
    Ti(i.itemController.view.element), i.itemController.viewProps.set("parent", null), this.tab.remove(i.props.value("selected"));
  }
}

const yn = H({
  id: "tab", type: "blade", accept(t) {
    const e = L(t, i => ({
      pages: i.required.array(i.required.object({ title: i.required.string })),
      view: i.required.constant("tab")
    }));
    return !e || e.pages.length === 0 ? null : { params: e };
  }, controller(t) {
    const e = new ms(t.document, { blade: t.blade, viewProps: t.viewProps });
    return t.params.pages.forEach(i => {
      const s = new fi(t.document, {
        blade: $e(),
        itemProps: _.fromObject({ selected: !1, title: i.title }),
        props: _.fromObject({ selected: !1 }),
        viewProps: de.create()
      });
      e.add(s);
    }), e;
  }, api(t) {
    return t.controller instanceof ms ? new _a(t.controller, t.pool) : t.controller instanceof fi ? new wa(t.controller, t.pool) : null;
  }
});

function Pa(t, e) {
  const i = t.accept(e.params);
  if (!i) return null;
  const s = L(e.params, n => ({ disabled: n.optional.boolean, hidden: n.optional.boolean }));
  return t.controller({
    blade: $e(),
    document: e.document,
    params: Object.assign(Object.assign({}, i.params), {
      disabled: s == null ? void 0 : s.disabled,
      hidden: s == null ? void 0 : s.hidden
    }),
    viewProps: de.create({ disabled: s == null ? void 0 : s.disabled, hidden: s == null ? void 0 : s.hidden })
  });
}

class Bi extends at {
  get options() {
    return this.controller.valueController.props.get("options");
  }
  
  set options(e) {
    this.controller.valueController.props.set("options", e);
  }
}

class Ca {
  constructor() {
    this.disabled = !1, this.emitter = new O;
  }
  
  dispose() {
  }
  
  tick() {
    this.disabled || this.emitter.emit("tick", { sender: this });
  }
}

class Ea {
  constructor(e, i) {
    this.disabled_ = !1, this.timerId_ = null, this.onTick_ = this.onTick_.bind(this), this.doc_ = e, this.emitter = new O, this.interval_ = i, this.setTimer_();
  }
  
  get disabled() {
    return this.disabled_;
  }
  
  set disabled(e) {
    this.disabled_ = e, this.disabled_ ? this.clearTimer_() : this.setTimer_();
  }
  
  dispose() {
    this.clearTimer_();
  }
  
  clearTimer_() {
    if (this.timerId_ === null) return;
    const e = this.doc_.defaultView;
    e && e.clearInterval(this.timerId_), this.timerId_ = null;
  }
  
  setTimer_() {
    if (this.clearTimer_(), this.interval_ <= 0) return;
    const e = this.doc_.defaultView;
    e && (this.timerId_ = e.setInterval(this.onTick_, this.interval_));
  }
  
  onTick_() {
    this.disabled_ || this.emitter.emit("tick", { sender: this });
  }
}

class ft {
  constructor(e) {
    this.constraints = e;
  }
  
  constrain(e) {
    return this.constraints.reduce((i, s) => s.constrain(i), e);
  }
}

function Vt(t, e) {
  if (t instanceof e) return t;
  if (t instanceof ft) {
    const i = t.constraints.reduce((s, n) => s || (n instanceof e ? n : null), null);
    if (i) return i;
  }
  return null;
}

class bt {
  constructor(e) {
    this.values = _.fromObject({ options: e });
  }
  
  constrain(e) {
    const i = this.values.get("options");
    return i.length === 0 || i.filter(n => n.value === e).length > 0 ? e : i[0].value;
  }
}

function gt(t) {
  var e;
  const i = pi;
  if (Array.isArray(t)) return (e = L({ items: t }, s => ({
    items: s.required.array(s.required.object({
      text: s.required.string,
      value: s.required.raw
    }))
  }))) === null || e === void 0 ? void 0 : e.items;
  if (typeof t == "object") return i.required.raw(t).value;
}

function Vi(t) {
  if (Array.isArray(t)) return t;
  const e = [];
  return Object.keys(t).forEach(i => {
    e.push({ text: i, value: t[i] });
  }), e;
}

function Oi(t) {
  return R(t) ? null : new bt(Vi(t));
}

const Qt = P("lst");

class Sa {
  constructor(e, i) {
    this.onValueChange_ = this.onValueChange_.bind(this), this.props_ = i.props, this.element = e.createElement("div"), this.element.classList.add(Qt()), i.viewProps.bindClassModifiers(this.element);
    const s = e.createElement("select");
    s.classList.add(Qt("s")), i.viewProps.bindDisabled(s), this.element.appendChild(s), this.selectElement = s;
    const n = e.createElement("div");
    n.classList.add(Qt("m")), n.appendChild(Ht(e, "dropdown")), this.element.appendChild(n), i.value.emitter.on("change", this.onValueChange_), this.value_ = i.value, se(this.props_, "options", r => {
      pn(this.selectElement), r.forEach(o => {
        const a = e.createElement("option");
        a.textContent = o.text, this.selectElement.appendChild(a);
      }), this.update_();
    });
  }
  
  update_() {
    const e = this.props_.get("options").map(i => i.value);
    this.selectElement.selectedIndex = e.indexOf(this.value_.rawValue);
  }
  
  onValueChange_() {
    this.update_();
  }
}

class Pe {
  constructor(e, i) {
    this.onSelectChange_ = this.onSelectChange_.bind(this), this.props = i.props, this.value = i.value, this.viewProps = i.viewProps, this.view = new Sa(e, {
      props: this.props,
      value: this.value,
      viewProps: this.viewProps
    }), this.view.selectElement.addEventListener("change", this.onSelectChange_);
  }
  
  onSelectChange_(e) {
    const i = e.currentTarget;
    this.value.rawValue = this.props.get("options")[i.selectedIndex].value;
  }
  
  importProps(e) {
    return q(e, null, i => ({ options: i.required.custom(gt) }), i => (this.props.set("options", Vi(i.options)), !0));
  }
  
  exportProps() {
    return $(null, { options: this.props.get("options") });
  }
}

const vs = P("pop");

class Ma {
  constructor(e, i) {
    this.element = e.createElement("div"), this.element.classList.add(vs()), i.viewProps.bindClassModifiers(this.element), ce(i.shows, Ke(this.element, vs(void 0, "v")));
  }
}

class Pn {
  constructor(e, i) {
    this.shows = D(!1), this.viewProps = i.viewProps, this.view = new Ma(e, {
      shows: this.shows,
      viewProps: this.viewProps
    });
  }
}

const fs = P("txt");

class Ta {
  constructor(e, i) {
    this.onChange_ = this.onChange_.bind(this), this.element = e.createElement("div"), this.element.classList.add(fs()), i.viewProps.bindClassModifiers(this.element), this.props_ = i.props, this.props_.emitter.on("change", this.onChange_);
    const s = e.createElement("input");
    s.classList.add(fs("i")), s.type = "text", i.viewProps.bindDisabled(s), this.element.appendChild(s), this.inputElement = s, i.value.emitter.on("change", this.onChange_), this.value_ = i.value, this.refresh();
  }
  
  refresh() {
    const e = this.props_.get("formatter");
    this.inputElement.value = e(this.value_.rawValue);
  }
  
  onChange_() {
    this.refresh();
  }
}

class lt {
  constructor(e, i) {
    this.onInputChange_ = this.onInputChange_.bind(this), this.parser_ = i.parser, this.props = i.props, this.value = i.value, this.viewProps = i.viewProps, this.view = new Ta(e, {
      props: i.props,
      value: this.value,
      viewProps: this.viewProps
    }), this.view.inputElement.addEventListener("change", this.onInputChange_);
  }
  
  onInputChange_(e) {
    const s = e.currentTarget.value, n = this.parser_(s);
    R(n) || (this.value.rawValue = n), this.view.refresh();
  }
}

function ka(t) {
  return String(t);
}

function Cn(t) {
  return t === "false" ? !1 : !!t;
}

function bs(t) {
  return ka(t);
}

function Ra(t) {
  return e => t.reduce((i, s) => i !== null ? i : s(e), null);
}

const Aa = W(0);

function Ot(t) {
  return Aa(t) + "%";
}

function En(t) {
  return String(t);
}

function bi(t) {
  return t;
}

function Ye({ primary: t, secondary: e, forward: i, backward: s }) {
  let n = !1;
  
  function r(o) {
    n || (n = !0, o(), n = !1);
  }
  
  t.emitter.on("change", o => {
    r(() => {
      e.setRawValue(i(t.rawValue, e.rawValue), o.options);
    });
  }), e.emitter.on("change", o => {
    r(() => {
      t.setRawValue(s(t.rawValue, e.rawValue), o.options);
    }), r(() => {
      e.setRawValue(i(t.rawValue, e.rawValue), o.options);
    });
  }), r(() => {
    e.setRawValue(i(t.rawValue, e.rawValue), { forceEmit: !1, last: !0 });
  });
}

function G(t, e) {
  const i = t * (e.altKey ? .1 : 1) * (e.shiftKey ? 10 : 1);
  return e.upKey ? +i : e.downKey ? -i : 0;
}

function ct(t) {
  return { altKey: t.altKey, downKey: t.key === "ArrowDown", shiftKey: t.shiftKey, upKey: t.key === "ArrowUp" };
}

function ue(t) {
  return { altKey: t.altKey, downKey: t.key === "ArrowLeft", shiftKey: t.shiftKey, upKey: t.key === "ArrowRight" };
}

function Da(t) {
  return t === "ArrowUp" || t === "ArrowDown";
}

function Sn(t) {
  return Da(t) || t === "ArrowLeft" || t === "ArrowRight";
}

function Jt(t, e) {
  var i, s;
  const n = e.ownerDocument.defaultView, r = e.getBoundingClientRect();
  return {
    x: t.pageX - (((i = n && n.scrollX) !== null && i !== void 0 ? i : 0) + r.left),
    y: t.pageY - (((s = n && n.scrollY) !== null && s !== void 0 ? s : 0) + r.top)
  };
}

class Le {
  constructor(e) {
    this.lastTouch_ = null, this.onDocumentMouseMove_ = this.onDocumentMouseMove_.bind(this), this.onDocumentMouseUp_ = this.onDocumentMouseUp_.bind(this), this.onMouseDown_ = this.onMouseDown_.bind(this), this.onTouchEnd_ = this.onTouchEnd_.bind(this), this.onTouchMove_ = this.onTouchMove_.bind(this), this.onTouchStart_ = this.onTouchStart_.bind(this), this.elem_ = e, this.emitter = new O, e.addEventListener("touchstart", this.onTouchStart_, { passive: !1 }), e.addEventListener("touchmove", this.onTouchMove_, { passive: !0 }), e.addEventListener("touchend", this.onTouchEnd_), e.addEventListener("mousedown", this.onMouseDown_);
  }
  
  computePosition_(e) {
    const i = this.elem_.getBoundingClientRect();
    return { bounds: { width: i.width, height: i.height }, point: e ? { x: e.x, y: e.y } : null };
  }
  
  onMouseDown_(e) {
    var i;
    e.preventDefault(), (i = e.currentTarget) === null || i === void 0 || i.focus();
    const s = this.elem_.ownerDocument;
    s.addEventListener("mousemove", this.onDocumentMouseMove_), s.addEventListener("mouseup", this.onDocumentMouseUp_), this.emitter.emit("down", {
      altKey: e.altKey,
      data: this.computePosition_(Jt(e, this.elem_)),
      sender: this,
      shiftKey: e.shiftKey
    });
  }
  
  onDocumentMouseMove_(e) {
    this.emitter.emit("move", {
      altKey: e.altKey,
      data: this.computePosition_(Jt(e, this.elem_)),
      sender: this,
      shiftKey: e.shiftKey
    });
  }
  
  onDocumentMouseUp_(e) {
    const i = this.elem_.ownerDocument;
    i.removeEventListener("mousemove", this.onDocumentMouseMove_), i.removeEventListener("mouseup", this.onDocumentMouseUp_), this.emitter.emit("up", {
      altKey: e.altKey,
      data: this.computePosition_(Jt(e, this.elem_)),
      sender: this,
      shiftKey: e.shiftKey
    });
  }
  
  onTouchStart_(e) {
    e.preventDefault();
    const i = e.targetTouches.item(0), s = this.elem_.getBoundingClientRect();
    this.emitter.emit("down", {
      altKey: e.altKey,
      data: this.computePosition_(i ? { x: i.clientX - s.left, y: i.clientY - s.top } : void 0),
      sender: this,
      shiftKey: e.shiftKey
    }), this.lastTouch_ = i;
  }
  
  onTouchMove_(e) {
    const i = e.targetTouches.item(0), s = this.elem_.getBoundingClientRect();
    this.emitter.emit("move", {
      altKey: e.altKey,
      data: this.computePosition_(i ? { x: i.clientX - s.left, y: i.clientY - s.top } : void 0),
      sender: this,
      shiftKey: e.shiftKey
    }), this.lastTouch_ = i;
  }
  
  onTouchEnd_(e) {
    var i;
    const s = (i = e.targetTouches.item(0)) !== null && i !== void 0 ? i : this.lastTouch_,
      n = this.elem_.getBoundingClientRect();
    this.emitter.emit("up", {
      altKey: e.altKey,
      data: this.computePosition_(s ? { x: s.clientX - n.left, y: s.clientY - n.top } : void 0),
      sender: this,
      shiftKey: e.shiftKey
    });
  }
}

const X = P("txt");

class La {
  constructor(e, i) {
    this.onChange_ = this.onChange_.bind(this), this.props_ = i.props, this.props_.emitter.on("change", this.onChange_), this.element = e.createElement("div"), this.element.classList.add(X(), X(void 0, "num")), i.arrayPosition && this.element.classList.add(X(void 0, i.arrayPosition)), i.viewProps.bindClassModifiers(this.element);
    const s = e.createElement("input");
    s.classList.add(X("i")), s.type = "text", i.viewProps.bindDisabled(s), this.element.appendChild(s), this.inputElement = s, this.onDraggingChange_ = this.onDraggingChange_.bind(this), this.dragging_ = i.dragging, this.dragging_.emitter.on("change", this.onDraggingChange_), this.element.classList.add(X()), this.inputElement.classList.add(X("i"));
    const n = e.createElement("div");
    n.classList.add(X("k")), this.element.appendChild(n), this.knobElement = n;
    const r = e.createElementNS(ee, "svg");
    r.classList.add(X("g")), this.knobElement.appendChild(r);
    const o = e.createElementNS(ee, "path");
    o.classList.add(X("gb")), r.appendChild(o), this.guideBodyElem_ = o;
    const a = e.createElementNS(ee, "path");
    a.classList.add(X("gh")), r.appendChild(a), this.guideHeadElem_ = a;
    const l = e.createElement("div");
    l.classList.add(P("tt")()), this.knobElement.appendChild(l), this.tooltipElem_ = l, i.value.emitter.on("change", this.onChange_), this.value = i.value, this.refresh();
  }
  
  onDraggingChange_(e) {
    if (e.rawValue === null) {
      this.element.classList.remove(X(void 0, "drg"));
      return;
    }
    this.element.classList.add(X(void 0, "drg"));
    const i = e.rawValue / this.props_.get("pointerScale"), s = i + (i > 0 ? -1 : i < 0 ? 1 : 0), n = I(-s, -4, 4);
    this.guideHeadElem_.setAttributeNS(null, "d", [`M ${s + n},0 L${s},4 L${s + n},8`, `M ${i},-1 L${i},9`].join(" ")), this.guideBodyElem_.setAttributeNS(null, "d", `M 0,4 L${i},4`);
    const r = this.props_.get("formatter");
    this.tooltipElem_.textContent = r(this.value.rawValue), this.tooltipElem_.style.left = `${i}px`;
  }
  
  refresh() {
    const e = this.props_.get("formatter");
    this.inputElement.value = e(this.value.rawValue);
  }
  
  onChange_() {
    this.refresh();
  }
}

class _t {
  constructor(e, i) {
    var s;
    this.originRawValue_ = 0, this.onInputChange_ = this.onInputChange_.bind(this), this.onInputKeyDown_ = this.onInputKeyDown_.bind(this), this.onInputKeyUp_ = this.onInputKeyUp_.bind(this), this.onPointerDown_ = this.onPointerDown_.bind(this), this.onPointerMove_ = this.onPointerMove_.bind(this), this.onPointerUp_ = this.onPointerUp_.bind(this), this.parser_ = i.parser, this.props = i.props, this.sliderProps_ = (s = i.sliderProps) !== null && s !== void 0 ? s : null, this.value = i.value, this.viewProps = i.viewProps, this.dragging_ = D(null), this.view = new La(e, {
      arrayPosition: i.arrayPosition,
      dragging: this.dragging_,
      props: this.props,
      value: this.value,
      viewProps: this.viewProps
    }), this.view.inputElement.addEventListener("change", this.onInputChange_), this.view.inputElement.addEventListener("keydown", this.onInputKeyDown_), this.view.inputElement.addEventListener("keyup", this.onInputKeyUp_);
    const n = new Le(this.view.knobElement);
    n.emitter.on("down", this.onPointerDown_), n.emitter.on("move", this.onPointerMove_), n.emitter.on("up", this.onPointerUp_);
  }
  
  constrainValue_(e) {
    var i, s;
    const n = (i = this.sliderProps_) === null || i === void 0 ? void 0 : i.get("min"),
      r = (s = this.sliderProps_) === null || s === void 0 ? void 0 : s.get("max");
    let o = e;
    return n !== void 0 && (o = Math.max(o, n)), r !== void 0 && (o = Math.min(o, r)), o;
  }
  
  onInputChange_(e) {
    const s = e.currentTarget.value, n = this.parser_(s);
    R(n) || (this.value.rawValue = this.constrainValue_(n)), this.view.refresh();
  }
  
  onInputKeyDown_(e) {
    const i = G(this.props.get("keyScale"), ct(e));
    i !== 0 && this.value.setRawValue(this.constrainValue_(this.value.rawValue + i), { forceEmit: !1, last: !1 });
  }
  
  onInputKeyUp_(e) {
    G(this.props.get("keyScale"), ct(e)) !== 0 && this.value.setRawValue(this.value.rawValue, {
      forceEmit: !0,
      last: !0
    });
  }
  
  onPointerDown_() {
    this.originRawValue_ = this.value.rawValue, this.dragging_.rawValue = 0;
  }
  
  computeDraggingValue_(e) {
    if (!e.point) return null;
    const i = e.point.x - e.bounds.width / 2;
    return this.constrainValue_(this.originRawValue_ + i * this.props.get("pointerScale"));
  }
  
  onPointerMove_(e) {
    const i = this.computeDraggingValue_(e.data);
    i !== null && (this.value.setRawValue(i, {
      forceEmit: !1,
      last: !1
    }), this.dragging_.rawValue = this.value.rawValue - this.originRawValue_);
  }
  
  onPointerUp_(e) {
    const i = this.computeDraggingValue_(e.data);
    i !== null && (this.value.setRawValue(i, { forceEmit: !0, last: !0 }), this.dragging_.rawValue = null);
  }
}

const ei = P("sld");

class Ba {
  constructor(e, i) {
    this.onChange_ = this.onChange_.bind(this), this.props_ = i.props, this.props_.emitter.on("change", this.onChange_), this.element = e.createElement("div"), this.element.classList.add(ei()), i.viewProps.bindClassModifiers(this.element);
    const s = e.createElement("div");
    s.classList.add(ei("t")), i.viewProps.bindTabIndex(s), this.element.appendChild(s), this.trackElement = s;
    const n = e.createElement("div");
    n.classList.add(ei("k")), this.trackElement.appendChild(n), this.knobElement = n, i.value.emitter.on("change", this.onChange_), this.value = i.value, this.update_();
  }
  
  update_() {
    const e = I(T(this.value.rawValue, this.props_.get("min"), this.props_.get("max"), 0, 100), 0, 100);
    this.knobElement.style.width = `${e}%`;
  }
  
  onChange_() {
    this.update_();
  }
}

class Va {
  constructor(e, i) {
    this.onKeyDown_ = this.onKeyDown_.bind(this), this.onKeyUp_ = this.onKeyUp_.bind(this), this.onPointerDownOrMove_ = this.onPointerDownOrMove_.bind(this), this.onPointerUp_ = this.onPointerUp_.bind(this), this.value = i.value, this.viewProps = i.viewProps, this.props = i.props, this.view = new Ba(e, {
      props: this.props,
      value: this.value,
      viewProps: this.viewProps
    }), this.ptHandler_ = new Le(this.view.trackElement), this.ptHandler_.emitter.on("down", this.onPointerDownOrMove_), this.ptHandler_.emitter.on("move", this.onPointerDownOrMove_), this.ptHandler_.emitter.on("up", this.onPointerUp_), this.view.trackElement.addEventListener("keydown", this.onKeyDown_), this.view.trackElement.addEventListener("keyup", this.onKeyUp_);
  }
  
  handlePointerEvent_(e, i) {
    e.point && this.value.setRawValue(T(I(e.point.x, 0, e.bounds.width), 0, e.bounds.width, this.props.get("min"), this.props.get("max")), i);
  }
  
  onPointerDownOrMove_(e) {
    this.handlePointerEvent_(e.data, { forceEmit: !1, last: !1 });
  }
  
  onPointerUp_(e) {
    this.handlePointerEvent_(e.data, { forceEmit: !0, last: !0 });
  }
  
  onKeyDown_(e) {
    const i = G(this.props.get("keyScale"), ue(e));
    i !== 0 && this.value.setRawValue(this.value.rawValue + i, { forceEmit: !1, last: !1 });
  }
  
  onKeyUp_(e) {
    G(this.props.get("keyScale"), ue(e)) !== 0 && this.value.setRawValue(this.value.rawValue, {
      forceEmit: !0,
      last: !0
    });
  }
}

const ti = P("sldtxt");

class Oa {
  constructor(e, i) {
    this.element = e.createElement("div"), this.element.classList.add(ti());
    const s = e.createElement("div");
    s.classList.add(ti("s")), this.sliderView_ = i.sliderView, s.appendChild(this.sliderView_.element), this.element.appendChild(s);
    const n = e.createElement("div");
    n.classList.add(ti("t")), this.textView_ = i.textView, n.appendChild(this.textView_.element), this.element.appendChild(n);
  }
}

class Ut {
  constructor(e, i) {
    this.value = i.value, this.viewProps = i.viewProps, this.sliderC_ = new Va(e, {
      props: i.sliderProps,
      value: i.value,
      viewProps: this.viewProps
    }), this.textC_ = new _t(e, {
      parser: i.parser,
      props: i.textProps,
      sliderProps: i.sliderProps,
      value: i.value,
      viewProps: i.viewProps
    }), this.view = new Oa(e, { sliderView: this.sliderC_.view, textView: this.textC_.view });
  }
  
  get sliderController() {
    return this.sliderC_;
  }
  
  get textController() {
    return this.textC_;
  }
  
  importProps(e) {
    return q(e, null, i => ({ max: i.required.number, min: i.required.number }), i => {
      const s = this.sliderC_.props;
      return s.set("max", i.max), s.set("min", i.min), !0;
    });
  }
  
  exportProps() {
    const e = this.sliderC_.props;
    return $(null, { max: e.get("max"), min: e.get("min") });
  }
}

function Mn(t) {
  return {
    sliderProps: new _({ keyScale: t.keyScale, max: t.max, min: t.min }),
    textProps: new _({ formatter: D(t.formatter), keyScale: t.keyScale, pointerScale: D(t.pointerScale) })
  };
}

const Ua = { containerUnitSize: "cnt-usz" };

function Tn(t) {
  return `--${Ua[t]}`;
}

function ht(t) {
  return hn(t);
}

function xe(t) {
  if (di(t)) return L(t, ht);
}

function le(t, e) {
  if (!t) return;
  const i = [], s = an(t, e);
  s && i.push(s);
  const n = ln(t);
  return n && i.push(n), new ft(i);
}

function Ia(t) {
  return t ? t.major === qe.major : !1;
}

function kn(t) {
  if (t === "inline" || t === "popup") return t;
}

function wt(t, e) {
  t.write(e);
}

const Mt = P("ckb");

class za {
  constructor(e, i) {
    this.onValueChange_ = this.onValueChange_.bind(this), this.element = e.createElement("div"), this.element.classList.add(Mt()), i.viewProps.bindClassModifiers(this.element);
    const s = e.createElement("label");
    s.classList.add(Mt("l")), this.element.appendChild(s), this.labelElement = s;
    const n = e.createElement("input");
    n.classList.add(Mt("i")), n.type = "checkbox", this.labelElement.appendChild(n), this.inputElement = n, i.viewProps.bindDisabled(this.inputElement);
    const r = e.createElement("div");
    r.classList.add(Mt("w")), this.labelElement.appendChild(r);
    const o = Ht(e, "check");
    r.appendChild(o), i.value.emitter.on("change", this.onValueChange_), this.value = i.value, this.update_();
  }
  
  update_() {
    this.inputElement.checked = this.value.rawValue;
  }
  
  onValueChange_() {
    this.update_();
  }
}

class Fa {
  constructor(e, i) {
    this.onInputChange_ = this.onInputChange_.bind(this), this.onLabelMouseDown_ = this.onLabelMouseDown_.bind(this), this.value = i.value, this.viewProps = i.viewProps, this.view = new za(e, {
      value: this.value,
      viewProps: this.viewProps
    }), this.view.inputElement.addEventListener("change", this.onInputChange_), this.view.labelElement.addEventListener("mousedown", this.onLabelMouseDown_);
  }
  
  onInputChange_(e) {
    const i = e.currentTarget;
    this.value.rawValue = i.checked, e.preventDefault(), e.stopPropagation();
  }
  
  onLabelMouseDown_(e) {
    e.preventDefault();
  }
}

function Na(t) {
  const e = [], i = Oi(t.options);
  return i && e.push(i), new ft(e);
}

const Ha = H({
  id: "input-bool", type: "input", accept: (t, e) => {
    if (typeof t != "boolean") return null;
    const i = L(e, s => ({ options: s.optional.custom(gt), readonly: s.optional.constant(!1) }));
    return i ? { initialValue: t, params: i } : null;
  }, binding: { reader: t => Cn, constraint: t => Na(t.params), writer: t => wt }, controller: t => {
    const e = t.document, i = t.value, s = t.constraint, n = s && Vt(s, bt);
    return n ? new Pe(e, {
      props: new _({ options: n.values.value("options") }),
      value: i,
      viewProps: t.viewProps
    }) : new Fa(e, { value: i, viewProps: t.viewProps });
  }, api(t) {
    return typeof t.controller.value.rawValue != "boolean" ? null : t.controller.valueController instanceof Pe ? new Bi(t.controller) : null;
  }
}), Ce = P("col");

class ja {
  constructor(e, i) {
    this.element = e.createElement("div"), this.element.classList.add(Ce()), i.foldable.bindExpandedClass(this.element, Ce(void 0, "expanded")), se(i.foldable, "completed", Ke(this.element, Ce(void 0, "cpl")));
    const s = e.createElement("div");
    s.classList.add(Ce("h")), this.element.appendChild(s);
    const n = e.createElement("div");
    n.classList.add(Ce("s")), s.appendChild(n), this.swatchElement = n;
    const r = e.createElement("div");
    if (r.classList.add(Ce("t")), s.appendChild(r), this.textElement = r, i.pickerLayout === "inline") {
      const o = e.createElement("div");
      o.classList.add(Ce("p")), this.element.appendChild(o), this.pickerElement = o;
    } else this.pickerElement = null;
  }
}

function Ga(t, e, i) {
  const s = I(t / 255, 0, 1), n = I(e / 255, 0, 1), r = I(i / 255, 0, 1), o = Math.max(s, n, r), a = Math.min(s, n, r),
    l = o - a;
  let h = 0, c = 0;
  const u = (a + o) / 2;
  return l !== 0 && (c = l / (1 - Math.abs(o + a - 1)), s === o ? h = (n - r) / l : n === o ? h = 2 + (r - s) / l : h = 4 + (s - n) / l, h = h / 6 + (h < 0 ? 1 : 0)), [h * 360, c * 100, u * 100];
}

function Wa(t, e, i) {
  const s = (t % 360 + 360) % 360, n = I(e / 100, 0, 1), r = I(i / 100, 0, 1), o = (1 - Math.abs(2 * r - 1)) * n,
    a = o * (1 - Math.abs(s / 60 % 2 - 1)), l = r - o / 2;
  let h, c, u;
  return s >= 0 && s < 60 ? [h, c, u] = [o, a, 0] : s >= 60 && s < 120 ? [h, c, u] = [a, o, 0] : s >= 120 && s < 180 ? [h, c, u] = [0, o, a] : s >= 180 && s < 240 ? [h, c, u] = [0, a, o] : s >= 240 && s < 300 ? [h, c, u] = [a, 0, o] : [h, c, u] = [o, 0, a], [(h + l) * 255, (c + l) * 255, (u + l) * 255];
}

function Ka(t, e, i) {
  const s = I(t / 255, 0, 1), n = I(e / 255, 0, 1), r = I(i / 255, 0, 1), o = Math.max(s, n, r), a = Math.min(s, n, r),
    l = o - a;
  let h;
  l === 0 ? h = 0 : o === s ? h = 60 * (((n - r) / l % 6 + 6) % 6) : o === n ? h = 60 * ((r - s) / l + 2) : h = 60 * ((s - n) / l + 4);
  const c = o === 0 ? 0 : l / o, u = o;
  return [h, c * 100, u * 100];
}

function Rn(t, e, i) {
  const s = nn(t, 360), n = I(e / 100, 0, 1), r = I(i / 100, 0, 1), o = r * n, a = o * (1 - Math.abs(s / 60 % 2 - 1)),
    l = r - o;
  let h, c, u;
  return s >= 0 && s < 60 ? [h, c, u] = [o, a, 0] : s >= 60 && s < 120 ? [h, c, u] = [a, o, 0] : s >= 120 && s < 180 ? [h, c, u] = [0, o, a] : s >= 180 && s < 240 ? [h, c, u] = [0, a, o] : s >= 240 && s < 300 ? [h, c, u] = [a, 0, o] : [h, c, u] = [o, 0, a], [(h + l) * 255, (c + l) * 255, (u + l) * 255];
}

function qa(t, e, i) {
  const s = i + e * (100 - Math.abs(2 * i - 100)) / 200;
  return [t, s !== 0 ? e * (100 - Math.abs(2 * i - 100)) / s : 0, i + e * (100 - Math.abs(2 * i - 100)) / (2 * 100)];
}

function $a(t, e, i) {
  const s = 100 - Math.abs(i * (200 - e) / 100 - 100);
  return [t, s !== 0 ? e * i / s : 0, i * (200 - e) / (2 * 100)];
}

function ne(t) {
  return [t[0], t[1], t[2]];
}

function Gt(t, e) {
  return [t[0], t[1], t[2], e];
}

const Ya = {
  hsl: { hsl: (t, e, i) => [t, e, i], hsv: qa, rgb: Wa },
  hsv: { hsl: $a, hsv: (t, e, i) => [t, e, i], rgb: Rn },
  rgb: { hsl: Ga, hsv: Ka, rgb: (t, e, i) => [t, e, i] }
};

function Ge(t, e) {
  return [e === "float" ? 1 : t === "rgb" ? 255 : 360, e === "float" ? 1 : t === "rgb" ? 255 : 100, e === "float" ? 1 : t === "rgb" ? 255 : 100];
}

function Xa(t, e) {
  return t === e ? e : nn(t, e);
}

function An(t, e, i) {
  var s;
  const n = Ge(e, i);
  return [e === "rgb" ? I(t[0], 0, n[0]) : Xa(t[0], n[0]), I(t[1], 0, n[1]), I(t[2], 0, n[2]), I((s = t[3]) !== null && s !== void 0 ? s : 1, 0, 1)];
}

function gs(t, e, i, s) {
  const n = Ge(e, i), r = Ge(e, s);
  return t.map((o, a) => o / n[a] * r[a]);
}

function Dn(t, e, i) {
  const s = gs(t, e.mode, e.type, "int"), n = Ya[e.mode][i.mode](...s);
  return gs(n, i.mode, "int", i.type);
}

class M {
  static black() {
    return new M([0, 0, 0], "rgb");
  }
  
  constructor(e, i) {
    this.type = "int", this.mode = i, this.comps_ = An(e, i, this.type);
  }
  
  getComponents(e) {
    return Gt(Dn(ne(this.comps_), { mode: this.mode, type: this.type }, {
      mode: e ?? this.mode,
      type: this.type
    }), this.comps_[3]);
  }
  
  toRgbaObject() {
    const e = this.getComponents("rgb");
    return { r: e[0], g: e[1], b: e[2], a: e[3] };
  }
}

const me = P("colp");

class Za {
  constructor(e, i) {
    this.alphaViews_ = null, this.element = e.createElement("div"), this.element.classList.add(me()), i.viewProps.bindClassModifiers(this.element);
    const s = e.createElement("div");
    s.classList.add(me("hsv"));
    const n = e.createElement("div");
    n.classList.add(me("sv")), this.svPaletteView_ = i.svPaletteView, n.appendChild(this.svPaletteView_.element), s.appendChild(n);
    const r = e.createElement("div");
    r.classList.add(me("h")), this.hPaletteView_ = i.hPaletteView, r.appendChild(this.hPaletteView_.element), s.appendChild(r), this.element.appendChild(s);
    const o = e.createElement("div");
    if (o.classList.add(me("rgb")), this.textsView_ = i.textsView, o.appendChild(this.textsView_.element), this.element.appendChild(o), i.alphaViews) {
      this.alphaViews_ = { palette: i.alphaViews.palette, text: i.alphaViews.text };
      const a = e.createElement("div");
      a.classList.add(me("a"));
      const l = e.createElement("div");
      l.classList.add(me("ap")), l.appendChild(this.alphaViews_.palette.element), a.appendChild(l);
      const h = e.createElement("div");
      h.classList.add(me("at")), h.appendChild(this.alphaViews_.text.element), a.appendChild(h), this.element.appendChild(a);
    }
  }
  
  get allFocusableElements() {
    const e = [this.svPaletteView_.element, this.hPaletteView_.element, this.textsView_.modeSelectElement, ...this.textsView_.inputViews.map(i => i.inputElement)];
    return this.alphaViews_ && e.push(this.alphaViews_.palette.element, this.alphaViews_.text.inputElement), e;
  }
}

function Qa(t) {
  return t === "int" ? "int" : t === "float" ? "float" : void 0;
}

function Ui(t) {
  return L(t, e => ({
    color: e.optional.object({ alpha: e.optional.boolean, type: e.optional.custom(Qa) }),
    expanded: e.optional.boolean,
    picker: e.optional.custom(kn),
    readonly: e.optional.constant(!1)
  }));
}

function Ae(t) {
  return t ? .1 : 1;
}

function Ln(t) {
  var e;
  return (e = t.color) === null || e === void 0 ? void 0 : e.type;
}

class Ii {
  constructor(e, i) {
    this.type = "float", this.mode = i, this.comps_ = An(e, i, this.type);
  }
  
  getComponents(e) {
    return Gt(Dn(ne(this.comps_), { mode: this.mode, type: this.type }, {
      mode: e ?? this.mode,
      type: this.type
    }), this.comps_[3]);
  }
  
  toRgbaObject() {
    const e = this.getComponents("rgb");
    return { r: e[0], g: e[1], b: e[2], a: e[3] };
  }
}

const Ja = { int: (t, e) => new M(t, e), float: (t, e) => new Ii(t, e) };

function zi(t, e, i) {
  return Ja[i](t, e);
}

function el(t) {
  return t.type === "float";
}

function tl(t) {
  return t.type === "int";
}

function il(t) {
  const e = t.getComponents(), i = Ge(t.mode, "int");
  return new M([Math.round(T(e[0], 0, 1, 0, i[0])), Math.round(T(e[1], 0, 1, 0, i[1])), Math.round(T(e[2], 0, 1, 0, i[2])), e[3]], t.mode);
}

function sl(t) {
  const e = t.getComponents(), i = Ge(t.mode, "int");
  return new Ii([T(e[0], 0, i[0], 0, 1), T(e[1], 0, i[1], 0, 1), T(e[2], 0, i[2], 0, 1), e[3]], t.mode);
}

function N(t, e) {
  if (t.type === e) return t;
  if (tl(t) && e === "float") return sl(t);
  if (el(t) && e === "int") return il(t);
  throw V.shouldNeverHappen();
}

function nl(t, e) {
  return t.alpha === e.alpha && t.mode === e.mode && t.notation === e.notation && t.type === e.type;
}

function Z(t, e) {
  const i = t.match(/^(.+)%$/);
  return Math.min(i ? parseFloat(i[1]) * .01 * e : parseFloat(t), e);
}

const rl = { deg: t => t, grad: t => t * 360 / 400, rad: t => t * 360 / (2 * Math.PI), turn: t => t * 360 };

function Bn(t) {
  const e = t.match(/^([0-9.]+?)(deg|grad|rad|turn)$/);
  if (!e) return parseFloat(t);
  const i = parseFloat(e[1]), s = e[2];
  return rl[s](i);
}

function Vn(t) {
  const e = t.match(/^rgb\(\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*\)$/);
  if (!e) return null;
  const i = [Z(e[1], 255), Z(e[2], 255), Z(e[3], 255)];
  return isNaN(i[0]) || isNaN(i[1]) || isNaN(i[2]) ? null : i;
}

function ol(t) {
  const e = Vn(t);
  return e ? new M(e, "rgb") : null;
}

function On(t) {
  const e = t.match(/^rgba\(\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*\)$/);
  if (!e) return null;
  const i = [Z(e[1], 255), Z(e[2], 255), Z(e[3], 255), Z(e[4], 1)];
  return isNaN(i[0]) || isNaN(i[1]) || isNaN(i[2]) || isNaN(i[3]) ? null : i;
}

function al(t) {
  const e = On(t);
  return e ? new M(e, "rgb") : null;
}

function Un(t) {
  const e = t.match(/^hsl\(\s*([0-9A-Fa-f.]+(?:deg|grad|rad|turn)?)\s*,\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*\)$/);
  if (!e) return null;
  const i = [Bn(e[1]), Z(e[2], 100), Z(e[3], 100)];
  return isNaN(i[0]) || isNaN(i[1]) || isNaN(i[2]) ? null : i;
}

function ll(t) {
  const e = Un(t);
  return e ? new M(e, "hsl") : null;
}

function In(t) {
  const e = t.match(/^hsla\(\s*([0-9A-Fa-f.]+(?:deg|grad|rad|turn)?)\s*,\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*\)$/);
  if (!e) return null;
  const i = [Bn(e[1]), Z(e[2], 100), Z(e[3], 100), Z(e[4], 1)];
  return isNaN(i[0]) || isNaN(i[1]) || isNaN(i[2]) || isNaN(i[3]) ? null : i;
}

function cl(t) {
  const e = In(t);
  return e ? new M(e, "hsl") : null;
}

function zn(t) {
  const e = t.match(/^#([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])$/);
  if (e) return [parseInt(e[1] + e[1], 16), parseInt(e[2] + e[2], 16), parseInt(e[3] + e[3], 16)];
  const i = t.match(/^(?:#|0x)([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/);
  return i ? [parseInt(i[1], 16), parseInt(i[2], 16), parseInt(i[3], 16)] : null;
}

function hl(t) {
  const e = zn(t);
  return e ? new M(e, "rgb") : null;
}

function Fn(t) {
  const e = t.match(/^#([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])$/);
  if (e) return [parseInt(e[1] + e[1], 16), parseInt(e[2] + e[2], 16), parseInt(e[3] + e[3], 16), T(parseInt(e[4] + e[4], 16), 0, 255, 0, 1)];
  const i = t.match(/^(?:#|0x)?([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/);
  return i ? [parseInt(i[1], 16), parseInt(i[2], 16), parseInt(i[3], 16), T(parseInt(i[4], 16), 0, 255, 0, 1)] : null;
}

function ul(t) {
  const e = Fn(t);
  return e ? new M(e, "rgb") : null;
}

function Nn(t) {
  const e = t.match(/^\{\s*r\s*:\s*([0-9A-Fa-f.]+%?)\s*,\s*g\s*:\s*([0-9A-Fa-f.]+%?)\s*,\s*b\s*:\s*([0-9A-Fa-f.]+%?)\s*\}$/);
  if (!e) return null;
  const i = [parseFloat(e[1]), parseFloat(e[2]), parseFloat(e[3])];
  return isNaN(i[0]) || isNaN(i[1]) || isNaN(i[2]) ? null : i;
}

function dl(t) {
  return e => {
    const i = Nn(e);
    return i ? zi(i, "rgb", t) : null;
  };
}

function Hn(t) {
  const e = t.match(/^\{\s*r\s*:\s*([0-9A-Fa-f.]+%?)\s*,\s*g\s*:\s*([0-9A-Fa-f.]+%?)\s*,\s*b\s*:\s*([0-9A-Fa-f.]+%?)\s*,\s*a\s*:\s*([0-9A-Fa-f.]+%?)\s*\}$/);
  if (!e) return null;
  const i = [parseFloat(e[1]), parseFloat(e[2]), parseFloat(e[3]), parseFloat(e[4])];
  return isNaN(i[0]) || isNaN(i[1]) || isNaN(i[2]) || isNaN(i[3]) ? null : i;
}

function pl(t) {
  return e => {
    const i = Hn(e);
    return i ? zi(i, "rgb", t) : null;
  };
}

const ml = [{ parser: zn, result: { alpha: !1, mode: "rgb", notation: "hex" } }, {
  parser: Fn,
  result: { alpha: !0, mode: "rgb", notation: "hex" }
}, { parser: Vn, result: { alpha: !1, mode: "rgb", notation: "func" } }, {
  parser: On,
  result: { alpha: !0, mode: "rgb", notation: "func" }
}, { parser: Un, result: { alpha: !1, mode: "hsl", notation: "func" } }, {
  parser: In,
  result: { alpha: !0, mode: "hsl", notation: "func" }
}, { parser: Nn, result: { alpha: !1, mode: "rgb", notation: "object" } }, {
  parser: Hn,
  result: { alpha: !0, mode: "rgb", notation: "object" }
}];

function vl(t) {
  return ml.reduce((e, { parser: i, result: s }) => e || (i(t) ? s : null), null);
}

function fl(t, e = "int") {
  const i = vl(t);
  return i ? i.notation === "hex" && e !== "float" ? Object.assign(Object.assign({}, i), { type: "int" }) : i.notation === "func" ? Object.assign(Object.assign({}, i), { type: e }) : null : null;
}

function xt(t) {
  const e = [hl, ul, ol, al, ll, cl];
  e.push(dl("int"), pl("int"));
  const i = Ra(e);
  return s => {
    const n = i(s);
    return n ? N(n, t) : null;
  };
}

function bl(t) {
  const e = xt("int");
  if (typeof t != "string") return M.black();
  const i = e(t);
  return i ?? M.black();
}

function jn(t) {
  const e = I(Math.floor(t), 0, 255).toString(16);
  return e.length === 1 ? `0${e}` : e;
}

function Fi(t, e = "#") {
  const i = ne(t.getComponents("rgb")).map(jn).join("");
  return `${e}${i}`;
}

function Ni(t, e = "#") {
  const i = t.getComponents("rgb"), s = [i[0], i[1], i[2], i[3] * 255].map(jn).join("");
  return `${e}${s}`;
}

function Gn(t) {
  const e = W(0), i = N(t, "int");
  return `rgb(${ne(i.getComponents("rgb")).map(n => e(n)).join(", ")})`;
}

function Rt(t) {
  const e = W(2), i = W(0);
  return `rgba(${N(t, "int").getComponents("rgb").map((r, o) => (o === 3 ? e : i)(r)).join(", ")})`;
}

function gl(t) {
  const e = [W(0), Ot, Ot], i = N(t, "int");
  return `hsl(${ne(i.getComponents("hsl")).map((n, r) => e[r](n)).join(", ")})`;
}

function _l(t) {
  const e = [W(0), Ot, Ot, W(2)];
  return `hsla(${N(t, "int").getComponents("hsl").map((n, r) => e[r](n)).join(", ")})`;
}

function Wn(t, e) {
  const i = W(e === "float" ? 2 : 0), s = ["r", "g", "b"], n = N(t, e);
  return `{${ne(n.getComponents("rgb")).map((o, a) => `${s[a]}: ${i(o)}`).join(", ")}}`;
}

function wl(t) {
  return e => Wn(e, t);
}

function Kn(t, e) {
  const i = W(2), s = W(e === "float" ? 2 : 0), n = ["r", "g", "b", "a"];
  return `{${N(t, e).getComponents("rgb").map((a, l) => {
    const h = l === 3 ? i : s;
    return `${n[l]}: ${h(a)}`;
  }).join(", ")}}`;
}

function xl(t) {
  return e => Kn(e, t);
}

const yl = [{
  format: { alpha: !1, mode: "rgb", notation: "hex", type: "int" },
  stringifier: Fi
}, { format: { alpha: !0, mode: "rgb", notation: "hex", type: "int" }, stringifier: Ni }, {
  format: {
    alpha: !1,
    mode: "rgb",
    notation: "func",
    type: "int"
  }, stringifier: Gn
}, { format: { alpha: !0, mode: "rgb", notation: "func", type: "int" }, stringifier: Rt }, {
  format: {
    alpha: !1,
    mode: "hsl",
    notation: "func",
    type: "int"
  }, stringifier: gl
}, {
  format: { alpha: !0, mode: "hsl", notation: "func", type: "int" },
  stringifier: _l
}, ...["int", "float"].reduce((t, e) => [...t, {
  format: { alpha: !1, mode: "rgb", notation: "object", type: e },
  stringifier: wl(e)
}, { format: { alpha: !0, mode: "rgb", notation: "object", type: e }, stringifier: xl(e) }], [])];

function qn(t) {
  return yl.reduce((e, i) => e || (nl(i.format, t) ? i.stringifier : null), null);
}

const et = P("apl");

class Pl {
  constructor(e, i) {
    this.onValueChange_ = this.onValueChange_.bind(this), this.value = i.value, this.value.emitter.on("change", this.onValueChange_), this.element = e.createElement("div"), this.element.classList.add(et()), i.viewProps.bindClassModifiers(this.element), i.viewProps.bindTabIndex(this.element);
    const s = e.createElement("div");
    s.classList.add(et("b")), this.element.appendChild(s);
    const n = e.createElement("div");
    n.classList.add(et("c")), s.appendChild(n), this.colorElem_ = n;
    const r = e.createElement("div");
    r.classList.add(et("m")), this.element.appendChild(r), this.markerElem_ = r;
    const o = e.createElement("div");
    o.classList.add(et("p")), this.markerElem_.appendChild(o), this.previewElem_ = o, this.update_();
  }
  
  update_() {
    const e = this.value.rawValue, i = e.getComponents("rgb"), s = new M([i[0], i[1], i[2], 0], "rgb"),
      n = new M([i[0], i[1], i[2], 255], "rgb"), r = ["to right", Rt(s), Rt(n)];
    this.colorElem_.style.background = `linear-gradient(${r.join(",")})`, this.previewElem_.style.backgroundColor = Rt(e);
    const o = T(i[3], 0, 1, 0, 100);
    this.markerElem_.style.left = `${o}%`;
  }
  
  onValueChange_() {
    this.update_();
  }
}

class Cl {
  constructor(e, i) {
    this.onKeyDown_ = this.onKeyDown_.bind(this), this.onKeyUp_ = this.onKeyUp_.bind(this), this.onPointerDown_ = this.onPointerDown_.bind(this), this.onPointerMove_ = this.onPointerMove_.bind(this), this.onPointerUp_ = this.onPointerUp_.bind(this), this.value = i.value, this.viewProps = i.viewProps, this.view = new Pl(e, {
      value: this.value,
      viewProps: this.viewProps
    }), this.ptHandler_ = new Le(this.view.element), this.ptHandler_.emitter.on("down", this.onPointerDown_), this.ptHandler_.emitter.on("move", this.onPointerMove_), this.ptHandler_.emitter.on("up", this.onPointerUp_), this.view.element.addEventListener("keydown", this.onKeyDown_), this.view.element.addEventListener("keyup", this.onKeyUp_);
  }
  
  handlePointerEvent_(e, i) {
    if (!e.point) return;
    const s = e.point.x / e.bounds.width, n = this.value.rawValue, [r, o, a] = n.getComponents("hsv");
    this.value.setRawValue(new M([r, o, a, s], "hsv"), i);
  }
  
  onPointerDown_(e) {
    this.handlePointerEvent_(e.data, { forceEmit: !1, last: !1 });
  }
  
  onPointerMove_(e) {
    this.handlePointerEvent_(e.data, { forceEmit: !1, last: !1 });
  }
  
  onPointerUp_(e) {
    this.handlePointerEvent_(e.data, { forceEmit: !0, last: !0 });
  }
  
  onKeyDown_(e) {
    const i = G(Ae(!0), ue(e));
    if (i === 0) return;
    const s = this.value.rawValue, [n, r, o, a] = s.getComponents("hsv");
    this.value.setRawValue(new M([n, r, o, a + i], "hsv"), { forceEmit: !1, last: !1 });
  }
  
  onKeyUp_(e) {
    G(Ae(!0), ue(e)) !== 0 && this.value.setRawValue(this.value.rawValue, { forceEmit: !0, last: !0 });
  }
}

const Oe = P("coltxt");

function El(t) {
  const e = t.createElement("select"),
    i = [{ text: "RGB", value: "rgb" }, { text: "HSL", value: "hsl" }, { text: "HSV", value: "hsv" }, {
      text: "HEX",
      value: "hex"
    }];
  return e.appendChild(i.reduce((s, n) => {
    const r = t.createElement("option");
    return r.textContent = n.text, r.value = n.value, s.appendChild(r), s;
  }, t.createDocumentFragment())), e;
}

class Sl {
  constructor(e, i) {
    this.element = e.createElement("div"), this.element.classList.add(Oe()), i.viewProps.bindClassModifiers(this.element);
    const s = e.createElement("div");
    s.classList.add(Oe("m")), this.modeElem_ = El(e), this.modeElem_.classList.add(Oe("ms")), s.appendChild(this.modeSelectElement), i.viewProps.bindDisabled(this.modeElem_);
    const n = e.createElement("div");
    n.classList.add(Oe("mm")), n.appendChild(Ht(e, "dropdown")), s.appendChild(n), this.element.appendChild(s);
    const r = e.createElement("div");
    r.classList.add(Oe("w")), this.element.appendChild(r), this.inputsElem_ = r, this.inputViews_ = i.inputViews, this.applyInputViews_(), ce(i.mode, o => {
      this.modeElem_.value = o;
    });
  }
  
  get modeSelectElement() {
    return this.modeElem_;
  }
  
  get inputViews() {
    return this.inputViews_;
  }
  
  set inputViews(e) {
    this.inputViews_ = e, this.applyInputViews_();
  }
  
  applyInputViews_() {
    pn(this.inputsElem_);
    const e = this.element.ownerDocument;
    this.inputViews_.forEach(i => {
      const s = e.createElement("div");
      s.classList.add(Oe("c")), s.appendChild(i.element), this.inputsElem_.appendChild(s);
    });
  }
}

function Ml(t) {
  return W(t === "float" ? 2 : 0);
}

function Tl(t, e, i) {
  const s = Ge(t, e)[i];
  return new pt({ min: 0, max: s });
}

function kl(t, e, i) {
  return new _t(t, {
    arrayPosition: i === 0 ? "fst" : i === 2 ? "lst" : "mid",
    parser: e.parser,
    props: _.fromObject({
      formatter: Ml(e.colorType),
      keyScale: Ae(!1),
      pointerScale: e.colorType === "float" ? .01 : 1
    }),
    value: D(0, { constraint: Tl(e.colorMode, e.colorType, i) }),
    viewProps: e.viewProps
  });
}

function Rl(t, e) {
  const i = { colorMode: e.colorMode, colorType: e.colorType, parser: he, viewProps: e.viewProps };
  return [0, 1, 2].map(s => {
    const n = kl(t, i, s);
    return Ye({
      primary: e.value, secondary: n.value, forward(r) {
        return N(r, e.colorType).getComponents(e.colorMode)[s];
      }, backward(r, o) {
        const a = e.colorMode, h = N(r, e.colorType).getComponents(a);
        h[s] = o;
        const c = zi(Gt(ne(h), h[3]), a, e.colorType);
        return N(c, "int");
      }
    }), n;
  });
}

function Al(t, e) {
  const i = new lt(t, {
    parser: xt("int"),
    props: _.fromObject({ formatter: Fi }),
    value: D(M.black()),
    viewProps: e.viewProps
  });
  return Ye({
    primary: e.value,
    secondary: i.value,
    forward: s => new M(ne(s.getComponents()), s.mode),
    backward: (s, n) => new M(Gt(ne(n.getComponents(s.mode)), s.getComponents()[3]), s.mode)
  }), [i];
}

function Dl(t) {
  return t !== "hex";
}

class Ll {
  constructor(e, i) {
    this.onModeSelectChange_ = this.onModeSelectChange_.bind(this), this.colorType_ = i.colorType, this.value = i.value, this.viewProps = i.viewProps, this.colorMode = D(this.value.rawValue.mode), this.ccs_ = this.createComponentControllers_(e), this.view = new Sl(e, {
      mode: this.colorMode,
      inputViews: [this.ccs_[0].view, this.ccs_[1].view, this.ccs_[2].view],
      viewProps: this.viewProps
    }), this.view.modeSelectElement.addEventListener("change", this.onModeSelectChange_);
  }
  
  createComponentControllers_(e) {
    const i = this.colorMode.rawValue;
    return Dl(i) ? Rl(e, {
      colorMode: i,
      colorType: this.colorType_,
      value: this.value,
      viewProps: this.viewProps
    }) : Al(e, { value: this.value, viewProps: this.viewProps });
  }
  
  onModeSelectChange_(e) {
    const i = e.currentTarget;
    this.colorMode.rawValue = i.value, this.ccs_ = this.createComponentControllers_(this.view.element.ownerDocument), this.view.inputViews = this.ccs_.map(s => s.view);
  }
}

const ii = P("hpl");

class Bl {
  constructor(e, i) {
    this.onValueChange_ = this.onValueChange_.bind(this), this.value = i.value, this.value.emitter.on("change", this.onValueChange_), this.element = e.createElement("div"), this.element.classList.add(ii()), i.viewProps.bindClassModifiers(this.element), i.viewProps.bindTabIndex(this.element);
    const s = e.createElement("div");
    s.classList.add(ii("c")), this.element.appendChild(s);
    const n = e.createElement("div");
    n.classList.add(ii("m")), this.element.appendChild(n), this.markerElem_ = n, this.update_();
  }
  
  update_() {
    const e = this.value.rawValue, [i] = e.getComponents("hsv");
    this.markerElem_.style.backgroundColor = Gn(new M([i, 100, 100], "hsv"));
    const s = T(i, 0, 360, 0, 100);
    this.markerElem_.style.left = `${s}%`;
  }
  
  onValueChange_() {
    this.update_();
  }
}

class Vl {
  constructor(e, i) {
    this.onKeyDown_ = this.onKeyDown_.bind(this), this.onKeyUp_ = this.onKeyUp_.bind(this), this.onPointerDown_ = this.onPointerDown_.bind(this), this.onPointerMove_ = this.onPointerMove_.bind(this), this.onPointerUp_ = this.onPointerUp_.bind(this), this.value = i.value, this.viewProps = i.viewProps, this.view = new Bl(e, {
      value: this.value,
      viewProps: this.viewProps
    }), this.ptHandler_ = new Le(this.view.element), this.ptHandler_.emitter.on("down", this.onPointerDown_), this.ptHandler_.emitter.on("move", this.onPointerMove_), this.ptHandler_.emitter.on("up", this.onPointerUp_), this.view.element.addEventListener("keydown", this.onKeyDown_), this.view.element.addEventListener("keyup", this.onKeyUp_);
  }
  
  handlePointerEvent_(e, i) {
    if (!e.point) return;
    const s = T(I(e.point.x, 0, e.bounds.width), 0, e.bounds.width, 0, 360),
      n = this.value.rawValue, [, r, o, a] = n.getComponents("hsv");
    this.value.setRawValue(new M([s, r, o, a], "hsv"), i);
  }
  
  onPointerDown_(e) {
    this.handlePointerEvent_(e.data, { forceEmit: !1, last: !1 });
  }
  
  onPointerMove_(e) {
    this.handlePointerEvent_(e.data, { forceEmit: !1, last: !1 });
  }
  
  onPointerUp_(e) {
    this.handlePointerEvent_(e.data, { forceEmit: !0, last: !0 });
  }
  
  onKeyDown_(e) {
    const i = G(Ae(!1), ue(e));
    if (i === 0) return;
    const s = this.value.rawValue, [n, r, o, a] = s.getComponents("hsv");
    this.value.setRawValue(new M([n + i, r, o, a], "hsv"), { forceEmit: !1, last: !1 });
  }
  
  onKeyUp_(e) {
    G(Ae(!1), ue(e)) !== 0 && this.value.setRawValue(this.value.rawValue, { forceEmit: !0, last: !0 });
  }
}

const si = P("svp"), _s = 64;

class Ol {
  constructor(e, i) {
    this.onValueChange_ = this.onValueChange_.bind(this), this.value = i.value, this.value.emitter.on("change", this.onValueChange_), this.element = e.createElement("div"), this.element.classList.add(si()), i.viewProps.bindClassModifiers(this.element), i.viewProps.bindTabIndex(this.element);
    const s = e.createElement("canvas");
    s.height = _s, s.width = _s, s.classList.add(si("c")), this.element.appendChild(s), this.canvasElement = s;
    const n = e.createElement("div");
    n.classList.add(si("m")), this.element.appendChild(n), this.markerElem_ = n, this.update_();
  }
  
  update_() {
    const e = Vo(this.canvasElement);
    if (!e) return;
    const s = this.value.rawValue.getComponents("hsv"), n = this.canvasElement.width, r = this.canvasElement.height,
      o = e.getImageData(0, 0, n, r), a = o.data;
    for (let c = 0; c < r; c++) for (let u = 0; u < n; u++) {
      const p = T(u, 0, n, 0, 100), d = T(c, 0, r, 100, 0), f = Rn(s[0], p, d), m = (c * n + u) * 4;
      a[m] = f[0], a[m + 1] = f[1], a[m + 2] = f[2], a[m + 3] = 255;
    }
    e.putImageData(o, 0, 0);
    const l = T(s[1], 0, 100, 0, 100);
    this.markerElem_.style.left = `${l}%`;
    const h = T(s[2], 0, 100, 100, 0);
    this.markerElem_.style.top = `${h}%`;
  }
  
  onValueChange_() {
    this.update_();
  }
}

class Ul {
  constructor(e, i) {
    this.onKeyDown_ = this.onKeyDown_.bind(this), this.onKeyUp_ = this.onKeyUp_.bind(this), this.onPointerDown_ = this.onPointerDown_.bind(this), this.onPointerMove_ = this.onPointerMove_.bind(this), this.onPointerUp_ = this.onPointerUp_.bind(this), this.value = i.value, this.viewProps = i.viewProps, this.view = new Ol(e, {
      value: this.value,
      viewProps: this.viewProps
    }), this.ptHandler_ = new Le(this.view.element), this.ptHandler_.emitter.on("down", this.onPointerDown_), this.ptHandler_.emitter.on("move", this.onPointerMove_), this.ptHandler_.emitter.on("up", this.onPointerUp_), this.view.element.addEventListener("keydown", this.onKeyDown_), this.view.element.addEventListener("keyup", this.onKeyUp_);
  }
  
  handlePointerEvent_(e, i) {
    if (!e.point) return;
    const s = T(e.point.x, 0, e.bounds.width, 0, 100),
      n = T(e.point.y, 0, e.bounds.height, 100, 0), [r, , , o] = this.value.rawValue.getComponents("hsv");
    this.value.setRawValue(new M([r, s, n, o], "hsv"), i);
  }
  
  onPointerDown_(e) {
    this.handlePointerEvent_(e.data, { forceEmit: !1, last: !1 });
  }
  
  onPointerMove_(e) {
    this.handlePointerEvent_(e.data, { forceEmit: !1, last: !1 });
  }
  
  onPointerUp_(e) {
    this.handlePointerEvent_(e.data, { forceEmit: !0, last: !0 });
  }
  
  onKeyDown_(e) {
    Sn(e.key) && e.preventDefault();
    const [i, s, n, r] = this.value.rawValue.getComponents("hsv"), o = Ae(!1), a = G(o, ue(e)), l = G(o, ct(e));
    a === 0 && l === 0 || this.value.setRawValue(new M([i, s + a, n + l, r], "hsv"), { forceEmit: !1, last: !1 });
  }
  
  onKeyUp_(e) {
    const i = Ae(!1), s = G(i, ue(e)), n = G(i, ct(e));
    s === 0 && n === 0 || this.value.setRawValue(this.value.rawValue, { forceEmit: !0, last: !0 });
  }
}

class Il {
  constructor(e, i) {
    this.value = i.value, this.viewProps = i.viewProps, this.hPaletteC_ = new Vl(e, {
      value: this.value,
      viewProps: this.viewProps
    }), this.svPaletteC_ = new Ul(e, {
      value: this.value,
      viewProps: this.viewProps
    }), this.alphaIcs_ = i.supportsAlpha ? {
      palette: new Cl(e, { value: this.value, viewProps: this.viewProps }),
      text: new _t(e, {
        parser: he,
        props: _.fromObject({ pointerScale: .01, keyScale: .1, formatter: W(2) }),
        value: D(0, { constraint: new pt({ min: 0, max: 1 }) }),
        viewProps: this.viewProps
      })
    } : null, this.alphaIcs_ && Ye({
      primary: this.value,
      secondary: this.alphaIcs_.text.value,
      forward: s => s.getComponents()[3],
      backward: (s, n) => {
        const r = s.getComponents();
        return r[3] = n, new M(r, s.mode);
      }
    }), this.textsC_ = new Ll(e, {
      colorType: i.colorType,
      value: this.value,
      viewProps: this.viewProps
    }), this.view = new Za(e, {
      alphaViews: this.alphaIcs_ ? {
        palette: this.alphaIcs_.palette.view,
        text: this.alphaIcs_.text.view
      } : null,
      hPaletteView: this.hPaletteC_.view,
      supportsAlpha: i.supportsAlpha,
      svPaletteView: this.svPaletteC_.view,
      textsView: this.textsC_.view,
      viewProps: this.viewProps
    });
  }
  
  get textsController() {
    return this.textsC_;
  }
}

const ni = P("colsw");

class zl {
  constructor(e, i) {
    this.onValueChange_ = this.onValueChange_.bind(this), i.value.emitter.on("change", this.onValueChange_), this.value = i.value, this.element = e.createElement("div"), this.element.classList.add(ni()), i.viewProps.bindClassModifiers(this.element);
    const s = e.createElement("div");
    s.classList.add(ni("sw")), this.element.appendChild(s), this.swatchElem_ = s;
    const n = e.createElement("button");
    n.classList.add(ni("b")), i.viewProps.bindDisabled(n), this.element.appendChild(n), this.buttonElement = n, this.update_();
  }
  
  update_() {
    const e = this.value.rawValue;
    this.swatchElem_.style.backgroundColor = Ni(e);
  }
  
  onValueChange_() {
    this.update_();
  }
}

class Fl {
  constructor(e, i) {
    this.value = i.value, this.viewProps = i.viewProps, this.view = new zl(e, {
      value: this.value,
      viewProps: this.viewProps
    });
  }
}

class Hi {
  constructor(e, i) {
    this.onButtonBlur_ = this.onButtonBlur_.bind(this), this.onButtonClick_ = this.onButtonClick_.bind(this), this.onPopupChildBlur_ = this.onPopupChildBlur_.bind(this), this.onPopupChildKeydown_ = this.onPopupChildKeydown_.bind(this), this.value = i.value, this.viewProps = i.viewProps, this.foldable_ = vt.create(i.expanded), this.swatchC_ = new Fl(e, {
      value: this.value,
      viewProps: this.viewProps
    });
    const s = this.swatchC_.view.buttonElement;
    s.addEventListener("blur", this.onButtonBlur_), s.addEventListener("click", this.onButtonClick_), this.textC_ = new lt(e, {
      parser: i.parser,
      props: _.fromObject({ formatter: i.formatter }),
      value: this.value,
      viewProps: this.viewProps
    }), this.view = new ja(e, {
      foldable: this.foldable_,
      pickerLayout: i.pickerLayout
    }), this.view.swatchElement.appendChild(this.swatchC_.view.element), this.view.textElement.appendChild(this.textC_.view.element), this.popC_ = i.pickerLayout === "popup" ? new Pn(e, { viewProps: this.viewProps }) : null;
    const n = new Il(e, {
      colorType: i.colorType,
      supportsAlpha: i.supportsAlpha,
      value: this.value,
      viewProps: this.viewProps
    });
    n.view.allFocusableElements.forEach(r => {
      r.addEventListener("blur", this.onPopupChildBlur_), r.addEventListener("keydown", this.onPopupChildKeydown_);
    }), this.pickerC_ = n, this.popC_ ? (this.view.element.appendChild(this.popC_.view.element), this.popC_.view.element.appendChild(n.view.element), Ye({
      primary: this.foldable_.value("expanded"),
      secondary: this.popC_.shows,
      forward: r => r,
      backward: (r, o) => o
    })) : this.view.pickerElement && (this.view.pickerElement.appendChild(this.pickerC_.view.element), Li(this.foldable_, this.view.pickerElement));
  }
  
  get textController() {
    return this.textC_;
  }
  
  onButtonBlur_(e) {
    if (!this.popC_) return;
    const i = this.view.element, s = e.relatedTarget;
    (!s || !i.contains(s)) && (this.popC_.shows.rawValue = !1);
  }
  
  onButtonClick_() {
    this.foldable_.set("expanded", !this.foldable_.get("expanded")), this.foldable_.get("expanded") && this.pickerC_.view.allFocusableElements[0].focus();
  }
  
  onPopupChildBlur_(e) {
    if (!this.popC_) return;
    const i = this.popC_.view.element, s = mn(e);
    s && i.contains(s) || s && s === this.swatchC_.view.buttonElement && !Mi(i.ownerDocument) || (this.popC_.shows.rawValue = !1);
  }
  
  onPopupChildKeydown_(e) {
    this.popC_ ? e.key === "Escape" && (this.popC_.shows.rawValue = !1) : this.view.pickerElement && e.key === "Escape" && this.swatchC_.view.buttonElement.focus();
  }
}

function Nl(t) {
  return ne(t.getComponents("rgb")).reduce((e, i) => e << 8 | Math.floor(i) & 255, 0);
}

function Hl(t) {
  return t.getComponents("rgb").reduce((e, i, s) => {
    const n = Math.floor(s === 3 ? i * 255 : i) & 255;
    return e << 8 | n;
  }, 0) >>> 0;
}

function jl(t) {
  return new M([t >> 16 & 255, t >> 8 & 255, t & 255], "rgb");
}

function Gl(t) {
  return new M([t >> 24 & 255, t >> 16 & 255, t >> 8 & 255, T(t & 255, 0, 255, 0, 1)], "rgb");
}

function Wl(t) {
  return typeof t != "number" ? M.black() : jl(t);
}

function Kl(t) {
  return typeof t != "number" ? M.black() : Gl(t);
}

function At(t, e) {
  return typeof t != "object" || R(t) ? !1 : e in t && typeof t[e] == "number";
}

function $n(t) {
  return At(t, "r") && At(t, "g") && At(t, "b");
}

function Yn(t) {
  return $n(t) && At(t, "a");
}

function Xn(t) {
  return $n(t);
}

function ji(t, e) {
  if (t.mode !== e.mode || t.type !== e.type) return !1;
  const i = t.getComponents(), s = e.getComponents();
  for (let n = 0; n < i.length; n++) if (i[n] !== s[n]) return !1;
  return !0;
}

function ws(t) {
  return "a" in t ? [t.r, t.g, t.b, t.a] : [t.r, t.g, t.b];
}

function ql(t) {
  const e = qn(t);
  return e ? (i, s) => {
    wt(i, e(s));
  } : null;
}

function $l(t) {
  const e = t ? Hl : Nl;
  return (i, s) => {
    wt(i, e(s));
  };
}

function Yl(t, e, i) {
  const n = N(e, i).toRgbaObject();
  t.writeProperty("r", n.r), t.writeProperty("g", n.g), t.writeProperty("b", n.b), t.writeProperty("a", n.a);
}

function Xl(t, e, i) {
  const n = N(e, i).toRgbaObject();
  t.writeProperty("r", n.r), t.writeProperty("g", n.g), t.writeProperty("b", n.b);
}

function Zl(t, e) {
  return (i, s) => {
    t ? Yl(i, s, e) : Xl(i, s, e);
  };
}

function Ql(t) {
  var e;
  return !!(!((e = t == null ? void 0 : t.color) === null || e === void 0) && e.alpha);
}

function Jl(t) {
  return t ? e => Ni(e, "0x") : e => Fi(e, "0x");
}

function ec(t) {
  return "color" in t || t.view === "color";
}

const tc = H({
  id: "input-color-number",
  type: "input",
  accept: (t, e) => {
    if (typeof t != "number" || !ec(e)) return null;
    const i = Ui(e);
    return i ? { initialValue: t, params: Object.assign(Object.assign({}, i), { supportsAlpha: Ql(e) }) } : null;
  },
  binding: { reader: t => t.params.supportsAlpha ? Kl : Wl, equals: ji, writer: t => $l(t.params.supportsAlpha) },
  controller: t => {
    var e, i;
    return new Hi(t.document, {
      colorType: "int",
      expanded: (e = t.params.expanded) !== null && e !== void 0 ? e : !1,
      formatter: Jl(t.params.supportsAlpha),
      parser: xt("int"),
      pickerLayout: (i = t.params.picker) !== null && i !== void 0 ? i : "popup",
      supportsAlpha: t.params.supportsAlpha,
      value: t.value,
      viewProps: t.viewProps
    });
  }
});

function ic(t, e) {
  if (!Xn(t)) return N(M.black(), e);
  if (e === "int") {
    const i = ws(t);
    return new M(i, "rgb");
  }
  if (e === "float") {
    const i = ws(t);
    return new Ii(i, "rgb");
  }
  return N(M.black(), "int");
}

function sc(t) {
  return Yn(t);
}

function nc(t) {
  return e => {
    const i = ic(e, t);
    return N(i, "int");
  };
}

function rc(t, e) {
  return i => t ? Kn(i, e) : Wn(i, e);
}

const oc = H({
  id: "input-color-object",
  type: "input",
  accept: (t, e) => {
    var i;
    if (!Xn(t)) return null;
    const s = Ui(e);
    return s ? {
      initialValue: t,
      params: Object.assign(Object.assign({}, s), { colorType: (i = Ln(e)) !== null && i !== void 0 ? i : "int" })
    } : null;
  },
  binding: { reader: t => nc(t.params.colorType), equals: ji, writer: t => Zl(sc(t.initialValue), t.params.colorType) },
  controller: t => {
    var e, i;
    const s = Yn(t.initialValue);
    return new Hi(t.document, {
      colorType: t.params.colorType,
      expanded: (e = t.params.expanded) !== null && e !== void 0 ? e : !1,
      formatter: rc(s, t.params.colorType),
      parser: xt("int"),
      pickerLayout: (i = t.params.picker) !== null && i !== void 0 ? i : "popup",
      supportsAlpha: s,
      value: t.value,
      viewProps: t.viewProps
    });
  }
}), ac = H({
  id: "input-color-string", type: "input", accept: (t, e) => {
    if (typeof t != "string" || e.view === "text") return null;
    const i = fl(t, Ln(e));
    if (!i) return null;
    const s = qn(i);
    if (!s) return null;
    const n = Ui(e);
    return n ? { initialValue: t, params: Object.assign(Object.assign({}, n), { format: i, stringifier: s }) } : null;
  }, binding: {
    reader: () => bl, equals: ji, writer: t => {
      const e = ql(t.params.format);
      if (!e) throw V.notBindable();
      return e;
    }
  }, controller: t => {
    var e, i;
    return new Hi(t.document, {
      colorType: t.params.format.type,
      expanded: (e = t.params.expanded) !== null && e !== void 0 ? e : !1,
      formatter: t.params.stringifier,
      parser: xt("int"),
      pickerLayout: (i = t.params.picker) !== null && i !== void 0 ? i : "popup",
      supportsAlpha: t.params.format.alpha,
      value: t.value,
      viewProps: t.viewProps
    });
  }
});

class Gi {
  constructor(e) {
    this.components = e.components, this.asm_ = e.assembly;
  }
  
  constrain(e) {
    const i = this.asm_.toComponents(e).map((s, n) => {
      var r, o;
      return (o = (r = this.components[n]) === null || r === void 0 ? void 0 : r.constrain(s)) !== null && o !== void 0 ? o : s;
    });
    return this.asm_.fromComponents(i);
  }
}

const xs = P("pndtxt");

class lc {
  constructor(e, i) {
    this.textViews = i.textViews, this.element = e.createElement("div"), this.element.classList.add(xs()), this.textViews.forEach(s => {
      const n = e.createElement("div");
      n.classList.add(xs("a")), n.appendChild(s.element), this.element.appendChild(n);
    });
  }
}

function cc(t, e, i) {
  return new _t(t, {
    arrayPosition: i === 0 ? "fst" : i === e.axes.length - 1 ? "lst" : "mid",
    parser: e.parser,
    props: e.axes[i].textProps,
    value: D(0, { constraint: e.axes[i].constraint }),
    viewProps: e.viewProps
  });
}

class Wi {
  constructor(e, i) {
    this.value = i.value, this.viewProps = i.viewProps, this.acs_ = i.axes.map((s, n) => cc(e, i, n)), this.acs_.forEach((s, n) => {
      Ye({
        primary: this.value, secondary: s.value, forward: r => i.assembly.toComponents(r)[n], backward: (r, o) => {
          const a = i.assembly.toComponents(r);
          return a[n] = o, i.assembly.fromComponents(a);
        }
      });
    }), this.view = new lc(e, { textViews: this.acs_.map(s => s.view) });
  }
  
  get textControllers() {
    return this.acs_;
  }
}

class hc extends at {
  get max() {
    return this.controller.valueController.sliderController.props.get("max");
  }
  
  set max(e) {
    this.controller.valueController.sliderController.props.set("max", e);
  }
  
  get min() {
    return this.controller.valueController.sliderController.props.get("min");
  }
  
  set min(e) {
    this.controller.valueController.sliderController.props.set("min", e);
  }
}

function uc(t, e) {
  const i = [], s = an(t, e);
  s && i.push(s);
  const n = ln(t);
  n && i.push(n);
  const r = Oi(t.options);
  return r && i.push(r), new ft(i);
}

const dc = H({
  id: "input-number", type: "input", accept: (t, e) => {
    if (typeof t != "number") return null;
    const i = L(e, s => Object.assign(Object.assign({}, hn(s)), {
      options: s.optional.custom(gt),
      readonly: s.optional.constant(!1)
    }));
    return i ? { initialValue: t, params: i } : null;
  }, binding: { reader: t => sn, constraint: t => uc(t.params, t.initialValue), writer: t => wt }, controller: t => {
    const e = t.value, i = t.constraint, s = i && Vt(i, bt);
    if (s) return new Pe(t.document, {
      props: new _({ options: s.values.value("options") }),
      value: e,
      viewProps: t.viewProps
    });
    const n = cn(t.params, e.rawValue), r = i && Vt(i, pt);
    return r ? new Ut(t.document, Object.assign(Object.assign({}, Mn(Object.assign(Object.assign({}, n), {
      keyScale: D(n.keyScale),
      max: r.values.value("max"),
      min: r.values.value("min")
    }))), { parser: he, value: e, viewProps: t.viewProps })) : new _t(t.document, {
      parser: he,
      props: _.fromObject(n),
      value: e,
      viewProps: t.viewProps
    });
  }, api(t) {
    return typeof t.controller.value.rawValue != "number" ? null : t.controller.valueController instanceof Ut ? new hc(t.controller) : t.controller.valueController instanceof Pe ? new Bi(t.controller) : null;
  }
});

class ye {
  constructor(e = 0, i = 0) {
    this.x = e, this.y = i;
  }
  
  getComponents() {
    return [this.x, this.y];
  }
  
  static isObject(e) {
    if (R(e)) return !1;
    const i = e.x, s = e.y;
    return !(typeof i != "number" || typeof s != "number");
  }
  
  static equals(e, i) {
    return e.x === i.x && e.y === i.y;
  }
  
  toObject() {
    return { x: this.x, y: this.y };
  }
}

const Zn = { toComponents: t => t.getComponents(), fromComponents: t => new ye(...t) }, Ue = P("p2d");

class pc {
  constructor(e, i) {
    this.element = e.createElement("div"), this.element.classList.add(Ue()), i.viewProps.bindClassModifiers(this.element), ce(i.expanded, Ke(this.element, Ue(void 0, "expanded")));
    const s = e.createElement("div");
    s.classList.add(Ue("h")), this.element.appendChild(s);
    const n = e.createElement("button");
    n.classList.add(Ue("b")), n.appendChild(Ht(e, "p2dpad")), i.viewProps.bindDisabled(n), s.appendChild(n), this.buttonElement = n;
    const r = e.createElement("div");
    if (r.classList.add(Ue("t")), s.appendChild(r), this.textElement = r, i.pickerLayout === "inline") {
      const o = e.createElement("div");
      o.classList.add(Ue("p")), this.element.appendChild(o), this.pickerElement = o;
    } else this.pickerElement = null;
  }
}

const ve = P("p2dp");

class mc {
  constructor(e, i) {
    this.onFoldableChange_ = this.onFoldableChange_.bind(this), this.onPropsChange_ = this.onPropsChange_.bind(this), this.onValueChange_ = this.onValueChange_.bind(this), this.props_ = i.props, this.props_.emitter.on("change", this.onPropsChange_), this.element = e.createElement("div"), this.element.classList.add(ve()), i.layout === "popup" && this.element.classList.add(ve(void 0, "p")), i.viewProps.bindClassModifiers(this.element);
    const s = e.createElement("div");
    s.classList.add(ve("p")), i.viewProps.bindTabIndex(s), this.element.appendChild(s), this.padElement = s;
    const n = e.createElementNS(ee, "svg");
    n.classList.add(ve("g")), this.padElement.appendChild(n), this.svgElem_ = n;
    const r = e.createElementNS(ee, "line");
    r.classList.add(ve("ax")), r.setAttributeNS(null, "x1", "0"), r.setAttributeNS(null, "y1", "50%"), r.setAttributeNS(null, "x2", "100%"), r.setAttributeNS(null, "y2", "50%"), this.svgElem_.appendChild(r);
    const o = e.createElementNS(ee, "line");
    o.classList.add(ve("ax")), o.setAttributeNS(null, "x1", "50%"), o.setAttributeNS(null, "y1", "0"), o.setAttributeNS(null, "x2", "50%"), o.setAttributeNS(null, "y2", "100%"), this.svgElem_.appendChild(o);
    const a = e.createElementNS(ee, "line");
    a.classList.add(ve("l")), a.setAttributeNS(null, "x1", "50%"), a.setAttributeNS(null, "y1", "50%"), this.svgElem_.appendChild(a), this.lineElem_ = a;
    const l = e.createElement("div");
    l.classList.add(ve("m")), this.padElement.appendChild(l), this.markerElem_ = l, i.value.emitter.on("change", this.onValueChange_), this.value = i.value, this.update_();
  }
  
  get allFocusableElements() {
    return [this.padElement];
  }
  
  update_() {
    const [e, i] = this.value.rawValue.getComponents(), s = this.props_.get("max"), n = T(e, -s, +s, 0, 100),
      r = T(i, -s, +s, 0, 100), o = this.props_.get("invertsY") ? 100 - r : r;
    this.lineElem_.setAttributeNS(null, "x2", `${n}%`), this.lineElem_.setAttributeNS(null, "y2", `${o}%`), this.markerElem_.style.left = `${n}%`, this.markerElem_.style.top = `${o}%`;
  }
  
  onValueChange_() {
    this.update_();
  }
  
  onPropsChange_() {
    this.update_();
  }
  
  onFoldableChange_() {
    this.update_();
  }
}

function ys(t, e, i) {
  return [G(e[0], ue(t)), G(e[1], ct(t)) * (i ? 1 : -1)];
}

class vc {
  constructor(e, i) {
    this.onPadKeyDown_ = this.onPadKeyDown_.bind(this), this.onPadKeyUp_ = this.onPadKeyUp_.bind(this), this.onPointerDown_ = this.onPointerDown_.bind(this), this.onPointerMove_ = this.onPointerMove_.bind(this), this.onPointerUp_ = this.onPointerUp_.bind(this), this.props = i.props, this.value = i.value, this.viewProps = i.viewProps, this.view = new mc(e, {
      layout: i.layout,
      props: this.props,
      value: this.value,
      viewProps: this.viewProps
    }), this.ptHandler_ = new Le(this.view.padElement), this.ptHandler_.emitter.on("down", this.onPointerDown_), this.ptHandler_.emitter.on("move", this.onPointerMove_), this.ptHandler_.emitter.on("up", this.onPointerUp_), this.view.padElement.addEventListener("keydown", this.onPadKeyDown_), this.view.padElement.addEventListener("keyup", this.onPadKeyUp_);
  }
  
  handlePointerEvent_(e, i) {
    if (!e.point) return;
    const s = this.props.get("max"), n = T(e.point.x, 0, e.bounds.width, -s, +s),
      r = T(this.props.get("invertsY") ? e.bounds.height - e.point.y : e.point.y, 0, e.bounds.height, -s, +s);
    this.value.setRawValue(new ye(n, r), i);
  }
  
  onPointerDown_(e) {
    this.handlePointerEvent_(e.data, { forceEmit: !1, last: !1 });
  }
  
  onPointerMove_(e) {
    this.handlePointerEvent_(e.data, { forceEmit: !1, last: !1 });
  }
  
  onPointerUp_(e) {
    this.handlePointerEvent_(e.data, { forceEmit: !0, last: !0 });
  }
  
  onPadKeyDown_(e) {
    Sn(e.key) && e.preventDefault();
    const [i, s] = ys(e, [this.props.get("xKeyScale"), this.props.get("yKeyScale")], this.props.get("invertsY"));
    i === 0 && s === 0 || this.value.setRawValue(new ye(this.value.rawValue.x + i, this.value.rawValue.y + s), {
      forceEmit: !1,
      last: !1
    });
  }
  
  onPadKeyUp_(e) {
    const [i, s] = ys(e, [this.props.get("xKeyScale"), this.props.get("yKeyScale")], this.props.get("invertsY"));
    i === 0 && s === 0 || this.value.setRawValue(this.value.rawValue, { forceEmit: !0, last: !0 });
  }
}

class fc {
  constructor(e, i) {
    var s, n;
    this.onPopupChildBlur_ = this.onPopupChildBlur_.bind(this), this.onPopupChildKeydown_ = this.onPopupChildKeydown_.bind(this), this.onPadButtonBlur_ = this.onPadButtonBlur_.bind(this), this.onPadButtonClick_ = this.onPadButtonClick_.bind(this), this.value = i.value, this.viewProps = i.viewProps, this.foldable_ = vt.create(i.expanded), this.popC_ = i.pickerLayout === "popup" ? new Pn(e, { viewProps: this.viewProps }) : null;
    const r = new vc(e, {
      layout: i.pickerLayout,
      props: new _({
        invertsY: D(i.invertsY),
        max: D(i.max),
        xKeyScale: i.axes[0].textProps.value("keyScale"),
        yKeyScale: i.axes[1].textProps.value("keyScale")
      }),
      value: this.value,
      viewProps: this.viewProps
    });
    r.view.allFocusableElements.forEach(o => {
      o.addEventListener("blur", this.onPopupChildBlur_), o.addEventListener("keydown", this.onPopupChildKeydown_);
    }), this.pickerC_ = r, this.textC_ = new Wi(e, {
      assembly: Zn,
      axes: i.axes,
      parser: i.parser,
      value: this.value,
      viewProps: this.viewProps
    }), this.view = new pc(e, {
      expanded: this.foldable_.value("expanded"),
      pickerLayout: i.pickerLayout,
      viewProps: this.viewProps
    }), this.view.textElement.appendChild(this.textC_.view.element), (s = this.view.buttonElement) === null || s === void 0 || s.addEventListener("blur", this.onPadButtonBlur_), (n = this.view.buttonElement) === null || n === void 0 || n.addEventListener("click", this.onPadButtonClick_), this.popC_ ? (this.view.element.appendChild(this.popC_.view.element), this.popC_.view.element.appendChild(this.pickerC_.view.element), Ye({
      primary: this.foldable_.value("expanded"),
      secondary: this.popC_.shows,
      forward: o => o,
      backward: (o, a) => a
    })) : this.view.pickerElement && (this.view.pickerElement.appendChild(this.pickerC_.view.element), Li(this.foldable_, this.view.pickerElement));
  }
  
  get textController() {
    return this.textC_;
  }
  
  onPadButtonBlur_(e) {
    if (!this.popC_) return;
    const i = this.view.element, s = e.relatedTarget;
    (!s || !i.contains(s)) && (this.popC_.shows.rawValue = !1);
  }
  
  onPadButtonClick_() {
    this.foldable_.set("expanded", !this.foldable_.get("expanded")), this.foldable_.get("expanded") && this.pickerC_.view.allFocusableElements[0].focus();
  }
  
  onPopupChildBlur_(e) {
    if (!this.popC_) return;
    const i = this.popC_.view.element, s = mn(e);
    s && i.contains(s) || s && s === this.view.buttonElement && !Mi(i.ownerDocument) || (this.popC_.shows.rawValue = !1);
  }
  
  onPopupChildKeydown_(e) {
    this.popC_ ? e.key === "Escape" && (this.popC_.shows.rawValue = !1) : this.view.pickerElement && e.key === "Escape" && this.view.buttonElement.focus();
  }
}

function bc(t) {
  return ye.isObject(t) ? new ye(t.x, t.y) : new ye;
}

function gc(t, e) {
  t.writeProperty("x", e.x), t.writeProperty("y", e.y);
}

function _c(t, e) {
  return new Gi({
    assembly: Zn,
    components: [le(Object.assign(Object.assign({}, t), t.x), e.x), le(Object.assign(Object.assign({}, t), t.y), e.y)]
  });
}

function Ps(t, e) {
  var i, s;
  if (!R(t.min) || !R(t.max)) return Math.max(Math.abs((i = t.min) !== null && i !== void 0 ? i : 0), Math.abs((s = t.max) !== null && s !== void 0 ? s : 0));
  const n = rn(t);
  return Math.max(Math.abs(n) * 10, Math.abs(e) * 10);
}

function wc(t, e) {
  var i, s;
  const n = Ps(ke(t, (i = t.x) !== null && i !== void 0 ? i : {}), e.x),
    r = Ps(ke(t, (s = t.y) !== null && s !== void 0 ? s : {}), e.y);
  return Math.max(n, r);
}

function xc(t) {
  if (!("y" in t)) return !1;
  const e = t.y;
  return e && "inverted" in e ? !!e.inverted : !1;
}

const yc = H({
  id: "input-point2d",
  type: "input",
  accept: (t, e) => {
    if (!ye.isObject(t)) return null;
    const i = L(e, s => Object.assign(Object.assign({}, ht(s)), {
      expanded: s.optional.boolean,
      picker: s.optional.custom(kn),
      readonly: s.optional.constant(!1),
      x: s.optional.custom(xe),
      y: s.optional.object(Object.assign(Object.assign({}, ht(s)), { inverted: s.optional.boolean }))
    }));
    return i ? { initialValue: t, params: i } : null;
  },
  binding: { reader: () => bc, constraint: t => _c(t.params, t.initialValue), equals: ye.equals, writer: () => gc },
  controller: t => {
    var e, i;
    const s = t.document, n = t.value, r = t.constraint, o = [t.params.x, t.params.y];
    return new fc(s, {
      axes: n.rawValue.getComponents().map((a, l) => {
        var h;
        return Si({
          constraint: r.components[l],
          initialValue: a,
          params: ke(t.params, (h = o[l]) !== null && h !== void 0 ? h : {})
        });
      }),
      expanded: (e = t.params.expanded) !== null && e !== void 0 ? e : !1,
      invertsY: xc(t.params),
      max: wc(t.params, n.rawValue),
      parser: he,
      pickerLayout: (i = t.params.picker) !== null && i !== void 0 ? i : "popup",
      value: n,
      viewProps: t.viewProps
    });
  }
});

class Fe {
  constructor(e = 0, i = 0, s = 0) {
    this.x = e, this.y = i, this.z = s;
  }
  
  getComponents() {
    return [this.x, this.y, this.z];
  }
  
  static isObject(e) {
    if (R(e)) return !1;
    const i = e.x, s = e.y, n = e.z;
    return !(typeof i != "number" || typeof s != "number" || typeof n != "number");
  }
  
  static equals(e, i) {
    return e.x === i.x && e.y === i.y && e.z === i.z;
  }
  
  toObject() {
    return { x: this.x, y: this.y, z: this.z };
  }
}

const Qn = { toComponents: t => t.getComponents(), fromComponents: t => new Fe(...t) };

function Pc(t) {
  return Fe.isObject(t) ? new Fe(t.x, t.y, t.z) : new Fe;
}

function Cc(t, e) {
  t.writeProperty("x", e.x), t.writeProperty("y", e.y), t.writeProperty("z", e.z);
}

function Ec(t, e) {
  return new Gi({
    assembly: Qn,
    components: [le(Object.assign(Object.assign({}, t), t.x), e.x), le(Object.assign(Object.assign({}, t), t.y), e.y), le(Object.assign(Object.assign({}, t), t.z), e.z)]
  });
}

const Sc = H({
  id: "input-point3d",
  type: "input",
  accept: (t, e) => {
    if (!Fe.isObject(t)) return null;
    const i = L(e, s => Object.assign(Object.assign({}, ht(s)), {
      readonly: s.optional.constant(!1),
      x: s.optional.custom(xe),
      y: s.optional.custom(xe),
      z: s.optional.custom(xe)
    }));
    return i ? { initialValue: t, params: i } : null;
  },
  binding: { reader: t => Pc, constraint: t => Ec(t.params, t.initialValue), equals: Fe.equals, writer: t => Cc },
  controller: t => {
    const e = t.value, i = t.constraint, s = [t.params.x, t.params.y, t.params.z];
    return new Wi(t.document, {
      assembly: Qn, axes: e.rawValue.getComponents().map((n, r) => {
        var o;
        return Si({
          constraint: i.components[r],
          initialValue: n,
          params: ke(t.params, (o = s[r]) !== null && o !== void 0 ? o : {})
        });
      }), parser: he, value: e, viewProps: t.viewProps
    });
  }
});

class Ne {
  constructor(e = 0, i = 0, s = 0, n = 0) {
    this.x = e, this.y = i, this.z = s, this.w = n;
  }
  
  getComponents() {
    return [this.x, this.y, this.z, this.w];
  }
  
  static isObject(e) {
    if (R(e)) return !1;
    const i = e.x, s = e.y, n = e.z, r = e.w;
    return !(typeof i != "number" || typeof s != "number" || typeof n != "number" || typeof r != "number");
  }
  
  static equals(e, i) {
    return e.x === i.x && e.y === i.y && e.z === i.z && e.w === i.w;
  }
  
  toObject() {
    return { x: this.x, y: this.y, z: this.z, w: this.w };
  }
}

const Jn = { toComponents: t => t.getComponents(), fromComponents: t => new Ne(...t) };

function Mc(t) {
  return Ne.isObject(t) ? new Ne(t.x, t.y, t.z, t.w) : new Ne;
}

function Tc(t, e) {
  t.writeProperty("x", e.x), t.writeProperty("y", e.y), t.writeProperty("z", e.z), t.writeProperty("w", e.w);
}

function kc(t, e) {
  return new Gi({
    assembly: Jn,
    components: [le(Object.assign(Object.assign({}, t), t.x), e.x), le(Object.assign(Object.assign({}, t), t.y), e.y), le(Object.assign(Object.assign({}, t), t.z), e.z), le(Object.assign(Object.assign({}, t), t.w), e.w)]
  });
}

const Rc = H({
  id: "input-point4d",
  type: "input",
  accept: (t, e) => {
    if (!Ne.isObject(t)) return null;
    const i = L(e, s => Object.assign(Object.assign({}, ht(s)), {
      readonly: s.optional.constant(!1),
      w: s.optional.custom(xe),
      x: s.optional.custom(xe),
      y: s.optional.custom(xe),
      z: s.optional.custom(xe)
    }));
    return i ? { initialValue: t, params: i } : null;
  },
  binding: { reader: t => Mc, constraint: t => kc(t.params, t.initialValue), equals: Ne.equals, writer: t => Tc },
  controller: t => {
    const e = t.value, i = t.constraint, s = [t.params.x, t.params.y, t.params.z, t.params.w];
    return new Wi(t.document, {
      assembly: Jn, axes: e.rawValue.getComponents().map((n, r) => {
        var o;
        return Si({
          constraint: i.components[r],
          initialValue: n,
          params: ke(t.params, (o = s[r]) !== null && o !== void 0 ? o : {})
        });
      }), parser: he, value: e, viewProps: t.viewProps
    });
  }
});

function Ac(t) {
  const e = [], i = Oi(t.options);
  return i && e.push(i), new ft(e);
}

const Dc = H({
  id: "input-string", type: "input", accept: (t, e) => {
    if (typeof t != "string") return null;
    const i = L(e, s => ({ readonly: s.optional.constant(!1), options: s.optional.custom(gt) }));
    return i ? { initialValue: t, params: i } : null;
  }, binding: { reader: t => En, constraint: t => Ac(t.params), writer: t => wt }, controller: t => {
    const e = t.document, i = t.value, s = t.constraint, n = s && Vt(s, bt);
    return n ? new Pe(e, {
      props: new _({ options: n.values.value("options") }),
      value: i,
      viewProps: t.viewProps
    }) : new lt(e, { parser: r => r, props: _.fromObject({ formatter: bi }), value: i, viewProps: t.viewProps });
  }, api(t) {
    return typeof t.controller.value.rawValue != "string" ? null : t.controller.valueController instanceof Pe ? new Bi(t.controller) : null;
  }
}), yt = { monitor: { defaultInterval: 200, defaultRows: 3 } }, Cs = P("mll");

class Lc {
  constructor(e, i) {
    this.onValueUpdate_ = this.onValueUpdate_.bind(this), this.formatter_ = i.formatter, this.element = e.createElement("div"), this.element.classList.add(Cs()), i.viewProps.bindClassModifiers(this.element);
    const s = e.createElement("textarea");
    s.classList.add(Cs("i")), s.style.height = `calc(var(${Tn("containerUnitSize")}) * ${i.rows})`, s.readOnly = !0, i.viewProps.bindDisabled(s), this.element.appendChild(s), this.textareaElem_ = s, i.value.emitter.on("change", this.onValueUpdate_), this.value = i.value, this.update_();
  }
  
  update_() {
    const e = this.textareaElem_, i = e.scrollTop === e.scrollHeight - e.clientHeight, s = [];
    this.value.rawValue.forEach(n => {
      n !== void 0 && s.push(this.formatter_(n));
    }), e.textContent = s.join(`
`), i && (e.scrollTop = e.scrollHeight);
  }
  
  onValueUpdate_() {
    this.update_();
  }
}

class Ki {
  constructor(e, i) {
    this.value = i.value, this.viewProps = i.viewProps, this.view = new Lc(e, {
      formatter: i.formatter,
      rows: i.rows,
      value: this.value,
      viewProps: this.viewProps
    });
  }
}

const Es = P("sgl");

class Bc {
  constructor(e, i) {
    this.onValueUpdate_ = this.onValueUpdate_.bind(this), this.formatter_ = i.formatter, this.element = e.createElement("div"), this.element.classList.add(Es()), i.viewProps.bindClassModifiers(this.element);
    const s = e.createElement("input");
    s.classList.add(Es("i")), s.readOnly = !0, s.type = "text", i.viewProps.bindDisabled(s), this.element.appendChild(s), this.inputElement = s, i.value.emitter.on("change", this.onValueUpdate_), this.value = i.value, this.update_();
  }
  
  update_() {
    const e = this.value.rawValue, i = e[e.length - 1];
    this.inputElement.value = i !== void 0 ? this.formatter_(i) : "";
  }
  
  onValueUpdate_() {
    this.update_();
  }
}

class qi {
  constructor(e, i) {
    this.value = i.value, this.viewProps = i.viewProps, this.view = new Bc(e, {
      formatter: i.formatter,
      value: this.value,
      viewProps: this.viewProps
    });
  }
}

const Vc = H({
  id: "monitor-bool", type: "monitor", accept: (t, e) => {
    if (typeof t != "boolean") return null;
    const i = L(e, s => ({ readonly: s.required.constant(!0), rows: s.optional.number }));
    return i ? { initialValue: t, params: i } : null;
  }, binding: { reader: t => Cn }, controller: t => {
    var e;
    return t.value.rawValue.length === 1 ? new qi(t.document, {
      formatter: bs,
      value: t.value,
      viewProps: t.viewProps
    }) : new Ki(t.document, {
      formatter: bs,
      rows: (e = t.params.rows) !== null && e !== void 0 ? e : yt.monitor.defaultRows,
      value: t.value,
      viewProps: t.viewProps
    });
  }
});

class Oc extends at {
  get max() {
    return this.controller.valueController.props.get("max");
  }
  
  set max(e) {
    this.controller.valueController.props.set("max", e);
  }
  
  get min() {
    return this.controller.valueController.props.get("min");
  }
  
  set min(e) {
    this.controller.valueController.props.set("min", e);
  }
}

const fe = P("grl");

class Uc {
  constructor(e, i) {
    this.onCursorChange_ = this.onCursorChange_.bind(this), this.onValueUpdate_ = this.onValueUpdate_.bind(this), this.element = e.createElement("div"), this.element.classList.add(fe()), i.viewProps.bindClassModifiers(this.element), this.formatter_ = i.formatter, this.props_ = i.props, this.cursor_ = i.cursor, this.cursor_.emitter.on("change", this.onCursorChange_);
    const s = e.createElementNS(ee, "svg");
    s.classList.add(fe("g")), s.style.height = `calc(var(${Tn("containerUnitSize")}) * ${i.rows})`, this.element.appendChild(s), this.svgElem_ = s;
    const n = e.createElementNS(ee, "polyline");
    this.svgElem_.appendChild(n), this.lineElem_ = n;
    const r = e.createElement("div");
    r.classList.add(fe("t"), P("tt")()), this.element.appendChild(r), this.tooltipElem_ = r, i.value.emitter.on("change", this.onValueUpdate_), this.value = i.value, this.update_();
  }
  
  get graphElement() {
    return this.svgElem_;
  }
  
  update_() {
    const { clientWidth: e, clientHeight: i } = this.element, s = this.value.rawValue.length - 1,
      n = this.props_.get("min"), r = this.props_.get("max"), o = [];
    this.value.rawValue.forEach((u, p) => {
      if (u === void 0) return;
      const d = T(p, 0, s, 0, e), f = T(u, n, r, i, 0);
      o.push([d, f].join(","));
    }), this.lineElem_.setAttributeNS(null, "points", o.join(" "));
    const a = this.tooltipElem_, l = this.value.rawValue[this.cursor_.rawValue];
    if (l === void 0) {
      a.classList.remove(fe("t", "a"));
      return;
    }
    const h = T(this.cursor_.rawValue, 0, s, 0, e), c = T(l, n, r, i, 0);
    a.style.left = `${h}px`, a.style.top = `${c}px`, a.textContent = `${this.formatter_(l)}`, a.classList.contains(fe("t", "a")) || (a.classList.add(fe("t", "a"), fe("t", "in")), Bt(a), a.classList.remove(fe("t", "in")));
  }
  
  onValueUpdate_() {
    this.update_();
  }
  
  onCursorChange_() {
    this.update_();
  }
}

class er {
  constructor(e, i) {
    if (this.onGraphMouseMove_ = this.onGraphMouseMove_.bind(this), this.onGraphMouseLeave_ = this.onGraphMouseLeave_.bind(this), this.onGraphPointerDown_ = this.onGraphPointerDown_.bind(this), this.onGraphPointerMove_ = this.onGraphPointerMove_.bind(this), this.onGraphPointerUp_ = this.onGraphPointerUp_.bind(this), this.props = i.props, this.value = i.value, this.viewProps = i.viewProps, this.cursor_ = D(-1), this.view = new Uc(e, {
      cursor: this.cursor_,
      formatter: i.formatter,
      rows: i.rows,
      props: this.props,
      value: this.value,
      viewProps: this.viewProps
    }), !Mi(e)) this.view.element.addEventListener("mousemove", this.onGraphMouseMove_), this.view.element.addEventListener("mouseleave", this.onGraphMouseLeave_); else {
      const s = new Le(this.view.element);
      s.emitter.on("down", this.onGraphPointerDown_), s.emitter.on("move", this.onGraphPointerMove_), s.emitter.on("up", this.onGraphPointerUp_);
    }
  }
  
  importProps(e) {
    return q(e, null, i => ({
      max: i.required.number,
      min: i.required.number
    }), i => (this.props.set("max", i.max), this.props.set("min", i.min), !0));
  }
  
  exportProps() {
    return $(null, { max: this.props.get("max"), min: this.props.get("min") });
  }
  
  onGraphMouseLeave_() {
    this.cursor_.rawValue = -1;
  }
  
  onGraphMouseMove_(e) {
    const { clientWidth: i } = this.view.element;
    this.cursor_.rawValue = Math.floor(T(e.offsetX, 0, i, 0, this.value.rawValue.length));
  }
  
  onGraphPointerDown_(e) {
    this.onGraphPointerMove_(e);
  }
  
  onGraphPointerMove_(e) {
    if (!e.data.point) {
      this.cursor_.rawValue = -1;
      return;
    }
    this.cursor_.rawValue = Math.floor(T(e.data.point.x, 0, e.data.bounds.width, 0, this.value.rawValue.length));
  }
  
  onGraphPointerUp_() {
    this.cursor_.rawValue = -1;
  }
}

function gi(t) {
  return R(t.format) ? W(2) : t.format;
}

function Ic(t) {
  var e;
  return t.value.rawValue.length === 1 ? new qi(t.document, {
    formatter: gi(t.params),
    value: t.value,
    viewProps: t.viewProps
  }) : new Ki(t.document, {
    formatter: gi(t.params),
    rows: (e = t.params.rows) !== null && e !== void 0 ? e : yt.monitor.defaultRows,
    value: t.value,
    viewProps: t.viewProps
  });
}

function zc(t) {
  var e, i, s;
  return new er(t.document, {
    formatter: gi(t.params),
    rows: (e = t.params.rows) !== null && e !== void 0 ? e : yt.monitor.defaultRows,
    props: _.fromObject({
      max: (i = t.params.max) !== null && i !== void 0 ? i : 100,
      min: (s = t.params.min) !== null && s !== void 0 ? s : 0
    }),
    value: t.value,
    viewProps: t.viewProps
  });
}

function Ss(t) {
  return t.view === "graph";
}

const Fc = H({
  id: "monitor-number",
  type: "monitor",
  accept: (t, e) => {
    if (typeof t != "number") return null;
    const i = L(e, s => ({
      format: s.optional.function,
      max: s.optional.number,
      min: s.optional.number,
      readonly: s.required.constant(!0),
      rows: s.optional.number,
      view: s.optional.string
    }));
    return i ? { initialValue: t, params: i } : null;
  },
  binding: { defaultBufferSize: t => Ss(t) ? 64 : 1, reader: t => sn },
  controller: t => Ss(t.params) ? zc(t) : Ic(t),
  api: t => t.controller.valueController instanceof er ? new Oc(t.controller) : null
}), Nc = H({
  id: "monitor-string", type: "monitor", accept: (t, e) => {
    if (typeof t != "string") return null;
    const i = L(e, s => ({
      multiline: s.optional.boolean,
      readonly: s.required.constant(!0),
      rows: s.optional.number
    }));
    return i ? { initialValue: t, params: i } : null;
  }, binding: { reader: t => En }, controller: t => {
    var e;
    const i = t.value;
    return i.rawValue.length > 1 || t.params.multiline ? new Ki(t.document, {
      formatter: bi,
      rows: (e = t.params.rows) !== null && e !== void 0 ? e : yt.monitor.defaultRows,
      value: i,
      viewProps: t.viewProps
    }) : new qi(t.document, { formatter: bi, value: i, viewProps: t.viewProps });
  }
});

class Hc {
  constructor() {
    this.map_ = new Map;
  }
  
  get(e) {
    var i;
    return (i = this.map_.get(e)) !== null && i !== void 0 ? i : null;
  }
  
  has(e) {
    return this.map_.has(e);
  }
  
  add(e, i) {
    return this.map_.set(e, i), e.viewProps.handleDispose(() => {
      this.map_.delete(e);
    }), i;
  }
}

class jc {
  constructor(e) {
    this.target = e.target, this.reader_ = e.reader, this.writer_ = e.writer;
  }
  
  read() {
    return this.reader_(this.target.read());
  }
  
  write(e) {
    this.writer_(this.target, e);
  }
  
  inject(e) {
    this.write(this.reader_(e));
  }
}

function Gc(t, e) {
  var i;
  const s = t.accept(e.target.read(), e.params);
  if (R(s)) return null;
  const n = { target: e.target, initialValue: s.initialValue, params: s.params }, r = L(e.params, u => ({
      disabled: u.optional.boolean,
      hidden: u.optional.boolean,
      label: u.optional.string,
      tag: u.optional.string
    })), o = t.binding.reader(n), a = t.binding.constraint ? t.binding.constraint(n) : void 0,
    l = new jc({ reader: o, target: e.target, writer: t.binding.writer(n) }),
    h = new Mo(D(o(s.initialValue), { constraint: a, equals: t.binding.equals }), l), c = t.controller({
      constraint: a,
      document: e.document,
      initialValue: s.initialValue,
      params: s.params,
      value: h,
      viewProps: de.create({ disabled: r == null ? void 0 : r.disabled, hidden: r == null ? void 0 : r.hidden })
    });
  return new Ho(e.document, {
    blade: $e(),
    props: _.fromObject({ label: "label" in e.params ? (i = r == null ? void 0 : r.label) !== null && i !== void 0 ? i : null : e.target.key }),
    tag: r == null ? void 0 : r.tag,
    value: h,
    valueController: c
  });
}

class Wc {
  constructor(e) {
    this.target = e.target, this.reader_ = e.reader;
  }
  
  read() {
    return this.reader_(this.target.read());
  }
}

function Kc(t, e) {
  return e === 0 ? new Ca : new Ea(t, e ?? yt.monitor.defaultInterval);
}

function qc(t, e) {
  var i, s, n;
  const r = t.accept(e.target.read(), e.params);
  if (R(r)) return null;
  const o = { target: e.target, initialValue: r.initialValue, params: r.params }, a = L(e.params, p => ({
      bufferSize: p.optional.number,
      disabled: p.optional.boolean,
      hidden: p.optional.boolean,
      interval: p.optional.number,
      label: p.optional.string
    })), l = t.binding.reader(o),
    h = (s = (i = a == null ? void 0 : a.bufferSize) !== null && i !== void 0 ? i : t.binding.defaultBufferSize && t.binding.defaultBufferSize(r.params)) !== null && s !== void 0 ? s : 1,
    c = new qo({
      binding: new Wc({ reader: l, target: e.target }),
      bufferSize: h,
      ticker: Kc(e.document, a == null ? void 0 : a.interval)
    }), u = t.controller({
      document: e.document,
      params: r.params,
      value: c,
      viewProps: de.create({ disabled: a == null ? void 0 : a.disabled, hidden: a == null ? void 0 : a.hidden })
    });
  return u.viewProps.bindDisabled(c.ticker), u.viewProps.handleDispose(() => {
    c.ticker.dispose();
  }), new Yo(e.document, {
    blade: $e(),
    props: _.fromObject({ label: "label" in e.params ? (n = a == null ? void 0 : a.label) !== null && n !== void 0 ? n : null : e.target.key }),
    value: c,
    valueController: u
  });
}

class $c {
  constructor(e) {
    this.pluginsMap_ = { blades: [], inputs: [], monitors: [] }, this.apiCache_ = e;
  }
  
  getAll() {
    return [...this.pluginsMap_.blades, ...this.pluginsMap_.inputs, ...this.pluginsMap_.monitors];
  }
  
  register(e, i) {
    if (!Ia(i.core)) throw V.notCompatible(e, i.id);
    i.type === "blade" ? this.pluginsMap_.blades.unshift(i) : i.type === "input" ? this.pluginsMap_.inputs.unshift(i) : i.type === "monitor" && this.pluginsMap_.monitors.unshift(i);
  }
  
  createInput_(e, i, s) {
    return this.pluginsMap_.inputs.reduce((n, r) => n ?? Gc(r, { document: e, target: i, params: s }), null);
  }
  
  createMonitor_(e, i, s) {
    return this.pluginsMap_.monitors.reduce((n, r) => n ?? qc(r, { document: e, params: s, target: i }), null);
  }
  
  createBinding(e, i, s) {
    const n = i.read();
    if (R(n)) throw new V({ context: { key: i.key }, type: "nomatchingcontroller" });
    const r = this.createInput_(e, i, s);
    if (r) return r;
    const o = this.createMonitor_(e, i, s);
    if (o) return o;
    throw new V({ context: { key: i.key }, type: "nomatchingcontroller" });
  }
  
  createBlade(e, i) {
    const s = this.pluginsMap_.blades.reduce((n, r) => n ?? Pa(r, { document: e, params: i }), null);
    if (!s) throw new V({ type: "nomatchingview", context: { params: i } });
    return s;
  }
  
  createInputBindingApi_(e) {
    const i = this.pluginsMap_.inputs.reduce((s, n) => {
      var r, o;
      return s || ((o = (r = n.api) === null || r === void 0 ? void 0 : r.call(n, { controller: e })) !== null && o !== void 0 ? o : null);
    }, null);
    return this.apiCache_.add(e, i ?? new at(e));
  }
  
  createMonitorBindingApi_(e) {
    const i = this.pluginsMap_.monitors.reduce((s, n) => {
      var r, o;
      return s || ((o = (r = n.api) === null || r === void 0 ? void 0 : r.call(n, { controller: e })) !== null && o !== void 0 ? o : null);
    }, null);
    return this.apiCache_.add(e, i ?? new at(e));
  }
  
  createBindingApi(e) {
    if (this.apiCache_.has(e)) return this.apiCache_.get(e);
    if (jo(e)) return this.createInputBindingApi_(e);
    if (Xo(e)) return this.createMonitorBindingApi_(e);
    throw V.shouldNeverHappen();
  }
  
  createApi(e) {
    if (this.apiCache_.has(e)) return this.apiCache_.get(e);
    if (No(e)) return this.createBindingApi(e);
    const i = this.pluginsMap_.blades.reduce((s, n) => s ?? n.api({ controller: e, pool: this }), null);
    if (!i) throw V.shouldNeverHappen();
    return this.apiCache_.add(e, i);
  }
}

const Yc = new Hc;

function Xc() {
  const t = new $c(Yc);
  return [yc, Sc, Rc, Dc, dc, ac, oc, tc, Ha, Vc, Nc, Fc, ta, ma, yn].forEach(e => {
    t.register("core", e);
  }), t;
}

class Zc extends De {
  constructor(e) {
    super(e), this.emitter_ = new O, this.controller.value.emitter.on("change", i => {
      this.emitter_.emit("change", new mt(this, i.rawValue));
    });
  }
  
  get label() {
    return this.controller.labelController.props.get("label");
  }
  
  set label(e) {
    this.controller.labelController.props.set("label", e);
  }
  
  get options() {
    return this.controller.valueController.props.get("options");
  }
  
  set options(e) {
    this.controller.valueController.props.set("options", e);
  }
  
  get value() {
    return this.controller.value.rawValue;
  }
  
  set value(e) {
    this.controller.value.rawValue = e;
  }
  
  on(e, i) {
    const s = i.bind(this);
    return this.emitter_.on(e, n => {
      s(n);
    }, { key: i }), this;
  }
  
  off(e, i) {
    return this.emitter_.off(e, i), this;
  }
}

class Qc extends De {
}

class Jc extends De {
  constructor(e) {
    super(e), this.emitter_ = new O, this.controller.value.emitter.on("change", i => {
      this.emitter_.emit("change", new mt(this, i.rawValue));
    });
  }
  
  get label() {
    return this.controller.labelController.props.get("label");
  }
  
  set label(e) {
    this.controller.labelController.props.set("label", e);
  }
  
  get max() {
    return this.controller.valueController.sliderController.props.get("max");
  }
  
  set max(e) {
    this.controller.valueController.sliderController.props.set("max", e);
  }
  
  get min() {
    return this.controller.valueController.sliderController.props.get("min");
  }
  
  set min(e) {
    this.controller.valueController.sliderController.props.set("min", e);
  }
  
  get value() {
    return this.controller.value.rawValue;
  }
  
  set value(e) {
    this.controller.value.rawValue = e;
  }
  
  on(e, i) {
    const s = i.bind(this);
    return this.emitter_.on(e, n => {
      s(n);
    }, { key: i }), this;
  }
  
  off(e, i) {
    return this.emitter_.off(e, i), this;
  }
}

class eh extends De {
  constructor(e) {
    super(e), this.emitter_ = new O, this.controller.value.emitter.on("change", i => {
      this.emitter_.emit("change", new mt(this, i.rawValue));
    });
  }
  
  get label() {
    return this.controller.labelController.props.get("label");
  }
  
  set label(e) {
    this.controller.labelController.props.set("label", e);
  }
  
  get formatter() {
    return this.controller.valueController.props.get("formatter");
  }
  
  set formatter(e) {
    this.controller.valueController.props.set("formatter", e);
  }
  
  get value() {
    return this.controller.value.rawValue;
  }
  
  set value(e) {
    this.controller.value.rawValue = e;
  }
  
  on(e, i) {
    const s = i.bind(this);
    return this.emitter_.on(e, n => {
      s(n);
    }, { key: i }), this;
  }
  
  off(e, i) {
    return this.emitter_.off(e, i), this;
  }
}

const th = function() {
  return {
    id: "list", type: "blade", core: qe, accept(t) {
      const e = L(t, i => ({
        options: i.required.custom(gt),
        value: i.required.raw,
        view: i.required.constant("list"),
        label: i.optional.string
      }));
      return e ? { params: e } : null;
    }, controller(t) {
      const e = new bt(Vi(t.params.options)), i = D(t.params.value, { constraint: e }), s = new Pe(t.document, {
        props: new _({ options: e.values.value("options") }),
        value: i,
        viewProps: t.viewProps
      });
      return new Re(t.document, {
        blade: t.blade,
        props: _.fromObject({ label: t.params.label }),
        value: i,
        valueController: s
      });
    }, api(t) {
      return !(t.controller instanceof Re) || !(t.controller.valueController instanceof Pe) ? null : new Zc(t.controller);
    }
  };
}();

class ih extends wn {
  constructor(e, i) {
    super(e, i);
  }
  
  get element() {
    return this.controller.view.element;
  }
}

class sh extends vi {
  constructor(e, i) {
    super(e, { expanded: i.expanded, blade: i.blade, props: i.props, root: !0, viewProps: i.viewProps });
  }
}

const Ms = P("spr");

class nh {
  constructor(e, i) {
    this.element = e.createElement("div"), this.element.classList.add(Ms()), i.viewProps.bindClassModifiers(this.element);
    const s = e.createElement("hr");
    s.classList.add(Ms("r")), this.element.appendChild(s);
  }
}

class Ts extends jt {
  constructor(e, i) {
    super(Object.assign(Object.assign({}, i), { view: new nh(e, { viewProps: i.viewProps }) }));
  }
}

const rh = {
  id: "separator", type: "blade", core: qe, accept(t) {
    const e = L(t, i => ({ view: i.required.constant("separator") }));
    return e ? { params: e } : null;
  }, controller(t) {
    return new Ts(t.document, { blade: t.blade, viewProps: t.viewProps });
  }, api(t) {
    return t.controller instanceof Ts ? new Qc(t.controller) : null;
  }
}, oh = {
  id: "slider", type: "blade", core: qe, accept(t) {
    const e = L(t, i => ({
      max: i.required.number,
      min: i.required.number,
      view: i.required.constant("slider"),
      format: i.optional.function,
      label: i.optional.string,
      value: i.optional.number
    }));
    return e ? { params: e } : null;
  }, controller(t) {
    var e, i;
    const s = (e = t.params.value) !== null && e !== void 0 ? e : 0,
      n = new pt({ max: t.params.max, min: t.params.min }), r = D(s, { constraint: n }),
      o = new Ut(t.document, Object.assign(Object.assign({}, Mn({
        formatter: (i = t.params.format) !== null && i !== void 0 ? i : yo,
        keyScale: D(1),
        max: n.values.value("max"),
        min: n.values.value("min"),
        pointerScale: on(t.params, s)
      })), { parser: he, value: r, viewProps: t.viewProps }));
    return new Re(t.document, {
      blade: t.blade,
      props: _.fromObject({ label: t.params.label }),
      value: r,
      valueController: o
    });
  }, api(t) {
    return !(t.controller instanceof Re) || !(t.controller.valueController instanceof Ut) ? null : new Jc(t.controller);
  }
}, ah = function() {
  return {
    id: "text", type: "blade", core: qe, accept(t) {
      const e = L(t, i => ({
        parse: i.required.function,
        value: i.required.raw,
        view: i.required.constant("text"),
        format: i.optional.function,
        label: i.optional.string
      }));
      return e ? { params: e } : null;
    }, controller(t) {
      var e;
      const i = D(t.params.value), s = new lt(t.document, {
        parser: t.params.parse,
        props: _.fromObject({ formatter: (e = t.params.format) !== null && e !== void 0 ? e : n => String(n) }),
        value: i,
        viewProps: t.viewProps
      });
      return new Re(t.document, {
        blade: t.blade,
        props: _.fromObject({ label: t.params.label }),
        value: i,
        valueController: s
      });
    }, api(t) {
      return !(t.controller instanceof Re) || !(t.controller.valueController instanceof lt) ? null : new eh(t.controller);
    }
  };
}();

function lh(t) {
  const e = t.createElement("div");
  return e.classList.add(P("dfw")()), t.body && t.body.appendChild(e), e;
}

function ch(t, e, i) {
  if (t.querySelector(`style[data-tp-style=${e}]`)) return;
  const s = t.createElement("style");
  s.dataset.tpStyle = e, s.textContent = i, t.head.appendChild(s);
}

class hh extends ih {
  constructor(e) {
    var i, s;
    const n = e ?? {}, r = (i = n.document) !== null && i !== void 0 ? i : Bo(), o = Xc(), a = new sh(r, {
      expanded: n.expanded,
      blade: $e(),
      props: _.fromObject({ title: n.title }),
      viewProps: de.create()
    });
    super(a, o), this.pool_ = o, this.containerElem_ = (s = n.container) !== null && s !== void 0 ? s : lh(r), this.containerElem_.appendChild(this.element), this.doc_ = r, this.usesDefaultWrapper_ = !n.container, this.setUpDefaultPlugins_();
  }
  
  get document() {
    if (!this.doc_) throw V.alreadyDisposed();
    return this.doc_;
  }
  
  dispose() {
    const e = this.containerElem_;
    if (!e) throw V.alreadyDisposed();
    if (this.usesDefaultWrapper_) {
      const i = e.parentElement;
      i && i.removeChild(e);
    }
    this.containerElem_ = null, this.doc_ = null, super.dispose();
  }
  
  registerPlugin(e) {
    e.css && ch(this.document, `plugin-${e.id}`, e.css), ("plugin" in e ? [e.plugin] : "plugins" in e ? e.plugins : []).forEach(s => {
      this.pool_.register(e.id, s);
    });
  }
  
  setUpDefaultPlugins_() {
    this.registerPlugin({
      id: "default",
      css: ".tp-tbiv_b,.tp-coltxtv_ms,.tp-colswv_b,.tp-ckbv_i,.tp-sglv_i,.tp-mllv_i,.tp-grlv_g,.tp-txtv_i,.tp-p2dpv_p,.tp-colswv_sw,.tp-rotv_b,.tp-fldv_b,.tp-p2dv_b,.tp-btnv_b,.tp-lstv_s{-webkit-appearance:none;-moz-appearance:none;appearance:none;background-color:rgba(0,0,0,0);border-width:0;font-family:inherit;font-size:inherit;font-weight:inherit;margin:0;outline:none;padding:0}.tp-p2dv_b,.tp-btnv_b,.tp-lstv_s{background-color:var(--btn-bg);border-radius:var(--bld-br);color:var(--btn-fg);cursor:pointer;display:block;font-weight:bold;height:var(--cnt-usz);line-height:var(--cnt-usz);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tp-p2dv_b:hover,.tp-btnv_b:hover,.tp-lstv_s:hover{background-color:var(--btn-bg-h)}.tp-p2dv_b:focus,.tp-btnv_b:focus,.tp-lstv_s:focus{background-color:var(--btn-bg-f)}.tp-p2dv_b:active,.tp-btnv_b:active,.tp-lstv_s:active{background-color:var(--btn-bg-a)}.tp-p2dv_b:disabled,.tp-btnv_b:disabled,.tp-lstv_s:disabled{opacity:.5}.tp-rotv_c>.tp-cntv.tp-v-lst,.tp-tbpv_c>.tp-cntv.tp-v-lst,.tp-fldv_c>.tp-cntv.tp-v-lst{margin-bottom:calc(-1*var(--cnt-vp))}.tp-rotv_c>.tp-fldv.tp-v-lst .tp-fldv_c,.tp-tbpv_c>.tp-fldv.tp-v-lst .tp-fldv_c,.tp-fldv_c>.tp-fldv.tp-v-lst .tp-fldv_c{border-bottom-left-radius:0}.tp-rotv_c>.tp-fldv.tp-v-lst .tp-fldv_b,.tp-tbpv_c>.tp-fldv.tp-v-lst .tp-fldv_b,.tp-fldv_c>.tp-fldv.tp-v-lst .tp-fldv_b{border-bottom-left-radius:0}.tp-rotv_c>*:not(.tp-v-fst),.tp-tbpv_c>*:not(.tp-v-fst),.tp-fldv_c>*:not(.tp-v-fst){margin-top:var(--cnt-usp)}.tp-rotv_c>.tp-sprv:not(.tp-v-fst),.tp-tbpv_c>.tp-sprv:not(.tp-v-fst),.tp-fldv_c>.tp-sprv:not(.tp-v-fst),.tp-rotv_c>.tp-cntv:not(.tp-v-fst),.tp-tbpv_c>.tp-cntv:not(.tp-v-fst),.tp-fldv_c>.tp-cntv:not(.tp-v-fst){margin-top:var(--cnt-vp)}.tp-rotv_c>.tp-sprv+*:not(.tp-v-hidden),.tp-tbpv_c>.tp-sprv+*:not(.tp-v-hidden),.tp-fldv_c>.tp-sprv+*:not(.tp-v-hidden),.tp-rotv_c>.tp-cntv+*:not(.tp-v-hidden),.tp-tbpv_c>.tp-cntv+*:not(.tp-v-hidden),.tp-fldv_c>.tp-cntv+*:not(.tp-v-hidden){margin-top:var(--cnt-vp)}.tp-rotv_c>.tp-sprv:not(.tp-v-hidden)+.tp-sprv,.tp-tbpv_c>.tp-sprv:not(.tp-v-hidden)+.tp-sprv,.tp-fldv_c>.tp-sprv:not(.tp-v-hidden)+.tp-sprv,.tp-rotv_c>.tp-cntv:not(.tp-v-hidden)+.tp-cntv,.tp-tbpv_c>.tp-cntv:not(.tp-v-hidden)+.tp-cntv,.tp-fldv_c>.tp-cntv:not(.tp-v-hidden)+.tp-cntv{margin-top:0}.tp-tbpv_c>.tp-cntv,.tp-fldv_c>.tp-cntv{margin-left:4px}.tp-tbpv_c>.tp-fldv>.tp-fldv_b,.tp-fldv_c>.tp-fldv>.tp-fldv_b{border-top-left-radius:var(--bld-br);border-bottom-left-radius:var(--bld-br)}.tp-tbpv_c>.tp-fldv.tp-fldv-expanded>.tp-fldv_b,.tp-fldv_c>.tp-fldv.tp-fldv-expanded>.tp-fldv_b{border-bottom-left-radius:0}.tp-tbpv_c .tp-fldv>.tp-fldv_c,.tp-fldv_c .tp-fldv>.tp-fldv_c{border-bottom-left-radius:var(--bld-br)}.tp-tbpv_c>.tp-cntv+.tp-fldv>.tp-fldv_b,.tp-fldv_c>.tp-cntv+.tp-fldv>.tp-fldv_b{border-top-left-radius:0}.tp-tbpv_c>.tp-cntv+.tp-tabv>.tp-tabv_t,.tp-fldv_c>.tp-cntv+.tp-tabv>.tp-tabv_t{border-top-left-radius:0}.tp-tbpv_c>.tp-tabv>.tp-tabv_t,.tp-fldv_c>.tp-tabv>.tp-tabv_t{border-top-left-radius:var(--bld-br)}.tp-tbpv_c .tp-tabv>.tp-tabv_c,.tp-fldv_c .tp-tabv>.tp-tabv_c{border-bottom-left-radius:var(--bld-br)}.tp-rotv_b,.tp-fldv_b{background-color:var(--cnt-bg);color:var(--cnt-fg);cursor:pointer;display:block;height:calc(var(--cnt-usz) + 4px);line-height:calc(var(--cnt-usz) + 4px);overflow:hidden;padding-left:var(--cnt-hp);padding-right:calc(4px + var(--cnt-usz) + var(--cnt-hp));position:relative;text-align:left;text-overflow:ellipsis;white-space:nowrap;width:100%;transition:border-radius .2s ease-in-out .2s}.tp-rotv_b:hover,.tp-fldv_b:hover{background-color:var(--cnt-bg-h)}.tp-rotv_b:focus,.tp-fldv_b:focus{background-color:var(--cnt-bg-f)}.tp-rotv_b:active,.tp-fldv_b:active{background-color:var(--cnt-bg-a)}.tp-rotv_b:disabled,.tp-fldv_b:disabled{opacity:.5}.tp-rotv_m,.tp-fldv_m{background:linear-gradient(to left, var(--cnt-fg), var(--cnt-fg) 2px, transparent 2px, transparent 4px, var(--cnt-fg) 4px);border-radius:2px;bottom:0;content:\"\";display:block;height:6px;right:calc(var(--cnt-hp) + (var(--cnt-usz) + 4px - 6px)/2 - 2px);margin:auto;opacity:.5;position:absolute;top:0;transform:rotate(90deg);transition:transform .2s ease-in-out;width:6px}.tp-rotv.tp-rotv-expanded .tp-rotv_m,.tp-fldv.tp-fldv-expanded>.tp-fldv_b>.tp-fldv_m{transform:none}.tp-rotv_c,.tp-fldv_c{box-sizing:border-box;height:0;opacity:0;overflow:hidden;padding-bottom:0;padding-top:0;position:relative;transition:height .2s ease-in-out,opacity .2s linear,padding .2s ease-in-out}.tp-rotv.tp-rotv-cpl:not(.tp-rotv-expanded) .tp-rotv_c,.tp-fldv.tp-fldv-cpl:not(.tp-fldv-expanded)>.tp-fldv_c{display:none}.tp-rotv.tp-rotv-expanded .tp-rotv_c,.tp-fldv.tp-fldv-expanded>.tp-fldv_c{opacity:1;padding-bottom:var(--cnt-vp);padding-top:var(--cnt-vp);transform:none;overflow:visible;transition:height .2s ease-in-out,opacity .2s linear .2s,padding .2s ease-in-out}.tp-txtv_i,.tp-p2dpv_p,.tp-colswv_sw{background-color:var(--in-bg);border-radius:var(--bld-br);box-sizing:border-box;color:var(--in-fg);font-family:inherit;height:var(--cnt-usz);line-height:var(--cnt-usz);min-width:0;width:100%}.tp-txtv_i:hover,.tp-p2dpv_p:hover,.tp-colswv_sw:hover{background-color:var(--in-bg-h)}.tp-txtv_i:focus,.tp-p2dpv_p:focus,.tp-colswv_sw:focus{background-color:var(--in-bg-f)}.tp-txtv_i:active,.tp-p2dpv_p:active,.tp-colswv_sw:active{background-color:var(--in-bg-a)}.tp-txtv_i:disabled,.tp-p2dpv_p:disabled,.tp-colswv_sw:disabled{opacity:.5}.tp-lstv,.tp-coltxtv_m{position:relative}.tp-lstv_s{padding:0 20px 0 4px;width:100%}.tp-lstv_m,.tp-coltxtv_mm{bottom:0;margin:auto;pointer-events:none;position:absolute;right:2px;top:0}.tp-lstv_m svg,.tp-coltxtv_mm svg{bottom:0;height:16px;margin:auto;position:absolute;right:0;top:0;width:16px}.tp-lstv_m svg path,.tp-coltxtv_mm svg path{fill:currentColor}.tp-sglv_i,.tp-mllv_i,.tp-grlv_g{background-color:var(--mo-bg);border-radius:var(--bld-br);box-sizing:border-box;color:var(--mo-fg);height:var(--cnt-usz);scrollbar-color:currentColor rgba(0,0,0,0);scrollbar-width:thin;width:100%}.tp-sglv_i::-webkit-scrollbar,.tp-mllv_i::-webkit-scrollbar,.tp-grlv_g::-webkit-scrollbar{height:8px;width:8px}.tp-sglv_i::-webkit-scrollbar-corner,.tp-mllv_i::-webkit-scrollbar-corner,.tp-grlv_g::-webkit-scrollbar-corner{background-color:rgba(0,0,0,0)}.tp-sglv_i::-webkit-scrollbar-thumb,.tp-mllv_i::-webkit-scrollbar-thumb,.tp-grlv_g::-webkit-scrollbar-thumb{background-clip:padding-box;background-color:currentColor;border:rgba(0,0,0,0) solid 2px;border-radius:4px}.tp-pndtxtv,.tp-coltxtv_w{display:flex}.tp-pndtxtv_a,.tp-coltxtv_c{width:100%}.tp-pndtxtv_a+.tp-pndtxtv_a,.tp-coltxtv_c+.tp-pndtxtv_a,.tp-pndtxtv_a+.tp-coltxtv_c,.tp-coltxtv_c+.tp-coltxtv_c{margin-left:2px}.tp-rotv{--bs-bg: var(--tp-base-background-color, hsl(230, 7%, 17%));--bs-br: var(--tp-base-border-radius, 6px);--bs-ff: var(--tp-base-font-family, Roboto Mono, Source Code Pro, Menlo, Courier, monospace);--bs-sh: var(--tp-base-shadow-color, rgba(0, 0, 0, 0.2));--bld-br: var(--tp-blade-border-radius, 2px);--bld-hp: var(--tp-blade-horizontal-padding, 4px);--bld-vw: var(--tp-blade-value-width, 160px);--btn-bg: var(--tp-button-background-color, hsl(230, 7%, 70%));--btn-bg-a: var(--tp-button-background-color-active, #d6d7db);--btn-bg-f: var(--tp-button-background-color-focus, #c8cad0);--btn-bg-h: var(--tp-button-background-color-hover, #bbbcc4);--btn-fg: var(--tp-button-foreground-color, hsl(230, 7%, 17%));--cnt-bg: var(--tp-container-background-color, rgba(187, 188, 196, 0.1));--cnt-bg-a: var(--tp-container-background-color-active, rgba(187, 188, 196, 0.25));--cnt-bg-f: var(--tp-container-background-color-focus, rgba(187, 188, 196, 0.2));--cnt-bg-h: var(--tp-container-background-color-hover, rgba(187, 188, 196, 0.15));--cnt-fg: var(--tp-container-foreground-color, hsl(230, 7%, 75%));--cnt-hp: var(--tp-container-horizontal-padding, 4px);--cnt-vp: var(--tp-container-vertical-padding, 4px);--cnt-usp: var(--tp-container-unit-spacing, 4px);--cnt-usz: var(--tp-container-unit-size, 20px);--in-bg: var(--tp-input-background-color, rgba(187, 188, 196, 0.1));--in-bg-a: var(--tp-input-background-color-active, rgba(187, 188, 196, 0.25));--in-bg-f: var(--tp-input-background-color-focus, rgba(187, 188, 196, 0.2));--in-bg-h: var(--tp-input-background-color-hover, rgba(187, 188, 196, 0.15));--in-fg: var(--tp-input-foreground-color, hsl(230, 7%, 75%));--lbl-fg: var(--tp-label-foreground-color, rgba(187, 188, 196, 0.7));--mo-bg: var(--tp-monitor-background-color, rgba(0, 0, 0, 0.2));--mo-fg: var(--tp-monitor-foreground-color, rgba(187, 188, 196, 0.7));--grv-fg: var(--tp-groove-foreground-color, rgba(187, 188, 196, 0.1))}.tp-btnv_b{width:100%}.tp-btnv_t{text-align:center}.tp-ckbv_l{display:block;position:relative}.tp-ckbv_i{left:0;opacity:0;position:absolute;top:0}.tp-ckbv_w{background-color:var(--in-bg);border-radius:var(--bld-br);cursor:pointer;display:block;height:var(--cnt-usz);position:relative;width:var(--cnt-usz)}.tp-ckbv_w svg{display:block;height:16px;inset:0;margin:auto;opacity:0;position:absolute;width:16px}.tp-ckbv_w svg path{fill:none;stroke:var(--in-fg);stroke-width:2}.tp-ckbv_i:hover+.tp-ckbv_w{background-color:var(--in-bg-h)}.tp-ckbv_i:focus+.tp-ckbv_w{background-color:var(--in-bg-f)}.tp-ckbv_i:active+.tp-ckbv_w{background-color:var(--in-bg-a)}.tp-ckbv_i:checked+.tp-ckbv_w svg{opacity:1}.tp-ckbv.tp-v-disabled .tp-ckbv_w{opacity:.5}.tp-colv{position:relative}.tp-colv_h{display:flex}.tp-colv_s{flex-grow:0;flex-shrink:0;width:var(--cnt-usz)}.tp-colv_t{flex:1;margin-left:4px}.tp-colv_p{height:0;margin-top:0;opacity:0;overflow:hidden;transition:height .2s ease-in-out,opacity .2s linear,margin .2s ease-in-out}.tp-colv.tp-colv-expanded.tp-colv-cpl .tp-colv_p{overflow:visible}.tp-colv.tp-colv-expanded .tp-colv_p{margin-top:var(--cnt-usp);opacity:1}.tp-colv .tp-popv{left:calc(-1*var(--cnt-hp));right:calc(-1*var(--cnt-hp));top:var(--cnt-usz)}.tp-colpv_h,.tp-colpv_ap{margin-left:6px;margin-right:6px}.tp-colpv_h{margin-top:var(--cnt-usp)}.tp-colpv_rgb{display:flex;margin-top:var(--cnt-usp);width:100%}.tp-colpv_a{display:flex;margin-top:var(--cnt-vp);padding-top:calc(var(--cnt-vp) + 2px);position:relative}.tp-colpv_a::before{background-color:var(--grv-fg);content:\"\";height:2px;left:calc(-1*var(--cnt-hp));position:absolute;right:calc(-1*var(--cnt-hp));top:0}.tp-colpv.tp-v-disabled .tp-colpv_a::before{opacity:.5}.tp-colpv_ap{align-items:center;display:flex;flex:3}.tp-colpv_at{flex:1;margin-left:4px}.tp-svpv{border-radius:var(--bld-br);outline:none;overflow:hidden;position:relative}.tp-svpv.tp-v-disabled{opacity:.5}.tp-svpv_c{cursor:crosshair;display:block;height:calc(var(--cnt-usz)*4);width:100%}.tp-svpv_m{border-radius:100%;border:rgba(255,255,255,.75) solid 2px;box-sizing:border-box;filter:drop-shadow(0 0 1px rgba(0, 0, 0, 0.3));height:12px;margin-left:-6px;margin-top:-6px;pointer-events:none;position:absolute;width:12px}.tp-svpv:focus .tp-svpv_m{border-color:#fff}.tp-hplv{cursor:pointer;height:var(--cnt-usz);outline:none;position:relative}.tp-hplv.tp-v-disabled{opacity:.5}.tp-hplv_c{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAABCAYAAABubagXAAAAQ0lEQVQoU2P8z8Dwn0GCgQEDi2OK/RBgYHjBgIpfovFh8j8YBIgzFGQxuqEgPhaDOT5gOhPkdCxOZeBg+IDFZZiGAgCaSSMYtcRHLgAAAABJRU5ErkJggg==);background-position:left top;background-repeat:no-repeat;background-size:100% 100%;border-radius:2px;display:block;height:4px;left:0;margin-top:-2px;position:absolute;top:50%;width:100%}.tp-hplv_m{border-radius:var(--bld-br);border:rgba(255,255,255,.75) solid 2px;box-shadow:0 0 2px rgba(0,0,0,.1);box-sizing:border-box;height:12px;left:50%;margin-left:-6px;margin-top:-6px;position:absolute;top:50%;width:12px}.tp-hplv:focus .tp-hplv_m{border-color:#fff}.tp-aplv{cursor:pointer;height:var(--cnt-usz);outline:none;position:relative;width:100%}.tp-aplv.tp-v-disabled{opacity:.5}.tp-aplv_b{background-color:#fff;background-image:linear-gradient(to top right, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%),linear-gradient(to top right, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%);background-size:4px 4px;background-position:0 0,2px 2px;border-radius:2px;display:block;height:4px;left:0;margin-top:-2px;overflow:hidden;position:absolute;top:50%;width:100%}.tp-aplv_c{inset:0;position:absolute}.tp-aplv_m{background-color:#fff;background-image:linear-gradient(to top right, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%),linear-gradient(to top right, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%);background-size:12px 12px;background-position:0 0,6px 6px;border-radius:var(--bld-br);box-shadow:0 0 2px rgba(0,0,0,.1);height:12px;left:50%;margin-left:-6px;margin-top:-6px;overflow:hidden;position:absolute;top:50%;width:12px}.tp-aplv_p{border-radius:var(--bld-br);border:rgba(255,255,255,.75) solid 2px;box-sizing:border-box;inset:0;position:absolute}.tp-aplv:focus .tp-aplv_p{border-color:#fff}.tp-colswv{background-color:#fff;background-image:linear-gradient(to top right, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%),linear-gradient(to top right, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%);background-size:10px 10px;background-position:0 0,5px 5px;border-radius:var(--bld-br);overflow:hidden}.tp-colswv.tp-v-disabled{opacity:.5}.tp-colswv_sw{border-radius:0}.tp-colswv_b{cursor:pointer;display:block;height:var(--cnt-usz);left:0;position:absolute;top:0;width:var(--cnt-usz)}.tp-colswv_b:focus::after{border:rgba(255,255,255,.75) solid 2px;border-radius:var(--bld-br);content:\"\";display:block;inset:0;position:absolute}.tp-coltxtv{display:flex;width:100%}.tp-coltxtv_m{margin-right:4px}.tp-coltxtv_ms{border-radius:var(--bld-br);color:var(--lbl-fg);cursor:pointer;height:var(--cnt-usz);line-height:var(--cnt-usz);padding:0 18px 0 4px}.tp-coltxtv_ms:hover{background-color:var(--in-bg-h)}.tp-coltxtv_ms:focus{background-color:var(--in-bg-f)}.tp-coltxtv_ms:active{background-color:var(--in-bg-a)}.tp-coltxtv_mm{color:var(--lbl-fg)}.tp-coltxtv.tp-v-disabled .tp-coltxtv_mm{opacity:.5}.tp-coltxtv_w{flex:1}.tp-dfwv{position:absolute;top:8px;right:8px;width:256px}.tp-fldv{position:relative}.tp-fldv_t{padding-left:4px}.tp-fldv_b:disabled .tp-fldv_m{display:none}.tp-fldv_c{padding-left:4px}.tp-fldv_i{bottom:0;color:var(--cnt-bg);left:0;overflow:hidden;position:absolute;top:calc(var(--cnt-usz) + 4px);width:max(var(--bs-br),4px)}.tp-fldv_i::before{background-color:currentColor;bottom:0;content:\"\";left:0;position:absolute;top:0;width:4px}.tp-fldv_b:hover+.tp-fldv_i{color:var(--cnt-bg-h)}.tp-fldv_b:focus+.tp-fldv_i{color:var(--cnt-bg-f)}.tp-fldv_b:active+.tp-fldv_i{color:var(--cnt-bg-a)}.tp-fldv.tp-v-disabled>.tp-fldv_i{opacity:.5}.tp-grlv{position:relative}.tp-grlv_g{display:block;height:calc(var(--cnt-usz)*3)}.tp-grlv_g polyline{fill:none;stroke:var(--mo-fg);stroke-linejoin:round}.tp-grlv_t{margin-top:-4px;transition:left .05s,top .05s;visibility:hidden}.tp-grlv_t.tp-grlv_t-a{visibility:visible}.tp-grlv_t.tp-grlv_t-in{transition:none}.tp-grlv.tp-v-disabled .tp-grlv_g{opacity:.5}.tp-grlv .tp-ttv{background-color:var(--mo-fg)}.tp-grlv .tp-ttv::before{border-top-color:var(--mo-fg)}.tp-lblv{align-items:center;display:flex;line-height:1.3;padding-left:var(--cnt-hp);padding-right:var(--cnt-hp)}.tp-lblv.tp-lblv-nol{display:block}.tp-lblv_l{color:var(--lbl-fg);flex:1;-webkit-hyphens:auto;hyphens:auto;overflow:hidden;padding-left:4px;padding-right:16px}.tp-lblv.tp-v-disabled .tp-lblv_l{opacity:.5}.tp-lblv.tp-lblv-nol .tp-lblv_l{display:none}.tp-lblv_v{align-self:flex-start;flex-grow:0;flex-shrink:0;width:var(--bld-vw)}.tp-lblv.tp-lblv-nol .tp-lblv_v{width:100%}.tp-lstv_s{padding:0 20px 0 var(--bld-hp);width:100%}.tp-lstv_m{color:var(--btn-fg)}.tp-sglv_i{padding-left:var(--bld-hp);padding-right:var(--bld-hp)}.tp-sglv.tp-v-disabled .tp-sglv_i{opacity:.5}.tp-mllv_i{display:block;height:calc(var(--cnt-usz)*3);line-height:var(--cnt-usz);padding-left:var(--bld-hp);padding-right:var(--bld-hp);resize:none;white-space:pre}.tp-mllv.tp-v-disabled .tp-mllv_i{opacity:.5}.tp-p2dv{position:relative}.tp-p2dv_h{display:flex}.tp-p2dv_b{height:var(--cnt-usz);margin-right:4px;position:relative;width:var(--cnt-usz)}.tp-p2dv_b svg{display:block;height:16px;left:50%;margin-left:-8px;margin-top:-8px;position:absolute;top:50%;width:16px}.tp-p2dv_b svg path{stroke:currentColor;stroke-width:2}.tp-p2dv_b svg circle{fill:currentColor}.tp-p2dv_t{flex:1}.tp-p2dv_p{height:0;margin-top:0;opacity:0;overflow:hidden;transition:height .2s ease-in-out,opacity .2s linear,margin .2s ease-in-out}.tp-p2dv.tp-p2dv-expanded .tp-p2dv_p{margin-top:var(--cnt-usp);opacity:1}.tp-p2dv .tp-popv{left:calc(-1*var(--cnt-hp));right:calc(-1*var(--cnt-hp));top:var(--cnt-usz)}.tp-p2dpv{padding-left:calc(var(--cnt-usz) + 4px)}.tp-p2dpv_p{cursor:crosshair;height:0;overflow:hidden;padding-bottom:100%;position:relative}.tp-p2dpv.tp-v-disabled .tp-p2dpv_p{opacity:.5}.tp-p2dpv_g{display:block;height:100%;left:0;pointer-events:none;position:absolute;top:0;width:100%}.tp-p2dpv_ax{opacity:.1;stroke:var(--in-fg);stroke-dasharray:1}.tp-p2dpv_l{opacity:.5;stroke:var(--in-fg);stroke-dasharray:1}.tp-p2dpv_m{border:var(--in-fg) solid 1px;border-radius:50%;box-sizing:border-box;height:4px;margin-left:-2px;margin-top:-2px;position:absolute;width:4px}.tp-p2dpv_p:focus .tp-p2dpv_m{background-color:var(--in-fg);border-width:0}.tp-popv{background-color:var(--bs-bg);border-radius:var(--bs-br);box-shadow:0 2px 4px var(--bs-sh);display:none;max-width:var(--bld-vw);padding:var(--cnt-vp) var(--cnt-hp);position:absolute;visibility:hidden;z-index:1000}.tp-popv.tp-popv-v{display:block;visibility:visible}.tp-sldv.tp-v-disabled{opacity:.5}.tp-sldv_t{box-sizing:border-box;cursor:pointer;height:var(--cnt-usz);margin:0 6px;outline:none;position:relative}.tp-sldv_t::before{background-color:var(--in-bg);border-radius:1px;content:\"\";display:block;height:2px;inset:0;margin:auto;position:absolute}.tp-sldv_k{height:100%;left:0;position:absolute;top:0}.tp-sldv_k::before{background-color:var(--in-fg);border-radius:1px;content:\"\";display:block;height:2px;inset:0;margin-bottom:auto;margin-top:auto;position:absolute}.tp-sldv_k::after{background-color:var(--btn-bg);border-radius:var(--bld-br);bottom:0;content:\"\";display:block;height:12px;margin-bottom:auto;margin-top:auto;position:absolute;right:-6px;top:0;width:12px}.tp-sldv_t:hover .tp-sldv_k::after{background-color:var(--btn-bg-h)}.tp-sldv_t:focus .tp-sldv_k::after{background-color:var(--btn-bg-f)}.tp-sldv_t:active .tp-sldv_k::after{background-color:var(--btn-bg-a)}.tp-sldtxtv{display:flex}.tp-sldtxtv_s{flex:2}.tp-sldtxtv_t{flex:1;margin-left:4px}.tp-tabv{position:relative}.tp-tabv_t{align-items:flex-end;color:var(--cnt-bg);display:flex;overflow:hidden;position:relative}.tp-tabv_t:hover{color:var(--cnt-bg-h)}.tp-tabv_t:has(*:focus){color:var(--cnt-bg-f)}.tp-tabv_t:has(*:active){color:var(--cnt-bg-a)}.tp-tabv_t::before{background-color:currentColor;bottom:0;content:\"\";height:2px;left:0;pointer-events:none;position:absolute;right:0}.tp-tabv.tp-v-disabled .tp-tabv_t::before{opacity:.5}.tp-tabv.tp-tabv-nop .tp-tabv_t{height:calc(var(--cnt-usz) + 4px);position:relative}.tp-tabv.tp-tabv-nop .tp-tabv_t::before{background-color:var(--cnt-bg);bottom:0;content:\"\";height:2px;left:0;position:absolute;right:0}.tp-tabv_i{bottom:0;color:var(--cnt-bg);left:0;overflow:hidden;position:absolute;top:calc(var(--cnt-usz) + 4px);width:max(var(--bs-br),4px)}.tp-tabv_i::before{background-color:currentColor;bottom:0;content:\"\";left:0;position:absolute;top:0;width:4px}.tp-tabv_t:hover+.tp-tabv_i{color:var(--cnt-bg-h)}.tp-tabv_t:has(*:focus)+.tp-tabv_i{color:var(--cnt-bg-f)}.tp-tabv_t:has(*:active)+.tp-tabv_i{color:var(--cnt-bg-a)}.tp-tabv.tp-v-disabled>.tp-tabv_i{opacity:.5}.tp-tbiv{flex:1;min-width:0;position:relative}.tp-tbiv+.tp-tbiv{margin-left:2px}.tp-tbiv+.tp-tbiv.tp-v-disabled::before{opacity:.5}.tp-tbiv_b{display:block;padding-left:calc(var(--cnt-hp) + 4px);padding-right:calc(var(--cnt-hp) + 4px);position:relative;width:100%}.tp-tbiv_b:disabled{opacity:.5}.tp-tbiv_b::before{background-color:var(--cnt-bg);content:\"\";inset:0 0 2px;pointer-events:none;position:absolute}.tp-tbiv_b:hover::before{background-color:var(--cnt-bg-h)}.tp-tbiv_b:focus::before{background-color:var(--cnt-bg-f)}.tp-tbiv_b:active::before{background-color:var(--cnt-bg-a)}.tp-tbiv_t{color:var(--cnt-fg);height:calc(var(--cnt-usz) + 4px);line-height:calc(var(--cnt-usz) + 4px);opacity:.5;overflow:hidden;position:relative;text-overflow:ellipsis}.tp-tbiv.tp-tbiv-sel .tp-tbiv_t{opacity:1}.tp-tbpv_c{padding-bottom:var(--cnt-vp);padding-left:4px;padding-top:var(--cnt-vp)}.tp-txtv{position:relative}.tp-txtv_i{padding-left:var(--bld-hp);padding-right:var(--bld-hp)}.tp-txtv.tp-txtv-fst .tp-txtv_i{border-bottom-right-radius:0;border-top-right-radius:0}.tp-txtv.tp-txtv-mid .tp-txtv_i{border-radius:0}.tp-txtv.tp-txtv-lst .tp-txtv_i{border-bottom-left-radius:0;border-top-left-radius:0}.tp-txtv.tp-txtv-num .tp-txtv_i{text-align:right}.tp-txtv.tp-txtv-drg .tp-txtv_i{opacity:.3}.tp-txtv_k{cursor:pointer;height:100%;left:calc(var(--bld-hp) - 5px);position:absolute;top:0;width:12px}.tp-txtv_k::before{background-color:var(--in-fg);border-radius:1px;bottom:0;content:\"\";height:calc(var(--cnt-usz) - 4px);left:50%;margin-bottom:auto;margin-left:-1px;margin-top:auto;opacity:.1;position:absolute;top:0;transition:border-radius .1s,height .1s,transform .1s,width .1s;width:2px}.tp-txtv_k:hover::before,.tp-txtv.tp-txtv-drg .tp-txtv_k::before{opacity:1}.tp-txtv.tp-txtv-drg .tp-txtv_k::before{border-radius:50%;height:4px;transform:translateX(-1px);width:4px}.tp-txtv_g{bottom:0;display:block;height:8px;left:50%;margin:auto;overflow:visible;pointer-events:none;position:absolute;top:0;visibility:hidden;width:100%}.tp-txtv.tp-txtv-drg .tp-txtv_g{visibility:visible}.tp-txtv_gb{fill:none;stroke:var(--in-fg);stroke-dasharray:1}.tp-txtv_gh{fill:none;stroke:var(--in-fg)}.tp-txtv .tp-ttv{margin-left:6px;visibility:hidden}.tp-txtv.tp-txtv-drg .tp-ttv{visibility:visible}.tp-ttv{background-color:var(--in-fg);border-radius:var(--bld-br);color:var(--bs-bg);padding:2px 4px;pointer-events:none;position:absolute;transform:translate(-50%, -100%)}.tp-ttv::before{border-color:var(--in-fg) rgba(0,0,0,0) rgba(0,0,0,0) rgba(0,0,0,0);border-style:solid;border-width:2px;box-sizing:border-box;content:\"\";font-size:.9em;height:4px;left:50%;margin-left:-2px;position:absolute;top:100%;width:4px}.tp-rotv{background-color:var(--bs-bg);border-radius:var(--bs-br);box-shadow:0 2px 4px var(--bs-sh);font-family:var(--bs-ff);font-size:11px;font-weight:500;line-height:1;text-align:left}.tp-rotv_b{border-bottom-left-radius:var(--bs-br);border-bottom-right-radius:var(--bs-br);border-top-left-radius:var(--bs-br);border-top-right-radius:var(--bs-br);padding-left:calc(4px + var(--cnt-usz) + var(--cnt-hp));text-align:center}.tp-rotv.tp-rotv-expanded .tp-rotv_b{border-bottom-left-radius:0;border-bottom-right-radius:0;transition-delay:0s;transition-duration:0s}.tp-rotv.tp-rotv-not>.tp-rotv_b{display:none}.tp-rotv_b:disabled .tp-rotv_m{display:none}.tp-rotv_c>.tp-fldv.tp-v-lst>.tp-fldv_c{border-bottom-left-radius:var(--bs-br);border-bottom-right-radius:var(--bs-br)}.tp-rotv_c>.tp-fldv.tp-v-lst>.tp-fldv_i{border-bottom-left-radius:var(--bs-br)}.tp-rotv_c>.tp-fldv.tp-v-lst:not(.tp-fldv-expanded)>.tp-fldv_b{border-bottom-left-radius:var(--bs-br);border-bottom-right-radius:var(--bs-br)}.tp-rotv_c>.tp-fldv.tp-v-lst.tp-fldv-expanded>.tp-fldv_b{transition-delay:0s;transition-duration:0s}.tp-rotv_c .tp-fldv.tp-v-vlst:not(.tp-fldv-expanded)>.tp-fldv_b{border-bottom-right-radius:var(--bs-br)}.tp-rotv.tp-rotv-not .tp-rotv_c>.tp-fldv.tp-v-fst{margin-top:calc(-1*var(--cnt-vp))}.tp-rotv.tp-rotv-not .tp-rotv_c>.tp-fldv.tp-v-fst>.tp-fldv_b{border-top-left-radius:var(--bs-br);border-top-right-radius:var(--bs-br)}.tp-rotv_c>.tp-tabv.tp-v-lst>.tp-tabv_c{border-bottom-left-radius:var(--bs-br);border-bottom-right-radius:var(--bs-br)}.tp-rotv_c>.tp-tabv.tp-v-lst>.tp-tabv_i{border-bottom-left-radius:var(--bs-br)}.tp-rotv.tp-rotv-not .tp-rotv_c>.tp-tabv.tp-v-fst{margin-top:calc(-1*var(--cnt-vp))}.tp-rotv.tp-rotv-not .tp-rotv_c>.tp-tabv.tp-v-fst>.tp-tabv_t{border-top-left-radius:var(--bs-br);border-top-right-radius:var(--bs-br)}.tp-rotv.tp-v-disabled,.tp-rotv .tp-v-disabled{pointer-events:none}.tp-rotv.tp-v-hidden,.tp-rotv .tp-v-hidden{display:none}.tp-sprv_r{background-color:var(--grv-fg);border-width:0;display:block;height:2px;margin:0;width:100%}.tp-sprv.tp-v-disabled .tp-sprv_r{opacity:.5}",
      plugins: [th, rh, oh, yn, ah]
    });
  }
}

new _n("4.0.5");

function uh(t) {
  let e, i;
  e = document.createElement("div");
  const s = new hh({ container: e });
  i = document.createElement("div"), i.classList.add("debug-gui"), i.appendChild(s.containerElem_), document.querySelector("t-hero-three"), t.gui = s;
}

function dh(t) {
  if (!t.gui) return;
  const i = t.gui.addFolder({ title: "Stats", index: 0 }), s = {
    fps: 60,
    programs: 0,
    geometries: 0,
    textureMemory: 0,
    geometryMemory: 0,
    textures: 0,
    drawcalls: 0,
    triangles: 0,
    matrixUpdates: 0
  };
  for (const c in s) {
    const u = { interval: 30, readonly: !0 };
    c !== "fps" && (u.format = p => Math.floor(p)), (c === "textureMemory" || c === "geometryMemory") && (u.format = p => ~~p + "mb"), s["_" + c] = i.addBinding(s, c, u);
  }
  let n = 0, r = performance.now();
  
  function o() {
    const c = performance.now(), u = c - r;
    if (u > 1e3) {
      const p = n * 1e3 / u;
      n = 0, r = c, s.fps !== p && (s.fps = p, s._fps.refresh());
    }
    n++;
  }
  
  let a = performance.now();
  
  function l() {
    const c = performance.now();
    if (c - a < 200) return;
    a = c;
    const p = t.threeRenderer.info, d = p.programs.length;
    d !== s.programs && (s.programs = d, s._programs.refresh());
    const f = p.memory.geometries;
    f !== s.geometries && (s.geometries = f, s._geometries.refresh());
    const m = p.memory.textures;
    m !== s.textures && (s.textures = m, s._textures.refresh());
    const B = p.render.calls;
    B !== s.drawcalls && (s.drawcalls = B, s._drawcalls.refresh());
    const v = p.render.triangles;
    v !== s.triangles && (s.triangles = v, s._triangles.refresh());
    const x = p.memory.geometries;
    x !== s.geometryMemory && (s.geometryMemory = x, s._geometryMemory.refresh());
    const g = p.memory.textures;
    g !== s.textureMemory && (s.textureMemory = g, s._textureMemory.refresh());
  }
  
  function h() {
    l(), o();
  }
  
  t.hooks.afterFrame.watch(h);
}

const ks = { type: "change" }, $i = { type: "start" }, tr = { type: "end" }, Tt = new dr, Rs = new js,
  ph = Math.cos(70 * pr.DEG2RAD), U = new E, j = 2 * Math.PI, k = {
    NONE: -1,
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
    TOUCH_ROTATE: 3,
    TOUCH_PAN: 4,
    TOUCH_DOLLY_PAN: 5,
    TOUCH_DOLLY_ROTATE: 6
  }, ri = 1e-6;

class mh extends ur {
  constructor(e, i = null) {
    super(e, i), this.state = k.NONE, this.enabled = !0, this.target = new E, this.cursor = new E, this.minDistance = 0, this.maxDistance = 1 / 0, this.minZoom = 0, this.maxZoom = 1 / 0, this.minTargetRadius = 0, this.maxTargetRadius = 1 / 0, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -1 / 0, this.maxAzimuthAngle = 1 / 0, this.enableDamping = !1, this.dampingFactor = .05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.keyRotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = {
      LEFT: "ArrowLeft",
      UP: "ArrowUp",
      RIGHT: "ArrowRight",
      BOTTOM: "ArrowDown"
    }, this.mouseButtons = { LEFT: ze.ROTATE, MIDDLE: ze.DOLLY, RIGHT: ze.PAN }, this.touches = {
      ONE: Ie.ROTATE,
      TWO: Ie.DOLLY_PAN
    }, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._domElementKeyEvents = null, this._lastPosition = new E, this._lastQuaternion = new Qi, this._lastTargetPosition = new E, this._quat = new Qi().setFromUnitVectors(e.up, new E(0, 1, 0)), this._quatInverse = this._quat.clone().invert(), this._spherical = new Ji, this._sphericalDelta = new Ji, this._scale = 1, this._panOffset = new E, this._rotateStart = new b, this._rotateEnd = new b, this._rotateDelta = new b, this._panStart = new b, this._panEnd = new b, this._panDelta = new b, this._dollyStart = new b, this._dollyEnd = new b, this._dollyDelta = new b, this._dollyDirection = new E, this._mouse = new b, this._performCursorZoom = !1, this._pointers = [], this._pointerPositions = {}, this._controlActive = !1, this._onPointerMove = fh.bind(this), this._onPointerDown = vh.bind(this), this._onPointerUp = bh.bind(this), this._onContextMenu = Ch.bind(this), this._onMouseWheel = wh.bind(this), this._onKeyDown = xh.bind(this), this._onTouchStart = yh.bind(this), this._onTouchMove = Ph.bind(this), this._onMouseDown = gh.bind(this), this._onMouseMove = _h.bind(this), this._interceptControlDown = Eh.bind(this), this._interceptControlUp = Sh.bind(this), this.domElement !== null && this.connect(), this.update();
  }
  
  connect() {
    this.domElement.addEventListener("pointerdown", this._onPointerDown), this.domElement.addEventListener("pointercancel", this._onPointerUp), this.domElement.addEventListener("contextmenu", this._onContextMenu), this.domElement.addEventListener("wheel", this._onMouseWheel, { passive: !1 }), this.domElement.getRootNode().addEventListener("keydown", this._interceptControlDown, {
      passive: !0,
      capture: !0
    }), this.domElement.style.touchAction = "none";
  }
  
  disconnect() {
    this.domElement.removeEventListener("pointerdown", this._onPointerDown), this.domElement.removeEventListener("pointermove", this._onPointerMove), this.domElement.removeEventListener("pointerup", this._onPointerUp), this.domElement.removeEventListener("pointercancel", this._onPointerUp), this.domElement.removeEventListener("wheel", this._onMouseWheel), this.domElement.removeEventListener("contextmenu", this._onContextMenu), this.stopListenToKeyEvents(), this.domElement.getRootNode().removeEventListener("keydown", this._interceptControlDown, { capture: !0 }), this.domElement.style.touchAction = "auto";
  }
  
  dispose() {
    this.disconnect();
  }
  
  getPolarAngle() {
    return this._spherical.phi;
  }
  
  getAzimuthalAngle() {
    return this._spherical.theta;
  }
  
  getDistance() {
    return this.object.position.distanceTo(this.target);
  }
  
  listenToKeyEvents(e) {
    e.addEventListener("keydown", this._onKeyDown), this._domElementKeyEvents = e;
  }
  
  stopListenToKeyEvents() {
    this._domElementKeyEvents !== null && (this._domElementKeyEvents.removeEventListener("keydown", this._onKeyDown), this._domElementKeyEvents = null);
  }
  
  saveState() {
    this.target0.copy(this.target), this.position0.copy(this.object.position), this.zoom0 = this.object.zoom;
  }
  
  reset() {
    this.target.copy(this.target0), this.object.position.copy(this.position0), this.object.zoom = this.zoom0, this.object.updateProjectionMatrix(), this.dispatchEvent(ks), this.update(), this.state = k.NONE;
  }
  
  update(e = null) {
    const i = this.object.position;
    U.copy(i).sub(this.target), U.applyQuaternion(this._quat), this._spherical.setFromVector3(U), this.autoRotate && this.state === k.NONE && this._rotateLeft(this._getAutoRotationAngle(e)), this.enableDamping ? (this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor, this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor) : (this._spherical.theta += this._sphericalDelta.theta, this._spherical.phi += this._sphericalDelta.phi);
    let s = this.minAzimuthAngle, n = this.maxAzimuthAngle;
    isFinite(s) && isFinite(n) && (s < -Math.PI ? s += j : s > Math.PI && (s -= j), n < -Math.PI ? n += j : n > Math.PI && (n -= j), s <= n ? this._spherical.theta = Math.max(s, Math.min(n, this._spherical.theta)) : this._spherical.theta = this._spherical.theta > (s + n) / 2 ? Math.max(s, this._spherical.theta) : Math.min(n, this._spherical.theta)), this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi)), this._spherical.makeSafe(), this.enableDamping === !0 ? this.target.addScaledVector(this._panOffset, this.dampingFactor) : this.target.add(this._panOffset), this.target.sub(this.cursor), this.target.clampLength(this.minTargetRadius, this.maxTargetRadius), this.target.add(this.cursor);
    let r = !1;
    if (this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera) this._spherical.radius = this._clampDistance(this._spherical.radius); else {
      const o = this._spherical.radius;
      this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale), r = o != this._spherical.radius;
    }
    if (U.setFromSpherical(this._spherical), U.applyQuaternion(this._quatInverse), i.copy(this.target).add(U), this.object.lookAt(this.target), this.enableDamping === !0 ? (this._sphericalDelta.theta *= 1 - this.dampingFactor, this._sphericalDelta.phi *= 1 - this.dampingFactor, this._panOffset.multiplyScalar(1 - this.dampingFactor)) : (this._sphericalDelta.set(0, 0, 0), this._panOffset.set(0, 0, 0)), this.zoomToCursor && this._performCursorZoom) {
      let o = null;
      if (this.object.isPerspectiveCamera) {
        const a = U.length();
        o = this._clampDistance(a * this._scale);
        const l = a - o;
        this.object.position.addScaledVector(this._dollyDirection, l), this.object.updateMatrixWorld(), r = !!l;
      } else if (this.object.isOrthographicCamera) {
        const a = new E(this._mouse.x, this._mouse.y, 0);
        a.unproject(this.object);
        const l = this.object.zoom;
        this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), this.object.updateProjectionMatrix(), r = l !== this.object.zoom;
        const h = new E(this._mouse.x, this._mouse.y, 0);
        h.unproject(this.object), this.object.position.sub(h).add(a), this.object.updateMatrixWorld(), o = U.length();
      } else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."), this.zoomToCursor = !1;
      o !== null && (this.screenSpacePanning ? this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position) : (Tt.origin.copy(this.object.position), Tt.direction.set(0, 0, -1).transformDirection(this.object.matrix), Math.abs(this.object.up.dot(Tt.direction)) < ph ? this.object.lookAt(this.target) : (Rs.setFromNormalAndCoplanarPoint(this.object.up, this.target), Tt.intersectPlane(Rs, this.target))));
    } else if (this.object.isOrthographicCamera) {
      const o = this.object.zoom;
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), o !== this.object.zoom && (this.object.updateProjectionMatrix(), r = !0);
    }
    return this._scale = 1, this._performCursorZoom = !1, r || this._lastPosition.distanceToSquared(this.object.position) > ri || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > ri || this._lastTargetPosition.distanceToSquared(this.target) > ri ? (this.dispatchEvent(ks), this._lastPosition.copy(this.object.position), this._lastQuaternion.copy(this.object.quaternion), this._lastTargetPosition.copy(this.target), !0) : !1;
  }
  
  _getAutoRotationAngle(e) {
    return e !== null ? j / 60 * this.autoRotateSpeed * e : j / 60 / 60 * this.autoRotateSpeed;
  }
  
  _getZoomScale(e) {
    const i = Math.abs(e * .01);
    return Math.pow(.95, this.zoomSpeed * i);
  }
  
  _rotateLeft(e) {
    this._sphericalDelta.theta -= e;
  }
  
  _rotateUp(e) {
    this._sphericalDelta.phi -= e;
  }
  
  _panLeft(e, i) {
    U.setFromMatrixColumn(i, 0), U.multiplyScalar(-e), this._panOffset.add(U);
  }
  
  _panUp(e, i) {
    this.screenSpacePanning === !0 ? U.setFromMatrixColumn(i, 1) : (U.setFromMatrixColumn(i, 0), U.crossVectors(this.object.up, U)), U.multiplyScalar(e), this._panOffset.add(U);
  }
  
  _pan(e, i) {
    const s = this.domElement;
    if (this.object.isPerspectiveCamera) {
      const n = this.object.position;
      U.copy(n).sub(this.target);
      let r = U.length();
      r *= Math.tan(this.object.fov / 2 * Math.PI / 180), this._panLeft(2 * e * r / s.clientHeight, this.object.matrix), this._panUp(2 * i * r / s.clientHeight, this.object.matrix);
    } else this.object.isOrthographicCamera ? (this._panLeft(e * (this.object.right - this.object.left) / this.object.zoom / s.clientWidth, this.object.matrix), this._panUp(i * (this.object.top - this.object.bottom) / this.object.zoom / s.clientHeight, this.object.matrix)) : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."), this.enablePan = !1);
  }
  
  _dollyOut(e) {
    this.object.isPerspectiveCamera || this.object.isOrthographicCamera ? this._scale /= e : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), this.enableZoom = !1);
  }
  
  _dollyIn(e) {
    this.object.isPerspectiveCamera || this.object.isOrthographicCamera ? this._scale *= e : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), this.enableZoom = !1);
  }
  
  _updateZoomParameters(e, i) {
    if (!this.zoomToCursor) return;
    this._performCursorZoom = !0;
    const s = this.domElement.getBoundingClientRect(), n = e - s.left, r = i - s.top, o = s.width, a = s.height;
    this._mouse.x = n / o * 2 - 1, this._mouse.y = -(r / a) * 2 + 1, this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize();
  }
  
  _clampDistance(e) {
    return Math.max(this.minDistance, Math.min(this.maxDistance, e));
  }
  
  _handleMouseDownRotate(e) {
    this._rotateStart.set(e.clientX, e.clientY);
  }
  
  _handleMouseDownDolly(e) {
    this._updateZoomParameters(e.clientX, e.clientX), this._dollyStart.set(e.clientX, e.clientY);
  }
  
  _handleMouseDownPan(e) {
    this._panStart.set(e.clientX, e.clientY);
  }
  
  _handleMouseMoveRotate(e) {
    this._rotateEnd.set(e.clientX, e.clientY), this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const i = this.domElement;
    this._rotateLeft(j * this._rotateDelta.x / i.clientHeight), this._rotateUp(j * this._rotateDelta.y / i.clientHeight), this._rotateStart.copy(this._rotateEnd), this.update();
  }
  
  _handleMouseMoveDolly(e) {
    this._dollyEnd.set(e.clientX, e.clientY), this._dollyDelta.subVectors(this._dollyEnd, this._dollyStart), this._dollyDelta.y > 0 ? this._dollyOut(this._getZoomScale(this._dollyDelta.y)) : this._dollyDelta.y < 0 && this._dollyIn(this._getZoomScale(this._dollyDelta.y)), this._dollyStart.copy(this._dollyEnd), this.update();
  }
  
  _handleMouseMovePan(e) {
    this._panEnd.set(e.clientX, e.clientY), this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd), this.update();
  }
  
  _handleMouseWheel(e) {
    this._updateZoomParameters(e.clientX, e.clientY), e.deltaY < 0 ? this._dollyIn(this._getZoomScale(e.deltaY)) : e.deltaY > 0 && this._dollyOut(this._getZoomScale(e.deltaY)), this.update();
  }
  
  _handleKeyDown(e) {
    let i = !1;
    switch (e.code) {
      case this.keys.UP:
        e.ctrlKey || e.metaKey || e.shiftKey ? this.enableRotate && this._rotateUp(j * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, this.keyPanSpeed), i = !0;
        break;
      case this.keys.BOTTOM:
        e.ctrlKey || e.metaKey || e.shiftKey ? this.enableRotate && this._rotateUp(-j * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, -this.keyPanSpeed), i = !0;
        break;
      case this.keys.LEFT:
        e.ctrlKey || e.metaKey || e.shiftKey ? this.enableRotate && this._rotateLeft(j * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(this.keyPanSpeed, 0), i = !0;
        break;
      case this.keys.RIGHT:
        e.ctrlKey || e.metaKey || e.shiftKey ? this.enableRotate && this._rotateLeft(-j * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(-this.keyPanSpeed, 0), i = !0;
        break;
    }
    i && (e.preventDefault(), this.update());
  }
  
  _handleTouchStartRotate(e) {
    if (this._pointers.length === 1) this._rotateStart.set(e.pageX, e.pageY); else {
      const i = this._getSecondPointerPosition(e), s = .5 * (e.pageX + i.x), n = .5 * (e.pageY + i.y);
      this._rotateStart.set(s, n);
    }
  }
  
  _handleTouchStartPan(e) {
    if (this._pointers.length === 1) this._panStart.set(e.pageX, e.pageY); else {
      const i = this._getSecondPointerPosition(e), s = .5 * (e.pageX + i.x), n = .5 * (e.pageY + i.y);
      this._panStart.set(s, n);
    }
  }
  
  _handleTouchStartDolly(e) {
    const i = this._getSecondPointerPosition(e), s = e.pageX - i.x, n = e.pageY - i.y, r = Math.sqrt(s * s + n * n);
    this._dollyStart.set(0, r);
  }
  
  _handleTouchStartDollyPan(e) {
    this.enableZoom && this._handleTouchStartDolly(e), this.enablePan && this._handleTouchStartPan(e);
  }
  
  _handleTouchStartDollyRotate(e) {
    this.enableZoom && this._handleTouchStartDolly(e), this.enableRotate && this._handleTouchStartRotate(e);
  }
  
  _handleTouchMoveRotate(e) {
    if (this._pointers.length == 1) this._rotateEnd.set(e.pageX, e.pageY); else {
      const s = this._getSecondPointerPosition(e), n = .5 * (e.pageX + s.x), r = .5 * (e.pageY + s.y);
      this._rotateEnd.set(n, r);
    }
    this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const i = this.domElement;
    this._rotateLeft(j * this._rotateDelta.x / i.clientHeight), this._rotateUp(j * this._rotateDelta.y / i.clientHeight), this._rotateStart.copy(this._rotateEnd);
  }
  
  _handleTouchMovePan(e) {
    if (this._pointers.length === 1) this._panEnd.set(e.pageX, e.pageY); else {
      const i = this._getSecondPointerPosition(e), s = .5 * (e.pageX + i.x), n = .5 * (e.pageY + i.y);
      this._panEnd.set(s, n);
    }
    this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd);
  }
  
  _handleTouchMoveDolly(e) {
    const i = this._getSecondPointerPosition(e), s = e.pageX - i.x, n = e.pageY - i.y, r = Math.sqrt(s * s + n * n);
    this._dollyEnd.set(0, r), this._dollyDelta.set(0, Math.pow(this._dollyEnd.y / this._dollyStart.y, this.zoomSpeed)), this._dollyOut(this._dollyDelta.y), this._dollyStart.copy(this._dollyEnd);
    const o = (e.pageX + i.x) * .5, a = (e.pageY + i.y) * .5;
    this._updateZoomParameters(o, a);
  }
  
  _handleTouchMoveDollyPan(e) {
    this.enableZoom && this._handleTouchMoveDolly(e), this.enablePan && this._handleTouchMovePan(e);
  }
  
  _handleTouchMoveDollyRotate(e) {
    this.enableZoom && this._handleTouchMoveDolly(e), this.enableRotate && this._handleTouchMoveRotate(e);
  }
  
  _addPointer(e) {
    this._pointers.push(e.pointerId);
  }
  
  _removePointer(e) {
    delete this._pointerPositions[e.pointerId];
    for (let i = 0; i < this._pointers.length; i++) if (this._pointers[i] == e.pointerId) {
      this._pointers.splice(i, 1);
      return;
    }
  }
  
  _isTrackingPointer(e) {
    for (let i = 0; i < this._pointers.length; i++) if (this._pointers[i] == e.pointerId) return !0;
    return !1;
  }
  
  _trackPointer(e) {
    let i = this._pointerPositions[e.pointerId];
    i === void 0 && (i = new b, this._pointerPositions[e.pointerId] = i), i.set(e.pageX, e.pageY);
  }
  
  _getSecondPointerPosition(e) {
    const i = e.pointerId === this._pointers[0] ? this._pointers[1] : this._pointers[0];
    return this._pointerPositions[i];
  }
  
  _customWheelEvent(e) {
    const i = e.deltaMode, s = { clientX: e.clientX, clientY: e.clientY, deltaY: e.deltaY };
    switch (i) {
      case 1:
        s.deltaY *= 16;
        break;
      case 2:
        s.deltaY *= 100;
        break;
    }
    return e.ctrlKey && !this._controlActive && (s.deltaY *= 10), s;
  }
}

function vh(t) {
  this.enabled !== !1 && (this._pointers.length === 0 && (this.domElement.setPointerCapture(t.pointerId), this.domElement.addEventListener("pointermove", this._onPointerMove), this.domElement.addEventListener("pointerup", this._onPointerUp)), !this._isTrackingPointer(t) && (this._addPointer(t), t.pointerType === "touch" ? this._onTouchStart(t) : this._onMouseDown(t)));
}

function fh(t) {
  this.enabled !== !1 && (t.pointerType === "touch" ? this._onTouchMove(t) : this._onMouseMove(t));
}

function bh(t) {
  switch (this._removePointer(t), this._pointers.length) {
    case 0:
      this.domElement.releasePointerCapture(t.pointerId), this.domElement.removeEventListener("pointermove", this._onPointerMove), this.domElement.removeEventListener("pointerup", this._onPointerUp), this.dispatchEvent(tr), this.state = k.NONE;
      break;
    case 1:
      const e = this._pointers[0], i = this._pointerPositions[e];
      this._onTouchStart({ pointerId: e, pageX: i.x, pageY: i.y });
      break;
  }
}

function gh(t) {
  let e;
  switch (t.button) {
    case 0:
      e = this.mouseButtons.LEFT;
      break;
    case 1:
      e = this.mouseButtons.MIDDLE;
      break;
    case 2:
      e = this.mouseButtons.RIGHT;
      break;
    default:
      e = -1;
  }
  switch (e) {
    case ze.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseDownDolly(t), this.state = k.DOLLY;
      break;
    case ze.ROTATE:
      if (t.ctrlKey || t.metaKey || t.shiftKey) {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(t), this.state = k.PAN;
      } else {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(t), this.state = k.ROTATE;
      }
      break;
    case ze.PAN:
      if (t.ctrlKey || t.metaKey || t.shiftKey) {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(t), this.state = k.ROTATE;
      } else {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(t), this.state = k.PAN;
      }
      break;
    default:
      this.state = k.NONE;
  }
  this.state !== k.NONE && this.dispatchEvent($i);
}

function _h(t) {
  switch (this.state) {
    case k.ROTATE:
      if (this.enableRotate === !1) return;
      this._handleMouseMoveRotate(t);
      break;
    case k.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseMoveDolly(t);
      break;
    case k.PAN:
      if (this.enablePan === !1) return;
      this._handleMouseMovePan(t);
      break;
  }
}

function wh(t) {
  this.enabled === !1 || this.enableZoom === !1 || this.state !== k.NONE || (t.preventDefault(), this.dispatchEvent($i), this._handleMouseWheel(this._customWheelEvent(t)), this.dispatchEvent(tr));
}

function xh(t) {
  this.enabled !== !1 && this._handleKeyDown(t);
}

function yh(t) {
  switch (this._trackPointer(t), this._pointers.length) {
    case 1:
      switch (this.touches.ONE) {
        case Ie.ROTATE:
          if (this.enableRotate === !1) return;
          this._handleTouchStartRotate(t), this.state = k.TOUCH_ROTATE;
          break;
        case Ie.PAN:
          if (this.enablePan === !1) return;
          this._handleTouchStartPan(t), this.state = k.TOUCH_PAN;
          break;
        default:
          this.state = k.NONE;
      }
      break;
    case 2:
      switch (this.touches.TWO) {
        case Ie.DOLLY_PAN:
          if (this.enableZoom === !1 && this.enablePan === !1) return;
          this._handleTouchStartDollyPan(t), this.state = k.TOUCH_DOLLY_PAN;
          break;
        case Ie.DOLLY_ROTATE:
          if (this.enableZoom === !1 && this.enableRotate === !1) return;
          this._handleTouchStartDollyRotate(t), this.state = k.TOUCH_DOLLY_ROTATE;
          break;
        default:
          this.state = k.NONE;
      }
      break;
    default:
      this.state = k.NONE;
  }
  this.state !== k.NONE && this.dispatchEvent($i);
}

function Ph(t) {
  switch (this._trackPointer(t), this.state) {
    case k.TOUCH_ROTATE:
      if (this.enableRotate === !1) return;
      this._handleTouchMoveRotate(t), this.update();
      break;
    case k.TOUCH_PAN:
      if (this.enablePan === !1) return;
      this._handleTouchMovePan(t), this.update();
      break;
    case k.TOUCH_DOLLY_PAN:
      if (this.enableZoom === !1 && this.enablePan === !1) return;
      this._handleTouchMoveDollyPan(t), this.update();
      break;
    case k.TOUCH_DOLLY_ROTATE:
      if (this.enableZoom === !1 && this.enableRotate === !1) return;
      this._handleTouchMoveDollyRotate(t), this.update();
      break;
    default:
      this.state = k.NONE;
  }
}

function Ch(t) {
  this.enabled !== !1 && t.preventDefault();
}

function Eh(t) {
  t.key === "Control" && (this._controlActive = !0, this.domElement.getRootNode().addEventListener("keyup", this._interceptControlUp, {
    passive: !0,
    capture: !0
  }));
}

function Sh(t) {
  t.key === "Control" && (this._controlActive = !1, this.domElement.getRootNode().removeEventListener("keyup", this._interceptControlUp, {
    passive: !0,
    capture: !0
  }));
}

const Mh = new mr;

async function Th(t, e = {}) {
  const i = await new Promise((s, n) => {
    Mh.load(t, r => {
      e.onLoad && e.onLoad(r), s(r);
    }, r => {
      e.onProgress && r.lengthComputable && e.onProgress(r);
    }, r => {
      console.error("Erreur lors du chargement de la texture:", r), n(r);
    });
  });
  return e.flipY !== void 0 && (i.flipY = e.flipY), e.magFilter && (i.magFilter = e.magFilter), e.minFilter && (i.minFilter = e.minFilter), e.repeat ? (i.wrapS = es, i.wrapT = es) : (e.wrapS && (i.wrapS = e.wrapS), e.wrapT && (i.wrapT = e.wrapT)), i;
}

function kh(t) {
  const e = { geometries: {}, textures: {}, videos: {}, init: l, preload: h },
    i = { low: "_low", medium: "_med", high: "" }, s = new Ar, n = new Dr;
  n.setDecoderPath("/draco/"), s.setDRACOLoader(n);
  let r = 0, o = 0;
  
  function a(d = 1) {
    o += d;
    const f = Math.floor(o / r * 100);
    t.states.loadingProgress = f;
  }
  
  async function l() {
  }
  
  async function h() {
    t.deviceCapabilities && i[t.deviceCapabilities.tier];
    const d = [["https://cdn.shopify.com/s/files/1/0860/9710/1127/files/shadows.png?v=1741099299", "shadows"], ["https://cdn.shopify.com/s/files/1/0860/9710/1127/files/normal.jpg?v=1741099298", "normal"]];
    let f = "https://cdn.shopify.com/3d/models/1ff1df9a066aea36/scene.glb";
    t.deviceCapabilities && t.deviceCapabilities.tier;
    const m = [f];
    t.deviceCapabilities && t.deviceCapabilities.tier === "low" || t.deviceCapabilities && t.deviceCapabilities.tier;
    const v = [window.three.videoUrl];
    r = d.length + m.length + v.length, o = 0, t.states.loadingProgress = 0;
    const x = [];
    d.forEach(([g, A]) => {
      x.push(Th(g, {
        repeat: A === "normal", flipY: !0, onLoad: F => {
          e.textures[A] = F, a();
        }, onProgress: F => {
          F.lengthComputable && F.loaded / F.total;
        }
      }));
    }), m.forEach(g => {
      x.push(c(g, {
        onLoad: A => {
          A.scene.children.forEach(Ve => {
            e.geometries[Ve.name.toLowerCase()] = Ve;
          }), a();
        }, onProgress: A => {
          A.lengthComputable && A.loaded / A.total;
        }
      }));
    }), v.forEach((g, A) => {
      x.push(p(g, {
        onLoad: F => {
          e.videos[`video${A + 1}`] = F, a();
        }
      }));
    }), await Promise.all(x);
  }
  
  async function c(d, f = {}) {
    return new Promise((m, B) => {
      s.load(d, v => {
        t.deviceCapabilities && t.deviceCapabilities.tier === "low" && u(v), f.onLoad && f.onLoad(v), m(v);
      }, v => {
        f.onProgress && f.onProgress(v);
      }, v => {
        console.error("Erreur lors du chargement du modèle:", v), B(v);
      });
    });
  }
  
  function u(d) {
    d.scene.traverse(m => {
      m.isMesh && (m.material && (m.material.flatShading = !0, m.material.roughness = Math.max(m.material.roughness || 0, .6), m.material.envMap = null, m.material.envMapIntensity = 0, m.material.map && (m.material.map.anisotropy = 1, m.material.map.minFilter = THREE.LinearFilter), t.deviceCapabilities.isMobile && (m.material.normalMap = null, m.material.displacementMap = null, m.material.metalnessMap = null, m.material.roughnessMap = null)), m.castShadow = !1, m.receiveShadow = !1);
    });
  }
  
  async function p(d, f = {}) {
    return new Promise((m, B) => {
      const v = document.createElement("video"),
        x = { src: d, muted: !0, loop: !0, autoplay: !1, playsInline: !0, preload: "auto", crossOrigin: "anonymous" };
      t.deviceCapabilities && (t.deviceCapabilities.tier === "low" || t.deviceCapabilities.isMobile) && v.addEventListener("canplay", () => {
        v.duration > 0 && (v.playbackRate = .8);
      }), Object.assign(v, x);
      let g = !1;
      v.addEventListener("loadedmetadata", () => {
      }), v.addEventListener("progress", () => {
        v.buffered.length > 0 && v.buffered.end(0) / v.duration * 100 >= 95 && !g && (g = !0, f.onLoad && f.onLoad(v), m(v));
      }), v.addEventListener("canplaythrough", () => {
        g || (g = !0, f.onLoad && f.onLoad(v), m(v));
      }), v.addEventListener("error", A => {
        console.error("Erreur lors du chargement de la vidéo:", A), B(A);
      }), v.load();
    });
  }
  
  t.loader = e, t.textures = e.textures = {}, t.geometries = e.geometries = {}, t.videos = e.videos = {};
}

/**
 * postprocessing v6.37.1 build Thu Mar 06 2025
 * https://github.com/pmndrs/postprocessing
 * Copyright 2015-2025 Raoul van Rüschen
 * @license Zlib
 */var oi = 1 / 1e3, Rh = 1e3, Ah = class {
    constructor() {
      this.startTime = performance.now(), this.previousTime = 0, this.currentTime = 0, this._delta = 0, this._elapsed = 0, this._fixedDelta = 1e3 / 60, this.timescale = 1, this.useFixedDelta = !1, this._autoReset = !1;
    }
    
    get autoReset() {
      return this._autoReset;
    }
    
    set autoReset(t) {
      typeof document < "u" && document.hidden !== void 0 && (t ? document.addEventListener("visibilitychange", this) : document.removeEventListener("visibilitychange", this), this._autoReset = t);
    }
    
    get delta() {
      return this._delta * oi;
    }
    
    get fixedDelta() {
      return this._fixedDelta * oi;
    }
    
    set fixedDelta(t) {
      this._fixedDelta = t * Rh;
    }
    
    get elapsed() {
      return this._elapsed * oi;
    }
    
    update(t) {
      this.useFixedDelta ? this._delta = this.fixedDelta : (this.previousTime = this.currentTime, this.currentTime = (t !== void 0 ? t : performance.now()) - this.startTime, this._delta = this.currentTime - this.previousTime), this._delta *= this.timescale, this._elapsed += this._delta;
    }
    
    reset() {
      this._delta = 0, this._elapsed = 0, this.currentTime = performance.now() - this.startTime;
    }
    
    getDelta() {
      return this.delta;
    }
    
    getElapsed() {
      return this.elapsed;
    }
    
    handleEvent(t) {
      document.hidden || (this.currentTime = performance.now() - this.startTime);
    }
    
    dispose() {
      this.autoReset = !1;
    }
  }, Dh = (() => {
    const t = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), e = new Float32Array([0, 0, 2, 0, 0, 2]), i = new Zs;
    return i.setAttribute("position", new hi(t, 3)), i.setAttribute("uv", new hi(e, 2)), i;
  })(), J = class _i {
    static get fullscreenGeometry() {
      return Dh;
    }
    
    constructor(e = "Pass", i = new ci, s = new qs) {
      this.name = e, this.renderer = null, this.scene = i, this.camera = s, this.screen = null, this.rtt = !0, this.needsSwap = !0, this.needsDepthTexture = !1, this.enabled = !0;
    }
    
    get renderToScreen() {
      return !this.rtt;
    }
    
    set renderToScreen(e) {
      if (this.rtt === e) {
        const i = this.fullscreenMaterial;
        i !== null && (i.needsUpdate = !0), this.rtt = !e;
      }
    }
    
    set mainScene(e) {
    }
    
    set mainCamera(e) {
    }
    
    setRenderer(e) {
      this.renderer = e;
    }
    
    isEnabled() {
      return this.enabled;
    }
    
    setEnabled(e) {
      this.enabled = e;
    }
    
    get fullscreenMaterial() {
      return this.screen !== null ? this.screen.material : null;
    }
    
    set fullscreenMaterial(e) {
      let i = this.screen;
      i !== null ? i.material = e : (i = new _e(_i.fullscreenGeometry, e), i.frustumCulled = !1, this.scene === null && (this.scene = new ci), this.scene.add(i), this.screen = i);
    }
    
    getFullscreenMaterial() {
      return this.fullscreenMaterial;
    }
    
    setFullscreenMaterial(e) {
      this.fullscreenMaterial = e;
    }
    
    getDepthTexture() {
      return null;
    }
    
    setDepthTexture(e, i = Ft) {
    }
    
    render(e, i, s, n, r) {
      throw new Error("Render method not implemented!");
    }
    
    setSize(e, i) {
    }
    
    initialize(e, i, s) {
    }
    
    dispose() {
      for (const e of Object.keys(this)) {
        const i = this[e];
        (i instanceof re || i instanceof Ys || i instanceof Xs || i instanceof _i) && this[e].dispose();
      }
      this.fullscreenMaterial !== null && this.fullscreenMaterial.dispose();
    }
  }, Lh = class extends J {
    constructor() {
      super("ClearMaskPass", null, null), this.needsSwap = !1;
    }
    
    render(t, e, i, s, n) {
      const r = t.state.buffers.stencil;
      r.setLocked(!1), r.setTest(!1);
    }
  }, Bh = `#include <common>
#include <dithering_pars_fragment>
#ifdef FRAMEBUFFER_PRECISION_HIGH
uniform mediump sampler2D inputBuffer;
#else
uniform lowp sampler2D inputBuffer;
#endif
uniform float opacity;varying vec2 vUv;void main(){vec4 texel=texture2D(inputBuffer,vUv);gl_FragColor=opacity*texel;
#include <colorspace_fragment>
#include <dithering_fragment>
}`, ir = "varying vec2 vUv;void main(){vUv=position.xy*0.5+0.5;gl_Position=vec4(position.xy,1.0,1.0);}",
  sr = class extends K {
    constructor() {
      super({
        name: "CopyMaterial",
        uniforms: { inputBuffer: new y(null), opacity: new y(1) },
        blending: We,
        toneMapped: !1,
        depthWrite: !1,
        depthTest: !1,
        fragmentShader: Bh,
        vertexShader: ir
      });
    }
    
    set inputBuffer(t) {
      this.uniforms.inputBuffer.value = t;
    }
    
    setInputBuffer(t) {
      this.uniforms.inputBuffer.value = t;
    }
    
    getOpacity(t) {
      return this.uniforms.opacity.value;
    }
    
    setOpacity(t) {
      this.uniforms.opacity.value = t;
    }
  }, nr = class extends J {
    constructor(t, e = !0) {
      super("CopyPass"), this.fullscreenMaterial = new sr, this.needsSwap = !1, this.renderTarget = t, t === void 0 && (this.renderTarget = new re(1, 1, {
        minFilter: ie,
        magFilter: ie,
        stencilBuffer: !1,
        depthBuffer: !1
      }), this.renderTarget.texture.name = "CopyPass.Target"), this.autoResize = e;
    }
    
    get resize() {
      return this.autoResize;
    }
    
    set resize(t) {
      this.autoResize = t;
    }
    
    get texture() {
      return this.renderTarget.texture;
    }
    
    getTexture() {
      return this.renderTarget.texture;
    }
    
    setAutoResizeEnabled(t) {
      this.autoResize = t;
    }
    
    render(t, e, i, s, n) {
      this.fullscreenMaterial.inputBuffer = e.texture, t.setRenderTarget(this.renderToScreen ? null : this.renderTarget), t.render(this.scene, this.camera);
    }
    
    setSize(t, e) {
      this.autoResize && this.renderTarget.setSize(t, e);
    }
    
    initialize(t, e, i) {
      i !== void 0 && (this.renderTarget.texture.type = i, i !== Te ? this.fullscreenMaterial.defines.FRAMEBUFFER_PRECISION_HIGH = "1" : t !== null && t.outputColorSpace === z && (this.renderTarget.texture.colorSpace = z));
    }
  }, As = new st, rr = class extends J {
    constructor(t = !0, e = !0, i = !1) {
      super("ClearPass", null, null), this.needsSwap = !1, this.color = t, this.depth = e, this.stencil = i, this.overrideClearColor = null, this.overrideClearAlpha = -1;
    }
    
    setClearFlags(t, e, i) {
      this.color = t, this.depth = e, this.stencil = i;
    }
    
    getOverrideClearColor() {
      return this.overrideClearColor;
    }
    
    setOverrideClearColor(t) {
      this.overrideClearColor = t;
    }
    
    getOverrideClearAlpha() {
      return this.overrideClearAlpha;
    }
    
    setOverrideClearAlpha(t) {
      this.overrideClearAlpha = t;
    }
    
    render(t, e, i, s, n) {
      const r = this.overrideClearColor, o = this.overrideClearAlpha, a = t.getClearAlpha(), l = r !== null, h = o >= 0;
      l ? (t.getClearColor(As), t.setClearColor(r, h ? o : a)) : h && t.setClearAlpha(o), t.setRenderTarget(this.renderToScreen ? null : e), t.clear(this.color, this.depth, this.stencil), l ? t.setClearColor(As, a) : h && t.setClearAlpha(a);
    }
  }, Vh = class extends J {
    constructor(t, e) {
      super("MaskPass", t, e), this.needsSwap = !1, this.clearPass = new rr(!1, !1, !0), this.inverse = !1;
    }
    
    set mainScene(t) {
      this.scene = t;
    }
    
    set mainCamera(t) {
      this.camera = t;
    }
    
    get inverted() {
      return this.inverse;
    }
    
    set inverted(t) {
      this.inverse = t;
    }
    
    get clear() {
      return this.clearPass.enabled;
    }
    
    set clear(t) {
      this.clearPass.enabled = t;
    }
    
    getClearPass() {
      return this.clearPass;
    }
    
    isInverted() {
      return this.inverted;
    }
    
    setInverted(t) {
      this.inverted = t;
    }
    
    render(t, e, i, s, n) {
      const r = t.getContext(), o = t.state.buffers, a = this.scene, l = this.camera, h = this.clearPass,
        c = this.inverted ? 0 : 1, u = 1 - c;
      o.color.setMask(!1), o.depth.setMask(!1), o.color.setLocked(!0), o.depth.setLocked(!0), o.stencil.setTest(!0), o.stencil.setOp(r.REPLACE, r.REPLACE, r.REPLACE), o.stencil.setFunc(r.ALWAYS, c, 4294967295), o.stencil.setClear(u), o.stencil.setLocked(!0), this.clearPass.enabled && (this.renderToScreen ? h.render(t, null) : (h.render(t, e), h.render(t, i))), this.renderToScreen ? (t.setRenderTarget(null), t.render(a, l)) : (t.setRenderTarget(e), t.render(a, l), t.setRenderTarget(i), t.render(a, l)), o.color.setLocked(!1), o.depth.setLocked(!1), o.stencil.setLocked(!1), o.stencil.setFunc(r.EQUAL, 1, 4294967295), o.stencil.setOp(r.KEEP, r.KEEP, r.KEEP), o.stencil.setLocked(!0);
    }
  }, Oh = class {
    constructor(t = null, { depthBuffer: e = !0, stencilBuffer: i = !1, multisampling: s = 0, frameBufferType: n } = {}) {
      this.renderer = null, this.inputBuffer = this.createBuffer(e, i, n, s), this.outputBuffer = this.inputBuffer.clone(), this.copyPass = new nr, this.depthTexture = null, this.passes = [], this.timer = new Ah, this.autoRenderToScreen = !0, this.setRenderer(t);
    }
    
    get multisampling() {
      return this.inputBuffer.samples || 0;
    }
    
    set multisampling(t) {
      const e = this.inputBuffer, i = this.multisampling;
      i > 0 && t > 0 ? (this.inputBuffer.samples = t, this.outputBuffer.samples = t, this.inputBuffer.dispose(), this.outputBuffer.dispose()) : i !== t && (this.inputBuffer.dispose(), this.outputBuffer.dispose(), this.inputBuffer = this.createBuffer(e.depthBuffer, e.stencilBuffer, e.texture.type, t), this.inputBuffer.depthTexture = this.depthTexture, this.outputBuffer = this.inputBuffer.clone());
    }
    
    getTimer() {
      return this.timer;
    }
    
    getRenderer() {
      return this.renderer;
    }
    
    setRenderer(t) {
      if (this.renderer = t, t !== null) {
        const e = t.getSize(new b), i = t.getContext().getContextAttributes().alpha, s = this.inputBuffer.texture.type;
        s === Te && t.outputColorSpace === z && (this.inputBuffer.texture.colorSpace = z, this.outputBuffer.texture.colorSpace = z, this.inputBuffer.dispose(), this.outputBuffer.dispose()), t.autoClear = !1, this.setSize(e.width, e.height);
        for (const n of this.passes) n.initialize(t, i, s);
      }
    }
    
    replaceRenderer(t, e = !0) {
      const i = this.renderer, s = i.domElement.parentNode;
      return this.setRenderer(t), e && s !== null && (s.removeChild(i.domElement), s.appendChild(t.domElement)), i;
    }
    
    createDepthTexture() {
      const t = this.depthTexture = new Gs;
      return this.inputBuffer.depthTexture = t, this.inputBuffer.dispose(), this.inputBuffer.stencilBuffer ? (t.format = vr, t.type = fr) : t.type = br, t;
    }
    
    deleteDepthTexture() {
      if (this.depthTexture !== null) {
        this.depthTexture.dispose(), this.depthTexture = null, this.inputBuffer.depthTexture = null, this.inputBuffer.dispose();
        for (const t of this.passes) t.setDepthTexture(null);
      }
    }
    
    createBuffer(t, e, i, s) {
      const n = this.renderer, r = n === null ? new b : n.getDrawingBufferSize(new b),
        o = { minFilter: ie, magFilter: ie, stencilBuffer: e, depthBuffer: t, type: i }, a = new re(r.width, r.height, o);
      return s > 0 && (a.ignoreDepthForMultisampleCopy = !1, a.samples = s), i === Te && n !== null && n.outputColorSpace === z && (a.texture.colorSpace = z), a.texture.name = "EffectComposer.Buffer", a.texture.generateMipmaps = !1, a;
    }
    
    setMainScene(t) {
      for (const e of this.passes) e.mainScene = t;
    }
    
    setMainCamera(t) {
      for (const e of this.passes) e.mainCamera = t;
    }
    
    addPass(t, e) {
      const i = this.passes, s = this.renderer, n = s.getDrawingBufferSize(new b),
        r = s.getContext().getContextAttributes().alpha, o = this.inputBuffer.texture.type;
      if (t.setRenderer(s), t.setSize(n.width, n.height), t.initialize(s, r, o), this.autoRenderToScreen && (i.length > 0 && (i[i.length - 1].renderToScreen = !1), t.renderToScreen && (this.autoRenderToScreen = !1)), e !== void 0 ? i.splice(e, 0, t) : i.push(t), this.autoRenderToScreen && (i[i.length - 1].renderToScreen = !0), t.needsDepthTexture || this.depthTexture !== null) if (this.depthTexture === null) {
        const a = this.createDepthTexture();
        for (t of i) t.setDepthTexture(a);
      } else t.setDepthTexture(this.depthTexture);
    }
    
    removePass(t) {
      const e = this.passes, i = e.indexOf(t);
      if (i !== -1 && e.splice(i, 1).length > 0) {
        if (this.depthTexture !== null) {
          const r = (a, l) => a || l.needsDepthTexture;
          e.reduce(r, !1) || (t.getDepthTexture() === this.depthTexture && t.setDepthTexture(null), this.deleteDepthTexture());
        }
        this.autoRenderToScreen && i === e.length && (t.renderToScreen = !1, e.length > 0 && (e[e.length - 1].renderToScreen = !0));
      }
    }
    
    removeAllPasses() {
      const t = this.passes;
      this.deleteDepthTexture(), t.length > 0 && (this.autoRenderToScreen && (t[t.length - 1].renderToScreen = !1), this.passes = []);
    }
    
    render(t) {
      const e = this.renderer, i = this.copyPass;
      let s = this.inputBuffer, n = this.outputBuffer, r = !1, o, a, l;
      t === void 0 && (this.timer.update(), t = this.timer.getDelta());
      for (const h of this.passes) h.enabled && (h.render(e, s, n, t, r), h.needsSwap && (r && (i.renderToScreen = h.renderToScreen, o = e.getContext(), a = e.state.buffers.stencil, a.setFunc(o.NOTEQUAL, 1, 4294967295), i.render(e, s, n, t, r), a.setFunc(o.EQUAL, 1, 4294967295)), l = s, s = n, n = l), h instanceof Vh ? r = !0 : h instanceof Lh && (r = !1));
    }
    
    setSize(t, e, i) {
      const s = this.renderer, n = s.getSize(new b);
      (t === void 0 || e === void 0) && (t = n.width, e = n.height), (n.width !== t || n.height !== e) && s.setSize(t, e, i);
      const r = s.getDrawingBufferSize(new b);
      this.inputBuffer.setSize(r.width, r.height), this.outputBuffer.setSize(r.width, r.height);
      for (const o of this.passes) o.setSize(r.width, r.height);
    }
    
    reset() {
      this.dispose(), this.autoRenderToScreen = !0;
    }
    
    dispose() {
      for (const t of this.passes) t.dispose();
      this.passes = [], this.inputBuffer !== null && this.inputBuffer.dispose(), this.outputBuffer !== null && this.outputBuffer.dispose(), this.deleteDepthTexture(), this.copyPass.dispose(), this.timer.dispose(), J.fullscreenGeometry.dispose();
    }
  }, Me = { NONE: 0, DEPTH: 1, CONVOLUTION: 2 }, S = {
    FRAGMENT_HEAD: "FRAGMENT_HEAD",
    FRAGMENT_MAIN_UV: "FRAGMENT_MAIN_UV",
    FRAGMENT_MAIN_IMAGE: "FRAGMENT_MAIN_IMAGE",
    VERTEX_HEAD: "VERTEX_HEAD",
    VERTEX_MAIN_SUPPORT: "VERTEX_MAIN_SUPPORT"
  }, Uh = class {
    constructor() {
      this.shaderParts = new Map([[S.FRAGMENT_HEAD, null], [S.FRAGMENT_MAIN_UV, null], [S.FRAGMENT_MAIN_IMAGE, null], [S.VERTEX_HEAD, null], [S.VERTEX_MAIN_SUPPORT, null]]), this.defines = new Map, this.uniforms = new Map, this.blendModes = new Map, this.extensions = new Set, this.attributes = Me.NONE, this.varyings = new Set, this.uvTransformation = !1, this.readDepth = !1, this.colorSpace = Ws;
    }
  }, ai = !1, Ds = class {
    constructor(t = null) {
      this.originalMaterials = new Map, this.material = null, this.materials = null, this.materialsBackSide = null, this.materialsDoubleSide = null, this.materialsFlatShaded = null, this.materialsFlatShadedBackSide = null, this.materialsFlatShadedDoubleSide = null, this.setMaterial(t), this.meshCount = 0, this.replaceMaterial = e => {
        if (e.isMesh) {
          let i;
          if (e.material.flatShading) switch (e.material.side) {
            case we:
              i = this.materialsFlatShadedDoubleSide;
              break;
            case Et:
              i = this.materialsFlatShadedBackSide;
              break;
            default:
              i = this.materialsFlatShaded;
              break;
          } else switch (e.material.side) {
            case we:
              i = this.materialsDoubleSide;
              break;
            case Et:
              i = this.materialsBackSide;
              break;
            default:
              i = this.materials;
              break;
          }
          this.originalMaterials.set(e, e.material), e.isSkinnedMesh ? e.material = i[2] : e.isInstancedMesh ? e.material = i[1] : e.material = i[0], ++this.meshCount;
        }
      };
    }
    
    cloneMaterial(t) {
      if (!(t instanceof K)) return t.clone();
      const e = t.uniforms, i = new Map;
      for (const n in e) {
        const r = e[n].value;
        r.isRenderTargetTexture && (e[n].value = null, i.set(n, r));
      }
      const s = t.clone();
      for (const n of i) e[n[0]].value = n[1], s.uniforms[n[0]].value = n[1];
      return s;
    }
    
    setMaterial(t) {
      if (this.disposeMaterials(), this.material = t, t !== null) {
        const e = this.materials = [this.cloneMaterial(t), this.cloneMaterial(t), this.cloneMaterial(t)];
        for (const i of e) i.uniforms = Object.assign({}, t.uniforms), i.side = gr;
        e[2].skinning = !0, this.materialsBackSide = e.map(i => {
          const s = this.cloneMaterial(i);
          return s.uniforms = Object.assign({}, t.uniforms), s.side = Et, s;
        }), this.materialsDoubleSide = e.map(i => {
          const s = this.cloneMaterial(i);
          return s.uniforms = Object.assign({}, t.uniforms), s.side = we, s;
        }), this.materialsFlatShaded = e.map(i => {
          const s = this.cloneMaterial(i);
          return s.uniforms = Object.assign({}, t.uniforms), s.flatShading = !0, s;
        }), this.materialsFlatShadedBackSide = e.map(i => {
          const s = this.cloneMaterial(i);
          return s.uniforms = Object.assign({}, t.uniforms), s.flatShading = !0, s.side = Et, s;
        }), this.materialsFlatShadedDoubleSide = e.map(i => {
          const s = this.cloneMaterial(i);
          return s.uniforms = Object.assign({}, t.uniforms), s.flatShading = !0, s.side = we, s;
        });
      }
    }
    
    render(t, e, i) {
      const s = t.shadowMap.enabled;
      if (t.shadowMap.enabled = !1, ai) {
        const n = this.originalMaterials;
        this.meshCount = 0, e.traverse(this.replaceMaterial), t.render(e, i);
        for (const r of n) r[0].material = r[1];
        this.meshCount !== n.size && n.clear();
      } else {
        const n = e.overrideMaterial;
        e.overrideMaterial = this.material, t.render(e, i), e.overrideMaterial = n;
      }
      t.shadowMap.enabled = s;
    }
    
    disposeMaterials() {
      if (this.material !== null) {
        const t = this.materials.concat(this.materialsBackSide).concat(this.materialsDoubleSide).concat(this.materialsFlatShaded).concat(this.materialsFlatShadedBackSide).concat(this.materialsFlatShadedDoubleSide);
        for (const e of t) e.dispose();
      }
    }
    
    dispose() {
      this.originalMaterials.clear(), this.disposeMaterials();
    }
    
    static get workaroundEnabled() {
      return ai;
    }
    
    static set workaroundEnabled(t) {
      ai = t;
    }
  }, be = -1, te = class extends xi {
    constructor(t, e = be, i = be, s = 1) {
      super(), this.resizable = t, this.baseSize = new b(1, 1), this.preferredSize = new b(e, i), this.target = this.preferredSize, this.s = s, this.effectiveSize = new b, this.addEventListener("change", () => this.updateEffectiveSize()), this.updateEffectiveSize();
    }
    
    updateEffectiveSize() {
      const t = this.baseSize, e = this.preferredSize, i = this.effectiveSize, s = this.scale;
      e.width !== be ? i.width = e.width : e.height !== be ? i.width = Math.round(e.height * (t.width / Math.max(t.height, 1))) : i.width = Math.round(t.width * s), e.height !== be ? i.height = e.height : e.width !== be ? i.height = Math.round(e.width / Math.max(t.width / Math.max(t.height, 1), 1)) : i.height = Math.round(t.height * s);
    }
    
    get width() {
      return this.effectiveSize.width;
    }
    
    set width(t) {
      this.preferredWidth = t;
    }
    
    get height() {
      return this.effectiveSize.height;
    }
    
    set height(t) {
      this.preferredHeight = t;
    }
    
    getWidth() {
      return this.width;
    }
    
    getHeight() {
      return this.height;
    }
    
    get scale() {
      return this.s;
    }
    
    set scale(t) {
      this.s !== t && (this.s = t, this.preferredSize.setScalar(be), this.dispatchEvent({ type: "change" }), this.resizable.setSize(this.baseSize.width, this.baseSize.height));
    }
    
    getScale() {
      return this.scale;
    }
    
    setScale(t) {
      this.scale = t;
    }
    
    get baseWidth() {
      return this.baseSize.width;
    }
    
    set baseWidth(t) {
      this.baseSize.width !== t && (this.baseSize.width = t, this.dispatchEvent({ type: "change" }), this.resizable.setSize(this.baseSize.width, this.baseSize.height));
    }
    
    getBaseWidth() {
      return this.baseWidth;
    }
    
    setBaseWidth(t) {
      this.baseWidth = t;
    }
    
    get baseHeight() {
      return this.baseSize.height;
    }
    
    set baseHeight(t) {
      this.baseSize.height !== t && (this.baseSize.height = t, this.dispatchEvent({ type: "change" }), this.resizable.setSize(this.baseSize.width, this.baseSize.height));
    }
    
    getBaseHeight() {
      return this.baseHeight;
    }
    
    setBaseHeight(t) {
      this.baseHeight = t;
    }
    
    setBaseSize(t, e) {
      (this.baseSize.width !== t || this.baseSize.height !== e) && (this.baseSize.set(t, e), this.dispatchEvent({ type: "change" }), this.resizable.setSize(this.baseSize.width, this.baseSize.height));
    }
    
    get preferredWidth() {
      return this.preferredSize.width;
    }
    
    set preferredWidth(t) {
      this.preferredSize.width !== t && (this.preferredSize.width = t, this.dispatchEvent({ type: "change" }), this.resizable.setSize(this.baseSize.width, this.baseSize.height));
    }
    
    getPreferredWidth() {
      return this.preferredWidth;
    }
    
    setPreferredWidth(t) {
      this.preferredWidth = t;
    }
    
    get preferredHeight() {
      return this.preferredSize.height;
    }
    
    set preferredHeight(t) {
      this.preferredSize.height !== t && (this.preferredSize.height = t, this.dispatchEvent({ type: "change" }), this.resizable.setSize(this.baseSize.width, this.baseSize.height));
    }
    
    getPreferredHeight() {
      return this.preferredHeight;
    }
    
    setPreferredHeight(t) {
      this.preferredHeight = t;
    }
    
    setPreferredSize(t, e) {
      (this.preferredSize.width !== t || this.preferredSize.height !== e) && (this.preferredSize.set(t, e), this.dispatchEvent({ type: "change" }), this.resizable.setSize(this.baseSize.width, this.baseSize.height));
    }
    
    copy(t) {
      this.s = t.scale, this.baseSize.set(t.baseWidth, t.baseHeight), this.preferredSize.set(t.preferredWidth, t.preferredHeight), this.dispatchEvent({ type: "change" }), this.resizable.setSize(this.baseSize.width, this.baseSize.height);
    }
    
    static get AUTO_SIZE() {
      return be;
    }
  }, w = {
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
    VIVID_LIGHT: 32
  }, Ih = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,x+y,opacity);}",
  zh = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,y,min(y.a,opacity));}",
  Fh = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,(x+y)*0.5,opacity);}",
  Nh = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec3 xHSL=RGBToHSL(x.rgb);vec3 yHSL=RGBToHSL(y.rgb);vec3 z=HSLToRGB(vec3(yHSL.rg,xHSL.b));return vec4(mix(x.rgb,z,opacity),y.a);}",
  Hh = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec4 z=mix(step(0.0,y)*(1.0-min(vec4(1.0),(1.0-x)/y)),vec4(1.0),step(1.0,x));return mix(x,z,opacity);}",
  jh = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec4 z=step(0.0,x)*mix(min(vec4(1.0),x/max(1.0-y,1e-9)),vec4(1.0),step(1.0,y));return mix(x,z,opacity);}",
  Gh = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,min(x,y),opacity);}",
  Wh = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,abs(x-y),opacity);}",
  Kh = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,x/max(y,1e-12),opacity);}",
  qh = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,(x+y-2.0*x*y),opacity);}",
  $h = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec4 a=min(x,1.0),b=min(y,1.0);vec4 z=mix(2.0*a*b,1.0-2.0*(1.0-a)*(1.0-b),step(0.5,y));return mix(x,z,opacity);}",
  Yh = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,step(1.0,x+y),opacity);}",
  Xh = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec3 xHSL=RGBToHSL(x.rgb);vec3 yHSL=RGBToHSL(y.rgb);vec3 z=HSLToRGB(vec3(yHSL.r,xHSL.gb));return vec4(mix(x.rgb,z,opacity),y.a);}",
  Zh = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,1.0-y,opacity);}",
  Qh = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,y*(1.0-x),opacity);}",
  Jh = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,max(x,y),opacity);}",
  eu = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,clamp(y+x-1.0,0.0,1.0),opacity);}",
  tu = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,min(x+y,1.0),opacity);}",
  iu = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,clamp(2.0*y+x-1.0,0.0,1.0),opacity);}",
  su = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec3 xHSL=RGBToHSL(x.rgb);vec3 yHSL=RGBToHSL(y.rgb);vec3 z=HSLToRGB(vec3(xHSL.rg,yHSL.b));return vec4(mix(x.rgb,z,opacity),y.a);}",
  nu = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,x*y,opacity);}",
  ru = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,1.0-abs(1.0-x-y),opacity);}",
  ou = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,y,opacity);}",
  au = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec4 z=mix(2.0*y*x,1.0-2.0*(1.0-y)*(1.0-x),step(0.5,x));return mix(x,z,opacity);}",
  lu = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec4 y2=2.0*y;vec4 z=mix(mix(y2,x,step(0.5*x,y)),max(vec4(0.0),y2-1.0),step(x,(y2-1.0)));return mix(x,z,opacity);}",
  cu = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec4 z=mix(min(x*x/max(1.0-y,1e-12),1.0),y,step(1.0,y));return mix(x,z,opacity);}",
  hu = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec3 xHSL=RGBToHSL(x.rgb);vec3 yHSL=RGBToHSL(y.rgb);vec3 z=HSLToRGB(vec3(xHSL.r,yHSL.g,xHSL.b));return vec4(mix(x.rgb,z,opacity),y.a);}",
  uu = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,x+y-min(x*y,1.0),opacity);}",
  du = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec4 y2=2.0*y;vec4 w=step(0.5,y);vec4 z=mix(x-(1.0-y2)*x*(1.0-x),mix(x+(y2-1.0)*(sqrt(x)-x),x+(y2-1.0)*x*((16.0*x-12.0)*x+3.0),w*(1.0-step(0.25,x))),w);return mix(x,z,opacity);}",
  pu = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return y;}",
  mu = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){return mix(x,max(x+y-1.0,0.0),opacity);}",
  vu = "vec4 blend(const in vec4 x,const in vec4 y,const in float opacity){vec4 z=mix(max(1.0-min((1.0-x)/(2.0*y),1.0),0.0),min(x/(2.0*(1.0-y)),1.0),step(0.5,y));return mix(x,z,opacity);}",
  fu = new Map([[w.ADD, Ih], [w.ALPHA, zh], [w.AVERAGE, Fh], [w.COLOR, Nh], [w.COLOR_BURN, Hh], [w.COLOR_DODGE, jh], [w.DARKEN, Gh], [w.DIFFERENCE, Wh], [w.DIVIDE, Kh], [w.DST, null], [w.EXCLUSION, qh], [w.HARD_LIGHT, $h], [w.HARD_MIX, Yh], [w.HUE, Xh], [w.INVERT, Zh], [w.INVERT_RGB, Qh], [w.LIGHTEN, Jh], [w.LINEAR_BURN, eu], [w.LINEAR_DODGE, tu], [w.LINEAR_LIGHT, iu], [w.LUMINOSITY, su], [w.MULTIPLY, nu], [w.NEGATION, ru], [w.NORMAL, ou], [w.OVERLAY, au], [w.PIN_LIGHT, lu], [w.REFLECT, cu], [w.SATURATION, hu], [w.SCREEN, uu], [w.SOFT_LIGHT, du], [w.SRC, pu], [w.SUBTRACT, mu], [w.VIVID_LIGHT, vu]]),
  bu = class extends xi {
    constructor(t, e = 1) {
      super(), this._blendFunction = t, this.opacity = new y(e);
    }
    
    getOpacity() {
      return this.opacity.value;
    }
    
    setOpacity(t) {
      this.opacity.value = t;
    }
    
    get blendFunction() {
      return this._blendFunction;
    }
    
    set blendFunction(t) {
      this._blendFunction = t, this.dispatchEvent({ type: "change" });
    }
    
    getBlendFunction() {
      return this.blendFunction;
    }
    
    setBlendFunction(t) {
      this.blendFunction = t;
    }
    
    getShaderCode() {
      return fu.get(this.blendFunction);
    }
  }, or = class extends xi {
    constructor(t, e, {
      attributes: i = Me.NONE,
      blendFunction: s = w.NORMAL,
      defines: n = new Map,
      uniforms: r = new Map,
      extensions: o = null,
      vertexShader: a = null
    } = {}) {
      super(), this.name = t, this.renderer = null, this.attributes = i, this.fragmentShader = e, this.vertexShader = a, this.defines = n, this.uniforms = r, this.extensions = o, this.blendMode = new bu(s), this.blendMode.addEventListener("change", l => this.setChanged()), this._inputColorSpace = Ws, this._outputColorSpace = Ks;
    }
    
    get inputColorSpace() {
      return this._inputColorSpace;
    }
    
    set inputColorSpace(t) {
      this._inputColorSpace = t, this.setChanged();
    }
    
    get outputColorSpace() {
      return this._outputColorSpace;
    }
    
    set outputColorSpace(t) {
      this._outputColorSpace = t, this.setChanged();
    }
    
    set mainScene(t) {
    }
    
    set mainCamera(t) {
    }
    
    getName() {
      return this.name;
    }
    
    setRenderer(t) {
      this.renderer = t;
    }
    
    getDefines() {
      return this.defines;
    }
    
    getUniforms() {
      return this.uniforms;
    }
    
    getExtensions() {
      return this.extensions;
    }
    
    getBlendMode() {
      return this.blendMode;
    }
    
    getAttributes() {
      return this.attributes;
    }
    
    setAttributes(t) {
      this.attributes = t, this.setChanged();
    }
    
    getFragmentShader() {
      return this.fragmentShader;
    }
    
    setFragmentShader(t) {
      this.fragmentShader = t, this.setChanged();
    }
    
    getVertexShader() {
      return this.vertexShader;
    }
    
    setVertexShader(t) {
      this.vertexShader = t, this.setChanged();
    }
    
    setChanged() {
      this.dispatchEvent({ type: "change" });
    }
    
    setDepthTexture(t, e = Ft) {
    }
    
    update(t, e, i) {
    }
    
    setSize(t, e) {
    }
    
    initialize(t, e, i) {
    }
    
    dispose() {
      for (const t of Object.keys(this)) {
        const e = this[t];
        (e instanceof re || e instanceof Ys || e instanceof Xs || e instanceof J) && this[t].dispose();
      }
    }
  }, Yi = { MEDIUM: 2, LARGE: 3 }, gu = `#ifdef FRAMEBUFFER_PRECISION_HIGH
uniform mediump sampler2D inputBuffer;
#else
uniform lowp sampler2D inputBuffer;
#endif
varying vec2 vUv0;varying vec2 vUv1;varying vec2 vUv2;varying vec2 vUv3;void main(){vec4 sum=texture2D(inputBuffer,vUv0);sum+=texture2D(inputBuffer,vUv1);sum+=texture2D(inputBuffer,vUv2);sum+=texture2D(inputBuffer,vUv3);gl_FragColor=sum*0.25;
#include <colorspace_fragment>
}`,
  _u = "uniform vec4 texelSize;uniform float kernel;uniform float scale;varying vec2 vUv0;varying vec2 vUv1;varying vec2 vUv2;varying vec2 vUv3;void main(){vec2 uv=position.xy*0.5+0.5;vec2 dUv=(texelSize.xy*vec2(kernel)+texelSize.zw)*scale;vUv0=vec2(uv.x-dUv.x,uv.y+dUv.y);vUv1=vec2(uv.x+dUv.x,uv.y+dUv.y);vUv2=vec2(uv.x+dUv.x,uv.y-dUv.y);vUv3=vec2(uv.x-dUv.x,uv.y-dUv.y);gl_Position=vec4(position.xy,1.0,1.0);}",
  wu = [new Float32Array([0, 0]), new Float32Array([0, 1, 1]), new Float32Array([0, 1, 1, 2]), new Float32Array([0, 1, 2, 2, 3]), new Float32Array([0, 1, 2, 3, 4, 4, 5]), new Float32Array([0, 1, 2, 3, 4, 5, 7, 8, 9, 10])],
  xu = class extends K {
    constructor(t = new nt) {
      super({
        name: "KawaseBlurMaterial",
        uniforms: { inputBuffer: new y(null), texelSize: new y(new nt), scale: new y(1), kernel: new y(0) },
        blending: We,
        toneMapped: !1,
        depthWrite: !1,
        depthTest: !1,
        fragmentShader: gu,
        vertexShader: _u
      }), this.setTexelSize(t.x, t.y), this.kernelSize = Yi.MEDIUM;
    }
    
    set inputBuffer(t) {
      this.uniforms.inputBuffer.value = t;
    }
    
    setInputBuffer(t) {
      this.inputBuffer = t;
    }
    
    get kernelSequence() {
      return wu[this.kernelSize];
    }
    
    get scale() {
      return this.uniforms.scale.value;
    }
    
    set scale(t) {
      this.uniforms.scale.value = t;
    }
    
    getScale() {
      return this.uniforms.scale.value;
    }
    
    setScale(t) {
      this.uniforms.scale.value = t;
    }
    
    getKernel() {
      return null;
    }
    
    get kernel() {
      return this.uniforms.kernel.value;
    }
    
    set kernel(t) {
      this.uniforms.kernel.value = t;
    }
    
    setKernel(t) {
      this.kernel = t;
    }
    
    setTexelSize(t, e) {
      this.uniforms.texelSize.value.set(t, e, t * .5, e * .5);
    }
    
    setSize(t, e) {
      const i = 1 / t, s = 1 / e;
      this.uniforms.texelSize.value.set(i, s, i * .5, s * .5);
    }
  }, yu = class extends J {
    constructor({
                  kernelSize: t = Yi.MEDIUM,
                  resolutionScale: e = .5,
                  width: i = te.AUTO_SIZE,
                  height: s = te.AUTO_SIZE,
                  resolutionX: n = i,
                  resolutionY: r = s
                } = {}) {
      super("KawaseBlurPass"), this.renderTargetA = new re(1, 1, { depthBuffer: !1 }), this.renderTargetA.texture.name = "Blur.Target.A", this.renderTargetB = this.renderTargetA.clone(), this.renderTargetB.texture.name = "Blur.Target.B";
      const o = this.resolution = new te(this, n, r, e);
      o.addEventListener("change", a => this.setSize(o.baseWidth, o.baseHeight)), this._blurMaterial = new xu, this._blurMaterial.kernelSize = t, this.copyMaterial = new sr;
    }
    
    getResolution() {
      return this.resolution;
    }
    
    get blurMaterial() {
      return this._blurMaterial;
    }
    
    set blurMaterial(t) {
      this._blurMaterial = t;
    }
    
    get dithering() {
      return this.copyMaterial.dithering;
    }
    
    set dithering(t) {
      this.copyMaterial.dithering = t;
    }
    
    get kernelSize() {
      return this.blurMaterial.kernelSize;
    }
    
    set kernelSize(t) {
      this.blurMaterial.kernelSize = t;
    }
    
    get width() {
      return this.resolution.width;
    }
    
    set width(t) {
      this.resolution.preferredWidth = t;
    }
    
    get height() {
      return this.resolution.height;
    }
    
    set height(t) {
      this.resolution.preferredHeight = t;
    }
    
    get scale() {
      return this.blurMaterial.scale;
    }
    
    set scale(t) {
      this.blurMaterial.scale = t;
    }
    
    getScale() {
      return this.blurMaterial.scale;
    }
    
    setScale(t) {
      this.blurMaterial.scale = t;
    }
    
    getKernelSize() {
      return this.kernelSize;
    }
    
    setKernelSize(t) {
      this.kernelSize = t;
    }
    
    getResolutionScale() {
      return this.resolution.scale;
    }
    
    setResolutionScale(t) {
      this.resolution.scale = t;
    }
    
    render(t, e, i, s, n) {
      const r = this.scene, o = this.camera, a = this.renderTargetA, l = this.renderTargetB, h = this.blurMaterial,
        c = h.kernelSequence;
      let u = e;
      this.fullscreenMaterial = h;
      for (let p = 0, d = c.length; p < d; ++p) {
        const f = p & 1 ? l : a;
        h.kernel = c[p], h.inputBuffer = u.texture, t.setRenderTarget(f), t.render(r, o), u = f;
      }
      this.fullscreenMaterial = this.copyMaterial, this.copyMaterial.inputBuffer = u.texture, t.setRenderTarget(this.renderToScreen ? null : i), t.render(r, o);
    }
    
    setSize(t, e) {
      const i = this.resolution;
      i.setBaseSize(t, e);
      const s = i.width, n = i.height;
      this.renderTargetA.setSize(s, n), this.renderTargetB.setSize(s, n), this.blurMaterial.setSize(t, e);
    }
    
    initialize(t, e, i) {
      i !== void 0 && (this.renderTargetA.texture.type = i, this.renderTargetB.texture.type = i, i !== Te ? (this.blurMaterial.defines.FRAMEBUFFER_PRECISION_HIGH = "1", this.copyMaterial.defines.FRAMEBUFFER_PRECISION_HIGH = "1") : t !== null && t.outputColorSpace === z && (this.renderTargetA.texture.colorSpace = z, this.renderTargetB.texture.colorSpace = z));
    }
    
    static get AUTO_SIZE() {
      return te.AUTO_SIZE;
    }
  }, Pu = `#include <common>
#ifdef FRAMEBUFFER_PRECISION_HIGH
uniform mediump sampler2D inputBuffer;
#else
uniform lowp sampler2D inputBuffer;
#endif
#ifdef RANGE
uniform vec2 range;
#elif defined(THRESHOLD)
uniform float threshold;uniform float smoothing;
#endif
varying vec2 vUv;void main(){vec4 texel=texture2D(inputBuffer,vUv);float l=luminance(texel.rgb);
#ifdef RANGE
float low=step(range.x,l);float high=step(l,range.y);l*=low*high;
#elif defined(THRESHOLD)
l=smoothstep(threshold,threshold+smoothing,l)*l;
#endif
#ifdef COLOR
gl_FragColor=vec4(texel.rgb*clamp(l,0.0,1.0),l);
#else
gl_FragColor=vec4(l);
#endif
}`, Cu = class extends K {
    constructor(t = !1, e = null) {
      super({
        name: "LuminanceMaterial",
        defines: { THREE_REVISION: $s.replace(/\D+/g, "") },
        uniforms: { inputBuffer: new y(null), threshold: new y(0), smoothing: new y(1), range: new y(null) },
        blending: We,
        toneMapped: !1,
        depthWrite: !1,
        depthTest: !1,
        fragmentShader: Pu,
        vertexShader: ir
      }), this.colorOutput = t, this.luminanceRange = e;
    }
    
    set inputBuffer(t) {
      this.uniforms.inputBuffer.value = t;
    }
    
    setInputBuffer(t) {
      this.uniforms.inputBuffer.value = t;
    }
    
    get threshold() {
      return this.uniforms.threshold.value;
    }
    
    set threshold(t) {
      this.smoothing > 0 || t > 0 ? this.defines.THRESHOLD = "1" : delete this.defines.THRESHOLD, this.uniforms.threshold.value = t;
    }
    
    getThreshold() {
      return this.threshold;
    }
    
    setThreshold(t) {
      this.threshold = t;
    }
    
    get smoothing() {
      return this.uniforms.smoothing.value;
    }
    
    set smoothing(t) {
      this.threshold > 0 || t > 0 ? this.defines.THRESHOLD = "1" : delete this.defines.THRESHOLD, this.uniforms.smoothing.value = t;
    }
    
    getSmoothingFactor() {
      return this.smoothing;
    }
    
    setSmoothingFactor(t) {
      this.smoothing = t;
    }
    
    get useThreshold() {
      return this.threshold > 0 || this.smoothing > 0;
    }
    
    set useThreshold(t) {
    }
    
    get colorOutput() {
      return this.defines.COLOR !== void 0;
    }
    
    set colorOutput(t) {
      t ? this.defines.COLOR = "1" : delete this.defines.COLOR, this.needsUpdate = !0;
    }
    
    isColorOutputEnabled(t) {
      return this.colorOutput;
    }
    
    setColorOutputEnabled(t) {
      this.colorOutput = t;
    }
    
    get useRange() {
      return this.luminanceRange !== null;
    }
    
    set useRange(t) {
      this.luminanceRange = null;
    }
    
    get luminanceRange() {
      return this.uniforms.range.value;
    }
    
    set luminanceRange(t) {
      t !== null ? this.defines.RANGE = "1" : delete this.defines.RANGE, this.uniforms.range.value = t, this.needsUpdate = !0;
    }
    
    getLuminanceRange() {
      return this.luminanceRange;
    }
    
    setLuminanceRange(t) {
      this.luminanceRange = t;
    }
  }, Eu = class extends J {
    constructor({
                  renderTarget: t,
                  luminanceRange: e,
                  colorOutput: i,
                  resolutionScale: s = 1,
                  width: n = te.AUTO_SIZE,
                  height: r = te.AUTO_SIZE,
                  resolutionX: o = n,
                  resolutionY: a = r
                } = {}) {
      super("LuminancePass"), this.fullscreenMaterial = new Cu(i, e), this.needsSwap = !1, this.renderTarget = t, this.renderTarget === void 0 && (this.renderTarget = new re(1, 1, { depthBuffer: !1 }), this.renderTarget.texture.name = "LuminancePass.Target");
      const l = this.resolution = new te(this, o, a, s);
      l.addEventListener("change", h => this.setSize(l.baseWidth, l.baseHeight));
    }
    
    get texture() {
      return this.renderTarget.texture;
    }
    
    getTexture() {
      return this.renderTarget.texture;
    }
    
    getResolution() {
      return this.resolution;
    }
    
    render(t, e, i, s, n) {
      const r = this.fullscreenMaterial;
      r.inputBuffer = e.texture, t.setRenderTarget(this.renderToScreen ? null : this.renderTarget), t.render(this.scene, this.camera);
    }
    
    setSize(t, e) {
      const i = this.resolution;
      i.setBaseSize(t, e), this.renderTarget.setSize(i.width, i.height);
    }
    
    initialize(t, e, i) {
      i !== void 0 && i !== Te && (this.renderTarget.texture.type = i, this.fullscreenMaterial.defines.FRAMEBUFFER_PRECISION_HIGH = "1");
    }
  }, Su = `#ifdef FRAMEBUFFER_PRECISION_HIGH
uniform mediump sampler2D inputBuffer;
#else
uniform lowp sampler2D inputBuffer;
#endif
#define WEIGHT_INNER 0.125
#define WEIGHT_OUTER 0.0555555
varying vec2 vUv;varying vec2 vUv00;varying vec2 vUv01;varying vec2 vUv02;varying vec2 vUv03;varying vec2 vUv04;varying vec2 vUv05;varying vec2 vUv06;varying vec2 vUv07;varying vec2 vUv08;varying vec2 vUv09;varying vec2 vUv10;varying vec2 vUv11;float clampToBorder(const in vec2 uv){return float(uv.s>=0.0&&uv.s<=1.0&&uv.t>=0.0&&uv.t<=1.0);}void main(){vec4 c=vec4(0.0);vec4 w=WEIGHT_INNER*vec4(clampToBorder(vUv00),clampToBorder(vUv01),clampToBorder(vUv02),clampToBorder(vUv03));c+=w.x*texture2D(inputBuffer,vUv00);c+=w.y*texture2D(inputBuffer,vUv01);c+=w.z*texture2D(inputBuffer,vUv02);c+=w.w*texture2D(inputBuffer,vUv03);w=WEIGHT_OUTER*vec4(clampToBorder(vUv04),clampToBorder(vUv05),clampToBorder(vUv06),clampToBorder(vUv07));c+=w.x*texture2D(inputBuffer,vUv04);c+=w.y*texture2D(inputBuffer,vUv05);c+=w.z*texture2D(inputBuffer,vUv06);c+=w.w*texture2D(inputBuffer,vUv07);w=WEIGHT_OUTER*vec4(clampToBorder(vUv08),clampToBorder(vUv09),clampToBorder(vUv10),clampToBorder(vUv11));c+=w.x*texture2D(inputBuffer,vUv08);c+=w.y*texture2D(inputBuffer,vUv09);c+=w.z*texture2D(inputBuffer,vUv10);c+=w.w*texture2D(inputBuffer,vUv11);c+=WEIGHT_OUTER*texture2D(inputBuffer,vUv);gl_FragColor=c;
#include <colorspace_fragment>
}`,
  Mu = "uniform vec2 texelSize;varying vec2 vUv;varying vec2 vUv00;varying vec2 vUv01;varying vec2 vUv02;varying vec2 vUv03;varying vec2 vUv04;varying vec2 vUv05;varying vec2 vUv06;varying vec2 vUv07;varying vec2 vUv08;varying vec2 vUv09;varying vec2 vUv10;varying vec2 vUv11;void main(){vUv=position.xy*0.5+0.5;vUv00=vUv+texelSize*vec2(-1.0,1.0);vUv01=vUv+texelSize*vec2(1.0,1.0);vUv02=vUv+texelSize*vec2(-1.0,-1.0);vUv03=vUv+texelSize*vec2(1.0,-1.0);vUv04=vUv+texelSize*vec2(-2.0,2.0);vUv05=vUv+texelSize*vec2(0.0,2.0);vUv06=vUv+texelSize*vec2(2.0,2.0);vUv07=vUv+texelSize*vec2(-2.0,0.0);vUv08=vUv+texelSize*vec2(2.0,0.0);vUv09=vUv+texelSize*vec2(-2.0,-2.0);vUv10=vUv+texelSize*vec2(0.0,-2.0);vUv11=vUv+texelSize*vec2(2.0,-2.0);gl_Position=vec4(position.xy,1.0,1.0);}",
  Tu = class extends K {
    constructor() {
      super({
        name: "DownsamplingMaterial",
        uniforms: { inputBuffer: new y(null), texelSize: new y(new b) },
        blending: We,
        toneMapped: !1,
        depthWrite: !1,
        depthTest: !1,
        fragmentShader: Su,
        vertexShader: Mu
      });
    }
    
    set inputBuffer(t) {
      this.uniforms.inputBuffer.value = t;
    }
    
    setSize(t, e) {
      this.uniforms.texelSize.value.set(1 / t, 1 / e);
    }
  }, ku = `#ifdef FRAMEBUFFER_PRECISION_HIGH
uniform mediump sampler2D inputBuffer;uniform mediump sampler2D supportBuffer;
#else
uniform lowp sampler2D inputBuffer;uniform lowp sampler2D supportBuffer;
#endif
uniform float radius;varying vec2 vUv;varying vec2 vUv0;varying vec2 vUv1;varying vec2 vUv2;varying vec2 vUv3;varying vec2 vUv4;varying vec2 vUv5;varying vec2 vUv6;varying vec2 vUv7;void main(){vec4 c=vec4(0.0);c+=texture2D(inputBuffer,vUv0)*0.0625;c+=texture2D(inputBuffer,vUv1)*0.125;c+=texture2D(inputBuffer,vUv2)*0.0625;c+=texture2D(inputBuffer,vUv3)*0.125;c+=texture2D(inputBuffer,vUv)*0.25;c+=texture2D(inputBuffer,vUv4)*0.125;c+=texture2D(inputBuffer,vUv5)*0.0625;c+=texture2D(inputBuffer,vUv6)*0.125;c+=texture2D(inputBuffer,vUv7)*0.0625;vec4 baseColor=texture2D(supportBuffer,vUv);gl_FragColor=mix(baseColor,c,radius);
#include <colorspace_fragment>
}`,
  Ru = "uniform vec2 texelSize;varying vec2 vUv;varying vec2 vUv0;varying vec2 vUv1;varying vec2 vUv2;varying vec2 vUv3;varying vec2 vUv4;varying vec2 vUv5;varying vec2 vUv6;varying vec2 vUv7;void main(){vUv=position.xy*0.5+0.5;vUv0=vUv+texelSize*vec2(-1.0,1.0);vUv1=vUv+texelSize*vec2(0.0,1.0);vUv2=vUv+texelSize*vec2(1.0,1.0);vUv3=vUv+texelSize*vec2(-1.0,0.0);vUv4=vUv+texelSize*vec2(1.0,0.0);vUv5=vUv+texelSize*vec2(-1.0,-1.0);vUv6=vUv+texelSize*vec2(0.0,-1.0);vUv7=vUv+texelSize*vec2(1.0,-1.0);gl_Position=vec4(position.xy,1.0,1.0);}",
  Au = class extends K {
    constructor() {
      super({
        name: "UpsamplingMaterial",
        uniforms: { inputBuffer: new y(null), supportBuffer: new y(null), texelSize: new y(new b), radius: new y(.85) },
        blending: We,
        toneMapped: !1,
        depthWrite: !1,
        depthTest: !1,
        fragmentShader: ku,
        vertexShader: Ru
      });
    }
    
    set inputBuffer(t) {
      this.uniforms.inputBuffer.value = t;
    }
    
    set supportBuffer(t) {
      this.uniforms.supportBuffer.value = t;
    }
    
    get radius() {
      return this.uniforms.radius.value;
    }
    
    set radius(t) {
      this.uniforms.radius.value = t;
    }
    
    setSize(t, e) {
      this.uniforms.texelSize.value.set(1 / t, 1 / e);
    }
  }, Du = class extends J {
    constructor() {
      super("MipmapBlurPass"), this.needsSwap = !1, this.renderTarget = new re(1, 1, { depthBuffer: !1 }), this.renderTarget.texture.name = "Upsampling.Mipmap0", this.downsamplingMipmaps = [], this.upsamplingMipmaps = [], this.downsamplingMaterial = new Tu, this.upsamplingMaterial = new Au, this.resolution = new b;
    }
    
    get texture() {
      return this.renderTarget.texture;
    }
    
    get levels() {
      return this.downsamplingMipmaps.length;
    }
    
    set levels(t) {
      if (this.levels !== t) {
        const e = this.renderTarget;
        this.dispose(), this.downsamplingMipmaps = [], this.upsamplingMipmaps = [];
        for (let i = 0; i < t; ++i) {
          const s = e.clone();
          s.texture.name = "Downsampling.Mipmap" + i, this.downsamplingMipmaps.push(s);
        }
        this.upsamplingMipmaps.push(e);
        for (let i = 1, s = t - 1; i < s; ++i) {
          const n = e.clone();
          n.texture.name = "Upsampling.Mipmap" + i, this.upsamplingMipmaps.push(n);
        }
        this.setSize(this.resolution.x, this.resolution.y);
      }
    }
    
    get radius() {
      return this.upsamplingMaterial.radius;
    }
    
    set radius(t) {
      this.upsamplingMaterial.radius = t;
    }
    
    render(t, e, i, s, n) {
      const { scene: r, camera: o } = this, {
        downsamplingMaterial: a,
        upsamplingMaterial: l
      } = this, { downsamplingMipmaps: h, upsamplingMipmaps: c } = this;
      let u = e;
      this.fullscreenMaterial = a;
      for (let p = 0, d = h.length; p < d; ++p) {
        const f = h[p];
        a.setSize(u.width, u.height), a.inputBuffer = u.texture, t.setRenderTarget(f), t.render(r, o), u = f;
      }
      this.fullscreenMaterial = l;
      for (let p = c.length - 1; p >= 0; --p) {
        const d = c[p];
        l.setSize(u.width, u.height), l.inputBuffer = u.texture, l.supportBuffer = h[p].texture, t.setRenderTarget(d), t.render(r, o), u = d;
      }
    }
    
    setSize(t, e) {
      const i = this.resolution;
      i.set(t, e);
      let s = i.width, n = i.height;
      for (let r = 0, o = this.downsamplingMipmaps.length; r < o; ++r) s = Math.round(s * .5), n = Math.round(n * .5), this.downsamplingMipmaps[r].setSize(s, n), r < this.upsamplingMipmaps.length && this.upsamplingMipmaps[r].setSize(s, n);
    }
    
    initialize(t, e, i) {
      if (i !== void 0) {
        const s = this.downsamplingMipmaps.concat(this.upsamplingMipmaps);
        for (const n of s) n.texture.type = i;
        if (i !== Te) this.downsamplingMaterial.defines.FRAMEBUFFER_PRECISION_HIGH = "1", this.upsamplingMaterial.defines.FRAMEBUFFER_PRECISION_HIGH = "1"; else if (t !== null && t.outputColorSpace === z) for (const n of s) n.texture.colorSpace = z;
      }
    }
    
    dispose() {
      super.dispose();
      for (const t of this.downsamplingMipmaps.concat(this.upsamplingMipmaps)) t.dispose();
    }
  }, Lu = `#ifdef FRAMEBUFFER_PRECISION_HIGH
uniform mediump sampler2D map;
#else
uniform lowp sampler2D map;
#endif
uniform float intensity;void mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor){vec4 texel=texture2D(map,uv);outputColor=vec4(texel.rgb*intensity,texel.a);}`,
  Bu = class extends or {
    constructor({
                  blendFunction: t = w.SCREEN,
                  luminanceThreshold: e = .9,
                  luminanceSmoothing: i = .025,
                  mipmapBlur: s = !1,
                  intensity: n = 1,
                  radius: r = .85,
                  levels: o = 8,
                  kernelSize: a = Yi.LARGE,
                  resolutionScale: l = .5,
                  width: h = te.AUTO_SIZE,
                  height: c = te.AUTO_SIZE,
                  resolutionX: u = h,
                  resolutionY: p = c
                } = {}) {
      super("BloomEffect", Lu, {
        blendFunction: t,
        uniforms: new Map([["map", new y(null)], ["intensity", new y(n)]])
      }), this.renderTarget = new re(1, 1, { depthBuffer: !1 }), this.renderTarget.texture.name = "Bloom.Target", this.blurPass = new yu({ kernelSize: a }), this.luminancePass = new Eu({ colorOutput: !0 }), this.luminanceMaterial.threshold = e, this.luminanceMaterial.smoothing = i, this.mipmapBlurPass = new Du, this.mipmapBlurPass.enabled = s, this.mipmapBlurPass.radius = r, this.mipmapBlurPass.levels = o, this.uniforms.get("map").value = s ? this.mipmapBlurPass.texture : this.renderTarget.texture;
      const d = this.resolution = new te(this, u, p, l);
      d.addEventListener("change", f => this.setSize(d.baseWidth, d.baseHeight));
    }
    
    get texture() {
      return this.mipmapBlurPass.enabled ? this.mipmapBlurPass.texture : this.renderTarget.texture;
    }
    
    getTexture() {
      return this.texture;
    }
    
    getResolution() {
      return this.resolution;
    }
    
    getBlurPass() {
      return this.blurPass;
    }
    
    getLuminancePass() {
      return this.luminancePass;
    }
    
    get luminanceMaterial() {
      return this.luminancePass.fullscreenMaterial;
    }
    
    getLuminanceMaterial() {
      return this.luminancePass.fullscreenMaterial;
    }
    
    get width() {
      return this.resolution.width;
    }
    
    set width(t) {
      this.resolution.preferredWidth = t;
    }
    
    get height() {
      return this.resolution.height;
    }
    
    set height(t) {
      this.resolution.preferredHeight = t;
    }
    
    get dithering() {
      return this.blurPass.dithering;
    }
    
    set dithering(t) {
      this.blurPass.dithering = t;
    }
    
    get kernelSize() {
      return this.blurPass.kernelSize;
    }
    
    set kernelSize(t) {
      this.blurPass.kernelSize = t;
    }
    
    get distinction() {
      return console.warn(this.name, "distinction was removed"), 1;
    }
    
    set distinction(t) {
      console.warn(this.name, "distinction was removed");
    }
    
    get intensity() {
      return this.uniforms.get("intensity").value;
    }
    
    set intensity(t) {
      this.uniforms.get("intensity").value = t;
    }
    
    getIntensity() {
      return this.intensity;
    }
    
    setIntensity(t) {
      this.intensity = t;
    }
    
    getResolutionScale() {
      return this.resolution.scale;
    }
    
    setResolutionScale(t) {
      this.resolution.scale = t;
    }
    
    update(t, e, i) {
      const s = this.renderTarget, n = this.luminancePass;
      n.enabled ? (n.render(t, e), this.mipmapBlurPass.enabled ? this.mipmapBlurPass.render(t, n.renderTarget) : this.blurPass.render(t, n.renderTarget, s)) : this.mipmapBlurPass.enabled ? this.mipmapBlurPass.render(t, e) : this.blurPass.render(t, e, s);
    }
    
    setSize(t, e) {
      const i = this.resolution;
      i.setBaseSize(t, e), this.renderTarget.setSize(i.width, i.height), this.blurPass.resolution.copy(i), this.luminancePass.setSize(t, e), this.mipmapBlurPass.setSize(t, e);
    }
    
    initialize(t, e, i) {
      this.blurPass.initialize(t, e, i), this.luminancePass.initialize(t, e, i), this.mipmapBlurPass.initialize(t, e, i), i !== void 0 && (this.renderTarget.texture.type = i, t !== null && t.outputColorSpace === z && (this.renderTarget.texture.colorSpace = z));
    }
  }, Vu = class extends J {
    constructor(t, e, i = null) {
      super("RenderPass", t, e), this.needsSwap = !1, this.clearPass = new rr, this.overrideMaterialManager = i === null ? null : new Ds(i), this.ignoreBackground = !1, this.skipShadowMapUpdate = !1, this.selection = null;
    }
    
    set mainScene(t) {
      this.scene = t;
    }
    
    set mainCamera(t) {
      this.camera = t;
    }
    
    get renderToScreen() {
      return super.renderToScreen;
    }
    
    set renderToScreen(t) {
      super.renderToScreen = t, this.clearPass.renderToScreen = t;
    }
    
    get overrideMaterial() {
      const t = this.overrideMaterialManager;
      return t !== null ? t.material : null;
    }
    
    set overrideMaterial(t) {
      const e = this.overrideMaterialManager;
      t !== null ? e !== null ? e.setMaterial(t) : this.overrideMaterialManager = new Ds(t) : e !== null && (e.dispose(), this.overrideMaterialManager = null);
    }
    
    getOverrideMaterial() {
      return this.overrideMaterial;
    }
    
    setOverrideMaterial(t) {
      this.overrideMaterial = t;
    }
    
    get clear() {
      return this.clearPass.enabled;
    }
    
    set clear(t) {
      this.clearPass.enabled = t;
    }
    
    getSelection() {
      return this.selection;
    }
    
    setSelection(t) {
      this.selection = t;
    }
    
    isBackgroundDisabled() {
      return this.ignoreBackground;
    }
    
    setBackgroundDisabled(t) {
      this.ignoreBackground = t;
    }
    
    isShadowMapDisabled() {
      return this.skipShadowMapUpdate;
    }
    
    setShadowMapDisabled(t) {
      this.skipShadowMapUpdate = t;
    }
    
    getClearPass() {
      return this.clearPass;
    }
    
    render(t, e, i, s, n) {
      const r = this.scene, o = this.camera, a = this.selection, l = o.layers.mask, h = r.background,
        c = t.shadowMap.autoUpdate, u = this.renderToScreen ? null : e;
      a !== null && o.layers.set(a.getLayer()), this.skipShadowMapUpdate && (t.shadowMap.autoUpdate = !1), (this.ignoreBackground || this.clearPass.overrideClearColor !== null) && (r.background = null), this.clearPass.enabled && this.clearPass.render(t, e), t.setRenderTarget(u), this.overrideMaterialManager !== null ? this.overrideMaterialManager.render(t, r, o) : t.render(r, o), o.layers.mask = l, r.background = h, t.shadowMap.autoUpdate = c;
    }
  }, Ou = `#include <common>
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
uniform vec2 resolution;uniform vec2 texelSize;uniform float cameraNear;uniform float cameraFar;uniform float aspect;uniform float time;varying vec2 vUv;vec4 sRGBToLinear(const in vec4 value){return vec4(mix(pow(value.rgb*0.9478672986+vec3(0.0521327014),vec3(2.4)),value.rgb*0.0773993808,vec3(lessThanEqual(value.rgb,vec3(0.04045)))),value.a);}float readDepth(const in vec2 uv){
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
  Uu = "uniform vec2 resolution;uniform vec2 texelSize;uniform float cameraNear;uniform float cameraFar;uniform float aspect;uniform float time;varying vec2 vUv;VERTEX_HEAD void main(){vUv=position.xy*0.5+0.5;VERTEX_MAIN_SUPPORT gl_Position=vec4(position.xy,1.0,1.0);}",
  Iu = class extends K {
    constructor(t, e, i, s, n = !1) {
      super({
        name: "EffectMaterial",
        defines: { THREE_REVISION: $s.replace(/\D+/g, ""), DEPTH_PACKING: "0", ENCODE_OUTPUT: "1" },
        uniforms: {
          inputBuffer: new y(null),
          depthBuffer: new y(null),
          resolution: new y(new b),
          texelSize: new y(new b),
          cameraNear: new y(.3),
          cameraFar: new y(1e3),
          aspect: new y(1),
          time: new y(0)
        },
        blending: We,
        toneMapped: !1,
        depthWrite: !1,
        depthTest: !1,
        dithering: n
      }), t && this.setShaderParts(t), e && this.setDefines(e), i && this.setUniforms(i), this.copyCameraSettings(s);
    }
    
    set inputBuffer(t) {
      this.uniforms.inputBuffer.value = t;
    }
    
    setInputBuffer(t) {
      this.uniforms.inputBuffer.value = t;
    }
    
    get depthBuffer() {
      return this.uniforms.depthBuffer.value;
    }
    
    set depthBuffer(t) {
      this.uniforms.depthBuffer.value = t;
    }
    
    get depthPacking() {
      return Number(this.defines.DEPTH_PACKING);
    }
    
    set depthPacking(t) {
      this.defines.DEPTH_PACKING = t.toFixed(0), this.needsUpdate = !0;
    }
    
    setDepthBuffer(t, e = Ft) {
      this.depthBuffer = t, this.depthPacking = e;
    }
    
    setShaderData(t) {
      this.setShaderParts(t.shaderParts), this.setDefines(t.defines), this.setUniforms(t.uniforms), this.setExtensions(t.extensions);
    }
    
    setShaderParts(t) {
      return this.fragmentShader = Ou.replace(S.FRAGMENT_HEAD, t.get(S.FRAGMENT_HEAD) || "").replace(S.FRAGMENT_MAIN_UV, t.get(S.FRAGMENT_MAIN_UV) || "").replace(S.FRAGMENT_MAIN_IMAGE, t.get(S.FRAGMENT_MAIN_IMAGE) || ""), this.vertexShader = Uu.replace(S.VERTEX_HEAD, t.get(S.VERTEX_HEAD) || "").replace(S.VERTEX_MAIN_SUPPORT, t.get(S.VERTEX_MAIN_SUPPORT) || ""), this.needsUpdate = !0, this;
    }
    
    setDefines(t) {
      for (const e of t.entries()) this.defines[e[0]] = e[1];
      return this.needsUpdate = !0, this;
    }
    
    setUniforms(t) {
      for (const e of t.entries()) this.uniforms[e[0]] = e[1];
      return this;
    }
    
    setExtensions(t) {
      this.extensions = {};
      for (const e of t) this.extensions[e] = !0;
      return this;
    }
    
    get encodeOutput() {
      return this.defines.ENCODE_OUTPUT !== void 0;
    }
    
    set encodeOutput(t) {
      this.encodeOutput !== t && (t ? this.defines.ENCODE_OUTPUT = "1" : delete this.defines.ENCODE_OUTPUT, this.needsUpdate = !0);
    }
    
    isOutputEncodingEnabled(t) {
      return this.encodeOutput;
    }
    
    setOutputEncodingEnabled(t) {
      this.encodeOutput = t;
    }
    
    get time() {
      return this.uniforms.time.value;
    }
    
    set time(t) {
      this.uniforms.time.value = t;
    }
    
    setDeltaTime(t) {
      this.uniforms.time.value += t;
    }
    
    adoptCameraSettings(t) {
      this.copyCameraSettings(t);
    }
    
    copyCameraSettings(t) {
      t && (this.uniforms.cameraNear.value = t.near, this.uniforms.cameraFar.value = t.far, t instanceof dt ? this.defines.PERSPECTIVE_CAMERA = "1" : delete this.defines.PERSPECTIVE_CAMERA, this.needsUpdate = !0);
    }
    
    setSize(t, e) {
      const i = this.uniforms;
      i.resolution.value.set(t, e), i.texelSize.value.set(1 / t, 1 / e), i.aspect.value = t / e;
    }
    
    static get Section() {
      return S;
    }
  };

function Ls(t, e, i) {
  for (const s of e) {
    const n = "$1" + t + s.charAt(0).toUpperCase() + s.slice(1), r = new RegExp("([^\\.])(\\b" + s + "\\b)", "g");
    for (const o of i.entries()) o[1] !== null && i.set(o[0], o[1].replace(r, n));
  }
}

function zu(t, e, i) {
  let s = e.getFragmentShader(), n = e.getVertexShader();
  const r = s !== void 0 && /mainImage/.test(s), o = s !== void 0 && /mainUv/.test(s);
  if (i.attributes |= e.getAttributes(), s === void 0) throw new Error(`Missing fragment shader (${e.name})`);
  if (o && i.attributes & Me.CONVOLUTION) throw new Error(`Effects that transform UVs are incompatible with convolution effects (${e.name})`);
  if (!r && !o) throw new Error(`Could not find mainImage or mainUv function (${e.name})`);
  {
    const a = /\w+\s+(\w+)\([\w\s,]*\)\s*{/g, l = i.shaderParts;
    let h = l.get(S.FRAGMENT_HEAD) || "", c = l.get(S.FRAGMENT_MAIN_UV) || "", u = l.get(S.FRAGMENT_MAIN_IMAGE) || "",
      p = l.get(S.VERTEX_HEAD) || "", d = l.get(S.VERTEX_MAIN_SUPPORT) || "";
    const f = new Set, m = new Set;
    if (o && (c += `	${t}MainUv(UV);
`, i.uvTransformation = !0), n !== null && /mainSupport/.test(n)) {
      const x = /mainSupport *\([\w\s]*?uv\s*?\)/.test(n);
      d += `	${t}MainSupport(`, d += x ? `vUv);
` : `);
`;
      for (const g of n.matchAll(/(?:varying\s+\w+\s+([\S\s]*?);)/g)) for (const A of g[1].split(/\s*,\s*/)) i.varyings.add(A), f.add(A), m.add(A);
      for (const g of n.matchAll(a)) m.add(g[1]);
    }
    for (const x of s.matchAll(a)) m.add(x[1]);
    for (const x of e.defines.keys()) m.add(x.replace(/\([\w\s,]*\)/g, ""));
    for (const x of e.uniforms.keys()) m.add(x);
    m.delete("while"), m.delete("for"), m.delete("if"), e.uniforms.forEach((x, g) => i.uniforms.set(t + g.charAt(0).toUpperCase() + g.slice(1), x)), e.defines.forEach((x, g) => i.defines.set(t + g.charAt(0).toUpperCase() + g.slice(1), x));
    const B = new Map([["fragment", s], ["vertex", n]]);
    Ls(t, m, i.defines), Ls(t, m, B), s = B.get("fragment"), n = B.get("vertex");
    const v = e.blendMode;
    if (i.blendModes.set(v.blendFunction, v), r) {
      e.inputColorSpace !== null && e.inputColorSpace !== i.colorSpace && (u += e.inputColorSpace === z ? `color0 = sRGBTransferOETF(color0);
	` : `color0 = sRGBToLinear(color0);
	`), e.outputColorSpace !== Ks ? i.colorSpace = e.outputColorSpace : e.inputColorSpace !== null && (i.colorSpace = e.inputColorSpace);
      const x = /MainImage *\([\w\s,]*?depth[\w\s,]*?\)/;
      u += `${t}MainImage(color0, UV, `, i.attributes & Me.DEPTH && x.test(s) && (u += "depth, ", i.readDepth = !0), u += `color1);
	`;
      const g = t + "BlendOpacity";
      i.uniforms.set(g, v.opacity), u += `color0 = blend${v.blendFunction}(color0, color1, ${g});

	`, h += `uniform float ${g};

`;
    }
    if (h += s + `
`, n !== null && (p += n + `
`), l.set(S.FRAGMENT_HEAD, h), l.set(S.FRAGMENT_MAIN_UV, c), l.set(S.FRAGMENT_MAIN_IMAGE, u), l.set(S.VERTEX_HEAD, p), l.set(S.VERTEX_MAIN_SUPPORT, d), e.extensions !== null) for (const x of e.extensions) i.extensions.add(x);
  }
}

var Bs = class extends J {
  constructor(t, ...e) {
    super("EffectPass"), this.fullscreenMaterial = new Iu(null, null, null, t), this.listener = i => this.handleEvent(i), this.effects = [], this.setEffects(e), this.skipRendering = !1, this.minTime = 1, this.maxTime = Number.POSITIVE_INFINITY, this.timeScale = 1;
  }
  
  set mainScene(t) {
    for (const e of this.effects) e.mainScene = t;
  }
  
  set mainCamera(t) {
    this.fullscreenMaterial.copyCameraSettings(t);
    for (const e of this.effects) e.mainCamera = t;
  }
  
  get encodeOutput() {
    return this.fullscreenMaterial.encodeOutput;
  }
  
  set encodeOutput(t) {
    this.fullscreenMaterial.encodeOutput = t;
  }
  
  get dithering() {
    return this.fullscreenMaterial.dithering;
  }
  
  set dithering(t) {
    const e = this.fullscreenMaterial;
    e.dithering = t, e.needsUpdate = !0;
  }
  
  setEffects(t) {
    for (const e of this.effects) e.removeEventListener("change", this.listener);
    this.effects = t.sort((e, i) => i.attributes - e.attributes);
    for (const e of this.effects) e.addEventListener("change", this.listener);
  }
  
  updateMaterial() {
    const t = new Uh;
    let e = 0;
    for (const o of this.effects) if (o.blendMode.blendFunction === w.DST) t.attributes |= o.getAttributes() & Me.DEPTH; else {
      if (t.attributes & o.getAttributes() & Me.CONVOLUTION) throw new Error(`Convolution effects cannot be merged (${o.name})`);
      zu("e" + e++, o, t);
    }
    let i = t.shaderParts.get(S.FRAGMENT_HEAD), s = t.shaderParts.get(S.FRAGMENT_MAIN_IMAGE),
      n = t.shaderParts.get(S.FRAGMENT_MAIN_UV);
    const r = /\bblend\b/g;
    for (const o of t.blendModes.values()) i += o.getShaderCode().replace(r, `blend${o.blendFunction}`) + `
`;
    t.attributes & Me.DEPTH ? (t.readDepth && (s = `float depth = readDepth(UV);

	` + s), this.needsDepthTexture = this.getDepthTexture() === null) : this.needsDepthTexture = !1, t.colorSpace === z && (s += `color0 = sRGBToLinear(color0);
	`), t.uvTransformation ? (n = `vec2 transformedUv = vUv;
` + n, t.defines.set("UV", "transformedUv")) : t.defines.set("UV", "vUv"), t.shaderParts.set(S.FRAGMENT_HEAD, i), t.shaderParts.set(S.FRAGMENT_MAIN_IMAGE, s), t.shaderParts.set(S.FRAGMENT_MAIN_UV, n);
    for (const [o, a] of t.shaderParts) a !== null && t.shaderParts.set(o, a.trim().replace(/^#/, `
#`));
    this.skipRendering = e === 0, this.needsSwap = !this.skipRendering, this.fullscreenMaterial.setShaderData(t);
  }
  
  recompile() {
    this.updateMaterial();
  }
  
  getDepthTexture() {
    return this.fullscreenMaterial.depthBuffer;
  }
  
  setDepthTexture(t, e = Ft) {
    this.fullscreenMaterial.depthBuffer = t, this.fullscreenMaterial.depthPacking = e;
    for (const i of this.effects) i.setDepthTexture(t, e);
  }
  
  render(t, e, i, s, n) {
    for (const r of this.effects) r.update(t, e, s);
    if (!this.skipRendering || this.renderToScreen) {
      const r = this.fullscreenMaterial;
      r.inputBuffer = e.texture, r.time += s * this.timeScale, t.setRenderTarget(this.renderToScreen ? null : i), t.render(this.scene, this.camera);
    }
  }
  
  setSize(t, e) {
    this.fullscreenMaterial.setSize(t, e);
    for (const i of this.effects) i.setSize(t, e);
  }
  
  initialize(t, e, i) {
    this.renderer = t;
    for (const s of this.effects) s.initialize(t, e, i);
    this.updateMaterial(), i !== void 0 && i !== Te && (this.fullscreenMaterial.defines.FRAMEBUFFER_PRECISION_HIGH = "1");
  }
  
  dispose() {
    super.dispose();
    for (const t of this.effects) t.removeEventListener("change", this.listener), t.dispose();
  }
  
  handleEvent(t) {
    switch (t.type) {
      case"change":
        this.recompile();
        break;
    }
  }
};
const Fu = `#define GLSLIFY 1
uniform sampler2D bloomTexture;

uniform float uNoiseStrength;
uniform float uVignetteStrength;
uniform vec3 uVignetteColor;
uniform float uMaxDistort;
uniform float uBendAmount;

const int iterations = 5;

vec2 barrelDistortion(vec2 coord, float amt) {
	vec2 cc = coord - 0.5;
	float dist = dot(cc, cc);
	return coord + cc * dist * amt;
}
float sat(float t) {
	return clamp(t, 0.0, 1.0);
}
float linterp(float t) {
	return sat(1.0 - abs(2.0 * t - 1.0));
}
float remap(float t, float a, float b) {
	return sat((t - a) / (b - a));
}
vec4 spectrum_offset(float t) {
	vec4 ret;
	float lo = step(t, 0.5);
	float hi = 1.0 - lo;
	float w = linterp(remap(t, 1.0 / 6.0, 5.0 / 6.0));
	ret = vec4(lo, 1.0, hi, 1.0) * vec4(1.0 - w, w, 1.0 - w, 1.0);
	return pow(ret, vec4(1.0 / 2.2));
}
float random(vec2 p) {
	vec3 p3 = fract(vec3(p.xyx) * 443.8975);
	p3 += dot(p3, p3.yzx + 19.19);
	return fract((p3.x + p3.y) * p3.z);
}
const vec3 W = vec3(0.2125, 0.7154, 0.0721);
float luminance(vec3 color) {
	return dot(color, W);
}

float blendSoftLight(float base, float blend) {
	return blend < 0.5
		? 2.0 * base * blend + base * base * (1.0 - 2.0 * blend)
		: sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend);
}
vec3 blendSoftLight(vec3 base, vec3 blend) {
	return vec3(
		blendSoftLight(base.r, blend.r),
		blendSoftLight(base.g, blend.g),
		blendSoftLight(base.b, blend.b)
	);
}
vec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {
	return blendSoftLight(base, blend) * opacity + base * (1.0 - opacity);
}

void mainImage(const vec4 inputColor, const vec2 uv, out vec4 outputColor) {
	vec4 sumcol = vec4(0.0);
	vec4 sumw = vec4(0.0);
	float reci_num_iter_f = 1.0 / float(iterations);
	for (int i = 0; i < iterations; i++) {
		float t = float(i) * reci_num_iter_f;
		vec4 w = spectrum_offset(t);
		sumw += w;
		sumcol +=
			w *
			texture2D(
				bloomTexture,
				barrelDistortion(uv, uBendAmount * uMaxDistort * t)
			);
	}
	outputColor = vec4(sumcol / sumw);

	// VIGNETTE
	vec2 uv2 = uv;
	uv2 *= 1.0 - vUv.yx;
	float vig = uv2.x * uv2.y * 20.0;
	vig = pow(vig, uVignetteStrength);
	outputColor = mix(vec4(uVignetteColor, 1.0), outputColor, vig);

	// VIGNETTE
	float noise = random(uv) - 0.5;
	outputColor.rgb = blendSoftLight(
		outputColor.rgb,
		vec3(noise),
		uNoiseStrength
	);
	outputColor.a += noise * uNoiseStrength;
}
`;

class Nu extends or {
  constructor() {
    super("FinalPass", Fu, {
      blendFunction: w.NORMAL,
      uniforms: new Map([["tDiffuse", new y(null)], ["bloomTexture", new y(null)], ["uNoiseStrength", new y(.07)], ["uVignetteStrength", new y(.42)], ["uVignetteColor", new y(new E(0, 0, 0))], ["uMaxDistort", new y(1.46)], ["uBendAmount", new y(-.032)]])
    });
  }
}

function Hu(t) {
  let e, i, s;
  const n = { enabled: !0, init: r, update: o, render: a, resize: l, updateCamera: h };
  t.postprocess = n;
  
  function r() {
    const u = t.scene.camera.cam, p = t.scene.base;
    e = new Oh(t.threeRenderer), e.addPass(new Vu(p, u)), i = new Bu({
      luminanceThreshold: 1,
      luminanceSmoothing: 0,
      intensity: .16
    });
    const d = new Bs(u, i);
    e.addPass(d);
    const f = new nr;
    e.addPass(f), s = new Nu, s.uniforms.get("bloomTexture").value = f.renderTarget.texture;
    const m = new Bs(u, s);
    e.addPass(m), t.gui && c();
  }
  
  function o() {
  }
  
  function a() {
    e == null || e.render();
  }
  
  function l() {
  }
  
  function h() {
    e == null || e.setMainCamera(t.scene.camera.cam);
  }
  
  function c() {
    const u = t.gui.addFolder({ title: "Bloom Effect" });
    u.addBinding(i, "intensity", {
      min: 0,
      max: 3,
      step: .01
    }), u.addBinding(i.luminanceMaterial, "threshold", {
      label: "Luminance Threshold",
      min: 0,
      max: 1,
      step: .01
    }), u.addBinding(i.luminanceMaterial, "smoothing", { label: "Luminance Smoothing", min: 0, max: 1, step: .01 });
    const p = u.addFolder({ title: "Blur Settings" });
    p.addBinding(i.blurPass, "scale", {
      min: 0,
      max: 5,
      step: .01
    }), p.addBinding(i.blurPass, "kernelSize", {
      options: {
        VERY_SMALL: 0,
        SMALL: 1,
        MEDIUM: 2,
        LARGE: 3,
        VERY_LARGE: 4,
        HUGE: 5
      }
    });
  }
}

function ju(t) {
  new b;
  let e = !1;
  const i = { pressed: !1, pos: new b(0, 0), delta: new b, normalizePos: new b, dragDelta: new b, started: !1 },
    s = { pressed: !1, pos: new b, delta: new b, normalizePos: new b, firstPos: new b, prevPos: new b };
  t.hooks.click = new Dt;
  
  async function n() {
    window.addEventListener("mousemove", c), window.addEventListener("mousedown", r), window.addEventListener("mouseup", h), window.addEventListener("touchstart", o), window.addEventListener("touchmove", a), window.addEventListener("touchend", l), Q.ticker.add(u);
  }
  
  function r(d) {
    s.delta.set(0, 0), s.firstPos.set(d.clientX, d.clientY), s.prevPos.copy(s.firstPos), s.pos.copy(s.firstPos), s.pressed = !0, t.hooks.click.emit(), e = !0;
  }
  
  function o(d) {
    s.delta.set(0, 0), s.firstPos.set(d.changedTouches[0].clientX || 0, d.changedTouches[0].clientY || 0), s.prevPos.copy(s.firstPos), s.pos.copy(s.firstPos), s.pressed = !0, e = !0;
  }
  
  function a(d) {
    i.started = !0, s.pos.set(d.changedTouches[0].clientX || 0, d.changedTouches[0].clientY || 0);
  }
  
  function l(d) {
    s.pos.set(d.changedTouches[0].clientX || 0, d.changedTouches[0].clientY || 0), s.pressed = !1, e = !0;
  }
  
  function h(d) {
    s.pos.set(d.clientX, d.clientY), s.pressed = !1, e = !0;
  }
  
  function c(d) {
    i.started = !0, s.pos.set(d.clientX, d.clientY);
  }
  
  function u() {
    s.delta.copy(s.pos).sub(s.prevPos), s.prevPos.copy(s.pos);
    const d = i.delta;
    e || (e = !s.delta.equals(d) || s.delta !== 0), e && p(), e = !1;
  }
  
  function p() {
    i.pressed = s.pressed, i.pos.copy(s.pos), i.delta.copy(s.delta);
    const d = { x: t.viewport.width, y: t.viewport.height };
    i.normalizePos.set(ss(s.pos.x, 0, d.x, -1, 1), ss(s.pos.y, 0, d.y, 1, -1)), i.started || i.normalizePos.set(0, 0);
  }
  
  n(), t.touch = i;
}

const Gu = "string";

class Pt {
  constructor(e = {}) {
    this.isComponent = !0, this.props = e, this.webgl = Be(), this.scene = null, this.parent = null, this.base = null, this.children = [];
  }
  
  triggerInit() {
    this.isInit || (this.beforeInit && this.beforeInit(), this.init && this.init(), this.webgl.gui && this.debug && this.debug(), this.isInit = !0, this.afterInit && this.afterInit());
  }
  
  addObject3D(e) {
    return this.base && this.base.add(e), e;
  }
  
  removeObject3D(e) {
    return this.base && this.base.remove(e), null;
  }
  
  add(e, i = {}, s) {
    if (typeof e === Gu && (e = this.webgl.components[e]), !e) return;
    if (~this.children.indexOf(e)) return e;
    e.isComponent || (e = new e(i));
    const n = e.parent;
    return n && n.remove(e), e.parent = this, this.scene ? e.scene = this.scene : this.isScene && (e.scene = this), e.isInit || e.triggerInit(i), this.children.push(e), e.base && (s ? s.add(e.base) : this.base && this.base.add(e.base)), e.destroyed ? (this.remove(e), e) : (this.isAttached && triggerAttached(this.scene, e), e);
  }
  
  triggerUpdate() {
    if (!this.isInit) return;
    this.beforeUpdate && this.beforeUpdate(), this.update && this.update();
    const e = this.children;
    for (let i = 0, s = e.length; i < s; i++) {
      const n = e[i];
      n && n.triggerUpdate();
    }
    this.afterUpdate && this.afterUpdate();
  }
  
  destroy() {
    if (!this.isDestroyed) {
      this.beforeDestroy && this.beforeDestroy();
      for (let e = this.children.length - 1; e >= 0; e--) this.children[e].destroy();
      if (this.base) {
        for (let e = this.base.children.length - 1; e >= 0; e--) this.base.remove(this.base.children[e]);
        this.base.removeFromParent();
      }
      this.props = null, this.webgl = null, this.scene = null, this.parent = null, this.base = null, this.children = null, this.isDestroyed = !0;
    }
  }
}

function Wu() {
  const t = window.innerWidth / window.innerHeight;
  return new dt(55, t, .1, 100);
}

class ar extends Pt {
  constructor(e = {}) {
    super(e), this.isCamera = !0, this.isUsed = !1;
  }
  
  afterInit() {
    this.cam && !this.base ? this.base = this.cam : this.cam || (this.cam = Wu()), this.base || (this.base = this.cam), this.webgl.hooks.resize.watch(this.resize.bind(this)), this.resize();
  }
  
  resize() {
    this.cam.aspect = this.webgl.viewport.width / this.webgl.viewport.height, this.cam.updateProjectionMatrix();
  }
  
  used() {
  }
  
  unused() {
  }
}

function Vs(t, e) {
  !t || t.isUsed == e || (t.isUsed = !!e, t.isUsed ? t.used() : t.unused());
}

class Ku extends Pt {
  constructor(e = {}) {
    super(e, !0), this.isScene = !0, this._cam = { current: !1, forced: !1 };
  }
  
  triggerInit() {
    this.isInit || (this.base = new ci, super.triggerInit());
  }
  
  render() {
    const e = this.webgl.threeRenderer, i = this.getCurrentCamera();
    i && e.render(this.base, i.cam);
  }
  
  get camera() {
    return this._cam.current;
  }
  
  set camera(e) {
    (!e || !e.isCamera) && (e = !1);
    const i = this._cam;
    i.current !== e && (Vs(i.current, !1), i.current = e, Vs(i.current, !0));
  }
  
  getCurrentCamera() {
    return this._cam.forced || this._cam.current;
  }
  
  triggerRender() {
    this.beforeRender && this.beforeRender(), this.render(), this.afterRender && this.afterRender();
  }
  
  destroy() {
    super.destroy();
  }
}

class qu extends ar {
  init() {
    this.base = new je, this.cam = new dt(55, this.webgl.viewport.viewportRatio, .1, 100), this.base.add(this.cam), this.isScrollEnabled = !0, this.isDesktopSize = window.innerWidth >= 768, this.offsetX = 0, this.offsetY = 0, this.breathingOffset = 0, this.maxScrollOffset = 2, this.tVecA = new E, this.tVecB = new E, this.currentX = 0, this.currentY = 0, this.isAnimatingIntro = !1, this.animProgress = 0, this.animDuration = 2e3, this.animStartTime = 0, this.isZoomingToVideo = !1, this.zoomProgress = 0, this.zoomDuration = 1e3, this.zoomStartTime = 0, this.startPosition = new E, this.targetPosition = new E, this.originalPosition = new E, this.originalRotation = {
      x: 0,
      y: 0,
      z: 0
    }, this.enableMouseMovement = window.innerWidth >= 768;
    const e = this.webgl.geometries.camera;
    e ? (this.cam.position.copy(e.position), this.cam.quaternion.copy(e.quaternion), this.cam.fov = e.fov * 1.2, this.cam.lookAt(0, 0, 0), this.cam.position.set(e.position.x, 2, e.position.z)) : (console.warn("Camera model not found, using default position"), this.cam.position.set(0, 0, 5), this.cam.lookAt(0, 0, 0)), this.initialPosition = new E().copy(this.base.position), this.initialRotation = {
      x: this.base.rotation.x,
      y: this.base.rotation.y,
      z: this.base.rotation.z
    }, window.addEventListener("resize", this.handleResize.bind(this));
  }
  
  handleResize() {
    this.enableMouseMovement = window.innerWidth >= 768, this.isDesktopSize = window.innerWidth >= 768;
  }
  
  update() {
    const e = this.webgl.time.dt;
    if (this.isAnimatingIntro) {
      this.updateIntroAnimation();
      return;
    }
    if (this.isZoomingToVideo) {
      this.updateZoomAnimation();
      return;
    }
    this.breathingOffset += e / 16.6667;
    const i = .01, s = .02;
    if (this.tVecA.x = pe(this.tVecA.x, Math.sin(this.breathingOffset * i) * s, .1, e), this.tVecA.y = pe(this.tVecA.y, Math.cos(this.breathingOffset * i) * s, .1, e), this.tVecA.z = pe(this.tVecA.z, Math.cos(this.breathingOffset * i) * s, .1, e), this.base.position.copy(this.tVecA), this.enableMouseMovement) {
      const n = this.offsetX = pe(this.offsetX, this.webgl.touch.normalizePos.x, .1, e);
      this.offsetY = pe(this.offsetY, this.webgl.touch.normalizePos.y, .1, e);
      const r = .1, o = 3;
      this.base.position.z -= n * 2 * r * o;
    }
    this.isScrollEnabled && this.scrollProgress > 0 && this.isDesktopSize && this.followVideoPlaneWithScroll();
  }
  
  followVideoPlaneWithScroll() {
    const e = this.webgl.scene.videoPlane;
    if (!e || !e.plane) return;
    const i = new E;
    e.plane.getWorldPosition(i);
    const s = this.scrollProgress * this.maxScrollOffset;
    this.base.position.y = this.initialPosition.y - s;
    const n = new E(i.x, i.y + s * 5, this.base.position.z);
    this.cam.lookAt(n);
  }
  
  followVideoPlane(e = .05) {
    const i = this.webgl.scene.videoPlane;
    if (!i || !i.plane) return;
    const s = new E;
    i.plane.getWorldPosition(s);
    const n = new E(5, 0, 0), r = s.clone().add(n), o = this.webgl.time.dt;
    this.base.position.x = pe(this.base.position.x, r.x, e, o), this.base.position.y = pe(this.base.position.y, r.y, e, o), this.base.position.z = pe(this.base.position.z, r.z, e, o), this.cam.lookAt(s);
  }
  
  startIntroAnimation(e = !1) {
    this.initialPosition.copy(this.base.position), this.targetPosition.copy(this.initialPosition);
    const i = this.webgl.scene.videoPlane;
    if (!i || !i.plane) return;
    const s = new E;
    i.plane.getWorldPosition(s);
    const n = new E(s.x, s.y, s.z);
    this.cam.lookAt(n), this.startPosition.set(this.initialPosition.x - 5, this.initialPosition.y + 5, this.initialPosition.z), this.base.position.copy(this.startPosition), this.isAnimatingIntro = !0, this.animProgress = 0, this.animStartTime = this.webgl.time.elapsed, this.animDuration = e ? 1e3 : 2e3, this.enableMouseMovement = !1;
  }
  
  updateIntroAnimation() {
    const e = this.webgl.time.elapsed - this.animStartTime;
    this.animProgress = Math.min(e / this.animDuration, 1);
    const i = this.easeOutCubic(this.animProgress), s = Ee(this.startPosition.x, this.targetPosition.x, i),
      n = Ee(this.startPosition.y, this.targetPosition.y, i), r = Ee(this.startPosition.z, this.targetPosition.z, i);
    this.base.position.set(s, n, r), this.animProgress >= 1 && (this.isAnimatingIntro = !1, this.enableMouseMovement = window.innerWidth >= 768);
  }
  
  zoomToVideoPlane() {
    this.originalPosition.copy(this.base.position), this.originalRotation = {
      x: this.base.rotation.x,
      y: this.base.rotation.y,
      z: this.base.rotation.z
    };
    const e = this.webgl.scene.videoPlane;
    if (!e || !e.plane) {
      console.warn("VideoPlane not found, cannot zoom to it");
      return;
    }
    this.startPosition.copy(this.base.position);
    const i = new E;
    e.plane.getWorldPosition(i), this.targetPosition.set(i.x * 4, i.y / 3, i.z), this.isZoomingToVideo = !0, this.zoomProgress = 0, this.zoomStartTime = this.webgl.time.elapsed, this.zoomDuration = 1e3, this.enableMouseMovement = !1;
    const s = document.querySelector("t-hero-three");
    s && s.toggleScrollEffect(!1);
  }
  
  returnFromVideoPlane() {
    this.startPosition.copy(this.base.position), this.targetPosition.copy(this.originalPosition), this.isZoomingToVideo = !0, this.zoomProgress = 0, this.zoomStartTime = this.webgl.time.elapsed, this.zoomDuration = 1e3, this.enableMouseMovement = !1;
    const e = document.querySelector("t-hero-three");
    e && e.toggleScrollEffect(!0);
  }
  
  updateZoomAnimation() {
    const e = this.webgl.time.elapsed - this.zoomStartTime;
    this.zoomProgress = Math.min(e / this.zoomDuration, 1);
    const i = this.customEasing(this.zoomProgress), s = Ee(this.startPosition.x, this.targetPosition.x, i),
      n = Ee(this.startPosition.y, this.targetPosition.y, i), r = Ee(this.startPosition.z, this.targetPosition.z, i);
    this.base.position.set(s, n, r), this.zoomProgress >= 1 && (this.isZoomingToVideo = !1, this.targetPosition.equals(this.originalPosition) && (this.enableMouseMovement = window.innerWidth >= 768));
  }
  
  easeOutCubic(e) {
    return 1 - Math.pow(1 - e, 3);
  }
  
  customEasing(e) {
    let o = e, a, l, h;
    for (let c = 0; c < 5 && (a = 1 - o, l = o * o * o, h = 3 * a * a * o * .6 + 3 * a * o * o * .3 + l - e, !(Math.abs(h) < 1e-4)); c++) {
      const u = 3 * a * a * .6 + 6 * a * o * (.3 - .6) + 3 * o * o * (1 - .3);
      o -= h / u;
    }
    return 3 * (1 - o) * (1 - o) * o * 0 + 3 * (1 - o) * o * o * 1 + o * o * o;
  }
  
  disableMouseMovement() {
    this.enableMouseMovement = !1;
  }
  
  enableMouseMovement() {
    this.enableMouseMovement = !0;
  }
}

const li = "orbitPos";

class $u extends ar {
  init() {
    this.base = new je, this.cam = new dt(45, this.webgl.viewport.viewportRatio, 1, 1e3);
    const e = localStorage.getItem(li) ? JSON.parse(localStorage.getItem(li)) : null;
    e ? this.cam.position.set(e.x, e.y, e.z) : this.cam.position.set(1, 1, 1).multiplyScalar(10), this.controls = new mh(this.cam, this.webgl.canvas), this.controls.enabled = !1, this.controls.enableDamping = !0, this.controls.dampingFactor = .1, this.controls.addEventListener("end", this.savePosition.bind(this)), this.base.add(this.cam);
  }
  
  getPosition() {
  }
  
  savePosition() {
    localStorage.setItem(li, JSON.stringify(this.cam.position));
  }
  
  update() {
    this.isUsed && this.controls.update();
  }
  
  used() {
    this.controls.enabled = !0;
  }
  
  unused() {
    this.controls.enabled = !1;
  }
}

function Wt(t, e, i) {
  return {
    vs: t, fs: e, use: n => {
      n.fragmentShader = e, n.vertexShader = t;
    }, unuse: () => {
    }
  };
}

const Yu = `precision highp float;
#define GLSLIFY 1

varying vec2 vUv;

void main() {
	gl_FragColor = vec4(vUv, 1.0, 1.0);
}
`, Xu = `precision highp float;
#define GLSLIFY 1

varying vec2 vUv;

void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`, Zu = Wt(Xu, Yu);

class wi extends K {
  constructor(e = {}) {
    super();
    const i = this.webgl = Be();
    this.uniforms = { ...i.uniforms }, Zu.use(this);
  }
}

let Os = null;
wi.use = () => Os = Os ?? new wi;
wi.unuse = () => {
};
const Qu = `#define GLSLIFY 1
uniform sampler2D tDiffuse;
uniform float mirror;
varying vec4 vUv;

void main() {
	vec2 uv = vUv.xy / vUv.w;
	vec4 reflectorColor = texture2D(tDiffuse, uv);
	gl_FragColor = vec4(reflectorColor.rgb * mirror, 1.0);
	// gl_FragColor.rgb = vec3(uv, 1.0);
}
`, Ju = `#define GLSLIFY 1
uniform mat4 textureMatrix;
varying vec4 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
	vPosition = position;
	vNormal = normalize(normalMatrix * normal);
	vUv = textureMatrix * vec4(position, 1.0);
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`, ed = Wt(Ju, Qu);

class ut extends K {
  constructor(e = {}) {
    super();
    const i = this.webgl = Be();
    this.uniforms = {
      ...i.uniforms,
      tDiffuse: { value: null },
      textureMatrix: { value: null },
      mirror: { value: .5 },
      debug: { value: 0 }
    }, ed.use(this);
  }
}

let Us = null;
ut.use = () => Us = Us ?? new ut;
ut.unuse = () => {
};
const td = `#define GLSLIFY 1
uniform sampler2D tDiffuse;
uniform sampler2D tBlurred;
uniform sampler2D tDepth;
uniform sampler2D tBake;
uniform sampler2D tNormal;

uniform float mirror;
varying vec4 vUv;

varying vec2 meshUV;

float blendSoftLight(float base, float blend) {
	return blend < 0.5
		? 2.0 * base * blend + base * base * (1.0 - 2.0 * blend)
		: sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend);
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
	return vec3(
		blendSoftLight(base.r, blend.r),
		blendSoftLight(base.g, blend.g),
		blendSoftLight(base.b, blend.b)
	);
}

vec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {
	return blendSoftLight(base, blend) * opacity + base * (1.0 - opacity);
}

void main() {
	vec2 uv = vUv.xy / vUv.w;
	vec4 reflectorColor = texture2D(tDiffuse, uv);

	vec3 bake = texture2D(tBake, meshUV).rgb;

	// NORMAL
	vec2 normal_uv = vec2(0.0);
	vec3 normalColor = texture2D(tNormal, meshUV * 10.0).rgb;
	vec3 normal = normalize(
		vec3(
			normalColor.r * 2.0 - 1.0,
			normalColor.b,
			normalColor.g * 2.0 - 1.0
		)
	);

	vec3 coord = vUv.xyz / vUv.w;
	normal_uv = coord.xy + coord.z * normal.xz * 0.065;

	vec4 diffuse = texture2D(tDiffuse, normal_uv);
	vec4 blur = texture2D(tBlurred, normal_uv);

	vec3 outputColor = blur.rgb * 0.15;

	outputColor *= bake;

	gl_FragColor = vec4(reflectorColor.rgb * mirror, 1.0);
	gl_FragColor.rgb = outputColor;
}
`, id = `#define GLSLIFY 1
uniform mat4 textureMatrix;
varying vec4 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

varying vec2 meshUV;

void main() {
	vPosition = position;
	vNormal = normalize(normalMatrix * normal);

	meshUV = uv;

	vUv = textureMatrix * vec4(position, 1.0);
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`, sd = Wt(id, td);

class It extends K {
  constructor(e = {}) {
    super();
    const i = this.webgl = Be();
    this.uniforms = {
      ...i.uniforms,
      tDiffuse: { value: null },
      tBlurred: { value: null },
      tDepth: { value: null },
      tBake: { value: i.textures.shadows },
      tNormal: { value: i.textures.normal },
      textureMatrix: { value: null },
      mirror: { value: .5 },
      debug: { value: 0 }
    }, sd.use(this);
  }
}

let Is = null;
It.use = () => Is = Is ?? new It;
It.unuse = () => {
};
const nd = `precision highp float;
#define GLSLIFY 1

uniform highp sampler2D inputBuffer;
uniform mediump float blurStrength;

uniform vec4 resolution;

const float PI2 = 6.28318530718;
const float BLUR_SAMPLES = 10.0;

vec4 blur(sampler2D image, vec2 uv) {
	vec4 color = texture2D(image, uv);
	for (float d = 0.0; d < PI2; d += PI2 / BLUR_SAMPLES) {
		color += texture2D(image, uv + vec2(cos(d), sin(d)) * blurStrength);
	}
	color /= BLUR_SAMPLES * 1.095;
	return color;
}

vec4 blur5(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
	vec4 color = vec4(0.0);
	vec2 off1 = vec2(1.3333333333333333) * direction;
	color += texture2D(image, uv) * 0.29411764705882354;
	color += texture2D(image, uv + off1 / resolution) * 0.35294117647058826;
	color += texture2D(image, uv - off1 / resolution) * 0.35294117647058826;
	return color;
}

varying vec2 vUv;
// varying vec2 vUv1;
// varying vec2 vUv2;
// varying vec2 vUv3;

void main() {
	vec4 sum = blur(inputBuffer, vUv); // Top left

	gl_FragColor = sum;
	// gl_FragColor.rgb = vec3(test.a);
	// gl_FragColor.a = 1.;
}
`, rd = new Float32Array([-2, 0, 0, -2, 2, 2]), lr = new Zs;
lr.setAttribute("position", new hi(rd, 2));
const od = ["precision highp float;", "attribute vec2 position;", "varying vec2 vUv;", "void main() {", "vUv = position;", "gl_Position =  vec4(2.0 * position - 1.0, 0.,  1);", "}"].join(""),
  zs = new qs, ad = "precision highp float;varying vec2 vUv;void main(){gl_FragColor=vec4(vUv,0.,1.);}";
let ge;
new it(1, 1);

function ld({ renderer: t, useRawShader: e = !0, vertexShader: i, fragmentShader: s, ...n } = {}) {
  if (!t) throw new Error("WebGL Renderer is required");
  const r = e ? _r : K, o = new r(Object.assign({}, {
    vertexShader: od,
    fragmentShader: ad,
    depthTest: !1,
    depthWrite: !1,
    transparent: !0
  }, n));
  return i && (i.use ? i.use(o) : o.vertexShader = i), s && (s.use ? s.use(o) : o.fragmentShader = s), ge || (ge = new _e(lr, o), ge.frustumCulled = !1, ge.matrixAutoUpdate = !1, ge.matrixWorldAutoUpdate = !1), {
    cam: zs,
    screen: ge,
    material: o,
    uniforms: o.uniforms,
    u: o.uniforms,
    render() {
      const l = t.sortObjects, h = t.shadowMap.enabled, c = t.autoclear;
      t.sortObjects = !1, t.shadowMap.enabled = !1, t.autoclear = !1, ge.material = o, t.render(ge, zs), t.sortObjects = l, t.shadowMap.enabled = h, t.autoclear = c;
    }
  };
}

function cd(t) {
  const e = t.threeRenderer, i = { strength: 60, strengthTarget: 60 };
  t.gui && t.gui.addBinding(i, "strengthTarget", { label: "DOF Strength", min: 0, max: 100 });
  
  function s(c) {
    const u = new b;
    return e.getDrawingBufferSize(u), new re(u.x * c, u.y * c, ie, ie);
  }
  
  const n = s(.15), r = s(.07), o = s(.3), a = ld({
    renderer: t.threeRenderer,
    fragmentShader: nd,
    uniforms: { blurStrength: { value: .0028 }, blurAlpha: { value: 1 }, inputBuffer: { value: null, type: "t" } }
  });
  
  function l(c) {
    const { inputBuffer: u, blurStrength: p } = a.uniforms, d = e.getRenderTarget();
    c = (c == null ? void 0 : c.texture) || c || (d == null ? void 0 : d.texture), u.value = c, i.strength += (i.strengthTarget - i.strength) / 6;
    const f = Yt(i.strength, 30, 100, 0, .01), m = Yt(i.strength, 50, 100, 0, .01), B = Yt(i.strength, 0, 100, 0, .015);
    return f > 0 && (p.value = f, e.setRenderTarget(n), e.clearColor(), a.render(), u.value = n.texture), m > 0 && (p.value = m, e.setRenderTarget(r), e.clearColor(), a.render(), u.value = r.texture), p.value = B, e.setRenderTarget(o), e.clearColor(), a.render(), e.setRenderTarget(d), h.outputTexture;
  }
  
  const h = {
    render: l, get outputTexture() {
      return o.texture;
    }
  };
  return h;
}

class kt extends Pt {
  constructor({
                resolution: e = 256,
                mirror: i = .9,
                width: s = 1,
                height: n = 1,
                geometry: r = null,
                mesh: o = null,
                ground: a = !1,
                dynamicUpdate: l = !0
              } = {}) {
    super(), this.config = {
      resolution: e,
      mirror: i,
      width: s,
      height: n,
      geometry: r,
      mesh: o,
      ground: a,
      dynamicUpdate: l
    }, this.lastUpdateTime = 0, this.updateInterval = 1e3 / 30;
  }
  
  init() {
    this.base = new je, this.configureQualityBasedOnDeviceCapabilities(), this.reflectorPlane = new js, this.normal = new E, this.reflectorWorldPosition = new E, this.cameraWorldPosition = new E, this.rotationMatrix = new ts, this.lookAtPosition = new E(0, 0, -1), this.clipPlane = new nt, this.view = new E, this.target = new E, this.q = new nt, this.textureMatrix = new ts, this.virtualCamera = new dt, this.webgl.qualitySettings && (this.config.resolution = this.webgl.qualitySettings.reflectorResolution, this.webgl.deviceCapabilities.tier === "low" ? (this.updateInterval = 1e3 / 15, this.config.dynamicUpdate = !1) : this.webgl.deviceCapabilities.tier === "medium" && (this.updateInterval = 1e3 / 24)), this.config.mesh ? (this.mesh = this.config.mesh, this.geo = this.mesh.geometry, this.originalMaterial = this.mesh.material) : (this.geo = this.config.geometry || new it(this.config.width, this.config.height), this.mesh = new _e(this.geo)), this.setupRenderTargets(), this.material = this.config.ground ? new It : new ut, this.material.uniforms.mirror.value = this.config.mirror, this.material.uniforms.textureMatrix.value = this.textureMatrix, this.material.uniforms.tDiffuse.value = this.renderTarget.texture, this.config.ground && (this.blurPass = cd(this.webgl)), this.mesh.material = this.material, this.config.mesh || this.base.add(this.mesh);
  }
  
  configureQualityBasedOnDeviceCapabilities() {
    const e = this.webgl;
    if (e.qualitySettings) {
      this.config.resolution = e.qualitySettings.reflectorResolution || this.config.resolution;
      const i = e.qualitySettings.reflectorUpdateInterval;
      i !== void 0 && (this.updateInterval = i, this.config.dynamicUpdate = i === 0);
    } else /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (this.config.resolution = Math.min(this.config.resolution, 256), this.updateInterval = 1e3 / 15, this.config.dynamicUpdate = !1);
  }
  
  setupRenderTargets(e = null) {
    const i = e || this.config.resolution,
      s = { minFilter: ie, magFilter: ie, format: wr, encoding: this.renderer ? this.renderer.outputEncoding : null };
    this.renderTarget && (this.renderTarget.dispose(), this.renderTarget.depthTexture && this.renderTarget.depthTexture.dispose()), this.renderTarget = new re(i, i, s), this.renderTarget.depthBuffer = !0, this.renderTarget.depthTexture = new Gs(i, i), this.renderTarget.depthTexture.format = xr, this.renderTarget.depthTexture.type = yr;
  }
  
  beforeRender(e, i) {
    if (!this.mesh || (this.reflectorWorldPosition.setFromMatrixPosition(this.mesh.matrixWorld), this.cameraWorldPosition.setFromMatrixPosition(e.matrixWorld), this.rotationMatrix.extractRotation(this.mesh.matrixWorld), this.normal.set(0, 0, 1), this.normal.applyMatrix4(this.rotationMatrix), this.view.subVectors(this.reflectorWorldPosition, this.cameraWorldPosition), this.view.dot(this.normal) > 0)) return;
    this.view.reflect(this.normal).negate(), this.view.add(this.reflectorWorldPosition), this.rotationMatrix.extractRotation(e.matrixWorld), this.lookAtPosition.set(0, 0, -1), this.lookAtPosition.applyMatrix4(this.rotationMatrix), this.lookAtPosition.add(this.cameraWorldPosition), this.target.subVectors(this.reflectorWorldPosition, this.lookAtPosition), this.target.reflect(this.normal).negate(), this.target.add(this.reflectorWorldPosition), this.virtualCamera.position.copy(this.view), this.virtualCamera.up.set(0, 1, 0), this.virtualCamera.up.applyMatrix4(this.rotationMatrix), this.virtualCamera.up.reflect(this.normal), this.virtualCamera.lookAt(this.target), this.virtualCamera.far = e.far, this.virtualCamera.updateMatrixWorld(), this.virtualCamera.projectionMatrix.copy(e.projectionMatrix), this.textureMatrix.set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1), this.textureMatrix.multiply(this.virtualCamera.projectionMatrix), this.textureMatrix.multiply(this.virtualCamera.matrixWorldInverse), this.textureMatrix.multiply(this.mesh.matrixWorld), this.reflectorPlane.setFromNormalAndCoplanarPoint(this.normal, this.reflectorWorldPosition), this.reflectorPlane.applyMatrix4(this.virtualCamera.matrixWorldInverse), this.clipPlane.set(this.reflectorPlane.normal.x, this.reflectorPlane.normal.y, this.reflectorPlane.normal.z, this.reflectorPlane.constant);
    const s = this.virtualCamera.projectionMatrix;
    this.q.x = (Math.sign(this.clipPlane.x) + s.elements[8]) / s.elements[0], this.q.y = (Math.sign(this.clipPlane.y) + s.elements[9]) / s.elements[5], this.q.z = -1, this.q.w = (1 + s.elements[10]) / s.elements[14], this.clipPlane.multiplyScalar(2 / this.clipPlane.dot(this.q)), s.elements[2] = this.clipPlane.x, s.elements[6] = this.clipPlane.y, s.elements[10] = this.clipPlane.z + 1, s.elements[14] = this.clipPlane.w;
  }
  
  render(e, i, s) {
    if (!this.mesh) return;
    const n = performance.now();
    if (this.config.dynamicUpdate || n - this.lastUpdateTime >= this.updateInterval) {
      if (this.lastUpdateTime = n, this.mesh.visible = !1, this.beforeRender(s, i), e.setRenderTarget(this.renderTarget), e.clear(), e.render(i, this.virtualCamera), this.config.ground && this.blurPass) {
        const o = this.blurPass.render(this.renderTarget);
        this.material.uniforms.tBlurred.value = o, this.webgl.reflectorTexture = this.renderTarget.texture;
      }
      this.mesh.visible = !0, e.setRenderTarget(null);
    }
  }
  
  setLODLevel(e) {
    switch (e) {
      case 0:
        this.config.dynamicUpdate = !1, this.updateInterval = 1e3 / 10, this.renderTarget && this.renderTarget.width > 256 && this.setupRenderTargets(256);
        break;
      case 1:
        this.config.dynamicUpdate = !1, this.updateInterval = 1e3 / 24, this.renderTarget && this.renderTarget.width !== 512 && this.setupRenderTargets(512);
        break;
      case 2:
      default:
        this.config.dynamicUpdate = !0, this.updateInterval = 1e3 / 30, this.renderTarget && this.renderTarget.width < this.config.resolution && this.setupRenderTargets(this.config.resolution);
        break;
    }
  }
  
  dispose() {
    !this.config.mesh && !this.config.geometry && this.geo.dispose(), this.originalMaterial && (this.mesh.material = this.originalMaterial), this.blurPass, ut.unuse(), this.renderTarget.dispose(), this.renderTargetBlur && this.renderTargetBlur.dispose();
  }
}

const hd = `precision highp float;
#define GLSLIFY 1

uniform sampler2D tMap;
varying vec2 vUv;
varying vec4 floorUV;
varying vec3 vNormal;

void main() {
	vec2 uv = floorUV.xy / floorUV.w;
	vec3 diffuse = texture2D(tMap, uv).rgb;
	// diffuse *= vNormal.y;
	// diffuse *= 0.05;
	gl_FragColor = vec4(diffuse, 1.0);
}
`, ud = `precision highp float;
#define GLSLIFY 1
uniform mat4 textureMatrix;

varying vec2 vUv;
varying vec4 floorUV;
varying vec3 vNormal;
void main() {
	floorUV = vec4(1.0);
	vUv = uv;
	vNormal = normal;
	// UGLY AF
	vec3 transformed = position;
	transformed.x *= 0.5;
	transformed.y *= 0.5;
	transformed.z *= 0.5;
	floorUV = textureMatrix * vec4(transformed, 1.0);
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`, dd = Wt(ud, hd);

class zt extends K {
  constructor(e = {}) {
    super();
    const i = this.webgl = Be();
    this.uniforms = {
      ...i.uniforms,
      tMap: { value: null },
      textureMatrix: { value: null },
      mirror: { value: .5 },
      debug: { value: 0 }
    }, dd.use(this);
  }
}

let Fs = null;
zt.use = () => Fs = Fs ?? new zt;
zt.unuse = () => {
};
const pd = `
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
`, Ns = `
uniform float time;
uniform vec3 energyColor;
uniform float pulseSpeed;
uniform float numberOfPulses;
uniform float pulseWidth;
uniform float glowStrength;
uniform float glowSpread;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
    // Pulse modifié avec une meilleure gestion de l'alpha
    float pulsePhase = fract(vUv.x * numberOfPulses - time * pulseSpeed);

    // Fonction de pulse modifiée pour éviter les transitions brusques
    float pulse = smoothstep(0.0, pulseWidth, pulsePhase) *
                 smoothstep(pulseWidth * 2.0, pulseWidth, pulsePhase);

    // Modification de l'effet Fresnel
    vec3 viewDirection = normalize(vViewPosition);
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDirection)), glowSpread);

    // Calcul amélioré de l'alpha pour éviter les artefacts
    float alpha = max(pulse * 0.8, fresnel * 0.3);
    alpha = smoothstep(0.1, 1.0, alpha); // Seuil plus élevé pour éviter les valeurs trop faibles

    // Couleur finale avec une meilleure gestion de l'intensité
    vec3 finalColor = energyColor * (pulse + fresnel * 0.5) * glowStrength;

    gl_FragColor = vec4(finalColor, alpha);
}
`;

class Hs {
  constructor(e, i = {}) {
    this.params = {
      color: i.color || new st(1, 1, 1),
      pulseSpeed: i.pulseSpeed || .5,
      numberOfPulses: i.numberOfPulses || 3,
      pulseWidth: i.pulseWidth || .1,
      glowStrength: i.glowStrength || 1.5,
      glowSpread: i.glowSpread || 2
    };
    const s = Be();
    s.deviceCapabilities && s.deviceCapabilities.tier === "low" ? (this.fragmentShader = `
            uniform float time;
            uniform vec3 energyColor;
            uniform float pulseSpeed;
            uniform float numberOfPulses;
            uniform float pulseWidth;
            uniform float glowStrength;

            varying vec2 vUv;
            varying vec3 vNormal;

            void main() {
              // Version simplifiée sans calcul de Fresnel
              float pulsePhase = fract(vUv.x * numberOfPulses - time * pulseSpeed);
              float pulse = smoothstep(0.0, pulseWidth, pulsePhase) *
                           smoothstep(pulseWidth * 2.0, pulseWidth, pulsePhase);

              // Calcul d'alpha simplifiée
              float alpha = pulse * 0.8;

              vec3 finalColor = energyColor * pulse * glowStrength;
              gl_FragColor = vec4(finalColor, alpha);
            }
          `, this.startAnimationLowPower()) : (this.fragmentShader = Ns, this.startAnimation()), this.clock = new Pr, this.init(e);
  }
  
  init(e) {
    if (this.cable = e, !this.cable) {
      console.warn("No cable mesh provided");
      return;
    }
    return this.material = new K({
      vertexShader: pd,
      fragmentShader: Ns,
      uniforms: {
        time: { value: 0 },
        energyColor: { value: this.params.color },
        pulseSpeed: { value: this.params.pulseSpeed },
        numberOfPulses: { value: this.params.numberOfPulses },
        pulseWidth: { value: this.params.pulseWidth },
        glowStrength: { value: this.params.glowStrength },
        glowSpread: { value: this.params.glowSpread }
      },
      transparent: !1,
      blending: Mr,
      blendSrc: Sr,
      blendDst: Er,
      blendEquation: Cr,
      depthWrite: !1,
      depthTest: !0,
      side: we,
      alphaTest: .2
    }), this.originalMaterial = this.cable.material, this.cable.renderOrder = 2e3, this.cable.parent && (this.cable.parent.renderOrder = 1999), this.cable.traverse(i => {
      i.isMesh && (i.renderOrder = 2e3);
    }), this.cable.material = this.material, this.startAnimation(), this.cable;
  }
  
  startAnimationLowPower() {
    if (!this.material || !this.material.uniforms) return;
    const e = () => {
      this.material && this.material.uniforms && (this.material.uniforms.time.value = this.clock.getElapsedTime() * .5, this.animationFrameId = setTimeout(() => {
        requestAnimationFrame(e);
      }, 100));
    };
    e();
  }
  
  startAnimation() {
    if (!this.material || !this.material.uniforms) return;
    const e = () => {
      this.material && this.material.uniforms && (this.material.uniforms.time.value = this.clock.getElapsedTime(), this.animationFrameId = requestAnimationFrame(e));
    };
    e();
  }
  
  updateParams(e = {}) {
    if (!this.material || !this.material.uniforms) return;
    const i = this.material.uniforms;
    e.color !== void 0 && (i.energyColor.value = new st(e.color), this.params.color = e.color), e.pulseSpeed !== void 0 && (i.pulseSpeed.value = e.pulseSpeed, this.params.pulseSpeed = e.pulseSpeed), e.numberOfPulses !== void 0 && (i.numberOfPulses.value = e.numberOfPulses, this.params.numberOfPulses = e.numberOfPulses), e.pulseWidth !== void 0 && (i.pulseWidth.value = e.pulseWidth, this.params.pulseWidth = e.pulseWidth), e.glowStrength !== void 0 && (i.glowStrength.value = e.glowStrength, this.params.glowStrength = e.glowStrength), e.glowSpread !== void 0 && (i.glowSpread.value = e.glowSpread, this.params.glowSpread = e.glowSpread);
  }
  
  dispose() {
    this.animationFrameId && cancelAnimationFrame(this.animationFrameId), this.material && this.material.dispose(), this.cable && this.originalMaterial && (this.cable.material = this.originalMaterial), this.material = null, this.cable = null, this.originalMaterial = null;
  }
}

function md(t, e = {}) {
  const i = Be();
  if (i.deviceCapabilities && i.deviceCapabilities.tier === "low") {
    const n = {
      ...e,
      numberOfPulses: Math.min(e.numberOfPulses || 3, 2),
      glowStrength: Math.min(e.glowStrength || 1.5, 1),
      glowSpread: Math.min(e.glowSpread || 2, 1.5)
    };
    return new Hs(t, n);
  }
  return new Hs(t, e);
}

class vd extends Pt {
  init() {
    this.base = new je;
    const e = this.webgl.geometries.banc.clone();
    this.webgl.geometries.ground;
    const i = this.webgl.geometries.wall, s = this.webgl.geometries.emissive, n = this.webgl.geometries.cables;
    this.banc = e, this.bancMaterial = new zt, this.overrideMaterial = new tt({ color: "black" }), e.material = this.overrideMaterial, s.material = new tt({ color: "#E8E8E8" }), this.cableEffect = md(n, {
      color: new st(2316287),
      pulseSpeed: .3,
      numberOfPulses: 8,
      pulseWidth: .03,
      glowStrength: 3.8,
      glowSpread: 9.5
    }), this.base.add(s), this.base.add(e), this.base.add(i), this.base.add(n), this.createBlackFloor(), this.groundReflector = this.createGroundReflector(), this.mirrors = this.createMirrors(), this.webgl.hooks.beforeFrame.watch(this.render.bind(this));
  }
  
  createBlackFloor() {
    const e = new tt({ color: "#000000", transparent: !1, depthWrite: !0, side: we });
    new tt({ color: "red", transparent: !1, depthWrite: !0, side: we });
    const i = new it(30, 30);
    this.blackFloor = new _e(i, e), this.blackFloor.position.y = -.01, this.blackFloor.rotation.x = -Math.PI / 2, this.base.add(this.blackFloor);
    const s = new it(30, 10);
    this.frontWall = new _e(s, e), this.frontWall.position.set(0, -5, 15), this.base.add(this.frontWall), this.backWall = new _e(s.clone(), e), this.backWall.position.set(0, -5, -15), this.backWall.rotation.y = Math.PI, this.base.add(this.backWall);
    const n = new it(30, 10);
    this.leftWall = new _e(n, e), this.leftWall.position.set(-15, -5, 0), this.leftWall.rotation.y = Math.PI / 2, this.base.add(this.leftWall), this.rightWall = new _e(n.clone(), e), this.rightWall.position.set(15, -5, 0), this.rightWall.rotation.y = -Math.PI / 2, this.base.add(this.rightWall), this.blackFloorGroup = new je, this.blackFloorGroup.add(this.blackFloor), this.blackFloorGroup.add(this.frontWall), this.blackFloorGroup.add(this.backWall), this.blackFloorGroup.add(this.leftWall), this.blackFloorGroup.add(this.rightWall), this.base.add(this.blackFloorGroup);
  }
  
  createMirrors() {
    const e = [], { top: i, left: s, right: n } = this.webgl.geometries, r = 1024, o = 2.6, a = 4.0497,
      l = new kt({ resolution: r, width: o, height: a });
    this.add(l), l.base.position.copy(n.position);
    const h = new kt({ resolution: r, width: o, height: a });
    this.add(h), h.base.position.copy(s.position), h.base.rotateY(Math.PI);
    const c = new kt({ resolution: r, width: 2.6, height: 8.62 });
    return this.add(c), c.base.position.copy(i.position), c.base.rotateX(-Math.PI / 2), c.base.rotateY(Math.PI), e.push(l, h, c), e;
  }
  
  createGroundReflector() {
    const e = new kt({ resolution: 1024, width: 24, height: 24, mirror: .05, ground: !0 });
    return this.add(e), e.base.rotateX(-Math.PI / 2), e;
  }
  
  render() {
    this.banc.material = this.overrideMaterial;
    const e = this.scene.getCurrentCamera().cam, i = this.webgl.scene.base;
    this.mirrors.forEach(s => {
      s.render(this.webgl.threeRenderer, i, e);
    }), this.groundReflector.render(this.webgl.threeRenderer, i, e), this.updateMaterial();
  }
  
  updateMaterial() {
  }
  
  dispose() {
    var e;
    this.blackFloor && (this.blackFloor.geometry.dispose(), this.blackFloor.material.dispose()), this.mirrors.forEach(i => {
      i.dispose();
    }), (e = this.groundReflector) == null || e.dispose(), this.cableEffect && this.cableEffect.dispose();
  }
}

class fd extends Pt {
  init() {
    var n;
    this.base = new je;
    const e = this.webgl.geometries.videoplane;
    if (!e) {
      console.warn("VideoPlane: la géométrie videoplane n'a pas été trouvée");
      return;
    }
    const i = ((n = this.webgl.videos) == null ? void 0 : n.video1) || this.createVideoElement();
    i.videoWidth ? this.adjustPlaneAspectRatio(e, i) : i.addEventListener("loadedmetadata", () => {
      this.adjustPlaneAspectRatio(e, i);
    }), this.videoTexture = new Tr(i), Object.assign(this.videoTexture, {
      colorSpace: z,
      format: kr,
      minFilter: ie,
      magFilter: ie,
      generateMipmaps: !1,
      flipY: !1
    });
    const s = new tt({ map: this.videoTexture, side: we, transparent: !0 });
    e && (e.material && e.material.dispose(), e.material = s, e.rotation.x = Math.PI, e.rotation.y = Math.PI, this.base.add(e)), this.raycaster = new Rr, this.mouse = new b, this.plane = e, this.onClickBound = this.onClick.bind(this), window.addEventListener("click", this.onClickBound), this.startVideo(i), this.webgl.hooks.afterFrame.watch(this.checkPauseState.bind(this));
  }
  
  checkPauseState() {
    if (!this.videoTexture || !this.videoTexture.source || !this.videoTexture.source.data) return;
    const e = this.videoTexture.source.data;
    this.webgl.time.isPaused ? e.paused || (this.videoTexture.needsUpdate = !1, e.pause()) : e.paused && e.play().catch(i => {
      console.error("Erreur lors de la reprise de la vidéo:", i);
    }).then(() => {
      this.videoTexture.needsUpdate = !0;
    });
  }
  
  adjustPlaneAspectRatio(e, i) {
    if (!e) return;
    const s = 21 / 9, n = i.videoWidth, r = i.videoHeight;
    if (!n || !r) {
      console.warn("Dimensions vidéo non disponibles");
      return;
    }
    const o = n / r, a = e.scale.x;
    if (e.scale.set(a, a / s, 1), e.material && e.material.map) {
      if (o > s) {
        const l = s / o, h = (1 - l) / 2;
        e.material.map.repeat.set(l, -1), e.material.map.offset.set(h, 1);
      } else {
        const l = o / s, h = (1 - l) / 2;
        e.material.map.repeat.set(1, -l), e.material.map.offset.set(0, 1 - h);
      }
      e.material.map.needsUpdate = !0;
    }
  }
  
  startVideo(e) {
    e && e.paused && e.play().catch(i => {
      console.error("Erreur lors de la lecture de la vidéo:", i);
    });
  }
  
  createVideoElement(e = {}) {
    const i = document.createElement("video");
    return Object.assign(i, {
      src: window.three.videoUrl,
      muted: !0,
      loop: !0,
      autoplay: !0,
      playsInline: !0,
      preload: "auto",
      playbackRate: 1,
      defaultPlaybackRate: 1, ...e
    }), i.setAttribute("webkit-playsinline", "true"), i.setAttribute("x-webkit-airplay", "allow"), i.setAttribute("disablePictureInPicture", "true"), i.setAttribute("crossorigin", "anonymous"), i.addEventListener("loadeddata", () => {
      i.readyState >= 3 && i.play().catch(s => console.error("Erreur lors de la lecture de la vidéo:", s));
    }), i;
  }
  
  onClick(e) {
    var n, r;
    if (!this.scene || !this.plane || !this.raycaster) return;
    const i = this.getCurrentCamera();
    if (!i || !i.cam) return;
    if (this.mouse.x = e.clientX / window.innerWidth * 2 - 1, this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1, this.raycaster.setFromCamera(this.mouse, i.cam), this.raycaster.intersectObject(this.plane).length > 0) {
      const o = (r = (n = this.videoTexture) == null ? void 0 : n.source) == null ? void 0 : r.data;
      o && (o.paused ? o.play().catch(a => console.error("Erreur lors de la lecture:", a)) : o.pause());
    }
  }
  
  getCurrentCamera() {
    return this.scene ? typeof this.scene.getCurrentCamera == "function" ? this.scene.getCurrentCamera() : this.scene.camera || null : null;
  }
  
  destroy() {
    this.webgl && this.webgl.hooks && this.webgl.hooks.afterFrame && this.webgl.hooks.afterFrame.unwatch(this.checkPauseState, this), this.videoTexture && (this.videoTexture.dispose(), this.videoTexture = null), this.plane && this.plane.material && this.plane.material.dispose(), this.onClickBound && (window.removeEventListener("click", this.onClickBound), this.onClickBound = null), super.destroy();
  }
}

class bd extends Ku {
  constructor() {
    super();
  }
  
  init() {
    this.mainCamera = this.add(qu), this.debugCamera = this.add($u), this.camera = this.mainCamera, this.room = this.add(vd), this.videoPlane = this.add(fd);
  }
  
  update() {
  }
  
  debug() {
    const e = this.webgl.gui;
    if (!e) return;
    const i = e.addFolder({ title: "Scene", expanded: !0 }),
      s = [{ text: "Main", value: this.mainCamera }, { text: "Debug", value: this.debugCamera }];
    i.addBlade({ view: "list", label: "Cameras", options: s, value: this.camera }).on("change", n => {
      this.camera = n.value;
    });
  }
  
  getComponent(e) {
    return this.components ? this.components.find(i => i.name === e ? !0 : i.constructor.name === e) : null;
  }
  
  getCurrentCamera() {
    return this.mainCamera;
  }
  
  dispose() {
    for (this.mainCamera && (this.mainCamera.destroy(), this.mainCamera = null), this.debugCamera && (this.debugCamera.destroy(), this.debugCamera = null), this.room && (this.room.dispose(), this.room = null), this.videoPlane && (this.videoPlane.destroy(), this.videoPlane = null); this.children.length > 0;) {
      const e = this.children[0];
      this.remove(e), e.destroy();
    }
    if (this.base) for (; this.base.children.length > 0;) {
      const e = this.base.children[0];
      this.base.remove(e);
    }
  }
}

function gd() {
  const t = Q.to;
  Q.to = function(s, n) {
    Array.isArray(s) ? s.forEach(e) : e(s);
    const r = t.call(this, s, n), o = n.onComplete;
    return n.onComplete = function() {
      Array.isArray(s) ? s.forEach(i) : i(s), o && o.apply(this, arguments);
    }, r;
  };
  
  function e(s) {
    s && typeof s == "object" && "_isBeingAnimated" in s && (s._isBeingAnimated = !0);
  }
  
  function i(s) {
    s && typeof s == "object" && "_isBeingAnimated" in s && (s._isBeingAnimated = !1);
  }
}

function _d(t) {
  let e = null, i = null;
  const s = {
    "Ancien téléphone (2015)": {
      tier: "low",
      description: "1GB RAM, processeur dual-core, GPU faible",
      pixelRatio: 1,
      cores: 2,
      memory: 1,
      rendererInfo: "Mali-400 MP or similar"
    },
    "iPhone 6": {
      tier: "low",
      description: "2GB RAM, A8 chip, PowerVR GPU",
      pixelRatio: 2,
      cores: 2,
      memory: 2,
      rendererInfo: "Apple A8 GPU"
    },
    "Téléphone milieu de gamme (2018)": {
      tier: "medium",
      description: "3GB RAM, octa-core, GPU moyen",
      pixelRatio: 2,
      cores: 8,
      memory: 3,
      rendererInfo: "Adreno 506 or similar"
    },
    "iPhone X": {
      tier: "medium",
      description: "3GB RAM, A11 Bionic, Apple GPU",
      pixelRatio: 3,
      cores: 6,
      memory: 3,
      rendererInfo: "Apple A11 GPU"
    },
    "Téléphone haut de gamme (2022)": {
      tier: "high",
      description: "8GB RAM, octa-core, GPU puissant",
      pixelRatio: 3,
      cores: 8,
      memory: 8,
      rendererInfo: "Adreno 650 or similar"
    },
    "iPhone 13 Pro": {
      tier: "high",
      description: "6GB RAM, A15 Bionic, Apple GPU",
      pixelRatio: 3,
      cores: 6,
      memory: 6,
      rendererInfo: "Apple A15 GPU"
    },
    "PC portable ancien (2015)": {
      tier: "low",
      description: "4GB RAM, Intel HD Graphics, dual-core",
      pixelRatio: 1,
      cores: 2,
      memory: 4,
      rendererInfo: "Intel HD Graphics 4000",
      isMobile: !1
    },
    "PC portable milieu de gamme": {
      tier: "medium",
      description: "8GB RAM, GPU intégré Intel Iris",
      pixelRatio: 1.5,
      cores: 4,
      memory: 8,
      rendererInfo: "Intel Iris Xe Graphics",
      isMobile: !1
    },
    "PC gaming": {
      tier: "high",
      description: "16GB RAM, NVIDIA RTX GPU",
      pixelRatio: 1,
      cores: 8,
      memory: 16,
      rendererInfo: "NVIDIA GeForce RTX 3060",
      isMobile: !1
    }
  };
  
  function n() {
    t.deviceCapabilities = r(), e = { ...t.deviceCapabilities }, o(t.deviceCapabilities), i = { ...t.qualitySettings }, t.gui && a(t.gui);
  }
  
  function r() {
    const l = {
      tier: "high",
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      pixelRatio: window.devicePixelRatio || 1
    }, h = document.createElement("canvas"), c = h.getContext("webgl") || h.getContext("experimental-webgl");
    if (!c) return l.tier = "low", l;
    try {
      const u = c.getExtension("WEBGL_debug_renderer_info");
      if (u) {
        const p = c.getParameter(u.UNMASKED_RENDERER_WEBGL).toLowerCase();
        l.rendererInfo = p, p.includes("mali-4") || p.includes("adreno 3") || p.includes("apple a7") || p.includes("apple a8") || p.includes("intel hd graphics") ? l.tier = "low" : (p.includes("mali-t") || p.includes("adreno 5") || p.includes("apple a9") || p.includes("apple a10") || p.includes("intel iris")) && (l.tier = "medium");
      }
    } catch (u) {
      console.warn("Impossible de détecter les capacités GPU:", u);
    }
    return navigator.deviceMemory && (navigator.deviceMemory <= 2 ? l.tier = "low" : navigator.deviceMemory <= 4 && (l.tier = "medium"), l.memory = navigator.deviceMemory), navigator.hardwareConcurrency && (navigator.hardwareConcurrency <= 2 ? l.tier = "low" : navigator.hardwareConcurrency <= 4 && (l.tier = "medium"), l.cores = navigator.hardwareConcurrency), l.isMobile && l.tier === "high" && (l.tier = "medium"), l;
  }
  
  function o(l) {
    const h = {
      low: {
        pixelRatio: Math.min(1, l.pixelRatio),
        reflectorResolution: 256,
        reflectorUpdateInterval: 500,
        postProcessingEnabled: !1,
        shadowsEnabled: !1,
        maxAnisotropy: 1,
        maxTextureSize: 1024
      },
      medium: {
        pixelRatio: Math.min(1.5, l.pixelRatio),
        reflectorResolution: 512,
        reflectorUpdateInterval: 100,
        postProcessingEnabled: !0,
        shadowsEnabled: !0,
        maxAnisotropy: 2,
        maxTextureSize: 2048
      },
      high: {
        pixelRatio: l.pixelRatio,
        reflectorResolution: 1024,
        reflectorUpdateInterval: 0,
        postProcessingEnabled: !0,
        shadowsEnabled: !0,
        maxAnisotropy: 16,
        maxTextureSize: 4096
      }
    };
    t.qualitySettings = h[l.tier], t.threeRenderer && (t.threeRenderer.setPixelRatio(t.qualitySettings.pixelRatio), t.postprocess && (t.postprocess.enabled = t.qualitySettings.postProcessingEnabled));
  }
  
  function a(l) {
    const h = l.addFolder({ title: "🔧 Simulation d'appareil", expanded: !1 }), c = {
      simulationEnabled: !1,
      selectedDevice: Object.keys(s)[0],
      customTier: "medium",
      customPixelRatio: 1,
      customCores: 4,
      customMemory: 4,
      applyCustomSettings: !1
    }, u = h.addBinding(c, "simulationEnabled", { label: "Activer la simulation" }), p = {};
    Object.keys(s).forEach(C => {
      p[C] = C;
    });
    const d = h.addBinding(c, "selectedDevice", { label: "Appareil préréglé", options: p, disabled: !0 }),
      f = { description: s[c.selectedDevice].description },
      m = h.addBinding(f, "description", { label: "Description", disabled: !0 }),
      B = h.addBinding(c, "applyCustomSettings", { label: "Paramètres personnalisés", disabled: !0 }),
      v = h.addFolder({ title: "Paramètres personnalisés", expanded: !1, hidden: !0 });
    v.addBinding(c, "customTier", {
      label: "Niveau de l'appareil",
      options: { Faible: "low", Moyen: "medium", Élevé: "high" }
    }), v.addBinding(c, "customPixelRatio", {
      label: "Pixel Ratio",
      min: .5,
      max: 3,
      step: .1
    }), v.addBinding(c, "customCores", {
      label: "Nombre de cœurs CPU",
      min: 1,
      max: 16,
      step: 1
    }), v.addBinding(c, "customMemory", { label: "Mémoire (GB)", min: 1, max: 32, step: 1 });
    const x = v.addButton({ title: "Appliquer" }),
      g = h.addButton({ title: "Réinitialiser les paramètres d'origine", disabled: !0 }),
      A = h.addFolder({ title: "Paramètres actuels", expanded: !1 }), F = {
        tier: t.deviceCapabilities.tier,
        reflectorResolution: t.qualitySettings.reflectorResolution,
        postProcessingEnabled: t.qualitySettings.postProcessingEnabled ? "Activé" : "Désactivé",
        pixelRatio: t.qualitySettings.pixelRatio.toFixed(2)
      };
    Object.keys(F).forEach(C => {
      A.addBinding(F, C, { label: C.charAt(0).toUpperCase() + C.slice(1).replace(/([A-Z])/g, " $1"), disabled: !0 });
    }), u.on("change", C => {
      C.value ? (d.disabled = !c.applyCustomSettings, B.disabled = !1, g.disabled = !1, v.hidden = !c.applyCustomSettings, c.applyCustomSettings ? Ve() : Ct(c.selectedDevice)) : (d.disabled = !0, B.disabled = !0, g.disabled = !0, v.hidden = !0, Xi());
    }), d.on("change", C => {
      f.description = s[C.value].description, m.refresh(), c.simulationEnabled && !c.applyCustomSettings && Ct(C.value);
    }), B.on("change", C => {
      v.hidden = !C.value, d.disabled = C.value || !c.simulationEnabled, c.simulationEnabled && (C.value ? Ve() : Ct(c.selectedDevice));
    }), x.on("click", () => {
      c.simulationEnabled && c.applyCustomSettings && Ve();
    }), g.on("click", () => {
      c.simulationEnabled = !1, u.refresh(), d.disabled = !0, B.disabled = !0, g.disabled = !0, v.hidden = !0, Xi();
    });
    
    function Ct(C) {
      if (!s[C]) return;
      const Xe = s[C];
      t.deviceCapabilities = { ...t.deviceCapabilities, ...Xe }, o(t.deviceCapabilities), Kt(), qt();
    }
    
    function Ve() {
      const C = {
        ...t.deviceCapabilities,
        tier: c.customTier,
        pixelRatio: c.customPixelRatio,
        cores: c.customCores,
        memory: c.customMemory,
        isCustom: !0
      };
      t.deviceCapabilities = C, o(t.deviceCapabilities), Kt(), qt();
    }
    
    function Xi() {
      t.deviceCapabilities = { ...e }, t.qualitySettings = { ...i }, Kt(), qt();
    }
    
    function Kt() {
      F.tier = t.deviceCapabilities.tier, F.reflectorResolution = t.qualitySettings.reflectorResolution, F.postProcessingEnabled = t.qualitySettings.postProcessingEnabled ? "Activé" : "Désactivé", F.pixelRatio = t.qualitySettings.pixelRatio.toFixed(2), A.refresh();
    }
    
    function qt() {
      if (t.threeRenderer && t.threeRenderer.setPixelRatio(t.qualitySettings.pixelRatio), t.postprocess && (t.postprocess.enabled = t.qualitySettings.postProcessingEnabled), t.scene && t.scene.room) {
        if (t.scene.room.mirrors && t.scene.room.mirrors.forEach(C => {
          if (C.setLODLevel) {
            const Xe = { low: 0, medium: 1, high: 2 }[t.deviceCapabilities.tier] || 1;
            C.setLODLevel(Xe);
          } else C.configureQualityBasedOnDeviceCapabilities && C.configureQualityBasedOnDeviceCapabilities();
        }), t.scene.room.groundReflector) {
          const C = t.scene.room.groundReflector;
          if (C.setLODLevel) {
            const Xe = { low: 0, medium: 1, high: 2 }[t.deviceCapabilities.tier] || 1;
            C.setLODLevel(Xe);
          } else C.configureQualityBasedOnDeviceCapabilities && C.configureQualityBasedOnDeviceCapabilities();
        }
        if (t.scene.room.cableEffect && t.scene.room.cableEffect.updateParams) {
          const C = {
            low: { numberOfPulses: 2, glowStrength: 1, pulseSpeed: .15 },
            medium: { numberOfPulses: 5, glowStrength: 2, pulseSpeed: .25 },
            high: { numberOfPulses: 8, glowStrength: 3.8, pulseSpeed: .3 }
          }[t.deviceCapabilities.tier] || {};
          t.scene.room.cableEffect.updateParams(C);
        }
      }
      t.viewport && t.hooks && t.hooks.resize && t.hooks.resize.emit();
    }
  }
  
  return n(), {
    setDevicePreset: function(l) {
      if (t.gui) {
        const h = t.gui.folders.find(c => c.title === "🔧 Simulation d'appareil");
        if (h) {
          const c = h.bindings.find(p => p.label === "Activer la simulation"),
            u = h.bindings.find(p => p.label === "Appareil préréglé");
          c && u && (u.setValue(l), c.setValue(!0));
        }
      }
    }, resetToOriginal: function() {
      if (t.gui) {
        const l = t.gui.folders.find(h => h.title === "🔧 Simulation d'appareil");
        if (l) {
          const h = l.bindings.find(c => c.label === "Activer la simulation");
          h && h.setValue(!1);
        }
      }
    }
  };
}

function wd(t) {
  gd(), Object.assign(t, {
    init: e,
    preload: i,
    start: s,
    update: n,
    render: r,
    resize: o,
    destroy: a
  }), t.usePlugins([Vr, Ur, zr, Fr, kh, Hu, ju, uh, dh, _d]);
  
  async function e() {
    t.renderer.init(), t.loader.init(), t.scene = new bd, t.hooks.resize.watch(o);
  }
  
  async function i() {
    await t.loader.preload();
  }
  
  function s() {
    t.time.init(), t.scene.triggerInit(), t.postprocess.init();
  }
  
  function n() {
    t.initialized && (t.shaders.update(), t.postprocess.update(), t.scene.triggerUpdate());
  }
  
  function r() {
    if (t.initialized) if (t.postprocess.enabled) t.postprocess.render(); else {
      const l = t.threeRenderer;
      t.scene.triggerRender(), l.setRenderTarget(null);
    }
  }
  
  function o() {
    t.initialized && (t.renderer.resize(), t.shaders.resize());
  }
  
  function a() {
    t.scene && t.scene.dispose(), t.threeRenderer && t.threeRenderer.dispose();
  }
}

let He = null;
const ae = t => t, xd = t => t.charAt(0).toUpperCase() + t.slice(1);

function Be() {
  return He;
}

async function yd(t = {}) {
  He && await cr(He);
  const e = ["Init", "Preload", "Load", "Start", "Frame", "Update", "Render"].reduce((c, u) => (c["before" + u] = ui(), c["after" + u] = ui(), c), {}),
    i = t, s = [], n = { loadingProgress: 0 }, r = i.onProgress || ae, o = {
      init: ae, preload: ae, start: ae, update: ae, render: ae, prerender: () => o.frame(), frame: () => {
        o.update(), o.render();
      }, options: i, plugins: s, hooks: e, states: n, usePlugins: a, initialized: !1
    };
  return Object.defineProperty(n, "loadingProgress", {
    set: function(c) {
      this._loadingProgress = c, r(c);
    }, get: function() {
      return this._loadingProgress || 0;
    }
  }), wd(o), o.canvas = i.canvas, h("init", !0, !0, () => {
    l(s), ["frame", "update", "render"].forEach(c => h(c, !1)), ["preload", "start"].forEach(c => h(c, !0, !0)), ["load"].forEach(c => h(c, !0));
  }), He = o, await o.init(), await o.preload(), await o.start(), o.initialized = !0, o.states.loadingProgress = 100, o;
  
  function a(c) {
    c.forEach(u => s.push(u));
  }
  
  function l(c) {
    Array.isArray(c) || (c = [c]), c.forEach(u => typeof u == "function" && u(o));
  }
  
  function h(c, u, p, d, f) {
    const m = o[c] || ae, B = xd(c), v = e["before" + B] || ae, x = e["after" + B] || ae;
    o[c] = u ? async function(g) {
      v.emit(), d && d(), await m(g), x.emit(), p && (v.unwatchAll(), x.unwatchAll());
    } : function(g) {
      v.emit(), d && d(), m(g), x.emit(), p && (v.unwatchAll(), x.unwatchAll());
    };
  }
}

async function cr(t) {
  if (!(!t || !t.initialized)) {
    t.time && t.time.stop(), t.scene && t.scene.destroy(), t.renderer && t.renderer.destroy();
    for (const e in t.hooks) {
      const i = t.hooks[e];
      i && typeof i.unwatchAll == "function" && i.unwatchAll();
    }
    t.gui && t.gui.containerElem_ && t.gui.containerElem_.parentNode && t.gui.containerElem_.parentNode.removeChild(t.gui.containerElem_), He === t && (He = null), t.initialized = !1;
  }
}

class Md extends HTMLElement {
  constructor() {
    super(), this.webgl = null, this._initialized = !1, this.loaderElement = null, this.introAnimationPlayed = !1, this.textElements = null, this.buttonElement = null, this.containerBtnElement = null, this.btnWatch = null, window.three = { videoUrl: this.getAttribute("data-video-url") }, this.initialCameraPosition = new E, this.scrollProgress = 0, this.maxScrollOffset = 10, this.isScrollEnabled = !0, this.isDesktopSize = window.innerWidth >= 768, this.handleScroll = this.handleScroll.bind(this), this.handleResize = this.handleResize.bind(this);
  }
  
  handleResize() {
    const e = this.isDesktopSize;
    this.isDesktopSize = window.innerWidth >= 768, e !== this.isDesktopSize && (this.isDesktopSize ? this.activateScrollListener() : (this.deactivateScrollListener(), this.webgl && this.webgl.scene && this.webgl.scene.mainCamera && (this.webgl.scene.mainCamera.base.position.copy(this.initialCameraPosition), this.webgl.scene.mainCamera.scrollProgress = 0)));
  }
  
  activateScrollListener() {
    if (!this.isDesktopSize) return;
    const e = window.lenisInstance;
    e ? e.on("scroll", this.handleScroll) : window.addEventListener("scroll", this.handleScroll);
  }
  
  deactivateScrollListener() {
    const e = window.lenisInstance;
    e ? e.off("scroll", this.handleScroll) : window.removeEventListener("scroll", this.handleScroll);
  }
  
  static get observedAttributes() {
    return ["data-end-loader", "data-loader-target", "data-webgl-state"];
  }
  
  attributeChangedCallback(e, i, s) {
    e === "data-end-loader" && s === "true" && this._initialized && !this.introAnimationPlayed && this.webgl && this.startIntroAnimation(), e === "data-loader-target" && s && (this.loaderTargetId = s, this.loaderElement = document.getElementById(s)), e === "data-webgl-state" && (s === "paused" && this.webgl && this.webgl.time ? this.webgl.time.pause() : s === "playing" && this.webgl && this.webgl.time && this.webgl.time.resume());
  }
  
  updateLoaderProgress(e) {
    this.loaderElement ? this.loaderElement.setAttribute("data-webgl-progress", Math.floor(e)) : this.loaderTargetId && (this.loaderElement = document.getElementById(this.loaderTargetId), this.loaderElement && this.loaderElement.setAttribute("data-webgl-progress", Math.floor(e))), this.setAttribute("data-loading-progress", Math.floor(e));
  }
  
  async connectedCallback() {
    if (this.textElements = this.parentElement.querySelectorAll("[data-hero-text]"), this.buttonElement = this.parentElement.querySelector("[data-hero-btn]"), this.containerBtnElement = document.querySelector("[data-hero-btn]"), this.btnWatch = this.parentElement.querySelector("#open-video-button"), this.header = document.querySelector("header"), this.banner = document.querySelector("t-banner"), this.textElements && this.textElements.forEach(n => {
      Q.set(n, { opacity: 0, y: 100 });
    }), this.containerBtnElement && Q.set(this.containerBtnElement, {
      autoAlpha: 0,
      y: 100
    }), this.buttonElement && Q.set(this.buttonElement, {
      autoAlpha: 0,
      y: 100
    }), this.btnWatch && Q.set(this.btnWatch, { autoAlpha: 0 }), Zi(this) !== null) return;
    this._initialized = !0, this.loaderElement = document.querySelector("t-loader");
    const i = !!this.loaderElement;
    this.loaderElement && this.loaderElement.id ? this.loaderTargetId = this.loaderElement.id : this.loaderElement && (this.loaderElement.id = "loader", this.loaderTargetId = "loader"), this.updateLoaderProgress(0);
    const s = this.querySelector("canvas");
    if (!s) {
      console.error("WebGL: Aucun canvas trouvé dans le composant t-hero-three");
      return;
    }
    this.webgl = await yd({
      canvas: s, onProgress: n => {
        this.updateLoaderProgress(n), n >= 100 && !this.introAnimationPlayed && (i ? setTimeout(() => {
          this.startIntroAnimation(!1);
        }, 800) : this.startIntroAnimation(!0));
      }
    }), this.resizeObserver = new ResizeObserver(() => {
      this.webgl && this.webgl.renderer.resize();
    }), this.resizeObserver.observe(s), this.webgl.time.pause(), this.webgl.scene.mainCamera, this.getAttribute("data-end-loader") === "true" && !this.introAnimationPlayed && this.startIntroAnimation(!1), !i && !this.introAnimationPlayed && this.webgl && this.startIntroAnimation(!0), window.addEventListener("resize", this.handleResize), this.isDesktopSize && this.activateScrollListener();
  }
  
  handleScroll(e) {
    if (!this.isDesktopSize || !this.isScrollEnabled || !this.webgl || !this.webgl.scene || !this.webgl.scene.mainCamera) return;
    const i = window.scrollY || 0, s = Math.min(window.innerHeight * 1.2, 800);
    this.scrollProgress = Math.min(i / s, 1);
    const n = this.webgl.scene.mainCamera, r = document.querySelector("#open-video-button");
    if (window.scrollY > 10 ? Q.to(r, { duration: .5, y: -10, autoAlpha: 0 }) : Q.to(r, {
      duration: .5,
      y: 0,
      autoAlpha: 1
    }), n.scrollProgress = this.scrollProgress, this.webgl.scene.videoPlane && this.webgl.scene.videoPlane.plane) {
      const o = new E;
      this.webgl.scene.videoPlane.plane.getWorldPosition(o);
    }
  }
  
  startIntroAnimation(e = !1) {
    if (this.introAnimationPlayed || !this.webgl) return;
    this.introAnimationPlayed = !0, this.webgl.time.resume(), this.webgl.scene && this.webgl.scene.mainCamera ? this.webgl.scene.mainCamera.startIntroAnimation(e) : setTimeout(() => {
      this.webgl && this.webgl.scene && this.webgl.scene.mainCamera && this.webgl.scene.mainCamera.startIntroAnimation(e);
    }, 100);
    const i = e ? .8 : 2, s = e ? 0 : .5, n = Q.timeline({ delay: s });
    this.textElements && this.textElements.length && n.to(this.textElements, {
      autoAlpha: 1,
      y: 0,
      duration: i,
      ease: "power2.out"
    }, 0).to(this.buttonElement, {
      autoAlpha: 1,
      y: 0,
      duration: i,
      ease: "power2.out"
    }, 0).to(this.buttonElement, {
      autoAlpha: 1,
      y: 0,
      duration: i,
      ease: "power2.out"
    }, 0).to(this.banner, { autoAlpha: 1, duration: .2, ease: "power2.out" }, 0).to(this.btnWatch, {
      autoAlpha: 1,
      duration: i,
      ease: "power2.out"
    }, 0).to("[data-block-text]", {
      autoAlpha: 1,
      duration: i,
      ease: "power2.out"
    }, 0).to(["t-open-menu-mobile", "[data-menu-principal-desktop]", "t-open-bag"], {
      autoAlpha: 1,
      duration: .2,
      ease: "power2.out"
    }, 0), this.buttonElement && n.to(this.buttonElement, { autoAlpha: 1, y: 0, duration: i, ease: "power2.out" });
  }
  
  pauseWebGL() {
    this.webgl && this.webgl.time && this.webgl.time.pause();
  }
  
  resumeWebGL() {
    this.webgl && this.webgl.time && this.webgl.time.resume();
  }
  
  toggleScrollEffect(e) {
    this.isScrollEnabled = e, !e && this.webgl && this.webgl.scene && this.webgl.scene.mainCamera && this.webgl.scene.mainCamera.base.position.copy(this.initialCameraPosition);
  }
  
  disconnectedCallback() {
    Zi(this) === null && (this.resizeObserver && (this.resizeObserver.disconnect(), this.resizeObserver = null), this.webgl && (cr(this.webgl), this.webgl = null), this._initialized = !1);
  }
}

export { Md as default };
