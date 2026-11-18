const settingsKey = "carecall-v18-display-voice-telugu";
const legacySettingsKey = "carecall-v17-display-voice-telugu";
let voiceSettings = { enabled: false, language: "te-IN" };
let activeAudio = null;
let activeSourceNode = null;
const audioBufferCache = {};
let currentPlaylist = [];
let playlistIndex = 0;
let playbackSessionId = 0;
let audioContext = null;
let persistentAudio = null;
let isAudioUnlocked = false;
let isHtmlAudioPrimed = false;
let heartbeatInterval = null;

function getPersistentAudio() {
  if (!persistentAudio) {
    persistentAudio = document.getElementById("persistentVoiceAudio");
    if (!persistentAudio) {
      persistentAudio = document.createElement("audio");
      persistentAudio.id = "persistentVoiceAudio";
      persistentAudio.preload = "auto";
      persistentAudio.setAttribute("playsinline", "");
      persistentAudio.style.display = "none";
      document.body.appendChild(persistentAudio);
    }
  }
  return persistentAudio;
}

function fetchArrayBuffer(url, onSuccess, onError) {
  if (typeof window.fetch === "function") {
    window.fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.arrayBuffer();
      })
      .then(onSuccess)
      .catch(onError);
  } else {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 0) {
          onSuccess(xhr.response);
        } else {
          onError(new Error("XHR " + xhr.status));
        }
      };
      xhr.onerror = () => onError(new Error("XHR network error"));
      xhr.send();
    } catch (e) {
      onError(e);
    }
  }
}

function fetchAndDecodeAudio(url, onSuccess, onError) {
  if (audioBufferCache[url]) {
    onSuccess(audioBufferCache[url]);
    return;
  }
  fetchArrayBuffer(url, (arrayBuffer) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!audioContext && AudioCtx) {
      try { audioContext = new AudioCtx(); } catch {}
    }
    if (!audioContext) {
      onError(new Error("No AudioContext available"));
      return;
    }
    let decodeDone = false;
    const handleSuccess = (decodedBuffer) => {
      if (decodeDone) return;
      decodeDone = true;
      audioBufferCache[url] = decodedBuffer;
      onSuccess(decodedBuffer);
    };
    const handleErr = (err) => {
      if (decodeDone) return;
      decodeDone = true;
      onError(err || new Error("decodeAudioData failed"));
    };
    try {
      const res = audioContext.decodeAudioData(arrayBuffer, handleSuccess, handleErr);
      if (res && typeof res.then === "function") {
        res.then(handleSuccess).catch(handleErr);
      }
    } catch (e) {
      handleErr(e);
    }
  }, onError);
}

function preloadCommonAudio() {
  for (let i = 1; i <= 10; i++) {
    const filename = (i < 10 ? "0" : "") + i + ".wav";
    const url = getAudioUrl(filename);
    if (!audioBufferCache[url]) {
      fetchAndDecodeAudio(url, () => {}, () => {});
    }
  }
}

function startHeartbeat() {
  if (heartbeatInterval) return;
  heartbeatInterval = window.setInterval(() => {
    if (!voiceSettings.enabled || !audioContext) return;
    if (audioContext.state === "suspended") {
      try { audioContext.resume(); } catch {}
    }
    if (audioContext.state === "running") {
      try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        gain.gain.value = 0.00001;
        osc.connect(gain);
        gain.connect(audioContext.destination);
        const now = audioContext.currentTime;
        osc.start(now);
        osc.stop(now + 0.001);
      } catch {}
    }
  }, 15000);
}

export function unlockAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (AudioCtx) {
    try {
      if (!audioContext) audioContext = new AudioCtx();
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }
      if (!isAudioUnlocked && audioContext.state === "running") {
        const buffer = audioContext.createBuffer(1, 1, 22050);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
        isAudioUnlocked = true;
      }
      startHeartbeat();
      preloadCommonAudio();
    } catch {}
  }

  if (!isHtmlAudioPrimed) {
    try {
      const pa = getPersistentAudio();
      pa.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      const p = pa.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          pa.pause();
          pa.currentTime = 0;
          isHtmlAudioPrimed = true;
        }).catch(() => {});
      }
    } catch {}
  }

  updateVoiceControls();
}

function readSettings() {
  try {
    const saved = window.localStorage.getItem(settingsKey) ||
                  window.localStorage.getItem(legacySettingsKey) || "{}";
    const parsed = JSON.parse(saved);
    voiceSettings.enabled = parsed.enabled === true;
    voiceSettings.language = "te-IN";
  } catch {
    voiceSettings = { enabled: false, language: "te-IN" };
  }
}

function saveSettings() {
  try {
    const val = JSON.stringify(voiceSettings);
    window.localStorage.setItem(settingsKey, val);
    window.localStorage.setItem(legacySettingsKey, val);
  } catch {}
}

