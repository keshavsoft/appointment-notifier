(function () {
  "use strict";

  var root = document.getElementById("displayView");
  var numberElement = root ? root.querySelector("[data-display-number]") : null;
  var spellingElement = root ? root.querySelector("[data-display-spelling]") : null;
  var elapsedElement = root ? root.querySelector("[data-display-elapsed]") : null;
  var connectionStatus = document.getElementById("connectionStatus");
  var voiceToggle = document.getElementById("voiceToggle");
  var testVoice = document.getElementById("testVoice");
  var voiceStatus = document.getElementById("voiceStatus");

  var announcement = null;
  var socket = null;
  var retryTimer = null;
  var retryDelay = 2000;
  var stopped = false;
  var lastAnnouncedCallKey = null;

  var settingsKey = "carecall-v17-display-voice-telugu";
  var voiceSettings = { enabled: false, language: "te-IN" };
  var activeAudio = null;
  var currentPlaylist = [];
  var playlistIndex = 0;
  var playbackSessionId = 0;
  var audioContext = null;

  function setText(element, value) {
    if (element) element.textContent = value;
  }

  function elapsedText(milliseconds) {
    var seconds = Math.max(0, Math.floor(milliseconds / 1000));
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    if (seconds < 60) return seconds + "సె";
    if (minutes < 60) return minutes + "ని " + (seconds % 60) + "సె";
    return hours + "గం " + (minutes % 60) + "ని";
  }

  var TELUGU_UNITS = [
    "సున్నా", "ఒకటి", "రెండు", "మూడు", "నాలుగు", "ఐదు",
    "ఆరు", "ఏడు", "ఎనిమిది", "తొమ్మిది", "పది",
    "పదకొండు", "పన్నెండు", "పదమూడు", "పద్నాలుగు", "పదిహేను",
    "పదహారు", "పదిహేడు", "పద్దెనిమిది", "పంతొమ్మిది"
  ];

  var TELUGU_TENS = [
    "", "", "ఇరవై", "ముప్పై", "నలభై", "యాభై",
    "అరవై", "డెబ్బై", "ఎనభై", "తొంభై"
  ];

  function numberToTeluguWords(num) {
    var n = Math.floor(Number(num));
    if (!isFinite(n) || n < 0 || n > 999) return String(num);
    if (n < 20) return TELUGU_UNITS[n];
    if (n < 100) {
      var tens = Math.floor(n / 10);
      var rem = n % 10;
      return rem === 0 ? TELUGU_TENS[tens] : (TELUGU_TENS[tens] + " " + TELUGU_UNITS[rem]);
    }
    var hundreds = Math.floor(n / 100);
    var rem100 = n % 100;
    var hundredText = hundreds === 1 ? "వంద" : (TELUGU_UNITS[hundreds] + " వందల");
    if (rem100 === 0) return hundredText;
    return hundredText + " " + numberToTeluguWords(rem100);
  }

  function render() {
    if (!numberElement || !elapsedElement || !root) return;
    if (!announcement) {
      root.classList.add("is-waiting");
      numberElement.textContent = "";
      if (spellingElement) spellingElement.textContent = "";
      elapsedElement.textContent = "తదుపరి కాల్ కోసం వేచి ఉంది";
      return;
    }
    root.classList.remove("is-waiting");
    var value = String(announcement.number == null ? "" : announcement.number);
    numberElement.textContent = value;
    var numVal = Number(value);
    if (spellingElement) {
      spellingElement.textContent = isFinite(numVal) && numVal >= 0 ? numberToTeluguWords(numVal) : "";
    }
    var digits = Math.max(1, value.length);
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var vw = window.innerWidth || document.documentElement.clientWidth;
    var heightLimit = vh * 0.32;
    var widthLimit = (vw * 0.65) / (digits * 0.65);
    var fontSize = Math.max(64, Math.min(heightLimit, widthLimit));
    numberElement.style.fontSize = fontSize + "px";
    var sentAt = Number(announcement.sentAt) || new Date().getTime();
    elapsedElement.textContent = elapsedText(new Date().getTime() - sentAt) + " క్రితం పిలవబడింది";
  }

  function readSettings() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(settingsKey) || "{}");
      voiceSettings.enabled = parsed.enabled === true;
      voiceSettings.language = "te-IN";
    } catch (e) {
      voiceSettings = { enabled: false, language: "te-IN" };
    }
  }

  function saveSettings() {
    try {
      window.localStorage.setItem(settingsKey, JSON.stringify(voiceSettings));
    } catch (e) {}
  }

  function unlockAudio() {
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      try {
        if (!audioContext) audioContext = new AudioCtx();
        if (audioContext.state === "suspended") audioContext.resume();
        var buffer = audioContext.createBuffer(1, 1, 22050);
        var source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
      } catch (e) {}
    }
  }

  function stopVoice() {
    playbackSessionId++;
    currentPlaylist = [];
    playlistIndex = 0;
    if (activeAudio) {
      activeAudio.onended = null;
      activeAudio.onerror = null;
      try {
        activeAudio.pause();
        activeAudio.currentTime = 0;
      } catch (e) {}
      activeAudio = null;
    }
  }

  function setVoiceStatusText(text) {
    if (voiceStatus) voiceStatus.textContent = text;
  }

  function updateVoiceControls() {
    var available = typeof window.Audio !== "undefined";
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

  function getAudioUrl(filename) {
    return "./audio/te/" + filename;
  }

  function playSequence(urls, label) {
    stopVoice();
    if (!urls.length) return;
    var thisSession = playbackSessionId;
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
      var url = currentPlaylist[playlistIndex];
      playlistIndex++;
      var audio = new window.Audio(url);
      audio.preload = "auto";
      activeAudio = audio;
      audio.onended = function () {
        if (thisSession === playbackSessionId) playNext();
      };
      audio.onerror = function (err) {
        console.warn("Audio load error on:", url, err);
        if (thisSession === playbackSessionId) playNext();
      };
      try {
        var p = audio.play();
        if (p && typeof p.catch === "function") {
          p.catch(function (err) {
            console.warn("Audio play rejected by browser policy:", err);
            if (thisSession === playbackSessionId) {
              setVoiceStatusText("ప్లేబ్యాక్ ఆపబడింది. స్క్రీన్ పై ట్యాప్ చేయండి.");
            }
          });
        }
      } catch (e) {
        if (thisSession === playbackSessionId) playNext();
      }
    }

    playNext();
  }

  function announce(number) {
    if (!voiceSettings.enabled) return;
    var value = Number(number);
    if (!isFinite(value) || value < 0) return;

    var teluguSpelling = numberToTeluguWords(value);

    // Single numbers 1-10: use local 01.wav to 10.wav
    if (value >= 1 && value <= 10 && Math.floor(value) === value) {
      var filename = (value < 10 ? "0" : "") + value + ".wav";
      playSequence([getAudioUrl(filename)], "నంబర్ " + value + " (" + teluguSpelling + ") పిలుస్తోంది…");
      return;
    }

    // Two-digit numbers 11-99: dedicated MP3 clip
    if (value >= 11 && value <= 99 && Math.floor(value) === value) {
      playSequence([getAudioUrl(value + ".mp3")], "నంబర్ " + value + " (" + teluguSpelling + ") పిలుస్తోంది…");
      return;
    }

    // 100+: composite
    var remainder = value % 100;
    var urls = [];
    if (remainder >= 11 && remainder <= 99) {
      urls.push(getAudioUrl(remainder + ".mp3"));
    } else if (remainder >= 1 && remainder <= 10) {
      urls.push(getAudioUrl((remainder < 10 ? "0" : "") + remainder + ".wav"));
    }

    if (urls.length > 0) {
      playSequence(urls, "నంబర్ " + value + " (" + teluguSpelling + ") పిలుస్తోంది…");
    }
  }

  function toggleVoiceState() {
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

  function testVoiceState() {
    unlockAudio();
    if (!voiceSettings.enabled) return;
    announce(1);
  }

  function scheduleReconnect() {
    if (stopped || retryTimer) return;
    retryTimer = window.setTimeout(function () {
      retryTimer = null;
      connect();
    }, retryDelay);
    retryDelay = Math.min(30000, Math.round(retryDelay * 1.7));
  }

  function connect() {
    if (stopped) return;
    if (socket) {
      try {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close();
      } catch (e) {}
      socket = null;
    }

    setText(connectionStatus, "సర్వర్‌కి కనెక్ట్ అవుతోంది…");
    var protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    var url = protocol + "//" + window.location.host + "/ws?role=display-v17";
    var currentSocket;

    try {
      currentSocket = new window.WebSocket(url);
      socket = currentSocket;
    } catch (e) {
      setText(connectionStatus, "వెబ్‌సాకెట్ అందుబాటులో లేదు — మళ్లీ ప్రయత్నిస్తోంది");
      scheduleReconnect();
      return;
    }

    currentSocket.onopen = function () {
      if (socket !== currentSocket) return;
      retryDelay = 2000;
      setText(connectionStatus, "సర్వర్‌కి కనెక్ట్ అయింది · సమన్వయం చేస్తోంది");
    };

    currentSocket.onmessage = function (event) {
      if (socket !== currentSocket) return;
      var message;
      try {
        message = JSON.parse(event.data);
      } catch (e) {
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

      if (message.cause === "call" && message.announcement && message.announcement.number) {
        var callKey = message.announcement.number + "#" + (message.announcement.sentAt || 0);
        if (lastAnnouncedCallKey !== callKey) {
          lastAnnouncedCallKey = callKey;
          announce(message.announcement.number);
        }
      }
    };

    currentSocket.onerror = function () {
      if (socket === currentSocket) {
        setText(connectionStatus, "కనెక్షన్ సమస్య · మళ్లీ ప్రయత్నిస్తోంది");
      }
    };

    currentSocket.onclose = function () {
      if (socket !== currentSocket || stopped) return;
      socket = null;
      setText(connectionStatus, "డిస్‌కనెక్ట్ అయింది · మళ్లీ కనెక్ట్ అవుతోంది…");
      scheduleReconnect();
    };
  }

  // Bind controls directly (100% reliable on TV without async JSON fetching)
  if (voiceToggle) {
    voiceToggle.onclick = function () {
      toggleVoiceState();
    };
  }
  if (testVoice) {
    testVoice.onclick = function () {
      testVoiceState();
    };
  }

  // Audio unlock triggers on user interaction
  window.addEventListener("click", unlockAudio);
  window.addEventListener("touchstart", unlockAudio);
  window.addEventListener("keydown", unlockAudio);
  window.addEventListener("resize", render);

  window.addEventListener("beforeunload", function () {
    stopped = true;
    if (retryTimer) window.clearTimeout(retryTimer);
    if (socket) {
      try { socket.close(); } catch (e) {}
    }
    stopVoice();
  });

  readSettings();
  updateVoiceControls();
  render();
  window.setInterval(render, 1000);
  connect();
})();
