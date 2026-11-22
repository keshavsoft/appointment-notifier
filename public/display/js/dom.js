import { numberToTeluguWords } from "./teluguWords.js";

export function updateDisplayView(tokenNum, tokenSpell, elapsedTime, activeCall) {
  if (!activeCall || !activeCall.number) {
    tokenNum.textContent = "--";
    tokenSpell.textContent = "కాల్ కోసం వేచి ఉంది…";
    elapsedTime.textContent = "తదుపరి కాల్ కోసం వేచి ఉంది";
    return;
  }

  tokenNum.textContent = activeCall.number;
  const n = Number(activeCall.number);
  tokenSpell.textContent = (isFinite(n) && n >= 0) ? numberToTeluguWords(n) : "";

  const sec = Math.max(0, Math.floor((Date.now() - (activeCall.sentAt || Date.now())) / 1000));
  elapsedTime.textContent = `${sec}సె క్రితం పిలవబడింది`;
}

export function updateConnectionStatus(statusTextEl, text) {
  statusTextEl.textContent = text;
}

export function updateVoiceButton(button, voiceEnabled) {
  button.textContent = voiceEnabled ? "🔊 వాయిస్ ఆన్" : "🔇 మ్యూట్";
  button.classList.toggle("muted", !voiceEnabled);
}
