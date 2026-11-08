import { readVoiceSettings, saveVoiceSettings } from "./settings.js";
import { createVoicePlayer } from "./player.js";

export function createVoiceControls(elements) {
  const settings = readVoiceSettings();
  const player = createVoicePlayer((message) => {
    elements.status.textContent = message;
  });
  let enabled = settings.enabled;
  elements.language.value = settings.language;

  function statusMessage() {
    if (!enabled) return "Voice off";
    return elements.language.value === "te-IN"
      ? "Telugu voice on · clips 1–10"
      : "English voice on";
  }

  function update() {
    const selectedVoiceAvailable = player.isAvailable(elements.language.value);
    const anyVoiceAvailable = player.isAvailable("en-IN") || player.isAvailable("te-IN");
    elements.toggle.setAttribute("aria-pressed", String(enabled));
    elements.toggle.textContent = enabled ? "Voice on" : "Voice off";
    elements.toggle.disabled = !anyVoiceAvailable;
    elements.language.disabled = !anyVoiceAvailable;
    elements.testButton.disabled = !enabled || !selectedVoiceAvailable;
    elements.status.textContent = anyVoiceAvailable
      ? statusMessage()
      : "Audio is unavailable in this browser.";
  }

  function persist() {
    saveVoiceSettings({ enabled, language: elements.language.value });
  }

  function announce(number) {
    if (!enabled) return;
    player.stop();

    if (elements.language.value === "te-IN") {
      player.speakTeluguNumber(number);
      return;
    }

    player.speakEnglish(`Number ${number}`);
  }

  function connectControls() {
    elements.toggle.addEventListener("click", () => {
      enabled = !enabled;
      persist();
      update();
      if (!enabled) player.stop();
      else if (elements.language.value === "en-IN" && "speechSynthesis" in window) {
        window.speechSynthesis.getVoices();
      }
    });

    elements.language.addEventListener("change", () => {
      player.stop();
      update();
      persist();
    });

    elements.testButton.addEventListener("click", () => {
      player.stop();
      if (elements.language.value === "te-IN") player.speakTeluguNumber(5);
      else player.speakEnglish("Voice test. Number twenty five.");
    });

    update();
  }

  return { announce, connectControls };
}
