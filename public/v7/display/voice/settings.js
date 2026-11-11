const settingsKey = "carecall-v7-display-voice";

export function readVoiceSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(settingsKey) || "{}");
    return {
      enabled: settings.enabled === true,
      language: settings.language === "te-IN" ? "te-IN" : "en-IN"
    };
  } catch {
    return { enabled: false, language: "en-IN" };
  }
}

export function saveVoiceSettings(settings) {
  try {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
  } catch {
    // Voice remains available for this page if browser storage is blocked.
  }
}
