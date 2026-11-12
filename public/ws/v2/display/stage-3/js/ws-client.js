import instructions from "./instructions.json" with { type: "json" };
import actions, { setSocketHelpers } from "./actions.js";

const [instruction] = instructions;

let socket = null;
let retryTimer = null;
let retryDelay = instruction?.reconnect?.initialDelay || 2000;
let stopped = false;

function scheduleReconnect() {
  if (stopped || retryTimer) return;
  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    connect();
  }, retryDelay);
  const maxDelay = instruction?.reconnect?.maxDelay || 30000;
  const factor = instruction?.reconnect?.factor || 1.7;
  retryDelay = Math.min(maxDelay, Math.round(retryDelay * factor));
}

setSocketHelpers({
  reconnect: () => {
    if (stopped) return;
    socket = null;
    scheduleReconnect();
  },
  resetDelay: () => {
    retryDelay = instruction?.reconnect?.initialDelay || 2000;
  }
});

function connect() {
  if (stopped) return;
  if (socket) {
    try {
      actions.detachListeners(socket, instruction.listeners);
      socket.close();
    } catch {}
    socket = null;
  }

  if (window.displayUI) window.displayUI.setConnectionStatus("సర్వర్‌కి కనెక్ట్ అవుతోంది…");
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${protocol}//${window.location.host}${instruction.path}?role=${instruction.role}`;

  try {
    socket = new window.WebSocket(url);
  } catch {
    if (window.displayUI) window.displayUI.setConnectionStatus("వెబ్‌సాకెట్ అందుబాటులో లేదు — మళ్లీ ప్రయత్నిస్తోంది");
    scheduleReconnect();
    return;
  }

  actions.attachListeners(socket, instruction.listeners);
}

window.addEventListener("beforeunload", () => {
  stopped = true;
  if (retryTimer) window.clearTimeout(retryTimer);
  if (socket) {
    try {
      actions.detachListeners(socket, instruction.listeners);
      socket.close();
    } catch {}
  }
});

connect();
