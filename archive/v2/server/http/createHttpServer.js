import http from "node:http";
import { serveStaticFile } from "./serveStaticFile.js";

export function createHttpServer() {
    return http.createServer(serveStaticFile);
}
