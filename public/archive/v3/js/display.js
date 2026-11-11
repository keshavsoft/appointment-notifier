import { createDisplayView } from "./display-view.js";

const displayView = createDisplayView(document.querySelector("#displayView"));
const voiceButton = document.querySelector("#enableVoice");
const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
const socket = new WebSocket(`${wsProtocol}//${location.host}/ws?role=display-v3`);
let voiceEnabled = false;
const speechAvailable = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

if (!speechAvailable) {
  voiceButton.textContent = "Voice unavailable";
  voiceButton.disabled = true;
}

voiceButton.addEventListener("click", () => {
  if (!speechAvailable) return;
  voiceEnabled = true;
  voiceButton.hidden = true;
  window.speechSynthesis.getVoices();
});

socket.addEventListener("message", (event) => {
  let data;
  try {
    data = JSON.parse(event.data);
  } catch {
    return;
  }

  if (data.type !== "state") return;
  displayView.update(data.announcement);

  if (data.cause === "call" && voiceEnabled && data.announcement && speechAvailable) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`Number ${data.announcement.number}`);
    utterance.lang = "en-IN";
    utterance.rate = 0.88;
    window.speechSynthesis.speak(utterance);
  }
});
