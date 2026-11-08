import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import { handleConnection } from "./ws/handleConnection.js";
import { createV3State, handleV3Connection } from "./ws/handleV3Connection.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const HOST = process.env.HOST?.trim() || "127.0.0.1";
const PORT = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    console.error("PORT must be an integer between 1 and 65535.");
    process.exit(1);
}

const urlHost = HOST.includes(":") && !HOST.startsWith("[") ? `[${HOST}]` : HOST;
const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml"
};

const routes = {
    "/": "v2/doctor.html",
    "/doctor": "v2/doctor.html",
    "/doctor.html": "v2/doctor.html",
    "/display": "v2/display.html",
    "/display.html": "v2/display.html",
    "/reception": "v2/reception.html",
    "/reception.html": "v2/reception.html",
    "/v1": "v1/doctor.html",
    "/v1/": "v1/doctor.html",
    "/v1/doctor": "v1/doctor.html",
    "/v1/doctor.html": "v1/doctor.html",
    "/v1/display": "v1/display.html",
    "/v1/display.html": "v1/display.html",
    "/v1/reception": "v1/reception.html",
    "/v1/reception.html": "v1/reception.html",
    "/v2": "v2/doctor.html",
    "/v2/": "v2/doctor.html",
    "/v2/doctor": "v2/doctor.html",
    "/v2/doctor.html": "v2/doctor.html",
    "/v2/display": "v2/display.html",
    "/v2/display.html": "v2/display.html",
    "/v2/reception": "v2/reception.html",
    "/v2/reception.html": "v2/reception.html",
    "/v3": "v3/doctor.html",
    "/v3/": "v3/doctor.html",
    "/v3/doctor": "v3/doctor.html",
    "/v3/doctor.html": "v3/doctor.html",
    "/v3/display": "v3/display.html",
    "/v3/display.html": "v3/display.html"
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
const v3State = createV3State();

wss.on("connection", (ws, request) => {
    const role = new URL(request.url, "http://localhost").searchParams.get("role");
    if (role === "doctor-v3" || role === "display-v3") {
        handleV3Connection({ ws, role, state: v3State });
        return;
    }
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

server.listen(PORT, HOST, () => {
    console.log(`Appointment notifier listening on ${HOST}:${PORT}`);
    console.log(`Doctor:    http://${urlHost}:${PORT}/doctor`);
    console.log(`Display:   http://${urlHost}:${PORT}/display`);
    console.log(`Reception: http://${urlHost}:${PORT}/reception`);
    console.log(`V3 Doctor: http://${urlHost}:${PORT}/v3/doctor`);
    console.log(`V3 Display: http://${urlHost}:${PORT}/v3/display`);
});
