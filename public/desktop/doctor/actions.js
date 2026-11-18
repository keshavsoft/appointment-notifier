let handlers = {};

export function registerDoctorHandlers(h) {
  handlers = h;
}

export const actions = {
  pressDigit: (event, matchElement) => {
    const digit = matchElement.getAttribute("data-digit");
    if (digit && handlers.onDigit) handlers.onDigit(digit);
  },
  clearNumber: () => {
    if (handlers.onClear) handlers.onClear();
  },
  backspaceNumber: () => {
    if (handlers.onBackspace) handlers.onBackspace();
  },
  sendCall: () => {
    if (handlers.onSend) handlers.onSend();
  },
  switchTab: (event, matchElement) => {
    const tab = matchElement.getAttribute("data-tab");
    if (tab && handlers.onSwitchTab) handlers.onSwitchTab(tab);
  }
};

export default actions;