export function stopVoice() {
  playbackSessionId++;
  currentPlaylist = [];
  playlistIndex = 0;
  if (activeSourceNode) {
    try {
      activeSourceNode.onended = null;
      activeSourceNode.stop(0);
      activeSourceNode.disconnect();
    } catch {}
    activeSourceNode = null;
  }
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
  const available = typeof window.Audio !== "undefined" ||
                  typeof window.AudioContext !== "undefined" ||
                  typeof window.webkitAudioContext !== "undefined";
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
  if (!available) {
    setVoiceStatusText("ఈ బ్రౌజర్‌లో ఆడియో అందుబాటులో లేదు.");
  } else if (!voiceSettings.enabled) {
    setVoiceStatusText("వాయిస్ ఆఫ్ చేయబడింది");
  } else if (audioContext && audioContext.state === "running") {
    setVoiceStatusText("తెలుగు వాయిస్ సిద్ధంగా ఉంది");
  } else {
    setVoiceStatusText("వాయిస్ సిద్ధం · దయచేసి రిమోట్ బటన్ నొక్కండి");
  }
}

export function toggleVoiceState() {
  unlockAudio();
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
  unlockAudio();
  if (!voiceSettings.enabled) return;
  announce(1);
}

function getAudioUrl(filename) {
  try {
    if (typeof import.meta !== "undefined" && import.meta && import.meta.url) {
      return new URL(`./audio/te/${filename}`, import.meta.url).href;
    }
  } catch (e) {}
  return `./audio/te/${filename}`;
}

export function playSequence(urls, label) {
  stopVoice();
  if (!urls || !urls.length) return;
  const thisSession = playbackSessionId;
  currentPlaylist = urls;
  playlistIndex = 0;
  setVoiceStatusText(label || "వాయిస్ ప్లే అవుతోంది…");

  if (audioContext && audioContext.state === "suspended") {
    try { audioContext.resume(); } catch {}
  }

  function playWithWebAudio(url, onEnd, onError) {
    fetchAndDecodeAudio(url, (buffer) => {
      if (thisSession !== playbackSessionId) return;
      try {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        activeSourceNode = source;
        source.onended = () => {
          if (activeSourceNode === source) activeSourceNode = null;
          onEnd();
        };
        source.start(0);
      } catch (err) {
        onError(err);
      }
    }, onError);
  }

  function playWithHtmlAudio(url, onEnd, onError) {
    const audio = getPersistentAudio();
    activeAudio = audio;
    audio.onended = () => {
      activeAudio = null;
      onEnd();
    };
    audio.onerror = (err) => {
      activeAudio = null;
      onError(err);
    };
    audio.src = url;
    try {
      const p = audio.play();
      if (p && typeof p.catch === "function") {
        p.catch((err) => {
          activeAudio = null;
          onError(err);
        });
      }
    } catch (err) {
      activeAudio = null;
      onError(err);
    }
  }

  function playNext() {
    if (thisSession !== playbackSessionId) return;
    if (playlistIndex >= currentPlaylist.length) {
      activeSourceNode = null;
      activeAudio = null;
      updateVoiceControls();
      return;
    }
    const url = currentPlaylist[playlistIndex];
    playlistIndex++;

    if (audioContext && audioContext.state !== "closed") {
      if (audioContext.state === "suspended") {
        try { audioContext.resume(); } catch {}
      }
      playWithWebAudio(url, () => {
        if (thisSession === playbackSessionId) playNext();
      }, (webAudioErr) => {
        console.warn("WebAudio playback error, falling back to HTML5 Audio:", webAudioErr);
        if (thisSession !== playbackSessionId) return;
        playWithHtmlAudio(url, () => {
          if (thisSession === playbackSessionId) playNext();
        }, (htmlAudioErr) => {
          console.warn("Both WebAudio and HTML5 audio failed:", htmlAudioErr);
          if (thisSession === playbackSessionId) {
            setVoiceStatusText("ప్లేబ్యాక్ ఆపబడింది. రిమోట్ బటన్ నొక్కండి.");
            playNext();
          }
        });
      });
    } else {
      playWithHtmlAudio(url, () => {
        if (thisSession === playbackSessionId) playNext();
      }, (htmlAudioErr) => {
        console.warn("HTML5 audio playback failed:", htmlAudioErr);
        if (thisSession === playbackSessionId) {
          setVoiceStatusText("ప్లేబ్యాక్ ఆపబడింది. రిమోట్ బటన్ నొక్కండి.");
          playNext();
        }
      });
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
    playSequence([getAudioUrl(filename)], `నంబర్ ${value} (${teluguSpelling}) పిలుస్తోంది…`);
    return;
  }

  // Two-digit numbers 11-99: dedicated MP3 clip
  if (value >= 11 && value <= 99 && Math.floor(value) === value) {
    playSequence([getAudioUrl(`${value}.mp3`)], `నంబర్ ${value} (${teluguSpelling}) పిలుస్తోంది…`);
    return;
  }

  // 100+: composite sequence
  const remainder = value % 100;
  const urls = [];
  if (remainder >= 11 && remainder <= 99) {
    urls.push(getAudioUrl(`${remainder}.mp3`));
  } else if (remainder >= 1 && remainder <= 10) {
    urls.push(getAudioUrl(`${remainder < 10 ? "0" : ""}${remainder}.wav`));
  }

  if (urls.length > 0) {
    playSequence(urls, `నంబర్ ${value} (${teluguSpelling}) పిలుస్తోంది…`);
  }
}

readSettings();
