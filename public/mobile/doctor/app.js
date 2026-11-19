const selectedNumber = document.getElementById("selectedNumber");
const sendButton = document.getElementById("sendCall");
const feedback = document.getElementById("feedback");
const serverStatus = document.getElementById("serverStatus");
const displayStatus = document.getElementById("displayStatus");

let number = "";
let serverConnected = false;
let socket = null;
let retryTimer = null;
let stopped = false;

function setStatus(element, text, state) {
  if (!element) return;
  element.classList.remove("connected", "offline");
  if (state) element.classList.add("connected");
  else element.classList.add("offline");
  const textNode = element.lastChild;
  if (textNode) textNode.textContent = text;
}

function updateNumber() {
  selectedNumber.textContent = number || "—";
  sendButton.disabled = !number || !serverConnected;
}

function connect() {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  let currentSocket;

  setStatus(serverStatus, "కనెక్ట్ అవుతోంది…", false);

  try {
    currentSocket = new WebSocket(`${protocol}//${location.host}/ws?role=doctor-mobile`);
    socket = currentSocket;
  } catch {
    serverConnected = false;
    updateNumber();
    setStatus(serverStatus, "కనెక్షన్ సమస్య", false);
    retry();
    return;
  }

  currentSocket.onopen = () => {
    if (socket !== currentSocket) return;
    serverConnected = true;
    setStatus(serverStatus, "సర్వర్ కనెక్ట్ అయింది", true);
    updateNumber();
  };

  currentSocket.onclose = () => {
    if (socket !== currentSocket || stopped) return;
    socket = null;
    serverConnected = false;
    setStatus(serverStatus, "మళ్లీ కనెక్ట్ అవుతోంది", false);
    setStatus(displayStatus, "డిస్‌ప్లే స్థితి తెలియదు", false);
    updateNumber();
    retry();
  };

  currentSocket.onerror = () => {
    setStatus(serverStatus, "కనెక్షన్ సమస్య", false);
  };

  currentSocket.onmessage = (event) => {
    let data;
    try { data = JSON.parse(event.data); } catch { return; }

    if (data.type === "error") {
      feedback.textContent = data.message;
      return;
    }

    if (data.type !== "state") return;

    const displayConnected = Boolean(data.displayConnected);
    setStatus(displayStatus, displayConnected ? "డిస్‌ప్లే కనెక్ట్ అయింది" : "డిస్‌ప్లే ఆఫ్‌లైన్", displayConnected);

    if (data.cause === "call" && data.announcement) {
      feedback.textContent = data.delivered
        ? `నంబర్ ${data.announcement.number} డిస్‌ప్లేకి పంపబడింది.`
        : `కాల్ ${data.announcement.number} సేవ్ చేయబడింది.`;
    }
  };
}

function retry() {
  if (stopped || retryTimer) return;
  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    connect();
  }, 1500);
}

document.querySelectorAll("[data-digit]").forEach((button) => {
  button.addEventListener("click", () => {
    if (number.length < 3) {
      number += button.dataset.digit;
      updateNumber();
    }
  });
});

document.querySelector("[data-action='clear']").addEventListener("click", () => {
  number = "";
  feedback.textContent = "";
  updateNumber();
});

document.querySelector("[data-action='backspace']").addEventListener("click", () => {
  number = number.slice(0, -1);
  updateNumber();
});

sendButton.addEventListener("click", () => {
  if (!number || !socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: "call", number }));
  feedback.textContent = `నంబర్ ${number} పంపుతోంది…`;
  number = "";
  updateNumber();
});

window.addEventListener("beforeunload", () => {
  stopped = true;
  if (retryTimer) clearTimeout(retryTimer);
  if (socket) socket.close();
});

updateNumber();
connect();
