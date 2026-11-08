import { createDisplayView } from "./display-view.js";

const displayView = createDisplayView(document.querySelector("#displayView"));
const voiceToggle = document.querySelector("#voiceToggle");
const voiceLanguage = document.querySelector("#voiceLanguage");
const testVoiceButton = document.querySelector("#testVoice");
const voiceStatus = document.querySelector("#voiceStatus");
const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
const socket = new WebSocket(wsProtocol + "//" + location.host + "/ws?role=display-v4");
const speechAvailable = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
const settingsKey = "carecall-v4-display-voice";
let voiceEnabled = readVoicePreference();

function readVoicePreference() {
  try {
    const settings = JSON.parse(localStorage.getItem(settingsKey) || "{}");
    return settings.voiceEnabled === true;
  } catch {
    return false;
  }
}

function saveVoicePreference() {
  try {
    localStorage.setItem(settingsKey, JSON.stringify({ voiceEnabled }));
  } catch {
    // Voice still works for this page even if browser storage is unavailable.
  }
}

function updateVoiceControls() {
  voiceToggle.setAttribute("aria-pressed", String(voiceEnabled));
  voiceToggle.textContent = voiceEnabled ? "Voice on" : "Voice off";
  testVoiceButton.disabled = !speechAvailable || !voiceEnabled;
  voiceLanguage.disabled = !speechAvailable;

  if (!speechAvailable) {
    voiceStatus.textContent = "Speech is unavailable in this browser.";
  } else {
    voiceStatus.textContent = voiceEnabled
      ? "Voice on · English"
      : "Voice off";
  }
}

function speak(text) {
  if (!speechAvailable || !voiceEnabled) return;

  window.speechSynthesis.cancel();
  window.speechSynthesis.getVoices();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voiceLanguage.value;
  utterance.rate = 0.88;
  utterance.onerror = () => {
    voiceStatus.textContent = "English speech could not play on this device.";
  };
  window.speechSynthesis.speak(utterance);
}

if (!speechAvailable) {
  voiceToggle.disabled = true;
}

voiceToggle.addEventListener("click", () => {
  voiceEnabled = !voiceEnabled;
  saveVoicePreference();
  updateVoiceControls();

  if (voiceEnabled) {
    window.speechSynthesis.getVoices();
  } else if (speechAvailable) {
    window.speechSynthesis.cancel();
  }
});

testVoiceButton.addEventListener("click", () => {
  speak("Voice test. Number twenty five.");
});

voiceLanguage.addEventListener("change", () => {
  updateVoiceControls();
  saveVoicePreference();
});

socket.addEventListener("message", (event) => {
  let data;
  try {
    data = JSON.parse(event.data);
  } catch {
    return;
  }

  if (data.type !== "state") return;
  displayView.update(data.announcement);

  if (data.cause === "call" && data.announcement) {
    speak("Number " + data.announcement.number);
  }
});

updateVoiceControls();
