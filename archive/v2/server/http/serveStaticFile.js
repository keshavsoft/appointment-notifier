import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePublicPath } from "./pageRoutes.js";

const publicDirectory = path.resolve(fileURLToPath(new URL("../../public/", import.meta.url)));

const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml"
};

function sendNotFound(res) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
}

export function serveStaticFile(req, res) {
    const pathname = new URL(req.url, "http://localhost").pathname;
    const relativePath = resolvePublicPath(pathname);
    const filePath = path.resolve(publicDirectory, relativePath);

    if (!filePath.startsWith(publicDirectory + path.sep)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            sendNotFound(res);
            return;
        }

        res.writeHead(200, {
            "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "no-store"
        });
        res.end(content);
    });
}
