import { bindEvents } from "/v16/lib/dom-primitive-bindings.js";
import actions from "./actions.js";
import { announce, stopVoice, updateVoiceControls } from "./audio.js";

const root = document.getElementById("displayView");
const numberElement = root ? root.querySelector("[data-display-number]") : null;
const elapsedElement = root ? root.querySelector("[data-display-elapsed]") : null;
const connectionStatus = document.getElementById("connectionStatus");

let announcement = null;
let socket = null;
let retryTimer = null;
let retryDelay = 2000;
let stopped = false;

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

function render() {
  if (!numberElement || !elapsedElement || !root) return;
  if (!announcement) {
    root.classList.add("is-waiting");
    numberElement.textContent = "";
    numberElement.style.fontSize = "";
    elapsedElement.textContent = "తదుపరి కాల్ కోసం వేచి ఉంది";
    return;
  }
  root.classList.remove("is-waiting");
  const value = String(announcement.number == null ? "" : announcement.number);
  numberElement.textContent = value;
  const digits = Math.max(1, value.length);
  const heightLimit = (window.innerHeight || document.documentElement.clientHeight) * 0.82;
  const widthLimit = ((window.innerWidth || document.documentElement.clientWidth) * 0.84) / (digits * 0.68);
  const fontSize = Math.max(80, Math.min(heightLimit, widthLimit));
  numberElement.style.fontSize = fontSize + "px";
  const sentAt = Number(announcement.sentAt) || new Date().getTime();
  elapsedElement.textContent = elapsedText(new Date().getTime() - sentAt) + " క్రితం పిలవబడింది";
}

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
  setText(connectionStatus, "సర్వర్‌కి కనెక్ట్ అవుతోంది…");
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = protocol + "//" + window.location.host + "/ws?role=display-v16";
  try {
    socket = new window.WebSocket(url);
  } catch {
    setText(connectionStatus, "వెబ్‌సాకెట్ అందుబాటులో లేదు — మళ్లీ ప్రయత్నిస్తోంది");
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    retryDelay = 2000;
    setText(connectionStatus, "సర్వర్‌కి కనెక్ట్ అయింది · సమన్వయం చేస్తోంది");
  };

  socket.onmessage = (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      setText(connectionStatus, "సందేశాన్ని చదవడం సాధ్యం కాలేదు");
      return;
    }
    if (message.type === "error") {
      setText(connectionStatus, "సర్వర్: " + message.message);
      return;
    }
    if (message.type !== "state") return;
    announcement = message.announcement || null;
    render();
    setText(connectionStatus, message.displayConnected ? "డిస్‌ప్లే కనెక్ట్ అయింది" : "సర్వర్‌కి కనెక్ట్ అయింది");
    if (message.cause === "call" && message.announcement) {
      announce(message.announcement.number);
    }
  };

  socket.onerror = () => {
    setText(connectionStatus, "కనెక్షన్ సమస్య · మళ్లీ ప్రయత్నిస్తోంది");
  };

  socket.onclose = () => {
    if (stopped) return;
    socket = null;
    setText(connectionStatus, "డిస్‌కనెక్ట్ అయింది · మళ్లీ కనెక్ట్ అవుతోంది…");
    scheduleReconnect();
  };
}

async function init() {
  updateVoiceControls();

  // Initialize dom-primitive-bindings
  try {
    const res = await fetch("/v16/display/bindings.json");
    const bindings = await res.json();
    bindEvents("displayApp", bindings, actions);
  } catch (error) {
    console.error("dom-primitive-bindings init error:", error);
  }

  window.addEventListener("resize", render);
  window.addEventListener("beforeunload", () => {
    stopped = true;
    if (retryTimer) window.clearTimeout(retryTimer);
    if (socket) socket.close();
    stopVoice();
  });

  render();
  window.setInterval(render, 1000);
  connect();
}

init();

