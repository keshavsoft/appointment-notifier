let currentCall = null;

export function getCurrentCall() {
  return currentCall;
}

export function setCurrentCall(number) {
  currentCall = {
    number: String(number).trim(),
    sentAt: Date.now()
  };
  return currentCall;
}
