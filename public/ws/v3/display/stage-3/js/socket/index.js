import bindings from "./bindings.json" with { type: "json" };
import actions from "./actions.js";

export function attachSocket(socket, callbacks = {}) {
  if (!socket) return;
  for (const item of bindings) {
    const fn = actions[item.action];
    if (typeof fn === "function") {
      socket[`on${item.event}`] = (event) => fn(event, callbacks);
    }
  }
}

export function detachSocket(socket) {
  if (!socket) return;
  for (const item of bindings) {
    socket[`on${item.event}`] = null;
  }
}

export default { attachSocket, detachSocket, bindings, actions };

