// ws-primitive-bindings v1.0.0 (KeshavSoft)
const e = new Set(["open", "message", "error", "close"]);
const t = (e) => {
  if (e === null || typeof e !== "object" || Array.isArray(e)) return false;
  const t = Object.getPrototypeOf(e);
  return t === Object.prototype || t === null;
};
const n = (e) => {
  if (!e || typeof e !== "object") throw new TypeError("socket must be a WebSocket object or compatible EventTarget.");
  if (typeof e.addEventListener !== "function" && !("onopen" in e || "onmessage" in e)) {
    throw new TypeError("socket must implement addEventListener or onopen/onmessage properties.");
  }
  return e;
};
const r = (n) => {
  if (!t(n)) return false;
  if (typeof n.event !== "string" || !e.has(n.event.trim())) return false;
  if (typeof n.action !== "string" || n.action.trim().length === 0) return false;
  if (n.type !== undefined && (typeof n.type !== "string" || n.type.trim().length === 0)) return false;
  return true;
};
const s = (e) => {
  if (!Array.isArray(e)) throw new TypeError("bindings must be an array.");
  if (e.length === 0) throw new TypeError("bindings must contain at least one binding.");
  e.forEach((e, t) => {
    if (!r(e)) throw new TypeError(`bindings[${t}] must have a valid 'event' ('open', 'message', 'error', 'close') and non-empty 'action'.`);
  });
  return e;
};
const o = (e = {}) => {
  if (!t(e)) throw new TypeError("actions must be a plain object.");
  for (const [t, n] of Object.entries(e)) {
    if (typeof n !== "function") throw new TypeError(`actions.${t} must be a function.`);
  }
  return e;
};
const i = (e, t, r = {}) => ({
  socket: n(e),
  bindings: s(t),
  actions: o(r)
});
const a = (e, t = {}) => {
  const n = new Map();
  for (const r of e) {
    const e = typeof t[r.action] === "function" ? t[r.action] : null;
    const s = { ...r, actionFn: e };
    const o = n.get(r.event) ?? [];
    o.push(s);
    n.set(r.event, o);
  }
  return n;
};
const c = (e) => {
  if (typeof e !== "string") return e;
  try { return JSON.parse(e); } catch { return e; }
};
const u = ({ binding: e, event: t, socket: n, payload: r, context: s }) => {
  if (typeof e.actionFn !== "function") return;
  if (e.event === "message") e.actionFn(r, t, n, s);
  else e.actionFn(t, n, s);
};
const l = ({ bindings: e, event: t, socket: n, context: r }) => {
  let s = null;
  if (t.type === "message") s = c(t.data);
  for (const o of e) {
    if (t.type === "message" && o.type && (!s || typeof s !== "object" || s.type !== o.type)) continue;
    u({ binding: o, event: t, socket: n, payload: s, context: r });
  }
};
const p = (e, t, n, r = {}) => {
  const s = (s) => { l({ bindings: n, event: s, socket: e, context: r }); };
  e.__wsBindingsListeners ??= new Map();
  e.__wsBindingsListeners.set(t, s);
  if (typeof e.addEventListener === "function") e.addEventListener(t, s);
  else e[`on${t}`] = s;
};
const d = (e, t) => {
  if (!e) return;
  const n = e.__wsBindingsListeners?.get(t);
  if (n) {
    if (typeof e.removeEventListener === "function") e.removeEventListener(t, n);
    else if (e[`on${t}`] === n) e[`on${t}`] = null;
    e.__wsBindingsListeners.delete(t);
  }
};
const f = (e, t, n = {}) => {
  for (const [r, s] of t.entries()) p(e, r, s, n);
  return e;
};
const y = (e, t = ["open", "message", "error", "close"]) => {
  for (const n of t) d(e, n);
  return e;
};
const b = { name: "ws-primitive-bindings", version: "1.0.0" };
const g = (e, t = b) => {
  if (!e || typeof globalThis === "undefined") return;
  globalThis.ks ??= {};
  globalThis.ks.wsPrimitiveBindings = { meta: t, ...e };
  globalThis.ks.bindWs ??= e.bindWs;
  return globalThis.ks.wsPrimitiveBindings;
};
const check = (e, t = [], n = {}) => i(e, t, n);
const bindWs = (e, t = [], n = {}, r = {}) => {
  const s = check(e, t, n);
  if (!s) return null;
  const o = a(s.bindings, s.actions);
  f(s.socket, o, r);
  return s.socket;
};
const unbindWs = (e, t) => y(e, t);
export { bindWs, unbindWs, check };
export default bindWs;
g({ bindWs, unbindWs, check });
