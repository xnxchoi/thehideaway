var Qb = Object.defineProperty;
var Qb = Object.defineProperty;
var ew = (i, element, trigger) =>
	element in i
		? Qb(i, element, {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: trigger,
		})
		: (i[element] = trigger);
var qs = (i, element, trigger) => (
	ew(i, typeof element != "symbol" ? element + "" : element, trigger),
		trigger
);

/**
 * @vue/shared v3.4.15
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/
function im(i, element) {
	const trigger = new Set(i.split(","));
	return element
		? (start) => trigger.has(start.toLowerCase())
		: (start) => trigger.has(start);
}

const xt = {},
	no = [],
	cs = () => {
	},
	tw = () => !1,
	ic = (i) =>
		i.charCodeAt(0) === 111 &&
		i.charCodeAt(1) === 110 &&
		(i.charCodeAt(2) > 122 || i.charCodeAt(2) < 97),
	sm = (i) => i.startsWith("onUpdate:"),
	kt = Object.assign,
	nm = (i, element) => {
		const trigger = i.indexOf(element);
		trigger > -1 && i.splice(trigger, 1);
	},
	iw = Object.prototype.hasOwnProperty,
	it = (i, element) => iw.call(i, element),
	Ue = Array.isArray,
	ro = (i) => sc(i) === "[object Map]",
	Ov = (i) => sc(i) === "[object Set]",
	sw = (i) => sc(i) === "[object RegExp]",
	He = (i) => typeof i == "function",
	Tt = (i) => typeof i == "string",
	Lo = (i) => typeof i == "symbol",
	pt = (i) => i !== null && typeof i == "object",
	Nv = (i) => (pt(i) || He(i)) && He(i.then) && He(i.catch),
	Dv = Object.prototype.toString,
	sc = (i) => Dv.call(i),
	nw = (i) => sc(i).slice(8, -1),
	Uv = (i) => sc(i) === "[object Object]",
	rm = (i) =>
		Tt(i) && i !== "NaN" && i[0] !== "-" && "" + parseInt(i, 10) === i,
	ll = im(
		",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted",
	),
	Cu = (i) => {
		const element = Object.create(null);
		return (trigger) => element[trigger] || (element[trigger] = i(trigger));
	},
	rw = /-(\w)/g,
	hn = Cu((i) =>
		i.replace(rw, (element, trigger) => (trigger ? trigger.toUpperCase() : "")),
	),
	aw = /\B([A-Z])/g,
	Io = Cu((i) => i.replace(aw, "-$1").toLowerCase()),
	Pu = Cu((i) => i.charAt(0).toUpperCase() + i.slice(1)),
	nd = Cu((i) => (i ? `on${Pu(i)}` : "")),
	Sr = (i, element) => !Object.is(i, element),
	cl = (i, element) => {
		for (let trigger = 0; trigger < i.length; trigger++) i[trigger](element);
	},
	Vh = (i, element, trigger) => {
		Object.defineProperty(i, element, {
			configurable: !0,
			enumerable: !1,
			value: trigger,
		});
	},
	ow = (i) => {
		const element = parseFloat(i);
		return isNaN(element) ? i : element;
	},
	Fv = (i) => {
		const element = Tt(i) ? Number(i) : NaN;
		return isNaN(element) ? i : element;
	};
let bg;
const kv = () =>
	bg ||
	(bg =
		typeof globalThis < "u"
			? globalThis
			: typeof self < "u"
				? self
				: typeof window < "u"
					? window
					: typeof global < "u"
						? global
						: {});

function nc(i) {
	if (Ue(i)) {
		const element = {};
		for (let trigger = 0; trigger < i.length; trigger++) {
			const start = i[trigger],
				end = Tt(start) ? uw(start) : nc(start);
			if (end) for (const a in end) element[a] = end[a];
		}
		return element;
	} else if (Tt(i) || pt(i)) return i;
}

const lw = /;(?![^(]*\))/g,
	cw = /:([^]+)/,
	hw = /\/\*[^]*?\*\//g;

function uw(i) {
	const element = {};
	return (
		i
			.replace(hw, "")
			.split(lw)
			.forEach((trigger) => {
				if (trigger) {
					const start = trigger.split(cw);
					start.length > 1 && (element[start[0].trim()] = start[1].trim());
				}
			}),
			element
	);
}

function Lu(i) {
	let element = "";
	if (Tt(i)) element = i;
	else if (Ue(i))
		for (let trigger = 0; trigger < i.length; trigger++) {
			const start = Lu(i[trigger]);
			start && (element += start + " ");
		}
	else if (pt(i))
		for (const trigger in i) i[trigger] && (element += trigger + " ");
	return element.trim();
}

function dw(i) {
	if (!i) return null;
	let {class: element, style: trigger} = i;
	return (
		element && !Tt(element) && (i.class = Lu(element)),
		trigger && (i.style = nc(trigger)),
			i
	);
}

const fw =
		"itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly",
	pw = im(fw);

function Bv(i) {
	return !!i || i === "";
}

const pn = (i) =>
		Tt(i)
			? i
			: i == null
				? ""
				: Ue(i) || (pt(i) && (i.toString === Dv || !He(i.toString)))
					? JSON.stringify(i, Gv, 2)
					: String(i),
	Gv = (i, element) =>
		element && element.__v_isRef
			? Gv(i, element.value)
			: ro(element)
				? {
					[`Map(${element.size})`]: [...element.entries()].reduce(
						(trigger, [start, end], a) => (
							(trigger[rd(start, a) + " =>"] = end),
								trigger
						),
						{},
					),
				}
				: Ov(element)
					? {
						[`Set(${element.size})`]: [...element.values()].map((trigger) =>
							rd(trigger),
						),
					}
					: Lo(element)
						? rd(element)
						: pt(element) && !Ue(element) && !Uv(element)
							? String(element)
							: element,
	rd = (i, element = "") => {
		var trigger;
		return Lo(i)
			? `Symbol(${(trigger = i.description) != null ? trigger : element})`
			: i;
	};
/**
 * @vue/reactivity v3.4.15
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/
let Ds;

class Hv {
	constructor(element = !1) {
		((this.detached = element),
			(this._active = !0),
			(this.effects = []),
			(this.cleanups = []),
			(this.parent = Ds),
		!element &&
		Ds &&
		(this.index = (Ds.scopes || (Ds.scopes = [])).push(this) - 1));
	}
	
	get active() {
		return this._active;
	}
	
	run(element) {
		if (this._active) {
			const trigger = Ds;
			try {
				return ((Ds = this), element());
			} finally {
				Ds = trigger;
			}
		}
	}
	
	on() {
		Ds = this;
	}
	
	off() {
		Ds = this.parent;
	}
	
	stop(element) {
		if (this._active) {
			let trigger, start;
			for (trigger = 0, start = this.effects.length; trigger < start; trigger++)
				this.effects[trigger].stop();
			for (
				trigger = 0, start = this.cleanups.length;
				trigger < start;
				trigger++
			)
				this.cleanups[trigger]();
			if (this.scopes)
				for (
					trigger = 0, start = this.scopes.length;
					trigger < start;
					trigger++
				)
					this.scopes[trigger].stop(!0);
			if (!this.detached && this.parent && !element) {
				const end = this.parent.scopes.pop();
				end &&
				end !== this &&
				((this.parent.scopes[this.index] = end), (end.index = this.index));
			}
			((this.parent = void 0), (this._active = !1));
		}
	}
}

function mw(i) {
	return new Hv(i);
}

function gw(i, element = Ds) {
	element && element.active && element.effects.push(i);
}

function _w() {
	return Ds;
}

let ia;

class am {
	constructor(element, trigger, start, end) {
		((this.fn = element),
			(this.trigger = trigger),
			(this.scheduler = start),
			(this.active = !0),
			(this.deps = []),
			(this._dirtyLevel = 2),
			(this._trackId = 0),
			(this._runnings = 0),
			(this._shouldSchedule = !1),
			(this._depsLength = 0),
			gw(this, end));
	}
	
	get dirty() {
		if (this._dirtyLevel === 1) {
			Sa();
			for (let element = 0; element < this._depsLength; element++) {
				const trigger = this.deps[element];
				if (trigger.computed && (vw(trigger.computed), this._dirtyLevel >= 2))
					break;
			}
			(this._dirtyLevel < 2 && (this._dirtyLevel = 0), Ta());
		}
		return this._dirtyLevel >= 2;
	}
	
	set dirty(element) {
		this._dirtyLevel = element ? 2 : 0;
	}
	
	run() {
		if (((this._dirtyLevel = 0), !this.active)) return this.fn();
		let element = pr,
			trigger = ia;
		try {
			return ((pr = !0), (ia = this), this._runnings++, wg(this), this.fn());
		} finally {
			(Eg(this), this._runnings--, (ia = trigger), (pr = element));
		}
	}
	
	stop() {
		var element;
		this.active &&
		(wg(this),
			Eg(this),
		(element = this.onStop) == null || element.call(this),
			(this.active = !1));
	}
}

function vw(i) {
	return i.value;
}

function wg(i) {
	(i._trackId++, (i._depsLength = 0));
}

function Eg(i) {
	if (i.deps && i.deps.length > i._depsLength) {
		for (let element = i._depsLength; element < i.deps.length; element++)
			zv(i.deps[element], i);
		i.deps.length = i._depsLength;
	}
}

function zv(i, element) {
	const trigger = i.get(element);
	trigger !== void 0 &&
	element._trackId !== trigger &&
	(i.delete(element), i.size === 0 && i.cleanup());
}

let pr = !0,
	wf = 0;
const Wv = [];

function Sa() {
	(Wv.push(pr), (pr = !1));
}

function Ta() {
	const i = Wv.pop();
	pr = i === void 0 ? !0 : i;
}

function om() {
	wf++;
}

function lm() {
	for (wf--; !wf && Ef.length;) Ef.shift()();
}

function jv(i, element, trigger) {
	if (element.get(i) !== i._trackId) {
		element.set(i, i._trackId);
		const start = i.deps[i._depsLength];
		start !== element
			? (start && zv(start, i), (i.deps[i._depsLength++] = element))
			: i._depsLength++;
	}
}

const Ef = [];

function Vv(i, element, trigger) {
	om();
	for (const start of i.keys())
		if (start._dirtyLevel < element && i.get(start) === start._trackId) {
			const end = start._dirtyLevel;
			((start._dirtyLevel = element),
			end === 0 && ((start._shouldSchedule = !0), start.trigger()));
		}
	(qv(i), lm());
}

function qv(i) {
	for (const element of i.keys())
		element.scheduler &&
		element._shouldSchedule &&
		(!element._runnings || element.allowRecurse) &&
		i.get(element) === element._trackId &&
		((element._shouldSchedule = !1), Ef.push(element.scheduler));
}

const Xv = (i, element) => {
		const trigger = new Map();
		return ((trigger.cleanup = i), (trigger.computed = element), trigger);
	},
	qh = new WeakMap(),
	sa = Symbol(""),
	Sf = Symbol("");

function qi(i, element, trigger) {
	if (pr && ia) {
		let start = qh.get(i);
		start || qh.set(i, (start = new Map()));
		let end = start.get(trigger);
		(end || start.set(trigger, (end = Xv(() => start.delete(trigger)))),
			jv(ia, end));
	}
}

function Ln(i, element, trigger, start, end, a) {
	const o = qh.get(i);
	if (!o) return;
	let l = [];
	if (element === "clear") l = [...o.values()];
	else if (trigger === "length" && Ue(i)) {
		const c = Number(start);
		o.forEach((h, u) => {
			(u === "length" || (!Lo(u) && u >= c)) && l.push(h);
		});
	} else
		switch ((trigger !== void 0 && l.push(o.get(trigger)), element)) {
			case "add":
				Ue(i)
					? rm(trigger) && l.push(o.get("length"))
					: (l.push(o.get(sa)), ro(i) && l.push(o.get(Sf)));
				break;
			case "delete":
				Ue(i) || (l.push(o.get(sa)), ro(i) && l.push(o.get(Sf)));
				break;
			case "set":
				ro(i) && l.push(o.get(sa));
				break;
		}
	om();
	for (const c of l) c && Vv(c, 2);
	lm();
}

function xw(i, element) {
	var trigger;
	return (trigger = qh.get(i)) == null ? void 0 : trigger.get(element);
}

const yw = im("__proto__,__v_isRef,__isVue"),
	$v = new Set(
		Object.getOwnPropertyNames(Symbol)
			.filter((i) => i !== "arguments" && i !== "caller")
			.map((i) => Symbol[i])
			.filter(Lo),
	),
	Sg = bw();

function bw() {
	const i = {};
	return (
		["includes", "indexOf", "lastIndexOf"].forEach((element) => {
			i[element] = function (...trigger) {
				const start = st(this);
				for (let a = 0, o = this.length; a < o; a++) qi(start, "get", a + "");
				const end = start[element](...trigger);
				return end === -1 || end === !1
					? start[element](...trigger.map(st))
					: end;
			};
		}),
			["push", "pop", "shift", "unshift", "splice"].forEach((element) => {
				i[element] = function (...trigger) {
					(Sa(), om());
					const start = st(this)[element].apply(this, trigger);
					return (lm(), Ta(), start);
				};
			}),
			i
	);
}

function ww(i) {
	const element = st(this);
	return (qi(element, "has", i), element.hasOwnProperty(i));
}

class Yv {
	constructor(element = !1, trigger = !1) {
		((this._isReadonly = element), (this._shallow = trigger));
	}
	
	get(element, trigger, start) {
		const end = this._isReadonly,
			a = this._shallow;
		if (trigger === "__v_isReactive") return !end;
		if (trigger === "__v_isReadonly") return end;
		if (trigger === "__v_isShallow") return a;
		if (trigger === "__v_raw")
			return start === (end ? (a ? Dw : Qv) : a ? Jv : Zv).get(element) ||
			Object.getPrototypeOf(element) === Object.getPrototypeOf(start)
				? element
				: void 0;
		const o = Ue(element);
		if (!end) {
			if (o && it(Sg, trigger)) return Reflect.get(Sg, trigger, start);
			if (trigger === "hasOwnProperty") return ww;
		}
		const l = Reflect.get(element, trigger, start);
		return (Lo(trigger) ? $v.has(trigger) : yw(trigger)) ||
		(end || qi(element, "get", trigger), a)
			? l
			: fi(l)
				? o && rm(trigger)
					? l
					: l.value
				: pt(l)
					? end
						? ex(l)
						: Dn(l)
					: l;
	}
}

class Kv extends Yv {
	constructor(element = !1) {
		super(!1, element);
	}
	
	set(element, trigger, start, end) {
		let a = element[trigger];
		if (!this._shallow) {
			const c = pa(a);
			if (
				(!Xh(start) && !pa(start) && ((a = st(a)), (start = st(start))),
				!Ue(element) && fi(a) && !fi(start))
			)
				return c ? !1 : ((a.value = start), !0);
		}
		const o =
				Ue(element) && rm(trigger)
					? Number(trigger) < element.length
					: it(element, trigger),
			l = Reflect.set(element, trigger, start, end);
		return (
			element === st(end) &&
			(o
				? Sr(start, a) && Ln(element, "set", trigger, start)
				: Ln(element, "add", trigger, start)),
				l
		);
	}
	
	deleteProperty(element, trigger) {
		const start = it(element, trigger);
		element[trigger];
		const end = Reflect.deleteProperty(element, trigger);
		return (end && start && Ln(element, "delete", trigger, void 0), end);
	}
	
	has(element, trigger) {
		const start = Reflect.has(element, trigger);
		return (
			(!Lo(trigger) || !$v.has(trigger)) && qi(element, "has", trigger),
				start
		);
	}
	
	ownKeys(element) {
		return (
			qi(element, "iterate", Ue(element) ? "length" : sa),
				Reflect.ownKeys(element)
		);
	}
}

class Ew extends Yv {
	constructor(element = !1) {
		super(!0, element);
	}
	
	set(element, trigger) {
		return !0;
	}
	
	deleteProperty(element, trigger) {
		return !0;
	}
}

const Sw = new Kv(),
	Tw = new Ew(),
	Mw = new Kv(!0),
	cm = (i) => i,
	Iu = (i) => Reflect.getPrototypeOf(i);

function wc(i, element, trigger = !1, start = !1) {
	i = i.__v_raw;
	const end = st(i),
		a = st(element);
	trigger || (Sr(element, a) && qi(end, "get", element), qi(end, "get", a));
	const {has: o} = Iu(end),
		l = start ? cm : trigger ? dm : Pl;
	if (o.call(end, element)) return l(i.get(element));
	if (o.call(end, a)) return l(i.get(a));
	i !== end && i.get(element);
}

function Ec(i, element = !1) {
	const trigger = this.__v_raw,
		start = st(trigger),
		end = st(i);
	return (
		element || (Sr(i, end) && qi(start, "has", i), qi(start, "has", end)),
			i === end ? trigger.has(i) : trigger.has(i) || trigger.has(end)
	);
}

function Sc(i, element = !1) {
	return (
		(i = i.__v_raw),
		!element && qi(st(i), "iterate", sa),
			Reflect.get(i, "size", i)
	);
}

function Tg(i) {
	i = st(i);
	const element = st(this);
	return (
		Iu(element).has.call(element, i) ||
		(element.add(i), Ln(element, "add", i, i)),
			this
	);
}

function Mg(i, element) {
	element = st(element);
	const trigger = st(this),
		{has: start, get: end} = Iu(trigger);
	let a = start.call(trigger, i);
	a || ((i = st(i)), (a = start.call(trigger, i)));
	const o = end.call(trigger, i);
	return (
		trigger.set(i, element),
			a
				? Sr(element, o) && Ln(trigger, "set", i, element)
				: Ln(trigger, "add", i, element),
			this
	);
}

function Rg(i) {
	const element = st(this),
		{has: trigger, get: start} = Iu(element);
	let end = trigger.call(element, i);
	(end || ((i = st(i)), (end = trigger.call(element, i))),
	start && start.call(element, i));
	const a = element.delete(i);
	return (end && Ln(element, "delete", i, void 0), a);
}

function Ag() {
	const i = st(this),
		element = i.size !== 0,
		trigger = i.clear();
	return (element && Ln(i, "clear", void 0, void 0), trigger);
}

function Tc(i, element) {
	return function (start, end) {
		const a = this,
			o = a.__v_raw,
			l = st(o),
			c = element ? cm : i ? dm : Pl;
		return (
			!i && qi(l, "iterate", sa),
				o.forEach((h, u) => start.call(end, c(h), c(u), a))
		);
	};
}

function Mc(i, element, trigger) {
	return function (...start) {
		const end = this.__v_raw,
			a = st(end),
			o = ro(a),
			l = i === "entries" || (i === Symbol.iterator && o),
			c = i === "keys" && o,
			h = end[i](...start),
			u = trigger ? cm : element ? dm : Pl;
		return (
			!element && qi(a, "iterate", c ? Sf : sa),
				{
					next() {
						const {value: d, done: f} = h.next();
						return f
							? {
								value: d,
								done: f,
							}
							: {
								value: l ? [u(d[0]), u(d[1])] : u(d),
								done: f,
							};
					},
					[Symbol.iterator]() {
						return this;
					},
				}
		);
	};
}

function Vn(i) {
	return function (...element) {
		return i === "delete" ? !1 : i === "clear" ? void 0 : this;
	};
}

function Rw() {
	const i = {
			get(a) {
				return wc(this, a);
			},
			get size() {
				return Sc(this);
			},
			has: Ec,
			add: Tg,
			set: Mg,
			delete: Rg,
			clear: Ag,
			forEach: Tc(!1, !1),
		},
		element = {
			get(a) {
				return wc(this, a, !1, !0);
			},
			get size() {
				return Sc(this);
			},
			has: Ec,
			add: Tg,
			set: Mg,
			delete: Rg,
			clear: Ag,
			forEach: Tc(!1, !0),
		},
		trigger = {
			get(a) {
				return wc(this, a, !0);
			},
			get size() {
				return Sc(this, !0);
			},
			has(a) {
				return Ec.call(this, a, !0);
			},
			add: Vn("add"),
			set: Vn("set"),
			delete: Vn("delete"),
			clear: Vn("clear"),
			forEach: Tc(!0, !1),
		},
		start = {
			get(a) {
				return wc(this, a, !0, !0);
			},
			get size() {
				return Sc(this, !0);
			},
			has(a) {
				return Ec.call(this, a, !0);
			},
			add: Vn("add"),
			set: Vn("set"),
			delete: Vn("delete"),
			clear: Vn("clear"),
			forEach: Tc(!0, !0),
		};
	return (
		["keys", "values", "entries", Symbol.iterator].forEach((a) => {
			((i[a] = Mc(a, !1, !1)),
				(trigger[a] = Mc(a, !0, !1)),
				(element[a] = Mc(a, !1, !0)),
				(start[a] = Mc(a, !0, !0)));
		}),
			[i, trigger, element, start]
	);
}

const [Aw, Cw, Pw, Lw] = Rw();

function hm(i, element) {
	const trigger = element ? (i ? Lw : Pw) : i ? Cw : Aw;
	return (start, end, a) =>
		end === "__v_isReactive"
			? !i
			: end === "__v_isReadonly"
				? i
				: end === "__v_raw"
					? start
					: Reflect.get(
						it(trigger, end) && end in start ? trigger : start,
						end,
						a,
					);
}

const Iw = {
		get: hm(!1, !1),
	},
	Ow = {
		get: hm(!1, !0),
	},
	Nw = {
		get: hm(!0, !1),
	},
	Zv = new WeakMap(),
	Jv = new WeakMap(),
	Qv = new WeakMap(),
	Dw = new WeakMap();

function Uw(i) {
	switch (i) {
		case "Object":
		case "Array":
			return 1;
		case "Map":
		case "Set":
		case "WeakMap":
		case "WeakSet":
			return 2;
		default:
			return 0;
	}
}

function Fw(i) {
	return i.__v_skip || !Object.isExtensible(i) ? 0 : Uw(nw(i));
}

function Dn(i) {
	return pa(i) ? i : um(i, !1, Sw, Iw, Zv);
}

function rc(i) {
	return um(i, !1, Mw, Ow, Jv);
}

function ex(i) {
	return um(i, !0, Tw, Nw, Qv);
}

function um(i, element, trigger, start, end) {
	if (!pt(i) || (i.__v_raw && !(element && i.__v_isReactive))) return i;
	const a = end.get(i);
	if (a) return a;
	const o = Fw(i);
	if (o === 0) return i;
	const l = new Proxy(i, o === 2 ? start : trigger);
	return (end.set(i, l), l);
}

function ao(i) {
	return pa(i) ? ao(i.__v_raw) : !!(i && i.__v_isReactive);
}

function pa(i) {
	return !!(i && i.__v_isReadonly);
}

function Xh(i) {
	return !!(i && i.__v_isShallow);
}

function tx(i) {
	return ao(i) || pa(i);
}

function st(i) {
	const element = i && i.__v_raw;
	return element ? st(element) : i;
}

function ix(i) {
	return (Vh(i, "__v_skip", !0), i);
}

const Pl = (i) => (pt(i) ? Dn(i) : i),
	dm = (i) => (pt(i) ? ex(i) : i);

class sx {
	constructor(element, trigger, start, end) {
		((this._setter = trigger),
			(this.dep = void 0),
			(this.__v_isRef = !0),
			(this.__v_isReadonly = !1),
			(this.effect = new am(
				() => element(this._value),
				() => Sh(this, 1),
				() => this.dep && qv(this.dep),
			)),
			(this.effect.computed = this),
			(this.effect.active = this._cacheable = !end),
			(this.__v_isReadonly = start));
	}
	
	get value() {
		const element = st(this);
		return (
			(!element._cacheable || element.effect.dirty) &&
			Sr(element._value, (element._value = element.effect.run())) &&
			Sh(element, 2),
				nx(element),
			element.effect._dirtyLevel >= 1 && Sh(element, 1),
				element._value
		);
	}
	
	set value(element) {
		this._setter(element);
	}
	
	get _dirty() {
		return this.effect.dirty;
	}
	
	set _dirty(element) {
		this.effect.dirty = element;
	}
}

function kw(i, element, trigger = !1) {
	let start, end;
	const a = He(i);
	return (
		a ? ((start = i), (end = cs)) : ((start = i.get), (end = i.set)),
			new sx(start, end, a || !end, trigger)
	);
}

function nx(i) {
	pr &&
	ia &&
	((i = st(i)),
		jv(
			ia,
			i.dep ||
			(i.dep = Xv(() => (i.dep = void 0), i instanceof sx ? i : void 0)),
		));
}

function Sh(i, element = 2, trigger) {
	i = st(i);
	const start = i.dep;
	start && Vv(start, element);
}

function fi(i) {
	return !!(i && i.__v_isRef === !0);
}

function us(i) {
	return rx(i, !1);
}

function Ll(i) {
	return rx(i, !0);
}

function rx(i, element) {
	return fi(i) ? i : new Bw(i, element);
}

class Bw {
	constructor(element, trigger) {
		((this.__v_isShallow = trigger),
			(this.dep = void 0),
			(this.__v_isRef = !0),
			(this._rawValue = trigger ? element : st(element)),
			(this._value = trigger ? element : Pl(element)));
	}
	
	get value() {
		return (nx(this), this._value);
	}
	
	set value(element) {
		const trigger = this.__v_isShallow || Xh(element) || pa(element);
		((element = trigger ? element : st(element)),
		Sr(element, this._rawValue) &&
		((this._rawValue = element),
			(this._value = trigger ? element : Pl(element)),
			Sh(this, 2)));
	}
}

function Ve(i) {
	return fi(i) ? i.value : i;
}

const Gw = {
	get: (i, element, trigger) => Ve(Reflect.get(i, element, trigger)),
	set: (i, element, trigger, start) => {
		const end = i[element];
		return fi(end) && !fi(trigger)
			? ((end.value = trigger), !0)
			: Reflect.set(i, element, trigger, start);
	},
};

function ax(i) {
	return ao(i) ? i : new Proxy(i, Gw);
}

class Hw {
	constructor(element, trigger, start) {
		((this._object = element),
			(this._key = trigger),
			(this._defaultValue = start),
			(this.__v_isRef = !0));
	}
	
	get value() {
		const element = this._object[this._key];
		return element === void 0 ? this._defaultValue : element;
	}
	
	set value(element) {
		this._object[this._key] = element;
	}
	
	get dep() {
		return xw(st(this._object), this._key);
	}
}

class zw {
	constructor(element) {
		((this._getter = element),
			(this.__v_isRef = !0),
			(this.__v_isReadonly = !0));
	}
	
	get value() {
		return this._getter();
	}
}

function Ww(i, element, trigger) {
	return fi(i)
		? i
		: He(i)
			? new zw(i)
			: pt(i) && arguments.length > 1
				? jw(i, element, trigger)
				: us(i);
}

function jw(i, element, trigger) {
	const start = i[element];
	return fi(start) ? start : new Hw(i, element, trigger);
}

/**
 * @vue/runtime-core v3.4.15
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/
function mr(i, element, trigger, start) {
	let end;
	try {
		end = start ? i(...start) : i();
	} catch (a) {
		Oo(a, element, trigger);
	}
	return end;
}

function Ms(i, element, trigger, start) {
	if (He(i)) {
		const a = mr(i, element, trigger, start);
		return (
			a &&
			Nv(a) &&
			a.catch((o) => {
				Oo(o, element, trigger);
			}),
				a
		);
	}
	const end = [];
	for (let a = 0; a < i.length; a++)
		end.push(Ms(i[a], element, trigger, start));
	return end;
}

function Oo(i, element, trigger, start = !0) {
	const end = element ? element.vnode : null;
	if (element) {
		let a = element.parent;
		const o = element.proxy,
			l = `https://vuejs.org/error-reference/#runtime-${trigger}`;
		for (; a;) {
			const h = a.ec;
			if (h) {
				for (let u = 0; u < h.length; u++) if (h[u](i, o, l) === !1) return;
			}
			a = a.parent;
		}
		const c = element.appContext.config.errorHandler;
		if (c) {
			mr(c, null, 10, [i, o, l]);
			return;
		}
	}
}

let Il = !1,
	Tf = !1;
const oi = [];
let en = 0;
const oo = [];
let ir = null,
	Zr = 0;
const ox = Promise.resolve();
let fm = null;

function Ma(i) {
	const element = fm || ox;
	return i ? element.then(this ? i.bind(this) : i) : element;
}

function Vw(i) {
	let element = en + 1,
		trigger = oi.length;
	for (; element < trigger;) {
		const start = (element + trigger) >>> 1,
			end = oi[start],
			a = Ol(end);
		a < i || (a === i && end.pre) ? (element = start + 1) : (trigger = start);
	}
	return element;
}

function Ou(i) {
	(!oi.length || !oi.includes(i, Il && i.allowRecurse ? en + 1 : en)) &&
	(i.id == null ? oi.push(i) : oi.splice(Vw(i.id), 0, i), lx());
}

function lx() {
	!Il && !Tf && ((Tf = !0), (fm = ox.then(cx)));
}

function qw(i) {
	const element = oi.indexOf(i);
	element > en && oi.splice(element, 1);
}

function Mf(i) {
	(Ue(i)
		? oo.push(...i)
		: (!ir || !ir.includes(i, i.allowRecurse ? Zr + 1 : Zr)) && oo.push(i),
		lx());
}

function Cg(i, element, trigger = Il ? en + 1 : 0) {
	for (; trigger < oi.length; trigger++) {
		const start = oi[trigger];
		if (start && start.pre) {
			if (i && start.id !== i.uid) continue;
			(oi.splice(trigger, 1), trigger--, start());
		}
	}
}

function $h(i) {
	if (oo.length) {
		const element = [...new Set(oo)].sort(
			(trigger, start) => Ol(trigger) - Ol(start),
		);
		if (((oo.length = 0), ir)) {
			ir.push(...element);
			return;
		}
		for (ir = element, Zr = 0; Zr < ir.length; Zr++) ir[Zr]();
		((ir = null), (Zr = 0));
	}
}

const Ol = (i) => (i.id == null ? 1 / 0 : i.id),
	Xw = (i, element) => {
		const trigger = Ol(i) - Ol(element);
		if (trigger === 0) {
			if (i.pre && !element.pre) return -1;
			if (element.pre && !i.pre) return 1;
		}
		return trigger;
	};

function cx(i) {
	((Tf = !1), (Il = !0), oi.sort(Xw));
	const element = cs;
	try {
		for (en = 0; en < oi.length; en++) {
			const trigger = oi[en];
			trigger && trigger.active !== !1 && mr(trigger, null, 14);
		}
	} finally {
		((en = 0),
			(oi.length = 0),
			$h(),
			(Il = !1),
			(fm = null),
		(oi.length || oo.length) && cx());
	}
}

function $w(i, element, ...trigger) {
	if (i.isUnmounted) return;
	const start = i.vnode.props || xt;
	let end = trigger;
	const a = element.startsWith("update:"),
		o = a && element.slice(7);
	if (o && o in start) {
		const u = `${o === "modelValue" ? "model" : o}Modifiers`,
			{number: d, trim: f} = start[u] || xt;
		(f && (end = trigger.map((p) => (Tt(p) ? p.trim() : p))),
		d && (end = trigger.map(ow)));
	}
	let l,
		c = start[(l = nd(element))] || start[(l = nd(hn(element)))];
	(!c && a && (c = start[(l = nd(Io(element)))]), c && Ms(c, i, 6, end));
	const h = start[l + "Once"];
	if (h) {
		if (!i.emitted) i.emitted = {};
		else if (i.emitted[l]) return;
		((i.emitted[l] = !0), Ms(h, i, 6, end));
	}
}

function hx(i, element, trigger = !1) {
	const start = element.emitsCache,
		end = start.get(i);
	if (end !== void 0) return end;
	const a = i.emits;
	let o = {},
		l = !1;
	if (!He(i)) {
		const c = (h) => {
			const u = hx(h, element, !0);
			u && ((l = !0), kt(o, u));
		};
		(!trigger && element.mixins.length && element.mixins.forEach(c),
		i.extends && c(i.extends),
		i.mixins && i.mixins.forEach(c));
	}
	return !a && !l
		? (pt(i) && start.set(i, null), null)
		: (Ue(a) ? a.forEach((c) => (o[c] = null)) : kt(o, a),
		pt(i) && start.set(i, o),
			o);
}

function Nu(i, element) {
	return !i || !ic(element)
		? !1
		: ((element = element.slice(2).replace(/Once$/, "")),
		it(i, element[0].toLowerCase() + element.slice(1)) ||
		it(i, Io(element)) ||
		it(i, element));
}

let Yt = null,
	Du = null;

function Yh(i) {
	const element = Yt;
	return ((Yt = i), (Du = (i && i.type.__scopeId) || null), element);
}

function FD(i) {
	Du = i;
}

function kD() {
	Du = null;
}

function Jr(i, element = Yt, trigger) {
	if (!element || i._n) return i;
	const start = (...end) => {
		start._d && Wg(-1);
		const a = Yh(element);
		let o;
		try {
			o = i(...end);
		} finally {
			(Yh(a), start._d && Wg(1));
		}
		return o;
	};
	return ((start._n = !0), (start._c = !0), (start._d = !0), start);
}

function ad(i) {
	const {
		type: element,
		vnode: trigger,
		proxy: start,
		withProxy: end,
		props: a,
		propsOptions: [o],
		slots: l,
		attrs: c,
		emit: h,
		render: u,
		renderCache: d,
		data: f,
		setupState: p,
		ctx: _,
		inheritAttrs: m,
	} = i;
	let g, b;
	const x = Yh(i);
	try {
		if (trigger.shapeFlag & 4) {
			const w = end || start,
				E = w;
			((g = xs(u.call(E, w, d, a, p, f, _))), (b = c));
		} else {
			const w = element;
			((g = xs(
				w.length > 1
					? w(a, {
						attrs: c,
						slots: l,
						emit: h,
					})
					: w(a, null),
			)),
				(b = element.props ? c : Kw(c)));
		}
	} catch (w) {
		((dl.length = 0), Oo(w, i, 1), (g = nt(Ai)));
	}
	let v = g;
	if (b && m !== !1) {
		const w = Object.keys(b),
			{shapeFlag: E} = v;
		w.length && E & 7 && (o && w.some(sm) && (b = Zw(b, o)), (v = Un(v, b)));
	}
	return (
		trigger.dirs &&
		((v = Un(v)),
			(v.dirs = v.dirs ? v.dirs.concat(trigger.dirs) : trigger.dirs)),
		trigger.transition && (v.transition = trigger.transition),
			(g = v),
			Yh(x),
			g
	);
}

function Yw(i, element = !0) {
	let trigger;
	for (let start = 0; start < i.length; start++) {
		const end = i[start];
		if (yo(end)) {
			if (end.type !== Ai || end.children === "v-if") {
				if (trigger) return;
				trigger = end;
			}
		} else return;
	}
	return trigger;
}

const Kw = (i) => {
		let element;
		for (const trigger in i)
			(trigger === "class" || trigger === "style" || ic(trigger)) &&
			((element || (element = {}))[trigger] = i[trigger]);
		return element;
	},
	Zw = (i, element) => {
		const trigger = {};
		for (const start in i)
			(!sm(start) || !(start.slice(9) in element)) &&
			(trigger[start] = i[start]);
		return trigger;
	};

function Jw(i, element, trigger) {
	const {props: start, children: end, component: a} = i,
		{props: o, children: l, patchFlag: c} = element,
		h = a.emitsOptions;
	if (element.dirs || element.transition) return !0;
	if (trigger && c >= 0) {
		if (c & 1024) return !0;
		if (c & 16) return start ? Pg(start, o, h) : !!o;
		if (c & 8) {
			const u = element.dynamicProps;
			for (let d = 0; d < u.length; d++) {
				const f = u[d];
				if (o[f] !== start[f] && !Nu(h, f)) return !0;
			}
		}
	} else
		return (end || l) && (!l || !l.$stable)
			? !0
			: start === o
				? !1
				: start
					? o
						? Pg(start, o, h)
						: !0
					: !!o;
	return !1;
}

function Pg(i, element, trigger) {
	const start = Object.keys(element);
	if (start.length !== Object.keys(i).length) return !0;
	for (let end = 0; end < start.length; end++) {
		const a = start[end];
		if (element[a] !== i[a] && !Nu(trigger, a)) return !0;
	}
	return !1;
}

function pm({vnode: i, parent: element}, trigger) {
	for (; element;) {
		const start = element.subTree;
		if (
			(start.suspense && start.suspense.activeBranch === i && (start.el = i.el),
			start === i)
		)
			(((i = element.vnode).el = trigger), (element = element.parent));
		else break;
	}
}

const mm = "components";

function Qw(i, element) {
	return dx(mm, i, !0, element) || i;
}

const ux = Symbol.for("v-ndc");

function eE(i) {
	return Tt(i) ? dx(mm, i, !1) || i : i || ux;
}

function dx(i, element, trigger = !0, start = !1) {
	const end = Yt || Ft;
	if (end) {
		const a = end.type;
		if (i === mm) {
			const l = Df(a, !1);
			if (l && (l === element || l === hn(element) || l === Pu(hn(element))))
				return a;
		}
		const o = Lg(end[i] || a[i], element) || Lg(end.appContext[i], element);
		return !o && start ? a : o;
	}
}

function Lg(i, element) {
	return i && (i[element] || i[hn(element)] || i[Pu(hn(element))]);
}

const fx = (i) => i.__isSuspense;
let Rf = 0;
const tE = {
		name: "Suspense",
		__isSuspense: !0,
		process(i, element, trigger, start, end, a, o, l, c, h) {
			if (i == null) iE(element, trigger, start, end, a, o, l, c, h);
			else {
				if (a && a.deps > 0) {
					element.suspense = i.suspense;
					return;
				}
				sE(i, element, trigger, start, end, o, l, c, h);
			}
		},
		hydrate: nE,
		create: _m,
		normalize: rE,
	},
	gm = tE;

function Nl(i, element) {
	const trigger = i.props && i.props[element];
	He(trigger) && trigger();
}

function iE(i, element, trigger, start, end, a, o, l, c) {
	const {
			p: h,
			o: {createElement: u},
		} = c,
		d = u("div"),
		f = (i.suspense = _m(i, end, start, element, d, trigger, a, o, l, c));
	(h(null, (f.pendingBranch = i.ssContent), d, null, start, f, a, o),
		f.deps > 0
			? (Nl(i, "onPending"),
				Nl(i, "onFallback"),
				h(null, i.ssFallback, element, trigger, start, null, a, o),
				lo(f, i.ssFallback))
			: f.resolve(!1, !0));
}

function sE(
	i,
	element,
	trigger,
	start,
	end,
	a,
	o,
	l,
	{p: c, um: h, o: {createElement: u}},
) {
	const d = (element.suspense = i.suspense);
	((d.vnode = element), (element.el = i.el));
	const f = element.ssContent,
		p = element.ssFallback,
		{activeBranch: _, pendingBranch: m, isInFallback: g, isHydrating: b} = d;
	if (m)
		((d.pendingBranch = f),
			ks(f, m)
				? (c(m, f, d.hiddenContainer, null, end, d, a, o, l),
					d.deps <= 0
						? d.resolve()
						: g &&
						(b || (c(_, p, trigger, start, end, null, a, o, l), lo(d, p))))
				: ((d.pendingId = Rf++),
					b ? ((d.isHydrating = !1), (d.activeBranch = m)) : h(m, end, d),
					(d.deps = 0),
					(d.effects.length = 0),
					(d.hiddenContainer = u("div")),
					g
						? (c(null, f, d.hiddenContainer, null, end, d, a, o, l),
							d.deps <= 0
								? d.resolve()
								: (c(_, p, trigger, start, end, null, a, o, l), lo(d, p)))
						: _ && ks(f, _)
							? (c(_, f, trigger, start, end, d, a, o, l), d.resolve(!0))
							: (c(null, f, d.hiddenContainer, null, end, d, a, o, l),
							d.deps <= 0 && d.resolve())));
	else if (_ && ks(f, _)) (c(_, f, trigger, start, end, d, a, o, l), lo(d, f));
	else if (
		(Nl(element, "onPending"),
			(d.pendingBranch = f),
			f.shapeFlag & 512
				? (d.pendingId = f.component.suspenseId)
				: (d.pendingId = Rf++),
			c(null, f, d.hiddenContainer, null, end, d, a, o, l),
		d.deps <= 0)
	)
		d.resolve();
	else {
		const {timeout: x, pendingId: v} = d;
		x > 0
			? setTimeout(() => {
				d.pendingId === v && d.fallback(p);
			}, x)
			: x === 0 && d.fallback(p);
	}
}

function _m(i, element, trigger, start, end, a, o, l, c, h, u = !1) {
	const {
		p: d,
		m: f,
		um: p,
		start: _,
		o: {parentNode: m, remove: g},
	} = h;
	let b;
	const x = aE(i);
	x &&
	element != null &&
	element.pendingBranch &&
	((b = element.pendingId), element.deps++);
	const v = i.props ? Fv(i.props.timeout) : void 0,
		w = a,
		E = {
			vnode: i,
			parent: element,
			parentComponent: trigger,
			namespace: o,
			container: start,
			hiddenContainer: end,
			deps: 0,
			pendingId: Rf++,
			timeout: typeof v == "number" ? v : -1,
			activeBranch: null,
			pendingBranch: null,
			isInFallback: !u,
			isHydrating: u,
			isUnmounted: !1,
			effects: [],
			resolve(T = !1, M = !1) {
				const {
					vnode: U,
					activeBranch: L,
					pendingBranch: O,
					pendingId: B,
					effects: P,
					parentComponent: q,
					container: $,
				} = E;
				let oe = !1;
				(E.isHydrating
					? (E.isHydrating = !1)
					: T ||
					((oe = L && O.transition && O.transition.mode === "out-in"),
					oe &&
					(L.transition.afterLeave = () => {
						B === E.pendingId && (f(O, $, a === w ? _(L) : a, 0), Mf(P));
					}),
					L && (m(L.el) !== E.hiddenContainer && (a = _(L)), p(L, q, E, !0)),
					oe || f(O, $, a, 0)),
					lo(E, O),
					(E.pendingBranch = null),
					(E.isInFallback = !1));
				let X = E.parent,
					z = !1;
				for (; X;) {
					if (X.pendingBranch) {
						(X.effects.push(...P), (z = !0));
						break;
					}
					X = X.parent;
				}
				(!z && !oe && Mf(P),
					(E.effects = []),
				x &&
				element &&
				element.pendingBranch &&
				b === element.pendingId &&
				(element.deps--, element.deps === 0 && !M && element.resolve()),
					Nl(U, "onResolve"));
			},
			fallback(T) {
				if (!E.pendingBranch) return;
				const {
					vnode: M,
					activeBranch: U,
					parentComponent: L,
					container: O,
					namespace: B,
				} = E;
				Nl(M, "onFallback");
				const P = _(U),
					q = () => {
						E.isInFallback && (d(null, T, O, P, L, null, B, l, c), lo(E, T));
					},
					$ = T.transition && T.transition.mode === "out-in";
				($ && (U.transition.afterLeave = q),
					(E.isInFallback = !0),
					p(U, L, null, !0),
				$ || q());
			},
			move(T, M, U) {
				(E.activeBranch && f(E.activeBranch, T, M, U), (E.container = T));
			},
			next() {
				return E.activeBranch && _(E.activeBranch);
			},
			registerDep(T, M) {
				const U = !!E.pendingBranch;
				U && E.deps++;
				const L = T.vnode.el;
				T.asyncDep
					.catch((O) => {
						Oo(O, T, 0);
					})
					.then((O) => {
						if (T.isUnmounted || E.isUnmounted || E.pendingId !== T.suspenseId)
							return;
						T.asyncResolved = !0;
						const {vnode: B} = T;
						(Nf(T, O, !1), L && (B.el = L));
						const P = !L && T.subTree.el;
						(M(T, B, m(L || T.subTree.el), L ? null : _(T.subTree), E, o, c),
						P && g(P),
							pm(T, B.el),
						U && --E.deps === 0 && E.resolve());
					});
			},
			unmount(T, M) {
				((E.isUnmounted = !0),
				E.activeBranch && p(E.activeBranch, trigger, T, M),
				E.pendingBranch && p(E.pendingBranch, trigger, T, M));
			},
		};
	return E;
}

function nE(i, element, trigger, start, end, a, o, l, c) {
	const h = (element.suspense = _m(
			element,
			start,
			trigger,
			i.parentNode,
			document.createElement("div"),
			null,
			end,
			a,
			o,
			l,
			!0,
		)),
		u = c(i, (h.pendingBranch = element.ssContent), trigger, h, a, o);
	return (h.deps === 0 && h.resolve(!1, !0), u);
}

function rE(i) {
	const {shapeFlag: element, children: trigger} = i,
		start = element & 32;
	((i.ssContent = Ig(start ? trigger.default : trigger)),
		(i.ssFallback = start ? Ig(trigger.fallback) : nt(Ai)));
}

function Ig(i) {
	let element;
	if (He(i)) {
		const trigger = xo && i._c;
		(trigger && ((i._d = !1), Ut()),
			(i = i()),
		trigger && ((i._d = !0), (element = Es), kx()));
	}
	return (
		Ue(i) && (i = Yw(i)),
			(i = xs(i)),
		element &&
		!i.dynamicChildren &&
		(i.dynamicChildren = element.filter((trigger) => trigger !== i)),
			i
	);
}

function px(i, element) {
	element && element.pendingBranch
		? Ue(i)
			? element.effects.push(...i)
			: element.effects.push(i)
		: Mf(i);
}

function lo(i, element) {
	i.activeBranch = element;
	const {vnode: trigger, parentComponent: start} = i;
	let end = element.el;
	for (; !end && element.component;)
		((element = element.component.subTree), (end = element.el));
	((trigger.el = end),
	start &&
	start.subTree === trigger &&
	((start.vnode.el = end), pm(start, end)));
}

function aE(i) {
	var element;
	return (
		((element = i.props) == null ? void 0 : element.suspensible) != null &&
		i.props.suspensible !== !1
	);
}

const oE = Symbol.for("v-scx"),
	lE = () => Ri(oE);

function cE(i, element) {
	return vm(i, null, element);
}

const Rc = {};

function co(i, element, trigger) {
	return vm(i, element, trigger);
}

function vm(
	i,
	element,
	{
		immediate: trigger,
		deep: start,
		flush: end,
		once: a,
		onTrack: o,
		onTrigger: l,
	} = xt,
) {
	if (element && a) {
		const T = element;
		element = (...M) => {
			(T(...M), E());
		};
	}
	const c = Ft,
		h = (T) => (start === !0 ? T : Ja(T, start === !1 ? 1 : void 0));
	let u,
		d = !1,
		f = !1;
	if (
		(fi(i)
			? ((u = () => i.value), (d = Xh(i)))
			: ao(i)
				? ((u = () => h(i)), (d = !0))
				: Ue(i)
					? ((f = !0),
						(d = i.some((T) => ao(T) || Xh(T))),
						(u = () =>
							i.map((T) => {
								if (fi(T)) return T.value;
								if (ao(T)) return h(T);
								if (He(T)) return mr(T, c, 2);
							})))
					: He(i)
						? element
							? (u = () => mr(i, c, 2))
							: (u = () => (p && p(), Ms(i, c, 3, [_])))
						: (u = cs),
		element && start)
	) {
		const T = u;
		u = () => Ja(T());
	}
	let p,
		_ = (T) => {
			p = v.onStop = () => {
				(mr(T, c, 4), (p = v.onStop = void 0));
			};
		},
		m;
	if (cc)
		if (
			((_ = cs),
				element ? trigger && Ms(element, c, 3, [u(), f ? [] : void 0, _]) : u(),
			end === "sync")
		) {
			const T = lE();
			m = T.__watcherHandles || (T.__watcherHandles = []);
		} else return cs;
	let g = f ? new Array(i.length).fill(Rc) : Rc;
	const b = () => {
		if (!(!v.active || !v.dirty))
			if (element) {
				const T = v.run();
				(start || d || (f ? T.some((M, U) => Sr(M, g[U])) : Sr(T, g))) &&
				(p && p(),
					Ms(element, c, 3, [
						T,
						g === Rc ? void 0 : f && g[0] === Rc ? [] : g,
						_,
					]),
					(g = T));
			} else v.run();
	};
	b.allowRecurse = !!element;
	let x;
	end === "sync"
		? (x = b)
		: end === "post"
			? (x = () => $trigger(b, c && c.suspense))
			: ((b.pre = !0), c && (b.id = c.uid), (x = () => Ou(b)));
	const v = new am(u, cs, x),
		w = _w(),
		E = () => {
			(v.stop(), w && nm(w.effects, v));
		};
	return (
		element
			? trigger
				? b()
				: (g = v.run())
			: end === "post"
				? $trigger(v.run.bind(v), c && c.suspense)
				: v.run(),
		m && m.push(E),
			E
	);
}

function hE(i, element, trigger) {
	const start = this.proxy,
		end = Tt(i)
			? i.includes(".")
				? mx(start, i)
				: () => start[i]
			: i.bind(start, start);
	let a;
	He(element) ? (a = element) : ((a = element.handler), (trigger = element));
	const o = lc(this),
		l = vm(end, a.bind(start), trigger);
	return (o(), l);
}

function mx(i, element) {
	const trigger = element.split(".");
	return () => {
		let start = i;
		for (let end = 0; end < trigger.length && start; end++)
			start = start[trigger[end]];
		return start;
	};
}

function Ja(i, element, trigger = 0, start) {
	if (!pt(i) || i.__v_skip) return i;
	if (element && element > 0) {
		if (trigger >= element) return i;
		trigger++;
	}
	if (((start = start || new Set()), start.has(i))) return i;
	if ((start.add(i), fi(i))) Ja(i.value, element, trigger, start);
	else if (Ue(i))
		for (let end = 0; end < i.length; end++)
			Ja(i[end], element, trigger, start);
	else if (Ov(i) || ro(i))
		i.forEach((end) => {
			Ja(end, element, trigger, start);
		});
	else if (Uv(i)) for (const end in i) Ja(i[end], element, trigger, start);
	return i;
}

function Ys(i, element, trigger, start) {
	const end = i.dirs,
		a = element && element.dirs;
	for (let o = 0; o < end.length; o++) {
		const l = end[o];
		a && (l.oldValue = a[o].value);
		let c = l.dir[start];
		c && (Sa(), Ms(c, trigger, 8, [i.el, l, i, element]), Ta());
	}
}

const sr = Symbol("_leaveCb"),
	Ac = Symbol("_enterCb");

function uE() {
	const i = {
		isMounted: !1,
		isLeaving: !1,
		isUnmounting: !1,
		leavingVNodes: new Map(),
	};
	return (
		Fu(() => {
			i.isMounted = !0;
		}),
			oc(() => {
				i.isUnmounting = !0;
			}),
			i
	);
}

const gs = [Function, Array],
	gx = {
		mode: String,
		appear: Boolean,
		persisted: Boolean,
		onBeforeEnter: gs,
		onEnter: gs,
		onAfterEnter: gs,
		onEnterCancelled: gs,
		onBeforeLeave: gs,
		onLeave: gs,
		onAfterLeave: gs,
		onLeaveCancelled: gs,
		onBeforeAppear: gs,
		onAppear: gs,
		onAfterAppear: gs,
		onAppearCancelled: gs,
	},
	dE = {
		name: "BaseTransition",
		props: gx,
		setup(i, {slots: element}) {
			const trigger = Bu(),
				start = uE();
			let end;
			return () => {
				const a = element.default && vx(element.default(), !0);
				if (!a || !a.length) return;
				let o = a[0];
				if (a.length > 1) {
					for (const m of a)
						if (m.type !== Ai) {
							o = m;
							break;
						}
				}
				const l = st(i),
					{mode: c} = l;
				if (start.isLeaving) return od(o);
				const h = Og(o);
				if (!h) return od(o);
				const u = Af(h, l, start, trigger);
				Kh(h, u);
				const d = trigger.subTree,
					f = d && Og(d);
				let p = !1;
				const {getTransitionKey: _} = h.type;
				if (_) {
					const m = _();
					end === void 0 ? (end = m) : m !== end && ((end = m), (p = !0));
				}
				if (f && f.type !== Ai && (!ks(h, f) || p)) {
					const m = Af(f, l, start, trigger);
					if ((Kh(f, m), c === "out-in"))
						return (
							(start.isLeaving = !0),
								(m.afterLeave = () => {
									((start.isLeaving = !1),
									trigger.update.active !== !1 &&
									((trigger.effect.dirty = !0), trigger.update()));
								}),
								od(o)
						);
					c === "in-out" &&
					h.type !== Ai &&
					(m.delayLeave = (g, b, x) => {
						const v = _x(start, f);
						((v[String(f.key)] = f),
							(g[sr] = () => {
								(b(), (g[sr] = void 0), delete u.delayedLeave);
							}),
							(u.delayedLeave = x));
					});
				}
				return o;
			};
		},
	},
	fE = dE;

function _x(i, element) {
	const {leavingVNodes: trigger} = i;
	let start = trigger.get(element.type);
	return (
		start || ((start = Object.create(null)), trigger.set(element.type, start)),
			start
	);
}

function Af(i, element, trigger, start) {
	const {
			appear: end,
			mode: a,
			persisted: o = !1,
			onBeforeEnter: l,
			onEnter: c,
			onAfterEnter: h,
			onEnterCancelled: u,
			onBeforeLeave: d,
			onLeave: f,
			onAfterLeave: p,
			onLeaveCancelled: _,
			onBeforeAppear: m,
			onAppear: g,
			onAfterAppear: b,
			onAppearCancelled: x,
		} = element,
		v = String(i.key),
		w = _x(trigger, i),
		E = (U, L) => {
			U && Ms(U, start, 9, L);
		},
		T = (U, L) => {
			const O = L[1];
			(E(U, L),
				Ue(U) ? U.every((B) => B.length <= 1) && O() : U.length <= 1 && O());
		},
		M = {
			mode: a,
			persisted: o,
			beforeEnter(U) {
				let L = l;
				if (!trigger.isMounted)
					if (end) L = m || l;
					else return;
				U[sr] && U[sr](!0);
				const O = w[v];
				(O && ks(i, O) && O.el[sr] && O.el[sr](), E(L, [U]));
			},
			enter(U) {
				let L = c,
					O = h,
					B = u;
				if (!trigger.isMounted)
					if (end) ((L = g || c), (O = b || h), (B = x || u));
					else return;
				let P = !1;
				const q = (U[Ac] = ($) => {
					P ||
					((P = !0),
						$ ? E(B, [U]) : E(O, [U]),
					M.delayedLeave && M.delayedLeave(),
						(U[Ac] = void 0));
				});
				L ? T(L, [U, q]) : q();
			},
			leave(U, L) {
				const O = String(i.key);
				if ((U[Ac] && U[Ac](!0), trigger.isUnmounting)) return L();
				E(d, [U]);
				let B = !1;
				const P = (U[sr] = (q) => {
					B ||
					((B = !0),
						L(),
						q ? E(_, [U]) : E(p, [U]),
						(U[sr] = void 0),
					w[O] === i && delete w[O]);
				});
				((w[O] = i), f ? T(f, [U, P]) : P());
			},
			clone(U) {
				return Af(U, element, trigger, start);
			},
		};
	return M;
}

function od(i) {
	if (ac(i)) return ((i = Un(i)), (i.children = null), i);
}

function Og(i) {
	return ac(i) ? (i.children ? i.children[0] : void 0) : i;
}

function Kh(i, element) {
	i.shapeFlag & 6 && i.component
		? Kh(i.component.subTree, element)
		: i.shapeFlag & 128
			? ((i.ssContent.transition = element.clone(i.ssContent)),
				(i.ssFallback.transition = element.clone(i.ssFallback)))
			: (i.transition = element);
}

function vx(i, element = !1, trigger) {
	let start = [],
		end = 0;
	for (let a = 0; a < i.length; a++) {
		let o = i[a];
		const l =
			trigger == null
				? o.key
				: String(trigger) + String(o.key != null ? o.key : a);
		o.type === wi
			? (o.patchFlag & 128 && end++,
				(start = start.concat(vx(o.children, element, l))))
			: (element || o.type !== Ai) &&
			start.push(
				l != null
					? Un(o, {
						key: l,
					})
					: o,
			);
	}
	if (end > 1) for (let a = 0; a < start.length; a++) start[a].patchFlag = -2;
	return start;
}

/*! #__NO_SIDE_EFFECTS__ */
function Gn(i, element) {
	return He(i)
		? (() =>
			kt(
				{
					name: i.name,
				},
				element,
				{
					setup: i,
				},
			))()
		: i;
}

const na = (i) => !!i.type.__asyncLoader;

/*! #__NO_SIDE_EFFECTS__ */
function Ng(i) {
	He(i) &&
	(i = {
		loader: i,
	});
	const {
		loader: element,
		loadingComponent: trigger,
		errorComponent: start,
		delay: end = 200,
		timeout: a,
		suspensible: o = !0,
		onError: l,
	} = i;
	let c = null,
		h,
		u = 0;
	const d = () => (u++, (c = null), f()),
		f = () => {
			let p;
			return (
				c ||
				(p = c =
					element()
						.catch((_) => {
							if (((_ = _ instanceof Error ? _ : new Error(String(_))), l))
								return new Promise((m, g) => {
									l(
										_,
										() => m(d()),
										() => g(_),
										u + 1,
									);
								});
							throw _;
						})
						.then((_) =>
							p !== c && c
								? c
								: (_ &&
								(_.__esModule || _[Symbol.toStringTag] === "Module") &&
								(_ = _.default),
									(h = _),
									_),
						))
			);
		};
	return Gn({
		name: "AsyncComponentWrapper",
		__asyncLoader: f,
		get __asyncResolved() {
			return h;
		},
		setup() {
			const p = Ft;
			if (h) return () => ld(h, p);
			const _ = (x) => {
				((c = null), Oo(x, p, 13, !start));
			};
			if ((o && p.suspense) || cc)
				return f()
					.then((x) => () => ld(x, p))
					.catch(
						(x) => (
							_(x),
								() =>
									start
										? nt(start, {
											error: x,
										})
										: null
						),
					);
			const m = us(!1),
				g = us(),
				b = us(!!end);
			return (
				end &&
				setTimeout(() => {
					b.value = !1;
				}, end),
				a != null &&
				setTimeout(() => {
					if (!m.value && !g.value) {
						const x = new Error(`Async component timed out after ${a}ms.`);
						(_(x), (g.value = x));
					}
				}, a),
					f()
						.then(() => {
							((m.value = !0),
							p.parent &&
							ac(p.parent.vnode) &&
							((p.parent.effect.dirty = !0), Ou(p.parent.update)));
						})
						.catch((x) => {
							(_(x), (g.value = x));
						}),
					() => {
						if (m.value && h) return ld(h, p);
						if (g.value && start)
							return nt(start, {
								error: g.value,
							});
						if (trigger && !b.value) return nt(trigger);
					}
			);
		},
	});
}

function ld(i, element) {
	const {ref: trigger, props: start, children: end, ce: a} = element.vnode,
		o = nt(i, start, end);
	return ((o.ref = trigger), (o.ce = a), delete element.vnode.ce, o);
}

const ac = (i) => i.type.__isKeepAlive,
	pE = {
		name: "KeepAlive",
		__isKeepAlive: !0,
		props: {
			include: [String, RegExp, Array],
			exclude: [String, RegExp, Array],
			max: [String, Number],
		},
		setup(i, {slots: element}) {
			const trigger = Bu(),
				start = trigger.ctx;
			if (!start.renderer)
				return () => {
					const x = element.default && element.default();
					return x && x.length === 1 ? x[0] : x;
				};
			const end = new Map(),
				a = new Set();
			let o = null;
			const l = trigger.suspense,
				{
					renderer: {
						p: c,
						m: h,
						um: u,
						o: {createElement: d},
					},
				} = start,
				f = d("div");
			((start.activate = (x, v, w, E, T) => {
				const M = x.component;
				(h(x, v, w, 0, l),
					c(M.vnode, x, v, w, M, l, E, x.slotScopeIds, T),
					$trigger(() => {
						((M.isDeactivated = !1), M.a && cl(M.a));
						const U = x.props && x.props.onVnodeMounted;
						U && ki(U, M.parent, x);
					}, l));
			}),
				(start.deactivate = (x) => {
					const v = x.component;
					(h(x, f, null, 1, l),
						$trigger(() => {
							v.da && cl(v.da);
							const w = x.props && x.props.onVnodeUnmounted;
							(w && ki(w, v.parent, x), (v.isDeactivated = !0));
						}, l));
				}));
			
			function p(x) {
				(cd(x), u(x, trigger, l, !0));
			}
			
			function _(x) {
				end.forEach((v, w) => {
					const E = Df(v.type);
					E && (!x || !x(E)) && m(w);
				});
			}
			
			function m(x) {
				const v = end.get(x);
				(!o || !ks(v, o) ? p(v) : o && cd(o), end.delete(x), a.delete(x));
			}
			
			co(
				() => [i.include, i.exclude],
				([x, v]) => {
					(x && _((w) => Jo(x, w)), v && _((w) => !Jo(v, w)));
				},
				{
					flush: "post",
					deep: !0,
				},
			);
			let g = null;
			const b = () => {
				g != null && end.set(g, hd(trigger.subTree));
			};
			return (
				Fu(b),
					wx(b),
					oc(() => {
						end.forEach((x) => {
							const {subTree: v, suspense: w} = trigger,
								E = hd(v);
							if (x.type === E.type && x.key === E.key) {
								cd(E);
								const T = E.component.da;
								T && $trigger(T, w);
								return;
							}
							p(x);
						});
					}),
					() => {
						if (((g = null), !element.default)) return null;
						const x = element.default(),
							v = x[0];
						if (x.length > 1) return ((o = null), x);
						if (!yo(v) || (!(v.shapeFlag & 4) && !(v.shapeFlag & 128)))
							return ((o = null), v);
						let w = hd(v);
						const E = w.type,
							T = Df(na(w) ? w.type.__asyncResolved || {} : E),
							{include: M, exclude: U, max: L} = i;
						if ((M && (!T || !Jo(M, T))) || (U && T && Jo(U, T)))
							return ((o = w), v);
						const O = w.key == null ? E : w.key,
							B = end.get(O);
						return (
							w.el && ((w = Un(w)), v.shapeFlag & 128 && (v.ssContent = w)),
								(g = O),
								B
									? ((w.el = B.el),
										(w.component = B.component),
									w.transition && Kh(w, w.transition),
										(w.shapeFlag |= 512),
										a.delete(O),
										a.add(O))
									: (a.add(O),
									L && a.size > parseInt(L, 10) && m(a.values().next().value)),
								(w.shapeFlag |= 256),
								(o = w),
								fx(v.type) ? v : w
						);
					}
			);
		},
	},
	mE = pE;

function Jo(i, element) {
	return Ue(i)
		? i.some((trigger) => Jo(trigger, element))
		: Tt(i)
			? i.split(",").includes(element)
			: sw(i)
				? i.test(element)
				: !1;
}

function xx(i, element) {
	bx(i, "a", element);
}

function yx(i, element) {
	bx(i, "da", element);
}

function bx(i, element, trigger = Ft) {
	const start =
		i.__wdc ||
		(i.__wdc = () => {
			let end = trigger;
			for (; end;) {
				if (end.isDeactivated) return;
				end = end.parent;
			}
			return i();
		});
	if ((Uu(element, start, trigger), trigger)) {
		let end = trigger.parent;
		for (; end && end.parent;)
			(ac(end.parent.vnode) && gE(start, element, trigger, end),
				(end = end.parent));
	}
}

function gE(i, element, trigger, start) {
	const end = Uu(element, i, start, !0);
	Ex(() => {
		nm(start[element], end);
	}, trigger);
}

function cd(i) {
	((i.shapeFlag &= -257), (i.shapeFlag &= -513));
}

function hd(i) {
	return i.shapeFlag & 128 ? i.ssContent : i;
}

function Uu(i, element, trigger = Ft, start = !1) {
	if (trigger) {
		const end = trigger[i] || (trigger[i] = []),
			a =
				element.__weh ||
				(element.__weh = (...o) => {
					if (trigger.isUnmounted) return;
					Sa();
					const l = lc(trigger),
						c = Ms(element, trigger, i, o);
					return (l(), Ta(), c);
				});
		return (start ? end.unshift(a) : end.push(a), a);
	}
}

const Hn =
		(i) =>
			(element, trigger = Ft) =>
				(!cc || i === "sp") && Uu(i, (...start) => element(...start), trigger),
	_E = Hn("bm"),
	Fu = Hn("m"),
	vE = Hn("bu"),
	wx = Hn("u"),
	oc = Hn("bum"),
	Ex = Hn("um"),
	xE = Hn("sp"),
	yE = Hn("rtg"),
	bE = Hn("rtc");

function Sx(i, element = Ft) {
	Uu("ec", i, element);
}

function BD(i, element, trigger, start) {
	let end;
	const a = trigger && trigger[start];
	if (Ue(i) || Tt(i)) {
		end = new Array(i.length);
		for (let o = 0, l = i.length; o < l; o++)
			end[o] = element(i[o], o, void 0, a && a[o]);
	} else if (typeof i == "number") {
		end = new Array(i);
		for (let o = 0; o < i; o++) end[o] = element(o + 1, o, void 0, a && a[o]);
	} else if (pt(i))
		if (i[Symbol.iterator])
			end = Array.from(i, (o, l) => element(o, l, void 0, a && a[l]));
		else {
			const o = Object.keys(i);
			end = new Array(o.length);
			for (let l = 0, c = o.length; l < c; l++) {
				const h = o[l];
				end[l] = element(i[h], h, l, a && a[l]);
			}
		}
	else end = [];
	return (trigger && (trigger[start] = end), end);
}

function GD(i, element, trigger = {}, start, end) {
	if (Yt.isCE || (Yt.parent && na(Yt.parent) && Yt.parent.isCE))
		return (
			element !== "default" && (trigger.name = element),
				nt("slot", trigger, start && start())
		);
	let a = i[element];
	(a && a._c && (a._d = !1), Ut());
	const o = a && Tx(a(trigger)),
		l = or(
			wi,
			{
				key: trigger.key || (o && o.key) || `_${element}`,
			},
			o || (start ? start() : []),
			o && i._ === 1 ? 64 : -2,
		);
	return (
		!end && l.scopeId && (l.slotScopeIds = [l.scopeId + "-s"]),
		a && a._c && (a._d = !0),
			l
	);
}

function Tx(i) {
	return i.some((element) =>
		yo(element)
			? !(element.type === Ai || (element.type === wi && !Tx(element.children)))
			: !0,
	)
		? i
		: null;
}

const Cf = (i) => (i ? (jx(i) ? Em(i) || i.proxy : Cf(i.parent)) : null),
	hl = kt(Object.create(null), {
		$: (i) => i,
		$el: (i) => i.vnode.el,
		$data: (i) => i.data,
		$props: (i) => i.props,
		$attrs: (i) => i.attrs,
		$slots: (i) => i.slots,
		$refs: (i) => i.refs,
		$parent: (i) => Cf(i.parent),
		$root: (i) => Cf(i.root),
		$emit: (i) => i.emit,
		$options: (i) => xm(i),
		$forceUpdate: (i) =>
			i.f ||
			(i.f = () => {
				((i.effect.dirty = !0), Ou(i.update));
			}),
		$nextTick: (i) => i.start || (i.start = Ma.bind(i.proxy)),
		$watch: (i) => hE.bind(i),
	}),
	ud = (i, element) => i !== xt && !i.__isScriptSetup && it(i, element),
	wE = {
		get({_: i}, element) {
			const {
				ctx: trigger,
				setupState: start,
				data: end,
				props: a,
				accessCache: o,
				type: l,
				appContext: c,
			} = i;
			let h;
			if (element[0] !== "$") {
				const p = o[element];
				if (p !== void 0)
					switch (p) {
						case 1:
							return start[element];
						case 2:
							return end[element];
						case 4:
							return trigger[element];
						case 3:
							return a[element];
					}
				else {
					if (ud(start, element)) return ((o[element] = 1), start[element]);
					if (end !== xt && it(end, element))
						return ((o[element] = 2), end[element]);
					if ((h = i.propsOptions[0]) && it(h, element))
						return ((o[element] = 3), a[element]);
					if (trigger !== xt && it(trigger, element))
						return ((o[element] = 4), trigger[element]);
					Pf && (o[element] = 0);
				}
			}
			const u = hl[element];
			let d, f;
			if (u) return (element === "$attrs" && qi(i, "get", element), u(i));
			if ((d = l.__cssModules) && (d = d[element])) return d;
			if (trigger !== xt && it(trigger, element))
				return ((o[element] = 4), trigger[element]);
			if (((f = c.config.globalProperties), it(f, element))) return f[element];
		},
		set({_: i}, element, trigger) {
			const {data: start, setupState: end, ctx: a} = i;
			return ud(end, element)
				? ((end[element] = trigger), !0)
				: start !== xt && it(start, element)
					? ((start[element] = trigger), !0)
					: it(i.props, element) ||
					(element[0] === "$" && element.slice(1) in i)
						? !1
						: ((a[element] = trigger), !0);
		},
		has(
			{
				_: {
					data: i,
					setupState: element,
					accessCache: trigger,
					ctx: start,
					appContext: end,
					propsOptions: a,
				},
			},
			o,
		) {
			let l;
			return (
				!!trigger[o] ||
				(i !== xt && it(i, o)) ||
				ud(element, o) ||
				((l = a[0]) && it(l, o)) ||
				it(start, o) ||
				it(hl, o) ||
				it(end.config.globalProperties, o)
			);
		},
		defineProperty(i, element, trigger) {
			return (
				trigger.get != null
					? (i._.accessCache[element] = 0)
					: it(trigger, "value") && this.set(i, element, trigger.value, null),
					Reflect.defineProperty(i, element, trigger)
			);
		},
	};

function Dg(i) {
	return Ue(i)
		? i.reduce((element, trigger) => ((element[trigger] = null), element), {})
		: i;
}

let Pf = !0;

function EE(i) {
	const element = xm(i),
		trigger = i.proxy,
		start = i.ctx;
	((Pf = !1), element.beforeCreate && Ug(element.beforeCreate, i, "bc"));
	const {
		data: end,
		computed: a,
		methods: o,
		watch: l,
		provide: c,
		inject: h,
		created: u,
		beforeMount: d,
		mounted: f,
		beforeUpdate: p,
		updated: _,
		activated: m,
		deactivated: g,
		beforeDestroy: b,
		beforeUnmount: x,
		destroyed: v,
		unmounted: w,
		render: E,
		renderTracked: T,
		renderTriggered: M,
		errorCaptured: U,
		serverPrefetch: L,
		expose: O,
		inheritAttrs: B,
		components: P,
		directives: q,
		filters: $,
	} = element;
	if ((h && SE(h, start, null), o))
		for (const z in o) {
			const k = o[z];
			He(k) && (start[z] = k.bind(trigger));
		}
	if (end) {
		const z = end.call(trigger, trigger);
		pt(z) && (i.data = Dn(z));
	}
	if (((Pf = !0), a))
		for (const z in a) {
			const k = a[z],
				j = He(k)
					? k.bind(trigger, trigger)
					: He(k.get)
						? k.get.bind(trigger, trigger)
						: cs,
				N = !He(k) && He(k.set) ? k.set.bind(trigger) : cs,
				ee = li({
					get: j,
					set: N,
				});
			Object.defineProperty(start, z, {
				enumerable: !0,
				configurable: !0,
				get: () => ee.value,
				set: (de) => (ee.value = de),
			});
		}
	if (l) for (const z in l) Mx(l[z], start, trigger, z);
	if (c) {
		const z = He(c) ? c.call(trigger) : c;
		Reflect.ownKeys(z).forEach((k) => {
			ra(k, z[k]);
		});
	}
	u && Ug(u, i, "c");
	
	function X(z, k) {
		Ue(k) ? k.forEach((j) => z(j.bind(trigger))) : k && z(k.bind(trigger));
	}
	
	if (
		(X(_E, d),
			X(Fu, f),
			X(vE, p),
			X(wx, _),
			X(xx, m),
			X(yx, g),
			X(Sx, U),
			X(bE, T),
			X(yE, M),
			X(oc, x),
			X(Ex, w),
			X(xE, L),
			Ue(O))
	)
		if (O.length) {
			const z = i.exposed || (i.exposed = {});
			O.forEach((k) => {
				Object.defineProperty(z, k, {
					get: () => trigger[k],
					set: (j) => (trigger[k] = j),
				});
			});
		} else i.exposed || (i.exposed = {});
	(E && i.render === cs && (i.render = E),
	B != null && (i.inheritAttrs = B),
	P && (i.components = P),
	q && (i.directives = q));
}

function SE(i, element, trigger = cs) {
	Ue(i) && (i = Lf(i));
	for (const start in i) {
		const end = i[start];
		let a;
		(pt(end)
			? "default" in end
				? (a = Ri(end.from || start, end.default, !0))
				: (a = Ri(end.from || start))
			: (a = Ri(end)),
			fi(a)
				? Object.defineProperty(element, start, {
					enumerable: !0,
					configurable: !0,
					get: () => a.value,
					set: (o) => (a.value = o),
				})
				: (element[start] = a));
	}
}

function Ug(i, element, trigger) {
	Ms(
		Ue(i) ? i.map((start) => start.bind(element.proxy)) : i.bind(element.proxy),
		element,
		trigger,
	);
}

function Mx(i, element, trigger, start) {
	const end = start.includes(".") ? mx(trigger, start) : () => trigger[start];
	if (Tt(i)) {
		const a = element[i];
		He(a) && co(end, a);
	} else if (He(i)) co(end, i.bind(trigger));
	else if (pt(i))
		if (Ue(i)) i.forEach((a) => Mx(a, element, trigger, start));
		else {
			const a = He(i.handler) ? i.handler.bind(trigger) : element[i.handler];
			He(a) && co(end, a, i);
		}
}

function xm(i) {
	const element = i.type,
		{mixins: trigger, extends: start} = element,
		{
			mixins: end,
			optionsCache: a,
			config: {optionMergeStrategies: o},
		} = i.appContext,
		l = a.get(element);
	let c;
	return (
		l
			? (c = l)
			: !end.length && !trigger && !start
				? (c = element)
				: ((c = {}),
				end.length && end.forEach((h) => Zh(c, h, o, !0)),
					Zh(c, element, o)),
		pt(element) && a.set(element, c),
			c
	);
}

function Zh(i, element, trigger, start = !1) {
	const {mixins: end, extends: a} = element;
	(a && Zh(i, a, trigger, !0),
	end && end.forEach((o) => Zh(i, o, trigger, !0)));
	for (const o in element)
		if (!(start && o === "expose")) {
			const l = TE[o] || (trigger && trigger[o]);
			i[o] = l ? l(i[o], element[o]) : element[o];
		}
	return i;
}

const TE = {
	data: Fg,
	props: kg,
	emits: kg,
	methods: Qo,
	computed: Qo,
	beforeCreate: gi,
	created: gi,
	beforeMount: gi,
	mounted: gi,
	beforeUpdate: gi,
	updated: gi,
	beforeDestroy: gi,
	beforeUnmount: gi,
	destroyed: gi,
	unmounted: gi,
	activated: gi,
	deactivated: gi,
	errorCaptured: gi,
	serverPrefetch: gi,
	components: Qo,
	directives: Qo,
	watch: RE,
	provide: Fg,
	inject: ME,
};

function Fg(i, element) {
	return element
		? i
			? function () {
				return kt(
					He(i) ? i.call(this, this) : i,
					He(element) ? element.call(this, this) : element,
				);
			}
			: element
		: i;
}

function ME(i, element) {
	return Qo(Lf(i), Lf(element));
}

function Lf(i) {
	if (Ue(i)) {
		const element = {};
		for (let trigger = 0; trigger < i.length; trigger++)
			element[i[trigger]] = i[trigger];
		return element;
	}
	return i;
}

function gi(i, element) {
	return i ? [...new Set([].concat(i, element))] : element;
}

function Qo(i, element) {
	return i ? kt(Object.create(null), i, element) : element;
}

function kg(i, element) {
	return i
		? Ue(i) && Ue(element)
			? [...new Set([...i, ...element])]
			: kt(Object.create(null), Dg(i), Dg(element ?? {}))
		: element;
}

function RE(i, element) {
	if (!i) return element;
	if (!element) return i;
	const trigger = kt(Object.create(null), i);
	for (const start in element) trigger[start] = gi(i[start], element[start]);
	return trigger;
}

function Rx() {
	return {
		app: null,
		config: {
			isNativeTag: tw,
			performance: !1,
			globalProperties: {},
			optionMergeStrategies: {},
			errorHandler: void 0,
			warnHandler: void 0,
			compilerOptions: {},
		},
		mixins: [],
		components: {},
		directives: {},
		provides: Object.create(null),
		optionsCache: new WeakMap(),
		propsCache: new WeakMap(),
		emitsCache: new WeakMap(),
	};
}

let AE = 0;

function CE(i, element) {
	return function (start, end = null) {
		(He(start) || (start = kt({}, start)),
		end != null && !pt(end) && (end = null));
		const a = Rx(),
			o = new WeakSet();
		let l = !1;
		const c = (a.app = {
			_uid: AE++,
			_component: start,
			_props: end,
			_container: null,
			_context: a,
			_instance: null,
			version: qx,
			get config() {
				return a.config;
			},
			set config(h) {
			},
			use(h, ...u) {
				return (
					o.has(h) ||
					(h && He(h.install)
						? (o.add(h), h.install(c, ...u))
						: He(h) && (o.add(h), h(c, ...u))),
						c
				);
			},
			mixin(h) {
				return (a.mixins.includes(h) || a.mixins.push(h), c);
			},
			component(h, u) {
				return u ? ((a.components[h] = u), c) : a.components[h];
			},
			directive(h, u) {
				return u ? ((a.directives[h] = u), c) : a.directives[h];
			},
			mount(h, u, d) {
				if (!l) {
					const f = nt(start, end);
					return (
						(f.appContext = a),
							d === !0 ? (d = "svg") : d === !1 && (d = void 0),
							u && element ? element(f, h) : i(f, h, d),
							(l = !0),
							(c._container = h),
							(h.__vue_app__ = c),
						Em(f.component) || f.component.proxy
					);
				}
			},
			unmount() {
				l && (i(null, c._container), delete c._container.__vue_app__);
			},
			provide(h, u) {
				return ((a.provides[h] = u), c);
			},
			runWithContext(h) {
				Dl = c;
				try {
					return h();
				} finally {
					Dl = null;
				}
			},
		});
		return c;
	};
}

let Dl = null;

function ra(i, element) {
	if (Ft) {
		let trigger = Ft.provides;
		const start = Ft.parent && Ft.parent.provides;
		(start === trigger && (trigger = Ft.provides = Object.create(start)),
			(trigger[i] = element));
	}
}

function Ri(i, element, trigger = !1) {
	const start = Ft || Yt;
	if (start || Dl) {
		const end = start
			? start.parent == null
				? start.vnode.appContext && start.vnode.appContext.provides
				: start.parent.provides
			: Dl._context.provides;
		if (end && i in end) return end[i];
		if (arguments.length > 1)
			return trigger && He(element)
				? element.call(start && start.proxy)
				: element;
	}
}

function Ax() {
	return !!(Ft || Yt || Dl);
}

function PE(i, element, trigger, start = !1) {
	const end = {},
		a = {};
	(Vh(a, ku, 1),
		(i.propsDefaults = Object.create(null)),
		Cx(i, element, end, a));
	for (const o in i.propsOptions[0]) o in end || (end[o] = void 0);
	(trigger
		? (i.props = start ? end : rc(end))
		: i.type.props
			? (i.props = end)
			: (i.props = a),
		(i.attrs = a));
}

function LE(i, element, trigger, start) {
	const {
			props: end,
			attrs: a,
			vnode: {patchFlag: o},
		} = i,
		l = st(end),
		[c] = i.propsOptions;
	let h = !1;
	if ((start || o > 0) && !(o & 16)) {
		if (o & 8) {
			const u = i.vnode.dynamicProps;
			for (let d = 0; d < u.length; d++) {
				let f = u[d];
				if (Nu(i.emitsOptions, f)) continue;
				const p = element[f];
				if (c)
					if (it(a, f)) p !== a[f] && ((a[f] = p), (h = !0));
					else {
						const _ = hn(f);
						end[_] = If(c, l, _, p, i, !1);
					}
				else p !== a[f] && ((a[f] = p), (h = !0));
			}
		}
	} else {
		Cx(i, element, end, a) && (h = !0);
		let u;
		for (const d in l)
			(!element ||
				(!it(element, d) && ((u = Io(d)) === d || !it(element, u)))) &&
			(c
				? trigger &&
				(trigger[d] !== void 0 || trigger[u] !== void 0) &&
				(end[d] = If(c, l, d, void 0, i, !0))
				: delete end[d]);
		if (a !== l)
			for (const d in a)
				(!element || !it(element, d)) && (delete a[d], (h = !0));
	}
	h && Ln(i, "set", "$attrs");
}

function Cx(i, element, trigger, start) {
	const [end, a] = i.propsOptions;
	let o = !1,
		l;
	if (element)
		for (let c in element) {
			if (ll(c)) continue;
			const h = element[c];
			let u;
			end && it(end, (u = hn(c)))
				? !a || !a.includes(u)
					? (trigger[u] = h)
					: ((l || (l = {}))[u] = h)
				: Nu(i.emitsOptions, c) ||
				((!(c in start) || h !== start[c]) && ((start[c] = h), (o = !0)));
		}
	if (a) {
		const c = st(trigger),
			h = l || xt;
		for (let u = 0; u < a.length; u++) {
			const d = a[u];
			trigger[d] = If(end, c, d, h[d], i, !it(h, d));
		}
	}
	return o;
}

function If(i, element, trigger, start, end, a) {
	const o = i[trigger];
	if (o != null) {
		const l = it(o, "default");
		if (l && start === void 0) {
			const c = o.default;
			if (o.type !== Function && !o.skipFactory && He(c)) {
				const {propsDefaults: h} = end;
				if (trigger in h) start = h[trigger];
				else {
					const u = lc(end);
					((start = h[trigger] = c.call(null, element)), u());
				}
			} else start = c;
		}
		o[0] &&
		(a && !l
			? (start = !1)
			: o[1] && (start === "" || start === Io(trigger)) && (start = !0));
	}
	return start;
}

function Px(i, element, trigger = !1) {
	const start = element.propsCache,
		end = start.get(i);
	if (end) return end;
	const a = i.props,
		o = {},
		l = [];
	let c = !1;
	if (!He(i)) {
		const u = (d) => {
			c = !0;
			const [f, p] = Px(d, element, !0);
			(kt(o, f), p && l.push(...p));
		};
		(!trigger && element.mixins.length && element.mixins.forEach(u),
		i.extends && u(i.extends),
		i.mixins && i.mixins.forEach(u));
	}
	if (!a && !c) return (pt(i) && start.set(i, no), no);
	if (Ue(a))
		for (let u = 0; u < a.length; u++) {
			const d = hn(a[u]);
			Bg(d) && (o[d] = xt);
		}
	else if (a)
		for (const u in a) {
			const d = hn(u);
			if (Bg(d)) {
				const f = a[u],
					p = (o[d] =
						Ue(f) || He(f)
							? {
								type: f,
							}
							: kt({}, f));
				if (p) {
					const _ = zg(Boolean, p.type),
						m = zg(String, p.type);
					((p[0] = _ > -1),
						(p[1] = m < 0 || _ < m),
					(_ > -1 || it(p, "default")) && l.push(d));
				}
			}
		}
	const h = [o, l];
	return (pt(i) && start.set(i, h), h);
}

function Bg(i) {
	return i[0] !== "$";
}

function Gg(i) {
	const element = i && i.toString().match(/^\s*(function|class) (\w+)/);
	return element ? element[2] : i === null ? "null" : "";
}

function Hg(i, element) {
	return Gg(i) === Gg(element);
}

function zg(i, element) {
	return Ue(element)
		? element.findIndex((trigger) => Hg(trigger, i))
		: He(element) && Hg(element, i)
			? 0
			: -1;
}

const Lx = (i) => i[0] === "_" || i === "$stable",
	ym = (i) => (Ue(i) ? i.map(xs) : [xs(i)]),
	IE = (i, element, trigger) => {
		if (element._n) return element;
		const start = Jr((...end) => ym(element(...end)), trigger);
		return ((start._c = !1), start);
	},
	Ix = (i, element, trigger) => {
		const start = i._ctx;
		for (const end in i) {
			if (Lx(end)) continue;
			const a = i[end];
			if (He(a)) element[end] = IE(end, a, start);
			else if (a != null) {
				const o = ym(a);
				element[end] = () => o;
			}
		}
	},
	Ox = (i, element) => {
		const trigger = ym(element);
		i.slots.default = () => trigger;
	},
	OE = (i, element) => {
		if (i.vnode.shapeFlag & 32) {
			const trigger = element._;
			trigger
				? ((i.slots = st(element)), Vh(element, "_", trigger))
				: Ix(element, (i.slots = {}));
		} else ((i.slots = {}), element && Ox(i, element));
		Vh(i.slots, ku, 1);
	},
	NE = (i, element, trigger) => {
		const {vnode: start, slots: end} = i;
		let a = !0,
			o = xt;
		if (start.shapeFlag & 32) {
			const l = element._;
			(l
				? trigger && l === 1
					? (a = !1)
					: (kt(end, element), !trigger && l === 1 && delete end._)
				: ((a = !element.$stable), Ix(element, end)),
				(o = element));
		} else
			element &&
			(Ox(i, element),
				(o = {
					default: 1,
				}));
		if (a) for (const l in end) !Lx(l) && o[l] == null && delete end[l];
	};

function Jh(i, element, trigger, start, end = !1) {
	if (Ue(i)) {
		i.forEach((f, p) =>
			Jh(
				f,
				element && (Ue(element) ? element[p] : element),
				trigger,
				start,
				end,
			),
		);
		return;
	}
	if (na(start) && !end) return;
	const a =
			start.shapeFlag & 4
				? Em(start.component) || start.component.proxy
				: start.el,
		o = end ? null : a,
		{i: l, end: c} = i,
		h = element && element.end,
		u = l.refs === xt ? (l.refs = {}) : l.refs,
		d = l.setupState;
	if (
		(h != null &&
		h !== c &&
		(Tt(h)
			? ((u[h] = null), it(d, h) && (d[h] = null))
			: fi(h) && (h.value = null)),
			He(c))
	)
		mr(c, l, 12, [o, u]);
	else {
		const f = Tt(c),
			p = fi(c),
			_ = i.f;
		if (f || p) {
			const m = () => {
				if (_) {
					const g = f ? (it(d, c) ? d[c] : u[c]) : c.value;
					end
						? Ue(g) && nm(g, a)
						: Ue(g)
							? g.includes(a) || g.push(a)
							: f
								? ((u[c] = [a]), it(d, c) && (d[c] = u[c]))
								: ((c.value = [a]), i.k && (u[i.k] = c.value));
				} else
					f
						? ((u[c] = o), it(d, c) && (d[c] = o))
						: p && ((c.value = o), i.k && (u[i.k] = o));
			};
			end || _ ? m() : ((m.id = -1), $trigger(m, trigger));
		}
	}
}

let qn = !1;
const DE = (i) =>
		i.namespaceURI.includes("svg") && i.tagName !== "foreignObject",
	UE = (i) => i.namespaceURI.includes("MathML"),
	Cc = (i) => {
		if (DE(i)) return "svg";
		if (UE(i)) return "mathml";
	},
	Pc = (i) => i.nodeType === 8;

function FE(i) {
	const {
			mt: element,
			p: trigger,
			o: {
				patchProp: start,
				createText: end,
				nextSibling: a,
				parentNode: o,
				remove: l,
				insert: c,
				createComment: h,
			},
		} = i,
		u = (v, w) => {
			if (!w.hasChildNodes()) {
				(trigger(null, v, w), $h(), (w._vnode = v));
				return;
			}
			((qn = !1), d(w.firstChild, v, null, null, null), $h(), (w._vnode = v));
		},
		d = (v, w, E, T, M, U = !1) => {
			const L = Pc(v) && v.data === "[",
				O = () => m(v, w, E, T, M, L),
				{type: B, ref: P, shapeFlag: q, patchFlag: $} = w;
			let oe = v.nodeType;
			((w.el = v), $ === -2 && ((U = !1), (w.dynamicChildren = null)));
			let X = null;
			switch (B) {
				case vo:
					oe !== 3
						? w.children === ""
							? (c((w.el = end("")), o(v), v), (X = v))
							: (X = O())
						: (v.data !== w.children && ((qn = !0), (v.data = w.children)),
							(X = a(v)));
					break;
				case Ai:
					x(v)
						? ((X = a(v)), b((w.el = v.content.firstChild), v, E))
						: oe !== 8 || L
							? (X = O())
							: (X = a(v));
					break;
				case ul:
					if ((L && ((v = a(v)), (oe = v.nodeType)), oe === 1 || oe === 3)) {
						X = v;
						const z = !w.children.length;
						for (let k = 0; k < w.staticCount; k++)
							(z && (w.children += X.nodeType === 1 ? X.outerHTML : X.data),
							k === w.staticCount - 1 && (w.anchor = X),
								(X = a(X)));
						return L ? a(X) : X;
					} else O();
					break;
				case wi:
					L ? (X = _(v, w, E, T, M, U)) : (X = O());
					break;
				default:
					if (q & 1)
						(oe !== 1 || w.type.toLowerCase() !== v.tagName.toLowerCase()) &&
						!x(v)
							? (X = O())
							: (X = f(v, w, E, T, M, U));
					else if (q & 6) {
						w.slotScopeIds = M;
						const z = o(v);
						if (
							(L
								? (X = g(v))
								: Pc(v) && v.data === "teleport start"
									? (X = g(v, v.data, "teleport end"))
									: (X = a(v)),
								element(w, z, null, E, T, Cc(z), U),
								na(w))
						) {
							let k;
							(L
								? ((k = nt(wi)),
									(k.anchor = X ? X.previousSibling : z.lastChild))
								: (k = v.nodeType === 3 ? zx("") : nt("div")),
								(k.el = v),
								(w.component.subTree = k));
						}
					} else
						q & 64
							? oe !== 8
								? (X = O())
								: (X = w.type.hydrate(v, w, E, T, M, U, i, p))
							: q & 128 &&
							(X = w.type.hydrate(v, w, E, T, Cc(o(v)), M, U, i, d));
			}
			return (P != null && Jh(P, null, T, w), X);
		},
		f = (v, w, E, T, M, U) => {
			U = U || !!w.dynamicChildren;
			const {
					type: L,
					props: O,
					patchFlag: B,
					shapeFlag: P,
					dirs: q,
					transition: $,
				} = w,
				oe = L === "input" || L === "option";
			if (oe || B !== -1) {
				q && Ys(w, null, E, "created");
				let X = !1;
				if (x(v)) {
					X = Dx(T, $) && E && E.vnode.props && E.vnode.props.appear;
					const k = v.content.firstChild;
					(X && $.beforeEnter(k), b(k, v, E), (w.el = v = k));
				}
				if (P & 16 && !(O && (O.innerHTML || O.textContent))) {
					let k = p(v.firstChild, w, v, E, T, M, U);
					for (; k;) {
						qn = !0;
						const j = k;
						((k = k.nextSibling), l(j));
					}
				} else
					P & 8 &&
					v.textContent !== w.children &&
					((qn = !0), (v.textContent = w.children));
				if (O)
					if (oe || !U || B & 48)
						for (const k in O)
							((oe && (k.endsWith("value") || k === "indeterminate")) ||
								(ic(k) && !ll(k)) ||
								k[0] === ".") &&
							start(v, k, null, O[k], void 0, void 0, E);
					else
						O.onClick &&
						start(v, "onClick", null, O.onClick, void 0, void 0, E);
				let z;
				((z = O && O.onVnodeBeforeMount) && ki(z, E, w),
				q && Ys(w, null, E, "beforeMount"),
				((z = O && O.onVnodeMounted) || q || X) &&
				px(() => {
					(z && ki(z, E, w),
					X && $.enter(v),
					q && Ys(w, null, E, "mounted"));
				}, T));
			}
			return v.nextSibling;
		},
		p = (v, w, E, T, M, U, L) => {
			L = L || !!w.dynamicChildren;
			const O = w.children,
				B = O.length;
			for (let P = 0; P < B; P++) {
				const q = L ? O[P] : (O[P] = xs(O[P]));
				if (v) v = d(v, q, T, M, U, L);
				else {
					if (q.type === vo && !q.children) continue;
					((qn = !0), trigger(null, q, E, null, T, M, Cc(E), U));
				}
			}
			return v;
		},
		_ = (v, w, E, T, M, U) => {
			const {slotScopeIds: L} = w;
			L && (M = M ? M.concat(L) : L);
			const O = o(v),
				B = p(a(v), w, O, E, T, M, U);
			return B && Pc(B) && B.data === "]"
				? a((w.anchor = B))
				: ((qn = !0), c((w.anchor = h("]")), O, B), B);
		},
		m = (v, w, E, T, M, U) => {
			if (((qn = !0), (w.el = null), U)) {
				const B = g(v);
				for (; ;) {
					const P = a(v);
					if (P && P !== B) l(P);
					else break;
				}
			}
			const L = a(v),
				O = o(v);
			return (l(v), trigger(null, w, O, L, E, T, Cc(O), M), L);
		},
		g = (v, w = "[", E = "]") => {
			let T = 0;
			for (; v;)
				if (((v = a(v)), v && Pc(v) && (v.data === w && T++, v.data === E))) {
					if (T === 0) return a(v);
					T--;
				}
			return v;
		},
		b = (v, w, E) => {
			const T = w.parentNode;
			T && T.replaceChild(v, w);
			let M = E;
			for (; M;)
				(M.vnode.el === w && (M.vnode.el = M.subTree.el = v), (M = M.parent));
		},
		x = (v) => v.nodeType === 1 && v.tagName.toLowerCase() === "template";
	return [u, d];
}

const $trigger = px;

function kE(i) {
	return Nx(i);
}

function BE(i) {
	return Nx(i, FE);
}

function Nx(i, element) {
	const trigger = kv();
	trigger.__VUE__ = !0;
	const {
			insert: start,
			remove: end,
			patchProp: a,
			createElement: o,
			createText: l,
			createComment: c,
			setText: h,
			setElementText: u,
			parentNode: d,
			nextSibling: f,
			setScopeId: p = cs,
			insertStaticContent: _,
		} = i,
		m = (
			S,
			y,
			D,
			F = null,
			C = null,
			H = null,
			ae = void 0,
			Z = null,
			V = !!y.dynamicChildren,
		) => {
			if (S === y) return;
			(S && !ks(S, y) && ((F = R(S)), de(S, C, H, !0), (S = null)),
			y.patchFlag === -2 && ((V = !1), (y.dynamicChildren = null)));
			const {type: J, ref: ie, shapeFlag: he} = y;
			switch (J) {
				case vo:
					g(S, y, D, F);
					break;
				case Ai:
					b(S, y, D, F);
					break;
				case ul:
					S == null && x(y, D, F, ae);
					break;
				case wi:
					P(S, y, D, F, C, H, ae, Z, V);
					break;
				default:
					he & 1
						? E(S, y, D, F, C, H, ae, Z, V)
						: he & 6
							? q(S, y, D, F, C, H, ae, Z, V)
							: (he & 64 || he & 128) &&
							J.process(S, y, D, F, C, H, ae, Z, V, Y);
			}
			ie != null && C && Jh(ie, S && S.ref, H, y || S, !y);
		},
		g = (S, y, D, F) => {
			if (S == null) start((y.el = l(y.children)), D, F);
			else {
				const C = (y.el = S.el);
				y.children !== S.children && h(C, y.children);
			}
		},
		b = (S, y, D, F) => {
			S == null ? start((y.el = c(y.children || "")), D, F) : (y.el = S.el);
		},
		x = (S, y, D, F) => {
			[S.el, S.anchor] = _(S.children, y, D, F, S.el, S.anchor);
		},
		v = ({el: S, anchor: y}, D, F) => {
			let C;
			for (; S && S !== y;) ((C = f(S)), start(S, D, F), (S = C));
			start(y, D, F);
		},
		w = ({el: S, anchor: y}) => {
			let D;
			for (; S && S !== y;) ((D = f(S)), end(S), (S = D));
			end(y);
		},
		E = (S, y, D, F, C, H, ae, Z, V) => {
			(y.type === "svg" ? (ae = "svg") : y.type === "math" && (ae = "mathml"),
				S == null ? T(y, D, F, C, H, ae, Z, V) : L(S, y, C, H, ae, Z, V));
		},
		T = (S, y, D, F, C, H, ae, Z) => {
			let V, J;
			const {props: ie, shapeFlag: he, transition: ce, dirs: ge} = S;
			if (
				((V = S.el = o(S.type, H, ie && ie.is, ie)),
					he & 8
						? u(V, S.children)
						: he & 16 && U(S.children, V, null, F, C, dd(S, H), ae, Z),
				ge && Ys(S, null, F, "created"),
					M(V, S, S.scopeId, ae, F),
					ie)
			) {
				for (const fe in ie)
					fe !== "value" &&
					!ll(fe) &&
					a(V, fe, null, ie[fe], H, S.children, F, C, _e);
				("value" in ie && a(V, "value", null, ie.value, H),
				(J = ie.onVnodeBeforeMount) && ki(J, F, S));
			}
			ge && Ys(S, null, F, "beforeMount");
			const pe = Dx(C, ce);
			(pe && ce.beforeEnter(V),
				start(V, y, D),
			((J = ie && ie.onVnodeMounted) || pe || ge) &&
			$trigger(() => {
				(J && ki(J, F, S),
				pe && ce.enter(V),
				ge && Ys(S, null, F, "mounted"));
			}, C));
		},
		M = (S, y, D, F, C) => {
			if ((D && p(S, D), F)) for (let H = 0; H < F.length; H++) p(S, F[H]);
			if (C) {
				let H = C.subTree;
				if (y === H) {
					const ae = C.vnode;
					M(S, ae, ae.scopeId, ae.slotScopeIds, C.parent);
				}
			}
		},
		U = (S, y, D, F, C, H, ae, Z, V = 0) => {
			for (let J = V; J < S.length; J++) {
				const ie = (S[J] = Z ? nr(S[J]) : xs(S[J]));
				m(null, ie, y, D, F, C, H, ae, Z);
			}
		},
		L = (S, y, D, F, C, H, ae) => {
			const Z = (y.el = S.el);
			let {patchFlag: V, dynamicChildren: J, dirs: ie} = y;
			V |= S.patchFlag & 16;
			const he = S.props || xt,
				ce = y.props || xt;
			let ge;
			if (
				(D && Dr(D, !1),
				(ge = ce.onVnodeBeforeUpdate) && ki(ge, D, y, S),
				ie && Ys(y, S, D, "beforeUpdate"),
				D && Dr(D, !0),
					J
						? O(S.dynamicChildren, J, Z, D, F, dd(y, C), H)
						: ae || k(S, y, Z, null, D, F, dd(y, C), H, !1),
				V > 0)
			) {
				if (V & 16) B(Z, y, he, ce, D, F, C);
				else if (
					(V & 2 && he.class !== ce.class && a(Z, "class", null, ce.class, C),
					V & 4 && a(Z, "style", he.style, ce.style, C),
					V & 8)
				) {
					const pe = y.dynamicProps;
					for (let fe = 0; fe < pe.length; fe++) {
						const ye = pe[fe],
							ze = he[ye],
							Me = ce[ye];
						(Me !== ze || ye === "value") &&
						a(Z, ye, ze, Me, C, S.children, D, F, _e);
					}
				}
				V & 1 && S.children !== y.children && u(Z, y.children);
			} else !ae && J == null && B(Z, y, he, ce, D, F, C);
			((ge = ce.onVnodeUpdated) || ie) &&
			$trigger(() => {
				(ge && ki(ge, D, y, S), ie && Ys(y, S, D, "updated"));
			}, F);
		},
		O = (S, y, D, F, C, H, ae) => {
			for (let Z = 0; Z < y.length; Z++) {
				const V = S[Z],
					J = y[Z],
					ie =
						V.el && (V.type === wi || !ks(V, J) || V.shapeFlag & 70)
							? d(V.el)
							: D;
				m(V, J, ie, null, F, C, H, ae, !0);
			}
		},
		B = (S, y, D, F, C, H, ae) => {
			if (D !== F) {
				if (D !== xt)
					for (const Z in D)
						!ll(Z) &&
						!(Z in F) &&
						a(S, Z, D[Z], null, ae, y.children, C, H, _e);
				for (const Z in F) {
					if (ll(Z)) continue;
					const V = F[Z],
						J = D[Z];
					V !== J && Z !== "value" && a(S, Z, J, V, ae, y.children, C, H, _e);
				}
				"value" in F && a(S, "value", D.value, F.value, ae);
			}
		},
		P = (S, y, D, F, C, H, ae, Z, V) => {
			const J = (y.el = S ? S.el : l("")),
				ie = (y.anchor = S ? S.anchor : l(""));
			let {patchFlag: he, dynamicChildren: ce, slotScopeIds: ge} = y;
			(ge && (Z = Z ? Z.concat(ge) : ge),
				S == null
					? (start(J, D, F),
						start(ie, D, F),
						U(y.children || [], D, ie, C, H, ae, Z, V))
					: he > 0 && he & 64 && ce && S.dynamicChildren
						? (O(S.dynamicChildren, ce, D, C, H, ae, Z),
						(y.key != null || (C && y === C.subTree)) && Ux(S, y, !0))
						: k(S, y, D, ie, C, H, ae, Z, V));
		},
		q = (S, y, D, F, C, H, ae, Z, V) => {
			((y.slotScopeIds = Z),
				S == null
					? y.shapeFlag & 512
						? C.ctx.activate(y, D, F, ae, V)
						: $(y, D, F, C, H, ae, V)
					: oe(S, y, V));
		},
		$ = (S, y, D, F, C, H, ae) => {
			const Z = (S.component = VE(S, F, C));
			if ((ac(S) && (Z.ctx.renderer = Y), qE(Z), Z.asyncDep)) {
				if ((C && C.registerDep(Z, X), !S.el)) {
					const V = (Z.subTree = nt(Ai));
					b(null, V, y, D);
				}
			} else X(Z, S, y, D, C, H, ae);
		},
		oe = (S, y, D) => {
			const F = (y.component = S.component);
			if (Jw(S, y, D))
				if (F.asyncDep && !F.asyncResolved) {
					z(F, y, D);
					return;
				} else ((F.next = y), qw(F.update), (F.effect.dirty = !0), F.update());
			else ((y.el = S.el), (F.vnode = y));
		},
		X = (S, y, D, F, C, H, ae) => {
			const Z = () => {
					if (S.isMounted) {
						let {next: ie, bu: he, u: ce, parent: ge, vnode: pe} = S;
						{
							const Le = Fx(S);
							if (Le) {
								(ie && ((ie.el = pe.el), z(S, ie, ae)),
									Le.asyncDep.then(() => {
										S.isUnmounted || Z();
									}));
								return;
							}
						}
						let fe = ie,
							ye;
						(Dr(S, !1),
							ie ? ((ie.el = pe.el), z(S, ie, ae)) : (ie = pe),
						he && cl(he),
						(ye = ie.props && ie.props.onVnodeBeforeUpdate) &&
						ki(ye, ge, ie, pe),
							Dr(S, !0));
						const ze = ad(S),
							Me = S.subTree;
						((S.subTree = ze),
							m(Me, ze, d(Me.el), R(Me), S, C, H),
							(ie.el = ze.el),
						fe === null && pm(S, ze.el),
						ce && $trigger(ce, C),
						(ye = ie.props && ie.props.onVnodeUpdated) &&
						$trigger(() => ki(ye, ge, ie, pe), C));
					} else {
						let ie;
						const {el: he, props: ce} = y,
							{bm: ge, m: pe, parent: fe} = S,
							ye = na(y);
						if (
							(Dr(S, !1),
							ge && cl(ge),
							!ye && (ie = ce && ce.onVnodeBeforeMount) && ki(ie, fe, y),
								Dr(S, !0),
							he && te)
						) {
							const ze = () => {
								((S.subTree = ad(S)), te(he, S.subTree, S, C, null));
							};
							ye
								? y.type.__asyncLoader().then(() => !S.isUnmounted && ze())
								: ze();
						} else {
							const ze = (S.subTree = ad(S));
							(m(null, ze, D, F, S, C, H), (y.el = ze.el));
						}
						if (
							(pe && $trigger(pe, C), !ye && (ie = ce && ce.onVnodeMounted))
						) {
							const ze = y;
							$trigger(() => ki(ie, fe, ze), C);
						}
						((y.shapeFlag & 256 ||
							(fe && na(fe.vnode) && fe.vnode.shapeFlag & 256)) &&
						S.a &&
						$trigger(S.a, C),
							(S.isMounted = !0),
							(y = D = F = null));
					}
				},
				V = (S.effect = new am(Z, cs, () => Ou(J), S.scope)),
				J = (S.update = () => {
					V.dirty && V.run();
				});
			((J.id = S.uid), Dr(S, !0), J());
		},
		z = (S, y, D) => {
			y.component = S;
			const F = S.vnode.props;
			((S.vnode = y),
				(S.next = null),
				LE(S, y.props, F, D),
				NE(S, y.children, D),
				Sa(),
				Cg(S),
				Ta());
		},
		k = (S, y, D, F, C, H, ae, Z, V = !1) => {
			const J = S && S.children,
				ie = S ? S.shapeFlag : 0,
				he = y.children,
				{patchFlag: ce, shapeFlag: ge} = y;
			if (ce > 0) {
				if (ce & 128) {
					N(J, he, D, F, C, H, ae, Z, V);
					return;
				} else if (ce & 256) {
					j(J, he, D, F, C, H, ae, Z, V);
					return;
				}
			}
			ge & 8
				? (ie & 16 && _e(J, C, H), he !== J && u(D, he))
				: ie & 16
					? ge & 16
						? N(J, he, D, F, C, H, ae, Z, V)
						: _e(J, C, H, !0)
					: (ie & 8 && u(D, ""), ge & 16 && U(he, D, F, C, H, ae, Z, V));
		},
		j = (S, y, D, F, C, H, ae, Z, V) => {
			((S = S || no), (y = y || no));
			const J = S.length,
				ie = y.length,
				he = Math.min(J, ie);
			let ce;
			for (ce = 0; ce < he; ce++) {
				const ge = (y[ce] = V ? nr(y[ce]) : xs(y[ce]));
				m(S[ce], ge, D, null, C, H, ae, Z, V);
			}
			J > ie ? _e(S, C, H, !0, !1, he) : U(y, D, F, C, H, ae, Z, V, he);
		},
		N = (S, y, D, F, C, H, ae, Z, V) => {
			let J = 0;
			const ie = y.length;
			let he = S.length - 1,
				ce = ie - 1;
			for (; J <= he && J <= ce;) {
				const ge = S[J],
					pe = (y[J] = V ? nr(y[J]) : xs(y[J]));
				if (ks(ge, pe)) m(ge, pe, D, null, C, H, ae, Z, V);
				else break;
				J++;
			}
			for (; J <= he && J <= ce;) {
				const ge = S[he],
					pe = (y[ce] = V ? nr(y[ce]) : xs(y[ce]));
				if (ks(ge, pe)) m(ge, pe, D, null, C, H, ae, Z, V);
				else break;
				(he--, ce--);
			}
			if (J > he) {
				if (J <= ce) {
					const ge = ce + 1,
						pe = ge < ie ? y[ge].el : F;
					for (; J <= ce;)
						(m(null, (y[J] = V ? nr(y[J]) : xs(y[J])), D, pe, C, H, ae, Z, V),
							J++);
				}
			} else if (J > ce) for (; J <= he;) (de(S[J], C, H, !0), J++);
			else {
				const ge = J,
					pe = J,
					fe = new Map();
				for (J = pe; J <= ce; J++) {
					const Q = (y[J] = V ? nr(y[J]) : xs(y[J]));
					Q.key != null && fe.set(Q.key, J);
				}
				let ye,
					ze = 0;
				const Me = ce - pe + 1;
				let Le = !1,
					ke = 0;
				const _t = new Array(Me);
				for (J = 0; J < Me; J++) _t[J] = 0;
				for (J = ge; J <= he; J++) {
					const Q = S[J];
					if (ze >= Me) {
						de(Q, C, H, !0);
						continue;
					}
					let mt;
					if (Q.key != null) mt = fe.get(Q.key);
					else
						for (ye = pe; ye <= ce; ye++)
							if (_t[ye - pe] === 0 && ks(Q, y[ye])) {
								mt = ye;
								break;
							}
					mt === void 0
						? de(Q, C, H, !0)
						: ((_t[mt - pe] = J + 1),
							mt >= ke ? (ke = mt) : (Le = !0),
							m(Q, y[mt], D, null, C, H, ae, Z, V),
							ze++);
				}
				const Qt = Le ? GE(_t) : no;
				for (ye = Qt.length - 1, J = Me - 1; J >= 0; J--) {
					const Q = pe + J,
						mt = y[Q],
						ei = Q + 1 < ie ? y[Q + 1].el : F;
					_t[J] === 0
						? m(null, mt, D, ei, C, H, ae, Z, V)
						: Le && (ye < 0 || J !== Qt[ye] ? ee(mt, D, ei, 2) : ye--);
				}
			}
		},
		ee = (S, y, D, F, C = null) => {
			const {el: H, type: ae, transition: Z, children: V, shapeFlag: J} = S;
			if (J & 6) {
				ee(S.component.subTree, y, D, F);
				return;
			}
			if (J & 128) {
				S.suspense.move(y, D, F);
				return;
			}
			if (J & 64) {
				ae.move(S, y, D, Y);
				return;
			}
			if (ae === wi) {
				start(H, y, D);
				for (let he = 0; he < V.length; he++) ee(V[he], y, D, F);
				start(S.anchor, y, D);
				return;
			}
			if (ae === ul) {
				v(S, y, D);
				return;
			}
			if (F !== 2 && J & 1 && Z)
				if (F === 0)
					(Z.beforeEnter(H), start(H, y, D), $trigger(() => Z.enter(H), C));
				else {
					const {leave: he, delayLeave: ce, afterLeave: ge} = Z,
						pe = () => start(H, y, D),
						fe = () => {
							he(H, () => {
								(pe(), ge && ge());
							});
						};
					ce ? ce(H, pe, fe) : fe();
				}
			else start(H, y, D);
		},
		de = (S, y, D, F = !1, C = !1) => {
			const {
				type: H,
				props: ae,
				ref: Z,
				children: V,
				dynamicChildren: J,
				shapeFlag: ie,
				patchFlag: he,
				dirs: ce,
			} = S;
			if ((Z != null && Jh(Z, null, D, S, !0), ie & 256)) {
				y.ctx.deactivate(S);
				return;
			}
			const ge = ie & 1 && ce,
				pe = !na(S);
			let fe;
			if ((pe && (fe = ae && ae.onVnodeBeforeUnmount) && ki(fe, y, S), ie & 6))
				me(S.component, D, F);
			else {
				if (ie & 128) {
					S.suspense.unmount(D, F);
					return;
				}
				(ge && Ys(S, null, y, "beforeUnmount"),
					ie & 64
						? S.type.remove(S, y, D, C, Y, F)
						: J && (H !== wi || (he > 0 && he & 64))
							? _e(J, y, D, !1, !0)
							: ((H === wi && he & 384) || (!C && ie & 16)) && _e(V, y, D),
				F && Te(S));
			}
			((pe && (fe = ae && ae.onVnodeUnmounted)) || ge) &&
			$trigger(() => {
				(fe && ki(fe, y, S), ge && Ys(S, null, y, "unmounted"));
			}, D);
		},
		Te = (S) => {
			const {type: y, el: D, anchor: F, transition: C} = S;
			if (y === wi) {
				Ee(D, F);
				return;
			}
			if (y === ul) {
				w(S);
				return;
			}
			const H = () => {
				(end(D), C && !C.persisted && C.afterLeave && C.afterLeave());
			};
			if (S.shapeFlag & 1 && C && !C.persisted) {
				const {leave: ae, delayLeave: Z} = C,
					V = () => ae(D, H);
				Z ? Z(S.el, H, V) : V();
			} else H();
		},
		Ee = (S, y) => {
			let D;
			for (; S !== y;) ((D = f(S)), end(S), (S = D));
			end(y);
		},
		me = (S, y, D) => {
			const {bum: F, scope: C, update: H, subTree: ae, um: Z} = S;
			(F && cl(F),
				C.stop(),
			H && ((H.active = !1), de(ae, S, y, D)),
			Z && $trigger(Z, y),
				$trigger(() => {
					S.isUnmounted = !0;
				}, y),
			y &&
			y.pendingBranch &&
			!y.isUnmounted &&
			S.asyncDep &&
			!S.asyncResolved &&
			S.suspenseId === y.pendingId &&
			(y.deps--, y.deps === 0 && y.resolve()));
		},
		_e = (S, y, D, F = !1, C = !1, H = 0) => {
			for (let ae = H; ae < S.length; ae++) de(S[ae], y, D, F, C);
		},
		R = (S) =>
			S.shapeFlag & 6
				? R(S.component.subTree)
				: S.shapeFlag & 128
					? S.suspense.next()
					: f(S.anchor || S.el);
	let A = !1;
	const G = (S, y, D) => {
			(S == null
				? y._vnode && de(y._vnode, null, null, !0)
				: m(y._vnode || null, S, y, null, null, null, D),
			A || ((A = !0), Cg(), $h(), (A = !1)),
				(y._vnode = S));
		},
		Y = {
			p: m,
			um: de,
			m: ee,
			end: Te,
			mt: $,
			mc: U,
			pc: k,
			pbc: O,
			start: R,
			o: i,
		};
	let W, te;
	return (
		element && ([W, te] = element(Y)),
			{
				render: G,
				hydrate: W,
				createApp: CE(G, W),
			}
	);
}

function dd({type: i, props: element}, trigger) {
	return (trigger === "svg" && i === "foreignObject") ||
	(trigger === "mathml" &&
		i === "annotation-xml" &&
		element &&
		element.encoding &&
		element.encoding.includes("html"))
		? void 0
		: trigger;
}

function Dr({effect: i, update: element}, trigger) {
	i.allowRecurse = element.allowRecurse = trigger;
}

function Dx(i, element) {
	return (!i || (i && !i.pendingBranch)) && element && !element.persisted;
}

function Ux(i, element, trigger = !1) {
	const start = i.children,
		end = element.children;
	if (Ue(start) && Ue(end))
		for (let a = 0; a < start.length; a++) {
			const o = start[a];
			let l = end[a];
			(l.shapeFlag & 1 &&
			!l.dynamicChildren &&
			((l.patchFlag <= 0 || l.patchFlag === 32) &&
			((l = end[a] = nr(end[a])), (l.el = o.el)),
			trigger || Ux(o, l)),
			l.type === vo && (l.el = o.el));
		}
}

function GE(i) {
	const element = i.slice(),
		trigger = [0];
	let start, end, a, o, l;
	const c = i.length;
	for (start = 0; start < c; start++) {
		const h = i[start];
		if (h !== 0) {
			if (((end = trigger[trigger.length - 1]), i[end] < h)) {
				((element[start] = end), trigger.push(start));
				continue;
			}
			for (a = 0, o = trigger.length - 1; a < o;)
				((l = (a + o) >> 1), i[trigger[l]] < h ? (a = l + 1) : (o = l));
			h < i[trigger[a]] &&
			(a > 0 && (element[start] = trigger[a - 1]), (trigger[a] = start));
		}
	}
	for (a = trigger.length, o = trigger[a - 1]; a-- > 0;)
		((trigger[a] = o), (o = element[o]));
	return trigger;
}

function Fx(i) {
	const element = i.subTree.component;
	if (element)
		return element.asyncDep && !element.asyncResolved ? element : Fx(element);
}

const HE = (i) => i.__isTeleport,
	wi = Symbol.for("v-fgt"),
	vo = Symbol.for("v-txt"),
	Ai = Symbol.for("v-cmt"),
	ul = Symbol.for("v-stc"),
	dl = [];
let Es = null;

function Ut(i = !1) {
	dl.push((Es = i ? null : []));
}

function kx() {
	(dl.pop(), (Es = dl[dl.length - 1] || null));
}

let xo = 1;

function Wg(i) {
	xo += i;
}

function Bx(i) {
	return (
		(i.dynamicChildren = xo > 0 ? Es || no : null),
			kx(),
		xo > 0 && Es && Es.push(i),
			i
	);
}

function Ks(i, element, trigger, start, end, a) {
	return Bx(we(i, element, trigger, start, end, a, !0));
}

function or(i, element, trigger, start, end) {
	return Bx(nt(i, element, trigger, start, end, !0));
}

function yo(i) {
	return i ? i.__v_isVNode === !0 : !1;
}

function ks(i, element) {
	return i.type === element.type && i.key === element.key;
}

const ku = "__vInternal",
	Gx = ({key: i}) => i ?? null,
	Th = ({ref: i, ref_key: element, ref_for: trigger}) => (
		typeof i == "number" && (i = "" + i),
			i != null
				? Tt(i) || fi(i) || He(i)
					? {
						i: Yt,
						end: i,
						k: element,
						f: !!trigger,
					}
					: i
				: null
	);

function we(
	i,
	element = null,
	trigger = null,
	start = 0,
	end = null,
	a = i === wi ? 0 : 1,
	o = !1,
	l = !1,
) {
	const c = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: i,
		props: element,
		key: element && Gx(element),
		ref: element && Th(element),
		scopeId: Du,
		slotScopeIds: null,
		children: trigger,
		component: null,
		suspense: null,
		ssContent: null,
		ssFallback: null,
		dirs: null,
		transition: null,
		el: null,
		anchor: null,
		target: null,
		targetAnchor: null,
		staticCount: 0,
		shapeFlag: a,
		patchFlag: start,
		dynamicProps: end,
		dynamicChildren: null,
		appContext: null,
		ctx: Yt,
	};
	return (
		l
			? (wm(c, trigger), a & 128 && i.normalize(c))
			: trigger && (c.shapeFlag |= Tt(trigger) ? 8 : 16),
		xo > 0 &&
		!o &&
		Es &&
		(c.patchFlag > 0 || a & 6) &&
		c.patchFlag !== 32 &&
		Es.push(c),
			c
	);
}

const nt = zE;

function zE(i, element = null, trigger = null, start = 0, end = null, a = !1) {
	if (((!i || i === ux) && (i = Ai), yo(i))) {
		const l = Un(i, element, !0);
		return (
			trigger && wm(l, trigger),
			xo > 0 &&
			!a &&
			Es &&
			(l.shapeFlag & 6 ? (Es[Es.indexOf(i)] = l) : Es.push(l)),
				(l.patchFlag |= -2),
				l
		);
	}
	if ((KE(i) && (i = i.__vccOpts), element)) {
		element = Hx(element);
		let {class: l, style: c} = element;
		(l && !Tt(l) && (element.class = Lu(l)),
		pt(c) && (tx(c) && !Ue(c) && (c = kt({}, c)), (element.style = nc(c))));
	}
	const o = Tt(i) ? 1 : fx(i) ? 128 : HE(i) ? 64 : pt(i) ? 4 : He(i) ? 2 : 0;
	return we(i, element, trigger, start, end, o, a, !0);
}

function Hx(i) {
	return i ? (tx(i) || ku in i ? kt({}, i) : i) : null;
}

function Un(i, element, trigger = !1) {
	const {props: start, ref: end, patchFlag: a, children: o} = i,
		l = element ? Wx(start || {}, element) : start;
	return {
		__v_isVNode: !0,
		__v_skip: !0,
		type: i.type,
		props: l,
		key: l && Gx(l),
		ref:
			element && element.ref
				? trigger && end
					? Ue(end)
						? end.concat(Th(element))
						: [end, Th(element)]
					: Th(element)
				: end,
		scopeId: i.scopeId,
		slotScopeIds: i.slotScopeIds,
		children: o,
		target: i.target,
		targetAnchor: i.targetAnchor,
		staticCount: i.staticCount,
		shapeFlag: i.shapeFlag,
		patchFlag: element && i.type !== wi ? (a === -1 ? 16 : a | 16) : a,
		dynamicProps: i.dynamicProps,
		dynamicChildren: i.dynamicChildren,
		appContext: i.appContext,
		dirs: i.dirs,
		transition: i.transition,
		component: i.component,
		suspense: i.suspense,
		ssContent: i.ssContent && Un(i.ssContent),
		ssFallback: i.ssFallback && Un(i.ssFallback),
		el: i.el,
		anchor: i.anchor,
		ctx: i.ctx,
		ce: i.ce,
	};
}

function zx(i = " ", element = 0) {
	return nt(vo, null, i, element);
}

function bm(i, element) {
	const trigger = nt(ul, null, i);
	return ((trigger.staticCount = element), trigger);
}

function Ca(i = "", element = !1) {
	return element ? (Ut(), or(Ai, null, i)) : nt(Ai, null, i);
}

function xs(i) {
	return i == null || typeof i == "boolean"
		? nt(Ai)
		: Ue(i)
			? nt(wi, null, i.slice())
			: typeof i == "object"
				? nr(i)
				: nt(vo, null, String(i));
}

function nr(i) {
	return (i.el === null && i.patchFlag !== -1) || i.memo ? i : Un(i);
}

function wm(i, element) {
	let trigger = 0;
	const {shapeFlag: start} = i;
	if (element == null) element = null;
	else if (Ue(element)) trigger = 16;
	else if (typeof element == "object")
		if (start & 65) {
			const end = element.default;
			end && (end._c && (end._d = !1), wm(i, end()), end._c && (end._d = !0));
			return;
		} else {
			trigger = 32;
			const end = element._;
			!end && !(ku in element)
				? (element._ctx = Yt)
				: end === 3 &&
				Yt &&
				(Yt.slots._ === 1
					? (element._ = 1)
					: ((element._ = 2), (i.patchFlag |= 1024)));
		}
	else
		He(element)
			? ((element = {
				default: element,
				_ctx: Yt,
			}),
				(trigger = 32))
			: ((element = String(element)),
				start & 64
					? ((trigger = 16), (element = [zx(element)]))
					: (trigger = 8));
	((i.children = element), (i.shapeFlag |= trigger));
}

function Wx(...i) {
	const element = {};
	for (let trigger = 0; trigger < i.length; trigger++) {
		const start = i[trigger];
		for (const end in start)
			if (end === "class")
				element.class !== start.class &&
				(element.class = Lu([element.class, start.class]));
			else if (end === "style")
				element.style = nc([element.style, start.style]);
			else if (ic(end)) {
				const a = element[end],
					o = start[end];
				o &&
				a !== o &&
				!(Ue(a) && a.includes(o)) &&
				(element[end] = a ? [].concat(a, o) : o);
			} else end !== "" && (element[end] = start[end]);
	}
	return element;
}

function ki(i, element, trigger, start = null) {
	Ms(i, element, 7, [trigger, start]);
}

const WE = Rx();
let jE = 0;

function VE(i, element, trigger) {
	const start = i.type,
		end = (element ? element.appContext : i.appContext) || WE,
		a = {
			uid: jE++,
			vnode: i,
			type: start,
			parent: element,
			appContext: end,
			root: null,
			next: null,
			subTree: null,
			effect: null,
			update: null,
			scope: new Hv(!0),
			render: null,
			proxy: null,
			exposed: null,
			exposeProxy: null,
			withProxy: null,
			provides: element ? element.provides : Object.create(end.provides),
			accessCache: null,
			renderCache: [],
			components: null,
			directives: null,
			propsOptions: Px(start, end),
			emitsOptions: hx(start, end),
			emit: null,
			emitted: null,
			propsDefaults: xt,
			inheritAttrs: start.inheritAttrs,
			ctx: xt,
			data: xt,
			props: xt,
			attrs: xt,
			slots: xt,
			refs: xt,
			setupState: xt,
			setupContext: null,
			attrsProxy: null,
			slotsProxy: null,
			suspense: trigger,
			suspenseId: trigger ? trigger.pendingId : 0,
			asyncDep: null,
			asyncResolved: !1,
			isMounted: !1,
			isUnmounted: !1,
			isDeactivated: !1,
			bc: null,
			c: null,
			bm: null,
			m: null,
			bu: null,
			u: null,
			um: null,
			bum: null,
			da: null,
			a: null,
			rtg: null,
			rtc: null,
			ec: null,
			sp: null,
		};
	return (
		(a.ctx = {
			_: a,
		}),
			(a.root = element ? element.root : a),
			(a.emit = $w.bind(null, a)),
		i.ce && i.ce(a),
			a
	);
}

let Ft = null;
const Bu = () => Ft || Yt;
let Qh, Of;
{
	const i = kv(),
		element = (trigger, start) => {
			let end;
			return (
				(end = i[trigger]) || (end = i[trigger] = []),
					end.push(start),
					(a) => {
						end.length > 1 ? end.forEach((o) => o(a)) : end[0](a);
					}
			);
		};
	((Qh = element("__VUE_INSTANCE_SETTERS__", (trigger) => (Ft = trigger))),
		(Of = element("__VUE_SSR_SETTERS__", (trigger) => (cc = trigger))));
}
const lc = (i) => {
		const element = Ft;
		return (
			Qh(i),
				i.scope.on(),
				() => {
					(i.scope.off(), Qh(element));
				}
		);
	},
	jg = () => {
		(Ft && Ft.scope.off(), Qh(null));
	};

function jx(i) {
	return i.vnode.shapeFlag & 4;
}

let cc = !1;

function qE(i, element = !1) {
	element && Of(element);
	const {props: trigger, children: start} = i.vnode,
		end = jx(i);
	(PE(i, trigger, end, element), OE(i, start));
	const a = end ? XE(i, element) : void 0;
	return (element && Of(!1), a);
}

function XE(i, element) {
	const trigger = i.type;
	((i.accessCache = Object.create(null)), (i.proxy = ix(new Proxy(i.ctx, wE))));
	const {setup: start} = trigger;
	if (start) {
		const end = (i.setupContext = start.length > 1 ? YE(i) : null),
			a = lc(i);
		Sa();
		const o = mr(start, i, 0, [i.props, end]);
		if ((Ta(), a(), Nv(o))) {
			if ((o.then(jg, jg), element))
				return o
					.then((l) => {
						Nf(i, l, element);
					})
					.catch((l) => {
						Oo(l, i, 0);
					});
			i.asyncDep = o;
		} else Nf(i, o, element);
	} else Vx(i, element);
}

function Nf(i, element, trigger) {
	(He(element)
		? i.type.__ssrInlineRender
			? (i.ssrRender = element)
			: (i.render = element)
		: pt(element) && (i.setupState = ax(element)),
		Vx(i, trigger));
}

let Vg;

function Vx(i, element, trigger) {
	const start = i.type;
	if (!i.render) {
		if (!element && Vg && !start.render) {
			const end = start.template || xm(i).template;
			if (end) {
				const {isCustomElement: a, compilerOptions: o} = i.appContext.config,
					{delimiters: l, compilerOptions: c} = start,
					h = kt(
						kt(
							{
								isCustomElement: a,
								delimiters: l,
							},
							o,
						),
						c,
					);
				start.render = Vg(end, h);
			}
		}
		i.render = start.render || cs;
	}
	{
		const end = lc(i);
		Sa();
		try {
			EE(i);
		} finally {
			(Ta(), end());
		}
	}
}

function $E(i) {
	return (
		i.attrsProxy ||
		(i.attrsProxy = new Proxy(i.attrs, {
			get(element, trigger) {
				return (qi(i, "get", "$attrs"), element[trigger]);
			},
		}))
	);
}

function YE(i) {
	const element = (trigger) => {
		i.exposed = trigger || {};
	};
	return {
		get attrs() {
			return $E(i);
		},
		slots: i.slots,
		emit: i.emit,
		expose: element,
	};
}

function Em(i) {
	if (i.exposed)
		return (
			i.exposeProxy ||
			(i.exposeProxy = new Proxy(ax(ix(i.exposed)), {
				get(element, trigger) {
					if (trigger in element) return element[trigger];
					if (trigger in hl) return hl[trigger](i);
				},
				has(element, trigger) {
					return trigger in element || trigger in hl;
				},
			}))
		);
}

function Df(i, element = !0) {
	return He(i) ? i.displayName || i.name : i.name || (element && i.__name);
}

function KE(i) {
	return He(i) && "__vccOpts" in i;
}

const li = (i, element) => kw(i, element, cc);

function Ci(i, element, trigger) {
	const start = arguments.length;
	return start === 2
		? pt(element) && !Ue(element)
			? yo(element)
				? nt(i, null, [element])
				: nt(i, element)
			: nt(i, null, element)
		: (start > 3
			? (trigger = Array.prototype.slice.call(arguments, 2))
			: start === 3 && yo(trigger) && (trigger = [trigger]),
			nt(i, element, trigger));
}

const qx = "3.4.15";
/**
 * @vue/runtime-dom v3.4.15
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/
const ZE = "http://www.w3.org/2000/svg",
	JE = "http://www.w3.org/1998/Math/MathML",
	rr = typeof document < "u" ? document : null,
	qg = rr && rr.createElement("template"),
	QE = {
		insert: (i, element, trigger) => {
			element.insertBefore(i, trigger || null);
		},
		remove: (i) => {
			const element = i.parentNode;
			element && element.removeChild(i);
		},
		createElement: (i, element, trigger, start) => {
			const end =
				element === "svg"
					? rr.createElementNS(ZE, i)
					: element === "mathml"
						? rr.createElementNS(JE, i)
						: rr.createElement(
							i,
							trigger
								? {
									is: trigger,
								}
								: void 0,
						);
			return (
				i === "select" &&
				start &&
				start.multiple != null &&
				end.setAttribute("multiple", start.multiple),
					end
			);
		},
		createText: (i) => rr.createTextNode(i),
		createComment: (i) => rr.createComment(i),
		setText: (i, element) => {
			i.nodeValue = element;
		},
		setElementText: (i, element) => {
			i.textContent = element;
		},
		parentNode: (i) => i.parentNode,
		nextSibling: (i) => i.nextSibling,
		querySelector: (i) => rr.querySelector(i),
		setScopeId(i, element) {
			i.setAttribute(element, "");
		},
		insertStaticContent(i, element, trigger, start, end, a) {
			const o = trigger ? trigger.previousSibling : element.lastChild;
			if (end && (end === a || end.nextSibling))
				for (
					;
					element.insertBefore(end.cloneNode(!0), trigger),
						!(end === a || !(end = end.nextSibling));
				) ;
			else {
				qg.innerHTML =
					start === "svg"
						? `<svg>${i}</svg>`
						: start === "mathml"
							? `<math>${i}</math>`
							: i;
				const l = qg.content;
				if (start === "svg" || start === "mathml") {
					const c = l.firstChild;
					for (; c.firstChild;) l.appendChild(c.firstChild);
					l.removeChild(c);
				}
				element.insertBefore(l, trigger);
			}
			return [
				o ? o.nextSibling : element.firstChild,
				trigger ? trigger.previousSibling : element.lastChild,
			];
		},
	},
	Xn = "transition",
	Bo = "animation",
	Ul = Symbol("_vtc"),
	Gu = (i, {slots: element}) => Ci(fE, eS(i), element);
Gu.displayName = "Transition";
const Xx = {
	name: String,
	type: String,
	css: {
		type: Boolean,
		default: !0,
	},
	duration: [String, Number, Object],
	enterFromClass: String,
	enterActiveClass: String,
	enterToClass: String,
	appearFromClass: String,
	appearActiveClass: String,
	appearToClass: String,
	leaveFromClass: String,
	leaveActiveClass: String,
	leaveToClass: String,
};
Gu.props = kt({}, gx, Xx);
const Ur = (i, element = []) => {
		Ue(i) ? i.forEach((trigger) => trigger(...element)) : i && i(...element);
	},
	Xg = (i) =>
		i ? (Ue(i) ? i.some((element) => element.length > 1) : i.length > 1) : !1;

function eS(i) {
	const element = {};
	for (const P in i) P in Xx || (element[P] = i[P]);
	if (i.css === !1) return element;
	const {
			name: trigger = "v",
			type: start,
			duration: end,
			enterFromClass: a = `${trigger}-enter-from`,
			enterActiveClass: o = `${trigger}-enter-active`,
			enterToClass: l = `${trigger}-enter-to`,
			appearFromClass: c = a,
			appearActiveClass: h = o,
			appearToClass: u = l,
			leaveFromClass: d = `${trigger}-leave-from`,
			leaveActiveClass: f = `${trigger}-leave-active`,
			leaveToClass: p = `${trigger}-leave-to`,
		} = i,
		_ = tS(end),
		m = _ && _[0],
		g = _ && _[1],
		{
			onBeforeEnter: b,
			onEnter: x,
			onEnterCancelled: v,
			onLeave: w,
			onLeaveCancelled: E,
			onBeforeAppear: T = b,
			onAppear: M = x,
			onAppearCancelled: U = v,
		} = element,
		L = (P, q, $) => {
			(Fr(P, q ? u : l), Fr(P, q ? h : o), $ && $());
		},
		O = (P, q) => {
			((P._isLeaving = !1), Fr(P, d), Fr(P, p), Fr(P, f), q && q());
		},
		B = (P) => (q, $) => {
			const oe = P ? M : x,
				X = () => L(q, P, $);
			(Ur(oe, [q, X]),
				$g(() => {
					(Fr(q, P ? c : a),
						$start(q, P ? u : l),
					Xg(oe) || Yg(q, start, m, X));
				}));
		};
	return kt(element, {
		onBeforeEnter(P) {
			(Ur(b, [P]), $start(P, a), $start(P, o));
		},
		onBeforeAppear(P) {
			(Ur(T, [P]), $start(P, c), $start(P, h));
		},
		onEnter: B(!1),
		onAppear: B(!0),
		onLeave(P, q) {
			P._isLeaving = !0;
			const $ = () => O(P, q);
			($start(P, d),
				nS(),
				$start(P, f),
				$g(() => {
					P._isLeaving && (Fr(P, d), $start(P, p), Xg(w) || Yg(P, start, g, $));
				}),
				Ur(w, [P, $]));
		},
		onEnterCancelled(P) {
			(L(P, !1), Ur(v, [P]));
		},
		onAppearCancelled(P) {
			(L(P, !0), Ur(U, [P]));
		},
		onLeaveCancelled(P) {
			(O(P), Ur(E, [P]));
		},
	});
}

function tS(i) {
	if (i == null) return null;
	if (pt(i)) return [fd(i.enter), fd(i.leave)];
	{
		const element = fd(i);
		return [element, element];
	}
}

function fd(i) {
	return Fv(i);
}

function $start(i, element) {
	(element
		.split(/\s+/)
		.forEach((trigger) => trigger && i.classList.add(trigger)),
		(i[Ul] || (i[Ul] = new Set())).add(element));
}

function Fr(i, element) {
	element.split(/\s+/).forEach((start) => start && i.classList.remove(start));
	const trigger = i[Ul];
	trigger && (trigger.delete(element), trigger.size || (i[Ul] = void 0));
}

function $g(i) {
	requestAnimationFrame(() => {
		requestAnimationFrame(i);
	});
}

let iS = 0;

function Yg(i, element, trigger, start) {
	const end = (i._endId = ++iS),
		a = () => {
			end === i._endId && start();
		};
	if (trigger) return setTimeout(a, trigger);
	const {type: o, timeout: l, propCount: c} = sS(i, element);
	if (!o) return start();
	const h = o + "end";
	let u = 0;
	const d = () => {
			(i.removeEventListener(h, f), a());
		},
		f = (p) => {
			p.target === i && ++u >= c && d();
		};
	(setTimeout(() => {
		u < c && d();
	}, l + 1),
		i.addEventListener(h, f));
}

function sS(i, element) {
	const trigger = window.getComputedStyle(i),
		start = (_) => (trigger[_] || "").split(", "),
		end = start(`${Xn}Delay`),
		a = start(`${Xn}Duration`),
		o = Kg(end, a),
		l = start(`${Bo}Delay`),
		c = start(`${Bo}Duration`),
		h = Kg(l, c);
	let u = null,
		d = 0,
		f = 0;
	element === Xn
		? o > 0 && ((u = Xn), (d = o), (f = a.length))
		: element === Bo
			? h > 0 && ((u = Bo), (d = h), (f = c.length))
			: ((d = Math.max(o, h)),
				(u = d > 0 ? (o > h ? Xn : Bo) : null),
				(f = u ? (u === Xn ? a.length : c.length) : 0));
	const p =
		u === Xn &&
		/\b(transform|all)(,|$)/.test(start(`${Xn}Property`).toString());
	return {
		type: u,
		timeout: d,
		propCount: f,
		hasTransform: p,
	};
}

function Kg(i, element) {
	for (; i.length < element.length;) i = i.concat(i);
	return Math.max(
		...element.map((trigger, start) => Zg(trigger) + Zg(i[start])),
	);
}

function Zg(i) {
	return i === "auto" ? 0 : Number(i.slice(0, -1).replace(",", ".")) * 1e3;
}

function nS() {
	return document.body.offsetHeight;
}

function rS(i, element, trigger) {
	const start = i[Ul];
	(start && (element = (element ? [element, ...start] : [...start]).join(" ")),
		element == null
			? i.removeAttribute("class")
			: trigger
				? i.setAttribute("class", element)
				: (i.className = element));
}

const aS = Symbol("_vod"),
	oS = Symbol("");

function lS(i, element, trigger) {
	const start = i.style,
		end = start.display,
		a = Tt(trigger);
	if (trigger && !a) {
		if (element && !Tt(element))
			for (const o in element) trigger[o] == null && Uf(start, o, "");
		for (const o in trigger) Uf(start, o, trigger[o]);
	} else if (a) {
		if (element !== trigger) {
			const o = start[oS];
			(o && (trigger += ";" + o), (start.cssText = trigger));
		}
	} else element && i.removeAttribute("style");
	aS in i && (start.display = end);
}

const Jg = /\s*!important$/;

function Uf(i, element, trigger) {
	if (Ue(trigger)) trigger.forEach((start) => Uf(i, element, start));
	else if ((trigger == null && (trigger = ""), element.startsWith("--")))
		i.setProperty(element, trigger);
	else {
		const start = cS(i, element);
		Jg.test(trigger)
			? i.setProperty(Io(start), trigger.replace(Jg, ""), "important")
			: (i[start] = trigger);
	}
}

const Qg = ["Webkit", "Moz", "ms"],
	pd = {};

function cS(i, element) {
	const trigger = pd[element];
	if (trigger) return trigger;
	let start = hn(element);
	if (start !== "filter" && start in i) return (pd[element] = start);
	start = Pu(start);
	for (let end = 0; end < Qg.length; end++) {
		const a = Qg[end] + start;
		if (a in i) return (pd[element] = a);
	}
	return element;
}

const e_ = "http://www.w3.org/1999/xlink";

function hS(i, element, trigger, start, end) {
	if (start && element.startsWith("xlink:"))
		trigger == null
			? i.removeAttributeNS(e_, element.slice(6, element.length))
			: i.setAttributeNS(e_, element, trigger);
	else {
		const a = pw(element);
		trigger == null || (a && !Bv(trigger))
			? i.removeAttribute(element)
			: i.setAttribute(element, a ? "" : trigger);
	}
}

function uS(i, element, trigger, start, end, a, o) {
	if (element === "innerHTML" || element === "textContent") {
		(start && o(start, end, a), (i[element] = trigger ?? ""));
		return;
	}
	const l = i.tagName;
	if (element === "value" && l !== "PROGRESS" && !l.includes("-")) {
		i._value = trigger;
		const h = l === "OPTION" ? i.getAttribute("value") : i.value,
			u = trigger ?? "";
		(h !== u && (i.value = u), trigger == null && i.removeAttribute(element));
		return;
	}
	let c = !1;
	if (trigger === "" || trigger == null) {
		const h = typeof i[element];
		h === "boolean"
			? (trigger = Bv(trigger))
			: trigger == null && h === "string"
				? ((trigger = ""), (c = !0))
				: h === "number" && ((trigger = 0), (c = !0));
	}
	try {
		i[element] = trigger;
	} catch {
	}
	c && i.removeAttribute(element);
}

function dS(i, element, trigger, start) {
	i.addEventListener(element, trigger, start);
}

function fS(i, element, trigger, start) {
	i.removeEventListener(element, trigger, start);
}

const t_ = Symbol("_vei");

function pS(i, element, trigger, start, end = null) {
	const a = i[t_] || (i[t_] = {}),
		o = a[element];
	if (start && o) o.value = start;
	else {
		const [l, c] = mS(element);
		if (start) {
			const h = (a[element] = vS(start, end));
			dS(i, l, h, c);
		} else o && (fS(i, l, o, c), (a[element] = void 0));
	}
}

const i_ = /(?:Once|Passive|Capture)$/;

function mS(i) {
	let element;
	if (i_.test(i)) {
		element = {};
		let start;
		for (; (start = i.match(i_));)
			((i = i.slice(0, i.length - start[0].length)),
				(element[start[0].toLowerCase()] = !0));
	}
	return [i[2] === ":" ? i.slice(3) : Io(i.slice(2)), element];
}

let md = 0;
const gS = Promise.resolve(),
	_S = () => md || (gS.then(() => (md = 0)), (md = Date.now()));

function vS(i, element) {
	const trigger = (start) => {
		if (!start._vts) start._vts = Date.now();
		else if (start._vts <= trigger.attached) return;
		Ms(xS(start, trigger.value), element, 5, [start]);
	};
	return ((trigger.value = i), (trigger.attached = _S()), trigger);
}

function xS(i, element) {
	if (Ue(element)) {
		const trigger = i.stopImmediatePropagation;
		return (
			(i.stopImmediatePropagation = () => {
				(trigger.call(i), (i._stopped = !0));
			}),
				element.map((start) => (end) => !end._stopped && start && start(end))
		);
	} else return element;
}

const s_ = (i) =>
		i.charCodeAt(0) === 111 &&
		i.charCodeAt(1) === 110 &&
		i.charCodeAt(2) > 96 &&
		i.charCodeAt(2) < 123,
	yS = (i, element, trigger, start, end, a, o, l, c) => {
		const h = end === "svg";
		element === "class"
			? rS(i, start, h)
			: element === "style"
				? lS(i, trigger, start)
				: ic(element)
					? sm(element) || pS(i, element, trigger, start, o)
					: (
						element[0] === "."
							? ((element = element.slice(1)), !0)
							: element[0] === "^"
								? ((element = element.slice(1)), !1)
								: bS(i, element, start, h)
					)
						? uS(i, element, start, a, o, l, c)
						: (element === "true-value"
							? (i._trueValue = start)
							: element === "false-value" && (i._falseValue = start),
							hS(i, element, start, h));
	};

function bS(i, element, trigger, start) {
	if (start)
		return !!(
			element === "innerHTML" ||
			element === "textContent" ||
			(element in i && s_(element) && He(trigger))
		);
	if (
		element === "spellcheck" ||
		element === "draggable" ||
		element === "translate" ||
		element === "form" ||
		(element === "list" && i.tagName === "INPUT") ||
		(element === "type" && i.tagName === "TEXTAREA")
	)
		return !1;
	if (element === "width" || element === "height") {
		const end = i.tagName;
		if (
			end === "IMG" ||
			end === "VIDEO" ||
			end === "CANVAS" ||
			end === "SOURCE"
		)
			return !1;
	}
	return s_(element) && Tt(trigger) ? !1 : element in i;
}

const wS = ["ctrl", "shift", "alt", "meta"],
	ES = {
		stop: (i) => i.stopPropagation(),
		prevent: (i) => i.preventDefault(),
		self: (i) => i.target !== i.currentTarget,
		ctrl: (i) => !i.ctrlKey,
		shift: (i) => !i.shiftKey,
		alt: (i) => !i.altKey,
		meta: (i) => !i.metaKey,
		left: (i) => "button" in i && i.button !== 0,
		middle: (i) => "button" in i && i.button !== 1,
		right: (i) => "button" in i && i.button !== 2,
		exact: (i, element) =>
			wS.some((trigger) => i[`${trigger}Key`] && !element.includes(trigger)),
	},
	Lc = (i, element) => {
		const trigger = i._withMods || (i._withMods = {}),
			start = element.join(".");
		return (
			trigger[start] ||
			(trigger[start] = (end, ...a) => {
				for (let o = 0; o < element.length; o++) {
					const l = ES[element[o]];
					if (l && l(end, element)) return;
				}
				return i(end, ...a);
			})
		);
	},
	$x = kt(
		{
			patchProp: yS,
		},
		QE,
	);
let fl,
	n_ = !1;

function SS() {
	return fl || (fl = kE($x));
}

function TS() {
	return ((fl = n_ ? fl : BE($x)), (n_ = !0), fl);
}

const MS = (...i) => {
		const element = SS().createApp(...i),
			{mount: trigger} = element;
		return (
			(element.mount = (start) => {
				const end = Kx(start);
				if (!end) return;
				const a = element._component;
				(!He(a) && !a.render && !a.template && (a.template = end.innerHTML),
					(end.innerHTML = ""));
				const o = trigger(end, !1, Yx(end));
				return (
					end instanceof Element &&
					(end.removeAttribute("v-cloak"),
						end.setAttribute("data-v-app", "")),
						o
				);
			}),
				element
		);
	},
	RS = (...i) => {
		const element = TS().createApp(...i),
			{mount: trigger} = element;
		return (
			(element.mount = (start) => {
				const end = Kx(start);
				if (end) return trigger(end, !0, Yx(end));
			}),
				element
		);
	};

function Yx(i) {
	if (i instanceof SVGElement) return "svg";
	if (typeof MathMLElement == "function" && i instanceof MathMLElement)
		return "mathml";
}

function Kx(i) {
	return Tt(i) ? document.querySelector(i) : i;
}

const AS = /#/g,
	CS = /&/g,
	PS = /=/g,
	Sm = /\+/g,
	LS = /%5e/gi,
	IS = /%60/gi,
	OS = /%7c/gi,
	NS = /%20/gi;

function DS(i) {
	return encodeURI("" + i).replace(OS, "|");
}

function Ff(i) {
	return DS(typeof i == "string" ? i : JSON.stringify(i))
		.replace(Sm, "%2B")
		.replace(NS, "+")
		.replace(AS, "%23")
		.replace(CS, "%26")
		.replace(IS, "`")
		.replace(LS, "^");
}

function gd(i) {
	return Ff(i).replace(PS, "%3D");
}

function eu(i = "") {
	try {
		return decodeURIComponent("" + i);
	} catch {
		return "" + i;
	}
}

function US(i) {
	return eu(i.replace(Sm, " "));
}

function FS(i) {
	return eu(i.replace(Sm, " "));
}

function Zx(i = "") {
	const element = {};
	i[0] === "?" && (i = i.slice(1));
	for (const trigger of i.split("&")) {
		const start = trigger.match(/([^=]+)=?(.*)/) || [];
		if (start.length < 2) continue;
		const end = US(start[1]);
		if (end === "__proto__" || end === "constructor") continue;
		const a = FS(start[2] || "");
		element[end] === void 0
			? (element[end] = a)
			: Array.isArray(element[end])
				? element[end].push(a)
				: (element[end] = [element[end], a]);
	}
	return element;
}

function kS(i, element) {
	return (
		(typeof element == "number" || typeof element == "boolean") &&
		(element = String(element)),
			element
				? Array.isArray(element)
					? element.map((trigger) => `${gd(i)}=${Ff(trigger)}`).join("&")
					: `${gd(i)}=${Ff(element)}`
				: gd(i)
	);
}

function BS(i) {
	return Object.keys(i)
		.filter((element) => i[element] !== void 0)
		.map((element) => kS(element, i[element]))
		.filter(Boolean)
		.join("&");
}

const GS = /^[\s\w\0+.-]{2,}:([/\\]{1,2})/,
	HS = /^[\s\w\0+.-]{2,}:([/\\]{2})?/,
	zS = /^([/\\]\s*){2,}[^/\\]/;

function No(i, element = {}) {
	return (
		typeof element == "boolean" &&
		(element = {
			acceptRelative: element,
		}),
			element.strict
				? GS.test(i)
				: HS.test(i) || (element.acceptRelative ? zS.test(i) : !1)
	);
}

const WS = /^[\s\0]*(blob|data|javascript|vbscript):$/i;

function jS(i) {
	return !!i && WS.test(i);
}

const VS = /\/$|\/\?|\/#/;

function kf(i = "", element) {
	return element ? VS.test(i) : i.endsWith("/");
}

function Tm(i = "", element) {
	if (!element) return (kf(i) ? i.slice(0, -1) : i) || "/";
	if (!kf(i, !0)) return i || "/";
	let trigger = i,
		start = "";
	const end = i.indexOf("#");
	end >= 0 && ((trigger = i.slice(0, end)), (start = i.slice(end)));
	const [a, ...o] = trigger.split("?");
	return (
		(a.slice(0, -1) || "/") + (o.length > 0 ? `?${o.join("?")}` : "") + start
	);
}

function tu(i = "", element) {
	if (!element) return i.endsWith("/") ? i : i + "/";
	if (kf(i, !0)) return i || "/";
	let trigger = i,
		start = "";
	const end = i.indexOf("#");
	if (
		end >= 0 &&
		((trigger = i.slice(0, end)), (start = i.slice(end)), !trigger)
	)
		return start;
	const [a, ...o] = trigger.split("?");
	return a + "/" + (o.length > 0 ? `?${o.join("?")}` : "") + start;
}

function qS(i = "") {
	return i.startsWith("/");
}

function r_(i = "") {
	return qS(i) ? i : "/" + i;
}

function XS(i, element) {
	if (Qx(element) || No(i)) return i;
	const trigger = Tm(element);
	return i.startsWith(trigger) ? i : Do(trigger, i);
}

function a_(i, element) {
	if (Qx(element)) return i;
	const trigger = Tm(element);
	if (!i.startsWith(trigger)) return i;
	const start = i.slice(trigger.length);
	return start[0] === "/" ? start : "/" + start;
}

function Jx(i, element) {
	const trigger = hc(i),
		start = {
			...Zx(trigger.search),
			...element,
		};
	return ((trigger.search = BS(start)), ZS(trigger));
}

function Qx(i) {
	return !i || i === "/";
}

function $S(i) {
	return i && i !== "/";
}

const YS = /^\.?\//;

function Do(i, ...element) {
	let trigger = i || "";
	for (const start of element.filter((end) => $S(end)))
		if (trigger) {
			const end = start.replace(YS, "");
			trigger = tu(trigger) + end;
		} else trigger = start;
	return trigger;
}

function KS(i, element, trigger = {}) {
	return (
		trigger.trailingSlash || ((i = tu(i)), (element = tu(element))),
		trigger.leadingSlash || ((i = r_(i)), (element = r_(element))),
		trigger.encoding || ((i = eu(i)), (element = eu(element))),
		i === element
	);
}

function hc(i = "", element) {
	const trigger = i.match(/^[\s\0]*(blob:|data:|javascript:|vbscript:)(.*)/i);
	if (trigger) {
		const [, d, f = ""] = trigger;
		return {
			protocol: d.toLowerCase(),
			pathname: f,
			href: d + f,
			auth: "",
			host: "",
			search: "",
			hash: "",
		};
	}
	if (
		!No(i, {
			acceptRelative: !0,
		})
	)
		return element ? hc(element + i) : o_(i);
	const [, start = "", end, a = ""] =
		i
			.replace(/\\/g, "/")
			.match(/^[\s\0]*([\w+.-]{2,}:)?\/\/([^/@]+@)?(.*)/) || [],
		[, o = "", l = ""] = a.match(/([^#/?]*)(.*)?/) || [],
		{pathname: c, search: h, hash: u} = o_(l.replace(/\/(?=[A-Za-z]:)/, ""));
	return {
		protocol: start.toLowerCase(),
		auth: end ? end.slice(0, Math.max(0, end.length - 1)) : "",
		host: o,
		pathname: c,
		search: h,
		hash: u,
	};
}

function o_(i = "") {
	const [element = "", trigger = "", start = ""] = (
		i.match(/([^#?]*)(\?[^#]*)?(#.*)?/) || []
	).splice(1);
	return {
		pathname: element,
		search: trigger,
		hash: start,
	};
}

function ZS(i) {
	const element = i.pathname || "",
		trigger = i.search ? (i.search.startsWith("?") ? "" : "?") + i.search : "",
		start = i.hash || "",
		end = i.auth ? i.auth + "@" : "",
		a = i.host || "";
	return (
		(i.protocol ? i.protocol + "//" : "") + end + a + element + trigger + start
	);
}

const JS = () => {
		var i;
		return (
			((i = window == null ? void 0 : window.__NUXT__) == null
				? void 0
				: i.config) || {}
		);
	},
	iu = JS().app,
	QS = () => iu.baseURL,
	eT = () => iu.buildAssetsDir,
	Mm = (...i) => Do(ey(), eT(), ...i),
	ey = (...i) => {
		const element = iu.cdnURL || iu.baseURL;
		return i.length ? Do(element, ...i) : element;
	};
((globalThis.__buildAssetsURL = Mm), (globalThis.__publicAssetsURL = ey));
const tT =
		/"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:end|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:trigger|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/,
	iT =
		/"(?:c|\\u0063)(?:o|\\u006[Ff])(?:start|\\u006[Ee])(?:s|\\u0073)(?:trigger|\\u0074)(?:end|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:trigger|\\u0074)(?:o|\\u006[Ff])(?:end|\\u0072)"\s*:/,
	sT = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;

function nT(i, element) {
	if (
		i === "__proto__" ||
		(i === "constructor" &&
			element &&
			typeof element == "object" &&
			"prototype" in element)
	) {
		rT(i);
		return;
	}
	return element;
}

function rT(i) {
	`${i}`;
}

function su(i, element = {}) {
	if (typeof i != "string") return i;
	const trigger = i.trim();
	if (i[0] === '"' && i.at(-1) === '"' && !i.includes("\\"))
		return trigger.slice(1, -1);
	if (trigger.length <= 9) {
		const start = trigger.toLowerCase();
		if (start === "true") return !0;
		if (start === "false") return !1;
		if (start === "undefined") return;
		if (start === "null") return null;
		if (start === "nan") return Number.NaN;
		if (start === "infinity") return Number.POSITIVE_INFINITY;
		if (start === "-infinity") return Number.NEGATIVE_INFINITY;
	}
	if (!sT.test(i)) {
		if (element.strict) throw new SyntaxError("[destr] Invalid JSON");
		return i;
	}
	try {
		if (tT.test(i) || iT.test(i)) {
			if (element.strict)
				throw new Error("[destr] Possible prototype pollution");
			return JSON.parse(i, nT);
		}
		return JSON.parse(i);
	} catch (start) {
		if (element.strict) throw start;
		return i;
	}
}

class aT extends Error {
	constructor(element, trigger) {
		(super(element, trigger),
			(this.name = "FetchError"),
		trigger != null &&
		trigger.cause &&
		!this.cause &&
		(this.cause = trigger.cause));
	}
}

function oT(i) {
	var c, h, u, d, f;
	const element =
			((c = i.error) == null ? void 0 : c.message) ||
			((h = i.error) == null ? void 0 : h.toString()) ||
			"",
		trigger =
			((u = i.request) == null ? void 0 : u.method) ||
			((d = i.options) == null ? void 0 : d.method) ||
			"GET",
		start =
			((f = i.request) == null ? void 0 : f.url) || String(i.request) || "/",
		end = `[${trigger}] ${JSON.stringify(start)}`,
		a = i.response
			? `${i.response.status} ${i.response.statusText}`
			: "<no response>",
		o = `${end}: ${a}${element ? ` ${element}` : ""}`,
		l = new aT(
			o,
			i.error
				? {
					cause: i.error,
				}
				: void 0,
		);
	for (const p of ["request", "options", "response"])
		Object.defineProperty(l, p, {
			get() {
				return i[p];
			},
		});
	for (const [p, _] of [
		["data", "_data"],
		["status", "status"],
		["statusCode", "status"],
		["statusText", "statusText"],
		["statusMessage", "statusText"],
	])
		Object.defineProperty(l, p, {
			get() {
				return i.response && i.response[_];
			},
		});
	return l;
}

const lT = new Set(Object.freeze(["PATCH", "POST", "PUT", "DELETE"]));

function l_(i = "GET") {
	return lT.has(i.toUpperCase());
}

function cT(i) {
	if (i === void 0) return !1;
	const element = typeof i;
	return element === "string" ||
	element === "number" ||
	element === "boolean" ||
	element === null
		? !0
		: element !== "object"
			? !1
			: Array.isArray(i)
				? !0
				: i.buffer
					? !1
					: (i.constructor && i.constructor.name === "Object") ||
					typeof i.toJSON == "function";
}

const hT = new Set([
		"image/svg",
		"application/xml",
		"application/xhtml",
		"application/html",
	]),
	uT = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;

function dT(i = "") {
	if (!i) return "json";
	const element = i.split(";").shift() || "";
	return uT.test(element)
		? "json"
		: hT.has(element) || element.startsWith("text/")
			? "text"
			: "blob";
}

function fT(i, element, trigger = globalThis.Headers) {
	const start = {
		...element,
		...i,
	};
	if (
		(element != null &&
		element.params &&
		i != null &&
		i.params &&
		(start.params = {
			...(element == null ? void 0 : element.params),
			...(i == null ? void 0 : i.params),
		}),
		element != null &&
		element.query &&
		i != null &&
		i.query &&
		(start.query = {
			...(element == null ? void 0 : element.query),
			...(i == null ? void 0 : i.query),
		}),
		element != null && element.headers && i != null && i.headers)
	) {
		start.headers = new trigger(
			(element == null ? void 0 : element.headers) || {},
		);
		for (const [end, a] of new trigger((i == null ? void 0 : i.headers) || {}))
			start.headers.set(end, a);
	}
	return start;
}

const pT = new Set([408, 409, 425, 429, 500, 502, 503, 504]),
	mT = new Set([101, 204, 205, 304]);

function ty(i = {}) {
	const {
		fetch: element = globalThis.fetch,
		Headers: trigger = globalThis.Headers,
		AbortController: start = globalThis.AbortController,
	} = i;
	
	async function end(l) {
		const c =
			(l.error && l.error.name === "AbortError" && !l.options.timeout) || !1;
		if (l.options.retry !== !1 && !c) {
			let u;
			typeof l.options.retry == "number"
				? (u = l.options.retry)
				: (u = l_(l.options.method) ? 0 : 1);
			const d = (l.response && l.response.status) || 500;
			if (
				u > 0 &&
				(Array.isArray(l.options.retryStatusCodes)
					? l.options.retryStatusCodes.includes(d)
					: pT.has(d))
			) {
				const f = l.options.retryDelay || 0;
				return (
					f > 0 && (await new Promise((p) => setTimeout(p, f))),
						a(l.request, {
							...l.options,
							retry: u - 1,
							timeout: l.options.timeout,
						})
				);
			}
		}
		const h = oT(l);
		throw (Error.captureStackTrace && Error.captureStackTrace(h, a), h);
	}
	
	const a = async function (c, h = {}) {
			var f;
			const u = {
				request: c,
				options: fT(h, i.defaults, trigger),
				response: void 0,
				error: void 0,
			};
			if (
				((u.options.method =
					(f = u.options.method) == null ? void 0 : f.toUpperCase()),
				u.options.onRequest && (await u.options.onRequest(u)),
				typeof u.request == "string" &&
				(u.options.baseURL && (u.request = XS(u.request, u.options.baseURL)),
				(u.options.query || u.options.params) &&
				(u.request = Jx(u.request, {
					...u.options.params,
					...u.options.query,
				}))),
				u.options.body &&
				l_(u.options.method) &&
				(cT(u.options.body)
					? ((u.options.body =
						typeof u.options.body == "string"
							? u.options.body
							: JSON.stringify(u.options.body)),
						(u.options.headers = new trigger(u.options.headers || {})),
					u.options.headers.has("content-type") ||
					u.options.headers.set("content-type", "application/json"),
					u.options.headers.has("accept") ||
					u.options.headers.set("accept", "application/json"))
					: (("pipeTo" in u.options.body &&
							typeof u.options.body.pipeTo == "function") ||
						typeof u.options.body.pipe == "function") &&
					("duplex" in u.options || (u.options.duplex = "half"))),
				!u.options.signal && u.options.timeout)
			) {
				const p = new start();
				(setTimeout(() => p.abort(), u.options.timeout),
					(u.options.signal = p.signal));
			}
			try {
				u.response = await element(u.request, u.options);
			} catch (p) {
				return (
					(u.error = p),
					u.options.onRequestError && (await u.options.onRequestError(u)),
						await end(u)
				);
			}
			if (
				u.response.body &&
				!mT.has(u.response.status) &&
				u.options.method !== "HEAD"
			) {
				const p =
					(u.options.parseResponse ? "json" : u.options.responseType) ||
					dT(u.response.headers.get("content-type") || "");
				switch (p) {
					case "json": {
						const _ = await u.response.text(),
							m = u.options.parseResponse || su;
						u.response._data = m(_);
						break;
					}
					case "stream": {
						u.response._data = u.response.body;
						break;
					}
					default:
						u.response._data = await u.response[p]();
				}
			}
			return (
				u.options.onResponse && (await u.options.onResponse(u)),
					!u.options.ignoreResponseError &&
					u.response.status >= 400 &&
					u.response.status < 600
						? (u.options.onResponseError && (await u.options.onResponseError(u)),
							await end(u))
						: u.response
			);
		},
		o = async function (c, h) {
			return (await a(c, h))._data;
		};
	return (
		(o.raw = a),
			(o.native = (...l) => element(...l)),
			(o.create = (l = {}) =>
				ty({
					...i,
					defaults: {
						...i.defaults,
						...l,
					},
				})),
			o
	);
}

const Rm = (function () {
		if (typeof globalThis < "u") return globalThis;
		if (typeof self < "u") return self;
		if (typeof window < "u") return window;
		if (typeof global < "u") return global;
		throw new Error("unable to locate global object");
	})(),
	gT =
		Rm.fetch ||
		(() =>
			Promise.reject(new Error("[ofetch] global.fetch is not supported!"))),
	_T = Rm.Headers,
	vT = Rm.AbortController,
	xT = ty({
		fetch: gT,
		Headers: _T,
		AbortController: vT,
	}),
	yT = xT;
globalThis.$fetch ||
(globalThis.$fetch = yT.create({
	baseURL: QS(),
}));

function Bf(i, element = {}, trigger) {
	for (const start in i) {
		const end = i[start],
			a = trigger ? `${trigger}:${start}` : start;
		typeof end == "object" && end !== null
			? Bf(end, element, a)
			: typeof end == "function" && (element[a] = end);
	}
	return element;
}

const bT = {
		run: (i) => i(),
	},
	wT = () => bT,
	iy = typeof console.createTask < "u" ? console.createTask : wT;

function ET(i, element) {
	const trigger = element.shift(),
		start = iy(trigger);
	return i.reduce(
		(end, a) => end.then(() => start.run(() => a(...element))),
		Promise.resolve(),
	);
}

function ST(i, element) {
	const trigger = element.shift(),
		start = iy(trigger);
	return Promise.all(i.map((end) => start.run(() => end(...element))));
}

function _d(i, element) {
	for (const trigger of [...i]) trigger(element);
}

class TT {
	constructor() {
		((this._hooks = {}),
			(this._before = void 0),
			(this._after = void 0),
			(this._deprecatedMessages = void 0),
			(this._deprecatedHooks = {}),
			(this.hook = this.hook.bind(this)),
			(this.callHook = this.callHook.bind(this)),
			(this.callHookWith = this.callHookWith.bind(this)));
	}
	
	hook(element, trigger, start = {}) {
		if (!element || typeof trigger != "function") return () => {
		};
		const end = element;
		let a;
		for (; this._deprecatedHooks[element];)
			((a = this._deprecatedHooks[element]), (element = a.to));
		if (a && !start.allowDeprecated) {
			let o = a.message;
			(o ||
			(o =
				`${end} hook has been deprecated` +
				(a.to ? `, please use ${a.to}` : "")),
			this._deprecatedMessages || (this._deprecatedMessages = new Set()),
			this._deprecatedMessages.has(o) || this._deprecatedMessages.add(o));
		}
		if (!trigger.name)
			try {
				Object.defineProperty(trigger, "name", {
					get: () => "_" + element.replace(/\W+/g, "_") + "_hook_cb",
					configurable: !0,
				});
			} catch {
			}
		return (
			(this._hooks[element] = this._hooks[element] || []),
				this._hooks[element].push(trigger),
				() => {
					trigger && (this.removeHook(element, trigger), (trigger = void 0));
				}
		);
	}
	
	hookOnce(element, trigger) {
		let start,
			end = (...a) => (
				typeof start == "function" && start(),
					(start = void 0),
					(end = void 0),
					trigger(...a)
			);
		return ((start = this.hook(element, end)), start);
	}
	
	removeHook(element, trigger) {
		if (this._hooks[element]) {
			const start = this._hooks[element].indexOf(trigger);
			(start !== -1 && this._hooks[element].splice(start, 1),
			this._hooks[element].length === 0 && delete this._hooks[element]);
		}
	}
	
	deprecateHook(element, trigger) {
		this._deprecatedHooks[element] =
			typeof trigger == "string"
				? {
					to: trigger,
				}
				: trigger;
		const start = this._hooks[element] || [];
		delete this._hooks[element];
		for (const end of start) this.hook(element, end);
	}
	
	deprecateHooks(element) {
		Object.assign(this._deprecatedHooks, element);
		for (const trigger in element)
			this.deprecateHook(trigger, element[trigger]);
	}
	
	addHooks(element) {
		const trigger = Bf(element),
			start = Object.keys(trigger).map((end) => this.hook(end, trigger[end]));
		return () => {
			for (const end of start.splice(0, start.length)) end();
		};
	}
	
	removeHooks(element) {
		const trigger = Bf(element);
		for (const start in trigger) this.removeHook(start, trigger[start]);
	}
	
	removeAllHooks() {
		for (const element in this._hooks) delete this._hooks[element];
	}
	
	callHook(element, ...trigger) {
		return (
			trigger.unshift(element),
				this.callHookWith(ET, element, ...trigger)
		);
	}
	
	callHookParallel(element, ...trigger) {
		return (
			trigger.unshift(element),
				this.callHookWith(ST, element, ...trigger)
		);
	}
	
	callHookWith(element, trigger, ...start) {
		const end =
			this._before || this._after
				? {
					name: trigger,
					args: start,
					context: {},
				}
				: void 0;
		this._before && _d(this._before, end);
		const a = element(
			trigger in this._hooks ? [...this._hooks[trigger]] : [],
			start,
		);
		return a instanceof Promise
			? a.finally(() => {
				this._after && end && _d(this._after, end);
			})
			: (this._after && end && _d(this._after, end), a);
	}
	
	beforeEach(element) {
		return (
			(this._before = this._before || []),
				this._before.push(element),
				() => {
					if (this._before !== void 0) {
						const trigger = this._before.indexOf(element);
						trigger !== -1 && this._before.splice(trigger, 1);
					}
				}
		);
	}
	
	afterEach(element) {
		return (
			(this._after = this._after || []),
				this._after.push(element),
				() => {
					if (this._after !== void 0) {
						const trigger = this._after.indexOf(element);
						trigger !== -1 && this._after.splice(trigger, 1);
					}
				}
		);
	}
}

function sy() {
	return new TT();
}

function MT(i = {}) {
	let element,
		trigger = !1;
	const start = (o) => {
		if (element && element !== o) throw new Error("Context conflict");
	};
	let end;
	if (i.asyncContext) {
		const o = i.AsyncLocalStorage || globalThis.AsyncLocalStorage;
		o && (end = new o());
	}
	const a = () => {
		if (end && element === void 0) {
			const o = end.getStore();
			if (o !== void 0) return o;
		}
		return element;
	};
	return {
		use: () => {
			const o = a();
			if (o === void 0) throw new Error("Context is not available");
			return o;
		},
		tryUse: () => a(),
		set: (o, l) => {
			(l || start(o), (element = o), (trigger = !0));
		},
		unset: () => {
			((element = void 0), (trigger = !1));
		},
		call: (o, l) => {
			(start(o), (element = o));
			try {
				return end ? end.run(o, l) : l();
			} finally {
				trigger || (element = void 0);
			}
		},
		async callAsync(o, l) {
			element = o;
			const c = () => {
					element = o;
				},
				h = () => (element === o ? c : void 0);
			Gf.add(h);
			try {
				const u = end ? end.run(o, l) : l();
				return (trigger || (element = void 0), await u);
			} finally {
				Gf.delete(h);
			}
		},
	};
}

function RT(i = {}) {
	const element = {};
	return {
		get(trigger, start = {}) {
			return (
				element[trigger] ||
				(element[trigger] = MT({
					...i,
					...start,
				})),
					element[trigger],
					element[trigger]
			);
		},
	};
}

const nu =
		typeof globalThis < "u"
			? globalThis
			: typeof self < "u"
				? self
				: typeof global < "u"
					? global
					: typeof window < "u"
						? window
						: {},
	c_ = "__unctx__",
	AT = nu[c_] || (nu[c_] = RT()),
	CT = (i, element = {}) => AT.get(i, element),
	h_ = "__unctx_async_handlers__",
	Gf = nu[h_] || (nu[h_] = new Set());

function Fl(i) {
	const element = [];
	for (const end of Gf) {
		const a = end();
		a && element.push(a);
	}
	const trigger = () => {
		for (const end of element) end();
	};
	let start = i();
	return (
		start &&
		typeof start == "object" &&
		"catch" in start &&
		(start = start.catch((end) => {
			throw (trigger(), end);
		})),
			[start, trigger]
	);
}

const ny = CT("nuxt-app", {
		asyncContext: !1,
	}),
	PT = "__nuxt_plugin";

function LT(i) {
	let element = 0;
	const trigger = {
		_scope: mw(),
		provide: void 0,
		globalName: "nuxt",
		versions: {
			get nuxt() {
				return "3.8.2";
			},
			get vue() {
				return trigger.vueApp.version;
			},
		},
		payload: Dn({
			data: {},
			state: {},
			_errors: {},
			...(window.__NUXT__ ?? {}),
		}),
		static: {
			data: {},
		},
		runWithContext: (end) => trigger._scope.run(() => NT(trigger, end)),
		isHydrating: !0,
		deferHydration() {
			if (!trigger.isHydrating) return () => {
			};
			element++;
			let end = !1;
			return () => {
				if (!end && ((end = !0), element--, element === 0))
					return (
						(trigger.isHydrating = !1),
							trigger.callHook("app:suspense:resolve")
					);
			};
		},
		_asyncDataPromises: {},
		_asyncData: {},
		_payloadRevivers: {},
		...i,
	};
	((trigger.hooks = sy()),
		(trigger.hook = trigger.hooks.hook),
		(trigger.callHook = trigger.hooks.callHook),
		(trigger.provide = (end, a) => {
			const o = "$" + end;
			(Ic(trigger, o, a), Ic(trigger.vueApp.config.globalProperties, o, a));
		}),
		Ic(trigger.vueApp, "$nuxt", trigger),
		Ic(trigger.vueApp.config.globalProperties, "$nuxt", trigger));
	{
		(window.addEventListener("nuxt.preloadError", (a) => {
			trigger.callHook("app:chunkError", {
				error: a.payload,
			});
		}),
			(window.useNuxtApp = window.useNuxtApp || bt));
		const end = trigger.hook("app:error", (...a) => {
			[...a];
		});
		trigger.hook("app:mounted", end);
	}
	const start = Dn(trigger.payload.config);
	return (trigger.provide("config", start), trigger);
}

async function IT(i, element) {
	if (
		(element.hooks && i.hooks.addHooks(element.hooks),
		typeof element == "function")
	) {
		const {provide: trigger} =
		(await i.runWithContext(() => element(i))) || {};
		if (trigger && typeof trigger == "object")
			for (const start in trigger) i.provide(start, trigger[start]);
	}
}

async function OT(i, element) {
	const trigger = [],
		start = [];
	for (const end of element) {
		const a = IT(i, end);
		end.parallel ? trigger.push(a.catch((o) => start.push(o))) : await a;
	}
	if ((await Promise.all(trigger), start.length)) throw start[0];
}

/*! @__NO_SIDE_EFFECTS__ */
function Pr(i) {
	return typeof i == "function"
		? i
		: (delete i.name,
			Object.assign(i.setup || (() => {
			}), i, {
				[PT]: !0,
			}));
}

function NT(i, element, trigger) {
	const start = () => (trigger ? element(...trigger) : element());
	return (ny.set(i), i.vueApp.runWithContext(start));
}

/*! @__NO_SIDE_EFFECTS__ */
function bt() {
	var element;
	let i;
	if (
		(Ax() &&
		(i = (element = Bu()) == null ? void 0 : element.appContext.app.$nuxt),
			(i = i || ny.tryUse()),
			!i)
	)
		throw new Error("[nuxt] instance unavailable");
	return i;
}

/*! @__NO_SIDE_EFFECTS__ */
function uc() {
	return bt().$config;
}

function Ic(i, element, trigger) {
	Object.defineProperty(i, element, {
		get: () => trigger,
	});
}

const DT = "modulepreload",
	UT = function (i, element) {
		return i[0] === "." ? new URL(i, element).href : i;
	},
	u_ = {},
	FT = function (element, trigger, start) {
		if (!trigger || trigger.length === 0) return element();
		const end = document.getElementsByTagName("link");
		return Promise.all(
				trigger.map((a) => {
					if (((a = UT(a, start)), a in u_)) return;
					u_[a] = !0;
					const o = a.endsWith(".css"),
						l = o ? '[rel="stylesheet"]' : "";
					if (!!start)
						for (let u = end.length - 1; u >= 0; u--) {
							const d = end[u];
							if (d.href === a && (!o || d.rel === "stylesheet")) return;
						}
					else if (document.querySelector(`link[href="${a}"]${l}`)) return;
					const h = document.createElement("link");
					if (
						((h.rel = o ? "stylesheet" : DT),
						o || ((h.as = "script"), (h.crossOrigin = "")),
							(h.href = a),
							document.head.appendChild(h),
							o)
					)
						return new Promise((u, d) => {
							(h.addEventListener("load", u),
								h.addEventListener("error", () =>
									d(new Error(`Unable to preload CSS for ${a}`)),
								));
						});
				}),
			)
			.then(() => element())
			.catch((a) => {
				const o = new Event("vite:preloadError", {
					cancelable: !0,
				});
				if (((o.payload = a), window.dispatchEvent(o), !o.defaultPrevented))
					throw a;
			});
	},
	Sn = (...i) =>
		FT(...i).catch((element) => {
			const trigger = new Event("nuxt.preloadError");
			throw (
				(trigger.payload = element),
					window.dispatchEvent(trigger),
					element
			);
		}),
	kT = -1,
	BT = -2,
	GT = -3,
	HT = -4,
	zT = -5,
	WT = -6;

function jT(i, element) {
	return VT(JSON.parse(i), element);
}

function VT(i, element) {
	if (typeof i == "number") return end(i, !0);
	if (!Array.isArray(i) || i.length === 0) throw new Error("Invalid input");
	const trigger = i,
		start = Array(trigger.length);
	
	function end(a, o = !1) {
		if (a === kT) return;
		if (a === GT) return NaN;
		if (a === HT) return 1 / 0;
		if (a === zT) return -1 / 0;
		if (a === WT) return -0;
		if (o) throw new Error("Invalid input");
		if (a in start) return start[a];
		const l = trigger[a];
		if (!l || typeof l != "object") start[a] = l;
		else if (Array.isArray(l))
			if (typeof l[0] == "string") {
				const c = l[0],
					h = element == null ? void 0 : element[c];
				if (h) return (start[a] = h(end(l[1])));
				switch (c) {
					case "Date":
						start[a] = new Date(l[1]);
						break;
					case "Set":
						const u = new Set();
						start[a] = u;
						for (let p = 1; p < l.length; p += 1) u.add(end(l[p]));
						break;
					case "Map":
						const d = new Map();
						start[a] = d;
						for (let p = 1; p < l.length; p += 2)
							d.set(end(l[p]), end(l[p + 1]));
						break;
					case "RegExp":
						start[a] = new RegExp(l[1], l[2]);
						break;
					case "Object":
						start[a] = Object(l[1]);
						break;
					case "BigInt":
						start[a] = BigInt(l[1]);
						break;
					case "null":
						const f = Object.create(null);
						start[a] = f;
						for (let p = 1; p < l.length; p += 2) f[l[p]] = end(l[p + 1]);
						break;
					default:
						throw new Error(`Unknown type ${c}`);
				}
			} else {
				const c = new Array(l.length);
				start[a] = c;
				for (let h = 0; h < l.length; h += 1) {
					const u = l[h];
					u !== BT && (c[h] = end(u));
				}
			}
		else {
			const c = {};
			start[a] = c;
			for (const h in l) {
				const u = l[h];
				c[h] = end(u);
			}
		}
		return start[a];
	}
	
	return end(0);
}

function qT(i) {
	return Array.isArray(i) ? i : [i];
}

const XT = ["title", "titleTemplate", "script", "style", "noscript"],
	Mh = ["base", "meta", "link", "style", "script", "noscript"],
	$T = [
		"title",
		"titleTemplate",
		"templateParams",
		"base",
		"htmlAttrs",
		"bodyAttrs",
		"meta",
		"link",
		"style",
		"script",
		"noscript",
	],
	YT = [
		"base",
		"title",
		"titleTemplate",
		"bodyAttrs",
		"htmlAttrs",
		"templateParams",
	],
	ry = [
		"tagPosition",
		"tagPriority",
		"tagDuplicateStrategy",
		"children",
		"innerHTML",
		"textContent",
		"processTemplateParams",
	],
	KT = typeof window < "u";

function Am(i) {
	let element = 9;
	for (let trigger = 0; trigger < i.length;)
		element = Math.imul(element ^ i.charCodeAt(trigger++), 9 ** 9);
	return ((element ^ (element >>> 9)) + 65536)
		.toString(16)
		.substring(1, 8)
		.toLowerCase();
}

function d_(i) {
	return (
		i._h ||
		Am(
			i._d
				? i._d
				: `${i.tag}:${i.textContent || i.innerHTML || ""}:${Object.entries(
						i.props,
					)
					.map(([element, trigger]) => `${element}:${String(trigger)}`)
					.join(",")}`,
		)
	);
}

function ay(i, element) {
	const {props: trigger, tag: start} = i;
	if (YT.includes(start)) return start;
	if (start === "link" && trigger.rel === "canonical") return "canonical";
	if (trigger.charset) return "charset";
	const end = ["id"];
	start === "meta" && end.push("name", "property", "http-equiv");
	for (const a of end)
		if (typeof trigger[a] < "u") {
			const o = String(trigger[a]);
			return element && !element(o) ? !1 : `${start}:${a}:${o}`;
		}
	return !1;
}

function f_(i, element) {
	return i == null ? element || null : typeof i == "function" ? i(element) : i;
}

async function ZT(i, element, trigger) {
	const start = {
		tag: i,
		props: await oy(
			typeof element == "object" &&
			typeof element != "function" &&
			!(element instanceof Promise)
				? {
					...element,
				}
				: {
					[["script", "noscript", "style"].includes(i)
						? "innerHTML"
						: "textContent"]: element,
				},
			["templateParams", "titleTemplate"].includes(i),
		),
	};
	return (
		ry.forEach((end) => {
			const a = typeof start.props[end] < "u" ? start.props[end] : trigger[end];
			typeof a < "u" &&
			((!["innerHTML", "textContent", "children"].includes(end) ||
				XT.includes(start.tag)) &&
			(start[end === "children" ? "innerHTML" : end] = a),
				delete start.props[end]);
		}),
		start.props.body &&
		((start.tagPosition = "bodyClose"), delete start.props.body),
		start.tag === "script" &&
		typeof start.innerHTML == "object" &&
		((start.innerHTML = JSON.stringify(start.innerHTML)),
			(start.props.type = start.props.type || "application/json")),
			Array.isArray(start.props.content)
				? start.props.content.map((end) => ({
					...start,
					props: {
						...start.props,
						content: end,
					},
				}))
				: start
	);
}

function JT(i) {
	return (
		typeof i == "object" &&
		!Array.isArray(i) &&
		(i = Object.keys(i).filter((element) => i[element])),
			(Array.isArray(i) ? i.join(" ") : i)
				.split(" ")
				.filter((element) => element.trim())
				.filter(Boolean)
				.join(" ")
	);
}

async function oy(i, element) {
	for (const trigger of Object.keys(i)) {
		if (trigger === "class") {
			i[trigger] = JT(i[trigger]);
			continue;
		}
		if (
			(i[trigger] instanceof Promise && (i[trigger] = await i[trigger]),
			!element && !ry.includes(trigger))
		) {
			const start = String(i[trigger]),
				end = trigger.startsWith("data-");
			start === "true" || start === ""
				? (i[trigger] = end ? "true" : !0)
				: i[trigger] ||
				(end && start === "false"
					? (i[trigger] = "false")
					: delete i[trigger]);
		}
	}
	return i;
}

const QT = 10;

async function eM(i) {
	const element = [];
	return (
		Object.entries(i.resolvedInput)
			.filter(([trigger, start]) => typeof start < "u" && $T.includes(trigger))
			.forEach(([trigger, start]) => {
				const end = qT(start);
				element.push(...end.map((a) => ZT(trigger, a, i)).flat());
			}),
			(await Promise.all(element))
				.flat()
				.filter(Boolean)
				.map(
					(trigger, start) => (
						(trigger._e = i._i),
						i.mode && (trigger._m = i.mode),
							(trigger._p = (i._i << QT) + start),
							trigger
					),
				)
	);
}

const p_ = {
		base: -10,
		title: 10,
	},
	m_ = {
		critical: -80,
		high: -10,
		low: 20,
	};

function ru(i) {
	let element = 100;
	const trigger = i.tagPriority;
	return typeof trigger == "number"
		? trigger
		: (i.tag === "meta"
			? (i.props["http-equiv"] === "content-security-policy" &&
			(element = -30),
			i.props.charset && (element = -20),
			i.props.name === "viewport" && (element = -15))
			: i.tag === "link" && i.props.rel === "preconnect"
				? (element = 20)
				: i.tag in p_ && (element = p_[i.tag]),
			typeof trigger == "string" && trigger in m_
				? element + m_[trigger]
				: element);
}

const tM = [
		{
			prefix: "before:",
			offset: -1,
		},
		{
			prefix: "after:",
			offset: 1,
		},
	],
	ly = ["onload", "onerror", "onabort", "onprogress", "onloadstart"],
	Yn = "%separator";

function Rh(i, element, trigger) {
	if (typeof i != "string" || !i.includes("%")) return i;
	
	function start(o) {
		let l;
		return (
			["s", "pageTitle"].includes(o)
				? (l = element.pageTitle)
				: o.includes(".")
					? (l = o.split(".").reduce((c, h) => (c && c[h]) || void 0, element))
					: (l = element[o]),
				typeof l < "u" ? (l || "").replace(/"/g, '\\"') : !1
		);
	}
	
	let end = i;
	try {
		end = decodeURI(i);
	} catch {
	}
	return (
		(end.match(/%(\w+\.+\w+)|%(\w+)/g) || [])
			.sort()
			.reverse()
			.forEach((o) => {
				const l = start(o.slice(1));
				typeof l == "string" &&
				(i = i
					.replace(new RegExp(`\\${o}(\\W|$)`, "g"), (c, h) => `${l}${h}`)
					.trim());
			}),
		i.includes(Yn) &&
		(i.endsWith(Yn) && (i = i.slice(0, -Yn.length).trim()),
		i.startsWith(Yn) && (i = i.slice(Yn.length).trim()),
			(i = i.replace(new RegExp(`\\${Yn}\\s*\\${Yn}`, "g"), Yn)),
			(i = Rh(
				i,
				{
					separator: trigger,
				},
				trigger,
			))),
			i
	);
}

async function iM(i) {
	const element = {
		tag: i.tagName.toLowerCase(),
		props: await oy(
			i.getAttributeNames().reduce(
				(trigger, start) => ({
					...trigger,
					[start]: i.getAttribute(start),
				}),
				{},
			),
		),
		innerHTML: i.innerHTML,
	};
	return ((element._d = ay(element)), element);
}

async function cy(i, element = {}) {
	var u;
	const trigger = element.document || i.resolvedOptions.document;
	if (!trigger) return;
	const start = {
		shouldRender: i.dirty,
		tags: [],
	};
	if ((await i.hooks.callHook("dom:beforeRender", start), !start.shouldRender))
		return;
	const end = (await i.resolveTags()).map((d) => ({
		tag: d,
		id: Mh.includes(d.tag) ? d_(d) : d.tag,
		shouldRender: !0,
	}));
	let a = i._dom;
	if (!a) {
		a = {
			elMap: {
				htmlAttrs: trigger.documentElement,
				bodyAttrs: trigger.body,
			},
		};
		for (const d of ["body", "head"]) {
			const f =
				(u = trigger == null ? void 0 : trigger[d]) == null
					? void 0
					: u.children;
			for (const p of [...f].filter((_) =>
				Mh.includes(_.tagName.toLowerCase()),
			))
				a.elMap[p.getAttribute("data-hid") || d_(await iM(p))] = p;
		}
	}
	((a.pendingSideEffects = {
		...(a.sideEffects || {}),
	}),
		(a.sideEffects = {}));
	
	function o(d, f, p) {
		const _ = `${d}:${f}`;
		((a.sideEffects[_] = p), delete a.pendingSideEffects[_]);
	}
	
	function l({id: d, $el: f, tag: p}) {
		const _ = p.tag.endsWith("Attrs");
		((a.elMap[d] = f),
		_ ||
		(["textContent", "innerHTML"].forEach((m) => {
			p[m] && p[m] !== f[m] && (f[m] = p[m]);
		}),
			o(d, "el", () => {
				(a.elMap[d].remove(), delete a.elMap[d]);
			})),
			Object.entries(p.props).forEach(([m, g]) => {
				const b = `attr:${m}`;
				if (m === "class")
					for (const x of (g || "").split(" ").filter(Boolean))
						(_ && o(d, `${b}:${x}`, () => f.classList.remove(x)),
						!f.classList.contains(x) && f.classList.add(x));
				else
					(f.getAttribute(m) !== g &&
					f.setAttribute(m, g === !0 ? "" : String(g)),
					_ && o(d, b, () => f.removeAttribute(m)));
			}));
	}
	
	const c = [],
		h = {
			bodyClose: void 0,
			bodyOpen: void 0,
			head: void 0,
		};
	for (const d of end) {
		const {tag: f, shouldRender: p, id: _} = d;
		if (p) {
			if (f.tag === "title") {
				trigger.title = f.textContent;
				continue;
			}
			((d.$el = d.$el || a.elMap[_]),
				d.$el ? l(d) : Mh.includes(f.tag) && c.push(d));
		}
	}
	for (const d of c) {
		const f = d.tag.tagPosition || "head";
		((d.$el = trigger.createElement(d.tag.tag)),
			l(d),
			(h[f] = h[f] || trigger.createDocumentFragment()),
			h[f].appendChild(d.$el));
	}
	for (const d of end) await i.hooks.callHook("dom:renderTag", d, trigger, o);
	(h.head && trigger.head.appendChild(h.head),
	h.bodyOpen &&
	trigger.body.insertBefore(h.bodyOpen, trigger.body.firstChild),
	h.bodyClose && trigger.body.appendChild(h.bodyClose),
		Object.values(a.pendingSideEffects).forEach((d) => d()),
		(i._dom = a),
		(i.dirty = !1),
		await i.hooks.callHook("dom:rendered", {
			renders: end,
		}));
}

async function sM(i, element = {}) {
	const trigger = element.delayFn || ((start) => setTimeout(start, 10));
	return (i._domUpdatePromise =
		i._domUpdatePromise ||
		new Promise((start) =>
			trigger(async () => {
				(await cy(i, element), delete i._domUpdatePromise, start());
			}),
		));
}

function nM(i) {
	return (element) => {
		var start, end;
		const trigger =
			((end =
				(start = element.resolvedOptions.document) == null
					? void 0
					: start.head.querySelector('script[id="unhead:payload"]')) == null
				? void 0
				: end.innerHTML) || !1;
		return (
			trigger && element.push(JSON.parse(trigger)),
				{
					mode: "client",
					hooks: {
						"entries:updated": function (a) {
							sM(a, i);
						},
					},
				}
		);
	};
}

const rM = ["templateParams", "htmlAttrs", "bodyAttrs"],
	aM = {
		hooks: {
			"tag:normalise": function ({tag: i}) {
				["hid", "vmid", "key"].forEach((start) => {
					i.props[start] && ((i.key = i.props[start]), delete i.props[start]);
				});
				const trigger = ay(i) || (i.key ? `${i.tag}:${i.key}` : !1);
				trigger && (i._d = trigger);
			},
			"tags:resolve": function (i) {
				const element = {};
				i.tags.forEach((start) => {
					const end =
							(start.key ? `${start.tag}:${start.key}` : start._d) || start._p,
						a = element[end];
					if (a) {
						let l = start == null ? void 0 : start.tagDuplicateStrategy;
						if (
							(!l && rM.includes(start.tag) && (l = "merge"), l === "merge")
						) {
							const c = a.props;
							(["class", "style"].forEach((h) => {
								c[h] &&
								(start.props[h]
									? (h === "style" && !c[h].endsWith(";") && (c[h] += ";"),
										(start.props[h] = `${c[h]} ${start.props[h]}`))
									: (start.props[h] = c[h]));
							}),
								(element[end].props = {
									...c,
									...start.props,
								}));
							return;
						} else if (start._e === a._e) {
							((a._duped = a._duped || []),
								(start._d = `${a._d}:${a._duped.length + 1}`),
								a._duped.push(start));
							return;
						} else if (ru(start) > ru(a)) return;
					}
					const o =
						Object.keys(start.props).length +
						(start.innerHTML ? 1 : 0) +
						(start.textContent ? 1 : 0);
					if (Mh.includes(start.tag) && o === 0) {
						delete element[end];
						return;
					}
					element[end] = start;
				});
				const trigger = [];
				(Object.values(element).forEach((start) => {
					const end = start._duped;
					(delete start._duped,
						trigger.push(start),
					end && trigger.push(...end));
				}),
					(i.tags = trigger),
					(i.tags = i.tags.filter(
						(start) =>
							!(
								start.tag === "meta" &&
								(start.props.name || start.props.property) &&
								!start.props.content
							),
					)));
			},
		},
	},
	oM = {
		mode: "server",
		hooks: {
			"tags:resolve": function (i) {
				const element = {};
				(i.tags
					.filter(
						(trigger) =>
							["titleTemplate", "templateParams", "title"].includes(
								trigger.tag,
							) && trigger._m === "server",
					)
					.forEach((trigger) => {
						element[trigger.tag] = trigger.tag.startsWith("title")
							? trigger.textContent
							: trigger.props;
					}),
				Object.keys(element).length &&
				i.tags.push({
					tag: "script",
					innerHTML: JSON.stringify(element),
					props: {
						id: "unhead:payload",
						type: "application/json",
					},
				}));
			},
		},
	},
	lM = ["script", "link", "bodyAttrs"];

function cM(i) {
	const element = {},
		trigger = {};
	return (
		Object.entries(i.props).forEach(([start, end]) => {
			start.startsWith("on") && typeof end == "function"
				? (ly.includes(start) &&
				(element[start] = `this.dataset.${start} = true`),
					(trigger[start] = end))
				: (element[start] = end);
		}),
			{
				props: element,
				eventHandlers: trigger,
			}
	);
}

const hM = (i) => ({
		hooks: {
			"tags:resolve": function (element) {
				for (const trigger of element.tags)
					if (lM.includes(trigger.tag)) {
						const {props: start, eventHandlers: end} = cM(trigger);
						((trigger.props = start),
						Object.keys(end).length &&
						((trigger.props.src || trigger.props.href) &&
						(trigger.key =
							trigger.key || Am(trigger.props.src || trigger.props.href)),
							(trigger._eventHandlers = end)));
					}
			},
			"dom:renderTag": function (element, trigger, start) {
				if (!element.tag._eventHandlers) return;
				const end =
					element.tag.tag === "bodyAttrs" ? trigger.defaultView : element.$el;
				Object.entries(element.tag._eventHandlers).forEach(([a, o]) => {
					const l = `${element.tag._d || element.tag._p}:${a}`,
						c = a.slice(2).toLowerCase(),
						h = `data-h-${c}`;
					if ((start(element.id, l, () => {
					}), element.$el.hasAttribute(h)))
						return;
					element.$el.setAttribute(h, "");
					let u;
					const d = (f) => {
						(o(f), u == null || u.disconnect());
					};
					(a in element.$el.dataset
						? d(new Event(a.replace("on", "")))
						: ly.includes(a) && typeof MutationObserver < "u"
							? ((u = new MutationObserver((f) => {
								f.some((_) => _.attributeName === `data-${a}`) &&
								(d(new Event(a.replace("on", ""))),
								u == null || u.disconnect());
							})),
								u.observe(element.$el, {
									attributes: !0,
								}))
							: end.addEventListener(c, d),
						start(element.id, l, () => {
							(u == null || u.disconnect(),
								end.removeEventListener(c, d),
								element.$el.removeAttribute(h));
						}));
				});
			},
		},
	}),
	uM = ["link", "style", "script", "noscript"],
	dM = {
		hooks: {
			"tag:normalise": ({tag: i}) => {
				i.key && uM.includes(i.tag) && (i.props["data-hid"] = i._h = Am(i.key));
			},
		},
	},
	fM = {
		hooks: {
			"tags:resolve": (i) => {
				const element = (trigger) => {
					var start;
					return (start = i.tags.find((end) => end._d === trigger)) == null
						? void 0
						: start._p;
				};
				for (const {prefix: trigger, offset: start} of tM)
					for (const end of i.tags.filter(
						(a) =>
							typeof a.tagPriority == "string" &&
							a.tagPriority.startsWith(trigger),
					)) {
						const a = element(end.tagPriority.replace(trigger, ""));
						typeof a < "u" && (end._p = a + start);
					}
				i.tags
					.sort((trigger, start) => trigger._p - start._p)
					.sort((trigger, start) => ru(trigger) - ru(start));
			},
		},
	},
	pM = {
		meta: "content",
		link: "href",
		htmlAttrs: "lang",
	},
	mM = (i) => ({
		hooks: {
			"tags:resolve": (element) => {
				var l;
				const {tags: trigger} = element,
					start =
						(l = trigger.find((c) => c.tag === "title")) == null
							? void 0
							: l.textContent,
					end = trigger.findIndex((c) => c.tag === "templateParams"),
					a = end !== -1 ? trigger[end].props : {},
					o = a.separator || "|";
				(delete a.separator,
					(a.pageTitle = Rh(a.pageTitle || start || "", a, o)));
				for (const c of trigger.filter((h) => h.processTemplateParams !== !1)) {
					const h = pM[c.tag];
					h && typeof c.props[h] == "string"
						? (c.props[h] = Rh(c.props[h], a, o))
						: (c.processTemplateParams === !0 ||
							["titleTemplate", "title"].includes(c.tag)) &&
						["innerHTML", "textContent"].forEach((u) => {
							typeof c[u] == "string" && (c[u] = Rh(c[u], a, o));
						});
				}
				((i._templateParams = a),
					(i._separator = o),
					(element.tags = trigger.filter((c) => c.tag !== "templateParams")));
			},
		},
	}),
	gM = {
		hooks: {
			"tags:resolve": (i) => {
				const {tags: element} = i;
				let trigger = element.findIndex((end) => end.tag === "titleTemplate");
				const start = element.findIndex((end) => end.tag === "title");
				if (start !== -1 && trigger !== -1) {
					const end = f_(
						element[trigger].textContent,
						element[start].textContent,
					);
					end !== null
						? (element[start].textContent = end || element[start].textContent)
						: delete element[start];
				} else if (trigger !== -1) {
					const end = f_(element[trigger].textContent);
					end !== null &&
					((element[trigger].textContent = end),
						(element[trigger].tag = "title"),
						(trigger = -1));
				}
				(trigger !== -1 && delete element[trigger],
					(i.tags = element.filter(Boolean)));
			},
		},
	},
	_M = {
		hooks: {
			"tags:afterResolve": function (i) {
				for (const element of i.tags)
					typeof element.innerHTML == "string" &&
					(element.innerHTML &&
					["application/ld+json", "application/json"].includes(
						element.props.type,
					)
						? (element.innerHTML = element.innerHTML.replace(/</g, "\\u003C"))
						: (element.innerHTML = element.innerHTML.replace(
							new RegExp(`</${element.tag}`, "g"),
							`<\\/${element.tag}`,
						)));
			},
		},
	};
let hy;

function vM(i = {}) {
	const element = xM(i);
	return (element.use(nM()), (hy = element));
}

function g_(i, element) {
	return !i || (i === "server" && element) || (i === "client" && !element);
}

function xM(i = {}) {
	const element = sy();
	(element.addHooks(i.hooks || {}),
		(i.document = i.document || (KT ? document : void 0)));
	const trigger = !i.document,
		start = () => {
			((l.dirty = !0), element.callHook("entries:updated", l));
		};
	let end = 0,
		a = [];
	const o = [],
		l = {
			plugins: o,
			dirty: !1,
			resolvedOptions: i,
			hooks: element,
			headEntries() {
				return a;
			},
			use(c) {
				const h = typeof c == "function" ? c(l) : c;
				(!h.key || !o.some((u) => u.key === h.key)) &&
				(o.push(h), g_(h.mode, trigger) && element.addHooks(h.hooks || {}));
			},
			push(c, h) {
				h == null || delete h.head;
				const u = {
					_i: end++,
					input: c,
					...h,
				};
				return (
					g_(u.mode, trigger) && (a.push(u), start()),
						{
							dispose() {
								((a = a.filter((d) => d._i !== u._i)),
									element.callHook("entries:updated", l),
									start());
							},
							patch(d) {
								((a = a.map(
									(f) => (f._i === u._i && (f.input = u.input = d), f),
								)),
									start());
							},
						}
				);
			},
			async resolveTags() {
				const c = {
					tags: [],
					entries: [...a],
				};
				await element.callHook("entries:resolve", c);
				for (const h of c.entries) {
					const u = h.resolvedInput || h.input;
					if (
						((h.resolvedInput = await (h.transform ? h.transform(u) : u)),
							h.resolvedInput)
					)
						for (const d of await eM(h)) {
							const f = {
								tag: d,
								entry: h,
								resolvedOptions: l.resolvedOptions,
							};
							(await element.callHook("tag:normalise", f), c.tags.push(f.tag));
						}
				}
				return (
					await element.callHook("tags:beforeResolve", c),
						await element.callHook("tags:resolve", c),
						await element.callHook("tags:afterResolve", c),
						c.tags
				);
			},
			ssr: trigger,
		};
	return (
		[
			aM,
			oM,
			hM,
			dM,
			fM,
			mM,
			gM,
			_M,
			...((i == null ? void 0 : i.plugins) || []),
		].forEach((c) => l.use(c)),
			l.hooks.callHook("init", l),
			l
	);
}

function yM() {
	return hy;
}

const bM = qx.startsWith("3");

function wM(i) {
	return typeof i == "function" ? i() : Ve(i);
}

function au(i, element = "") {
	if (i instanceof Promise) return i;
	const trigger = wM(i);
	return !i || !trigger
		? trigger
		: Array.isArray(trigger)
			? trigger.map((start) => au(start, element))
			: typeof trigger == "object"
				? Object.fromEntries(
					Object.entries(trigger).map(([start, end]) =>
						start === "titleTemplate" || start.startsWith("on")
							? [start, Ve(end)]
							: [start, au(end, start)],
					),
				)
				: trigger;
}

const EM = {
		hooks: {
			"entries:resolve": function (i) {
				for (const element of i.entries)
					element.resolvedInput = au(element.input);
			},
		},
	},
	uy = "usehead";

function SM(i) {
	return {
		install(trigger) {
			bM &&
			((trigger.config.globalProperties.$unhead = i),
				(trigger.config.globalProperties.$head = i),
				trigger.provide(uy, i));
		},
	}.install;
}

function TM(i = {}) {
	i.domDelayFn =
		i.domDelayFn || ((trigger) => Ma(() => setTimeout(() => trigger(), 0)));
	const element = vM(i);
	return (element.use(EM), (element.install = SM(element)), element);
}

const Hf =
		typeof globalThis < "u"
			? globalThis
			: typeof window < "u"
				? window
				: typeof global < "u"
					? global
					: typeof self < "u"
						? self
						: {},
	zf = "__unhead_injection_handler__";

function MM(i) {
	Hf[zf] = i;
}

function RM() {
	if (zf in Hf) return Hf[zf]();
	const i = Ri(uy);
	return i || yM();
}

function AM(i, element = {}) {
	const trigger = element.head || RM();
	if (trigger)
		return trigger.ssr ? trigger.push(i, element) : CM(trigger, i, element);
}

function CM(i, element, trigger = {}) {
	const start = us(!1),
		end = us({});
	cE(() => {
		end.value = start.value ? {} : au(element);
	});
	const a = i.push(end.value, trigger);
	return (
		co(end, (l) => {
			a.patch(l);
		}),
		Bu() &&
		(oc(() => {
			a.dispose();
		}),
			yx(() => {
				start.value = !0;
			}),
			xx(() => {
				start.value = !1;
			})),
			a
	);
}

function PM(i) {
	return {
		ctx: {
			table: i,
		},
		matchAll: (element) => fy(element, i),
	};
}

function dy(i) {
	const element = {};
	for (const trigger in i)
		element[trigger] =
			trigger === "dynamic"
				? new Map(
					Object.entries(i[trigger]).map(([start, end]) => [start, dy(end)]),
				)
				: new Map(Object.entries(i[trigger]));
	return element;
}

function LM(i) {
	return PM(dy(i));
}

function fy(i, element) {
	const trigger = [];
	for (const [end, a] of __(element.wildcard))
		i.startsWith(end) && trigger.push(a);
	for (const [end, a] of __(element.dynamic))
		if (i.startsWith(end + "/")) {
			const o = "/" + i.slice(end.length).split("/").splice(2).join("/");
			trigger.push(...fy(o, a));
		}
	const start = element.static.get(i);
	return (start && trigger.push(start), trigger.filter(Boolean));
}

function __(i) {
	return [...i.entries()].sort(
		(element, trigger) => element[0].length - trigger[0].length,
	);
}

function vd(i) {
	if (i === null || typeof i != "object") return !1;
	const element = Object.getPrototypeOf(i);
	return (element !== null &&
		element !== Object.prototype &&
		Object.getPrototypeOf(element) !== null) ||
	Symbol.iterator in i
		? !1
		: Symbol.toStringTag in i
			? Object.prototype.toString.call(i) === "[object Module]"
			: !0;
}

function Wf(i, element, trigger = ".", start) {
	if (!vd(element)) return Wf(i, {}, trigger, start);
	const end = Object.assign({}, element);
	for (const a in i) {
		if (a === "__proto__" || a === "constructor") continue;
		const o = i[a];
		o != null &&
		((start && start(end, a, o, trigger)) ||
			(Array.isArray(o) && Array.isArray(end[a])
				? (end[a] = [...o, ...end[a]])
				: vd(o) && vd(end[a])
					? (end[a] = Wf(
						o,
						end[a],
						(trigger ? `${trigger}.` : "") + a.toString(),
						start,
					))
					: (end[a] = o)));
	}
	return end;
}

function py(i) {
	return (...element) =>
		element.reduce((trigger, start) => Wf(trigger, start, "", i), {});
}

const my = py(),
	IM = py((i, element, trigger) => {
		if (i[element] !== void 0 && typeof trigger == "function")
			return ((i[element] = trigger(i[element])), !0);
	});

function OM(i, element) {
	try {
		return element in i;
	} catch {
		return !1;
	}
}

var NM = Object.defineProperty,
	DM = (i, element, trigger) =>
		element in i
			? NM(i, element, {
				enumerable: !0,
				configurable: !0,
				writable: !0,
				value: trigger,
			})
			: (i[element] = trigger),
	jr = (i, element, trigger) => (
		DM(i, typeof element != "symbol" ? element + "" : element, trigger),
			trigger
	);

class jf extends Error {
	constructor(element, trigger = {}) {
		(super(element, trigger),
			jr(this, "statusCode", 500),
			jr(this, "fatal", !1),
			jr(this, "unhandled", !1),
			jr(this, "statusMessage"),
			jr(this, "data"),
			jr(this, "cause"),
		trigger.cause && !this.cause && (this.cause = trigger.cause));
	}
	
	toJSON() {
		const element = {
			message: this.message,
			statusCode: qf(this.statusCode, 500),
		};
		return (
			this.statusMessage && (element.statusMessage = gy(this.statusMessage)),
			this.data !== void 0 && (element.data = this.data),
				element
		);
	}
}

jr(jf, "__h3_error__", !0);

function Vf(i) {
	if (typeof i == "string") return new jf(i);
	if (UM(i)) return i;
	const element = new jf(i.message ?? i.statusMessage ?? "", {
		cause: i.cause || i,
	});
	if (OM(i, "stack"))
		try {
			Object.defineProperty(element, "stack", {
				get() {
					return i.stack;
				},
			});
		} catch {
			try {
				element.stack = i.stack;
			} catch {
			}
		}
	if (
		(i.data && (element.data = i.data),
			i.statusCode
				? (element.statusCode = qf(i.statusCode, element.statusCode))
				: i.status && (element.statusCode = qf(i.status, element.statusCode)),
			i.statusMessage
				? (element.statusMessage = i.statusMessage)
				: i.statusText && (element.statusMessage = i.statusText),
			element.statusMessage)
	) {
		const trigger = element.statusMessage,
			start = gy(element.statusMessage);
	}
	return (
		i.fatal !== void 0 && (element.fatal = i.fatal),
		i.unhandled !== void 0 && (element.unhandled = i.unhandled),
			element
	);
}

function UM(i) {
	var element;
	return (
		((element = i == null ? void 0 : i.constructor) == null
			? void 0
			: element.__h3_error__) === !0
	);
}

const FM = /[^\u0009\u0020-\u007E]/g;

function gy(i = "") {
	return i.replace(FM, "");
}

function qf(i, element = 200) {
	return !i ||
	(typeof i == "string" && (i = Number.parseInt(i, 10)), i < 100 || i > 999)
		? element
		: i;
}

const _y = Symbol("layout-meta"),
	dc = Symbol("route"),
	Hu = () => Ww(bt().payload, "error"),
	Qa = (i) => {
		const element = Cm(i);
		try {
			const trigger = bt(),
				start = Hu();
			(trigger.hooks.callHook("app:error", element),
				(start.value = start.value || element));
		} catch {
			throw element;
		}
		return element;
	},
	kM = async (i = {}) => {
		const element = bt(),
			trigger = Hu();
		(element.callHook("app:error:cleared", i),
		i.redirect && (await zn().replace(i.redirect)),
			(trigger.value = null));
	},
	BM = (i) => !!(i && typeof i == "object" && "__nuxt_error" in i),
	Cm = (i) => {
		const element = Vf(i);
		return ((element.__nuxt_error = !0), element);
	},
	zn = () => {
		var i;
		return (i = bt()) == null ? void 0 : i.$router;
	},
	Pm = () => (Ax() ? Ri(dc, bt()._route) : bt()._route);
/*! @__NO_SIDE_EFFECTS__ */
const GM = () => {
		try {
			if (bt()._processingMiddleware) return !0;
		} catch {
			return !0;
		}
		return !1;
	},
	HM = (i, element) => {
		i || (i = "/");
		const trigger =
			typeof i == "string"
				? i
				: Jx(i.path || "/", i.query || {}) + (i.hash || "");
		if (element != null && element.open) {
			{
				const {target: l = "_blank", windowFeatures: c = {}} = element.open,
					h = Object.entries(c)
						.filter(([u, d]) => d !== void 0)
						.map(([u, d]) => `${u.toLowerCase()}=${d}`)
						.join(", ");
				open(trigger, l, h);
			}
			return Promise.resolve();
		}
		const start =
			(element == null ? void 0 : element.external) ||
			No(trigger, {
				acceptRelative: !0,
			});
		if (start) {
			if (!(element != null && element.external))
				throw new Error(
					"Navigating to an external URL is not allowed by default. Use `navigateTo(url, { external: true })`.",
				);
			const l = hc(trigger).protocol;
			if (l && jS(l))
				throw new Error(`Cannot navigate to a URL with '${l}' protocol.`);
		}
		const end = GM();
		if (!start && end) return i;
		const a = zn(),
			o = bt();
		return start
			? (o._scope.stop(),
				element != null && element.replace
					? location.replace(trigger)
					: (location.href = trigger),
				end ? (o.isHydrating ? new Promise(() => {
				}) : !1) : Promise.resolve())
			: element != null && element.replace
				? a.replace(i)
				: a.push(i);
	},
	zM = {
		nuxt: {
			buildId: "6d985210-dec7-4d8a-928d-9a9918905360",
		},
	},
	WM = IM(zM);

function jM() {
	const i = bt();
	return (i._appConfig || (i._appConfig = Dn(WM)), i._appConfig);
}

const VM = !1,
	Xf = !1,
	qM = !1,
	XM = {
		componentName: "NuxtLink",
	},
	$M = "#__nuxt";
let Ah, vy;

function YM() {
	var element;
	const i = (element = jM().nuxt) == null ? void 0 : element.buildId;
	return (
		(Ah = $fetch(Mm(`builds/meta/${i}.json`))),
			Ah.then((trigger) => {
				vy = LM(trigger.matcher);
			}),
			Ah
	);
}

function zu() {
	return Ah || YM();
}

async function xy(i) {
	return (await zu(), my({}, ...vy.matchAll(i).reverse()));
}

function v_(i, element = {}) {
	const trigger = KM(i, element),
		start = bt(),
		end = (start._payloadCache = start._payloadCache || {});
	return (
		trigger in end ||
		(end[trigger] = ZM(i).then((a) =>
			a
				? yy(trigger).then((o) => o || (delete end[trigger], null))
				: ((end[trigger] = null), null),
		)),
			end[trigger]
	);
}

const x_ = "json";

function KM(i, element = {}) {
	const trigger = new URL(i, "http://localhost");
	if (trigger.search)
		throw new Error("Payload URL cannot contain search params: " + i);
	if (
		trigger.host !== "localhost" ||
		No(trigger.pathname, {
			acceptRelative: !0,
		})
	)
		throw new Error("Payload URL must not include hostname: " + i);
	const start = element.hash || (element.fresh ? Date.now() : "");
	return Do(
		uc().app.baseURL,
		trigger.pathname,
		start ? `_payload.${start}.${x_}` : `_payload.${x_}`,
	);
}

async function yy(i) {
	const element = fetch(i).then((trigger) => trigger.text().then(by));
	try {
		return await element;
	} catch (trigger) {
	}
	return null;
}

async function ZM(i = Pm().path) {
	if ((await zu()).prerendered.includes(i)) return !0;
	const trigger = await xy(i);
	return !!trigger.prerender && !trigger.redirect;
}

let Oc = null;

async function JM() {
	if (Oc) return Oc;
	const i = document.getElementById("__NUXT_DATA__");
	if (!i) return {};
	const element = by(i.textContent || ""),
		trigger = i.dataset.src ? await yy(i.dataset.src) : void 0;
	return (
		(Oc = {
			...element,
			...trigger,
			...window.__NUXT__,
		}),
			Oc
	);
}

function by(i) {
	return jT(i, bt()._payloadRevivers);
}

function QM(i, element) {
	bt()._payloadRevivers[i] = element;
}

const y_ = {
		NuxtError: (i) => Cm(i),
		EmptyShallowRef: (i) =>
			Ll(i === "_" ? void 0 : i === "0n" ? BigInt(0) : su(i)),
		EmptyRef: (i) => us(i === "_" ? void 0 : i === "0n" ? BigInt(0) : su(i)),
		ShallowRef: (i) => Ll(i),
		ShallowReactive: (i) => rc(i),
		Ref: (i) => us(i),
		Reactive: (i) => Dn(i),
	},
	eR = Pr({
		name: "nuxt:revive-payload:client",
		order: -30,
		async setup(i) {
			let element, trigger;
			for (const start in y_) QM(start, y_[start]);
			(Object.assign(
				i.payload,
				(([element, trigger] = Fl(() => i.runWithContext(JM))),
					(element = await element),
					trigger(),
					element),
			),
				(window.__NUXT__ = i.payload));
		},
	}),
	tR = [],
	iR = Pr({
		name: "nuxt:head",
		enforce: "pre",
		setup(i) {
			const element = TM({
				plugins: tR,
			});
			(MM(() => bt().vueApp._context.provides.usehead), i.vueApp.use(element));
			{
				let trigger = !0;
				const start = async () => {
					((trigger = !1), await cy(element));
				};
				(element.hooks.hook("dom:beforeRender", (end) => {
					end.shouldRender = !trigger;
				}),
					i.hooks.hook("page:start", () => {
						trigger = !0;
					}),
					i.hooks.hook("page:finish", () => {
						i.isHydrating || start();
					}),
					i.hooks.hook("app:error", start),
					i.hooks.hook("app:suspense:resolve", start));
			}
		},
	});
/*!
 * vue-router v4.2.5
 * (c) 2023 Eduardo San Martin Morote
 * @license MIT
 */
const $a = typeof window < "u";

function sR(i) {
	return i.__esModule || i[Symbol.toStringTag] === "Module";
}

const ot = Object.assign;

function xd(i, element) {
	const trigger = {};
	for (const start in element) {
		const end = element[start];
		trigger[start] = Hs(end) ? end.map(i) : i(end);
	}
	return trigger;
}

const pl = () => {
	},
	Hs = Array.isArray,
	nR = /\/$/,
	rR = (i) => i.replace(nR, "");

function yd(i, element, trigger = "/") {
	let start,
		end = {},
		a = "",
		o = "";
	const l = element.indexOf("#");
	let c = element.indexOf("?");
	return (
		l < c && l >= 0 && (c = -1),
		c > -1 &&
		((start = element.slice(0, c)),
			(a = element.slice(c + 1, l > -1 ? l : element.length)),
			(end = i(a))),
		l > -1 &&
		((start = start || element.slice(0, l)),
			(o = element.slice(l, element.length))),
			(start = cR(start ?? element, trigger)),
			{
				fullPath: start + (a && "?") + a + o,
				path: start,
				query: end,
				hash: o,
			}
	);
}

function aR(i, element) {
	const trigger = element.query ? i(element.query) : "";
	return element.path + (trigger && "?") + trigger + (element.hash || "");
}

function b_(i, element) {
	return !element || !i.toLowerCase().startsWith(element.toLowerCase())
		? i
		: i.slice(element.length) || "/";
}

function oR(i, element, trigger) {
	const start = element.matched.length - 1,
		end = trigger.matched.length - 1;
	return (
		start > -1 &&
		start === end &&
		bo(element.matched[start], trigger.matched[end]) &&
		wy(element.params, trigger.params) &&
		i(element.query) === i(trigger.query) &&
		element.hash === trigger.hash
	);
}

function bo(i, element) {
	return (i.aliasOf || i) === (element.aliasOf || element);
}

function wy(i, element) {
	if (Object.keys(i).length !== Object.keys(element).length) return !1;
	for (const trigger in i) if (!lR(i[trigger], element[trigger])) return !1;
	return !0;
}

function lR(i, element) {
	return Hs(i) ? w_(i, element) : Hs(element) ? w_(element, i) : i === element;
}

function w_(i, element) {
	return Hs(element)
		? i.length === element.length &&
		i.every((trigger, start) => trigger === element[start])
		: i.length === 1 && i[0] === element;
}

function cR(i, element) {
	if (i.startsWith("/")) return i;
	if (!i) return element;
	const trigger = element.split("/"),
		start = i.split("/"),
		end = start[start.length - 1];
	(end === ".." || end === ".") && start.push("");
	let a = trigger.length - 1,
		o,
		l;
	for (o = 0; o < start.length; o++)
		if (((l = start[o]), l !== "."))
			if (l === "..") a > 1 && a--;
			else break;
	return (
		trigger.slice(0, a).join("/") +
		"/" +
		start.slice(o - (o === start.length ? 1 : 0)).join("/")
	);
}

var kl;
(function (i) {
	((i.pop = "pop"), (i.push = "push"));
})(kl || (kl = {}));
var ml;
(function (i) {
	((i.back = "back"), (i.forward = "forward"), (i.unknown = ""));
})(ml || (ml = {}));

function hR(i) {
	if (!i)
		if ($a) {
			const element = document.querySelector("base");
			((i = (element && element.getAttribute("href")) || "/"),
				(i = i.replace(/^\w+:\/\/[^\/]+/, "")));
		} else i = "/";
	return (i[0] !== "/" && i[0] !== "#" && (i = "/" + i), rR(i));
}

const uR = /^[^#]+#/;

function dR(i, element) {
	return i.replace(uR, "#") + element;
}

function fR(i, element) {
	const trigger = document.documentElement.getBoundingClientRect(),
		start = i.getBoundingClientRect();
	return {
		behavior: element.behavior,
		left: start.left - trigger.left - (element.left || 0),
		top: start.top - trigger.top - (element.top || 0),
	};
}

const Wu = () => ({
	left: window.pageXOffset,
	top: window.pageYOffset,
});

function pR(i) {
	let element;
	if ("el" in i) {
		const trigger = i.el,
			start = typeof trigger == "string" && trigger.startsWith("#"),
			end =
				typeof trigger == "string"
					? start
						? document.getElementById(trigger.slice(1))
						: document.querySelector(trigger)
					: trigger;
		if (!end) return;
		element = fR(end, i);
	} else element = i;
	"scrollBehavior" in document.documentElement.style
		? window.scrollTo(element)
		: window.scrollTo(
			element.left != null ? element.left : window.pageXOffset,
			element.top != null ? element.top : window.pageYOffset,
		);
}

function E_(i, element) {
	return (history.state ? history.state.position - element : -1) + i;
}

const $f = new Map();

function mR(i, element) {
	$f.set(i, element);
}

function gR(i) {
	const element = $f.get(i);
	return ($f.delete(i), element);
}

let _R = () => location.protocol + "//" + location.host;

function Ey(i, element) {
	const {pathname: trigger, search: start, hash: end} = element,
		a = i.indexOf("#");
	if (a > -1) {
		let l = end.includes(i.slice(a)) ? i.slice(a).length : 1,
			c = end.slice(l);
		return (c[0] !== "/" && (c = "/" + c), b_(c, ""));
	}
	return b_(trigger, i) + start + end;
}

function vR(i, element, trigger, start) {
	let end = [],
		a = [],
		o = null;
	const l = ({state: f}) => {
		const p = Ey(i, location),
			_ = trigger.value,
			m = element.value;
		let g = 0;
		if (f) {
			if (((trigger.value = p), (element.value = f), o && o === _)) {
				o = null;
				return;
			}
			g = m ? f.position - m.position : 0;
		} else start(p);
		end.forEach((b) => {
			b(trigger.value, _, {
				delta: g,
				type: kl.pop,
				direction: g ? (g > 0 ? ml.forward : ml.back) : ml.unknown,
			});
		});
	};
	
	function c() {
		o = trigger.value;
	}
	
	function h(f) {
		end.push(f);
		const p = () => {
			const _ = end.indexOf(f);
			_ > -1 && end.splice(_, 1);
		};
		return (a.push(p), p);
	}
	
	function u() {
		const {history: f} = window;
		f.state &&
		f.replaceState(
			ot({}, f.state, {
				scroll: Wu(),
			}),
			"",
		);
	}
	
	function d() {
		for (const f of a) f();
		((a = []),
			window.removeEventListener("popstate", l),
			window.removeEventListener("beforeunload", u));
	}
	
	return (
		window.addEventListener("popstate", l),
			window.addEventListener("beforeunload", u, {
				passive: !0,
			}),
			{
				pauseListeners: c,
				listen: h,
				destroy: d,
			}
	);
}

function S_(i, element, trigger, start = !1, end = !1) {
	return {
		back: i,
		current: element,
		forward: trigger,
		replaced: start,
		position: window.history.length,
		scroll: end ? Wu() : null,
	};
}

function xR(i) {
	const {history: element, location: trigger} = window,
		start = {
			value: Ey(i, trigger),
		},
		end = {
			value: element.state,
		};
	end.value ||
	a(
		start.value,
		{
			back: null,
			current: start.value,
			forward: null,
			position: element.length - 1,
			replaced: !0,
			scroll: null,
		},
		!0,
	);
	
	function a(c, h, u) {
		const d = i.indexOf("#"),
			f =
				d > -1
					? (trigger.host && document.querySelector("base") ? i : i.slice(d)) +
					c
					: _R() + i + c;
		try {
			(element[u ? "replaceState" : "pushState"](h, "", f), (end.value = h));
		} catch (p) {
			trigger[u ? "replace" : "assign"](f);
		}
	}
	
	function o(c, h) {
		const u = ot(
			{},
			element.state,
			S_(end.value.back, c, end.value.forward, !0),
			h,
			{
				position: end.value.position,
			},
		);
		(a(c, u, !0), (start.value = c));
	}
	
	function l(c, h) {
		const u = ot({}, end.value, element.state, {
			forward: c,
			scroll: Wu(),
		});
		a(u.current, u, !0);
		const d = ot(
			{},
			S_(start.value, c, null),
			{
				position: u.position + 1,
			},
			h,
		);
		(a(c, d, !1), (start.value = c));
	}
	
	return {
		location: start,
		state: end,
		push: l,
		replace: o,
	};
}

function Sy(i) {
	i = hR(i);
	const element = xR(i),
		trigger = vR(i, element.state, element.location, element.replace);
	
	function start(a, o = !0) {
		(o || trigger.pauseListeners(), history.go(a));
	}
	
	const end = ot(
		{
			location: "",
			base: i,
			go: start,
			createHref: dR.bind(null, i),
		},
		element,
		trigger,
	);
	return (
		Object.defineProperty(end, "location", {
			enumerable: !0,
			get: () => element.location.value,
		}),
			Object.defineProperty(end, "state", {
				enumerable: !0,
				get: () => element.state.value,
			}),
			end
	);
}

function yR(i) {
	return (
		(i = location.host ? i || location.pathname + location.search : ""),
		i.includes("#") || (i += "#"),
			Sy(i)
	);
}

function bR(i) {
	return typeof i == "string" || (i && typeof i == "object");
}

function Ty(i) {
	return typeof i == "string" || typeof i == "symbol";
}

const Xs = {
		path: "/",
		name: void 0,
		params: {},
		query: {},
		hash: "",
		fullPath: "/",
		matched: [],
		meta: {},
		redirectedFrom: void 0,
	},
	My = Symbol("");
var T_;
(function (i) {
	((i[(i.aborted = 4)] = "aborted"),
		(i[(i.cancelled = 8)] = "cancelled"),
		(i[(i.duplicated = 16)] = "duplicated"));
})(T_ || (T_ = {}));

function wo(i, element) {
	return ot(
		new Error(),
		{
			type: i,
			[My]: !0,
		},
		element,
	);
}

function mn(i, element) {
	return (
		i instanceof Error && My in i && (element == null || !!(i.type & element))
	);
}

const M_ = "[^/]+?",
	wR = {
		sensitive: !1,
		strict: !1,
		start: !0,
		end: !0,
	},
	ER = /[.+*?^${}()[\]/\\]/g;

function SR(i, element) {
	const trigger = ot({}, wR, element),
		start = [];
	let end = trigger.start ? "^" : "";
	const a = [];
	for (const h of i) {
		const u = h.length ? [] : [90];
		trigger.strict && !h.length && (end += "/");
		for (let d = 0; d < h.length; d++) {
			const f = h[d];
			let p = 40 + (trigger.sensitive ? 0.25 : 0);
			if (f.type === 0)
				(d || (end += "/"), (end += f.value.replace(ER, "\\$&")), (p += 40));
			else if (f.type === 1) {
				const {value: _, repeatable: m, optional: g, regexp: b} = f;
				a.push({
					name: _,
					repeatable: m,
					optional: g,
				});
				const x = b || M_;
				if (x !== M_) {
					p += 10;
					try {
						new RegExp(`(${x})`);
					} catch (w) {
						throw new Error(
							`Invalid custom RegExp for param "${_}" (${x}): ` + w.message,
						);
					}
				}
				let v = m ? `((?:${x})(?:/(?:${x}))*)` : `(${x})`;
				(d || (v = g && h.length < 2 ? `(?:/${v})` : "/" + v),
				g && (v += "?"),
					(end += v),
					(p += 20),
				g && (p += -8),
				m && (p += -20),
				x === ".*" && (p += -50));
			}
			u.push(p);
		}
		start.push(u);
	}
	if (trigger.strict && trigger.end) {
		const h = start.length - 1;
		start[h][start[h].length - 1] += 0.7000000000000001;
	}
	(trigger.strict || (end += "/?"),
		trigger.end ? (end += "$") : trigger.strict && (end += "(?:/|$)"));
	const o = new RegExp(end, trigger.sensitive ? "" : "i");
	
	function l(h) {
		const u = h.match(o),
			d = {};
		if (!u) return null;
		for (let f = 1; f < u.length; f++) {
			const p = u[f] || "",
				_ = a[f - 1];
			d[_.name] = p && _.repeatable ? p.split("/") : p;
		}
		return d;
	}
	
	function c(h) {
		let u = "",
			d = !1;
		for (const f of i) {
			((!d || !u.endsWith("/")) && (u += "/"), (d = !1));
			for (const p of f)
				if (p.type === 0) u += p.value;
				else if (p.type === 1) {
					const {value: _, repeatable: m, optional: g} = p,
						b = _ in h ? h[_] : "";
					if (Hs(b) && !m)
						throw new Error(
							`Provided param "${_}" is an array but it is not repeatable (* or + modifiers)`,
						);
					const x = Hs(b) ? b.join("/") : b;
					if (!x)
						if (g)
							f.length < 2 &&
							(u.endsWith("/") ? (u = u.slice(0, -1)) : (d = !0));
						else throw new Error(`Missing required param "${_}"`);
					u += x;
				}
		}
		return u || "/";
	}
	
	return {
		re: o,
		score: start,
		keys: a,
		parse: l,
		stringify: c,
	};
}

function TR(i, element) {
	let trigger = 0;
	for (; trigger < i.length && trigger < element.length;) {
		const start = element[trigger] - i[trigger];
		if (start) return start;
		trigger++;
	}
	return i.length < element.length
		? i.length === 1 && i[0] === 40 + 40
			? -1
			: 1
		: i.length > element.length
			? element.length === 1 && element[0] === 40 + 40
				? 1
				: -1
			: 0;
}

function MR(i, element) {
	let trigger = 0;
	const start = i.score,
		end = element.score;
	for (; trigger < start.length && trigger < end.length;) {
		const a = TR(start[trigger], end[trigger]);
		if (a) return a;
		trigger++;
	}
	if (Math.abs(end.length - start.length) === 1) {
		if (R_(start)) return 1;
		if (R_(end)) return -1;
	}
	return end.length - start.length;
}

function R_(i) {
	const element = i[i.length - 1];
	return i.length > 0 && element[element.length - 1] < 0;
}

const RR = {
		type: 0,
		value: "",
	},
	AR = /[a-zA-Z0-9_]/;

function CR(i) {
	if (!i) return [[]];
	if (i === "/") return [[RR]];
	if (!i.startsWith("/")) throw new Error(`Invalid path "${i}"`);
	
	function element(p) {
		throw new Error(`ERR (${trigger})/"${h}": ${p}`);
	}
	
	let trigger = 0,
		start = trigger;
	const end = [];
	let a;
	
	function o() {
		(a && end.push(a), (a = []));
	}
	
	let l = 0,
		c,
		h = "",
		u = "";
	
	function d() {
		h &&
		(trigger === 0
			? a.push({
				type: 0,
				value: h,
			})
			: trigger === 1 || trigger === 2 || trigger === 3
				? (a.length > 1 &&
				(c === "*" || c === "+") &&
				element(
					`A repeatable param (${h}) must be alone in its segment. eg: '/:ids+.`,
				),
					a.push({
						type: 1,
						value: h,
						regexp: u,
						repeatable: c === "*" || c === "+",
						optional: c === "*" || c === "?",
					}))
				: element("Invalid state to consume buffer"),
			(h = ""));
	}
	
	function f() {
		h += c;
	}
	
	for (; l < i.length;) {
		if (((c = i[l++]), c === "\\" && trigger !== 2)) {
			((start = trigger), (trigger = 4));
			continue;
		}
		switch (trigger) {
			case 0:
				c === "/" ? (h && d(), o()) : c === ":" ? (d(), (trigger = 1)) : f();
				break;
			case 4:
				(f(), (trigger = start));
				break;
			case 1:
				c === "("
					? (trigger = 2)
					: AR.test(c)
						? f()
						: (d(), (trigger = 0), c !== "*" && c !== "?" && c !== "+" && l--);
				break;
			case 2:
				c === ")"
					? u[u.length - 1] == "\\"
						? (u = u.slice(0, -1) + c)
						: (trigger = 3)
					: (u += c);
				break;
			case 3:
				(d(),
					(trigger = 0),
				c !== "*" && c !== "?" && c !== "+" && l--,
					(u = ""));
				break;
			default:
				element("Unknown state");
				break;
		}
	}
	return (
		trigger === 2 && element(`Unfinished custom RegExp for param "${h}"`),
			d(),
			o(),
			end
	);
}

function PR(i, element, trigger) {
	const start = SR(CR(i.path), trigger),
		end = ot(start, {
			record: i,
			parent: element,
			children: [],
			alias: [],
		});
	return (
		element &&
		!end.record.aliasOf == !element.record.aliasOf &&
		element.children.push(end),
			end
	);
}

function LR(i, element) {
	const trigger = [],
		start = new Map();
	element = P_(
		{
			strict: !1,
			end: !0,
			sensitive: !1,
		},
		element,
	);
	
	function end(u) {
		return start.get(u);
	}
	
	function a(u, d, f) {
		const p = !f,
			_ = IR(u);
		_.aliasOf = f && f.record;
		const m = P_(element, u),
			g = [_];
		if ("alias" in u) {
			const v = typeof u.alias == "string" ? [u.alias] : u.alias;
			for (const w of v)
				g.push(
					ot({}, _, {
						components: f ? f.record.components : _.components,
						path: w,
						aliasOf: f ? f.record : _,
					}),
				);
		}
		let b, x;
		for (const v of g) {
			const {path: w} = v;
			if (d && w[0] !== "/") {
				const E = d.record.path,
					T = E[E.length - 1] === "/" ? "" : "/";
				v.path = d.record.path + (w && T + w);
			}
			if (
				((b = PR(v, d, m)),
					f
						? f.alias.push(b)
						: ((x = x || b),
						x !== b && x.alias.push(b),
						p && u.name && !C_(b) && o(u.name)),
					_.children)
			) {
				const E = _.children;
				for (let T = 0; T < E.length; T++) a(E[T], b, f && f.children[T]);
			}
			((f = f || b),
			((b.record.components && Object.keys(b.record.components).length) ||
				b.record.name ||
				b.record.redirect) &&
			c(b));
		}
		return x
			? () => {
				o(x);
			}
			: pl;
	}
	
	function o(u) {
		if (Ty(u)) {
			const d = start.get(u);
			d &&
			(start.delete(u),
				trigger.splice(trigger.indexOf(d), 1),
				d.children.forEach(o),
				d.alias.forEach(o));
		} else {
			const d = trigger.indexOf(u);
			d > -1 &&
			(trigger.splice(d, 1),
			u.record.name && start.delete(u.record.name),
				u.children.forEach(o),
				u.alias.forEach(o));
		}
	}
	
	function l() {
		return trigger;
	}
	
	function c(u) {
		let d = 0;
		for (
			;
			d < trigger.length &&
			MR(u, trigger[d]) >= 0 &&
			(u.record.path !== trigger[d].record.path || !Ry(u, trigger[d]));
		)
			d++;
		(trigger.splice(d, 0, u),
		u.record.name && !C_(u) && start.set(u.record.name, u));
	}
	
	function h(u, d) {
		let f,
			p = {},
			_,
			m;
		if ("name" in u && u.name) {
			if (((f = start.get(u.name)), !f))
				throw wo(1, {
					location: u,
				});
			((m = f.record.name),
				(p = ot(
					A_(
						d.params,
						f.keys.filter((x) => !x.optional).map((x) => x.name),
					),
					u.params &&
					A_(
						u.params,
						f.keys.map((x) => x.name),
					),
				)),
				(_ = f.stringify(p)));
		} else if ("path" in u)
			((_ = u.path),
				(f = trigger.find((x) => x.re.test(_))),
			f && ((p = f.parse(_)), (m = f.record.name)));
		else {
			if (
				((f = d.name
					? start.get(d.name)
					: trigger.find((x) => x.re.test(d.path))),
					!f)
			)
				throw wo(1, {
					location: u,
					currentLocation: d,
				});
			((m = f.record.name),
				(p = ot({}, d.params, u.params)),
				(_ = f.stringify(p)));
		}
		const g = [];
		let b = f;
		for (; b;) (g.unshift(b.record), (b = b.parent));
		return {
			name: m,
			path: _,
			params: p,
			matched: g,
			meta: NR(g),
		};
	}
	
	return (
		i.forEach((u) => a(u)),
			{
				addRoute: a,
				resolve: h,
				removeRoute: o,
				getRoutes: l,
				getRecordMatcher: end,
			}
	);
}

function A_(i, element) {
	const trigger = {};
	for (const start of element) start in i && (trigger[start] = i[start]);
	return trigger;
}

function IR(i) {
	return {
		path: i.path,
		redirect: i.redirect,
		name: i.name,
		meta: i.meta || {},
		aliasOf: void 0,
		beforeEnter: i.beforeEnter,
		props: OR(i),
		children: i.children || [],
		instances: {},
		leaveGuards: new Set(),
		updateGuards: new Set(),
		enterCallbacks: {},
		components:
			"components" in i
				? i.components || null
				: i.component && {
				default: i.component,
			},
	};
}

function OR(i) {
	const element = {},
		trigger = i.props || !1;
	if ("component" in i) element.default = trigger;
	else
		for (const start in i.components)
			element[start] = typeof trigger == "object" ? trigger[start] : trigger;
	return element;
}

function C_(i) {
	for (; i;) {
		if (i.record.aliasOf) return !0;
		i = i.parent;
	}
	return !1;
}

function NR(i) {
	return i.reduce((element, trigger) => ot(element, trigger.meta), {});
}

function P_(i, element) {
	const trigger = {};
	for (const start in i)
		trigger[start] = start in element ? element[start] : i[start];
	return trigger;
}

function Ry(i, element) {
	return element.children.some((trigger) => trigger === i || Ry(i, trigger));
}

const Ay = /#/g,
	DR = /&/g,
	UR = /\//g,
	FR = /=/g,
	kR = /\?/g,
	Cy = /\+/g,
	BR = /%5B/g,
	GR = /%5D/g,
	Py = /%5E/g,
	HR = /%60/g,
	Ly = /%7B/g,
	zR = /%7C/g,
	Iy = /%7D/g,
	jR = /%20/g;

function Lm(i) {
	return encodeURI("" + i)
		.replace(zR, "|")
		.replace(BR, "[")
		.replace(GR, "]");
}

function VR(i) {
	return Lm(i).replace(Ly, "{").replace(Iy, "}").replace(Py, "^");
}

function Yf(i) {
	return Lm(i)
		.replace(Cy, "%2B")
		.replace(jR, "+")
		.replace(Ay, "%23")
		.replace(DR, "%26")
		.replace(HR, "`")
		.replace(Ly, "{")
		.replace(Iy, "}")
		.replace(Py, "^");
}

function qR(i) {
	return Yf(i).replace(FR, "%3D");
}

function XR(i) {
	return Lm(i).replace(Ay, "%23").replace(kR, "%3F");
}

function $R(i) {
	return i == null ? "" : XR(i).replace(UR, "%2F");
}

function ou(i) {
	try {
		return decodeURIComponent("" + i);
	} catch {
	}
	return "" + i;
}

function YR(i) {
	const element = {};
	if (i === "" || i === "?") return element;
	const start = (i[0] === "?" ? i.slice(1) : i).split("&");
	for (let end = 0; end < start.length; ++end) {
		const a = start[end].replace(Cy, " "),
			o = a.indexOf("="),
			l = ou(o < 0 ? a : a.slice(0, o)),
			c = o < 0 ? null : ou(a.slice(o + 1));
		if (l in element) {
			let h = element[l];
			(Hs(h) || (h = element[l] = [h]), h.push(c));
		} else element[l] = c;
	}
	return element;
}

function L_(i) {
	let element = "";
	for (let trigger in i) {
		const start = i[trigger];
		if (((trigger = qR(trigger)), start == null)) {
			start !== void 0 && (element += (element.length ? "&" : "") + trigger);
			continue;
		}
		(Hs(start) ? start.map((a) => a && Yf(a)) : [start && Yf(start)]).forEach(
			(a) => {
				a !== void 0 &&
				((element += (element.length ? "&" : "") + trigger),
				a != null && (element += "=" + a));
			},
		);
	}
	return element;
}

function KR(i) {
	const element = {};
	for (const trigger in i) {
		const start = i[trigger];
		start !== void 0 &&
		(element[trigger] = Hs(start)
			? start.map((end) => (end == null ? null : "" + end))
			: start == null
				? start
				: "" + start);
	}
	return element;
}

const ZR = Symbol(""),
	I_ = Symbol(""),
	Im = Symbol(""),
	Om = Symbol(""),
	Kf = Symbol("");

function Go() {
	let i = [];
	
	function element(start) {
		return (
			i.push(start),
				() => {
					const end = i.indexOf(start);
					end > -1 && i.splice(end, 1);
				}
		);
	}
	
	function trigger() {
		i = [];
	}
	
	return {
		add: element,
		list: () => i.slice(),
		reset: trigger,
	};
}

function ar(i, element, trigger, start, end) {
	const a =
		start && (start.enterCallbacks[end] = start.enterCallbacks[end] || []);
	return () =>
		new Promise((o, l) => {
			const c = (d) => {
					d === !1
						? l(
							wo(4, {
								from: trigger,
								to: element,
							}),
						)
						: d instanceof Error
							? l(d)
							: bR(d)
								? l(
									wo(2, {
										from: element,
										to: d,
									}),
								)
								: (a &&
								start.enterCallbacks[end] === a &&
								typeof d == "function" &&
								a.push(d),
									o());
				},
				h = i.call(start && start.instances[end], element, trigger, c);
			let u = Promise.resolve(h);
			(i.length < 3 && (u = u.then(c)), u.catch((d) => l(d)));
		});
}

function bd(i, element, trigger, start) {
	const end = [];
	for (const a of i)
		for (const o in a.components) {
			let l = a.components[o];
			if (!(element !== "beforeRouteEnter" && !a.instances[o]))
				if (JR(l)) {
					const h = (l.__vccOpts || l)[element];
					h && end.push(ar(h, trigger, start, a, o));
				} else {
					let c = l();
					end.push(() =>
						c.then((h) => {
							if (!h)
								return Promise.reject(
									new Error(
										`Couldn'trigger resolve component "${o}" at "${a.path}"`,
									),
								);
							const u = sR(h) ? h.default : h;
							a.components[o] = u;
							const f = (u.__vccOpts || u)[element];
							return f && ar(f, trigger, start, a, o)();
						}),
					);
				}
		}
	return end;
}

function JR(i) {
	return (
		typeof i == "object" ||
		"displayName" in i ||
		"props" in i ||
		"__vccOpts" in i
	);
}

function O_(i) {
	const element = Ri(Im),
		trigger = Ri(Om),
		start = li(() => element.resolve(Ve(i.to))),
		end = li(() => {
			const {matched: c} = start.value,
				{length: h} = c,
				u = c[h - 1],
				d = trigger.matched;
			if (!u || !d.length) return -1;
			const f = d.findIndex(bo.bind(null, u));
			if (f > -1) return f;
			const p = N_(c[h - 2]);
			return h > 1 && N_(u) === p && d[d.length - 1].path !== p
				? d.findIndex(bo.bind(null, c[h - 2]))
				: f;
		}),
		a = li(() => end.value > -1 && iA(trigger.params, start.value.params)),
		o = li(
			() =>
				end.value > -1 &&
				end.value === trigger.matched.length - 1 &&
				wy(trigger.params, start.value.params),
		);
	
	function l(c = {}) {
		return tA(c)
			? element[Ve(i.replace) ? "replace" : "push"](Ve(i.to)).catch(pl)
			: Promise.resolve();
	}
	
	return {
		route: start,
		href: li(() => start.value.href),
		isActive: a,
		isExactActive: o,
		navigate: l,
	};
}

const QR = Gn({
		name: "RouterLink",
		compatConfig: {
			MODE: 3,
		},
		props: {
			to: {
				type: [String, Object],
				required: !0,
			},
			replace: Boolean,
			activeClass: String,
			exactActiveClass: String,
			custom: Boolean,
			ariaCurrentValue: {
				type: String,
				default: "page",
			},
		},
		useLink: O_,
		setup(i, {slots: element}) {
			const trigger = Dn(O_(i)),
				{options: start} = Ri(Im),
				end = li(() => ({
					[D_(i.activeClass, start.linkActiveClass, "router-link-active")]:
					trigger.isActive,
					[D_(
						i.exactActiveClass,
						start.linkExactActiveClass,
						"router-link-exact-active",
					)]: trigger.isExactActive,
				}));
			return () => {
				const a = element.default && element.default(trigger);
				return i.custom
					? a
					: Ci(
						"a",
						{
							"aria-current": trigger.isExactActive
								? i.ariaCurrentValue
								: null,
							href: trigger.href,
							onClick: trigger.navigate,
							class: end.value,
						},
						a,
					);
			};
		},
	}),
	eA = QR;

function tA(i) {
	if (
		!(i.metaKey || i.altKey || i.ctrlKey || i.shiftKey) &&
		!i.defaultPrevented &&
		!(i.button !== void 0 && i.button !== 0)
	) {
		if (i.currentTarget && i.currentTarget.getAttribute) {
			const element = i.currentTarget.getAttribute("target");
			if (/\b_blank\b/i.test(element)) return;
		}
		return (i.preventDefault && i.preventDefault(), !0);
	}
}

function iA(i, element) {
	for (const trigger in element) {
		const start = element[trigger],
			end = i[trigger];
		if (typeof start == "string") {
			if (start !== end) return !1;
		} else if (
			!Hs(end) ||
			end.length !== start.length ||
			start.some((a, o) => a !== end[o])
		)
			return !1;
	}
	return !0;
}

function N_(i) {
	return i ? (i.aliasOf ? i.aliasOf.path : i.path) : "";
}

const D_ = (i, element, trigger) => i ?? element ?? trigger,
	sA = Gn({
		name: "RouterView",
		inheritAttrs: !1,
		props: {
			name: {
				type: String,
				default: "default",
			},
			route: Object,
		},
		compatConfig: {
			MODE: 3,
		},
		setup(i, {attrs: element, slots: trigger}) {
			const start = Ri(Kf),
				end = li(() => i.route || start.value),
				a = Ri(I_, 0),
				o = li(() => {
					let h = Ve(a);
					const {matched: u} = end.value;
					let d;
					for (; (d = u[h]) && !d.components;) h++;
					return h;
				}),
				l = li(() => end.value.matched[o.value]);
			(ra(
				I_,
				li(() => o.value + 1),
			),
				ra(ZR, l),
				ra(Kf, end));
			const c = us();
			return (
				co(
					() => [c.value, l.value, i.name],
					([h, u, d], [f, p, _]) => {
						(u &&
						((u.instances[d] = h),
						p &&
						p !== u &&
						h &&
						h === f &&
						(u.leaveGuards.size || (u.leaveGuards = p.leaveGuards),
						u.updateGuards.size || (u.updateGuards = p.updateGuards))),
						h &&
						u &&
						(!p || !bo(u, p) || !f) &&
						(u.enterCallbacks[d] || []).forEach((m) => m(h)));
					},
					{
						flush: "post",
					},
				),
					() => {
						const h = end.value,
							u = i.name,
							d = l.value,
							f = d && d.components[u];
						if (!f)
							return U_(trigger.default, {
								Component: f,
								route: h,
							});
						const p = d.props[u],
							_ = p
								? p === !0
									? h.params
									: typeof p == "function"
										? p(h)
										: p
								: null,
							g = Ci(
								f,
								ot({}, _, element, {
									onVnodeUnmounted: (b) => {
										b.component.isUnmounted && (d.instances[u] = null);
									},
									ref: c,
								}),
							);
						return (
							U_(trigger.default, {
								Component: g,
								route: h,
							}) || g
						);
					}
			);
		},
	});

function U_(i, element) {
	if (!i) return null;
	const trigger = i(element);
	return trigger.length === 1 ? trigger[0] : trigger;
}

const Oy = sA;

function nA(i) {
	const element = LR(i.routes, i),
		trigger = i.parseQuery || YR,
		start = i.stringifyQuery || L_,
		end = i.history,
		a = Go(),
		o = Go(),
		l = Go(),
		c = Ll(Xs);
	let h = Xs;
	$a &&
	i.scrollBehavior &&
	"scrollRestoration" in history &&
	(history.scrollRestoration = "manual");
	const u = xd.bind(null, (R) => "" + R),
		d = xd.bind(null, $R),
		f = xd.bind(null, ou);
	
	function p(R, A) {
		let G, Y;
		return (
			Ty(R) ? ((G = element.getRecordMatcher(R)), (Y = A)) : (Y = R),
				element.addRoute(Y, G)
		);
	}
	
	function _(R) {
		const A = element.getRecordMatcher(R);
		A && element.removeRoute(A);
	}
	
	function m() {
		return element.getRoutes().map((R) => R.record);
	}
	
	function g(R) {
		return !!element.getRecordMatcher(R);
	}
	
	function b(R, A) {
		if (((A = ot({}, A || c.value)), typeof R == "string")) {
			const y = yd(trigger, R, A.path),
				D = element.resolve(
					{
						path: y.path,
					},
					A,
				),
				F = end.createHref(y.fullPath);
			return ot(y, D, {
				params: f(D.params),
				hash: ou(y.hash),
				redirectedFrom: void 0,
				href: F,
			});
		}
		let G;
		if ("path" in R)
			G = ot({}, R, {
				path: yd(trigger, R.path, A.path).path,
			});
		else {
			const y = ot({}, R.params);
			for (const D in y) y[D] == null && delete y[D];
			((G = ot({}, R, {
				params: d(y),
			})),
				(A.params = d(A.params)));
		}
		const Y = element.resolve(G, A),
			W = R.hash || "";
		Y.params = u(f(Y.params));
		const te = aR(
				start,
				ot({}, R, {
					hash: VR(W),
					path: Y.path,
				}),
			),
			S = end.createHref(te);
		return ot(
			{
				fullPath: te,
				hash: W,
				query: start === L_ ? KR(R.query) : R.query || {},
			},
			Y,
			{
				redirectedFrom: void 0,
				href: S,
			},
		);
	}
	
	function x(R) {
		return typeof R == "string" ? yd(trigger, R, c.value.path) : ot({}, R);
	}
	
	function v(R, A) {
		if (h !== R)
			return wo(8, {
				from: A,
				to: R,
			});
	}
	
	function w(R) {
		return M(R);
	}
	
	function E(R) {
		return w(
			ot(x(R), {
				replace: !0,
			}),
		);
	}
	
	function T(R) {
		const A = R.matched[R.matched.length - 1];
		if (A && A.redirect) {
			const {redirect: G} = A;
			let Y = typeof G == "function" ? G(R) : G;
			return (
				typeof Y == "string" &&
				((Y =
					Y.includes("?") || Y.includes("#")
						? (Y = x(Y))
						: {
							path: Y,
						}),
					(Y.params = {})),
					ot(
						{
							query: R.query,
							hash: R.hash,
							params: "path" in Y ? {} : R.params,
						},
						Y,
					)
			);
		}
	}
	
	function M(R, A) {
		const G = (h = b(R)),
			Y = c.value,
			W = R.state,
			te = R.force,
			S = R.replace === !0,
			y = T(G);
		if (y)
			return M(
				ot(x(y), {
					state: typeof y == "object" ? ot({}, W, y.state) : W,
					force: te,
					replace: S,
				}),
				A || G,
			);
		const D = G;
		D.redirectedFrom = A;
		let F;
		return (
			!te &&
			oR(start, Y, G) &&
			((F = wo(16, {
				to: D,
				from: Y,
			})),
				ee(Y, Y, !0, !1)),
				(F ? Promise.resolve(F) : O(D, Y))
					.catch((C) => (mn(C) ? (mn(C, 2) ? C : N(C)) : k(C, D, Y)))
					.then((C) => {
						if (C) {
							if (mn(C, 2))
								return M(
									ot(
										{
											replace: S,
										},
										x(C.to),
										{
											state: typeof C.to == "object" ? ot({}, W, C.to.state) : W,
											force: te,
										},
									),
									A || D,
								);
						} else C = P(D, Y, !0, S, W);
						return (B(D, Y, C), C);
					})
		);
	}
	
	function U(R, A) {
		const G = v(R, A);
		return G ? Promise.reject(G) : Promise.resolve();
	}
	
	function L(R) {
		const A = Ee.values().next().value;
		return A && typeof A.runWithContext == "function"
			? A.runWithContext(R)
			: R();
	}
	
	function O(R, A) {
		let G;
		const [Y, W, te] = rA(R, A);
		G = bd(Y.reverse(), "beforeRouteLeave", R, A);
		for (const y of Y)
			y.leaveGuards.forEach((D) => {
				G.push(ar(D, R, A));
			});
		const S = U.bind(null, R, A);
		return (
			G.push(S),
				_e(G)
					.then(() => {
						G = [];
						for (const y of a.list()) G.push(ar(y, R, A));
						return (G.push(S), _e(G));
					})
					.then(() => {
						G = bd(W, "beforeRouteUpdate", R, A);
						for (const y of W)
							y.updateGuards.forEach((D) => {
								G.push(ar(D, R, A));
							});
						return (G.push(S), _e(G));
					})
					.then(() => {
						G = [];
						for (const y of te)
							if (y.beforeEnter)
								if (Hs(y.beforeEnter))
									for (const D of y.beforeEnter) G.push(ar(D, R, A));
								else G.push(ar(y.beforeEnter, R, A));
						return (G.push(S), _e(G));
					})
					.then(
						() => (
							R.matched.forEach((y) => (y.enterCallbacks = {})),
								(G = bd(te, "beforeRouteEnter", R, A)),
								G.push(S),
								_e(G)
						),
					)
					.then(() => {
						G = [];
						for (const y of o.list()) G.push(ar(y, R, A));
						return (G.push(S), _e(G));
					})
					.catch((y) => (mn(y, 8) ? y : Promise.reject(y)))
		);
	}
	
	function B(R, A, G) {
		l.list().forEach((Y) => L(() => Y(R, A, G)));
	}
	
	function P(R, A, G, Y, W) {
		const te = v(R, A);
		if (te) return te;
		const S = A === Xs,
			y = $a ? history.state : {};
		(G &&
		(Y || S
			? end.replace(
				R.fullPath,
				ot(
					{
						scroll: S && y && y.scroll,
					},
					W,
				),
			)
			: end.push(R.fullPath, W)),
			(c.value = R),
			ee(R, A, G, S),
			N());
	}
	
	let q;
	
	function $() {
		q ||
		(q = end.listen((R, A, G) => {
			if (!me.listening) return;
			const Y = b(R),
				W = T(Y);
			if (W) {
				M(
					ot(W, {
						replace: !0,
					}),
					Y,
				).catch(pl);
				return;
			}
			h = Y;
			const te = c.value;
			($a && mR(E_(te.fullPath, G.delta), Wu()),
				O(Y, te)
					.catch((S) =>
						mn(S, 12)
							? S
							: mn(S, 2)
								? (M(S.to, Y)
									.then((y) => {
										mn(y, 20) &&
										!G.delta &&
										G.type === kl.pop &&
										end.go(-1, !1);
									})
									.catch(pl),
									Promise.reject())
								: (G.delta && end.go(-G.delta, !1), k(S, Y, te)),
					)
					.then((S) => {
						((S = S || P(Y, te, !1)),
						S &&
						(G.delta && !mn(S, 8)
							? end.go(-G.delta, !1)
							: G.type === kl.pop && mn(S, 20) && end.go(-1, !1)),
							B(Y, te, S));
					})
					.catch(pl));
		}));
	}
	
	let oe = Go(),
		X = Go(),
		z;
	
	function k(R, A, G) {
		N(R);
		const Y = X.list();
		return (Y.length && Y.forEach((W) => W(R, A, G)), Promise.reject(R));
	}
	
	function j() {
		return z && c.value !== Xs
			? Promise.resolve()
			: new Promise((R, A) => {
				oe.add([R, A]);
			});
	}
	
	function N(R) {
		return (
			z ||
			((z = !R),
				$(),
				oe.list().forEach(([A, G]) => (R ? G(R) : A())),
				oe.reset()),
				R
		);
	}
	
	function ee(R, A, G, Y) {
		const {scrollBehavior: W} = i;
		if (!$a || !W) return Promise.resolve();
		const te =
			(!G && gR(E_(R.fullPath, 0))) ||
			((Y || !G) && history.state && history.state.scroll) ||
			null;
		return Ma()
			.then(() => W(R, A, te))
			.then((S) => S && pR(S))
			.catch((S) => k(S, R, A));
	}
	
	const de = (R) => end.go(R);
	let Te;
	const Ee = new Set(),
		me = {
			currentRoute: c,
			listening: !0,
			addRoute: p,
			removeRoute: _,
			hasRoute: g,
			getRoutes: m,
			resolve: b,
			options: i,
			push: w,
			replace: E,
			go: de,
			back: () => de(-1),
			forward: () => de(1),
			beforeEach: a.add,
			beforeResolve: o.add,
			afterEach: l.add,
			onError: X.add,
			isReady: j,
			install(R) {
				const A = this;
				(R.component("RouterLink", eA),
					R.component("RouterView", Oy),
					(R.config.globalProperties.$router = A),
					Object.defineProperty(R.config.globalProperties, "$route", {
						enumerable: !0,
						get: () => Ve(c),
					}),
				$a &&
				!Te &&
				c.value === Xs &&
				((Te = !0), w(end.location).catch((W) => {
				})));
				const G = {};
				for (const W in Xs)
					Object.defineProperty(G, W, {
						get: () => c.value[W],
						enumerable: !0,
					});
				(R.provide(Im, A), R.provide(Om, rc(G)), R.provide(Kf, c));
				const Y = R.unmount;
				(Ee.add(R),
					(R.unmount = function () {
						(Ee.delete(R),
						Ee.size < 1 &&
						((h = Xs),
						q && q(),
							(q = null),
							(c.value = Xs),
							(Te = !1),
							(z = !1)),
							Y());
					}));
			},
		};
	
	function _e(R) {
		return R.reduce((A, G) => A.then(() => L(G)), Promise.resolve());
	}
	
	return me;
}

function rA(i, element) {
	const trigger = [],
		start = [],
		end = [],
		a = Math.max(element.matched.length, i.matched.length);
	for (let o = 0; o < a; o++) {
		const l = element.matched[o];
		l && (i.matched.find((h) => bo(h, l)) ? start.push(l) : trigger.push(l));
		const c = i.matched[o];
		c && (element.matched.find((h) => bo(h, c)) || end.push(c));
	}
	return [trigger, start, end];
}

function aA() {
	return Ri(Om);
}

const Yi = {
		layoutTransition: !1,
		pageTransition: {
			css: !1,
			name: "page",
			mode: "out-in",
			onBeforeLeave: (i) => {
				PAGE_TRANSITION.onBeforeLeave(i);
			},
			onLeave: (i, element) => {
				PAGE_TRANSITION.onLeave(i, element);
			},
			onAfterLeave: (i) => {
				PAGE_TRANSITION.onAfterLeave(i);
			},
			onBeforeEnter: (i) => {
				PAGE_TRANSITION.onBeforeEnter(i);
			},
			onEnter: (i, element) => {
				PAGE_TRANSITION.onEnter(i, element);
			},
			onAfterEnter: (i) => {
				PAGE_TRANSITION.onAfterEnter(i);
			},
		},
	},
	Ki = {
		layoutTransition: !1,
		pageTransition: {
			css: !1,
			name: "page",
			mode: "out-in",
			onBeforeLeave: (i) => {
				PAGE_TRANSITION.onBeforeLeave(i);
			},
			onLeave: (i, element) => {
				PAGE_TRANSITION.onLeave(i, element);
			},
			onAfterLeave: (i) => {
				PAGE_TRANSITION.onAfterLeave(i);
			},
			onBeforeEnter: (i) => {
				PAGE_TRANSITION.onBeforeEnter(i);
			},
			onEnter: (i, element) => {
				PAGE_TRANSITION.onEnter(i, element);
			},
			onAfterEnter: (i) => {
				PAGE_TRANSITION.onAfterEnter(i);
			},
		},
	},
	Zi = {
		layoutTransition: !1,
		pageTransition: {
			css: !1,
			name: "page",
			mode: "out-in",
			onBeforeLeave: (i) => {
				PAGE_TRANSITION.onBeforeLeave(i);
			},
			onLeave: (i, element) => {
				PAGE_TRANSITION.onLeave(i, element);
			},
			onAfterLeave: (i) => {
				PAGE_TRANSITION.onAfterLeave(i);
			},
			onBeforeEnter: (i) => {
				PAGE_TRANSITION.onBeforeEnter(i);
			},
			onEnter: (i, element) => {
				PAGE_TRANSITION.onEnter(i, element);
			},
			onAfterEnter: (i) => {
				PAGE_TRANSITION.onAfterEnter(i);
			},
		},
	},
	Ji = {
		layoutTransition: !1,
		pageTransition: {
			css: !1,
			name: "page",
			mode: "out-in",
			onBeforeLeave: (i) => {
				PAGE_TRANSITION.onBeforeLeave(i);
			},
			onLeave: (i, element) => {
				PAGE_TRANSITION.onLeave(i, element);
			},
			onAfterLeave: (i) => {
				PAGE_TRANSITION.onAfterLeave(i);
			},
			onBeforeEnter: (i) => {
				PAGE_TRANSITION.onBeforeEnter(i);
			},
			onEnter: (i, element) => {
				PAGE_TRANSITION.onEnter(i, element);
			},
			onAfterEnter: (i) => {
				PAGE_TRANSITION.onAfterEnter(i);
			},
		},
	},
	Qi = {
		layoutTransition: !1,
		pageTransition: {
			css: !1,
			name: "page",
			mode: "out-in",
			onBeforeLeave: (i) => {
				PAGE_TRANSITION.onBeforeLeave(i);
			},
			onLeave: (i, element) => {
				PAGE_TRANSITION.onLeave(i, element);
			},
			onAfterLeave: (i) => {
				PAGE_TRANSITION.onAfterLeave(i);
			},
			onBeforeEnter: (i) => {
				PAGE_TRANSITION.onBeforeEnter(i);
			},
			onEnter: (i, element) => {
				PAGE_TRANSITION.onEnter(i, element);
			},
			onAfterEnter: (i) => {
				PAGE_TRANSITION.onAfterEnter(i);
			},
		},
	},
	es = {
		layoutTransition: !1,
		pageTransition: {
			css: !1,
			name: "page",
			mode: "out-in",
			onBeforeLeave: (i) => {
				PAGE_TRANSITION.onBeforeLeave(i);
			},
			onLeave: (i, element) => {
				PAGE_TRANSITION.onLeave(i, element);
			},
			onAfterLeave: (i) => {
				PAGE_TRANSITION.onAfterLeave(i);
			},
			onBeforeEnter: (i) => {
				PAGE_TRANSITION.onBeforeEnter(i);
			},
			onEnter: (i, element) => {
				PAGE_TRANSITION.onEnter(i, element);
			},
			onAfterEnter: (i) => {
				PAGE_TRANSITION.onAfterEnter(i);
			},
		},
	},
	F_ = [
		{
			name: (Yi == null ? void 0 : Yi.name) ?? "404",
			path: (Yi == null ? void 0 : Yi.path) ?? "/404",
			meta: Yi || {},
			alias: (Yi == null ? void 0 : Yi.alias) || [],
			redirect: (Yi == null ? void 0 : Yi.redirect) || void 0,
			component: () =>
				Sn(() => import("./index.f24e2f12.js"), [], import.meta.url).then(
					(i) => i.default || i,
				),
		},
		{
			name: (Ki == null ? void 0 : Ki.name) ?? "archive",
			path: (Ki == null ? void 0 : Ki.path) ?? "/archive",
			meta: Ki || {},
			alias: (Ki == null ? void 0 : Ki.alias) || [],
			redirect: (Ki == null ? void 0 : Ki.redirect) || void 0,
			component: () =>
				Sn(() => import("./index.6163d607.js"), [], import.meta.url).then(
					(i) => i.default || i,
				),
		},
		{
			name: (Zi == null ? void 0 : Zi.name) ?? "index",
			path: (Zi == null ? void 0 : Zi.path) ?? "/",
			meta: Zi || {},
			alias: (Zi == null ? void 0 : Zi.alias) || [],
			redirect: (Zi == null ? void 0 : Zi.redirect) || void 0,
			component: () =>
				Sn(() => import("./index.c43ace8d.js"), [], import.meta.url).then(
					(i) => i.default || i,
				),
		},
		{
			name: (Ji == null ? void 0 : Ji.name) ?? "info",
			path: (Ji == null ? void 0 : Ji.path) ?? "/info",
			meta: Ji || {},
			alias: (Ji == null ? void 0 : Ji.alias) || [],
			redirect: (Ji == null ? void 0 : Ji.redirect) || void 0,
			component: () =>
				Sn(() => import("./index.dd1bd289.js"), [], import.meta.url).then(
					(i) => i.default || i,
				),
		},
		{
			name: (Qi == null ? void 0 : Qi.name) ?? "works-slug",
			path: (Qi == null ? void 0 : Qi.path) ?? "/works/:slug()",
			meta: Qi || {},
			alias: (Qi == null ? void 0 : Qi.alias) || [],
			redirect: (Qi == null ? void 0 : Qi.redirect) || void 0,
			component: () =>
				Sn(
					() => import("./_slug_.31963ded.js"),
					["./_slug_.31963ded.js", "./colors.ce6a9027.js"],
					import.meta.url,
				).then((i) => i.default || i),
		},
		{
			name: (es == null ? void 0 : es.name) ?? "works",
			path: (es == null ? void 0 : es.path) ?? "/works",
			meta: es || {},
			alias: (es == null ? void 0 : es.alias) || [],
			redirect: (es == null ? void 0 : es.redirect) || void 0,
			component: () =>
				Sn(
					() => import("./index.97eefd96.js"),
					["./index.97eefd96.js", "./colors.ce6a9027.js"],
					import.meta.url,
				).then((i) => i.default || i),
		},
	],
	oA = {
		scrollBehavior(i, element, trigger) {
			return trigger
				? {
					top: trigger,
				}
				: {
					top: 0,
				};
		},
	},
	Ny = (i, element, trigger) => (
		(element = element === !0 ? {} : element),
			{
				default: () => {
					var start;
					return element
						? Ci(i, element, trigger)
						: (start = trigger.default) == null
							? void 0
							: start.call(trigger);
				},
			}
	);

function k_(i) {
	const element =
		(i == null ? void 0 : i.meta.key) ??
		i.path
			.replace(/(:\w+)\([^)]+\)/g, "$1")
			.replace(/(:\w+)[?+*]/g, "$1")
			.replace(/:\w+/g, (trigger) => {
				var start;
				return (
					((start = i.params[trigger.slice(1)]) == null
						? void 0
						: start.toString()) || ""
				);
			});
	return typeof element == "function" ? element(i) : element;
}

function lA(i, element) {
	return i === element
		? !1
		: k_(i) !== k_(element)
			? !0
			: !i.matched.every((start, end) => {
				var a, o;
				return (
					start.components &&
					start.components.default ===
					((o =
						(a = element.matched[end]) == null ? void 0 : a.components) ==
					null
						? void 0
						: o.default)
				);
			});
}

const cA = {
	scrollBehavior(i, element, trigger) {
		var h;
		const start = bt(),
			end =
				((h = zn().options) == null ? void 0 : h.scrollBehaviorType) ?? "auto";
		let a = trigger || void 0;
		const o =
			typeof i.meta.scrollToTop == "function"
				? i.meta.scrollToTop(i, element)
				: i.meta.scrollToTop;
		if (
			(!a &&
			element &&
			i &&
			o !== !1 &&
			lA(i, element) &&
			(a = {
				left: 0,
				top: 0,
			}),
			i.path === element.path)
		) {
			if (element.hash && !i.hash)
				return {
					left: 0,
					top: 0,
				};
			if (i.hash)
				return {
					el: i.hash,
					top: B_(i.hash),
					behavior: end,
				};
		}
		const l = (u) => !!(u.meta.pageTransition ?? Xf),
			c = l(element) && l(i) ? "page:transition:finish" : "page:finish";
		return new Promise((u) => {
			start.hooks.hookOnce(c, async () => {
				(await Ma(),
				i.hash &&
				(a = {
					el: i.hash,
					top: B_(i.hash),
					behavior: end,
				}),
					u(a));
			});
		});
	},
};

function B_(i) {
	try {
		const element = document.querySelector(i);
		if (element) return parseFloat(getComputedStyle(element).scrollMarginTop);
	} catch {
	}
	return 0;
}

const hA = {
		hashMode: !1,
		scrollBehaviorType: "auto",
	},
	Ui = {
		...hA,
		...cA,
		...oA,
	},
	uA = async (i) => {
		var c;
		let element, trigger;
		if (!((c = i.meta) != null && c.validate)) return;
		const start = bt(),
			end = zn();
		if (
			(([element, trigger] = Fl(() => Promise.resolve(i.meta.validate(i)))),
				(element = await element),
				trigger(),
				element) === !0
		)
			return;
		const o = Cm({
				statusCode: 404,
				statusMessage: `Page Not Found: ${i.fullPath}`,
			}),
			l = end.beforeResolve((h) => {
				if ((l(), h === i)) {
					const u = end.afterEach(async () => {
						(u(),
							await start.runWithContext(() => Qa(o)),
							window.history.pushState({}, "", i.fullPath));
					});
					return !1;
				}
			});
	},
	dA = async (i) => {
		let element, trigger;
		const start =
			(([element, trigger] = Fl(() => xy(i.path))),
				(element = await element),
				trigger(),
				element);
		if (start.redirect) return start.redirect;
	},
	fA = [uA, dA],
	gl = {};

function pA(i, element, trigger) {
	const {pathname: start, search: end, hash: a} = element,
		o = i.indexOf("#");
	if (o > -1) {
		const h = a.includes(i.slice(o)) ? i.slice(o).length : 1;
		let u = a.slice(h);
		return (u[0] !== "/" && (u = "/" + u), a_(u, ""));
	}
	const l = a_(start, i),
		c =
			!trigger ||
			KS(l, trigger, {
				trailingSlash: !0,
			})
				? l
				: trigger;
	return c + (c.includes("?") ? "" : end) + a;
}

const mA = Pr({
		name: "nuxt:router",
		enforce: "pre",
		async setup(i) {
			var m, g;
			let element,
				trigger,
				start = uc().app.baseURL;
			Ui.hashMode && !start.includes("#") && (start += "#");
			const end =
					((m = Ui.history) == null ? void 0 : m.call(Ui, start)) ??
					(Ui.hashMode ? yR(start) : Sy(start)),
				a = ((g = Ui.routes) == null ? void 0 : g.call(Ui, F_)) ?? F_;
			let o;
			const l = pA(start, window.location, i.payload.path),
				c = nA({
					...Ui,
					scrollBehavior: (b, x, v) => {
						var w;
						if (x === Xs) {
							o = v;
							return;
						}
						return (
							(c.options.scrollBehavior = Ui.scrollBehavior),
								(w = Ui.scrollBehavior) == null
									? void 0
									: w.call(Ui, b, Xs, o || v)
						);
					},
					history: end,
					routes: a,
				});
			i.vueApp.use(c);
			const h = Ll(c.currentRoute.value);
			(c.afterEach((b, x) => {
				h.value = x;
			}),
				Object.defineProperty(
					i.vueApp.config.globalProperties,
					"previousRoute",
					{
						get: () => h.value,
					},
				));
			const u = Ll(c.resolve(l)),
				d = () => {
					u.value = c.currentRoute.value;
				};
			(i.hook("page:finish", d),
				c.afterEach((b, x) => {
					var v, w, E, T;
					((w = (v = b.matched[0]) == null ? void 0 : v.components) == null
						? void 0
						: w.default) ===
					((T = (E = x.matched[0]) == null ? void 0 : E.components) == null
						? void 0
						: T.default) && d();
				}));
			const f = {};
			for (const b in u.value)
				Object.defineProperty(f, b, {
					get: () => u.value[b],
				});
			((i._route = rc(f)),
				(i._middleware = i._middleware || {
					global: [],
					named: {},
				}));
			const p = Hu();
			try {
				(([element, trigger] = Fl(() => c.isReady())),
					await element,
					trigger());
			} catch (b) {
				(([element, trigger] = Fl(() => i.runWithContext(() => Qa(b)))),
					await element,
					trigger());
			}
			const _ = i.payload.state._layout;
			return (
				c.beforeEach(async (b, x) => {
					var v;
					((b.meta = Dn(b.meta)),
					i.isHydrating && _ && !pa(b.meta.layout) && (b.meta.layout = _),
						(i._processingMiddleware = !0));
					{
						const w = new Set([...fA, ...i._middleware.global]);
						for (const E of b.matched) {
							const T = E.meta.middleware;
							if (T)
								if (Array.isArray(T)) for (const M of T) w.add(M);
								else w.add(T);
						}
						for (const E of w) {
							const T =
								typeof E == "string"
									? i._middleware.named[E] ||
									(await ((v = gl[E]) == null
										? void 0
										: v.call(gl).then((U) => U.default || U)))
									: E;
							if (!T) throw new Error(`Unknown route middleware: '${E}'.`);
							const M = await i.runWithContext(() => T(b, x));
							if (
								!i.payload.serverRendered &&
								i.isHydrating &&
								(M === !1 || M instanceof Error)
							) {
								const U =
									M ||
									Vf({
										statusCode: 404,
										statusMessage: `Page Not Found: ${l}`,
									});
								return (await i.runWithContext(() => Qa(U)), !1);
							}
							if (M !== !0 && (M || M === !1)) return M;
						}
					}
				}),
					c.onError(() => {
						delete i._processingMiddleware;
					}),
					c.afterEach(async (b, x, v) => {
						(delete i._processingMiddleware,
						!i.isHydrating && p.value && (await i.runWithContext(kM)),
						b.matched.length === 0 &&
						(await i.runWithContext(() =>
							Qa(
								Vf({
									statusCode: 404,
									fatal: !1,
									statusMessage: `Page not found: ${b.fullPath}`,
								}),
							),
						)));
					}),
					i.hooks.hookOnce("app:created", async () => {
						try {
							(await c.replace({
								...c.resolve(l),
								name: void 0,
								force: !0,
							}),
								(c.options.scrollBehavior = Ui.scrollBehavior));
						} catch (b) {
							await i.runWithContext(() => Qa(b));
						}
					}),
					{
						provide: {
							router: c,
						},
					}
			);
		},
	}),
	Zf =
		globalThis.requestIdleCallback ||
		((i) => {
			const element = Date.now(),
				trigger = {
					didTimeout: !1,
					timeRemaining: () => Math.max(0, 50 - (Date.now() - element)),
				};
			return setTimeout(() => {
				i(trigger);
			}, 1);
		}),
	gA =
		globalThis.cancelIdleCallback ||
		((i) => {
			clearTimeout(i);
		}),
	Nm = (i) => {
		const element = bt();
		element.isHydrating
			? element.hooks.hookOnce("app:suspense:resolve", () => {
				Zf(i);
			})
			: Zf(i);
	},
	_A = Pr({
		name: "nuxt:payload",
		setup(i) {
			(zn().beforeResolve(async (element, trigger) => {
				if (element.path === trigger.path) return;
				const start = await v_(element.path);
				start && Object.assign(i.static.data, start.data);
			}),
				Nm(() => {
					var element;
					(i.hooks.hook("link:prefetch", async (trigger) => {
						hc(trigger).protocol || (await v_(trigger));
					}),
					((element = navigator.connection) == null
						? void 0
						: element.effectiveType) !== "slow-2g" && setTimeout(zu, 1e3));
				}));
		},
	}),
	vA = Pr({
		name: "nuxt:global-components",
	}),
	Qr = {
		default: () =>
			Sn(() => import("./default.36d84db3.js"), [], import.meta.url).then(
				(i) => i.default || i,
			),
	},
	xA = Pr({
		name: "nuxt:prefetch",
		setup(i) {
			const element = zn();
			(i.hooks.hook("app:mounted", () => {
				element.beforeEach(async (trigger) => {
					var end;
					const start =
						(end = trigger == null ? void 0 : trigger.meta) == null
							? void 0
							: end.layout;
					start && typeof Qr[start] == "function" && (await Qr[start]());
				});
			}),
				i.hooks.hook("link:prefetch", (trigger) => {
					var o, l, c, h;
					if (No(trigger)) return;
					const start = element.resolve(trigger);
					if (!start) return;
					const end =
						(o = start == null ? void 0 : start.meta) == null
							? void 0
							: o.layout;
					let a = Array.isArray(
						(l = start == null ? void 0 : start.meta) == null
							? void 0
							: l.middleware,
					)
						? (c = start == null ? void 0 : start.meta) == null
							? void 0
							: c.middleware
						: [
							(h = start == null ? void 0 : start.meta) == null
								? void 0
								: h.middleware,
						];
					a = a.filter((u) => typeof u == "string");
					for (const u of a) typeof gl[u] == "function" && gl[u]();
					end && typeof Qr[end] == "function" && Qr[end]();
				}));
		},
	});

function yA(i = {}) {
	const element = i.path || window.location.pathname;
	let trigger = {};
	try {
		trigger = su(sessionStorage.getItem("nuxt:reload") || "{}");
	} catch {
	}
	if (
		i.force ||
		(trigger == null ? void 0 : trigger.path) !== element ||
		(trigger == null ? void 0 : trigger.expires) < Date.now()
	) {
		try {
			sessionStorage.setItem(
				"nuxt:reload",
				JSON.stringify({
					path: element,
					expires: Date.now() + (i.ttl ?? 1e4),
				}),
			);
		} catch {
		}
		if (i.persistState)
			try {
				sessionStorage.setItem(
					"nuxt:reload:state",
					JSON.stringify({
						state: bt().payload.state,
					}),
				);
			} catch {
			}
		window.location.pathname !== element
			? (window.location.href = element)
			: window.location.reload();
	}
}

const bA = Pr({
		name: "nuxt:chunk-reload",
		setup(i) {
			const element = zn(),
				trigger = uc(),
				start = new Set();
			(element.beforeEach(() => {
				start.clear();
			}),
				i.hook("app:chunkError", ({error: a}) => {
					start.add(a);
				}));
			
			function end(a) {
				const l =
					"href" in a && a.href.startsWith("#")
						? trigger.app.baseURL + a.href
						: Do(trigger.app.baseURL, a.fullPath);
				yA({
					path: l,
					persistState: !0,
				});
			}
			
			(i.hook("app:manifest:update", () => {
				element.beforeResolve(end);
			}),
				element.onError((a, o) => {
					start.has(a) && end(o);
				}));
		},
	}),
	wA = Pr((i) => {
		let element;
		
		async function trigger() {
			const start = await zu();
			(element && clearTimeout(element),
				(element = setTimeout(trigger, 1e3 * 60 * 60)));
			const end = await $fetch(Mm("builds/latest.json"));
			end.id !== start.id && i.hooks.callHook("app:manifest:update", end);
		}
		
		Nm(() => {
			element = setTimeout(trigger, 1e3 * 60 * 60);
		});
	}),
	EA = [eR, iR, mA, _A, vA, xA, bA, wA],
	SA = {
		class: "c-preload-body",
	},
	TA = we(
		"div",
		{
			class: "c-home-logo",
		},
		null,
		-1,
	),
	MA = {
		class: "c-preload-l",
	},
	RA = {
		class: "c-preload-start f-num f-24 c-preload-trigger",
		"data-d": "1",
	},
	AA = {
		class: "tr",
	},
	CA = we(
		"div",
		{
			class: "th",
		},
		"LOADING",
		-1,
	),
	PA = {
		class: "td",
	},
	LA = {
		key: 0,
	},
	IA = {
		key: 1,
	},
	OA = {
		class: "c-preload-m",
	},
	NA = we(
		"div",
		{
			class: "c-preload-hello",
		},
		[
			we(
				"p",
				{
					class: "c-preload-trigger",
					"data-d": "2",
				},
				"HI I'M ATHENA",
			),
			we(
				"p",
				{
					class: "c-preload-trigger",
					"data-d": "3",
				},
				"A VISUAL DESIGNER LIVING IN BROOKLYN.",
			),
		],
		-1,
	),
	DA = {
		class: "c-preload-start f-num f-24 c-preload-trigger",
		"data-d": "4",
	},
	UA = {
		class: "tr",
	},
	FA = we(
		"div",
		{
			class: "th",
		},
		"LOADING",
		-1,
	),
	kA = {
		class: "td",
	},
	BA = {
		key: 0,
	},
	GA = {
		key: 1,
	},
	HA = {
		class: "c-preload-end",
	},
	zA = {
		class: "c-preload-start f-num f-24 c-preload-trigger",
		"data-d": "5",
	},
	WA = {
		class: "tr",
	},
	jA = we(
		"div",
		{
			class: "th",
		},
		"LOADING",
		-1,
	),
	VA = {
		class: "td",
	},
	qA = {
		key: 0,
	},
	XA = {
		key: 1,
	},
	$A = {
		methods: {},
	},
	YA = Object.assign($A, {
		__name: "preloader",
		props: {
			progress: {
				type: Number,
				required: !0,
			},
		},
		setup(i) {
			const element = i,
				trigger = li(() => Math.floor(element.progress).toString());
			return (start, end) => (
				Ut(),
					Ks(
						"div",
						{
							class: "c-preload",
							style: nc("--p:" + i.progress / 100),
						},
						[
							we("div", SA, [
								TA,
								we("div", MA, [
									we("div", RA, [
										we("div", AA, [
											CA,
											we("div", PA, [
												we("span", null, pn(Ve(trigger)[0]), 1),
												Ve(trigger).length > 1
													? (Ut(), Ks("span", LA, pn(Ve(trigger)[1]), 1))
													: Ca("", !0),
												Ve(trigger).length > 2
													? (Ut(), Ks("span", IA, pn(Ve(trigger)[2]), 1))
													: Ca("", !0),
											]),
										]),
									]),
								]),
								we("div", OA, [
									NA,
									we("div", DA, [
										we("div", UA, [
											FA,
											we("div", kA, [
												we("span", null, pn(Ve(trigger)[0]), 1),
												Ve(trigger).length > 1
													? (Ut(), Ks("span", BA, pn(Ve(trigger)[1]), 1))
													: Ca("", !0),
												Ve(trigger).length > 2
													? (Ut(), Ks("span", GA, pn(Ve(trigger)[2]), 1))
													: Ca("", !0),
											]),
										]),
									]),
								]),
								we("div", HA, [
									we("div", zA, [
										we("div", WA, [
											jA,
											we("div", VA, [
												we("span", null, pn(Ve(trigger)[0]), 1),
												Ve(trigger).length > 1
													? (Ut(), Ks("span", qA, pn(Ve(trigger)[1]), 1))
													: Ca("", !0),
												Ve(trigger).length > 2
													? (Ut(), Ks("span", XA, pn(Ve(trigger)[2]), 1))
													: Ca("", !0),
											]),
										]),
									]),
								]),
							]),
						],
						4,
					)
			);
		},
	}),
	KA = YA;

async function Dy(i, element = zn()) {
	const {path: trigger, matched: start} = element.resolve(i);
	if (
		!start.length ||
		(element._routePreloaded || (element._routePreloaded = new Set()),
			element._routePreloaded.has(trigger))
	)
		return;
	const end = (element._preloadPromises = element._preloadPromises || []);
	if (end.length > 4) return Promise.all(end).then(() => Dy(i, element));
	element._routePreloaded.add(trigger);
	const a = start
		.map((o) => {
			var l;
			return (l = o.components) == null ? void 0 : l.default;
		})
		.filter((o) => typeof o == "function");
	for (const o of a) {
		const l = Promise.resolve(o())
			.catch(() => {
			})
			.finally(() => end.splice(end.indexOf(l)));
		end.push(l);
	}
	await Promise.all(end);
}

const ZA = (...i) => i.find((element) => element !== void 0),
	JA = "noopener noreferrer";

/*! @__NO_SIDE_EFFECTS__ */
function QA(i) {
	const element = i.componentName || "NuxtLink",
		trigger = (start, end) => {
			if (
				!start ||
				(i.trailingSlash !== "append" && i.trailingSlash !== "remove")
			)
				return start;
			const a = i.trailingSlash === "append" ? tu : Tm;
			if (typeof start == "string") return a(start, !0);
			const o = "path" in start ? start.path : end(start).path;
			return {
				...start,
				name: void 0,
				path: a(o, !0),
			};
		};
	return Gn({
		name: element,
		props: {
			to: {
				type: [String, Object],
				default: void 0,
				required: !1,
			},
			href: {
				type: [String, Object],
				default: void 0,
				required: !1,
			},
			target: {
				type: String,
				default: void 0,
				required: !1,
			},
			rel: {
				type: String,
				default: void 0,
				required: !1,
			},
			noRel: {
				type: Boolean,
				default: void 0,
				required: !1,
			},
			prefetch: {
				type: Boolean,
				default: void 0,
				required: !1,
			},
			noPrefetch: {
				type: Boolean,
				default: void 0,
				required: !1,
			},
			activeClass: {
				type: String,
				default: void 0,
				required: !1,
			},
			exactActiveClass: {
				type: String,
				default: void 0,
				required: !1,
			},
			prefetchedClass: {
				type: String,
				default: void 0,
				required: !1,
			},
			replace: {
				type: Boolean,
				default: void 0,
				required: !1,
			},
			ariaCurrentValue: {
				type: String,
				default: void 0,
				required: !1,
			},
			external: {
				type: Boolean,
				default: void 0,
				required: !1,
			},
			custom: {
				type: Boolean,
				default: void 0,
				required: !1,
			},
		},
		setup(start, {slots: end}) {
			const a = zn(),
				o = uc(),
				l = li(() => {
					const p = start.to || start.href || "";
					return trigger(p, a.resolve);
				}),
				c = li(
					() =>
						typeof l.value == "string" &&
						No(l.value, {
							acceptRelative: !0,
						}),
				),
				h = li(() =>
					start.external || (start.target && start.target !== "_self")
						? !0
						: typeof l.value == "object"
							? !1
							: l.value === "" || c.value,
				),
				u = us(!1),
				d = us(null),
				f = (p) => {
					var _;
					d.value = start.custom
						? (_ = p == null ? void 0 : p.$el) == null
							? void 0
							: _.nextElementSibling
						: p == null
							? void 0
							: p.$el;
				};
			if (
				start.prefetch !== !1 &&
				start.noPrefetch !== !0 &&
				start.target !== "_blank" &&
				!i2()
			) {
				const _ = bt();
				let m,
					g = null;
				(Fu(() => {
					const b = t2();
					Nm(() => {
						m = Zf(() => {
							var x;
							(x = d == null ? void 0 : d.value) != null &&
							x.tagName &&
							(g = b.observe(d.value, async () => {
								(g == null || g(), (g = null));
								const v =
									typeof l.value == "string"
										? l.value
										: a.resolve(l.value).fullPath;
								(await Promise.all([
									_.hooks.callHook("link:prefetch", v).catch(() => {
									}),
									!h.value && Dy(l.value, a).catch(() => {
									}),
								]),
									(u.value = !0));
							}));
						});
					});
				}),
					oc(() => {
						(m && gA(m), g == null || g(), (g = null));
					}));
			}
			return () => {
				var b, x;
				if (!h.value) {
					const v = {
						ref: f,
						to: l.value,
						activeClass: start.activeClass || i.activeClass,
						exactActiveClass: start.exactActiveClass || i.exactActiveClass,
						replace: start.replace,
						ariaCurrentValue: start.ariaCurrentValue,
						custom: start.custom,
					};
					return (
						start.custom ||
						(u.value &&
						(v.class = start.prefetchedClass || i.prefetchedClass),
							(v.rel = start.rel)),
							Ci(Qw("RouterLink"), v, end.default)
					);
				}
				const p =
						typeof l.value == "object"
							? (((b = a.resolve(l.value)) == null ? void 0 : b.href) ?? null)
							: l.value && !start.external && !c.value
								? trigger(Do(o.app.baseURL, l.value), a.resolve)
								: l.value || null,
					_ = start.target || null,
					m = start.noRel
						? null
						: ZA(start.rel, i.externalRelAttribute, p ? JA : "") || null,
					g = () =>
						HM(p, {
							replace: start.replace,
						});
				return start.custom
					? end.default
						? end.default({
							href: p,
							navigate: g,
							get route() {
								if (!p) return;
								const v = hc(p);
								return {
									path: v.pathname,
									fullPath: v.pathname,
									get query() {
										return Zx(v.search);
									},
									hash: v.hash,
									params: {},
									name: void 0,
									matched: [],
									redirectedFrom: void 0,
									meta: {},
									href: p,
								};
							},
							rel: m,
							target: _,
							isExternal: h.value,
							isActive: !1,
							isExactActive: !1,
						})
						: null
					: Ci(
						"a",
						{
							ref: d,
							href: p,
							rel: m,
							target: _,
						},
						(x = end.default) == null ? void 0 : x.call(end),
					);
			};
		},
	});
}

const e2 = QA(XM);

function t2() {
	const i = bt();
	if (i._observer) return i._observer;
	let element = null;
	const trigger = new Map(),
		start = (a, o) => (
			element ||
			(element = new IntersectionObserver((l) => {
				for (const c of l) {
					const h = trigger.get(c.target);
					(c.isIntersecting || c.intersectionRatio > 0) && h && h();
				}
			})),
				trigger.set(a, o),
				element.observe(a),
				() => {
					(trigger.delete(a),
						element.unobserve(a),
					trigger.size === 0 && (element.disconnect(), (element = null)));
				}
		);
	return (i._observer = {
		observe: start,
	});
}

function i2() {
	const i = navigator.connection;
	return !!(i && (i.saveData || /2g/.test(i.effectiveType)));
}

const s2 = (i, element) => {
		const trigger = i.__vccOpts || i;
		for (const [start, end] of element) trigger[start] = end;
		return trigger;
	},
	n2 = {
		methods: {
			onToggleMenu(i) {
				MENU.onToggle(i);
			},
			onToggle(i) {
				WEBGL_ARCHIVE.onToggle(i);
			},
			onClickMail(i) {
				if (i.target) {
					const element = i.target.dataset.mail1,
						trigger = i.target.dataset.mail2,
						start = element + "@" + trigger;
					location.href = "mailto:" + start;
				}
			},
		},
	},
	r2 = {
		class: "c-header c-splash",
	},
	a2 = we(
		"h1",
		{
			class: "h1",
		},
		"Yuen Ye v.3",
		-1,
	),
	o2 = {
		class: "ui-nav",
	},
	l2 = {
		class: "ui-nav-body",
	},
	c2 = {
		class: "ui-nav-th",
	},
	h2 = {
		class: "ui-menu",
	},
	u2 = bm(
		'<div class="o"><div class="i"><div class="b b1"></div><div class="b b2"></div></div><div class="l">Menu</div></div>',
		1,
	),
	d2 = [u2],
	f2 = {
		class: "ui-nav-td",
	},
	p2 = {
		class: "ui-nav-in",
	},
	m2 = {
		class: "ui-nav-ul",
	},
	g2 = {
		class: "ui-nav-li",
		"data-name": "home",
	},
	_2 = we(
		"div",
		{
			class: "o",
		},
		[
			we(
				"div",
				{
					class: "trigger",
				},
				"Home",
			),
		],
		-1,
	),
	v2 = {
		class: "ui-nav-li",
		"data-name": "works",
	},
	x2 = we(
		"div",
		{
			class: "o",
		},
		[
			we(
				"div",
				{
					class: "trigger",
				},
				"Works",
			),
		],
		-1,
	),
	y2 = {
		class: "ui-nav-li",
		"data-name": "info",
	},
	b2 = we(
		"div",
		{
			class: "o",
		},
		[
			we(
				"div",
				{
					class: "trigger",
				},
				"Info",
			),
		],
		-1,
	),
	w2 = {
		class: "ui-nav-li",
		"data-name": "archive",
	},
	E2 = we(
		"div",
		{
			class: "o",
		},
		[
			we(
				"div",
				{
					class: "trigger",
				},
				"Archive",
			),
		],
		-1,
	),
	S2 = we(
		"div",
		{
			class: "ui-nav-bg",
		},
		[we("div")],
		-1,
	),
	T2 = {
		class: "ui-aside ui-sns",
	},
	M2 = bm(
		'<li><a href="https://www.linkedin.com/in/athena-tian-10059213b" target="_blank" rel="noopener" class="ui-link-a ui-icon-a js-hover-shuffle-once js-iv"><div class="o"><div class="trigger">LN</div></div></a></li><li><a href="https://www.instagram.com/athena.tian/" target="_blank" rel="noopener" class="ui-link-a ui-icon-a js-hover-shuffle-once js-iv"><div class="o"><div class="trigger">IG</div></div></a></li>',
		2,
	),
	R2 = we(
		"div",
		{
			class: "o",
		},
		[
			we(
				"div",
				{
					class: "trigger",
				},
				"SAY HI",
			),
		],
		-1,
	),
	A2 = [R2],
	C2 = {
		class: "ui-aside ui-layout",
	},
	P2 = we(
		"div",
		{
			class: "o",
		},
		[
			we(
				"div",
				{
					class: "trigger",
				},
				"GRID",
			),
		],
		-1,
	),
	L2 = [P2],
	I2 = we(
		"div",
		{
			class: "o",
		},
		[
			we(
				"div",
				{
					class: "trigger",
				},
				"LINEAR",
			),
		],
		-1,
	),
	O2 = [I2];

function N2(i, element, trigger, start, end, a) {
	const o = e2;
	return (
		Ut(),
			Ks("header", r2, [
				a2,
				we("nav", o2, [
					we("div", l2, [
						we("div", c2, [
							we("div", h2, [
								we(
									"a",
									{
										href: "#",
										onClick:
											element[0] ||
											(element[0] = Lc(
												(...l) => a.onToggleMenu && a.onToggleMenu(...l),
												["prevent"],
											)),
										class: "ui-menu-a ui-menu-body",
									},
									d2,
								),
							]),
						]),
						we("div", f2, [
							we("div", p2, [
								we("ul", m2, [
									we("li", g2, [
										nt(
											o,
											{
												class: "ui-link-a js-nav-a js-iv js-hover-shuffle-once",
												to: "/",
												"data-page-to": "home",
											},
											{
												default: Jr(() => [_2]),
												_: 1,
											},
										),
									]),
									we("li", v2, [
										nt(
											o,
											{
												class: "ui-link-a js-nav-a js-iv js-hover-shuffle-once",
												to: "/works/",
												"data-page-to": "works",
											},
											{
												default: Jr(() => [x2]),
												_: 1,
											},
										),
									]),
									we("li", y2, [
										nt(
											o,
											{
												class: "ui-link-a js-nav-a js-iv js-hover-shuffle-once",
												to: "/info/",
												"data-page-to": "info",
											},
											{
												default: Jr(() => [b2]),
												_: 1,
											},
										),
									]),
									we("li", w2, [
										nt(
											o,
											{
												class: "ui-link-a js-nav-a js-iv js-hover-shuffle-once",
												to: "/archive/",
												"data-page-to": "archive",
											},
											{
												default: Jr(() => [E2]),
												_: 1,
											},
										),
									]),
								]),
								S2,
							]),
						]),
					]),
				]),
				we("div", T2, [
					we("ul", null, [
						M2,
						we("li", null, [
							we(
								"a",
								{
									href: "#say-hi",
									onClick:
										element[1] ||
										(element[1] = Lc(
											(...l) => a.onClickMail && a.onClickMail(...l),
											["prevent"],
										)),
									"data-mail1": "hello",
									"data-mail2": "yuenye.com",
									class: "ui-link-a ui-blank-a js-hover-shuffle-once js-iv",
								},
								A2,
							),
						]),
					]),
				]),
				we("div", C2, [
					we("ul", null, [
						we("li", null, [
							we(
								"a",
								{
									href: "#layout",
									onClick:
										element[2] ||
										(element[2] = Lc(
											(...l) => a.onToggle && a.onToggle(...l),
											["prevent"],
										)),
									class: "ui-link-a ui-toggle-a js-hover-shuffle-once js-iv on",
									"data-toggle": "grid",
								},
								L2,
							),
						]),
						we("li", null, [
							we(
								"a",
								{
									href: "#layout",
									onClick:
										element[3] ||
										(element[3] = Lc(
											(...l) => a.onToggle && a.onToggle(...l),
											["prevent"],
										)),
									class: "ui-link-a ui-toggle-a js-hover-shuffle-once js-iv",
									"data-toggle": "linear",
								},
								O2,
							),
						]),
					]),
				]),
			])
	);
}

const D2 = s2(n2, [["render", N2]]),
	U2 = (i, element) =>
		element.path
			.replace(/(:\w+)\([^)]+\)/g, "$1")
			.replace(/(:\w+)[?+*]/g, "$1")
			.replace(/:\w+/g, (trigger) => {
				var start;
				return (
					((start = i.params[trigger.slice(1)]) == null
						? void 0
						: start.toString()) || ""
				);
			}),
	Jf = (i, element) => {
		const trigger = i.route.matched.find((end) => {
				var a;
				return (
					((a = end.components) == null ? void 0 : a.default) ===
					i.Component.type
				);
			}),
			start =
				element ??
				(trigger == null ? void 0 : trigger.meta.key) ??
				(trigger && U2(i.route, trigger));
		return typeof start == "function" ? start(i.route) : start;
	},
	F2 = (i, element) => ({
		default: () => (i ? Ci(mE, i === !0 ? {} : i, element) : element),
	}),
	k2 = Gn({
		props: {
			vnode: {
				type: Object,
				required: !0,
			},
			route: {
				type: Object,
				required: !0,
			},
			vnodeRef: Object,
			renderKey: String,
			trackRootNodes: Boolean,
		},
		setup(i) {
			const element = i.renderKey,
				trigger = i.route,
				start = {};
			for (const end in i.route)
				Object.defineProperty(start, end, {
					get: () => (element === i.renderKey ? i.route[end] : trigger[end]),
				});
			return (
				ra(dc, rc(start)),
					() =>
						Ci(i.vnode, {
							ref: i.vnodeRef,
						})
			);
		},
	}),
	B2 = Gn({
		name: "NuxtPage",
		inheritAttrs: !1,
		props: {
			name: {
				type: String,
			},
			transition: {
				type: [Boolean, Object],
				default: void 0,
			},
			keepalive: {
				type: [Boolean, Object],
				default: void 0,
			},
			route: {
				type: Object,
			},
			pageKey: {
				type: [Function, String],
				default: null,
			},
		},
		setup(i, {attrs: element, expose: trigger}) {
			const start = bt(),
				end = us(),
				a = Ri(dc, null);
			trigger({
				pageRef: end,
			});
			const o = Ri(_y, null);
			let l;
			const c = start.deferHydration();
			return () =>
				Ci(
					Oy,
					{
						name: i.name,
						route: i.route,
						...element,
					},
					{
						default: (h) => {
							const u = z2(a, h.route, h.Component),
								d = a && a.matched.length === h.route.matched.length;
							if (!h.Component) {
								if (l && !d) return l;
								c();
								return;
							}
							if (l && o && !o.isCurrent(h.route)) return l;
							if (u && a && (!o || (o != null && o.isCurrent(a))))
								return d ? l : null;
							const f = Jf(h, i.pageKey),
								p = !!(i.transition ?? h.route.meta.pageTransition ?? Xf),
								_ =
									p &&
									H2(
										[
											i.transition,
											h.route.meta.pageTransition,
											Xf,
											{
												onAfterLeave: () => {
													start.callHook("page:transition:finish", h.Component);
												},
											},
										].filter(Boolean),
									),
								m = i.keepalive ?? h.route.meta.keepalive ?? qM;
							return (
								(l = Ny(
									Gu,
									p && _,
									F2(
										m,
										Ci(
											gm,
											{
												suspensible: !0,
												onPending: () =>
													start.callHook("page:start", h.Component),
												onResolve: () => {
													Ma(() =>
														start
															.callHook("page:finish", h.Component)
															.finally(c),
													);
												},
											},
											{
												default: () => {
													const g = Ci(k2, {
														key: f || void 0,
														vnode: h.Component,
														route: h.route,
														renderKey: f || void 0,
														trackRootNodes: p,
														vnodeRef: end,
													});
													return (
														m &&
														(g.type.name =
															h.Component.type.name ||
															h.Component.type.__name ||
															"RouteProvider"),
															g
													);
												},
											},
										),
									),
								).default()),
									l
							);
						},
					},
				);
		},
	});

function G2(i) {
	return Array.isArray(i) ? i : i ? [i] : [];
}

function H2(i) {
	const element = i.map((trigger) => ({
		...trigger,
		onAfterLeave: G2(trigger.onAfterLeave),
	}));
	return my(...element);
}

function z2(i, element, trigger) {
	if (!i) return !1;
	const start = element.matched.findIndex((end) => {
		var a;
		return (
			((a = end.components) == null ? void 0 : a.default) ===
			(trigger == null ? void 0 : trigger.type)
		);
	});
	return !start || start === -1
		? !1
		: element.matched.slice(0, start).some((end, a) => {
			var o, l, c;
			return (
				((o = end.components) == null ? void 0 : o.default) !==
				((c = (l = i.matched[a]) == null ? void 0 : l.components) == null
					? void 0
					: c.default)
			);
		}) ||
		(trigger &&
			Jf({
				route: element,
				Component: trigger,
			}) !==
			Jf({
				route: i,
				Component: trigger,
			}));
}

const W2 = Gn({
		name: "LayoutLoader",
		inheritAttrs: !1,
		props: {
			name: String,
			layoutProps: Object,
		},
		async setup(i, element) {
			const trigger = await Qr[i.name]().then(
				(start) => start.default || start,
			);
			return () => Ci(trigger, i.layoutProps, element.slots);
		},
	}),
	j2 = Gn({
		name: "NuxtLayout",
		inheritAttrs: !1,
		props: {
			name: {
				type: [String, Boolean, Object],
				default: null,
			},
		},
		setup(i, element) {
			const trigger = bt(),
				start = Ri(dc),
				end = start === Pm() ? aA() : start,
				a = li(() => Ve(i.name) ?? end.meta.layout ?? "default"),
				o = us();
			element.expose({
				layoutRef: o,
			});
			const l = trigger.deferHydration();
			return () => {
				const c = a.value && a.value in Qr,
					h = end.meta.layoutTransition ?? VM;
				return Ny(Gu, c && h, {
					default: () =>
						Ci(
							gm,
							{
								suspensible: !0,
								onResolve: () => {
									Ma(l);
								},
							},
							{
								default: () =>
									Ci(
										V2,
										{
											layoutProps: Wx(element.attrs, {
												ref: o,
											}),
											key: a.value || void 0,
											name: a.value,
											shouldProvide: !i.name,
											hasTransition: !!h,
										},
										element.slots,
									),
							},
						),
				}).default();
			};
		},
	}),
	V2 = Gn({
		name: "NuxtLayoutProvider",
		inheritAttrs: !1,
		props: {
			name: {
				type: [String, Boolean],
			},
			layoutProps: {
				type: Object,
			},
			hasTransition: {
				type: Boolean,
			},
			shouldProvide: {
				type: Boolean,
			},
		},
		setup(i, element) {
			const trigger = i.name;
			return (
				i.shouldProvide &&
				ra(_y, {
					isCurrent: (start) => trigger === (start.meta.layout ?? "default"),
				}),
					() => {
						var start, end;
						return !trigger || (typeof trigger == "string" && !(trigger in Qr))
							? (end = (start = element.slots).default) == null
								? void 0
								: end.call(start)
							: Ci(
								W2,
								{
									key: trigger,
									layoutProps: i.layoutProps,
									name: trigger,
								},
								element.slots,
							);
					}
			);
		},
	}),
	q2 = {
		class: "c-assets",
	},
	X2 = bm(
		'<div class="ui-cursor"><div class="ui-cursor-body"><div class="ui-cursor-trigger" data-type="view-project"><div class="o"><div class="trigger"><div class="w">VIEW PROJECT</div></div></div></div></div></div><div class="c-section-bg"><div></div><div></div><div></div><div></div><div></div><div></div></div>',
		2,
	),
	$2 = {
		style: {
			display: "none",
		},
		class: "c-detect-video",
		preload: "auto",
		autoplay: "",
		playsinline: "",
		muted: "",
	},
	Y2 = ["src"],
	K2 = {
		methods: {},
	},
	Z2 = Object.assign(K2, {
		__name: "assets",
		setup(i) {
			const element = uc();
			return (trigger, start) => (
				Ut(),
					Ks("div", q2, [
						X2,
						we("video", $2, [
							we(
								"source",
								{
									src:
										Ve(element).public.cdnUrl +
										"/assets/video/detect.mp4?v=" +
										Ve(element).public.version,
									type: "video/mp4",
								},
								null,
								8,
								Y2,
							),
						]),
					])
			);
		},
	}),
	J2 = Z2,
	Q2 = [
		{
			slug: "expressibility-campaign",
			year: "2022 - Current",
			title: {
				str: "Expressibility Campaign",
				array: ["Expressibility", "Campaign"],
				src: {
					normal: {
						d2x: "/assets/projects/title-2048-assets/01-title@2x.png",
						d1x: "/assets/projects/title-2048-assets/01-title@1x.png",
					},
					shadow: {
						d2x: "/assets/projects/title-2048-assets/shadow/01-title@2x.jpg",
						d1x: "/assets/projects/title-2048-assets/shadow/01-title@1x.jpg",
					},
				},
			},
			hex: "#FFDF69",
			role: ["Art Director", "Product Designer"],
			services: ["Marketing", "Art Direction", "Product Design"],
			credit: ["Athena Tian: Design", "Yaël Bienenstock: Design & Motion"],
			lead: "We lead the creative vision and execution of storytelling on product release social campaigns, delivering innovative work that builds awareness for our brand and our products.",
			description:
				"Upon the fundamental Squarespace CMS tool, we strive to deliver expressibility features that allow our users to further customize their online presence with creative expression. Our team is responsible for designing the product experience flow and the user interface. We lead the creative vision and execution of product storytelling in partnership with Marketing and creative prototypers on product release social campaigns, delivering innovative work that builds awareness for our brand and our products.",
			more: {
				d2x: "/assets/projects/more-assets/01-more@2x.jpg",
				d1x: "/assets/projects/more-assets/01-more@1x.jpg",
				mob: "/assets/projects/more-assets/01-more@1x.jpg",
				pre: "/assets/projects/more-assets/01-more@pre.jpg",
			},
			thumbnail: {
				left: {
					media: "video",
					poster: {
						d2x: "/assets/projects/thumb-assets/01-thumb-L@2x.jpg",
						d1x: "/assets/projects/thumb-assets/01-thumb-L@1x.jpg",
						mob: "/assets/projects/thumb-assets/01-thumb-L@1x.jpg",
						pre: "/assets/projects/thumb-assets/01-thumb-L@pre.jpg",
					},
					src: {
						d2x: "/assets/projects/thumb-video-assets/01-thumb-L@1x-miro.mp4",
						d1x: "/assets/projects/thumb-video-assets/01-thumb-L@1x-miro.mp4",
						mob: "/assets/projects/thumb-video-assets/01-thumb-L@1x-miro.mp4",
					},
				},
				right: {
					media: "image",
					src: {
						d2x: "/assets/projects/thumb-assets/01-thumb-R@2x.jpg",
						d1x: "/assets/projects/thumb-assets/01-thumb-R@1x.jpg",
					},
				},
			},
		},
		{
			slug: "unfold-templates",
			year: "2022",
			title: {
				str: "Unfold Templates",
				array: ["Unfold", "Templates"],
				src: {
					normal: {
						d2x: "/assets/projects/title-2048-assets/02-title@2x.png",
						d1x: "/assets/projects/title-2048-assets/02-title@1x.png",
					},
					shadow: {
						d2x: "/assets/projects/title-2048-assets/shadow/02-title@2x.jpg",
						d1x: "/assets/projects/title-2048-assets/shadow/02-title@1x.jpg",
					},
				},
			},
			hex: "#E2E1DF",
			role: ["Art Director"],
			services: ["Art Direction", "Visual Design"],
			lead: "Partner with the Unfold team, we have created these elegant and playful templates in the theme of wedding and birthday, expanding the Unfold template collection to the next level.",
			description:
				"Unfold is a toolkit that helps users tell their stories on social media. It allows users to fully express themselves online through its unique templates. Partner with the Unfold team, we have created these elegant and playful templates in the theme of wedding and birthday, expanding the Unfold template collection to the next level.",
			more: {
				d2x: "/assets/projects/more-assets/02-more@2x.jpg",
				d1x: "/assets/projects/more-assets/02-more@1x.jpg",
				mob: "/assets/projects/more-assets/02-more@1x.jpg",
				pre: "/assets/projects/more-assets/02-more@pre.jpg",
			},
			thumbnail: {
				left: {
					media: "image",
					src: {
						d2x: "/assets/projects/thumb-assets/02-thumb-L@2x.jpg",
						d1x: "/assets/projects/thumb-assets/02-thumb-L@1x.jpg",
						mob: "/assets/projects/thumb-assets/02-thumb-L@1x.jpg",
					},
				},
				right: {
					media: "image",
					src: {
						d2x: "/assets/projects/thumb-assets/02-thumb-R@2x.jpg",
						d1x: "/assets/projects/thumb-assets/02-thumb-R@1x.jpg",
					},
				},
			},
		},
		{
			slug: "design-tool-x-sqsp",
			year: "2021 - Current",
			title: {
				str: "Design Tool x SQSP",
				array: ["Design Tool", "x SQSP"],
				src: {
					normal: {
						d2x: "/assets/projects/title-2048-assets/03-title@2x.png",
						d1x: "/assets/projects/title-2048-assets/03-title@1x.png",
					},
					shadow: {
						d2x: "/assets/projects/title-2048-assets/shadow/03-title@2x.jpg",
						d1x: "/assets/projects/title-2048-assets/shadow/03-title@1x.jpg",
					},
				},
			},
			hex: "#B9D0E5",
			role: ["Web/Product Designer"],
			services: ["Interactive Design", "UI", "UX"],
			lead: "DESIGN THE website builder tool that utilizes CMS for editing, and create a system that allows users to make the desired website layouts with the most intuitive editing experience.",
			description:
				"Squarespace is a website builder tool that utilizes CMS for editing. Our role is to design the system that allows users to make the desired website layouts with the most intuitive editing experience. For the most part, we define layout types based on our users’ needs, and explore the relationship between elements on that given layout. And we identify how to surface these editing options in the product. Different than creating an one-off beautiful website, it requires us to set clear rules and legislate millions of edge cases for the system to work with variants.",
			more: {
				d2x: "/assets/projects/more-assets/03-more@2x.jpg",
				d1x: "/assets/projects/more-assets/03-more@1x.jpg",
				mob: "/assets/projects/more-assets/03-more@1x.jpg",
				pre: "/assets/projects/more-assets/03-more@pre.jpg",
			},
			thumbnail: {
				left: {
					media: "video",
					poster: {
						d2x: "/assets/projects/thumb-assets/03-thumb-L@2x.jpg",
						d1x: "/assets/projects/thumb-assets/03-thumb-L@1x.jpg",
						mob: "/assets/projects/thumb-assets/03-thumb-L@1x.jpg",
						pre: "/assets/projects/thumb-assets/03-thumb-L@pre.jpg",
					},
					src: {
						d2x: "/assets/projects/thumb-video-assets/03-thumb-L@1x-miro.mp4",
						d1x: "/assets/projects/thumb-video-assets/03-thumb-L@1x-miro.mp4",
						mob: "/assets/projects/thumb-video-assets/03-thumb-L@1x-miro.mp4",
					},
				},
				right: {
					media: "image",
					src: {
						d2x: "/assets/projects/thumb-assets/03-thumb-R@2x.jpg",
						d1x: "/assets/projects/thumb-assets/03-thumb-R@1x.jpg",
					},
				},
			},
		},
		{
			slug: "online-classes-seller",
			year: "2022",
			title: {
				str: "Online Classes Seller",
				array: ["Online", "Classes Seller"],
				src: {
					normal: {
						d2x: "/assets/projects/title-2048-assets/04-title@2x.png",
						d1x: "/assets/projects/title-2048-assets/04-title@1x.png",
					},
					shadow: {
						d2x: "/assets/projects/title-2048-assets/shadow/04-title@2x.jpg",
						d1x: "/assets/projects/title-2048-assets/shadow/04-title@1x.jpg",
					},
				},
			},
			hex: "#E0915F",
			role: ["Web/Product Designer"],
			services: ["Interactive Design", "UI", "UX"],
			lead: "With the rising market of virtual content merchandising, We design and release a new product function that enables users to better monetize the video content on their brands for Squarespace.",
			description:
				"With the rising market of virtual content merchandising, Squarespace releases a new product function that enables users to better monetize the video content on their brands. Our role is to identify the key product components for the video collection, design the video player and related elements, and optimize the end user experience with well defined layout design.",
			more: {
				d2x: "/assets/projects/more-assets/04-more@2x.jpg",
				d1x: "/assets/projects/more-assets/04-more@1x.jpg",
				mob: "/assets/projects/more-assets/04-more@1x.jpg",
				pre: "/assets/projects/more-assets/04-more@pre.jpg",
			},
			thumbnail: {
				left: {
					media: "image",
					src: {
						d2x: "/assets/projects/thumb-assets/04-thumb-R@2x.jpg",
						d1x: "/assets/projects/thumb-assets/04-thumb-R@1x.jpg",
						mob: "/assets/projects/thumb-assets/04-thumb-R@1x.jpg",
					},
				},
				right: {
					media: "image",
					src: {
						d2x: "/assets/projects/thumb-assets/04-thumb-L@2x.jpg",
						d1x: "/assets/projects/thumb-assets/04-thumb-L@1x.jpg",
					},
				},
			},
		},
		{
			slug: "piggys-greetings",
			year: "2019",
			title: {
				str: "Piggy’s Greetings",
				array: ["Piggy’s", "Greetings"],
				src: {
					normal: {
						d2x: "/assets/projects/title-2048-assets/05-title@2x.png",
						d1x: "/assets/projects/title-2048-assets/05-title@1x.png",
					},
					shadow: {
						d2x: "/assets/projects/title-2048-assets/shadow/05-title@2x.jpg",
						d1x: "/assets/projects/title-2048-assets/shadow/05-title@1x.jpg",
					},
				},
			},
			hex: "#FF7D95",
			role: ["Web Designer", "Art Director"],
			services: ["Web Design", "Art Direction", "Illustration"],
			lead: "To greet the coming of the year of Pig, we collaborate on this fun side project and create this eventful website as an online greeting card.",
			description:
				"To greet the coming of the year of Pig, we collaborate on this fun side project and create this eventful website as an online greeting card. Visitors can select a template or make their own piggy drawing on the site. The drawings will be transformed into a virtual firework. Visitors can share the link of their custom firework to friends and family, along with the new year greetings they write.",
			more: {
				d2x: "/assets/projects/more-assets/05-more@2x.jpg",
				d1x: "/assets/projects/more-assets/05-more@1x.jpg",
				mob: "/assets/projects/more-assets/05-more@1x.jpg",
				pre: "/assets/projects/more-assets/05-more@pre.jpg",
			},
			thumbnail: {
				left: {
					media: "image",
					src: {
						d2x: "/assets/projects/thumb-assets/05-thumb-L@2x.jpg",
						d1x: "/assets/projects/thumb-assets/05-thumb-L@1x.jpg",
						mob: "/assets/projects/thumb-assets/05-thumb-L@1x.jpg",
					},
				},
				right: {
					media: "image",
					src: {
						d2x: "/assets/projects/thumb-assets/05-thumb-R@2x.jpg",
						d1x: "/assets/projects/thumb-assets/05-thumb-R@1x.jpg",
					},
				},
			},
		},
		{
			slug: "gwbi-monastery",
			year: "2019",
			title: {
				str: "GWBI Monastery",
				array: ["GWBI", "Monastery"],
				src: {
					normal: {
						d2x: "/assets/projects/title-2048-assets/06-title@2x.png",
						d1x: "/assets/projects/title-2048-assets/06-title@1x.png",
					},
					shadow: {
						d2x: "/assets/projects/title-2048-assets/shadow/06-title@2x.jpg",
						d1x: "/assets/projects/title-2048-assets/shadow/06-title@1x.jpg",
					},
				},
			},
			hex: "#B1B275",
			role: ["Web Designer", "Art Director"],
			services: ["Branding", "Web Design", "Art Direction"],
			lead: "GWBI is a buddhist monastery located at Prince Edward Island. We help build the new identity and the online presence for them to tell their story and advocate beliefs.",
			description:
				"GWBI is a buddhist monastery located at Prince Edward Island, Canada. Seeing the growing population on the island, the monastery would love to have a new image to attract larger audience. We collaborate closely with the founders in creating the new identity, and help build the online presence for them to tell their story and advocate beliefs.",
			more: {
				d2x: "/assets/projects/more-assets/06-more@2x.jpg",
				d1x: "/assets/projects/more-assets/06-more@1x.jpg",
				mob: "/assets/projects/more-assets/06-more@1x.jpg",
				pre: "/assets/projects/more-assets/06-more@pre.jpg",
			},
			thumbnail: {
				left: {
					media: "image",
					src: {
						d2x: "/assets/projects/thumb-assets/06-thumb-L@2x.jpg",
						d1x: "/assets/projects/thumb-assets/06-thumb-L@1x.jpg",
						mob: "/assets/projects/thumb-assets/06-thumb-L@1x.jpg",
					},
				},
				right: {
					media: "image",
					src: {
						d2x: "/assets/projects/thumb-assets/06-thumb-R@2x.jpg",
						d1x: "/assets/projects/thumb-assets/06-thumb-R@1x.jpg",
					},
				},
			},
		},
		{
			slug: "k-hl-dev-22",
			year: "2022",
			title: {
				str: "K-HL Dev 22",
				array: ["K-HL Dev", "22"],
				src: {
					normal: {
						d2x: "/assets/projects/title-2048-assets/07-title@2x.png",
						d1x: "/assets/projects/title-2048-assets/07-title@1x.png",
					},
					shadow: {
						d2x: "/assets/projects/title-2048-assets/shadow/07-title@2x.jpg",
						d1x: "/assets/projects/title-2048-assets/shadow/07-title@1x.jpg",
					},
				},
			},
			hex: "#9F81DE",
			role: ["Web Designer", "Art Director"],
			services: ["Branding", "Web Design", "Art Direction"],
			lead: "Collaborate with Kin in auditing his online presence and revamping his website from a straightforward portfolio to a scalable digital infrastructure to showcase his expanding client list and innovative projects.",
			description:
				"Kin is a Toronto/New York based creative developer. In the year of 2022, he audits his online presence and revamps his website from a straightforward portfolio to a scalable digital infrastructure to showcase his expanding client list and innovative projects. The full site is coming soon.",
			more: {
				d2x: "/assets/projects/more-assets/07-more@2x.jpg",
				d1x: "/assets/projects/more-assets/07-more@1x.jpg",
				mob: "/assets/projects/more-assets/07-more@1x.jpg",
				pre: "/assets/projects/more-assets/07-more@pre.jpg",
			},
			thumbnail: {
				left: {
					media: "image",
					src: {
						d2x: "/assets/projects/thumb-assets/07-thumb-L@2x.jpg",
						d1x: "/assets/projects/thumb-assets/07-thumb-L@1x.jpg",
						mob: "/assets/projects/thumb-assets/07-thumb-L@1x.jpg",
					},
				},
				right: {
					media: "image",
					src: {
						d2x: "/assets/projects/thumb-assets/07-thumb-R@2x.jpg",
						d1x: "/assets/projects/thumb-assets/07-thumb-R@1x.jpg",
					},
				},
			},
		},
	],
	eC = [
		{
			filename: "afterlife",
			width: 1920,
			height: 1200,
			media: "video",
			imagetype: "jpg",
		},
		{
			filename: "business-card",
			width: 1240,
			height: 1200,
			media: "image",
			imagetype: "png",
		},
		{
			filename: "carousel-swap",
			width: 1920,
			height: 1080,
			media: "video",
			imagetype: "jpg",
		},
		{
			filename: "cd",
			width: 1200,
			height: 1200,
			media: "image",
			imagetype: "png",
		},
		{
			filename: "denfer",
			width: 1920,
			height: 1080,
			media: "video",
			imagetype: "jpg",
		},
		{
			filename: "dore-pack",
			width: 1920,
			height: 1200,
			media: "image",
			imagetype: "jpg",
		},
		{
			filename: "floral",
			width: 1200,
			height: 1200,
			media: "video",
			imagetype: "jpg",
			src: {
				d2x: "floral-900.mp4",
				d1x: "floral-720.mp4",
				mob: "floral-720.mp4",
			},
		},
		{
			filename: "form-and-footer",
			width: 1920,
			height: 1080,
			media: "video",
			imagetype: "jpg",
		},
		{
			filename: "zine-3",
			width: 720,
			height: 1024,
			media: "video",
			imagetype: "jpg",
			src: {
				d2x: "zine-3-720.mp4",
				d1x: "zine-3-720.mp4",
				mob: "zine-3-720.mp4",
			},
		},
		{
			filename: "glacier",
			width: 1920,
			height: 1010,
			media: "image",
			imagetype: "jpg",
		},
		{
			filename: "ins-dore",
			width: 1920,
			height: 1080,
			media: "image",
			imagetype: "jpg",
		},
		{
			filename: "jellyfish",
			width: 1920,
			height: 1080,
			media: "image",
			imagetype: "jpg",
		},
		{
			filename: "join-us-pa",
			width: 1920,
			height: 1080,
			media: "video",
			imagetype: "jpg",
		},
		{
			filename: "khl",
			width: 1200,
			height: 1200,
			media: "image",
			imagetype: "jpg",
		},
		{
			filename: "mood-ring",
			width: 1920,
			height: 1200,
			media: "video",
			imagetype: "jpg",
		},
		{
			filename: "nanyang-wall",
			width: 1310,
			height: 1200,
			media: "image",
			imagetype: "png",
		},
		{
			filename: "pa-homepage",
			width: 1920,
			height: 1080,
			media: "video",
			imagetype: "jpg",
		},
		{
			filename: "zine-2",
			width: 720,
			height: 1024,
			media: "image",
			imagetype: "jpg",
		},
		{
			filename: "package-concept",
			width: 800,
			height: 1200,
			media: "image",
			imagetype: "jpg",
		},
		{
			filename: "review-page",
			width: 1920,
			height: 1080,
			media: "video",
			imagetype: "jpg",
		},
		{
			filename: "secret-section-denfer",
			width: 1920,
			height: 1200,
			media: "image",
			imagetype: "jpg",
		},
		{
			filename: "social-embed",
			width: 1920,
			height: 1080,
			media: "video",
			imagetype: "jpg",
		},
		{
			filename: "split-screen",
			width: 1920,
			height: 1080,
			media: "video",
			imagetype: "jpg",
		},
		{
			filename: "zine-1",
			width: 720,
			height: 1024,
			media: "image",
			imagetype: "jpg",
		},
		{
			filename: "tattoo-web-concept",
			width: 1920,
			height: 1200,
			media: "image",
			imagetype: "png",
		},
		{
			filename: "zine-4",
			width: 720,
			height: 1024,
			media: "image",
			imagetype: "jpg",
		},
		{
			filename: "tibet1",
			width: 800,
			height: 1200,
			media: "image",
			imagetype: "jpg",
		},
		{
			filename: "tsogyal",
			width: 800,
			height: 1200,
			media: "image",
			imagetype: "jpg",
		},
	],
	tC = {
		marquee: [
			{
				d2x: "mq-assets/1@2x.png",
				d1x: "mq-assets/1@1x.png",
				mob: "mq-assets/1@mb.png",
				pre: "mq-assets/1@pre.png",
			},
			{
				d2x: "mq-assets/2@2x.png",
				d1x: "mq-assets/2@1x.png",
				mob: "mq-assets/2@mb.png",
				pre: "mq-assets/2@pre.png",
			},
			{
				d2x: "mq-assets/3@2x.png",
				d1x: "mq-assets/3@1x.png",
				mob: "mq-assets/3@mb.png",
				pre: "mq-assets/3@pre.png",
			},
			{
				d2x: "mq-assets/4@2x.png",
				d1x: "mq-assets/4@1x.png",
				mob: "mq-assets/4@mb.png",
				pre: "mq-assets/4@pre.png",
			},
			{
				d2x: "mq-assets/5@2x.png",
				d1x: "mq-assets/5@1x.png",
				mob: "mq-assets/5@mb.png",
				pre: "mq-assets/5@pre.png",
			},
			{
				d2x: "mq-assets/6@2x.png",
				d1x: "mq-assets/6@1x.png",
				mob: "mq-assets/6@mb.png",
				pre: "mq-assets/6@pre.png",
			},
			{
				d2x: "mq-assets/7@2x.png",
				d1x: "mq-assets/7@1x.png",
				mob: "mq-assets/7@mb.png",
				pre: "mq-assets/7@pre.png",
			},
			{
				d2x: "mq-assets/8@2x.png",
				d1x: "mq-assets/8@1x.png",
				mob: "mq-assets/8@mb.png",
				pre: "mq-assets/8@pre.png",
			},
			{
				d2x: "mq-assets/9@2x.png",
				d1x: "mq-assets/9@1x.png",
				mob: "mq-assets/9@mb.png",
				pre: "mq-assets/9@pre.png",
			},
		],
		contents: [
			{
				width: 1920,
				height: 1180,
				media: "video",
				layout: "full",
				poster: {
					d2x: "images-assets/1@2x.jpg",
					d1x: "images-assets/1@1x.jpg",
					mob: "images-assets/1@mb.jpg",
					pre: "images-assets/1@pre.jpg",
				},
				src: {
					d2x: "video-assets/1-1440.mp4",
					d1x: "video-assets/1-1280.mp4",
					mob: "video-assets/1-720.mp4",
				},
			},
			{
				width: 1920,
				height: 2390,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/2@2x.jpg",
					d1x: "images-assets/2@1x.jpg",
					mob: "images-assets/2@mb.jpg",
					pre: "images-assets/2@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 2790,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/3@2x.jpg",
					d1x: "images-assets/3@1x.jpg",
					mob: "images-assets/3@mb.jpg",
					pre: "images-assets/3@pre.jpg",
				},
			},
			{
				layout: "grid",
				array: [
					null,
					{
						width: 1280,
						height: 1438,
						media: "image",
						src: {
							d2x: "images-assets/4@2x.jpg",
							d1x: "images-assets/4@1x.jpg",
							mob: "images-assets/4@mb.jpg",
							pre: "images-assets/4@pre.jpg",
						},
					},
				],
			},
			{
				width: 1920,
				height: 1045,
				media: "video",
				layout: "padding",
				poster: {
					d2x: "images-assets/5@2x.jpg",
					d1x: "images-assets/5@1x.jpg",
					mob: "images-assets/5@mb.jpg",
					pre: "images-assets/5@pre.jpg",
				},
				src: {
					d2x: "video-assets/5-1440.mp4",
					d1x: "video-assets/5-1280.mp4",
					mob: "video-assets/5-720.mp4",
				},
			},
			{
				layout: "html",
				html: '<h3 class="f-num f-18">Social Campaigns</h3><p>We art direct the product feature marketing on social media to increase brand awareness</p>',
			},
			{
				width: 1920,
				height: 2104,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/6@2x.jpg",
					d1x: "images-assets/6@1x.jpg",
					mob: "images-assets/6@mb.jpg",
					pre: "images-assets/6@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 1080,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/7@2x.jpg",
					d1x: "images-assets/7@1x.jpg",
					mob: "images-assets/7@mb.jpg",
					pre: "images-assets/7@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 1132,
				media: "video",
				layout: "padding",
				poster: {
					d2x: "images-assets/8@2x.jpg",
					d1x: "images-assets/8@1x.jpg",
					mob: "images-assets/8@mb.jpg",
					pre: "images-assets/8@pre.jpg",
				},
				src: {
					d2x: "video-assets/8-1440.mp4",
					d1x: "video-assets/8-1280.mp4",
					mob: "video-assets/8-720.mp4",
				},
			},
			{
				width: 1920,
				height: 1132,
				media: "video",
				layout: "padding",
				poster: {
					d2x: "images-assets/9@2x.jpg",
					d1x: "images-assets/9@1x.jpg",
					mob: "images-assets/9@mb.jpg",
					pre: "images-assets/9@pre.jpg",
				},
				src: {
					d2x: "video-assets/9-1440.mp4",
					d1x: "video-assets/9-1280.mp4",
					mob: "video-assets/9-720.mp4",
				},
			},
			{
				width: 1920,
				height: 2104,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/10@2x.jpg",
					d1x: "images-assets/10@1x.jpg",
					mob: "images-assets/10@mb.jpg",
					pre: "images-assets/10@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 1080,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/11@2x.jpg",
					d1x: "images-assets/11@1x.jpg",
					mob: "images-assets/11@mb.jpg",
					pre: "images-assets/11@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 1132,
				media: "video",
				layout: "padding",
				poster: {
					d2x: "images-assets/12@2x.jpg",
					d1x: "images-assets/12@1x.jpg",
					mob: "images-assets/12@mb.jpg",
					pre: "images-assets/12@pre.jpg",
				},
				src: {
					d2x: "video-assets/12-1440.mp4",
					d1x: "video-assets/12-1280.mp4",
					mob: "video-assets/12-720.mp4",
				},
			},
			{
				width: 1920,
				height: 1132,
				media: "video",
				layout: "padding",
				poster: {
					d2x: "images-assets/13@2x.jpg",
					d1x: "images-assets/13@1x.jpg",
					mob: "images-assets/13@mb.jpg",
					pre: "images-assets/13@pre.jpg",
				},
				src: {
					d2x: "video-assets/13-1440.mp4",
					d1x: "video-assets/13-1280.mp4",
					mob: "video-assets/13-720.mp4",
				},
			},
			{
				width: 1920,
				height: 1106,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/14@2x.jpg",
					d1x: "images-assets/14@1x.jpg",
					mob: "images-assets/14@mb.jpg",
					pre: "images-assets/14@pre.jpg",
				},
			},
		],
	},
	iC = {
		marquee: [
			{
				d2x: "mq-assets/1@2x.png",
				d1x: "mq-assets/1@1x.png",
				mob: "mq-assets/1@mb.png",
				pre: "mq-assets/1@pre.png",
			},
			{
				d2x: "mq-assets/2@2x.png",
				d1x: "mq-assets/2@1x.png",
				mob: "mq-assets/2@mb.png",
				pre: "mq-assets/2@pre.png",
			},
			{
				d2x: "mq-assets/3@2x.png",
				d1x: "mq-assets/3@1x.png",
				mob: "mq-assets/3@mb.png",
				pre: "mq-assets/3@pre.png",
			},
			{
				d2x: "mq-assets/4@2x.png",
				d1x: "mq-assets/4@1x.png",
				mob: "mq-assets/4@mb.png",
				pre: "mq-assets/4@pre.png",
			},
			{
				d2x: "mq-assets/5@2x.png",
				d1x: "mq-assets/5@1x.png",
				mob: "mq-assets/5@mb.png",
				pre: "mq-assets/5@pre.png",
			},
			{
				d2x: "mq-assets/6@2x.png",
				d1x: "mq-assets/6@1x.png",
				mob: "mq-assets/6@mb.png",
				pre: "mq-assets/6@pre.png",
			},
			{
				d2x: "mq-assets/7@2x.png",
				d1x: "mq-assets/7@1x.png",
				mob: "mq-assets/7@mb.png",
				pre: "mq-assets/7@pre.png",
			},
			{
				d2x: "mq-assets/8@2x.png",
				d1x: "mq-assets/8@1x.png",
				mob: "mq-assets/8@mb.png",
				pre: "mq-assets/8@pre.png",
			},
			{
				d2x: "mq-assets/9@2x.png",
				d1x: "mq-assets/9@1x.png",
				mob: "mq-assets/9@mb.png",
				pre: "mq-assets/9@pre.png",
			},
		],
		contents: [
			{
				width: 1920,
				height: 1080,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/1@2x.jpg",
					d1x: "images-assets/1@1x.jpg",
					mob: "images-assets/1@mb.jpg",
					pre: "images-assets/1@pre.jpg",
				},
			},
			{
				layout: "grid",
				array: [
					{
						width: 1280,
						height: 1297,
						media: "image",
						src: {
							d2x: "images-assets/2@2x.jpg",
							d1x: "images-assets/2@1x.jpg",
							mob: "images-assets/2@mb.jpg",
							pre: "images-assets/2@pre.jpg",
						},
					},
				],
			},
			{
				width: 1920,
				height: 1180,
				media: "video",
				layout: "padding",
				poster: {
					d2x: "images-assets/3@2x.jpg",
					d1x: "images-assets/3@1x.jpg",
					mob: "images-assets/3@mb.jpg",
					pre: "images-assets/3@pre.jpg",
				},
				src: {
					d2x: "video-assets/3-1440.mp4",
					d1x: "video-assets/3-1280.mp4",
					mob: "video-assets/3-720.mp4",
				},
			},
			{
				width: 1920,
				height: 1080,
				media: "image",
				layout: "padding",
				src: {
					d2x: "images-assets/4@2x.jpg",
					d1x: "images-assets/4@1x.jpg",
					mob: "images-assets/4@mb.jpg",
					pre: "images-assets/4@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 1080,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/5@2x.jpg",
					d1x: "images-assets/5@1x.jpg",
					mob: "images-assets/5@mb.jpg",
					pre: "images-assets/5@pre.jpg",
				},
			},
			{
				layout: "grid",
				array: [
					{
						width: 1280,
						height: 1440,
						media: "image",
						src: {
							d2x: "images-assets/6-1@2x.jpg",
							d1x: "images-assets/6-1@1x.jpg",
							mob: "images-assets/6-1@mb.jpg",
							pre: "images-assets/6-1@pre.jpg",
						},
					},
					{
						width: 1280,
						height: 1440,
						media: "image",
						src: {
							d2x: "images-assets/6-2@2x.jpg",
							d1x: "images-assets/6-2@1x.jpg",
							mob: "images-assets/6-2@mb.jpg",
							pre: "images-assets/6-2@pre.jpg",
						},
					},
					null,
					{
						width: 1280,
						height: 1440,
						media: "image",
						src: {
							d2x: "images-assets/7-2@2x.jpg",
							d1x: "images-assets/7-2@1x.jpg",
							mob: "images-assets/7-2@mb.jpg",
							pre: "images-assets/7-2@pre.jpg",
						},
					},
				],
			},
			{
				width: 1920,
				height: 1080,
				media: "image",
				layout: "padding",
				src: {
					d2x: "images-assets/8@2x.jpg",
					d1x: "images-assets/8@1x.jpg",
					mob: "images-assets/8@mb.jpg",
					pre: "images-assets/8@pre.jpg",
				},
			},
			{
				layout: "grid",
				array: [
					{
						width: 1280,
						height: 1510,
						media: "video",
						poster: {
							d2x: "images-assets/9-1@2x.jpg",
							d1x: "images-assets/9-1@1x.jpg",
							mob: "images-assets/9-1@mb.jpg",
							pre: "images-assets/9-1@pre.jpg",
						},
						src: {
							d2x: "video-assets/9-1-1440.mp4",
							d1x: "video-assets/9-1-1280.mp4",
							mob: "video-assets/9-1-720.mp4",
						},
					},
				],
			},
			{
				width: 1920,
				height: 1080,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/10@2x.jpg",
					d1x: "images-assets/10@1x.jpg",
					mob: "images-assets/10@mb.jpg",
					pre: "images-assets/10@pre.jpg",
				},
			},
			{
				layout: "grid",
				array: [
					{
						width: 1280,
						height: 1440,
						media: "video",
						poster: {
							d2x: "images-assets/11-1@2x.jpg",
							d1x: "images-assets/11-1@1x.jpg",
							mob: "images-assets/11-1@mb.jpg",
							pre: "images-assets/11-1@pre.jpg",
						},
						src: {
							d2x: "video-assets/11-1-1440.mp4",
							d1x: "video-assets/11-1-1280.mp4",
							mob: "video-assets/11-1-720.mp4",
						},
					},
					{
						width: 1280,
						height: 1440,
						media: "image",
						src: {
							d2x: "images-assets/11-2@2x.jpg",
							d1x: "images-assets/11-2@1x.jpg",
							mob: "images-assets/11-2@mb.jpg",
							pre: "images-assets/11-2@pre.jpg",
						},
					},
				],
			},
			{
				width: 1920,
				height: 950,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/12@2x.jpg",
					d1x: "images-assets/12@1x.jpg",
					mob: "images-assets/12@mb.jpg",
					pre: "images-assets/12@pre.jpg",
				},
			},
		],
	},
	sC = {
		marquee: [
			{
				d2x: "mq-assets/1@2x.png",
				d1x: "mq-assets/1@1x.png",
				mob: "mq-assets/1@mb.png",
				pre: "mq-assets/1@pre.png",
			},
			{
				d2x: "mq-assets/2@2x.png",
				d1x: "mq-assets/2@1x.png",
				mob: "mq-assets/2@mb.png",
				pre: "mq-assets/2@pre.png",
			},
			{
				d2x: "mq-assets/3@2x.png",
				d1x: "mq-assets/3@1x.png",
				mob: "mq-assets/3@mb.png",
				pre: "mq-assets/3@pre.png",
			},
			{
				d2x: "mq-assets/4@2x.png",
				d1x: "mq-assets/4@1x.png",
				mob: "mq-assets/4@mb.png",
				pre: "mq-assets/4@pre.png",
			},
			{
				d2x: "mq-assets/5@2x.png",
				d1x: "mq-assets/5@1x.png",
				mob: "mq-assets/5@mb.png",
				pre: "mq-assets/5@pre.png",
			},
			{
				d2x: "mq-assets/6@2x.png",
				d1x: "mq-assets/6@1x.png",
				mob: "mq-assets/6@mb.png",
				pre: "mq-assets/6@pre.png",
			},
			{
				d2x: "mq-assets/7@2x.png",
				d1x: "mq-assets/7@1x.png",
				mob: "mq-assets/7@mb.png",
				pre: "mq-assets/7@pre.png",
			},
			{
				d2x: "mq-assets/8@2x.png",
				d1x: "mq-assets/8@1x.png",
				mob: "mq-assets/8@mb.png",
				pre: "mq-assets/8@pre.png",
			},
			{
				d2x: "mq-assets/9@2x.png",
				d1x: "mq-assets/9@1x.png",
				mob: "mq-assets/9@mb.png",
				pre: "mq-assets/9@pre.png",
			},
		],
		contents: [
			{
				width: 1920,
				height: 1080,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/1@2x.jpg",
					d1x: "images-assets/1@1x.jpg",
					mob: "images-assets/1@mb.jpg",
					pre: "images-assets/1@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 945,
				media: "image",
				layout: "padding",
				src: {
					d2x: "images-assets/2@2x.jpg",
					d1x: "images-assets/2@1x.jpg",
					mob: "images-assets/2@mb.jpg",
					pre: "images-assets/2@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 845,
				media: "image",
				layout: "padding",
				src: {
					d2x: "images-assets/3@2x.jpg",
					d1x: "images-assets/3@1x.jpg",
					mob: "images-assets/3@mb.jpg",
					pre: "images-assets/3@pre.jpg",
				},
			},
			{
				layout: "grid",
				array: [
					{
						width: 1280,
						height: 1476,
						media: "video",
						poster: {
							d2x: "images-assets/4-1@2x.jpg",
							d1x: "images-assets/4-1@1x.jpg",
							mob: "images-assets/4-1@mb.jpg",
							pre: "images-assets/4-1@pre.jpg",
						},
						src: {
							d2x: "video-assets/4-1-1440.mp4",
							d1x: "video-assets/4-1-1280.mp4",
							mob: "video-assets/4-1-720.mp4",
						},
					},
					{
						width: 1280,
						height: 1476,
						media: "image",
						src: {
							d2x: "images-assets/4-2@2x.jpg",
							d1x: "images-assets/4-2@1x.jpg",
							mob: "images-assets/4-2@mb.jpg",
							pre: "images-assets/4-2@pre.jpg",
						},
					},
					{
						width: 1280,
						height: 1476,
						media: "image",
						src: {
							d2x: "images-assets/5-1@2x.jpg",
							d1x: "images-assets/5-1@1x.jpg",
							mob: "images-assets/5-1@mb.jpg",
							pre: "images-assets/5-1@pre.jpg",
						},
					},
					{
						width: 1280,
						height: 1476,
						media: "image",
						src: {
							d2x: "images-assets/5-2@2x.jpg",
							d1x: "images-assets/5-2@1x.jpg",
							mob: "images-assets/5-2@mb.jpg",
							pre: "images-assets/5-2@pre.jpg",
						},
					},
				],
			},
			{
				width: 1920,
				height: 1014,
				media: "video",
				layout: "padding",
				poster: {
					d2x: "images-assets/6@2x.jpg",
					d1x: "images-assets/6@1x.jpg",
					mob: "images-assets/6@mb.jpg",
					pre: "images-assets/6@pre.jpg",
				},
				src: {
					d2x: "video-assets/6-1440.mp4",
					d1x: "video-assets/6-1280.mp4",
					mob: "video-assets/6-720.mp4",
				},
			},
			{
				width: 1920,
				height: 982,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/7@2x.jpg",
					d1x: "images-assets/7@1x.jpg",
					mob: "images-assets/7@mb.jpg",
					pre: "images-assets/7@pre.jpg",
				},
			},
			{
				layout: "grid",
				array: [
					{
						width: 1280,
						height: 1410,
						media: "image",
						src: {
							d2x: "images-assets/8-1@2x.jpg",
							d1x: "images-assets/8-1@1x.jpg",
							mob: "images-assets/8-1@mb.jpg",
							pre: "images-assets/8-1@pre.jpg",
						},
					},
					{
						width: 1280,
						height: 1410,
						media: "image",
						src: {
							d2x: "images-assets/8-2@2x.jpg",
							d1x: "images-assets/8-2@1x.jpg",
							mob: "images-assets/8-2@mb.jpg",
							pre: "images-assets/8-2@pre.jpg",
						},
					},
				],
			},
			{
				layout: "html",
				html: '<h3 class="f-num f-18">Squarespace website editor</h3><p>Our design system allows you to achieve multitudes of different layout options</p>',
			},
			{
				width: 1920,
				height: 1184,
				media: "video",
				layout: "padding",
				poster: {
					d2x: "images-assets/9@2x.jpg",
					d1x: "images-assets/9@1x.jpg",
					mob: "images-assets/9@mb.jpg",
					pre: "images-assets/9@pre.jpg",
				},
				src: {
					d2x: "video-assets/9-1440.mp4",
					d1x: "video-assets/9-1280.mp4",
					mob: "video-assets/9-720.mp4",
				},
			},
			{
				width: 1920,
				height: 1104,
				media: "image",
				layout: "padding",
				src: {
					d2x: "images-assets/10@2x.jpg",
					d1x: "images-assets/10@1x.jpg",
					mob: "images-assets/10@mb.jpg",
					pre: "images-assets/10@pre.jpg",
				},
			},
			{
				layout: "grid",
				array: [
					{
						width: 1280,
						height: 1387,
						media: "image",
						src: {
							d2x: "images-assets/11-1@2x.jpg",
							d1x: "images-assets/11-1@1x.jpg",
							mob: "images-assets/11-1@mb.jpg",
							pre: "images-assets/11-1@pre.jpg",
						},
					},
				],
			},
			{
				width: 1920,
				height: 1080,
				media: "video",
				layout: "padding",
				poster: {
					d2x: "images-assets/12@2x.jpg",
					d1x: "images-assets/12@1x.jpg",
					mob: "images-assets/12@mb.jpg",
					pre: "images-assets/12@pre.jpg",
				},
				src: {
					d2x: "video-assets/12-1440.mp4",
					d1x: "video-assets/12-1280.mp4",
					mob: "video-assets/12-720.mp4",
				},
			},
		],
	},
	nC = {
		marquee: [
			{
				d2x: "mq-assets/1@2x.png",
				d1x: "mq-assets/1@1x.png",
				mob: "mq-assets/1@mb.png",
				pre: "mq-assets/1@pre.png",
			},
			{
				d2x: "mq-assets/2@2x.png",
				d1x: "mq-assets/2@1x.png",
				mob: "mq-assets/2@mb.png",
				pre: "mq-assets/2@pre.png",
			},
			{
				d2x: "mq-assets/3@2x.png",
				d1x: "mq-assets/3@1x.png",
				mob: "mq-assets/3@mb.png",
				pre: "mq-assets/3@pre.png",
			},
			{
				d2x: "mq-assets/4@2x.png",
				d1x: "mq-assets/4@1x.png",
				mob: "mq-assets/4@mb.png",
				pre: "mq-assets/4@pre.png",
			},
			{
				d2x: "mq-assets/5@2x.png",
				d1x: "mq-assets/5@1x.png",
				mob: "mq-assets/5@mb.png",
				pre: "mq-assets/5@pre.png",
			},
			{
				d2x: "mq-assets/6@2x.png",
				d1x: "mq-assets/6@1x.png",
				mob: "mq-assets/6@mb.png",
				pre: "mq-assets/6@pre.png",
			},
			{
				d2x: "mq-assets/7@2x.png",
				d1x: "mq-assets/7@1x.png",
				mob: "mq-assets/7@mb.png",
				pre: "mq-assets/7@pre.png",
			},
			{
				d2x: "mq-assets/8@2x.png",
				d1x: "mq-assets/8@1x.png",
				mob: "mq-assets/8@mb.png",
				pre: "mq-assets/8@pre.png",
			},
			{
				d2x: "mq-assets/9@2x.png",
				d1x: "mq-assets/9@1x.png",
				mob: "mq-assets/9@mb.png",
				pre: "mq-assets/9@pre.png",
			},
		],
		contents: [
			{
				width: 1920,
				height: 854,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/1@2x.jpg",
					d1x: "images-assets/1@1x.jpg",
					mob: "images-assets/1@mb.jpg",
					pre: "images-assets/1@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 1310,
				media: "image",
				layout: "padding",
				src: {
					d2x: "images-assets/2@2x.jpg",
					d1x: "images-assets/2@1x.jpg",
					mob: "images-assets/2@mb.jpg",
					pre: "images-assets/2@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 1070,
				media: "image",
				layout: "padding",
				src: {
					d2x: "images-assets/3@2x.jpg",
					d1x: "images-assets/3@1x.jpg",
					mob: "images-assets/3@mb.jpg",
					pre: "images-assets/3@pre.jpg",
				},
			},
			{
				layout: "grid",
				array: [
					{
						width: 1280,
						height: 1200,
						media: "image",
						src: {
							d2x: "images-assets/4-1@2x.jpg",
							d1x: "images-assets/4-1@1x.jpg",
							mob: "images-assets/4-1@mb.jpg",
							pre: "images-assets/4-1@pre.jpg",
						},
					},
					{
						width: 1280,
						height: 1200,
						media: "image",
						src: {
							d2x: "images-assets/4-2@2x.jpg",
							d1x: "images-assets/4-2@1x.jpg",
							mob: "images-assets/4-2@mb.jpg",
							pre: "images-assets/4-2@pre.jpg",
						},
					},
				],
			},
			{
				width: 1920,
				height: 1308,
				media: "video",
				layout: "padding",
				poster: {
					d2x: "images-assets/5@2x.jpg",
					d1x: "images-assets/5@1x.jpg",
					mob: "images-assets/5@mb.jpg",
					pre: "images-assets/5@pre.jpg",
				},
				src: {
					d2x: "video-assets/5-1440.mp4",
					d1x: "video-assets/5-1280.mp4",
					mob: "video-assets/5-720.mp4",
				},
			},
			{
				layout: "grid",
				array: [
					{
						width: 1280,
						height: 1220,
						media: "image",
						src: {
							d2x: "images-assets/6-1@2x.jpg",
							d1x: "images-assets/6-1@1x.jpg",
							mob: "images-assets/6-1@mb.jpg",
							pre: "images-assets/6-1@pre.jpg",
						},
					},
					{
						width: 1280,
						height: 1220,
						media: "image",
						src: {
							d2x: "images-assets/6-2@2x.jpg",
							d1x: "images-assets/6-2@1x.jpg",
							mob: "images-assets/6-2@mb.jpg",
							pre: "images-assets/6-2@pre.jpg",
						},
					},
				],
			},
			{
				width: 1920,
				height: 1096,
				media: "video",
				layout: "padding",
				poster: {
					d2x: "images-assets/7@2x.jpg",
					d1x: "images-assets/7@1x.jpg",
					mob: "images-assets/7@mb.jpg",
					pre: "images-assets/7@pre.jpg",
				},
				src: {
					d2x: "video-assets/7-1440.mp4",
					d1x: "video-assets/7-1280.mp4",
					mob: "video-assets/7-720.mp4",
				},
			},
		],
	},
	rC = {
		marquee: [
			{
				d2x: "mq-assets/1@2x.png",
				d1x: "mq-assets/1@1x.png",
				mob: "mq-assets/1@mb.png",
				pre: "mq-assets/1@pre.png",
			},
			{
				d2x: "mq-assets/2@2x.png",
				d1x: "mq-assets/2@1x.png",
				mob: "mq-assets/2@mb.png",
				pre: "mq-assets/2@pre.png",
			},
			{
				d2x: "mq-assets/3@2x.png",
				d1x: "mq-assets/3@1x.png",
				mob: "mq-assets/3@mb.png",
				pre: "mq-assets/3@pre.png",
			},
			{
				d2x: "mq-assets/4@2x.png",
				d1x: "mq-assets/4@1x.png",
				mob: "mq-assets/4@mb.png",
				pre: "mq-assets/4@pre.png",
			},
			{
				d2x: "mq-assets/5@2x.png",
				d1x: "mq-assets/5@1x.png",
				mob: "mq-assets/5@mb.png",
				pre: "mq-assets/5@pre.png",
			},
			{
				d2x: "mq-assets/6@2x.png",
				d1x: "mq-assets/6@1x.png",
				mob: "mq-assets/6@mb.png",
				pre: "mq-assets/6@pre.png",
			},
			{
				d2x: "mq-assets/7@2x.png",
				d1x: "mq-assets/7@1x.png",
				mob: "mq-assets/7@mb.png",
				pre: "mq-assets/7@pre.png",
			},
			{
				d2x: "mq-assets/8@2x.png",
				d1x: "mq-assets/8@1x.png",
				mob: "mq-assets/8@mb.png",
				pre: "mq-assets/8@pre.png",
			},
			{
				d2x: "mq-assets/9@2x.png",
				d1x: "mq-assets/9@1x.png",
				mob: "mq-assets/9@mb.png",
				pre: "mq-assets/9@pre.png",
			},
		],
		contents: [
			{
				width: 1920,
				height: 1080,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/1@2x.jpg",
					d1x: "images-assets/1@1x.jpg",
					mob: "images-assets/1@mb.jpg",
					pre: "images-assets/1@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 1080,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/2@2x.jpg",
					d1x: "images-assets/2@1x.jpg",
					mob: "images-assets/2@mb.jpg",
					pre: "images-assets/2@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 1080,
				media: "image",
				layout: "padding",
				src: {
					d2x: "images-assets/3@2x.jpg",
					d1x: "images-assets/3@1x.jpg",
					mob: "images-assets/3@mb.jpg",
					pre: "images-assets/3@pre.jpg",
				},
			},
			{
				layout: "grid",
				array: [
					null,
					{
						width: 1280,
						height: 1280,
						media: "video",
						poster: {
							d2x: "images-assets/4-1@2x.jpg",
							d1x: "images-assets/4-1@1x.jpg",
							mob: "images-assets/4-1@mb.jpg",
							pre: "images-assets/4-1@pre.jpg",
						},
						src: {
							d2x: "video-assets/4-2-1440.mp4",
							d1x: "video-assets/4-2-1280.mp4",
							mob: "video-assets/4-2-720.mp4",
						},
					},
				],
			},
			{
				width: 1920,
				height: 1118,
				media: "video",
				layout: "padding",
				poster: {
					d2x: "images-assets/5@2x.jpg",
					d1x: "images-assets/5@1x.jpg",
					mob: "images-assets/5@mb.jpg",
					pre: "images-assets/5@pre.jpg",
				},
				src: {
					d2x: "video-assets/5-1440.mp4",
					d1x: "video-assets/5-1280.mp4",
					mob: "video-assets/5-720.mp4",
				},
			},
			{
				width: 1920,
				height: 1118,
				media: "video",
				layout: "padding",
				poster: {
					d2x: "images-assets/6@2x.jpg",
					d1x: "images-assets/6@1x.jpg",
					mob: "images-assets/6@mb.jpg",
					pre: "images-assets/6@pre.jpg",
				},
				src: {
					d2x: "video-assets/6-1440.mp4",
					d1x: "video-assets/6-1280.mp4",
					mob: "video-assets/6-720.mp4",
				},
			},
			{
				layout: "grid",
				array: [
					{
						width: 1280,
						height: 1268,
						media: "image",
						src: {
							d2x: "images-assets/7-1@2x.jpg",
							d1x: "images-assets/7-1@1x.jpg",
							mob: "images-assets/7-1@mb.jpg",
							pre: "images-assets/7-1@pre.jpg",
						},
					},
					null,
					null,
					{
						width: 1280,
						height: 1280,
						media: "video",
						poster: {
							d2x: "images-assets/8-2@2x.jpg",
							d1x: "images-assets/8-2@1x.jpg",
							mob: "images-assets/8-2@mb.jpg",
							pre: "images-assets/8-2@pre.jpg",
						},
						src: {
							d2x: "video-assets/8-1280.mp4",
							d1x: "video-assets/8-1280.mp4",
							mob: "video-assets/8-720.mp4",
						},
					},
				],
			},
			{
				width: 1920,
				height: 1080,
				media: "image",
				layout: "padding",
				src: {
					d2x: "images-assets/9@2x.jpg",
					d1x: "images-assets/9@1x.jpg",
					mob: "images-assets/9@mb.jpg",
					pre: "images-assets/9@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 962,
				media: "video",
				layout: "padding",
				poster: {
					d2x: "images-assets/10@2x.jpg",
					d1x: "images-assets/10@1x.jpg",
					mob: "images-assets/10@mb.jpg",
					pre: "images-assets/10@pre.jpg",
				},
				src: {
					d2x: "video-assets/10-1920.mp4",
					d1x: "video-assets/10-1280.mp4",
					mob: "video-assets/10-720.mp4",
				},
			},
		],
	},
	aC = {
		marquee: [
			{
				d2x: "mq-assets/1@2x.png",
				d1x: "mq-assets/1@1x.png",
				mob: "mq-assets/1@mb.png",
				pre: "mq-assets/1@pre.png",
			},
			{
				d2x: "mq-assets/2@2x.png",
				d1x: "mq-assets/2@1x.png",
				mob: "mq-assets/2@mb.png",
				pre: "mq-assets/2@pre.png",
			},
			{
				d2x: "mq-assets/3@2x.png",
				d1x: "mq-assets/3@1x.png",
				mob: "mq-assets/3@mb.png",
				pre: "mq-assets/3@pre.png",
			},
			{
				d2x: "mq-assets/4@2x.png",
				d1x: "mq-assets/4@1x.png",
				mob: "mq-assets/4@mb.png",
				pre: "mq-assets/4@pre.png",
			},
			{
				d2x: "mq-assets/5@2x.png",
				d1x: "mq-assets/5@1x.png",
				mob: "mq-assets/5@mb.png",
				pre: "mq-assets/5@pre.png",
			},
			{
				d2x: "mq-assets/6@2x.png",
				d1x: "mq-assets/6@1x.png",
				mob: "mq-assets/6@mb.png",
				pre: "mq-assets/6@pre.png",
			},
			{
				d2x: "mq-assets/7@2x.png",
				d1x: "mq-assets/7@1x.png",
				mob: "mq-assets/7@mb.png",
				pre: "mq-assets/7@pre.png",
			},
			{
				d2x: "mq-assets/8@2x.png",
				d1x: "mq-assets/8@1x.png",
				mob: "mq-assets/8@mb.png",
				pre: "mq-assets/8@pre.png",
			},
			{
				d2x: "mq-assets/9@2x.png",
				d1x: "mq-assets/9@1x.png",
				mob: "mq-assets/9@mb.png",
				pre: "mq-assets/9@pre.png",
			},
		],
		contents: [
			{
				width: 1920,
				height: 1080,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/1@2x.jpg",
					d1x: "images-assets/1@1x.jpg",
					mob: "images-assets/1@mb.jpg",
					pre: "images-assets/1@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 1004,
				media: "video",
				layout: "padding",
				poster: {
					d2x: "images-assets/2@2x.jpg",
					d1x: "images-assets/2@1x.jpg",
					mob: "images-assets/2@mb.jpg",
					pre: "images-assets/2@pre.jpg",
				},
				src: {
					d2x: "video-assets/2-1920.mp4",
					d1x: "video-assets/2-1280.mp4",
					mob: "video-assets/2-720.mp4",
				},
			},
			{
				layout: "grid",
				array: [
					{
						width: 1280,
						height: 1424,
						media: "video",
						poster: {
							d2x: "images-assets/3-1@2x.jpg",
							d1x: "images-assets/3-1@1x.jpg",
							mob: "images-assets/3-1@mb.jpg",
							pre: "images-assets/3-1@pre.jpg",
						},
						src: {
							d2x: "video-assets/3-1-1280.mp4",
							d1x: "video-assets/3-1-1280.mp4",
							mob: "video-assets/3-1-720.mp4",
						},
					},
					{
						width: 1280,
						height: 1424,
						media: "image",
						src: {
							d2x: "images-assets/3-2@2x.jpg",
							d1x: "images-assets/3-2@1x.jpg",
							mob: "images-assets/3-2@mb.jpg",
							pre: "images-assets/3-2@pre.jpg",
						},
					},
				],
			},
			{
				width: 1920,
				height: 980,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/4@2x.jpg",
					d1x: "images-assets/4@1x.jpg",
					mob: "images-assets/4@mb.jpg",
					pre: "images-assets/4@pre.jpg",
				},
			},
			{
				layout: "grid",
				array: [
					{
						width: 1280,
						height: 1200,
						media: "image",
						src: {
							d2x: "images-assets/5-1@2x.jpg",
							d1x: "images-assets/5-1@1x.jpg",
							mob: "images-assets/5-1@mb.jpg",
							pre: "images-assets/5-1@pre.jpg",
						},
					},
					{
						width: 1280,
						height: 1200,
						media: "image",
						src: {
							d2x: "images-assets/5-2@2x.jpg",
							d1x: "images-assets/5-2@1x.jpg",
							mob: "images-assets/5-2@mb.jpg",
							pre: "images-assets/5-2@pre.jpg",
						},
					},
				],
			},
			{
				width: 1920,
				height: 920,
				media: "image",
				layout: "padding",
				src: {
					d2x: "images-assets/6@2x.jpg",
					d1x: "images-assets/6@1x.jpg",
					mob: "images-assets/6@mb.jpg",
					pre: "images-assets/6@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 1004,
				media: "video",
				layout: "padding",
				poster: {
					d2x: "images-assets/7@2x.jpg",
					d1x: "images-assets/7@1x.jpg",
					mob: "images-assets/7@mb.jpg",
					pre: "images-assets/7@pre.jpg",
				},
				src: {
					d2x: "video-assets/7-1920.mp4",
					d1x: "video-assets/7-1280.mp4",
					mob: "video-assets/7-720.mp4",
				},
			},
			{
				width: 1920,
				height: 1066,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/8@2x.jpg",
					d1x: "images-assets/8@1x.jpg",
					mob: "images-assets/8@mb.jpg",
					pre: "images-assets/8@pre.jpg",
				},
			},
		],
	},
	oC = {
		marquee: [
			{
				d2x: "mq-assets/1@2x.png",
				d1x: "mq-assets/1@1x.png",
				mob: "mq-assets/1@mb.png",
				pre: "mq-assets/1@pre.png",
			},
			{
				d2x: "mq-assets/2@2x.png",
				d1x: "mq-assets/2@1x.png",
				mob: "mq-assets/2@mb.png",
				pre: "mq-assets/2@pre.png",
			},
			{
				d2x: "mq-assets/3@2x.png",
				d1x: "mq-assets/3@1x.png",
				mob: "mq-assets/3@mb.png",
				pre: "mq-assets/3@pre.png",
			},
			{
				d2x: "mq-assets/4@2x.png",
				d1x: "mq-assets/4@1x.png",
				mob: "mq-assets/4@mb.png",
				pre: "mq-assets/4@pre.png",
			},
			{
				d2x: "mq-assets/5@2x.png",
				d1x: "mq-assets/5@1x.png",
				mob: "mq-assets/5@mb.png",
				pre: "mq-assets/5@pre.png",
			},
			{
				d2x: "mq-assets/6@2x.png",
				d1x: "mq-assets/6@1x.png",
				mob: "mq-assets/6@mb.png",
				pre: "mq-assets/6@pre.png",
			},
			{
				d2x: "mq-assets/7@2x.png",
				d1x: "mq-assets/7@1x.png",
				mob: "mq-assets/7@mb.png",
				pre: "mq-assets/7@pre.png",
			},
			{
				d2x: "mq-assets/8@2x.png",
				d1x: "mq-assets/8@1x.png",
				mob: "mq-assets/8@mb.png",
				pre: "mq-assets/8@pre.png",
			},
			{
				d2x: "mq-assets/9@2x.png",
				d1x: "mq-assets/9@1x.png",
				mob: "mq-assets/9@mb.png",
				pre: "mq-assets/9@pre.png",
			},
		],
		contents: [
			{
				width: 1920,
				height: 1080,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/1@2x.jpg",
					d1x: "images-assets/1@1x.jpg",
					mob: "images-assets/1@mb.jpg",
					pre: "images-assets/1@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 1080,
				media: "video",
				layout: "padding",
				poster: {
					d2x: "images-assets/2@2x.jpg",
					d1x: "images-assets/2@1x.jpg",
					mob: "images-assets/2@mb.jpg",
					pre: "images-assets/2@pre.jpg",
				},
				src: {
					d2x: "video-assets/2-1920.mp4",
					d1x: "video-assets/2-1280.mp4",
					mob: "video-assets/2-720.mp4",
				},
			},
			{
				width: 1920,
				height: 1046,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/3@2x.jpg",
					d1x: "images-assets/3@1x.jpg",
					mob: "images-assets/3@mb.jpg",
					pre: "images-assets/3@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 1070,
				media: "image",
				layout: "padding",
				src: {
					d2x: "images-assets/4@2x.jpg",
					d1x: "images-assets/4@1x.jpg",
					mob: "images-assets/4@mb.jpg",
					pre: "images-assets/4@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 1184,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/5@2x.jpg",
					d1x: "images-assets/5@1x.jpg",
					mob: "images-assets/5@mb.jpg",
					pre: "images-assets/5@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 1058,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/6@2x.jpg",
					d1x: "images-assets/6@1x.jpg",
					mob: "images-assets/6@mb.jpg",
					pre: "images-assets/6@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 1398,
				media: "image",
				layout: "padding",
				src: {
					d2x: "images-assets/7@2x.jpg",
					d1x: "images-assets/7@1x.jpg",
					mob: "images-assets/7@mb.jpg",
					pre: "images-assets/7@pre.jpg",
				},
			},
			{
				width: 1920,
				height: 980,
				media: "image",
				layout: "full",
				src: {
					d2x: "images-assets/8@2x.jpg",
					d1x: "images-assets/8@1x.jpg",
					mob: "images-assets/8@mb.jpg",
					pre: "images-assets/8@pre.jpg",
				},
			},
		],
	},
	lC = () => ({
		works: [...Q2],
		archive: [...eC],
		single: {
			"expressibility-campaign": tC,
			"unfold-templates": iC,
			"design-tool-x-sqsp": sC,
			"online-classes-seller": nC,
			"piggys-greetings": rC,
			"gwbi-monastery": aC,
			"k-hl-dev-22": oC,
		},
		info: {},
		sns: [],
	});

function En(i) {
	if (i === void 0)
		throw new ReferenceError(
			"this hasn'trigger been initialised - super() hasn'trigger been called",
		);
	return i;
}

function Uy(i, element) {
	((i.prototype = Object.create(element.prototype)),
		(i.prototype.constructor = i),
		(i.__proto__ = element));
}

/*!
 * Usagi Detector 1.0.1
 * @license Copyright, Kenta Toshikura
 * Last update : 2023/11/11
 * Require : ismobilejs
 */
class UsagiDetector {
	constructor(element = {}) {
		((this.wrap = element.wrap ? element.wrap : document.querySelector("html")),
			(this.detect = {
				svg: element.svg ? element.svg : !1,
				deviceChange: element.deviceChange ? element.deviceChange : !1,
			}),
			(this.spec = {
				str: null,
				score: 0,
			}),
			(this.mobileWidth = element.mobileWidth || 767),
			(this.tabletWidth = element.tabletWidth || 1024),
			(this.reduced = !1),
			(this.webp = !0),
			(this.touch = !1),
			(this.retina = !1),
			(this.webgl = !0),
			(this.browser = null),
			(this.legacy = !1),
			(this.os = {
				win: !1,
				mac: !1,
				android: !1,
				ios: !1,
				unknown: !1,
			}),
			(this.device = {
				mobile: !1,
				tablet: !1,
				ipadpro: !1,
				desktop: !1,
				laptop: !1,
				any: !1,
				history: {
					mobile: !1,
					tablet: !1,
					ipadpro: !1,
					desktop: !1,
					laptop: !1,
					any: !1,
				},
			}),
			(this.mode = null),
			(this.ua = window.navigator.userAgent.toLowerCase()),
			(this.ua_ver = window.navigator.appVersion.toLowerCase()),
			this.onRunRabbit());
	}
	
	onRunRabbit() {
		(window.ontouchstart === null && (this.touch = !0),
		window.navigator.platform.indexOf("Win") != -1 && (this.os.win = !0),
			this.onDetectRetina(),
			this.onDetectDevide(),
			this.onDetectOs(),
			this.onDetectSpec(),
			this.onDetectBrows(),
			this.onDetectWebGL(),
			this.onDetectMotionReduced(),
			this.onDetectColorMode(),
			this.onDetectWebP(),
		this.detect.deviceChange && this.addEvents(),
		this.detect.svg && this.onDetectSvg(),
			(this.result = {
				"DETECT.ua": this.ua,
				"DETECT.browser": this.browser,
				"DETECT.legacy": this.legacy,
				"DETECT.spec.str": this.spec.str,
				"DETECT.os.win": this.os.win,
				"DETECT.os.mac": this.os.mac,
				"DETECT.spec.score": this.spec.score,
				"DETECT.reduced": this.reduced,
				"DETECT.webgl": this.webgl,
				"DETECT.device.mobile": this.device.mobile,
				"DETECT.device.desktop": this.device.desktop,
				"DETECT.device.tablet": this.device.tablet,
				"DETECT.touch": this.touch,
				"DETECT.retina": this.retina,
				"DETECT.mode": this.mode,
				"DETECT.webp": this.webp,
			}),
			this.result);
	}
	
	onDetectWebP() {
		const element = document.createElement("canvas");
		typeof document == "object" &&
		(element.getContext &&
		element.getContext("2d") &&
		element.toDataURL("image/webp").indexOf("data:image/webp") === 0
			? (this.webp = !0)
			: (this.webp = !1));
	}
	
	onDetectColorMode() {
		window.matchMedia
			? window.matchMedia("(prefers-color-scheme: dark)").matches
				? (this.mode = "dark")
				: (this.mode = "light")
			: (this.mode = "light");
	}
	
	onDetectRetina() {
		window.devicePixelRatio > 1 && (this.retina = !0);
	}
	
	onDetectSvg() {
		if (
			((this.filter = {
				feDisplacementMap: !1,
				feTurbulence: !1,
			}),
				this.device.desktop)
		)
			switch (this.browser) {
				case "chrome":
				case "firefox":
				case "ie11":
				case "opera":
					((this.filter.feDisplacementMap = !0),
						(this.filter.feTurbulence = !0));
					break;
			}
	}
	
	onDetectMotionReduced() {
		const element = window.matchMedia("(prefers-reduced-motion: reduce)");
		!element || element.matches ? (this.reduced = !0) : (this.reduced = !1);
	}
	
	onDetectWebGL() {
		const element = document.createElement("canvas"),
			trigger =
				element.getContext("webgl") || element.getContext("experimental-webgl");
		((this.webgl = trigger instanceof WebGLRenderingContext),
		this.webgl || (this.legacy = !0));
	}
	
	onDetectDevide() {
		(this.wrap.classList.remove(
			"is-any",
			"is-mobile",
			"is-tablet",
			"is-not-any",
			"is-large-tablet",
		),
			D0(window.navigator.userAgent).phone ||
			window.innerWidth <= this.mobileWidth
				? ((this.device.any = !0),
					(this.device.mobile = !0),
					(this.device.tablet = !1),
					(this.device.desktop = !1),
					this.wrap.classList.add("is-any", "is-mobile"))
				: D0(window.navigator.userAgent).tablet ||
				window.innerWidth <= this.tabletWidth ||
				(!this.getUA("ipad") &&
					this.getUA("macintosh") &&
					"ontouchend" in document)
					? ((this.device.any = !0),
						(this.device.mobile = !1),
						(this.device.tablet = !0),
						(this.device.desktop = !1),
						this.wrap.classList.add("is-any", "is-tablet"),
					window.innerWidth > 1024 &&
					((this.device.ipadpro = !0),
						this.wrap.classList.add("is-large-tablet")))
					: ((this.device.any = !1),
						(this.device.mobile = !1),
						(this.device.tablet = !1),
						(this.device.desktop = !0),
						this.wrap.classList.add("is-not-any"),
					window.innerWidth <= 1366 && (this.laptop = !0)));
	}
	
	getUA(element) {
		return window.navigator.userAgent.toLowerCase().indexOf(element) != -1;
	}
	
	onDetectOs() {
		this.ua.indexOf("windows nt") !== -1
			? (this.os.win = !0)
			: this.ua.indexOf("android") !== -1
				? (this.os.android = !0)
				: this.ua.indexOf("iphone") !== -1 || this.ua.indexOf("ipad") !== -1
					? (this.os.ios = !0)
					: this.ua.indexOf("mac os x") !== -1
						? (this.os.mac = !0)
						: (this.os.unknown = !0);
	}
	
	onDetectSpec() {
		(this.retina
			? ((this.spec.str = "Laptop"),
				(this.spec.score = 7),
			window.screen.width <= 1680 &&
			window.navigator.hardwareConcurrency >= 6 &&
			((this.spec.str = "Laptop HiEnd, Corei5 or higher"),
				(this.spec.score = 8)),
			window.innerWidth === 1680 &&
			window.screen.width === 1680 &&
			window.navigator.hardwareConcurrency >= 6 &&
			((this.spec.str = "Laptop MidEnd, 15 Fullscreen, Corei5 or higher"),
				(this.spec.score = 7)),
			window.screen.width === 1440 &&
			window.navigator.hardwareConcurrency >= 6 &&
			((this.spec.str = "Laptop MidEnd, 13 Fullscreen, Corei5 or higher"),
				(this.spec.score = 8)),
			window.screen.width > 1680 &&
			window.navigator.hardwareConcurrency >= 6 &&
			((this.spec.str = "Desktop MidEnd, Corei5 or higher"),
				(this.spec.score = 9)),
			window.screen.width > 1680 &&
			window.navigator.hardwareConcurrency >= 8 &&
			((this.spec.str = "Desktop HiEnd, Corei7 or higher"),
				(this.spec.score = 10)))
			: ((this.spec.str = "Leagcy"), (this.spec.score = 8)),
			this.device.phone
				? (this.spec.str = "Mobile")
				: this.device.tablet && (this.spec.str = "Tablet"));
	}
	
	onDetectBrows() {
		(this.ua.indexOf("edge") !== -1
			? (this.browser = "edge")
			: this.ua.indexOf("iemobile") !== -1
				? ((this.browser = "iemobile"), (this.legacy = !0), (this.webp = !1))
				: this.ua.indexOf("trident/7") !== -1
					? ((this.browser = "ie11"), (this.legacy = !0), (this.webp = !1))
					: this.ua.indexOf("msie") !== -1 && this.ua.indexOf("opera") === -1
						? ((this.legacy = !0),
							(this.webp = !1),
							this.ua_ver.indexOf("msie 6.") !== -1
								? (this.browser = "ie6")
								: this.ua_ver.indexOf("msie 7.") !== -1
									? (this.browser = "ie7")
									: this.ua_ver.indexOf("msie 8.") !== -1
										? (this.browser = "ie8")
										: this.ua_ver.indexOf("msie 9.") !== -1
											? (this.browser = "ie9")
											: this.ua_ver.indexOf("msie 10.") !== -1 &&
											(this.browser = "ie10"))
						: this.ua.indexOf("chrome") !== -1 && this.ua.indexOf("edge") === -1
							? (this.browser = "chrome")
							: this.ua.indexOf("safari") !== -1 &&
							this.ua.indexOf("chrome") === -1
								? ((this.browser = "safari"),
								this.device.any || (this.legacy = !0))
								: this.ua.indexOf("opera") !== -1
									? (this.browser = "opera")
									: this.ua.indexOf("firefox") !== -1
										? (this.browser = "firefox")
										: (this.browser = "unknown"),
		this.legacy && this.wrap.classList.add("is-legacy"));
	}
	
	addEvents() {
		((this.onResize = this.onResize.bind(this)),
			window.addEventListener("resize", this.onResize));
	}
	
	removeEvents() {
		window.removeEventListener("resize", this.onResize);
	}
	
	onResize() {
		((this.device.history = {
			mobile: this.device.mobile,
			tablet: this.device.tablet,
			ipadpro: this.device.ipadpro,
			desktop: this.device.desktop,
			laptop: this.device.laptop,
			any: this.device.any,
		}),
			this.onDetectDevide());
		let element = 0;
		(Object.keys(this.device.history).forEach((trigger) => {
			this.device.history[trigger] != this.device[trigger] && element++;
		}),
		element != 0 && location.reload());
	}
}

const THREE = Object.freeze(),
	COLOR = {
		local: null,
		table: {
			black: {
				hex: "#1f1f1f",
				three: null,
			},
			white: {
				hex: "#ffffff",
				three: null,
			},
			gray: {
				hex: "#ececec",
				three: null,
			},
		},
		once() {
			(Object.keys(this.table).forEach((i) => {
				const element = this.table[i];
				element.three = new THREE.Color(element.hex);
			}),
				$html.style.setProperty("--c-white", this.table.white.hex),
				$html.style.setProperty("--c-black", this.table.black.hex),
				this.onInit());
		},
		onInit(i) {
		},
	};

/*!
 * Usagi Mouse Trail 1.0.1
 * @license Copyright, Kenta Toshikura
 * Last update : 2023/11/11
 * Require : gsap
 */
class UsagiMouseTrail {
	constructor(element = {}) {
		((this.ratio = element.ratio || 1),
			(this.size = element.size ? element.size * this.ratio : 64 * this.ratio),
			(this.maxAge = element.maxAge || 64),
			(this.ageRatio = element.ageRatio || 0.3),
			(this.ease = element.ease || "power2.out"),
			(this.trails = []),
			(this.intensity = 0),
			this.addEvnets());
	}
	
	raf(element, trigger) {
		for (
			this.addTouch({
				x: element,
				y: trigger,
			});
			this.trails.length > 0 && this.trails[0].age > this.maxAge;
		)
			this.trails.shift();
		for (let start = 0; start < this.trails.length; start++) {
			const end = this.trails[start];
			(end.age++, this.drawTouch(end));
		}
	}
	
	addTouch(element) {
		let trigger = 0;
		const start = this.trails[this.trails.length - 1];
		if (start) {
			const end = start.x - element.x,
				a = start.y - element.y,
				o = end * end + a * a;
			o < window.innerWidth && (trigger = Math.min(o * 1e4, 1));
		}
		(this.trails.push({
			x: element.x,
			y: element.y,
			age: 0,
			force: trigger,
		}),
		this.trails.length > this.maxAge &&
		this.trails.splice(0, this.trails.length - this.maxAge));
	}
	
	drawTouch(element) {
		if (((element.intensity = 1), element.age < this.maxAge * this.ageRatio)) {
			let trigger = element.age / (this.maxAge * this.ageRatio);
			element.intensity = gsap.parseEase(this.ease)(trigger);
		} else {
			let trigger =
				1 -
				(element.age - this.maxAge * this.ageRatio) /
				(this.maxAge * (1 - this.ageRatio));
			element.intensity = gsap.parseEase(this.ease)(trigger);
		}
		element.intensity *= element.force;
	}
	
	onMouseMove(element) {
		const trigger = MOUSE.body.array[2].delta.x / WW,
			start = 1 - MOUSE.body.array[2].delta.y / WH,
			end = {
				x: trigger,
				y: start,
			};
		this.addTouch(end);
	}
	
	addEvnets() {
	}
	
	removeEvents() {
	}
}

/*!
 * Usagi Mouse 1.0.2
 * @license Copyright, Kenta Toshikura
 * Last update : 2023/12/12
 * Require : gsap
 */
class UsagiMouse {
	constructor(element = {}) {
		((this.prop = element),
			(this.isActive = !1),
			(this.isFirst = !1),
			(this.useRAF = element.useRAF ? element.useRAF : !1),
			(this.precision = element.precision ? element.precision : 100),
			(this.isMobile = element.isMobile === !0),
			(this.ease = this.prop.ease ? this.prop.ease : 0.1),
			(this.array = []),
			(this.easeRatio = {
				delta: this.prop.easeRatio ? this.prop.easeRatio.delta : 85,
				acceleration: this.prop.easeRatio
					? this.prop.easeRatio.acceleration
					: 60,
			}),
			(this.x = window.innerWidth / 2),
			(this.y = window.innerHeight / 2),
			(this.currentEvent = null),
			(this.currentTime = performance.now() * 0.001),
			(this.lastTime = 0),
			(this.deltaTime = 0),
		typeof element.onUpdateBefore == "function" &&
		(this.onUpdateBefore = () => element.onUpdateBefore(this)),
		typeof element.onUpdateAfter == "function" &&
		(this.onUpdateAfter = () => element.onUpdateAfter(this)),
		typeof element.onMouseMoveBefore == "function" &&
		(this.onMouseMoveBefore = () => element.onMouseMoveBefore(this)),
		typeof element.onMouseMoveAfter == "function" &&
		(this.onMouseMoveAfter = () => element.onMouseMoveAfter(this)));
		const trigger = {
			active: 0,
			duration: 1,
			ease: "power1.out",
		};
		((this.move = {
			...trigger,
			...element.move,
		}),
			(this.touch = {
				enable: !1,
				active: 0,
				start: {
					enable: !1,
					x: 0,
				},
				ing: {
					x: 0,
					delta: {
						x: 0,
					},
					ease: 0.025,
				},
				end: {
					x: 0,
				},
			}),
			this.onRunRabbit());
	}
	
	onRunRabbit() {
		this.ease.length
			? ((this.isArray = !0), this.onInitArray())
			: ((this.isArray = !1), this.onInitSingle());
	}
	
	onInitSingle() {
		((this.center = {
			x: 0,
			y: 0,
		}),
			(this.shader = {
				x: 0,
				y: 0,
			}),
			(this.delta = {
				x: 0,
				y: 0,
			}),
			(this.acceleration = {
				prevEvent: null,
				x: 0,
				y: 0,
				distance: 0,
				delta: {
					x: 0,
					y: 0,
					distance: 0,
				},
			}),
			this.addEvents(),
			this.onInitGetAcceleration(this.acceleration),
		this.useRAF && this.raf());
	}
	
	onInitArray() {
		this.addEvents();
		for (let element = 0; element < this.ease.length; element++) {
			const trigger = this.ease[element];
			this.array.push({
				ease: trigger,
				center: {
					x: 0,
					y: 0,
				},
				shader: {
					x: 0,
					y: 0,
				},
				delta: {
					x: 0,
					y: 0,
				},
				acceleration: {
					prevEvent: null,
					x: 0,
					y: 0,
					distance: 0,
					delta: {
						x: 0,
						y: 0,
						distance: 0,
					},
				},
				lastTime: 0,
			});
		}
		(this.isMobile ||
		this.array.forEach((element, trigger) => {
			this.onInitGetAcceleration(element.acceleration);
		}),
		this.useRAF && this.raf());
	}
	
	onInitGetAcceleration(element) {
		(clearInterval(element.interval),
			(element.interval = setInterval(() => {
				if (
					(Math.abs(element.delta.x) < 0.001 && (element.delta.x = 0),
					Math.abs(element.delta.y) < 0.001 && (element.delta.y = 0),
					Math.abs(element.delta.distance) < 0.001 &&
					(element.delta.distance = 0),
					element.prevEvent && this.currentEvent)
				) {
					const trigger =
							(this.currentEvent.screenX - element.prevEvent.screenX) * 2,
						start = (this.currentEvent.screenY - element.prevEvent.screenY) * 2;
					((element.x = trigger / (window.innerWidth / 2)),
						(element.y = start / (window.innerHeight / 2)),
						(element.x = Math.max(-1, Math.min(1, element.x))),
						(element.y = Math.max(-1, Math.min(1, element.y))));
					const end =
						Math.sqrt(
							window.innerWidth * window.innerWidth +
							window.innerHeight * window.innerHeight,
						) / 2;
					((element.distance =
						(Math.sqrt(trigger * trigger + start * start) / end) * 10),
						(element.distance = Math.max(0, Math.min(1, element.distance))));
				}
				element.prevEvent = this.currentEvent;
			}, this.precision)));
	}
	
	addEvents() {
		this.isMobile
			? ((this.onTouchStart = this.onTouchStart.bind(this)),
				(this.onTouchMove = this.onTouchMove.bind(this)),
				(this.onTouchEnd = this.onTouchEnd.bind(this)),
				window.addEventListener("touchstart", this.onTouchStart),
				window.addEventListener("touchmove", this.onTouchMove),
				window.addEventListener("touchend", this.onTouchEnd))
			: ((this.onMouseMove = this.onMouseMove.bind(this)),
				window.addEventListener("mousemove", this.onMouseMove));
	}
	
	removeEvents() {
		this.isMobile
			? (window.addEventListener("touchstart", this.onTouchStart),
				window.addEventListener("touchmove", this.onTouchMove),
				window.addEventListener("touchend", this.onTouchEnd))
			: window.removeEventListener("mousemove", this.onMouseMove);
	}
	
	onTouchStart(element) {
		this.isActive = !0;
		let trigger = element.clientX;
		(element.touches &&
		element.touches[0] &&
		(trigger = element.touches[0].clientX),
			(this.touch.enable = !0),
			(this.touch.start.enable = !0),
			(this.touch.start.x = trigger));
	}
	
	onTouchMove(element) {
		let trigger = element.clientX;
		if (
			(element.touches && element.touches[0]
				? (trigger = element.touches[0].clientX)
				: element.originalEvent &&
				element.originalEvent.changedTouches[0] &&
				(trigger = element.originalEvent.changedTouches[0].clientX),
				this.touch.start.enable)
		) {
			const start = this.touch.end.x + (trigger - this.touch.start.x);
			this.touch.ing.x = clamp(start / window.innerWidth, -1, 1);
		}
	}
	
	onTouchEnd(element) {
		((this.touch.start.enable = !1),
			(this.touch.end.x = this.touch.ing.x),
			(this.touch.ing.x = 0));
	}
	
	onMouseMove(element) {
		(this.onMouseMoveBefore && this.onMouseMoveBefore(this),
		this.isFirst ||
		gsap.to(this.move, {
			active: 1,
			duration: this.move.duration,
			ease: this.move.ease,
		}),
			(this.isFirst = !0),
			(this.isActive = !0),
			(this.x = element.clientX),
			(this.y = element.clientY),
			(this.currentEvent = element),
		this.onMouseMoveAfter && this.onMouseMoveAfter(this));
	}
	
	raf() {
		(this.isMobile ? this.onUpdateForMobile() : this.onUpdateForDesktop(),
		this.useRAF && (this.onRAF = requestAnimationFrame(this.raf.bind(this))));
	}
	
	lerp(element, trigger, start) {
		return trigger + (element - trigger) * start;
	}
	
	onUpdateForDesktop() {
		if (
			(this.onUpdateBefore && this.onUpdateBefore(this),
				(this.currentTime = performance.now() * 0.001),
				(this.deltaTime = this.currentTime - this.lastTime),
				this.isArray)
		)
			for (let element = 0; element < this.array.length; element++)
				this.onUpdateDelta(this.array[element]);
		else this.onUpdateDelta(this);
		((this.lastTime = this.currentTime),
		this.onUpdateAfter && this.onUpdateAfter(this));
	}
	
	onUpdateForMobile() {
		((this.touch.ing.delta.x +=
			(this.touch.ing.x - this.touch.ing.delta.x) * this.touch.ing.ease),
			(this.touch.ing.delta.x =
				Math.abs(this.touch.ing.delta.x) > 0.001 ? this.touch.ing.delta.x : 0));
	}
	
	onUpdateDelta(element) {
		const trigger = Math.exp(
			-element.ease * this.easeRatio.acceleration * this.deltaTime,
		);
		((element.acceleration.delta.x = this.lerp(
			element.acceleration.delta.x,
			element.acceleration.x,
			trigger,
		)),
			(element.acceleration.delta.y = this.lerp(
				element.acceleration.delta.y,
				element.acceleration.y,
				trigger,
			)),
			(element.acceleration.delta.distance = this.lerp(
				element.acceleration.delta.distance,
				element.acceleration.distance,
				trigger,
			)));
		const start = Math.exp(
			-element.ease * this.easeRatio.delta * this.deltaTime,
		);
		((element.delta.x = this.lerp(element.delta.x, this.x, start)),
			(element.delta.y = this.lerp(element.delta.y, this.y, start)),
			(element.center.x =
				(element.delta.x - window.innerWidth / 2) / window.innerWidth),
			(element.center.y =
				(element.delta.y - window.innerHeight / 2) / window.innerHeight),
			(element.shader.x = (element.delta.x / window.innerWidth) * 2 - 1),
			(element.shader.y = -(element.delta.y / window.innerHeight) * 2 + 1));
	}
	
	destory() {
		(this.onRAF && cancelAnimationFrame(this.onRAF),
			(this.onRAF = null),
			clearInterval(this.acceleration.interval),
			this.removeEvents());
	}
}

const TRAILS = {
		maxAge: 20,
		once() {
			this.body = new UsagiMouseTrail({
				ease: "expo.out",
				maxAge: this.maxAge,
			});
		},
		raf() {
			var i;
			if ((i = MOUSE == null ? void 0 : MOUSE.body) != null && i.array[2]) {
				const element = MOUSE.body.array[2].delta.x / WW,
					trigger = 1 - MOUSE.body.array[2].delta.y / WH;
				this.body.raf(element, trigger);
			}
		},
	},
	MOUSE = {
		local: null,
		once() {
			let i = [0.025, 0.05, 0.1];
			(DETECT.reduced && (i = [1, 1, 1]),
				(this.body = new UsagiMouse({
					ease: i,
					isMobile: DETECT.device.any,
					move: {
						duration: 2,
					},
					useRAF: !1,
				})));
		},
		raf() {
			this.body.raf();
		},
	},
	CURSOR = {
		timer: null,
		once() {
			this.cursor = document.querySelector(".ui-cursor");
		},
		onMouseEnter(i) {
			(clearTimeout(this.timer), ($html.dataset.cursor = i));
		},
		onMouseLeave() {
			(clearTimeout(this.timer),
				(this.timer = setTimeout(() => {
					$html.dataset.cursor = "none";
				}, 100)));
		},
		onMouseMove(i) {
			i != $html.dataset.cursor && ($html.dataset.cursor = i);
		},
		onDestroy() {
			(clearTimeout(this.timer), ($html.dataset.cursor = "none"));
		},
		raf() {
			var i;
			(i = MOUSE == null ? void 0 : MOUSE.body) != null &&
			i.array[2] &&
			(this.cursor.style.transform =
				"translate3d(" +
				MOUSE.body.array[2].delta.x +
				"px, " +
				MOUSE.body.array[2].delta.y +
				"px,0px)");
		},
	},
	PAGE_TRANSITION = {
		isSingleToWork: !1,
		isWorkToSingle: !1,
		isSingleToSingle: !1,
		log: !1,
		static: !1,
		leaveRatio: 1.5,
		leave: {
			ptPower: {
				tl: null,
				timer: null,
				ing: !1,
				d: 0,
				s: 0.5,
				element: "none",
				label: "WAIT",
			},
			ptWorkTitle: {
				tl: null,
				timer: null,
				ing: !1,
				d: 0,
				s: 1.2,
				element: "power4.inOut",
				label: "WORK_TITLE_X",
			},
			ptInkBleed: {
				tl: null,
				timer: null,
				ing: !1,
				d: 0,
				s: 1.2,
				element: "power2.out",
				label: "INK_BLEED_WORK",
			},
			ptInkBleedForPage: {
				tl: null,
				timer: null,
				ing: !1,
				d: 0,
				s: 1.2,
				element: "power2.out",
				label: "INK_BLEED_PAGE",
			},
			ptFade: {
				tl: null,
				timer: null,
				ing: !1,
				d: 0,
				s: 0.6,
				element: "power2.out",
				label: "FADE",
			},
			ptFadeContents: {
				tl: null,
				timer: null,
				ing: !1,
				d: 0,
				s: 0.6,
				element: "power2.out",
				label: "FADE_SINGLE",
			},
			ptFadeArchive: {
				tl: null,
				timer: null,
				ing: !1,
				d: 0,
				s: 0.6,
				element: "power2.out",
				label: "FADE_ARCHIVE",
			},
			ptBgGradient: {
				tl: null,
				timer: null,
				ing: !1,
				d: 0,
				s: 0.6,
				element: "power2.out",
				label: "BG_GRADIENT",
			},
			ptFadeMouse: {
				tl: null,
				timer: null,
				ing: !1,
				d: 0,
				s: 0.6,
				element: "power2.out",
				label: "FADE_MOUSE",
			},
			ptScaleMouse: {
				tl: null,
				timer: null,
				ing: !1,
				d: 0,
				s: 0.6,
				element: "power2.out",
				label: "SCALE_MOUSE",
			},
		},
		enterRatio: 1.5,
		enter: {
			ptPower: {
				tl: null,
				timer: null,
				ing: !1,
				d: 0,
				s: 0.6,
				element: "none",
				label: "WAIT",
			},
			ptWorkTitle: {
				tl: null,
				timer: null,
				ing: !1,
				d: 0,
				s: 1.2,
				element: "power4.inOut",
				label: "WORK_TITLE_X",
			},
			ptInkBleed: {
				tl: null,
				timer: null,
				ing: !1,
				d: 0,
				s: 2,
				element: "power1.inOut",
				label: "INK_BLEED_WORK",
			},
			ptInkBleedForPage: {
				tl: null,
				timer: null,
				ing: !1,
				d: 0,
				s: 2.6,
				element: "power1.inOut",
				label: "INK_BLEED_PAGE",
			},
			ptFade: {
				tl: null,
				timer: null,
				ing: !1,
				d: 0,
				s: 1.2,
				element: "power2.out",
				label: "FADE",
			},
			ptFadeContents: {
				tl: null,
				timer: null,
				ing: !1,
				d: 0.2,
				s: 1.2,
				element: "power2.out",
				label: "FADE_SINGLE",
			},
			ptFadeArchive: {
				tl: null,
				timer: null,
				ing: !1,
				d: 0.2,
				s: 1.4,
				element: "power2.out",
				label: "FADE_ARCHIVE",
			},
			ptBgGradient: {
				tl: null,
				timer: null,
				ing: !1,
				d: 0,
				s: 5,
				element: "power4.out",
				label: "BG_GRADIENT",
			},
			ptFadeMouse: {
				tl: null,
				timer: null,
				ing: !1,
				d: 0,
				s: 0.6,
				element: "power2.out",
				label: "FADE_MOUSE",
			},
			ptScaleMouse: {
				tl: null,
				timer: null,
				ing: !1,
				d: 0,
				s: 0.6,
				element: "power2.out",
				label: "SCALE_MOUSE",
			},
		},
		animKeys: [],
		page: {
			home: {},
			works: {},
			single: {},
			info: {},
			archive: {},
			"error-404": {},
			"error-500": {},
		},
		pageKeys: Object.keys(this.page),
		next: {
			name: null,
			path: null,
			slug: null,
		},
		prev: {
			name: null,
			path: null,
			slug: null,
		},
		current: {
			name: null,
			path: null,
			slug: null,
		},
		firsttime: !0,
		once() {
			((this.static = DETECT.reduced),
				this.onInitGui(),
				Object.keys(this.leave).forEach((i) => {
					this.animKeys.push(i);
				}),
				Object.keys(this.page).forEach((i) => {
					const element = this.page[i];
					for (let trigger = 0; trigger < this.animKeys.length; trigger++) {
						const start = this.animKeys[trigger];
						element[start] = 0;
					}
					this.pageKeys.push(i);
				}));
		},
		onInitGui() {
		},
		onMount(i) {
			switch (
				((this.current.path = i.fullPath),
					(this.current.slug = i.params.slug),
					i.name)
				) {
				case "index":
					this.current.name = "home";
					break;
				case "works-slug":
					this.current.name = "single";
					break;
				case "archive":
					this.current.name = "archive";
					break;
				case "500":
					this.current.name = "error-500";
					break;
				case "404":
					this.current.name = "error-404";
					break;
				default:
					this.current.name = i.name;
					break;
			}
			if (this.firsttime)
				for (let element = 0; element < this.pageKeys.length; element++) {
					const trigger = this.pageKeys[element],
						start = this.page[trigger];
					switch (trigger) {
						case this.current.name:
							for (let end = 0; end < this.animKeys.length; end++) {
								const a = this.animKeys[end];
								start[a] = 1;
							}
							break;
					}
				}
			(($html.dataset.prevName = this.prev.name),
				($html.dataset.pageName = this.current.name),
				PAGE_TRANSITION_NAV.setNav(this.current.name, this.current.name),
				PAGE_TRANSITION_NAV.onNavi(this.current.name),
				(this.firsttime = !1));
		},
		onSingleToWork(i, element) {
			const start = i.target.getAttribute("href");
			start &&
			((this.isSingleToWork = !0),
				element.push({
					path: start,
				}));
		},
		onWorkToSingle(i, element) {
			const start = i.target.getAttribute("href");
			start &&
			((this.isWorkToSingle = !0),
				element.push({
					path: start,
				}));
		},
		onSingleToSingle(i, element) {
			const start = i.target.getAttribute("href");
			start &&
			((this.isSingleToSingle = !0),
				element.push({
					path: start,
				}));
		},
		onStaticTransition(i, element) {
			i.preventDefault();
			const trigger = i.target.getAttribute("href");
			element.push({
				path: trigger,
			});
		},
		onWatch(i, element) {
			switch (
				((this.next.path = i.fullPath),
					(this.prev.path = element.fullPath),
					(this.next.slug = i.params.slug),
					(this.prev.slug = element.params.slug),
					i.name)
				) {
				case "index":
					((this.next.name = "home"), (this.current.name = "home"));
					break;
				case "works-slug":
					((this.next.name = "single"), (this.current.name = "single"));
					break;
				case "archive":
					((this.next.name = "archive"), (this.current.name = "archive"));
					break;
				case "500":
					((this.next.name = "error-500"), (this.current.name = "error-500"));
					break;
				case "404":
					((this.next.name = "error-404"), (this.current.name = "error-404"));
					break;
				default:
					((this.next.name = i.name), (this.current.name = i.name));
					break;
			}
			switch (element.name) {
				case "index":
					this.prev.name = "home";
					break;
				case "works-slug":
					this.prev.name = "single";
					break;
				case "archive":
					this.prev.name = "archive";
					break;
				case "500":
					this.prev.name = "error-500";
					break;
				case "404":
					this.prev.name = "error-404";
					break;
				default:
					this.prev.name = element.name;
					break;
			}
			(PAGE_TRANSITION_NAV.setNav(this.next.name, this.prev.name),
				PAGE_TRANSITION_NAV.onNavi(this.next.name));
		},
		onBeforeLeave(i) {
			(i.classList.add("is-page-leave"),
				$html.classList.add("is-leave"),
				MENU.onClose());
		},
		onLeave(i, element) {
			(this.onBeforeLeaveAnimation(),
			this.prev.name === "works" &&
			this.next.name === "single" &&
			(this.isWorkToSingle = !0),
			this.prev.name === "single" &&
			this.next.name === "work" &&
			(this.isSingleToWork = !0),
			this.prev.name === "single" &&
			this.next.name === "single" &&
			(this.isSingleToSingle = !0),
				this.static
					? this.staticLeave(i, element)
					: this.isSingleToSingle
						? ((this.page.single.ptFade = 0),
							(this.page.single.ptInkBleed = 0),
							this.onLeaveAnimation(i, element))
						: this.isSingleToWork
							? this.onLeaveAnimation(i, element)
							: this.isWorkToSingle
								? ORIENTATION === "portrait" || DETECT.device.any
									? this.onLeaveAnimation(i, element)
									: ((this.page.single.ptFade = 1),
										(this.page.single.ptInkBleed = 1),
										this.onLeaveAnimationWorkToSingle(i, element))
								: this.onLeaveAnimation(i, element));
		},
		staticLeave(i, element) {
			for (let trigger = 0; trigger < this.pageKeys.length; trigger++) {
				const start = this.pageKeys[trigger],
					end = this.page[start];
				switch (start) {
					case this.current.name:
						for (let a = 0; a < this.animKeys.length; a++) {
							const o = this.animKeys[a];
							end[o] = 1;
						}
						break;
				}
			}
			element();
		},
		onAfterLeave(i) {
		},
		onBeforeEnter(i) {
			(WEBGL_DOM.onDestroy(),
				WEBGL_WORKS.onDestroy(),
				WEBGL_ABOUT.onDestroy(),
				WEBGL_SINGLE.onDestroy(),
				WEBGL_ARCHIVE.onDestroy(),
				PAGE_SCROLL_WORKS.onDestroy(),
				PAGE_SCROLL_NORMAL.onDestroy(),
				PAGE_SCROLL_ARCHIVE.onDestroy(),
				styleTextShuffle.onDestroy(),
				styleInview.onDestroy(),
				styleContain.onDestroy(),
				styleImage.onDestroy(),
				CURSOR.onDestroy(),
				$html.classList.add("is-enter"),
				i.classList.add("is-page-enter"),
				gsap.set(i.querySelectorAll(".c-pt-fade"), {
					opacity: 0,
				}));
		},
		onEnter(i, element) {
			(PAGE_SCROLL_WORKS.onInit(i),
				PAGE_SCROLL_NORMAL.onInit(i),
				PAGE_SCROLL_ARCHIVE.onInit(i),
				WEBGL_DOM.onInit(i),
				WEBGL_ABOUT.onInit(i),
				WEBGL_SINGLE.onInit(i),
				WEBGL_ARCHIVE.onInit(i),
				WEBGL_MOUSE.onInit(),
				WEBGL_404.onInit(),
				styleTextShuffle.onInit(i),
				styleInview.onInit(i),
				styleContain.onInit(i),
				styleImage.onInit(i),
				this.onBeforeEnterAnimation(),
				this.static
					? this.staticEnter(i, element)
					: this.isSingleToSingle
						? this.onEnterAnimation(i, element)
						: this.isWorkToSingle
							? ORIENTATION === "portrait" || DETECT.device.any
								? this.onEnterAnimation(i, element)
								: this.onEnterAnimationWorkToSingle(i, element)
							: this.onEnterAnimation(i, element),
				(this.isSingleToWork = !1),
				(this.isWorkToSingle = !1),
				(this.isSingleToSingle = !1));
		},
		staticEnter(i, element) {
			this.onCompleteBefore(i);
			for (let trigger = 0; trigger < this.pageKeys.length; trigger++) {
				const start = this.pageKeys[trigger],
					end = this.page[start];
				switch (start) {
					case this.next.name:
						for (let a = 0; a < this.animKeys.length; a++) {
							const o = this.animKeys[a];
							end[o] = 1;
						}
						break;
					default:
						for (let a = 0; a < this.animKeys.length; a++) {
							const o = this.animKeys[a];
							end[o] = 0;
						}
						break;
				}
			}
			((i.style.opacity = 1), element());
		},
		onUpdate() {
		},
		onAfterEnter(i) {
			this.onComplete(i);
		},
		onCompleteBefore(i) {
			(i.classList.remove("is-page-enter"),
				$html.classList.remove("is-leave"),
				CURSOR.onDestroy());
		},
		onComplete(i) {
			$html.classList.remove("is-enter");
		},
		onBeforeLeaveAnimation() {
			for (let i = 0; i < this.animKeys.length; i++) {
				const element = this.animKeys[i],
					trigger = this.leave[element];
				((trigger.ing = !0),
				trigger.tl && trigger.tl.kill(),
					(trigger.tl = null),
					(trigger.tl = gsap.timeline()));
				const start = this.enter[element];
				((start.ing = !0), start.tl && start.tl.kill(), (start.tl = null));
			}
		},
		onLeaveAnimationWorkToSingle(i, element) {
			for (let trigger = 0; trigger < this.pageKeys.length; trigger++) {
				const start = this.pageKeys[trigger],
					end = this.page[start];
				switch (start) {
					case "single":
						((end.ptFade = 1),
							(end.ptWorkTitle = 0),
							this.leave.ptWorkTitle.tl
								.to(
									end,
									{
										duration: this.leave.ptWorkTitle.s * this.leaveRatio,
										ease: this.leave.ptWorkTitle.element,
										ptWorkTitle: 1,
									},
									"leave_ptWorkTitle",
								)
								.then(() => {
									this.leave.ptWorkTitle.ing = !1;
								}));
						break;
					case "works":
						((end.ptPower = 0),
							this.leave.ptPower.tl
								.to(
									end,
									{
										delay: this.leave.ptPower.d,
										duration: this.leave.ptPower.s * this.leaveRatio,
										ease: this.leave.ptPower.element,
										ptPower: 1,
									},
									"leave_power",
								)
								.then(() => {
									((this.leave.ptPower.ing = !1), element());
								}),
							(end.ptWorkTitle = 0),
							this.leave.ptWorkTitle.tl
								.to(
									end,
									{
										duration: this.leave.ptWorkTitle.s * this.leaveRatio,
										ease: this.leave.ptWorkTitle.element,
										ptWorkTitle: 1,
									},
									"leave_ptWorkTitle",
								)
								.then(() => {
									this.leave.ptWorkTitle.ing = !1;
								}),
							(end.ptFade = 1),
							this.leave.ptFade.tl.to(
								i.querySelectorAll(".c-pt-fade"),
								{
									delay: this.leave.ptFade.d,
									duration: this.leave.ptFade.s * this.leaveRatio,
									ease: this.leave.ptFade.element,
									opacity: 0,
								},
								"leave_fade",
							),
							this.leave.ptFade.tl
								.to(
									end,
									{
										delay: this.leave.ptFade.d,
										duration: this.leave.ptFade.s * this.leaveRatio,
										ease: this.leave.ptFade.element,
										ptFade: 0,
									},
									"leave_fade",
								)
								.then(() => {
									this.leave.ptFade.ing = !1;
								}),
							(end.ptFadeContents = 1),
							this.leave.ptFadeContents.tl
								.to(
									end,
									{
										delay: this.leave.ptFadeContents.d,
										duration: this.leave.ptFadeContents.s * this.leaveRatio,
										ease: this.leave.ptFadeContents.element,
										ptFadeContents: 0,
									},
									"leave_ptFadeContents",
								)
								.then(() => {
									this.leave.ptFadeContents.ing = !1;
								}),
							(end.ptFadeArchive = 1),
							this.leave.ptFadeArchive.tl
								.to(
									end,
									{
										delay: this.leave.ptFadeArchive.d,
										duration: this.leave.ptFadeArchive.s * this.leaveRatio,
										ease: this.leave.ptFadeArchive.element,
										ptFadeArchive: 0,
									},
									"leave_ptFadeArchive",
								)
								.then(() => {
									this.leave.ptFadeArchive.ing = !1;
								}),
							(end.ptFadeMouse = 1),
							this.leave.ptFadeMouse.tl
								.to(
									end,
									{
										delay: this.leave.ptFadeMouse.d,
										duration: this.leave.ptFadeMouse.s * this.leaveRatio,
										ease: this.leave.ptFadeMouse.element,
										ptFadeMouse: 0,
									},
									"leave_ptFadeMouse",
								)
								.then(() => {
									this.leave.ptFadeMouse.ing = !1;
								}),
							(end.ptScaleMouse = 1),
							this.leave.ptScaleMouse.tl
								.to(
									end,
									{
										delay: this.leave.ptScaleMouse.d,
										duration: this.leave.ptScaleMouse.s * this.leaveRatio,
										ease: this.leave.ptScaleMouse.element,
										ptScaleMouse: 0,
									},
									"leave_ptScaleMouse",
								)
								.then(() => {
									this.leave.ptScaleMouse.ing = !1;
								}));
						break;
				}
			}
		},
		onLeaveAnimation(i, element) {
			for (let trigger = 0; trigger < this.pageKeys.length; trigger++) {
				const start = this.pageKeys[trigger],
					end = this.page[start];
				switch (start) {
					case this.prev.name:
						(this.leave.ptPower.tl
							.to(
								end,
								{
									delay: this.leave.ptPower.d,
									duration: this.leave.ptPower.s * this.leaveRatio,
									ease: this.leave.ptPower.element,
									ptPower: 1,
								},
								"leave_power",
							)
							.then(() => {
								((this.leave.ptPower.ing = !1), element());
							}),
							this.leave.ptWorkTitle.tl
								.to(
									end,
									{
										delay: this.leave.ptWorkTitle.d,
										duration: this.leave.ptWorkTitle.s * this.leaveRatio,
										ease: this.leave.ptWorkTitle.element,
										ptWorkTitle: 1,
									},
									"leave_ptWorkTitle",
								)
								.then(() => {
									this.leave.ptWorkTitle.ing = !1;
								}),
							this.leave.ptFade.tl.to(
								i.querySelectorAll(".c-pt-fade"),
								{
									delay: this.leave.ptFade.d,
									duration: this.leave.ptFade.s * this.leaveRatio,
									ease: this.leave.ptFade.element,
									opacity: 0,
								},
								"leave_fade",
							),
							this.leave.ptFade.tl
								.to(
									end,
									{
										delay: this.leave.ptFade.d,
										duration: this.leave.ptFade.s * this.leaveRatio,
										ease: this.leave.ptFade.element,
										ptFade: 0,
									},
									"leave_fade",
								)
								.then(() => {
									this.leave.ptFade.ing = !1;
								}),
							this.leave.ptFadeContents.tl
								.to(
									end,
									{
										delay: this.leave.ptFadeContents.d,
										duration: this.leave.ptFadeContents.s * this.leaveRatio,
										ease: this.leave.ptFadeContents.element,
										ptFadeContents: 0,
									},
									"leave_ptFadeContents",
								)
								.then(() => {
									this.leave.ptFadeContents.ing = !1;
								}),
							this.leave.ptFadeArchive.tl
								.to(
									end,
									{
										delay: this.leave.ptFadeArchive.d,
										duration: this.leave.ptFadeArchive.s * this.leaveRatio,
										ease: this.leave.ptFadeArchive.element,
										ptFadeArchive: 0,
									},
									"leave_ptFadeArchive",
								)
								.then(() => {
									this.leave.ptFadeArchive.ing = !1;
								}),
							this.leave.ptBgGradient.tl
								.to(
									end,
									{
										delay: this.leave.ptBgGradient.d,
										duration: this.leave.ptBgGradient.s * this.leaveRatio,
										ease: this.leave.ptBgGradient.element,
										ptBgGradient: 0,
									},
									"leave_ptBgGradient",
								)
								.then(() => {
									this.leave.ptBgGradient.ing = !1;
								}),
							this.leave.ptFadeMouse.tl
								.to(
									end,
									{
										delay: this.leave.ptFadeMouse.d,
										duration: this.leave.ptFadeMouse.s * this.leaveRatio,
										ease: this.leave.ptFadeMouse.element,
										ptFadeMouse: 0,
									},
									"leave_ptFadeMouse",
								)
								.then(() => {
									this.leave.ptFadeMouse.ing = !1;
								}),
						this.next.name != "home" &&
						this.next.name != "works" &&
						this.next.name != "info" &&
						this.leave.ptScaleMouse.tl
							.to(
								end,
								{
									delay: this.leave.ptScaleMouse.d,
									duration: this.leave.ptScaleMouse.s * this.leaveRatio,
									ease: this.leave.ptScaleMouse.element,
									ptScaleMouse: 0,
								},
								"leave_ptScaleMouse",
							)
							.then(() => {
								this.leave.ptScaleMouse.ing = !1;
							}));
						break;
				}
			}
		},
		onBeforeEnterAnimation() {
			for (let i = 0; i < this.animKeys.length; i++) {
				const element = this.animKeys[i],
					trigger = this.enter[element];
				((trigger.ing = !0), (trigger.tl = gsap.timeline()));
			}
		},
		onEnterAnimationWorkToSingle(i, element) {
			(clearTimeout(this.leave.ptPower.timer),
				(this.leave.ptPower.timer = setTimeout(() => {
					this.onCompleteBefore(i);
				}, this.leave.ptPower.s * 500)),
				clearTimeout(this.enter.ptPower.timer),
				(this.enter.ptPower.timer = setTimeout(() => {
					for (let trigger = 0; trigger < this.pageKeys.length; trigger++) {
						const start = this.pageKeys[trigger],
							end = this.page[start];
						switch (start) {
							case "single":
								(this.enter.ptPower.tl
									.to(
										end,
										{
											delay: this.enter.ptPower.d,
											duration: this.enter.ptPower.s * this.enterRatio,
											ease: this.enter.ptPower.element,
											ptPower: 1,
										},
										"enter_power",
									)
									.then(() => {
										element();
									}),
									this.enter.ptFade.tl.to(
										i.querySelectorAll(".c-pt-fade"),
										{
											delay: this.enter.ptFade.d,
											duration: this.enter.ptFade.s * this.enterRatio,
											ease: this.enter.ptFade.element,
											opacity: 1,
										},
										"enter_fade",
									),
									this.enter.ptFade.tl.to(
										end,
										{
											delay: this.enter.ptFade.d,
											duration: this.enter.ptFade.s * this.enterRatio,
											ease: this.enter.ptFade.element,
											ptFade: 1,
										},
										"enter_fade",
									),
									this.enter.ptFadeContents.tl.to(
										end,
										{
											delay: this.enter.ptFadeContents.d,
											duration: this.enter.ptFadeContents.s * this.enterRatio,
											ease: this.enter.ptFadeContents.element,
											ptFadeContents: 1,
										},
										"enter_ptFadeContents",
									),
									this.enter.ptFadeMouse.tl.to(
										end,
										{
											delay: this.enter.ptFadeMouse.d,
											duration: this.enter.ptFadeMouse.s * this.enterRatio,
											ease: this.enter.ptFadeMouse.element,
											ptFadeMouse: 1,
										},
										"enter_ptFadeMouse",
									),
									this.enter.ptScaleMouse.tl.to(
										end,
										{
											delay: this.enter.ptScaleMouse.d,
											duration: this.enter.ptScaleMouse.s * this.enterRatio,
											ease: this.enter.ptScaleMouse.element,
											ptScaleMouse: 1,
										},
										"enter_ptScaleMouse",
									));
								break;
							default:
								(this.enter.ptPower.tl
									.to(
										end,
										{
											delay: this.enter.ptPower.d,
											duration: this.enter.ptPower.s * this.enterRatio,
											ease: this.enter.ptPower.element,
											ptPower: 0,
										},
										"enter_power",
									)
									.then(() => {
										this.enter.ptPower.ing = !1;
									}),
									this.enter.ptFade.tl
										.to(
											end,
											{
												delay: this.enter.ptFade.s,
												duration: this.enter.ptFade.s * this.enterRatio,
												ease: this.enter.ptFade.element,
												ptFade: 0,
											},
											"enter_fade",
										)
										.then(() => {
											this.enter.ptFade.ing = !1;
										}),
									this.enter.ptFadeContents.tl
										.to(
											end,
											{
												delay: this.enter.ptFadeContents.s,
												duration: this.enter.ptFadeContents.s * this.enterRatio,
												ease: this.enter.ptFadeContents.element,
												ptFadeContents: 0,
											},
											"enter_ptFadeContents",
										)
										.then(() => {
											this.enter.ptFadeContents.ing = !1;
										}),
									this.enter.ptFadeMouse.tl
										.to(
											end,
											{
												delay: this.enter.ptFadeMouse.s,
												duration: this.enter.ptFadeMouse.s * this.enterRatio,
												ease: this.enter.ptFadeMouse.element,
												ptFadeMouse: 0,
											},
											"enter_ptFadeMouse",
										)
										.then(() => {
											this.enter.ptFadeMouse.ing = !1;
										}),
									this.enter.ptScaleMouse.tl
										.to(
											end,
											{
												delay: this.enter.ptScaleMouse.s,
												duration: this.enter.ptScaleMouse.s * this.enterRatio,
												ease: this.enter.ptScaleMouse.element,
												ptScaleMouse: 0,
											},
											"enter_ptScaleMouse",
										)
										.then(() => {
											this.enter.ptScaleMouse.ing = !1;
										}));
								break;
						}
					}
				}, 100)));
		},
		onEnterAnimation(i, element) {
			(clearTimeout(this.leave.ptPower.timer),
				(this.leave.ptPower.timer = setTimeout(() => {
					this.onCompleteBefore(i);
				}, this.leave.ptPower.s * 500)),
				clearTimeout(this.enter.ptPower.timer),
				(this.enter.ptPower.timer = setTimeout(() => {
					for (let trigger = 0; trigger < this.pageKeys.length; trigger++) {
						const start = this.pageKeys[trigger],
							end = this.page[start];
						switch (start) {
							case this.next.name:
								(this.enter.ptPower.tl
									.to(
										end,
										{
											delay: this.enter.ptPower.d,
											duration: this.enter.ptPower.s * this.enterRatio,
											ease: this.enter.ptPower.element,
											ptPower: 1,
										},
										"enter_power",
									)
									.then(() => {
										((this.enter.ptPower.ing = !1), element());
									}),
									(end.ptInkBleed = 0),
									this.enter.ptInkBleed.tl
										.to(
											end,
											{
												delay: this.enter.ptInkBleed.d,
												duration: this.enter.ptInkBleed.s * this.enterRatio,
												ease: this.enter.ptInkBleed.element,
												ptInkBleed: 1,
											},
											"enter_webgl",
										)
										.then(() => {
											this.enter.ptInkBleed.ing = !1;
										}),
									(end.ptInkBleedForPage = 0),
									this.enter.ptInkBleedForPage.tl
										.to(
											end,
											{
												delay: this.enter.ptInkBleedForPage.d,
												duration:
													this.enter.ptInkBleedForPage.s * this.enterRatio,
												ease: this.enter.ptInkBleedForPage.element,
												ptInkBleedForPage: 1,
											},
											"enter_webgl",
										)
										.then(() => {
											this.enter.ptInkBleedForPage.ing = !1;
										}),
									this.enter.ptWorkTitle.tl
										.to(
											end,
											{
												delay: this.enter.ptWorkTitle.d,
												duration: this.enter.ptWorkTitle.s * this.enterRatio,
												ease: this.enter.ptWorkTitle.element,
												ptWorkTitle: 1,
											},
											"enter_webgl",
										)
										.then(() => {
											this.enter.ptWorkTitle.ing = !1;
										}),
									this.enter.ptFade.tl.to(
										i.querySelectorAll(".c-pt-fade"),
										{
											delay: this.enter.ptFade.d,
											duration: this.enter.ptFade.s * this.enterRatio,
											ease: this.enter.ptFade.element,
											opacity: 1,
										},
										"enter_fade",
									),
									this.enter.ptFade.tl
										.to(
											end,
											{
												delay: this.enter.ptFade.d,
												duration: this.enter.ptFade.s * this.enterRatio,
												ease: this.enter.ptFade.element,
												ptFade: 1,
											},
											"enter_fade",
										)
										.then(() => {
											this.enter.ptFade.ing = !1;
										}),
									this.enter.ptFadeContents.tl
										.to(
											end,
											{
												delay: this.enter.ptFadeContents.d,
												duration: this.enter.ptFadeContents.s * this.enterRatio,
												ease: this.enter.ptFadeContents.element,
												ptFadeContents: 1,
											},
											"enter_ptFadeContents",
										)
										.then(() => {
											this.enter.ptFadeContents.ing = !1;
										}),
									this.enter.ptFadeArchive.tl
										.to(
											end,
											{
												delay: this.enter.ptFadeArchive.d,
												duration: this.enter.ptFadeArchive.s * this.enterRatio,
												ease: this.enter.ptFadeArchive.element,
												ptFadeArchive: 1,
											},
											"enter_ptFadeArchive",
										)
										.then(() => {
											this.enter.ptFadeArchive.ing = !1;
										}),
									this.enter.ptFadeMouse.tl
										.to(
											end,
											{
												delay: this.enter.ptFadeMouse.d,
												duration: this.enter.ptFadeMouse.s * this.enterRatio,
												ease: this.enter.ptFadeMouse.element,
												ptFadeMouse: 1,
											},
											"enter_ptFadeMouse",
										)
										.then(() => {
											this.enter.ptFadeMouse.ing = !1;
										}),
									this.enter.ptScaleMouse.tl
										.to(
											end,
											{
												delay: this.enter.ptScaleMouse.d,
												duration: this.enter.ptScaleMouse.s * this.enterRatio,
												ease: this.enter.ptScaleMouse.element,
												ptScaleMouse: 1,
											},
											"enter_ptScaleMouse",
										)
										.then(() => {
											this.enter.ptScaleMouse.ing = !1;
										}),
									this.enter.ptBgGradient.tl
										.to(
											end,
											{
												delay: this.enter.ptBgGradient.d,
												duration: this.enter.ptBgGradient.s * this.enterRatio,
												ease: this.enter.ptBgGradient.element,
												ptBgGradient: 1,
											},
											"enter_ptBgGradient",
										)
										.then(() => {
											this.enter.ptBgGradient.ing = !1;
										}));
								break;
							default:
								(this.enter.ptPower.tl.to(
									end,
									{
										delay: this.enter.ptPower.d,
										duration: this.enter.ptPower.s * this.enterRatio,
										ease: this.enter.ptPower.element,
										ptPower: 0,
									},
									"enter_power",
								),
									this.enter.ptWorkTitle.tl.to(
										end,
										{
											delay: this.enter.ptWorkTitle.d,
											duration: this.enter.ptWorkTitle.s * this.enterRatio,
											ease: this.enter.ptWorkTitle.element,
											ptWorkTitle: 0,
										},
										"enter_webgl",
									),
									this.enter.ptFade.tl.to(
										end,
										{
											delay: this.enter.ptFade.d,
											duration: this.enter.ptFade.s * this.enterRatio,
											ease: this.enter.ptFade.element,
											ptFade: 0,
										},
										"enter_fade",
									),
									this.enter.ptFadeContents.tl.to(
										end,
										{
											delay: this.enter.ptFadeContents.d,
											duration: this.enter.ptFadeContents.s * this.enterRatio,
											ease: this.enter.ptFadeContents.element,
											ptFadeContents: 0,
										},
										"enter_ptFadeContents",
									),
									this.enter.ptFadeArchive.tl.to(
										end,
										{
											delay: this.enter.ptFadeArchive.d,
											duration: this.enter.ptFadeArchive.s * this.enterRatio,
											ease: this.enter.ptFadeArchive.element,
											ptFadeArchive: 0,
										},
										"enter_ptFadeArchive",
									),
									this.enter.ptFadeMouse.tl.to(
										end,
										{
											delay: this.enter.ptFadeMouse.d,
											duration: this.enter.ptFadeMouse.s * this.enterRatio,
											ease: this.enter.ptFadeMouse.element,
											ptFadeMouse: 0,
										},
										"enter_ptFadeMouse",
									),
								this.next.name != "home" &&
								this.next.name != "works" &&
								this.next.name != "info" &&
								this.enter.ptScaleMouse.tl.to(
									end,
									{
										delay: this.enter.ptScaleMouse.d,
										duration: this.enter.ptScaleMouse.s * this.enterRatio,
										ease: this.enter.ptScaleMouse.element,
										ptScaleMouse: 0,
									},
									"enter_ptFadeMouse",
								),
									this.enter.ptBgGradient.tl.to(
										end,
										{
											delay: this.enter.ptBgGradient.d,
											duration: this.enter.ptBgGradient.s * this.enterRatio,
											ease: this.enter.ptBgGradient.element,
											ptBgGradient: 0,
										},
										"enter_ptBgGradient",
									));
								break;
						}
					}
				}, 100)));
		},
	},
	Transition_NNav = {
		bg: null,
		li: {
			home: {
				el: null,
				rect: null,
				position: {
					x: 0,
					y: 0,
				},
			},
			works: {
				el: null,
				rect: null,
				position: {
					x: 0,
					y: 0,
				},
			},
			info: {
				el: null,
				rect: null,
				position: {
					x: 0,
					y: 0,
				},
			},
			archive: {
				el: null,
				rect: null,
				position: {
					x: 0,
					y: 0,
				},
			},
		},
		keys: ["home", "works", "info", "archive"],
		once() {
			this.bg = document.querySelector(".ui-nav-bg");
			for (let i = 0; i < this.keys.length; i++) {
				const element = this.keys[i];
				this.li[element].el = document.querySelector(
					'.ui-nav-li[data-name="' + element + '"]',
				);
			}
			this.onResize();
		},
		onResize() {
			for (let i = 0; i < this.keys.length; i++) {
				const element = this.keys[i],
					trigger = this.li[element];
				trigger.rect = trigger.el.getBoundingClientRect();
			}
			for (let i = 0; i < this.keys.length; i++) {
				const element = this.keys[i],
					trigger = this.li[element];
				if (i != 0) {
					const start = this.keys[i - 1],
						end = this.li[start];
					trigger.position.x = end.position.x + end.rect.width;
				}
			}
			(this.li, this.onNavi());
		},
		setNav(i = !1, element = !1) {
			if (
				element === "error-404" ||
				element === "single" ||
				PAGE_TRANSITION.firsttime
			) {
				const trigger = this.li[i];
				if (trigger)
					switch (i) {
						case "home":
							gsap.set(this.bg, {
								x: trigger.position.x,
								width: trigger.rect.width,
							});
							break;
						case "works":
							gsap.set(this.bg, {
								x: trigger.position.x,
								width: trigger.rect.width,
							});
							break;
						case "info":
							gsap.set(this.bg, {
								x: trigger.position.x,
								width: trigger.rect.width,
							});
							break;
						case "archive":
							gsap.set(this.bg, {
								x: trigger.position.x,
								width: trigger.rect.width,
							});
							break;
					}
			}
		},
		onNavi(i = !1) {
			const trigger = "expo.out";
			let start = i || PAGE_TRANSITION.current.name;
			const end = this.li[start];
			switch (start) {
				case "home":
					gsap.to(this.bg, {
						duration: 1.2,
						ease: trigger,
						width: end.rect.width,
						x: end.position.x,
						y: "0%",
					});
					break;
				case "works":
					gsap.to(this.bg, {
						duration: 1.2,
						ease: trigger,
						width: end.rect.width,
						x: end.position.x,
						y: "0%",
					});
					break;
				case "info":
					gsap.to(this.bg, {
						duration: 1.2,
						ease: trigger,
						width: end.rect.width,
						x: end.position.x,
						y: "0%",
					});
					break;
				case "archive":
					gsap.to(this.bg, {
						duration: 1.2,
						ease: trigger,
						width: end.rect.width,
						x: end.position.x,
						y: "0%",
					});
					break;
				default:
					gsap.to(this.bg, {
						duration: 1.2,
						ease: trigger,
						y: "100%",
					});
					break;
			}
		},
	};

/*!
 * Usagi Scroll 1.0.3
 * @license Copyright, Kenta Toshikura
 * Last update : 2023/11/25
 * Require : gsap
 * Memo : Hr is not work sync.
 */
class UsagiScroll {
	constructor(element = {}) {
		var f, p, _, m, g, b, x, v, w, E, T, M, U, L, O;
		((this.prop = element),
			(this.ready = !1),
			(this.stopped = !0),
			(this.ing = !1),
			(this.delta1 = 0),
			(this.delta2 = 0),
			(this.reduced = element.reduced ? element.reduced : !1),
			(this.fillscreen = element.fillscreen ? element.fillscreen : !1),
			(this.autocenter = element.autocenter ? element.autocenter : !1),
			(this.dom = typeof element.dom > "u" ? !0 : element.dom),
			(this.html = document.querySelector("html")),
			(this.keyScroll = element.keyScroll !== !1),
			(this.detail = {
				x: 0,
				y: 0,
				d: 0,
			}),
			(this.currentIndex = 0),
			(this.centerIndex = 0),
			(this.disableDragByTagName = element.disableDragByTagName || [
				"BUTTON",
				"A",
				"INPUT",
				"LABEL",
			]),
			(this.enableDragByClassName = element.enableDragByClassName || []),
			(this.wrap = {
				el: this.prop.wrap,
				rect: null,
			}),
			this.wrap.el,
			(this.body = {
				el: this.wrap.el.querySelector(this.prop.body),
				rect: null,
			}),
			this.body.el,
			(this.content = {
				el: this.body.el.querySelector(this.prop.content),
				rect: {
					width: 0,
					height: 0,
				},
				before: null,
				after: null,
			}),
			this.content.el,
			(this.position = {
				el: document.querySelector(".c-position"),
				value: 0,
			}),
			(this.dir = element.dir ? element.dir : "vr"),
			(this.infinite = element.infinite ? element.infinite : !1),
			(this.body.el.dataset.dir = this.dir),
			(this.totalHeight = 0),
			(this.windowHeight =
				this.dir === "hr" ? window.innerWidth : window.innerHeight),
			(this.ease = this.easeorigin = element.ease ? element.ease : 0.2));
		const trigger = {
			enable: !0,
			thumb: !1,
			pivot: !1,
			ratio: 1.8,
			active: !1,
			start: {
				delta: 0,
				x: 0,
				y: 0,
			},
			dist: {
				x: 0,
				y: 0,
				v: 0,
			},
			ing: {
				x: 0,
				y: 0,
			},
			dir: element.touch.dir ? element.touch.dir : this.dir,
			throw: {
				enable:
					element.touch.throw === !0 || element.touch.throw === !1
						? element.touch.throw
						: !0,
				delta: 0,
				history: [],
				speed: 0,
				event: null,
			},
		};
		((this.touch = {
			...trigger,
			...element.touch,
		}),
			(this.scroll = {
				dir: "down",
				progress: 0,
				loop: 0,
				x: 0,
				y: 0,
				top: 0,
				left: 0,
			}),
			(this.tweens = {
				after: null,
			}));
		const start =
				(f = element == null ? void 0 : element.timers) != null && f.complete
					? Number(element.timers.complete)
					: 30,
			end =
				(p = element == null ? void 0 : element.timers) != null && p.after
					? Number(element.timers.after)
					: 500,
			a =
				(_ = element == null ? void 0 : element.timers) != null && _.resize
					? Number(element.timers.resize)
					: 500;
		((this.timers = {
			complete: {
				timer: null,
				wait: start,
			},
			after: {
				timer: null,
				wait: end,
			},
			resize: {
				timer: null,
				wait: a,
			},
		}),
			(this.speed = element.speed || 100),
		this.dir === "vr" &&
		(this.speed *= window.innerHeight / window.innerWidth),
			(this.power = {
				max: element.max ? element.max : 4,
				history: [],
				delta: 0,
				pow0: {
					value: 0,
				},
				pow1: {
					value: 0,
					duration:
						((m = element == null ? void 0 : element.power1) == null
							? void 0
							: m.duration) || 0.2,
					ease:
						((g = element == null ? void 0 : element.power1) == null
							? void 0
							: g.ease) || "power1.out",
					tween: null,
				},
				pow2: {
					value: 0,
					duration:
						((b = element == null ? void 0 : element.power2) == null
							? void 0
							: b.duration) || 1,
					ease:
						((x = element == null ? void 0 : element.power2) == null
							? void 0
							: x.ease) || "power1.out",
					tween: null,
				},
			}),
		typeof element.onUpdateBefore == "function" &&
		(this.onUpdateBefore = () => element.onUpdateBefore(this)),
		typeof element.onUpdateAfter == "function" &&
		(this.onUpdateAfter = () => element.onUpdateAfter(this)));
		const o = element.scrollbar.wrapClassName
				? "." + element.scrollbar.wrapClassName
				: ".c-scrollbar",
			l = element.scrollbar.thumbClassName
				? "." + element.scrollbar.thumbClassName
				: ".c-thumb",
			c = element.scrollbar.pivotClassName
				? "." + element.scrollbar.pivotClassName
				: ".c-pivot",
			h = document.querySelector(o),
			u = document.querySelector(l);
		((w = (v = this.prop) == null ? void 0 : v.scrollbar) != null &&
		w.enable &&
		h &&
		u
			? ((h.dataset.dir = this.dir),
				(this.scrollbar = {
					progress: 0,
					enable: !0,
					wrap: {
						el: h,
						rect: {
							width: 0,
							height: 0,
						},
					},
					thumb: {
						el: u,
						before: u.querySelectorAll(c)[0],
						after: u.querySelectorAll(c)[1],
						volume: 0,
						px: 0,
					},
				}))
			: (this.scrollbar = {
				enable: !1,
			}),
		this.reduced &&
		((this.ease = this.easeorigin = element.ease ? element.ease : 0.2),
			(this.touch.ratio = 1)),
			(this.sync = {
				enable:
					((T = (E = this.prop) == null ? void 0 : E.sync) == null
						? void 0
						: T.enable) === !0
						? !!this.wrap.el.querySelectorAll(
							(U = (M = this.prop) == null ? void 0 : M.sync) == null
								? void 0
								: U.el,
						)
						: !1,
				el: this.wrap.el.querySelectorAll(
					(O = (L = this.prop) == null ? void 0 : L.sync) == null
						? void 0
						: O.el,
				),
			}),
		this.sync.enable && this.wrap.el.classList.add("is-scroll-sync"));
		const d = {
			index: 0,
			ing: !1,
			enable: !1,
			duration: 1,
			ease: "power2.out",
		};
		((this.control = {
			...d,
			...element.control,
		}),
			this.onRunRabbit());
	}
	
	onRunRabbit() {
		if (this.content.el && this.body.el) {
			const element = this.body.el.querySelectorAll(this.prop.section);
			if (this.fillscreen)
				for (let start = 0; start < element.length; start++) {
					const end = element[start];
					((end.style.width = window.innerWidth + "px"),
						(end.style.height = window.innerHeight + "px"));
				}
			else
				for (let start = 0; start < element.length; start++) {
					const end = element[start];
					((end.style.width = "auto"), (end.style.height = "auto"));
				}
			const trigger = this.body.el.querySelectorAll(
				this.prop.section + ".c-clone",
			);
			for (let start = 0; start < trigger.length; start++)
				this.content.el.removeChild(trigger[start]);
			for (; this.totalHeight <= this.windowHeight * 1.5;) {
				const start = this.body.el.querySelectorAll(this.prop.section);
				for (let end = 0; end < start.length; end++) {
					const a = start[end].getBoundingClientRect(),
						o = this.dir === "hr" ? a.width : a.height;
					this.totalHeight += o;
				}
				if (this.totalHeight <= this.windowHeight * 1.5)
					for (let end = 0; end < start.length; end++) {
						const a = start[end].cloneNode(!0);
						(a.classList.add("c-clone"), this.content.el.append(a));
					}
			}
			((this.ready = !0),
				(this.stopped = !1),
				this.addEvents(),
				this.onInitInterSection(),
				this.onResize(0),
			this.autocenter && this.onScrollToIndex(0));
		}
	}
	
	get ease() {
		return this._ease;
	}
	
	get speed() {
		return this._speed;
	}
	
	set ease(element) {
		this._ease = this._easeorigin = element;
	}
	
	set speed(element) {
		this._speed = element;
	}
	
	onInitInterSection() {
		this.sections = {
			el: this.body.el.querySelectorAll(this.prop.section),
			elems: [],
		};
		for (let element = 0; element < this.sections.el.length; element++) {
			const trigger = this.sections.el[element];
			trigger.dataset.index = element;
			const start = trigger.getBoundingClientRect(),
				end =
					this.sync.enable && this.sync.el[element]
						? this.sync.el[element]
						: null,
				a = trigger.dataset.slug ? trigger.dataset.slug : null;
			this.sections.elems.push({
				el: trigger,
				slug: a,
				sync: end,
				inner: trigger.querySelector(this.prop.inner),
				rect: start,
				selected: !1,
				centered: !1,
				visible: !0,
				progress: 0,
				x: 0,
				y: 0,
				cx: 0,
				cy: 0,
			});
		}
	}
	
	onDestroy() {
		(this.touch.throw.event && this.touch.throw.event.kill(),
			this.removeEvents(),
			this.onReset());
	}
	
	onComplete() {
		((this.power.pow0.value = 0),
		this.power.pow1.tween && this.power.pow1.tween.kill(),
			(this.power.pow1.tween = gsap.to(
				this.power.pow1,
				this.power.pow1.duration,
				{
					value: 0,
				},
			)),
		this.power.pow2.tween && this.power.pow2.tween.kill(),
			(this.power.pow2.tween = gsap.to(
				this.power.pow2,
				this.power.pow2.duration,
				{
					value: 0,
				},
			)),
			(this.ing = !1));
	}
	
	getMaxIndex(element) {
		let trigger = 0,
			start = -1 / 0;
		for (let end = 0, a = element.length; end < a; end++)
			start < element[end] && ((start = element[end]), (trigger = end));
		return trigger;
	}
	
	getMinIndex(element) {
		let trigger = 0,
			start = 1 / 0;
		for (let end = 0, a = element.length; end < a; end++)
			start > element[end] && ((start = element[end]), (trigger = end));
		return trigger;
	}
	
	onAfter(element = 1, trigger = "power2.out") {
		if (!this.autocenter) return !1;
		const start =
				this.dir === "hr"
					? this.sections.elems[0].rect.width
					: this.sections.elems[0].rect.height,
			end =
				this.dir === "hr" ? this.content.rect.width : this.content.rect.height,
			a = this.centerIndex + 1,
			o = this.scroll.progress - this.scroll.loop;
		((this.isLastSection = o <= 1 && o >= 1 - 1 / this.sections.elems.length),
			(this.isFirstSection = a === 1 || this.isLastSection),
		this.fillscreen && (this.isFirstSection = a === 1 && this.isLastSection));
		let l =
			a * start + this.scroll.loop * end - this.windowHeight / 2 - start / 2;
		(this.isFirstSection &&
		this.scroll.dir === "down" &&
		(l =
			a * start +
			(this.scroll.loop + 1) * end -
			this.windowHeight / 2 -
			start / 2),
		this.isFirstSection &&
		this.scroll.dir === "up" &&
		(l =
			a * start +
			(this.scroll.loop + 1) * end -
			this.windowHeight / 2 -
			start / 2),
			(this.tweens.after = gsap.to(this, {
				duration: element,
				ease: trigger,
				delta1: l,
			})));
	}
	
	onScrollTo(element = 0, trigger = 1, start = 0, end = "power2.out") {
		(this.onReset(),
			(this.tweens.after = gsap.to(this, {
				duration: trigger,
				ease: end,
				delay: start,
				delta1: element,
			})));
	}
	
	setScrollTo(element = 0, trigger = 1, start = 0, end = "power2.out") {
		if ((this.onReset(), (this.delta1 = element), this.infinite))
			((this.scroll.x = this.delta1),
				(this.scroll.left = this.scroll.x % this.content.rect.width),
				(this.scroll.y = this.delta1),
				(this.scroll.top = this.scroll.y % this.content.rect.height));
		else {
			switch (this.dir) {
				case "hr":
					this.delta1 = this.clamp(
						this.delta1,
						0,
						this.content.rect.width - window.innerWidth,
					);
					break;
				default:
					this.delta1 = this.clamp(
						this.delta1,
						0,
						this.content.rect.height - window.innerHeight,
					);
					break;
			}
			((this.delta2 = this.delta1),
				(this.scroll.x = this.delta2),
				(this.scroll.left = this.delta2),
				(this.scroll.y = this.delta2),
				(this.scroll.top = this.delta2));
		}
	}
	
	onScrollToIndex(
		element = this.currentIndex,
		trigger = 1,
		start = 0,
		end = "power2.out",
	) {
		((this.ing = !0), this.onReset(), this.reduced && (trigger = 0.2));
		const a =
				this.dir === "hr"
					? this.sections.elems[0].rect.width
					: this.sections.elems[0].rect.height,
			o =
				this.dir === "hr" ? this.content.rect.width : this.content.rect.height,
			l = this.clamp(element + 1, 0, this.sections.elems.length),
			c = this.scroll.progress - this.scroll.loop;
		let h = l * a + this.scroll.loop * o - this.windowHeight / 2 - a / 2;
		((this.isLastSection = c <= 1 && c >= 1 - 1 / this.sections.elems.length),
		this.isLastSection &&
		this.scroll.dir === "down" &&
		(h =
			l * a + (this.scroll.loop + 1) * o - this.windowHeight / 2 - a / 2),
		this.isLastSection &&
		this.scroll.dir === "up" &&
		(h =
			l * a + (this.scroll.loop + 1) * o - this.windowHeight / 2 - a / 2),
			(this.tweens.after = gsap.to(this, {
				duration: trigger,
				ease: end,
				delay: start,
				delta1: h,
				onComplete: () => {
					this.ing = !1;
				},
			})));
	}
	
	setScrollToIndex(element = this.currentIndex) {
		(this.onReset(), this.reduced && (s = 0.2));
		const trigger =
				this.dir === "hr"
					? this.sections.elems[0].rect.width
					: this.sections.elems[0].rect.height,
			start =
				this.dir === "hr" ? this.content.rect.width : this.content.rect.height,
			end = this.clamp(element + 1, 0, this.sections.elems.length),
			a = this.scroll.progress - this.scroll.loop;
		this.isLastSection = a <= 1 && a >= 1 - 1 / this.sections.elems.length;
		let o =
			end * trigger +
			this.scroll.loop * start -
			this.windowHeight / 2 -
			trigger / 2;
		if (
			(this.isLastSection &&
			this.scroll.dir === "down" &&
			(o =
				end * trigger +
				(this.scroll.loop + 1) * start -
				this.windowHeight / 2 -
				trigger / 2),
			this.isLastSection &&
			this.scroll.dir === "up" &&
			(o =
				end * trigger +
				(this.scroll.loop + 1) * start -
				this.windowHeight / 2 -
				trigger / 2),
				(this.delta1 = o),
				this.infinite)
		)
			((this.scroll.x = this.delta1),
				(this.scroll.left = this.scroll.x % this.content.rect.width),
				(this.scroll.y = this.delta1),
				(this.scroll.top = this.scroll.y % this.content.rect.height));
		else {
			switch (this.dir) {
				case "hr":
					this.delta1 = this.clamp(
						this.delta1,
						0,
						this.content.rect.width - window.innerWidth,
					);
					break;
				default:
					this.delta1 = this.clamp(
						this.delta1,
						0,
						this.content.rect.height - window.innerHeight,
					);
					break;
			}
			((this.delta2 = this.delta1),
				(this.scroll.x = this.delta2),
				(this.scroll.left = this.delta2),
				(this.scroll.y = this.delta2),
				(this.scroll.top = this.delta2));
		}
		switch (this.dir) {
			case "hr":
				((this.scroll.progress = this.scroll.x / this.content.rect.width),
					(this.scroll.loop = Math.floor(this.scroll.progress)));
				break;
			default:
				((this.scroll.progress = this.scroll.y / this.content.rect.height),
					(this.scroll.loop = Math.floor(this.scroll.progress)));
				break;
		}
	}
	
	onScrollToNext() {
		if (this.ing) return !1;
		((this.control.index = this.currentIndex - 1),
			this.setScrollToIndex(this.control.index),
			this.control.index >= 0 &&
			this.control.index < this.sections.elems.length - 1
				? ((this.control.index += 1),
					this.onScrollToIndex(
						this.control.index,
						this.control.duration,
						0,
						this.control.ease,
					))
				: ((this.control.index = -1),
					this.setScrollToIndex(-1),
					this.onScrollToIndex(
						0,
						this.control.duration,
						0,
						this.control.ease,
					)));
	}
	
	onScrollToPrev() {
		if (this.ing) return !1;
		((this.control.index = this.currentIndex - 1),
			this.setScrollToIndex(this.control.index),
			this.control.index === 0
				? ((this.control.index = -1),
					this.onScrollToIndex(
						this.control.index,
						this.control.duration,
						0,
						this.control.ease,
					),
					(this.control.index = this.sections.elems.length - 1))
				: this.control.index === this.sections.elems.length - 1
					? ((this.control.index = this.sections.elems.length - 1),
						this.setScrollToIndex(this.sections.elems.length - 1),
						this.onScrollToIndex(
							this.sections.elems.length - 2,
							this.control.duration,
							0,
							this.control.ease,
						))
					: ((this.control.index -= 1),
						this.onScrollToIndex(
							this.control.index,
							this.control.duration,
							0,
							this.control.ease,
						)));
	}
	
	scrollSet() {
		if (!this.touch.thumb) return !1;
		this.onReset();
		const element =
				this.dir === "hr"
					? this.sections.elems[0].rect.width
					: this.sections.elems[0].rect.height,
			trigger =
				this.dir === "hr" ? this.content.rect.width : this.content.rect.height;
		switch (this.dir) {
			case "hr":
				const start =
						(this.touch.start.x - this.scrollbar.thumb.px / 2) /
						window.innerWidth,
					end = this.autocenter
						? Math.round((start * trigger) / element) * element
						: start * trigger;
				this.detail.d =
					this.scroll.left =
						this.scroll.x =
							this.delta1 =
								this.delta2 =
									end;
				break;
			default:
				const a =
						(this.touch.start.y - this.scrollbar.thumb.px / 2) /
						window.innerHeight,
					o = this.autocenter
						? Math.round((a * trigger) / element) * element
						: a * trigger;
				this.detail.d =
					this.scroll.top =
						this.scroll.y =
							this.delta1 =
								this.delta2 =
									o;
				break;
		}
		this.power.delta = Math.abs(this.detail.d);
	}
	
	killTweens(element) {
		(element && element.kill(), (element = null));
	}
	
	clamp(element, trigger, start) {
		return Math.min(Math.max(element, trigger), start);
	}
	
	roundToNearest(element, trigger = 1e-6) {
		return Math.abs(1 - Math.abs(element)) < trigger
			? Math.sign(element)
			: element;
	}
	
	raf() {
		if (!this.ready) return !1;
		if (
			(this.onUpdateBefore && this.onUpdateBefore(),
			this.reduced != this.prop.reduced &&
			(this.onReset(),
				this.reduced
					? ((this.ease = this.easeorigin = 1),
						(this.touch.ratio = 1),
						(this.prop.reduced = !0))
					: ((this.ease = this.easeorigin =
						this.prop.ease ? this.prop.ease : 0.2),
						(this.touch.ratio = this.prop.touch.ratio),
						(this.prop.reduced = !1))),
				this.infinite)
		)
			((this.scroll.x +=
				(this.delta1 + this.touch.throw.delta - this.scroll.x) * this.ease),
			0.001 >= Math.abs(this.scroll.x) && (this.scroll.x = 0),
				(this.scroll.left = this.scroll.x % this.content.rect.width),
				(this.scroll.y +=
					(this.delta1 + this.touch.throw.delta - this.scroll.y) * this.ease),
			0.001 >= Math.abs(this.scroll.y) && (this.scroll.y = 0),
				(this.scroll.top = this.scroll.y % this.content.rect.height));
		else {
			switch (this.dir) {
				case "hr":
					this.delta1 = this.clamp(
						this.delta1 + this.touch.throw.delta,
						0,
						this.content.rect.width - window.innerWidth,
					);
					break;
				default:
					this.delta1 = this.clamp(
						this.delta1 + this.touch.throw.delta,
						0,
						this.content.rect.height - window.innerHeight,
					);
					break;
			}
			((this.delta2 += (this.delta1 - this.delta2) * this.ease),
				(this.scroll.x += (this.delta2 - this.scroll.x) * this.ease),
			0.001 >= Math.abs(this.scroll.x) && (this.scroll.x = 0),
				(this.scroll.left = this.delta2),
				(this.scroll.y += (this.delta2 - this.scroll.y) * this.ease),
			0.001 >= Math.abs(this.scroll.y) && (this.scroll.y = 0),
				(this.scroll.top = this.delta2));
		}
		switch (this.dir) {
			case "hr":
				((this.scroll.progress = this.scroll.x / this.content.rect.width),
					(this.scroll.loop = Math.floor(this.scroll.progress)));
				break;
			default:
				((this.scroll.progress = this.scroll.y / this.content.rect.height),
					(this.scroll.loop = Math.floor(this.scroll.progress)));
				break;
		}
		switch (this.dir) {
			case "hr":
				this.position.value =
					(this.scroll.left % this.content.rect.width) /
					this.content.rect.width;
				for (let start = 0; start < this.sections.elems.length; start++) {
					const end = this.sections.elems[start];
					((end.x = this.scroll.left * -1),
						(end.y = 0),
					end.x < -end.rect.width - end.rect.left &&
					(end.x = end.x + this.content.rect.width),
					end.rect.left - end.x * -1 - window.innerWidth > 0 &&
					(end.x = end.x - this.content.rect.width));
					const a = end.x + end.rect.left,
						o = a + end.rect.width > 0,
						l = a - end.rect.width < window.innerWidth;
					((end.cx = this.clamp(
						(a + window.innerWidth / 2) / window.innerWidth - 0.5,
						-1,
						1,
					)),
						Math.abs(end.cx) < 0.5
							? ((this.currentIndex = start + 1), (end.selected = !0))
							: (end.selected = !1),
						l && o
							? (this.dom &&
							(end.el.style.transform = `translate3d(${end.x}px, 0px, 0px)`),
								(end.visible = !0),
							end.el.dataset.visible != "1" && (end.el.dataset.visible = "1"))
							: ((end.x = 9999),
								(end.y = 9999),
								(end.el.style.transform = "translate3d(9999px, 0px, 0px)"),
								(end.visible = !1),
							end.el.dataset.visible != "0" &&
							(end.el.dataset.visible = "0")));
				}
				(this.scrollbar.enable &&
				((this.scrollbar.progress =
					this.position.value * this.scrollbar.wrap.rect.width),
					this.position.value < 0
						? ((this.scrollbar.thumb.before.style.transform = `translate3d(${this.scrollbar.progress + this.scrollbar.wrap.rect.width}px, 0, 0)`),
							(this.scrollbar.thumb.after.style.transform = `translate3d(${this.scrollbar.progress}px, 0, 0)`))
						: ((this.scrollbar.thumb.before.style.transform = `translate3d(${this.scrollbar.progress - this.scrollbar.wrap.rect.width}px, 0, 0)`),
							(this.scrollbar.thumb.after.style.transform = `translate3d(${this.scrollbar.progress}px, 0, 0)`))),
				this.infinite ||
				(this.position.value =
					this.scroll.left /
					(this.content.rect.width - window.innerWidth)));
				break;
			default:
				this.position.value =
					(this.scroll.top % this.content.rect.height) /
					this.content.rect.height;
				for (let start = 0; start < this.sections.elems.length; start++) {
					const end = this.sections.elems[start];
					((end.x = 0),
						(end.y = this.scroll.top * -1),
					end.y < -end.rect.height - end.rect.top &&
					(end.y = end.y + this.content.rect.height),
					end.rect.top - end.y * -1 - window.innerHeight > 0 &&
					(end.y = end.y - this.content.rect.height));
					const a = end.y + end.rect.top,
						o = a + end.rect.height > 0,
						l = a - end.rect.height < window.innerHeight;
					((end.cy = this.clamp(
						(a + window.innerHeight / 2) / window.innerHeight - 0.5,
						-1,
						1,
					)),
						Math.abs(end.cy) < 0.5
							? ((this.currentIndex = start + 1), (end.selected = !0))
							: (end.selected = !1),
						l && o
							? ((end.progress =
								Math.abs(a / window.innerHeight) < 0.001
									? 0
									: this.roundToNearest(a / window.innerHeight)),
							this.dom &&
							!this.sync.enable &&
							(end.el.style.transform = `translate3d(0px, ${end.y}px, 0)`),
							this.sync.enable &&
							end.sync &&
							(end.sync.style.setProperty("--u-sync-p", end.progress),
								end.sync.style.setProperty(
									"--u-sync-abs-p",
									Math.abs(end.progress),
								),
							end.sync.dataset.visible != "1" &&
							(end.sync.dataset.visible = "1"),
								end.progress < 0
									? (end.sync.classList.remove("is-scroll-enter"),
										end.sync.classList.add("is-scroll-leave"))
									: (end.sync.classList.add("is-scroll-enter"),
										end.sync.classList.remove("is-scroll-leave"))),
								(end.visible = !0),
							end.el.dataset.visible != "1" && (end.el.dataset.visible = "1"))
							: ((end.progress = 2),
								(end.x = 9999),
								(end.y = 9999),
							this.sync.enable ||
							(end.el.style.transform = "translate3d(0px, 9999px, 0)"),
							this.sync.enable &&
							end.sync &&
							(end.sync.dataset.visible != "0" &&
							(end.sync.dataset.visible = "0"),
								end.sync.style.setProperty("--u-sync-p", end.progress),
								end.sync.style.setProperty("--u-sync-abs-p", end.progress)),
								(end.visible = !1),
							end.el.dataset.visible != "0" &&
							(end.el.dataset.visible = "0")));
				}
				(this.scrollbar.enable &&
				((this.scrollbar.progress =
					this.position.value * this.scrollbar.wrap.rect.height),
					this.position.value < 0
						? ((this.scrollbar.thumb.before.style.transform = `translate3d(0, ${this.scrollbar.progress}px, 0)`),
							(this.scrollbar.thumb.after.style.transform = `translate3d(0, ${this.scrollbar.progress + this.scrollbar.wrap.rect.height}px, 0)`))
						: ((this.scrollbar.thumb.before.style.transform = `translate3d(0, ${this.scrollbar.progress - this.scrollbar.wrap.rect.height}px, 0)`),
							(this.scrollbar.thumb.after.style.transform = `translate3d(0, ${this.scrollbar.progress}px, 0)`))),
				this.infinite ||
				(this.position.value =
					this.scroll.top /
					(this.content.rect.height - window.innerHeight)));
				break;
		}
		let element = [],
			trigger = [];
		for (let start = 0; start < this.sections.elems.length; start++) {
			const end = this.sections.elems[start];
			if (end.selected) {
				const a = this.dir === "hr" ? end.cx : end.cy;
				(element.push(Math.abs(a - 0.5)), trigger.push(start));
			}
		}
		this.centerIndex = trigger[this.getMinIndex(element)];
		for (let start = 0; start < this.sections.elems.length; start++) {
			const end = this.sections.elems[start];
			start === this.centerIndex
				? ((end.centerd = !0),
					end.el.classList.add("c-centered"),
				end.sync && end.sync.classList.add("c-centered"))
				: ((end.centerd = !1),
					end.el.classList.remove("c-centered"),
				end.sync && end.sync.classList.remove("c-centered"));
		}
		this.onUpdateAfter && this.onUpdateAfter();
	}
	
	onReset() {
		(this.killTweens(this.tweens.after),
			this.killTweens(this.tweens.scrollto),
			clearTimeout(this.timers.complete.timer),
			clearTimeout(this.timers.after.timer));
	}
	
	getDetail(element) {
		let trigger = 0;
		const start = element.deltaX
				? -element.deltaX
				: element.wheelDeltaX
					? element.wheelDeltaX
					: -element.detail,
			end = element.deltaY
				? -element.deltaY
				: element.wheelDeltaY
					? element.wheelDeltaY
					: -element.detail,
			a = element.deltaY
				? -element.deltaY
				: element.wheelDelta
					? element.wheelDelta
					: -element.detail,
			o = element.detail;
		if (
			(o
				? a
					? (trigger = (a / o / 40) * o > 0 ? 1 : -1)
					: (trigger = -o / 3)
				: (trigger = a / 120),
				o)
		)
			if (end) {
				let l = (start / o / 40) * o > 0 ? 1 : -1,
					c = (end / o / 40) * o > 0 ? 1 : -1;
				return {
					x: l,
					y: c,
					d: trigger,
				};
			} else {
				let l = 0,
					c = -o / 3;
				return {
					x: l,
					y: c,
					d: trigger,
				};
			}
		else {
			let l = start / 120,
				c = end / 120;
			return {
				x: l,
				y: c,
				d: trigger,
			};
		}
	}
	
	stop() {
		this.stopped = !0;
	}
	
	start() {
		this.stopped = !1;
	}
	
	onWheel(element) {
		if (!this.ready || this.stopped) return !1;
		this.onReset();
		const trigger = this.getDetail(element);
		((this.detail.d = trigger.x + trigger.y),
			(this.delta1 += -this.detail.d * this.speed),
			(this.power.delta += Math.abs(this.detail.d)),
			this.getSpeed(1),
			(this.ing = !0),
			(this.scroll.dir = this.detail.d < 0 ? "down" : "up"),
			(this.timers.complete.timer = setTimeout(() => {
				this.onComplete();
			}, this.timers.complete.wait)),
			(this.timers.after.timer = setTimeout(() => {
				this.onAfter();
			}, this.timers.after.wait)));
	}
	
	onResize(element) {
		if (!this.ready) return !1;
		const trigger = element === 0 ? 0 : this.timers.resize.wait;
		((this.windowHeight =
			this.dir === "hr" ? window.innerWidth : window.innerHeight),
			clearTimeout(this.timers.resize.timer),
			(this.timers.resize.timer = setTimeout(() => {
				if (this.fillscreen)
					for (let start = 0; start < this.sections.elems.length; start++) {
						const end = this.sections.elems[start];
						((end.el.style.width = window.innerWidth + "px"),
							(end.el.style.height = window.innerHeight + "px"));
					}
				else
					for (let start = 0; start < this.sections.elems.length; start++) {
						const end = this.sections.elems[start];
						((end.el.style.width = "auto"), (end.el.style.height = "auto"));
					}
				switch (((this.content.el.style.width = "auto"), this.dir)) {
					case "hr":
						let start = 0;
						for (let end = 0; end < this.sections.elems.length; end++) {
							const a = this.sections.elems[end];
							(this.sync.enable ||
							(a.el.style.transform = "translate3d(0, 0, 0)"),
								(a.rect = a.el.getBoundingClientRect()),
								a.rect.width,
								(start += a.rect.width));
						}
						this.content.el.style.width = start + "px";
						break;
				}
				for (let start = 0; start < this.sections.elems.length; start++) {
					const end = this.sections.elems[start];
					((end.y = 0),
					this.sync.enable ||
					(end.el.style.transform = "translate3d(0, 0, 0)"),
						(end.rect = end.el.getBoundingClientRect()),
						(end.x = this.scroll.left),
						(end.y = this.scroll.top),
					this.sync.enable ||
					(end.el.style.transform =
						"translate3d(" + -end.x + "px, " + -end.y + "px, 0)"));
				}
				if (
					((this.body.rect = this.body.el.getBoundingClientRect()),
						(this.content.rect = this.content.el.getBoundingClientRect()),
						this.scrollbar.enable)
				)
					switch (
						((this.scrollbar.wrap.rect =
							this.scrollbar.wrap.el.getBoundingClientRect()),
							this.dir)
						) {
						case "hr":
							((this.scrollbar.thumb.volume =
								this.scrollbar.wrap.rect.width / this.content.rect.width),
								(this.scrollbar.thumb.px =
									this.scrollbar.thumb.volume * this.scrollbar.wrap.rect.width),
								(this.scrollbar.thumb.before.style.width =
									this.scrollbar.thumb.px + "px"),
								(this.scrollbar.thumb.after.style.width =
									this.scrollbar.thumb.px + "px"),
								(this.scrollbar.thumb.before.style.height = "100%"),
								(this.scrollbar.thumb.after.style.height = "100%"));
							break;
						default:
							((this.scrollbar.thumb.volume =
								this.scrollbar.wrap.rect.height / this.content.rect.height),
								(this.scrollbar.thumb.px =
									this.scrollbar.thumb.volume *
									this.scrollbar.wrap.rect.height),
								(this.scrollbar.thumb.before.style.height =
									this.scrollbar.thumb.px + "px"),
								(this.scrollbar.thumb.after.style.height =
									this.scrollbar.thumb.px + "px"),
								(this.scrollbar.thumb.before.style.width = "100%"),
								(this.scrollbar.thumb.after.style.width = "100%"));
							break;
					}
			}, trigger)));
	}
	
	getSpeed(element = 1) {
		this.power.history.length > 2 && !this.reduced
			? (this.power.history.shift(),
				this.power.history.push(this.power.delta),
				(this.power.pow0.value = Math.min(
					Math.abs((this.power.history[0] - this.power.history[2]) * element),
					this.power.max,
				)),
				(this.power.pow1.tween = gsap.to(this.power.pow1, {
					duration: this.power.pow1.duration,
					ease: this.power.pow1.ease,
					value: this.power.pow0.value,
				})),
				(this.power.pow2.tween = gsap.to(this.power.pow2, {
					duration: this.power.pow2.duration,
					ease: this.power.pow2.ease,
					value: this.power.pow0.value,
				})))
			: this.power.history.push(this.power.delta);
	}
	
	getThrow(element, trigger = 1) {
		if (this.touch.throw.history.length > 1) {
			this.touch.throw.history.push(element * trigger);
			let start = this.touch.throw.history[this.touch.throw.history.length - 2],
				end = this.touch.throw.history[this.touch.throw.history.length - 1];
			start != end &&
			Math.abs(start - end) > 10 &&
			(this.touch.throw.speed = start - end);
		} else
			(this.touch.throw.history.push(element * trigger),
				(this.touch.throw.speed = 0));
	}
	
	getDistance(element, trigger, start, end) {
		const a = trigger - element,
			o = end - start;
		return Math.sqrt(a * a + o * o);
	}
	
	onTouchStart(element) {
		(this.touch.throw.event &&
		((this.touch.throw.speed = 0),
			(this.touch.throw.history = []),
			this.touch.throw.event.kill(),
			(this.touch.throw.event = null)),
			(this.draggable = !0));
		for (let end = 0; end < this.disableDragByTagName.length; end++) {
			const a = this.disableDragByTagName[end];
			element.target.tagName === a && (this.draggable = !1);
		}
		for (let end = 0; end < this.enableDragByClassName.length; end++) {
			const a = this.enableDragByClassName[end];
			element.target.classList.contains(a) && (this.draggable = !0);
		}
		if (this.stopped && this.draggable) return !1;
		(this.onReset(),
			(this.touch.thumb = element.target.classList.contains(
				this.prop.scrollbar.thumbClassName,
			)),
			(this.touch.pivot = element.target.classList.contains(
				this.prop.scrollbar.pivotClassName,
			)),
		this.touch.pivot && this.html.classList.add("is-dragging"));
		let trigger = element.clientX,
			start = element.clientY;
		(element.touches &&
		element.touches[0] &&
		((trigger = element.touches[0].clientX),
			(start = element.touches[0].clientY)),
			(this.touch.start.x = trigger),
			(this.touch.start.y = start),
			(this.touch.dist.x = 0),
			(this.touch.dist.y = 0),
		element.touches && element.touches.length > 1 && element.preventDefault(),
			(this.touch.active = !0),
			(this.touch.start.delta = this.delta1),
			(this.power.pow0.value = 0),
			this.scrollSet());
	}
	
	onTouchMove(element) {
		if (this.touch.thumb || this.stopped) return !1;
		this.touch.throw.event &&
		(this.touch.throw.event.kill(), (this.touch.throw.event = null));
		let trigger = element.clientX,
			start = element.clientY;
		if (
			(element.touches && element.touches[0]
				? ((trigger = element.touches[0].clientX),
					(start = element.touches[0].clientY))
				: element.originalEvent &&
				element.originalEvent.changedTouches[0] &&
				((trigger = element.originalEvent.changedTouches[0].clientX),
					(start = element.originalEvent.changedTouches[0].clientY)),
				(this.touch.ing.x = trigger),
				(this.touch.ing.y = start),
				(this.touch.dist.x = this.touch.start.x - trigger),
				(this.touch.dist.y = this.touch.start.y - start),
				this.touch.active)
		) {
			if (this.touch.pivot && this.scrollbar.enable)
				switch (this.touch.dir) {
					case "hr":
						((this.touch.delta =
							(-this.touch.dist.x * 1) / this.scrollbar.thumb.volume +
							this.touch.start.delta),
							(this.delta1 = this.touch.delta),
							(this.power.delta += Math.abs(this.touch.dist.x)));
						break;
					default:
						((this.touch.delta =
							(-this.touch.dist.y * 1) / this.scrollbar.thumb.volume +
							this.touch.start.delta),
							(this.delta1 = this.touch.delta),
							(this.power.delta += Math.abs(this.touch.dist.y)));
						break;
				}
			else
				switch ((this.touch.dir, this.touch.dir)) {
					case "all":
						((this.touch.dist.v = this.getDistance(
							this.touch.start.x,
							trigger,
							this.touch.start.y,
							start,
						)),
							(this.touch.delta =
								this.touch.dist.v *
								this.touch.ratio *
								Math.abs(1 + this.power.pow0.value) +
								this.touch.start.delta),
							(this.delta1 = this.touch.delta),
							(this.power.delta += Math.abs(
								this.touch.dist.v * this.touch.ratio,
							)));
						break;
					case "hr":
						((this.touch.dist.v = this.touch.dist.x),
							(this.touch.delta =
								this.touch.dist.v *
								this.touch.ratio *
								Math.abs(1 + this.power.pow0.value) +
								this.touch.start.delta),
							(this.delta1 = this.touch.delta),
							(this.power.delta += Math.abs(
								this.touch.dist.v * this.touch.ratio,
							)));
						break;
					default:
						((this.touch.dist.v = this.touch.dist.y),
							(this.touch.delta =
								this.touch.dist.v *
								this.touch.ratio *
								Math.abs(1 + this.power.pow0.value) +
								this.touch.start.delta),
							(this.delta1 = this.touch.delta),
							(this.power.delta += Math.abs(
								this.touch.dist.v * this.touch.ratio,
							)));
						break;
				}
			this.getSpeed(0.001);
		}
	}
	
	onTouchEnd(element) {
		if (this.touch.thumb || this.stopped) return !1;
		((this.touch.pivot = !1),
			(this.touch.thumb = !1),
			this.html.classList.remove("is-dragging"),
			(this.timers.complete.timer = setTimeout(() => {
				this.onComplete();
			}, this.timers.complete.wait)),
			(this.timers.after.timer = setTimeout(() => {
				this.onAfter();
			}, this.timers.after.wait)),
			(this.touch.dist.x = 0),
			(this.touch.dist.y = 0),
			(this.touch.active = !1),
			(this.touch.throw.speed = 0),
			(this.touch.throw.history = []),
			(this.power.pow0.value = 0));
	}
	
	onKeyScroll(element) {
		if (!this.ready || this.stopped) return !1;
		switch ((this.onReset(), element.code)) {
			case "ArrowRight":
			case "ArrowDown":
				this.delta1 += 40;
				break;
			case "ArrowUp":
			case "ArrowLeft":
				this.delta1 -= 40;
				break;
			case "Space":
				this.dir === "hr"
					? (this.delta1 += window.innerWidth)
					: (this.delta1 += window.innerHeight);
				break;
		}
		((this.timers.complete.timer = setTimeout(() => {
			this.onComplete();
		}, this.timers.complete.wait)),
			(this.timers.after.timer = setTimeout(() => {
				this.onAfter();
			}, this.timers.after.wait)));
	}
	
	onKeyControl(element) {
		if (!this.ready || this.stopped) return !1;
		switch (element.code) {
			case "Space":
			case "ArrowRight":
			case "ArrowDown":
				this.onScrollToNext();
				break;
			case "ArrowUp":
			case "ArrowLeft":
				this.onScrollToPrev();
				break;
		}
	}
	
	addEvents() {
		((this.onWheel = this.onWheel.bind(this)),
			(this.onResize = this.onResize.bind(this)),
			(this.onTouchStart = this.onTouchStart.bind(this)),
			(this.onTouchMove = this.onTouchMove.bind(this)),
			(this.onTouchEnd = this.onTouchEnd.bind(this)),
		this.keyScroll && (this.onKeyScroll = this.onKeyScroll.bind(this)),
		this.control.enable && (this.onKeyControl = this.onKeyControl.bind(this)),
			window.addEventListener("wheel", this.onWheel, {
				passive: !0,
			}),
			window.addEventListener("resize", this.onResize),
		this.touch.enable &&
		window.addEventListener("touchstart", this.onTouchStart, {
			passive: !0,
		}),
		this.touch.enable &&
		window.addEventListener("touchmove", this.onTouchMove, {
			passive: !0,
		}),
		this.touch.enable && window.addEventListener("touchend", this.onTouchEnd),
		this.touch.enable &&
		window.addEventListener("mousedown", this.onTouchStart),
		this.touch.enable &&
		window.addEventListener("mousemove", this.onTouchMove),
		this.touch.enable && window.addEventListener("mouseup", this.onTouchEnd),
		this.touch.enable &&
		document.addEventListener("mouseleave", this.onTouchEnd),
		this.keyScroll && document.addEventListener("keydown", this.onKeyScroll),
		this.control.enable &&
		document.addEventListener("keydown", this.onKeyControl));
	}
	
	removeEvents() {
		(window.removeEventListener("wheel", this.onWheel),
			window.removeEventListener("resize", this.onResize),
		this.touch.enable &&
		window.removeEventListener("touchstart", this.onTouchStart),
		this.touch.enable &&
		window.removeEventListener("touchmove", this.onTouchMove),
		this.touch.enable &&
		window.removeEventListener("touchend", this.onTouchEnd),
		this.touch.enable &&
		window.removeEventListener("mousedown", this.onTouchStart),
		this.touch.enable &&
		window.removeEventListener("mousemove", this.onTouchMove),
		this.touch.enable &&
		window.removeEventListener("mouseup", this.onTouchEnd),
		this.touch.enable &&
		document.removeEventListener("mouseleave", this.onTouchEnd),
		this.keyScroll &&
		document.removeEventListener("keydown", this.onKeyScroll),
		this.control.enable &&
		document.removeEventListener("keydown", this.onKeyControl));
	}
}

const Scroll_Works = {
	local: null,
	params: {
		speed: 50,
		ease: 0.2,
		timers: {
			complete: 50,
			after: 500,
			resize: 500,
		},
	},
	once() {
		(DETECT.os.win &&
		((this.params.ease = this.params.ease * 0.75),
			(this.params.speed = this.params.speed * 2)),
		DETECT.reduced && (this.params.ease = 0.75));
	},
	onInit(i) {
		this.local = i || document;
		const element = this.local.querySelector(
			'.c-scroll-wrapper[data-type="works"]',
		);
		if (element)
			if (
				((this.index = findIndexBySlug(DB_WORKS, PAGE_TRANSITION.prev.slug)),
				ORIENTATION != "portrait")
			)
				((this.body = new UsagiScroll({
					wrap: element,
					body: ".c-scroll-body",
					content: ".c-scroll-content",
					section: ".c-scroll-section",
					inner: ".c-scroll-inner",
					speed: this.params.speed,
					ease: this.params.ease,
					dir: "vr",
					infinite: !0,
					fillscreen: !0,
					autocenter: !0,
					reduced: !1,
					scrollbar: {
						enable: !1,
						wrapClassName: "c-scrollbar",
						thumbClassName: "c-thumb",
						pivotClassName: "c-pivot",
					},
					timers: {
						complete: this.params.timers.complete,
						after: this.params.timers.after,
						resize: this.params.timers.resize,
					},
					touch: {
						enable: DETECT.device.any,
						ratio: TOUCH_RATIO,
						dir: "all",
					},
					keyScroll: !1,
					sync: {
						enable: !0,
						el: ".c-scroll-sync",
					},
					control: {
						enable: !0,
						duration: 0.8,
						ease: "power2.inOut",
					},
				})),
				this.index && this.body.setScrollToIndex(this.index));
			else {
				const trigger = this.params.ease * 0.666666667;
				((this.body = new UsagiScroll({
					wrap: element,
					body: ".c-scroll-sync-wrap",
					content: ".c-scroll-sync-body",
					section: ".c-scroll-sync",
					inner: ".c-single-header",
					speed: this.params.speed,
					ease: trigger,
					dir: "vr",
					infinite: !0,
					fillscreen: !1,
					autocenter: !1,
					reduced: DETECT.reduced,
					scrollbar: {
						enable: !1,
						wrapClassName: "c-scrollbar",
						thumbClassName: "c-thumb",
						pivotClassName: "c-pivot",
					},
					timers: {
						complete: this.params.timers.complete,
						after: this.params.timers.after,
						resize: this.params.timers.resize,
					},
					touch: {
						enable: DETECT.device.any,
						ratio: TOUCH_RATIO,
						dir: "vr",
					},
					keyScroll: !1,
					onUpdateAfter: (start) => {
						WEBGL_WORKS.ready && WEBGL_WORKS.onScroll();
					},
				})),
				this.index && this.body.setScrollToIndex(this.index));
			}
	},
	raf() {
		this.body &&
		((this.body.timers.after.wait = this.params.timers.after),
			this.body.raf());
	},
	onDestroy() {
		this.body && (this.body.onDestroy(), (this.body = null));
	},
};

const PAGE_SCROLL_NORMAL = {
	local: null,
	once() {
		((this.lerp = 0.15),
		DETECT.os.win && (this.lerp = this.lerp * 1.5),
		DETECT.reduced && (this.lerp = 0.75));
	},
	onInit(i) {
		if (
			((this.local = i || document.querySelector(".c-page")),
				(this.wrapper = this.local.querySelector(
					'.c-scroll-wrapper[data-type="normal"]',
				)),
			this.wrapper &&
			DETECT.device.any &&
			(this.wrapper = document.querySelector("#app")),
				this.wrapper)
		) {
			const element = DETECT.device.any && ORIENTATION === "landscape";
			((this.content = this.wrapper.querySelector(".c-scroll-content")),
				(this.body = new nD({
					lerp: this.lerp,
					wrapper: this.wrapper,
					content: this.content,
					smoothTouch: element,
					syncTouch: element,
				})),
				this.onInitAfter(),
				this.onInitScrollTrigger());
		}
	},
	scroll: {
		f1: 0,
		f2: 0,
		y: 0,
		p: 0,
		limit: {
			x: 0,
			y: 0,
		},
	},
	trigger: {
		elem: null,
		array: [],
	},
	onInitAfter() {
		this.body &&
		this.body.on(
			"scroll",
			({
				 scroll: i,
				 limit: element,
				 velocity: trigger,
				 direction: start,
				 progress: end,
			 }) => {
				(this.onScroll(),
					(this.scroll.y = i),
					(this.scroll.p = end),
					(this.scroll.limit.x = element),
					(this.scroll.limit.y = element),
					(this.scroll.f1 = Math.min(this.scroll.y / WH, 1)),
					this.local.style.setProperty("--f1", this.scroll.f1),
					(this.scroll.f2 = Math.max(
						(this.scroll.y - WH) / (element - WH),
						0,
					)),
					this.local.style.setProperty("--f2", this.scroll.f2),
					this.scroll.f1 > 0.5
						? $html.classList.add("is-ov-f1")
						: $html.classList.remove("is-ov-f1"),
					this.scroll.f1 >= 1
						? $html.classList.add("is-ov-fv")
						: $html.classList.remove("is-ov-fv"),
					DETECT.device.any
						? (WEBGL_ABOUT.ready &&
						WEBGL_ABOUT.onScrollForMobile(
							this.scroll.y,
							this.scroll.f1,
							this.scroll.f2,
						),
						WEBGL_WORKS.ready && WEBGL_WORKS.onScroll())
						: (WEBGL_WORKS.ready &&
						WEBGL_WORKS.onScroll(
							this.scroll.y,
							this.scroll.f1,
							this.scroll.f2,
						),
						WEBGL_ABOUT.ready &&
						WEBGL_ABOUT.onScroll(
							this.scroll.y,
							this.scroll.f1,
							this.scroll.f2,
						),
						WEBGL_SINGLE.ready &&
						WEBGL_SINGLE.onScroll(
							this.scroll.y,
							this.scroll.f1,
							this.scroll.f2,
						)));
			},
		);
	},
	triggers: [],
	onInitScrollTrigger() {
		if (
			(this.triggers.forEach((i, element) => {
				(i.tl && i.tl.kill(),
					i.observer.disconnect(i.el),
					(i.observer = null),
					(i.listerner = null),
					(i.tl = null));
			}),
				(this.triggers = []),
				(this.sticky = this.local.querySelectorAll(".js-scroll-trigger")),
			this.sticky && !DETECT.reduced)
		)
			for (let i = 0; i < this.sticky.length; i++) {
				const element = this.sticky[i],
					trigger = element.querySelector(".js-scroll-trigger-target")
						? element.querySelector(".js-scroll-trigger-target")
						: element;
				if (trigger) {
					let start = trigger.dataset.start
							? trigger.dataset.start
							: "top bottom",
						end = trigger.dataset.end ? trigger.dataset.end : "bottom top";
					(IS_MOBILE_MODE && (end = "bottom center"),
						this.triggers.push({
							sync: element.dataset.sync,
							shown: !1,
							visible: !1,
							start: start,
							end: end,
							el: element,
							trigger: trigger,
							tl: null,
							listerner: null,
							observer: null,
						}));
				}
			}
		this.triggers.forEach((i, element) => {
			((i.listerner = (trigger) => {
				trigger.forEach((start, end) => {
					start.isIntersecting
						? (i.shown ||
						((i.shown = !0),
							(i.tl = gsap.to(i.el, {
								ease: "none",
								scrollTrigger: {
									scroller: this.wrapper,
									trigger: i.trigger,
									start: i.start,
									end: i.end,
									scrub: 0.01,
									onUpdate: (o) => {
										(o.trigger.style.setProperty("--p1", o.progress),
											o.trigger.style.setProperty("--p2", 1 - o.progress),
										WEBGL_ABOUT.ready &&
										PAGE_TRANSITION.current.name === "info" &&
										WEBGL_ABOUT.onSync(i.sync, o.progress));
									},
								},
							}))),
							(i.visible = !0))
						: (i.visible = !1);
				});
			}),
				(i.observer = new IntersectionObserver(i.listerner, {
					threshold: 0,
				})),
				i.observer.observe(i.el));
		});
	},
	onScroll() {
	},
	raf(i) {
		this.body && this.body.raf(i * 1e3);
	},
	onReset() {
		(this.wrapper && this.wrapper.scrollTo(0, 0),
			$html.classList.remove("is-ov-f1"),
			$html.classList.remove("is-ov-fv"),
			(this.scroll.y = 0),
			(this.scroll.p = 0),
			(this.scroll.f1 = 0),
			(this.scroll.f2 = 0),
			(this.scroll.limit.x = 0),
			(this.scroll.limit.y = 0));
	},
	onDestroy() {
		(this.onReset(), this.body && (this.body.destroy(), (this.body = null)));
	},
};

/*!
 * Usagi Scroll 1.0.1
 * @license Copyright, Kenta Toshikura
 * Last update : 2023/11/25
 * Require : gsap
 * Memo : Hr is not work sync.
 */
class UsagiScroll {
	constructor(element = {}) {
		var end, a, o, l, c, h;
		if (
			((this.ready = !1),
				(this.stopped = !0),
				(this.prop = element),
				(this.wrap = element.wrap),
				(this.$html = document.querySelector("html")),
				(this.ul = this.wrap.querySelector(element.ul)),
			!this.ul ||
			((this.li = {
				origin: this.wrap.querySelectorAll(element.li),
				clone: null,
			}),
				!this.li.origin))
		)
			return !1;
		((this.speed = element.speed || 100),
			(this.detail = {
				x: 0,
				y: 0,
			}),
			(this.delta1 = {
				x: 0,
				y: 0,
			}),
			(this.delta2 = {
				x: 0,
				y: 0,
			}),
			(this.power = {
				max: element.max || 4,
				history: [],
				delta: {
					x: 0,
					y: 0,
				},
				pow0: {
					x: 0,
					y: 0,
				},
				pow1: {
					duration: 0.2,
					tween: null,
					x: 0,
					y: 0,
				},
				pow2: {
					duration: 1,
					tween: null,
					x: 0,
					y: 0,
				},
			}),
			(this.scroll = {
				dir: "down",
				progress: 0,
				loop: 0,
				x: 0,
				y: 0,
				top: 0,
				left: 0,
			}),
			(this.position = {
				x: 0,
				y: 0,
			}),
			(this.tweens = {
				after: null,
			}));
		const trigger =
				(end = element == null ? void 0 : element.timers) != null &&
				end.complete
					? Number(element.timers.complete)
					: 30,
			start =
				(a = element == null ? void 0 : element.timers) != null && a.resize
					? Number(element.timers.resize)
					: 500;
		((this.timers = {
			complete: {
				timer: null,
				wait: trigger,
			},
			resize: {
				timer: null,
				wait: start,
			},
		}),
			(this.ease = element.ease ? element.ease : 0.1),
			(this.touch = {
				ratio:
					(o = element == null ? void 0 : element.touch) != null && o.ratio
						? element.touch.ratio
						: 1.8,
				ease:
					(l = element == null ? void 0 : element.touch) != null && l.ease
						? element.touch.ease
						: 0.125,
				active: !1,
				delta: {
					x: 0,
					y: 0,
				},
				start: {
					x: 0,
					y: 0,
					delta: {
						x: 0,
						y: 0,
					},
				},
				dist: {
					x: 0,
					y: 0,
				},
				ing: {
					x: 0,
					y: 0,
				},
				dir: {
					x: 0,
					y: 0,
				},
				throw: {
					event: null,
					buffer: {
						x: 0,
						y: 0,
					},
				},
			}),
			(this.array = []),
			(this.content = {
				width: 0,
				height: 0,
			}),
			(this.grid = {
				x:
					(c = element == null ? void 0 : element.grid) != null && c.x
						? element.grid.x
						: 3,
				y:
					(h = element == null ? void 0 : element.grid) != null && h.y
						? element.grid.y
						: 3,
			}),
		this.li.origin.length &&
		this.ul &&
		(this.onRunRabbit(), (this.ready = !0), (this.stopped = !1)));
	}
	
	stop() {
		this.stopped = !0;
	}
	
	start() {
		this.stopped = !1;
	}
	
	getRandom(element, trigger) {
		let start = element.slice(),
			end = start.length;
		for (let a = end - 1; a > 0; a--) {
			const o = Math.floor(Math.random() * (a + 1));
			[start[a], start[o]] = [start[o], start[a]];
		}
		return start.slice(0, trigger);
	}
	
	onRunRabbit() {
		const element = this.grid.x * this.grid.y - this.li.origin.length;
		if (element != 0)
			if (element > 0) {
				const start = this.getRandom([...this.li.origin], element);
				for (var trigger = 0; trigger < start.length; trigger++) {
					const end = start[trigger].cloneNode(!0);
					(end.classList.add("is-clone"), this.ul.appendChild(end));
				}
			} else
				for (let start = 0; start < Math.abs(element) + 1; start++)
					this.ul.firstChild && this.ul.removeChild(this.ul.firstChild);
		((this.li.clone = this.wrap.querySelectorAll(this.prop.li)),
			this.li.clone.forEach((start, end) => {
				this.array.push({
					el: start,
					x: 0,
					y: 0,
					min: {
						x: 0,
						y: 0,
					},
					max: {
						x: 0,
						y: 0,
					},
					rect: {
						width: 0,
						height: 0,
						top: 0,
						left: 0,
					},
					position: {
						x: 0,
						y: 0,
					},
				});
			}),
			this.setPosition(),
			this.addEvents(),
			this.onResize());
	}
	
	setPosition() {
		let element = 0;
		for (let trigger = 0; trigger < this.grid.x; trigger++)
			for (let start = 0; start < this.grid.y; start++) {
				const end = this.array[element];
				((end.position.x = trigger),
					(end.position.y = start),
					(end.el.dataset.x = trigger),
					(end.el.dataset.y = start),
					element++);
			}
	}
	
	getDetail(element) {
		let trigger = 0;
		const start = element.deltaX
				? -element.deltaX
				: element.wheelDeltaX
					? element.wheelDeltaX
					: -element.detail,
			end = element.deltaY
				? -element.deltaY
				: element.wheelDeltaY
					? element.wheelDeltaY
					: -element.detail,
			a = element.deltaY
				? -element.deltaY
				: element.wheelDelta
					? element.wheelDelta
					: -element.detail,
			o = element.detail;
		if (
			(o
				? a
					? (trigger = (a / o / 40) * o > 0 ? 1 : -1)
					: (trigger = -o / 3)
				: (trigger = a / 120),
				o)
		)
			if (end) {
				let l = (start / o / 40) * o > 0 ? 1 : -1,
					c = (end / o / 40) * o > 0 ? 1 : -1;
				return {
					x: l,
					y: c,
					d: trigger,
				};
			} else {
				let l = 0,
					c = -o / 3;
				return {
					x: l,
					y: c,
					d: trigger,
				};
			}
		else {
			let l = start / 120,
				c = end / 120;
			return {
				x: l,
				y: c,
				d: trigger,
			};
		}
	}
	
	getSpeed(element = 1) {
		this.power.history.length > 2 && !this.reduced
			? (this.power.history.shift(),
				this.power.history.push({
					x: this.power.delta.x,
					y: this.power.delta.y,
				}),
				(this.power.pow0.x = Math.min(
					Math.abs(
						(this.power.history[0].x - this.power.history[2].x) * element,
					),
					this.power.max,
				)),
				(this.power.pow0.y = Math.min(
					Math.abs(
						(this.power.history[0].y - this.power.history[2].y) * element,
					),
					this.power.max,
				)),
				(this.power.pow1.tween = gsap.to(
					this.power.pow1,
					this.power.pow1.duration,
					{
						x: this.power.pow0.x,
						y: this.power.pow0.y,
					},
				)),
				(this.power.pow2.tween = gsap.to(
					this.power.pow2,
					this.power.pow2.duration,
					{
						x: this.power.pow0.x,
						y: this.power.pow0.y,
					},
				)))
			: this.power.history.push({
				x: this.power.delta.x,
				y: this.power.delta.y,
			});
	}
	
	onWheel(element) {
		if (!this.ready || this.stopped) return !1;
		const trigger = this.getDetail(element);
		((this.detail.x = trigger.x),
			(this.detail.y = trigger.y),
			(this.delta1.x += -this.detail.x * this.speed),
			(this.delta1.y += -this.detail.y * this.speed),
			(this.power.delta.x += Math.abs(this.detail.x)),
			(this.power.delta.y += Math.abs(this.detail.y)),
			(this.ing = !0),
			(this.timers.complete.timer = setTimeout(() => {
				this.onComplete();
			}, this.timers.complete.wait)));
	}
	
	onTouchStart(element) {
		if (
			!this.ready ||
			this.stopped ||
			element.target.tagName === "BUTTON" ||
			element.target.tagName === "A" ||
			element.target.tagName === "INPUT" ||
			element.target.tagName === "LABEL"
		)
			return !1;
		this.$html.classList.add("is-dragging");
		let trigger = element.clientX,
			start = element.clientY;
		(element.touches &&
		element.touches[0] &&
		((trigger = element.touches[0].clientX),
			(start = element.touches[0].clientY)),
			(this.touch.start.x = trigger),
			(this.touch.start.y = start),
			(this.touch.dist.x = 0),
			(this.touch.dist.y = 0),
		element.touches && element.touches.length > 1 && element.preventDefault(),
			(this.touch.start.delta.x = this.delta1.x),
			(this.touch.start.delta.y = this.delta1.y),
			(this.power.pow0.x = 0),
			(this.power.pow0.y = 0),
			(this.touch.active = !0));
	}
	
	onTouchMove(element) {
		if (!this.ready || this.stopped) return !1;
		let trigger = element.clientX,
			start = element.clientY;
		(element.touches && element.touches[0]
			? ((trigger = element.touches[0].clientX),
				(start = element.touches[0].clientY))
			: element.originalEvent &&
			element.originalEvent.changedTouches[0] &&
			((trigger = element.originalEvent.changedTouches[0].clientX),
				(start = element.originalEvent.changedTouches[0].clientY)),
			(this.touch.ing.x = trigger),
			(this.touch.ing.y = start),
			(this.touch.dist.x = this.touch.start.x - trigger),
			(this.touch.dist.y = this.touch.start.y - start),
		this.touch.active &&
		((this.touch.delta.x =
			this.touch.dist.x * this.touch.ratio * Math.abs(1) +
			this.touch.start.delta.x),
			(this.touch.dir.x = this.touch.dist.x > 0 ? 1 : -1),
			(this.touch.throw.buffer.x = window.innerHeight * 0.5),
			(this.delta1.x = this.touch.delta.x),
			(this.power.delta.x += Math.abs(this.touch.dist.x * this.touch.ratio)),
			(this.touch.delta.y =
				this.touch.dist.y * this.touch.ratio * Math.abs(1) +
				this.touch.start.delta.y),
			(this.touch.dir.y = this.touch.dist.y > 0 ? 1 : -1),
			(this.touch.throw.buffer.y = window.innerHeight * 0.5),
			(this.delta1.y = this.touch.delta.y),
			(this.power.delta.y += Math.abs(
				this.touch.dist.y * this.touch.ratio,
			))));
	}
	
	onTouchEnd(element) {
		if (!this.ready || this.stopped) return !1;
		(this.$html.classList.remove("is-dragging"),
			(this.touch.dist.x = 0),
			(this.touch.dist.y = 0),
			(this.touch.active = !1),
			(this.timers.complete.timer = setTimeout(() => {
				this.onComplete();
			}, this.timers.complete.wait)));
	}
	
	adjustAspectRatio(element, trigger, start) {
		const end = start.dataset.width ? Number(start.dataset.width) : 1,
			a = start.dataset.height ? Number(start.dataset.height) : 1,
			o = end / a;
		let l = element,
			c = l / o;
		(c > trigger && ((c = trigger), (l = c * o)),
			(start.style.width = `${l}px`),
			(start.style.height = `${c}px`));
	}
	
	onResize() {
		for (let element = 0; element < this.array.length; element++) {
			const trigger = this.array[element];
			((trigger.rect.width = window.innerWidth / (this.grid.x - 1)),
				(trigger.rect.height = window.innerHeight / (this.grid.y - 1)),
				(trigger.rect.left = trigger.position.x * trigger.rect.width),
				(trigger.rect.top = trigger.position.y * trigger.rect.height),
				(trigger.el.style.width = trigger.rect.width + "px"),
				(trigger.el.style.height = trigger.rect.height + "px"),
				(trigger.el.style.position = "absolute"),
				(trigger.el.style.top = "0px"),
				(trigger.el.style.left = "0px"));
		}
		((this.content.width =
			(window.innerWidth / (this.grid.x - 1)) * this.grid.x),
			(this.content.height =
				(window.innerHeight / (this.grid.y - 1)) * this.grid.y));
	}
	
	onComplete() {
		((this.power.pow0.x = 0),
			(this.power.pow0.y = 0),
		this.power.pow1.tween && this.power.pow1.tween.kill(),
			(this.power.pow1.tween = gsap.to(
				this.power.pow1,
				this.power.pow1.duration,
				{
					x: 0,
					y: 0,
				},
			)),
		this.power.pow2.tween && this.power.pow2.tween.kill(),
			(this.power.pow2.tween = gsap.to(
				this.power.pow2,
				this.power.pow2.duration,
				{
					x: 0,
					y: 0,
				},
			)),
			(this.ing = !1));
	}
	
	raf() {
		if (!this.ready) return !1;
		((this.scroll.x += (this.delta1.x - this.scroll.x) * this.ease),
		0.001 >= Math.abs(this.scroll.x) && (this.scroll.x = 0),
			(this.scroll.left = this.scroll.x % this.content.width),
			(this.scroll.y += (this.delta1.y - this.scroll.y) * this.ease),
		0.001 >= Math.abs(this.scroll.y) && (this.scroll.y = 0),
			(this.scroll.top = this.scroll.y % this.content.height),
			(this.position.x =
				(this.scroll.left % this.content.width) / this.content.width),
			(this.position.y =
				(this.scroll.top % this.content.height) / this.content.height),
			this.onUpdate());
	}
	
	onUpdate() {
		for (let element = 0; element < this.array.length; element++) {
			const trigger = this.array[element];
			((trigger.width = window.innerWidth / (this.grid.x - 1)),
				(trigger.height = window.innerHeight / (this.grid.y - 1)),
				(trigger.x =
					trigger.position.x * trigger.rect.width - this.scroll.left),
				(trigger.y =
					trigger.position.y * trigger.rect.height - this.scroll.top),
			this.scroll.left * -1 < -trigger.rect.width - trigger.rect.left &&
			(trigger.x = trigger.x + this.content.width),
			trigger.rect.left - this.scroll.left - window.innerWidth > 0 &&
			(trigger.x = trigger.x - this.content.width));
			const start = trigger.x;
			((trigger.min.x = start + trigger.rect.width > 0),
				(trigger.max.x = start - trigger.rect.width < window.innerWidth),
			this.scroll.top * -1 < -trigger.rect.height - trigger.rect.top &&
			(trigger.y = trigger.y + this.content.height),
			trigger.rect.top - this.scroll.top - window.innerHeight > 0 &&
			(trigger.y = trigger.y - this.content.height));
			const end = trigger.y;
			((trigger.min.y = end + trigger.rect.height > 0),
				(trigger.max.y = end - trigger.rect.height < window.innerHeight),
			trigger.min.x &&
			trigger.max.x &&
			trigger.min.y &&
			trigger.max.y &&
			(trigger.el.style.transform = `translate3d(${trigger.x}px,${trigger.y}px,0px)`));
		}
	}
	
	addEvents() {
		((this.onWheel = this.onWheel.bind(this)),
			(this.onResize = this.onResize.bind(this)),
			(this.onTouchStart = this.onTouchStart.bind(this)),
			(this.onTouchMove = this.onTouchMove.bind(this)),
			(this.onTouchEnd = this.onTouchEnd.bind(this)),
			window.addEventListener("wheel", this.onWheel, {
				passive: !0,
			}),
			window.addEventListener("resize", this.onResize),
			window.addEventListener("touchstart", this.onTouchStart, {
				passive: !0,
			}),
			window.addEventListener("touchmove", this.onTouchMove, {
				passive: !0,
			}),
			window.addEventListener("touchend", this.onTouchEnd),
			window.addEventListener("mousedown", this.onTouchStart),
			window.addEventListener("mousemove", this.onTouchMove),
			window.addEventListener("mouseup", this.onTouchEnd),
			document.addEventListener("mouseleave", this.onTouchEnd));
	}
	
	removeEvents() {
		(window.removeEventListener("wheel", this.onWheel),
			window.removeEventListener("resize", this.onResize),
			window.removeEventListener("touchstart", this.onTouchStart),
			window.removeEventListener("touchmove", this.onTouchMove),
			window.removeEventListener("touchend", this.onTouchEnd),
			window.removeEventListener("mousedown", this.onTouchStart),
			window.removeEventListener("mousemove", this.onTouchMove),
			window.removeEventListener("mouseup", this.onTouchEnd),
			document.removeEventListener("mouseleave", this.onTouchEnd));
	}
	
	onDestroy() {
		((this.array = []), this.removeEvents());
	}
}

const Scroll_Archive = {
	local: null,
	params: {
		speed: 100,
		ease: 0.15,
		timers: {
			complete: 20,
			after: 500,
			resize: 500,
		},
	},
	once() {
		(DETECT.os.win &&
		((this.params.ease = this.params.ease),
			(this.params.speed = this.params.speed * 2)),
		DETECT.reduced && (this.params.ease = 0.75));
	},
	onInit(i) {
		((this.local = i || document),
			this.onInitScroll(),
			this.onInitFreeScroll());
	},
	onSplash(i, element, trigger) {
		if (this.linear) {
			const start = -WH / 2 + this.linear.sections.elems[0].rect.height / 2;
			(this.linear.setScrollTo(start - WH * 0.2),
				this.linear.onScrollTo(start, i, element, trigger));
		}
	},
	onZoomIn() {
		(this.grid && this.grid.stop(), this.linear && this.linear.stop());
	},
	onZoomOut() {
		(this.grid && this.grid.start(), this.linear && this.linear.start());
	},
	onInitFreeScroll() {
		const i = this.local.querySelector(
			'.c-scroll-wrapper[data-type="archive-grid"]',
		);
		if (i) {
			let element = 7,
				trigger = 4,
				start = ".c-archive-li";
			IS_MOBILE_MODE &&
			ORIENTATION === "portrait" &&
			((element = 3),
				(trigger = 6),
				(start = ".c-archive-li.c-archive-li-a"));
			let end = this.params.ease * 0.666666667;
			this.grid = new UsagiScroll({
				wrap: i,
				speed: this.params.speed,
				ease: end,
				ul: ".c-archive-ul",
				li: start,
				grid: {
					x: element,
					y: trigger,
				},
				touch: {
					ratio: TOUCH_RATIO,
				},
			});
		}
	},
	onInitScroll() {
		const i = this.local.querySelector(
			'.c-scroll-wrapper[data-type="archive-linear"]',
		);
		if (i) {
			let element = ".c-archive-li",
				trigger = this.params.ease;
			(IS_MOBILE_MODE &&
			ORIENTATION === "portrait" &&
			((element = ".c-archive-li.c-archive-li-a"),
				(trigger = this.params.ease * 0.666666667)),
				(this.linear = new UsagiScroll({
					wrap: i,
					body: ".c-scroll-body",
					content: ".c-archive-ul",
					section: element,
					speed: this.params.speed,
					ease: trigger,
					dir: "vr",
					infinite: !0,
					fillscreen: !1,
					autocenter: !1,
					reduced: !1,
					scrollbar: {
						enable: !1,
						wrapClassName: "c-scrollbar",
						thumbClassName: "c-thumb",
						pivotClassName: "c-pivot",
					},
					touch: {
						enable: DETECT.device.any,
						ratio: TOUCH_RATIO,
						dir: "vr",
					},
				})),
			SPLASH.isSplashed &&
			this.onSplash(
				PAGE_TRANSITION.enter.ptFadeArchive.s,
				PAGE_TRANSITION.enter.ptFadeArchive.d,
				PAGE_TRANSITION.enter.ptFadeArchive.element,
			));
		}
	},
	raf() {
		(this.grid &&
		WEBGL_ARCHIVE.layout.linear.power < 0.5 &&
		SPLASH.isSplashed &&
		this.grid.raf(),
		this.linear &&
		WEBGL_ARCHIVE.layout.linear.power > 0.5 &&
		SPLASH.isSplashed &&
		this.linear.raf());
	},
	onDestroy() {
		(this.grid && (this.grid.onDestroy(), (this.grid = null)),
		this.linear && (this.linear.onDestroy(), (this.linear = null)));
	},
};
var baseVertexShader = `varying vec2 vUv;
void main(){
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}`,
	baseFragShader = `varying vec2 vUv;

uniform sampler2D tMouse;
uniform sampler2D tFront;
uniform sampler2D tBack;
uniform vec3 cBlack;
uniform vec3 cBg;

uniform vec2 resolution;
uniform vec2 i_resolution;

const float PI = 3.1415926;
uniform float time;

uniform float wakuNaiVisible;
uniform float wakuSenOpacity;

vec3 LinearTosRGB(vec3 linear) { return pow(linear, vec3(1.0 / 2.2)); }

void main() {

	
	vec2 vUvA = vec2( vUv.x, vUv.y * resolution.y / resolution.x );

	
	vec3 tBg = LinearTosRGB( cBg );
	vec3 tBlack = LinearTosRGB( cBlack );

	
	vec4 iMouse = texture( tMouse, vUv );
	vec4 iFront = texture( tFront, vUv );
	

	
	
	
	

	
	vec4 iBack  = texture( tBack, vUv );

	
	vec3 col = vec3(1.0);
	float alpha = iBack.a * iFront.a;

	alpha = iMouse.end > 0.99
	    ? mix(iFront.a, iBack.a, wakuNaiVisible)
	    : iMouse.end > 0.1
	        ? ((iFront.end + iFront.g + iFront.b) * iFront.a + (iBack.end + iBack.g + iBack.b) * iBack.a) / 6.0 != 0.0
	            ? wakuSenOpacity
	            : 0.0
	        : iFront.a;

	col = iMouse.end > 0.99
	    ? mix(iFront.rgb, iBack.rgb, wakuNaiVisible)
	    : iMouse.end > 0.1
	        ? tBlack * 0.9
	        : iFront.rgb;

	
	

	
	
	
	
	

	

	
	
	
	
	

	

	
	
	
	
	

	

	
	gl_FragColor = vec4( col, alpha );
	
	
	

}`;
const WEBGL = {
	fov: 15,
	ready: !1,
	once() {
		((this.width = WW * RESCALE),
			(this.height = WH * RESCALE),
			(this.canvas = document.getElementById("js-webgl")),
			(this.renderer = new THREE.WebGLRenderer({
				canvas: this.canvas,
				alpha: !0,
				antialias: !1,
			})),
			this.renderer.setPixelRatio(RES),
			(this.renderer.shadowMap.enabled = !1),
			(this.scene = new THREE.Scene()),
			(this.aspect = this.width / this.height),
			(this.o_camera = new THREE.OrthographicCamera(
				(-this.height * this.aspect) / 2,
				(this.height * this.aspect) / 2,
				this.height / 2,
				-this.height / 2,
				-this.height / 2,
				this.height / 2,
			)),
			(this.o_camera.position.z = 1),
			this.onInit(),
			(this.padding = {
				x: 0,
				y: 0,
			}),
			(this.ready = !0));
	},
	params: {
		edgePower: 20,
		noiseSpeed: 0.5,
		noiseDensity: 5,
		waveSpeed: 0.5,
		waveDisp: {
			x: 5,
			y: 5,
		},
		wavePower: 0.1,
		mouse: {
			size: 0.9,
			age: 0.2,
		},
		trail: {
			power: 0.5,
		},
	},
	onInit() {
		const i = new THREE.PlaneGeometry(1, 1, 1, 1),
			element = new THREE.ShaderMaterial({
				vertexShader: baseVertexShader,
				fragmentShader: `const int MAX_TRAIL_SIZE = ${TRAILS.maxAge};
			${baseFragShader}`,
				uniforms: {
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
					cBlack: {
						value: COLOR.table.black.three,
					},
					cBg: {
						value: COLOR.table.gray.three,
					},
					time: {
						value: 0,
					},
					tMouse: {
						value: null,
					},
					tFront: {
						value: null,
					},
					tBack: {
						value: null,
					},
					wakuNaiVisible: {
						value: 1,
					},
					wakuSenOpacity: {
						value: 1,
					},
				},
				transparent: !0,
			});
		((element.alphaTest = 0.5),
			(this.final = new THREE.Mesh(i, element)),
			this.scene.add(this.final));
	},
	onResize() {
		((this.width = WW * RESCALE),
			(this.height = WH * RESCALE),
			(this.aspect = this.width / this.height),
			(this.padding.x = getPxThree(20)),
			(this.padding.y = getPxThree(15)),
		this.final &&
		((this.final.scale.x = this.width),
			(this.final.scale.y = this.height),
			(this.final.material.uniforms.resolution.value.x = this.final.scale.x),
			(this.final.material.uniforms.resolution.value.y = this.final.scale.y),
			(this.final.material.uniforms.i_resolution.value.x = 1800),
			(this.final.material.uniforms.i_resolution.value.y = 1063)),
			this.renderer.setSize(WW, WH),
		this.p_camera &&
		((this.far =
			-(this.height / 2) / Math.tan((this.fov * Math.PI) / 180 / 2)),
			(this.p_camera.aspect = this.width / this.height),
			(this.p_camera.position.z = -this.far),
			this.p_camera.updateProjectionMatrix()),
		this.o_camera &&
		((this.o_camera.left = -this.width / 2),
			(this.o_camera.right = this.width / 2),
			(this.o_camera.top = this.height / 2),
			(this.o_camera.bottom = -this.height / 2),
			(this.o_camera.near = -this.height / 2),
			(this.o_camera.far = this.height / 2),
			this.o_camera.updateProjectionMatrix()),
			WEBGL_SCREEN.onResize(),
			WEBGL_DOM.onResize(),
			WEBGL_WORKS.onResize(),
			WEBGL_HOME.onResize(),
			WEBGL_ABOUT.onResize(),
			WEBGL_SINGLE.onResize(),
			WEBGL_ARCHIVE.onResize(),
			WEBGL_MOUSE.onResize(),
			WEBGL_404.onResize());
	},
	onUpdate() {
		this.final.material &&
		((this.final.material.uniforms.wakuNaiVisible.value =
			PAGE_TRANSITION.page.single.ptFade +
			PAGE_TRANSITION.page.works.ptFade +
			PAGE_TRANSITION.page.info.ptFade),
			(this.final.material.uniforms.wakuSenOpacity.value =
				PAGE_TRANSITION.page["error-500"].ptFadeMouse +
				PAGE_TRANSITION.page["error-404"].ptFadeMouse +
				PAGE_TRANSITION.page.info.ptFadeMouse +
				PAGE_TRANSITION.page.works.ptFadeMouse +
				PAGE_TRANSITION.page.home.ptFadeMouse),
			(this.final.material.uniforms.time.value += 0.01));
	},
	onRender() {
		(this.onUpdate(),
			WEBGL_SCREEN.onRender(),
			WEBGL_DOM.onRender(),
			WEBGL_WORKS.onRender(),
			WEBGL_HOME.onRender(),
			WEBGL_ABOUT.onRender(),
			WEBGL_SINGLE.onRender(),
			WEBGL_ARCHIVE.onRender(),
			WEBGL_MOUSE.onRender(),
			WEBGL_404.onRender(),
			this.renderer.setRenderTarget(null),
			this.renderer.render(this.scene, this.o_camera));
	},
};
WEBGL.ready = !1;
var backgroundFragShader = `varying vec2 vUv;
uniform vec3 cBg;
uniform float opacity;

void main() {
	gl_FragColor = vec4( cBg, 1.0 );
	gl_FragColor = LinearTosRGB( gl_FragColor );
	gl_FragColor.a = opacity;
}`;
const WEBGL_SCREEN = {
		alpha: {
			fbo: null,
			scene: null,
		},
		front: {
			fbo: null,
			scene: null,
		},
		back: {
			fbo: null,
			scene: null,
		},
		once() {
			((this.front.scene = new THREE.Scene()),
				(this.front.fbo = new THREE.WebGLRenderTarget(WW, WH, {
					minFilter: THREE.LinearFilter,
					magFilter: THREE.LinearFilter,
					format: THREE.RGBFormat,
				})),
				(this.back.scene = new THREE.Scene()),
				(this.back.fbo = new THREE.WebGLRenderTarget(WW, WH, {
					minFilter: THREE.LinearFilter,
					magFilter: THREE.LinearFilter,
					format: THREE.RGBFormat,
				})),
				(WEBGL.final.material.uniforms.tFront.value = this.front.fbo.texture),
				(WEBGL.final.material.uniforms.tBack.value = this.back.fbo.texture),
				this.onInitBackground(),
				this.onResize());
		},
		onInitBackground() {
			let i, element;
			((i = new THREE.PlaneGeometry(1, 1, 1, 1)),
				(element = new THREE.ShaderMaterial({
					vertexShader: baseVertexShader,
					fragmentShader: backgroundFragShader,
					uniforms: {
						opacity: {
							value: 0,
						},
						cBg: {
							value: COLOR.table.gray.three,
						},
					},
				})),
				(this.bgFront = new THREE.Mesh(i, element)),
				this.front.scene.add(this.bgFront),
				(element = new THREE.ShaderMaterial({
					vertexShader: baseVertexShader,
					fragmentShader: backgroundFragShader,
					uniforms: {
						opacity: {
							value: 0,
						},
						cBg: {
							value: COLOR.table.gray.three,
						},
					},
				})),
				(this.bgBack = new THREE.Mesh(i, element)),
				this.back.scene.add(this.bgBack));
		},
		onResize() {
			(this.front.fbo && this.front.fbo.setSize(WW * RES, WH * RES),
			this.back.fbo && this.back.fbo.setSize(WW * RES, WH * RES),
			this.bgFront &&
			((this.bgFront.scale.x = WEBGL.width),
				(this.bgFront.scale.y = WEBGL.height)),
			this.bgBack &&
			((this.bgBack.scale.x = WEBGL.width),
				(this.bgBack.scale.y = WEBGL.height)));
		},
		onRender() {
			(WEBGL.renderer.setRenderTarget(this.front.fbo),
				WEBGL.renderer.render(this.front.scene, WEBGL.o_camera),
				WEBGL.renderer.setRenderTarget(this.back.fbo),
				WEBGL.renderer.render(this.back.scene, WEBGL.o_camera));
		},
		onDestroy() {
		},
	},
	pf = {
		local: null,
		array: [],
		once() {
		},
		onInit(i) {
			this.local = i || document;
			const element = this.local.querySelectorAll(".js-gl");
			for (let trigger = 0; trigger < element.length; trigger++) {
				const start = element[trigger],
					end = start.dataset.glName || "none",
					a = start.dataset.glType || "none",
					o = start.dataset.slug || "none",
					l = start.dataset.glCategory || "none";
				this.array.push({
					el: start,
					name: end,
					type: a,
					slug: o,
					category: l,
					shown: !1,
					visible: !1,
					listerner: null,
					observer: null,
					rect: start.getBoundingClientRect(),
				});
			}
			(this.array.forEach((trigger, start) => {
				((trigger.listerner = (end) => {
					end.forEach((a, o) => {
						a.isIntersecting
							? (trigger.shown || (trigger.shown = !0),
								(trigger.el.dataset.shown = 1),
								(trigger.el.dataset.visible = 1),
								(trigger.visible = !0))
							: ((trigger.el.dataset.visible = 0), (trigger.visible = !1));
					});
				}),
					(trigger.observer = new IntersectionObserver(trigger.listerner, {
						threshold: 0,
					})),
					trigger.observer.observe(trigger.el));
			}),
				this.onResize());
		},
		onResize() {
			for (let i = 0; i < this.array.length; i++) {
				const element = this.array[i];
				switch (
					((element.rect = element.el.getBoundingClientRect()),
						element.category)
					) {
					case "500":
					case "404":
						WEBGL_404.onResize(element);
						break;
					case "home":
						WEBGL_HOME.onResize(element);
						break;
					case "about":
						WEBGL_ABOUT.onResize(element);
						break;
					case "works":
						WEBGL_WORKS.obj[element.slug] && WEBGL_WORKS.onResize(element);
						break;
				}
			}
		},
		onRender() {
		},
		onDestroy() {
			(this.array.forEach((i, element) => {
				i.observer &&
				(i.observer.disconnect(i.el),
					(i.observer = null),
					(i.listerner = null));
			}),
				(this.array = []));
		},
	};
var thumbFragShader = `varying vec2 vUv;

uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform vec2 i_resolution;
uniform float progress;
uniform float borderRadius;
uniform vec2 movePower;
uniform vec2 paraPower;
uniform float opacity;

float borderAlpha(vec2 uv, float radius) {
	vec2 aspectCorrectedUV = uv * resolution.xy / min(resolution.x, resolution.y);
	vec2 q = aspectCorrectedUV - 0.5 * resolution.xy / min(resolution.x, resolution.y);
	vec2 p = abs(q) - (vec2(0.5 * resolution.xy / min(resolution.x, resolution.y)) - radius);
	float dist = length(max(vec2(max(p.x, 0.0), max(p.y, 0.0)), 0.0));
	float alpha = max(p.x, p.y) < 0.0 ? 1.0 : 1.0 - smoothstep(radius - 0.001, radius, dist);
	return alpha + alpha;
}

void main() {

	
	vec2 uvClip = vUv;

	
	if( progress < 0.0 ){
		
		uvClip -= movePower * progress * 0.5;
	} else {
		
		uvClip -= movePower * progress;
	}

	
	float alpha = uvClip.x >= 0.0 && uvClip.x <= 1.0 ? borderAlpha( vUv, borderRadius ) : 0.0;

	
	vec2 ratio = vec2(
		min((resolution.x / resolution.y) / (i_resolution.x / i_resolution.y), 1.0),
		min((resolution.y / resolution.x) / (i_resolution.y / i_resolution.x), 1.0)
	);
	vec2 uvCover = vec2(
		vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
		vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
	);

	
	if( progress < 0.0 ){
		
		uvCover += paraPower * progress * 0.5;
	} else {
		
		uvCover += paraPower * progress;
	}

	
	vec4 iFin = texture( tDiffuse, uvCover );
	iFin.a = clamp( alpha, 0.0, 1.0 ) * opacity;
	gl_FragColor = iFin;

}`;

class Thummb {
	constructor(element = {}) {
		((this.visible = !0),
			(this.index = element.index),
			(this.wait = 50),
			(this.ready = !1),
			(this.props = element),
			(this.name = element.name),
			(this.slug = element.slug),
			(this.global = element.scene),
			(this.syncIndex = element.syncIndex),
			(this.mediaType = element.mediaType),
			(this.videoElement = null),
			(this.src = element.src),
		this.global && (this.onInitMesh(), this.onResize(!1), (this.ready = !0)));
	}
	
	onInitMesh() {
		let element = {
				x: -1,
				y: 0,
			},
			trigger = {
				x: 0.2,
				y: 0,
			};
		(this.name === "thumbL" &&
		((element = {
			x: 1,
			y: 0,
		}),
			(trigger = {
				x: -0.2,
				y: 0,
			})),
			(this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1)),
			(this.material = new THREE.ShaderMaterial({
				vertexShader: baseVertexShader,
				fragmentShader: thumbFragShader,
				transparent: !0,
				uniforms: {
					resolution: {
						value: {
							x: 0,
							y: 0,
						},
					},
					i_resolution: {
						value: {
							x: 1136,
							y: 1272,
						},
					},
					movePower: {
						value: element,
					},
					paraPower: {
						value: trigger,
					},
					progress: {
						value: 0,
					},
					borderRadius: {
						value: 0,
					},
					opacity: {
						value: 1,
					},
					tDiffuse: {
						value: null,
					},
				},
			})),
			(this.mesh = new THREE.Mesh(this.geometry, this.material)),
			(this.mesh.visible = this.visible),
			this.global.add(this.mesh));
	}
	
	onLoaded() {
		setTimeout(() => {
			const element = LOADER.works[this.slug];
			if (this.name === "thumbL") {
				const trigger = element.thumbLeft;
				((this.mesh.material.uniforms.tDiffuse.value = trigger.tex),
				trigger.media === "video" && (this.videoElement = trigger.el));
			} else if (this.name === "thumbR") {
				const trigger = element.thumbRight;
				((this.mesh.material.uniforms.tDiffuse.value = trigger.tex),
				trigger.media === "video" && (this.videoElement = trigger.el));
			}
		}, this.wait * this.index);
	}
	
	onResize(
		element = {
			width: 0,
			height: 0,
			top: 0,
			left: 0,
			borderRadius: 10,
		},
	) {
		(element &&
		((this.width = element.width),
			(this.height = element.height),
			(this.top = element.top),
			(this.left = element.left),
			(this.borderRadius = element.borderRadius)),
		this.mesh &&
		((this.mesh.scale.x = getPxThree(this.width)),
			(this.mesh.scale.y = getPxThree(this.height)),
		ORIENTATION != "portrait" &&
		((this.mesh.position.x =
			-WEBGL.width / 2 + getPxThree(this.left) + this.mesh.scale.x / 2),
			(this.mesh.position.y =
				WEBGL.height / 2 - getPxThree(this.top) - this.mesh.scale.y / 2)),
			(this.mesh.material.uniforms.resolution.value.x = this.mesh.scale.x),
			(this.mesh.material.uniforms.resolution.value.y = this.mesh.scale.y),
			(this.mesh.material.uniforms.borderRadius.value = getPxScaleThree(
				this.borderRadius - 2,
				this.mesh.scale.x,
			))));
	}
	
	onRender() {
		this.ready &&
		((this.mesh.material.uniforms.opacity.value =
			SPLASH.params.spFadeIn.value * PAGE_TRANSITION.page.works.ptFade),
			this.mesh.material.uniforms.opacity.value >= 0.1
				? ((this.mesh.visible = this.visible), this.onUpdate())
				: ((this.visible = !1), (this.mesh.visible = this.visible)));
	}
	
	onUpdate() {
		if (PAGE_SCROLL_WORKS.body && this.mesh.material.uniforms.tDiffuse.value)
			for (
				let element = 0;
				element < PAGE_SCROLL_WORKS.body.sections.elems.length;
				element++
			) {
				const trigger = PAGE_SCROLL_WORKS.body.sections.elems[element];
				trigger.slug === this.props.slug &&
				(ORIENTATION != "portrait"
					? this.onUpdateYoko(trigger)
					: this.onUpdateTate(trigger));
			}
	}
	
	onScollTate() {
		if (PAGE_SCROLL_WORKS.body && this.mesh.material.uniforms.tDiffuse.value)
			for (
				let element = 0;
				element < PAGE_SCROLL_WORKS.body.sections.elems.length;
				element++
			) {
				const trigger = PAGE_SCROLL_WORKS.body.sections.elems[element];
				if (trigger.slug === this.props.slug) {
					const start = trigger.inner.getBoundingClientRect();
					this.mesh.position.y =
						WEBGL.height / 2 - getPxThree(start.top) - this.mesh.scale.y / 2;
				}
			}
	}
	
	onUpdateTate(element) {
		((this.visible = element.visible),
			Math.abs(element.progress) != 2
				? this.videoElement &&
				this.videoElement.paused &&
				onPlayVideo(this.videoElement)
				: this.videoElement &&
				(this.videoElement.paused || this.videoElement.pause()));
	}
	
	onUpdateYoko(element) {
		Math.abs(element.progress) != 2
			? ((this.visible = !0),
			this.videoElement &&
			this.videoElement.paused &&
			onPlayVideo(this.videoElement),
				element.progress < 0
					? (this.mesh.position.z = 2)
					: (this.mesh.position.z = 3),
				(this.mesh.material.uniforms.progress.value = element.progress))
			: ((this.visible = !1),
			this.videoElement &&
			(this.videoElement.paused || this.videoElement.pause()),
				(this.mesh.material.uniforms.progress.value = 2));
	}
	
	onDestroy() {
	}
}

var titleMeshFragShader = `varying vec2 vUv;
uniform sampler2D tNormal;
uniform sampler2D tShadow;
uniform vec2 resolution;
uniform vec2 i_resolution;
uniform vec3 color;
uniform float progress;
uniform float inkbleed;
uniform float opacity;
uniform float edgeSharp;

void main() {

	vec2 ratio = vec2(
		min((resolution.x / resolution.y) / (i_resolution.x / i_resolution.y), 1.0),
		min((resolution.y / resolution.x) / (i_resolution.y / i_resolution.x), 1.0)
	);

	vec2 uvCover = vec2(
		vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
		vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
	);

	
	vec2 uvClip = vUv;
	uvClip += 1.0 * progress;

	
	vec4 iNormal = texture( tNormal, uvCover );
	vec4 iShadow = texture( tShadow, uvCover );

	
	float rad = radians( vUv.y * 180.0 );
	float delay = 1.0 - cos( rad );
	

	
	float fadePower = clamp( inkbleed * 0.5 + sin( inkbleed * 0.5 * delay ), 0.0, 1.0 );
	float alpha = pow( iShadow.end, 4.0 ) * fadePower + iShadow.end * iNormal.a * fadePower * 10.0;
	alpha *= 0.5;
	alpha = 1.0 - step( alpha, 0.5 );

	
	float edgeRatio = 0.8;
	float edgeSmooth = iNormal.a * ( max( inkbleed - edgeRatio, 0.0 ) * ( 1.0 / (1.0 - edgeRatio) ) );
	alpha += edgeSmooth;

	
	float f_alpha = alpha < edgeSharp ? 0.0 : alpha;

	
	f_alpha = uvClip.x >= 0.0 && uvClip.x <= 1.0 ? f_alpha : 0.0;

	
	gl_FragColor = vec4( color, f_alpha * opacity );
	gl_FragColor = LinearTosRGB( gl_FragColor );

}`;

class TitleMesh {
	constructor(element = {}) {
		((this.visible = !0),
			(this.index = element.index),
			(this.wait = 100),
			(this.ready = !1),
			(this.props = element),
			(this.slug = element.slug),
			(this.global = element.scene),
			(this.src = element.src),
			(this.scale = {
				f1: 0,
				x: 1,
				y: 1,
			}),
			(this.translate = {
				x: 0,
				y: 0,
			}),
		this.global &&
		((this.textures = {
			normal: {
				src: null,
				loader: null,
				tex: null,
			},
			shadow: {
				src: null,
				loader: null,
				tex: null,
			},
		}),
			this.onInitMesh(),
			this.onResize(!1)));
	}
	
	onLoadNormal() {
		((this.textures.normal.src = getSrc(
			this.src.normal.d1x,
			this.src.normal.d2x,
			this.src.normal.d1x,
			this.src.normal.d2x,
		)),
			(this.textures.normal.src = this.textures.normal.src + ".webp"),
			(this.textures.normal.loader = new THREE.TextureLoader()),
			this.textures.normal.loader.load(
				this.textures.normal.src,
				(element) => {
					((this.textures.normal.tex = element),
						(this.mesh.material.uniforms.tNormal.value =
							this.textures.normal.tex));
				},
				void 0,
				(element) => {
				},
			));
	}
	
	onLoadShadow() {
		((this.textures.shadow.src = getSrc(
			this.src.shadow.d1x,
			this.src.shadow.d2x,
			this.src.shadow.d1x,
			this.src.shadow.d2x,
		)),
			(this.textures.shadow.src = this.textures.shadow.src + ".webp"),
			(this.textures.shadow.loader = new THREE.TextureLoader()),
			this.textures.shadow.loader.load(
				this.textures.shadow.src,
				(element) => {
					((this.textures.shadow.tex = element),
						(this.mesh.material.uniforms.tShadow.value =
							this.textures.shadow.tex),
						(this.mesh.material.uniforms.i_resolution.value.x =
							this.textures.shadow.tex.image.width),
						(this.mesh.material.uniforms.i_resolution.value.y =
							this.textures.shadow.tex.image.height));
				},
				void 0,
				(element) => {
				},
			));
	}
	
	onInitMesh() {
		const element = new THREE.PlaneGeometry(1, 1, 1, 1),
			trigger = new THREE.ShaderMaterial({
				vertexShader: baseVertexShader,
				fragmentShader: titleMeshFragShader,
				transparent: !0,
				uniforms: {
					resolution: {
						value: {
							x: 0,
							y: 0,
						},
					},
					i_resolution: {
						value: {
							x: 2,
							y: 1,
						},
					},
					progress: {
						value: 0,
					},
					inkbleed: {
						value: 1,
					},
					opacity: {
						value: 1,
					},
					edgeSharp: {
						value: 0.2,
					},
					color: {
						value: COLOR.table.black.three,
					},
					tNormal: {
						value: null,
					},
					tShadow: {
						value: null,
					},
				},
			});
		((this.mesh = new THREE.Mesh(element, trigger)),
			(this.mesh.visible = this.visible),
			this.global.add(this.mesh));
	}
	
	onLoaded() {
		setTimeout(() => {
			const element = LOADER.works[this.slug];
			((this.mesh.material.uniforms.tNormal.value = element.titleNormal.tex),
				(this.mesh.material.uniforms.tShadow.value = element.titleShadow.tex));
		}, this.wait * this.index);
	}
	
	onResize(
		element,
		trigger = {
			width: 0,
			height: 0,
			top: 0,
			left: 0,
		},
	) {
		(trigger &&
		((this.width = trigger.width),
			(this.height = trigger.height),
			(this.top = trigger.top),
			(this.left = trigger.left)),
		this.mesh &&
		((this.mesh.scale.x = getPxThree(this.width) * this.scale.x),
			(this.mesh.scale.y = getPxThree(this.height) * this.scale.y),
			(this.mesh.material.uniforms.resolution.value.x = getPxThree(
				this.width,
			)),
			(this.mesh.material.uniforms.resolution.value.y = getPxThree(
				this.height,
			))));
	}
	
	onRender() {
		this.mesh &&
		((this.mesh.visible = this.visible),
			ORIENTATION != "portrait" ? this.onUpdateYoko() : this.onUpdateTate());
	}
	
	onUpdateYoko() {
		((this.scale.x = 1 - this.scale.f1 * 0.2),
			(this.scale.y = 1 - this.scale.f1 * 0.2),
			(this.mesh.scale.x = getPxThree(this.width) * this.scale.x),
			(this.mesh.scale.y = getPxThree(this.height) * this.scale.y));
		const element =
			(PAGE_TRANSITION.isWorkToSingle &&
				this.slug === PAGE_TRANSITION.current.slug) ||
			(PAGE_TRANSITION.isWorkToSingle &&
				this.slug === PAGE_TRANSITION.next.slug) ||
			(PAGE_TRANSITION.isSingleToWork &&
				this.slug === PAGE_TRANSITION.prev.slug) ||
			(PAGE_TRANSITION.leave.ptWorkTitle.ing &&
				this.slug === PAGE_TRANSITION.prev.slug) ||
			(PAGE_TRANSITION.enter.ptWorkTitle.ing &&
				this.slug === PAGE_TRANSITION.prev.slug);
		switch (PAGE_TRANSITION.current.name) {
			case "works":
				this.onUpdateForWorks();
				break;
			case "single":
				element &&
				(PAGE_TRANSITION.isSingleToWork || PAGE_TRANSITION.isWorkToSingle)
					? this.onUpdateForWorks()
					: this.onUpdateForSingle();
				break;
		}
		if ((element && (this.visible = !0), this.visible)) {
			const trigger =
				-WEBGL.width / 2 + getPxThree(this.left) + getPxThree(this.width) / 2;
			switch (PAGE_TRANSITION.current.name) {
				case "single":
					this.mesh.position.x =
						trigger * (1 - PAGE_TRANSITION.page.single.ptWorkTitle);
					break;
				case "works":
					PAGE_TRANSITION.isSingleToWork || PAGE_TRANSITION.isWorkToSingle
						? (this.mesh.position.x =
							trigger * (1 - PAGE_TRANSITION.page.single.ptWorkTitle))
						: (this.mesh.position.x = trigger);
					break;
			}
		}
		if (DETECT.device.any) {
			const trigger = clamp(
					PAGE_TRANSITION.page.works.ptFade * 0.1 +
					PAGE_TRANSITION.page.works.ptFade *
					PAGE_TRANSITION.page.works.ptInkBleed +
					PAGE_TRANSITION.page.single.ptFade * 0.1 +
					PAGE_TRANSITION.page.single.ptFade *
					PAGE_TRANSITION.page.single.ptInkBleed,
					0,
					1,
				),
				start = clamp(
					PAGE_TRANSITION.page.works.ptFade +
					PAGE_TRANSITION.page.single.ptFade,
					0,
					1,
				);
			((this.mesh.material.uniforms.inkbleed.value =
				SPLASH.params.spFadeInInkBleed.value * trigger),
				(this.mesh.material.uniforms.opacity.value =
					SPLASH.params.spFadeIn.value * start));
		} else
			switch (PAGE_TRANSITION.current.name) {
				case "single":
					((this.mesh.material.uniforms.inkbleed.value = clamp(
						PAGE_TRANSITION.page.single.ptFade * 0.1 +
						PAGE_TRANSITION.page.single.ptFade *
						PAGE_TRANSITION.page.single.ptInkBleed,
						0,
						1,
					)),
						(this.mesh.material.uniforms.opacity.value =
							PAGE_TRANSITION.page.single.ptFade));
					break;
				case "works":
					PAGE_TRANSITION.isSingleToWork
						? ((this.mesh.material.uniforms.inkbleed.value =
							SPLASH.params.spFadeInInkBleed.value),
							(this.mesh.material.uniforms.opacity.value =
								SPLASH.params.spFadeIn.value *
								clamp(
									PAGE_TRANSITION.page.works.ptFade +
									PAGE_TRANSITION.page.single.ptFade,
									0,
									1,
								)))
						: ((this.mesh.material.uniforms.inkbleed.value =
							SPLASH.params.spFadeInInkBleed.value *
							clamp(
								PAGE_TRANSITION.page.works.ptFade * 0.1 +
								PAGE_TRANSITION.page.works.ptFade *
								PAGE_TRANSITION.page.works.ptInkBleed,
								0,
								1,
							)),
							(this.mesh.material.uniforms.opacity.value =
								SPLASH.params.spFadeIn.value));
					break;
				default:
					((this.mesh.material.uniforms.inkbleed.value =
						PAGE_TRANSITION.page.works.ptFade),
						(this.mesh.material.uniforms.opacity.value = clamp(
							PAGE_TRANSITION.page.works.ptFade +
							PAGE_TRANSITION.page.single.ptFade,
							0,
							1,
						)));
					break;
			}
		this.mesh.material.uniforms.opacity.value <= 0.1 &&
		((this.visible = !1), (this.mesh.visible = this.visible));
	}
	
	onScrollYoko(element = PAGE_SCROLL_NORMAL.scroll.y, trigger = 0, start = 0) {
		if (this.mesh && this.visible)
			if (DETECT.device.any)
				this.mesh.position.y =
					WEBGL.height / 2 - getPxThree(this.top) - this.mesh.scale.y / 2;
			else {
				((this.scale.f1 = trigger), (this.translate.y = getPxThree(element)));
				const end =
					WEBGL.height / 2 - getPxThree(this.top) - this.mesh.scale.y / 2;
				this.mesh.position.y = end + this.translate.y;
			}
	}
	
	onUpdateTate() {
		((this.scale.x = 1),
			(this.scale.y = 1),
			(this.mesh.scale.x = getPxThree(this.width) * this.scale.x),
			(this.mesh.scale.y = getPxThree(this.height) * this.scale.y));
		const element =
			(PAGE_TRANSITION.isWorkToSingle &&
				this.slug === PAGE_TRANSITION.current.slug) ||
			(PAGE_TRANSITION.isWorkToSingle &&
				this.slug === PAGE_TRANSITION.next.slug) ||
			(PAGE_TRANSITION.isSingleToWork &&
				this.slug === PAGE_TRANSITION.prev.slug) ||
			(PAGE_TRANSITION.leave.ptWorkTitle.ing &&
				this.slug === PAGE_TRANSITION.prev.slug) ||
			(PAGE_TRANSITION.enter.ptWorkTitle.ing &&
				this.slug === PAGE_TRANSITION.prev.slug);
		switch ((element && (this.visible = !0), PAGE_TRANSITION.current.name)) {
			case "works":
				this.onUpdateForWorks();
				break;
			case "single":
				element &&
				(PAGE_TRANSITION.isSingleToWork || PAGE_TRANSITION.isWorkToSingle)
					? this.onUpdateForWorks()
					: this.onUpdateForSingle();
				break;
		}
		const trigger = clamp(
				PAGE_TRANSITION.page.works.ptFade * 0.1 +
				PAGE_TRANSITION.page.works.ptFade *
				PAGE_TRANSITION.page.works.ptInkBleed +
				PAGE_TRANSITION.page.single.ptFade * 0.1 +
				PAGE_TRANSITION.page.single.ptFade *
				PAGE_TRANSITION.page.single.ptInkBleed,
				0,
				1,
			),
			start = clamp(
				PAGE_TRANSITION.page.works.ptFade + PAGE_TRANSITION.page.single.ptFade,
				0,
				1,
			);
		((this.mesh.material.uniforms.inkbleed.value =
			SPLASH.params.spFadeInInkBleed.value * trigger),
			(this.mesh.material.uniforms.opacity.value =
				SPLASH.params.spFadeIn.value * start));
	}
	
	onScrollTate() {
		if (PAGE_SCROLL_WORKS.body)
			for (
				let element = 0;
				element < PAGE_SCROLL_WORKS.body.sections.elems.length;
				element++
			) {
				const trigger = PAGE_SCROLL_WORKS.body.sections.elems[element];
				if (
					trigger.slug === this.props.slug &&
					trigger.inner.querySelector('[data-gl-type="single-title"]')
				) {
					const end = trigger.inner
						.querySelector('[data-gl-type="single-title"]')
						.getBoundingClientRect();
					this.mesh.position.y =
						WEBGL.height / 2 - getPxThree(end.top) - this.mesh.scale.y / 2;
				}
			}
		else
			this.mesh.position.y =
				WEBGL.height / 2 - getPxThree(this.top) - this.mesh.scale.y / 2;
	}
	
	onUpdateForWorks() {
		PAGE_SCROLL_WORKS.body &&
		(ORIENTATION != "portrait"
			? this.onUpdateForWorksYoko()
			: this.onUpdateForWorksTate());
	}
	
	onUpdateForSingle() {
		PAGE_TRANSITION.current.slug === this.props.slug
			? ((this.visible = !0), (this.mesh.material.uniforms.progress.value = 0))
			: ((this.visible = !1), (this.mesh.material.uniforms.progress.value = 1));
	}
	
	onUpdateForWorksYoko() {
		for (
			let element = 0;
			element < PAGE_SCROLL_WORKS.body.sections.elems.length;
			element++
		) {
			const trigger = PAGE_SCROLL_WORKS.body.sections.elems[element];
			if (trigger.slug === this.props.slug)
				if (trigger.progress != 2) {
					((this.visible = !0),
						trigger.progress < 0
							? (this.mesh.position.z = 3)
							: (this.mesh.position.z = 4),
						(this.mesh.material.uniforms.progress.value =
							trigger.progress * (1 - PAGE_TRANSITION.page.single.ptPower)),
					PAGE_TRANSITION.page.works.ptFade != 1 &&
					PAGE_TRANSITION.prev.name === "single" &&
					(trigger.slug === PAGE_TRANSITION.prev.slug
						? (this.mesh.material.uniforms.progress.value = 0)
						: (this.mesh.material.uniforms.progress.value = 1)));
					const start =
						WEBGL.height / 2 - getPxThree(this.top) - this.mesh.scale.y / 2;
					this.mesh.position.y = start;
				} else this.visible = !1;
		}
	}
	
	onUpdateForWorksTate() {
		this.mesh.material.uniforms.progress.value = 0;
		for (
			let element = 0;
			element < PAGE_SCROLL_WORKS.body.sections.elems.length;
			element++
		) {
			const trigger = PAGE_SCROLL_WORKS.body.sections.elems[element];
			trigger.slug === this.props.slug && (this.visible = trigger.visible);
		}
	}
	
	onDestroy() {
		((this.scale.f1 = 0), (this.scale.x = 1), (this.scale.y = 1));
	}
}

const WebglWorks = {
	ready: !1,
	obj: {},
	keys: [],
	once() {
		for (let i = 0; i < DB_WORKS.length; i++) {
			const element = DB_WORKS[i];
			this.obj[element.slug] = {
				...element,
			};
		}
		Object.keys(this.obj).forEach((i) => {
			(this.obj[i], this.keys.push(i));
		});
		for (let i = 0; i < this.keys.length; i++) {
			const element = this.keys[i],
				trigger = this.obj[element];
			((trigger.mesh = {
				title: null,
				left: null,
				right: null,
			}),
				(trigger.mesh.title = new TitleMesh({
					slug: trigger.slug,
					index: i,
					scene: WEBGL_SCREEN.front.scene,
					src: trigger.title.src,
				})),
				(trigger.mesh.left = new Thummb({
					slug: trigger.slug,
					index: i,
					z: 1,
					name: "thumbL",
					scene: WEBGL_SCREEN.front.scene,
					media: trigger.thumbnail.left.media,
					src: trigger.thumbnail.left.src,
				})),
			DETECT.device.any ||
			(trigger.mesh.right = new Thummb({
				slug: trigger.slug,
				index: i,
				z: 1,
				name: "thumbR",
				scene: WEBGL_SCREEN.back.scene,
				media: trigger.thumbnail.right.media,
				src: trigger.thumbnail.right.src,
			})));
		}
		this.ready = !0;
	},
	onLoaded() {
		for (let i = 0; i < this.keys.length; i++) {
			const element = this.keys[i],
				trigger = this.obj[element];
			(trigger.mesh.title && trigger.mesh.title.onLoaded(),
			trigger.mesh.left && trigger.mesh.left.onLoaded(),
			trigger.mesh.right && trigger.mesh.right.onLoaded());
		}
	},
	onResize(i) {
		if (!i) return !1;
		const element = i.rect,
			trigger = i.name;
		for (let start = 0; start < this.keys.length; start++) {
			const end = this.keys[start],
				a = this.obj[end];
			switch (trigger) {
				case "single-title":
					a.mesh.title &&
					(a.mesh.title.onResize(a, {
						width: element.width,
						height: element.height,
						top: element.top,
						left: element.left,
					}),
						ORIENTATION != "portrait"
							? a.mesh.title.onScrollYoko()
							: a.mesh.title.onScrollTate());
					break;
				case "thumbL":
					a.mesh.left &&
					a.mesh.left.onResize({
						width: element.width,
						height: element.height,
						top: element.top,
						left: element.left,
						borderRadius: 10,
					});
					break;
				case "thumbR":
					a.mesh.right &&
					a.mesh.right.onResize({
						width: element.width,
						height: element.height,
						top: element.top,
						left: element.left,
						borderRadius: 10,
					});
					break;
			}
		}
	},
	onScroll(i, element, trigger) {
		for (let start = 0; start < this.keys.length; start++) {
			const end = this.keys[start],
				a = this.obj[end];
			ORIENTATION != "portrait"
				? a.mesh.title && a.mesh.title.onScrollYoko(i, element, trigger)
				: (a.mesh.title && a.mesh.title.onScrollTate(),
				a.mesh.left && a.mesh.left.onScollTate());
		}
	},
	onRender() {
		for (let i = 0; i < this.keys.length; i++) {
			const element = this.keys[i],
				trigger = this.obj[element];
			(trigger.mesh.title && trigger.mesh.title.onRender(),
			trigger.mesh.left && trigger.mesh.left.onRender(),
			trigger.mesh.right && trigger.mesh.right.onRender());
		}
	},
	onDestroy() {
		for (let i = 0; i < this.keys.length; i++) {
			const element = this.keys[i],
				trigger = this.obj[element];
			(trigger.mesh.title && trigger.mesh.title.onDestroy(),
			trigger.mesh.left && trigger.mesh.left.onDestroy(),
			trigger.mesh.right && trigger.mesh.right.onDestroy());
		}
		this.onScroll(0, 0, 0);
	},
	onTouch() {
		for (let i = 0; i < this.keys.length; i++) {
			const element = this.keys[i],
				trigger = this.obj[element].mesh.left;
			trigger &&
			trigger.visible &&
			trigger.videoElement &&
			trigger.videoElement.paused &&
			onPlayVideo(trigger.videoElement);
		}
	},
};
var bgYenYeFragShader = `varying vec2 vUv;

uniform sampler2D tMouse;
uniform vec3 cBlack;

uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform vec2 i_resolution;

const float PI = 3.1415926;
uniform float time;
uniform float opacity;

uniform float edgePower;

uniform vec2 uvOffset;
uniform vec2 noiseOffset;
uniform float noiseSpeed;
uniform float noiseDensity;

uniform int noiseQuality;
uniform float waveSpeed;
uniform vec2 waveDisp;
uniform float wavePower;

vec3 hash(vec3 p) {p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6))); return -1.0 + 2.0 * fract(sin(p) * 43758.5453); }
float cnoise(vec3 p) {vec3 i = floor(p); vec3 f = fract(p); vec3 u = f * f * (3.0 - 2.0 * f); float a = dot(hash(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)); float b = dot(hash(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)); float c = dot(hash(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)); float d = dot(hash(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)); float element = dot(hash(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)); float f_val = dot(hash(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)); float g = dot(hash(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)); float h = dot(hash(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)); float k0 = mix(a, b, u.x); float k1 = mix(c, d, u.x); float k2 = mix(element, f_val, u.x); float k3 = mix(g, h, u.x); float l0 = mix(k0, k1, u.y); float l1 = mix(k2, k3, u.y); return mix(l0, l1, u.z); }

float random1(float v) { return fract( sin( v ) * 43758.5453123 ); }
float random2(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); }

vec3 random3(vec3 c) {float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0))); vec3 end; end.z = fract(512.0*j); j *= .125; end.x = fract(512.0*j); j *= .125; end.y = fract(512.0*j); return end-0.5; }
const float F3 =  0.3333333;
const float G3 =  0.1666667;
float snoise(vec3 p) {vec3 s = floor(p + dot(p, vec3(F3))); vec3 x = p - s + dot(s, vec3(G3)); vec3 element = step(vec3(0.0), x - x.yzx); vec3 i1 = element*(1.0 - element.zxy); vec3 i2 = 1.0 - element.zxy*(1.0 - element); vec3 x1 = x - i1 + G3; vec3 x2 = x - i2 + 2.0*G3; vec3 x3 = x - 1.0 + 3.0*G3; vec4 w, d; w.x = dot(x, x); w.y = dot(x1, x1); w.z = dot(x2, x2); w.w = dot(x3, x3); w = max(0.6 - w, 0.0); d.x = dot(random3(s), x); d.y = dot(random3(s + i1), x1); d.z = dot(random3(s + i2), x2); d.w = dot(random3(s + 1.0), x3); w *= w; w *= w; d *= w; return dot(d, vec4(52.0)); }
float snoiseFractal(vec3 m) {return   0.5333333* snoise(m) +0.2666667* snoise(2.0*m) +0.1333333* snoise(4.0*m) +0.0666667* snoise(8.0*m); }

float noise(vec2 p){vec2 ip = floor(p); vec2 u = fract(p); u = u*u*(3.0-2.0*u); float res = mix(mix(random2(ip),random2(ip+vec2(1.0,0.0)),u.x), mix(random2(ip+vec2(0.0,1.0)),random2(ip+vec2(1.0,1.0)),u.x),u.y); return res*res; }

float fbm( vec2 st ) {
	float value = 0.0;
	float amplitud = .5;
	vec2 shift = vec2(100.0);
	mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
	for (int i = 0; i < noiseQuality; ++i) {
		value += amplitud * ( sin( time ) * 0.05 + 1.0) * noise(st * vec2(1.5, 1.5));
		st = rot * st * 2.0 + shift;
		amplitud *= 0.5;
	}
	return value;
}

float edge(float v, float center, float edge0, float edge1) {
	return 1.0 - smoothstep(edge0, edge1, abs(v - center));
}

void main() {

	vec2 ratio = vec2(
		min((resolution.x / resolution.y) / (i_resolution.x / i_resolution.y), 1.0),
		min((resolution.y / resolution.x) / (i_resolution.y / i_resolution.x), 1.0)
	);

	vec2 uvCover = vec2(
		vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
		vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
	);

	
	vec2 vUvA = vec2( vUv.x, vUv.y * resolution.y / resolution.x );

	
	float nPowerForTex = cnoise( vec3( vUvA * waveDisp, time * waveSpeed ) ) * wavePower * 0.1;
	float nPowerForMouse = cnoise( vec3( vUvA * waveDisp * 3.0, 1.0 ) ) * wavePower;

	
	vec4 iMouse = texture( tMouse, vUv );

	
	vec3 p3 = vec3( vUvA.xy * noiseDensity, time * noiseSpeed * 0.1 );
	float fractalValue = snoiseFractal( p3 * 8.0 + 8.0 );
	fractalValue = 0.5 + 0.5 * fractalValue;
	vec2 uvFractalValue = vec2( fractalValue );
	uvFractalValue.x *= resolution.y / resolution.x;

	
	float v1 = smoothstep( 0.0, 0.9, fbm( vUvA * 20.0 ));
	vec2 cEdge = vec2(1.0 - v1 * 1.0);
	uvCover += cEdge * noiseOffset * 0.1;

	
	uvCover += cEdge * noiseOffset * 0.1;
	uvCover -= uvFractalValue * noiseOffset * 0.1 + nPowerForTex;
	uvCover += uvOffset * 0.1;

	
	vec4 iFin = texture( tDiffuse, uvCover + iMouse.g );
	iFin.rgb = cBlack;
	iFin.a = iFin.a < 0.1 ? 0.0 : iFin.a * 2.0;
	iFin.a = iFin.a * opacity;

	
	gl_FragColor = iFin;
	gl_FragColor = LinearTosRGB( gl_FragColor );

}`;

class BGYenYe {
	constructor(element = {}) {
		((this.visible = !1),
			(this.translate = {
				x: 0,
				y: 0,
			}),
			(this.params = {
				uvOffset: {
					x: -0.5,
					y: -1.5,
				},
				noiseOffset: {
					x: 0.6,
					y: 0.9,
				},
				noiseQuality: 0,
				noiseSpeed: 0.5,
				noiseDensity: 8,
				waveSpeed: 0.3,
				waveDisp: {
					x: 5,
					y: 5,
				},
				wavePower: 0.5,
			}),
		IS_MOBILE_MODE &&
		((this.params.uvOffset.x = -2),
			(this.params.uvOffset.y = -1),
			(this.params.noiseSpeed = 0.1)),
			this.onInit(),
		DETECT.device.mobile &&
		((this.params.noiseDensity = this.params.noiseDensity * 0.5),
			(this.params.waveSpeed = this.params.waveSpeed * 0.5)));
	}
	
	onInit() {
		let element = [];
		for (let trigger = 0; trigger < TRAILS.maxAge; trigger++)
			element.push(new THREE.Vector2());
		((this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1)),
			(this.material = new THREE.ShaderMaterial({
				vertexShader: baseVertexShader,
				fragmentShader: `const int MAX_TRAIL_SIZE = ${TRAILS.maxAge};
			${bgYenYeFragShader}`,
				uniforms: {
					opacity: {
						value: 1,
					},
					tMouse: {
						value: null,
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
					tDiffuse: {
						value: null,
					},
					time: {
						value: 0,
					},
					cBlack: {
						value: COLOR.table.black.three,
					},
					uvOffset: {
						value: this.params.uvOffset,
					},
					noiseOffset: {
						value: this.params.noiseOffset,
					},
					noiseQuality: {
						value: this.params.noiseQuality,
					},
					noiseSpeed: {
						value: this.params.noiseSpeed,
					},
					noiseDensity: {
						value: this.params.noiseDensity,
					},
					waveSpeed: {
						value: this.params.waveSpeed,
					},
					waveDisp: {
						value: this.params.waveDisp,
					},
					wavePower: {
						value: this.params.wavePower,
					},
				},
				transparent: !0,
			})),
			(this.mesh = new THREE.Mesh(this.geometry, this.material)),
			(this.mesh.position.z = 1),
			WEBGL_SCREEN.front.scene.add(this.mesh),
			this.onInitGui());
	}
	
	onInitGui() {
	}
	
	onResize() {
		this.mesh &&
		((this.mesh.scale.x = WEBGL.width),
			(this.mesh.scale.y = WEBGL.height),
			(this.mesh.position.x = 0),
			(this.mesh.position.y = 0),
			(this.mesh.material.uniforms.resolution.value.x = this.mesh.scale.x),
			(this.mesh.material.uniforms.resolution.value.y = this.mesh.scale.y));
	}
	
	onScroll(element) {
	}
	
	onRender() {
		if (this.mesh) {
			((this.mesh.visible = this.visible),
				(this.mesh.material.uniforms.time.value += 0.01));
			let element =
				Math.sin(this.mesh.material.uniforms.time.value * 0.5) * 0.5 +
				1.5 * (1 - SPLASH.params.spHomeBgNoiseAnim.value);
			(DETECT.device.any && (element = 0),
				(this.mesh.material.uniforms.uvOffset.value.x = this.params.uvOffset.x),
				(this.mesh.material.uniforms.uvOffset.value.y = this.params.uvOffset.y),
				(this.mesh.material.uniforms.noiseOffset.value =
					this.params.noiseOffset),
				(this.mesh.material.uniforms.noiseQuality.value =
					this.params.noiseQuality),
				(this.mesh.material.uniforms.noiseSpeed.value = this.params.noiseSpeed),
				(this.mesh.material.uniforms.noiseDensity.value =
					this.params.noiseDensity * WR + element),
				(this.mesh.material.uniforms.waveSpeed.value = this.params.waveSpeed),
				(this.mesh.material.uniforms.waveDisp.value = this.params.waveDisp),
				(this.mesh.material.uniforms.wavePower.value =
					this.params.wavePower + element));
		}
	}
	
	onDestroy() {
	}
}

var LogoFragShader = `varying vec2 vUv;
uniform sampler2D tNormal;
uniform sampler2D tShadow;
uniform vec3 cBlack;
uniform float inkbleed;
uniform float opacity;
uniform float edgeSharp;

void main() {

	
	vec4 iNormal = texture( tNormal, vUv );
	vec4 iShadow = texture( tShadow, vUv );

	
	float rad = radians( vUv.y * 180.0 );
	float delay = 1.0 - cos( rad );
	

	
	float fadePower = clamp( inkbleed * 0.5 + sin( inkbleed * 0.5 * delay ), 0.0, 1.0 );
	float alpha = pow( iShadow.end, 4.0 ) * fadePower + iShadow.end * iNormal.a * fadePower * 20.0;
	alpha *= 0.5;
	alpha = 1.0 - step( alpha, 0.5 );

	
	float edgeRatio = 0.8;
	float edgeSmooth = iNormal.a * ( max( inkbleed - edgeRatio, 0.0 ) * ( 1.0 / (1.0 - edgeRatio) ) );
	alpha += edgeSmooth;

	
	float f_alpha = alpha < edgeSharp ? 0.0 : alpha;
	gl_FragColor = vec4( cBlack, f_alpha * opacity );
	gl_FragColor = LinearTosRGB( gl_FragColor );

}`;

class LogoShader {
	constructor(element = {}) {
		((this.ready = !1),
			(this.props = element),
			(this.global = element.scene),
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
		this.global && (this.onInitMesh(), this.onResize(!1)));
	}
	
	onInitMesh() {
		const element = new THREE.PlaneGeometry(1, 1, 1, 1),
			trigger = new THREE.ShaderMaterial({
				vertexShader: baseVertexShader,
				fragmentShader: LogoFragShader,
				transparent: !0,
				uniforms: {
					inkbleed: {
						value: 1,
					},
					opacity: {
						value: 1,
					},
					cBlack: {
						value: COLOR.table.black.three,
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
		((this.mesh = new THREE.Mesh(element, trigger)),
			this.global.add(this.mesh));
	}
	
	onResize(
		element = {
			width: 0,
			height: 0,
			top: 0,
			left: 0,
		},
	) {
		element &&
		this.width != element.width &&
		((this.width = element.width),
			(this.height = element.height),
			(this.top = element.top),
			(this.left = element.left),
			(this.mesh.scale.x = getPxThree(this.width) * this.scale.x),
			(this.mesh.scale.y = getPxThree(this.height) * this.scale.y),
			(this.mesh.position.x = 0),
			(this.mesh.position.y = 0),
			(this.mesh.position.z = 3));
	}
	
	onUpdateTexture(element, trigger) {
		((this.mesh.material.uniforms.tNormal.value = element),
			(this.mesh.material.uniforms.tShadow.value = trigger));
	}
	
	onRender() {
		this.mesh &&
		((this.mesh.visible = this.visible),
			(this.mesh.scale.x = getPxThree(this.width) * this.scale.x),
			(this.mesh.scale.y = getPxThree(this.height) * this.scale.y));
	}
	
	onDestroy() {
		this.mesh && (this.mesh.visible = !1);
	}
}

var bgGradientFragShader = `varying vec2 vUv;
uniform vec2 pivot;
uniform vec2 radius;

uniform float noisePower;
uniform float noiseSpeed;
uniform float noiseDensity;

uniform vec2 mouse;
uniform vec2 move;
uniform float time;
uniform float opacity;

uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;
uniform vec3 color4;
uniform float gradient1st;
uniform float gradient2nd;
uniform float gradient3rd;

uniform vec2 resolution;
uniform float borderRadius;

vec3 hash(vec3 p) {p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6))); return -1.0 + 2.0 * fract(sin(p) * 43758.5453); }
float cnoise(vec3 p) {vec3 i = floor(p); vec3 f = fract(p); vec3 u = f * f * (3.0 - 2.0 * f); float a = dot(hash(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)); float b = dot(hash(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)); float c = dot(hash(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)); float d = dot(hash(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)); float element = dot(hash(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)); float f_val = dot(hash(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)); float g = dot(hash(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)); float h = dot(hash(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)); float k0 = mix(a, b, u.x); float k1 = mix(c, d, u.x); float k2 = mix(element, f_val, u.x); float k3 = mix(g, h, u.x); float l0 = mix(k0, k1, u.y); float l1 = mix(k2, k3, u.y); return mix(l0, l1, u.z); }

float borderAlpha(vec2 uv, float radius) {
    vec2 aspectCorrectedUV = uv * resolution.xy / min(resolution.x, resolution.y);
    vec2 q = aspectCorrectedUV - 0.5 * resolution.xy / min(resolution.x, resolution.y);
    vec2 p = abs(q) - (vec2(0.5 * resolution.xy / min(resolution.x, resolution.y)) - radius);
    float dist = length(max(vec2(max(p.x, 0.0), max(p.y, 0.0)), 0.0));
    float alpha = max(p.x, p.y) < 0.0 ? 1.0 : 1.0 - smoothstep(radius - 0.001, radius, dist);
    return alpha;
}

void main() {

	
	float noise = cnoise( vec3( vUv * noiseDensity, time * noiseSpeed ) ) * noisePower;

	
	vec2 adjustedUv = vUv - pivot;
	adjustedUv.x /= radius.x;
	adjustedUv.y /= radius.y;
	adjustedUv -= mouse * move;

	
	vec2 centerOffset = adjustedUv - vec2(0.5, 0.5);

	
    float angle = radians( mouse.x * 5.0 );
    mat2 rotationMatrix = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));

    
    centerOffset = rotationMatrix * centerOffset;
    adjustedUv = centerOffset + vec2(0.5, 0.5);

	
	float dist = length( adjustedUv ) + noise;

	
	vec3 color;
	float trigger = 0.0;
	color = (dist < gradient1st) ? (trigger = dist / gradient1st, mix(color1, color2, trigger)) :
	        (dist < gradient2nd) ? (trigger = (dist - gradient1st) / (gradient2nd - gradient1st), mix(color2, color3, trigger)) :
	        (dist < gradient3rd) ? (trigger = (dist - gradient2nd) / (gradient3rd - gradient2nd), mix(color3, color4, trigger)) : color4;

	
	
	
	
	
	
	
	
	
	
	
	
	

	
	float alpha = 1.0 - smoothstep(1.0, 1.01, dist);
	alpha *= borderAlpha( vUv, borderRadius );

	
	gl_FragColor = vec4( color, alpha * opacity );

}`;

class BGGradientFront {
	constructor(element = {}) {
		((this.visible = !1),
			(this.props = element),
			(this.translate = {
				x: 0,
				y: 0,
			}),
			(this.global = element.scene),
		this.global && this.onInit());
	}
	
	onInit() {
		((this.speed = 0.01),
		IS_MOBILE_MODE && (this.speed = 0.015),
			(this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1)),
			(this.material = new THREE.ShaderMaterial({
				vertexShader: baseVertexShader,
				fragmentShader: bgGradientFragShader,
				uniforms: {
					opacity: {
						value: 0,
					},
					borderRadius: {
						value: 0,
					},
					resolution: {
						value: {
							x: 0,
							y: 0,
						},
					},
					time: {
						value: 0,
					},
					move: {
						value: this.props.move,
					},
					mouse: {
						value: {
							x: 0,
							y: 0,
						},
					},
					noisePower: {
						value: this.props.noisePower,
					},
					noiseSpeed: {
						value: this.props.noiseSpeed,
					},
					noiseDensity: {
						value: this.props.noiseDensity,
					},
					pivot: {
						value: this.props.pivot,
					},
					radius: {
						value: this.props.radius,
					},
					color1: {
						value: this.props.gradient1st.three,
					},
					color2: {
						value: this.props.gradient2nd.three,
					},
					color3: {
						value: this.props.gradient3rd.three,
					},
					color4: {
						value: COLOR.table.white.three,
					},
					gradient1st: {
						value: this.props.gradient1st.power,
					},
					gradient2nd: {
						value: this.props.gradient2nd.power,
					},
					gradient3rd: {
						value: this.props.gradient3rd.power,
					},
				},
				transparent: !1,
			})),
			(this.material.alphaTest = 0.5),
			(this.mesh = new THREE.Mesh(this.geometry, this.material)),
			(this.mesh.position.z = 0),
			this.global.add(this.mesh));
	}
	
	onResize(
		element = {
			width: 0,
			height: 0,
			top: 0,
			left: 0,
		},
	) {
		element &&
		((this.width = element.width),
			(this.height = element.height),
			(this.top = element.top),
			(this.left = element.left),
			(this.mesh.scale.x = getPxThree(this.width)),
			(this.mesh.scale.y = getPxThree(this.height)),
			(this.mesh.material.uniforms.resolution.value.x = this.mesh.scale.x),
			(this.mesh.material.uniforms.resolution.value.y = this.mesh.scale.y),
			(this.mesh.material.uniforms.borderRadius.value = getPxScaleThree(
				this.props.borderRadius - 2,
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
	
	onScroll(element = 0, trigger = 0) {
		this.mesh &&
		((this.translate.y = getPxThree(element)),
			(this.mesh.position.y =
				WEBGL.height / 2 -
				getPxThree(this.top) -
				this.mesh.scale.y / 2 +
				this.translate.y));
	}
	
	onRender() {
		if (this.mesh) {
			this.mesh.visible = this.visible;
			const element = MOUSE.body.array[0].delta.x / WW,
				trigger = 1 - MOUSE.body.array[0].delta.y / WH;
			((this.mesh.material.uniforms.time.value += this.speed),
				(this.mesh.material.uniforms.mouse.value.x = element * 2 - 1),
				(this.mesh.material.uniforms.mouse.value.y = trigger * 2 - 1),
				(this.mesh.material.uniforms.noisePower.value = this.props.noisePower),
				(this.mesh.material.uniforms.noiseSpeed.value = this.props.noiseSpeed),
				(this.mesh.material.uniforms.noiseDensity.value =
					this.props.noiseDensity),
				(this.mesh.position.x =
					-WEBGL.width / 2 +
					getPxThree(this.left) +
					this.mesh.scale.x / 2 +
					this.translate.x));
		}
	}
	
	onDestroy() {
		this.mesh &&
		((this.translate.x = 0),
			(this.translate.y = 0),
			(this.mesh.visible = !1));
	}
}

const WEBGL_HOME = {
	ready: !1,
	once() {
		((this.logo = new LogoShader({
			scene: WEBGL_SCREEN.front.scene,
		})),
			(this.bgYenye = new BGYenYe()),
			(this.bgGradientFront = new BGGradientFront({
				scene: WEBGL_SCREEN.front.scene,
				borderRadius: 0,
				move: {
					x: 0.1,
					y: 0.1,
				},
				pivot: {
					x: 0.5,
					y: 0.7,
				},
				radius: {
					x: 1,
					y: 1.2,
				},
				noisePower: 0.1,
				noiseSpeed: 1,
				noiseDensity: 1,
				gradient1st: {
					power: 0.5,
					hex: "#98c5bb",
					three: new THREE.Color("#98c5bb"),
				},
				gradient2nd: {
					power: 0.85,
					hex: "#becfc1",
					three: new THREE.Color("#becfc1"),
				},
				gradient3rd: {
					power: 1,
					hex: "#eef9ff",
					three: new THREE.Color("#eef9ff"),
				},
				mouse: {
					enable: !1,
					size: 0.9,
					age: 0.2,
				},
			})),
			this.onInitGui(),
			(this.ready = !0));
	},
	onLoaded() {
		((this.bgYenye.mesh.material.uniforms.i_resolution.value.x =
			LOADER.images.homeBg.tex.image.width),
			(this.bgYenye.mesh.material.uniforms.i_resolution.value.y =
				LOADER.images.homeBg.tex.image.height),
			(this.bgYenye.mesh.material.uniforms.tDiffuse.value =
				LOADER.images.homeBg.tex),
			(this.logo.mesh.material.uniforms.tNormal.value =
				LOADER.images.homeLogoNormal.tex),
			(this.logo.mesh.material.uniforms.tShadow.value =
				LOADER.images.homeLogoShadow.tex));
	},
	onInitGui() {
	},
	onResize(i) {
		if (!this.ready || !i) return !1;
		switch (i.name) {
			case "home-logo":
				this.logo.onResize({
					width: (i.rect.height * 1) / 4,
					height: i.rect.height,
					top: 0,
					left: 0,
				});
				break;
			case "home-bg":
				(this.bgYenye.onResize({
					width: WW,
					height: WH,
					top: 0,
					left: 0,
				}),
					this.bgGradientFront.onResize({
						width: WW,
						height: WH,
						top: 0,
						left: 0,
					}));
				break;
		}
	},
	onRender() {
		if (!this.ready) return !1;
		if (((this.logo.visible = !0), WEBGL_DOM.array.length))
			for (let i = 0; i < WEBGL_DOM.array.length; i++)
				WEBGL_DOM.array[i].slug === "home"
					? ((this.bgYenye.visible = !0), (this.bgGradientFront.visible = !0))
					: ((this.bgYenye.visible = PAGE_TRANSITION.page.home.ptFade != 0),
						(this.bgGradientFront.visible =
							PAGE_TRANSITION.page.home.ptFade != 0));
		else ((this.bgYenye.visible = !1), (this.bgGradientFront.visible = !1));
		switch (
			((this.bgYenye.mesh.material.uniforms.opacity.value =
				SPLASH.params.spFadeInArchive.value * PAGE_TRANSITION.page.home.ptFade),
				(this.bgGradientFront.mesh.material.uniforms.opacity.value =
					SPLASH.params.spFadeInArchive.value * PAGE_TRANSITION.page.home.ptFade),
				PAGE_TRANSITION.current.name)
			) {
			case "home":
				((this.logo.mesh.material.uniforms.inkbleed.value =
					SPLASH.params.spFadeInInkBleed.value *
					clamp(
						PAGE_TRANSITION.page.home.ptFade * 0.1 +
						PAGE_TRANSITION.page.home.ptFade *
						PAGE_TRANSITION.page.home.ptInkBleedForPage,
						0,
						1,
					)),
					(this.logo.mesh.material.uniforms.opacity.value =
						SPLASH.params.spFadeIn.value));
				const i = 0.6;
				((this.bgGradientFront.mesh.material.uniforms.gradient1st.value =
					this.bgGradientFront.props.gradient1st.power * i +
					this.bgGradientFront.props.gradient1st.power *
					(1 - i) *
					PAGE_TRANSITION.page.home.ptBgGradient *
					SPLASH.params.spFadeInArchive.value +
					0.5 * (1 - SPLASH.params.spFadeInGradient.value)),
					(this.bgGradientFront.mesh.material.uniforms.gradient2nd.value =
						this.bgGradientFront.props.gradient2nd.power * i +
						this.bgGradientFront.props.gradient2nd.power *
						(1 - i) *
						PAGE_TRANSITION.page.home.ptBgGradient *
						SPLASH.params.spFadeInArchive.value +
						0.5 * (1 - SPLASH.params.spFadeInGradient.value)),
					(this.bgGradientFront.mesh.material.uniforms.gradient3rd.value =
						this.bgGradientFront.props.gradient3rd.power * i +
						this.bgGradientFront.props.gradient3rd.power *
						(1 - i) *
						PAGE_TRANSITION.page.home.ptBgGradient *
						SPLASH.params.spFadeInArchive.value +
						0.5 * (1 - SPLASH.params.spFadeInGradient.value)),
					(this.bgGradientFront.mesh.material.uniforms.gradient1st.value =
						this.bgGradientFront.mesh.material.uniforms.gradient1st.value *
						WR));
				break;
			default:
				((this.logo.mesh.material.uniforms.inkbleed.value =
					PAGE_TRANSITION.page.home.ptFade),
					(this.logo.mesh.material.uniforms.opacity.value =
						PAGE_TRANSITION.page.home.ptFade));
				break;
		}
		(this.logo.onRender(),
		DETECT.reduced || this.bgYenye.onRender(),
			this.bgGradientFront.onRender());
	},
	onDestroy() {
		(this.logo.onDestroy(),
			this.bgYenye.onDestroy(),
			this.bgGradientFront.onDestroy());
	},
};
var fvMainTitleFragShader = `varying vec2 vUv;
uniform sampler2D tNormal;
uniform sampler2D tShadow;
uniform vec3 cBlack;
uniform float inkbleed;
uniform float opacity;
uniform float edgeSharp;

void main() {

	
	vec4 iNormal = texture( tNormal, vUv );
	vec4 iShadow = texture( tShadow, vUv );

	
	float rad = radians( vUv.y * 180.0 );
	float delay = 1.0 - cos( rad );
	

	
	float fadePower = clamp( inkbleed * 0.5 + sin( inkbleed * 0.5 * delay ), 0.0, 1.0 );
	float alpha = pow( iShadow.end, 4.0 ) * fadePower + iShadow.end * iNormal.a * fadePower * 20.0;
	alpha *= 0.5;
	alpha = 1.0 - step( alpha, 0.5 );

	
	float edgeRatio = 0.8;
	float edgeSmooth = iNormal.a * ( max( inkbleed - edgeRatio, 0.0 ) * ( 1.0 / (1.0 - edgeRatio) ) );
	alpha += edgeSmooth;

	float f_alpha = alpha < edgeSharp ? 0.0 : alpha;
	gl_FragColor = vec4( cBlack, f_alpha * opacity );
	gl_FragColor = LinearTosRGB( gl_FragColor );

}`;

class FVMainTitle {
	constructor(element = {}) {
		((this.ready = !1),
			(this.props = element),
			(this.global = element.scene),
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
		this.global && (this.onInitMesh(), this.onResize(!1)));
	}
	
	onInitMesh() {
		const element = new THREE.PlaneGeometry(1, 1, 1, 1),
			trigger = new THREE.ShaderMaterial({
				vertexShader: baseVertexShader,
				fragmentShader: fvMainTitleFragShader,
				transparent: !0,
				uniforms: {
					inkbleed: {
						value: 1,
					},
					opacity: {
						value: 1,
					},
					cBlack: {
						value: COLOR.table.black.three,
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
		((this.mesh = new THREE.Mesh(element, trigger)),
			this.global.add(this.mesh));
	}
	
	onResize(
		element = {
			width: 0,
			height: 0,
			top: 0,
			left: 0,
		},
	) {
		element &&
		((this.width = element.width),
			(this.height = element.height),
			(this.top = element.top),
			(this.left = element.left),
			(this.mesh.scale.x = getPxThree(this.width) * this.scale.x),
			(this.mesh.scale.y = getPxThree(this.height) * this.scale.y),
			(this.mesh.position.x =
				-WEBGL.width / 2 +
				getPxThree(this.left) +
				getPxThree(this.width) / 2 +
				this.translate.x),
			(this.mesh.position.y =
				WEBGL.height / 2 -
				getPxThree(this.top) -
				getPxThree(this.height) / 2 +
				this.translate.y),
			(this.mesh.position.z = 3));
	}
	
	onUpdateTexture(element, trigger) {
		((this.mesh.material.uniforms.tNormal.value = element),
			(this.mesh.material.uniforms.tShadow.value = trigger));
	}
	
	onScroll(element = 0, trigger = 0) {
		this.mesh &&
		((this.translate.y = getPxThree(element)),
			(this.mesh.position.y =
				WEBGL.height / 2 -
				getPxThree(this.top) -
				this.mesh.scale.y / 2 +
				this.translate.y));
	}
	
	onStickyScroll(a = 0, b = 0, c = 0) {
		if (this.mesh) {
			this.scale.f1 = c;
			const end =
				WEBGL.height / 2 - getPxThree(this.top) - this.mesh.scale.y / 2;
			((this.translate.y = b),
				(this.mesh.position.y = end + this.translate.y));
		}
	}
	
	onRender() {
		this.mesh &&
		((this.mesh.visible = this.visible),
			(this.scale.x = 1 - this.scale.f1 * 0.2),
			(this.scale.y = 1 - this.scale.f1 * 0.2),
			(this.mesh.scale.x = getPxThree(this.width) * this.scale.x),
			(this.mesh.scale.y = getPxThree(this.height) * this.scale.y),
			(this.mesh.position.x =
				-WEBGL.width / 2 +
				getPxThree(this.left) +
				getPxThree(this.width) / 2 +
				this.translate.x));
	}
	
	onDestroy() {
		this.mesh && (this.mesh.visible = !1);
	}
}

var fvSubtitleFragShader = `varying vec2 vUv;

uniform float opacity;

uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform vec2 i_resolution;
uniform float borderRadius;

float borderAlpha(vec2 uv, float radius) {
	vec2 aspectCorrectedUV = uv * resolution.xy / min(resolution.x, resolution.y);
	vec2 q = aspectCorrectedUV - 0.5 * resolution.xy / min(resolution.x, resolution.y);
	vec2 p = abs(q) - (vec2(0.5 * resolution.xy / min(resolution.x, resolution.y)) - radius);
	float dist = length(max(vec2(max(p.x, 0.0), max(p.y, 0.0)), 0.0));
	float alpha = max(p.x, p.y) < 0.0 ? 1.0 : 1.0 - smoothstep(radius - 0.001, radius, dist);
	return alpha;
}

void main() {

	vec2 ratio = vec2(
		min((resolution.x / resolution.y) / (i_resolution.x / i_resolution.y), 1.0),
		min((resolution.y / resolution.x) / (i_resolution.y / i_resolution.x), 1.0)
	);

	vec2 uvCover = vec2(
		vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
		vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
	);

	float alpha = borderAlpha( vUv, borderRadius );
	vec4 iFin = texture( tDiffuse, uvCover );
	iFin.a = iFin.a * alpha * opacity;
	gl_FragColor = iFin;

}`;

class FVSubTitleShader {
	constructor(element = {}) {
		((this.visible = !1),
			(this.ready = !1),
			(this.props = element),
			(this.el = element.el),
			(this.global = element.scene),
			(this.translate = {
				x: 0,
				y: 0,
			}),
		this.global && (this.onInitMesh(), this.onResize(!1), this.onScroll()));
	}
	
	onInitMesh() {
		((this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1)),
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
			this.global.add(this.mesh));
	}
	
	onResize(
		element = {
			width: 0,
			height: 0,
			top: 0,
			left: 0,
			borderRadius: 10,
		},
	) {
		element &&
		((this.width = element.width),
			(this.height = element.height),
			(this.top = element.top),
			(this.left = element.left),
			(this.borderRadius = element.borderRadius),
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
	
	onUpdateTexture(element, trigger, start) {
		((this.mesh.material.uniforms.tDiffuse.value = element),
			(this.mesh.material.uniforms.i_resolution.value.x = trigger),
			(this.mesh.material.uniforms.i_resolution.value.y = start));
	}
	
	onScroll(element = 0, trigger = 0) {
		this.mesh &&
		((this.translate.y = getPxThree(element)),
			(this.mesh.position.y =
				WEBGL.height / 2 -
				getPxThree(this.top) -
				this.mesh.scale.y / 2 +
				this.translate.y));
	}
	
	onStickyScroll(element = 0, trigger = 0) {
		if (this.mesh) {
			const start =
				WEBGL.height / 2 - getPxThree(this.top) - this.mesh.scale.y / 2;
			((this.translate.y = trigger),
				(this.mesh.position.y = start + this.translate.y));
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

var marqueeFragmentShader = `varying vec2 vUv;

uniform float opacity;

uniform sampler2D tDiffuse;

uniform vec2 resolution;
uniform vec2 i_repeat;
uniform float time;
uniform float borderRadius;
uniform vec3 cBlack;

float borderAlpha(vec2 uv, float radius) {
	vec2 aspectCorrectedUV = uv * resolution.xy / min(resolution.x, resolution.y);
	vec2 q = aspectCorrectedUV - 0.5 * resolution.xy / min(resolution.x, resolution.y);
	vec2 p = abs(q) - (vec2(0.5 * resolution.xy / min(resolution.x, resolution.y)) - radius);
	float dist = length(max(vec2(max(p.x, 0.0), max(p.y, 0.0)), 0.0));
	float alpha = max(p.x, p.y) < 0.0 ? 1.0 : 1.0 - smoothstep(radius - 0.001, radius, dist);
	return alpha;
}

float random ( float v ) {
	return fract( sin( v ) * 1e4 );
}

void main() {

	
	vec2 uv = vUv;
	uv.y = 1.0 - uv.y;
	vec2 uvScale = uv * ( 1.0/i_repeat );
	uvScale.y = 1.0 - uvScale.y;

	
	vec2 ipos = floor( uvScale );
	float fpos = fract( uvScale.y );

	
	float randx = clamp( random( ipos.y ), 0.1, 1.0 );
	float speed = ( randx * 2.0 - 1.0 ) * time;
	uvScale.x = uvScale.x + speed;
	vec4 iFin = texture( tDiffuse, uvScale );

	
	iFin.a = ( fpos >= 0.95 || fpos <= 0.05 || iFin.a < 0.3 ) ? 0.0 : iFin.a;
	float alpha = borderAlpha( vUv, borderRadius ) * opacity;
	if( iFin.end > 0.9 ) alpha = 0.0;

	
	gl_FragColor = vec4( iFin.rgb, iFin.a * alpha );

	
	

}`;

class MarqueeShader {
	constructor(element = {}) {
		((this.ready = !1),
			(this.props = element),
			(this.global = element.scene),
			(this.translate = {
				x: 0,
				y: 0,
			}),
			(this.speed = element.speed || 0.5),
			(this.scale = element.scale || 0.31),
			(this.time = Math.random()),
		this.global && (this.onInitMesh(), (this.ready = !0)));
	}
	
	onInitMesh() {
		((this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1)),
			(this.material = new THREE.ShaderMaterial({
				vertexShader: baseVertexShader,
				fragmentShader: marqueeFragmentShader,
				transparent: !0,
				uniforms: {
					cBlack: {
						value: COLOR.table.black.three,
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
			this.global.add(this.mesh));
	}
	
	onResize(
		element = {
			width: 0,
			height: 0,
			top: 0,
			left: 0,
		},
	) {
		(element &&
		((this.width = element.width),
			(this.height = element.height),
			(this.top = element.top),
			(this.left = element.left)),
		this.mesh &&
		((this.mesh.scale.x = getPxThree(this.width)),
			(this.mesh.scale.y = getPxThree(this.height)),
			(this.mesh.position.x =
				-WEBGL.width / 2 + getPxThree(this.left) + this.mesh.scale.x / 2),
			(this.mesh.position.y =
				WEBGL.height / 2 - getPxThree(this.top) - this.mesh.scale.y / 2),
			(this.mesh.position.z = 1),
			(this.mesh.material.uniforms.resolution.value.x = this.mesh.scale.x),
			(this.mesh.material.uniforms.resolution.value.y = this.mesh.scale.y),
			(this.mesh.material.uniforms.borderRadius.value = getPxScaleThree(
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
				WR)));
	}
	
	onUpdateTexture(element, trigger, start) {
		((this.mesh.material.uniforms.tDiffuse.value = element),
			(this.mesh.material.uniforms.i_resolution.value.x = trigger),
			(this.mesh.material.uniforms.i_resolution.value.y = start));
	}
	
	onScroll(element = 0, trigger = 0) {
		this.mesh &&
		((this.translate.y = getPxThree(element)),
			(this.mesh.position.y =
				WEBGL.height / 2 -
				getPxThree(this.top) -
				this.mesh.scale.y / 2 +
				this.translate.y));
	}
	
	onRender() {
		this.mesh &&
		(DETECT.reduced ||
		(this.mesh.material.uniforms.time.value >= 1 &&
		(this.mesh.material.uniforms.time.value = 0),
			(this.time += 1e-4 * this.speed)),
			(this.mesh.material.uniforms.time.value =
				this.time + SPLASH.params.spFadeInGradient.value * 0.05),
			(this.mesh.visible = this.visible),
			(this.mesh.position.x =
				-WEBGL.width / 2 +
				getPxThree(this.left) +
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

var yD = `varying vec2 vUv;

uniform float opacity;

uniform vec2 resolution;
uniform vec2 i_resolution;
uniform float borderRadius;

uniform float slidePower1;
uniform float slidePower2;
uniform float slidePower3;
uniform float slidePower4;

uniform sampler2D tSlide1;
uniform sampler2D tSlide2;
uniform sampler2D tSlide3;
uniform sampler2D tSlide4;

float borderAlpha(vec2 uv, float radius) {
    vec2 aspectCorrectedUV = uv * resolution.xy / min(resolution.x, resolution.y);
    vec2 q = aspectCorrectedUV - 0.5 * resolution.xy / min(resolution.x, resolution.y);
    vec2 p = abs(q) - (vec2(0.5 * resolution.xy / min(resolution.x, resolution.y)) - radius);
    float dist = length(max(vec2(max(p.x, 0.0), max(p.y, 0.0)), 0.0));
    float alpha = max(p.x, p.y) < 0.0 ? 1.0 : 1.0 - smoothstep(radius - 0.001, radius, dist);
    return alpha;
}

vec3 hash(vec3 p) {p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6))); return -1.0 + 2.0 * fract(sin(p) * 43758.5453); }
float cnoise(vec3 p) {vec3 i = floor(p); vec3 f = fract(p); vec3 u = f * f * (3.0 - 2.0 * f); float a = dot(hash(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)); float b = dot(hash(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)); float c = dot(hash(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)); float d = dot(hash(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)); float element = dot(hash(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)); float f_val = dot(hash(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)); float g = dot(hash(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)); float h = dot(hash(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)); float k0 = mix(a, b, u.x); float k1 = mix(c, d, u.x); float k2 = mix(element, f_val, u.x); float k3 = mix(g, h, u.x); float l0 = mix(k0, k1, u.y); float l1 = mix(k2, k3, u.y); return mix(l0, l1, u.z); }

vec3 random3(vec3 c) {float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0))); vec3 end; end.z = fract(512.0*j); j *= .125; end.x = fract(512.0*j); j *= .125; end.y = fract(512.0*j); return end-0.5; }
const float F3 =  0.3333333;
const float G3 =  0.1666667;
float snoise(vec3 p) {vec3 s = floor(p + dot(p, vec3(F3))); vec3 x = p - s + dot(s, vec3(G3)); vec3 element = step(vec3(0.0), x - x.yzx); vec3 i1 = element*(1.0 - element.zxy); vec3 i2 = 1.0 - element.zxy*(1.0 - element); vec3 x1 = x - i1 + G3; vec3 x2 = x - i2 + 2.0*G3; vec3 x3 = x - 1.0 + 3.0*G3; vec4 w, d; w.x = dot(x, x); w.y = dot(x1, x1); w.z = dot(x2, x2); w.w = dot(x3, x3); w = max(0.6 - w, 0.0); d.x = dot(random3(s), x); d.y = dot(random3(s + i1), x1); d.z = dot(random3(s + i2), x2); d.w = dot(random3(s + 1.0), x3); w *= w; w *= w; d *= w; return dot(d, vec4(52.0)); }
float snoiseFractal(vec3 m) {return   0.5333333* snoise(m) +0.2666667* snoise(2.0*m) +0.1333333* snoise(4.0*m) +0.0666667* snoise(8.0*m); }

uniform float fadeDensity;
uniform float fadePower;
uniform float borderWidth;
uniform vec3 borderColor;
vec3 LinearTosRGB(vec3 linear) { return pow(linear, vec3(1.0 / 2.2)); }
vec4 getFadeColor( float power, float fog, float noise, vec4 color1, vec4 color2 ){
	float wave = ( 1.0 + vUv.y - power * 2.0 ) * fadePower;
	float fade = 1.0 - clamp( wave + wave * fog + wave * noise, 0.0, 1.0 );
	vec4 finalColor = vec4( 1.0 );
	if( fade > 0.0 && fade < borderWidth ){
		vec3 col = (1.0 - color1.rgb) - (fade - borderWidth);
		finalColor = vec4( LinearTosRGB( col * 0.3 ), 1.0 );
	} else {
		finalColor = mix( color1, color2, 1.0 - step( fade, borderWidth ) );
	}
	return finalColor;
}

void main() {

	vec2 vUvA = vec2( vUv.x, vUv.y * resolution.y / resolution.x );
	float noise = cnoise( vec3( vUvA * 3.0, fadeDensity ) );

	
	vec3 p3 = vec3( vUvA * fadeDensity, 1.0 );
	float fog = snoiseFractal( p3 );

    
    vec2 ratio = vec2(
        min((resolution.x / resolution.y) / (i_resolution.x / i_resolution.y), 1.0),
        min((resolution.y / resolution.x) / (i_resolution.y / i_resolution.x), 1.0)
    );

    
    vec2 uvCover = vec2(
        vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
        vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

	float alpha = borderAlpha( vUv, borderRadius );
	
	
	

    
    vec4 color1 = texture( tSlide1, vUv );
    vec4 color2 = texture( tSlide2, vUv );
    vec4 color3 = texture( tSlide3, vUv );
    vec4 color4 = texture( tSlide4, vUv );

    
    vec4 finalColor = color1;
	float fade = 0.0;
	if (slidePower2 > 0.0) {
		finalColor = getFadeColor( slidePower2, fog, noise, color1, color2 );
	}
	if (slidePower3 > 0.0) {
		finalColor = getFadeColor( slidePower3, fog, noise, color2, color3 );
	}
	if (slidePower4 > 0.0) {
		finalColor = getFadeColor( slidePower4, fog, noise, color3, color4 );
	}

	gl_FragColor = finalColor;
	gl_FragColor.a = alpha * opacity;

	

}`;

class StickySlider {
	constructor(element = {}) {
		((this.ready = !1),
			(this.props = element),
			(this.el = element.el),
			(this.global = element.scene),
			(this.borderRadius = element.borderRadius || 0),
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
				...element.textures,
			})));
	}
	
	onLoadTexture() {
		Object.keys(this.textures).forEach((element, trigger) => {
			const start = this.textures[element];
			let end = null;
			(start.video
				? ((end = getVideoSrc(
					start.video.d1x,
					start.video.d2x,
					start.video.mob,
					start.video.d1x,
				)),
					(end = CDN_URL + end + "?v=" + VERSION),
					(start.el = document.createElement("video")),
					(start.el.preload = "metadata"),
					(start.el.muted = !0),
					(start.el.loop = !0),
					start.el.setAttribute("crossorigin", "anonymous"),
					start.el.setAttribute("muted", ""),
					start.el.setAttribute("playsinline", "playsinline"),
					(start.el.src = end),
					onPlayVideo(start.el),
					(start.tex = new THREE.VideoTexture(start.el)))
				: ((end = getSrc(
					start.image.d1x,
					start.image.d2x,
					start.image.mob,
					start.image.d1x,
				)),
					(end = CDN_URL + end + ".webp?v=" + VERSION),
					(start.tex = new THREE.TextureLoader().load(end))),
			this.material.uniforms[element] &&
			(this.material.uniforms[element].value = start.tex));
		});
	}
	
	onInitMesh() {
		((this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1)),
			(this.material = new THREE.ShaderMaterial({
				vertexShader: baseVertexShader,
				fragmentShader: yD,
				transparent: !0,
				uniforms: {
					opacity: {
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
							x: 0,
							y: 0,
						},
					},
					borderRadius: {
						value: 0,
					},
					fadeDensity: {
						value: this.params.fadeDensity,
					},
					fadePower: {
						value: this.params.fadePower,
					},
					borderWidth: {
						value: this.params.borderWidth,
					},
					borderColor: {
						value: COLOR.table.white.three,
					},
					slidePower1: {
						value: 0,
					},
					slidePower2: {
						value: 0,
					},
					slidePower3: {
						value: 0,
					},
					slidePower4: {
						value: 0,
					},
					tSlide1: {
						value: null,
					},
					tSlide2: {
						value: null,
					},
					tSlide3: {
						value: null,
					},
					tSlide4: {
						value: null,
					},
				},
			})),
			(this.mesh = new THREE.Mesh(this.geometry, this.material)),
			this.global.add(this.mesh));
	}
	
	onResize() {
		const element = document.querySelector(
			'[data-gl-type="about-sticky-img-slider"]',
		);
		if (element) {
			const trigger = element.getBoundingClientRect();
			((this.width = trigger.width),
				(this.height = trigger.height),
				(this.top = WH),
				(this.left = trigger.left),
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
					WEBGL.height / 2 - getPxThree(WH * 1.5) + this.translate.y));
		}
	}
	
	onScroll(element = 0, trigger = 0, start = 0) {
		this.mesh &&
		((this.translate.y = trigger != 1 ? getPxThree(element) : getPxThree(WH)),
			(this.mesh.position.y =
				WEBGL.height / 2 - getPxThree(WH * 1.5) + this.translate.y));
	}
	
	onSync(element, trigger) {
		const start = Math.min(trigger * 2, 1);
		switch (element) {
			case "sticky-slider-1":
				this.mesh.material.uniforms.slidePower1.value = start;
				break;
			case "sticky-slider-2":
				this.mesh.material.uniforms.slidePower2.value = start;
				break;
			case "sticky-slider-3":
				this.mesh.material.uniforms.slidePower3.value = start;
				break;
			case "sticky-slider-4":
				this.mesh.material.uniforms.slidePower4.value = start;
				break;
		}
	}
	
	onRender() {
		this.mesh &&
		((this.mesh.visible = this.visible),
			(this.mesh.position.x =
				-WEBGL.width / 2 +
				getPxThree(this.left) +
				this.mesh.scale.x / 2 +
				this.translate.x),
			(this.mesh.material.uniforms.fadeDensity.value = this.params.fadeDensity),
			(this.mesh.material.uniforms.fadePower.value = this.params.fadePower),
			(this.mesh.material.uniforms.borderWidth.value =
				this.params.borderWidth));
	}
	
	onDestroy() {
		(this.mesh &&
		((this.mesh.visible = !1),
			(this.mesh.material.uniforms.slidePower1.value = 0),
			(this.mesh.material.uniforms.slidePower2.value = 0),
			(this.mesh.material.uniforms.slidePower3.value = 0),
			(this.mesh.material.uniforms.slidePower4.value = 0)),
			Object.keys(this.textures).forEach((element, trigger) => {
				const start = this.textures[element];
				start.el = null;
			}));
	}
	
	onTouch() {
		Object.keys(this.textures).forEach((element, trigger) => {
			const start = this.textures[element];
			start.el && start.el.paused && onPlayVideo(start.el);
		});
	}
}

const WEBGL_ABOUT = {
	ready: !1,
	fvMarquee: null,
	once() {
		((this.fvMainTitle = new FVMainTitle({
			scene: WEBGL_SCREEN.front.scene,
		})),
		DETECT.device.any ||
		(this.fvMarquee = new MarqueeShader({
			scene: WEBGL_SCREEN.back.scene,
		})),
			(this.stickySlider = new StickySlider({
				borderRadius: 10,
				scene: WEBGL_SCREEN.front.scene,
				textures: {
					tSlide1: {
						el: null,
						type: "image",
						tex: null,
						image: {
							d2x: "/assets/img/info-slider-assets/info-slide-1@2x.jpg",
							d1x: "/assets/img/info-slider-assets/info-slide-1@1x.jpg",
							mob: "/assets/img/info-slider-assets/info-slide-1@1x.jpg",
						},
					},
					tSlide2: {
						el: null,
						type: "video",
						tex: null,
						image: {
							d2x: "/assets/img/info-slider-assets/info-slide-2@2x.jpg",
							d1x: "/assets/img/info-slider-assets/info-slide-2@1x.jpg",
							mob: "/assets/img/info-slider-assets/info-slide-2@1x.jpg",
						},
						video: {
							d2x: "/assets/video/info-slider-assets/info-slide-2-1280.mp4",
							d1x: "/assets/video/info-slider-assets/info-slide-2-720.mp4",
							mob: "/assets/video/info-slider-assets/info-slide-2-720.mp4",
						},
					},
					tSlide3: {
						el: null,
						type: "image",
						tex: null,
						image: {
							d2x: "/assets/img/info-slider-assets/info-slide-3@2x.jpg",
							d1x: "/assets/img/info-slider-assets/info-slide-3@1x.jpg",
							mob: "/assets/img/info-slider-assets/info-slide-3@1x.jpg",
						},
					},
					tSlide4: {
						el: null,
						type: "video",
						tex: null,
						image: {
							d2x: "/assets/img/info-slider-assets/info-slide-4@2x.jpg",
							d1x: "/assets/img/info-slider-assets/info-slide-4@1x.jpg",
							mob: "/assets/img/info-slider-assets/info-slide-4@1x.jpg",
						},
						video: {
							d2x: "/assets/video/info-slider-assets/info-slide-4-1280.mp4",
							d1x: "/assets/video/info-slider-assets/info-slide-4-720.mp4",
							mob: "/assets/video/info-slider-assets/info-slide-4-720.mp4",
						},
					},
				},
			})),
			(this.fvSubTitle = new FVSubTitleShader({
				borderRadius: 0,
				scene: WEBGL_SCREEN.front.scene,
			})));
		let i = 0.4,
			element = 0.8,
			trigger = 0.9;
		(IS_MOBILE_MODE && ((i = 0.6), (element = 0.9), (trigger = 1)),
			(this.fvGradient = new BGGradientFront({
				scene: WEBGL_SCREEN.front.scene,
				borderRadius: 15,
				move: {
					x: 0.1,
					y: 0.2,
				},
				pivot: {
					x: 0.5,
					y: 0.6,
				},
				radius: {
					x: 1.2,
					y: 1.2,
				},
				noisePower: 0.1,
				noiseSpeed: 1,
				noiseDensity: 1,
				gradient1st: {
					power: i,
					hex: "#b4dff2",
					three: new THREE.Color("#b4dff2"),
				},
				gradient2nd: {
					power: element,
					hex: "#c8dee8",
					three: new THREE.Color("#c8dee8"),
				},
				gradient3rd: {
					power: trigger,
					hex: "#fffbdb",
					three: new THREE.Color("#fffbdb"),
				},
				mouse: {
					enable: !1,
					size: 0.9,
					age: 0.2,
				},
			})),
			this.onInit(),
			this.onInitGui(),
			(this.ready = !0));
	},
	title: {
		wrap: null,
		rect: {
			top: 0,
			left: 0,
			width: 0,
			height: 0,
		},
	},
	onInit(i) {
		((this.local = i || document),
			(this.title.wrap = this.local.querySelector(".c-about-logo-wrap")),
		this.title.wrap &&
		(this.title.rect = this.title.wrap.getBoundingClientRect()),
			this.onScroll(0, 0, 0));
	},
	onInitAfter() {
		this.onResize();
	},
	onInitGui() {
	},
	onLoaded() {
		(this.fvMainTitle.onUpdateTexture(
			LOADER.images.aboutLogoNormal.tex,
			LOADER.images.aboutLogoShadow.tex,
		),
			this.fvSubTitle.onUpdateTexture(
				LOADER.images.aboutFvSubtitle.tex,
				LOADER.images.aboutFvSubtitle.tex.image.width,
				LOADER.images.aboutFvSubtitle.tex.image.height,
			),
			(LOADER.images.aboutMarquee.tex.wrapS = THREE.RepeatWrapping),
			(LOADER.images.aboutMarquee.tex.wrapT = THREE.RepeatWrapping),
			(LOADER.images.aboutMarquee.tex.premultiplyAlpha = !0),
		this.fvMarquee &&
		this.fvMarquee.onUpdateTexture(
			LOADER.images.aboutMarquee.tex,
			LOADER.images.aboutMarquee.tex.image.width,
			LOADER.images.aboutMarquee.tex.image.height,
		),
			this.stickySlider.onLoadTexture());
	},
	onResize(i) {
		if (!this.ready || !i) return !1;
		switch (
			(this.title.wrap &&
			(this.title.rect = this.title.wrap.getBoundingClientRect()),
				i.name)
			) {
			case "about-sticky-img-slider":
				this.stickySlider.onResize();
				break;
			case "about-logo":
				this.fvMainTitle.onResize({
					width: i.rect.width,
					height: i.rect.height,
					top: i.rect.top + PAGE_SCROLL_NORMAL.scroll.y,
					left: i.rect.left,
				});
				break;
			case "about-subtitle":
				this.fvSubTitle.onResize({
					width: i.rect.width,
					height: i.rect.height,
					top: i.rect.top + PAGE_SCROLL_NORMAL.scroll.y,
					left: i.rect.left,
				});
				break;
			case "about-fv":
				(this.fvMarquee &&
				this.fvMarquee.onResize({
					width: i.rect.width,
					height: i.rect.height,
					top: i.rect.top + PAGE_SCROLL_NORMAL.scroll.y,
					left: i.rect.left,
				}),
				this.fvGradient &&
				this.fvGradient.onResize({
					width: i.rect.width,
					height: i.rect.height,
					top: i.rect.top + PAGE_SCROLL_NORMAL.scroll.y,
					left: i.rect.left,
				}));
				break;
		}
	},
	onScroll(i, element, trigger) {
		const start =
				getPxThree(WH / 2) -
				getPxThree(this.title.rect.top) -
				getPxThree(this.title.rect.height / 2),
			end =
				getPxThree(WH - this.title.rect.height) / 2 +
				start -
				WEBGL.padding.x * 2;
		let a = getPxThree(i / 2);
		(end < a && (a = getPxThree(i) - end),
		this.fvMainTitle && this.fvMainTitle.onStickyScroll(i, a, element),
		this.fvSubTitle && this.fvSubTitle.onStickyScroll(i, a, element),
		this.fvGradient && this.fvGradient.onScroll(i, element),
		this.fvMarquee && this.fvMarquee.onScroll(i, element),
		this.stickySlider && this.stickySlider.onScroll(i, element, trigger));
	},
	onScrollForMobile(i, element, trigger) {
		const start =
				getPxThree(WH / 2) -
				getPxThree(this.title.rect.top) -
				getPxThree(this.title.rect.height / 2),
			end =
				getPxThree(WH - this.title.rect.height) / 2 +
				start -
				WEBGL.padding.x * 2;
		let a = getPxThree(i / 2);
		(end < a && (a = getPxThree(i) - end),
			IS_MOBILE_MODE
				? this.stickySlider && this.stickySlider.onScroll(0, element, trigger)
				: (this.fvMainTitle && this.fvMainTitle.onStickyScroll(i, a, element),
				this.fvSubTitle && this.fvSubTitle.onStickyScroll(i, a, element),
				this.fvGradient && this.fvGradient.onScroll(i, element),
				this.stickySlider &&
				this.stickySlider.onScroll(i, element, trigger)));
	},
	onSync(i, element) {
		this.stickySlider && this.stickySlider.onSync(i, element);
	},
	onRender() {
		if (!this.ready) return !1;
		if (WEBGL_DOM.array.length)
			for (let i = 0; i < WEBGL_DOM.array.length; i++) {
				const element = WEBGL_DOM.array[i];
				if (element.slug === "about")
					switch (element.name) {
						case "about-sticky-img-slider":
							IS_MOBILE_MODE
								? PAGE_SCROLL_NORMAL.scroll.f1 >= 1
									? (this.stickySlider.visible = element.visible)
									: (this.stickySlider.visible = !1)
								: (this.stickySlider.visible = element.visible);
							break;
						case "about-logo":
							((this.fvMainTitle.visible =
								PAGE_TRANSITION.page.info.ptFade != 0),
							PAGE_SCROLL_NORMAL.scroll.f1 >= 1 &&
							(this.fvMainTitle.visible = !1));
							break;
						case "about-subtitle":
							((this.fvSubTitle.visible =
								PAGE_TRANSITION.page.info.ptFade != 0),
							PAGE_SCROLL_NORMAL.scroll.f1 >= 1 &&
							(this.fvSubTitle.visible = !1));
							break;
						case "about-fv":
							((this.fvGradient.visible = element.visible),
							PAGE_SCROLL_NORMAL.scroll.f1 >= 1 &&
							(this.fvGradient.visible = !1),
							this.fvMarquee && (this.fvMarquee.visible = element.visible));
							break;
					}
				else
					((this.fvMainTitle.visible = !1),
						(this.fvSubTitle.visible = !1),
						(this.fvGradient.visible = !1),
					this.fvMarquee && (this.fvMarquee.visible = !1),
						(this.stickySlider.visible = !1));
			}
		else
			((this.fvMainTitle.visible = !1),
				(this.fvSubTitle.visible = !1),
				(this.fvGradient.visible = !1),
			this.fvMarquee && (this.fvMarquee.visible = !1),
				(this.stickySlider.visible = !1));
		switch (
			((this.stickySlider.mesh.material.uniforms.opacity.value =
				PAGE_TRANSITION.page.info.ptFade * SPLASH.params.spFadeIn.value),
				(this.fvSubTitle.mesh.material.uniforms.opacity.value =
					PAGE_TRANSITION.page.info.ptFade * SPLASH.params.spFadeIn.value),
				(this.fvGradient.mesh.material.uniforms.opacity.value =
					PAGE_TRANSITION.page.info.ptFade * SPLASH.params.spFadeInArchive.value),
			this.fvMarquee &&
			(this.fvMarquee.mesh.material.uniforms.opacity.value =
				PAGE_TRANSITION.page.info.ptFade * SPLASH.params.spFadeIn.value),
				PAGE_TRANSITION.current.name)
			) {
			case "info":
				((this.fvMainTitle.mesh.material.uniforms.inkbleed.value =
					SPLASH.params.spFadeInInkBleed.value *
					clamp(
						PAGE_TRANSITION.page.info.ptFade * 0.1 +
						PAGE_TRANSITION.page.info.ptFade *
						PAGE_TRANSITION.page.info.ptInkBleedForPage,
						0,
						1,
					)),
					(this.fvMainTitle.mesh.material.uniforms.opacity.value =
						SPLASH.params.spFadeIn.value));
				const i = 0.6;
				((this.fvGradient.mesh.material.uniforms.gradient1st.value =
					this.fvGradient.props.gradient1st.power * i +
					this.fvGradient.props.gradient1st.power *
					(1 - i) *
					PAGE_TRANSITION.page.info.ptBgGradient *
					SPLASH.params.spFadeInArchive.value),
					(this.fvGradient.mesh.material.uniforms.gradient2nd.value =
						this.fvGradient.props.gradient2nd.power * i +
						this.fvGradient.props.gradient2nd.power *
						(1 - i) *
						PAGE_TRANSITION.page.info.ptBgGradient *
						SPLASH.params.spFadeInArchive.value),
					(this.fvGradient.mesh.material.uniforms.gradient3rd.value =
						this.fvGradient.props.gradient3rd.power * i +
						this.fvGradient.props.gradient3rd.power *
						(1 - i) *
						PAGE_TRANSITION.page.info.ptBgGradient *
						SPLASH.params.spFadeInArchive.value));
				break;
			default:
				((this.fvMainTitle.mesh.material.uniforms.inkbleed.value =
					PAGE_TRANSITION.page.info.ptFade),
					(this.fvMainTitle.mesh.material.uniforms.opacity.value = clamp(
						PAGE_TRANSITION.page.info.ptFade,
						0,
						1,
					)));
				break;
		}
		(this.fvMainTitle.onRender(),
			this.fvSubTitle.onRender(),
			this.fvGradient.onRender(),
		this.fvMarquee && this.fvMarquee.onRender(),
			this.stickySlider.onRender());
	},
	onDestroy() {
		(this.fvMainTitle.onDestroy(),
			this.fvSubTitle.onDestroy(),
			this.fvGradient.onDestroy(),
		this.fvMarquee && this.fvMarquee.onDestroy(),
			this.stickySlider.onDestroy());
	},
	onTouch() {
		this.stickySlider.onTouch();
	},
};
var wD = `varying vec2 vUv;

uniform vec2 resolution;
uniform vec2 i_resolution;
uniform float borderRadius;

uniform float fade;
uniform float opacity;

uniform float preloadPower;
uniform sampler2D tPoster;
uniform sampler2D tPreload;
uniform sampler2D tDiffuse;

float borderAlpha(vec2 uv, float radius) {
	vec2 aspectCorrectedUV = uv * resolution.xy / min(resolution.x, resolution.y);
	vec2 q = aspectCorrectedUV - 0.5 * resolution.xy / min(resolution.x, resolution.y);
	vec2 p = abs(q) - (vec2(0.5 * resolution.xy / min(resolution.x, resolution.y)) - radius);
	float dist = length(max(vec2(max(p.x, 0.0), max(p.y, 0.0)), 0.0));
	float alpha = max(p.x, p.y) < 0.0 ? 1.0 : 1.0 - smoothstep(radius - 0.001, radius, dist);
	return alpha;
}

void main() {

	vec2 ratio = vec2(
		min((resolution.x / resolution.y) / (i_resolution.x / i_resolution.y), 1.0),
		min((resolution.y / resolution.x) / (i_resolution.y / i_resolution.x), 1.0)
	);
	vec2 uvCover = vec2(
		vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
		vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
	);

	float alpha = borderAlpha( vUv, borderRadius );
	alpha = step( 0.5, alpha );

	
	vec4 iPoster = texture( tPoster, uvCover );
	vec4 iPreload = texture( tPreload, uvCover );
	vec4 iDiffuse = texture( tDiffuse, uvCover );

	
	vec4 iMix = mix( iDiffuse, iPreload, preloadPower );

	
	gl_FragColor = vec4( iMix.rgb, iMix.a * alpha * fade * opacity );
	
	

}`;

class ED {
	constructor(element = {}) {
		((this.visible = !1),
			(this.ready = !1),
			(this.props = element),
			(this.global = element.scene),
			(this.borderRadius = element.borderRadius || 0),
			(this.aspect = {
				width: element.width || 1,
				height: element.height || 1,
			}),
			(this.isloading = !1),
			(this.media = element.media || "image"),
			(this.preload = {
				tl: null,
				power: 1,
				loader: null,
				src: element.src.pre || !1,
				tex: null,
			}),
			(this.poster = {
				tl: null,
				loader: null,
				fade: 0,
				src: null,
				tex: null,
			}),
			(this.image = {
				tl: null,
				loader: null,
				fade: 0,
				src: null,
				tex: null,
			}),
			(this.video = {
				tl: null,
				loader: null,
				fade: 0,
				src: null,
				el: null,
				tex: null,
				playing: {
					func: null,
				},
			}),
			this.media === "video"
				? ((this.poster.src = getSrc(
					element.poster.d1x,
					element.poster.d2x,
					element.poster.mob,
					element.poster.d1x,
				)),
					(this.video.src = getVideoSrc(
						element.src.d1x,
						element.src.d2x,
						element.src.mob,
						element.src.d1x,
					)))
				: (this.image.src = getSrc(
					element.src.d1x,
					element.src.d2x,
					element.src.mob,
					element.src.d1x,
				)),
			(this.translate = {
				x: 0,
				y: 0,
			}),
		this.global && this.onInitMesh());
	}
	
	onView(element) {
		((this.visible = element),
		this.visible &&
		!this.isloading &&
		((this.isloading = !0), this.onLoadTexture()));
	}
	
	onLoadTexture() {
		switch (this.media) {
			case "image":
				this.onLoadImage();
				break;
			case "video":
				this.onLoadVideo();
				break;
		}
	}
	
	onLoadImage() {
		((this.image.loader = new THREE.TextureLoader()),
			this.preload.src
				? (this.props.webp &&
				((this.preload.src += ".webp"), (this.image.src += ".webp")),
					(this.preload.loader = new THREE.TextureLoader()),
					this.preload.loader.load(
						CDN_URL + this.preload.src + "?v=" + VERSION,
						(element) => {
							((this.preload.tex = element),
							this.mesh.material &&
							(this.mesh.material.uniforms.tPreload.value =
								this.preload.tex),
								(this.image.tl = gsap.to(this.image, {
									fade: 1,
									duration: 0.3,
									ease: "power2.out",
								})),
								this.image.loader.load(
									CDN_URL + this.image.src + "?v=" + VERSION,
									(trigger) => {
										((this.image.tex = trigger),
										this.mesh.material &&
										(this.mesh.material.uniforms.tDiffuse.value =
											this.image.tex),
											(this.preload.tl = gsap.to(this.preload, {
												power: 0,
												duration: 1,
												ease: "power2.out",
											})));
									},
								));
						},
					))
				: (this.props.webp && (this.image.src += ".webp"),
					(this.preload.power = 1),
					this.image.loader.load(
						CDN_URL + this.image.src + "?v=" + VERSION,
						(element) => {
							((this.image.tl = gsap.to(this.image, {
								fade: 1,
								duration: 0.3,
								ease: "power2.out",
							})),
								(this.image.tex = element),
							this.mesh.material &&
							(this.mesh.material.uniforms.tPreload.value =
								this.image.tex));
						},
					)));
	}
	
	onLoadVideo() {
		((this.video.el = document.createElement("video")),
			(this.video.el.preload = "metadata"),
			(this.video.el.muted = !0),
			(this.video.el.loop = !0),
			this.video.el.setAttribute("crossorigin", "anonymous"),
			this.video.el.setAttribute("muted", ""),
			this.video.el.setAttribute("playsinline", "playsinline"),
			(this.video.el.src = CDN_URL + this.video.src + "?v=" + VERSION),
			(this.video.tex = new THREE.VideoTexture(this.video.el)),
			(this.mesh.material.uniforms.tDiffuse.value = this.video.tex),
			onPlayVideo(this.video.el),
		this.props.webp && (this.poster.src += ".webp"),
			(this.preload.power = 1),
			(this.poster.loader = new THREE.TextureLoader()),
			this.poster.loader.load(
				CDN_URL + this.poster.src + "?v=" + VERSION,
				(element) => {
					((this.poster.tl = gsap.to(this.poster, {
						fade: 1,
						duration: 0.3,
						ease: "power2.out",
					})),
						(this.poster.tl = gsap.to(this.preload, {
							power: 0,
							duration: 0.3,
							ease: "power2.out",
						})),
						(this.poster.tex = element),
					this.mesh.material &&
					(this.mesh.material.uniforms.tPreload.value = this.poster.tex));
				},
			));
	}
	
	onInitMesh() {
		((this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1)),
			(this.material = new THREE.ShaderMaterial({
				vertexShader: baseVertexShader,
				fragmentShader: wD,
				transparent: !0,
				uniforms: {
					resolution: {
						value: {
							x: 0,
							y: 0,
						},
					},
					i_resolution: {
						value: {
							x: this.aspect.width,
							y: this.aspect.height,
						},
					},
					borderRadius: {
						value: 0,
					},
					fade: {
						value: 0,
					},
					opacity: {
						value: 1,
					},
					preloadPower: {
						value: 0,
					},
					tPoster: {
						value: null,
					},
					tPreload: {
						value: null,
					},
					tDiffuse: {
						value: null,
					},
				},
			})),
			(this.mesh = new THREE.Mesh(this.geometry, this.material)),
			this.global.add(this.mesh));
	}
	
	onResize(
		element = {
			width: 0,
			height: 0,
			top: 0,
			left: 0,
		},
	) {
		element &&
		((this.width = element.width),
			(this.height = element.height),
			(this.top = element.top),
			(this.left = element.left),
			(this.mesh.scale.x = getPxThree(this.width)),
			(this.mesh.scale.y = getPxThree(this.height)),
			(this.mesh.material.uniforms.resolution.value.x = this.mesh.scale.x),
			(this.mesh.material.uniforms.resolution.value.y = this.mesh.scale.y),
			(this.mesh.material.uniforms.borderRadius.value = getPxScaleThree(
				this.borderRadius - 2,
				this.mesh.scale.x,
			)));
	}
	
	onUpdateTexture(element, trigger, start) {
		this.mesh.material.uniforms.tDiffuse.value = element;
	}
	
	onScroll(element = 0, trigger = 0) {
		this.mesh &&
		((this.mesh.visible = this.visible),
			(this.translate.y = getPxThree(element)),
			(this.mesh.position.y =
				WEBGL.height / 2 -
				getPxThree(this.top) -
				this.mesh.scale.y / 2 +
				this.translate.y));
	}
	
	onRender() {
		this.mesh &&
		((this.mesh.material.uniforms.fade.value = clamp(
			this.image.fade + this.poster.fade,
			0,
			1,
		)),
			(this.mesh.material.uniforms.preloadPower.value = this.preload.power),
			(this.mesh.visible = this.visible),
			(this.mesh.position.x =
				-WEBGL.width / 2 +
				getPxThree(this.left) +
				this.mesh.scale.x / 2 +
				this.translate.x));
	}
	
	onDestroy() {
		(this.preload.tl && this.preload.tl.kill(),
			(this.preload.tl = null),
		this.preload.loader && (this.preload.loader = null),
		this.preload.tex && this.preload.tex.dispose(),
			(this.preload.tex = null),
		this.poster.tl && this.poster.tl.kill(),
			(this.poster.tl = null),
		this.poster.loader && (this.poster.loader = null),
		this.poster.tex && this.poster.tex.dispose(),
			(this.poster.tex = null),
		this.image.tl && this.image.tl.kill(),
			(this.image.tl = null),
		this.image.loader && (this.image.loader = null),
		this.image.tex && this.image.tex.dispose(),
			(this.image.tex = null),
		this.video.tl && this.video.tl.kill(),
			(this.video.tl = null),
		this.video.loader && (this.video.loader = null),
		this.video.tex && this.video.tex.dispose(),
			(this.video.tex = null),
			(this.video.el = null),
		this.mesh.geometry && this.mesh.geometry.dispose(),
		this.mesh.material &&
		(Array.isArray(this.mesh.material)
			? this.mesh.material.forEach((element) => element.dispose())
			: this.mesh.material.dispose()),
		this.mesh.parent && this.mesh.parent.remove(this.mesh),
			(this.geometry = null),
			(this.material = null),
			(this.mesh = null));
	}
}

const WebglSingle = {
	array: [],
	ready: !1,
	onInit(i) {
		this.local = i || document;
		const element = this.local.querySelectorAll(".js-gl-s");
		for (let trigger = 0; trigger < element.length; trigger++) {
			const start = element[trigger];
			if (DETECT.device.any) return !1;
			const end = start.dataset.glName || "none",
				a = start.dataset.glType || "none",
				o = start.dataset.slug || "none",
				l = start.dataset.glCategory || "none";
			this.array.push({
				el: start,
				gl: null,
				name: end,
				type: a,
				slug: o,
				category: l,
				shown: !1,
				visible: !1,
				listerner: null,
				observer: null,
				rect: start.getBoundingClientRect(),
			});
		}
		(this.onInitGl(), this.onResize(), this.onInitInview(), (this.ready = !0));
	},
	onInitInview() {
		this.array.forEach((i, element) => {
			((i.listerner = (trigger) => {
				trigger.forEach((start, end) => {
					start.isIntersecting
						? (i.shown || (i.shown = !0),
							(i.el.dataset.shown = 1),
							(i.el.dataset.visible = 1),
							(i.visible = !0),
						i.gl && i.gl.onView(!0))
						: ((i.el.dataset.visible = 0),
							(i.visible = !1),
						i.gl && i.gl.onView(!1));
				});
			}),
				(i.observer = new IntersectionObserver(i.listerner, {
					threshold: 0,
				})),
				i.observer.observe(i.el));
		});
	},
	onInitGl() {
		this.array.forEach((i, element) => {
			const trigger = i.el.dataset.width ? Number(i.el.dataset.width) : 1,
				start = i.el.dataset.height ? Number(i.el.dataset.height) : 1,
				end = i.el.dataset.borderRadius ? Number(i.el.dataset.borderRadius) : 0;
			i.gl = new ED({
				borderRadius: end,
				width: trigger,
				height: start,
				media: i.el.dataset.glMedia,
				webp: i.el.dataset.webp !== "false",
				poster: {
					d2x: i.el.dataset.posterD2x,
					d1x: i.el.dataset.posterD1x,
					mob: i.el.dataset.posterMob,
				},
				src: {
					d2x: i.el.dataset.srcD2x,
					d1x: i.el.dataset.srcD1x,
					mob: i.el.dataset.srcMob,
					pre: i.el.dataset.srcPre,
				},
				scene: WEBGL_SCREEN.front.scene,
			});
		});
	},
	onLoaded() {
	},
	onResize(i) {
		(this.array.forEach((element, trigger) => {
			((element.rect = element.el.getBoundingClientRect()),
				element.gl.onResize({
					width: element.rect.width,
					height: element.rect.height,
					top: element.rect.top + PAGE_SCROLL_NORMAL.scroll.y,
					left: element.rect.left,
				}));
		}),
			this.onScroll(PAGE_SCROLL_NORMAL.scroll.y));
	},
	onScroll(i, element, trigger) {
		this.array.forEach((start, end) => {
			start.gl.onScroll(i, element, trigger);
		});
	},
	onRender() {
		this.array.forEach((i, element) => {
			((i.rect = i.el.getBoundingClientRect()),
				(i.gl.left = i.rect.left),
				(i.gl.mesh.material.uniforms.opacity.value =
					PAGE_TRANSITION.page.single.ptFadeContents),
				i.gl.onRender());
		});
	},
	onDestroy() {
		(this.array.forEach((i, element) => {
			(i.observer &&
			(i.observer.disconnect(i.el),
				(i.observer = null),
				(i.listerner = null)),
			i.gl && (i.gl.onDestroy(), (i.gl = null)));
		}),
			(this.array = []));
	},
};
var SD = `varying vec2 vUv;

uniform vec2 resolution;
uniform vec2 i_resolution;
uniform float borderRadius;

uniform float fade;
uniform float opacity;

uniform float preloadPower;
uniform sampler2D tPoster;
uniform sampler2D tPreload;
uniform sampler2D tDiffuse;

float borderAlpha(vec2 uv, float radius) {
	vec2 aspectCorrectedUV = uv * resolution.xy / min(resolution.x, resolution.y);
	vec2 q = aspectCorrectedUV - 0.5 * resolution.xy / min(resolution.x, resolution.y);
	vec2 p = abs(q) - (vec2(0.5 * resolution.xy / min(resolution.x, resolution.y)) - radius);
	float dist = length(max(vec2(max(p.x, 0.0), max(p.y, 0.0)), 0.0));
	float alpha = max(p.x, p.y) < 0.0 ? 1.0 : 1.0 - smoothstep(radius - 0.001, radius, dist);
	alpha = uv.x < (0.1/resolution.x) || uv.x > 1.0 - (0.1/resolution.x) ? 0.0 : alpha;
	alpha = uv.y < (0.1/resolution.y) || uv.y > 1.0 - (0.1/resolution.y) ? 0.0 : alpha;
	
	return alpha;
}

void main() {

	vec2 ratio = vec2(
		min((resolution.x / resolution.y) / (i_resolution.x / i_resolution.y), 1.0),
		min((resolution.y / resolution.x) / (i_resolution.y / i_resolution.x), 1.0)
	);
	vec2 uvCover = vec2(
		vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
		vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
	);

	float alpha = borderAlpha( vUv, borderRadius );
	alpha = step( 0.5, alpha );

	
	vec4 iPoster = texture( tPoster, uvCover );
	vec4 iPreload = texture( tPreload, uvCover );
	vec4 iDiffuse = texture( tDiffuse, uvCover );

	
	vec4 iMix = mix( iDiffuse, iPreload, preloadPower );

	
	gl_FragColor = vec4( iMix.rgb, iMix.a * alpha * fade * opacity );
	
	

}`;

class ArchiveTriggerMesh {
	constructor(element = {}) {
		((this.visible = !1),
			(this.ready = !1),
			(this.props = element),
			(this.global = element.scene),
			(this.borderRadius = element.borderRadius || 0),
			(this.aspect = {
				width: element.width || 1,
				height: element.height || 1,
			}),
			(this.segments = {
				width: 1,
				height: 1,
			}),
			(this.isloading = !1),
			(this.media = element.media || "image"),
			(this.preload = {
				timer: null,
				tl: null,
				power: 1,
				loader: null,
				src: element.preload || !1,
				tex: null,
			}),
			(this.poster = {
				timer: null,
				tl: null,
				loader: null,
				fade: 0,
				src: null,
				tex: null,
			}),
			(this.image = {
				timer: null,
				tl: null,
				loader: null,
				fade: 0,
				src: null,
				tex: null,
			}),
			(this.video = {
				timer: null,
				tl: null,
				loader: null,
				fade: 0,
				src: null,
				el: null,
				tex: null,
				func: {
					canplay: null,
					playing: null,
					pause: null,
				},
			}),
			this.media === "video"
				? ((this.poster.src = element.poster), (this.video.src = element.src))
				: (this.image.src = element.src),
			(this.timer = null),
			(this.linear = {
				tl: null,
				power: 1,
				width: 0,
				height: 0,
				top: 0,
				left: 0,
			}),
			(this.grid = {
				tl: null,
				power: 0,
				width: 0,
				height: 0,
				top: 0,
				left: 0,
			}),
		this.global && this.onInitMesh(),
			(this.zoom = {
				far: 0,
				tl: null,
				power: 0,
			}),
			(this.fade = {
				tl: null,
				power: 1,
			}));
	}
	
	onFadeOut(element = 1, trigger = "power2.inOut") {
		(this.fade.tl && this.fade.tl.kill(),
			(this.fade.tl = null),
			(this.fade.tl = gsap.to(this.fade, {
				power: 0,
				duration: element,
				ease: trigger,
			})));
	}
	
	onFadeIn(element = 1, trigger = "power2.inOut") {
		(this.fade.tl && this.fade.tl.kill(),
			(this.fade.tl = null),
			(this.fade.tl = gsap.to(this.fade, {
				power: 1,
				duration: element,
				ease: trigger,
			})));
	}
	
	onZoomIn(element = 1, trigger = "power2.inOut") {
		(this.zoom.tl && this.zoom.tl.kill(),
			(this.zoom.tl = null),
			(this.zoom.tl = gsap.to(this.zoom, {
				power: 1,
				duration: element,
				ease: trigger,
			})),
		this.isloading || ((this.isloading = !0), this.onLoadTexture()));
	}
	
	onZoomOut(element = 1, trigger = "power2.inOut") {
		(this.zoom.tl && this.zoom.tl.kill(),
			(this.zoom.tl = null),
			(this.zoom.tl = gsap.to(this.zoom, {
				power: 0,
				duration: element,
				ease: trigger,
			})));
	}
	
	onView(element) {
		((this.visible = element),
		this.visible &&
		!this.isloading &&
		((this.isloading = !0), this.onLoadTexture()),
			this.onPlayVideo());
	}
	
	onPlayVideo() {
		this.video.el &&
		(this.visible
			? this.video.el.paused && onPlayVideo(this.video.el)
			: this.video.el.paused || this.video.el.pause());
	}
	
	onPuaseVideo() {
		this.video.el && (this.video.el.paused || this.video.el.pause());
	}
	
	onTransFormTo(element, trigger) {
		let start = 1.8,
			end = trigger * 0.025,
			a = "power3.inOut";
		switch ((DETECT.reduced && ((start = 0), (end = 0)), element)) {
			case "linear":
				(this.linear.tl && this.linear.tl.kill(),
					(this.linear.tl = null),
				this.grid.tl && this.grid.tl.kill(),
					(this.grid.tl = null),
					(this.linear.tl = gsap.to(this.linear, {
						power: 1,
						duration: start,
						delay: end,
						ease: a,
					})),
					(this.grid.tl = gsap.to(this.grid, {
						power: 0,
						duration: start,
						delay: end,
						ease: a,
					})));
				break;
			case "grid":
				((this.visible = !0),
				this.linear.tl && this.linear.tl.kill(),
					(this.linear.tl = null),
				this.grid.tl && this.grid.tl.kill(),
					(this.grid.tl = null),
					(this.linear.tl = gsap.to(this.linear, {
						power: 0,
						duration: start,
						delay: end,
						ease: a,
					})),
					(this.grid.tl = gsap.to(this.grid, {
						power: 1,
						duration: start,
						delay: end,
						ease: a,
					})));
				break;
		}
	}
	
	setTransFormTo(element) {
		switch (element) {
			case "linear":
				((this.visible = !0),
				this.linear.tl && this.linear.tl.kill(),
					(this.linear.tl = null),
				this.grid.tl && this.grid.tl.kill(),
					(this.grid.tl = null),
					(this.linear.power = 1),
					(this.grid.power = 0));
				break;
			case "grid":
				((this.visible = !0),
				this.linear.tl && this.linear.tl.kill(),
					(this.linear.tl = null),
				this.grid.tl && this.grid.tl.kill(),
					(this.grid.tl = null),
					(this.linear.power = 0),
					(this.grid.power = 1));
				break;
		}
	}
	
	onLoadPreTexture(element = 0) {
		(clearTimeout(this.preload.timer),
			(this.preload.timer = setTimeout(() => {
				((this.preload.loader = new THREE.TextureLoader()),
					this.preload.loader.load(
						this.preload.src + "?archive=preload",
						(trigger) => {
							((this.preload.tex = trigger),
								(this.mesh.material.uniforms.tPreload.value = this.preload.tex),
								(this.image.tl = gsap.to(this.image, {
									fade: 1,
									duration: 0.3,
									ease: "power2.out",
								})));
						},
					));
			}, element)));
	}
	
	onLoadTexture(element = 0) {
		(clearTimeout(this.image.timer),
			(this.image.timer = setTimeout(() => {
				switch (this.media) {
					case "image":
						this.onLoadImage();
						break;
					case "video":
						this.onLoadVideo();
						break;
				}
			}, element)));
	}
	
	onLoadImage() {
		((this.image.loader = new THREE.TextureLoader()),
			this.image.loader.load(this.image.src + "?archive=image", (element) => {
				((this.image.tex = element),
					(this.mesh.material.uniforms.tDiffuse.value = this.image.tex),
					(this.preload.tl = gsap.to(this.preload, {
						power: 0,
						duration: 1,
						ease: "power2.out",
					})));
			}));
	}
	
	onLoadVideo() {
		((this.video.el = document.createElement("video")),
			(this.video.el.preload = "none"),
			(this.video.el.muted = !0),
			(this.video.el.loop = !0),
			this.video.el.setAttribute("crossorigin", "anonymous"),
			this.video.el.setAttribute("muted", ""),
			this.video.el.setAttribute("playsinline", "playsinline"),
			(this.video.el.src = this.video.src),
			(this.video.tex = new THREE.VideoTexture(this.video.el)),
			(this.video.func.pause = () => {
			}),
			(this.video.func.playing = () => {
				this.preload.power != 0 &&
				(this.preload.tl && this.preload.tl.kill(),
					(this.preload.tl = null),
					(this.preload.tl = gsap.to(this.preload, {
						power: 0,
						duration: 1,
						ease: "power2.out",
						onComplete: () => {
							this.mesh.material.uniforms.tPreload.value = null;
						},
					})));
			}),
			(this.video.func.canplay = () => {
			}),
			this.video.el.addEventListener("pause", this.video.func.pause),
			this.video.el.addEventListener("playing", this.video.func.playing),
			this.video.el.addEventListener("canplay", this.video.func.canplay),
			(this.preload.power = 1),
			(this.poster.loader = new THREE.TextureLoader()),
			this.poster.loader.load(this.poster.src, (element) => {
				((this.poster.tex = element),
					(this.mesh.material.uniforms.tPreload.value = this.poster.tex),
					(this.mesh.material.uniforms.tDiffuse.value = this.video.tex),
					this.onPlayVideo());
			}));
	}
	
	onInitMesh() {
		((this.geometry = new THREE.PlaneGeometry(
			1,
			1,
			this.segments.width,
			this.segments.height,
		)),
			(this.material = new THREE.ShaderMaterial({
				vertexShader: baseVertexShader,
				fragmentShader: SD,
				transparent: !0,
				uniforms: {
					resolution: {
						value: {
							x: 0,
							y: 0,
						},
					},
					i_resolution: {
						value: {
							x: this.aspect.width,
							y: this.aspect.height,
						},
					},
					borderRadius: {
						value: 0,
					},
					zoomPower: {
						value: 0,
					},
					zoomFar: {
						value: 0,
					},
					fade: {
						value: 0,
					},
					opacity: {
						value: 1,
					},
					preloadPower: {
						value: 0,
					},
					tPoster: {
						value: null,
					},
					tPreload: {
						value: null,
					},
					tDiffuse: {
						value: null,
					},
				},
			})),
			(this.mesh = new THREE.Mesh(this.geometry, this.material)),
			(this.mesh.position.z = 1),
			this.global.add(this.mesh));
	}
	
	onUpdateLinear(
		element = {
			width: 0,
			height: 0,
			top: 0,
			left: 0,
		},
	) {
		((this.linear.width = element.width),
			(this.linear.height = element.height),
			(this.linear.top = element.top),
			(this.linear.left = element.left));
	}
	
	onUpdateGrid(
		element = {
			width: 0,
			height: 0,
			top: 0,
			left: 0,
		},
	) {
		((this.grid.width = element.width),
			(this.grid.height = element.height),
			(this.grid.top = element.top),
			(this.grid.left = element.left));
	}
	
	onRender() {
		if (this.mesh) {
			if (((this.mesh.visible = this.visible), !this.mesh.visible)) return !1;
			((this.width =
				this.linear.power * this.linear.width +
				this.grid.power * this.grid.width),
				(this.height =
					this.linear.power * this.linear.height +
					this.grid.power * this.grid.height),
				(this.top =
					this.linear.power * clamp(this.linear.top, -WH * 1.2, WH * 1.2) +
					this.grid.power * clamp(this.grid.top, -WH * 1.2, WH * 1.2)),
				(this.left =
					this.linear.power * clamp(this.linear.left, -WW, WW) +
					this.grid.power * clamp(this.grid.left, -WW, WW)));
			const element = this.props.width / this.props.height,
				trigger = WW - WW * 0.175,
				start = WH - WW * 0.175;
			let end = 0,
				a = 0;
			if (
				(trigger / start > element
					? ((a = start), (end = start * element))
					: ((end = trigger), (a = trigger / element)),
				this.width != this.mesh.scale.x)
			) {
				let c = getPxThree(
						this.width * (1 - this.zoom.power) + end * this.zoom.power,
					),
					h = getPxThree(
						this.height * (1 - this.zoom.power) + a * this.zoom.power,
					);
				((this.mesh.scale.x = c),
					(this.mesh.scale.y = h),
					(this.mesh.material.uniforms.resolution.value.x = this.mesh.scale.x),
					(this.mesh.material.uniforms.resolution.value.y = this.mesh.scale.y));
			}
			((this.mesh.material.uniforms.fade.value =
				clamp(this.image.fade + this.poster.fade, 0, 1) * this.fade.power),
				(this.mesh.material.uniforms.preloadPower.value = this.preload.power));
			const o =
					-WEBGL.width / 2 + getPxThree(this.left) + getPxThree(this.width / 2),
				l =
					WEBGL.height / 2 - getPxThree(this.top) - getPxThree(this.height / 2);
			((this.mesh.position.x = o * (1 - this.zoom.power)),
				(this.mesh.position.y = l * (1 - this.zoom.power)),
				(this.mesh.position.z = this.zoom.power * 2));
		}
	}
	
	onDestroy() {
		(clearTimeout(this.timer),
			(this.timer = null),
			(this.visible = !1),
			(this.mesh.visible = this.visible));
	}
}

const WebglArchive = {
	enable: !1,
	ready: !1,
	obj: {},
	keys: [],
	anim: {
		zoom: {
			s: 1.5,
			element: "expo.out",
		},
	},
	layout: {
		linear: {
			power: 1,
		},
		grid: {
			power: 0,
		},
	},
	linear: {
		el: null,
		array: [],
	},
	grid: {
		el: null,
		array: [],
	},
	bg: null,
	once() {
		(($html.dataset.archiveLayout = "linear"),
		DETECT.reduced && (this.anim.zoom.s = 0));
		for (let i = 0; i < DB_ARCHIVE.length; i++) {
			const element = DB_ARCHIVE[i];
			this.obj[element.filename] = {
				...element,
			};
		}
		(Object.keys(this.obj).forEach((i) => {
			(this.obj[i], this.keys.push(i));
		}),
			(this.stage = new THREE.Group()));
		for (let i = 0; i < this.keys.length; i++) {
			const element = this.keys[i],
				trigger = this.obj[element],
				start = this.getSrc(trigger);
			((trigger.mesh = new ArchiveTriggerMesh({
				index: i,
				borderRadius: 0,
				width: trigger.width,
				height: trigger.height,
				media: trigger.media,
				preload: start.preloadSrc,
				poster: start.posterSrc,
				src: start.mediaSrc,
				scene: this.stage,
			})),
				trigger.mesh.onLoadPreTexture());
		}
		WEBGL_SCREEN.front.scene.add(this.stage);
	},
	onSplash(i, element, trigger) {
		PAGE_SCROLL_ARCHIVE.onSplash(i, element, trigger);
	},
	onToggle(i) {
		if (i.target) {
			const element = i.target.dataset.toggle;
			for (let trigger = 0; trigger < this.keys.length; trigger++) {
				const start = this.keys[trigger],
					end = this.obj[start];
				end.mesh && end.mesh.onTransFormTo(element, trigger);
			}
			switch (element) {
				case "linear":
					(($html.dataset.archiveLayout = "linear"),
						(this.layout.linear.power = 1),
						(this.layout.grid.power = 0));
					break;
				default:
					(($html.dataset.archiveLayout = "grid"),
						(this.layout.linear.power = 0),
						(this.layout.grid.power = 1));
					break;
			}
		}
	},
	getSrc(i) {
		const element = "/assets/archive/archive-assets/",
			trigger = "/assets/archive/video-assets/";
		let start = "",
			end = "",
			a = "",
			o = "",
			l = "",
			c = "",
			h = "",
			u = "";
		return (
			i.media === "video"
				? (element + i.filename + "" + i.imagetype,
					(a = element + i.filename + "@1x." + i.imagetype + ".webp"),
					(o = element + i.filename + "@mb." + i.imagetype + ".webp"),
					(u = element + i.filename + "@mb." + i.imagetype + ".webp"),
					i.src
						? ((l = trigger + i.src.d2x),
							(c = trigger + i.src.d1x),
							(h = trigger + i.src.mob))
						: ((l = trigger + i.filename + "-1280.mp4"),
							(c = trigger + i.filename + "-1280.mp4"),
							(h = trigger + i.filename + "-720.mp4")),
					(start = getSrc(a, a, o, a)),
					(end = getVideoSrc(c, l, h, c)))
				: (i.src
					? ((l = element + i.src.d2x + ".webp"),
						(c = element + i.src.d1x + ".webp"),
						(h = element + i.src.mob + ".webp"),
						(u = element + i.src.mob + ".webp"))
					: ((l = element + i.filename + "@2x." + i.imagetype + ".webp"),
						(c = element + i.filename + "@1x." + i.imagetype + ".webp"),
						(h = element + i.filename + "@mb." + i.imagetype + ".webp"),
						(u = element + i.filename + "@mb." + i.imagetype + ".webp")),
					(end = getSrc(c, l, h, c))),
				{
					preloadSrc: CDN_URL + u + "?v=" + VERSION,
					posterSrc: CDN_URL + start + "?v=" + VERSION,
					mediaSrc: CDN_URL + end + "?v=" + VERSION,
				}
		);
	},
	onInit(i) {
		if (
			((this.local = i || document.querySelector(".c-page")),
			PAGE_TRANSITION.current.name === "archive")
		) {
			((this.linear.el = this.local.querySelectorAll(".js-gl-a")),
				(this.linear.array = []),
				(this.grid.el = this.local.querySelectorAll(".js-gl-g")),
				(this.grid.array = []));
			for (let element = 0; element < this.linear.el.length; element++) {
				const trigger = this.linear.el[element];
				this.linear.array.push({
					el: trigger,
					filename: trigger.dataset.filename,
					shown: !1,
					visible: !1,
					listerner: null,
					observer: null,
					rect: trigger.getBoundingClientRect(),
				});
			}
			for (let element = 0; element < this.grid.el.length; element++) {
				const trigger = this.grid.el[element];
				this.grid.array.push({
					el: trigger,
					filename: trigger.dataset.filename,
					shown: !1,
					visible: !1,
					listerner: null,
					observer: null,
					rect: trigger.getBoundingClientRect(),
				});
			}
			(this.onResize(),
				this.onInitInview(),
				(this.enable = !0),
				(this.ready = !0));
		}
	},
	onInitInview() {
		(this.linear.array.forEach((i, element) => {
			((i.listerner = (trigger) => {
				trigger.forEach((start, end) => {
					var o, l;
					start.isIntersecting
						? (i.shown || (i.shown = !0),
							(i.visible = !0),
						(o = this.obj[i.filename]) != null &&
						o.mesh &&
						this.layout.linear.power > 0.5 &&
						this.obj[i.filename].mesh.onView(!0))
						: ((i.visible = !1),
						(l = this.obj[i.filename]) != null &&
						l.mesh &&
						this.layout.linear.power > 0.5 &&
						this.obj[i.filename].mesh.onPuaseVideo());
				});
			}),
				(i.observer = new IntersectionObserver(i.listerner, {
					threshold: 0,
				})),
				i.observer.observe(i.el));
		}),
			this.grid.array.forEach((i, element) => {
				((i.listerner = (trigger) => {
					trigger.forEach((start, end) => {
						start.isIntersecting
							? (i.shown || (i.shown = !0), (i.visible = !0))
							: (i.visible = !1);
					});
				}),
					(i.observer = new IntersectionObserver(i.listerner, {
						threshold: 0,
					})),
					i.observer.observe(i.el));
			}));
	},
	onZoomIn(i) {
		const element = i.target;
		if (element) {
			const trigger = element.dataset.filename;
			if (this.obj[trigger]) {
				$html.classList.add("is-zoomed");
				for (let start = 0; start < this.keys.length; start++) {
					const end = this.keys[start],
						a = this.obj[end];
					a.mesh && a.mesh.onFadeOut(this.anim.zoom.s, this.anim.zoom.element);
				}
				(this.obj[trigger].mesh.onFadeIn(
					this.anim.zoom.s,
					this.anim.zoom.element,
				),
					this.obj[trigger].mesh.onZoomIn(
						this.anim.zoom.s,
						this.anim.zoom.element,
					),
					PAGE_SCROLL_ARCHIVE.onZoomIn());
			}
		}
	},
	onZoomOut() {
		if ($html.classList.contains("is-zoomed")) {
			$html.classList.remove("is-zoomed");
			for (let i = 0; i < this.keys.length; i++) {
				const element = this.keys[i],
					trigger = this.obj[element];
				trigger.mesh &&
				(trigger.mesh.onFadeIn(this.anim.zoom.s, this.anim.zoom.element),
					trigger.mesh.onZoomOut(this.anim.zoom.s, this.anim.zoom.element));
			}
			PAGE_SCROLL_ARCHIVE.onZoomOut();
		}
	},
	onLoaded() {
	},
	onResize() {
	},
	onRender() {
		if (!this.enable) return !1;
		(this.linear.array.forEach((i, element) => {
			var end, a;
			i.rect = i.el.getBoundingClientRect();
			const trigger = (end = this.obj[i.filename]) == null ? void 0 : end.mesh;
			trigger &&
			trigger.onUpdateLinear({
				width: i.rect.width,
				height: i.rect.height,
				top: i.rect.top,
				left: i.rect.left,
			});
			const start =
				(a = this.obj[i.filename + "-clone"]) == null ? void 0 : a.mesh;
			start &&
			start.onUpdateLinear({
				width: i.rect.width,
				height: i.rect.height,
				top: window.innerHeight * 1.2,
				left: i.rect.left,
			});
		}),
			this.grid.array.forEach((i, element) => {
				var start;
				i.rect = i.el.getBoundingClientRect();
				const trigger =
					(start = this.obj[i.filename]) == null ? void 0 : start.mesh;
				trigger &&
				trigger.onUpdateGrid({
					width: i.rect.width,
					height: i.rect.height,
					top: i.rect.top,
					left: i.rect.left,
				});
			}));
		for (let i = 0; i < this.keys.length; i++) {
			const element = this.keys[i],
				trigger = this.obj[element];
			trigger.mesh &&
			((trigger.mesh.material.uniforms.opacity.value =
				PAGE_TRANSITION.page.archive.ptFadeArchive *
				SPLASH.params.spFadeInArchive.value),
				trigger.mesh.onRender());
		}
	},
	onDestroy() {
		this.onZoomOut();
		for (let i = 0; i < this.keys.length; i++) {
			const element = this.keys[i],
				trigger = this.obj[element];
			trigger.mesh &&
			(trigger.mesh.onDestroy(), trigger.mesh.setTransFormTo("linear"));
		}
		(($html.dataset.archiveLayout = "linear"),
			(this.layout.linear.power = 1),
			(this.layout.grid.power = 0),
			this.linear.array.forEach((i, element) => {
				i.observer &&
				(i.observer.disconnect(i.el),
					(i.observer = null),
					(i.listerner = null));
			}),
			(this.linear.array = []),
			this.grid.array.forEach((i, element) => {
				i.observer &&
				(i.observer.disconnect(i.el),
					(i.observer = null),
					(i.listerner = null));
			}),
			(this.grid.array = []),
			(this.enable = !1));
	},
};
var MD = `varying vec2 vUv;
uniform vec2 resolution;
uniform float time;

uniform vec3 cBlack;

uniform vec2 mouse;
uniform int mouseTrailsCount;
uniform vec2 mouseTrailsArray[MAX_TRAIL_SIZE];
uniform float mouseTrailsIntensity[MAX_TRAIL_SIZE];
uniform float mouseTrailsAge[MAX_TRAIL_SIZE];
uniform float mouseTrailsMaxAge;
uniform float mouseTrailsSize;
uniform float mouseTrailsAgeRatio;

uniform float edgePower;
uniform float noiseSpeed;
uniform float noiseDensity;
uniform float waveSpeed;
uniform vec2 waveDisp;
uniform float wavePower;

uniform float yuenyePower;
uniform float yuenyeEdge;
uniform float yuenyeRatio;

vec3 hash(vec3 p) {p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6))); return -1.0 + 2.0 * fract(sin(p) * 43758.5453); }
float cnoise(vec3 p) {vec3 i = floor(p); vec3 f = fract(p); vec3 u = f * f * (3.0 - 2.0 * f); float a = dot(hash(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)); float b = dot(hash(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)); float c = dot(hash(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)); float d = dot(hash(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)); float element = dot(hash(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)); float f_val = dot(hash(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)); float g = dot(hash(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)); float h = dot(hash(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)); float k0 = mix(a, b, u.x); float k1 = mix(c, d, u.x); float k2 = mix(element, f_val, u.x); float k3 = mix(g, h, u.x); float l0 = mix(k0, k1, u.y); float l1 = mix(k2, k3, u.y); return mix(l0, l1, u.z); }

vec3 random3(vec3 c) {float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0))); vec3 end; end.z = fract(512.0*j); j *= .125; end.x = fract(512.0*j); j *= .125; end.y = fract(512.0*j); return end-0.5; }
const float F3 =  0.3333333; const float G3 =  0.1666667;
float snoise(vec3 p) {vec3 s = floor(p + dot(p, vec3(F3))); vec3 x = p - s + dot(s, vec3(G3)); vec3 element = step(vec3(0.0), x - x.yzx); vec3 i1 = element*(1.0 - element.zxy); vec3 i2 = 1.0 - element.zxy*(1.0 - element); vec3 x1 = x - i1 + G3; vec3 x2 = x - i2 + 2.0*G3; vec3 x3 = x - 1.0 + 3.0*G3; vec4 w, d; w.x = dot(x, x); w.y = dot(x1, x1); w.z = dot(x2, x2); w.w = dot(x3, x3); w = max(0.6 - w, 0.0); d.x = dot(random3(s), x); d.y = dot(random3(s + i1), x1); d.z = dot(random3(s + i2), x2); d.w = dot(random3(s + 1.0), x3); w *= w; w *= w; d *= w; return dot(d, vec4(52.0)); }
float snoiseFractal(vec3 m) {return   0.5333333* snoise(m) +0.2666667* snoise(2.0*m) +0.1333333* snoise(4.0*m) +0.0666667* snoise(8.0*m); }

float calculateTotalTrailColor(vec2 uv) {
	float totalTrailColor = 0.0;
	for (int i = 0; i < mouseTrailsCount; i++) {
		if( mouseTrailsIntensity[i] != 0.0 ){
			vec2 trailPos = vec2(mouseTrailsArray[i].x, mouseTrailsArray[i].y * resolution.y / resolution.x);
			float distance = distance(uv, trailPos);
			float ageFactor = 1.0 - mouseTrailsAge[i] / mouseTrailsMaxAge;
			float adjustedSize = mouseTrailsSize * (1.0 + ageFactor * mouseTrailsAgeRatio) * 0.1;
			float trailIntensity = mouseTrailsIntensity[i] * (1.0 - mouseTrailsAge[i] / mouseTrailsMaxAge);
			float trailValue = 1.0 - smoothstep(0.0, adjustedSize, distance);
			float trailAdd = clamp( trailValue * trailIntensity, 0.0, 1.0 );
			totalTrailColor += trailAdd;
		}
	}
	return totalTrailColor;
}

void main() {

	
	vec2 vUvA = vec2( vUv.x, vUv.y * resolution.y / resolution.x );

	
	
	
	float trailColor = calculateTotalTrailColor(vUvA);
	float nPower = cnoise( vec3( vUvA * waveDisp * 3.0, 1.0 ) );

	
	vec3 p3 = vec3( vUvA.xy * noiseDensity, time * noiseSpeed * 0.1 );
	float fractalValue = snoiseFractal( p3 * 8.0 + 8.0 );
	fractalValue = 0.5 + 0.5 * fractalValue;
	fractalValue = clamp( pow( fractalValue + nPower, 1.0 ), 0.0, 1.0 );

	
	vec2 uvMouse = vec2(mouse.x, mouse.y * resolution.y / resolution.x);
	float uvMouseDistance = distance( vUvA, uvMouse );
	float l1 = ( mouseTrailsSize / uvMouseDistance ) * 0.1;
	float cEdge = clamp( pow( l1 * l1 * fractalValue + trailColor * fractalValue, edgePower ), 0.0, 1.0 );

	
	float l2 = pow( ( mouseTrailsSize / uvMouseDistance ) * 0.1, yuenyePower );
	float cHome = clamp( pow( l2 * fractalValue + trailColor * fractalValue, yuenyeEdge ), 0.0, 1.0 );
	cHome = cHome * l2 * yuenyeRatio;

	
	gl_FragColor = vec4( cEdge, cHome, 0, 1.0 );

}`;
const WEBGL_MOUSE = {
		visible: !0,
		ready: !1,
		once() {
			((this.scene = new THREE.Scene()),
				(this.fbo = new THREE.WebGLRenderTarget(WW, WH, {
					minFilter: THREE.LinearFilter,
					magFilter: THREE.LinearFilter,
					format: THREE.RGBFormat,
				})),
				this.onInit(),
				this.onInitMesh(),
				this.onInitGui(),
				this.onResize(),
				(WEBGL.final.material.uniforms.tMouse.value = this.fbo.texture),
				(WEBGL_HOME.bgYenye.mesh.material.uniforms.tMouse.value =
					this.fbo.texture));
		},
		params: {
			edgePower: 20,
			noiseSpeed: 0.5,
			noiseDensity: 5,
			waveSpeed: 0.5,
			waveDisp: {
				x: 5,
				y: 5,
			},
			wavePower: 0.1,
			mouse: {
				size: 0.9,
				age: 0.2,
			},
			trail: {
				power: 0.5,
			},
			yuenye: {
				power: 3,
				edge: 2,
				ratio: 0.6,
			},
		},
		onInit() {
		},
		onInitMesh() {
			let i = [],
				element = [],
				trigger = [];
			for (let start = 0; start < TRAILS.maxAge; start++)
				(i.push(new THREE.Vector2()), element.push(0), trigger.push(0));
			((this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1)),
				(this.material = new THREE.ShaderMaterial({
					vertexShader: baseVertexShader,
					fragmentShader: `const int MAX_TRAIL_SIZE = ${TRAILS.maxAge};
			${MD}`,
					transparent: !0,
					uniforms: {
						resolution: {
							value: {
								x: 0,
								y: 0,
							},
						},
						cBlack: {
							value: COLOR.table.black.three,
						},
						time: {
							value: 0,
						},
						edgePower: {
							value: this.params.edgePower,
						},
						noiseSpeed: {
							value: this.params.noiseSpeed,
						},
						noiseDensity: {
							value: this.params.noiseDensity,
						},
						waveSpeed: {
							value: this.params.waveSpeed,
						},
						waveDisp: {
							value: this.params.waveDisp,
						},
						wavePower: {
							value: this.params.wavePower,
						},
						yuenyePower: {
							value: this.params.yuenye.power,
						},
						yuenyeEdge: {
							value: this.params.yuenye.edge,
						},
						yuenyeRatio: {
							value: this.params.yuenye.ratio,
						},
						mouse: {
							value: {
								x: 0,
								y: 0,
							},
						},
						mouseTrailsCount: {
							value: TRAILS.maxAge,
						},
						mouseTrailsArray: {
							value: i,
						},
						mouseTrailsIntensity: {
							value: element,
						},
						mouseTrailsAge: {
							value: trigger,
						},
						mouseTrailsMaxAge: {
							value: TRAILS.maxAge,
						},
						mouseTrailsSize: {
							value: this.params.mouse.size,
						},
						mouseTrailsAgeRatio: {
							value: this.params.mouse.age,
						},
					},
				})),
				(this.mesh = new THREE.Mesh(this.geometry, this.material)),
				this.scene.add(this.mesh));
		},
		onInitGui() {
		},
		onRender() {
			var i;
			if (!this.mesh) return !1;
			if (
				((this.mesh.visible = this.visible),
					(this.material.uniforms.time.value += 0.01),
					(this.material.uniforms.yuenyePower.value = this.params.yuenye.power),
					(this.material.uniforms.yuenyeEdge.value = this.params.yuenye.edge),
					(this.material.uniforms.yuenyeRatio.value = this.params.yuenye.ratio),
				this.material.uniforms.mouseTrailsCount &&
				(i = MOUSE == null ? void 0 : MOUSE.body) != null &&
				i.array[2])
			) {
				const element = MOUSE.body.array[1].delta.x / window.innerWidth,
					trigger = 1 - MOUSE.body.array[1].delta.y / window.innerHeight;
				((this.material.uniforms.mouse.value.x =
					element * MOUSE.body.move.active +
					0.5 * (1 - MOUSE.body.move.active)),
					(this.material.uniforms.mouse.value.y =
						trigger * MOUSE.body.move.active +
						0.5 * (1 - MOUSE.body.move.active)),
					clamp(
						MOUSE.body.array[2].acceleration.delta.distance *
						this.params.trail.power +
						MOUSE.body.array[0].acceleration.delta.distance *
						(1 - this.params.trail.power),
						0,
						1,
					));
				let start =
					SPLASH.params.spFadeInMouse.value *
					MOUSE.body.move.active *
					this.params.mouse.size *
					PAGE_TRANSITION.page.info.ptScaleMouse +
					SPLASH.params.spFadeInMouse.value *
					MOUSE.body.move.active *
					this.params.mouse.size *
					PAGE_TRANSITION.page.works.ptScaleMouse +
					SPLASH.params.spFadeInMouse.value *
					MOUSE.body.move.active *
					this.params.mouse.size *
					PAGE_TRANSITION.page.home.ptScaleMouse;
				((this.material.uniforms.mouseTrailsSize.value = clamp(start, 0, 1)),
					(this.material.uniforms.mouseTrailsAgeRatio.value =
						this.params.mouse.age),
					(this.material.uniforms.mouseTrailsCount.value = Math.min(
						TRAILS.body.trails.length,
						TRAILS.maxAge,
					)));
				for (let end = 0; end < TRAILS.body.trails.length; end++) {
					const a = TRAILS.body.trails[end];
					this.material.uniforms.mouseTrailsArray.value[end] &&
					((this.material.uniforms.mouseTrailsArray.value[end].x = a.x),
						(this.material.uniforms.mouseTrailsArray.value[end].y = a.y),
						(this.material.uniforms.mouseTrailsIntensity.value[end] =
							a.intensity),
						(this.material.uniforms.mouseTrailsAge.value[end] = a.age));
				}
			}
			(WEBGL.renderer.setRenderTarget(this.fbo),
				WEBGL.renderer.render(this.scene, WEBGL.o_camera));
		},
		onResize() {
			const i = clamp(RES, 1, 1.75);
			(this.fbo && this.fbo.setSize(WW * i, WH * i),
			this.mesh &&
			((this.mesh.scale.x = WEBGL.width),
				(this.mesh.scale.y = WEBGL.height),
				(this.mesh.position.x = 0),
				(this.mesh.position.y = 0),
				(this.mesh.position.z = 0),
				(this.mesh.material.uniforms.resolution.value.x = this.mesh.scale.x),
				(this.mesh.material.uniforms.resolution.value.y =
					this.mesh.scale.y)));
		},
	},
	Webgl404 = {
		visible: !0,
		ready: !1,
		once() {
			this.fvMainTitle = new FVMainTitle({
				scene: WEBGL_SCREEN.front.scene,
			});
			let i = 0.4,
				element = 0.8,
				trigger = 0.9;
			(IS_MOBILE_MODE && ((i = 0.6), (element = 0.9), (trigger = 1)),
				(this.fvGradient = new BGGradientFront({
					scene: WEBGL_SCREEN.front.scene,
					borderRadius: 15,
					move: {
						x: 0.1,
						y: 0.2,
					},
					pivot: {
						x: 0.5,
						y: 0.6,
					},
					radius: {
						x: 1,
						y: 1.5,
					},
					noisePower: 0.2,
					noiseSpeed: 0.5,
					noiseDensity: 1.5,
					gradient1st: {
						power: i,
						hex: "#efefef",
						three: new THREE.Color("#efefef"),
					},
					gradient2nd: {
						power: element,
						hex: "#c8dee8",
						three: new THREE.Color("#c8dee8"),
					},
					gradient3rd: {
						power: trigger,
						hex: "#ffeddd",
						three: new THREE.Color("#ffeddd"),
					},
					mouse: {
						enable: !1,
						size: 0.9,
						age: 0.2,
					},
				})),
				this.onInitGui(),
				(this.ready = !0),
				this.onInit());
		},
		onInit() {
		},
		onInitGui() {
		},
		onRender() {
			if (!this.ready) return !1;
			if (WEBGL_DOM.array.length)
				for (let element = 0; element < WEBGL_DOM.array.length; element++) {
					const trigger = WEBGL_DOM.array[element];
					if (trigger.slug === "500" || trigger.slug === "404")
						switch (trigger.name) {
							case "title":
								this.fvMainTitle.visible = trigger.visible;
								break;
							case "bg":
								this.fvGradient.visible = trigger.visible;
								break;
						}
					else
						((this.fvMainTitle.visible = !1), (this.fvGradient.visible = !1));
				}
			else ((this.fvMainTitle.visible = !1), (this.fvGradient.visible = !1));
			((this.fvMainTitle.mesh.material.uniforms.inkbleed.value =
				SPLASH.params.spFadeInInkBleed.value *
				clamp(
					(PAGE_TRANSITION.page["error-500"].ptFade +
						PAGE_TRANSITION.page["error-404"].ptFade) *
					0.1 +
					(PAGE_TRANSITION.page["error-500"].ptFade +
						PAGE_TRANSITION.page["error-404"].ptFade) *
					(PAGE_TRANSITION.page["error-500"].ptInkBleedForPage +
						PAGE_TRANSITION.page["error-404"].ptInkBleedForPage),
					0,
					1,
				)),
				(this.fvMainTitle.mesh.material.uniforms.opacity.value =
					SPLASH.params.spFadeIn.value),
				(this.fvGradient.mesh.material.uniforms.opacity.value =
					(PAGE_TRANSITION.page["error-404"].ptFade +
						PAGE_TRANSITION.page["error-500"].ptFade) *
					SPLASH.params.spFadeInArchive.value));
			const i = 0.6;
			((this.fvGradient.mesh.material.uniforms.gradient1st.value =
				this.fvGradient.props.gradient1st.power * i +
				this.fvGradient.props.gradient1st.power *
				(1 - i) *
				(PAGE_TRANSITION.page["error-500"].ptBgGradient +
					PAGE_TRANSITION.page["error-404"].ptBgGradient) *
				SPLASH.params.spFadeInArchive.value),
				(this.fvGradient.mesh.material.uniforms.gradient2nd.value =
					this.fvGradient.props.gradient2nd.power * i +
					this.fvGradient.props.gradient2nd.power *
					(1 - i) *
					(PAGE_TRANSITION.page["error-500"].ptBgGradient +
						PAGE_TRANSITION.page["error-404"].ptBgGradient) *
					SPLASH.params.spFadeInArchive.value),
				(this.fvGradient.mesh.material.uniforms.gradient3rd.value =
					this.fvGradient.props.gradient3rd.power * i +
					this.fvGradient.props.gradient3rd.power *
					(1 - i) *
					(PAGE_TRANSITION.page["error-500"].ptBgGradient +
						PAGE_TRANSITION.page["error-404"].ptBgGradient) *
					SPLASH.params.spFadeInArchive.value),
				this.fvMainTitle.onRender(),
				this.fvGradient.onRender());
		},
		onLoaded() {
			this.fvMainTitle.onUpdateTexture(
				LOADER.images.error404Normal.tex,
				LOADER.images.error404Shadow.tex,
			);
		},
		onResize(i) {
			if (!this.ready || !i) return !1;
			switch (i.name) {
				case "title":
					this.fvMainTitle.onResize({
						width: i.rect.width,
						height: i.rect.height,
						top: i.rect.top,
						left: i.rect.left,
					});
					break;
				case "bg":
					this.fvGradient.onResize({
						width: i.rect.width,
						height: i.rect.height,
						top: i.rect.top,
						left: i.rect.left,
					});
					break;
			}
		},
	},
	LOADER = {
		ease: 0.1,
		delta1: 0,
		delta2: 0,
		progress: 0,
		isloading: !0,
		isloaded: !1,
		images: {
			aboutMarquee: {
				el: null,
				media: "image",
				tex: null,
				src: {
					d2x: "/assets/img/about-mq@2x.png",
					d1x: "/assets/img/about-mq@1x.png",
					mob: "/assets/img/about-mq@1x.png",
				},
			},
			aboutFvSubtitle: {
				el: null,
				media: "image",
				tex: null,
				src: {
					d2x: "/assets/img/items-assets/about-fv-subtitle@2x.png.webp",
					d1x: "/assets/img/items-assets/about-fv-subtitle@1x.png.webp",
					mob: "/assets/img/items-assets/about-fv-subtitle@1x.png.webp",
				},
			},
			aboutLogoNormal: {
				el: null,
				media: "image",
				tex: null,
				src: {
					d2x: "/assets/img/parts-2048-assets/logo-about@2x.png.webp",
					d1x: "/assets/img/parts-2048-assets/logo-about@1x.png.webp",
					mob: "/assets/img/parts-2048-assets/logo-about@1x.png.webp",
				},
			},
			aboutLogoShadow: {
				el: null,
				media: "image",
				tex: null,
				src: {
					d2x: "/assets/img/parts-2048-assets/shadow/logo-about@2x.jpg.webp",
					d1x: "/assets/img/parts-2048-assets/shadow/logo-about@1x.jpg.webp",
					mob: "/assets/img/parts-2048-assets/shadow/logo-about@1x.jpg.webp",
				},
			},
			homeLogoNormal: {
				el: null,
				media: "image",
				tex: null,
				src: {
					d2x: "/assets/img/parts-2048-assets/logo-home@2x.png.webp",
					d1x: "/assets/img/parts-2048-assets/logo-home@1x.png.webp",
					mob: "/assets/img/parts-2048-assets/logo-home@2x.png.webp",
				},
			},
			homeLogoShadow: {
				el: null,
				media: "image",
				tex: null,
				src: {
					d2x: "/assets/img/parts-2048-assets/shadow/logo-home@2x.jpg.webp",
					d1x: "/assets/img/parts-2048-assets/shadow/logo-home@1x.jpg.webp",
					mob: "/assets/img/parts-2048-assets/shadow/logo-home@2x.jpg.webp",
				},
			},
			homeBg: {
				el: null,
				media: "image",
				tex: null,
				src: {
					d2x: "/assets/img/yenye-assets/yenye-3@2x.png.webp",
					d1x: "/assets/img/yenye-assets/yenye-3@1x.png.webp",
					mob: "/assets/img/yenye-assets/yenye@mb.png",
				},
			},
			error404Normal: {
				el: null,
				media: "image",
				tex: null,
				src: {
					d2x: "/assets/img/parts-2048-assets/logo-404@2x.png.webp",
					d1x: "/assets/img/parts-2048-assets/logo-404@1x.png.webp",
					mob: "/assets/img/parts-2048-assets/logo-404@1x.png.webp",
				},
			},
			error404Shadow: {
				el: null,
				media: "image",
				tex: null,
				src: {
					d2x: "/assets/img/parts-2048-assets/shadow/logo-404@2x.jpg.webp",
					d1x: "/assets/img/parts-2048-assets/shadow/logo-404@1x.jpg.webp",
					mob: "/assets/img/parts-2048-assets/shadow/logo-404@1x.jpg.webp",
				},
			},
		},
		itemsLoaded: 0,
		itemsTotal: 0,
		once() {
			((this.manager = new THREE.LoadingManager()),
				this.onLoadWorkTexture(),
				this.onLoadTextures(),
				(this.manager.onLoad = () => {
					(this.onLoaded(), WEBGL_WORKS.onLoaded(), WEBGL_404.onLoaded());
				}),
				(this.manager.onProgress = (i, element, trigger) => {
					((this.itemsLoaded = element),
						(this.itemsTotal = trigger),
						(this.delta1 = (this.itemsLoaded / this.itemsTotal) * 100));
				}),
				(this.manager.onError = (i) => {
				}));
		},
		onUpdate() {
			((this.delta2 += (this.delta1 - this.delta2) * this.ease),
			0.001 >= Math.abs(this.delta2) && (this.delta2 = 0),
				this.progress >= 99 && !this.isloaded
					? ((this.isloaded = !0), (this.isloading = !1), this.onLoadAfter())
					: this.isloading && (this.progress = clamp(this.delta2, 0, 99)));
		},
		onLoaded() {
			onLoaded();
		},
		onLoadAfter() {
			($html.classList.add("is-l-c"),
				(this.progress = 100),
			SPLASH.isSkip || SPLASH.onInit());
		},
		onLoadWorkTextureBefore() {
			this.works = {};
			for (let i = 0; i < DB_WORKS.length; i++) {
				const element = DB_WORKS[i];
				this.works[element.slug] = {
					titleNormal: {
						slug: element.slug,
						el: null,
						media: "image",
						tex: null,
						src: {
							d2x: element.title.src.normal.d2x,
							d1x: element.title.src.normal.d1x,
							mob: element.title.src.normal.mob,
						},
					},
					titleShadow: {
						slug: element.slug,
						el: null,
						media: "image",
						tex: null,
						src: {
							d2x: element.title.src.shadow.d2x,
							d1x: element.title.src.shadow.d1x,
							mob: element.title.src.shadow.mob,
						},
					},
					thumbLeft: {
						slug: element.slug,
						el: null,
						media: element.thumbnail.left.media,
						tex: null,
						src: {
							d2x: element.thumbnail.left.src.d2x,
							d1x: element.thumbnail.left.src.d1x,
							mob: element.thumbnail.left.src.mob,
						},
					},
					thumbRight: {
						slug: element.slug,
						el: null,
						media: element.thumbnail.right.media,
						tex: null,
						src: {
							d2x: element.thumbnail.right.src.d2x,
							d1x: element.thumbnail.right.src.d1x,
							mob: element.thumbnail.right.src.mob,
						},
					},
				};
			}
		},
		onLoadWorkTexture() {
			(this.onLoadWorkTextureBefore(),
				this.works,
				Object.keys(this.works).forEach((i) => {
					const element = this.works[i];
					Object.keys(element).forEach((trigger) => {
						const start = element[trigger];
						if (start.media === "image") {
							let end = getSrc(
								start.src.d1x,
								start.src.d2x,
								start.src.d1x,
								start.src.d2x,
							);
							new THREE.TextureLoader(LOADER.manager).load(
								CDN_URL + end + ".webp?v=" + VERSION,
								(o) => {
									start.tex = o;
								},
								void 0,
								(o) => {
								},
							);
						} else {
							const end = getVideoSrc(
								start.src.d1x,
								start.src.d2x,
								start.src.d1x,
								start.src.d2x,
							);
							((start.el = document.createElement("video")),
								(start.el.preload = "metadata"),
								(start.el.muted = !0),
								(start.el.loop = !0),
								start.el.setAttribute("crossorigin", "anonymous"),
								start.el.setAttribute("muted", ""),
								start.el.setAttribute("playsinline", "playsinline"),
								(start.el.src = CDN_URL + end + "?v=" + VERSION),
								(start.tex = new THREE.VideoTexture(start.el)));
						}
					});
				}));
		},
		onLoadTextures() {
			Object.keys(this.images).forEach((i) => {
				const element = this.images[i],
					trigger = getSrc(
						element.src.d1x,
						element.src.d2x,
						element.src.mob,
						element.src.d2x,
					);
				new THREE.TextureLoader(LOADER.manager).load(
					CDN_URL + trigger + "?v=" + VERSION,
					(end) => {
						element.tex = end;
					},
					void 0,
					(end) => {
					},
				);
			});
		},
	},
	SPLASH = {
		isSkip: !1,
		isSplashed: !1,
		animKeys: [],
		ratio: 1,
		params: {
			spFadeOutPreload: {
				value: 0,
				s: 1.2,
				d: 0.4,
				element: "power2.inOut",
				label: "FADE_OUT_PRELOAD",
			},
			spFadeIn: {
				value: 0,
				s: 1.2,
				d: 0.4,
				element: "power2.inOut",
				label: "FADE_IN",
			},
			spFadeInArchive: {
				value: 0,
				s: 1.4,
				d: 0.4,
				element: "power2.inOut",
				label: "FADE_IN_ARCHIVE",
			},
			spFadeInInkBleed: {
				value: 0,
				s: 6,
				d: 0.4,
				element: "power1.inOut",
				label: "FADE_IN_INKBLEED",
			},
			spFadeInGradient: {
				value: 0,
				s: 5,
				d: 0.4,
				element: "power4.out",
				label: "FADE_IN_GRADIENT",
			},
			spFadeInMouse: {
				value: 0,
				s: 5,
				d: 0.4,
				element: "power4.out",
				label: "FADE_IN_MOUSE",
			},
			spHomeBgNoiseAnim: {
				value: 0,
				s: 20,
				d: 0.4,
				element: "power4.out",
				label: "HOME_BG_NOISE_ANIM",
			},
		},
		once() {
			(getParam("splash") && (this.isSkip = getParam("splash") === "true"),
				Object.keys(this.params).forEach((i) => {
					this.animKeys.push(i);
				}),
			this.isSkip &&
			((this.isSplashed = !0),
				Object.keys(this.params).forEach((i) => {
					const element = this.params[i];
					element.value = 1;
				}),
				$html.classList.add("is-l-skip", "is-l-s-a"),
				$html.classList.remove("is-l-s")));
		},
		onInitGui() {
		},
		onReStart() {
			((this.isSplashed = !1),
				(this.params.spFadeIn.value = 0),
				(this.params.spFadeInArchive.value = 0),
				(this.params.spFadeInInkBleed.value = 0),
				(this.params.spFadeInGradient.value = 0),
				gsap.set(".c-preload-body", {
					opacity: 1,
				}),
				gsap.set("#app", {
					opacity: 0,
				}),
				(LOADER.progress = 0),
				gsap.to(LOADER, {
					progress: 100,
					duration: 1,
					onComplete: () => {
						this.onSplash();
					},
				}));
		},
		onSplash() {
			(gsap.to(".c-preload-body", {
				duration: this.params.spFadeOutPreload.s * this.ratio,
				delay: this.params.spFadeOutPreload.d,
				ease: this.params.spFadeOutPreload.element,
				opacity: 0,
			}),
				setTimeout(() => {
					this.onSplashAfter();
				}, this.params.spFadeOutPreload.s * 500),
				(this.isSplashed = !0));
		},
		onSplashAfter() {
			(gsap.to("#app", {
				duration: this.params.spFadeIn.s * this.ratio,
				delay: this.params.spFadeIn.d,
				ease: this.params.spFadeIn.element,
				opacity: 1,
				onComplete() {
					$html.classList.add("is-l-s-a");
				},
			}),
				gsap.to(this.params.spFadeIn, {
					duration: this.params.spFadeIn.s * this.ratio,
					delay: this.params.spFadeIn.d,
					ease: this.params.spFadeIn.element,
					value: 1,
				}),
				gsap.to(this.params.spFadeInArchive, {
					duration: this.params.spFadeInArchive.s * this.ratio,
					delay: this.params.spFadeInArchive.d,
					ease: this.params.spFadeInArchive.element,
					value: 1,
				}),
				gsap.to(this.params.spFadeInInkBleed, {
					duration: this.params.spFadeInInkBleed.s * this.ratio,
					delay: this.params.spFadeInInkBleed.d,
					ease: this.params.spFadeInInkBleed.element,
					value: 1,
				}),
				gsap.to(this.params.spFadeInGradient, {
					duration: this.params.spFadeInGradient.s * this.ratio,
					delay: this.params.spFadeInGradient.d,
					ease: this.params.spFadeInGradient.element,
					value: 1,
				}),
				gsap.to(this.params.spFadeInMouse, {
					duration: this.params.spFadeInMouse.s * this.ratio,
					delay: this.params.spFadeInMouse.d,
					ease: this.params.spFadeInMouse.element,
					value: 1,
				}),
				gsap.to(this.params.spHomeBgNoiseAnim, {
					duration: this.params.spHomeBgNoiseAnim.s * this.ratio,
					delay: this.params.spHomeBgNoiseAnim.d,
					ease: this.params.spHomeBgNoiseAnim.element,
					value: 1,
				}),
				styleTextShuffle.onInit(),
				styleTextShuffle.once(),
				styleInview.onInit(),
				styleContain.onInit(),
				styleImage.onInit(),
				WEBGL_ARCHIVE.onSplash(
					this.params.spFadeInArchive.s,
					this.params.spFadeInArchive.d,
					this.params.spFadeInArchive.element,
				),
				$html.classList.remove("is-l-s"));
		},
		onInit() {
			(this.isSkip || this.onInitGui(), this.onSplash());
		},
	},
	MENU = {
		isopened: !1,
		once() {
		},
		onOpen() {
			((this.isopened = !0), $html.classList.add("is-menu-opened"));
		},
		onClose() {
			((this.isopened = !1), $html.classList.remove("is-menu-opened"));
		},
		onToggle() {
			this.isopened ? this.onClose() : this.onOpen();
		},
	};

/*!
 * Usagi Shuffle Text 1.0.2
 * @license Copyright, Kenta Toshikura
 * Last update : 2023/11/25
 */
class UsagiSHuffleText {
	constructor(element = {}) {
		((this.el = element.el),
		this.el &&
		((this.characters =
			element.characters ||
			"AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz~!@#$%^&*()-+=[]{}|;:,./<>?"),
			(this.duration = element.duration || 500),
			(this.speed = element.speed || 50),
			(this.delay = element.delay || 50),
			(this.order = element.order || "random"),
			(this.interval = null),
			(this.timer = null),
			this.onRunRabbit()));
	}
	
	getRandomChar() {
		const element = Math.floor(Math.random() * this.characters.length);
		return this.characters[element];
	}
	
	onRunRabbit() {
		((this.originalText = this.el.textContent),
			(this.randomText = this.el.textContent),
			(this.array = []));
		for (
			let element = 0;
			element < this.originalText.split("").length;
			element++
		) {
			const trigger = this.originalText.split("")[element];
			let start = !1;
			((trigger === " " || trigger === "　") && (start = !0),
				this.array.push({
					isSpace: start,
					index: element,
					origin: trigger,
					random: start ? trigger : this.getRandomChar(),
					timer: null,
					interval: null,
					delay: 0,
				}));
		}
		this.onOrder();
	}
	
	onOrder() {
		switch (this.order) {
			case "random":
				for (let element = 0; element < this.array.length; element++) {
					const trigger = this.array[element];
					let start = Math.random(),
						end = this.delay * start * (this.speed / 10);
					(start < 0.5 && (end = end * Math.random() * 0.1),
						(end += (element + 1) * this.delay * 0.1),
						(trigger.delay = end),
						(this.wait += end));
				}
				break;
			default:
				for (let element = 0; element < this.array.length; element++) {
					const trigger = this.array[element],
						start = (element + 1) * this.delay;
					((trigger.delay = start), (this.wait += start));
				}
				break;
		}
	}
	
	onShuffle(element = this.speed) {
		((this.wait = this.duration),
			this.onOrder(),
			this.array.forEach((trigger, start) => {
				(clearInterval(trigger.interval),
					(trigger.interval = setInterval(() => {
						trigger.isSpace || (trigger.random = this.getRandomChar());
					}, element)),
					clearTimeout(trigger.timer),
					(trigger.timer = setTimeout(() => {
						(clearInterval(trigger.interval),
							(trigger.random = trigger.origin));
					}, trigger.delay + this.duration)));
			}),
			clearInterval(this.interval),
			(this.interval = setInterval(() => {
				this.randomText = "";
				for (let trigger = 0; trigger < this.array.length; trigger++) {
					const start = this.array[trigger];
					this.randomText += start.random;
				}
				this.el.textContent = this.randomText;
			}, element)),
			clearTimeout(this.timer),
			(this.timer = setTimeout(() => {
				clearInterval(this.interval);
			}, this.wait)));
	}
	
	onDestroy() {
		(this.array.forEach((element, trigger) => {
			(clearInterval(element.interval), clearTimeout(element.timer));
		}),
			clearInterval(this.interval),
			clearTimeout(this.timer),
			(this.array = []));
	}
	
	stop() {
		(this.array.forEach((element, trigger) => {
			(clearInterval(element.interval), clearTimeout(element.timer));
		}),
			clearInterval(this.interval),
			clearTimeout(this.timer));
	}
}

const styleTextShuffle = {
		local: null,
		array: [],
		onInit(i) {
			if (((this.local = i || document), DETECT.reduced)) return !1;
			this.onInitHover();
			const element = this.local.querySelectorAll(".js-shuffle"),
				trigger = this.local.querySelectorAll(".js-shuffle-child > *"),
				start = [...element, ...trigger];
			for (let end = 0; end < start.length; end++) {
				const a = start[end];
				if (
					a.classList.contains("js-disable-for-portrait") &&
					ORIENTATION === "portrait"
				)
					return !1;
				const o = a.dataset.delay ? Number(a.dataset.delay) : 10,
					l = a.dataset.inview !== "false",
					c = a.dataset.duration ? Number(a.dataset.duration) : 400,
					h = a.dataset.order ? a.dataset.order : "random",
					u = a.dataset.wait ? Number(a.dataset.wait) * 400 : 0,
					d = new UsagiSHuffleText({
						el: a,
						duration: c,
						delay: o,
						order: h,
						characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
					});
				this.array.push({
					el: a,
					body: d,
					wait: u,
					delay: o,
					inview: l,
					duration: c,
					timer: null,
					observer: null,
					listerner: null,
				});
			}
			(this.array.forEach((end, a) => {
				end.inview
					? ((end.listerner = (o) => {
						o.forEach((l, c) => {
							const h = l.target;
							l.isIntersecting
								? ((h.dataset.visible = 1),
									clearTimeout(end.timer),
									(end.timer = setTimeout(() => {
										(end.el.classList.add("is-start-shuffle"),
										end.el.classList.contains("is-skip") ||
										end.body.onShuffle());
									}, end.wait)))
								: (h.dataset.visible = 0);
						});
					}),
						(end.observer = new IntersectionObserver(end.listerner, {
							threshold: 0,
						})),
						end.observer.observe(end.el))
					: (clearTimeout(end.timer),
						(end.timer = setTimeout(() => {
							(end.el.classList.add("is-start-shuffle"), end.body.onShuffle());
						}, end.wait)));
			}),
				setTimeout(() => {
					this.array.forEach((end, a) => {
						end.el.classList.remove("is-skip");
					});
				}, 1e3));
		},
		onDestroy() {
			(this.array.forEach((i, element) => {
				(i.body && i.body.onDestroy(),
					(i.body = null),
				i.timer && clearTimeout(i.timer),
					(i.timer = null),
				i.observer &&
				(i.observer.disconnect(i.el),
					(i.observer = null),
					(i.listerner = null)));
			}),
				(this.array = []),
				this.onDestroyHover());
		},
		hover_once: [],
		once() {
			if (DETECT.reduced) return !1;
			const i = this.local.querySelectorAll(".js-hover-shuffle-once");
			for (let element = 0; element < i.length; element++) {
				const trigger = i[element],
					start = trigger.dataset.wait ? Number(trigger.dataset.wait) : 0,
					end = trigger.dataset.delay ? Number(trigger.dataset.delay) : 50,
					a = trigger.dataset.duration ? Number(trigger.dataset.duration) : 400,
					o = [],
					l = trigger.querySelectorAll(".trigger");
				for (let c = 0; c < l.length; c++) {
					const h = l[c],
						u = new UsagiSHuffleText({
							el: h,
							duration: a,
							delay: end,
							order: "left",
							characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
						});
					o.push({
						el: h,
						body: u,
					});
				}
				this.hover_once.push({
					timer: null,
					el: trigger,
					target: o,
					wait: start,
					delay: end,
					duration: a,
					mouseenter: {
						func: null,
					},
					mouseleave: {
						func: null,
					},
				});
			}
			this.hover_once.forEach((element, trigger) => {
				((element.mouseenter.func = () => {
					(clearTimeout(element.timer),
						(element.timer = setTimeout(() => {
							element.target.forEach((start) => {
								start.body.onShuffle();
							});
						}, element.wait)));
				}),
					(element.mouseleave.func = () => {
					}),
					element.el.addEventListener("mouseenter", element.mouseenter.func),
					element.el.addEventListener("mouseleave", element.mouseleave.func));
			});
		},
		hover_local: [],
		onInitHover() {
			const i = this.local.querySelectorAll(".js-hover-shuffle");
			for (let element = 0; element < i.length; element++) {
				const trigger = i[element],
					start = trigger.dataset.wait ? Number(trigger.dataset.wait) : 0,
					end = trigger.dataset.delay ? Number(trigger.dataset.delay) : 50,
					a = trigger.dataset.duration ? Number(trigger.dataset.duration) : 400,
					o = [],
					l = trigger.querySelectorAll(".trigger");
				for (let c = 0; c < l.length; c++) {
					const h = l[c],
						u = new UsagiSHuffleText({
							el: h,
							duration: a,
							delay: end,
							order: "left",
							characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
						});
					o.push({
						el: h,
						body: u,
					});
				}
				this.hover_local.push({
					timer: null,
					el: trigger,
					target: o,
					wait: start,
					delay: end,
					duration: a,
					mouseenter: {
						func: null,
					},
					mouseleave: {
						func: null,
					},
				});
			}
			this.hover_local.forEach((element, trigger) => {
				((element.mouseenter.func = () => {
					(clearTimeout(element.timer),
						(element.timer = setTimeout(() => {
							element.target.forEach((start) => {
								start.body.onShuffle();
							});
						}, element.wait)));
				}),
					(element.mouseleave.func = () => {
					}),
					element.el.addEventListener("mouseenter", element.mouseenter.func),
					element.el.addEventListener("mouseleave", element.mouseleave.func));
			});
		},
		onDestroyHover() {
			(this.hover_local.forEach((i, element) => {
				(i.target.forEach((trigger) => {
					(trigger.body && trigger.body.onDestroy(), (trigger.body = null));
				}),
					(i.target = null),
					i.el.removeEventListener("mouseenter", i.mouseenter.func),
					i.el.removeEventListener("mouseleave", i.mouseleave.func),
					(i.mouseenter.func = null),
					(i.mouseleave.func = null));
			}),
				(this.hover_local = []));
		},
	},
	styleInview = {
		local: null,
		targets: [],
		observer: null,
		onInit(i) {
			((this.local = i || document.querySelector(".c-local")),
				(this.inview = document.querySelectorAll(".js-iv")),
				(this.targets = [...this.inview]),
			this.targets.length &&
			((this.options = {
				threshold: 0,
			}),
				(this.observer = new IntersectionObserver(
					this.listerner,
					this.options,
				)),
				this.targets.forEach((element, trigger) => {
					this.observer.observe(element);
				})));
		},
		listerner(i) {
			i.forEach((element, trigger) => {
				const start = element.target;
				element.isIntersecting
					? ((start.dataset.shown = 1), (start.dataset.visible = 1))
					: (start.dataset.visible = 0);
			});
		},
		onDestroy() {
			const i = this;
			this.observer &&
			(this.targets.forEach((element, trigger) => {
				i.observer.disconnect(element);
			}),
				(this.targets = []),
				(this.observer = null));
		},
	},
	styleContain = {
		targets: [],
		local: null,
		onInit(i) {
			((this.local = i || document.querySelector(".c-local")),
				(this.contain = this.local.querySelectorAll(".js-contain")));
			for (let element = 0; element < this.contain.length; element++) {
				const trigger = this.contain[element],
					start = trigger.dataset.width ? Number(trigger.dataset.width) : 1,
					end = trigger.dataset.height ? Number(trigger.dataset.height) : 1;
				this.targets.push({
					child: this.contain[element].children[0],
					el: trigger,
					aspectRatio: start / end,
				});
			}
			this.onResize();
		},
		onResize() {
			this.targets.forEach((i, element) => {
				if (i.child) {
					const trigger = i.el.clientWidth,
						start = i.el.clientHeight;
					let end = trigger,
						a = end / i.aspectRatio;
					(a > start && ((a = start), (end = a * i.aspectRatio)),
						(i.child.style.width = `${end}px`),
						(i.child.style.height = `${a}px`));
				}
			});
		},
		onDestroy() {
			this.targets = [];
		},
	},
	styleImage = {
		local: null,
		array: [],
		once() {
		},
		onInit(i) {
			if (!DETECT.device.any) return !1;
			this.local = i || document.querySelector(".c-local");
			const element = this.local.querySelectorAll(".js-img");
			for (let trigger = 0; trigger < element.length; trigger++) {
				const start = element[trigger],
					end = start.dataset.glMedia;
				let a = getSrc(
						start.dataset.posterD1x,
						start.dataset.posterD2x,
						start.dataset.posterMob,
						start.dataset.posterD1x,
					),
					o = getVideoSrc(
						start.dataset.srcD1x,
						start.dataset.srcD2x,
						start.dataset.srcMob,
						start.dataset.srcD1x,
					),
					l = getSrc(
						start.dataset.srcD1x,
						start.dataset.srcD2x,
						start.dataset.srcMob,
						start.dataset.srcD1x,
					),
					c = start.dataset.srcPre
						? start.dataset.srcPre
						: start.dataset.posterPre;
				this.array.push({
					el: start,
					media: end,
					pivot: start.querySelector(".js-img-pivot"),
					preload: {
						el: null,
						pivot: start.querySelector(".js-img-preload"),
						src: CDN_URL + c + ".webp?v=" + VERSION,
						onload: !1,
					},
					poster: {
						el: null,
						pivot: start.querySelector(".js-img-poster"),
						src: CDN_URL + a + ".webp?v=" + VERSION,
						onload: !1,
					},
					video: {
						el: null,
						src: CDN_URL + o + "?v=" + VERSION,
						canplay: null,
						onload: !1,
					},
					image: {
						el: null,
						image: null,
						pivot: start.querySelector(".js-img-poster"),
						src: CDN_URL + l + ".webp?v=" + VERSION,
						onload: !1,
					},
					shown: !1,
					visible: !1,
					listerner: null,
					observer: null,
				});
			}
			(this.array,
				this.array.forEach((trigger, start) => {
					trigger.preload.pivot && this.onPreload(trigger);
				}),
				this.array.forEach((trigger, start) => {
					((trigger.listerner = (end) => {
						end.forEach((a, o) => {
							a.isIntersecting
								? (trigger.shown ||
								((trigger.shown = !0),
									trigger.media === "video"
										? this.onLoadVideo(trigger)
										: this.onLoadImage(trigger)),
									(trigger.el.dataset.shown = 1),
									(trigger.el.dataset.visible = 1),
								trigger.video.el &&
								trigger.video.el.paused &&
								!DETECT.reduced &&
								trigger.video.el.play(),
									(trigger.visible = !0))
								: ((trigger.el.dataset.visible = 0),
									(trigger.visible = !1),
								trigger.video.el &&
								!trigger.video.el.paused &&
								!DETECT.reduced &&
								trigger.video.el.pause());
						});
					}),
						(trigger.observer = new IntersectionObserver(trigger.listerner, {
							threshold: 0,
						})),
						trigger.observer.observe(trigger.el));
				}));
		},
		onPreload(i) {
			((i.preload.el = new Image()),
				(i.preload.onload = () => {
					(i.el.classList.add("is-preload-loaded"),
						(i.preload.pivot.style.backgroundImage =
							"url(" + i.preload.src + ")"),
						(i.preload.isloaded = !0));
				}),
				i.preload.el.addEventListener("load", i.preload.onload),
				(i.preload.el.src = i.preload.src));
		},
		onLoadVideo(i) {
			((i.poster.el = new Image()),
				(i.poster.onload = () => {
					(i.el.classList.add("is-poster-loaded"),
						(i.poster.pivot.style.backgroundImage =
							"url(" + i.poster.src + ")"),
						(i.poster.isloaded = !0));
				}),
				i.poster.el.addEventListener("load", i.poster.onload),
				(i.poster.el.src = i.poster.src),
				(i.video.el = document.createElement("video")),
				(i.video.el.preload = "metadata"),
				(i.video.el.muted = !0),
				(i.video.el.loop = !0),
				i.video.el.setAttribute("crossorigin", "anonymous"),
				i.video.el.setAttribute("muted", ""),
				i.video.el.setAttribute("playsinline", "playsinline"),
				(i.video.el.src = i.video.src),
				i.pivot.appendChild(i.video.el),
				(i.video.canplay = () => {
					i.el.classList.add("is-canplay-video");
				}),
				i.video.el.addEventListener("canplay", i.video.canplay));
		},
		onLoadImage(i) {
			((i.image.el = new Image()),
				(i.image.onload = () => {
					(i.el.classList.add("is-image-loaded"),
						(i.image.pivot.style.backgroundImage = "url(" + i.image.src + ")"),
						(i.image.isloaded = !0));
				}),
				i.image.el.addEventListener("load", i.image.onload),
				(i.image.el.src = i.image.src));
		},
		onDestroy() {
			(this.array.forEach((i, element) => {
				(i.image.onload &&
				(i.image.el.removeEventListener("load", i.image.onload),
					(i.image.onload = !1),
					(i.image.el = null)),
				i.poster.onload &&
				(i.poster.el.removeEventListener("load", i.poster.onload),
					(i.poster.onload = !1),
					(i.poster.el = null)),
				i.video.canplay &&
				(i.video.el.removeEventListener("canplay", i.video.canplay),
					(i.video.canplay = !1),
					(i.video.el = null)),
				i.observer &&
				(i.observer.disconnect(i.el),
					(i.observer = null),
					(i.listerner = null)));
			}),
				(this.array = []));
		},
	},
	RD = we(
		"noscript",
		null,
		"This site requires JavaScript. Please enable JavaScript in your browser.",
		-1,
	),
	AD = {
		id: "app",
	},
	CD = we(
		"canvas",
		{
			id: "js-webgl",
		},
		null,
		-1,
	),
	Pv = lC(),
	PD = {
		data() {
			return {
				config: this.$config,
				routeChanging: !1,
				vh: 0,
				progress: 0,
			};
		},
		watch: {
			$route(i, element) {
				pageTransition.onWatch(i, element);
			},
		},
		methods: {
			onInitRouter() {
				(this.$router.beforeEach((i, element, trigger) => {
					this.$nextTick(() => {
						i.fullPath != element.fullPath && !this.routeChanging
							? ((this.routeChanging = !0), trigger())
							: trigger(!1);
					});
				}),
					this.$router.afterEach((i, element, trigger) => {
						this.$nextTick(() => {
							i.fullPath != element.fullPath && (this.routeChanging = !1);
						});
					}));
			},
			onRender(i) {
				((GLOBAL_TIME = i),
					Scroll_Works.raf(i),
					Scroll_Archive.raf(i),
					PAGE_SCROLL_NORMAL.raf(i),
				WEBGL.ready &&
				(FPS && FPS.begin(),
					WEBGL.onRender(),
					CURSOR.raf(),
					MOUSE.raf(),
					TRAILS.raf(),
				FPS && FPS.end()),
					pageTransition.onUpdate(),
					LOADER.onUpdate(),
					(this.progress = LOADER.progress));
			},
			onResize() {
				(DETECT.onDetectDevide(),
					this.checkMediaQuery(),
				PREV_MODE != CURRENT_MODE && location.reload(),
					(WR = (VH / VW) * (WW / WH)),
					(WW = window.innerWidth),
					(WH = window.innerHeight),
					(ORIENTATION = WW / WH < 1 ? "portrait" : "landscape"),
					($html.dataset.orientation = ORIENTATION),
					$html.style.setProperty("--vh", WH / 100 + "px"),
					styleContain.onResize(),
					WEBGL.onResize(),
					Transition_NNav.onResize());
			},
			checkMediaQuery() {
				const i = window.matchMedia(
						"(max-width: 900px) and (orientation: landscape)",
					),
					element = window.matchMedia("(max-width: 767px)");
				((PREV_MODE = IS_MOBILE_MODE),
					i.matches || element.matches
						? ((IS_MOBILE_MODE = !0), (CURRENT_MODE = !0))
						: ((IS_MOBILE_MODE = !1), (CURRENT_MODE = !1)));
			},
			onLoadBefore() {
				($html.classList.remove("is-l-a"),
					$html.classList.add("is-l-b"),
					pageTransition.once(),
					Transition_NNav.once(),
					COLOR.once(),
					TRAILS.once(),
					MOUSE.once(),
					CURSOR.once(),
					MENU.once(),
					Scroll_Works.once(),
					PAGE_SCROLL_NORMAL.once(),
					Scroll_Archive.once(),
					Scroll_Works.onInit(),
					PAGE_SCROLL_NORMAL.onInit(),
					Scroll_Archive.onInit(),
					LOADER.once(),
					WEBGL.once(),
					WEBGL_SCREEN.once(),
					WebglWorks.once(),
					WEBGL_HOME.once(),
					WEBGL_ABOUT.once(),
					WebglArchive.once(),
					WEBGL_MOUSE.once(),
					Webgl404.once(),
					pf.onInit(),
					WebglSingle.onInit());
			},
		},
		mounted() {
			((window.getSrc = (element = !1, trigger = !1, start = !1, end = !1) => {
				let a = element;
				return (
					DETECT.retina && trigger && (a = trigger),
					DETECT.device.tablet && !end && trigger && (a = trigger),
					DETECT.device.mobile && start && (a = start),
					DETECT.device.tablet && end && (a = end),
						a
				);
			}),
				(window.getVideoSrc = (
					element = !1,
					trigger = !1,
					start = !1,
					end = !1,
				) => {
					let a = element;
					return (
						DETECT.retina && trigger && (a = trigger),
						DETECT.device.tablet && !end && trigger && (a = trigger),
						DETECT.device.mobile && start && (a = start),
						DETECT.device.tablet && end && (a = end),
							a
					);
				}),
				(window.getPxByVw = (element = 0, trigger = window.innerWidth) =>
					(1 / VW) * 100 * element * (trigger / 100)),
				(window.getPxByVh = (element = 0, trigger = window.innerHeight) =>
					(1 / VH) * 100 * element * (trigger / 100)),
				(window.findIndexBySlug = (element, trigger) => {
					const start = element.findIndex((end) => end.slug === trigger);
					return start !== -1 ? start : !1;
				}),
				(window.getPxThree = (element, trigger = WEBGL.width) =>
					(element / window.innerWidth) * trigger),
				(window.getPxScaleThree = (element, trigger) => {
					const start = trigger / WEBGL.width,
						end = (window.innerWidth * trigger) / WEBGL.width;
					return element / ((window.innerWidth * trigger) / WEBGL.width);
				}),
				(window.rgbToHex = (element) => {
					let trigger = element.match(/\d+/g),
						start = parseInt(trigger[0], 10).toString(16),
						end = parseInt(trigger[1], 10).toString(16),
						a = parseInt(trigger[2], 10).toString(16);
					return (
						(start = start.length == 1 ? "0" + start : start),
							(end = end.length == 1 ? "0" + end : end),
							(a = a.length == 1 ? "0" + a : a),
						"#" + start + end + a
					);
				}),
				(window.hexToRgb = (element) => {
					let trigger = element.replace("#", "");
					trigger.length === 3 &&
					(trigger = trigger
						.split("")
						.map((o) => o + o)
						.join(""));
					const start = parseInt(trigger.substring(0, 2), 16),
						end = parseInt(trigger.substring(2, 4), 16),
						a = parseInt(trigger.substring(4, 6), 16);
					return {
						end: start,
						g: end,
						b: a,
					};
				}),
				(window.isNumber = (element) =>
					typeof element == "number" && !isNaN(element)),
				(window.clamp = (element, trigger, start) =>
					Math.min(Math.max(element, trigger), start)),
				(window.pow = (element, trigger) => {
					for (let start = 0; start < trigger; start++) element *= element;
					return element;
				}),
				(window.toUpperCase = (element) => element.toUpperCase()),
				(window.onPlayVideo = (element) => {
					if (element) {
						const trigger = element.play();
						trigger !== void 0 &&
						trigger.then((start) => {
						}).catch((start) => {
						});
					}
				}),
				(window.getParam = (element, trigger) => {
					(trigger || (trigger = window.location.href),
						(element = element.replace(/[\[\]]/g, "\\$&")));
					var start = new RegExp("[?&]" + element + "(=([^&#]*)|&|#|$)"),
						end = start.exec(trigger);
					return end
						? end[2]
							? decodeURIComponent(end[2].replace(/\+/g, " "))
							: ""
						: null;
				}),
				(window.onLoaded = () => {
					(WEBGL_HOME.onLoaded(),
						WEBGL_ABOUT.onLoaded(),
						WebglSingle.onLoaded(),
						WebglArchive.onInit(),
						WebglArchive.onLoaded(),
						Webgl404.onInit(),
						pf.onResize(),
						WEBGL.onResize(),
						Transition_NNav.onResize(),
					SPLASH.isSkip &&
					(styleTextShuffle.onInit(),
						styleTextShuffle.once(),
						styleInview.onInit(),
						styleContain.onInit(),
						styleImage.onInit()));
				}),
				(window.DETECT = new UsagiDetector({
					deviceChange: !1,
				})),
				(window.REDUCED_POWER = DETECT.reduced ? 0 : 1),
				(window.CDN_URL = this.config.public.cdnUrl),
				(window.VERSION = this.config.public.version),
				(window.DB_WORKS = Pv.works),
				(window.DB_ARCHIVE = Pv.archive),
				(window.VW = 1920),
				(window.VH = 1080),
				(window.MOBILE_WIDTH = 767),
				(window.RESCALE = 0.1),
				(window.TIME = 0),
				(window.WW = window.innerWidth),
				(window.WH = window.innerHeight),
				(window.ORIENTATION = "landscape"),
				(window.$html = document.querySelector("html")),
				(window.$webgl = document.getElementById("js-webgl")),
				(window.WR = (VH / VW) * (WW / WH)),
				(window.TOUCH_RATIO = getParam("touchRatio")
					? Number(getParam("touchRatio"))
					: 1),
				(window.IS_MOBILE_MODE = !1),
				(window.CURRENT_MODE = !1),
				(window.PREV_MODE = !1),
				this.checkMediaQuery(),
				$html.style.setProperty("--vh", "1vh"),
				$html.classList.add("is-l-s", "is-l-a", "is-l-d"),
				WW / WH < 1 ? (ORIENTATION = "portrait") : (ORIENTATION = "landscape"),
				($html.dataset.orientation = ORIENTATION),
				(window.gsap = Ya),
				Ya.config({
					nullTargetWarn: !1,
				}),
				Ya.registerPlugin(Je, pc),
				(window.FPS = null),
				(window.RES = Math.min(window.devicePixelRatio, 2)),
				WW >= 1980
					? (RES = Math.min(window.devicePixelRatio, 1.5))
					: WW >= 1680
						? (RES = Math.min(window.devicePixelRatio, 1.75))
						: DETECT.device.tablet && (RES = 1.75),
				(RES = Math.max(RES, 1.3)),
				($html.dataset.res = RES),
				(window.THREE = THREE),
				this.onInitRouter(),
				(window.LOADER = LOADER),
				(window.SPLASH = SPLASH),
				SPLASH.once(),
				(window.TRAILS = TRAILS),
				(window.MOUSE = MOUSE),
				(window.CURSOR = CURSOR),
				(window.COLOR = COLOR),
				(window.MENU = MENU),
				(window.styleTextShuffle = styleTextShuffle),
				(window.styleInview = styleInview),
				(window.styleContain = styleContain),
				(window.styleImage = styleImage),
				(window.WEBGL = WEBGL),
				(window.WEBGL_SCREEN = WEBGL_SCREEN),
				(window.WEBGL_DOM = pf),
				(window.WEBGL_WORKS = WebglWorks),
				(window.WEBGL_HOME = WEBGL_HOME),
				(window.WEBGL_ABOUT = WEBGL_ABOUT),
				(window.WEBGL_SINGLE = WebglSingle),
				(window.WEBGL_ARCHIVE = WebglArchive),
				(window.WEBGL_MOUSE = WEBGL_MOUSE),
				(window.WEBGL_404 = Webgl404),
				(window.PAGE_SCROLL_WORKS = Scroll_Works),
				(window.PAGE_SCROLL_NORMAL = PAGE_SCROLL_NORMAL),
				(window.PAGE_SCROLL_ARCHIVE = Scroll_Archive),
				(window.PAGE_TRANSITION = PAGE_TRANSITION),
				(window.PAGE_TRANSITION_NAV = Transition_NNav),
				(window.GLOBAL_TIME = 0),
				Ya.ticker.add((element) => {
					this.onRender(element);
				}),
				Ya.ticker.lagSmoothing(0));
			let i;
			(window.addEventListener("resize", (element) => {
				(clearTimeout(i),
					(i = setTimeout(() => {
						this.onResize();
					}, 100)));
			}),
				$html.style.setProperty("--vh", WH / 100 + "px"),
				window.addEventListener("orientationchange", () => {
					location.reload();
				}),
				window.addEventListener("touchstart", () => {
					(WebglWorks.ready && WebglWorks.onTouch(),
					WEBGL_ABOUT.ready && WEBGL_ABOUT.onTouch());
				}),
				this.onLoadBefore());
		},
	},
	LD = Object.assign(PD, {
		__name: "app",
		setup(i) {
			return (
				AM({
					htmlAttrs: {
						lang: "en",
					},
				}),
					(element, trigger) => {
						const start = KA,
							end = D2,
							a = B2,
							o = j2,
							l = J2;
						return (
							Ut(),
								Ks(
									wi,
									null,
									[
										nt(
											start,
											{
												progress: element.progress,
											},
											null,
											8,
											["progress"],
										),
										RD,
										we("div", AD, [
											nt(end),
											nt(o, null, {
												default: Jr(() => [nt(a)]),
												_: 1,
											}),
											nt(l),
											CD,
										]),
									],
									64,
								)
						);
					}
			);
		},
	}),
	ID = LD,
	OD = {
		__name: "nuxt-error-page",
		props: {
			error: Object,
		},
		setup(i) {
			const trigger = i.error;
			(trigger.stack || "")
				.split(
					`
`,
				)
				.splice(1)
				.map((d) => ({
					text: d.replace("webpack:/", "").replace(".vue", ".js").trim(),
					internal:
						(d.includes("node_modules") && !d.includes(".cache")) ||
						d.includes("internal") ||
						d.includes("new Promise"),
				}))
				.map(
					(d) =>
						`<span class="stack${d.internal ? " internal" : ""}">${d.text}</span>`,
				).join(`
`);
			const start = Number(trigger.statusCode || 500),
				end = start === 404,
				a =
					trigger.statusMessage ??
					(end ? "Page Not Found" : "Internal Server Error"),
				o = trigger.message || trigger.toString(),
				l = void 0,
				u = end
					? Ng(() =>
						Sn(
							() => import("./error-404.b733c66e.js"),
							["./error-404.b733c66e.js", "./error-404.7fc72018.css"],
							import.meta.url,
						).then((d) => d.default || d),
					)
					: Ng(() =>
						Sn(
							() => import("./error-500.6fc491a3.js"),
							["./error-500.6fc491a3.js", "./error-500.c5df6088.css"],
							import.meta.url,
						).then((d) => d.default || d),
					);
			return (d, f) => (
				Ut(),
					or(
						Ve(u),
						dw(
							Hx({
								statusCode: Ve(start),
								statusMessage: Ve(a),
								description: Ve(o),
								stack: Ve(l),
							}),
						),
						null,
						16,
					)
			);
		},
	},
	ND = OD,
	DD = {
		__name: "nuxt-root",
		setup(i) {
			const element = () => null,
				trigger = bt(),
				start = trigger.deferHydration(),
				end = !1;
			(ra(dc, Pm()),
				trigger.hooks.callHookWith((l) => l.map((c) => c()), "vue:setup"));
			const a = Hu();
			Sx((l, c, h) => {
				if (
					(trigger.hooks
						.callHook("vue:error", l, c, h)
						.catch((u) => console.error("[nuxt] Error in `vue:error` hook", u)),
					BM(l) && (l.fatal || l.unhandled))
				)
					return (trigger.runWithContext(() => Qa(l)), !1);
			});
			const o = !1;
			return (l, c) => (
				Ut(),
					or(
						gm,
						{
							onResolve: Ve(start),
						},
						{
							default: Jr(() => [
								Ve(a)
									? (Ut(),
										or(
											Ve(ND),
											{
												key: 0,
												error: Ve(a),
											},
											null,
											8,
											["error"],
										))
									: Ve(o)
										? (Ut(),
											or(
												Ve(element),
												{
													key: 1,
													context: Ve(o),
												},
												null,
												8,
												["context"],
											))
										: Ve(end)
											? (Ut(),
												or(eE(Ve(end)), {
													key: 2,
												}))
											: (Ut(),
												or(Ve(ID), {
													key: 3,
												})),
							]),
							_: 1,
						},
						8,
						["onResolve"],
					)
			);
		},
	},
	Lv = DD;
let Iv;
{
	let i;
	((Iv = async function () {
		var o, l;
		if (i) return i;
		const start = !!(
				((o = window.__NUXT__) != null && o.serverRendered) ||
				((l = document.getElementById("__NUXT_DATA__")) == null
					? void 0
					: l.dataset.ssr) === "true"
			)
				? RS(Lv)
				: MS(Lv),
			end = LT({
				vueApp: start,
			});
		
		async function a(c) {
			(await end.callHook("app:error", c),
				(end.payload.error = end.payload.error || c));
		}
		
		start.config.errorHandler = a;
		try {
			await OT(end, EA);
		} catch (c) {
			a(c);
		}
		try {
			(await end.hooks.callHook("app:created", start),
				await end.hooks.callHook("app:beforeMount", start),
				start.mount($M),
				await end.hooks.callHook("app:mounted", start),
				await Ma());
		} catch (c) {
			a(c);
		}
		return (
			start.config.errorHandler === a && (start.config.errorHandler = void 0),
				start
		);
	}),
		(i = Iv().catch((element) => {
		})));
}
export {
	wi as F,
	Gu as T,
	s2 as _,
	we as a,
	nt as b,
	Ks as c,
	zx as d,
	e2 as element,
	kD as f,
	Pm as g,
	or as h,
	li as i,
	Lc as j,
	Ve as k,
	lC as l,
	Ca as m,
	nc as start,
	Ut as o,
	FD as p,
	Cm as q,
	BD as end,
	GD as s,
	pn as trigger,
	AM as u,
	Jr as w,
};
