export function updateNumberDisplay(element, digits) {
  element.textContent = digits || "—";
}

export function updateSendButtonState(button, hasDigits, isSocketOpen) {
  button.disabled = (!hasDigits || !isSocketOpen);
}

export function updateConnectionStatus(pillElement, text, isConnected) {
  pillElement.classList.toggle("connected", isConnected);
  pillElement.lastChild.textContent = text;
}

export function updateFeedbackMessage(element, message) {
  element.textContent = message;
}
