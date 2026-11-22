import { numberToTeluguWords } from "./teluguWords.js";

export function setPill(el, text, ok) {
  if (!el) return;
  el.classList.toggle("connected", Boolean(ok));
  const span = el.querySelector("span") || el;
  el.lastChild.textContent = text;
}

export function formatElapsed(sentAt) {
  if (!sentAt) return "వేచి ఉంది…";
  const sec = Math.max(0, Math.floor((Date.now() - sentAt) / 1000));
  if (sec < 60) return `${sec}సె క్రితం`;
  const min = Math.floor(sec / 60);
  return `${min}ని ${sec % 60}సె క్రితం`;
}

export function renderActive(elements, activeCall, isConnected) {
  const { activeNum, activeWords, activeElapsed, btnRecall } = elements;
  if (!activeCall || !activeCall.number) {
    activeNum.textContent = "--";
    activeWords.textContent = "కాల్ కోసం వేచి ఉంది";
    activeElapsed.textContent = "వేచి ఉంది…";
    btnRecall.disabled = true;
    return;
  }

  activeNum.textContent = activeCall.number;
  const n = Number(activeCall.number);
  activeWords.textContent = isFinite(n) && n >= 0 ? numberToTeluguWords(n) : "";
  activeElapsed.textContent = formatElapsed(activeCall.sentAt);
  btnRecall.disabled = !isConnected;
}

export function updateView(selectedNumber, sendButton, currentDigits, isConnected) {
  selectedNumber.textContent = currentDigits || "—";
  sendButton.disabled = (!currentDigits || !isConnected);
}
