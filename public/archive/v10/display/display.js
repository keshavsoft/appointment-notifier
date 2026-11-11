import { createDisplayView } from "../shared/display-view.js";
import { connectDisplay } from "./connection.js";
import { createVoiceControls } from "./voice/controls.js";

const displayView = createDisplayView(document.querySelector("#displayView"));
const voice = createVoiceControls({
  toggle: document.querySelector("#voiceToggle"),
  language: document.querySelector("#voiceLanguage"),
  testButton: document.querySelector("#testVoice"),
  status: document.querySelector("#voiceStatus")
});

voice.connectControls();
const connectionStatus = document.querySelector("#connectionStatus");
connectDisplay((message) => {
  if (message.type !== "state") return;

  if (connectionStatus) connectionStatus.textContent = "Display connected";
  displayView.update(message.announcement);
  if (message.cause === "call" && message.announcement) {
    voice.announce(message.announcement.number);
  }
}, (status) => {
  if (connectionStatus) connectionStatus.textContent = status;
});
