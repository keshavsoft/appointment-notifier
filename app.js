import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import { handleConnection } from "./ws/handleConnection.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml"
};

const routes = {
    "/": "doctor.html",
    "/doctor": "doctor.html",
    "/doctor.html": "doctor.html",
    "/display": "display.html",
    "/display.html": "display.html",
    "/reception": "reception.html",
    "/reception.html": "reception.html"
};

const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
    const relativePath = routes[pathname] || pathname.replace(/^\/+/, "");
    const filePath = path.resolve(publicDir, relativePath);

    if (!filePath.startsWith(publicDir + path.sep) && filePath !== path.join(publicDir, "doctor.html")) {
        res.writeHead(403);
        return res.end("Forbidden");
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            return res.end("Not found");
        }
        res.writeHead(200, {
            "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "no-store"
        });
        res.end(content);
    });
});

const wss = new WebSocketServer({ noServer: true });
const channels = {
    display: new Set(),
    reception: new Set()
};

wss.on("connection", (ws, request) => {
    const role = new URL(request.url, "http://localhost").searchParams.get("role");
    handleConnection({ ws, role, channels });
});

server.on("upgrade", (req, socket, head) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (pathname !== "/ws") {
        socket.destroy();
        return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Appointment notifier running on http://localhost:${PORT}`);
    console.log(`Doctor:    http://localhost:${PORT}/doctor`);
    console.log(`Display:   http://localhost:${PORT}/display`);
    console.log(`Reception: http://localhost:${PORT}/reception`);
});
