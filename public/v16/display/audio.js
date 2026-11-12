const settingsKey = "carecall-v16-display-voice-telugu";
let voiceSettings = { enabled: false, language: "te-IN" };
let activeAudio = null;
let currentPlaylist = [];
let playlistIndex = 0;
let playbackSessionId = 0;

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
  playbackSessionId++;
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
  const thisSession = playbackSessionId;
  currentPlaylist = urls;
  playlistIndex = 0;
  setVoiceStatusText(label || "వాయిస్ ప్లే అవుతోంది…");

  function playNext() {
    if (thisSession !== playbackSessionId) return;
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
    audio.onended = () => {
      if (thisSession === playbackSessionId) playNext();
    };
    audio.onerror = () => {
      if (thisSession === playbackSessionId) playNext();
    };
    try {
      const p = audio.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          if (thisSession === playbackSessionId) {
            setVoiceStatusText("ప్లేబ్యాక్ ఆపబడింది. స్క్రీన్ పై ట్యాప్ చేయండి.");
          }
        });
      }
    } catch {
      if (thisSession === playbackSessionId) playNext();
    }
  }

  playNext();
}

const TELUGU_UNITS = [
  "సున్నా", "ఒకటి", "రెండు", "మూడు", "నాలుగు", "ఐదు",
  "ఆరు", "ఏడు", "ఎనిమిది", "తొమ్మిది", "పది",
  "పదకొండు", "పన్నెండు", "పదమూడు", "పద్నాలుగు", "పదిహేను",
  "పదహారు", "పదిహేడు", "పద్దెనిమిది", "పంతొమ్మిది"
];

const TELUGU_TENS = [
  "", "", "ఇరవై", "ముప్పై", "నలభై", "యాభై",
  "అరవై", "డెబ్బై", "ఎనభై", "తొంభై"
];

export function numberToTeluguWords(num) {
  const n = Math.floor(Number(num));
  if (!isFinite(n) || n < 0 || n > 999) return String(num);
  if (n < 20) return TELUGU_UNITS[n];
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const rem = n % 10;
    return rem === 0 ? TELUGU_TENS[tens] : `${TELUGU_TENS[tens]} ${TELUGU_UNITS[rem]}`;
  }
  const hundreds = Math.floor(n / 100);
  const rem = n % 100;
  const hundredText = hundreds === 1 ? "వంద" : `${TELUGU_UNITS[hundreds]} వందల`;
  if (rem === 0) return hundredText;
  return `${hundredText} ${numberToTeluguWords(rem)}`;
}

export function announce(number) {
  if (!voiceSettings.enabled) return;
  const value = Number(number);
  if (!isFinite(value) || value < 0) return;

  const teluguSpelling = numberToTeluguWords(value);

  // Single numbers 1-10: use local 01.wav to 10.wav
  if (value >= 1 && value <= 10 && Math.floor(value) === value) {
    const filename = (value < 10 ? "0" : "") + value + ".wav";
    playSequence([`/v16/display/audio/te/${filename}`], `నంబర్ ${value} (${teluguSpelling}) పిలుస్తోంది…`);
    return;
  }

  // Two-digit numbers 11-99 (e.g. 16 -> 16.mp3 "నంబర్ పదహారు"): play single dedicated audio clip
  if (value >= 11 && value <= 99 && Math.floor(value) === value) {
    playSequence([`/v16/display/audio/te/${value}.mp3`], `నంబర్ ${value} (${teluguSpelling}) పిలుస్తోంది…`);
    return;
  }

  // 100+: composite sequence (e.g. 116 -> 16.mp3)
  const remainder = value % 100;
  const urls = [];
  if (remainder >= 11 && remainder <= 99) {
    urls.push(`/v16/display/audio/te/${remainder}.mp3`);
  } else if (remainder >= 1 && remainder <= 10) {
    urls.push(`/v16/display/audio/te/${remainder < 10 ? "0" : ""}${remainder}.wav`);
  }

  if (urls.length > 0) {
    playSequence(urls, `నంబర్ ${value} (${teluguSpelling}) పిలుస్తోంది…`);
  }
}

readSettings();
