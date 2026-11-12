const settingsKey = "carecall-v16-display-voice-telugu";
let voiceSettings = { enabled: false, language: "te-IN" };
let activeAudio = null;
let currentPlaylist = [];
let playlistIndex = 0;

function readSettings() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(settingsKey) || "{}");
    voiceSettings.enabled = parsed.enabled === true;
    voiceSettings.language = "te-IN";
  } catch {
    voiceSettings = { enabled: false, language: "te-IN" };
  }
}

function saveSettings() {
  try {
    window.localStorage.setItem(settingsKey, JSON.stringify(voiceSettings));
  } catch {}
}

export function stopVoice() {
  currentPlaylist = [];
  playlistIndex = 0;
  if (activeAudio) {
    activeAudio.onended = null;
    activeAudio.onerror = null;
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {}
    activeAudio = null;
  }
}

export function isVoiceEnabled() {
  return voiceSettings.enabled;
}

export function setVoiceStatusText(text) {
  const el = document.getElementById("voiceStatus");
  if (el) el.textContent = text;
}

export function updateVoiceControls() {
  const available = typeof window.Audio !== "undefined";
  const voiceToggle = document.getElementById("voiceToggle");
  const testVoice = document.getElementById("testVoice");

  if (voiceToggle) {
    voiceToggle.setAttribute("aria-pressed", voiceSettings.enabled ? "true" : "false");
    voiceToggle.textContent = voiceSettings.enabled ? "వాయిస్ ఆన్" : "వాయిస్ ఆఫ్";
    voiceToggle.disabled = !available;
  }
  if (testVoice) {
    testVoice.disabled = !available || !voiceSettings.enabled;
  }
  setVoiceStatusText(!available
    ? "ఈ బ్రౌజర్‌లో ఆడియో అందుబాటులో లేదు."
    : (voiceSettings.enabled ? "తెలుగు వాయిస్ సిద్ధంగా ఉంది" : "వాయిస్ ఆఫ్ చేయబడింది"));
}

export function toggleVoiceState() {
  voiceSettings.enabled = !voiceSettings.enabled;
  saveSettings();
  updateVoiceControls();
  if (!voiceSettings.enabled) {
    stopVoice();
  } else {
    announce(1);
  }
}

export function testVoiceState() {
  if (!voiceSettings.enabled) return;
  announce(1);
}

function playSequence(urls, label) {
  stopVoice();
  if (!urls.length) return;
  currentPlaylist = urls;
  playlistIndex = 0;
  setVoiceStatusText(label || "వాయిస్ ప్లే అవుతోంది…");

  function playNext() {
    if (playlistIndex >= currentPlaylist.length) {
      activeAudio = null;
      setVoiceStatusText(voiceSettings.enabled ? "తెలుగు వాయిస్ సిద్ధంగా ఉంది" : "వాయిస్ ఆఫ్ చేయబడింది");
      return;
    }
    const url = currentPlaylist[playlistIndex];
    playlistIndex++;
    const audio = new window.Audio(url);
    audio.preload = "auto";
    activeAudio = audio;
    audio.onended = playNext;
    audio.onerror = () => {
      playNext();
    };
    try {
      const p = audio.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          setVoiceStatusText("ప్లేబ్యాక్ ఆపబడింది. స్క్రీన్ పై ట్యాప్ చేయండి.");
        });
      }
    } catch {
      playNext();
    }
  }

  playNext();
}

export function announce(number) {
  if (!voiceSettings.enabled) return;
  const value = Number(number);
  if (!isFinite(value) || value < 0) return;

  // Single number 1-10 has direct pre-recorded clip
  if (value >= 1 && value <= 10 && Math.floor(value) === value) {
    const filename = (value < 10 ? "0" : "") + value + ".wav";
    playSequence([`/v16/display/audio/te/${filename}`], `నంబర్ ${value} పిలుస్తోంది…`);
    return;
  }

  // Multi-digit numbers (e.g. 25 -> 2, 5): run digit clips one after another
  const digitChars = String(Math.floor(value)).split("");
  const urls = [];
  for (const digit of digitChars) {
    const d = Number(digit);
    if (d >= 1 && d <= 9) {
      urls.push(`/v16/display/audio/te/0${d}.wav`);
    } else if (d === 0) {
      urls.push(`/v16/display/audio/te/10.wav`);
    }
  }

  if (urls.length > 0) {
    playSequence(urls, `నంబర్ ${value} పిలుస్తోంది…`);
  }
}

readSettings();

