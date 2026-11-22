import { WebSocketServer } from "ws";
import { handleConnection } from "./handleConnection.js";
import { startHeartbeat } from "./heartbeat.js";

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false });

  server.on("upgrade", (req, socket, head) => {
    let pathname;
    try {
      const host = req.headers.host || "127.0.0.1";
      const proto = req.headers["x-forwarded-proto"] || "http";
      pathname = new URL(req.url, `${proto}://${host}`).pathname;
    } catch {
      socket.destroy();
      return;
    }

    if (pathname === "/ws") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (ws, req) => {
    handleConnection(ws, req, wss);
  });

  startHeartbeat(wss);

  console.log("🛡️ [WebSocket] Mounted Engine V1: Classic Single Broadcast active on /ws");

  return wss;
}
