let socket = null;
let retryTimer = null;
let retryDelay = 2000;
let stopped = false;

function scheduleReconnect() {
  if (stopped || retryTimer) return;
  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    connect();
  }, retryDelay);
  retryDelay = Math.min(30000, Math.round(retryDelay * 1.7));
}

function connect() {
  if (stopped) return;
  if (socket) {
    try {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
    } catch {}
    socket = null;
  }

  if (window.displayUI) window.displayUI.setConnectionStatus("సర్వర్‌కి కనెక్ట్ అవుతోంది…");
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = protocol + "//" + window.location.host + "/ws?role=display-v17";

  try {
    socket = new window.WebSocket(url);
  } catch {
    if (window.displayUI) window.displayUI.setConnectionStatus("వెబ్‌సాకెట్ అందుబాటులో లేదు — మళ్లీ ప్రయత్నిస్తోంది");
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    retryDelay = 2000;
    if (window.displayUI) window.displayUI.setConnectionStatus("సర్వర్‌కి కనెక్ట్ అయింది · సమన్వయం చేస్తోంది");
  };

  socket.onmessage = (event) => {
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
  };

  socket.onerror = () => {
    if (window.displayUI) window.displayUI.setConnectionStatus("కనెక్షన్ సమస్య · మళ్లీ ప్రయత్నిస్తోంది");
  };

  socket.onclose = () => {
    if (stopped) return;
    socket = null;
    if (window.displayUI) window.displayUI.setConnectionStatus("డిస్‌కనెక్ట్ అయింది · మళ్లీ కనెక్ట్ అవుతోంది…");
    scheduleReconnect();
  };
}

window.addEventListener("beforeunload", () => {
  stopped = true;
  if (retryTimer) window.clearTimeout(retryTimer);
  if (socket) {
    try { socket.close(); } catch {}
  }
});

connect();

