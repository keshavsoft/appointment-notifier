import { getCurrentCall } from "../../state.js";
import { notifyPresence } from "../../broadcast.js";

export function onConnect(ws, wss) {
  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });

  ws.send(JSON.stringify({
    type: "state",
    cause: "sync",
    announcement: getCurrentCall(),
    onlineCount: wss.clients.size
  }));

  notifyPresence(wss);
}
