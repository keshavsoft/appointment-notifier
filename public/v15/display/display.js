(function () {
  "use strict";

  var root = document.getElementById("displayView");
  var numberElement = root ? root.querySelector("[data-display-number]") : null;
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
  var settingsKey = "carecall-v15-display-voice-telugu";
  var voiceSettings = { enabled: false, language: "te-IN" };
  var activeAudio = null;

  function setText(element, value) { if (element) element.textContent = value; }

  function elapsedText(milliseconds) {
    var seconds = Math.max(0, Math.floor(milliseconds / 1000));
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    if (seconds < 60) return seconds + "సె";
    if (minutes < 60) return minutes + "ని " + (seconds % 60) + "సె";
    return hours + "గం " + (minutes % 60) + "ని";
  }

  function render() {
    var value, digits, heightLimit, widthLimit, fontSize, sentAt;
    if (!numberElement || !elapsedElement || !root) return;
    if (!announcement) {
      root.classList.add("is-waiting");
      numberElement.textContent = "";
      numberElement.style.fontSize = "";
      elapsedElement.textContent = "తదుపరి కాల్ కోసం వేచి ఉంది";
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
    elapsedElement.textContent = elapsedText(new Date().getTime() - sentAt) + " క్రితం పిలవబడింది";
  }

  function readSettings() {
    var parsed;
    try {
      parsed = JSON.parse(window.localStorage.getItem(settingsKey) || "{}");
      voiceSettings.enabled = parsed.enabled === true;
      voiceSettings.language = "te-IN";
    } catch (error) {
      voiceSettings = { enabled: false, language: "te-IN" };
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
      voiceToggle.textContent = voiceSettings.enabled ? "వాయిస్ ఆన్" : "వాయిస్ ఆఫ్";
      voiceToggle.disabled = !available;
    }
    if (testVoice) testVoice.disabled = !available || !voiceSettings.enabled;
    setText(voiceStatus, !available
      ? "ఈ బ్రౌజర్‌లో ఆడియో ప్లేబ్యాక్ అందుబాటులో లేదు."
      : (voiceSettings.enabled
        ? "తెలుగు వాయిస్ సిద్ధంగా ఉంది"
        : "వాయిస్ ఆఫ్ చేయబడింది"));
  }

  function playAudio(url, description) {
    var audio, result;
    if (typeof window.Audio === "undefined") {
      setText(voiceStatus, "ఈ బ్రౌజర్‌లో ఆడియో అందుబాటులో లేదు.");
      return;
    }
    stopVoice();
    audio = new window.Audio(url);
    audio.preload = "auto";
    activeAudio = audio;
    audio.onended = function () {
      if (activeAudio === audio) activeAudio = null;
      setText(voiceStatus, voiceSettings.enabled ? "వాయిస్ సిద్ధంగా ఉంది" : "వాయిస్ ఆఫ్ చేయబడింది");
    };
    audio.onerror = function () {
      if (activeAudio === audio) activeAudio = null;
      setText(voiceStatus, "ఆడియో ఫైల్ లోడ్ కాలేదు.");
    };
    try {
      result = audio.play();
      if (result && typeof result.catch === "function") {
        result.catch(function (error) {
          if (activeAudio === audio) activeAudio = null;
          setText(voiceStatus, "ప్లేబ్యాక్ ఆపబడింది. స్క్రీన్ పై ట్యాప్ చేయండి.");
        });
      }
      setText(voiceStatus, description || "వాయిస్ ప్లే అవుతోంది…");
    } catch (error) {
      if (activeAudio === audio) activeAudio = null;
      setText(voiceStatus, "ఆడియో లోపం: " + (error.message || "error"));
    }
  }

  function speakTelugu(number) {
    var value = Number(number);
    if (value < 1 || value > 10 || Math.floor(value) !== value) {
      setText(voiceStatus, "తెలుగు ఆడియో క్లిప్‌లు 1–10 నంబర్లకు అందుబాటులో ఉన్నాయి.");
      return;
    }
    playAudio("/v15/display/audio/te/" + (value < 10 ? "0" : "") + value + ".wav", "నంబర్ " + value + " పిలుస్తోంది…");
  }

  function announce(number) {
    if (!voiceSettings.enabled) return;
    speakTelugu(number);
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
    setText(connectionStatus, "సర్వర్‌కి కనెక్ట్ అవుతోంది…");
    protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    url = protocol + "//" + window.location.host + "/ws?role=display-v15";
    try {
      currentSocket = new window.WebSocket(url);
      socket = currentSocket;
    } catch (error) {
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
      var message;
      if (socket !== currentSocket) return;
      try { message = JSON.parse(event.data); }
      catch (error) { setText(connectionStatus, "సందేశాన్ని చదవడం సాధ్యం కాలేదు"); return; }
      if (message.type === "error") { setText(connectionStatus, "సర్వర్: " + message.message); return; }
      if (message.type !== "state") return;
      announcement = message.announcement || null;
      render();
      setText(connectionStatus, message.displayConnected ? "డిస్‌ప్లే కనెక్ట్ అయింది" : "సర్వర్‌కి కనెక్ట్ అయింది");
      if (message.cause === "call" && message.announcement) announce(message.announcement.number);
    };
    currentSocket.onerror = function () {
      if (socket === currentSocket) setText(connectionStatus, "కనెక్షన్ సమస్య · మళ్లీ ప్రయత్నిస్తోంది");
    };
    currentSocket.onclose = function (event) {
      if (socket !== currentSocket || stopped) return;
      socket = null;
      setText(connectionStatus, "డిస్‌కనెక్ట్ అయింది · మళ్లీ కనెక్ట్ అవుతోంది…");
      scheduleReconnect();
    };
  }

  readSettings();
  updateVoiceControls();

  if (voiceToggle) voiceToggle.onclick = function () {
    voiceSettings.enabled = !voiceSettings.enabled;
    saveSettings();
    updateVoiceControls();
    if (!voiceSettings.enabled) stopVoice();
    else announce(1); // User click gesture starts Telugu audio immediately
  };

  if (testVoice) testVoice.onclick = function () {
    if (!voiceSettings.enabled) return;
    announce(1); // User test gesture
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
