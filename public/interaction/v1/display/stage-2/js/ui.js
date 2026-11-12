import { bindEvents } from "./dom-primitive-bindings.js";
import { announce, stopVoice, updateVoiceControls, numberToTeluguWords, unlockAudio, toggleVoiceState, testVoiceState } from "./audio.js";

const root = document.getElementById("displayView");
const numberElement = root ? root.querySelector("[data-display-number]") : null;
const spellingElement = root ? root.querySelector("[data-display-spelling]") : null;
const elapsedElement = root ? root.querySelector("[data-display-elapsed]") : null;
const connectionStatus = document.getElementById("connectionStatus");

let currentAnnouncement = null;
let lastAnnouncedCallKey = null;

function setText(element, value) {
  if (element) element.textContent = value;
}

function elapsedText(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (seconds < 60) return seconds + "సె";
  if (minutes < 60) return minutes + "ని " + (seconds % 60) + "సె";
  return hours + "గం " + (minutes % 60) + "ని";
}

export function render() {
  if (!numberElement || !elapsedElement || !root) return;
  if (!currentAnnouncement) {
    root.classList.add("is-waiting");
    numberElement.textContent = "";
    if (spellingElement) spellingElement.textContent = "";
    elapsedElement.textContent = "తదుపరి కాల్ కోసం వేచి ఉంది";
    return;
  }
  root.classList.remove("is-waiting");
  const value = String(currentAnnouncement.number == null ? "" : currentAnnouncement.number);
  numberElement.textContent = value;
  const numVal = Number(value);
  if (spellingElement) {
    spellingElement.textContent = isFinite(numVal) && numVal >= 0 ? numberToTeluguWords(numVal) : "";
  }
  const digits = Math.max(1, value.length);
  const heightLimit = (window.innerHeight || document.documentElement.clientHeight) * 0.32;
  const widthLimit = ((window.innerWidth || document.documentElement.clientWidth) * 0.65) / (digits * 0.65);
  const fontSize = Math.max(64, Math.min(heightLimit, widthLimit));
  numberElement.style.fontSize = fontSize + "px";
  const sentAt = Number(currentAnnouncement.sentAt) || new Date().getTime();
  elapsedElement.textContent = elapsedText(new Date().getTime() - sentAt) + " క్రితం పిలవబడింది";
}

export function showCall(number, sentAt = Date.now()) {
  currentAnnouncement = { number: String(number), sentAt: Number(sentAt) };
  render();
  const callKey = `${number}#${sentAt}`;
  if (lastAnnouncedCallKey !== callKey) {
    lastAnnouncedCallKey = callKey;
    announce(number);
  }
}

export function setConnectionStatus(text) {
  setText(connectionStatus, text);
}

// Global hook for Stage 3 WebSocket transport to call into Stage 2 UI
window.displayUI = {
  showCall,
  setConnectionStatus,
  render
};

const actions = {
  toggleVoice: () => {
    toggleVoiceState();
  },
  testVoice: () => {
    testVoiceState();
  }
};

async function init() {
  updateVoiceControls();

  // Unlock audio on initial user touch/click/key anywhere on the display
  window.addEventListener("click", unlockAudio, { once: true });
  window.addEventListener("touchstart", unlockAudio, { once: true });
  window.addEventListener("keydown", unlockAudio, { once: true });

  // Initialize dom-primitive-bindings locally
  try {
    const res = await fetch("./stage-2/js/bindings.json");
    const bindings = await res.json();
    bindEvents("displayApp", bindings, actions);
  } catch (error) {
    console.error("dom-primitive-bindings init error:", error);
  }

  window.addEventListener("resize", render);
  window.addEventListener("beforeunload", () => {
    stopVoice();
  });

  render();
  window.setInterval(render, 1000);
}

init();

