import { createDisplayView } from "./display-view.js";

const tabs = [...document.querySelectorAll("[data-tab]")];
const panels = {
  call: document.querySelector("#call-panel"),
  preview: document.querySelector("#preview-panel")
};
const selectedNumber = document.querySelector("#selectedNumber");
const sendButton = document.querySelector("#sendCall");
const feedback = document.querySelector("#feedback");
const serverStatus = document.querySelector("#serverStatus");
const displayStatus = document.querySelector("#displayStatus");
const previewDisplayStatus = document.querySelector("#previewDisplayStatus");
const previewView = createDisplayView(document.querySelector("#displayPreview"));
const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
const socket = new WebSocket(`${wsProtocol}//${location.host}/ws?role=doctor-v5`);

let number = "";
let serverConnected = false;

function setPill(element, label, connected) {
  element.classList.toggle("connected", connected);
  element.classList.toggle("offline", !connected);
  element.lastChild.textContent = label;
}

function updateNumber() {
  selectedNumber.textContent = number || "—";
  sendButton.disabled = !number || !serverConnected;
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const selected = tab.dataset.tab;
    tabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
    });
    Object.entries(panels).forEach(([name, panel]) => { panel.hidden = name !== selected; });
  });
});

document.querySelectorAll("[data-digit]").forEach((button) => {
  button.addEventListener("click", () => {
    if (number.length < 3) number += button.dataset.digit;
    updateNumber();
  });
});

document.querySelector('[data-action="clear"]').addEventListener("click", () => {
  number = "";
  updateNumber();
});

document.querySelector('[data-action="backspace"]').addEventListener("click", () => {
  number = number.slice(0, -1);
  updateNumber();
});

sendButton.addEventListener("click", () => {
  if (!number || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: "call", number }));
  feedback.textContent = "Sending call to the display…";
  number = "";
  updateNumber();
});

socket.addEventListener("open", () => {
  serverConnected = true;
  setPill(serverStatus, "Server connected", true);
  updateNumber();
});

socket.addEventListener("close", () => {
  serverConnected = false;
  setPill(serverStatus, "Server offline", false);
  updateNumber();
});

socket.addEventListener("error", () => {
  serverConnected = false;
  setPill(serverStatus, "Connection problem", false);
  updateNumber();
});

socket.addEventListener("message", (event) => {
  let data;
  try {
    data = JSON.parse(event.data);
  } catch {
    feedback.textContent = "Received an unreadable server response.";
    return;
  }

  if (data.type === "error") {
    feedback.textContent = data.message;
    return;
  }

  if (data.type !== "state") return;

  previewView.update(data.announcement);
  const connected = Boolean(data.displayConnected);
  setPill(displayStatus, connected ? "Display connected" : "Display offline", connected);
  setPill(previewDisplayStatus, connected ? "Display connected" : "Display offline", connected);

  if (data.cause === "call") {
    feedback.textContent = data.delivered
      ? `Now showing ${data.announcement.number} on the display.`
      : `Call ${data.announcement.number} saved. It will appear when the display reconnects.`;
  }
});

updateNumber();
