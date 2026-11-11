const messageEl = document.querySelector("#screenMessage");
const hintEl = document.querySelector("#screenHint");
const elapsedEl = document.querySelector("#elapsedTime");
const connectionEl = document.querySelector("#screenConnection");
const audioButton = document.querySelector("#enableAudio");
const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
const socket = new WebSocket(`${wsProtocol}//${location.host}/ws?role=reception`);
let announcedAt = null;
let audioEnabled = false;

audioButton.addEventListener("click", () => {
    audioEnabled = true;
    audioButton.textContent = "Voice announcements enabled";
    audioButton.disabled = true;
    speechSynthesis.getVoices();
});

socket.addEventListener("open", () => {
    connectionEl.textContent = "LIVE";
    connectionEl.parentElement.classList.add("connected");
});
socket.addEventListener("close", () => {
    connectionEl.textContent = "DISCONNECTED";
    connectionEl.parentElement.classList.remove("connected");
});
socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.type !== "announcement") return;
    messageEl.textContent = data.message;
    hintEl.textContent = "Please proceed to the reception counter.";
    announcedAt = data.sentAt || Date.now();
    if (audioEnabled && "speechSynthesis" in window) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`Number ${data.message}, please proceed to reception.`);
        utterance.lang = "en-IN";
        utterance.rate = 0.82;
        speechSynthesis.speak(utterance);
    }
});

function updateElapsed() {
    if (!announcedAt) return;
    const seconds = Math.max(0, Math.floor((Date.now() - announcedAt) / 1000));
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    elapsedEl.textContent = mins ? `${mins}m ${secs}s` : `${secs}s`;
}
setInterval(updateElapsed, 1000);
