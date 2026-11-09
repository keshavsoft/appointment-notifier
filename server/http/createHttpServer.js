import http from "node:http";
import { fileURLToPath } from "node:url";
import sirv from "sirv";
import { rewritePageUrl } from "./pageRoutes.js";

const publicDirectory = fileURLToPath(new URL("../../public/", import.meta.url));
const servePublicFiles = sirv(publicDirectory, {
    extensions: ["html"],
    setHeaders(response) {
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Cache-Control", "no-store");
    }
});

export function createHttpServer() {
    return http.createServer((request, response) => {
        request.url = rewritePageUrl(request.url ?? "/");
        servePublicFiles(request, response);
    });
}
