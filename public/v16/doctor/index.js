import { bindEvents } from "/v16/lib/dom-primitive-bindings.js";
import actions, { registerDoctorHandlers } from "./actions.js";

const tabs = document.querySelectorAll("[data-tab]");
const panels = {
  call: document.getElementById("call-panel"),
  preview: document.getElementById("preview-panel")
};
const selectedNumber = document.getElementById("selectedNumber");
const sendButton = document.getElementById("sendCall");
const feedback = document.getElementById("feedback");
const serverStatus = document.getElementById("serverStatus");
const displayStatus = document.getElementById("displayStatus");
const previewDisplayStatus = document.getElementById("previewDisplayStatus");
const previewRoot = document.getElementById("displayPreview");

let number = "";
let serverConnected = false;
let displayConnected = false;
let socket = null;
let retryTimer = null;
let retryDelay = 1500;
let stopped = false;

function setPill(element, label, connected) {
  if (!element) return;
  if (element.classList) {
    if (connected) {
      element.classList.add("connected");
      element.classList.remove("offline");
    } else {
      element.classList.add("offline");
      element.classList.remove("connected");
    }
  }
  if (element.lastChild) element.lastChild.textContent = label;
}

function renderPreview(announcement) {
  if (!previewRoot) return;
  const numberEl = previewRoot.querySelector("[data-display-number]");
  const elapsedEl = previewRoot.querySelector("[data-display-elapsed]");
  if (!numberEl || !elapsedEl) return;

  if (!announcement) {
    numberEl.textContent = "—";
    elapsedEl.textContent = "తదుపరి కాల్ కోసం వేచి ఉంది";
    return;
  }
  const value = String(announcement.number == null ? "" : announcement.number);
  numberEl.textContent = value;
  numberEl.style.fontSize = Math.max(60, Math.min(window.innerHeight * 0.42, (window.innerWidth * 0.5) / Math.max(1, value.length))) + "px";
  const age = Math.max(0, Math.floor((new Date().getTime() - (Number(announcement.sentAt) || new Date().getTime())) / 1000));
  const sec = age % 60;
  const min = Math.floor(age / 60);
  const hrs = Math.floor(min / 60);
  elapsedEl.textContent = (hrs ? hrs + "గం " + (min % 60) + "ని" : min ? min + "ని " + sec + "సె" : sec + "సె") + " క్రితం పిలవబడింది";
}

function updateNumber() {
  if (selectedNumber) selectedNumber.textContent = number || "—";
  if (sendButton) sendButton.disabled = !number || !serverConnected;
}

function switchTab(selected) {
  tabs.forEach((tab) => {
    const active = tab.getAttribute("data-tab") === selected;
    if (active) tab.classList.add("active");
    else tab.classList.remove("active");
    tab.setAttribute("aria-selected", active ? "true" : "false");
  });
  if (panels.call) panels.call.hidden = selected !== "call";
  if (panels.preview) panels.preview.hidden = selected !== "preview";
}

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
  setPill(serverStatus, "కనెక్ట్ అవుతోంది…", false);
  try {
    currentSocket = new window.WebSocket(protocol + "//" + window.location.host + "/ws?role=doctor-v16");
    socket = currentSocket;
  } catch {
    serverConnected = false;
    updateNumber();
    setPill(serverStatus, "కనెక్షన్ సమస్య", false);
    scheduleReconnect();
    return;
  }

  currentSocket.onopen = () => {
    if (socket !== currentSocket) return;
    serverConnected = true;
    retryDelay = 1500;
    setPill(serverStatus, "సర్వర్ కనెక్ట్ అయింది", true);
    updateNumber();
    if (feedback) feedback.textContent = "కనెక్ట్ అయింది. డిస్‌ప్లే స్థితిని తనిఖీ చేస్తోంది…";
  };

  currentSocket.onclose = (event) => {
    if (socket !== currentSocket || stopped) return;
    socket = null;
    serverConnected = false;
    displayConnected = false;
    setPill(serverStatus, "డిస్‌కనెక్ట్ అయింది (" + (event.code || 0) + ") · మళ్లీ కనెక్ట్ అవుతోంది", false);
    setPill(displayStatus, "డిస్‌ప్లే స్థితి తెలియదు", false);
    setPill(previewDisplayStatus, "డిస్‌ప్లే స్థితి తెలియదు", false);
    updateNumber();
    scheduleReconnect();
  };

  currentSocket.onerror = () => {
    if (socket !== currentSocket) return;
    setPill(serverStatus, "కనెక్షన్ సమస్య", false);
  };

  currentSocket.onmessage = (event) => {
    let data;
    if (socket !== currentSocket) return;
    try {
      data = JSON.parse(event.data);
    } catch {
      if (feedback) feedback.textContent = "సర్వర్ నుండి చదవలేని ప్రతిస్పందన వచ్చింది.";
      return;
    }
    if (data.type === "error") {
      if (feedback) feedback.textContent = data.message;
      return;
    }
    if (data.type !== "state") return;
    renderPreview(data.announcement);
    displayConnected = Boolean(data.displayConnected);
    setPill(displayStatus, displayConnected ? "డిస్‌ప్లే కనెక్ట్ అయింది" : "డిస్‌ప్లే ఆఫ్‌లైన్", displayConnected);
    setPill(previewDisplayStatus, displayConnected ? "డిస్‌ప్లే కనెక్ట్ అయింది" : "డిస్‌ప్లే ఆఫ్‌లైన్", displayConnected);
    if (data.cause === "call" && data.announcement) {
      if (feedback) {
        feedback.textContent = data.delivered
          ? `నంబర్ ${data.announcement.number} డిస్‌ప్లేకి పంపబడింది.`
          : `కాల్ ${data.announcement.number} సేవ్ చేయబడింది. డిస్‌ప్లే కనెక్ట్ కాగానే కనిపిస్తుంది.`;
      }
    }
  };
}

registerDoctorHandlers({
  onDigit: (digit) => {
    if (number.length < 3) {
      number += digit;
      updateNumber();
    }
  },
  onClear: () => {
    number = "";
    updateNumber();
  },
  onBackspace: () => {
    number = number.slice(0, -1);
    updateNumber();
  },
  onSend: () => {
    if (!number || !socket || socket.readyState !== 1) return;
    socket.send(JSON.stringify({ type: "call", number: number }));
    if (feedback) feedback.textContent = `నంబర్ ${number} డిస్‌ప్లేకి పంపుతోంది…`;
    number = "";
    updateNumber();
  },
  onSwitchTab: (tab) => {
    switchTab(tab);
  }
});

async function init() {
  updateNumber();

  // Initialize dom-primitive-bindings on doctorApp
  try {
    const res = await fetch("/v16/doctor/bindings.json");
    const bindings = await res.json();
    bindEvents("doctorApp", bindings, actions);
  } catch (error) {
    console.error("dom-primitive-bindings init error:", error);
  }

  window.addEventListener("beforeunload", () => {
    stopped = true;
    if (retryTimer) window.clearTimeout(retryTimer);
    if (socket) socket.close();
  });

  connect();
}

init();

