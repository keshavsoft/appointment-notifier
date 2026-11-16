let socket = null;
let retryTimer = null;
let retryDelay = 1500;
let stopped = false;
let serverConnected = false;

function scheduleReconnect() {
  if (stopped || retryTimer) return;
  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    connect();
  }, retryDelay);
  retryDelay = Math.min(20000, Math.round(retryDelay * 1.6));
}

function connect() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  let currentSocket;
  if (window.doctorUI) window.doctorUI.setConnectionStatus(false, false);

  try {
    currentSocket = new window.WebSocket(protocol + "//" + window.location.host + "/ws?role=doctor-v17");
    socket = currentSocket;
  } catch {
    serverConnected = false;
    if (window.doctorUI) window.doctorUI.setConnectionStatus(false, false);
    scheduleReconnect();
    return;
  }

  currentSocket.onopen = () => {
    if (socket !== currentSocket) return;
    serverConnected = true;
    retryDelay = 1500;
    if (window.doctorUI) {
      window.doctorUI.setConnectionStatus(true, false);
      window.doctorUI.setFeedback("కనెక్ట్ అయింది. డిస్‌ప్లే స్థితిని తనిఖీ చేస్తోంది…");
    }
  };

  currentSocket.onclose = () => {
    if (socket !== currentSocket || stopped) return;
    socket = null;
    serverConnected = false;
    if (window.doctorUI) window.doctorUI.setConnectionStatus(false, false);
    scheduleReconnect();
  };

  currentSocket.onerror = () => {
    if (socket !== currentSocket) return;
    if (window.doctorUI) window.doctorUI.setConnectionStatus(false, false);
  };

  currentSocket.onmessage = (event) => {
    let data;
    if (socket !== currentSocket) return;
    try {
      data = JSON.parse(event.data);
    } catch {
      if (window.doctorUI) window.doctorUI.setFeedback("సర్వర్ నుండి చదవలేని ప్రతిస్పందన వచ్చింది.");
      return;
    }
    if (data.type === "error") {
      if (window.doctorUI) window.doctorUI.setFeedback(data.message);
      return;
    }
    if (data.type !== "state") return;

    if (window.doctorUI) {
      window.doctorUI.showPreview(data.announcement);
      window.doctorUI.setConnectionStatus(true, Boolean(data.displayConnected));
      if (data.cause === "call" && data.announcement) {
        window.doctorUI.setFeedback(data.delivered
          ? `నంబర్ ${data.announcement.number} డిస్‌ప్లేకి పంపబడింది.`
          : `కాల్ ${data.announcement.number} సేవ్ చేయబడింది. డిస్‌ప్లే కనెక్ట్ కాగానే కనిపిస్తుంది.`);
      }
    }
  };
}

// Hook into Doctor UI's send event
if (window.doctorUI) {
  window.doctorUI.onSend((num) => {
    if (!socket || socket.readyState !== 1) {
      if (window.doctorUI) window.doctorUI.setFeedback("సర్వర్‌తో కనెక్షన్ లేదు.");
      return;
    }
    socket.send(JSON.stringify({ type: "call", number: num }));
    if (window.doctorUI) window.doctorUI.setFeedback(`నంబర్ ${num} డిస్‌ప్లేకి పంపుతోంది…`);
  });
}

window.addEventListener("beforeunload", () => {
  stopped = true;
  if (retryTimer) window.clearTimeout(retryTimer);
  if (socket) socket.close();
});

connect();

