import { bindEvents } from "./dom-primitive-bindings.js";

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
let sendCallback = null;

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

export function updateNumber() {
  if (selectedNumber) selectedNumber.textContent = number || "—";
  if (sendButton) sendButton.disabled = !number;
}

export function switchTab(selected) {
  tabs.forEach((tab) => {
    const active = tab.getAttribute("data-tab") === selected;
    if (active) tab.classList.add("active");
    else tab.classList.remove("active");
    tab.setAttribute("aria-selected", active ? "true" : "false");
  });
  if (panels.call) panels.call.hidden = selected !== "call";
  if (panels.preview) panels.preview.hidden = selected !== "preview";
}

export function renderPreview(announcement) {
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

// Global contract for Stage 3 WebSocket transport
window.doctorUI = {
  onSend: (cb) => { sendCallback = cb; },
  setConnectionStatus: (serverConnected, displayConnected) => {
    setPill(serverStatus, serverConnected ? "సర్వర్ కనెక్ట్ అయింది" : "సర్వర్ ఆఫ్‌లైన్", serverConnected);
    setPill(displayStatus, displayConnected ? "డిస్‌ప్లే కనెక్ట్ అయింది" : "డిస్‌ప్లే ఆఫ్‌లైన్", displayConnected);
    setPill(previewDisplayStatus, displayConnected ? "డిస్‌ప్లే కనెక్ట్ అయింది" : "డిస్‌ప్లే ఆఫ్‌లైన్", displayConnected);
  },
  showPreview: (announcement) => {
    renderPreview(announcement);
  },
  setFeedback: (msg) => {
    if (feedback) feedback.textContent = msg;
  }
};

const actions = {
  pressDigit: (event, matchElement) => {
    const digit = matchElement.getAttribute("data-digit");
    if (digit && number.length < 3) {
      number += digit;
      updateNumber();
    }
  },
  clearNumber: () => {
    number = "";
    updateNumber();
  },
  backspaceNumber: () => {
    number = number.slice(0, -1);
    updateNumber();
  },
  sendCall: () => {
    if (!number) return;
    if (sendCallback) {
      sendCallback(number);
    } else {
      // Local Stage 2 test behavior
      if (feedback) feedback.textContent = `నంబర్ ${number} పిలవబడింది (ఆఫ్‌లైన్ టెస్ట్).`;
      renderPreview({ number, sentAt: Date.now() });
    }
    number = "";
    updateNumber();
  },
  switchTab: (event, matchElement) => {
    const tab = matchElement.getAttribute("data-tab");
    if (tab) switchTab(tab);
  }
};

async function init() {
  updateNumber();
  setPill(serverStatus, "ఆఫ్‌లైన్ ఇంటరాక్టివ్ మోడ్", true);
  setPill(displayStatus, "లోకల్ సిమ్యులేషన్", true);

  try {
    const res = await fetch("./stage-2/js/bindings.json");
    const bindings = await res.json();
    bindEvents("doctorApp", bindings, actions);
  } catch (error) {
    console.error("dom-primitive-bindings init error:", error);
  }
}

init();

