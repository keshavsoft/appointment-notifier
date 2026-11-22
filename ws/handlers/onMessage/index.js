import { handleCall } from "./handleCall.js";

export function onMessage(raw, ws, wss) {
  let message;
  try {
    message = JSON.parse(raw.toString());
  } catch {
    return;
  }

  if (message.type === "call") {
    handleCall(message, wss);
  }
}
