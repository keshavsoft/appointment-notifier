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
    const v4State = createV3State();
    const v5State = createV3State();
    const versionedRoles = new Map([
        ["doctor-v3", { role: "doctor-v3", state: v3State }],
        ["display-v3", { role: "display-v3", state: v3State }],
        ["doctor-v4", { role: "doctor-v3", state: v4State }],
        ["display-v4", { role: "display-v3", state: v4State }],
        ["doctor-v5", { role: "doctor-v3", state: v5State }],
        ["display-v5", { role: "display-v3", state: v5State }]
    ]);

    webSocketServer.on("connection", (ws, request) => {
        const role = new URL(request.url, "http://localhost").searchParams.get("role");
        const versionedConnection = versionedRoles.get(role);

        if (versionedConnection) {
            handleV3Connection({
                ws,
                role: versionedConnection.role,
                state: versionedConnection.state
            });
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
