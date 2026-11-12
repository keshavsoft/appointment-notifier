// src/v7/register/meta.js
var e = {
	name: "dom-primitive-bindings",
	version: "5.0.0"
}, t = (t, n = e) => {
	if (t && typeof globalThis < "u") return globalThis.ks ??= {}, globalThis.ks.domPrimitiveBindings = {
		meta: n,
		...t
	}, globalThis.ks.bindEvents ??= t.bindEvents, globalThis.ks.domPrimitiveBindings;
}, n = (e) => typeof e == "string" ? document.getElementById(e) || document.querySelector(e) : e && typeof e == "object" && "addEventListener" in e ? e : null, r = (e) => e && n(e) || null, i = [
	"event",
	"selector",
	"action"
], a = (e) => {
	if (typeof e != "object" || !e || Array.isArray(e)) return !1;
	let t = Object.getPrototypeOf(e);
	return t === Object.prototype || t === null;
}, o = (e) => !a(e) || Object.keys(e).length !== i.length || !i.every((t) => Object.hasOwn(e, t)) ? !1 : i.every((t) => typeof e[t] == "string" && e[t].trim().length > 0), s = (e) => {
	if (!Array.isArray(e)) throw TypeError("bindings must be an array.");
	if (e.length === 0) throw TypeError("bindings must contain at least one binding.");
	return e.forEach((e, t) => {
		if (!o(e)) throw TypeError(`bindings[${t}] must be an object with exactly three non-empty string properties: event, selector, and action.`);
	}), e;
}, c = (e) => s(e), l = (e) => {
	if (typeof e != "object" || !e || Array.isArray(e)) return !1;
	let t = Object.getPrototypeOf(e);
	return t === Object.prototype || t === null;
}, u = (e = {}) => {
	if (!l(e)) throw TypeError("actions must be a plain, flat object.");
	for (let [t, n] of Object.entries(e)) if (typeof n != "function") throw TypeError(`actions.${t} must be a function.`);
	return e;
}, d = (e, t, n = {}) => {
	let i = r(e);
	return i ? {
		container: i,
		bindings: c(t),
		actions: u(n)
	} : null;
}, f = (e) => {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = t.get(n.event) ?? [];
		e.push(n), t.set(n.event, e);
	}
	return t;
}, p = (e, t = {}) => f(t && typeof t == "object" && Object.keys(t).length > 0 ? e.map((e) => e.action && typeof t[e.action] == "function" && typeof e.onExtract != "function" ? {
	...e,
	onExtract: (n, r, i) => {
		t[e.action](r, i, n);
	}
} : e) : e), m = (e, t, n) => e.root === "event" || t?.type?.startsWith("key") ? t : n, h = (e, t, n) => ({
	...e.clientData,
	event: t,
	targetElement: n
}), g = ({ binding: e, event: t, matchElement: n }) => {
	let r = m(e, t, n), i = h(e, t, n), a = e.runner, o = typeof a == "function" ? a(r, e.instructions, i) : r;
	return o != null && typeof e.onExtract == "function" && e.onExtract(o, t, n), o;
}, _ = ({ bindings: e, event: t, container: n }) => {
	for (let r of e) {
		let e = t.target?.closest?.(r.selector);
		e && n.contains(e) && g({
			binding: r,
			event: t,
			matchElement: e
		});
	}
}, v = (e, t, n) => {
	e.addEventListener(t, (t) => {
		_({
			bindings: n,
			event: t,
			container: e
		});
	});
}, y = (e, t) => {
	for (let [n, r] of t.entries()) v(e, n, r);
	return e;
}, b = () => "app", x = () => [{
	event: "click",
	selector: "#loadBtn",
	action: "loadData"
}], S = () => ({ loadData: () => {} }), C = () => ({
	containerOrId: b(),
	bindings: x(),
	actions: S()
}), w = (e, t = [], n = {}) => d(e, t, n), T = (e, t = [], n = {}) => {
	let r = w(e, t, n);
	if (!r) return null;
	let { container: i, bindings: a } = r;
	return y(i, p(a, r.actions)), i;
};
t({
	bindEvents: T,
	check: w,
	sample: C,
	sampleContainer: b,
	sampleBindings: x,
	sampleActions: S
});
export { T as bindEvents, T as default, w as check, C as sample, S as sampleActions, x as sampleBindings, b as sampleContainer };
