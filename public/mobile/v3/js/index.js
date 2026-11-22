import { createCallMessage } from "./messages.js";
import { setPill, formatElapsed, renderActive, updateView } from "./dom.js";
import { createMobileWebSocket, closeMobileWebSocket } from "./websocket.js";

const selectedNumber = document.getElementById("selectedNumber");
const sendButton = document.getElementById("sendCall");
const feedback = document.getElementById("feedback");
const serverStatus = document.getElementById("serverStatus");
const keyClear = document.getElementById("keyClear");
const keyBack = document.getElementById("keyBack");
const btnQuickNext = document.getElementById("btnQuickNext");
const btnRecall = document.getElementById("btnRecall");

const activeNum = document.getElementById("activeNum");
const activeWords = document.getElementById("activeWords");
const activeElapsed = document.getElementById("activeElapsed");

const activeElements = { activeNum, activeWords, activeElapsed, btnRecall };

let currentDigits = "";
let socket = null;
let retryTimer = null;
let isConnected = false;
let activeCall = null;
let lastSentNumber = 0;

function connect() {
  if (socket) {
    closeMobileWebSocket(socket);
    socket = null;
  }

  setPill(serverStatus, "కనెక్ట్ అవుతోంది…", false);

  socket = createMobileWebSocket({
    onOpen: () => {
      isConnected = true;
      setPill(serverStatus, "సర్వర్ కనెక్ట్ అయింది", true);
      updateView(selectedNumber, sendButton, currentDigits, isConnected);
      renderActive(activeElements, activeCall, isConnected);
    },
    onClose: () => {
      isConnected = false;
      socket = null;
      setPill(serverStatus, "డిస్‌కనెక్ట్ అయింది", false);
      updateView(selectedNumber, sendButton, currentDigits, isConnected);
      renderActive(activeElements, activeCall, isConnected);
      scheduleRetry();
    },
    onError: () => {
      setPill(serverStatus, "కనెక్షన్ సమస్య", false);
    },
    onMessage: (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch (e) { return; }

      if (data.type === "state" && data.announcement && data.announcement.number) {
        activeCall = data.announcement;
        lastSentNumber = Number(activeCall.number) || lastSentNumber;
        renderActive(activeElements, activeCall, isConnected);
        if (data.cause === "call") {
          feedback.textContent = `టోకెన్ ${activeCall.number} డిస్‌ప్లేకి పంపబడింది`;
        }
      }
    }
  });
}

function scheduleRetry() {
  if (retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    connect();
  }, 2000);
}

// Keypad numeric button listeners
document.querySelectorAll("[data-digit]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (currentDigits.length < 3) {
      currentDigits += btn.getAttribute("data-digit");
      updateView(selectedNumber, sendButton, currentDigits, isConnected);
    }
  });
});

keyClear.addEventListener("click", () => {
  currentDigits = "";
  updateView(selectedNumber, sendButton, currentDigits, isConnected);
});

keyBack.addEventListener("click", () => {
  currentDigits = currentDigits.slice(0, -1);
  updateView(selectedNumber, sendButton, currentDigits, isConnected);
});

btnQuickNext.addEventListener("click", () => {
  const next = lastSentNumber + 1;
  currentDigits = String(next);
  updateView(selectedNumber, sendButton, currentDigits, isConnected);
});

btnRecall.addEventListener("click", () => {
  if (!activeCall || !activeCall.number || !socket || socket.readyState !== 1) return;
  socket.send(createCallMessage(activeCall.number));
  feedback.textContent = `టోకెన్ ${activeCall.number} మళ్లీ పిలవబడింది`;
});

sendButton.addEventListener("click", () => {
  if (!currentDigits || !socket || socket.readyState !== 1) return;
  const num = currentDigits;
  lastSentNumber = Number(num) || lastSentNumber;

  socket.send(createCallMessage(num));
  feedback.textContent = `టోకెన్ ${num} డిస్‌ప్లేకి పంపబడింది`;
  currentDigits = "";
  updateView(selectedNumber, sendButton, currentDigits, isConnected);
});

// Periodic elapsed time ticker
setInterval(() => {
  if (activeCall && activeCall.sentAt) {
    activeElapsed.textContent = formatElapsed(activeCall.sentAt);
  }
}, 1000);

connect();
