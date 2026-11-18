import { toggleVoiceState, testVoiceState } from "./audio.js?v=17.0";

const actions = {
  toggleVoice: () => {
    toggleVoiceState();
  },
  testVoice: () => {
    testVoiceState();
  }
};

export default actions;
