const speechAvailable = "speechSynthesis" in window
  && "SpeechSynthesisUtterance" in window;
const audioAvailable = typeof Audio !== "undefined";

export function createVoicePlayer(setStatus) {
  let activeAudio = null;

  function stop() {
    if (speechAvailable) window.speechSynthesis.cancel();
    if (!activeAudio) return;

    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }

  function speakEnglish(text) {
    if (!speechAvailable) {
      setStatus("English speech is unavailable in this browser.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.88;
    utterance.onerror = () => setStatus("English speech could not play on this device.");
    window.speechSynthesis.speak(utterance);
  }

  function speakTeluguNumber(number) {
    const numericNumber = Number(number);
    if (!Number.isInteger(numericNumber) || numericNumber < 1 || numericNumber > 10) {
      setStatus("Telugu WAV clips are available for numbers 1–10.");
      return;
    }

    if (!audioAvailable) {
      setStatus("Telugu audio is unavailable in this browser.");
      return;
    }

    const filename = String(numericNumber).padStart(2, "0");
    activeAudio = new Audio(`/v5/audio/te/${filename}.wav`);
    const currentAudio = activeAudio;
    currentAudio.addEventListener("ended", () => {
      if (activeAudio === currentAudio) activeAudio = null;
    }, { once: true });
    currentAudio.addEventListener("error", () => {
      if (activeAudio === currentAudio) activeAudio = null;
      setStatus(`Telugu clip ${filename}.wav could not be loaded.`);
    }, { once: true });
    currentAudio.play().catch(() => {
      if (activeAudio === currentAudio) activeAudio = null;
      setStatus("Telugu audio could not play on this device.");
    });
  }

  return {
    isAvailable(language) {
      return language === "te-IN" ? audioAvailable : speechAvailable;
    },
    stop,
    speakEnglish,
    speakTeluguNumber
  };
}
