import { WebSocketServer } from "ws";
import { handleConnection } from "./handleConnection.js";
import { createV3State, handleV3Connection } from "./handleV3Connection.js";

export function attachWebSocketServer(server) {
    const webSocketServer = new WebSocketServer({ noServer: true });
    const channels = {
        display: new Set(),
        reception: new Set()
    };
    const v3State = createV3State();

    webSocketServer.on("connection", (ws, request) => {
        const role = new URL(request.url, "http://localhost").searchParams.get("role");

        if (role === "doctor-v3" || role === "display-v3") {
            handleV3Connection({ ws, role, state: v3State });
            return;
        }

        handleConnection({ ws, role, channels });
    });

    server.on("upgrade", (request, socket, head) => {
        const pathname = new URL(request.url, "http://localhost").pathname;

        if (pathname !== "/ws") {
            socket.destroy();
            return;
        }

        webSocketServer.handleUpgrade(request, socket, head, (ws) => {
            webSocketServer.emit("connection", ws, request);
        });
    });

    return webSocketServer;
}
