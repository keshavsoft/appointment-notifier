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
  var settingsKey = "carecall-v13-display-voice";
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
    } catch (error) { voiceSettings = { enabled: false, language: "en-IN" }; }
  }
  function saveSettings() {
    try { window.localStorage.setItem(settingsKey, JSON.stringify(voiceSettings)); } catch (error) {}
  }
  function stopVoice() {
    if (window.speechSynthesis && window.speechSynthesis.cancel) window.speechSynthesis.cancel();
    if (activeAudio) { activeAudio.pause(); activeAudio.currentTime = 0; activeAudio = null; }
  }
  function speechAvailable() { return !!(window.speechSynthesis && window.SpeechSynthesisUtterance); }
  function updateVoiceControls() {
    var englishAvailable = speechAvailable();
    var teluguAvailable = typeof window.Audio !== "undefined";
    var selectedAvailable = voiceSettings.language === "te-IN" ? teluguAvailable : englishAvailable;
    if (voiceToggle) {
      voiceToggle.setAttribute("aria-pressed", voiceSettings.enabled ? "true" : "false");
      voiceToggle.textContent = voiceSettings.enabled ? "Voice on" : "Voice off";
      voiceToggle.disabled = !selectedAvailable;
    }
    // Keep the language selector usable when only one of the two audio APIs exists.
    if (voiceLanguage) voiceLanguage.disabled = !englishAvailable && !teluguAvailable;
    if (testVoice) testVoice.disabled = !voiceSettings.enabled || !selectedAvailable;
    setText(voiceStatus, !selectedAvailable ? (voiceSettings.language === "te-IN" ? "Telugu audio is unavailable in this browser." : "English speech is unavailable in this browser.") : (voiceSettings.enabled ? (voiceSettings.language === "te-IN" ? "Telugu voice enabled · clips 1–10" : "English voice enabled") : "Voice is off"));
  }
  function speakEnglish(number) {
    var utterance;
    if (!speechAvailable()) { setText(voiceStatus, "English speech is unavailable on this TV browser."); return; }
    utterance = new window.SpeechSynthesisUtterance("Number " + number);
    utterance.lang = "en-IN";
    utterance.rate = 0.88;
    utterance.onerror = function () { setText(voiceStatus, "English speech could not play on this device."); };
    window.speechSynthesis.speak(utterance);
  }
  function speakTelugu(number) {
    var n = Number(number), filename, audio, playResult;
    if (n < 1 || n > 10 || Math.floor(n) !== n) { setText(voiceStatus, "Telugu WAV clips are available for numbers 1–10."); return; }
    filename = (n < 10 ? "0" : "") + n;
    audio = new window.Audio("/v13/display/audio/te/" + filename + ".wav");
    activeAudio = audio;
    audio.onended = function () { if (activeAudio === audio) activeAudio = null; };
    audio.onerror = function () { if (activeAudio === audio) activeAudio = null; setText(voiceStatus, "Telugu audio clip could not be loaded."); };
    playResult = audio.play();
    if (playResult && playResult.catch) playResult.catch(function () { if (activeAudio === audio) activeAudio = null; setText(voiceStatus, "Telugu audio could not play on this device."); });
  }
  function announce(number) {
    if (!voiceSettings.enabled) return;
    stopVoice();
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
    url = protocol + "//" + window.location.host + "/ws?role=display-v13";
    try { currentSocket = new window.WebSocket(url); socket = currentSocket; }
    catch (error) { setText(connectionStatus, "WebSocket unavailable — retrying"); scheduleReconnect(); return; }

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
      setText(connectionStatus, "Disconnected (" + (event.code || 0) + ") · reconnecting…");
      scheduleReconnect();
    };
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
    stopVoice();
    voiceSettings.language = voiceLanguage.value === "te-IN" ? "te-IN" : "en-IN";
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
