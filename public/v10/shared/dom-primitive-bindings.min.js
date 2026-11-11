const u = {
  name: "dom-primitive-bindings",
  version: "3.0.0"
}, c = (t, n = u) => {
  var e;
  if (!(!t || typeof globalThis > "u"))
    return globalThis.ks ?? (globalThis.ks = {}), globalThis.ks.domPrimitiveBindings = {
      meta: n,
      bindEvents: t
    }, (e = globalThis.ks).bindEvents ?? (e.bindEvents = t), globalThis.ks.domPrimitiveBindings;
}, l = (t) => typeof t == "string" ? document.getElementById(t) || document.querySelector(t) : t && typeof t == "object" && "addEventListener" in t ? t : null, a = (t) => {
  if (!t) return null;
  const n = l(t);
  return n || null;
}, f = (t) => Array.isArray(t) ? t.filter((n) => n && typeof n == "object" && typeof n.event == "string" && typeof n.selector == "string") : [], g = (t) => {
  const n = f(t);
  return n.length === 0 ? null : n;
}, p = (t, n) => {
  const e = a(t);
  if (!e) return null;
  const r = g(n);
  return r ? { container: e, bindings: r } : null;
}, d = (t) => {
  const n = /* @__PURE__ */ new Map();
  for (const e of t) {
    const r = n.get(e.event) ?? [];
    r.push(e), n.set(e.event, r);
  }
  return n;
}, y = (t) => d(t), m = (t, n, e) => {
  var r;
  return t.root === "event" || (r = n == null ? void 0 : n.type) != null && r.startsWith("key") ? n : e;
}, h = (t, n, e) => ({
  ...t.clientData,
  event: n,
  targetElement: e
}), v = ({ binding: t, event: n, matchElement: e }) => {
  const r = m(t, n, e), i = h(t, n, e), o = t.runner, s = typeof o == "function" ? o(r, t.instructions, i) : r;
  return s != null && typeof t.onExtract == "function" && t.onExtract(s, n, e), s;
}, B = ({ bindings: t, event: n, container: e }) => {
  var r, i;
  for (const o of t) {
    const s = (i = (r = n.target) == null ? void 0 : r.closest) == null ? void 0 : i.call(r, o.selector);
    !s || !e.contains(s) || v({ binding: o, event: n, matchElement: s });
  }
}, k = (t, n, e) => {
  t.addEventListener(n, (r) => {
    B({ bindings: e, event: r, container: t });
  });
}, E = (t, n) => {
  for (const [e, r] of n.entries())
    k(t, e, r);
  return t;
}, T = (t, n = []) => {
  const e = p(t, n);
  if (!e) return null;
  const { container: r, bindings: i } = e, o = y(i);
  return E(r, o), r;
};
c(T);
export {
  T as bindEvents,
  T as default
};
