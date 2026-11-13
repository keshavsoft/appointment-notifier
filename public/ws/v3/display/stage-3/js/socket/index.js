import { bindWs, unbindWs } from "./ws-primitive-bindings.js";
import bindings from "./bindings.json" with { type: "json" };
import actions from "./actions.js";

export const attachSocket = (socket, context = {}) => bindWs(socket, bindings, actions, context);

export const detachSocket = (socket) => unbindWs(socket);

export default { attachSocket, detachSocket, bindings, actions };
