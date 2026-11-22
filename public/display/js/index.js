import {
  updateDisplayView,
  updateConnectionStatus,
  updateVoiceButton
} from "./dom.js";
import {
  createAudioContext,
  resumeAudioContext,
  playAnnouncementAudio
} from "./audio.js";
import { createWebSocket, closeWebSocket } from "./websocket.js";

const tokenNum = document.getElementById("tokenNum");
const tokenSpell = document.getElementById("tokenSpell");
const elapsedTime = document.getElementById("elapsedTime");
const connStatusText = document.getElementById("connStatusText");
const voiceToggle = document.getElementById("voiceToggle");

let activeCall = null;
let voiceEnabled = true;
let activeSocket = null;
let audioCtx = null;
const audioCache = {};

function initAudio() {
  if (!audioCtx) {
    audioCtx = createAudioContext();
  }
  resumeAudioContext(audioCtx);
}

function connect() {
  closeWebSocket(activeSocket);

  const socket = createWebSocket({
    onOpen: () => {
      if (activeSocket !== socket) return;
      updateConnectionStatus(connStatusText, "డిస్‌ప్లే కనెక్ట్ అయింది");
    },
    onClose: () => {
      if (activeSocket !== socket) return;
      updateConnectionStatus(connStatusText, "డిస్‌కనెక్ట్ అయింది");
      setTimeout(() => {
        if (activeSocket === socket) connect();
      }, 2000);
    },
    onMessage: (event) => {
      if (activeSocket !== socket) return;
      let data;
      try { data = JSON.parse(event.data); } catch { return; }

      if (data.type === "state" && data.announcement && data.announcement.number) {
        activeCall = data.announcement;
        updateDisplayView(tokenNum, tokenSpell, elapsedTime, activeCall);

        if (data.cause === "call" && voiceEnabled) {
          initAudio();
          playAnnouncementAudio(audioCtx, audioCache, activeCall.number);
        }
      }
    }
  });

  activeSocket = socket;
}

voiceToggle.addEventListener("click", () => {
  voiceEnabled = !voiceEnabled;
  updateVoiceButton(voiceToggle, voiceEnabled);
  initAudio();
});

document.addEventListener("click", initAudio, { once: true });

setInterval(() => {
  if (activeCall && activeCall.sentAt) {
    const sec = Math.max(0, Math.floor((Date.now() - activeCall.sentAt) / 1000));
    elapsedTime.textContent = `${sec}సె క్రితం పిలవబడింది`;
  }
}, 1000);

connect();
