import { WebSocketServer } from "ws";
import { handleConnection } from "./handleConnection.js";
import { createV3State, handleV3Connection } from "./handleV3Connection.js";
import { writeWsLog } from "./log.js";

export function attachWebSocketServer(server) {
    const webSocketServer = new WebSocketServer({ noServer: true });
    const channels = {
        display: new Set(),
        reception: new Set()
    };
    const v3State = createV3State();
    const v4State = createV3State();
    const v5State = createV3State();
    const v12State = createV3State();
    const versionedRoles = new Map([
        ["doctor-v3", { role: "doctor-v3", state: v3State }],
        ["display-v3", { role: "display-v3", state: v3State }],
        ["doctor-v4", { role: "doctor-v3", state: v4State }],
        ["display-v4", { role: "display-v3", state: v4State }],
        ["doctor-v5", { role: "doctor-v3", state: v5State }],
        ["display-v5", { role: "display-v3", state: v5State }],
        ["doctor-v12", { role: "doctor-v3", state: v12State }],
        ["display-v12", { role: "display-v3", state: v12State }]
    ]);

    server.on("upgrade", (request, socket, head) => {
        const parsedUrl = new URL(request.url, "http://localhost");
        const pathname = parsedUrl.pathname;
        const requestedRole = parsedUrl.searchParams.get("role");
        const connectionId = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
        request.careCallConnectionId = connectionId;
        writeWsLog("upgrade-request", {
            connectionId,
            pathname,
            requestedRole,
            remoteAddress: request.socket.remoteAddress || null,
            remotePort: request.socket.remotePort || null,
            userAgent: request.headers["user-agent"] || null,
            origin: request.headers.origin || null,
            forwardedFor: request.headers["x-forwarded-for"] || null
        });

        if (pathname !== "/ws") {
            writeWsLog("upgrade-rejected", { connectionId, pathname, reason: "Unexpected WebSocket path" });
            socket.destroy();
            return;
        }

        webSocketServer.handleUpgrade(request, socket, head, (ws) => {
            webSocketServer.emit("connection", ws, request);
        });
    });

    webSocketServer.on("connection", (ws, request) => {
        const requestedRole = new URL(request.url, "http://localhost").searchParams.get("role");
        const connectionId = request.careCallConnectionId || `unknown-${Date.now()}`;
        ws.careCallConnectionId = connectionId;
        const versionedConnection = versionedRoles.get(requestedRole);

        writeWsLog("websocket-open", {
            connectionId,
            requestedRole,
            mappedRole: versionedConnection ? versionedConnection.role : requestedRole,
            remoteAddress: request.socket.remoteAddress || null,
            userAgent: request.headers["user-agent"] || null,
            origin: request.headers.origin || null
        });

        ws.on("error", (error) => writeWsLog("websocket-error", {
            connectionId,
            requestedRole,
            message: error.message,
            code: error.code || null
        }));

        if (versionedConnection) {
            handleV3Connection({
                ws,
                role: versionedConnection.role,
                state: versionedConnection.state,
                requestedRole,
                connectionId,
                log: writeWsLog
            });
            return;
        }

        handleConnection({ ws, role: requestedRole, channels });
    });

    webSocketServer.on("close", () => writeWsLog("websocket-server-close"));
    return webSocketServer;
}
