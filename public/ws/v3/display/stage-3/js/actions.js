let reconnectFn = () => {};
let resetDelayFn = () => {};

export function setSocketHelpers(helpers = {}) {
  if (helpers.reconnect) reconnectFn = helpers.reconnect;
  if (helpers.resetDelay) resetDelayFn = helpers.resetDelay;
}

export const actions = {
  onOpen: () => {
    resetDelayFn();
    if (window.displayUI) window.displayUI.setConnectionStatus("సర్వర్‌కి కనెక్ట్ అయింది · సమన్వయం చేస్తోంది");
  },

  onMessage: (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      if (window.displayUI) window.displayUI.setConnectionStatus("సందేశాన్ని చదవడం సాధ్యం కాలేదు");
      return;
    }
    if (message.type === "error") {
      if (window.displayUI) window.displayUI.setConnectionStatus("సర్వర్: " + message.message);
      return;
    }
    if (message.type !== "state") return;

    if (message.announcement && message.announcement.number) {
      if (window.displayUI) window.displayUI.showCall(message.announcement.number, message.announcement.sentAt);
    } else {
      if (window.displayUI) window.displayUI.showCall(null);
    }

    if (window.displayUI) {
      window.displayUI.setConnectionStatus(message.displayConnected ? "డిస్‌ప్లే కనెక్ట్ అయింది" : "సర్వర్‌కి కనెక్ట్ అయింది");
    }
  },

  onError: () => {
    if (window.displayUI) window.displayUI.setConnectionStatus("కనెక్షన్ సమస్య · మళ్లీ ప్రయత్నిస్తోంది");
  },

  onClose: () => {
    if (window.displayUI) window.displayUI.setConnectionStatus("డిస్‌కనెక్ట్ అయింది · మళ్లీ కనెక్ట్ అవుతోంది…");
    reconnectFn();
  },

  attachListeners: (socket, listeners = []) => {
    if (!socket || !Array.isArray(listeners)) return;
    for (const item of listeners) {
      const fn = actions[item.action];
      if (typeof fn === "function") {
        socket[`on${item.event}`] = fn;
      }
    }
  },

  detachListeners: (socket, listeners = []) => {
    if (!socket || !Array.isArray(listeners)) return;
    for (const item of listeners) {
      socket[`on${item.event}`] = null;
    }
  }
};

export default actions;
