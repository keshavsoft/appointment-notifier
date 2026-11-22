import { onConnect } from "./handlers/onConnect/index.js";
import { onMessage } from "./handlers/onMessage/index.js";
import { onClose } from "./handlers/onClose/index.js";

export function handleConnection(ws, req, wss) {
  onConnect(ws, wss);
  ws.on("message", (raw) => onMessage(raw, ws, wss));
  ws.on("close", () => onClose(wss));
}
