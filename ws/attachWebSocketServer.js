import { WebSocketServer } from "ws";
import { handleConnection } from "./handleConnection.js";
import { createV3State, handleV3Connection } from "./handleV3Connection.js";
import { writeWsLog } from "./log.js";

const VERSIONED_ROLE_NAMES = ["v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10", "v11", "v12", "v13", "v14"];

export function attachWebSocketServer(server) {
    const webSocketServer = new WebSocketServer({ noServer: true, perMessageDeflate: false });
    const channels = { display: new Set(), reception: new Set() };

    // One shared state for every versioned doctor/display client.
    // A V14 doctor can therefore communicate with a V14 display, and vice versa.
    const sharedState = createV3State();
    const versionedRoles = new Map();

    for (const version of VERSIONED_ROLE_NAMES) {
        versionedRoles.set(`doctor-${version}`, { role: "doctor-v3", state: sharedState });
        versionedRoles.set(`display-${version}`, { role: "display-v3", state: sharedState });
    }

    function resolveVersionedConnection(requestedRole) {
        if (!requestedRole) return null;
        if (versionedRoles.has(requestedRole)) {
            return versionedRoles.get(requestedRole);
        }
        const match = requestedRole.match(/^(doctor|display)-(v\d+)$/);
        if (match) {
            const roleConfig = {
                role: `${match[1] === "display" ? "display" : "doctor"}-v3`,
                state: sharedState
            };
            versionedRoles.set(requestedRole, roleConfig);
            return roleConfig;
        }
        return null;
    }

    server.on("upgrade", (request, socket, head) => {
        let parsedUrl;
        try {
            parsedUrl = new URL(request.url, "http://localhost");
        } catch (error) {
            writeWsLog("upgrade-rejected", { reason: "Invalid request URL", message: error.message });
            socket.destroy();
            return;
        }

        const pathname = parsedUrl.pathname;
        const requestedRole = parsedUrl.searchParams.get("role");
        const connectionId = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
        request.careCallConnectionId = connectionId;
        request.careCallRequestedRole = requestedRole;

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
            writeWsLog("upgrade-rejected", { connectionId, pathname, requestedRole, reason: "Unexpected WebSocket path" });
            socket.destroy();
            return;
        }

        if (!requestedRole) {
            writeWsLog("upgrade-rejected", { connectionId, pathname, reason: "Missing role" });
            socket.destroy();
            return;
        }

        webSocketServer.handleUpgrade(request, socket, head, (ws) => {
            webSocketServer.emit("connection", ws, request);
        });
    });

    webSocketServer.on("connection", (ws, request) => {
        const requestedRole = request.careCallRequestedRole;
        const connectionId = request.careCallConnectionId || `unknown-${Date.now()}`;
        const versionedConnection = resolveVersionedConnection(requestedRole);
        ws.careCallConnectionId = connectionId;

        writeWsLog("websocket-open", {
            connectionId,
            requestedRole,
            mappedRole: versionedConnection ? versionedConnection.role : requestedRole,
            sharedState: Boolean(versionedConnection),
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

    // WebSocket ping/pong keeps long-lived TV connections observable and alive.
    const heartbeat = setInterval(() => {
        for (const client of webSocketServer.clients) {
            if (client.isAlive === false) {
                writeWsLog("heartbeat-timeout", { connectionId: client.careCallConnectionId || null });
                client.terminate();
                continue;
            }
            client.isAlive = false;
            if (client.readyState === 1) client.ping();
        }
    }, 25000);

    webSocketServer.on("connection", (ws) => {
        ws.isAlive = true;
        ws.on("pong", () => { ws.isAlive = true; });
        ws.on("close", (code, reason) => writeWsLog("websocket-close", {
            connectionId: ws.careCallConnectionId || null,
            closeCode: code,
            closeReason: reason ? reason.toString() : ""
        }));
    });

    webSocketServer.on("close", () => {
        clearInterval(heartbeat);
        writeWsLog("websocket-server-close");
    });

    return webSocketServer;
}
