import { toggleVoiceState, testVoiceState } from "./audio.js?v=16.5";

const actions = {
  toggleVoice: () => {
    toggleVoiceState();
  },
  testVoice: () => {
    testVoiceState();
  }
};

export default actions;
