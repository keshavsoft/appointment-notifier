import { createDisplayView } from "./display-view.js";

const displayView = createDisplayView(document.querySelector("#displayView"));
const voiceToggle = document.querySelector("#voiceToggle");
const voiceLanguage = document.querySelector("#voiceLanguage");
const testVoiceButton = document.querySelector("#testVoice");
const voiceStatus = document.querySelector("#voiceStatus");
const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
const socket = new WebSocket(wsProtocol + "//" + location.host + "/ws?role=display-v4");
const speechAvailable = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
const audioAvailable = typeof Audio !== "undefined";
const settingsKey = "carecall-v4-display-voice";
const voiceSettings = readVoiceSettings();
let voiceEnabled = voiceSettings.voiceEnabled;
let activeAudio = null;

voiceLanguage.value = voiceSettings.voiceLanguage;

function readVoiceSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(settingsKey) || "{}");
    return {
      voiceEnabled: settings.voiceEnabled === true,
      voiceLanguage: settings.voiceLanguage === "te-IN" ? "te-IN" : "en-IN"
    };
  } catch {
    return { voiceEnabled: false, voiceLanguage: "en-IN" };
  }
}

function saveVoicePreference() {
  try {
    localStorage.setItem(settingsKey, JSON.stringify({
      voiceEnabled,
      voiceLanguage: voiceLanguage.value
    }));
  } catch {
    // Voice still works for this page even if browser storage is unavailable.
  }
}

function updateVoiceControls() {
  const voiceAvailable = speechAvailable || audioAvailable;
  const selectedLanguageAvailable = voiceLanguage.value === "te-IN"
    ? audioAvailable
    : speechAvailable;
  voiceToggle.setAttribute("aria-pressed", String(voiceEnabled));
  voiceToggle.textContent = voiceEnabled ? "Voice on" : "Voice off";
  voiceToggle.disabled = !voiceAvailable;
  testVoiceButton.disabled = !voiceEnabled || !selectedLanguageAvailable;
  voiceLanguage.disabled = !voiceAvailable;

  if (!voiceAvailable) {
    voiceStatus.textContent = "Audio is unavailable in this browser.";
  } else {
    voiceStatus.textContent = getVoiceReadyStatus();
  }
}

function getVoiceReadyStatus() {
  if (!voiceEnabled) return "Voice off";
  return voiceLanguage.value === "te-IN"
    ? "Telugu voice on · clips 1–10"
    : "English voice on";
}

function stopCurrentVoice() {
  if (speechAvailable) window.speechSynthesis.cancel();
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
}

function speakEnglish(text) {
  if (!speechAvailable) {
    voiceStatus.textContent = "English speech is unavailable in this browser.";
    return;
  }

  window.speechSynthesis.getVoices();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = 0.88;
  utterance.onerror = () => {
    voiceStatus.textContent = "English speech could not play on this device.";
  };
  window.speechSynthesis.speak(utterance);
}

function speakTeluguNumber(number) {
  const numericNumber = Number(number);

  if (!Number.isInteger(numericNumber) || numericNumber < 1 || numericNumber > 10) {
    voiceStatus.textContent = "Telugu WAV clips are available for numbers 1–10.";
    return;
  }

  if (!audioAvailable) {
    voiceStatus.textContent = "Telugu audio is unavailable in this browser.";
    return;
  }

  voiceStatus.textContent = getVoiceReadyStatus();
  const filename = String(numericNumber).padStart(2, "0");
  activeAudio = new Audio(`/v4/audio/te/${filename}.wav`);
  const currentAudio = activeAudio;
  currentAudio.addEventListener("ended", () => {
    if (activeAudio === currentAudio) activeAudio = null;
  }, { once: true });
  currentAudio.addEventListener("error", () => {
    if (activeAudio === currentAudio) activeAudio = null;
    voiceStatus.textContent = `Telugu clip ${filename}.wav could not be loaded.`;
  }, { once: true });
  currentAudio.play().catch(() => {
    if (activeAudio === currentAudio) activeAudio = null;
    voiceStatus.textContent = "Telugu audio could not play on this device.";
  });
}

function announceNumber(number) {
  if (!voiceEnabled) return;

  stopCurrentVoice();

  if (voiceLanguage.value === "te-IN") {
    speakTeluguNumber(number);
    return;
  }

  speakEnglish(`Number ${number}`);
}

voiceToggle.addEventListener("click", () => {
  voiceEnabled = !voiceEnabled;
  saveVoicePreference();
  updateVoiceControls();

  if (voiceEnabled) {
    if (speechAvailable) window.speechSynthesis.getVoices();
  } else {
    stopCurrentVoice();
  }
});

testVoiceButton.addEventListener("click", () => {
  if (voiceLanguage.value === "te-IN") {
    announceNumber(5);
  } else {
    stopCurrentVoice();
    speakEnglish("Voice test. Number twenty five.");
  }
});

voiceLanguage.addEventListener("change", () => {
  stopCurrentVoice();
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
    announceNumber(data.announcement.number);
  }
});

updateVoiceControls();
