(function () {
  "use strict";

  var root = document.getElementById("displayView");
  var numberElement = root ? root.querySelector("[data-display-number]") : null;
  var elapsedElement = root ? root.querySelector("[data-display-elapsed]") : null;
  var connectionStatus = document.getElementById("connectionStatus");
  var voiceToggle = document.getElementById("voiceToggle");
  var voiceLanguage = document.getElementById("voiceLanguage");
  var testVoice = document.getElementById("testVoice");
  var voiceStatus = document.getElementById("voiceStatus");
  var announcement = null;
  var socket = null;
  var retryTimer = null;
  var retryDelay = 2000;
  var stopped = false;
  var settingsKey = "carecall-v15-display-voice";
  var voiceSettings = { enabled: false, language: "en-IN" };
  var activeAudio = null;

  function setText(element, value) { if (element) element.textContent = value; }

  function elapsedText(milliseconds) {
    var seconds = Math.max(0, Math.floor(milliseconds / 1000));
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    if (seconds < 60) return seconds + "s";
    if (minutes < 60) return minutes + "m " + (seconds % 60) + "s";
    return hours + "h " + (minutes % 60) + "m";
  }

  function render() {
    var value, digits, heightLimit, widthLimit, fontSize, sentAt;
    if (!numberElement || !elapsedElement || !root) return;
    if (!announcement) {
      root.classList.add("is-waiting");
      numberElement.textContent = "";
      numberElement.style.fontSize = "";
      elapsedElement.textContent = "Waiting for next call";
      return;
    }
    root.classList.remove("is-waiting");
    value = String(announcement.number == null ? "" : announcement.number);
    numberElement.textContent = value;
    digits = Math.max(1, value.length);
    heightLimit = (window.innerHeight || document.documentElement.clientHeight) * 0.82;
    widthLimit = (window.innerWidth || document.documentElement.clientWidth) * 0.84 / (digits * 0.68);
    fontSize = Math.max(80, Math.min(heightLimit, widthLimit));
    numberElement.style.fontSize = fontSize + "px";
    sentAt = Number(announcement.sentAt) || new Date().getTime();
    elapsedElement.textContent = "Called " + elapsedText(new Date().getTime() - sentAt) + " ago";
  }

  function readSettings() {
    var parsed;
    try {
      parsed = JSON.parse(window.localStorage.getItem(settingsKey) || "{}");
      voiceSettings.enabled = parsed.enabled === true;
      voiceSettings.language = parsed.language === "te-IN" ? "te-IN" : "en-IN";
    } catch (error) {
      voiceSettings = { enabled: false, language: "en-IN" };
    }
  }

  function saveSettings() {
    try { window.localStorage.setItem(settingsKey, JSON.stringify(voiceSettings)); } catch (error) {}
  }

  function stopVoice() {
    if (activeAudio) {
      activeAudio.onended = null;
      activeAudio.onerror = null;
      try { activeAudio.pause(); activeAudio.currentTime = 0; } catch (error) {}
      activeAudio = null;
    }
  }

  function updateVoiceControls() {
    var available = typeof window.Audio !== "undefined";
    if (voiceToggle) {
      voiceToggle.setAttribute("aria-pressed", voiceSettings.enabled ? "true" : "false");
      voiceToggle.textContent = voiceSettings.enabled ? "Voice on" : "Voice off";
      voiceToggle.disabled = !available;
    }
    if (voiceLanguage) voiceLanguage.disabled = !available;
    if (testVoice) testVoice.disabled = !available || !voiceSettings.enabled;
    setText(voiceStatus, !available
      ? "Audio playback is unavailable in this browser."
      : (voiceSettings.enabled
        ? (voiceSettings.language === "te-IN" ? "Telugu voice enabled · numbers 1–10" : "English voice enabled · numbers 0–999")
        : "Voice is off"));
  }

  function playAudio(url, description) {
    var audio, result;
    if (typeof window.Audio === "undefined") {
      setText(voiceStatus, "Audio playback is unavailable in this browser.");
      return;
    }
    stopVoice();
    audio = new window.Audio(url);
    audio.preload = "auto";
    activeAudio = audio;
    audio.onended = function () {
      if (activeAudio === audio) activeAudio = null;
      setText(voiceStatus, voiceSettings.enabled ? "Voice ready" : "Voice is off");
    };
    audio.onerror = function () {
      if (activeAudio === audio) activeAudio = null;
      setText(voiceStatus, "Audio file could not be loaded. Check the display audio files.");
    };
    try {
      result = audio.play();
      if (result && typeof result.catch === "function") {
        result.catch(function (error) {
          if (activeAudio === audio) activeAudio = null;
          setText(voiceStatus, "Playback blocked by this browser" + (error && error.name ? " (" + error.name + ")" : "") + ". Tap Test voice on the display.");
        });
      }
      setText(voiceStatus, description || "Playing voice…");
    } catch (error) {
      if (activeAudio === audio) activeAudio = null;
      setText(voiceStatus, "Playback failed: " + (error.message || "unknown audio error"));
    }
  }

  function speakEnglish(number) {
    var value = Number(number);
    if (!isFinite(value) || value < 0 || value > 999 || Math.floor(value) !== value) {
      setText(voiceStatus, "English audio supports numbers 0–999.");
      return;
    }
    playAudio("/v15/display/audio/en/" + ("00" + value).slice(-3) + ".mp3", "Speaking number " + value + "…");
  }

  function speakTelugu(number) {
    var value = Number(number);
    if (value < 1 || value > 10 || Math.floor(value) !== value) {
      setText(voiceStatus, "Telugu audio clips are available for numbers 1–10.");
      return;
    }
    playAudio("/v15/display/audio/te/" + (value < 10 ? "0" : "") + value + ".wav", "Speaking number " + value + " in Telugu…");
  }

  function announce(number) {
    if (!voiceSettings.enabled) return;
    if (voiceSettings.language === "te-IN") speakTelugu(number);
    else speakEnglish(number);
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
    var protocol, url, currentSocket;
    if (stopped) return;
    setText(connectionStatus, "Connecting to server…");
    protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    url = protocol + "//" + window.location.host + "/ws?role=display-v15";
    try {
      currentSocket = new window.WebSocket(url);
      socket = currentSocket;
    } catch (error) {
      setText(connectionStatus, "WebSocket unavailable — retrying");
      scheduleReconnect();
      return;
    }

    currentSocket.onopen = function () {
      if (socket !== currentSocket) return;
      retryDelay = 2000;
      setText(connectionStatus, "Connected to server · syncing display");
    };
    currentSocket.onmessage = function (event) {
      var message;
      if (socket !== currentSocket) return;
      try { message = JSON.parse(event.data); }
      catch (error) { setText(connectionStatus, "Server response could not be read"); return; }
      if (message.type === "error") { setText(connectionStatus, "Server: " + message.message); return; }
      if (message.type !== "state") return;
      announcement = message.announcement || null;
      render();
      setText(connectionStatus, message.displayConnected ? "Display connected" : "Connected · display status unavailable");
      if (message.cause === "call" && message.announcement) announce(message.announcement.number);
    };
    currentSocket.onerror = function () {
      if (socket === currentSocket) setText(connectionStatus, "Connection problem · retrying");
    };
    currentSocket.onclose = function (event) {
      if (socket !== currentSocket || stopped) return;
      socket = null;
      setText(connectionStatus, "Disconnected (" + (event.code || 0) + (event.reason ? " · " + event.reason : "") + ") · reconnecting…");
      scheduleReconnect();
    };
  }

  readSettings();
  if (voiceLanguage) voiceLanguage.value = voiceSettings.language;
  updateVoiceControls();

  if (voiceToggle) voiceToggle.onclick = function () {
    voiceSettings.enabled = !voiceSettings.enabled;
    saveSettings();
    updateVoiceControls();
    if (!voiceSettings.enabled) stopVoice();
    else announce(1); // First audio starts directly inside the user's click gesture.
  };

  if (voiceLanguage) voiceLanguage.onchange = function () {
    stopVoice();
    voiceSettings.language = voiceLanguage.value === "te-IN" ? "te-IN" : "en-IN";
    saveSettings();
    updateVoiceControls();
  };

  if (testVoice) testVoice.onclick = function () {
    if (!voiceSettings.enabled) return;
    announce(1); // User gesture: explicitly test the selected local audio file.
  };

  window.onresize = render;
  window.onbeforeunload = function () {
    stopped = true;
    if (retryTimer) window.clearTimeout(retryTimer);
    if (socket && socket.close) socket.close();
    stopVoice();
  };

  render();
  window.setInterval(render, 1000);
  connect();
}());
