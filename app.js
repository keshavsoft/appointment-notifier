import http from "node:http";
import { fileURLToPath } from "node:url";
import sirv from "sirv";
import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT) || 3000;
const publicDir = fileURLToPath(new URL("./public/", import.meta.url));

const serveStatic = sirv(publicDir, {
  dev: true,
  extensions: ["html"],
  setHeaders(res) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
  }
});

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;

  // Clean, declarative route mapping
  if (path === "/tv" || path === "/tv/") req.url = "/tv/index.html";
  else if (path === "/mobile" || path === "/mobile/") req.url = "/mobile/index.html";
  else if (path === "/desktop" || path === "/desktop/") req.url = "/desktop/index.html";

  serveStatic(req, res);
});

// Universal Broadcast WebSocket Relay
const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false });
let currentCall = null;

function broadcast(data) {
  const payload = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(payload);
    }
  }
}

server.on("upgrade", (req, socket, head) => {
  let pathname;
  try {
    pathname = new URL(req.url, "http://localhost").pathname;
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
  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });

  // On initial connection, send current announcement state
  ws.send(JSON.stringify({
    type: "state",
    cause: "sync",
    announcement: currentCall,
    onlineCount: wss.clients.size
  }));

  // Notify everyone of updated connection count
  broadcast({ type: "presence", onlineCount: wss.clients.size });

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    // Call Command: Dispatched from mobile or desktop doctor keypad
    if (msg.type === "call" && msg.number) {
      currentCall = {
        number: String(msg.number).trim(),
        sentAt: Date.now()
      };

      // Universal Broadcast to all connected clients (TV, Mobile, Desktop)
      broadcast({
        type: "state",
        cause: "call",
        announcement: currentCall,
        onlineCount: wss.clients.size
      });
    }
  });

  ws.on("close", () => {
    broadcast({ type: "presence", onlineCount: wss.clients.size });
  });
});

// 25s Ping-Pong Heartbeat for long-lived Foxsky TV and phone connections
const heartbeat = setInterval(() => {
  for (const client of wss.clients) {
    if (client.isAlive === false) {
      client.terminate();
      continue;
    }
    client.isAlive = false;
    if (client.readyState === 1) client.ping();
  }
}, 25000);

wss.on("close", () => clearInterval(heartbeat));

server.listen(PORT, "0.0.0.0", () => {
  console.log(`CareCall V1 Server listening on http://0.0.0.0:${PORT}`);
});
