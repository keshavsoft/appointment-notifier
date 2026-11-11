import { createDisplayView } from "../shared/display-view.js";
import { connectDisplay } from "./display/connection.js";
import { createVoiceControls } from "./display/voice/controls.js";

const displayView = createDisplayView(document.querySelector("#displayView"));
const voice = createVoiceControls({
  toggle: document.querySelector("#voiceToggle"),
  language: document.querySelector("#voiceLanguage"),
  testButton: document.querySelector("#testVoice"),
  status: document.querySelector("#voiceStatus")
});

voice.connectControls();
connectDisplay((message) => {
  if (message.type !== "state") return;

  displayView.update(message.announcement);
  if (message.cause === "call" && message.announcement) {
    voice.announce(message.announcement.number);
  }
});
