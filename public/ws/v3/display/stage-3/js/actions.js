import { attachSocket, detachSocket } from "./socket/index.js";

let socket = null;
let retryTimer = null;
let retryDelay = 2000;
let stopped = false;

export const actions = {
  createUrl: (config) => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}${config.path}?role=${config.role}`;
  },

  calculateNextDelay: (currentDelay, reconnectConfig) => {
    const maxDelay = reconnectConfig?.maxDelay || 30000;
    const factor = reconnectConfig?.factor || 1.7;
    return Math.min(maxDelay, Math.round(currentDelay * factor));
  },

  scheduleReconnect: (config) => {
    if (stopped || retryTimer) return;
    retryTimer = window.setTimeout(() => {
      retryTimer = null;
      actions.connect(config);
    }, retryDelay);
    retryDelay = actions.calculateNextDelay(retryDelay, config.reconnect);
  },

  connect: (config) => {
    if (stopped) return;
    if (socket) {
      actions.disconnect();
    }

    if (window.displayUI) window.displayUI.setConnectionStatus("సర్వర్‌కి కనెక్ట్ అవుతోంది…");
    const url = actions.createUrl(config);

    try {
      socket = new window.WebSocket(url);
      attachSocket(socket, {
        onDisconnected: () => {
          if (stopped) return;
          socket = null;
          actions.scheduleReconnect(config);
        }
      });
    } catch {
      if (window.displayUI) window.displayUI.setConnectionStatus("వెబ్‌సాకెట్ అందుబాటులో లేదు — మళ్లీ ప్రయత్నిస్తోంది");
      actions.scheduleReconnect(config);
    }
  },

  disconnect: () => {
    if (!socket) return;
    try {
      detachSocket(socket);
      socket.close();
    } catch {}
    socket = null;
  },

  stop: () => {
    stopped = true;
    if (retryTimer) {
      window.clearTimeout(retryTimer);
      retryTimer = null;
    }
    actions.disconnect();
  },

  start: (instructions = []) => {
    const [config] = instructions;
    if (!config) return;
    retryDelay = config.reconnect?.initialDelay || 2000;
    stopped = false;

    window.addEventListener("beforeunload", () => {
      actions.stop();
    });

    actions.connect(config);
  }
};

export default actions;
