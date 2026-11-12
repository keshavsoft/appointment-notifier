(function () {
  "use strict";
  var tabs = document.querySelectorAll("[data-tab]");
  var panels = { call: document.getElementById("call-panel"), preview: document.getElementById("preview-panel") };
  var selectedNumber = document.getElementById("selectedNumber");
  var sendButton = document.getElementById("sendCall");
  var feedback = document.getElementById("feedback");
  var serverStatus = document.getElementById("serverStatus");
  var displayStatus = document.getElementById("displayStatus");
  var previewDisplayStatus = document.getElementById("previewDisplayStatus");
  var previewRoot = document.getElementById("displayPreview");
  var number = "";
  var serverConnected = false;
  var socket;
  function setPill(element, label, connected) {
    if (!element) return;
    if (element.classList) {
      if (connected) { element.classList.add("connected"); element.classList.remove("offline"); }
      else { element.classList.add("offline"); element.classList.remove("connected"); }
    }
    if (element.lastChild) element.lastChild.textContent = label;
  }
  function renderPreview(announcement) {
    var numberEl = previewRoot.querySelector("[data-display-number]");
    var elapsedEl = previewRoot.querySelector("[data-display-elapsed]");
    var value, age, sec, min, hrs;
    if (!announcement) { numberEl.textContent = "—"; elapsedEl.textContent = "Waiting for next call"; return; }
    value = String(announcement.number == null ? "" : announcement.number);
    numberEl.textContent = value;
    numberEl.style.fontSize = Math.max(60, Math.min(window.innerHeight * 0.42, window.innerWidth * 0.5 / Math.max(1, value.length))) + "px";
    age = Math.max(0, Math.floor((new Date().getTime() - (Number(announcement.sentAt) || new Date().getTime())) / 1000));
    sec = age % 60; min = Math.floor(age / 60); hrs = Math.floor(min / 60);
    elapsedEl.textContent = "Called " + (hrs ? hrs + "h " + (min % 60) + "m" : min ? min + "m " + sec + "s" : sec + "s") + " ago";
  }
  function updateNumber() { selectedNumber.textContent = number || "—"; sendButton.disabled = !number || !serverConnected; }
  function each(list, callback) { var i; for (i = 0; i < list.length; i++) callback(list[i], i); }
  each(tabs, function (tab) { tab.onclick = function () {
    var selected = tab.getAttribute("data-tab");
    each(tabs, function (item) { var active = item === tab; if (active) item.classList.add("active"); else item.classList.remove("active"); item.setAttribute("aria-selected", active ? "true" : "false"); });
    panels.call.hidden = selected !== "call"; panels.preview.hidden = selected !== "preview";
  }; });
  each(document.querySelectorAll("[data-digit]"), function (button) { button.onclick = function () { if (number.length < 3) number += button.getAttribute("data-digit"); updateNumber(); }; });
  document.querySelector('[data-action="clear"]').onclick = function () { number = ""; updateNumber(); };
  document.querySelector('[data-action="backspace"]').onclick = function () { number = number.slice(0, -1); updateNumber(); };
  sendButton.onclick = function () {
    if (!number || !socket || socket.readyState !== 1) return;
    socket.send(JSON.stringify({ type: "call", number: number }));
    feedback.textContent = "Sending call to the display…"; number = ""; updateNumber();
  };
  function connect() {
    var protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    socket = new window.WebSocket(protocol + "//" + window.location.host + "/ws?role=doctor-v12");
    socket.onopen = function () { serverConnected = true; setPill(serverStatus, "Server connected", true); updateNumber(); };
    socket.onclose = function () { serverConnected = false; setPill(serverStatus, "Server offline", false); updateNumber(); };
    socket.onerror = function () { serverConnected = false; setPill(serverStatus, "Connection problem", false); updateNumber(); };
    socket.onmessage = function (event) {
      var data;
      try { data = JSON.parse(event.data); } catch (error) { feedback.textContent = "Received an unreadable server response."; return; }
      if (data.type === "error") { feedback.textContent = data.message; return; }
      if (data.type !== "state") return;
      renderPreview(data.announcement);
      var connected = !!data.displayConnected;
      setPill(displayStatus, connected ? "Display connected" : "Display offline", connected);
      setPill(previewDisplayStatus, connected ? "Display connected" : "Display offline", connected);
      if (data.cause === "call" && data.announcement) feedback.textContent = data.delivered ? "Now showing " + data.announcement.number + " on the display." : "Call " + data.announcement.number + " saved. It will appear when the display reconnects.";
    };
  }
  updateNumber();
  connect();
}());
