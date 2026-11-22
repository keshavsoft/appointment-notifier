import { createCallMessage } from "./messages.js";
import {
  updateNumberDisplay,
  updateSendButtonState,
  updateConnectionStatus,
  updateFeedbackMessage
} from "./dom.js";
import { createWebSocket, closeWebSocket } from "./websocket.js";

const dialedNumber = document.getElementById("dialedNumber");
const btnSend = document.getElementById("btnSend");
const btnClear = document.getElementById("btnClear");
const btnBack = document.getElementById("btnBack");
const btnQuickNext = document.getElementById("btnQuickNext");
const serverStatus = document.getElementById("serverStatus");
const feedback = document.getElementById("feedback");

let currentDigits = "";
let activeSocket = null;
let lastSentNumber = 0;

function connect() {
  closeWebSocket(activeSocket);

  const socket = createWebSocket({
    onOpen: () => {
      if (activeSocket !== socket) return;
      updateConnectionStatus(serverStatus, "సర్వర్ కనెక్ట్ అయింది", true);
      updateSendButtonState(btnSend, currentDigits.length > 0, true);
    },
    onClose: () => {
      if (activeSocket !== socket) return;
      updateConnectionStatus(serverStatus, "డిస్‌కనెక్ట్ అయింది", false);
      updateSendButtonState(btnSend, false, false);
      setTimeout(() => {
        if (activeSocket === socket) connect();
      }, 2000);
    },
    onMessage: () => {}
  });

  activeSocket = socket;
}

document.querySelectorAll("[data-digit]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (currentDigits.length < 3) {
      currentDigits += btn.getAttribute("data-digit");
      updateNumberDisplay(dialedNumber, currentDigits);
      updateSendButtonState(btnSend, true, activeSocket && activeSocket.readyState === 1);
    }
  });
});

btnClear.addEventListener("click", () => {
  currentDigits = "";
  updateNumberDisplay(dialedNumber, currentDigits);
  updateSendButtonState(btnSend, false, activeSocket && activeSocket.readyState === 1);
});

btnBack.addEventListener("click", () => {
  currentDigits = currentDigits.slice(0, -1);
  updateNumberDisplay(dialedNumber, currentDigits);
  updateSendButtonState(btnSend, currentDigits.length > 0, activeSocket && activeSocket.readyState === 1);
});

btnQuickNext.addEventListener("click", () => {
  const next = lastSentNumber + 1;
  currentDigits = String(next);
  updateNumberDisplay(dialedNumber, currentDigits);
  updateSendButtonState(btnSend, true, activeSocket && activeSocket.readyState === 1);
});

btnSend.addEventListener("click", () => {
  if (!currentDigits || !activeSocket || activeSocket.readyState !== 1) return;
  const num = currentDigits;
  lastSentNumber = Number(num) || lastSentNumber;

  activeSocket.send(createCallMessage(num));
  updateFeedbackMessage(feedback, `టోకెన్ ${num} డిస్‌ప్లేకి పంపబడింది`);
  currentDigits = "";
  updateNumberDisplay(dialedNumber, currentDigits);
  updateSendButtonState(btnSend, false, true);
});

connect();
