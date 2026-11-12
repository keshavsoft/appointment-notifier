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
  var stopped = false;
  var settingsKey = "carecall-v12-display-voice";
  var voiceSettings = { enabled: false, language: "en-IN" };
  var activeAudio = null;

  function setText(element, value) {
    if (element) element.textContent = value;
  }

  function elapsedText(milliseconds) {
    var seconds = Math.max(0, Math.floor(milliseconds / 1000));
    var minutes;
    var hours;
    if (seconds < 60) return seconds + "s";
    minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + "m " + (seconds % 60) + "s";
    hours = Math.floor(minutes / 60);
    return hours + "h " + (minutes % 60) + "m";
  }

  function render() {
    var value, digits, heightLimit, widthLimit, fontSize, sentAt;
    if (!numberElement || !elapsedElement) return;
    if (!announcement) {
      numberElement.textContent = "";
      numberElement.style.fontSize = "";
      elapsedElement.textContent = "Waiting for next call";
      return;
    }
    value = String(announcement.number == null ? "" : announcement.number);
    numberElement.textContent = value;
    digits = Math.max(1, value.length);
    heightLimit = (window.innerHeight || document.documentElement.clientHeight) * 0.90;
    widthLimit = (window.innerWidth || document.documentElement.clientWidth) * 0.88 / (digits * 0.68);
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
    if (window.speechSynthesis && window.speechSynthesis.cancel) window.speechSynthesis.cancel();
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }
  }

  function speechAvailable() {
    return !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  }

  function updateVoiceControls() {
    var available = voiceSettings.language === "te-IN" ? typeof window.Audio !== "undefined" : speechAvailable();
    if (voiceToggle) {
      voiceToggle.setAttribute("aria-pressed", voiceSettings.enabled ? "true" : "false");
      voiceToggle.textContent = voiceSettings.enabled ? "Voice on" : "Voice off";
      voiceToggle.disabled = !available;
    }
    if (voiceLanguage) voiceLanguage.disabled = !available;
    if (testVoice) testVoice.disabled = !voiceSettings.enabled || !available;
    setText(voiceStatus, available ? (voiceSettings.enabled ? (voiceSettings.language === "te-IN" ? "Telugu voice on · clips 1–10" : "English voice on") : "Voice is off") : "Audio is unavailable in this browser.");
  }

  function speakEnglish(number) {
    var utterance;
    if (!speechAvailable()) { setText(voiceStatus, "English speech is unavailable in this browser."); return; }
    utterance = new window.SpeechSynthesisUtterance("Number " + number);
    utterance.lang = "en-IN";
    utterance.rate = 0.88;
    utterance.onerror = function () { setText(voiceStatus, "English speech could not play on this device."); };
    window.speechSynthesis.speak(utterance);
  }

  function speakTelugu(number) {
    var n = Number(number);
    var filename;
    var audio;
    if (n < 1 || n > 10 || Math.floor(n) !== n) { setText(voiceStatus, "Telugu WAV clips are available for numbers 1–10."); return; }
    filename = (n < 10 ? "0" : "") + n;
    audio = new window.Audio("/v12/display/audio/te/" + filename + ".wav");
    activeAudio = audio;
    audio.onended = function () { if (activeAudio === audio) activeAudio = null; };
    audio.onerror = function () { if (activeAudio === audio) activeAudio = null; setText(voiceStatus, "Telugu clip " + filename + ".wav could not be loaded."); };
    var playResult = audio.play();
    if (playResult && playResult.catch) playResult.catch(function () { if (activeAudio === audio) activeAudio = null; setText(voiceStatus, "Telugu audio could not play on this device."); });
  }

  function announce(number) {
    if (!voiceSettings.enabled) return;
    stopVoice();
    if (voiceSettings.language === "te-IN") speakTelugu(number);
    else speakEnglish(number);
  }

  function connect() {
    var protocol;
    var url;
    if (stopped) return;
    setText(connectionStatus, "Opening WebSocket connection…");
    protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    url = protocol + "//" + window.location.host + "/ws?role=display-v12";
    try {
      socket = new window.WebSocket(url);
    } catch (error) {
      setText(connectionStatus, "WebSocket unavailable: " + (error.message || error));
      scheduleReconnect();
      return;
    }
    socket.onopen = function () { setText(connectionStatus, "Display connected"); };
    socket.onmessage = function (event) {
      var message;
      try { message = JSON.parse(event.data); }
      catch (error) { setText(connectionStatus, "Server sent unreadable data"); return; }
      if (message.type !== "state") return;
      announcement = message.announcement || null;
      render();
      if (message.cause === "call" && message.announcement) announce(message.announcement.number);
    };
    socket.onerror = function () { setText(connectionStatus, "WebSocket error — checking connection…"); };
    socket.onclose = function (event) {
      setText(connectionStatus, "Disconnected (" + (event.code || 0) + ") — reconnecting…");
      scheduleReconnect();
    };
  }

  function scheduleReconnect() {
    if (stopped || retryTimer) return;
    retryTimer = window.setTimeout(function () { retryTimer = null; connect(); }, 3000);
  }

  if (voiceLanguage) voiceLanguage.value = voiceSettings.language;
  readSettings();
  if (voiceLanguage) voiceLanguage.value = voiceSettings.language;
  updateVoiceControls();
  if (voiceToggle) voiceToggle.onclick = function () {
    voiceSettings.enabled = !voiceSettings.enabled;
    saveSettings(); updateVoiceControls();
    if (!voiceSettings.enabled) stopVoice();
    else if (window.speechSynthesis && window.speechSynthesis.getVoices) window.speechSynthesis.getVoices();
  };
  if (voiceLanguage) voiceLanguage.onchange = function () {
    stopVoice(); voiceSettings.language = voiceLanguage.value === "te-IN" ? "te-IN" : "en-IN";
    saveSettings(); updateVoiceControls();
  };
  if (testVoice) testVoice.onclick = function () { announce("1"); };
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
