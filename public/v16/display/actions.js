import { toggleVoiceState, testVoiceState } from "./audio.js";

export const actions = {
  toggleVoice: () => {
    toggleVoiceState();
  },
  testVoice: () => {
    testVoiceState();
  }
};

export default actions;

