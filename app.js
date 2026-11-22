import http from "node:http";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import sirv from "sirv";
import { attachWebSocketServer } from "./ws/attachWebSocketServer.js";

if (fs.existsSync(".env")) {
  process.loadEnvFile();
}

const PORT = Number(process.env.PORT) || 3001;
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
  const host = req.headers.host || "127.0.0.1";
  const proto = req.headers["x-forwarded-proto"] || "http";
  let path = "/";
  try {
    path = new URL(req.url, `${proto}://${host}`).pathname;
  } catch {
    path = req.url || "/";
  }

  if (path === "/dr" || path === "/dr/") req.url = "/dr/index.html";
  else if (path === "/display" || path === "/display/") req.url = "/display/index.html";
  else if (path === "/mobile/v1" || path === "/mobile/v1/") req.url = "/mobile/v1/index.html";
  else if (path === "/mobile/v2" || path === "/mobile/v2/") req.url = "/mobile/v2/index.html";
  else if (path === "/mobile/v3" || path === "/mobile/v3/") req.url = "/mobile/v3/index.html";
  else if (path === "/mobile" || path === "/mobile/") req.url = "/mobile/index.html";

  serveStatic(req, res);
});

attachWebSocketServer(server);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`CareCall (Single Broadcast) listening on http://0.0.0.0:${PORT}`);
});
