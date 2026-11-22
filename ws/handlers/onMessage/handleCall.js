import { setCurrentCall } from "../../state.js";
import { broadcast } from "../../broadcast.js";

export function handleCall(message, wss) {
  if (!message.number) return;

  const announcement = setCurrentCall(message.number);

  broadcast(wss, {
    type: "state",
    cause: "call",
    announcement,
    onlineCount: wss.clients.size
  });
}
